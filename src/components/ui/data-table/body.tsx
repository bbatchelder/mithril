import { flexRender, type Table } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";

import { cn } from "@/lib/utils";

import type { DataTableColumnMeta } from "../data-table";
import { GutterCell, alignClass } from "./gutter";

/**
 * The grid body. Blueprint `.bp6-table-cell`:
 *   font 12px, height 20px, line-height 20px, padding 0 8px,
 *   box-shadow: inset 0 -1px 0 <border>, inset -1px 0 0 <border>  (bottom + right)
 *   border = rgba(17,20,24,0.15) light · rgba(17,20,24,0.4) dark
 *
 * Loop 2: rows are **virtualized** with `@tanstack/react-virtual`. The body is a relative
 * spacer of `getTotalSize()` px; each visible row is absolutely positioned via
 * `translateY(round(start))` (offsets rounded to integers to avoid border-seam flicker).
 * The scroll viewport is the `role="grid"` container (a fixed `height` bounds it); the
 * sticky header/gutter live in the same scroll element, so horizontal scroll syncs for free.
 */
export interface DataTableBodyProps<TRow> {
    table: Table<TRow>;
    scrollRef: React.RefObject<HTMLDivElement | null>;
    numberedRows: boolean;
    gutterWidth: number;
    rowHeight: number;
    /** Fixed grid height, if any — seeds the virtualizer's initial viewport. */
    height?: number;
}

export function DataTableBody<TRow>({
    table,
    scrollRef,
    numberedRows,
    gutterWidth,
    rowHeight,
    height,
}: DataTableBodyProps<TRow>) {
    const rows = table.getRowModel().rows;

    const virtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => rowHeight,
        overscan: 10,
        // Seed the initial viewport so the first paint renders the right window (no
        // empty-then-fill flicker) before the ResizeObserver measures: a fixed-height
        // grid's viewport IS `height`; an auto-height grid shows all rows (full content
        // height). The observer corrects this once the element is measured.
        initialRect: { width: 0, height: height ?? rows.length * rowHeight },
    });

    return (
        <div role="rowgroup" className="relative" style={{ height: virtualizer.getTotalSize() }}>
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
                            transform: `translateY(${Math.round(virtualRow.start)}px)`,
                        }}
                    >
                        {numberedRows && (
                            <GutterCell index={row.index} width={gutterWidth} height={rowHeight} />
                        )}
                        {row.getVisibleCells().map((cell) => {
                            const meta = cell.column.columnDef.meta as DataTableColumnMeta | undefined;
                            const align = meta?.align ?? "left";
                            return (
                                <div
                                    role="gridcell"
                                    key={cell.id}
                                    className={cn(
                                        "box-border shrink-0 overflow-hidden text-ellipsis whitespace-nowrap px-2",
                                        "text-[12px] text-foreground",
                                        "shadow-[inset_0_-1px_0_rgba(17,20,24,0.15),inset_-1px_0_0_rgba(17,20,24,0.15)]",
                                        "dark:shadow-[inset_0_-1px_0_rgba(17,20,24,0.4),inset_-1px_0_0_rgba(17,20,24,0.4)]",
                                        alignClass(align),
                                    )}
                                    style={{
                                        width: cell.column.getSize(),
                                        minWidth: cell.column.getSize(),
                                        height: rowHeight,
                                        lineHeight: `${rowHeight}px`,
                                    }}
                                >
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
}
