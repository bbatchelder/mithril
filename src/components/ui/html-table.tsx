import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";

import { cn } from "@/lib/utils";

/**
 * HTMLTable component — pixel-faithful reimplementation of Blueprint's `.bp6-html-table`.
 *
 * Blueprint spec (`packages/core/src/components/html-table/_html-table.scss`):
 *
 * Base styles:
 *   border-spacing: 0
 *   font-size: 14px ($pt-font-size = $pt-spacing * 3.5 = 4px * 3.5)
 *   th, td: padding = centered-text(40px) = floor((40 - 18) * 0.5) = 11px all sides
 *   th, td: text-align: left; vertical-align: top
 *   th: font-weight: 600; color: $pt-heading-color (= dark-gray-1 light / light-gray-5 dark)
 *   td: color: $pt-text-color (= dark-gray-1 light / light-gray-5 dark)
 *   tbody tr:first-child, tfoot tr:first-child → th,td: box-shadow: inset 0 1px 0 0 $table-border-color
 *     where $table-border-color = $pt-divider-black = rgba(0,0,0,0.15) light
 *           $dark-table-border-color = $pt-dark-divider-white = rgba(255,255,255,0.2) dark
 *
 * compact modifier (.bp6-compact):
 *   th, td: padding-top / padding-bottom = centered-text(30px) = floor((30 - 18) * 0.5) = 6px
 *   horizontal padding stays at 11px
 *
 * striped modifier (.bp6-html-table-striped):
 *   tbody tr:nth-child(odd) td: background = rgba($gray3, 0.15) light ≈ rgba(143,153,168,0.15)
 *                                background = rgba($gray1, 0.15) dark  ≈ rgba(95,107,124,0.15)
 *
 * bordered modifier (.bp6-html-table-bordered):
 *   th:not(:first-child): box-shadow: inset 1px 0 0 0 $table-border-color   (left-side separator)
 *   tbody td: box-shadow: inset 0 1px 0 0 $table-border-color                (top border on all cells)
 *   tbody td:not(:first-child): box-shadow: inset 1px 1px 0 0 $table-border-color (top + left)
 *   (dark variants use $dark-table-border-color)
 *
 * interactive modifier (.bp6-interactive):
 *   tbody tr:hover td: background-color = rgba($gray3, 0.3) light / rgba($gray1, 0.3) dark
 *   tbody tr:active td: background-color = rgba($gray3, 0.35) light / rgba($gray1, 0.4) dark
 *   cursor: pointer on hover
 *
 * Implementation note on child-selector Tailwind classes:
 *   Tailwind v4 supports `[&_selector]:utility` for descendant selectors.
 *   Cell separators must be expressed as arbitrary shadow values — these are the
 *   LITERAL classes included in the component JSX so Tailwind emits them at build time.
 *
 * @see https://blueprintjs.com/docs/#core/components/html-table
 */

// ── Token computed values ──────────────────────────────────────────────────
// $pt-divider-black = rgba(0,0,0,0.15) (light cell border shadow color)
// $pt-dark-divider-white = rgba(255,255,255,0.2) (dark cell border shadow color)
// $gray3 = #8f99a8 → rgba(143,153,168,N) (stripe/hover bg, light)
// $gray1 = #5f6b7c → rgba(95,107,124,N)  (stripe/hover bg, dark)

// Shadow values as CSS custom property pairs (stored in @layer base / :root)
// We use literal arbitrary values in [&_...] selectors below for tree-shaking safety.

