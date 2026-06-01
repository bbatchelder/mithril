import {
    getCoreRowModel,
    useReactTable,
    type ColumnDef,
    type Table,
} from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { DataTableBody } from "./data-table/body";
import { DataTableHeader } from "./data-table/header";
import {
    cellRegion,
    cellsEqual,
    columnsRegion,
    regionListsEqual,
    regionsToTSV,
    selectionReducer,
    type CellCoord,
    type SelectionAction,
    type SelectionRegion,
    type SelectionState,
} from "./data-table/selection";
import type { EditCommitMove } from "./data-table/editable-cell";

export type { CellCoord, SelectionRegion } from "./data-table/selection";

/**
 * How the grid responds to selection gestures.
 * - `"single"` — one region at a time; click/shift-click/drag.
 * - `"multi"` — Cmd/Ctrl-click adds further regions (Loop 7); clipboard copy serializes all.
 * - `"none"` — selection (and keyboard nav / clipboard) disabled.
 */
export type DataTableSelectionMode = "none" | "single" | "multi";

/**
 * DataTable — a virtualized, Blueprint-`Table2`-faithful data grid built on a
 * headless engine (TanStack Table) dressed in mithril's tokens.
 *
 * Unlike Blueprint's column-children API (`<Table2><Column cellRenderer/></Table2>`),
 * mithril takes a **modern flat `columns` array + `data`** — the native shape of
 * the engine we wrap, and the idiom of TanStack / AG Grid / MUI DataGrid. Custom
 * renderers, editability, and selection all compose as column-def fields / table state.
 *
 * Blueprint visual spec (`@blueprintjs/table` v6.1.1, `lib/css/table.css`):
 *   .bp6-table-cell            font-size:12px; height:20px; line-height:20px; padding:0 8px;
 *                              box-shadow: inset 0 -1px 0 <border>, inset -1px 0 0 <border>  (bottom+right)
 *   column header (.bp6-table-column-headers .bp6-table-header)
 *                              line-height:30px; min-height:30px; box-shadow: 0 1px 0 <border> (bottom)
 *                              header text (.bp6-table-column-name-text) font-size:14px (NOT 12px)
 *   row header / gutter (.bp6-table-row-name)
 *                              font-size:12px; padding:0 4px; text-align:right; min-width:30px; line-height:20px
 *                              box-shadow: inset 0 -1px 0 <border>, 1px 0 0 <border> (bottom+right)
 *   <border> = rgba(17,20,24,0.15) light · rgba(17,20,24,0.4) dark
 *   cell text = #1c2127 light · #f6f7f9 dark  (== mithril `--foreground`)
 *
 * This loop (P1.1 / Loop 1) ships the **static, non-virtualized skeleton**: the engine
 * wiring, the public API, the sticky header, the numbered row-header gutter, and the
 * ruled cells. Row virtualization, selection, resize/reorder, editing, keyboard nav,
 * clipboard, and loading state land in subsequent loops.
 *
 * @see https://blueprintjs.com/docs/#table
 */

// ── Public types ───────────────────────────────────────────────────────────

/** Render context passed to a column's custom `cell` renderer. */
export interface DataTableCellContext<TRow> {
    /** The accessor-resolved value for this cell. */
    value: unknown;
    /** The full row datum. */
    row: TRow;
    /** Zero-based index of the row in `data`. */
    rowIndex: number;
    /** The column's `id`. */
    columnId: string;
}

/** Horizontal alignment of a column's cell + header content. */
export type DataTableColumnAlign = "left" | "right" | "center";

/** Internal per-column metadata stashed in TanStack's `columnDef.meta`. */
export interface DataTableColumnMeta {
    align: DataTableColumnAlign;
    editable: boolean;
}

/** A single column definition. */
export interface DataTableColumn<TRow> {
    /** Stable column identifier (used for sizing/ordering/selection state). */
    id: string;
    /** Header content, or a function returning it. */
    header: React.ReactNode | (() => React.ReactNode);
    /** Value accessor: a key of `TRow` or a function deriving the value. */
    accessor: keyof TRow | ((row: TRow) => unknown);
    /** Custom cell renderer. Defaults to rendering the accessor value as-is. */
    cell?: (ctx: DataTableCellContext<TRow>) => React.ReactNode;
    /** Initial column width in px. The engine owns the width thereafter. @default 150 */
    width?: number;
    /** Minimum column width in px. @default 50 */
    minWidth?: number;
    /** Maximum column width in px. */
    maxWidth?: number;
    /** Allow resizing this column (Loop 4). */
    enableResizing?: boolean;
    /** Allow sorting by this column (later loop). */
    enableSorting?: boolean;
    /** Allow inline editing of this column's cells (Loop 5). */
    editable?: boolean;
    /** Horizontal alignment of cell + header content. @default "left" */
    align?: DataTableColumnAlign;
}

