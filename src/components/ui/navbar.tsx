import { forwardRef } from "react";

import { cn } from "@/lib/utils";

/**
 * Navbar — pixel-faithful reimplementation of Blueprint's `.bp6-navbar`.
 *
 * Blueprint spec (`packages/core/src/components/navbar/_navbar.scss`):
 *   height: $pt-navbar-height = 50px (= $pt-spacing * 12.5 = 4px * 12.5)
 *   padding: 0 $navbar-padding = 0 16px (= $pt-spacing * 4 = 4px * 4)
 *   background-color: $card-background-color = white (light) / dark-gray-3 (dark)
 *   box-shadow: $pt-elevation-shadow-1 → shadow-card-1
 *   position: relative; width: 100%
 *   z-index: $pt-z-index-content = 10
 *
 * NavbarGroup spec:
 *   display: flex; align-items: center; height: 50px
 *   align="left" → float: left (implemented as flex justify with spacer for modern layout)
 *   align="right" → float: right
 *
 * NavbarHeading spec:
 *   font-size: $pt-font-size-large = 16px; margin-right: 16px
 *
 * NavbarDivider spec:
 *   border-left: 1px solid $pt-divider-black = rgba(black, 0.15)
 *   height: $pt-navbar-height - $pt-spacing * 7.5 = 50px - 30px = 20px
 *   margin: 0 ($pt-spacing * 2) = 0 8px
 *   dark: border-left-color: $pt-dark-divider-white = rgba(white, 0.2)
 *
 * Design decisions:
 *   - NavbarGroup alignment uses CSS flex with `justify-content: space-between` on the
 *     Navbar container rather than float:left/right. This is a cleaner modern equivalent
 *     that produces identical visual output (left group left, right group right).
 *   - bg-surface resolves to white in light and dark-gray-2 (#252a31) in dark — this
 *     matches our Card component's dark bg token (derived from Blueprint's OKLCH card
 *     formula), not Blueprint's literal $dark-gray3 (#2f343c). This is intentional:
 *     consistency with Card takes priority, and the delta is documented below.
 *   - shadow-card-1 (not shadow-elevation-1): card-1 includes the dark inset highlight
 *     layer that Blueprint's dark navbar applies.
 *   - NavbarDivider uses inline border-left (not reusing the Divider component, which
 *     uses both border-bottom and border-right for bidirectional use). NavbarDivider is
 *     always vertical.
 *   - fixedTop is supported: position fixed, left/right/top 0, z-index z-overlay (20).
 *
 * @see https://blueprintjs.com/docs/#core/components/navbar
 */

// ---------------------------------------------------------------------------
// Navbar
// ---------------------------------------------------------------------------

export interface NavbarProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Whether this navbar should be fixed to the top of the viewport. @default false */
    fixedTop?: boolean;
    /**
     * Whether this navbar should stick to the top of its scroll container (stays in flow,
     * unlike `fixedTop`, so no content offset is needed). @default false
     */
    sticky?: boolean;
    children?: React.ReactNode;
    className?: string;
}

/**
 * Top application bar. Holds NavbarGroup, NavbarHeading, NavbarDivider, and Buttons.
 *
 * ```tsx
 * <Navbar>
 *   <NavbarGroup align="left">
 *     <NavbarHeading>App</NavbarHeading>
 *     <NavbarDivider />
 *     <Button variant="minimal">File</Button>
 *   </NavbarGroup>
 *   <NavbarGroup align="right">
 *     <Button variant="minimal" icon={<Settings />} aria-label="Settings" />
 *   </NavbarGroup>
 * </Navbar>
 * ```
 */
