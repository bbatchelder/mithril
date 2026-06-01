import { flexRender, type Table } from "@tanstack/react-table";

import { cn } from "@/lib/utils";

import { CornerCell } from "./gutter";
import { isColumnSelected, type SelectionRegion } from "./selection";

/**
 * The sticky column-header row. Blueprint `.bp6-table-column-headers .bp6-table-header`:
 *   line-height 30px, min-height 30px, bottom border (0 1px 0 <border>).
 *   Header **text** (`.bp6-table-column-name-text`) is the body default **14px** —
 *   NOT the 12px of body cells — at line-height 30px (vertically filling the header).
 *   (dark theme additionally draws a 1px right inset divider between headers.)
 *
 * Header text is always left-aligned — Blueprint column headers do not follow a
 * column's cell alignment (a right-aligned numeric column still has a left header).
 *
 * Loop 3: clicking a header selects the whole **column** (a band); a selected header gets
 * Blueprint's `rgba(45,114,210,0.1)` tint (layered as a background-image over the gray bg).
 */
export interface DataTableHeaderProps<TRow> {
    table: Table<TRow>;
    numberedRows: boolean;
    gutterWidth: number;
    headerHeight: number;
    /** Active selection regions — used to tint fully-selected column headers. */
    regions: SelectionRegion[];
    /** Pointer-down on a column header — `(col, shiftKey)`. Begins a column-band selection. */
    onHeaderMouseDown?: (col: number, shiftKey: boolean) => void;
    /** Pointer enters a header mid-drag — `(col)`. Extends the active column band. */
    onHeaderMouseEnter?: (col: number) => void;
    /** Corner click — selects the whole table. */
    onSelectAll?: () => void;
}

export function DataTableHeader<TRow>({
    table,
    numberedRows,
    gutterWidth,
    headerHeight,
    regions,
    onHeaderMouseDown,
    onHeaderMouseEnter,
    onSelectAll,
}: DataTableHeaderProps<TRow>) {
    return (
        <div role="rowgroup" className="sticky top-0 z-30 bg-background dark:bg-[#383e47]">
            {table.getHeaderGroups().map((headerGroup) => (
                <div role="row" key={headerGroup.id} className="flex">
                    {numberedRows && (
                        <CornerCell width={gutterWidth} height={headerHeight} onSelectAll={onSelectAll} />
                    )}
                    {headerGroup.headers.map((header, colIndex) => {
                        const selected = isColumnSelected(regions, colIndex);
                        return (
                            <div
                                role="columnheader"
                                key={header.id}
                                aria-colindex={header.index + 1}
                                aria-selected={selected}
                                onMouseDown={
                                    onHeaderMouseDown
                                        ? (e) => onHeaderMouseDown(colIndex, e.shiftKey)
                                        : undefined
                                }
                                onMouseEnter={
                                    onHeaderMouseEnter ? () => onHeaderMouseEnter(colIndex) : undefined
                                }
                                className={cn(
                                    "relative box-border flex shrink-0 items-center overflow-hidden px-2",
                                    "bg-background dark:bg-[#383e47]",
                                    "whitespace-nowrap text-[14px] font-normal text-foreground",
                                    "shadow-[0_1px_0_rgba(17,20,24,0.15)]",
                                    "dark:shadow-[0_1px_0_rgba(17,20,24,0.4),inset_-1px_0_0_rgba(17,20,24,0.4)]",
                                    // Blue 10% tint as a background-image gradient (over the gray bg).
                                    selected &&
                                        "bg-[linear-gradient(rgba(45,114,210,0.1),rgba(45,114,210,0.1))]",
                                )}
                                style={{
                                    width: header.getSize(),
                                    minWidth: header.getSize(),
                                    height: headerHeight,
                                }}
                            >
                                {header.isPlaceholder
                                    ? null
                                    : flexRender(header.column.columnDef.header, header.getContext())}
                                {/* Resize handle (Loop 4) — Blueprint `.bp6-table-resize-handle`:
                                    a 4px ew-resize hit-target on the right edge, hidden until
                                    hover/drag, with a 3px #2d72d2 line. `stopPropagation` keeps a
                                    handle grab from also triggering column selection. */}
                                {header.column.getCanResize() && (
                                    <div
                                        data-resize-handle
                                        aria-hidden
                                        onMouseDown={(e) => {
                                            e.stopPropagation();
                                            header.getResizeHandler()(e);
                                        }}
                                        onTouchStart={(e) => {
                                            e.stopPropagation();
                                            header.getResizeHandler()(e);
                                        }}
                                        className={cn(
                                            "absolute right-0 top-0 z-20 h-full w-[4px] cursor-ew-resize touch-none",
                                            "opacity-0 hover:opacity-100",
                                            header.column.getIsResizing() && "opacity-100",
                                        )}
                                    >
                                        <div className="absolute left-[1px] top-0 h-full w-[3px] bg-[#2d72d2]" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}
