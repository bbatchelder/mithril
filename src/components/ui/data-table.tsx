import {
    getCoreRowModel,
    useReactTable,
    type ColumnDef,
    type Table,
} from "@tanstack/react-table";
import { useMemo, useRef } from "react";

import { cn } from "@/lib/utils";

import { DataTableBody } from "./data-table/body";
import { DataTableHeader } from "./data-table/header";

/**
 * DataTable — a virtualized, Blueprint-`Table2`-faithful data grid built on a
 * headless engine (TanStack Table) dressed in analyst-ui's tokens.
 *
 * Unlike Blueprint's column-children API (`<Table2><Column cellRenderer/></Table2>`),
 * analyst-ui takes a **modern flat `columns` array + `data`** — the native shape of
 * the engine we wrap, and the idiom of TanStack / AG Grid / MUI DataGrid. Custom
 * renderers, editability, and selection all compose as column-def fields / table state.
 *
 * Blueprint visual spec (`@blueprintjs/table` v6.1.1, `lib/css/table.css`):
 *   .bp6-table-cell            font-size:12px; height:20px; line-height:20px; padding:0 8px;
 *                              box-shadow: inset 0 -1px 0 <border>, inset -1px 0 0 <border>  (bottom+right)
 *   column header (.bp6-table-column-headers .bp6-table-header)
 *                              line-height:30px; min-height:30px; box-shadow: 0 1px 0 <border> (bottom)
 *   row header / gutter (.bp6-table-row-name)
 *                              font-size:12px; padding:0 4px; text-align:right; min-width:30px; line-height:20px
 *                              box-shadow: inset 0 -1px 0 <border>, 1px 0 0 <border> (bottom+right)
 *   <border> = rgba(17,20,24,0.15) light · rgba(17,20,24,0.4) dark
 *   cell text = #1c2127 light · #f6f7f9 dark  (== analyst `--foreground`)
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
    /** Extra class names on the scroll container. */
    className?: string;
}

// ── Token constants (Blueprint @blueprintjs/table v6.1.1) ──────────────────
const COLUMN_HEADER_HEIGHT = 30;
const GUTTER_MIN_WIDTH = 30;

/** Width of the numbered gutter, widened to fit the largest row number. */
function gutterWidth(rowCount: number): number {
    const digits = String(Math.max(rowCount, 1)).length;
    return Math.max(GUTTER_MIN_WIDTH, 8 + digits * 8); // ~8px/digit + 8px padding
}

/** Map an analyst `DataTableColumn` to a TanStack `ColumnDef`. */
function toColumnDef<TRow>(col: DataTableColumn<TRow>): ColumnDef<TRow> {
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
        enableResizing: col.enableResizing ?? false,
        enableSorting: col.enableSorting ?? false,
        meta,
    };
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
    className,
}: DataTableProps<TRow>) {
    const columnDefs = useMemo(() => columns.map(toColumnDef), [columns]);

    const table: Table<TRow> = useReactTable({
        data,
        columns: columnDefs,
        getCoreRowModel: getCoreRowModel(),
        getRowId,
        columnResizeMode: "onEnd",
        defaultColumn: { size: 150, minSize: 50 },
    });

    const gutterW = numberedRows ? gutterWidth(data.length) : 0;
    const totalWidth = table.getTotalSize() + gutterW;

    // The scroll container is the virtualization viewport (Loop 2): the row virtualizer
    // reads its scroll position. A fixed `height` bounds it so only visible rows render.
    const scrollRef = useRef<HTMLDivElement>(null);

    return (
        <div
            ref={scrollRef}
            role="grid"
            aria-rowcount={data.length}
            aria-colcount={columns.length}
            className={cn(
                // Scroll container + outer frame. Blueprint's `.bp6-table-container` draws
                // its 1px frame with `box-shadow: 0 0 0 1px` (no layout impact) over a
                // light-gray-5 surface (== analyst `--background`); dark uses #383e47.
                "relative overflow-auto bg-background text-foreground dark:bg-[#383e47]",
                "shadow-[0_0_0_1px_rgba(17,20,24,0.15)] dark:shadow-[0_0_0_1px_rgba(17,20,24,0.4)]",
                className,
            )}
            style={height != null ? { height } : undefined}
        >
            {/* Inner sizer: forces the scroll width to the sum of column widths. */}
            <div style={{ width: totalWidth, minWidth: "100%" }}>
                <DataTableHeader
                    table={table}
                    numberedRows={numberedRows}
                    gutterWidth={gutterW}
                    headerHeight={COLUMN_HEADER_HEIGHT}
                />
                <DataTableBody
                    table={table}
                    scrollRef={scrollRef}
                    numberedRows={numberedRows}
                    gutterWidth={gutterW}
                    rowHeight={rowHeight}
                    height={height}
                />
            </div>
        </div>
    );
}
