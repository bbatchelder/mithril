import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { axe } from "@/test/axe";

import { DataTable, type DataTableColumn } from "../data-table";
import { regionToTSV } from "../data-table/selection";

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

describe("DataTable — selection (Loop 3)", () => {
    it("controlled selection marks the covered cells aria-selected", () => {
        renderTable({ selection: [{ rows: [1, 2], cols: [1, 2] }], focusedCell: { row: 1, col: 1 } });
        expect(screen.getByText("29")).toHaveAttribute("aria-selected", "true"); // Bob age (1,1)
        expect(screen.getByText("MANAGER")).toHaveAttribute("aria-selected", "true"); // Carol role (2,2)
        expect(screen.getByText("Alice")).toHaveAttribute("aria-selected", "false"); // (0,0)
    });

    it("clicking a cell selects it (uncontrolled)", () => {
        renderTable();
        const cell = screen.getByText("Bob");
        fireEvent.mouseDown(cell);
        expect(cell).toHaveAttribute("aria-selected", "true");
        expect(screen.getByText("Alice")).toHaveAttribute("aria-selected", "false");
    });

    it("clicking the gutter selects the whole row", () => {
        renderTable();
        const rowHeaders = screen.getAllByRole("rowheader");
        fireEvent.mouseDown(rowHeaders[1]); // Bob's row
        expect(rowHeaders[1]).toHaveAttribute("aria-selected", "true");
        expect(screen.getByText("Bob")).toHaveAttribute("aria-selected", "true");
        expect(screen.getByText("29")).toHaveAttribute("aria-selected", "true");
        expect(screen.getByText("DESIGNER")).toHaveAttribute("aria-selected", "true");
    });

    it("clicking a header selects the whole column", () => {
        renderTable();
        const headers = screen.getAllByRole("columnheader");
        fireEvent.mouseDown(headers[1]); // Age column
        expect(headers[1]).toHaveAttribute("aria-selected", "true");
        expect(screen.getByText("34")).toHaveAttribute("aria-selected", "true"); // Alice age
        expect(screen.getByText("29")).toHaveAttribute("aria-selected", "true"); // Bob age
        expect(screen.getByText("Bob")).toHaveAttribute("aria-selected", "false"); // name column
    });

    it("shift-click extends a cell range from the first click", () => {
        renderTable();
        fireEvent.mouseDown(screen.getByText("Bob")); // (1,0)
        fireEvent.mouseDown(screen.getByText("MANAGER"), { shiftKey: true }); // (2,2)
        // The 1..2 × 0..2 block is now selected.
        expect(screen.getByText("Bob")).toHaveAttribute("aria-selected", "true");
        expect(screen.getByText("41")).toHaveAttribute("aria-selected", "true");
        expect(screen.getByText("Alice")).toHaveAttribute("aria-selected", "false"); // row 0 excluded
    });

    it("selectionMode=none ignores clicks", () => {
        renderTable({ selectionMode: "none" });
        const cell = screen.getByText("Bob");
        fireEvent.mouseDown(cell);
        expect(cell).toHaveAttribute("aria-selected", "false");
    });
});

