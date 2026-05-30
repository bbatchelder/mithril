// Vitest setup — registers jest-dom matchers (toBeInTheDocument, toHaveAttribute, …)
// and cleans up the DOM between tests.
import "@testing-library/jest-dom/vitest";
// Registers the `toHaveNoViolations` axe matcher (see ./axe.ts) for every test file.
import "./axe";
import { cleanup, configure } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// findBy*/waitFor default to a 1000ms timeout. Opening a Radix Popover (Floating-UI
// positioning + portal) can exceed that when the 11 test files run in parallel forks
// on a contended machine — a timing flake, not a behavior bug. Give async queries room.
configure({ asyncUtilTimeout: 5000 });

afterEach(() => {
    cleanup();
});

// jsdom polyfills for Radix/Floating-UI primitives (Popover, etc.) which jsdom lacks.
if (!("ResizeObserver" in globalThis)) {
    globalThis.ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
    } as unknown as typeof ResizeObserver;
}

// Pointer-capture + scrollIntoView are called by Radix but unimplemented in jsdom.
if (typeof Element !== "undefined") {
    Element.prototype.hasPointerCapture ??= () => false;
    Element.prototype.setPointerCapture ??= () => {};
    Element.prototype.releasePointerCapture ??= () => {};
    Element.prototype.scrollIntoView ??= vi.fn();
}