export const Navbar = forwardRef<HTMLDivElement, NavbarProps>(function Navbar(
    { fixedTop = false, sticky = false, className, children, ...htmlProps },
    ref,
) {
    return (
        <div
            ref={ref}
            className={cn(
                // Base: bg, shadow, height, padding, width
                // shadow-overlay-1: elevation-1 with Blueprint's rgba(20,20,20) hairline ring
                // (light) + dark drop/highlight layer order (see tokens.css, Cluster A/B).
                "bg-surface shadow-overlay-1",
                "h-[50px] w-full",
                "px-4",
                // Flex layout: left group left, right group right
                "flex items-center justify-between",
                // Position: exactly one of fixed / sticky / relative (mutually exclusive so the
                // generated `position` utility is unambiguous — no relative/sticky class clash).
                fixedTop
                    ? "fixed left-0 right-0 top-0 z-content"
                    : sticky
                      ? "sticky left-0 right-0 top-0 z-content"
                      : "relative z-content",
                className,
            )}
            {...htmlProps}
        >
            {children}
        </div>
    );
});

// ---------------------------------------------------------------------------
// NavbarGroup
// ---------------------------------------------------------------------------

export type NavbarGroupAlign = "left" | "right";

export interface NavbarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
    /**
     * Which side of the navbar this group sits on.
     * - `"left"` (default): placed at the start of the flex row.
     * - `"right"`: pushed to the end of the flex row.
     * @default "left"
     */
    align?: NavbarGroupAlign;
    children?: React.ReactNode;
    className?: string;
}

/**
 * Flex container that occupies one side of the Navbar.
 *
 * Using two NavbarGroups (one left, one right) inside a Navbar automatically
 * distributes them across the bar via `justify-content: space-between`.
 */
export const NavbarGroup = forwardRef<HTMLDivElement, NavbarGroupProps>(function NavbarGroup(
    { align = "left", className, children, ...htmlProps },
    ref,
) {
    return (
        <div
            ref={ref}
            className={cn(
                // Flex: items vertically centered, full navbar height
                "flex items-center h-[50px]",
                // Gap between children (buttons, dividers, headings)
                "gap-1",
                // align="right": push to the end of the row. `ml-auto` honors the prop
                // independent of sibling count (the parent's justify-between only positions
                // the exact two-group case), so a lone right group lands on the right.
                align === "right" && "ml-auto",
                className,
            )}
            {...htmlProps}
        >
            {children}
        </div>
    );
});

// ---------------------------------------------------------------------------
// NavbarHeading
// ---------------------------------------------------------------------------

export interface NavbarHeadingProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
    className?: string;
}

/**
 * Application name / logo text in a Navbar.
 *
 * Blueprint spec: `font-size: 16px ($pt-font-size-large); margin-right: 16px ($navbar-padding)`.
 */
export const NavbarHeading = forwardRef<HTMLDivElement, NavbarHeadingProps>(function NavbarHeading(
    { className, children, ...htmlProps },
    ref,
) {
    return (
        <div
            ref={ref}
            className={cn(
                // font-size: $pt-font-size-large = 16px; font-weight inherits (normal, 400)
                // Blueprint's NavbarHeading has no explicit font-weight — inherits body weight.
                "text-body-lg text-foreground",
                // margin-right: 16px ($navbar-padding)
                "mr-4",
                className,
            )}
            {...htmlProps}
        >
            {children}
        </div>
    );
});

// ---------------------------------------------------------------------------
// NavbarDivider
// ---------------------------------------------------------------------------

export interface NavbarDividerProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
}

/**
 * Vertical separator line inside a Navbar.
 *
 * Blueprint spec:
 *   border-left: 1px solid rgba(black, 0.15)  [dark: rgba(white, 0.2)]
 *   height: 20px  (= $pt-navbar-height - $pt-spacing * 7.5 = 50 - 30)
 *   margin: 0 8px  (= 0 $pt-spacing * 2)
 *
 * Uses `--color-divider` (which swaps via `.dark`), matching the Divider component's approach.
 */
export const NavbarDivider = forwardRef<HTMLDivElement, NavbarDividerProps>(function NavbarDivider(
    { className, ...htmlProps },
    ref,
) {
    return (
        <div
            ref={ref}
            className={cn(
                // Vertical bar: border-left only
                "border-l border-divider dark:border-divider",
                // Height: 20px; margin: 0 8px
                "h-5 mx-2",
                // No width
                "w-0",
                className,
            )}
            {...htmlProps}
        />
    );
});
