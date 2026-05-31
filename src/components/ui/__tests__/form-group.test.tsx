import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FormGroup } from "../form-group";

describe("FormGroup", () => {
  it("renders its label text", () => {
    render(
      <FormGroup label="Email address">
        <input />
      </FormGroup>,
    );
    expect(screen.getByText("Email address")).toBeInTheDocument();
  });

  it("associates the label with the control via htmlFor when labelFor is set", () => {
    render(
      <FormGroup label="Username" labelFor="username">
        <input id="username" />
      </FormGroup>,
    );
    const input = screen.getByRole("textbox");
    expect(screen.getByText("Username").closest("label")).toHaveAttribute(
      "for",
      "username",
    );
    expect(input).toHaveAttribute("id", "username");
  });

  it("renders helper text", () => {
    render(
      <FormGroup label="Email" helperText="We never share your email.">
        <input />
      </FormGroup>,
    );
    expect(
      screen.getByText("We never share your email."),
    ).toBeInTheDocument();
  });

  it("renders the labelInfo next to the label", () => {
    render(
      <FormGroup label="Email" labelInfo="(required)">
        <input />
      </FormGroup>,
    );
    expect(screen.getByText("(required)")).toBeInTheDocument();
  });

  it("renders children content", () => {
    render(
      <FormGroup label="Field">
        <input placeholder="type here" />
      </FormGroup>,
    );
    expect(screen.getByPlaceholderText("type here")).toBeInTheDocument();
  });

  it("forwards className to the root element", () => {
    const { container } = render(
      <FormGroup label="Field" className="custom-class">
        <input />
      </FormGroup>,
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("forwards arbitrary props such as id and data-* to the root", () => {
    const { container } = render(
      <FormGroup label="Field" id="group-1" data-testid="fg">
        <input />
      </FormGroup>,
    );
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveAttribute("id", "group-1");
    expect(root).toHaveAttribute("data-testid", "fg");
  });

  it("does not render a label element when no label is provided", () => {
    const { container } = render(
      <FormGroup>
        <input />
      </FormGroup>,
    );
    expect(container.querySelector("label")).toBeNull();
  });
});
