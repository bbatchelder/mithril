/**
 * DataTable selection model — a small, framework-agnostic region reducer (Loop 3).
 *
 * This is **our own** region model, NOT TanStack's checkbox `rowSelection` state. It
 * mirrors Blueprint `Table2`'s `IRegion`: a selection is a list of rectangular regions,
 * each of which may be a cell/cell-range, a full-row band, a full-column band, or the
 * whole table. The grid paints each region as a translucent-blue overlay (see `body.tsx`)
 * and the single *focused* cell as a 2px outline.
 *
 * The reducer is pure so the click/shift-click/drag sequences are unit-testable in jsdom
 * (no layout needed) — `data-table.tsx` derives its handlers from it.
 *
 * Blueprint overlay spec (`@blueprintjs/table` `table.css`, verified):
 *   .bp6-table-selection-region  bg rgba(45,114,210,0.1)  border 1px solid #2d72d2   (light)
 *   .bp6-dark …                  bg rgba(76,144,240,0.1)  border 1px solid #4c90f0   (dark)
 *   .bp6-table-focus-region      border 2px solid #2d72d2  (both themes)
 *   header/gutter selected tint  rgba(45,114,210,0.1)
 */

/** An inclusive `[start, end]` range; normalized so `start <= end`. */
export type CellRange = [number, number];

/**
 * A rectangular selection region (mirrors Blueprint's `IRegion`):
 * - `rows: null` ⇒ a full **column** band (spans every row),
 * - `cols: null` ⇒ a full **row** band (spans every column),
 * - both set    ⇒ a cell or cell-range,
 * - both `null` ⇒ the whole table.
 */
export interface SelectionRegion {
    rows: CellRange | null;
    cols: CellRange | null;
}

/** Zero-based cell coordinate. Columns count **data** columns only — the gutter is not one. */
export interface CellCoord {
    row: number;
    col: number;
}

/** Internal interaction state threaded through the reducer. */
export interface SelectionState {
    /** Active regions. Single-element in `selectionMode="single"`; multi is additive (Loop 7). */
    regions: SelectionRegion[];
    /** The focused cell (2px outline + keyboard-nav origin), or `null`. */
    focusedCell: CellCoord | null;
    /** The drag/shift origin. Internal only — never controlled. */
    anchor: CellCoord | null;
}

export const EMPTY_SELECTION: SelectionState = { regions: [], focusedCell: null, anchor: null };

/** A pointer interaction the grid can dispatch. `extend` = shift-click / drag-extend. */
export type SelectionAction =
    | { type: "cell"; row: number; col: number; extend?: boolean; additive?: boolean }
    | { type: "rows"; row: number; extend?: boolean; additive?: boolean }
    | { type: "columns"; col: number; extend?: boolean; additive?: boolean }
    | { type: "extendTo"; row: number; col: number }
    | { type: "clear" };

// ── Constructors ────────────────────────────────────────────────────────────

function order(a: number, b: number): CellRange {
    return a <= b ? [a, b] : [b, a];
}

/** A single-cell region. */
export function cellRegion(row: number, col: number): SelectionRegion {
    return { rows: [row, row], cols: [col, col] };
}
/** A full-row band spanning every column. */
export function rowsRegion(r0: number, r1: number): SelectionRegion {
    return { rows: order(r0, r1), cols: null };
}
/** A full-column band spanning every row. */
export function columnsRegion(c0: number, c1: number): SelectionRegion {
    return { rows: null, cols: order(c0, c1) };
}

// ── Predicates ──────────────────────────────────────────────────────────────

function rangeEq(a: CellRange | null, b: CellRange | null): boolean {
    return a === null ? b === null : b !== null && a[0] === b[0] && a[1] === b[1];
}

/** Structural equality of two regions. */
export function regionsEqual(a: SelectionRegion, b: SelectionRegion): boolean {
    return rangeEq(a.rows, b.rows) && rangeEq(a.cols, b.cols);
}

/** Order-independent equality of two region lists. */
export function regionListsEqual(a: SelectionRegion[], b: SelectionRegion[]): boolean {
    return a.length === b.length && a.every((r, i) => regionsEqual(r, b[i]));
}

/** Equality of two (possibly null) cell coords. */
export function cellsEqual(a: CellCoord | null, b: CellCoord | null): boolean {
    return a === null ? b === null : b !== null && a.row === b.row && a.col === b.col;
}

/** Does any region cover cell (row, col)? */
export function isCellSelected(regions: SelectionRegion[], row: number, col: number): boolean {
    return regions.some((r) => {
        const inRows = r.rows === null || (row >= r.rows[0] && row <= r.rows[1]);
        const inCols = r.cols === null || (col >= r.cols[0] && col <= r.cols[1]);
        return inRows && inCols;
    });
}

/** Is column `col` fully selected (a column band or whole-table region covers it)? */
export function isColumnSelected(regions: SelectionRegion[], col: number): boolean {
    return regions.some((r) => r.rows === null && (r.cols === null || (col >= r.cols[0] && col <= r.cols[1])));
}

/** Is row `row` fully selected (a row band or whole-table region covers it)? */
export function isRowSelected(regions: SelectionRegion[], row: number): boolean {
    return regions.some((r) => r.cols === null && (r.rows === null || (row >= r.rows[0] && row <= r.rows[1])));
}

