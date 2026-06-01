import { cn } from "@/lib/utils";

import type { DataTableColumnAlign } from "../data-table";

/**
 * Row-header gutter + top-left corner quadrant — the sticky, non-scrolling chrome of
 * the grid. Blueprint `.bp6-table-row-name` / `.bp6-table-quadrant-top-left` faithful:
 *   - gutter: font 12px, padding 0 4px, right-aligned, min-width 30px, bottom+right border
 *   - corner: bottom+right border, opaque (occludes scrolled cells beneath it)
 *   border = rgba(17,20,24,0.15) light · rgba(17,20,24,0.4) dark
 */

/** Tailwind text-alignment class for a column align value. */
export function alignClass(align: DataTableColumnAlign): string {
    return align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
}

/** Top-left corner quadrant (gutter ∩ header). Sticky on both axes, bottom + right borders. */
export function CornerCell({ width, height }: { width: number; height: number }) {
    return (
        <div
            aria-hidden
            className={cn(
                "sticky left-0 top-0 z-40 shrink-0 bg-background dark:bg-[#383e47]",
                "shadow-[0_1px_0_rgba(17,20,24,0.15),inset_-1px_0_0_rgba(17,20,24,0.15)]",
                "dark:shadow-[0_1px_0_rgba(17,20,24,0.4),inset_-1px_0_0_rgba(17,20,24,0.4)]",
            )}
            style={{ width, minWidth: width, height }}
        />
    );
}

/** Row-header gutter cell: a sticky, right-aligned 1-based row number. */
export function GutterCell({
    index,
    width,
    height,
}: {
    index: number;
    width: number;
    height: number;
}) {
    return (
        <div
            role="rowheader"
            className={cn(
                "sticky left-0 z-20 shrink-0 select-none bg-background px-1 text-right dark:bg-[#383e47]",
                "text-[12px] text-foreground-muted",
                "shadow-[inset_0_-1px_0_rgba(17,20,24,0.15),1px_0_0_rgba(17,20,24,0.15)]",
                "dark:shadow-[inset_0_-1px_0_rgba(17,20,24,0.4),1px_0_0_rgba(17,20,24,0.4)]",
            )}
            style={{ width, minWidth: width, height, lineHeight: `${height}px` }}
        >
            {index + 1}
        </div>
    );
}
