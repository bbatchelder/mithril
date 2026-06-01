// Post-processes the per-item JSON that `shadcn build` emits into `dist/r/` so the
// hosted registry is installable with **zero consumer config**.
//
// `shadcn build` inlines each component's source but PRESERVES bare-name
// registryDependencies (e.g. button → ["icon","spinner","types","utils","tokens"]).
// A consumer running `npx shadcn add https://…/r/button.json` can't resolve bare
// names against our host — shadcn would look them up against its default registry.
// So here we rewrite every internal bare-name dep to a full URL pointing back at the
// same hosted location. Full-URL deps make BOTH install methods work:
//   • direct URL    → `shadcn add <BASE>/r/button.json`        (no setup)
//   • namespaced    → `shadcn add @analyst-ui/button`          (one components.json entry)
// because the namespaced item, once fetched, still resolves its deps by URL.
//
// We also copy the source `registry.json` manifest to `dist/r/registry.json` for
// discoverability. Dependency-free (Node built-ins only), matching the other tools/.
//
// Run AFTER `shadcn build … --output dist/r` (vite build must run first — it cleans dist).
// The base URL can be overridden for forks/previews via REGISTRY_BASE_URL.

import { readFileSync, writeFileSync, readdirSync, existsSync, copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "dist", "r");

// The GitHub Pages project site (see vite.config.ts `base`). Trailing slash trimmed.
const BASE_URL = (process.env.REGISTRY_BASE_URL ?? "https://bbatchelder.github.io/analyst-ui").replace(/\/+$/, "");

if (!existsSync(OUT_DIR)) {
    console.error(
        `✗ ${OUT_DIR} not found. Run \`shadcn build registry.json --output dist/r\` first ` +
            `(and \`vite build\` before that — it cleans dist/).`,
    );
    process.exit(1);
}

const itemFiles = readdirSync(OUT_DIR).filter((f) => f.endsWith(".json") && f !== "registry.json");

// The set of item names we actually host — only these bare deps get rewritten, so an
// (future) external registry dependency would be left untouched.
const hosted = new Set(itemFiles.map((f) => f.replace(/\.json$/, "")));

const itemUrl = (name) => `${BASE_URL}/r/${name}.json`;

let rewrittenCount = 0;
for (const file of itemFiles) {
    const path = join(OUT_DIR, file);
    const item = JSON.parse(readFileSync(path, "utf8"));
    if (Array.isArray(item.registryDependencies)) {
        item.registryDependencies = item.registryDependencies.map((dep) => {
            if (typeof dep !== "string") return dep;
            if (dep.startsWith("http://") || dep.startsWith("https://") || dep.startsWith("@")) return dep;
            return hosted.has(dep) ? itemUrl(dep) : dep;
        });
        if (item.registryDependencies.length) rewrittenCount++;
    }
    writeFileSync(path, JSON.stringify(item, null, 2) + "\n");
}

// Serve the source manifest at /r/registry.json for discoverability.
copyFileSync(join(ROOT, "registry.json"), join(OUT_DIR, "registry.json"));

console.log(
    `Rewrote registryDependencies → URLs in ${rewrittenCount}/${itemFiles.length} items ` +
        `(base ${BASE_URL}/r) and copied registry.json index.`,
);
