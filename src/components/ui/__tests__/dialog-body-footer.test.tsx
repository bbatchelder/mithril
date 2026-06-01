import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DialogBody, DialogFooter } from "../dialog";

/**
 * Tests scoped to the Dialog sub-components DialogBody and DialogFooter (the main
 * Dialog overlay/focus behavior is covered elsewhere). These are presentational
 * layout wrappers, so the contract is: render children, forward className + arbitrary
 * props + ref to the underlying div, toggle the scrollable/minimal style variants,
 * and lay out footer `actions` separately from `children`. Exact pixel styling is the
 * comparison harness's job; here we lock in the class hooks + composition.
 */

describe("DialogBody", () => {
    it("renders its children", () => {
        render(<DialogBody>Body content</DialogBody>);
        expect(screen.getByText("Body content")).toBeInTheDocument();
    });

    it("forwards className and arbitrary props to the root div", () => {
        render(
            <DialogBody className="custom-body" data-testid="body" aria-label="dialog body">
                x
            </DialogBody>,
        );
        const el = screen.getByTestId("body");
        expect(el).toHaveClass("custom-body");
        expect(el).toHaveAttribute("aria-label", "dialog body");
    });

    it("forwards a ref to the underlying div", () => {
        const ref = createRef<HTMLDivElement>();
        render(<DialogBody ref={ref}>x</DialogBody>);
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it("uses the scrollable overflow container by default", () => {
        render(<DialogBody data-testid="body">x</DialogBody>);
        // Default scrollable=true → max-h-[70vh] + overflow-auto + padding.
        const el = screen.getByTestId("body");
        expect(el).toHaveClass("overflow-auto");
        expect(el).toHaveClass("max-h-[70vh]");
    });

    it("uses the margin-only (non-scroll) style when scrollable is false", () => {
        render(
            <DialogBody data-testid="body" scrollable={false}>
                x
            </DialogBody>,
        );
        const el = screen.getByTestId("body");
        expect(el).toHaveClass("m-4");
        expect(el).not.toHaveClass("overflow-auto");
    });
});

describe("DialogFooter", () => {
    it("renders left-side children and right-aligned actions", () => {
        render(
            <DialogFooter actions={<button>Save</button>}>
                <span>Footer note</span>
            </DialogFooter>,
        );
        expect(screen.getByText("Footer note")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    });

    it("renders without actions", () => {
        render(<DialogFooter data-testid="footer">just children</DialogFooter>);
        expect(screen.getByText("just children")).toBeInTheDocument();
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("forwards className, props, and ref", () => {
        const ref = createRef<HTMLDivElement>();
        render(
            <DialogFooter ref={ref} className="custom-footer" data-testid="footer">
                x
            </DialogFooter>,
        );
        const el = screen.getByTestId("footer");
        expect(el).toHaveClass("custom-footer");
        expect(ref.current).toBe(el);
    });

    it("uses the fixed/prominent footer style by default", () => {
        render(<DialogFooter data-testid="footer">x</DialogFooter>);
        // Default minimal=false → border-top divider + bottom rounding.
        const el = screen.getByTestId("footer");
        expect(el).toHaveClass("border-t");
        expect(el).toHaveClass("rounded-b-bp");
    });

    it("uses the margin-only minimal style when minimal is set", () => {
        render(
            <DialogFooter data-testid="footer" minimal>
                x
            </DialogFooter>,
        );
        const el = screen.getByTestId("footer");
        expect(el).toHaveClass("m-4");
        expect(el).not.toHaveClass("border-t");
    });

    it("right-aligns the actions container with a left-margin gap between buttons", () => {
        render(
            <DialogFooter actions={<button>A</button>}>
                <span>main</span>
            </DialogFooter>,
        );
        const actionBtn = screen.getByRole("button", { name: "A" });
        // The actions wrapper applies justify-end + the [&>*+*]:ml-2 sibling gap.
        expect(actionBtn.parentElement).toHaveClass("justify-end");
    });
});
