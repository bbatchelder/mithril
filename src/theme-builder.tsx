"use client";

/**
 * Theme Builder — a live editor for the design-system seed colors, with named themes.
 *
 * mithril's whole theme derives at runtime from a small set of SEED custom properties
 * declared in `src/styles/tokens.css` (`@theme {}`): 4 intents (each with rest + hover /
 * active / disabled / foreground) and a 15-step neutral gray ramp. Every semantic token
 * (background, surface, border, ring, shadow, link, …) is computed from those seeds via
 * `oklch(from var(--seed) …)` / `color-mix()`. So overriding a seed re-tints the entire
 * library — in BOTH light and dark, because seeds are mode-independent and the `.dark`
 * derivations reference the same seed vars.
 *
 * We apply edits as inline styles on `document.documentElement` (the `:root`). That is the
 * one element where the override works: the semantic tokens are declared on `:root`/`.dark`
 * and re-resolve against seeds *on the same element*, and portaled overlays (rendered at
 * <body>) inherit it. An inline style also out-specifies the attribute-based `[data-theme]`
 * palette, so the builder composes cleanly on top of the active palette.
 *
 * A **theme** is just an override map (a diff from the Blueprint defaults). Several are built in —
 * "Blueprint" (the defaults, an empty map) plus brand/aesthetic re-tints (Anthropic, Purple,
 * Lagoon, …) mirrored from tokens.css. The user can load one, edit it, and **Save a copy** under
 * a new name; saved themes live in localStorage and appear in the picker.
 *
 * Intent variants (hover/active/disabled/foreground) are auto-derived from the base color
 * (OKLCH lightness offsets + a contrast-picked foreground) so the user edits one swatch per
 * intent, but each derived value is exposed under "Advanced" for fine-tuning. We compute the
 * derived values to concrete hex with `culori` so what you preview is exactly what you
 * export — one value, one source of truth, no live/export drift.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { clampChroma, converter, formatHex, parse } from "culori";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Collapse } from "@/components/ui/collapse";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Slider } from "@/components/ui/slider";
import { HTMLSelect } from "@/components/ui/html-select";
import { InputGroup } from "@/components/ui/input-group";
import { useAppChrome, type ThemeMode } from "@/lib/app-chrome";

const WORKING_KEY = "mithril:theme-builder";
const CUSTOM_KEY = "mithril:theme-builder:custom";

// ─── Seed metadata (defaults mirror tokens.css `@theme {}`) ──────────────────

type IntentKey = "primary" | "success" | "warning" | "danger";

const VARIANT_SUFFIXES = ["-hover", "-active", "-disabled", "-foreground"] as const;
const VARIANT_LABELS: Record<(typeof VARIANT_SUFFIXES)[number], string> = {
    "-hover": "Hover",
    "-active": "Active",
    "-disabled": "Disabled",
    "-foreground": "Foreground",
};

const INTENTS: { key: IntentKey; label: string }[] = [
    { key: "primary", label: "Primary" },
    { key: "success", label: "Success" },
    { key: "warning", label: "Warning" },
    { key: "danger", label: "Danger" },
];

const NEUTRAL_GROUPS: { label: string; props: string[] }[] = [
    // White/black are the extremes the light-mode surfaces, app background, and body text
    // derive from (e.g. Card's light bg = --surface = var(--color-white)).
    { label: "Black & white", props: ["--color-white", "--color-black"] },
    { label: "Dark grays", props: [1, 2, 3, 4, 5].map((n) => `--color-dark-gray-${n}`) },
    { label: "Mid grays", props: [1, 2, 3, 4, 5].map((n) => `--color-gray-${n}`) },
    { label: "Light grays", props: [1, 2, 3, 4, 5].map((n) => `--color-light-gray-${n}`) },
];

/** Default OKLCH-lightness crossover: fills lighter than this get dark text, else white. */
const DEFAULT_FG_THRESHOLD = 0.62;

/** Default seed values, byte-for-byte from tokens.css. Used as the swatch baseline. */
const DEFAULTS: Record<string, string> = {
    // Intents
    "--color-primary": "#2d72d2",
    "--color-primary-hover": "#215db0",
    "--color-primary-active": "#184a90",
    "--color-primary-disabled": "#4c90f0",
    "--color-primary-foreground": "#ffffff",
    "--color-success": "#238551",
    "--color-success-hover": "#1c6e42",
    "--color-success-active": "#165a36",
    "--color-success-disabled": "#32a467",
    "--color-success-foreground": "#ffffff",
    "--color-warning": "#c87619",
    "--color-warning-hover": "#935610",
    "--color-warning-active": "#77450d",
    "--color-warning-disabled": "#ec9a3c",
    "--color-warning-foreground": "#111418",
    "--color-danger": "#cd4246",
    "--color-danger-hover": "#ac2f33",
    "--color-danger-active": "#8e292c",
    "--color-danger-disabled": "#e76a6e",
    "--color-danger-foreground": "#ffffff",
    // Black & white (the extremes light-mode surfaces / body text derive from)
    "--color-white": "#ffffff",
    "--color-black": "#111418",
    // Neutral ramp
    "--color-dark-gray-1": "#1c2127",
    "--color-dark-gray-2": "#252a31",
    "--color-dark-gray-3": "#2f343c",
    "--color-dark-gray-4": "#383e47",
    "--color-dark-gray-5": "#404854",
    "--color-gray-1": "#5f6b7c",
    "--color-gray-2": "#738091",
    "--color-gray-3": "#8f99a8",
    "--color-gray-4": "#abb3bf",
    "--color-gray-5": "#c5cbd3",
    "--color-light-gray-1": "#d3d8de",
    "--color-light-gray-2": "#dce0e5",
    "--color-light-gray-3": "#e5e8eb",
    "--color-light-gray-4": "#edeff2",
    "--color-light-gray-5": "#f6f7f9",
};

