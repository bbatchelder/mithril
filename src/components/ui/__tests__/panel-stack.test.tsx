import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { PanelStack, type PanelInfo } from "../panel-stack";

/**
 * PanelStack contract: it renders the active (top) panel with a header (title +
 * conditional back button), injects `openPanel`/`closePanel` into each panel's
 * renderPanel, and supports both uncontrolled (internal stack) and controlled
 * (consumer-owned `stack` array) modes. The slide visuals are out of scope for
 * jsdom — here we verify which panel is visible after push/pop and the onOpen/onClose
 * notifications.
 */

const rootPanel: PanelInfo = {
    title: "Root panel",
    renderPanel: ({ openPanel }) => (
        <button
            onClick={() =>
                openPanel({
                    title: "Detail panel",
                    renderPanel: () => <p>Detail body</p>,
                })
            }
        >
            Open detail
        </button>
    ),
};

describe("PanelStack — rendering", () => {
    it("renders nothing when the stack is empty", () => {
        const { container } = render(<PanelStack stack={[]} />);
        expect(container.firstChild).toBeNull();
    });

    it("renders the root panel title and body", () => {
        render(<PanelStack initialPanel={rootPanel} />);
        expect(screen.getByText("Root panel")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Open detail" })).toBeInTheDocument();
    });

    it("does not show a back button on the root panel", () => {
        render(<PanelStack initialPanel={rootPanel} />);
        expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument();
    });

    it("omits the header when showPanelHeader is false", () => {
        render(<PanelStack initialPanel={rootPanel} showPanelHeader={false} />);
        // The title text lives only in the header; the body button still renders.
        expect(screen.queryByText("Root panel")).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Open detail" })).toBeInTheDocument();
    });
});

describe("PanelStack — push/pop (uncontrolled)", () => {
    it("pushes a new panel via the injected openPanel and shows it", async () => {
        const user = userEvent.setup();
        render(<PanelStack initialPanel={rootPanel} />);

        await user.click(screen.getByRole("button", { name: "Open detail" }));

        // The detail panel is now active.
        expect(screen.getByText("Detail body")).toBeInTheDocument();
        // The header back button labels with the previous panel title.
        expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
        // Active-panel-only rendering means the root body is gone.
        expect(screen.queryByRole("button", { name: "Open detail" })).not.toBeInTheDocument();
    });

    it("pops back to the previous panel via the header back button", async () => {
        const user = userEvent.setup();
        render(<PanelStack initialPanel={rootPanel} />);

        await user.click(screen.getByRole("button", { name: "Open detail" }));
        expect(screen.getByText("Detail body")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Back" }));

        // Back at the root panel.
        expect(screen.getByRole("button", { name: "Open detail" })).toBeInTheDocument();
        expect(screen.queryByText("Detail body")).not.toBeInTheDocument();
    });

    it("fires onOpen and onClose notifications", async () => {
        const onOpen = vi.fn();
        const onClose = vi.fn();
        const user = userEvent.setup();
        render(<PanelStack initialPanel={rootPanel} onOpen={onOpen} onClose={onClose} />);

        await user.click(screen.getByRole("button", { name: "Open detail" }));
        expect(onOpen).toHaveBeenCalledTimes(1);
        expect(onOpen.mock.calls[0][0]).toMatchObject({ title: "Detail panel" });

        await user.click(screen.getByRole("button", { name: "Back" }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});

describe("PanelStack — controlled mode", () => {
    it("renders the last panel in a consumer-supplied stack", () => {
        const detail: PanelInfo = {
            title: "Detail panel",
            renderPanel: () => <p>Detail body</p>,
        };
        render(<PanelStack stack={[rootPanel, detail]} onClose={() => {}} />);

        // Top of the stack is active.
        expect(screen.getByText("Detail body")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
    });

    it("lets the consumer drive push/pop through onOpen/onClose", async () => {
        const user = userEvent.setup();

        function Harness() {
            const [stack, setStack] = useState<PanelInfo[]>([rootPanel]);
            return (
                <PanelStack
                    stack={stack}
                    onOpen={(p) => setStack((s) => [...s, p])}
                    onClose={() => setStack((s) => s.slice(0, -1))}
                />
            );
        }
        render(<Harness />);

        await user.click(screen.getByRole("button", { name: "Open detail" }));
        expect(screen.getByText("Detail body")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Back" }));
        expect(screen.getByRole("button", { name: "Open detail" })).toBeInTheDocument();
    });
});
