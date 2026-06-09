// Copies the raw style sources into the package output (dist-lib/) for the advanced
// distribution path. The turnkey path is the prebuilt `dist-lib/mithril.css` (built by
// `pnpm build:css`); these raw files are for consumers running their own Tailwind v4 setup
// who want mithril's `@theme` seeds — and the runtime token derivation — in their own
// pipeline:
//   @import "@bbatchelder/mithril/tokens.css";   /* palette/intents/semantic vars + @theme */
//   @import "@bbatchelder/mithril/base.css";      /* keyframes + .bp-* animation hooks + base */
//
// Run as the last step of `pnpm build:lib`, after `vite build` (which empties dist-lib).
// Dependency-free (Node built-ins only), matching the other tools/.

import { copyFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "dist-lib");

mkdirSync(OUT, { recursive: true });
for (const file of ["tokens.css", "base.css"]) {
    copyFileSync(join(ROOT, "src/styles", file), join(OUT, file));
    console.log(`Copied ${file} → dist-lib/${file}`);
}