/** Canonical emit order for export (intents grouped, then the ramp). */
const SEED_ORDER: string[] = [
    ...INTENTS.flatMap(({ key }) => [
        `--color-${key}`,
        ...VARIANT_SUFFIXES.map((s) => `--color-${key}${s}`),
    ]),
    ...NEUTRAL_GROUPS.flatMap((g) => g.props),
];
const SEED_SET = new Set(SEED_ORDER);

// ─── Built-in themes (override maps = diff from Blueprint defaults) ───────────

type Overrides = Record<string, string>;

/** Anthropic: warm terracotta primary on a cream/clay neutral base. Mirrors tokens.css. */
const ANTHROPIC: Overrides = {
    "--color-primary": "#db7759",
    "--color-primary-hover": "#c76547",
    "--color-primary-active": "#b25235",
    "--color-primary-disabled": "#fe9677",
    "--color-primary-foreground": "#ffffff",
    "--color-success": "#a3d6c1",
    "--color-success-hover": "#90c3ae",
    "--color-success-active": "#7eb09b",
    "--color-success-disabled": "#c3f7e1",
    "--color-success-foreground": "#593025",
    "--color-danger": "#c46686",
    "--color-danger-hover": "#b05474",
    "--color-danger-active": "#9c4263",
    "--color-danger-disabled": "#e684a4",
    "--color-danger-foreground": "#ffffff",
    "--color-white": "#f5f4ec",
    "--color-black": "#000000",
    "--color-light-gray-5": "#f0eee9",
};

/** Lagoon: cool teal primary + clean status colors on a faintly-cooled neutral base.
 * White text on the teal primary and the bright green success. Mirrors tokens.css. */
const LAGOON: Overrides = {
    "--color-primary": "#0d9488",
    "--color-primary-hover": "#008076",
    "--color-primary-active": "#006d64",
    "--color-primary-disabled": "#41b3a7",
    "--color-primary-foreground": "#ffffff",
    "--color-success": "#16a34a",
    "--color-success-hover": "#008f3d",
    "--color-success-active": "#007a33",
    "--color-success-disabled": "#46c368",
    "--color-success-foreground": "#ffffff",
    "--color-warning": "#d97706",
    "--color-warning-hover": "#c06800",
    "--color-warning-active": "#a75900",
    "--color-warning-disabled": "#fc973c",
    "--color-warning-foreground": "#111418",
    "--color-danger": "#dc2626",
    "--color-danger-hover": "#c50012",
    "--color-danger-active": "#a7000d",
    "--color-danger-disabled": "#ff5249",
    "--color-danger-foreground": "#ffffff",
    "--color-light-gray-5": "#eef4f4",
};

/** Indigo: crisp cool indigo primary, emerald success, rose-tinted danger, cool neutrals. */
const INDIGO: Overrides = {
    "--color-primary": "#4f46e5",
    "--color-primary-hover": "#422fd0",
    "--color-primary-active": "#3611bb",
    "--color-primary-disabled": "#696cff",
    "--color-primary-foreground": "#ffffff",
    "--color-success": "#059669",
    "--color-success-hover": "#00825a",
    "--color-success-active": "#006e4c",
    "--color-success-disabled": "#3eb687",
    "--color-success-foreground": "#ffffff",
    "--color-warning": "#d97706",
    "--color-warning-hover": "#c06800",
    "--color-warning-active": "#a75900",
    "--color-warning-disabled": "#fc973c",
    "--color-warning-foreground": "#111418",
    "--color-danger": "#e11d48",
    "--color-danger-hover": "#c7003a",
    "--color-danger-active": "#a90030",
    "--color-danger-disabled": "#ff5569",
    "--color-danger-foreground": "#ffffff",
    "--color-light-gray-5": "#f3f4f9",
};

/** Forest: earthy olive/moss primary over a warm parchment base (cream white, warm-brown black).
 * White text on the moss primary and the green success. Mirrors tokens.css. */
const FOREST: Overrides = {
    "--color-primary": "#4d7c0f",
    "--color-primary-hover": "#3f6900",
    "--color-primary-active": "#335700",
    "--color-primary-disabled": "#6a9b37",
    "--color-primary-foreground": "#f8f7f2",
    "--color-success": "#16a34a",
    "--color-success-hover": "#008f3d",
    "--color-success-active": "#007a33",
    "--color-success-disabled": "#46c368",
    "--color-success-foreground": "#f8f7f2",
    "--color-warning": "#ca8a04",
    "--color-warning-hover": "#b37900",
    "--color-warning-active": "#9c6900",
    "--color-warning-disabled": "#eba93d",
    "--color-warning-foreground": "#1a1a17",
    "--color-danger": "#b91c1c",
    "--color-danger-hover": "#a1000b",
    "--color-danger-active": "#840007",
    "--color-danger-disabled": "#dd443c",
    "--color-danger-foreground": "#f8f7f2",
    "--color-white": "#f8f7f2",
    "--color-black": "#1a1a17",
    "--color-light-gray-4": "#e8e5da",
    "--color-light-gray-5": "#f1efe7",
};

/** Ember: punchy orange primary over a warm cream base. Yellow warning keeps its accessible
 * dark text; white text on the orange primary and the green success. Mirrors tokens.css. */
