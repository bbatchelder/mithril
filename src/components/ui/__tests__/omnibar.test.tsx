import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MenuItem } from "../menu";
import { Omnibar } from "../omnibar";

const ITEMS = ["Apple", "Banana", "Cherry"];

function OmnibarHarness({ onSelect }: { onSelect?: (v: string) => void }) {
    return (
        <Omnibar<string>
            isOpen
            onClose={() => {}}
            items={ITEMS}
            itemPredicate={(q, item) => item.toLowerCase().includes(q.toLowerCase())}
            onItemSelect={(item) => onSelect?.(item)}
            itemRenderer={(item, { modifiers, handleClick }) => (
                <MenuItem key={item} text={item} active={modifiers.active} onClick={handleClick} />
            )}
        />
    );
}

describe("Omnibar — combobox ARIA", () => {
    it("exposes a combobox search input owning a listbox of options", () => {
        render(<OmnibarHarness />);

        const combobox = screen.getByRole("combobox");
        expect(combobox).toHaveAttribute("aria-autocomplete", "list");
        expect(combobox).toHaveAttribute("aria-haspopup", "listbox");
        expect(combobox).toHaveAttribute("aria-expanded", "true");

        const listbox = screen.getByRole("listbox");
        expect(combobox).toHaveAttribute("aria-controls", listbox.id);
        expect(within(listbox).getAllByRole("option")).toHaveLength(3);

        // Still inside an accessible dialog wrapper.
        expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("gives the search combobox its own accessible name", () => {
        // The dialog is labelled "Omnibar", but a placeholder is not an accessible name
        // for the input (WCAG 4.1.2 / 2.4.6) — it carries an explicit "Search" name.
        render(<OmnibarHarness />);
        expect(screen.getByRole("combobox", { name: "Search" })).toBeInTheDocument();
    });

    it("tracks the highlighted option and selects on Enter", async () => {
        const onSelect = vi.fn();
        const user = userEvent.setup();
        render(<OmnibarHarness onSelect={onSelect} />);

        const combobox = screen.getByRole("combobox");
        combobox.focus();
        const options = screen.getAllByRole("option");
        expect(combobox).toHaveAttribute("aria-activedescendant", options[0].id);

        await user.keyboard("{ArrowDown}");
        expect(combobox).toHaveAttribute("aria-activedescendant", options[1].id);

        await user.keyboard("{Enter}");
        expect(onSelect).toHaveBeenCalledWith("Banana");
    });

    it("filters options as the user types", async () => {
        const user = userEvent.setup();
        render(<OmnibarHarness />);

        const combobox = screen.getByRole("combobox");
        combobox.focus();
        await user.keyboard("ap");

        const options = screen.getAllByRole("option");
        expect(options).toHaveLength(1);
        expect(options[0]).toHaveTextContent("Apple");
    });
});
