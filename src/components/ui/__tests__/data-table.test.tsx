import { render, screen, within } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { axe } from "@/test/axe";

import { DataTable, type DataTableColumn } from "../data-table";

/**
 * DataTable engine + DOM contract: grid roles, header/gutter/cell rendering, accessor +
 * custom-cell output, the numbered gutter, and (Loop 2) row virtualization. Visual
 * fidelity (cell borders, header/gutter styling) is covered by the comparison harness
 * against Blueprint's <Table2>.
 *
 * jsdom has no layout: `@tanstack/react-virtual` measures the scroll viewport via the
 * element's `offsetHeight` (0 in jsdom), so we stub it to a fixed 200px-tall viewport.
 * With a measurable viewport the virtualizer renders a realistic window — small datasets
 * render fully, a tall dataset with a fixed `height` renders only a windowed subset
 * (asserted below). (jsdom clamps `scrollTop` to 0, so scroll-driven *re*-windowing is
 * verified in a real browser via the compare harness, not here — see handoff 0085.)
 */
const VIEWPORT_H = 200;
let origOffsetHeight: PropertyDescriptor | undefined;
let origOffsetWidth: PropertyDescriptor | undefined;
beforeAll(() => {
    origOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
    origOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", { configurable: true, get: () => VIEWPORT_H });
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", { configurable: true, get: () => 800 });
});
afterAll(() => {
    if (origOffsetHeight) Object.defineProperty(HTMLElement.prototype, "offsetHeight", origOffsetHeight);
    if (origOffsetWidth) Object.defineProperty(HTMLElement.prototype, "offsetWidth", origOffsetWidth);
});

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

describe("DataTable — virtualization (Loop 2)", () => {
    const bigData: Person[] = Array.from({ length: 500 }, (_, i) => ({
        name: `Person ${i}`,
        age: 20 + (i % 50),
        role: i % 2 ? "Engineer" : "Designer",
    }));

    it("renders only a windowed subset of rows for a tall dataset", () => {
        render(<DataTable<Person> data={bigData} columns={COLUMNS} rowHeight={20} height={VIEWPORT_H} />);
        const rendered = screen.getAllByRole("row");
        // 200px viewport / 20px rows ≈ 10 visible + overscan — far fewer than 500.
        expect(rendered.length).toBeGreaterThan(0);
        expect(rendered.length).toBeLessThan(bigData.length / 2);
    });

    it("sizes the body spacer to the full virtual height (count × rowHeight)", () => {
        render(<DataTable<Person> data={bigData} columns={COLUMNS} rowHeight={20} height={VIEWPORT_H} />);
        const rowgroups = screen
            .getAllByRole("rowgroup")
            .filter((g) => g.style.height !== "");
        expect(rowgroups[0]).toHaveStyle({ height: `${bigData.length * 20}px` });
    });

    it("keeps the first windowed row at index 0 (gutter starts at 1)", () => {
        render(<DataTable<Person> data={bigData} columns={COLUMNS} rowHeight={20} height={VIEWPORT_H} />);
        const rowHeaders = screen.getAllByRole("rowheader");
        expect(rowHeaders[0]).toHaveTextContent("1");
    });

    it("connects the scroll viewport so the virtualizer subscribes to scroll", () => {
        // Regression guard (handoff 0085): the scroll element is owned by the parent but
        // the virtualizer runs in the child. With a plain useRef the child's effect fires
        // before the parent ref attaches, leaving scrollElement null — the grid renders its
        // initial window but never re-windows on scroll. A state-backed callback ref fixes
        // it. jsdom can't scroll, but we can assert the virtualizer attached a scroll
        // listener to the grid (which only happens once scrollElement is non-null).
        const added: Element[] = [];
        const orig = HTMLElement.prototype.addEventListener;
        HTMLElement.prototype.addEventListener = function (this: Element, type: string, ...rest: unknown[]) {
            if (type === "scroll") added.push(this);
            // @ts-expect-error passthrough
            return orig.call(this, type, ...rest);
        };
        try {
            const { container } = render(
                <DataTable<Person> data={bigData} columns={COLUMNS} rowHeight={20} height={VIEWPORT_H} />,
            );
            const grid = container.querySelector('[role="grid"]')!;
            expect(added).toContain(grid);
        } finally {
            HTMLElement.prototype.addEventListener = orig;
        }
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
