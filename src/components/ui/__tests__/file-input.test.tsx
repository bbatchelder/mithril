import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { FileInput } from "../file-input";

/**
 * FileInput renders a <label> wrapper containing a visually-hidden native
 * <input type="file"> plus a styled box with placeholder text and a Browse button.
 * It is presentational about the chosen file — the displayed `text` is consumer-driven
 * (via `text` + `hasSelection`); the component does not auto-render the file name.
 * Extra props spread onto the label wrapper; props for the inner input go via `inputProps`.
 */
describe("FileInput", () => {
    it("renders a file input wrapped in a label", () => {
        const { container } = render(<FileInput />);
        const input = container.querySelector(
            'input[type="file"]',
        ) as HTMLInputElement;
        expect(input).toBeInTheDocument();
        expect(input.closest("label")).not.toBeNull();
    });

    it("shows the default placeholder text when no file is chosen", () => {
        render(<FileInput />);
        expect(screen.getByText("Choose file...")).toBeInTheDocument();
    });

    it("renders custom placeholder text", () => {
        render(<FileInput text="Upload your CV" />);
        expect(screen.getByText("Upload your CV")).toBeInTheDocument();
    });

    it("renders a default and a custom Browse button label", () => {
        const { rerender } = render(<FileInput />);
        expect(screen.getByText("Browse")).toBeInTheDocument();
        rerender(<FileInput buttonText="Pick" />);
        expect(screen.getByText("Pick")).toBeInTheDocument();
    });

    it("disables the underlying input when disabled", () => {
        const { container } = render(<FileInput disabled />);
        const input = container.querySelector(
            'input[type="file"]',
        ) as HTMLInputElement;
        expect(input).toBeDisabled();
    });

    it("fires onInputChange when a file is selected", async () => {
        const user = userEvent.setup();
        const onInputChange = vi.fn();
        const { container } = render(<FileInput onInputChange={onInputChange} />);
        const input = container.querySelector(
            'input[type="file"]',
        ) as HTMLInputElement;
        const file = new File(["hello"], "hello.txt", { type: "text/plain" });
        await user.upload(input, file);
        expect(onInputChange).toHaveBeenCalledTimes(1);
        expect(input.files?.[0]).toBe(file);
    });

    it("also fires an onChange passed through inputProps", async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        const { container } = render(<FileInput inputProps={{ onChange }} />);
        const input = container.querySelector(
            'input[type="file"]',
        ) as HTMLInputElement;
        await user.upload(input, new File(["x"], "x.txt", { type: "text/plain" }));
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it("forwards id and aria-* to the inner input via inputProps", () => {
        const { container } = render(
            <FileInput inputProps={{ id: "file-1", "aria-label": "Resume upload" }} />,
        );
        const input = container.querySelector(
            'input[type="file"]',
        ) as HTMLInputElement;
        expect(input).toHaveAttribute("id", "file-1");
        expect(input).toHaveAttribute("aria-label", "Resume upload");
    });

    it("forwards className and arbitrary props to the root label", () => {
        const { container } = render(
            <FileInput className="custom-class" data-testid="fi" />,
        );
        const label = container.querySelector("label") as HTMLElement;
        expect(label).toHaveClass("custom-class");
        expect(label).toHaveAttribute("data-testid", "fi");
    });
});
