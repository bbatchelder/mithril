import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ControlGroup } from "../control-group";

describe("ControlGroup", () => {
  it("renders its children", () => {
    render(
      <ControlGroup>
        <input placeholder="first" />
        <button type="button">Go</button>
      </ControlGroup>,
    );
    expect(screen.getByPlaceholderText("first")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go" })).toBeInTheDocument();
  });

  it("forwards className to the root element", () => {
    const { container } = render(
      <ControlGroup className="custom-class">
        <input />
      </ControlGroup>,
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("forwards arbitrary props such as id and data-* to the root", () => {
    const { container } = render(
      <ControlGroup id="cg-1" data-testid="cg">
        <input />
      </ControlGroup>,
    );
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveAttribute("id", "cg-1");
    expect(root).toHaveAttribute("data-testid", "cg");
  });

  it("forwards aria attributes to the root", () => {
    const { container } = render(
      <ControlGroup aria-label="Search controls">
        <input />
      </ControlGroup>,
    );
    expect(container.firstChild).toHaveAttribute(
      "aria-label",
      "Search controls",
    );
  });

  it("renders as a div by default", () => {
    const { container } = render(
      <ControlGroup>
        <input />
      </ControlGroup>,
    );
    expect((container.firstChild as HTMLElement).tagName).toBe("DIV");
  });

  it("keeps controls inline (does not add a vertical class) by default", () => {
    const { container } = render(
      <ControlGroup>
        <input />
      </ControlGroup>,
    );
    const root = container.firstChild as HTMLElement;
    expect(root.className).not.toContain("flex-col");
  });

  it("stacks controls vertically when vertical is set", () => {
    const { container } = render(
      <ControlGroup vertical>
        <input />
      </ControlGroup>,
    );
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain("flex-col");
  });

  it("renders multiple children in order", () => {
    const { container } = render(
      <ControlGroup>
        <input data-testid="a" />
        <input data-testid="b" />
      </ControlGroup>,
    );
    const root = container.firstChild as HTMLElement;
    const kids = Array.from(root.children) as HTMLElement[];
    expect(kids[0]).toHaveAttribute("data-testid", "a");
    expect(kids[1]).toHaveAttribute("data-testid", "b");
  });
});
