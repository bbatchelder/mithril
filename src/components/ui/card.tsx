import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";

import { cn } from "@/lib/utils";

export type CardElevation = 0 | 1 | 2 | 3 | 4;

/**
 * Resting drop-shadow per elevation. Written as literal class strings (not
 * `shadow-card-${n}`) so Tailwind's scanner emits each one.
 */
const ELEVATION_SHADOW: Record<CardElevation, string> = {
    0: "shadow-card-0",
    1: "shadow-card-1",
    2: "shadow-card-2",
    3: "shadow-card-3",
    4: "shadow-card-4",
};

export const cardVariants = cva(
    [
        "rounded-mithril bg-surface text-foreground",
        // Blueprint animates transform + box-shadow over 2× the base duration.
        "transition-[box-shadow,transform] duration-200 ease-mithril",
    ],
    {
        variants: {
            compact: { true: "p-4", false: "p-5" },
            interactive: { true: "cursor-pointer", false: "" },
        },
        defaultVariants: { compact: false, interactive: false },
    },
);

export interface CardProps
    extends React.HTMLAttributes<HTMLDivElement>,
        Omit<VariantProps<typeof cardVariants>, "compact" | "interactive"> {
    /** Drop-shadow depth (0–4). Higher renders a stronger shadow. @default 0 */
    elevation?: CardElevation;
    /** Raise elevation on hover and show a pointer cursor — pair with `onClick`. */
    interactive?: boolean;
    /** Render a primary selection ring (overrides the resting/hover shadow). */
    selected?: boolean;
    /** Reduce padding from 20px to 16px. */
    compact?: boolean;
}

/**
 * Surface container with Blueprint's elevation, interactive, and selected states.
 *
 * @see https://blueprintjs.com/docs/#core/components/card
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
    { className, elevation = 0, interactive = false, selected = false, compact = false, ...props },
    ref,
) {
    // Exactly one resting shadow class — no two `shadow-*` utilities collide, so
    // there's nothing for tailwind-merge to (mis)resolve. Interactive hover/active
    // use pseudo-class variants, which out-specify the resting shadow; a selected
    // card keeps its ring through hover/active (Blueprint's precedence).
    const shadow = selected ? "shadow-card-selected" : ELEVATION_SHADOW[elevation];
    const interactiveShadow =
        interactive && !selected ? "hover:shadow-card-3 active:shadow-card-1" : "";

    return (
        <div
            ref={ref}
            data-selected={selected || undefined}
            className={cn(cardVariants({ interactive, compact }), shadow, interactiveShadow, className)}
            {...props}
        />
    );
});
