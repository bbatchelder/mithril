import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { axe } from "@/test/axe";

import { DataTable, type DataTableColumn } from "../data-table";

/**
 * DataTable Loop 1 — the static, non-virtualized skeleton. Visual fidelity (cell
 * borders, header/gutter styling) is covered by the comparison harness against
 * Blueprint's <Table2>; here we assert the engine wiring + DOM contract: grid roles,
 * header/gutter/cell rendering, accessor + custom-cell output, and the numbered gutter.
 * (Row virtualization, selection, resize, editing land in later loops.)
 */

interface Person {
    name: string;
    age: number;
    role: string;
}

const ROWS: Person[] = [
    { name: "Alice", age: 34, role: "Engineer" },
    { name: "Bob", age: 29, role: "Designer" },
    { name: "Carol", age: 41, role: "Manager" },
];

const COLUMNS: DataTableColumn<Person>[] = [
    { id: "name", header: "Name", accessor: "name" },
    { id: "age", header: "Age", accessor: "age", align: "right" },
    { id: "role", header: "Role", accessor: (r) => r.role.toUpperCase() },
];

function renderTable(props?: Partial<Parameters<typeof DataTable<Person>>[0]>) {
    return render(<DataTable<Person> data={ROWS} columns={COLUMNS} {...props} />);
}

describe("DataTable — structure", () => {
    it("renders a role=grid with aria row/col counts", () => {
        renderTable();
        const grid = screen.getByRole("grid");
        expect(grid).toHaveAttribute("aria-rowcount", "3");
        expect(grid).toHaveAttribute("aria-colcount", "3");
    });

    it("renders one columnheader per column with the header text", () => {
        renderTable();
        const headers = screen.getAllByRole("columnheader");
        expect(headers.map((h) => h.textContent)).toEqual(["Name", "Age", "Role"]);
    });

    it("renders a gridcell per data cell (rows × columns)", () => {
        renderTable();
        expect(screen.getAllByRole("gridcell")).toHaveLength(ROWS.length * COLUMNS.length);
    });

    it("resolves both key accessors and function accessors", () => {
        renderTable();
        expect(screen.getByRole("gridcell", { name: "Alice" })).toBeInTheDocument();
        expect(screen.getByRole("gridcell", { name: "34" })).toBeInTheDocument();
        // function accessor: role upper-cased
        expect(screen.getByRole("gridcell", { name: "ENGINEER" })).toBeInTheDocument();
    });

    it("applies a custom `cell` renderer over the accessor value", () => {
        const cols: DataTableColumn<Person>[] = [
            { id: "name", header: "Name", accessor: "name", cell: (ctx) => `#${ctx.rowIndex}: ${ctx.value}` },
        ];
        render(<DataTable<Person> data={ROWS} columns={cols} />);
        expect(screen.getByRole("gridcell", { name: "#0: Alice" })).toBeInTheDocument();
        expect(screen.getByRole("gridcell", { name: "#2: Carol" })).toBeInTheDocument();
    });
});

describe("DataTable — numbered gutter", () => {
    it("renders a 1-based row-header number per row by default", () => {
        renderTable();
        const rowHeaders = screen.getAllByRole("rowheader");
        expect(rowHeaders.map((h) => h.textContent)).toEqual(["1", "2", "3"]);
    });

    it("omits the gutter when numberedRows is false", () => {
        renderTable({ numberedRows: false });
        expect(screen.queryAllByRole("rowheader")).toHaveLength(0);
        // cells unaffected
        expect(screen.getAllByRole("gridcell")).toHaveLength(ROWS.length * COLUMNS.length);
    });
});

describe("DataTable — alignment + height", () => {
    it("applies the alignment class from a column's `align`", () => {
        renderTable();
        const ageCell = screen.getByRole("gridcell", { name: "34" });
        expect(ageCell.className).toContain("text-right");
        const nameCell = screen.getByRole("gridcell", { name: "Alice" });
        expect(nameCell.className).toContain("text-left");
    });

    it("sets a fixed scroll height when `height` is provided", () => {
        renderTable({ height: 200 });
        expect(screen.getByRole("grid")).toHaveStyle({ height: "200px" });
    });

    it("uses Blueprint's 12px cell type scale", () => {
        renderTable();
        const cell = screen.getByRole("gridcell", { name: "Alice" });
        expect(cell.className).toContain("text-[12px]");
    });
});

describe("DataTable — a11y", () => {
    it("has no axe violations", async () => {
        const { container } = renderTable();
        // grid needs the rows wired with role=row; assert the smoke net passes.
        const rows = within(screen.getByRole("grid")).getAllByRole("row");
        expect(rows.length).toBeGreaterThan(0);
        expect(await axe(container)).toHaveNoViolations();
    });
});
