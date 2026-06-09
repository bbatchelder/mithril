import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { TimePicker } from "../time-picker";

/**
 * TimePicker renders hour/minute(/second/millisecond) spinbutton inputs plus an optional
 * AM/PM select. Visual fidelity is the comparison harness's job; here we lock the value
 * contract: the segments reflect the controlled Date, 12h/24h formatting is correct
 * (including when `useAmPm` toggles at runtime), and ArrowUp/Down adjust the value.
 * All assertions are anchored to an explicit Date, never to "now".
 */

function hourInput() {
    return screen.getByLabelText("Hour") as HTMLInputElement;
}
function minuteInput() {
    return screen.getByLabelText("Minute") as HTMLInputElement;
}

describe("TimePicker — value display", () => {
    it("shows the controlled time in 24-hour segments by default", () => {
        render(<TimePicker value={new Date(2026, 0, 15, 14, 30)} onChange={() => {}} />);
        expect(hourInput().value).toBe("14");
        expect(minuteInput().value).toBe("30");
    });

    it("shows the 12-hour hour and a PM select when useAmPm is set", () => {
        render(<TimePicker value={new Date(2026, 0, 15, 14, 30)} onChange={() => {}} useAmPm />);
        // 14:00 → 2 PM in a 12-hour field.
        expect(hourInput().value).toBe("2");
        expect((screen.getByLabelText("AM/PM") as HTMLSelectElement).value).toBe("pm");
    });
});

describe("TimePicker — useAmPm toggled at runtime", () => {
    it("reformats the hour segment from 24h to 12h when useAmPm flips on", async () => {
        const user = userEvent.setup();

        function Harness() {
            const [ampm, setAmPm] = useState(false);
            return (
                <>
                    <button onClick={() => setAmPm((p) => !p)}>toggle</button>
                    <TimePicker value={new Date(2026, 0, 15, 14, 30)} onChange={() => {}} useAmPm={ampm} />
                </>
            );
        }
        render(<Harness />);

        // 24h: the hour reads "14".
        expect(hourInput().value).toBe("14");

        await user.click(screen.getByRole("button", { name: "toggle" }));

        // 12h: it must re-derive to "2" — never leave an impossible "14" in a 12-hour field.
        expect(hourInput().value).toBe("2");
        expect((screen.getByLabelText("AM/PM") as HTMLSelectElement).value).toBe("pm");
    });
});

describe("TimePicker — keyboard adjustment", () => {
    it("ArrowUp on the hour segment increments the committed time", async () => {
        const onChange = vi.fn();
        const user = userEvent.setup();
        render(<TimePicker value={new Date(2026, 0, 15, 14, 30)} onChange={onChange} />);

        hourInput().focus();
        await user.keyboard("{ArrowUp}");

        expect(onChange).toHaveBeenCalled();
        const next = onChange.mock.calls.at(-1)![0] as Date;
        expect(next.getHours()).toBe(15);
        expect(next.getMinutes()).toBe(30);
    });
});
