import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { DateRangePicker, type DateRangePickerValue } from "../date-range-picker";

/**
 * DateRangePicker renders two react-day-picker month calendars in range mode.
 * The calendar grid + day buttons are exercised by the comparison harness; here we
 * lock in the value contract (controlled vs uncontrolled `{ start, end }`), the
 * accessible structure (grids + named month/year dropdowns + nav buttons), and the
 * core range-selection interaction (clicking two days fires onChange with both
 * boundaries). Date assertions are anchored to an explicit controlled value rather
 * than "today" so they are stable across locale/timezone.
 */

// A fixed, locale-independent anchor month: January 2026.
const JAN_2026: DateRangePickerValue = {
    start: new Date(2026, 0, 8),
    end: new Date(2026, 0, 20),
};

describe("DateRangePicker — structure", () => {
    it("renders two month grids by default", () => {
        render(<DateRangePicker value={{ start: null, end: null }} onChange={() => {}} />);
        // react-day-picker exposes each month table as a grid.
        expect(screen.getAllByRole("grid")).toHaveLength(2);
    });

    it("renders a single month grid when singleMonthOnly is set", () => {
        render(
            <DateRangePicker
                value={{ start: null, end: null }}
                onChange={() => {}}
                singleMonthOnly
            />,
        );
        expect(screen.getAllByRole("grid")).toHaveLength(1);
    });

    it("exposes accessible month and year dropdowns", () => {
        render(<DateRangePicker value={JAN_2026} onChange={() => {}} />);
        // Each caption renders a month + year HTMLSelect with an aria-label.
        const monthSelects = screen.getAllByRole("combobox", { name: /month/i });
        const yearSelects = screen.getAllByRole("combobox", { name: /year/i });
        expect(monthSelects.length).toBeGreaterThanOrEqual(1);
        expect(yearSelects.length).toBeGreaterThanOrEqual(1);
    });

    it("exposes Previous/Next month navigation buttons", () => {
        render(<DateRangePicker value={JAN_2026} onChange={() => {}} />);
        expect(screen.getByRole("button", { name: "Previous month" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Next month" })).toBeInTheDocument();
    });
});

describe("DateRangePicker — value contract", () => {
    it("renders the controlled range endpoints as day buttons", () => {
        render(<DateRangePicker value={JAN_2026} onChange={() => {}} />);
        // react-day-picker labels day buttons with the full localized date, e.g.
        // "Thursday, January 8th, 2026". Match the start (Jan 8) and end (Jan 20).
        expect(screen.getByRole("button", { name: /January 8th, 2026/ })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /January 20th, 2026/ })).toBeInTheDocument();
    });

    it("fires onChange with a `{ start, end }` payload when a day is clicked", async () => {
        const onChange = vi.fn();
        const user = userEvent.setup();
        // Uncontrolled: defaultValue.start anchors the displayed month to January 2026
        // so the day label is stable. Clicking a day fires onChange.
        render(
            <DateRangePicker
                defaultValue={{ start: new Date(2026, 0, 1), end: null }}
                onChange={onChange}
            />,
        );

        await user.click(screen.getByRole("button", { name: /January 15th, 2026/ }));

        expect(onChange).toHaveBeenCalled();
        const payload = onChange.mock.calls.at(-1)![0] as DateRangePickerValue;
        expect(payload).toHaveProperty("start");
        expect(payload).toHaveProperty("end");
        // The payload's boundaries are Dates (or null) — assert the shape, not which slot,
        // since react-day-picker range mode may extend the preexisting Jan-1 start.
        expect(payload.start).toBeInstanceOf(Date);
    });

    it("completes a range across two clicks in uncontrolled mode", async () => {
        const onChange = vi.fn();
        const user = userEvent.setup();
        // Uncontrolled: the picker manages its own state, so the 2nd click sets `end`.
        // Anchor the displayed month via defaultValue.start so date labels are stable.
        render(
            <DateRangePicker
                defaultValue={{ start: new Date(2026, 0, 1), end: null }}
                onChange={onChange}
            />,
        );

        // Jan 1 is preselected as start; clicking Jan 10 then Jan 20 forms a range.
        await user.click(screen.getByRole("button", { name: /January 10th, 2026/ }));
        await user.click(screen.getByRole("button", { name: /January 20th, 2026/ }));

        expect(onChange).toHaveBeenCalled();
        const last = onChange.mock.calls.at(-1)![0] as DateRangePickerValue;
        expect(last.start).toBeInstanceOf(Date);
        expect(last.end).toBeInstanceOf(Date);
    });
});

describe("DateRangePicker — month navigation", () => {
    it("changes the displayed month when Next is clicked (uncontrolled month state)", async () => {
        const user = userEvent.setup();

        function Harness() {
            const [v] = useState<DateRangePickerValue>(JAN_2026);
            return <DateRangePicker value={v} onChange={() => {}} />;
        }
        render(<Harness />);

        // Left caption initially shows January (month select value === 0).
        const monthSelects = screen.getAllByRole("combobox", {
            name: /month/i,
        }) as HTMLSelectElement[];
        expect(monthSelects[0].value).toBe("0"); // January

        await user.click(screen.getByRole("button", { name: "Next month" }));

        const monthSelectsAfter = screen.getAllByRole("combobox", {
            name: /month/i,
        }) as HTMLSelectElement[];
        // Contiguous two-month paged navigation advances the left calendar by two
        // months (Jan → Mar), so the right calendar stays adjacent. Just assert the
        // displayed month moved forward from January.
        expect(Number(monthSelectsAfter[0].value)).toBeGreaterThan(0);
    });
});
