import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { AnchorButton } from "../anchor-button";
import { ButtonGroup } from "../button-group";

/**
 * AnchorButton is an `<a>` that reuses Button's `buttonVariants` styling but adds anchor +
 * disabled semantics (anchors can't be natively `disabled`). The visual parity with Button is
 * verified by the comparison harness; here we lock in the behavior the harness can't see:
 * the element/role, the shared style classes, ButtonGroup context propagation, content
 * rendering, and — most importantly — the disabled-anchor contract (no href, out of tab order,
 * aria-disabled, and activation suppressed). An enabled anchor with an href keeps its native
 * `link` role; only the non-link cases (disabled, or no href) get `role="button"`.
 */
describe("AnchorButton — element & styling", () => {
    it("renders an <a> element styled with button classes", () => {
        render(<AnchorButton href="/x">Link</AnchorButton>);
        const el = screen.getByRole("link", { name: "Link" });
        expect(el.tagName).toBe("A");
        // shares Button's base + default solid look.
        expect(el).toHaveClass("inline-flex", "rounded-bp", "shadow-button");
        expect(el).toHaveAttribute("href", "/x");
    });

    it("applies variant / size / intent classes from the shared buttonVariants", () => {
        render(
            <AnchorButton href="#" variant="outlined" size="large" intent="primary">
                Styled
            </AnchorButton>,
        );
        const el = screen.getByRole("link", { name: "Styled" });
        // outlined => transparent + bordered; large => h-10; primary outlined => minimal intent text token.
        expect(el).toHaveClass("bg-transparent", "border", "h-10", "text-intent-primary-minimal-text");
    });

    it("forwards its ref to the anchor element", () => {
        const ref = createRef<HTMLAnchorElement>();
        render(
            <AnchorButton href="#" ref={ref}>
                Ref
            </AnchorButton>,
        );
        expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
        expect(ref.current?.tagName).toBe("A");
    });
});

describe("AnchorButton — link vs button role", () => {
    it("exposes the native link role for an enabled anchor with an href", () => {
        render(<AnchorButton href="/go">Go</AnchorButton>);
        const el = screen.getByRole("link", { name: "Go" });
        // A real link must not be masquerading as a button.
        expect(el).not.toHaveAttribute("role");
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("falls back to role=button when used without an href (button-like usage)", () => {
        render(<AnchorButton onClick={() => {}}>Act</AnchorButton>);
        const el = screen.getByRole("button", { name: "Act" });
        expect(el).toHaveAttribute("role", "button");
        expect(el).not.toHaveAttribute("href");
        // Still focusable so it can be operated as a control.
        expect(el).toHaveAttribute("tabindex", "0");
    });

    it("uses role=button (not link) when disabled, even with an href passed", () => {
        render(
            <AnchorButton href="/x" disabled>
                Off
            </AnchorButton>,
        );
        const el = screen.getByRole("button", { name: "Off" });
        expect(el).toHaveAttribute("role", "button");
        expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });
});

describe("AnchorButton — content", () => {
    it("renders icon, text, and endIcon", () => {
        render(
            <AnchorButton href="#" icon={<span data-testid="lead" />} endIcon={<span data-testid="trail" />}>
                Label
            </AnchorButton>,
        );
        const el = screen.getByRole("link", { name: "Label" });
        expect(screen.getByTestId("lead")).toBeInTheDocument();
        expect(screen.getByTestId("trail")).toBeInTheDocument();
        expect(el).toHaveTextContent("Label");
    });
});

describe("AnchorButton — ButtonGroup context", () => {
    it("inherits variant and size defaults from a parent ButtonGroup", () => {
        render(
            <ButtonGroup variant="outlined" size="large">
                <AnchorButton href="#">Child</AnchorButton>
            </ButtonGroup>,
        );
        const el = screen.getByRole("link", { name: "Child" });
        expect(el).toHaveClass("bg-transparent", "h-10");
    });

    it("lets an explicit prop override the group default", () => {
        render(
            <ButtonGroup variant="outlined">
                <AnchorButton href="#" variant="solid">
                    Solid child
                </AnchorButton>
            </ButtonGroup>,
        );
        expect(screen.getByRole("link", { name: "Solid child" })).toHaveClass("shadow-button");
    });
});

describe("AnchorButton — disabled anchor semantics", () => {
    it("sets aria-disabled, removes href, and leaves the tab order", () => {
        render(
            <AnchorButton href="/should-be-removed" disabled>
                Off
            </AnchorButton>,
        );
        const el = screen.getByRole("button", { name: "Off" });
        expect(el).toHaveAttribute("aria-disabled", "true");
        expect(el).not.toHaveAttribute("href");
        expect(el).toHaveAttribute("tabindex", "-1");
        expect(el).toHaveClass("pointer-events-none");
    });

    it("does not fire onClick when disabled", async () => {
        const onClick = vi.fn();
        render(
            <AnchorButton href="#" disabled onClick={onClick}>
                Off
            </AnchorButton>,
        );
        // pointer-events-none blocks real pointer clicks; fire the handler directly to prove
        // the guard short-circuits even if the event reaches it.
        const el = screen.getByRole("button", { name: "Off" });
        el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        expect(onClick).not.toHaveBeenCalled();
    });

    it("fires onClick when enabled", async () => {
        const onClick = vi.fn();
        render(
            <AnchorButton href="#" onClick={onClick}>
                On
            </AnchorButton>,
        );
        await userEvent.click(screen.getByRole("link", { name: "On" }));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("treats loading as disabled (no href, aria-busy)", () => {
        render(
            <AnchorButton href="/x" loading>
                Busy
            </AnchorButton>,
        );
        const el = screen.getByRole("button", { name: "Busy" });
        expect(el).toHaveAttribute("aria-disabled", "true");
        expect(el).not.toHaveAttribute("href");
        expect(el).toHaveAttribute("aria-busy", "true");
    });
});