const EMBER: Overrides = {
    "--color-primary": "#ea580c",
    "--color-primary-hover": "#cf4b00",
    "--color-primary-active": "#b33f00",
    "--color-primary-disabled": "#ff8657",
    "--color-primary-foreground": "#faf8f4",
    "--color-success": "#16a34a",
    "--color-success-hover": "#008f3d",
    "--color-success-active": "#007a33",
    "--color-success-disabled": "#46c368",
    "--color-success-foreground": "#faf8f4",
    "--color-warning": "#eab308",
    "--color-warning-hover": "#d3a100",
    "--color-warning-active": "#bc8f00",
    "--color-warning-disabled": "#ffd77e",
    "--color-warning-foreground": "#1c1917",
    "--color-danger": "#dc2626",
    "--color-danger-hover": "#c50012",
    "--color-danger-active": "#a7000d",
    "--color-danger-disabled": "#ff5249",
    "--color-danger-foreground": "#faf8f4",
    "--color-white": "#faf8f4",
    "--color-black": "#1c1917",
    "--color-light-gray-4": "#eae4da",
    "--color-light-gray-5": "#f4f0ea",
};

/** Purple: a vivid violet primary paired with a vivid green and orange/brick-red status colors
 * over a faintly lavender-cool neutral base. White text on primary/success/danger; dark text on
 * the orange warning (white fails contrast there). Mirrors tokens.css. */
const PURPLE: Overrides = {
    "--color-primary": "#5b08b2",
    "--color-primary-hover": "#490092",
    "--color-primary-active": "#370070",
    "--color-primary-disabled": "#7639d4",
    "--color-primary-foreground": "#ffffff",
    "--color-success": "#00a75e",
    "--color-success-hover": "#009251",
    "--color-success-active": "#007e45",
    "--color-success-disabled": "#40c77c",
    "--color-success-foreground": "#ffffff",
    "--color-warning": "#eb7425",
    "--color-warning-hover": "#d66100",
    "--color-warning-active": "#bb5400",
    "--color-warning-disabled": "#ff9e68",
    "--color-warning-foreground": "#111418",
    "--color-danger": "#c73c3c",
    "--color-danger-hover": "#b2262b",
    "--color-danger-active": "#9d0519",
    "--color-danger-disabled": "#ea5d59",
    "--color-danger-foreground": "#ffffff",
    "--color-light-gray-4": "#e6e6ee",
    "--color-light-gray-5": "#efeff4",
};

const BUILTIN_THEMES: Record<string, Overrides> = {
    Blueprint: {}, // pure defaults
    Anthropic: ANTHROPIC,
    Purple: PURPLE,
    Lagoon: LAGOON,
    Indigo: INDIGO,
    Forest: FOREST,
    Ember: EMBER,
};
const BUILTIN_NAMES = ["Blueprint", "Anthropic", "Purple", "Lagoon", "Indigo", "Forest", "Ember"];
const BUILTIN_SET = new Set(BUILTIN_NAMES);

// ─── Color math (culori) ─────────────────────────────────────────────────────

const toOklch = converter("oklch");

/**
 * Parse a loose color string (hex with/without `#`, or any CSS color) to a normalized
 * `#rrggbb`. Returns null if it isn't a valid color — callers revert to the prior value.
 */
function normalizeHex(input: string): string | null {
    const t = input.trim();
    if (!t) return null;
    const c = parse(/^[0-9a-fA-F]{3,8}$/.test(t) ? `#${t}` : t);
    return c ? (formatHex(c) ?? null) : null;
}

/** Shift a hex color's OKLCH lightness by `dl`, gamut-clamp, return hex. */
function shiftLightness(hex: string, dl: number): string {
    const c = toOklch(hex);
    if (!c) return hex;
    const shifted = clampChroma({ ...c, l: Math.max(0, Math.min(1, c.l + dl)) }, "oklch");
    return formatHex(shifted) ?? hex;
}

/**
 * Choose the on-fill text color by the fill's OKLCH lightness: fills at/above `threshold`
 * get the dark seed, lighter… er, darker ones get white. Returns the actual black/white seed
 * values so customizing those re-tints derived foregrounds too.
 */
function pickForeground(hex: string, threshold: number, blackHex: string, whiteHex: string): string {
    const c = toOklch(hex);
    if (!c) return whiteHex;
    return c.l >= threshold ? blackHex : whiteHex;
}

/**
 * Derive an intent's variants from its base color. The lightness offsets approximate
 * Blueprint's family tiers (hover ≈ one tier darker, active ≈ two, disabled ≈ one lighter);
 * they are exposed as editable so a fidelity-minded user can fine-tune. The foreground flips
 * dark/light at `threshold`.
 */
function deriveVariants(
    base: string,
    threshold: number,
    blackHex: string,
    whiteHex: string,
): Record<string, string> {
    return {
        "-hover": shiftLightness(base, -0.06),
        "-active": shiftLightness(base, -0.12),
        "-disabled": shiftLightness(base, 0.1),
        "-foreground": pickForeground(base, threshold, blackHex, whiteHex),
    };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function shallowEqual(a: Overrides, b: Overrides): boolean {
    const ak = Object.keys(a);
    const bk = Object.keys(b);
    if (ak.length !== bk.length) return false;
    return ak.every((k) => a[k] === b[k]);
}

/** Keep only known seed props with string values. */
function sanitize(raw: unknown): Overrides {
    if (!raw || typeof raw !== "object") return {};
    const out: Overrides = {};
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
        if (SEED_SET.has(k) && typeof v === "string") out[k] = v;
    }
    return out;
}

/** A CSS-attribute-safe slug for the exported `[data-theme="…"]` selector. */
function slugify(name: string): string {
    const s = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return s || "custom";
}

function loadCustomThemes(): Record<string, Overrides> {
    if (typeof window === "undefined") return {};
    try {
        const parsed = JSON.parse(window.localStorage.getItem(CUSTOM_KEY) || "{}") as unknown;
        if (!parsed || typeof parsed !== "object") return {};
        const out: Record<string, Overrides> = {};
        for (const [name, map] of Object.entries(parsed as Record<string, unknown>)) {
            if (!BUILTIN_SET.has(name)) out[name] = sanitize(map);
        }
        return out;
    } catch {
        return {};
    }
}

