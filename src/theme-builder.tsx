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
 * A **theme** is just an override map (a diff from the Blueprint defaults). Two are built in —
 * "Blueprint" (the defaults, an empty map) and "Datex" (the bundled intent re-tint, mirrored
 * from tokens.css). The user can load one, edit it, and **Save a copy** under a new name; saved
 * themes live in localStorage and appear in the picker.
 *
 * Intent variants (hover/active/disabled/foreground) are auto-derived from the base color
 * (OKLCH lightness offsets + a contrast-picked foreground) so the user edits one swatch per
 * intent, but each derived value is exposed under "Advanced" for fine-tuning. We compute the
 * derived values to concrete hex with `culori` so what you preview is exactly what you
 * export — one value, one source of truth, no live/export drift.
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import { clampChroma, converter, formatHex, wcagContrast } from "culori";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Collapse } from "@/components/ui/collapse";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { HTMLSelect } from "@/components/ui/html-select";
import { InputGroup } from "@/components/ui/input-group";
import { useAppChrome } from "@/lib/app-chrome";

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
    { label: "Dark grays", props: [1, 2, 3, 4, 5].map((n) => `--color-dark-gray-${n}`) },
    { label: "Mid grays", props: [1, 2, 3, 4, 5].map((n) => `--color-gray-${n}`) },
    { label: "Light grays", props: [1, 2, 3, 4, 5].map((n) => `--color-light-gray-${n}`) },
];

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

/** Datex: the bundled intent re-tint, mirrored from tokens.css `[data-theme="datex"]`. */
const DATEX: Overrides = {
    "--color-primary": "#5b08b2",
    "--color-primary-hover": "#470092",
    "--color-primary-active": "#340073",
    "--color-primary-disabled": "#7339d1",
    "--color-success": "#3fc589",
    "--color-success-hover": "#39ac78",
    "--color-success-active": "#339669",
    "--color-success-disabled": "#4de6a2",
    "--color-success-foreground": "#111418",
    "--color-warning": "#efb52f",
    "--color-warning-hover": "#bc8f2b",
    "--color-warning-active": "#a07b29",
    "--color-warning-disabled": "#ffdc57",
    "--color-danger": "#e23439",
    "--color-danger-hover": "#c01d25",
    "--color-danger-active": "#a21920",
    "--color-danger-disabled": "#fd6265",
};

const BUILTIN_THEMES: Record<string, Overrides> = {
    Blueprint: {}, // pure defaults
    Datex: DATEX,
};
const BUILTIN_NAMES = ["Blueprint", "Datex"];
const BUILTIN_SET = new Set(BUILTIN_NAMES);

// ─── Color math (culori) ─────────────────────────────────────────────────────

const toOklch = converter("oklch");

/** Shift a hex color's OKLCH lightness by `dl`, gamut-clamp, return hex. */
function shiftLightness(hex: string, dl: number): string {
    const c = toOklch(hex);
    if (!c) return hex;
    const shifted = clampChroma({ ...c, l: Math.max(0, Math.min(1, c.l + dl)) }, "oklch");
    return formatHex(shifted) ?? hex;
}

/** Pick the foreground (near-black vs white) with the higher contrast on `hex`. */
function pickForeground(hex: string): string {
    const onWhite = wcagContrast(hex, "#ffffff");
    const onBlack = wcagContrast(hex, "#111418");
    return onBlack >= onWhite ? "#111418" : "#ffffff";
}

/**
 * Derive an intent's variants from its base color. The lightness offsets approximate
 * Blueprint's family tiers (hover ≈ one tier darker, active ≈ two, disabled ≈ one lighter);
 * they are exposed as editable so a fidelity-minded user can fine-tune.
 */
function deriveVariants(base: string): Record<string, string> {
    return {
        "-hover": shiftLightness(base, -0.06),
        "-active": shiftLightness(base, -0.12),
        "-disabled": shiftLightness(base, 0.1),
        "-foreground": pickForeground(base),
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

function loadWorking(): { name: string; overrides: Overrides } {
    if (typeof window === "undefined") return { name: "Blueprint", overrides: {} };
    try {
        const parsed = JSON.parse(window.localStorage.getItem(WORKING_KEY) || "null") as unknown;
        if (parsed && typeof parsed === "object" && "overrides" in parsed) {
            const p = parsed as { name?: unknown; overrides?: unknown };
            return {
                name: typeof p.name === "string" ? p.name : "Blueprint",
                overrides: sanitize(p.overrides),
            };
        }
        // Migrate the previous shape (a bare overrides map) → a Blueprint-based edit.
        const legacy = sanitize(parsed);
        return { name: "Blueprint", overrides: legacy };
    } catch {
        return { name: "Blueprint", overrides: {} };
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
    resetIntent: (key: IntentKey) => void;
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
    /** Delete a custom theme (built-ins are protected). */
    deleteTheme: (name: string) => void;
}

export function useThemeBuilder(): ThemeBuilderState {
    const [customThemes, setCustomThemes] = useState<Record<string, Overrides>>(loadCustomThemes);
    const [selectedName, setSelectedName] = useState<string>(() => loadWorking().name);
    const [overrides, setOverrides] = useState<Overrides>(() => loadWorking().overrides);
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
            window.localStorage.setItem(WORKING_KEY, JSON.stringify({ name: selectedName, overrides }));
        } catch {
            /* storage unavailable — non-fatal */
        }
    }, [selectedName, overrides]);
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

    const setIntentBase = useCallback((key: IntentKey, hex: string) => {
        const variants = deriveVariants(hex);
        setOverrides((o) => ({
            ...o,
            [`--color-${key}`]: hex,
            ...Object.fromEntries(VARIANT_SUFFIXES.map((s) => [`--color-${key}${s}`, variants[s]])),
        }));
    }, []);

    const setSeed = useCallback((prop: string, hex: string) => {
        setOverrides((o) => ({ ...o, [prop]: hex }));
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
        resetIntent,
        css,
        themeNames,
        selectedName,
        isCustom,
        selectTheme,
        revert,
        saveAs,
        deleteTheme,
    };
}

// ─── UI ──────────────────────────────────────────────────────────────────────

/** One color swatch row: native color input + label + hex readout. */
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
        <label className="flex items-center gap-2.5">
            <input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                aria-label={label}
                className="h-7 w-9 shrink-0 cursor-pointer rounded-bp border border-border bg-transparent p-0.5"
            />
            <span
                className={cn(
                    "flex-1 truncate",
                    sub ? "text-body-xs text-foreground-muted" : "text-body-sm text-foreground",
                )}
            >
                {label}
            </span>
            <code className="font-mono text-body-xs text-foreground-muted">{value}</code>
        </label>
    );
}

/** An intent block: base swatch + a reset + an "Advanced" disclosure of its 4 variants. */
function IntentBlock({ intent, builder }: { intent: { key: IntentKey; label: string }; builder: ThemeBuilderState }) {
    const [advanced, setAdvanced] = useState(false);
    const { key, label } = intent;
    const customized = `--color-${key}` in builder.overrides;
    return (
        <div className="flex flex-col gap-2 rounded-bp border border-border bg-surface p-3">
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
                <div className="flex flex-col gap-1.5 rounded-bp border border-border bg-surface p-2.5">
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
            <pre className="max-h-48 overflow-auto rounded-bp border border-border bg-surface p-3 text-body-xs text-foreground">
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
                    "transition-transform duration-200 ease-bp",
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
