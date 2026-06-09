// Generates src/index.ts — the public barrel for the npm-package distribution.
//
// mithril ships two ways (see README "Install"): the shadcn-style registry (consumers
// own the source) and a conventional npm package (`import { Button } from
// "@bbatchelder/mithril"`). The package build (`pnpm build:lib`, vite.lib.config.ts)
// bundles from this barrel, so it must re-export every owned component plus the shared
// lib helpers. This script keeps it in lock-step with src/components/ui — re-run after
// adding/removing a component:
//   node tools/gen-barrel.mjs        (or: pnpm gen:barrel)
//
// A CI drift guard (ci.yml) regenerates it and fails if the committed file is stale.
// Dependency-free (Node built-ins only), matching the other tools/.

import { readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, basename } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const UI_DIR = join(ROOT, "src/components/ui");

const components = readdirSync(UI_DIR)
    .filter((f) => f.endsWith(".tsx"))
    .map((f) => basename(f, ".tsx"))
    .sort();

const lines = [
    "// GENERATED FILE — do not edit by hand. Regenerate with:  node tools/gen-barrel.mjs",
    "//",
    "// The public entry point for the npm package (`@bbatchelder/mithril`). Re-exports every",
    "// owned component from src/components/ui plus the shared lib helpers. Per-component",
    "// subpath imports (`@bbatchelder/mithril/button`) and the tree-shakeable icon glyph set",
    '// (`@bbatchelder/mithril/icons`) are wired in package.json#exports, not here.',
    "",
    "// Shared foundations.",
    'export { cn } from "./lib/utils";',
    'export type { Intent } from "./lib/types";',
    "",
    "// Icon string-form registry helpers (the `Icon` component itself comes from ./components/ui/icon).",
    'export { registerIcons, getRegisteredGlyph } from "./components/ui/icons/registry";',
    "",
    "// Components.",
    ...components.map((id) => `export * from "./components/ui/${id}";`),
    "",
];

writeFileSync(join(ROOT, "src/index.ts"), lines.join("\n"));
console.log(`Wrote src/index.ts — ${components.length} components + lib helpers.`);
