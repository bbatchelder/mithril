import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Popover } from "../popover";

describe("Popover — interaction kinds", () => {
    it("click mode (default): toggles on trigger click", async () => {
        const user = userEvent.setup();
        render(
            <Popover content={<div>Panel body</div>}>
                <button type="button">Open</button>
            </Popover>,
        );

        expect(screen.queryByText("Panel body")).not.toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Open" }));
        expect(await screen.findByText("Panel body")).toBeInTheDocument();
    });

    it("hover mode: opens on pointer enter, closes on leave", async () => {
        // The portal wrapper sets pointer-events:none on ancestors — skip the check.
        const user = userEvent.setup({ pointerEventsCheck: 0 });
        render(
            <Popover interactionKind="hover" hoverCloseDelay={0} content={<div>Hover panel</div>}>
                <button type="button">Trigger</button>
            </Popover>,
        );
        const trigger = screen.getByRole("button", { name: "Trigger" });

        expect(screen.queryByText("Hover panel")).not.toBeInTheDocument();

        await user.hover(trigger);
        expect(await screen.findByText("Hover panel")).toBeInTheDocument();

        await user.unhover(trigger);
        await waitFor(() => expect(screen.queryByText("Hover panel")).not.toBeInTheDocument());
    });

    it("hover mode: moving from trigger into the panel keeps it open", async () => {
        const user = userEvent.setup({ pointerEventsCheck: 0 });
        render(
            <Popover interactionKind="hover" hoverCloseDelay={50} content={<div>Sticky panel</div>}>
                <button type="button">Trigger</button>
            </Popover>,
        );
        const trigger = screen.getByRole("button", { name: "Trigger" });

        await user.hover(trigger);
        const panel = await screen.findByText("Sticky panel");

        // Leave the trigger but immediately enter the panel — the close is cancelled.
        await user.unhover(trigger);
        await user.hover(panel);

        // Still present after the grace period would have elapsed.
        await new Promise((r) => setTimeout(r, 80));
        expect(screen.getByText("Sticky panel")).toBeInTheDocument();
    });
});
