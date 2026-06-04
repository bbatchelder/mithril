// @ts-check
/**
 * Generate the per-component props/API reference shown on each showcase component page.
 *
 * Uses `react-docgen-typescript` to follow the real TypeScript types + JSDoc of each
 * component's own prop interface, and emits `src/components/ui/component-props.generated.ts`
 * — keyed by component id, one entry per exported component in the family (Menu · MenuItem
 * · MenuDivider), each with its props (name, type, required, default, description).
 *
 * Only the component-like exports (from component-meta's `exports`) are kept — `cva`
 * variant helpers and contexts are dropped. Inherited DOM/HTML props are filtered out
 * (anything whose declaration lives in node_modules), leaving each component's own surface.
 *
 * Re-run after changing a component's props or JSDoc:  pnpm gen:props
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { withCustomConfig } from "react-docgen-typescript";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const UI_DIR = join(ROOT, "src/components/ui");
const OUT = join(UI_DIR, "component-props.generated.ts");

const moduleIds = readdirSync(UI_DIR)
    .filter((f) => f.endsWith(".tsx"))
    .map((f) => basename(f, ".tsx"));

// The component-like exports per id (the family), reused to drop non-component exports
// and to map a docgen displayName back to its component id. The generated object is
// emitted via JSON.stringify, so the literal is valid JSON — parse it (no eval).
const metaSrc = readFileSync(join(UI_DIR, "component-meta.generated.ts"), "utf8");
const metaJson = metaSrc.slice(metaSrc.indexOf("{", metaSrc.indexOf("COMPONENT_META"))).replace(/;\s*$/, "");
const META = JSON.parse(metaJson);
const idByExport = new Map();
const familyOrder = new Map(); // id -> [exportName, …] in declared order
for (const [id, m] of Object.entries(META)) {
    familyOrder.set(id, m.exports);
    for (const name of m.exports) idByExport.set(name, id);
}

const parser = withCustomConfig(join(ROOT, "tsconfig.app.json"), {
    shouldExtractLiteralValuesFromEnum: true,
    shouldRemoveUndefinedFromOptional: true,
    savePropValueAsString: true,
    // Keep only props declared in this repo's source — drops inherited React/DOM props.
    propFilter: (prop) => !prop.parent || !/node_modules/.test(prop.parent.fileName),
});

const clean = (s) => (s ?? "").replace(/\s+/g, " ").trim();

/** Human-readable type string: expand literal-union enums, drop `| null`, clamp length. */
function typeOf(prop) {
    let name = prop.type?.name ?? "unknown";
    if (name === "enum" && Array.isArray(prop.type.value) && prop.type.value.length) {
        const vals = [...new Set(prop.type.value.map((v) => String(v.value)).filter((v) => v !== "undefined"))];
        // A huge literal union (e.g. the 706-name IconName) is unreadable inline — summarize it.
        name = vals.length > 10 ? `${vals.slice(0, 4).join(" | ")} | … (${vals.length} options)` : vals.join(" | ");
    }
    name = name.replace(/\s*\|\s*null\b/g, "").replace(/\s+/g, " ").trim();
    return name.length > 90 ? `${name.slice(0, 88)}…` : name;
}

/** Harness/internal props (underscore-prefixed or `@internal`-tagged) are not public API. */
function isInternal(prop) {
    return prop.name.startsWith("_") || /@internal/i.test(prop.description ?? "");
}

function defaultOf(prop) {
    const v = prop.defaultValue?.value;
    if (v == null || v === "") return null;
    const s = clean(String(v));
    return s.length > 40 ? `${s.slice(0, 38)}…` : s;
}

const t0 = Date.now();
const files = moduleIds.map((id) => join(UI_DIR, `${id}.tsx`));
const docs = parser.parse(files);

/** id -> [{ name, description, props: [...] }] (only component-family exports with props). */
const byId = {};
for (const doc of docs) {
    const id = idByExport.get(doc.displayName);
    if (!id) continue; // not a component-family export (cva helper / context)
    const props = Object.values(doc.props ?? {})
        .filter((p) => !isInternal(p))
        .map((p) => ({
            name: p.name,
            type: typeOf(p),
            required: !!p.required,
            defaultValue: defaultOf(p),
            description: clean(p.description),
        }))
        .sort((a, b) => Number(b.required) - Number(a.required) || a.name.localeCompare(b.name));
    if (!props.length) continue;
    (byId[id] ??= []).push({ name: doc.displayName, description: clean(doc.description), props });
}

// Order each id's components by their declared family order (Menu before MenuItem …).
for (const [id, comps] of Object.entries(byId)) {
    const order = familyOrder.get(id) ?? [];
    comps.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
}

const sorted = Object.fromEntries(Object.keys(byId).sort().map((k) => [k, byId[k]]));
const componentCount = Object.values(sorted).reduce((n, comps) => n + comps.length, 0);
const propCount = Object.values(sorted).reduce((n, comps) => n + comps.reduce((m, c) => m + c.props.length, 0), 0);

const body = `// AUTO-GENERATED by tools/gen-component-props.mjs — do not edit by hand.
// Re-run after changing a component's props or JSDoc:  pnpm gen:props

/** One documented prop of a component. */
export interface PropDoc {
    name: string;
    type: string;
    required: boolean;
    defaultValue: string | null;
    description: string;
}

/** A documented component (one per export in a family) and its props. */
export interface ComponentApiDoc {
    name: string;
    description: string;
    props: PropDoc[];
}

/** Props reference per showcase component id (array = the compound-component family). */
export const COMPONENT_PROPS: Record<string, ComponentApiDoc[]> = ${JSON.stringify(sorted, null, 4)};
`;

writeFileSync(OUT, body);
console.log(
    `gen:props → ${OUT.replace(`${ROOT}/`, "")}\n` +
        `  ${Object.keys(sorted).length} ids · ${componentCount} components · ${propCount} props · ${Date.now() - t0}ms`,
);
