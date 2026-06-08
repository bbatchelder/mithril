import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AnchorButton } from "../anchor-button";
import { Button } from "../button";
import { ControlGroup } from "../control-group";
import { HTMLSelect } from "../html-select";
import { InputGroup } from "../input-group";

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

  it("emits the intent and select-caret z-index tier rules", () => {
    const { container } = render(
      <ControlGroup>
        <input />
      </ControlGroup>,
    );
    const cls = (container.firstChild as HTMLElement).className;
    // Intent tiers key off data-intent; :not(:disabled)/:where() keep ties off Tailwind emit order.
    expect(cls).toContain("[&_input[data-intent]:not(:disabled)]:z-[7]");
    expect(cls).toContain("[&_input[data-intent]:not(:disabled):focus]:z-[9]");
    // Button tiers match :where(button, .mithril-button) so they reach <a>-rendered buttons too.
    expect(cls).toContain("[&_:where(button,.mithril-button)[data-intent]:not(:disabled)]:z-[6]");
    expect(cls).toContain("[&_:where(button,.mithril-button)]:z-[4]");
    expect(cls).toContain("[&_[data-select-caret]]:z-[11]");
  });

  it("raises intent-bearing children via a data-intent attribute", () => {
    render(
      <ControlGroup>
        <InputGroup intent="danger" placeholder="email" />
        <Button intent="primary">Go</Button>
        <Button>Plain</Button>
      </ControlGroup>,
    );
    expect(screen.getByPlaceholderText("email")).toHaveAttribute("data-intent", "danger");
    expect(screen.getByRole("button", { name: "Go" })).toHaveAttribute("data-intent", "primary");
    // The default ("none") intent must NOT emit the attribute (it would wrongly raise the child).
    expect(screen.getByRole("button", { name: "Plain" })).not.toHaveAttribute("data-intent");
  });

  it("makes <a>-rendered buttons (asChild / AnchorButton) targetable via the .mithril-button marker", () => {
    render(
      <ControlGroup>
        <AnchorButton href="#" intent="success">
          Link
        </AnchorButton>
        <Button asChild intent="warning">
          <a href="#">As child</a>
        </Button>
      </ControlGroup>,
    );
    // Both render <a>, so the `button` element selector can't reach them — the .mithril-button
    // marker (from buttonVariants) + data-intent are what let ControlGroup's tiers apply.
    // (The enabled AnchorButton with an href is a real link, hence the `link` role.)
    const anchorBtn = screen.getByRole("link", { name: "Link" });
    expect(anchorBtn.tagName).toBe("A");
    expect(anchorBtn).toHaveClass("mithril-button");
    expect(anchorBtn).toHaveAttribute("data-intent", "success");

    const asChild = screen.getByRole("link", { name: "As child" });
    expect(asChild.tagName).toBe("A");
    expect(asChild).toHaveClass("mithril-button");
    expect(asChild).toHaveAttribute("data-intent", "warning");
  });

  it("tags the HTMLSelect caret so the z-11 tier can target it", () => {
    const { container } = render(
      <ControlGroup>
        <HTMLSelect>
          <option>One</option>
        </HTMLSelect>
      </ControlGroup>,
    );
    expect(container.querySelector("[data-select-caret]")).not.toBeNull();
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