function loadWorking(): { name: string; overrides: Overrides; fgThreshold: number } {
    const fallback = { name: "Blueprint", overrides: {}, fgThreshold: DEFAULT_FG_THRESHOLD };
    if (typeof window === "undefined") return fallback;
    try {
        const parsed = JSON.parse(window.localStorage.getItem(WORKING_KEY) || "null") as unknown;
        if (parsed && typeof parsed === "object" && "overrides" in parsed) {
            const p = parsed as { name?: unknown; overrides?: unknown; fgThreshold?: unknown };
            return {
                name: typeof p.name === "string" ? p.name : "Blueprint",
                overrides: sanitize(p.overrides),
                fgThreshold: typeof p.fgThreshold === "number" ? p.fgThreshold : DEFAULT_FG_THRESHOLD,
            };
        }
        // Migrate the previous shape (a bare overrides map) → a Blueprint-based edit.
        return { ...fallback, overrides: sanitize(parsed) };
    } catch {
        return fallback;
    }
}

/** Build the copy-pasteable CSS from the changed seeds. */
function exportThemeCss(overrides: Overrides, selector: string): string {
    const keys = SEED_ORDER.filter((k) => k in overrides);
    if (keys.length === 0) return "/* Matches the Blueprint defaults — nothing to override. */";
    const lines = keys.map((k) => `    ${k}: ${overrides[k]};`);
    return `[data-theme="${selector}"] {\n${lines.join("\n")}\n}`;
}

// ─── Builder state ───────────────────────────────────────────────────────────

/**
 * The builder's state, owned by the showcase (always mounted while on the showcase route)
 * so edits apply even with the panel closed and survive reloads. Applying as inline styles
 * on the document root; the effect's cleanup removes them, so leaving the showcase reverts
 * other apps to their own palette while localStorage keeps the working theme for re-entry.
 */
export interface ThemeBuilderState {
    overrides: Overrides;
    /** Current value for a seed (override if set, else the tokens.css default). */
    valueOf: (prop: string) => string;
    /** Whether the working overrides differ from the loaded theme's saved values. */
    modified: boolean;
    setIntentBase: (key: IntentKey, hex: string) => void;
    setSeed: (prop: string, hex: string) => void;
    /** Merge a batch of seed overrides into the working set (keeps existing ones). */
    mergeSeeds: (map: Overrides) => void;
    /** Replace the working overrides wholesale (like loading a theme definition). */
    applyOverrides: (map: Overrides) => void;
    resetIntent: (key: IntentKey) => void;
    /** OKLCH-lightness crossover for auto text color: fills ≥ this get dark text, else white. */
    fgThreshold: number;
    /** Set the crossover and re-derive the foreground of every customized intent. */
    setFgThreshold: (t: number) => void;
    /** The exportable CSS block. */
    css: string;

    // Named themes
    themeNames: string[];
    selectedName: string;
    isCustom: (name: string) => boolean;
    /** Load a theme (built-in or custom) into the working set. */
    selectTheme: (name: string) => void;
    /** Discard edits, reloading the selected theme's saved values. */
    revert: () => void;
    /** Save the working overrides as a custom theme. Returns an error string on failure. */
    saveAs: (name: string) => string | null;
    /** Save a given override map directly as a custom theme and load it. Returns an error on failure. */
    saveThemeFrom: (name: string, map: Overrides) => string | null;
    /** Delete a custom theme (built-ins are protected). */
    deleteTheme: (name: string) => void;
}