export interface DataTableProps<TRow> {
    /** Row data. */
    data: TRow[];
    /** Column definitions. */
    columns: DataTableColumn<TRow>[];
    /** Stable row id; defaults to the row index. */
    getRowId?: (row: TRow, index: number) => string;
    /** Show the numbered row-header gutter column. @default true */
    numberedRows?: boolean;
    /** Body row height in px (Blueprint default 20). @default 20 */
    rowHeight?: number;
    /**
     * Fixed grid height in px. When set, the grid scrolls within this height and the
     * header/gutter stay pinned. Required for virtualization (Loop 2). When omitted the
     * grid grows to fit its rows.
     */
    height?: number;
    /**
     * Selection behavior. `"single"` (default) allows one region at a time — click a cell,
     * gutter (row band), or header (column band); shift-click or drag extends it. `"multi"`
     * additionally lets **Cmd/Ctrl-click** add further regions (clipboard copy then serializes
     * all of them). `"none"` disables selection (and keyboard nav / clipboard).
     * @default "single"
     */
    /**
     * Make every column resizable by dragging its right-edge handle (Loop 4). Per-column
     * `enableResizing` overrides this. Sizes commit on drag end (no mid-drag re-layout).
     * @default false
     */
    enableColumnResizing?: boolean;
    /**
     * Allow reordering columns by dragging a header (Loop 4b). Matching Blueprint, a column
     * only becomes draggable once it's the sole selected column — click its header to select
     * it, then grab and drag. A blue guide marks the drop slot; the order commits on release.
     * @default false
     */
    enableColumnReordering?: boolean;
    /** Controlled column order (array of column `id`s). Pair with `onColumnOrderChange`. */
    columnOrder?: string[];
    /** Initial column order when uncontrolled. @default [] (natural `columns` order) */
    defaultColumnOrder?: string[];
    /** Called when the column order changes (drag-reorder). */
    onColumnOrderChange?: (order: string[]) => void;
    selectionMode?: DataTableSelectionMode;
    /** Controlled selection regions. Pair with `onSelectionChange`. */
    selection?: SelectionRegion[];
    /** Initial selection regions when uncontrolled. @default [] */
    defaultSelection?: SelectionRegion[];
    /** Called when the selection changes (click/shift-click/drag). */
    onSelectionChange?: (regions: SelectionRegion[]) => void;
    /** Controlled focused cell (2px outline). Pair with `onFocusedCellChange`. */
    focusedCell?: CellCoord | null;
    /** Initial focused cell when uncontrolled. @default null */
    defaultFocusedCell?: CellCoord | null;
    /** Called when the focused cell changes. */
    onFocusedCellChange?: (cell: CellCoord | null) => void;
    /**
     * Called when an editable cell's value is committed (Loop 5) — Enter or blur on the
     * inline editor. Mark columns editable with the column's `editable` flag; double-click
     * such a cell to edit. The grid does not mutate `data` — apply the change in this callback.
     */
    onCellEdit?: (edit: DataTableCellEdit) => void;
    /**
     * Render the grid in a **loading** state (Loop 7): every body cell, column header, and
     * gutter cell shows a Blueprint-spec skeleton bar (animated glow) instead of its value.
     * The header/gutter chrome and column sizes are preserved, so the grid keeps its shape
     * while data streams in. Selection/edit affordances are suppressed while loading.
     * @default false
     */
    loading?: boolean;
    /** Extra class names on the scroll container. */
    className?: string;
}

/** Payload for {@link DataTableProps.onCellEdit} — a committed inline cell edit. */
export interface DataTableCellEdit {
    /** Zero-based row index in `data`. */
    row: number;
    /** Zero-based visual column index. */
    col: number;
    /** The edited column's `id`. */
    columnId: string;
    /** The new (string) value the user entered. */
    value: string;
}

// ── Token constants (Blueprint @blueprintjs/table v6.1.1) ──────────────────
const COLUMN_HEADER_HEIGHT = 30;
const GUTTER_MIN_WIDTH = 30;

/** Width of the numbered gutter, widened to fit the largest row number. */
function gutterWidth(rowCount: number): number {
    const digits = String(Math.max(rowCount, 1)).length;
    return Math.max(GUTTER_MIN_WIDTH, 8 + digits * 8); // ~8px/digit + 8px padding
}

