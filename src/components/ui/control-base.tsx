/**
 * Shared Control primitive for Checkbox, Radio, and Switch.
 *
 * Blueprint renders all three with identical DOM structure:
 *   <label class="bp6-control bp6-{checkbox|radio|switch} [modifiers]">
 *     <input class="bp6-control-input" type="{checkbox|radio}" />
 *     <span class="bp6-control-indicator" />
 *     {label text}
 *   </label>
 *
 * This module exports that structure as a headless primitive. Each concrete
 * component (Checkbox, Radio, Switch) renders its own indicator content into
 * the `indicator` slot and supplies its own `type` and root classes.
 *
 * Sizing (from Blueprint `_controls.scss`):
 *   - $pt-icon-size-standard = 16px (indicator width/height, default)
 *   - $pt-icon-size-large    = 20px (indicator width/height, large)
 *   - $control-indicator-spacing = $pt-spacing * 2 = 8px
 *   - padding-inline-start = indicatorSize + spacing = 24px (default) / 28px (large)
 *   - indicator margin-inline-start = -padding-inline-start (so it fills the leading gap)
 *   - indicator margin-inline-end = spacing (8px gap before label text)
 */

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ControlBaseProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
    /** The visible label rendered next to the indicator. */
    label?: React.ReactNode;
    /** Native input type — "checkbox" or "radio". */
    type: "checkbox" | "radio";
    /** Large variant: indicator 20px, font 16px. Default = 16px indicator, 14px font. */
    large?: boolean;
    /** Renders inline (display: inline-block) instead of block. */
    inline?: boolean;
    /** Positions the indicator on the right side of the label text. */
    alignIndicator?: "left" | "right";
    /** Extra class applied to the outer <label> element. */
    className?: string;
    /** Extra class applied to the `.bp6-control-indicator` span. */
    indicatorClassName?: string;
    /** Content rendered inside the indicator (the check/dash/radio dot/toggle). */
    indicator?: React.ReactNode;
    /** Forwarded ref → <input> element (from the parent forwardRef). */
    inputRef?: React.RefObject<HTMLInputElement | null>;
}

/**
 * Headless control label + hidden input + indicator.
 *
 * Reused by Checkbox, Radio, and Switch — each passes its own indicator
 * content and indicator class name. The input ref is forwarded by each
 * component via `inputRef`.
 */
export const ControlBase = forwardRef<HTMLLabelElement, ControlBaseProps>(function ControlBase(
    {
        label,
        type,
        large,
        inline,
        alignIndicator = "left",
        className,
        indicatorClassName,
        indicator,
        inputRef,
        disabled,
        ...inputProps
    },
    ref,
) {
    const alignRight = alignIndicator === "right";

    return (
        <label
            ref={ref}
            className={cn(
                // Block or inline
                inline ? "inline-block" : "block",
                // Cursor
                disabled ? "cursor-not-allowed" : "cursor-pointer",
                // Disabled text color
                disabled ? "text-foreground-disabled" : "text-foreground",
                // Default font
                large ? "text-body-lg" : "text-body",
                // Leading padding so the indicator can slot into the gap.
                // default: 16px indicator + 8px spacing = 24px (= pl-6)
                // large:   20px indicator + 8px spacing = 28px (= pl-7)
                !alignRight && (large ? "pl-7" : "pl-6"),
                alignRight && (large ? "pr-7" : "pr-6"),
                // Relative positioning so the hidden input can be absolute.
                "relative select-none",
                className,
            )}
        >
            {/* Native input: visually hidden but accessible. Positioned absolute at
                the top-left/right, opacity 0, z-index -1 (same as Blueprint) so it
                doesn't intercept pointer events. NOT display:none — screen readers
                must be able to focus it. */}
            <input
                ref={inputRef}
                type={type}
                disabled={disabled}
                {...inputProps}
                className={cn(
                    "absolute opacity-0 -z-10",
                    alignRight ? "right-0" : "left-0",
                    "top-0",
                )}
            />

            {/* The styled indicator box. Blueprint: display:inline-block,
                font-size = indicatorSize (em-based sizing), height/width = 1em.
                margin-inline-start = -(padding-inline-start) so it occupies the gap.
                margin-inline-end = 8px so there's a gap before the label text.
                margin-top = -3px (= $pt-spacing * -0.75) to vertically center with
                the 14px line-height text. */}
            <span
                className={cn(
                    "inline-block align-middle relative select-none",
                    // Width and height via explicit pixel sizes (indicator size).
                    large ? "w-5 h-5" : "w-4 h-4",
                    // Vertical alignment: Blueprint uses margin-top: -3px for left,
                    // and margin-top: 1px for right-aligned (different offset).
                    !alignRight && (large ? "-mt-0.5" : "-mt-[3px]"),
                    alignRight && "mt-px",
                    // Horizontal alignment: negative margin pulls indicator into the leading padding gap.
                    // left-aligned: margin-inline-start = -24px (med) / -28px (large), margin-inline-end = 8px
                    // right-aligned: float right, margin-left = 8px (Blueprint uses margin-left not margin-inline-end)
                    !alignRight && (large ? "-ml-7 mr-2" : "-ml-6 mr-2"),
                    alignRight && "float-right ml-2",
                    indicatorClassName,
                )}
            >
                {indicator}
            </span>

            {label}
        </label>
    );
});
