import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Menu, MenuItem } from "../menu";

/**
 * ARIA tests for Menu/MenuItem roleStructure — the shared foundation the combobox
 * family (role=listbox/option) and menus (role=menu/menuitem) build on.
 */

describe("Menu container", () => {
    it("defaults to role=menu", () => {
        render(
            <Menu>
                <MenuItem text="A" />
            </Menu>,
        );
        expect(screen.getByRole("menu")).toBeInTheDocument();
    });

    it("can be overridden to role=listbox", () => {
        render(
            <Menu role="listbox" aria-label="Options">
                <MenuItem text="A" roleStructure="listoption" />
            </Menu>,
        );
        expect(screen.getByRole("listbox", { name: "Options" })).toBeInTheDocument();
    });
});

describe("MenuItem roleStructure", () => {
    it("menuitem (default): li role=none, inner role=menuitem", () => {
        render(
            <Menu>
                <MenuItem text="Open" />
            </Menu>,
        );
        const item = screen.getByRole("menuitem", { name: "Open" });
        expect(item.tagName).toBe("BUTTON");
        // The <li> wrapper is presentational.
        expect(item.closest("li")).toHaveAttribute("role", "none");
    });

    it("listoption: li role=option with aria-selected; inner has no role", () => {
        render(
            <Menu role="listbox" aria-label="Fruit">
                <MenuItem text="Apple" roleStructure="listoption" selected />
                <MenuItem text="Banana" roleStructure="listoption" />
            </Menu>,
        );
        const apple = screen.getByRole("option", { name: "Apple" });
        const banana = screen.getByRole("option", { name: "Banana" });

        expect(apple.tagName).toBe("LI");
        expect(apple).toHaveAttribute("aria-selected", "true");
        expect(banana).toHaveAttribute("aria-selected", "false");

        // No nested menuitem role inside an option.
        expect(screen.queryByRole("menuitem")).not.toBeInTheDocument();
    });

    it("none: li role=none and inner has no role", () => {
        render(
            <Menu role="presentation">
                <MenuItem text="Plain" roleStructure="none" />
            </Menu>,
        );
        expect(screen.queryByRole("menuitem")).not.toBeInTheDocument();
        expect(screen.queryByRole("option")).not.toBeInTheDocument();
        expect(screen.getByText("Plain").closest("li")).toHaveAttribute("role", "none");
    });

    it("forwards an id onto the option <li> (for aria-activedescendant)", () => {
        render(
            <Menu role="listbox" aria-label="X">
                <MenuItem id="opt-1" text="One" roleStructure="listoption" />
            </Menu>,
        );
        const opt = screen.getByRole("option", { name: "One" });
        expect(opt).toHaveAttribute("id", "opt-1");
    });
});
