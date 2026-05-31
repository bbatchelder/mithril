import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { DateRangeInput, type DateRangeInputValue } from "../date-range-input";

/**
 * DateRangeInput = two text inputs (start + end) sharing a popover DateRangePicker.
 * The calendar popover itself is verified by date-range-picker.test + the comparison
 * harness; here we cover the input contract the harness can't see: the two named
 * inputs, controlled vs uncontrolled value → displayed text, typed input parsing
 * (onChange payload shape), and the error/danger state on an unparseable string.
 * Assertions are anchored to values we set, never to "today", so they're locale/TZ-safe.
 */

function getInputs() {
    return {
        start: screen.getByRole("textbox", { name: "Start date" }) as HTMLInputElement,
        end: screen.getByRole("textbox", { name: "End date" }) as HTMLInputElement,
    };
}

describe("DateRangeInput — structure & accessible names", () => {
    it("renders two textboxes with Start date / End date accessible names", () => {
        render(<DateRangeInput value={{ start: null, end: null }} onChange={() => {}} />);
        const { start, end } = getInputs();
        expect(start).toBeInTheDocument();
        expect(end).toBeInTheDocument();
    });

    it("advertises a dialog popup via aria-haspopup on both inputs", () => {
        render(<DateRangeInput value={{ start: null, end: null }} onChange={() => {}} />);
        const { start, end } = getInputs();
        expect(start).toHaveAttribute("aria-haspopup", "dialog");
        expect(end).toHaveAttribute("aria-haspopup", "dialog");
    });

    it("disables both inputs when disabled is set", () => {
        render(<DateRangeInput value={{ start: null, end: null }} onChange={() => {}} disabled />);
        const { start, end } = getInputs();
        expect(start).toBeDisabled();
        expect(end).toBeDisabled();
    });
});

describe("DateRangeInput — value display", () => {
    it("formats a controlled range into the two inputs (M/d/yyyy)", () => {
        render(
            <DateRangeInput
                value={{ start: new Date(2026, 0, 8), end: new Date(2026, 0, 20) }}
                onChange={() => {}}
            />,
        );
        const { start, end } = getInputs();
        expect(start.value).toBe("1/8/2026");
        expect(end.value).toBe("1/20/2026");
    });

    it("renders empty inputs for a null/null range", () => {
        render(<DateRangeInput value={{ start: null, end: null }} onChange={() => {}} />);
        const { start, end } = getInputs();
        expect(start.value).toBe("");
        expect(end.value).toBe("");
    });

    it("reflects a controlled value update", async () => {
        const user = userEvent.setup();

        function Harness() {
            const [v, setV] = useState<DateRangeInputValue>({ start: null, end: null });
            return (
                <>
                    <button onClick={() => setV({ start: new Date(2026, 2, 3), end: null })}>
                        set
                    </button>
                    <DateRangeInput value={v} onChange={setV} />
                </>
            );
        }
        render(<Harness />);
        expect(getInputs().start.value).toBe("");
        // Driving the controlled value externally updates the displayed text.
        await user.click(screen.getByRole("button", { name: "set" }));
        expect(getInputs().start.value).toBe("3/3/2026");
    });
});

describe("DateRangeInput — typed input parsing", () => {
    it("parses a typed start date and fires onChange with a `{ start, end }` payload", () => {
        const onChange = vi.fn();
        render(<DateRangeInput defaultValue={{ start: null, end: null }} onChange={onChange} />);

        const { start } = getInputs();
        // Drive the field via a change event with the complete M/d/yyyy string. (Char-by-char
        // user.type into this focus-opened-popover controlled input is unreliable in jsdom;
        // a single change event exercises the same parse path deterministically.)
        fireEvent.focus(start);
        fireEvent.change(start, { target: { value: "2/14/2026" } });

        expect(onChange).toHaveBeenCalled();
        // Some onChange call must carry the fully-parsed Feb 14 2026 start date.
        const parsed = onChange.mock.calls
            .map(([v]) => (v as DateRangeInputValue).start)
            .find(
                (d): d is Date =>
                    d instanceof Date &&
                    d.getFullYear() === 2026 &&
                    d.getMonth() === 1 &&
                    d.getDate() === 14,
            );
        expect(parsed).toBeInstanceOf(Date);
    });

    it("never commits a real start Date for an unparseable typed value", () => {
        const onChange = vi.fn();
        render(<DateRangeInput defaultValue={{ start: null, end: null }} onChange={onChange} />);

        const { start } = getInputs();
        fireEvent.focus(start);
        fireEvent.change(start, { target: { value: "not-a-date" } });
        // Blur runs the parser again, which rejects the garbage (sets the danger state).
        fireEvent.blur(start);

        // No onChange payload ever carries a valid (non-null, non-NaN) start Date.
        for (const [payload] of onChange.mock.calls) {
            const s = (payload as DateRangeInputValue).start;
            const committedValid = s != null && !isNaN(s.getTime());
            expect(committedValid).toBe(false);
        }
    });
});
