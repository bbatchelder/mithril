import { Children, cloneElement, forwardRef, isValidElement } from "react";

import { cn } from "@/lib/utils";
import { Card } from "./card";

/**
 * CardList component — pixel-faithful reimplementation of Blueprint's CardList.
 *
 * Blueprint spec (`packages/core/src/components/card-list/card-list.scss`, v6.15):
 *
 * $pt-spacing = 4px
 *
 * CardList outer (.bp6-card-list):
 *   overflow: auto
 *   padding: 0  (1px in dark theme — so card items don't sit over inset border)
 *   width: 100%
 *   elevation: 0 (uses Card component; bordered adds radius/shadow)
 *
 * bordered=true (.bp6-card-list-bordered):
 *   First child Card: border-top-left-radius + border-top-right-radius = $pt-border-radius
 *   Last child Card:  border-bottom-left-radius + border-bottom-right-radius = $pt-border-radius
 *
 * bordered=false:
 *   border-radius: 0; box-shadow: none
 *   dark: margin: 1px; width: calc(100% - ($pt-spacing * 0.5))   [= 100% - 2px]
 *
 * Child Cards (> .bp6-card):
 *   align-items: center; display: flex
 *   border-radius: 0; box-shadow: none
 *   min-height: $card-list-item-min-height   = $pt-button-height + 2*$card-list-item-padding-vertical + 1px
 *                                            = 30 + 2*8 + 1 = 47px
 *   padding: $card-list-item-padding         = 8px 20px
 *
 * compact > child Cards:
 *   min-height: $card-list-item-min-height-compact  = 30 + 2*8 + 1 = 47px (same calculation!)
 *   padding: $card-list-item-padding-compact         = 8px 16px
 *
 * Divider between rows:
 *   :not(:last-child) border-bottom: 1px solid $pt-divider-black-muted = rgba(0,0,0,0.1)
 *   dark: border-color: $pt-dark-divider-white-muted = rgba(255,255,255,0.1)
 *   Note: "muted" divider (0.1 alpha), unlike Section which uses the regular (0.15/0.2 alpha).
 *
 * Interactive child Card hover/active:
 *   background-color: $light-gray5 = #f6f7f9; box-shadow: none
 *   dark: background-color: $dark-gray3 = #2f343c; box-shadow: none
 *
 * Selected child Card:
 *   background-color: $light-gray4 = #edeff2; box-shadow: none
 *   dark: background-color: $dark-gray4 = #383e47; box-shadow: none
 *
 * Design decisions:
 *   - The outer container is our Card (provides surface bg, border-radius, box-shadow for elevation 0).
 *   - Children are styled via descendant CSS selectors on the container. Since we can't use arbitrary
 *     CSS-in-JS selectors in Tailwind v4 per-component, we expose a `compact` prop that is passed down
 *     to children via a `data-card-list-compact` attribute on the container. Children detect this via
 *     CSS selectors on the `[data-card-list-compact]` ancestor.
 *   - Interactive child cards override their hover/active shadow to `none` (flat in list).
 *   - The `role="list"` is forwarded to the container for accessibility (matches Blueprint).
 *
 * @see https://blueprintjs.com/docs/#core/components/card-list
 */

export interface CardListProps extends React.HTMLAttributes<HTMLDivElement> {
    /**
     * Whether this container should have a visual border (elevation ring + border-radius).
     * Set to `false` when nesting inside another bordered container (e.g. SectionCard).
     * In dark theme, `bordered=false` adds a 1px margin to account for the inset shadow.
     *
     * @default true
     */
    bordered?: boolean;

    /**
     * Whether to use compact sizing (reduced horizontal padding: 16px instead of 20px).
     * This affects all child Card items automatically — no need to set `compact` on each.
     *
     * @default false
     */
    compact?: boolean;

    children?: React.ReactNode;
}

/**
 * Vertical list of Cards separated by hairline dividers.
 *
 * Quick reference:
 *   <CardList>
 *     <Card>Item one</Card>
 *     <Card interactive>Clickable item</Card>
 *     <Card>Item three</Card>
 *   </CardList>
 *
 *   // Compact, flush (inside a SectionCard):
 *   <CardList bordered={false} compact>
 *     <Card>Item one</Card>
 *     <Card>Item two</Card>
 *   </CardList>
 */
