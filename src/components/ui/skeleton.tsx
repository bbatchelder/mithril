import { createElement, forwardRef } from "react";

import { cn } from "@/lib/utils";

/**
 * Skeleton component — pixel-faithful reimplementation of Blueprint's `bp6-skeleton` modifier.
 *
 * Blueprint spec (`skeleton/_skeleton.scss`, `skeleton/_common.scss`):
 *   animation: 1s linear infinite alternate skeleton-glow (= $pt-transition-duration*10)
 *   @keyframes skeleton-glow: from { background/border-color: <start> } to { background/border-color: <end> }
 *   background: <start>  (base, non-animated value)
 *   background-clip: padding-box !important
 *   border-color: <start> !important
 *   border-radius: 2px  (= $pt-spacing * 0.5 = 4px * 0.5)
 *   box-shadow: none !important
 *   color: transparent !important
 *   cursor: default; pointer-events: none; user-select: none
 *   &::before, &::after, * { visibility: hidden !important }
 *
 * Blueprint skeleton colors (same in light and dark — no dark SCSS overrides found):
 *   $skeleton-color-start = rgba($light-gray1, 0.2) = rgba(211, 216, 222, 0.2)  (#d3d8de @ 20%)
 *   $skeleton-color-end   = rgba($gray1, 0.2)       = rgba(95, 107, 124, 0.2)   (#5f6b7c @ 20%)
 *
 * Color values used as literal arbitrary-value Tailwind classes (NOT runtime var() refs):
 *   start bg/border → bg-[rgba(211,216,222,0.2)] / border-[rgba(211,216,222,0.2)]
 *   (Animation keyframes in globals.css handle the start→end transition)
 *
 * IMPORTANT — Tailwind v4 tree-shakes @theme tokens that are only accessed via
 * runtime var() in inline styles. All colors use LITERAL arbitrary-value classes
 * so they are always emitted.
 *
 * @see https://blueprintjs.com/docs/#core/components/skeleton
 */

export interface SkeletonProps extends React.HTMLAttributes<HTMLElement> {
    /**
     * Override the rendered HTML tag.
     * @default "div"
     */
    as?: keyof React.JSX.IntrinsicElements;

    /**
     * Alias for `as`. `as` takes precedence if both are provided.
     * @default "div"
     */
    tagName?: keyof React.JSX.IntrinsicElements;

    /**
     * Whether to show the skeleton glow animation.
     * Set to false to freeze the background at the start color (useful for
     * comparison harness specimens where animated background is non-deterministic).
     * @default true
     */
    animate?: boolean;
}

/**
 * Standalone skeleton placeholder. Size it with `className` (e.g. `h-4 w-32`).
 *
 * ```tsx
 * // Standalone placeholder
 * <Skeleton className="h-4 w-32" />
 * <Skeleton className="h-10 w-10 rounded-full" />  // circle avatar
 *
 * // Animation off (for testing/harness)
 * <Skeleton className="h-4 w-32" animate={false} />
 * ```
 *
 * To skeletonize an existing element (Blueprint modifier pattern), apply the
 * exported `skeletonClass` string directly:
 *
 * ```tsx
 * import { skeletonClass } from "@/components/ui/skeleton";
 * <h5 className={cn(Classes.HEADING, skeletonClass)}>Card heading</h5>
 * ```
 */

/**
 * The CSS class string that applies Blueprint's exact skeleton modifier styles.
 * Consumers can apply this directly to any element to skeletonize it, replicating
 * Blueprint's `.bp6-skeleton` modifier pattern:
 *
 *   <p className={skeletonClass}>text occupies space but is invisible</p>
 */
export const skeletonClass = [
    // Glow animation: 1s linear infinite alternate skeleton-glow
    // (defined in globals.css — animation disabled via animate=false)
    "[animation:bp-skeleton-glow_1s_linear_infinite_alternate]",
    // Base background color (= skeleton-color-start; animation keyframes add the glow)
    // rgba(light-gray1, 0.2) = rgba(211, 216, 222, 0.2)
    "bg-[rgba(211,216,222,0.2)]",
    // background-clip: padding-box
    "[background-clip:padding-box]",
    // border-color: skeleton-color-start !important
    "border-[rgba(211,216,222,0.2)]",
    // border-radius: 2px (= $pt-spacing * 0.5)
    "rounded-[2px]",
    // box-shadow: none !important
    "shadow-none",
    // color: transparent !important
    "text-transparent",
    // cursor/pointer/select
    "cursor-default pointer-events-none select-none",
    // children and pseudo-elements hidden
    "[&::before]:invisible [&::after]:invisible [&_*]:invisible",
].join(" ");

export const Skeleton = forwardRef<HTMLElement, SkeletonProps>(function Skeleton(
    { as, tagName, animate = true, className, ...htmlProps },
    ref,
) {
    const tag = as ?? tagName ?? "div";

    return createElement(tag, {
        ref,
        className: cn(
            skeletonClass,
            // Override animation to none when animate=false (harness/testing)
            !animate && "[animation:none]",
            className,
        ),
        ...htmlProps,
    });
});
