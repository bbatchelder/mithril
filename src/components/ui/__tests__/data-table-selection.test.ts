import { describe, expect, it } from "vitest";

import {
    EMPTY_SELECTION,
    cellRegion,
    columnsRegion,
    isCellSelected,
    isColumnSelected,
    isRowSelected,
    regionRect,
    regionsEqual,
    rowsRegion,
    selectionReducer,
    type GridGeometry,
    type SelectionAction,
    type SelectionState,
} from "../data-table/selection";

/**
 * DataTable selection model (Loop 3) — pure-function tests for the region reducer and the
 * pixel geometry. These need no layout, so jsdom runs them faithfully; the *visual* overlay
 * (blue fill/border, focused outline) is gated by the comparison harness against Blueprint.
 */

/** Apply a sequence of actions starting from empty (mimics click/shift-click/drag). */
function run(...actions: SelectionAction[]): SelectionState {
    return actions.reduce(selectionReducer, EMPTY_SELECTION);
}

describe("selectionReducer — single cell", () => {
    it("selects one cell and sets focus + anchor", () => {
        const s = run({ type: "cell", row: 2, col: 1 });
        expect(s.regions).toEqual([cellRegion(2, 1)]);
        expect(s.focusedCell).toEqual({ row: 2, col: 1 });
        expect(s.anchor).toEqual({ row: 2, col: 1 });
    });

    it("a second plain click replaces the region (single mode)", () => {
        const s = run({ type: "cell", row: 0, col: 0 }, { type: "cell", row: 3, col: 2 });
        expect(s.regions).toEqual([cellRegion(3, 2)]);
        expect(s.focusedCell).toEqual({ row: 3, col: 2 });
    });
});

describe("selectionReducer — shift-click / drag extends a cell range", () => {
    it("shift-click grows the range from the anchor, keeping focus at the anchor", () => {
        const s = run({ type: "cell", row: 1, col: 1 }, { type: "cell", row: 3, col: 2, extend: true });
        expect(s.regions).toEqual([{ rows: [1, 3], cols: [1, 2] }]);
        expect(s.focusedCell).toEqual({ row: 1, col: 1 });
        expect(s.anchor).toEqual({ row: 1, col: 1 });
    });

    it("extends up-and-left, normalizing the range order", () => {
        const s = run({ type: "cell", row: 3, col: 3 }, { type: "extendTo", row: 1, col: 1 });
        expect(s.regions).toEqual([{ rows: [1, 3], cols: [1, 3] }]);
        expect(s.anchor).toEqual({ row: 3, col: 3 });
    });

    it("a drag re-extends from the same anchor on each move (not cumulatively)", () => {
        const s = run(
            { type: "cell", row: 2, col: 2 },
            { type: "extendTo", row: 3, col: 3 },
            { type: "extendTo", row: 0, col: 1 },
        );
        expect(s.regions).toEqual([{ rows: [0, 2], cols: [1, 2] }]);
    });

    it("a shift-click with no prior anchor falls back to a single-cell select", () => {
        const s = run({ type: "cell", row: 2, col: 1, extend: true });
        expect(s.regions).toEqual([cellRegion(2, 1)]);
    });
});

describe("selectionReducer — row and column bands", () => {
    it("gutter click selects a full row band", () => {
        const s = run({ type: "rows", row: 2 });
        expect(s.regions).toEqual([rowsRegion(2, 2)]);
        expect(regionsEqual(s.regions[0], { rows: [2, 2], cols: null })).toBe(true);
    });

    it("drag in the gutter extends the row band, ignoring the column", () => {
        const s = run({ type: "rows", row: 1 }, { type: "extendTo", row: 4, col: 0 });
        expect(s.regions).toEqual([rowsRegion(1, 4)]);
    });

    it("header click selects a full column band; drag extends it", () => {
        const s = run({ type: "columns", col: 1 }, { type: "extendTo", row: 0, col: 3 });
        expect(s.regions).toEqual([columnsRegion(1, 3)]);
    });

    it("clear resets to empty", () => {
        const s = run({ type: "rows", row: 2 }, { type: "clear" });
        expect(s).toEqual(EMPTY_SELECTION);
    });
});

describe("selection predicates", () => {
    it("isCellSelected covers cell ranges, row bands, and column bands", () => {
        expect(isCellSelected([{ rows: [1, 2], cols: [1, 2] }], 1, 2)).toBe(true);
        expect(isCellSelected([{ rows: [1, 2], cols: [1, 2] }], 0, 2)).toBe(false);
        expect(isCellSelected([rowsRegion(3, 3)], 3, 99)).toBe(true); // whole row
        expect(isCellSelected([columnsRegion(0, 0)], 99, 0)).toBe(true); // whole column
    });

    it("isColumnSelected / isRowSelected only fire for full bands", () => {
        expect(isColumnSelected([columnsRegion(1, 2)], 2)).toBe(true);
        expect(isColumnSelected([{ rows: [0, 0], cols: [2, 2] }], 2)).toBe(false); // a cell, not a band
        expect(isRowSelected([rowsRegion(1, 3)], 2)).toBe(true);
        expect(isRowSelected([{ rows: [2, 2], cols: [0, 0] }], 2)).toBe(false);
    });
});

describe("regionRect — pixel geometry", () => {
    // Gutter 30px, then three 100px columns → colX = [30, 130, 230, 330]. Rows 20px tall.
    const geo: GridGeometry = { colX: [30, 130, 230, 330], rowHeight: 20, rowCount: 10, colCount: 3 };

    it("places a cell range at the right offset and size", () => {
        expect(regionRect({ rows: [1, 2], cols: [1, 2] }, geo)).toEqual({
            x: 130,
            y: 20,
            width: 200, // cols 1..2 → 230-... = 330-130
            height: 40, // 2 rows
        });
    });

    it("a row band spans every column from the gutter edge", () => {
        expect(regionRect(rowsRegion(0, 0), geo)).toEqual({ x: 30, y: 0, width: 300, height: 20 });
    });

    it("a column band spans every row", () => {
        expect(regionRect(columnsRegion(2, 2), geo)).toEqual({ x: 230, y: 0, width: 100, height: 200 });
    });
});
