import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "../button";
import { ButtonGroup } from "../button-group";

/**
 * ButtonGroup is a styling/layout wrapper, so its contract is: (1) it groups its
 * buttons semantically, and (2) it pushes `variant`/`size` defaults down to child
 * `<Button>`s via context, with an explicit per-button prop always winning. The
 * attached-border *visuals* are verified by the comparison harness; here we lock in
 * the role and the context-propagation behavior the harness can't see.
 */
describe("ButtonGroup — structure", () => {
    it("renders a group containing its buttons", () => {
        render(
            <ButtonGroup>
                <Button>First</Button>
                <Button>Last</Button>
            </ButtonGroup>,
        );
        const group = screen.getByRole("group");
        expect(group).toBeInTheDocument();
        expect(group.querySelectorAll("button")).toHaveLength(2);
    });

    it("forwards arbitrary props (and lets the consumer override role)", () => {
        render(
            <ButtonGroup role="toolbar" aria-label="Text formatting">
                <Button>Bold</Button>
            </ButtonGroup>,
        );
        const toolbar = screen.getByRole("toolbar", { name: "Text formatting" });
        expect(toolbar).toBeInTheDocument();
    });
});

describe("ButtonGroup — variant/size propagation", () => {
    it("applies the group variant to child buttons", () => {
        render(
            <ButtonGroup variant="outlined">
                <Button>Outlined child</Button>
            </ButtonGroup>,
        );
        // outlined buttons are transparent + bordered (vs solid's shadow).
        expect(screen.getByRole("button", { name: "Outlined child" })).toHaveClass("bg-transparent");
    });

    it("lets an explicit button variant override the group", () => {
        render(
            <ButtonGroup variant="outlined">
                <Button variant="solid">Solid child</Button>
            </ButtonGroup>,
        );
        expect(screen.getByRole("button", { name: "Solid child" })).toHaveClass("shadow-button");
    });

    it("applies the group size to child buttons", () => {
        render(
            <ButtonGroup size="large">
                <Button>Large child</Button>
            </ButtonGroup>,
        );
        // large => h-10 per buttonVariants.
        expect(screen.getByRole("button", { name: "Large child" })).toHaveClass("h-10");
    });

    it("lets an explicit button size override the group", () => {
        render(
            <ButtonGroup size="large">
                <Button size="small">Small child</Button>
            </ButtonGroup>,
        );
        expect(screen.getByRole("button", { name: "Small child" })).toHaveClass("h-6");
    });

    it("defaults to solid when no variant is set", () => {
        render(
            <ButtonGroup>
                <Button>Default child</Button>
            </ButtonGroup>,
        );
        expect(screen.getByRole("button", { name: "Default child" })).toHaveClass("shadow-button");
    });
});

describe("ButtonGroup — layout", () => {
    it("stacks vertically when `vertical` is set", () => {
        render(
            <ButtonGroup vertical>
                <Button>A</Button>
            </ButtonGroup>,
        );
        expect(screen.getByRole("group")).toHaveClass("flex-col");
    });

    it("fills its container when `fill` is set", () => {
        render(
            <ButtonGroup fill>
                <Button>A</Button>
            </ButtonGroup>,
        );
        expect(screen.getByRole("group")).toHaveClass("w-full");
    });
});
