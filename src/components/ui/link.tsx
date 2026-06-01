import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Link component — pixel-faithful Blueprint Link with a clean modern API.
 *
 * Blueprint spec (`_link.scss`, `_typography.scss`, `link.tsx`):
 *
 *   .bp6-link:
 *     cursor: pointer
 *     display: inline-flex
 *     gap: $pt-spacing = 4px
 *     text-underline-offset: 17.5%
 *     text-underline-position: from-font
 *
 *   Underline variants:
 *     "always" (.bp6-link-underline-always): text-decoration-line: underline  [default]
 *     "hover"  (.bp6-link-underline-hover):  none at rest, underline on :hover
 *     "none"   (.bp6-link-underline-none):   none always
 *
 *   Color variants — exact palette values from Blueprint SCSS:
 *     "primary"  (.bp6-intent-primary):
 *         light: $blue2   = #215db0 = rgb(33,93,176)
 *         dark:  $blue5   = #8abbff = rgb(138,187,255)
 *     "success"  (.bp6-intent-success):
 *         light: $green2  = #1c6e42 = rgb(28,110,66)
 *         dark:  $green5  = #72ca9b = rgb(114,202,155)
 *     "warning"  (.bp6-intent-warning):
 *         light: $orange2 = #935610 = rgb(147,86,16)
 *         dark:  $orange5 = #fbb360 = rgb(251,179,96)
 *     "danger"   (.bp6-intent-danger):
 *         light: $red2    = #ac2f33 = rgb(172,47,51)
 *         dark:  $red5    = #fa999c = rgb(250,153,156)
 *     "inherit"  (.bp6-link-color-inherit): color: inherit
 *
 * The default color is "primary" (same as Blueprint's default intent).
 *
 * @see https://blueprintjs.com/docs/#core/components/link
 */

const linkVariants = cva(
    // Base: inline-flex, 4px gap, pointer cursor, underline positioning
    "cursor-pointer inline-flex gap-[4px] [text-underline-offset:17.5%] [text-underline-position:from-font]",
    {
        variants: {
            /**
             * When/how underline is shown.
             * @default "always"
             */
            underline: {
                /** Underline always visible. Blueprint default. */
                always: "underline",
                /** Underline shown only on hover. */
                hover: "no-underline hover:underline",
                /** No underline, even on hover. */
                none: "no-underline hover:no-underline",
            },
            /**
             * Link color — intent-based or inherited.
             * @default "primary"
             *
             * Colors use the canonical intent-text token (--intent-*-text =
             * Blueprint $pt-intent-text-colors: tier-2 light / tier-5 dark), so links
             * re-tint with the theme. (The color-mix variant is --intent-*-minimal-text,
             * used by buttons.)
             */
            color: {
                /** Intent primary: tier-2 (#215db0) light / tier-5 (#8abbff) dark. */
                primary: "text-intent-primary-text",
                /** Intent success: tier-2 (#1c6e42) light / tier-5 (#72ca9b) dark. */
                success: "text-intent-success-text",
                /** Intent warning: tier-2 (#935610) light / tier-5 (#fbb360) dark. */
                warning: "text-intent-warning-text",
                /** Intent danger: tier-2 (#ac2f33) light / tier-5 (#fa999c) dark. */
                danger: "text-intent-danger-text",
                /** Inherits color from surrounding text. */
                inherit: "text-inherit",
            },
        },
        defaultVariants: {
            underline: "always",
            color: "primary",
        },
    },
);

type LinkVariantProps = VariantProps<typeof linkVariants>;

export interface LinkProps
    extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "color">,
        LinkVariantProps {
    /** Link content. */
    children?: React.ReactNode;
}

/**
 * Link — inline anchor styled to Blueprint's Link component spec.
 *
 * Quick reference:
 *   <Link href="#">Default (primary color, always underlined)</Link>
 *   <Link href="#" underline="hover">Underline on hover only</Link>
 *   <Link href="#" underline="none">No underline</Link>
 *   <Link href="#" color="success">Success intent color</Link>
 *   <Link href="#" color="inherit">Inherits surrounding text color</Link>
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
    { underline, color, className, children, ...htmlProps },
    ref,
) {
    return (
        <a
            {...htmlProps}
            ref={ref}
            className={cn(linkVariants({ underline, color }), className)}
        >
            {children}
        </a>
    );
});
