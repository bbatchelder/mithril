import { cva, type VariantProps } from "class-variance-authority";
import { createElement, forwardRef } from "react";

import { cn } from "@/lib/utils";

/**
 * Divider component — pixel-faithful reimplementation of Blueprint's `bp6-divider`.
 *
 * Blueprint spec (`packages/core/src/components/divider/_divider.scss`):
 *   border-bottom: 1px solid rgba(black, 0.15)   [light; dark: rgba(white, 0.2)]
 *   border-right:  1px solid <same>               [empty element: context determines visible side]
 *   margin: 4px  ($pt-spacing = 4px)               [compact: 0]
 *
 * The element is intentionally EMPTY. In a flex-column container the bottom border
 * renders as a horizontal rule; in a flex-row container the right border renders as
 * a vertical bar. Place `data-compare` on the divider element itself.
 *
 * Design decisions:
 *   - `compact` prop (bool): margin 0. Same name as Blueprint.
 *   - `as` / `tagName`: polymorphic element (default `div`). `as` takes precedence.
 *   - CVA + forwardRef pattern matches the other components in this library.
 *   - Dark-mode border-color: `dark:border-divider` re-evaluates the `--color-divider`
 *     semantic token inside `.dark`, which swaps from rgba(black,0.15) → rgba(white,0.2).
 *     Since `.dark` is on a child div (not html/body), we must use the `dark:` variant.
 *
 * @see https://blueprintjs.com/docs/#core/components/divider
 */
export const dividerVariants = cva(
    [
        // Both borders always present; the visible one depends on the parent's flex direction.
        // `border-divider` resolves to `--color-divider` which swaps per theme via `@theme inline`.
        // `dark:border-divider` ensures the dark-theme swap applies when `.dark` is an ancestor.
        "border-b border-r border-divider dark:border-divider",
        // Tailwind v4 preflight resets margin — set it back explicitly as a literal class.
        // Blueprint uses $pt-spacing = 4px (NOT 10px; see _variables.scss: $pt-spacing: 4px).
        // `m-1` = 4px in Tailwind v4's default spacing scale (1 × 4px base unit).
    ],
    {
        variants: {
            compact: {
                true: "m-0",
                false: "m-1",
            },
        },
        defaultVariants: { compact: false },
    },
);

export interface DividerProps
    extends React.HTMLAttributes<HTMLElement>,
        Omit<VariantProps<typeof dividerVariants>, "compact"> {
    /**
     * When true, removes the 10px margin so the divider sits flush with adjacent content.
     * @default false
     */
    compact?: boolean;

    /**
     * Override the rendered HTML element.
     * @default "div"
     */
    as?: keyof React.JSX.IntrinsicElements;

    /**
     * Alias for `as` (Blueprint API compat). `as` takes precedence if both are provided.
     * @default "div"
     */
    tagName?: keyof React.JSX.IntrinsicElements;
}

/**
 * Thin separator line that reads as a horizontal rule (in flex-column containers)
 * or a vertical bar (in flex-row containers) depending on which border becomes visible.
 *
 * ```tsx
 * // Horizontal (stacked content)
 * <div className="flex flex-col">
 *   <p>Above</p>
 *   <Divider />
 *   <p>Below</p>
 * </div>
 *
 * // Vertical (inline items)
 * <div className="flex flex-row items-stretch">
 *   <span>Left</span>
 *   <Divider />
 *   <span>Right</span>
 * </div>
 *
 * // Compact (no margin)
 * <Divider compact />
 * ```
 */
export const Divider = forwardRef<HTMLElement, DividerProps>(function Divider(
    { compact = false, as, tagName, className, ...htmlProps },
    ref,
) {
    const tag = as ?? tagName ?? "div";

    return createElement(tag, {
        ...htmlProps,
        ref,
        className: cn(dividerVariants({ compact }), className),
    });
});
