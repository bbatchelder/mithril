import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { MenuItem } from "../menu";
import { Suggest } from "../suggest";

// NOTE: Suggest shares useQueryList with Select, so the arrow-key engine is covered by
// select.test.tsx. Here we verify Suggest's own ARIA wiring + filtering + selection.

const ITEMS = ["Apple", "Banana", "Cherry"];

function SuggestHarness({ onSelect }: { onSelect?: (v: string) => void }) {
    const [selected, setSelected] = useState<string | null>(null);
    return (
        <Suggest<string>
            items={ITEMS}
            inputValueRenderer={(item) => item}
            itemPredicate={(q, item) => item.toLowerCase().includes(q.toLowerCase())}
            selectedItem={selected}
            onItemSelect={(item) => {
                setSelected(item);
                onSelect?.(item);
            }}
            itemRenderer={(item, { modifiers, handleClick }) => (
                <MenuItem key={item} text={item} active={modifiers.active} onClick={handleClick} />
            )}
            inputProps={{ placeholder: "Search…" }}
        />
    );
}

// Suggest opens on focus (a click while focused would toggle it shut).
async function openByFocus() {
    const combobox = screen.getByRole("combobox");
    combobox.focus();
    await screen.findByRole("listbox");
    return combobox;
}

describe("Suggest — combobox ARIA", () => {
    it("the type-ahead input is a combobox owning a listbox of options", async () => {
        render(<SuggestHarness />);

        const combobox = screen.getByRole("combobox");
        expect(combobox).toHaveAttribute("aria-autocomplete", "list");
        expect(combobox).toHaveAttribute("aria-haspopup", "listbox");

        await openByFocus();
        expect(combobox).toHaveAttribute("aria-expanded", "true");

        const listbox = screen.getByRole("listbox");
        expect(combobox).toHaveAttribute("aria-controls", listbox.id);
        const options = within(listbox).getAllByRole("option");
        expect(options).toHaveLength(3);

        // An option is highlighted and reflected on the input.
        expect(combobox).toHaveAttribute("aria-activedescendant", options[0].id);
    });

    it("gives the combobox an accessible name (not just a placeholder)", async () => {
        // A placeholder is not an accessible name (WCAG 4.1.2 / 2.4.6); default it to
        // the placeholder text so the combobox resolves a non-empty name.
        render(<SuggestHarness />);
        expect(screen.getByRole("combobox", { name: "Search…" })).toBeInTheDocument();
    });

    it("filters options as the user types", async () => {
        const user = userEvent.setup();
        render(<SuggestHarness />);

        const combobox = await openByFocus();
        await user.type(combobox, "ch");

        const options = screen.getAllByRole("option");
        expect(options).toHaveLength(1);
        expect(options[0]).toHaveTextContent("Cherry");
    });

    it("selects an option on click and marks it aria-selected on reopen", async () => {
        const onSelect = vi.fn();
        // Radix's popover layering sets pointer-events on ancestors; skip the check.
        const user = userEvent.setup({ pointerEventsCheck: 0 });
        render(<SuggestHarness onSelect={onSelect} />);

        await openByFocus();
        // The option (role="option") is itself the click target — in a listbox the option
        // must NOT contain a nested interactive control (focus stays on the combobox input).
        await user.click(screen.getByRole("option", { name: "Banana" }));
        expect(onSelect).toHaveBeenCalledWith("Banana");

        const combobox = await openByFocus();
        expect(screen.getByRole("option", { name: "Banana" })).toHaveAttribute("aria-selected", "true");
        expect(screen.getByRole("option", { name: "Apple" })).toHaveAttribute("aria-selected", "false");
        expect(combobox).toBeInTheDocument();
    });
});