describe("DataTable — column resize (Loop 4)", () => {
    it("renders a resize handle per column only when resizing is enabled", () => {
        const { container, rerender } = render(<DataTable<Person> data={ROWS} columns={COLUMNS} />);
        expect(container.querySelectorAll("[data-resize-handle]")).toHaveLength(0);
        rerender(<DataTable<Person> data={ROWS} columns={COLUMNS} enableColumnResizing />);
        expect(container.querySelectorAll("[data-resize-handle]")).toHaveLength(COLUMNS.length);
    });

    it("dragging a handle widens the column and commits on mouse up", () => {
        const { container } = render(
            <DataTable<Person> data={ROWS} columns={COLUMNS} enableColumnResizing />,
        );
        const widthOf = () => parseInt(getComputedStyle(screen.getAllByRole("columnheader")[0]).width, 10);
        expect(widthOf()).toBe(150); // default column size
        const handle = container.querySelectorAll("[data-resize-handle]")[0];
        fireEvent.mouseDown(handle, { clientX: 150 });
        fireEvent.mouseMove(document, { clientX: 220 });
        // Mid-drag: the full-height blue guide line is shown at the projected edge, and the
        // ew-resize cursor overlay is mounted; the real column widths stay frozen (onEnd).
        const guide = container.querySelector(".inset-y-0.bg-\\[\\#2d72d2\\]");
        expect(guide).not.toBeNull();
        expect(guide).toHaveStyle({ left: "247px" }); // gutter 30 + new width 220 − 3px guide
        expect(container.querySelector(".fixed.cursor-ew-resize")).not.toBeNull();
        expect(widthOf()).toBe(150); // not yet committed
        // `columnResizeMode:"onEnd"` commits from the mouse-*up* position (+70px here).
        fireEvent.mouseUp(document, { clientX: 220 });
        expect(widthOf()).toBe(220);
        expect(container.querySelector(".fixed.cursor-ew-resize")).toBeNull(); // overlay gone
    });

    it("does not render handles when a column opts out via enableResizing:false", () => {
        const mixed: DataTableColumn<Person>[] = [
            { ...COLUMNS[0], enableResizing: false },
            COLUMNS[1],
            COLUMNS[2],
        ];
        const { container } = render(
            <DataTable<Person> data={ROWS} columns={mixed} enableColumnResizing />,
        );
        expect(container.querySelectorAll("[data-resize-handle]")).toHaveLength(2);
    });

    it("updates the selection overlay geometry after a resize (regression)", () => {
        // A column selection over column 0; resizing column 0 must grow its overlay, not
        // leave it boxed at the old width. (Bug: geo memo keyed on the stable leafColumns
        // array ref, so colX stayed stale after a resize.)
        const { container } = render(
            <DataTable<Person>
                data={ROWS}
                columns={COLUMNS}
                enableColumnResizing
                selection={[{ rows: null, cols: [0, 0] }]}
            />,
        );
        const overlayWidth = () =>
            parseInt((container.querySelector("[data-selection-region]") as HTMLElement).style.width, 10);
        expect(overlayWidth()).toBe(150); // column 0 default width
        const handle = container.querySelectorAll("[data-resize-handle]")[0];
        fireEvent.mouseDown(handle, { clientX: 150 });
        fireEvent.mouseUp(document, { clientX: 230 }); // +80px
        expect(overlayWidth()).toBe(230);
    });

    it("grabbing a resize handle does not also select the column", () => {
        const { container } = render(
            <DataTable<Person> data={ROWS} columns={COLUMNS} enableColumnResizing />,
        );
        const handle = container.querySelectorAll("[data-resize-handle]")[0];
        fireEvent.mouseDown(handle, { clientX: 150 });
        fireEvent.mouseUp(document);
        expect(screen.getAllByRole("columnheader")[0]).toHaveAttribute("aria-selected", "false");
    });
});

describe("DataTable — column reorder (Loop 4b)", () => {
    const headerNames = () =>
        screen.getAllByRole("columnheader").map((h) => h.textContent?.trim());

    it("renders a reorder handle per column only when reordering is enabled", () => {
        const { container, rerender } = render(<DataTable<Person> data={ROWS} columns={COLUMNS} />);
        expect(container.querySelectorAll("[data-reorder-handle]")).toHaveLength(0);
        rerender(<DataTable<Person> data={ROWS} columns={COLUMNS} enableColumnReordering />);
        expect(container.querySelectorAll("[data-reorder-handle]")).toHaveLength(COLUMNS.length);
    });

    it("dragging a handle past the threshold reorders the columns on release", () => {
        let order: string[] | undefined;
        const { container } = render(
            <DataTable<Person>
                data={ROWS}
                columns={COLUMNS}
                enableColumnReordering
                numberedRows={false}
                onColumnOrderChange={(o) => (order = o)}
            />,
        );
        expect(headerNames()).toEqual(["Name", "Age", "Role"]);
        // Grab the Name column's handle (col 0) and drag it past Role's centre.
        const handle = container.querySelectorAll("[data-reorder-handle]")[0];
        fireEvent.mouseDown(handle, { clientX: 0 });
        // No gutter; every column is the default 150px → Name [0,150) Age [150,300) Role
        // [300,450). Drop past Role's centre (375) so Name lands last.
        fireEvent.mouseMove(document, { clientX: 400 });
        // Mid-drag: the blue drop guide + grabbing-cursor overlay are mounted.
        expect(container.querySelector("[data-reorder-guide]")).not.toBeNull();
        expect(container.querySelector(".fixed.cursor-grabbing")).not.toBeNull();
        fireEvent.mouseUp(document);
        expect(order).toEqual(["age", "role", "name"]);
        expect(headerNames()).toEqual(["Age", "Role", "Name"]);
        // Overlay + guide cleared; the moved column stays selected at its new index (2).
        expect(container.querySelector(".fixed.cursor-grabbing")).toBeNull();
        expect(screen.getAllByRole("columnheader")[2]).toHaveAttribute("aria-selected", "true");
    });

    it("grabbing a handle does not select the column", () => {
        const { container } = render(
            <DataTable<Person> data={ROWS} columns={COLUMNS} enableColumnReordering numberedRows={false} />,
        );
        const handle = container.querySelectorAll("[data-reorder-handle]")[0];
        fireEvent.mouseDown(handle, { clientX: 0 });
        fireEvent.mouseUp(document); // released without moving
        expect(screen.getAllByRole("columnheader")[0]).toHaveAttribute("aria-selected", "false");
    });

    it("a grab without crossing the threshold leaves the order unchanged", () => {
        let changed = false;
        const { container } = render(
            <DataTable<Person>
                data={ROWS}
                columns={COLUMNS}
                enableColumnReordering
                numberedRows={false}
                onColumnOrderChange={() => (changed = true)}
            />,
        );
        const handle = container.querySelectorAll("[data-reorder-handle]")[0];
        fireEvent.mouseDown(handle, { clientX: 0 });
        fireEvent.mouseMove(document, { clientX: 2 }); // < 5px threshold
        fireEvent.mouseUp(document);
        expect(changed).toBe(false);
        expect(headerNames()).toEqual(["Name", "Age", "Role"]);
    });
});

