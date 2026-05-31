import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ContextMenu } from "../context-menu";
import { Menu, MenuDivider, MenuItem } from "../menu";

function ContextMenuHarness({ onOpen }: { onOpen?: () => void }) {
    return (
        <ContextMenu
            content={
                <Menu>
                    <MenuItem text="Open" onClick={onOpen} />
                    <MenuItem text="Rename" />
                    <MenuDivider />
                    <MenuItem text="Delete" intent="danger" />
                </Menu>
            }
        >
            <div>Right-click me</div>
        </ContextMenu>
    );
}

function openMenu() {
    fireEvent.contextMenu(screen.getByText("Right-click me"));
}

describe("ContextMenu — Radix-driven items", () => {
    it("renders the content as a role=menu of role=menuitem items", () => {
        render(<ContextMenuHarness />);
        openMenu();

        const menu = screen.getByRole("menu");
        const items = within(menu).getAllByRole("menuitem");
        expect(items.map((i) => i.textContent)).toEqual(["Open", "Rename", "Delete"]);

        // The consumer's <ul> Menu is presentational (Radix Content is the menu).
        expect(within(menu).queryAllByRole("menu")).toHaveLength(0);
    });

    it("supports arrow-key navigation (provided by Radix)", async () => {
        const user = userEvent.setup();
        render(<ContextMenuHarness />);
        openMenu();

        // Radix focuses the menu/first item on open; ArrowDown moves between items.
        await user.keyboard("{ArrowDown}");
        expect(screen.getByRole("menuitem", { name: "Open" })).toHaveFocus();

        await user.keyboard("{ArrowDown}");
        expect(screen.getByRole("menuitem", { name: "Rename" })).toHaveFocus();

        // The divider is skipped — next is Delete.
        await user.keyboard("{ArrowDown}");
        expect(screen.getByRole("menuitem", { name: "Delete" })).toHaveFocus();
    });

    it("activates an item on Enter", async () => {
        const onOpen = vi.fn();
        const user = userEvent.setup();
        render(<ContextMenuHarness onOpen={onOpen} />);
        openMenu();

        await user.keyboard("{ArrowDown}"); // focus "Open"
        await user.keyboard("{Enter}");
        expect(onOpen).toHaveBeenCalled();
    });
});
