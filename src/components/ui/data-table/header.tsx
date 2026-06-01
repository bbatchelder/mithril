import { flexRender, type Table } from "@tanstack/react-table";

import { cn } from "@/lib/utils";

import { CornerCell } from "./gutter";

/**
 * The sticky column-header row. Blueprint `.bp6-table-column-headers .bp6-table-header`:
 *   line-height 30px, min-height 30px, font 12px, bottom border (0 1px 0 <border>).
 *   (dark theme additionally draws a 1px right inset divider between headers.)
 *
 * Header text is always left-aligned — Blueprint column headers do not follow a
 * column's cell alignment (a right-aligned numeric column still has a left header).
 */
export interface DataTableHeaderProps<TRow> {
    table: Table<TRow>;
    numberedRows: boolean;
    gutterWidth: number;
    headerHeight: number;
}

export function DataTableHeader<TRow>({
    table,
    numberedRows,
    gutterWidth,
    headerHeight,
}: DataTableHeaderProps<TRow>) {
    return (
        <div role="rowgroup" className="sticky top-0 z-30 bg-background dark:bg-[#383e47]">
            {table.getHeaderGroups().map((headerGroup) => (
                <div role="row" key={headerGroup.id} className="flex">
                    {numberedRows && <CornerCell width={gutterWidth} height={headerHeight} />}
                    {headerGroup.headers.map((header) => {
                        return (
                            <div
                                role="columnheader"
                                key={header.id}
                                aria-colindex={header.index + 1}
                                className={cn(
                                    "box-border flex shrink-0 items-center overflow-hidden px-2",
                                    "bg-background dark:bg-[#383e47]",
                                    "whitespace-nowrap text-[12px] font-normal text-foreground",
                                    "shadow-[0_1px_0_rgba(17,20,24,0.15)]",
                                    "dark:shadow-[0_1px_0_rgba(17,20,24,0.4),inset_-1px_0_0_rgba(17,20,24,0.4)]",
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
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}
