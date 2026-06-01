import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, useMemo } from "react";

import { cn } from "@/lib/utils";
import { ButtonGroupContext, type ButtonSize, type ButtonVariant } from "./button";

/**
 * Layout/segmentation wrapper for a row (or column) of `<Button>`s. Collapses the
 * inner radii and overlapping borders so the buttons read as one attached control,
 * and stacks the hovered/active/focused button above its neighbors so its border or
 * shadow isn't clipped — matching Blueprint's `ButtonGroup`.
 *
 * `variant` and `size` set here flow down to child `<Button>`s via `ButtonGroupContext`
 * (a button's own explicit prop still wins), so `<ButtonGroup variant="outlined">`
 * styles the whole set in one place.
 *
 * Border-collapse is keyed off `variant`:
 *  - `solid`    — overlap the 1px shadow edges with a negative margin.
 *  - `outlined` — drop the shared inner border instead (avoids a doubled 2px rule).
 *  - `minimal`  — no collapse; minimal buttons have no border/shadow to merge.
 *
 * Targets direct `<button>` children. Buttons wrapped in a Popover/Tooltip trigger
 * are not collapsed in this version — render the trigger button as a direct child.
 */
const buttonGroupVariants = cva(
    [
        // Hovered/active/focused button draws above its neighbors so its edge isn't clipped.
        "[&>button]:relative",
        "[&>button:focus-visible]:z-10",
        "[&>button:hover]:z-20",
        "[&>button:active]:z-30 [&>button[data-active=true]]:z-30",
    ],
    {
        variants: {
            variant: { solid: "", outlined: "", minimal: "" },
            vertical: { true: "", false: "" },
            fill: { true: "", false: "" },
        },
        compoundVariants: [
            // ---- Layout (display + direction). Exactly one display class per combo so
            // `inline-flex`/`flex` never collide (CSS source order, not class order, decides). ----
            { vertical: false, fill: false, class: "inline-flex flex-row" },
            { vertical: false, fill: true, class: "flex w-full flex-row [&>button]:flex-1" },
            { vertical: true, fill: false, class: "inline-flex flex-col items-stretch [&>button]:w-full" },
            {
                vertical: true,
                fill: true,
                class: "flex h-full w-auto flex-col items-stretch [&>button]:w-full [&>button]:flex-1",
            },

            // ---- Horizontal border-collapse ----
            {
                vertical: false,
                variant: "solid",
                class: "[&>button:not(:first-child)]:rounded-l-none [&>button:not(:last-child)]:rounded-r-none [&>button:not(:last-child)]:-mr-px",
            },
            {
                vertical: false,
                variant: "outlined",
                class: "[&>button:not(:first-child)]:rounded-l-none [&>button:not(:last-child)]:rounded-r-none [&>button:not(:last-child)]:border-r-0",
            },

            // ---- Vertical border-collapse ----
            {
                vertical: true,
                variant: "solid",
                class: "[&>button:not(:first-child)]:rounded-t-none [&>button:not(:last-child)]:rounded-b-none [&>button:not(:last-child)]:-mb-px",
            },
            {
                vertical: true,
                variant: "outlined",
                class: "[&>button:not(:first-child)]:rounded-t-none [&>button:not(:last-child)]:rounded-b-none [&>button:not(:last-child)]:border-b-0",
            },
        ],
        defaultVariants: { variant: "solid", vertical: false, fill: false },
    },
);

export interface ButtonGroupProps
    extends Omit<React.HTMLAttributes<HTMLDivElement>, "color">,
        VariantProps<typeof buttonGroupVariants> {
    /** Visual style applied to child buttons (overridable per button). @default "solid" */
    variant?: ButtonVariant;
    /** Size applied to child buttons (overridable per button). */
    size?: ButtonSize;
    /** Stretch the group to fill its container; child buttons grow to share the space. */
    fill?: boolean;
    /** Stack buttons vertically instead of in a row. */
    vertical?: boolean;
    children: React.ReactNode;
}

export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(function ButtonGroup(
    { className, variant = "solid", size, fill = false, vertical = false, children, ...props },
    ref,
) {
    const groupContext = useMemo(() => ({ variant, size }), [variant, size]);

    return (
        <ButtonGroupContext.Provider value={groupContext}>
            <div
                ref={ref}
                role="group"
                className={cn(buttonGroupVariants({ variant, vertical, fill }), className)}
                {...props}
            >
                {children}
            </div>
        </ButtonGroupContext.Provider>
    );
});
