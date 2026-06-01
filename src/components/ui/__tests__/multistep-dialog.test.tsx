import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MultistepDialog, DialogStep } from "../multistep-dialog";

/**
 * MultistepDialog — portaled overlay (composes Radix Dialog). Query via `screen`
 * (the wizard content portals to document.body).
 *
 * Helpers below find the footer Back/Next/Submit buttons and the rail step tabs.
 */

function renderWizard(props: Partial<React.ComponentProps<typeof MultistepDialog>> = {}) {
    return render(
        <MultistepDialog open title="Wizard" onOpenChange={() => {}} {...props}>
            <DialogStep id="one" title="Step One" panel={<p>Panel one content</p>} />
            <DialogStep id="two" title="Step Two" panel={<p>Panel two content</p>} />
            <DialogStep id="three" title="Step Three" panel={<p>Panel three content</p>} />
        </MultistepDialog>,
    );
}

/** The footer navigation buttons by accessible name. */
const back = () => screen.queryByRole("button", { name: "Back" });
const next = () => screen.queryByRole("button", { name: "Next" });

describe("MultistepDialog", () => {
    it("renders the first step's panel when open", () => {
        renderWizard();
        expect(screen.getByText("Panel one content")).toBeInTheDocument();
        expect(screen.queryByText("Panel two content")).not.toBeInTheDocument();
        expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("hides Back on the first step and shows Next", () => {
        renderWizard();
        expect(back()).not.toBeInTheDocument();
        expect(next()).toBeInTheDocument();
    });

    it("Next advances to step 2: panel changes and active step moves", () => {
        renderWizard();
        fireEvent.click(next()!);
        expect(screen.getByText("Panel two content")).toBeInTheDocument();
        expect(screen.queryByText("Panel one content")).not.toBeInTheDocument();
        // The second rail tab is now the active step. Each step's `role="tab"` lives on
        // its <button> (no nested interactive controls — see component).
        const tabs = screen.getAllByRole("tab");
        expect(tabs[1]).toHaveAttribute("aria-selected", "true");
        expect(tabs[0]).toHaveAttribute("aria-selected", "false");
    });

    it("onChange fires with the new and previous step ids", () => {
        const onChange = vi.fn();
        renderWizard({ onChange });
        fireEvent.click(next()!);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe("two"); // new
        expect(onChange.mock.calls[0][1]).toBe("one"); // prev
    });

    it("Back returns to the previous step", () => {
        renderWizard();
        fireEvent.click(next()!);
        expect(screen.getByText("Panel two content")).toBeInTheDocument();
        fireEvent.click(back()!);
        expect(screen.getByText("Panel one content")).toBeInTheDocument();
        expect(back()).not.toBeInTheDocument();
    });

    it("shows the final/submit button instead of Next on the last step", () => {
        const onSubmit = vi.fn();
        renderWizard({ finalButtonProps: { children: "Finish", onClick: onSubmit } });
        fireEvent.click(next()!); // → step 2
        fireEvent.click(next()!); // → step 3 (last)
        expect(next()).not.toBeInTheDocument();
        const finish = screen.getByRole("button", { name: "Finish" });
        expect(finish).toBeInTheDocument();
        fireEvent.click(finish);
        expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it("clicking a completed rail step navigates back to it", () => {
        renderWizard();
        fireEvent.click(next()!); // viewed step 2
        fireEvent.click(next()!); // viewed step 3
        // Step 1 has been viewed → clicking its rail tab navigates there.
        const tabs = screen.getAllByRole("tab");
        fireEvent.click(tabs[0]);
        expect(screen.getByText("Panel one content")).toBeInTheDocument();
    });

    it("an unvisited rail step is not clickable", () => {
        renderWizard();
        const tabs = screen.getAllByRole("tab");
        // Step 3 (index 2) has not been viewed yet → its tab button is disabled.
        expect(tabs[2]).toBeDisabled();
    });

    it("aria-current=step tracks the active step", () => {
        renderWizard();
        let tabs = screen.getAllByRole("tab");
        expect(tabs[0]).toHaveAttribute("aria-current", "step");
        expect(tabs[1]).not.toHaveAttribute("aria-current");
        fireEvent.click(next()!);
        tabs = screen.getAllByRole("tab");
        expect(tabs[1]).toHaveAttribute("aria-current", "step");
        expect(tabs[0]).not.toHaveAttribute("aria-current");
    });

    it("respects initialStepIndex (uncontrolled)", () => {
        renderWizard({ initialStepIndex: 1 });
        expect(screen.getByText("Panel two content")).toBeInTheDocument();
        expect(back()).toBeInTheDocument(); // not the first step
    });

    it("Escape triggers onOpenChange(false)", () => {
        const onOpenChange = vi.fn();
        renderWizard({ onOpenChange });
        fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape", code: "Escape" });
        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("does not render content when closed", () => {
        renderWizard({ open: false });
        expect(screen.queryByText("Panel one content")).not.toBeInTheDocument();
    });
});
