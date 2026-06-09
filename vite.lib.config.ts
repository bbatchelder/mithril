import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

// Library build for the npm-package distribution (`@bbatchelder/mithril`). Separate from
// vite.config.ts (the gallery app, which outputs the GitHub Pages site into dist/). This
// one builds the published package from the generated barrel (src/index.ts) into dist-lib/:
//   - ESM only, `preserveModules` so every component is its own file → consumers tree-shake
//     to just what they import, and package.json#exports can map `…/button` to one module.
//   - Every dependency externalized (bundle nothing): React/react-dom are peers, the rest
//     are regular deps the consumer's package manager installs. We never inline them.
//   - vite-plugin-dts emits .d.ts mirroring src/, resolving the `@/…` alias to relative
//     paths (the registry distribution keeps `@/` imports, so source is left untouched).
// Styles are built separately (`pnpm build:css`, Tailwind CLI → dist-lib/mithril.css); the
// component graph imports no CSS, so nothing style-related happens here.

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

// Externalize anything that isn't first-party source. `id` is either a bare specifier
// (a dependency, externalized) or starts with "." / "/" / the resolved src path (bundled).
const external = [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.peerDependencies ?? {})];
const isExternal = (id: string) => external.some((dep) => id === dep || id.startsWith(`${dep}/`));

export default defineConfig({
    plugins: [
        react(),
        dts({
            tsconfigPath: "./tsconfig.lib.json",
            outDir: "dist-lib",
            entryRoot: "src",
            // Resolve `@/…` → relative in the emitted declarations.
            staticImport: true,
        }),
    ],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
    build: {
        outDir: "dist-lib",
        emptyOutDir: true,
        sourcemap: true,
        // The package ships no static assets — public/ belongs to the gallery site only.
        copyPublicDir: false,
        lib: {
            // The barrel is the entry; `icons/all` is added so the full glyph map
            // (`ICON_GLYPHS`) ships for the string-form `<Icon icon="add" />` path, which
            // the barrel graph doesn't otherwise pull in.
            entry: [
                fileURLToPath(new URL("./src/index.ts", import.meta.url)),
                fileURLToPath(new URL("./src/components/ui/icons/all.ts", import.meta.url)),
            ],
            formats: ["es"],
        },
        rollupOptions: {
            external: isExternal,
            output: {
                preserveModules: true,
                preserveModulesRoot: "src",
                entryFileNames: "[name].js",
            },
        },
    },
});
