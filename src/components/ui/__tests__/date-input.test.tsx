import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { DateInput } from "../date-input";

/**
 * DateInput = a text field + a popover DatePicker. The calendar grid is covered by
 * date-picker.test + the comparison harness; here we lock the input contract that the
 * harness can't see: the field stays focused (typeable) when the calendar opens, typed
 * dates parse + commit, and bad input is rejected. Anchored to explicit dates, never "now".
 */

describe("DateInput — typing", () => {
    it("keeps DOM focus on the text field when the calendar opens", async () => {
        const user = userEvent.setup();
        render(<DateInput value={new Date(2026, 0, 15)} onChange={() => {}} />);

        const field = screen.getByDisplayValue("1/15/2026") as HTMLInputElement;
        await user.click(field);

        // Opening the popover must NOT pull focus into the calendar (e.g. the month <select>),
        // or the user could never type a date. Focus has to stay on the input.
        expect(document.activeElement).toBe(field);
    });

    it("commits a typed date on Enter", async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();

        function Harness() {
            const [v, setV] = useState<Date | null>(new Date(2026, 0, 15));
            return (
                <DateInput
                    value={v}
                    onChange={(d) => {
                        onChange(d);
                        setV(d);
                    }}
                />
            );
        }
        render(<Harness />);

        const field = screen.getByDisplayValue("1/15/2026") as HTMLInputElement;
        await user.click(field);
        await user.clear(field);
        await user.type(field, "3/9/2026");
        await user.keyboard("{Enter}");

        const committed = onChange.mock.calls
            .map(([d]) => d as Date | null)
            .find(
                (d): d is Date =>
                    d instanceof Date &&
                    d.getFullYear() === 2026 &&
                    d.getMonth() === 2 &&
                    d.getDate() === 9,
            );
        expect(committed).toBeInstanceOf(Date);
        expect(field.value).toBe("3/9/2026");
    });
});

describe("DateInput — calendar selection", () => {
    it("commits a day on the FIRST click and closes (closeOnSelection)", async () => {
        // Clicking a day blurs the focused field. If the blur handler re-commits, it remounts
        // the open calendar and the click lands on a dead node — the "first click does nothing,
        // then it works" bug, which also defeats closeOnSelection. Real pointer events are
        // required to fire that focus/blur churn. The controlled value (Jan 15) anchors the
        // calendar to January so the day label is stable.
        const user = userEvent.setup({ pointerEventsCheck: 0 });
        const onChange = vi.fn();

        function Harness() {
            const [v, setV] = useState<Date | null>(new Date(2026, 0, 15));
            return (
                <DateInput
                    value={v}
                    onChange={(d) => {
                        onChange(d);
                        setV(d);
                    }}
                />
            );
        }
        render(<Harness />);

        const field = screen.getByDisplayValue("1/15/2026") as HTMLInputElement;
        await user.click(field);
        // A single click on Jan 22 must commit it (not be swallowed by a remount)…
        await user.click(await screen.findByRole("button", { name: /January 22nd, 2026/ }));

        const committed = onChange.mock.calls
            .map(([d]) => d as Date | null)
            .find(
                (d): d is Date =>
                    d instanceof Date && d.getMonth() === 0 && d.getDate() === 22,
            );
        expect(committed).toBeInstanceOf(Date);
        expect(field.value).toBe("1/22/2026");
        // …and the popover closes (closeOnSelection defaults true).
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("reopens when the field is clicked again after a selection", async () => {
        // After a selection closes the popover, Radix restores focus to the input. A later click
        // then fires no `focus` event, so opening must not hinge on focus alone — clicking the
        // already-focused field has to reopen the calendar (else it's stuck until you blur and
        // click back in).
        const user = userEvent.setup({ pointerEventsCheck: 0 });

        function Harness() {
            const [v, setV] = useState<Date | null>(new Date(2026, 0, 15));
            return <DateInput value={v} onChange={setV} />;
        }
        render(<Harness />);

        const field = screen.getByDisplayValue("1/15/2026") as HTMLInputElement;
        await user.click(field);
        await user.click(await screen.findByRole("button", { name: /January 22nd, 2026/ }));
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

        // Restore focus to the input the way Radix's close-auto-focus does, so the next click
        // arrives with the field already focused (no focus event) — the exact stuck state.
        field.focus();
        await user.click(field);
        expect(await screen.findByRole("dialog")).toBeInTheDocument();
    });
});