export function useThemeBuilder(): ThemeBuilderState {
    const [customThemes, setCustomThemes] = useState<Record<string, Overrides>>(loadCustomThemes);
    const [selectedName, setSelectedName] = useState<string>(() => loadWorking().name);
    const [overrides, setOverrides] = useState<Overrides>(() => loadWorking().overrides);
    const [fgThreshold, setFgThresholdState] = useState<number>(() => loadWorking().fgThreshold);
    // The selected theme's saved definition — the baseline for the "modified" indicator.
    const [baseline, setBaseline] = useState<Overrides>(() => {
        const w = loadWorking();
        return BUILTIN_THEMES[w.name] ?? loadCustomThemes()[w.name] ?? {};
    });

    // Apply to the document root; cleanup removes exactly the previously-applied keys
    // (so stale keys vanish on change, and all keys vanish when the showcase unmounts).
    useEffect(() => {
        const el = document.documentElement;
        for (const [k, v] of Object.entries(overrides)) el.style.setProperty(k, v);
        return () => {
            for (const k of Object.keys(overrides)) el.style.removeProperty(k);
        };
    }, [overrides]);

    // Persist the working theme (selection + edits) and the custom-theme library.
    useEffect(() => {
        try {
            window.localStorage.setItem(
                WORKING_KEY,
                JSON.stringify({ name: selectedName, overrides, fgThreshold }),
            );
        } catch {
            /* storage unavailable — non-fatal */
        }
    }, [selectedName, overrides, fgThreshold]);
    useEffect(() => {
        try {
            window.localStorage.setItem(CUSTOM_KEY, JSON.stringify(customThemes));
        } catch {
            /* non-fatal */
        }
    }, [customThemes]);

    const valueOf = useCallback(
        (prop: string) => overrides[prop] ?? DEFAULTS[prop] ?? "#000000",
        [overrides],
    );

    const setIntentBase = useCallback(
        (key: IntentKey, hex: string) => {
            setOverrides((o) => {
                const black = o["--color-black"] ?? DEFAULTS["--color-black"];
                const white = o["--color-white"] ?? DEFAULTS["--color-white"];
                const variants = deriveVariants(hex, fgThreshold, black, white);
                return {
                    ...o,
                    [`--color-${key}`]: hex,
                    ...Object.fromEntries(VARIANT_SUFFIXES.map((s) => [`--color-${key}${s}`, variants[s]])),
                };
            });
        },
        [fgThreshold],
    );

    const setFgThreshold = useCallback((t: number) => {
        setFgThresholdState(t);
        // Re-derive the foreground of every *customized* intent (leave default intents alone
        // so the slider doesn't silently add overrides to a pristine theme).
        setOverrides((o) => {
            const black = o["--color-black"] ?? DEFAULTS["--color-black"];
            const white = o["--color-white"] ?? DEFAULTS["--color-white"];
            const next = { ...o };
            for (const { key } of INTENTS) {
                const baseProp = `--color-${key}`;
                if (baseProp in o) {
                    next[`--color-${key}-foreground`] = pickForeground(o[baseProp], t, black, white);
                }
            }
            return next;
        });
    }, []);

    const setSeed = useCallback((prop: string, hex: string) => {
        setOverrides((o) => ({ ...o, [prop]: hex }));
    }, []);

    const mergeSeeds = useCallback((map: Overrides) => {
        setOverrides((o) => ({ ...o, ...sanitize(map) }));
    }, []);

    const applyOverrides = useCallback((map: Overrides) => {
        setOverrides(sanitize(map));
    }, []);

    const resetIntent = useCallback((key: IntentKey) => {
        setOverrides((o) => {
            const next = { ...o };
            delete next[`--color-${key}`];
            for (const s of VARIANT_SUFFIXES) delete next[`--color-${key}${s}`];
            return next;
        });
    }, []);

    const selectTheme = useCallback(
        (name: string) => {
            const map = BUILTIN_THEMES[name] ?? customThemes[name];
            if (!map) return;
            setSelectedName(name);
            setBaseline(map);
            setOverrides({ ...map });
        },
        [customThemes],
    );

    const revert = useCallback(() => setOverrides({ ...baseline }), [baseline]);

    const saveAs = useCallback(
        (rawName: string): string | null => {
            const name = rawName.trim();
            if (!name) return "Enter a name";
            if (BUILTIN_SET.has(name)) return `"${name}" is a built-in name`;
            const snapshot = { ...overrides };
            setCustomThemes((c) => ({ ...c, [name]: snapshot }));
            setSelectedName(name);
            setBaseline(snapshot);
            return null;
        },
        [overrides],
    );

    const saveThemeFrom = useCallback((rawName: string, map: Overrides): string | null => {
        const name = rawName.trim();
        if (!name) return "Enter a name";
        if (BUILTIN_SET.has(name)) return `"${name}" is a built-in name`;
        const snapshot = sanitize(map);
        setCustomThemes((c) => ({ ...c, [name]: snapshot }));
        setSelectedName(name);
        setBaseline(snapshot);
        setOverrides(snapshot);
        return null;
    }, []);

    const deleteTheme = useCallback(
        (name: string) => {
            if (BUILTIN_SET.has(name)) return;
            setCustomThemes((c) => {
                const next = { ...c };
                delete next[name];
                return next;
            });
            if (selectedName === name) {
                setSelectedName("Blueprint");
                setBaseline({});
                setOverrides({});
            }
        },
        [selectedName],
    );

    const themeNames = useMemo(
        () => [...BUILTIN_NAMES, ...Object.keys(customThemes).sort((a, b) => a.localeCompare(b))],
        [customThemes],
    );
    const isCustom = useCallback((name: string) => !BUILTIN_SET.has(name), []);
    const modified = useMemo(() => !shallowEqual(overrides, baseline), [overrides, baseline]);
    const selector = useMemo(
        () => (BUILTIN_SET.has(selectedName) ? "custom" : slugify(selectedName)),
        [selectedName],
    );
    const css = useMemo(() => exportThemeCss(overrides, selector), [overrides, selector]);

    return {
        overrides,
        valueOf,
        modified,
        setIntentBase,
        setSeed,
        mergeSeeds,
        applyOverrides,
        resetIntent,
        fgThreshold,
        setFgThreshold,
        css,
        themeNames,
        selectedName,
        isCustom,
        selectTheme,
        revert,
        saveAs,
        saveThemeFrom,
        deleteTheme,
    };
}

// ─── Agent / programmatic API (window.__mithrilTheme) ─────────────────────────

/**
 * Normalize a seed name to its canonical custom-property form. Accepts `--color-primary`,
 * `color-primary`, or the bare `primary` / `gray-1` shorthand so the API is forgiving.
 */
function normProp(p: string): string {
    if (p.startsWith("--")) return p;
    if (p.startsWith("color-")) return `--${p}`;
    return `--color-${p}`;
}

/** Coerce a loose {prop: value} map to canonical seed props with normalized hex values. */
function normMap(map: Record<string, string>): Overrides {
    const out: Overrides = {};
    for (const [k, v] of Object.entries(map)) {
        const hex = normalizeHex(v);
        if (hex) out[normProp(k)] = hex;
    }
    return out;
}

