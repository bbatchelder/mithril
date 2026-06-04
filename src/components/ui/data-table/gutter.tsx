"use client";

import { cn } from "@/lib/utils";

import { Skeleton } from "@/components/ui/skeleton";

import type { DataTableColumnAlign } from "../data-table";

/**
 * Row-header gutter + top-left corner quadrant — the sticky, non-scrolling chrome of
 * the grid. Blueprint `.bp6-table-row-name` / `.bp6-table-quadrant-top-left` faithful:
 *   - gutter: font 12px, padding 0 4px, right-aligned, min-width 30px, bottom+right border
 *   - corner: bottom+right border, opaque (occludes scrolled cells beneath it)
 *   border = rgba(17,20,24,0.15) light · rgba(17,20,24,0.4) dark
 *
 * Loop 3: clicking the gutter selects the whole **row** (a band); the corner selects the
 * whole table. A selected gutter cell gets Blueprint's `rgba(45,114,210,0.1)` tint.
 */

/** Tailwind text-alignment class for a column align value. */
export function alignClass(align: DataTableColumnAlign): string {
    return align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
}

/** Top-left corner quadrant (gutter ∩ header). Sticky on both axes, bottom + right borders. */
export function CornerCell({
    width,
    height,
    onSelectAll,
}: {
    width: number;
    height: number;
    /** Click selects the whole table (Blueprint corner behavior). */
    onSelectAll?: () => void;
}) {
    return (
        <div
            aria-hidden
            onMouseDown={onSelectAll}
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
    selected = false,
    loading = false,
    onMouseDown,
    onMouseEnter,
}: {
    index: number;
    width: number;
    height: number;
    /** Whether this row is part of a row-band selection (Blueprint blue tint). */
    selected?: boolean;
    /** Render a skeleton bar instead of the row number (Loop 7). */
    loading?: boolean;
    /** Pointer-down — `(row, shiftKey, additive)`. Begins a row-band click/drag selection. */
    onMouseDown?: (row: number, shiftKey: boolean, additive: boolean) => void;
    /** Pointer enters mid-drag — `(row)`. Extends the active row band. */
    onMouseEnter?: (row: number) => void;
}) {
    return (
        <div
            role="rowheader"
            aria-selected={selected}
            onMouseDown={
                onMouseDown ? (e) => onMouseDown(index, e.shiftKey, e.metaKey || e.ctrlKey) : undefined
            }
            onMouseEnter={onMouseEnter ? () => onMouseEnter(index) : undefined}
            className={cn(
                "sticky left-0 z-20 shrink-0 select-none bg-background px-1 text-right dark:bg-[#383e47]",
                "text-[12px] text-foreground-muted",
                "shadow-[inset_0_-1px_0_rgba(17,20,24,0.15),1px_0_0_rgba(17,20,24,0.15)]",
                "dark:shadow-[inset_0_-1px_0_rgba(17,20,24,0.4),1px_0_0_rgba(17,20,24,0.4)]",
                // Loading: center a thin skeleton bar (Blueprint `.bp6-loading` row name —
                // flex column, justify-center, transparent text).
                loading && "flex flex-col justify-center text-transparent",
                // Blue 10% tint layered as a background-*image* gradient so it sits OVER the
                // gray bg-color (matching Blueprint's `header-selected::before` overlay),
                // rather than replacing it.
                selected && "bg-[linear-gradient(rgba(45,114,210,0.1),rgba(45,114,210,0.1))]",
            )}
            style={{ width, minWidth: width, height, lineHeight: `${height}px` }}
        >
            {loading ? <Skeleton className="h-1 w-full" /> : index + 1}
        </div>
    );
}
