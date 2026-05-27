/**
 * Codegen: vendored Blueprint icon path data.
 *
 * Reads the full @blueprintjs/icons v6.15 path set from the reference gallery's
 * node_modules and emits `src/components/ui/icons/index.ts` — a single type-safe
 * `ICON_GLYPHS` record keyed by Blueprint's kebab-case icon names, each with `16`
 * and `20` grid path arrays. The export shape is identical to the previous
 * hand-curated subset, so all consumers keep working.
 *
 * Run from the repo root:  node tools/gen-icons.mjs
 *
 * To pick up new Blueprint icons, bump @blueprintjs/icons in
 * tools/blueprint-reference and re-run this script.
 */
import { writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const esm = resolve(
    repoRoot,
    "tools/blueprint-reference/node_modules/@blueprintjs/icons/lib/esm",
);

// The per-icon path files (e.g. `add.js`) carry only `export default [...]` with
// no internal imports, so Node can import them directly. (The `paths/index.js`
// barrel uses extensionless re-exports that Node ESM rejects, so we skip it.)
const pathsDir = (grid) => resolve(esm, `generated/${grid}px/paths`);
const importDefault = async (file) =>
    (await import(pathToFileURL(file).href)).default;

const names = readdirSync(pathsDir(16))
    .filter((f) => f.endsWith(".js") && !f.endsWith(".js.map") && f !== "index.js")
    .map((f) => f.slice(0, -3)) // strip ".js" → kebab name
    .sort((a, b) => a.localeCompare(b));

const entries = [];
for (const name of names) {
    const g16 = await importDefault(resolve(pathsDir(16), `${name}.js`));
    const g20 = await importDefault(resolve(pathsDir(20), `${name}.js`));
    if (!Array.isArray(g16) || !Array.isArray(g20)) {
        throw new Error(`Missing paths for ${name}`);
    }
    entries.push([name, g16, g20]);
}

const body = entries
    .map(([name, g16, g20]) => {
        const k = /^[a-z][a-z0-9]*$/.test(name) ? name : JSON.stringify(name);
        return `    ${k}: {\n        16: ${JSON.stringify(g16)},\n        20: ${JSON.stringify(g20)},\n    },`;
    })
    .join("\n");

const nameUnion = entries.map(([name]) => `    | ${JSON.stringify(name)}`).join("\n");

const out = `/**
 * Vendored Blueprint icon path data — the full @blueprintjs/icons v6.15 set
 * (${entries.length} glyphs), copied verbatim from the package's generated path files.
 *
 * GENERATED FILE — do not edit by hand. Regenerate with:
 *   node tools/gen-icons.mjs
 *
 * Each glyph carries the path \`d\` strings for both the 16×16 and 20×20 grids.
 * \`<Icon icon="..." />\` selects the grid by size (< 20 → 16, ≥ 20 → 20), mirroring
 * Blueprint's \`svgIconContainer\`.
 *
 * Note: this is a single static map, so importing \`Icon\` includes every glyph in
 * the bundle (the same trade-off as Blueprint's \`allPaths\`). Because consumers own
 * this source, trim unused entries if bundle size matters.
 */

export type IconGlyph = {
    /** Path \`d\` strings for the 16×16 grid (standard size). */
    16: string[];
    /** Path \`d\` strings for the 20×20 grid (large size). */
    20: string[];
};

/** All valid Blueprint icon names. */
export type IconName =
${nameUnion};

// Typed as a total \`Record<IconName, IconGlyph>\` (no \`as const\`): keeps the
// type-safe \`IconName\` union without forcing TS to infer literal tuple types for
// every path — \`ICON_GLYPHS[name][grid]\` resolves straight to \`string[]\`, and a
// missing glyph is a compile error.
export const ICON_GLYPHS: Record<IconName, IconGlyph> = {
${body}
};
`;

const dest = resolve(repoRoot, "src/components/ui/icons/index.ts");
writeFileSync(dest, out);
console.log(`Wrote ${entries.length} glyphs → ${dest}`);
