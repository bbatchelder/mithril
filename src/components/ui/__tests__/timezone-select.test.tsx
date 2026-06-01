import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { TimezoneSelect } from "../timezone-select";

/**
 * TimezoneSelect is a specialized Select over the static IANA timezone list. The
 * combobox/listbox ARIA + filtering belong to Select (covered in select.test); here
 * we lock in TimezoneSelect's own contract: the trigger button + placeholder, the
 * composite display of a controlled value, the value-shape passed to onChange (an
 * IANA code string), uncontrolled selection updating the trigger, and the minimal
 * initial list. We pin `date` to a fixed instant so DST-derived offset strings are
 * deterministic regardless of when the suite runs.
 */

// Fixed reference date → stable, DST-independent offset computation.
const FIXED_DATE = new Date("2026-01-15T12:00:00Z");

describe("TimezoneSelect — trigger", () => {
    it("shows the placeholder when nothing is selected", () => {
        render(<TimezoneSelect onChange={() => {}} date={FIXED_DATE} />);
        expect(
            screen.getByRole("button", { name: /Select timezone/i }),
        ).toBeInTheDocument();
    });

    it("honors a custom placeholder", () => {
        render(
            <TimezoneSelect onChange={() => {}} date={FIXED_DATE} placeholder="Pick a zone" />,
        );
        expect(screen.getByRole("button", { name: /Pick a zone/i })).toBeInTheDocument();
    });

    it("renders a composite label for a controlled value", () => {
        render(
            <TimezoneSelect value="America/New_York" onChange={() => {}} date={FIXED_DATE} />,
        );
        // formatComposite → "New York (EST) -05:00"; assert on the stable label fragment.
        expect(screen.getByRole("button", { name: /New York/ })).toBeInTheDocument();
    });

    it("disables the trigger when disabled is set", () => {
        render(<TimezoneSelect onChange={() => {}} date={FIXED_DATE} disabled />);
        expect(screen.getByRole("button")).toBeDisabled();
    });
});

describe("TimezoneSelect — list & selection", () => {
    it("opens a listbox of timezone options on click", async () => {
        const user = userEvent.setup();
        render(<TimezoneSelect onChange={() => {}} date={FIXED_DATE} />);
        await user.click(screen.getByRole("button", { name: /Select timezone/i }));

        const listbox = screen.getByRole("listbox");
        const options = within(listbox).getAllByRole("option");
        // The empty-query view shows Blueprint's minimal subset (33 entries).
        expect(options.length).toBeGreaterThan(1);
        // Each option's text is "<label>, <longName>" — UTC is always first in the minimal list.
        expect(options[0]).toHaveTextContent(/UTC/);
    });

    it("fires onChange with the selected IANA code", async () => {
        const onChange = vi.fn();
        // The portaled filter input reports pointer-events:none in jsdom (Floating-UI
        // never positions the popover); disable the pointer check + drive via keyboard.
        const user = userEvent.setup({ pointerEventsCheck: 0 });
        render(<TimezoneSelect onChange={onChange} date={FIXED_DATE} />);
        await user.click(screen.getByRole("button", { name: /Select timezone/i }));

        // Filter to a single, unambiguous match, then select it.
        const combobox = screen.getByRole("combobox");
        combobox.focus();
        await user.keyboard("New York");
        const option = await screen.findByRole("option", { name: /New York/ });
        await user.click(option);

        expect(onChange).toHaveBeenCalledWith("America/New_York");
    });

    it("updates the trigger label after an uncontrolled selection", async () => {
        const user = userEvent.setup({ pointerEventsCheck: 0 });
        render(<TimezoneSelect defaultValue={undefined} onChange={() => {}} date={FIXED_DATE} />);
        await user.click(screen.getByRole("button", { name: /Select timezone/i }));

        const combobox = screen.getByRole("combobox");
        combobox.focus();
        await user.keyboard("Tokyo");
        await user.click(await screen.findByRole("option", { name: /Tokyo/ }));

        // The trigger now reflects the chosen zone (composite includes the label).
        expect(screen.getByRole("button", { name: /Tokyo/ })).toBeInTheDocument();
    });

    it("respects a controlled value (does not change trigger without onChange commit)", async () => {
        const user = userEvent.setup();

        function Harness() {
            const [tz, setTz] = useState("Europe/Paris");
            return (
                <>
                    <button onClick={() => setTz("Asia/Tokyo")}>external set</button>
                    <TimezoneSelect value={tz} onChange={setTz} date={FIXED_DATE} />
                </>
            );
        }
        render(<Harness />);

        expect(screen.getByRole("button", { name: /Paris/ })).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "external set" }));
        // Controlled value drives the trigger label.
        expect(screen.getByRole("button", { name: /Tokyo/ })).toBeInTheDocument();
    });
});
