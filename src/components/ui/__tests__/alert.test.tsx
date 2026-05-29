import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Alert } from "../alert";

describe("Alert — alertdialog role", () => {
    it("renders as role=alertdialog (not a plain dialog)", () => {
        render(
            <Alert open confirmButtonText="OK" icon="warning-sign" intent="danger">
                Are you sure you want to delete this file?
            </Alert>,
        );
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("fires onConfirm when the confirm button is clicked", async () => {
        const onConfirm = vi.fn();
        const user = userEvent.setup({ pointerEventsCheck: 0 });
        render(
            <Alert open confirmButtonText="Delete" cancelButtonText="Cancel" onConfirm={onConfirm}>
                Delete?
            </Alert>,
        );
        await user.click(screen.getByRole("button", { name: "Delete" }));
        expect(onConfirm).toHaveBeenCalled();
    });
});
