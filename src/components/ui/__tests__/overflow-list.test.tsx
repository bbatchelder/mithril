import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { OverflowList } from "../overflow-list";

const ITEMS = ["a", "b", "c", "d", "e"];

function renderList(props: Partial<React.ComponentProps<typeof OverflowList<string>>> = {}) {
    const overflowRenderer = vi.fn((items: string[]) => (
        <span data-testid="overflow">{items.join(",")}</span>
    ));
    const result = render(
        <OverflowList<string>
            items={ITEMS}
            visibleItemRenderer={(item) => (
                <span key={item} data-testid={`v-${item}`}>
                    {item}
                </span>
            )}
            overflowRenderer={overflowRenderer}
            {...props}
        />,
    );
    return { ...result, overflowRenderer };
}

const visibleItems = () =>
    ITEMS.filter((i) => screen.queryByTestId(`v-${i}`) != null);

describe("OverflowList", () => {
    // jsdom reports offsetWidth = 0 for everything, so the 1px spacer always reads as
    // "squeezed" → with no width, everything that can collapse does. This makes the
    // collapse behavior deterministic to assert.
    it("collapses every item into the overflow when nothing fits", () => {
        const { overflowRenderer } = renderList();
        expect(visibleItems()).toEqual([]);
        expect(screen.getByTestId("overflow")).toHaveTextContent("a,b,c,d,e");
        // settled overflow includes all items
        expect(overflowRenderer).toHaveBeenLastCalledWith(["a", "b", "c", "d", "e"]);
    });

    it("keeps minVisibleItems from the end when collapseFrom is 'start' (default)", () => {
        renderList({ minVisibleItems: 2 });
        // collapseFrom 'start' collapses leading items → the tail stays visible
        expect(visibleItems()).toEqual(["d", "e"]);
        expect(screen.getByTestId("overflow")).toHaveTextContent("a,b,c");
    });

    it("keeps minVisibleItems from the start when collapseFrom is 'end'", () => {
        renderList({ minVisibleItems: 2, collapseFrom: "end" });
        expect(visibleItems()).toEqual(["a", "b"]);
        expect(screen.getByTestId("overflow")).toHaveTextContent("c,d,e");
    });

    it("invokes onOverflow once the partition settles", () => {
        const onOverflow = vi.fn();
        renderList({ minVisibleItems: 1, onOverflow });
        expect(onOverflow).toHaveBeenCalledTimes(1);
        expect(onOverflow).toHaveBeenLastCalledWith(["a", "b", "c", "d"]);
    });

    it("does not render the overflow element when there is no overflow", () => {
        // Mock a positive spacer width so the list 'fits' and nothing collapses.
        const spy = vi
            .spyOn(HTMLElement.prototype, "offsetWidth", "get")
            .mockReturnValue(100);
        try {
            renderList();
            expect(visibleItems()).toEqual(ITEMS);
            expect(screen.queryByTestId("overflow")).toBeNull();
        } finally {
            spy.mockRestore();
        }
    });

    it("always renders the overflow element when alwaysRenderOverflow is set", () => {
        const spy = vi
            .spyOn(HTMLElement.prototype, "offsetWidth", "get")
            .mockReturnValue(100);
        try {
            renderList({ alwaysRenderOverflow: true });
            expect(visibleItems()).toEqual(ITEMS);
            // Rendered even though the overflow set is empty.
            expect(screen.getByTestId("overflow")).toHaveTextContent("");
        } finally {
            spy.mockRestore();
        }
    });

    it("wraps the list in a labelled nav when navigable", () => {
        renderList({ navigable: true, navigationAriaLabel: "Breadcrumbs" });
        expect(screen.getByRole("navigation", { name: "Breadcrumbs" })).toBeInTheDocument();
    });
});

afterEach(() => {
    vi.restoreAllMocks();
});
