import { flexRender, type Table } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useMemo } from "react";

import { cn } from "@/lib/utils";

import type { DataTableColumnMeta } from "../data-table";
import { EditableCell, type EditCommitMove } from "./editable-cell";
import { GutterCell, alignClass } from "./gutter";
import {
    cellRegion,
    isCellSelected,
    isRowSelected,
    regionRect,
    type CellCoord,
    type GridGeometry,
    type SelectionRegion,
} from "./selection";

/**
 * The grid body. Blueprint `.bp6-table-cell`:
 *   font 12px, height 20px, line-height 20px, padding 0 8px,
 *   box-shadow: inset 0 -1px 0 <border>, inset -1px 0 0 <border>  (bottom + right)
 *   border = rgba(17,20,24,0.15) light · rgba(17,20,24,0.4) dark
 *
 * Body background is the **cell surface** — white (`#ffffff`) light · dark-gray-3 (`#2f343c`)
 * dark — which is distinct from the header/gutter chrome (light-gray-5 `#f6f7f9` · dark-gray-4
 * `#383e47`). Blueprint paints this on the body client (`.bp6-table-body-virtual-client`) with
 * transparent cells over it; we do the same on the rowgroup, so the gutter cells (their own gray
 * bg) and data cells (transparent) layer correctly and the body fills white past the last column.
 *
 * Loop 2: rows are **virtualized** with `@tanstack/react-virtual`. The body is a relative
 * spacer of `getTotalSize()` px; each visible row is absolutely positioned via
 * `translateY(round(start))` (offsets rounded to integers to avoid border-seam flicker).
 * The scroll viewport is the `role="grid"` container (a fixed `height` bounds it); the
 * sticky header/gutter live in the same scroll element, so horizontal scroll syncs for free.
 *
 * Loop 3: **selection overlays.** Each region is an absolutely-positioned translucent-blue
 * `<div>` (fill + 1px border); the focused cell is a separate 2px-outline `<div>`. Both render
 * **after** the rows with `z-10`, so the (translucent) fill sits over the transparent cells
 * (grid lines show through, matching Blueprint) while the sticky header (`z-30`) stays above.
 * Region rects never reach the gutter (x ≥ gutterWidth), so the gutter numbers stay crisp.
 */
export interface DataTableBodyProps<TRow> {
    table: Table<TRow>;
    /** The scroll-viewport element (state-backed so the virtualizer connects on mount). */
    scrollEl: HTMLDivElement | null;
    numberedRows: boolean;
    gutterWidth: number;
    rowHeight: number;
    /** Fixed grid height, if any — seeds the virtualizer's initial viewport. */
    height?: number;
    /** Active selection regions (Loop 3). */
    regions: SelectionRegion[];
    /** The focused cell, painted with a 2px outline (Loop 3). */
    focusedCell: CellCoord | null;
    /** The cell currently in edit mode (Loop 5), or null. */
    editingCell?: CellCoord | null;
    /** Double-click on an editable data cell — `(row, col)`. Begins editing. */
    onCellDoubleClick?: (row: number, col: number) => void;
    /** Commit an edit — `(row, col, value, move?)`. Fired on Enter, Tab, or blur in the editor. */
    onCellEditCommit?: (row: number, col: number, value: string, move?: EditCommitMove) => void;
    /** Cancel an edit (Esc) — revert without committing. */
    onCellEditCancel?: () => void;
    /** Pointer-down on a data cell — `(row, col, shiftKey)`. Begins a click/drag selection. */
    onCellMouseDown?: (row: number, col: number, shiftKey: boolean) => void;
    /** Pointer enters a data cell mid-drag — `(row, col)`. Extends the active region. */
    onCellMouseEnter?: (row: number, col: number) => void;
    /** Pointer-down on a gutter cell — `(row, shiftKey)`. Begins a row-band selection. */
    onGutterMouseDown?: (row: number, shiftKey: boolean) => void;
    /** Pointer enters a gutter cell mid-drag — `(row)`. Extends the active row band. */
    onGutterMouseEnter?: (row: number) => void;
}