/** The shape installed at `window.__mithrilTheme`. */
export interface ThemeApi {
    /** Current snapshot: selected theme, mode, override map, fg threshold, export CSS. */
    state: () => {
        theme: string;
        modified: boolean;
        mode: ThemeMode;
        dark: boolean;
        fgThreshold: number;
        overrides: Overrides;
        css: string;
    };
    /** All available theme names (built-ins + saved custom). */
    list: () => string[];
    /** The full default seed map (Blueprint baseline). */
    defaults: () => Overrides;
    /** Current export CSS block. */
    css: () => string;
    /** Set one intent's base color (auto-derives hover/active/disabled/foreground). */
    setIntent: (key: IntentKey, hex: string) => void;
    /** Set one seed (intent variant or neutral). Prop name is forgiving (see normProp). */
    setSeed: (prop: string, hex: string) => void;
    /** Merge a batch of seeds into the working overrides. */
    merge: (map: Record<string, string>) => void;
    /** Replace the working overrides wholesale (a full theme definition). */
    apply: (map: Record<string, string>) => void;
    /** Set the auto-text-color OKLCH-lightness crossover and re-derive foregrounds. */
    setFgThreshold: (t: number) => void;
    /** Reset one intent to its Blueprint default. */
    resetIntent: (key: IntentKey) => void;
    /** Load a named theme into the working set. */
    select: (name: string) => void;
    /** Discard edits back to the loaded theme. */
    revert: () => void;
    /** Save the current working overrides as a named custom theme. */
    save: (name: string) => string | null;
    /** Apply a map and save it as a named custom theme in one step. */
    saveTheme: (name: string, map: Record<string, string>) => string | null;
    /** Delete a custom theme. */
    remove: (name: string) => void;
    /** Set the active app's appearance mode. */
    setMode: (mode: ThemeMode) => void;
    /** Flip between light and dark. */
    toggleDark: () => void;
    /** Open/close the Theme Builder panel. */
    setPanelOpen: (open: boolean) => void;
    /** Log a usage cheatsheet to the console. */
    help: () => void;
}

interface ThemeApiDeps {
    builder: ThemeBuilderState;
    mode: ThemeMode;
    dark: boolean;
    setMode: (m: ThemeMode) => void;
    toggleDark: () => void;
    setPanelOpen: (open: boolean) => void;
}

/**
 * Install a programmatic theme API on `window.__mithrilTheme` for driving the design system
 * from the console or browser automation — set seeds, apply/merge override maps, switch named
 * themes, flip light/dark, and save new themes, all without touching the native color pickers
 * (which open an un-driveable OS dialog). The methods read the latest builder/mode controls via
 * a ref so the single install stays current across renders. Gallery-only; the distributed
 * component source never references this.
 */
export function useThemeApiBridge(deps: ThemeApiDeps): void {
    const ref = useRef(deps);
    ref.current = deps;

    useEffect(() => {
        const api: ThemeApi = {
            state: () => {
                const { builder, mode, dark } = ref.current;
                return {
                    theme: builder.selectedName,
                    modified: builder.modified,
                    mode,
                    dark,
                    fgThreshold: builder.fgThreshold,
                    overrides: builder.overrides,
                    css: builder.css,
                };
            },
            list: () => ref.current.builder.themeNames,
            defaults: () => ({ ...DEFAULTS }),
            css: () => ref.current.builder.css,
            setIntent: (key, hex) => {
                const h = normalizeHex(hex);
                if (h) ref.current.builder.setIntentBase(key, h);
            },
            setSeed: (prop, hex) => {
                const h = normalizeHex(hex);
                if (h) ref.current.builder.setSeed(normProp(prop), h);
            },
            merge: (map) => ref.current.builder.mergeSeeds(normMap(map)),
            apply: (map) => ref.current.builder.applyOverrides(normMap(map)),
            setFgThreshold: (t) => ref.current.builder.setFgThreshold(t),
            resetIntent: (key) => ref.current.builder.resetIntent(key),
            select: (name) => ref.current.builder.selectTheme(name),
            revert: () => ref.current.builder.revert(),
            save: (name) => ref.current.builder.saveAs(name),
            saveTheme: (name, map) => ref.current.builder.saveThemeFrom(name, normMap(map)),
            remove: (name) => ref.current.builder.deleteTheme(name),
            setMode: (mode) => ref.current.setMode(mode),
            toggleDark: () => ref.current.toggleDark(),
            setPanelOpen: (open) => ref.current.setPanelOpen(open),
            help: () => {
                // eslint-disable-next-line no-console
                console.log(
                    [
                        "mithril theme API — window.__mithrilTheme",
                        "  .state()                       current theme/mode/overrides/css",
                        "  .list()                        available theme names",
                        "  .defaults()                    Blueprint default seed map",
                        "  .setIntent(key, hex)           key: primary|success|warning|danger (derives variants)",
                        "  .setSeed(prop, hex)            prop: 'gray-1' | '--color-gray-1' | 'primary-hover'",
                        "  .merge({prop: hex, ...})       merge a batch of seeds",
                        "  .apply({prop: hex, ...})       replace working overrides wholesale",
                        "  .setFgThreshold(t)             auto text-color crossover (0.3–0.9)",
                        "  .resetIntent(key)              reset one intent to default",
                        "  .select(name) / .revert()      load a named theme / discard edits",
                        "  .save(name)                    save current working as a custom theme",
                        "  .saveTheme(name, {map})        apply a map and save it in one step",
                        "  .remove(name)                  delete a custom theme",
                        "  .setMode('system'|'light'|'dark') / .toggleDark()",
                        "  .setPanelOpen(true|false)      open/close the Theme Builder panel",
                    ].join("\n"),
                );
            },
        };
        (window as unknown as { __mithrilTheme: ThemeApi }).__mithrilTheme = api;
        // eslint-disable-next-line no-console
        console.log("mithril theme API ready — window.__mithrilTheme.help()");
        return () => {
            delete (window as unknown as { __mithrilTheme?: ThemeApi }).__mithrilTheme;
        };
    }, []);
}

// ─── UI ──────────────────────────────────────────────────────────────────────

/**
 * An editable hex field. Keeps a local draft while focused so typing isn't clobbered by the
 * live-applied value, commits on Enter/blur (reverting if the text isn't a valid color), and
 * resyncs to the external value when not being edited. Unlike the native color picker this is
 * keyboard- and automation-driveable (you can type/paste a hex straight in).
 */
