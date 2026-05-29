import { render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { MenuItem } from "../menu";
import { MultiSelect } from "../multi-select";

// Shares useQueryList with Select (arrow engine covered there). Here: MultiSelect's
// own combobox/listbox(multiselectable) ARIA + multi-selection aria-selected.

const ITEMS = ["Apple", "Banana", "Cherry"];

function MultiSelectHarness() {
    const [selected, setSelected] = useState<string[]>([]);
    return (
        <MultiSelect<string>
            items={ITEMS}
            selectedItems={selected}
            tagRenderer={(item) => item}
            itemPredicate={(q, item) => item.toLowerCase().includes(q.toLowerCase())}
            onItemSelect={(item) => setSelected((prev) => (prev.includes(item) ? prev : [...prev, item]))}
            onRemove={(item) => setSelected((prev) => prev.filter((x) => x !== item))}
            itemRenderer={(item, { modifiers, handleClick }) => (
                <MenuItem
                    key={item}
                    text={item}
                    active={modifiers.active}
                    onClick={handleClick}
                    icon={selected.includes(item) ? "tick" : undefined}
                />
            )}
        />
    );
}

async function openByFocus() {
    const combobox = screen.getByRole("combobox");
    combobox.focus();
    await screen.findByRole("listbox");
    return combobox;
}

describe("MultiSelect — combobox ARIA", () => {
    it("the ghost input is a combobox owning a multiselectable listbox", async () => {
        render(<MultiSelectHarness />);

        const combobox = screen.getByRole("combobox");
        expect(combobox).toHaveAttribute("aria-autocomplete", "list");
        expect(combobox).toHaveAttribute("aria-haspopup", "listbox");

        await openByFocus();
        expect(combobox).toHaveAttribute("aria-expanded", "true");

        const listbox = screen.getByRole("listbox");
        expect(listbox).toHaveAttribute("aria-multiselectable", "true");
        expect(combobox).toHaveAttribute("aria-controls", listbox.id);
        expect(within(listbox).getAllByRole("option")).toHaveLength(3);
    });

    it("marks chosen options aria-selected (multiple)", async () => {
        // Drive selectedItems directly — clicking a portaled option in jsdom races the
        // blur-close, so assert the aria-selected wiring with controlled selection.
        render(
            <MultiSelect<string>
                items={ITEMS}
                selectedItems={["Apple", "Cherry"]}
                tagRenderer={(item) => item}
                itemPredicate={(q, item) => item.toLowerCase().includes(q.toLowerCase())}
                onItemSelect={() => {}}
                onRemove={() => {}}
                itemRenderer={(item, { modifiers, handleClick }) => (
                    <MenuItem key={item} text={item} active={modifiers.active} onClick={handleClick} />
                )}
            />,
        );

        await openByFocus();
        expect(screen.getByRole("option", { name: "Apple" })).toHaveAttribute("aria-selected", "true");
        expect(screen.getByRole("option", { name: "Cherry" })).toHaveAttribute("aria-selected", "true");
        expect(screen.getByRole("option", { name: "Banana" })).toHaveAttribute("aria-selected", "false");
    });
});
