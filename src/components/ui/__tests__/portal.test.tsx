import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { axe } from "@/test/axe";
import { Portal, PortalProvider } from "../portal";

describe("Portal", () => {
    it("renders children into document.body by default", () => {
        render(
            <Portal>
                <span data-testid="content">hello</span>
            </Portal>,
        );
        const content = document.body.querySelector('[data-testid="content"]');
        expect(content).not.toBeNull();
        // Mounted inside a portal container div, not the React root.
        expect(content?.parentElement).toHaveClass("mithril-portal");
    });

    it("renders into a custom container", () => {
        const container = document.createElement("div");
        document.body.appendChild(container);
        render(
            <Portal container={container}>
                <span data-testid="content">hi</span>
            </Portal>,
        );
        expect(container.querySelector('[data-testid="content"]')).not.toBeNull();
        container.remove();
    });

    it("applies className to the portal container element", () => {
        render(
            <Portal className="custom-portal">
                <span data-testid="content" />
            </Portal>,
        );
        const content = document.body.querySelector('[data-testid="content"]');
        expect(content?.parentElement).toHaveClass("custom-portal");
    });

    it("invokes onChildrenMount after mounting", () => {
        const onChildrenMount = vi.fn();
        render(
            <Portal onChildrenMount={onChildrenMount}>
                <span />
            </Portal>,
        );
        expect(onChildrenMount).toHaveBeenCalledTimes(1);
    });

    it("removes its container element on unmount", () => {
        const { unmount } = render(
            <Portal>
                <span data-testid="content" />
            </Portal>,
        );
        expect(document.body.querySelector(".mithril-portal")).not.toBeNull();
        unmount();
        expect(document.body.querySelector(".mithril-portal")).toBeNull();
    });

    it("uses container and className from PortalProvider context", () => {
        const container = document.createElement("div");
        container.id = "provided-root";
        document.body.appendChild(container);
        render(
            <PortalProvider portalContainer={container} portalClassName="provider-class">
                <Portal>
                    <span data-testid="content" />
                </Portal>
            </PortalProvider>,
        );
        const content = container.querySelector('[data-testid="content"]');
        expect(content).not.toBeNull();
        expect(content?.parentElement).toHaveClass("provider-class");
        container.remove();
    });

    it("an explicit container prop overrides the provider's", () => {
        const provided = document.createElement("div");
        const explicit = document.createElement("div");
        document.body.append(provided, explicit);
        render(
            <PortalProvider portalContainer={provided}>
                <Portal container={explicit}>
                    <span data-testid="content" />
                </Portal>
            </PortalProvider>,
        );
        expect(explicit.querySelector('[data-testid="content"]')).not.toBeNull();
        expect(provided.querySelector('[data-testid="content"]')).toBeNull();
        provided.remove();
        explicit.remove();
    });

    it("has no axe violations", async () => {
        const { container } = render(
            <Portal>
                <button type="button">Portaled action</button>
            </Portal>,
        );
        // Scan the whole document since portal content lives outside `container`.
        expect(await axe(document.body)).toHaveNoViolations();
        void container;
    });
});