function HexInput({ value, onCommit, label }: { value: string; onCommit: (hex: string) => void; label: string }) {
    const [draft, setDraft] = useState(value);
    const [focused, setFocused] = useState(false);
    useEffect(() => {
        if (!focused) setDraft(value);
    }, [value, focused]);
    const commit = () => {
        const hex = normalizeHex(draft);
        if (hex) onCommit(hex);
        else setDraft(value);
    };
    return (
        <input
            type="text"
            spellCheck={false}
            autoComplete="off"
            aria-label={`${label} hex`}
            value={draft}
            onFocus={() => setFocused(true)}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
                setFocused(false);
                commit();
            }}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                    commit();
                    e.currentTarget.blur();
                }
                if (e.key === "Escape") {
                    setDraft(value);
                    e.currentTarget.blur();
                }
            }}
            className="w-[72px] shrink-0 rounded-mithril border border-border bg-background px-1.5 py-0.5 text-right font-mono text-body-xs text-foreground-muted focus:border-blue-3 focus:text-foreground focus:outline-none"
        />
    );
}

/** One color swatch row: native color input + label + editable hex field. */
function SwatchRow({
    label,
    value,
    onChange,
    sub,
}: {
    label: string;
    value: string;
    onChange: (hex: string) => void;
    sub?: boolean;
}) {
    return (
        <div className="flex items-center gap-2.5">
            <input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                aria-label={label}
                className="h-7 w-9 shrink-0 cursor-pointer rounded-mithril border border-border bg-transparent p-0.5"
            />
            <span
                className={cn(
                    "flex-1 truncate",
                    sub ? "text-body-xs text-foreground-muted" : "text-body-sm text-foreground",
                )}
            >
                {label}
            </span>
            <HexInput label={label} value={value} onCommit={onChange} />
        </div>
    );
}

/** An intent block: base swatch + a reset + an "Advanced" disclosure of its 4 variants. */
function IntentBlock({ intent, builder }: { intent: { key: IntentKey; label: string }; builder: ThemeBuilderState }) {
    const [advanced, setAdvanced] = useState(false);
    const { key, label } = intent;
    const customized = `--color-${key}` in builder.overrides;
    return (
        <div className="flex flex-col gap-2 rounded-mithril border border-border bg-surface p-3">
            <div className="flex items-center justify-between">
                <span className="text-body-sm font-medium text-foreground">{label}</span>
                {customized && (
                    <Button
                        size="small"
                        variant="minimal"
                        aria-label={`Reset ${label}`}
                        title="Reset to default"
                        icon={<Icon icon="reset" size={14} className="!text-current" />}
                        onClick={() => builder.resetIntent(key)}
                    />
                )}
            </div>
            <SwatchRow
                label="Base"
                value={builder.valueOf(`--color-${key}`)}
                onChange={(hex) => builder.setIntentBase(key, hex)}
            />
            <button
                type="button"
                onClick={() => setAdvanced((a) => !a)}
                aria-expanded={advanced}
                className="flex items-center gap-1 self-start text-body-xs text-foreground-muted hover:text-foreground"
            >
                <Icon icon={advanced ? "chevron-up" : "chevron-down"} size={12} className="!text-current" />
                Advanced ({VARIANT_SUFFIXES.length} derived)
            </button>
            <Collapse isOpen={advanced}>
                <div className="flex flex-col gap-2 pt-1">
                    {VARIANT_SUFFIXES.map((suffix) => (
                        <SwatchRow
                            key={suffix}
                            sub
                            label={VARIANT_LABELS[suffix]}
                            value={builder.valueOf(`--color-${key}${suffix}`)}
                            onChange={(hex) => builder.setSeed(`--color-${key}${suffix}`, hex)}
                        />
                    ))}
                </div>
            </Collapse>
        </div>
    );
}

/** The theme picker row: load a named theme, save a copy, delete a custom theme. */
function ThemePicker({ builder }: { builder: ThemeBuilderState }) {
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState("");
    const [error, setError] = useState<string | null>(null);
    const { selectedName, themeNames, modified } = builder;

    const startSave = () => {
        // Seed the field with a sensible default copy name.
        setName(builder.isCustom(selectedName) ? selectedName : `${selectedName} copy`);
        setError(null);
        setSaving(true);
    };
    const confirmSave = () => {
        const err = builder.saveAs(name);
        if (err) {
            setError(err);
            return;
        }
        setSaving(false);
        setName("");
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
                <HTMLSelect
                    fill
                    value={selectedName}
                    aria-label="Theme"
                    onChange={(e) => builder.selectTheme(e.target.value)}
                    options={themeNames}
                    className="min-w-0 flex-1"
                />
                <Button
                    size="small"
                    variant="minimal"
                    aria-label="Save a copy"
                    title="Save a copy"
                    icon={<Icon icon="floppy-disk" size={16} className="!text-current" />}
                    onClick={startSave}
                />
                {builder.isCustom(selectedName) && (
                    <Button
                        size="small"
                        variant="minimal"
                        intent="danger"
                        aria-label={`Delete ${selectedName}`}
                        title="Delete this theme"
                        icon={<Icon icon="trash" size={16} className="!text-current" />}
                        onClick={() => builder.deleteTheme(selectedName)}
                    />
                )}
            </div>

            {modified && (
                <div className="flex items-center justify-between text-body-xs text-foreground-muted">
                    <span className="italic">Modified — unsaved</span>
                    <button
                        type="button"
                        onClick={builder.revert}
                        className="flex items-center gap-1 hover:text-foreground"
                    >
                        <Icon icon="undo" size={12} className="!text-current" />
                        Revert
                    </button>
                </div>
            )}

            {saving && (
                <div className="flex flex-col gap-1.5 rounded-mithril border border-border bg-surface p-2.5">
                    <InputGroup
                        size="small"
                        autoFocus
                        placeholder="Theme name"
                        value={name}
                        intent={error ? "danger" : "none"}
                        onChange={(e) => {
                            setName(e.target.value);
                            setError(null);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") confirmSave();
                            if (e.key === "Escape") setSaving(false);
                        }}
                    />
                    {error && <span className="text-body-xs text-intent-danger-text">{error}</span>}
                    <div className="flex items-center gap-1.5">
                        <Button size="small" intent="primary" onClick={confirmSave}>
                            Save
                        </Button>
                        <Button size="small" variant="minimal" onClick={() => setSaving(false)}>
                            Cancel
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

/** The export panel: read-only CSS block with a copy button. */
function ExportBlock({ css }: { css: string }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard?.writeText(css).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        });
    };
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
                <span className="text-body-xs font-medium uppercase tracking-wide text-foreground-muted">
                    Export
                </span>
                <Button
                    size="small"
                    variant="minimal"
                    aria-label={copied ? "Copied" : "Copy CSS"}
                    title={copied ? "Copied" : "Copy"}
                    icon={<Icon icon={copied ? "tick" : "duplicate"} size={14} className="!text-current" />}
                    onClick={copy}
                >
                    {copied ? "Copied" : "Copy"}
                </Button>
            </div>
            <pre className="max-h-48 overflow-auto rounded-mithril border border-border bg-surface p-3 text-body-xs text-foreground">
                <code className="font-mono whitespace-pre">{css}</code>
            </pre>
            <p className="text-body-xs text-foreground-muted">
                Paste into <code className="font-mono">src/styles/tokens.css</code> to ship it.
            </p>
        </div>
    );
}

