import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { EditableText } from "../editable-text";

/**
 * EditableText is a click/focus-to-edit inline field. Edit mode is entered when the
 * root element receives focus (the root is tabbable at rest). While editing, a real
 * <input> (or <textarea> in multiline) is rendered; Enter confirms (single-line),
 * blur confirms, Escape cancels and reverts. The visual harness covers the ring
 * styling; this is the interaction-lifecycle net.
 */

describe("EditableText — display state", () => {
    it("shows the placeholder when empty and no input is rendered at rest", () => {
        render(<EditableText placeholder="Click to Edit" />);
        expect(screen.getByText("Click to Edit")).toBeInTheDocument();
        expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });

    it("shows the current value as plain text at rest (uncontrolled defaultValue)", () => {
        render(<EditableText defaultValue="Hello" />);
        expect(screen.getByText("Hello")).toBeInTheDocument();
        expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });
});

describe("EditableText — entering edit mode", () => {
    it("renders an input seeded with the current value when focused", async () => {
        const user = userEvent.setup();
        const { container } = render(<EditableText defaultValue="Hello" />);

        const root = container.firstChild as HTMLElement;
        root.focus();

        const input = await screen.findByRole("textbox");
        expect(input).toHaveValue("Hello");
        expect(input).toHaveFocus();
    });

    it("fires onEdit with the current value when entering edit mode", async () => {
        const onEdit = vi.fn();
        const { container } = render(<EditableText defaultValue="Hi" onEdit={onEdit} />);

        (container.firstChild as HTMLElement).focus();
        await screen.findByRole("textbox");

        expect(onEdit).toHaveBeenCalledWith("Hi");
    });
});

describe("EditableText — confirm", () => {
    it("Enter confirms in single-line mode, firing onConfirm with the typed value", async () => {
        const user = userEvent.setup();
        const onConfirm = vi.fn();
        const onChange = vi.fn();
        const { container } = render(
            <EditableText defaultValue="" onConfirm={onConfirm} onChange={onChange} />,
        );

        (container.firstChild as HTMLElement).focus();
        const input = await screen.findByRole("textbox");
        await user.type(input, "World");

        expect(onChange).toHaveBeenLastCalledWith("World");

        await user.keyboard("{Enter}");

        expect(onConfirm).toHaveBeenCalledWith("World");
        // Back to display mode showing the confirmed value.
        expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
        expect(screen.getByText("World")).toBeInTheDocument();
    });

    it("blur confirms the current value", async () => {
        const user = userEvent.setup();
        const onConfirm = vi.fn();
        const { container } = render(<EditableText defaultValue="" onConfirm={onConfirm} />);

        (container.firstChild as HTMLElement).focus();
        const input = await screen.findByRole("textbox");
        await user.type(input, "Saved");
        // Tab away to blur the input (userEvent drives the React state flush);
        // the field exits edit mode and confirms.
        await user.tab();

        expect(onConfirm).toHaveBeenCalledWith("Saved");
        expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });
});

describe("EditableText — cancel", () => {
    it("Escape reverts to the last confirmed value and fires onCancel", async () => {
        const user = userEvent.setup();
        const onCancel = vi.fn();
        const onConfirm = vi.fn();
        const { container } = render(
            <EditableText defaultValue="Original" onCancel={onCancel} onConfirm={onConfirm} />,
        );

        (container.firstChild as HTMLElement).focus();
        const input = await screen.findByRole("textbox");
        await user.type(input, "-edited");
        expect(input).toHaveValue("Original-edited");

        await user.keyboard("{Escape}");

        expect(onCancel).toHaveBeenCalledWith("Original");
        expect(onConfirm).not.toHaveBeenCalled();
        // Reverted display text and exited edit mode.
        expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
        expect(screen.getByText("Original")).toBeInTheDocument();
    });
});

describe("EditableText — multiline", () => {
    it("renders a textarea when multiline", async () => {
        const { container } = render(<EditableText multiline defaultValue="Line" />);

        (container.firstChild as HTMLElement).focus();
        const input = await screen.findByRole("textbox");

        expect(input.tagName).toBe("TEXTAREA");
        expect(input).toHaveValue("Line");
    });
});

describe("EditableText — disabled", () => {
    it("does not enter edit mode on focus and fires no edit callback", async () => {
        const onEdit = vi.fn();
        const { container } = render(
            <EditableText defaultValue="Locked" disabled onEdit={onEdit} />,
        );

        (container.firstChild as HTMLElement).focus();

        expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
        expect(onEdit).not.toHaveBeenCalled();
        expect(screen.getByText("Locked")).toBeInTheDocument();
    });
});

describe("EditableText — controlled value", () => {
    it("reflects the controlled value prop and fires onChange (not self-updating display)", async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<EditableText value="Fixed" onChange={onChange} isEditing />);

        const input = await screen.findByRole("textbox");
        expect(input).toHaveValue("Fixed");

        await user.type(input, "X");
        // Controlled: onChange is notified, but value stays "Fixed" until the prop updates.
        expect(onChange).toHaveBeenCalledWith("FixedX");
        expect(input).toHaveValue("Fixed");
    });
});
