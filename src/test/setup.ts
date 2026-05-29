// Vitest setup — registers jest-dom matchers (toBeInTheDocument, toHaveAttribute, …)
// and cleans up the DOM between tests.
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

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