/** Map an mithril `DataTableColumn` to a TanStack `ColumnDef`. */
function toColumnDef<TRow>(col: DataTableColumn<TRow>, defaultResizing: boolean): ColumnDef<TRow> {
    const accessorFn =
        typeof col.accessor === "function"
            ? col.accessor
            : (row: TRow) => row[col.accessor as keyof TRow];
    const meta: DataTableColumnMeta = {
        align: col.align ?? "left",
        editable: col.editable ?? false,
    };
    return {
        id: col.id,
        accessorFn,
        header: typeof col.header === "function" ? col.header : () => col.header,
        cell: col.cell
            ? (ctx) =>
                  col.cell!({
                      value: ctx.getValue(),
                      row: ctx.row.original,
                      rowIndex: ctx.row.index,
                      columnId: col.id,
                  })
            : (ctx) => ctx.getValue() as React.ReactNode,
        size: col.width ?? 150,
        minSize: col.minWidth ?? 50,
        maxSize: col.maxWidth ?? Number.MAX_SAFE_INTEGER,
        enableResizing: col.enableResizing ?? defaultResizing,
        enableSorting: col.enableSorting ?? false,
        meta,
    };
}

/** Stable empty regions default (avoids a fresh array identity each render). */
const NO_REGIONS: SelectionRegion[] = [];

/** Stable empty column-order default (natural order). */
const EMPTY_ORDER: string[] = [];

/** Threshold in px the pointer must travel before a header grab becomes a reorder drag. */
const REORDER_DRAG_THRESHOLD = 5;

/** Minimal controlled-or-uncontrolled state hook (no external dep). */
function useControllableState<T>(
    controlled: T | undefined,
    defaultValue: T,
    onChange?: (value: T) => void,
): [T, (value: T) => void] {
    const [internal, setInternal] = useState(defaultValue);
    const isControlled = controlled !== undefined;
    const value = isControlled ? (controlled as T) : internal;
    const set = useCallback(
        (next: T) => {
            if (!isControlled) setInternal(next);
            onChange?.(next);
        },
        [isControlled, onChange],
    );
    return [value, set];
}

/**
 * A virtualized, Blueprint-faithful data grid.
 *
 * ```tsx
 * <DataTable
 *   data={people}
 *   columns={[
 *     { id: "name", header: "Name", accessor: "name" },
 *     { id: "age", header: "Age", accessor: "age", align: "right" },
 *     { id: "role", header: "Role", accessor: (r) => r.role.title },
 *   ]}
 *   height={360}
 * />
 * ```
 */
