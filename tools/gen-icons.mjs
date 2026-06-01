/**
 * Codegen: vendored Blueprint icon path data — tree-shakeable.
 *
 * Reads the full @blueprintjs/icons v6.15 path set from the reference gallery's
 * node_modules and emits two files into `src/components/ui/icons/`:
 *
 *   - `index.ts` — one `export const <camelName>: IconGlyph` per glyph (706 of
 *     them), plus the `IconGlyph` type and the kebab-case `IconName` union. Because
 *     each glyph is its own top-level named export, a bundler ships only the glyphs
 *     a consumer actually imports (`import { add } from ".../icons"`). This is the
 *     tree-shaking default path.
 *   - `all.ts` — the `ICON_GLYPHS` map (kebab name → glyph) that powers the dynamic
 *     `<Icon icon="add" />` string form via the registry. Importing this pulls every
 *     glyph (the "I want them all" convenience), so it lives in its own module and is
 *     never reachable from `icon.tsx`.
 *
 * `icons/registry.ts` is hand-written (not generated) — the small mutable map +
 * `registerIcons`/`getRegisteredGlyph` that `icon.tsx` reads for the string form.
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

// A handful of icon names camelCase to JS reserved words (`delete`, `export`,
// `function`, `import`, `package`, `switch`), which can't be `export const`
// identifiers. Suffix just those with `Icon` (`delete` → `deleteIcon`); verified
// collision-free against the rest of the set. The kebab `IconName` / `ICON_GLYPHS`
// keys are untouched, so the string form (`<Icon icon="delete" />`) is unaffected.
const RESERVED = new Set([
    "delete", "export", "function", "import", "package", "switch",
]);

// kebab → camelCase, a valid JS identifier for the named export
// (e.g. "arrow-up" → "arrowUp"). Verified collision-free across the 706-name set.
const camel = (name) => {
    const id = name.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
    return RESERVED.has(id) ? `${id}Icon` : id;
};

const entries = [];
for (const name of names) {
    const g16 = await importDefault(resolve(pathsDir(16), `${name}.js`));
    const g20 = await importDefault(resolve(pathsDir(20), `${name}.js`));
    if (!Array.isArray(g16) || !Array.isArray(g20)) {
        throw new Error(`Missing paths for ${name}`);
    }
    entries.push([name, camel(name), g16, g20]);
}

// Guard the invariants the export shape relies on.
const ids = new Set(entries.map(([, id]) => id));
if (ids.size !== entries.length) throw new Error("camelCase name collision");
for (const [, id] of entries) {
    if (!/^[a-z][a-zA-Z0-9]*$/.test(id)) throw new Error(`unsafe identifier: ${id}`);
}

const nameUnion = entries.map(([name]) => `    | ${JSON.stringify(name)}`).join("\n");

const glyphConsts = entries
    .map(
        ([, id, g16, g20]) =>
            `export const ${id}: IconGlyph = {\n    16: ${JSON.stringify(g16)},\n    20: ${JSON.stringify(g20)},\n};`,
    )
    .join("\n");

const indexOut = `/**
 * Vendored Blueprint icon path data — the full @blueprintjs/icons v6.15 set
 * (${entries.length} glyphs), copied verbatim from the package's generated path files.
 *
 * GENERATED FILE — do not edit by hand. Regenerate with:
 *   node tools/gen-icons.mjs
 *
 * Each glyph is its own top-level \`export const\`, so a bundler ships only the
 * glyphs you import:
 *
 *   import { add, trash } from "@/components/ui/icons";
 *   <Icon icon={add} />            // ships ≈ 2 glyphs, not all ${entries.length}
 *
 * The dynamic string form (\`<Icon icon="add" />\`) instead resolves through the
 * registry (see \`registry.ts\`) — register glyphs once (\`registerIcons(ICON_GLYPHS)\`
 * from \`./all\`, or a selective subset) to use it. Each glyph carries the path \`d\`
 * strings for both the 16×16 and 20×20 grids; \`<Icon>\` selects the grid by size
 * (< 20 → 16, ≥ 20 → 20), mirroring Blueprint's \`svgIconContainer\`.
 */

export type IconGlyph = {
    /** Path \`d\` strings for the 16×16 grid (standard size). */
    16: string[];
    /** Path \`d\` strings for the 20×20 grid (large size). */
    20: string[];
};

/** All valid Blueprint icon names (kebab-case). */
export type IconName =
${nameUnion};

${glyphConsts}
`;

const allImports = entries.map(([, id]) => `    ${id},`).join("\n");
const allMap = entries
    .map(([name, id]) => `    ${JSON.stringify(name)}: ${id},`)
    .join("\n");

const allOut = `/**
 * The full glyph map, keyed by \`IconName\` — GENERATED, do not edit by hand.
 * Regenerate with:  node tools/gen-icons.mjs
 *
 * Importing this module pulls in **every** glyph (≈195 KB), so it is kept in its
 * own file, separate from \`index.ts\`, and is never imported by \`icon.tsx\`. Use it
 * for the dynamic string form when you don't care about bundle size:
 *
 *   import { ICON_GLYPHS, registerIcons } from "@/components/ui/icons/all";
 *   registerIcons(ICON_GLYPHS);   // now <… icon="any-name" /> works
 *
 * To tree-shake instead, import individual glyphs from \`./index\` and pass the
 * object (\`<Icon icon={add} />\`), or register only the subset you use.
 */
import type { IconGlyph, IconName } from "./index";
import {
${allImports}
} from "./index";

export { registerIcons, getRegisteredGlyph } from "./registry";

export const ICON_GLYPHS: Record<IconName, IconGlyph> = {
${allMap}
};
`;

const iconsDir = resolve(repoRoot, "src/components/ui/icons");
writeFileSync(resolve(iconsDir, "index.ts"), indexOut);
writeFileSync(resolve(iconsDir, "all.ts"), allOut);
console.log(
    `Wrote ${entries.length} glyph exports → icons/index.ts and the ICON_GLYPHS map → icons/all.ts`,
);