export const tableVariants = cva(
    [
        // ── Base table reset ──────────────────────────────────────────────
        "border-spacing-0 border-collapse-separate",
        "text-body", // font-size: 14px
        // ── th/td base: padding, alignment, text color ───────────────────
        // padding: 11px all sides (centered-text of 40px row height)
        "[&_th]:py-[11px] [&_th]:px-[11px]",
        "[&_td]:py-[11px] [&_td]:px-[11px]",
        "[&_th]:text-left [&_th]:align-top",
        "[&_td]:text-left [&_td]:align-top",
        // th: heading color (dark-gray-1 light, light-gray-5 dark) + semibold
        "[&_th]:text-foreground [&_th]:font-semibold",
        // td: regular text color (same token as heading in Blueprint)
        "[&_td]:text-foreground",
        // ── Cell bottom border (only on first row of tbody/tfoot) ─────────
        // Blueprint: tbody tr:first-child th,td { box-shadow: inset 0 1px 0 0 $table-border-color }
        // This is a TOP shadow on the FIRST row (not bottom of header — Blueprint has no thead rule here).
        "[&_tbody_tr:first-child_th]:shadow-[inset_0_1px_0_0_rgba(17,20,24,0.15)]",
        "[&_tbody_tr:first-child_td]:shadow-[inset_0_1px_0_0_rgba(17,20,24,0.15)]",
        "[&_tfoot_tr:first-child_th]:shadow-[inset_0_1px_0_0_rgba(17,20,24,0.15)]",
        "[&_tfoot_tr:first-child_td]:shadow-[inset_0_1px_0_0_rgba(17,20,24,0.15)]",
        // Dark theme: same selectors with rgba(255,255,255,0.2)
        "dark:[&_tbody_tr:first-child_th]:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]",
        "dark:[&_tbody_tr:first-child_td]:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]",
        "dark:[&_tfoot_tr:first-child_th]:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]",
        "dark:[&_tfoot_tr:first-child_td]:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]",
    ],
    {
        variants: {
            /**
             * Adds vertical cell separators and outer borders via box-shadow.
             * Equivalent to Blueprint's `.bp6-html-table-bordered`.
             */
            bordered: {
                true: [
                    // th:not(:first-child): left separator
                    "[&_th:not(:first-child)]:shadow-[inset_1px_0_0_0_rgba(17,20,24,0.15)]",
                    "dark:[&_th:not(:first-child)]:shadow-[inset_1px_0_0_0_rgba(255,255,255,0.2)]",
                    // tbody td (all): top border
                    "[&_tbody_tr_td]:shadow-[inset_0_1px_0_0_rgba(17,20,24,0.15)]",
                    "dark:[&_tbody_tr_td]:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]",
                    // tbody td:not(:first-child): top + left border
                    "[&_tbody_tr_td:not(:first-child)]:shadow-[inset_1px_1px_0_0_rgba(17,20,24,0.15)]",
                    "dark:[&_tbody_tr_td:not(:first-child)]:shadow-[inset_1px_1px_0_0_rgba(255,255,255,0.2)]",
                    // tfoot td (all): top border
                    "[&_tfoot_tr_td]:shadow-[inset_0_1px_0_0_rgba(17,20,24,0.15)]",
                    "dark:[&_tfoot_tr_td]:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]",
                    // tfoot td:not(:first-child): top + left border
                    "[&_tfoot_tr_td:not(:first-child)]:shadow-[inset_1px_1px_0_0_rgba(17,20,24,0.15)]",
                    "dark:[&_tfoot_tr_td:not(:first-child)]:shadow-[inset_1px_1px_0_0_rgba(255,255,255,0.2)]",
                ],
                false: [],
            },

            /**
             * Alternating row background color on odd rows.
             * Equivalent to Blueprint's `.bp6-html-table-striped`.
             * Light: rgba($gray3, 0.15) = rgba(143,153,168,0.15)
             * Dark:  rgba($gray1, 0.15) = rgba(95,107,124,0.15)
             */
            striped: {
                true: [
                    "[&_tbody_tr:nth-child(odd)_td]:bg-[rgba(143,153,168,0.15)]",
                    "dark:[&_tbody_tr:nth-child(odd)_td]:bg-[rgba(95,107,124,0.15)]",
                ],
                false: [],
            },

            /**
             * Row hover + active background. Row cursor changes to pointer on hover.
             * Equivalent to Blueprint's `.bp6-interactive` on the table.
             * Light hover: rgba($gray3, 0.3) = rgba(143,153,168,0.3)
             * Light active: rgba($gray3, 0.35) = rgba(143,153,168,0.35)
             * Dark hover:  rgba($gray1, 0.3) = rgba(95,107,124,0.3)
             * Dark active: rgba($gray1, 0.4) = rgba(95,107,124,0.4)
             */
            interactive: {
                true: [
                    "[&_tbody_tr:hover_td]:bg-[rgba(143,153,168,0.3)]",
                    "[&_tbody_tr:hover_td]:cursor-pointer",
                    "[&_tbody_tr:active_td]:bg-[rgba(143,153,168,0.35)]",
                    "dark:[&_tbody_tr:hover_td]:bg-[rgba(95,107,124,0.3)]",
                    "dark:[&_tbody_tr:active_td]:bg-[rgba(95,107,124,0.4)]",
                ],
                false: [],
            },

            /**
             * Reduced vertical cell padding.
             * centered-text(30px) = floor((30 - 18) * 0.5) = 6px vertical, 11px horizontal unchanged.
             * Equivalent to Blueprint's `.bp6-compact` on the table.
             */
            compact: {
                true: [
                    "[&_th]:py-[6px]",
                    "[&_td]:py-[6px]",
                ],
                false: [],
            },
        },
        defaultVariants: {
            bordered: false,
            striped: false,
            interactive: false,
            compact: false,
        },
    },
);

export interface HTMLTableProps
    extends React.TableHTMLAttributes<HTMLTableElement>,
        Omit<VariantProps<typeof tableVariants>, "bordered" | "striped" | "interactive" | "compact"> {
    /**
     * Adds borders between columns and rows (via box-shadow, like Blueprint).
     * @default false
     */
    bordered?: boolean;

    /**
     * Alternates row background color on odd rows.
     * @default false
     */
    striped?: boolean;

    /**
     * Enables row hover and active background. Rows get cursor:pointer on hover.
     * @default false
     */
    interactive?: boolean;

    /**
     * Reduces vertical cell padding (6px instead of 11px).
     * @default false
     */
    compact?: boolean;
}

/**
 * Styled HTML table — pixel-faithful Blueprint `.bp6-html-table` reimplementation.
 *
 * Consumers compose native `<thead>`, `<tbody>`, `<tfoot>`, `<tr>`, `<th>`, `<td>` inside.
 * All cell separator rules are applied via CSS child selectors on the table element.
 *
 * ```tsx
 * // Plain table
 * <HTMLTable>
 *   <thead>
 *     <tr>
 *       <th data-compare="html-table-header">Name</th>
 *       <th>Role</th>
 *     </tr>
 *   </thead>
 *   <tbody>
 *     <tr data-compare="html-table-row">
 *       <td data-compare="html-table-cell">Alice</td>
 *       <td>Engineer</td>
 *     </tr>
 *   </tbody>
 * </HTMLTable>
 *
 * // Bordered + striped
 * <HTMLTable bordered striped>...</HTMLTable>
 *
 * // Interactive (hover effect)
 * <HTMLTable interactive>...</HTMLTable>
 *
 * // Compact density
 * <HTMLTable compact>...</HTMLTable>
 * ```
 *
 * @see https://blueprintjs.com/docs/#core/components/html-table
 */
export const HTMLTable = forwardRef<HTMLTableElement, HTMLTableProps>(function HTMLTable(
    { bordered = false, striped = false, interactive = false, compact = false, className, ...props },
    ref,
) {
    return (
        <table
            ref={ref}
            className={cn(
                tableVariants({ bordered, striped, interactive, compact }),
                className,
            )}
            {...props}
        />
    );
});