export function DataTable<TRow>({
    data,
    columns,
    getRowId,
    numberedRows = true,
    rowHeight = 20,
    height,
    enableColumnResizing = false,
    enableColumnReordering = false,
    columnOrder: columnOrderProp,
    defaultColumnOrder,
    onColumnOrderChange,
    selectionMode = "single",
    selection,
    defaultSelection,
    onSelectionChange,
    focusedCell: focusedCellProp,
    defaultFocusedCell,
    onFocusedCellChange,
    onCellEdit,
    loading = false,
    className,
}: DataTableProps<TRow>) {
    const columnDefs = useMemo(
        () => columns.map((c) => toColumnDef(c, enableColumnResizing)),
        [columns, enableColumnResizing],
    );

    // Column order (Loop 4b) — a controllable list of column ids. Empty ⇒ natural order.
    const [columnOrder, setColumnOrder] = useControllableState<string[]>(
        columnOrderProp,
        defaultColumnOrder ?? EMPTY_ORDER,
        onColumnOrderChange,
    );

    const table: Table<TRow> = useReactTable({
        data,
        columns: columnDefs,
        getCoreRowModel: getCoreRowModel(),
        getRowId,
        columnResizeMode: "onEnd",
        defaultColumn: { size: 150, minSize: 50 },
        state: { columnOrder },
        onColumnOrderChange: (updater) =>
            setColumnOrder(typeof updater === "function" ? updater(columnOrder) : updater),
    });

    const gutterW = numberedRows ? gutterWidth(data.length) : 0;
    const totalWidth = table.getTotalSize() + gutterW;

    // Resize guide (Loop 4): while a column is being dragged (`columnResizeMode:"onEnd"` keeps
    // the real widths frozen until release), draw a full-height blue line at the *projected*
    // right edge = the column's left x + its clamped new width. `columnSizingInfo.deltaOffset`
    // updates on each mousemove, so the line follows the cursor without re-laying-out the rows.
    const sizingInfo = table.getState().columnSizingInfo;
    let resizeGuideX: number | null = null;
    if (sizingInfo.isResizingColumn) {
        let x = gutterW;
        for (const col of table.getVisibleLeafColumns()) {
            if (col.id === sizingInfo.isResizingColumn) {
                const minW = col.columnDef.minSize ?? 50;
                const maxW = col.columnDef.maxSize ?? Number.MAX_SAFE_INTEGER;
                const newW = Math.min(maxW, Math.max(minW, col.getSize() + (sizingInfo.deltaOffset ?? 0)));
                resizeGuideX = x + newW;
                break;
            }
            x += col.getSize();
        }
    }

    // The scroll container is the virtualization viewport (Loop 2): the row virtualizer
    // reads its scroll position. A fixed `height` bounds it so only visible rows render.
    //
    // This is a **state-backed callback ref**, NOT useRef — deliberately. The virtualizer
    // lives in the child <DataTableBody>, but the scroll element is rendered here in the
    // parent. React's commit runs bottom-up, so the child's layout effect (where the
    // virtualizer subscribes to scroll) fires BEFORE this parent's ref attaches — a plain
    // useRef would still read null, the virtualizer would never attach a scroll listener,
    // and the grid would render only its initial window and never re-window on scroll
    // (until some unrelated re-render). Setting state when the node mounts forces the
    // re-render that connects the element. See handoff 0085.
    const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null);

    // ── Selection (Loop 3) ───────────────────────────────────────────────────
    // Controllable regions + focused cell; the drag/shift anchor is internal-only.
    const [regions, setRegions] = useControllableState(
        selection,
        defaultSelection ?? NO_REGIONS,
        onSelectionChange,
    );
    const [focusedCell, setFocusedCell] = useControllableState(
        focusedCellProp,
        defaultFocusedCell ?? null,
        onFocusedCellChange,
    );
    const anchorRef = useRef<CellCoord | null>(null);
    /** Which gesture is mid-drag, so pointer-enter only extends a matching target. */
    const dragKindRef = useRef<null | "cell" | "rows" | "columns">(null);

    // Run the pure reducer over the derived state, then push results to the
    // controllable setters (skipping no-op updates so controlled `onChange` stays quiet).
    const dispatch = useCallback(
        (action: SelectionAction) => {
            const current: SelectionState = { regions, focusedCell, anchor: anchorRef.current };
            const next = selectionReducer(current, action);
            anchorRef.current = next.anchor;
            if (!regionListsEqual(next.regions, regions)) setRegions(next.regions);
            if (!cellsEqual(next.focusedCell, focusedCell)) setFocusedCell(next.focusedCell);
        },
        [regions, focusedCell, setRegions, setFocusedCell],
    );

    // A drag ends on the next mouseup anywhere (release outside the grid still ends it).
    useEffect(() => {
        const onUp = () => {
            dragKindRef.current = null;
        };
        window.addEventListener("mouseup", onUp);
        return () => window.removeEventListener("mouseup", onUp);
    }, []);

    const selectable = selectionMode !== "none";
    const multi = selectionMode === "multi";

    // In multi-mode, Cmd/Ctrl-click adds a fresh region (the reducer's `additive` flag);
    // Shift-extend still grows the active region, so when both are held shift wins.
    const handleCellMouseDown = useCallback(
        (row: number, col: number, shiftKey: boolean, additive: boolean) => {
            dragKindRef.current = "cell";
            dispatch({ type: "cell", row, col, extend: shiftKey, additive: multi && additive });
        },
        [dispatch, multi],
    );
    const handleCellMouseEnter = useCallback(
        (row: number, col: number) => {
            if (dragKindRef.current === "cell") dispatch({ type: "extendTo", row, col });
        },
        [dispatch],
    );
    const handleGutterMouseDown = useCallback(
        (row: number, shiftKey: boolean, additive: boolean) => {
            dragKindRef.current = "rows";
            dispatch({ type: "rows", row, extend: shiftKey, additive: multi && additive });
        },
        [dispatch, multi],
    );
    const handleGutterMouseEnter = useCallback(
        (row: number) => {
            if (dragKindRef.current === "rows") dispatch({ type: "extendTo", row, col: 0 });
        },
        [dispatch],
    );
    const handleHeaderMouseDown = useCallback(
        (col: number, shiftKey: boolean, additive: boolean) => {
            dragKindRef.current = "columns";
            dispatch({ type: "columns", col, extend: shiftKey, additive: multi && additive });
        },
        [dispatch, multi],
    );
    const handleHeaderMouseEnter = useCallback(
        (col: number) => {
            if (dragKindRef.current === "columns") dispatch({ type: "extendTo", row: 0, col });
        },
        [dispatch],
    );
    const handleSelectAll = useCallback(() => {
        dragKindRef.current = null;
        const whole: SelectionRegion = { rows: null, cols: null };
        anchorRef.current = { row: 0, col: 0 };
        if (!regionListsEqual([whole], regions)) setRegions([whole]);
        if (!cellsEqual({ row: 0, col: 0 }, focusedCell)) setFocusedCell({ row: 0, col: 0 });
    }, [regions, focusedCell, setRegions, setFocusedCell]);

    // ── Editable cells (Loop 5) ───────────────────────────────────────────────
    // The grid owns which cell is editing; double-clicking an editable cell enters
    // edit mode (and focuses it). Enter/blur commits via `onCellEdit`, Esc reverts.
    const [editingCell, setEditingCell] = useState<CellCoord | null>(null);

    const isColEditable = useCallback(
        (col: number) => {
            const def = table.getVisibleLeafColumns()[col]?.columnDef.meta as
                | DataTableColumnMeta
                | undefined;
            return def?.editable ?? false;
        },
        [table],
    );

    const handleCellDoubleClick = useCallback(
        (row: number, col: number) => {
            setEditingCell({ row, col });
            // Keep the focused-cell outline in step with the cell being edited.
            if (!cellsEqual({ row, col }, focusedCell)) setFocusedCell({ row, col });
        },
        [focusedCell, setFocusedCell],
    );

    // ── Keyboard navigation + clipboard (Loop 6) ──────────────────────────────
    // The grid container (the scroll viewport) is focusable; arrows move the focused
    // cell, Shift extends the region, Tab/Enter advance with wrap, Enter/F2 start an
    // edit on an editable cell, and Cmd/Ctrl-C copies the selection as TSV.

    /** Return focus to the grid (e.g. after an edit ends) so keyboard nav keeps working. */
    const focusGrid = useCallback(() => scrollEl?.focus({ preventScroll: true }), [scrollEl]);

    /** Scroll the viewport so data row `r` clears the sticky header and is fully visible. */
    const scrollRowIntoView = useCallback(
        (r: number) => {
            const el = scrollEl;
            if (!el) return;
            const rowTop = COLUMN_HEADER_HEIGHT + r * rowHeight; // content-space top of the row
            const viewTop = el.scrollTop + COLUMN_HEADER_HEIGHT; // first px not under the sticky header
            const viewBottom = el.scrollTop + el.clientHeight;
            if (rowTop < viewTop) el.scrollTop = rowTop - COLUMN_HEADER_HEIGHT;
            else if (rowTop + rowHeight > viewBottom) el.scrollTop = rowTop + rowHeight - el.clientHeight;
        },
        [scrollEl, rowHeight],
    );

    /**
     * Land the focused cell on an **absolute** clamped `(r, c)`. `extend` (Shift) grows the
     * active region from the anchor to that cell; otherwise the selection collapses to a single
     * cell and the anchor moves there. Keyboard nav always yields a single region (multi-region
     * is a pointer-only gesture), so the focused cell is unambiguous. Scrolls the row into view.
     */
    const applyFocus = useCallback(
        (r: number, c: number, extend: boolean) => {
            const rowCount = data.length;
            const colCount = table.getVisibleLeafColumns().length;
            if (rowCount === 0 || colCount === 0) return;
            r = Math.max(0, Math.min(rowCount - 1, r));
            c = Math.max(0, Math.min(colCount - 1, c));
            const next = { row: r, col: c };
            if (extend) {
                const a = anchorRef.current ?? focusedCell ?? next;
                const region: SelectionRegion = {
                    rows: [Math.min(a.row, r), Math.max(a.row, r)],
                    cols: [Math.min(a.col, c), Math.max(a.col, c)],
                };
                if (!regionListsEqual([region], regions)) setRegions([region]);
            } else {
                anchorRef.current = next;
                const region = cellRegion(r, c);
                if (!regionListsEqual([region], regions)) setRegions([region]);
            }
            if (!cellsEqual(next, focusedCell)) setFocusedCell(next);
            scrollRowIntoView(r);
        },
        [data.length, table, focusedCell, regions, setRegions, setFocusedCell, scrollRowIntoView],
    );

    /**
     * Move the focused cell by (dRow, dCol). `extend` (Shift) grows the active region; `wrap`
     * lets Tab/Enter roll over a row/column edge into the next line. The first keystroke with no
     * focus yet anchors at the top-left cell (it does not apply the delta), matching Blueprint.
     */
    const moveFocus = useCallback(
        (dRow: number, dCol: number, extend: boolean, wrap?: "horizontal" | "vertical") => {
            const rowCount = data.length;
            const colCount = table.getVisibleLeafColumns().length;
            if (rowCount === 0 || colCount === 0) return;

            if (!focusedCell) {
                applyFocus(0, 0, false);
                return;
            }

            let r = focusedCell.row + dRow;
            let c = focusedCell.col + dCol;
            if (wrap === "horizontal") {
                if (c >= colCount) (c = 0), (r += 1);
                else if (c < 0) (c = colCount - 1), (r -= 1);
            } else if (wrap === "vertical") {
                if (r >= rowCount) (r = 0), (c += 1);
                else if (r < 0) (r = rowCount - 1), (c -= 1);
            }
            applyFocus(r, c, extend);
        },
        [data.length, table, focusedCell, applyFocus],
    );

    /** Rows that fit in one viewport page (for PageUp/PageDown); at least 1. */
    const pageRows = useCallback(() => {
        const view = (scrollEl?.clientHeight ?? 0) - COLUMN_HEADER_HEIGHT;
        return Math.max(1, Math.floor(view / rowHeight));
    }, [scrollEl, rowHeight]);

    /**
     * Home/End/PageUp/PageDown (Loop 7 polish). Home → first column of the row; End → last
     * column; with Cmd/Ctrl they jump to the grid's top-left / bottom-right corner. Page keys
     * move by a viewport of rows. All respect Shift to extend from the anchor.
     */
    const moveToExtent = useCallback(
        (kind: "home" | "end" | "pageUp" | "pageDown", extend: boolean, toGridCorner: boolean) => {
            const rowCount = data.length;
            const colCount = table.getVisibleLeafColumns().length;
            if (rowCount === 0 || colCount === 0) return;
            if (!focusedCell) {
                applyFocus(0, 0, false);
                return;
            }
            const { row, col } = focusedCell;
            switch (kind) {
                case "home":
                    applyFocus(toGridCorner ? 0 : row, 0, extend);
                    break;
                case "end":
                    applyFocus(toGridCorner ? rowCount - 1 : row, colCount - 1, extend);
                    break;
                case "pageUp":
                    applyFocus(row - pageRows(), col, extend);
                    break;
                case "pageDown":
                    applyFocus(row + pageRows(), col, extend);
                    break;
            }
        },
        [data.length, table, focusedCell, applyFocus, pageRows],
    );

    /**
     * Copy the selection to the clipboard as TSV (Cmd/Ctrl-C). In single-mode that's the one
     * region; in multi-mode every region is serialized (blank-line-separated — see
     * `regionsToTSV`).
     */
    const copySelection = useCallback(() => {
        if (regions.length === 0) return;
        const cols = table.getVisibleLeafColumns();
        const modelRows = table.getRowModel().rows;
        const tsv = regionsToTSV(regions, data.length, cols.length, (r, c) => {
            const col = cols[c];
            return col ? modelRows[r]?.getValue(col.id) : undefined;
        });
        // Async Clipboard API where available; a hidden-textarea fallback otherwise (older
        // browsers / insecure contexts). Either way the copy is best-effort and non-throwing.
        const nav = typeof navigator !== "undefined" ? navigator : undefined;
        if (nav?.clipboard?.writeText) {
            void nav.clipboard.writeText(tsv).catch(() => {});
        } else if (typeof document !== "undefined") {
            const ta = document.createElement("textarea");
            ta.value = tsv;
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.select();
            try {
                document.execCommand("copy");
            } catch {
                /* no-op */
            }
            document.body.removeChild(ta);
        }
    }, [regions, table, data.length]);

    const handleCellEditCommit = useCallback(
        (row: number, col: number, value: string, move?: EditCommitMove) => {
            setEditingCell(null);
            const columnId = table.getVisibleLeafColumns()[col]?.id ?? "";
            onCellEdit?.({ row, col, columnId, value });
            // Return focus to the grid, then advance spreadsheet-style for a keyboard commit.
            focusGrid();
            if (move === "down") moveFocus(1, 0, false);
            else if (move === "up") moveFocus(-1, 0, false);
            else if (move === "right") moveFocus(0, 1, false, "horizontal");
            else if (move === "left") moveFocus(0, -1, false, "horizontal");
        },
        [table, onCellEdit, focusGrid, moveFocus],
    );
    const handleCellEditCancel = useCallback(() => {
        setEditingCell(null);
        focusGrid();
    }, [focusGrid]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (editingCell) return; // the editor owns its own keys
            switch (e.key) {
                case "ArrowUp":
                    e.preventDefault();
                    moveFocus(-1, 0, e.shiftKey);
                    break;
                case "ArrowDown":
                    e.preventDefault();
                    moveFocus(1, 0, e.shiftKey);
                    break;
                case "ArrowLeft":
                    e.preventDefault();
                    moveFocus(0, -1, e.shiftKey);
                    break;
                case "ArrowRight":
                    e.preventDefault();
                    moveFocus(0, 1, e.shiftKey);
                    break;
                case "Tab":
                    e.preventDefault();
                    moveFocus(0, e.shiftKey ? -1 : 1, false, "horizontal");
                    break;
                case "Home":
                    e.preventDefault();
                    moveToExtent("home", e.shiftKey, e.metaKey || e.ctrlKey);
                    break;
                case "End":
                    e.preventDefault();
                    moveToExtent("end", e.shiftKey, e.metaKey || e.ctrlKey);
                    break;
                case "PageUp":
                    e.preventDefault();
                    moveToExtent("pageUp", e.shiftKey, false);
                    break;
                case "PageDown":
                    e.preventDefault();
                    moveToExtent("pageDown", e.shiftKey, false);
                    break;
                case "Enter":
                    e.preventDefault();
                    if (focusedCell && isColEditable(focusedCell.col)) setEditingCell(focusedCell);
                    else moveFocus(e.shiftKey ? -1 : 1, 0, false, "vertical");
                    break;
                case "F2":
                    if (focusedCell && isColEditable(focusedCell.col)) {
                        e.preventDefault();
                        setEditingCell(focusedCell);
                    }
                    break;
                case "c":
                case "C":
                    if (e.metaKey || e.ctrlKey) {
                        e.preventDefault();
                        copySelection();
                    }
                    break;
            }
        },
        [editingCell, focusedCell, isColEditable, moveFocus, moveToExtent, copySelection],
    );

    // ── Column reorder (Loop 4b) ──────────────────────────────────────────────
    // The inner sizer — the positioned ancestor for both the resize and the reorder guide.
    // We also read its left edge to convert a pointer clientX into content-space x.
    const sizerRef = useRef<HTMLDivElement | null>(null);
    // Active reorder drag, tracked in a ref so the document listeners read fresh values;
    // `reorderGuideX` state drives the drop-guide + grabbing-cursor render.
    const reorderRef = useRef<{ col: number; startX: number; moved: boolean; target: number } | null>(null);
    const [reorderGuideX, setReorderGuideX] = useState<number | null>(null);

    const handleReorderStart = useCallback(
        (col: number, clientX: number) => {
            reorderRef.current = { col, startX: clientX, moved: false, target: col };

            // Map a pointer clientX to a drop slot (insertion index 0..colCount) and the x of
            // that slot's left edge (content space), walking the visible columns left→right.
            const computeTarget = (px: number) => {
                const x = px - (sizerRef.current?.getBoundingClientRect().left ?? 0);
                const cols = table.getVisibleLeafColumns();
                let left = gutterW;
                let target = cols.length;
                let guideX = gutterW;
                for (let i = 0; i < cols.length; i++) {
                    const w = cols[i].getSize();
                    if (x < left + w / 2) {
                        target = i;
                        guideX = left;
                        return { target, guideX };
                    }
                    left += w;
                }
                return { target, guideX: left };
            };

            const onMove = (e: MouseEvent) => {
                const drag = reorderRef.current;
                if (!drag) return;
                if (!drag.moved && Math.abs(e.clientX - drag.startX) < REORDER_DRAG_THRESHOLD) return;
                drag.moved = true;
                const { target, guideX } = computeTarget(e.clientX);
                drag.target = target;
                setReorderGuideX(Math.round(guideX));
            };
            const onUp = () => {
                window.removeEventListener("mousemove", onMove);
                window.removeEventListener("mouseup", onUp);
                const drag = reorderRef.current;
                reorderRef.current = null;
                setReorderGuideX(null);
                if (!drag || !drag.moved) return;
                // Translate the slot index into an in-place array move; a slot to the right of
                // the source collapses by one once the source is removed.
                const order = table.getVisibleLeafColumns().map((c) => c.id);
                const insertAt = drag.target > drag.col ? drag.target - 1 : drag.target;
                if (insertAt === drag.col) return;
                const next = order.slice();
                const [movedId] = next.splice(drag.col, 1);
                next.splice(insertAt, 0, movedId);
                setColumnOrder(next);
                // Keep the moved column selected at its new position (Blueprint follows it).
                anchorRef.current = { row: 0, col: insertAt };
                setRegions([columnsRegion(insertAt, insertAt)]);
                setFocusedCell({ row: 0, col: insertAt });
            };
            window.addEventListener("mousemove", onMove);
            window.addEventListener("mouseup", onUp);
        },
        [table, gutterW, setColumnOrder, setRegions, setFocusedCell],
    );

    return (
        <div
            ref={setScrollEl}
            role="grid"
            aria-rowcount={data.length}
            aria-colcount={columns.length}
            // Focusable so the grid can receive keyboard nav (Loop 6). The focused *cell* shows
            // the 2px outline, so the container itself suppresses its own focus ring (Blueprint
            // does the same) — `outline-none` keeps the resting compare crop unchanged.
            tabIndex={selectable ? 0 : undefined}
            onKeyDown={selectable ? handleKeyDown : undefined}
            className={cn(
                "outline-none",
                // Scroll container + outer frame. Blueprint's `.bp6-table-container` draws
                // its 1px frame with `box-shadow: 0 0 0 1px` (no layout impact) over a
                // light-gray-5 surface (== mithril `--background`); dark uses #383e47.
                // `select-none`: Blueprint's `.bp6-table-quadrant-scroll-container` disables
                // text selection so a click-drag selects cells, not text (always on).
                "relative select-none overflow-auto bg-background text-foreground dark:bg-[#383e47]",
                "shadow-[0_0_0_1px_rgba(17,20,24,0.15)] dark:shadow-[0_0_0_1px_rgba(17,20,24,0.4)]",
                className,
            )}
            style={height != null ? { height } : undefined}
        >
            {/* Inner sizer: forces the scroll width to the sum of column widths. `relative`
                anchors the resize guide, which spans the full header+body height. */}
            <div ref={sizerRef} className="relative" style={{ width: totalWidth, minWidth: "100%" }}>
                <DataTableHeader
                    table={table}
                    numberedRows={numberedRows}
                    gutterWidth={gutterW}
                    headerHeight={COLUMN_HEADER_HEIGHT}
                    regions={regions}
                    loading={loading}
                    onHeaderMouseDown={selectable ? handleHeaderMouseDown : undefined}
                    onHeaderMouseEnter={selectable ? handleHeaderMouseEnter : undefined}
                    onSelectAll={selectable ? handleSelectAll : undefined}
                    reorderable={enableColumnReordering}
                    onReorderStart={enableColumnReordering ? handleReorderStart : undefined}
                />
                <DataTableBody
                    table={table}
                    scrollEl={scrollEl}
                    numberedRows={numberedRows}
                    gutterWidth={gutterW}
                    rowHeight={rowHeight}
                    height={height}
                    regions={regions}
                    focusedCell={focusedCell}
                    loading={loading}
                    editingCell={editingCell}
                    onCellDoubleClick={handleCellDoubleClick}
                    onCellEditCommit={handleCellEditCommit}
                    onCellEditCancel={handleCellEditCancel}
                    onCellMouseDown={selectable ? handleCellMouseDown : undefined}
                    onCellMouseEnter={selectable ? handleCellMouseEnter : undefined}
                    onGutterMouseDown={selectable ? handleGutterMouseDown : undefined}
                    onGutterMouseEnter={selectable ? handleGutterMouseEnter : undefined}
                />
                {/* Resize guide — a 3px blue line at the projected edge (Blueprint
                    `.bp6-table-vertical-guide`, width 3px, margin-left -3px → right edge at x). */}
                {resizeGuideX != null && (
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-y-0 z-50 w-[3px] bg-primary"
                        style={{ left: resizeGuideX - 3 }}
                    />
                )}
                {/* Reorder drop guide (Loop 4b) — the same blue vertical guide, centered on the
                    boundary of the slot the column will drop into. */}
                {reorderGuideX != null && (
                    <div
                        data-reorder-guide
                        aria-hidden
                        className="pointer-events-none absolute inset-y-0 z-50 w-[3px] bg-primary"
                        style={{ left: reorderGuideX - 1 }}
                    />
                )}
            </div>
            {/* While dragging, a fixed overlay keeps the ew-resize cursor everywhere (the drag
                runs on document listeners, so blocking pointer events here is harmless). */}
            {sizingInfo.isResizingColumn && <div className="fixed inset-0 z-[60] cursor-ew-resize" />}
            {/* While reordering, the same overlay pattern keeps a grabbing cursor everywhere. */}
            {reorderGuideX != null && <div className="fixed inset-0 z-[60] cursor-grabbing" />}
        </div>
    );
}
