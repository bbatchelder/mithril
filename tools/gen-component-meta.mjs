// @ts-check
/**
 * Generate per-component metadata for the showcase overview tiles.
 *
 * Scans the owned-source components and their test suites and emits
 * `src/components/ui/component-meta.generated.ts` — a small, checked-in map keyed
 * by component id (which is 1:1 with the `src/components/ui/<id>.tsx` filename).
 * `src/App.tsx` imports it to render the badges on each component card.
 *
 * Signals (all authoritative / cheaply derivable from source):
 *   - tests       — count of `it()/test()` cases in the component's test file(s),
 *                   bucketed (heuristically, by title keywords) into a11y / keyboard /
 *                   behavior. Test files attribute to a component by longest
 *                   boundary-prefix of their filename (so `radio-group.test` → `radio`,
 *                   `dialog-body-footer.test` → `dialog`, `data-table-selection` →
 *                   `data-table`). `axe-smoke.test` matches no component → counted global.
 *   - rsc         — server-renderable: the source carries no `"use client"` directive.
 *   - portal      — renders into a portal (so it needs `dark` threading per the overlays recipe).
 *   - radix       — backed by a `@radix-ui/*` headless primitive (vs hand-rolled).
 *   - polymorphic — exposes `asChild` (Radix Slot polymorphism).
 *   - registry    — distributable as owned-source via `registry.json`.
 *
 * Re-run after adding components or tests:  pnpm gen:meta
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const UI_DIR = join(ROOT, "src/components/ui");
const TEST_DIR = join(UI_DIR, "__tests__");
const OUT = join(UI_DIR, "component-meta.generated.ts");

/** Every `src/components/ui/<name>.tsx` — the id universe (id === filename). */
const moduleFiles = readdirSync(UI_DIR).filter((f) => f.endsWith(".tsx"));
const moduleIds = moduleFiles.map((f) => basename(f, ".tsx"));

// ── Which component ids are distributable (appear in registry.json) ──────────
const registry = JSON.parse(readFileSync(join(ROOT, "registry.json"), "utf8"));
const inRegistry = new Set();
for (const item of registry.items ?? []) {
    for (const file of item.files ?? []) {
        const m = /src\/components\/ui\/([a-z0-9-]+)\.tsx$/.exec(file.path ?? "");
        if (m) inRegistry.add(m[1]);
    }
}

// ── Per-source signals (rsc / portal / radix / polymorphic) ──────────────────
/** @param {string} id */
function sourceSignals(id) {
    const src = readFileSync(join(UI_DIR, `${id}.tsx`), "utf8");
    const head = src.replace(/^﻿/, "").trimStart();
    const rsc = !head.startsWith('"use client"') && !head.startsWith("'use client'");
    const portal = /createPortal|<\w*Portal\b|\.Portal\b|from ["']\.\/portal["']/.test(src);
    const radix = /@radix-ui\//.test(src);
    const polymorphic = /\basChild\b/.test(src);
    return { rsc, portal, radix, polymorphic };
}

// ── Test attribution + bucketing ─────────────────────────────────────────────
/** Longest component id that is a boundary-prefix of a test filename (or null). */
function targetFor(testBase) {
    let best = null;
    for (const id of moduleIds) {
        if (testBase === id || testBase.startsWith(`${id}-`)) {
            if (!best || id.length > best.length) best = id;
        }
    }
    return best;
}

// Heuristic, priority-ordered: keyboard wins over a11y wins over behavior.
const KEYBOARD = /\b(keyboard|arrow|enter|escape|esc\b|spacebar|space key|keydown|keyup|hotkey|key combo|typeahead|type to|types|tab(s)? (to|navigation|order)|focus(es|ed|ing)?)\b/i;
const A11Y = /\b(aria|a11y|role|accessible|accessibility|axe|screen ?reader|activedescendant|label(l?ed|l?ing)?|tabindex|alt text)\b/i;

/** @param {string} title */
function bucket(title) {
    if (KEYBOARD.test(title)) return "keyboard";
    if (A11Y.test(title)) return "a11y";
    return "behavior";
}

/** Pull every `it()/test()` (incl. .only/.skip/.each) title out of a test file. */
function testTitles(src) {
    const re = /\b(?:it|test)(?:\.\w+(?:\([^)]*\))?)?\s*\(\s*(["'`])((?:\\.|(?!\1)[\s\S])*?)\1/g;
    const titles = [];
    let m;
    while ((m = re.exec(src))) titles.push(m[2]);
    return titles;
}

const meta = {};
for (const id of moduleIds) {
    const { rsc, portal, radix, polymorphic } = sourceSignals(id);
    meta[id] = {
        tests: { total: 0, a11y: 0, keyboard: 0, behavior: 0 },
        rsc,
        portal,
        radix,
        polymorphic,
        registry: inRegistry.has(id),
    };
}

let globalTests = 0; // axe-smoke et al. — attributed to no single component
const testFiles = readdirSync(TEST_DIR).filter((f) => /\.test\.tsx?$/.test(f));
for (const file of testFiles) {
    const testBase = file.replace(/\.test\.tsx?$/, "");
    const target = targetFor(testBase);
    const titles = testTitles(readFileSync(join(TEST_DIR, file), "utf8"));
    if (!target || !meta[target]) {
        globalTests += titles.length;
        continue;
    }
    const t = meta[target].tests;
    for (const title of titles) {
        t.total += 1;
        t[bucket(title)] += 1;
    }
}

// ── Emit (sorted keys for stable diffs) ──────────────────────────────────────
const sorted = Object.fromEntries(Object.keys(meta).sort().map((k) => [k, meta[k]]));
const banner = `// AUTO-GENERATED by tools/gen-component-meta.mjs — do not edit by hand.
// Re-run after adding components or tests:  pnpm gen:meta
`;
const body = `${banner}
/** Per-component metadata surfaced as badges on the showcase overview tiles. */
export interface ComponentMeta {
    /** Test cases in the component's suite, bucketed by title-keyword heuristic. */
    tests: { total: number; a11y: number; keyboard: number; behavior: number };
    /** Server-renderable (no \`"use client"\` directive). */
    rsc: boolean;
    /** Renders into a portal — needs \`dark\` threading (see the overlays recipe). */
    portal: boolean;
    /** Backed by a \`@radix-ui/*\` headless primitive. */
    radix: boolean;
    /** Exposes \`asChild\` (Radix Slot polymorphism). */
    polymorphic: boolean;
    /** Distributable as owned-source via registry.json. */
    registry: boolean;
}

export const COMPONENT_META: Record<string, ComponentMeta> = ${JSON.stringify(sorted, null, 4)};
`;

writeFileSync(OUT, body);
const componentsWithTests = Object.values(meta).filter((m) => m.tests.total > 0).length;
console.log(
    `gen:meta → ${OUT.replace(`${ROOT}/`, "")}\n` +
        `  ${moduleIds.length} ui modules · ${componentsWithTests} with tests · ${globalTests} global (axe-smoke) tests`,
);
