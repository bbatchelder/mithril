import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { NumericInput } from "../numeric-input";

describe("NumericInput — spinbutton ARIA", () => {
    it("exposes role=spinbutton with current value and bounds", () => {
        render(<NumericInput defaultValue={5} min={0} max={10} />);
        const spin = screen.getByRole("spinbutton");
        expect(spin).toHaveAttribute("aria-valuenow", "5");
        expect(spin).toHaveAttribute("aria-valuemin", "0");
        expect(spin).toHaveAttribute("aria-valuemax", "10");
    });

    it("omits aria-valuenow when the field is empty/non-numeric", () => {
        render(<NumericInput defaultValue="" />);
        const spin = screen.getByRole("spinbutton");
        expect(spin).not.toHaveAttribute("aria-valuenow");
    });

    it("updates aria-valuenow when stepping with the keyboard", async () => {
        const user = userEvent.setup();
        render(<NumericInput defaultValue={5} min={0} max={10} stepSize={1} />);
        const spin = screen.getByRole("spinbutton");

        spin.focus();
        await user.keyboard("{ArrowUp}");
        expect(spin).toHaveAttribute("aria-valuenow", "6");

        await user.keyboard("{ArrowDown}{ArrowDown}");
        expect(spin).toHaveAttribute("aria-valuenow", "4");
    });

    it("clamps at the max bound", async () => {
        const user = userEvent.setup();
        render(<NumericInput defaultValue={10} min={0} max={10} />);
        const spin = screen.getByRole("spinbutton");

        spin.focus();
        await user.keyboard("{ArrowUp}");
        expect(spin).toHaveAttribute("aria-valuenow", "10");
    });
});