// ── Reducer ─────────────────────────────────────────────────────────────────

/** Replace the active (last) region, or seed the list if empty. */
function withActive(regions: SelectionRegion[], region: SelectionRegion, additive: boolean): SelectionRegion[] {
    if (additive) return [...regions, region];
    return [region];
}

/** Extend the active region from `anchor` to `(row, col)`, preserving its kind. */
function extendActive(state: SelectionState, row: number, col: number): SelectionState {
    if (!state.anchor || state.regions.length === 0) {
        return selectionReducer(state, { type: "cell", row, col });
    }
    const active = state.regions[state.regions.length - 1];
    const a = state.anchor;
    let region: SelectionRegion;
    if (active.cols === null) region = rowsRegion(a.row, row); // row band
    else if (active.rows === null) region = columnsRegion(a.col, col); // column band
    else region = { rows: order(a.row, row), cols: order(a.col, col) }; // cell range
    return {
        regions: [...state.regions.slice(0, -1), region],
        focusedCell: state.focusedCell ?? a,
        anchor: a,
    };
}

/**
 * Apply a pointer interaction to the selection state. Pure.
 *
 * - `cell` (no extend) → single-cell region; sets focus + anchor to that cell.
 * - `rows` / `columns` (no extend) → a full band; focus goes to the band's near corner.
 * - any action with `extend` (shift) or an `extendTo` (drag) → grows the active region
 *   from the current anchor, keeping the anchor and focus fixed.
 */
export function selectionReducer(state: SelectionState, action: SelectionAction): SelectionState {
    switch (action.type) {
        case "clear":
            return EMPTY_SELECTION;
        case "extendTo":
            return extendActive(state, action.row, action.col);
        case "cell": {
            if (action.extend) return extendActive(state, action.row, action.col);
            const region = cellRegion(action.row, action.col);
            return {
                regions: withActive(state.regions, region, !!action.additive),
                focusedCell: { row: action.row, col: action.col },
                anchor: { row: action.row, col: action.col },
            };
        }
        case "rows": {
            if (action.extend) return extendActive(state, action.row, 0);
            const region = rowsRegion(action.row, action.row);
            return {
                regions: withActive(state.regions, region, !!action.additive),
                focusedCell: { row: action.row, col: 0 },
                anchor: { row: action.row, col: 0 },
            };
        }
        case "columns": {
            if (action.extend) return extendActive(state, 0, action.col);
            const region = columnsRegion(action.col, action.col);
            return {
                regions: withActive(state.regions, region, !!action.additive),
                focusedCell: { row: 0, col: action.col },
                anchor: { row: 0, col: action.col },
            };
        }
    }
}

// ── Clipboard ─────────────────────────────────────────────────────────────────

/**
 * Serialize a selection region to **TSV** — tab-separated columns, newline-separated rows —
 * the format Blueprint's `Table2` copies and that spreadsheets paste natively (Loop 6).
 *
 * `getValue(row, col)` returns the raw value for a data cell; `null`/`undefined` become an
 * empty field. A `null` `rows` (column band) expands to every row `0..rowCount-1`; a `null`
 * `cols` (row band) to every column `0..colCount-1`; both `null` (whole table) to everything.
 */
export function regionToTSV(
    region: SelectionRegion,
    rowCount: number,
    colCount: number,
    getValue: (row: number, col: number) => unknown,
): string {
    const r0 = region.rows ? region.rows[0] : 0;
    const r1 = region.rows ? region.rows[1] : rowCount - 1;
    const c0 = region.cols ? region.cols[0] : 0;
    const c1 = region.cols ? region.cols[1] : colCount - 1;
    const lines: string[] = [];
    for (let r = r0; r <= r1; r++) {
        const cells: string[] = [];
        for (let c = c0; c <= c1; c++) {
            const v = getValue(r, c);
            cells.push(v == null ? "" : String(v));
        }
        lines.push(cells.join("\t"));
    }
    return lines.join("\n");
}

// ── Pixel geometry ──────────────────────────────────────────────────────────

/** Static geometry the body needs to turn a region into a pixel rect. */
export interface GridGeometry {
    /**
     * Cumulative left-edge x of each data column, length `colCount + 1`.
     * `colX[0]` = gutter width (first data column's left edge); `colX[colCount]` = right edge.
     */
    colX: number[];
    rowHeight: number;
    rowCount: number;
    colCount: number;
}

export interface PixelRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

/** The absolute pixel rect (within the body) for a region. */
export function regionRect(region: SelectionRegion, geo: GridGeometry): PixelRect {
    const r0 = region.rows ? region.rows[0] : 0;
    const r1 = region.rows ? region.rows[1] : geo.rowCount - 1;
    const c0 = region.cols ? region.cols[0] : 0;
    const c1 = region.cols ? region.cols[1] : geo.colCount - 1;
    return {
        x: geo.colX[c0],
        y: r0 * geo.rowHeight,
        width: geo.colX[c1 + 1] - geo.colX[c0],
        height: (r1 - r0 + 1) * geo.rowHeight,
    };
}