/**
 * The non-modal, right-edge Theme Builder panel. Deliberately NOT the `Drawer` component —
 * that's a modal (backdrop + focus trap + scroll lock) which would dim and block the very
 * components we want to watch re-tint. This is a plain `fixed` aside: the showcase grid
 * underneath stays fully interactive, so edits land against live component instances.
 */
export function ThemeBuilderPanel({
    open,
    onClose,
    builder,
}: {
    open: boolean;
    onClose: () => void;
    builder: ThemeBuilderState;
}) {
    const { dark, toggleDark } = useAppChrome();
    const [tab, setTab] = useState<"intents" | "neutrals">("intents");

    // Close on Escape for keyboard parity (no focus trap — this is non-modal by design).
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    return (
        // A viewport-anchored clip layer: keeps the off-canvas (closed) panel from extending
        // the page and spawning a horizontal scrollbar, while preserving the slide animation.
        // The layer ignores pointer events; only the panel itself is interactive.
        <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
            <aside
                aria-label="Theme builder"
                aria-hidden={!open}
                className={cn(
                    "absolute right-0 top-0 bottom-0 flex w-[340px] flex-col border-l border-border bg-background shadow-elevation-3",
                    "transition-transform duration-200 ease-mithril",
                    open ? "pointer-events-auto translate-x-0" : "translate-x-full",
                )}
            >
                {/* Header */}
                <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3">
                    <Icon icon="style" size={16} className="text-intent-primary-text" />
                    <span className="flex-1 text-heading-sm font-semibold text-foreground">Theme builder</span>
                    <Button
                        size="small"
                        variant="minimal"
                        aria-label={dark ? "Preview light theme" : "Preview dark theme"}
                        title={dark ? "Preview light" : "Preview dark"}
                        icon={<Icon icon={dark ? "lightbulb" : "moon"} size={16} className="!text-current" />}
                        onClick={toggleDark}
                    />
                    <Button
                        size="small"
                        variant="minimal"
                        aria-label="Close theme builder"
                        icon={<Icon icon="cross" size={16} className="!text-current" />}
                        onClick={onClose}
                    />
                </div>

                {/* Theme picker */}
                <div className="shrink-0 border-b border-border px-4 py-3">
                    <ThemePicker builder={builder} />
                </div>

                {/* Tabs */}
                <div className="shrink-0 px-4 pt-3">
                    <SegmentedControl
                        fill
                        size="small"
                        value={tab}
                        onValueChange={(v) => setTab(v as "intents" | "neutrals")}
                        options={[
                            { label: "Intents", value: "intents" },
                            { label: "Neutrals", value: "neutrals" },
                        ]}
                    />
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-4 py-3">
                    {tab === "intents" ? (
                        <div className="flex flex-col gap-3">
                            <div className="flex flex-col gap-1.5 rounded-mithril border border-border bg-surface p-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-body-sm font-medium text-foreground">
                                        Auto text color
                                    </span>
                                    <code className="font-mono text-body-xs text-foreground-muted">
                                        ≥ {builder.fgThreshold.toFixed(2)} → dark
                                    </code>
                                </div>
                                <Slider
                                    min={0.3}
                                    max={0.9}
                                    stepSize={0.01}
                                    value={builder.fgThreshold}
                                    onChange={builder.setFgThreshold}
                                    labelRenderer={false}
                                />
                                <p className="text-body-xs text-foreground-muted">
                                    When you pick an intent color, its text flips dark once the fill's
                                    lightness reaches this point. Lower it for dark text on more colors.
                                </p>
                            </div>
                            {INTENTS.map((intent) => (
                                <IntentBlock key={intent.key} intent={intent} builder={builder} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {NEUTRAL_GROUPS.map((group) => (
                                <div key={group.label} className="flex flex-col gap-2">
                                    <span className="text-body-xs font-medium uppercase tracking-wide text-foreground-muted">
                                        {group.label}
                                    </span>
                                    {group.props.map((prop) => (
                                        <SwatchRow
                                            key={prop}
                                            label={prop.replace("--color-", "")}
                                            value={builder.valueOf(prop)}
                                            onChange={(hex) => builder.setSeed(prop, hex)}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer: export */}
                <div className="shrink-0 border-t border-border px-4 py-3">
                    <ExportBlock css={builder.css} />
                </div>
            </aside>
        </div>
    );
}