describe("DataTable — editable cells (Loop 5)", () => {
    const EDITABLE_COLUMNS: DataTableColumn<Person>[] = [
        { id: "name", header: "Name", accessor: "name", editable: true },
        { id: "age", header: "Age", accessor: "age", align: "right" },
        { id: "role", header: "Role", accessor: (r) => r.role, editable: true },
    ];

    it("double-clicking an editable cell opens an input seeded with the value", () => {
        const { container } = render(
            <DataTable<Person> data={ROWS} columns={EDITABLE_COLUMNS} numberedRows={false} />,
        );
        // No editor at rest.
        expect(container.querySelector("[data-editable-cell]")).toBeNull();
        const aliceCell = screen.getByRole("gridcell", { name: "Alice" });
        fireEvent.doubleClick(aliceCell);
        const input = container.querySelector<HTMLInputElement>("[data-editable-cell]");
        expect(input).not.toBeNull();
        expect(input!.value).toBe("Alice");
    });

    it("a non-editable cell does not open an editor on double-click", () => {
        const { container } = render(
            <DataTable<Person> data={ROWS} columns={EDITABLE_COLUMNS} numberedRows={false} />,
        );
        fireEvent.doubleClick(screen.getByRole("gridcell", { name: "34" })); // Age — not editable
        expect(container.querySelector("[data-editable-cell]")).toBeNull();
    });

    it("typing + Enter commits the new value via onCellEdit and closes the editor", () => {
        const edits: Array<{ row: number; col: number; columnId: string; value: string }> = [];
        const { container } = render(
            <DataTable<Person>
                data={ROWS}
                columns={EDITABLE_COLUMNS}
                numberedRows={false}
                onCellEdit={(e) => edits.push(e)}
            />,
        );
        fireEvent.doubleClick(screen.getByRole("gridcell", { name: "Bob" })); // row 1, col 0
        const input = container.querySelector<HTMLInputElement>("[data-editable-cell]")!;
        fireEvent.change(input, { target: { value: "Bobby" } });
        fireEvent.keyDown(input, { key: "Enter" });
        expect(edits).toEqual([{ row: 1, col: 0, columnId: "name", value: "Bobby" }]);
        // Editor closed on commit.
        expect(container.querySelector("[data-editable-cell]")).toBeNull();
    });

    it("blur commits the current draft", () => {
        const edits: Array<{ columnId: string; value: string }> = [];
        const { container } = render(
            <DataTable<Person>
                data={ROWS}
                columns={EDITABLE_COLUMNS}
                numberedRows={false}
                onCellEdit={(e) => edits.push({ columnId: e.columnId, value: e.value })}
            />,
        );
        fireEvent.doubleClick(screen.getByRole("gridcell", { name: "Engineer" })); // row 0, col 2 (role)
        const input = container.querySelector<HTMLInputElement>("[data-editable-cell]")!;
        fireEvent.change(input, { target: { value: "Lead" } });
        fireEvent.blur(input);
        expect(edits).toEqual([{ columnId: "role", value: "Lead" }]);
    });

    it("Escape reverts — no onCellEdit, editor closes, value unchanged", () => {
        let called = false;
        const { container } = render(
            <DataTable<Person>
                data={ROWS}
                columns={EDITABLE_COLUMNS}
                numberedRows={false}
                onCellEdit={() => (called = true)}
            />,
        );
        fireEvent.doubleClick(screen.getByRole("gridcell", { name: "Alice" }));
        const input = container.querySelector<HTMLInputElement>("[data-editable-cell]")!;
        fireEvent.change(input, { target: { value: "Zzz" } });
        fireEvent.keyDown(input, { key: "Escape" });
        expect(called).toBe(false);
        expect(container.querySelector("[data-editable-cell]")).toBeNull();
        expect(screen.getByRole("gridcell", { name: "Alice" })).toBeInTheDocument();
    });
});

