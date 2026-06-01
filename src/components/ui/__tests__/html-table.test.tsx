import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HTMLTable } from "../html-table";

/**
 * HTMLTable is a styled passthrough over a native <table>. Its visual fidelity
 * (cell borders, stripes, hover) is covered by the comparison harness; here we
 * assert that it renders a real table, composes native children, and toggles the
 * correct variant classes per prop (each variant emits LITERAL arbitrary classes).
 */

function renderTable(props?: Parameters<typeof HTMLTable>[0]) {
    return render(
        <HTMLTable {...props}>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Role</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Alice</td>
                    <td>Engineer</td>
                </tr>
                <tr>
                    <td>Bob</td>
                    <td>Designer</td>
                </tr>
            </tbody>
        </HTMLTable>,
    );
}

describe("HTMLTable — structure", () => {
    it("renders a native <table> exposing role=table", () => {
        renderTable();
        const table = screen.getByRole("table");
        expect(table.tagName).toBe("TABLE");
    });

    it("renders composed thead/tbody children as real table semantics", () => {
        renderTable();
        // 1 header row + 2 body rows.
        expect(screen.getAllByRole("row")).toHaveLength(3);
        expect(screen.getAllByRole("columnheader")).toHaveLength(2);
        expect(screen.getByRole("cell", { name: "Alice" })).toBeInTheDocument();
    });

    it("applies the base font-size token and border-spacing reset", () => {
        renderTable();
        const table = screen.getByRole("table");
        expect(table).toHaveClass("text-body");
        expect(table).toHaveClass("border-spacing-0");
    });
});

describe("HTMLTable — variants", () => {
    it("is plain by default (no variant classes)", () => {
        renderTable();
        const table = screen.getByRole("table");
        expect(table.className).not.toContain("[&_tbody_tr_td:not(:first-child)]:shadow-[inset_1px_1px");
        expect(table.className).not.toContain("nth-child(odd)");
        expect(table.className).not.toContain(":hover_td]:cursor-pointer");
        expect(table.className).not.toContain("[&_td]:py-[6px]");
    });

    it("adds cell-border classes when `bordered`", () => {
        renderTable({ bordered: true });
        const table = screen.getByRole("table");
        expect(table.className).toContain("[&_tbody_tr_td:not(:first-child)]:shadow-[inset_1px_1px_0_0_rgba(17,20,24,0.15)]");
    });

    it("adds odd-row stripe background when `striped`", () => {
        renderTable({ striped: true });
        const table = screen.getByRole("table");
        expect(table.className).toContain("[&_tbody_tr:nth-child(odd)_td]:bg-[rgba(143,153,168,0.15)]");
    });

    it("adds hover/active + pointer cursor when `interactive`", () => {
        renderTable({ interactive: true });
        const table = screen.getByRole("table");
        expect(table.className).toContain("[&_tbody_tr:hover_td]:cursor-pointer");
        expect(table.className).toContain("[&_tbody_tr:hover_td]:bg-[rgba(143,153,168,0.3)]");
    });

    it("reduces vertical cell padding when `compact`", () => {
        renderTable({ compact: true });
        const table = screen.getByRole("table");
        expect(table.className).toContain("[&_td]:py-[6px]");
        expect(table.className).toContain("[&_th]:py-[6px]");
    });

    it("composes multiple variants together", () => {
        renderTable({ bordered: true, striped: true });
        const table = screen.getByRole("table");
        expect(table.className).toContain("[&_tbody_tr_td:not(:first-child)]:shadow-[inset_1px_1px_0_0_rgba(17,20,24,0.15)]");
        expect(table.className).toContain("[&_tbody_tr:nth-child(odd)_td]:bg-[rgba(143,153,168,0.15)]");
    });
});

describe("HTMLTable — passthrough", () => {
    it("merges a consumer className and forwards arbitrary table props", () => {
        renderTable({ className: "my-table", "aria-label": "Team roster", id: "roster" });
        const table = screen.getByRole("table", { name: "Team roster" });
        expect(table).toHaveClass("my-table");
        expect(table).toHaveClass("text-body"); // base classes still present
        expect(table).toHaveAttribute("id", "roster");
    });
});
