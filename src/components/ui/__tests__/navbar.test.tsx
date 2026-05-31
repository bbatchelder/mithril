import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Navbar, NavbarDivider, NavbarGroup, NavbarHeading } from "../navbar";

/**
 * Navbar is a layout/styling shell built from plain <div>s (no ARIA roles of its
 * own — it's a container for Buttons/Headings/Dividers). The visual harness covers
 * the pixel fidelity; here we lock in structure, alignment, content, and prop
 * pass-through that the harness can't assert.
 */

describe("Navbar — structure", () => {
    it("renders its children inside the bar", () => {
        render(
            <Navbar>
                <NavbarGroup align="left">
                    <NavbarHeading>My App</NavbarHeading>
                </NavbarGroup>
            </Navbar>,
        );
        expect(screen.getByText("My App")).toBeInTheDocument();
    });

    it("lays out as a horizontal flex bar with space-between (left/right groups)", () => {
        const { container } = render(
            <Navbar>
                <NavbarGroup align="left">L</NavbarGroup>
                <NavbarGroup align="right">R</NavbarGroup>
            </Navbar>,
        );
        const bar = container.firstChild as HTMLElement;
        expect(bar).toHaveClass("flex");
        expect(bar).toHaveClass("items-center");
        expect(bar).toHaveClass("justify-between");
    });

    it("forwards arbitrary props (role/aria) onto the root element", () => {
        render(
            <Navbar role="navigation" aria-label="Primary">
                <NavbarGroup>Home</NavbarGroup>
            </Navbar>,
        );
        const nav = screen.getByRole("navigation", { name: "Primary" });
        expect(nav).toBeInTheDocument();
        expect(nav).toHaveTextContent("Home");
    });

    it("applies position:fixed to the top when `fixedTop` is set", () => {
        const { container } = render(
            <Navbar fixedTop>
                <NavbarGroup>Fixed</NavbarGroup>
            </Navbar>,
        );
        const bar = container.firstChild as HTMLElement;
        expect(bar).toHaveClass("fixed");
        expect(bar).toHaveClass("top-0");
    });

    it("is relatively positioned (not fixed) by default", () => {
        const { container } = render(
            <Navbar>
                <NavbarGroup>Static</NavbarGroup>
            </Navbar>,
        );
        const bar = container.firstChild as HTMLElement;
        expect(bar).toHaveClass("relative");
        expect(bar).not.toHaveClass("fixed");
    });
});

describe("NavbarGroup — alignment", () => {
    it("renders a flex container holding its children", () => {
        const { container } = render(
            <NavbarGroup align="left">
                <span>A</span>
                <span>B</span>
            </NavbarGroup>,
        );
        const group = container.firstChild as HTMLElement;
        expect(group).toHaveClass("flex");
        expect(group).toHaveClass("items-center");
        expect(group.querySelectorAll("span")).toHaveLength(2);
    });

    it("forwards className and data attributes", () => {
        const { container } = render(
            <NavbarGroup align="right" className="custom-group" data-side="right">
                Right
            </NavbarGroup>,
        );
        const group = container.firstChild as HTMLElement;
        expect(group).toHaveClass("custom-group");
        expect(group).toHaveAttribute("data-side", "right");
    });
});

describe("NavbarHeading", () => {
    it("renders heading text at the large body type size", () => {
        const { container } = render(<NavbarHeading>App Title</NavbarHeading>);
        const heading = container.firstChild as HTMLElement;
        expect(heading).toHaveTextContent("App Title");
        expect(heading).toHaveClass("text-body-lg");
    });
});

describe("NavbarDivider", () => {
    it("renders a thin vertical separator (border-left, fixed height)", () => {
        const { container } = render(<NavbarDivider />);
        const divider = container.firstChild as HTMLElement;
        expect(divider).toHaveClass("border-l");
        expect(divider).toHaveClass("border-divider");
        expect(divider).toHaveClass("h-5");
        // No textual content — it's a presentational line.
        expect(divider).toBeEmptyDOMElement();
    });
});
