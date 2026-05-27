import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
    // Production builds are deployed to the GitHub Pages project site
    // (https://bbatchelder.github.io/analyst-ui/), so assets need the subpath base.
    // Dev keeps base "/" so the comparison harness can hit localhost:5173/?component=…
    base: command === "build" ? "/analyst-ui/" : "/",
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
}));
