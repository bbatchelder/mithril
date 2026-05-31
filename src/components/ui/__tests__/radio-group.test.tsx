import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Radio, RadioGroup } from "../radio";

/**
 * RadioGroup is a controlled wrapper: it injects a shared `name`, the `checked`
 * state (derived from `selectedValue`), and an `onChange` adapter into its Radio
 * children. It renders a plain <div> (no role=radiogroup) and surfaces selection
 * changes via `onChange(value, event)`. These tests lock in that contract — the
 * indicator visuals are verified by the comparison harness.
 */
describe("RadioGroup", () => {
    it("renders its radio children", () => {
        render(
            <RadioGroup name="fruit">
                <Radio value="a" label="Apple" />
                <Radio value="b" label="Banana" />
            </RadioGroup>,
        );
        expect(screen.getAllByRole("radio")).toHaveLength(2);
    });

    it("renders an optional group label", () => {
        render(
            <RadioGroup name="fruit" label="Fruit">
                <Radio value="a" label="Apple" />
            </RadioGroup>,
        );
        expect(screen.getByText("Fruit")).toBeInTheDocument();
    });

    it("exposes each radio's label as its accessible name", () => {
        render(
            <RadioGroup name="fruit">
                <Radio value="a" label="Apple" />
                <Radio value="b" label="Banana" />
            </RadioGroup>,
        );
        expect(screen.getByRole("radio", { name: "Apple" })).toBeInTheDocument();
        expect(screen.getByRole("radio", { name: "Banana" })).toBeInTheDocument();
    });

    it("checks the radio matching the controlled selectedValue", () => {
        render(
            <RadioGroup name="fruit" selectedValue="b" onChange={() => {}}>
                <Radio value="a" label="Apple" />
                <Radio value="b" label="Banana" />
            </RadioGroup>,
        );
        expect(screen.getByRole("radio", { name: "Banana" })).toBeChecked();
        expect(screen.getByRole("radio", { name: "Apple" })).not.toBeChecked();
    });

    it("calls onChange with the selected value (value first, then event)", async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(
            <RadioGroup name="fruit" selectedValue="a" onChange={onChange}>
                <Radio value="a" label="Apple" />
                <Radio value="b" label="Banana" />
            </RadioGroup>,
        );
        await user.click(screen.getByRole("radio", { name: "Banana" }));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe("b");
        const event = onChange.mock.calls[0][1] as React.ChangeEvent<HTMLInputElement>;
        expect(event.target.value).toBe("b");
    });

    it("renders via the options prop instead of children", () => {
        render(
            <RadioGroup
                name="fruit"
                selectedValue="a"
                onChange={() => {}}
                options={[
                    { value: "a", label: "Apple" },
                    { value: "b", label: "Banana" },
                ]}
            />,
        );
        expect(screen.getAllByRole("radio")).toHaveLength(2);
        expect(screen.getByRole("radio", { name: "Apple" })).toBeChecked();
    });

    it("groups radios under a shared name attribute", () => {
        render(
            <RadioGroup name="fruit">
                <Radio value="a" label="Apple" />
                <Radio value="b" label="Banana" />
            </RadioGroup>,
        );
        const radios = screen.getAllByRole("radio") as HTMLInputElement[];
        expect(radios[0].name).toBe("fruit");
        expect(radios[1].name).toBe("fruit");
    });

    it("disables every radio when the group is disabled", () => {
        render(
            <RadioGroup name="fruit" disabled>
                <Radio value="a" label="Apple" />
                <Radio value="b" label="Banana" />
            </RadioGroup>,
        );
        for (const radio of screen.getAllByRole("radio")) {
            expect(radio).toBeDisabled();
        }
    });

    it("lets an individual option override the group disabled state", () => {
        render(
            <RadioGroup
                name="fruit"
                selectedValue="a"
                onChange={() => {}}
                options={[
                    { value: "a", label: "Apple" },
                    { value: "b", label: "Banana", disabled: true },
                ]}
            />,
        );
        expect(screen.getByRole("radio", { name: "Apple" })).not.toBeDisabled();
        expect(screen.getByRole("radio", { name: "Banana" })).toBeDisabled();
    });

    it("forwards className to the root wrapper", () => {
        const { container } = render(
            <RadioGroup name="fruit" className="custom-class">
                <Radio value="a" label="Apple" />
            </RadioGroup>,
        );
        expect(container.firstChild).toHaveClass("custom-class");
    });
});