describe("DataTable — keyboard navigation + clipboard (Loop 6)", () => {
    const EDITABLE_COLUMNS: DataTableColumn<Person>[] = [
        { id: "name", header: "Name", accessor: "name", editable: true },
        { id: "age", header: "Age", accessor: "age", align: "right" },
        { id: "role", header: "Role", accessor: (r) => r.role, editable: true },
    ];
    const selectedTexts = () =>
        screen
            .getAllByRole("gridcell")
            .filter((c) => c.getAttribute("aria-selected") === "true")
            .map((c) => c.textContent);

    function focusCell(text: string) {
        fireEvent.mouseDown(screen.getByRole("gridcell", { name: text }));
        fireEvent.mouseUp(document);
    }

    it("the grid is focusable when selectable, and not when selection is off", () => {
        const { rerender } = render(<DataTable<Person> data={ROWS} columns={COLUMNS} />);
        expect(screen.getByRole("grid")).toHaveAttribute("tabindex", "0");
        rerender(<DataTable<Person> data={ROWS} columns={COLUMNS} selectionMode="none" />);
        expect(screen.getByRole("grid")).not.toHaveAttribute("tabindex");
    });

    it("arrow keys move the focused single-cell selection", () => {
        renderTable();
        const grid = screen.getByRole("grid");
        focusCell("Alice"); // {0,0}
        fireEvent.keyDown(grid, { key: "ArrowDown" });
        expect(selectedTexts()).toEqual(["Bob"]); // {1,0}
        fireEvent.keyDown(grid, { key: "ArrowRight" });
        expect(selectedTexts()).toEqual(["29"]); // {1,1}
        fireEvent.keyDown(grid, { key: "ArrowUp" });
        expect(selectedTexts()).toEqual(["34"]); // {0,1}
    });

    it("arrow keys clamp at the grid edges", () => {
        renderTable();
        const grid = screen.getByRole("grid");
        focusCell("Alice"); // {0,0}
        fireEvent.keyDown(grid, { key: "ArrowUp" }); // already at top row
        fireEvent.keyDown(grid, { key: "ArrowLeft" }); // already at first col
        expect(selectedTexts()).toEqual(["Alice"]);
    });

    it("Shift+Arrow extends the region from the anchor", () => {
        renderTable();
        const grid = screen.getByRole("grid");
        focusCell("Alice"); // anchor {0,0}
        fireEvent.keyDown(grid, { key: "ArrowDown", shiftKey: true });
        // region rows[0,1] × cols[0,0] → Alice + Bob selected.
        expect(selectedTexts()).toEqual(["Alice", "Bob"]);
        fireEvent.keyDown(grid, { key: "ArrowRight", shiftKey: true });
        // region rows[0,1] × cols[0,1] → 4 cells.
        expect(selectedTexts()).toEqual(["Alice", "34", "Bob", "29"]);
    });

    it("Tab wraps to the next row's first column at a row edge", () => {
        renderTable();
        const grid = screen.getByRole("grid");
        focusCell("ENGINEER"); // {0,2} — last column of row 0
        fireEvent.keyDown(grid, { key: "Tab" });
        expect(selectedTexts()).toEqual(["Bob"]); // wrapped to {1,0}
        fireEvent.keyDown(grid, { key: "Tab", shiftKey: true });
        expect(selectedTexts()).toEqual(["ENGINEER"]); // back to {0,2}
    });

    it("the first keystroke with no focus anchors at the top-left cell", () => {
        renderTable();
        const grid = screen.getByRole("grid");
        grid.focus();
        fireEvent.keyDown(grid, { key: "ArrowDown" });
        expect(selectedTexts()).toEqual(["Alice"]); // {0,0}, not {1,0}
    });

    it("Enter / F2 on an editable focused cell starts editing", () => {
        const { container } = render(
            <DataTable<Person> data={ROWS} columns={EDITABLE_COLUMNS} numberedRows={false} />,
        );
        const grid = screen.getByRole("grid");
        focusCell("Alice"); // editable column
        fireEvent.keyDown(grid, { key: "Enter" });
        expect(container.querySelector("[data-editable-cell]")).not.toBeNull();
        fireEvent.keyDown(screen.getByRole("grid"), { key: "Escape" }); // (no-op at grid level)
    });

    it("Enter on a NON-editable focused cell moves down instead of editing", () => {
        const { container } = render(
            <DataTable<Person> data={ROWS} columns={EDITABLE_COLUMNS} numberedRows={false} />,
        );
        const grid = screen.getByRole("grid");
        focusCell("34"); // Age — not editable, {0,1}
        fireEvent.keyDown(grid, { key: "Enter" });
        expect(container.querySelector("[data-editable-cell]")).toBeNull();
        expect(selectedTexts()).toEqual(["29"]); // moved down to {1,1}
    });

    it("committing an edit with Enter advances the focused cell downward", () => {
        const edits: string[] = [];
        render(
            <DataTable<Person>
                data={ROWS}
                columns={EDITABLE_COLUMNS}
                numberedRows={false}
                onCellEdit={(e) => edits.push(e.value)}
            />,
        );
        const grid = screen.getByRole("grid");
        focusCell("Alice"); // {0,0}
        fireEvent.keyDown(grid, { key: "Enter" }); // start editing
        const input = screen.getByDisplayValue("Alice");
        fireEvent.change(input, { target: { value: "Alicia" } });
        fireEvent.keyDown(input, { key: "Enter" }); // commit + move down
        expect(edits).toEqual(["Alicia"]);
        expect(selectedTexts()).toEqual(["Bob"]); // focus advanced to {1,0}
    });

    it("Cmd/Ctrl-C copies the selected region as TSV", () => {
        const writeText = vi.fn(() => Promise.resolve());
        const orig = Object.getOwnPropertyDescriptor(navigator, "clipboard");
        Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
        try {
            renderTable();
            const grid = screen.getByRole("grid");
            focusCell("Alice"); // {0,0}
            fireEvent.keyDown(grid, { key: "ArrowDown", shiftKey: true }); // extend to {1,0}
            fireEvent.keyDown(grid, { key: "ArrowRight", shiftKey: true }); // extend to {1,1}
            fireEvent.keyDown(grid, { key: "c", ctrlKey: true });
            expect(writeText).toHaveBeenCalledTimes(1);
            // rows 0-1 × cols 0-1 → name/age grid, tab + newline separated.
            expect(writeText.mock.calls[0][0]).toBe("Alice\t34\nBob\t29");
        } finally {
            if (orig) Object.defineProperty(navigator, "clipboard", orig);
            else delete (navigator as { clipboard?: unknown }).clipboard;
        }
    });
});

describe("regionToTSV (Loop 6)", () => {
    const val = (r: number, c: number) => `r${r}c${c}`;
    it("serializes a cell range as tab + newline separated rows", () => {
        expect(regionToTSV({ rows: [0, 1], cols: [1, 2] }, 3, 3, val)).toBe(
            "r0c1\tr0c2\nr1c1\tr1c2",
        );
    });
    it("expands a null rows range (column band) to every row", () => {
        expect(regionToTSV({ rows: null, cols: [0, 0] }, 3, 3, val)).toBe("r0c0\nr1c0\nr2c0");
    });
    it("expands a null cols range (row band) to every column", () => {
        expect(regionToTSV({ rows: [2, 2], cols: null }, 3, 3, val)).toBe("r2c0\tr2c1\tr2c2");
    });
    it("renders null/undefined values as empty fields", () => {
        expect(regionToTSV({ rows: [0, 0], cols: [0, 1] }, 1, 2, () => null)).toBe("\t");
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
