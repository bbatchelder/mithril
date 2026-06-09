// Appends explicit module extensions to the relative import/export specifiers in the
// emitted .d.ts files (dist-lib/**). vite-plugin-dts mirrors the source's *extensionless*
// imports (`from './icon'`, `from '../../lib/types'`), which is fine for TypeScript's
// `bundler` moduleResolution but FAILS under `node16`/`nodenext` — those require the
// specifier to name the real runtime file (`./icon.js`). The emitted .js already carries
// `.js` (rollup adds it), so only the declarations are out of step; this realigns them.
//
// Verified by `arethetypeswrong` (see `pnpm check:pkg`): without this, node16-from-ESM
// reports "Internal resolution error"; with it, every JS/types entrypoint is green.
//
// Rewrite rules, resolved against the file on disk so directory (index) imports are handled:
//   './lib/utils'  → './lib/utils.js'        (a sibling  ./lib/utils.d.ts exists)
//   './icons'      → './icons/index.js'      (a directory ./icons/index.d.ts exists)
// Bare specifiers ('react', 'class-variance-authority') and already-extensioned ones are
// left untouched. Runs as part of `pnpm build:lib`, after the vite build emits the .d.ts.
// Dependency-free (Node built-ins only), matching the other tools/.

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "dist-lib");

/** All `.d.ts` files under dist-lib (recursive). */
function declarationFiles(dir) {
    const out = [];
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) out.push(...declarationFiles(full));
        else if (entry.endsWith(".d.ts")) out.push(full);
    }
    return out;
}

// Matches the specifier of `from '…'` and dynamic `import('…')`, capturing quote + path.
// Only relative specifiers (starting with `.`) are considered below.
const SPECIFIER_RE = /(\bfrom\s*|\bimport\s*\(\s*)(['"])(\.[^'"]*)\2/g;

/** Resolve the correct extension for a relative specifier from a given .d.ts file. */
function withExtension(fileDir, spec) {
    // Already carries an extension we recognize — leave it.
    if (/\.(js|cjs|mjs|json|css)$/.test(spec)) return spec;
    const target = resolve(fileDir, spec);
    if (existsSync(`${target}.d.ts`)) return `${spec}.js`; // sibling file
    if (existsSync(join(target, "index.d.ts"))) return `${spec}/index.js`; // directory (index)
    return spec; // unresolved — leave as-is rather than guess
}

let changedFiles = 0;
let rewrites = 0;
for (const file of declarationFiles(OUT)) {
    const fileDir = dirname(file);
    const src = readFileSync(file, "utf8");
    const next = src.replace(SPECIFIER_RE, (whole, head, quote, spec) => {
        const fixed = withExtension(fileDir, spec);
        if (fixed === spec) return whole;
        rewrites++;
        return `${head}${quote}${fixed}${quote}`;
    });
    if (next !== src) {
        writeFileSync(file, next);
        changedFiles++;
    }
}

console.log(`Fixed .d.ts extensions — ${rewrites} specifiers across ${changedFiles} files.`);
