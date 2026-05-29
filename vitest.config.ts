import { fileURLToPath, URL } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Test config kept separate from vite.config.ts so the Tailwind plugin (irrelevant
// to behavior/ARIA unit tests) doesn't run for every test. Verification of *visuals*
// stays with the comparison harness; Vitest covers keyboard/ARIA behavior the harness
// cannot see. See docs/handoffs for the a11y-behavior-gaps work.
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: ["./src/test/setup.ts"],
        include: ["src/**/*.{test,spec}.{ts,tsx}"],
    },
});