export function DataTableBody<TRow>({
    table,
    scrollEl,
    numberedRows,
    gutterWidth,
    rowHeight,
    height,
    regions,
    focusedCell,
    editingCell,
    onCellDoubleClick,
    onCellEditCommit,
    onCellEditCancel,
    onCellMouseDown,
    onCellMouseEnter,
    onGutterMouseDown,
    onGutterMouseEnter,
}: DataTableBodyProps<TRow>) {
    const rows = table.getRowModel().rows;
    const leafColumns = table.getVisibleLeafColumns();

    const virtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => scrollEl,
        estimateSize: () => rowHeight,
        overscan: 10,
        // Seed the initial viewport so the first paint renders the right window (no
        // empty-then-fill flicker) before the ResizeObserver measures: a fixed-height
        // grid's viewport IS `height`; an auto-height grid shows all rows (full content
        // height). The observer corrects this once the element is measured.
        initialRect: { width: 0, height: height ?? rows.length * rowHeight },
    });

    // Static geometry for turning regions into pixel rects. `colX` is the cumulative
    // left edge of each data column; `colX[0]` is the gutter width (first column's edge).
    //
    // Key the memo on the *widths*, NOT the `leafColumns` array — TanStack returns a stable
    // array reference even after a resize, so depending on it leaves `colX` (and thus every
    // selection overlay) stale at the old column sizes. `widthsKey` changes whenever any
    // column's `getSize()` changes, so the overlays follow a resize.
    const colWidths = leafColumns.map((col) => col.getSize());
    const widthsKey = colWidths.join(",");
    const geo: GridGeometry = useMemo(() => {
        const colX: number[] = [gutterWidth];
        for (const w of colWidths) colX.push(colX[colX.length - 1] + w);
        return { colX, rowHeight, rowCount: rows.length, colCount: colWidths.length };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- widthsKey encodes colWidths
    }, [gutterWidth, rowHeight, rows.length, widthsKey]);

    return (
        <div
            role="rowgroup"
            className="relative bg-white dark:bg-[#2f343c]"
            style={{ height: virtualizer.getTotalSize() }}
        >
            {virtualizer.getVirtualItems().map((virtualRow) => {
                const row = rows[virtualRow.index];
                return (
                    <div
                        role="row"
                        key={row.id}
                        aria-rowindex={virtualRow.index + 1}
                        className="absolute left-0 flex w-full"
                        style={{
                            height: rowHeight,
                            // Position via `top`, NOT `transform: translateY`. A transform creates a
                            // stacking context, which would trap the sticky gutter cell's `z-20`
                            // INSIDE this row — letting the selection overlays (later siblings, z-10
                            // over the rows' z-auto) paint over the gutter once it slides across this
                            // content on horizontal scroll. With `top`, the gutter's z-20 correctly
                            // out-stacks the overlays' z-10. Offsets stay integer-rounded to avoid
                            // border-seam flicker (handoff 0084).
                            top: Math.round(virtualRow.start),
                        }}
                    >
                        {numberedRows && (
                            <GutterCell
                                index={row.index}
                                width={gutterWidth}
                                height={rowHeight}
                                selected={isRowSelected(regions, virtualRow.index)}
                                onMouseDown={onGutterMouseDown}
                                onMouseEnter={onGutterMouseEnter}
                            />
                        )}
                        {row.getVisibleCells().map((cell, colIndex) => {
                            const meta = cell.column.columnDef.meta as DataTableColumnMeta | undefined;
                            const align = meta?.align ?? "left";
                            const editable = meta?.editable ?? false;
                            const isEditing =
                                editable &&
                                editingCell?.row === virtualRow.index &&
                                editingCell?.col === colIndex;
                            return (
                                <div
                                    role="gridcell"
                                    key={cell.id}
                                    aria-selected={isCellSelected(regions, virtualRow.index, colIndex)}
                                    onMouseDown={
                                        onCellMouseDown
                                            ? (e) => onCellMouseDown(virtualRow.index, colIndex, e.shiftKey)
                                            : undefined
                                    }
                                    onMouseEnter={
                                        onCellMouseEnter
                                            ? () => onCellMouseEnter(virtualRow.index, colIndex)
                                            : undefined
                                    }
                                    onDoubleClick={
                                        editable && onCellDoubleClick
                                            ? () => onCellDoubleClick(virtualRow.index, colIndex)
                                            : undefined
                                    }
                                    className={cn(
                                        // `relative` so the absolutely-positioned editor fills this cell.
                                        "relative box-border shrink-0 overflow-hidden text-ellipsis whitespace-nowrap px-2",
                                        "text-[12px] text-foreground",
                                        "shadow-[inset_0_-1px_0_rgba(17,20,24,0.15),inset_-1px_0_0_rgba(17,20,24,0.15)]",
                                        "dark:shadow-[inset_0_-1px_0_rgba(17,20,24,0.4),inset_-1px_0_0_rgba(17,20,24,0.4)]",
                                        // Blueprint `.bp6-table-selection-enabled .bp6-table-cell` → the
                                        // `cell` ("+") crosshair cursor when the grid is selectable.
                                        onCellMouseDown && "cursor-cell",
                                        alignClass(align),
                                    )}
                                    style={{
                                        width: cell.column.getSize(),
                                        minWidth: cell.column.getSize(),
                                        height: rowHeight,
                                        lineHeight: `${rowHeight}px`,
                                    }}
                                >
                                    {isEditing ? (
                                        <EditableCell
                                            value={String(cell.getValue() ?? "")}
                                            align={align}
                                            onCommit={(v, move) =>
                                                onCellEditCommit?.(virtualRow.index, colIndex, v, move)
                                            }
                                            onCancel={() => onCellEditCancel?.()}
                                        />
                                    ) : (
                                        flexRender(cell.column.columnDef.cell, cell.getContext())
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );
            })}

            {/* Selection region overlays — translucent fill + 1px border, over the cells. */}
            {regions.map((region, i) => {
                const r = regionRect(region, geo);
                return (
                    <div
                        key={i}
                        aria-hidden
                        data-selection-region
                        className={cn(
                            "pointer-events-none absolute z-10 box-border border border-[#2d72d2] dark:border-[#4c90f0]",
                            "bg-[rgba(45,114,210,0.1)] dark:bg-[rgba(76,144,240,0.1)]",
                        )}
                        style={{ left: r.x, top: r.y, width: r.width, height: r.height }}
                    />
                );
            })}

            {/* Focused-cell outline — a 2px border above the region fill (Blueprint #2d72d2). */}
            {focusedCell && (
                <div
                    aria-hidden
                    data-focus-region
                    className="pointer-events-none absolute z-10 box-border border-2 border-[#2d72d2]"
                    style={(() => {
                        const r = regionRect(cellRegion(focusedCell.row, focusedCell.col), geo);
                        return { left: r.x, top: r.y, width: r.width, height: r.height };
                    })()}
                />
            )}
        </div>
    );
}