export const CardList = forwardRef<HTMLDivElement, CardListProps>(function CardList(
    { bordered = true, compact = false, className, children, ...htmlProps },
    ref,
) {
    // The container is role="list", so its direct children must be role="listitem"
    // (axe aria-required-children / WCAG 1.3.1). Each child Card forwards `role`, so
    // stamp it here unless the consumer already set an explicit role.
    const items = Children.map(children, (child) =>
        isValidElement<{ role?: string }>(child) && child.props.role == null
            ? cloneElement(child, { role: "listitem" })
            : child,
    );

    return (
        <Card
            ref={ref}
            role="list"
            elevation={0}
            // Tailwind v4 literal classes for the container:
            // - p-0 overrides Card's default p-5/p-4 padding
            // - overflow-auto matches Blueprint
            // - w-full matches Blueprint
            // - min-w-0 matches Blueprint's normalize min-width:0 reset
            // - [&>div]:rounded-none     — flatten child Card border-radius
            // - [&>div]:shadow-none      — flatten child Card box-shadow
            // - [&>div]:flex             — child Cards are flex containers
            // - [&>div]:items-center     — vertically center card content
            // - [&>div]:min-h-[47px]     — $card-list-item-min-height (47px)
            // - [&>div]:py-2 [&>div]:px-5 — item padding: 8px 20px
            // - divider on :not(:last-child) via [&>div:not(:last-child)]
            // Compact changes horizontal padding: px-5 → px-4
            className={cn(
                "p-0 overflow-auto w-full min-w-0",

                // ── Child Card base styles ───────────────────────────────────────────────
                // Reset Card's border-radius and shadow so items are flat within the list.
                "[&>div]:rounded-none",
                "[&>div]:shadow-none",
                // Flex display + vertical centering (Blueprint's align-items: center).
                "[&>div]:flex",
                "[&>div]:items-center",
                // Min-height: $pt-button-height (30px) + 2 * item-padding-vertical (8px) + 1px border = 47px
                "[&>div]:min-h-[47px]",
                // Item padding: 8px vertical, 20px horizontal (regular) or 16px (compact)
                "[&>div]:py-2",
                compact ? "[&>div]:px-4" : "[&>div]:px-5",

                // ── Divider between rows ─────────────────────────────────────────────────
                // Use $pt-divider-black-muted — Blueprint v6.15 renders this as
                // rgba(20,20,20,0.1) (matches the elevation hairline ring), lighter than
                // Section's 0.15. Dark: $pt-dark-divider-white-muted (rgba(255,255,255,0.1)).
                "[&>div:not(:last-child)]:border-b",
                "[&>div:not(:last-child)]:border-b-[rgba(20,20,20,0.1)]",
                "dark:[&>div:not(:last-child)]:border-b-[rgba(255,255,255,0.1)]",

                // ── Interactive child Card hover/active ──────────────────────────────────
                // Blueprint uses $light-gray5 (#f6f7f9) light / $dark-gray3 (#2f343c) dark.
                // Override shadow to none (flat even on hover — no elevation lift in a list).
                "[&>div.cursor-pointer:hover]:bg-light-gray-5",
                "[&>div.cursor-pointer:hover]:shadow-none",
                "[&>div.cursor-pointer:active]:bg-light-gray-5",
                "[&>div.cursor-pointer:active]:shadow-none",
                "dark:[&>div.cursor-pointer:hover]:bg-dark-gray-3",
                "dark:[&>div.cursor-pointer:active]:bg-dark-gray-3",

                // ── Selected child Card ───────────────────────────────────────────────────
                // Blueprint: $light-gray4 (#edeff2) light / $dark-gray4 (#383e47) dark.
                "[&>div[data-selected]]:bg-light-gray-4",
                "[&>div[data-selected]]:shadow-none",
                "dark:[&>div[data-selected]]:bg-dark-gray-4",

                // ── Bordered vs flush ────────────────────────────────────────────────────
                // bordered=true (default): Card's own border-radius + shadow ring apply.
                // First/last child Cards restore the outer container's border-radius (clipped by overflow-hidden).
                // We use rounded-mithril on the container via Card, and overflow is "auto" not "hidden",
                // so we need first/last-child to have their own radius.
                bordered && [
                    // First child restores top corners; last child restores bottom corners.
                    "[&>div:first-child]:rounded-t-mithril",
                    "[&>div:last-child]:rounded-b-mithril",
                    // In dark theme, Blueprint adds 1px padding so items don't overlap the inset border ring.
                    "dark:p-[1px]",
                ],
                // bordered=false: no radius, no shadow on the container.
                !bordered && [
                    "rounded-none",
                    "shadow-none",
                    // Dark: add 1px margin + reduce width by 2px (width: calc(100% - 2px))
                    "dark:m-[1px]",
                    "dark:w-[calc(100%-2px)]",
                ],

                className,
            )}
            {...htmlProps}
        >
            {items}
        </Card>
    );
});

CardList.displayName = "CardList";
