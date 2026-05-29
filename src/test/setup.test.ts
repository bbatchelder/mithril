import { describe, expect, it } from "vitest";

// Smoke test: confirms the Vitest + jsdom + jest-dom toolchain is wired up.
describe("test harness", () => {
    it("runs and has a DOM", () => {
        const el = document.createElement("div");
        el.textContent = "ok";
        document.body.appendChild(el);
        expect(el).toBeInTheDocument();
        expect(el).toHaveTextContent("ok");
    });
});
