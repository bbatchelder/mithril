import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ResizeSensor } from "../resize-sensor";

// setup.ts installs a no-op ResizeObserver stub; replace it with a controllable
// mock so we can drive onResize and assert what gets observed.
class MockResizeObserver {
    static instances: MockResizeObserver[] = [];
    callback: ResizeObserverCallback;
    observed: Element[] = [];
    constructor(cb: ResizeObserverCallback) {
        this.callback = cb;
        MockResizeObserver.instances.push(this);
    }
    observe(el: Element) {
        this.observed.push(el);
    }
    unobserve() {}
    disconnect() {}
    trigger(entries: Partial<ResizeObserverEntry>[]) {
        this.callback(entries as ResizeObserverEntry[], this as unknown as ResizeObserver);
    }
}

const originalRO = globalThis.ResizeObserver;
beforeEach(() => {
    MockResizeObserver.instances = [];
    globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
});
afterEach(() => {
    globalThis.ResizeObserver = originalRO;
});

describe("ResizeSensor", () => {
    it("renders its single element child", () => {
        const { getByTestId } = render(
            <ResizeSensor onResize={() => {}}>
                <div data-testid="child">content</div>
            </ResizeSensor>,
        );
        expect(getByTestId("child")).toHaveTextContent("content");
    });

    it("observes the child element", () => {
        const { getByTestId } = render(
            <ResizeSensor onResize={() => {}}>
                <div data-testid="child" />
            </ResizeSensor>,
        );
        const observer = MockResizeObserver.instances[0];
        expect(observer.observed).toContain(getByTestId("child"));
    });

    it("invokes onResize when the observer fires", () => {
        const onResize = vi.fn();
        render(
            <ResizeSensor onResize={onResize}>
                <div data-testid="child" />
            </ResizeSensor>,
        );
        const observer = MockResizeObserver.instances[0];
        act(() => observer.trigger([{ contentRect: { width: 120 } as DOMRectReadOnly }]));
        expect(onResize).toHaveBeenCalledTimes(1);
        expect(onResize.mock.calls[0][0][0].contentRect.width).toBe(120);
    });

    it("uses the latest onResize without re-subscribing", () => {
        const first = vi.fn();
        const second = vi.fn();
        const { rerender } = render(
            <ResizeSensor onResize={first}>
                <div />
            </ResizeSensor>,
        );
        rerender(
            <ResizeSensor onResize={second}>
                <div />
            </ResizeSensor>,
        );
        // Still the same single observer — no teardown/re-create on callback change.
        expect(MockResizeObserver.instances).toHaveLength(1);
        act(() => MockResizeObserver.instances[0].trigger([{} as ResizeObserverEntry]));
        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledTimes(1);
    });

    it("observes ancestor elements when observeParents is set", () => {
        const { getByTestId } = render(
            <section data-testid="grandparent">
                <ResizeSensor onResize={() => {}} observeParents>
                    <div data-testid="child" />
                </ResizeSensor>
            </section>,
        );
        const observer = MockResizeObserver.instances[0];
        expect(observer.observed).toContain(getByTestId("child"));
        expect(observer.observed).toContain(getByTestId("grandparent"));
    });

    it("preserves a caller-supplied ref on the child", () => {
        const onResize = vi.fn();
        let captured: HTMLElement | null = null;
        function Harness() {
            return (
                <ResizeSensor onResize={onResize}>
                    <div data-testid="child" ref={(el) => (captured = el)} />
                </ResizeSensor>
            );
        }
        const { getByTestId } = render(<Harness />);
        expect(captured).toBe(getByTestId("child"));
    });
});
