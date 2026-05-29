import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { Button } from "../button";
import { MenuItem } from "../menu";
import { Select } from "../select";

/**
 * WAI-ARIA combobox tests for Select: input role=combobox owning a role=listbox of
 * role=option items, with aria-activedescendant tracking the highlighted option.
 */

const ITEMS = ["Apple", "Banana", "Cherry"];

function SelectHarness({ onSelect }: { onSelect?: (v: string) => void }) {
    const [selected, setSelected] = useState<string | null>(null);
    return (
        <Select<string>
            items={ITEMS}
            itemPredicate={(q, item) => item.toLowerCase().includes(q.toLowerCase())}
            selectedItem={selected}
            onItemSelect={(item) => {
                setSelected(item);
                onSelect?.(item);
            }}
            itemRenderer={(item, { modifiers, handleClick }) => (
                <MenuItem
                    key={item}
                    text={item}
                    active={modifiers.active}
                    onClick={handleClick}
                    icon={item === selected ? "tick" : undefined}
                />
            )}
        >
            <Button>Pick a fruit</Button>
        </Select>
    );
}

async function open() {
    const user = userEvent.setup();
    render(<SelectHarness />);
    await user.click(screen.getByRole("button", { name: "Pick a fruit" }));
    return user;
}

describe("Select — combobox ARIA", () => {
    it("exposes a combobox input owning a listbox of options", async () => {
        await open();

        const combobox = screen.getByRole("combobox");
        expect(combobox).toHaveAttribute("aria-expanded", "true");
        expect(combobox).toHaveAttribute("aria-autocomplete", "list");
        expect(combobox).toHaveAttribute("aria-haspopup", "listbox");

        const listbox = screen.getByRole("listbox");
        expect(combobox).toHaveAttribute("aria-controls", listbox.id);

        const options = within(listbox).getAllByRole("option");
        expect(options).toHaveLength(3);
        expect(options[0]).toHaveTextContent("Apple");
    });

    it("gives the combobox an accessible name (not just a placeholder)", async () => {
        // A placeholder is not an accessible name (WCAG 4.1.2 / 2.4.6); default it to
        // the placeholder text so the combobox resolves a non-empty name.
        await open();
        expect(screen.getByRole("combobox", { name: "Filter..." })).toBeInTheDocument();
    });

    it("tracks the highlighted option via aria-activedescendant", async () => {
        const user = await open();
        const combobox = screen.getByRole("combobox");
        combobox.focus();
        const options = screen.getAllByRole("option");

        // The first option is pre-highlighted on open (Blueprint behavior).
        expect(combobox).toHaveAttribute("aria-activedescendant", options[0].id);

        await user.keyboard("{ArrowDown}");
        expect(combobox).toHaveAttribute("aria-activedescendant", options[1].id);
    });

    it("filters options as the query changes", async () => {
        const user = await open();
        await user.keyboard("an"); // matches "Banana"
        const options = screen.getAllByRole("option");
        expect(options).toHaveLength(1);
        expect(options[0]).toHaveTextContent("Banana");
    });

    it("selects the highlighted option on Enter and closes", async () => {
        const onSelect = vi.fn();
        const user = userEvent.setup();
        render(<SelectHarness onSelect={onSelect} />);
        await user.click(screen.getByRole("button", { name: "Pick a fruit" }));

        const combobox = screen.getByRole("combobox");
        combobox.focus();
        // Apple is pre-highlighted on open → Enter selects it.
        await user.keyboard("{Enter}");

        expect(onSelect).toHaveBeenCalledWith("Apple");
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("marks the selected option aria-selected after reopening", async () => {
        const user = userEvent.setup();
        render(<SelectHarness />);
        await user.click(screen.getByRole("button", { name: "Pick a fruit" }));
        let combobox = screen.getByRole("combobox");
        combobox.focus();
        await user.keyboard("{ArrowDown}{Enter}"); // Apple(active) → ArrowDown → Banana → select

        await user.click(screen.getByRole("button", { name: "Pick a fruit" }));
        combobox = screen.getByRole("combobox");
        const banana = screen.getByRole("option", { name: /Banana/ });
        expect(banana).toHaveAttribute("aria-selected", "true");
        expect(screen.getByRole("option", { name: "Apple" })).toHaveAttribute("aria-selected", "false");
    });
});
