import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TextArea } from "../text-area";

describe("TextArea", () => {
  it("renders a textarea element", () => {
    render(<TextArea aria-label="notes" />);
    expect(screen.getByRole("textbox")).toBeInstanceOf(HTMLTextAreaElement);
  });

  it("renders a placeholder", () => {
    render(<TextArea placeholder="Type a comment" />);
    expect(screen.getByPlaceholderText("Type a comment")).toBeInTheDocument();
  });

  it("accepts typed input as an uncontrolled field", async () => {
    const user = userEvent.setup();
    render(<TextArea aria-label="notes" />);
    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "hello world");
    expect(textarea).toHaveValue("hello world");
  });

  it("supports defaultValue for uncontrolled usage", () => {
    render(<TextArea aria-label="notes" defaultValue="seed" />);
    expect(screen.getByRole("textbox")).toHaveValue("seed");
  });

  it("calls onChange when text is typed", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TextArea aria-label="notes" onChange={onChange} />);
    await user.type(screen.getByRole("textbox"), "a");
    expect(onChange).toHaveBeenCalled();
  });

  it("respects a controlled value", () => {
    render(<TextArea aria-label="notes" value="fixed" onChange={() => {}} />);
    expect(screen.getByRole("textbox")).toHaveValue("fixed");
  });

  it("is disabled when the disabled prop is set", () => {
    render(<TextArea aria-label="notes" disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("forwards className, id and aria-* to the textarea", () => {
    render(
      <TextArea
        className="custom-class"
        id="ta-1"
        aria-describedby="hint"
        aria-label="notes"
      />,
    );
    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveClass("custom-class");
    expect(textarea).toHaveAttribute("id", "ta-1");
    expect(textarea).toHaveAttribute("aria-describedby", "hint");
  });

  it("exposes the textarea via ref", () => {
    const ref = { current: null as HTMLTextAreaElement | null };
    render(<TextArea aria-label="notes" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });
});
