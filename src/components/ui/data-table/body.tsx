import { flexRender, type Table } from "@tanstack/react-table";

import { cn } from "@/lib/utils";

import type { DataTableColumnMeta } from "../data-table";
import { GutterCell, alignClass } from "./gutter";

/**
 * The grid body. Blueprint `.bp6-table-cell`:
 *   font 12px, height 20px, line-height 20px, padding 0 8px,
 *   box-shadow: inset 0 -1px 0 <border>, inset -1px 0 0 <border>  (bottom + right)
 *   border = rgba(17,20,24,0.15) light · rgba(17,20,24,0.4) dark
 *
 * Loop 1 renders every row (no windowing). Loop 2 replaces this with a virtualized body.
 */
export interface DataTableBodyProps<TRow> {
    table: Table<TRow>;
    numberedRows: boolean;
    gutterWidth: number;
    rowHeight: number;
}

export function DataTableBody<TRow>({
    table,
    numberedRows,
    gutterWidth,
    rowHeight,
}: DataTableBodyProps<TRow>) {
    const rows = table.getRowModel().rows;
    return (
        <div role="rowgroup">
            {rows.map((row) => (
                <div role="row" key={row.id} className="flex" style={{ height: rowHeight }}>
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
            ))}
        </div>
    );
}
