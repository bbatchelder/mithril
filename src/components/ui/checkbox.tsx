/**
 * Checkbox — pixel-faithful Blueprint v6.15 reimplementation.
 *
 * Blueprint spec (from _controls.scss):
 *   - Indicator: 16px default / 20px large; border-radius = 4px ($pt-border-radius)
 *   - Unchecked: background transparent; box-shadow inset 0 0 0 1px $gray2 (#738091 light / #8f99a8 dark)
 *   - Checked: background blue-3 (#2d72d2); box-shadow inset 0 0 0 1px rgba(black,0.2)
 *              dark: box-shadow inset 0 0 0 1px rgba(white,0.1)
 *   - Checked icon: "small-tick" SVG rendered white inside the indicator
 *   - Indeterminate: same checked background; "small-minus" icon instead of tick
 *   - Hover (unchecked): background rgba(gray-3, 0.15)
 *   - Hover (checked): background blue-2 (#215db0)
 *   - Active (unchecked): background rgba(gray-3, 0.30)
 *   - Active (checked): background blue-1 (#184a90)
 *   - Disabled unchecked: bg rgba(gray-3, 0.15), no box-shadow
 *   - Disabled checked: bg rgba(blue-3, 0.5), no box-shadow, icon opacity 0.5
 *
 * DOM mirrors Blueprint:
 *   <label> (cursor-pointer, relative, padding-inline-start for indicator gap)
 *     <input type="checkbox" /> (absolute, opacity-0, z-index -1 — hidden but accessible)
 *     <span .indicator />   (the styled box — sibling of input so CSS peer selectors work)
 *     {label text}
 *   </label>
 *
 * Shared control-base.tsx exports the ControlBase primitive for Radio/Switch reuse.
 *
 * ICON VISIBILITY STRATEGY:
 *   The tick/dash icons sit INSIDE the indicator span. `peer-*` Tailwind variants only work
 *   on SIBLINGS of the peer input, not on descendants. To control icon visibility from the
 *   input's checked/indeterminate state, we:
 *     1. Track checked state in React (works for controlled + uncontrolled via onChange).
 *     2. Pass `data-checked` / `data-indeterminate` attributes to the indicator.
 *     3. Use `data-[checked]:opacity-100` Tailwind variants on the icon children.
 *   This is reliable, avoids arbitrary CSS, and keeps Tailwind's tree-shaking happy.
 */

import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./icon";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
    /** Visible label rendered next to the indicator. */
    label?: React.ReactNode;
    /**
     * Indeterminate state — shows a horizontal dash instead of a tick.
     * Sets the native `input.indeterminate` DOM property via ref.
     */
    indeterminate?: boolean;
    /** Large variant: 20px indicator, 16px font. */
    large?: boolean;
    /** Renders inline-block instead of block. */
    inline?: boolean;
    /** Position the indicator on the right side. @default "left" */
    alignIndicator?: "left" | "right";
    /**
     * Additional props spread onto the indicator `<span>` element.
     * Use this to attach `data-compare` for the comparison harness:
     *   `indicatorProps={{ "data-compare": "cb-checked" }}`
     */
    indicatorProps?: React.HTMLAttributes<HTMLSpanElement>;
}

/**
 * Checkbox with Blueprint v6.15 visual fidelity.
 *
 * The ref is forwarded to the native `<input type="checkbox">`.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
    { label, indeterminate, large, inline, alignIndicator = "left", disabled, className, onChange, indicatorProps, ...inputProps },
    ref,
) {
    const innerRef = useRef<HTMLInputElement | null>(null);

    // Track internal checked state to drive icon visibility.
    // Starts from defaultChecked (uncontrolled) or checked (controlled).
    // For controlled mode, inputProps.checked drives the visual.
    const isControlled = inputProps.checked !== undefined;
    const [internalChecked, setInternalChecked] = useState<boolean>(
        () => !!(inputProps.checked ?? inputProps.defaultChecked),
    );
    // The effective checked state for rendering:
    const effectiveChecked = isControlled ? !!(inputProps.checked) : internalChecked;

    // Sync controlled value changes.
    useEffect(() => {
        if (isControlled) {
            setInternalChecked(!!(inputProps.checked));
        }
    }, [inputProps.checked, isControlled]);

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (!isControlled) {
                setInternalChecked(e.target.checked);
            }
            onChange?.(e);
        },
        [isControlled, onChange],
    );

    // Merge forwarded ref with internal ref (needed to set .indeterminate).
    function setRef(el: HTMLInputElement | null) {
        innerRef.current = el;
        if (typeof ref === "function") {
            ref(el);
        } else if (ref) {
            (ref as React.MutableRefObject<HTMLInputElement | null>).current = el;
        }
    }

    // Set/clear the indeterminate DOM property whenever the prop changes.
    useEffect(() => {
        if (innerRef.current) {
            innerRef.current.indeterminate = indeterminate ?? false;
        }
    }, [indeterminate]);

    const alignRight = alignIndicator === "right";
    const iconSize = large ? 20 : 16;
    // Effective checked state for data attribute driving (indeterminate visually behaves like checked)
    const isActive = effectiveChecked || !!indeterminate;

    return (
        <label
            className={cn(
                inline ? "inline-block" : "block",
                disabled ? "cursor-not-allowed" : "cursor-pointer",
                disabled ? "text-foreground-disabled" : "text-foreground",
                large ? "text-body-lg" : "text-body",
                // Leading padding: indicatorSize + 8px spacing
                // Default: 16 + 8 = 24px (pl-6); Large: 20 + 8 = 28px (pl-7)
                !alignRight && (large ? "pl-7" : "pl-6"),
                alignRight && (large ? "pr-7" : "pr-6"),
                "relative select-none",
                // `group` enables group-hover / group-active on the indicator (label is the hover target)
                "group",
                className,
            )}
        >
            {/* Native input: visually hidden but accessible.
                Blueprint: position absolute, opacity 0, z-index -1 (left/top 0).
                `peer` class enables peer-checked / peer-disabled selectors on the indicator. */}
            <input
                ref={setRef}
                type="checkbox"
                disabled={disabled}
                onChange={handleChange}
                {...inputProps}
                className={cn(
                    "peer absolute opacity-0 -z-10 top-0",
                    alignRight ? "right-0" : "left-0",
                )}
            />

            {/* Indicator: the styled checkbox box.
                Blueprint: font-size=indicatorSize; height/width=1em; border-radius=$pt-border-radius;
                margin-inline-start = -(indicatorSize + 8px) (negative margin pulls into leading gap);
                margin-inline-end = 8px (gap between indicator and label text);
                margin-top = -3px ($pt-spacing * -0.75) for vertical centering (left-aligned).
                Right-aligned: float right, margin-left = 8px, margin-top = 1px.

                Data attributes `data-checked` and `data-indeterminate` drive icon visibility
                (CSS peer can't reach descendants of the peer's siblings). */}
            <span
                data-checked={isActive ? "" : undefined}
                data-indeterminate={indeterminate ? "" : undefined}
                {...indicatorProps}
                className={cn(
                    "inline-block relative align-middle",
                    // Border radius: $pt-border-radius = 4px → rounded-bp
                    "rounded-bp",
                    // Size: explicit pixel widths/heights.
                    large ? "w-5 h-5" : "w-4 h-4",
                    // font-size = indicatorSize (Blueprint uses em-based sizing; we match the computed value
                    // so the harness captures the correct font-size on the indicator element).
                    large ? "text-[20px]" : "text-[16px]",
                    // color: Blueprint sets color: $white on the indicator when checked/indeterminate
                    // (for SVG fill inheritance via currentcolor). When disabled+checked, color is
                    // reduced to rgba($white, 0.6). Unchecked inherits body text.
                    isActive && !disabled ? "text-white" : "",
                    isActive && disabled ? "text-white/60" : "",
                    // Vertical offset (Blueprint: margin-top: -$pt-spacing * 0.75 = -3px for left-aligned,
                    // both default and large size).
                    !alignRight && "-mt-[3px]",
                    // Right-aligned: margin-top: 1px (Blueprint .bp6-align-right .bp6-control-indicator)
                    alignRight && "mt-px float-right",
                    // Horizontal: negative margin-inline-start to pull indicator into the leading gap.
                    // Default: -(16+8) = -24px = -ml-6; Large: -(20+8) = -28px = -ml-7.
                    // margin-inline-end = 8px (= mr-2) separates indicator from label text.
                    !alignRight && (large ? "-ml-7 mr-2" : "-ml-6 mr-2"),
                    // Right-aligned: margin-left = 8px (= ml-2)
                    alignRight && "ml-2",
                    // Inline-flex centering for icon children. MUST be inline-flex, not flex:
                    // a block-level flex breaks the label's inline flow and drops the text to
                    // the next line. inline-flex keeps the indicator inline AND wins the
                    // display-utility merge over the `inline-block` above (tailwind-merge keeps last).
                    "inline-flex items-center justify-center",

                    // === UNCHECKED resting ===
                    // Background: transparent
                    "bg-transparent",
                    // box-shadow: inset 0 0 0 1px $gray2/#738091 (light), gray3/#8f99a8 (dark)
                    "shadow-[inset_0_0_0_1px_#738091] dark:shadow-[inset_0_0_0_1px_#8f99a8]",

                    // === HOVER (unchecked): group-hover drives from label ===
                    // $minimal-button-background-color-hover = rgba($gray3, 0.15) = rgba(143,153,168,0.15)
                    !disabled && !isActive && "group-hover:bg-[rgba(143,153,168,0.15)]",
                    // === ACTIVE (unchecked): rgba($gray3, 0.30) = rgba(143,153,168,0.30) ===
                    !disabled && !isActive && "group-active:bg-[rgba(143,153,168,0.30)]",

                    // === CHECKED / INDETERMINATE ===
                    // Background: primary (blue-3 = #2d72d2)
                    isActive && "bg-primary",
                    // Shadow: inset 0 0 0 1px rgba($black, 0.2) — $black = #111418 = rgb(17,20,24)
                    // dark: rgba($white, 0.1)
                    isActive && "shadow-[inset_0_0_0_1px_rgba(17,20,24,0.2)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]",
                    // Hover (checked): blue-2 = #215db0; Active (checked): blue-1 = #184a90
                    isActive && !disabled && "group-hover:bg-primary-hover group-active:bg-primary-active",

                    // === DISABLED ===
                    // Unchecked disabled: bg = hover bg, no shadow (light AND dark — override dark shadow too)
                    disabled && !isActive && "bg-[rgba(143,153,168,0.15)] shadow-none dark:shadow-none cursor-not-allowed",
                    // Checked/indeterminate disabled: bg = rgba(blue-3, 0.5) = rgba(45,114,210,0.5), no shadow
                    disabled && isActive && "bg-[rgba(45,114,210,0.5)] shadow-none dark:shadow-none cursor-not-allowed",
                    // indicatorProps.className is merged LAST so callers (e.g. ControlCard) can
                    // override indicator margins/positioning without fighting specificity.
                    // (indicatorProps is spread above for non-className attrs; className is folded
                    // here so tailwind-merge resolves conflicts correctly — last one wins.)
                    indicatorProps?.className,
                )}
            >
                {/* Tick icon — shown when checked (and not indeterminate) */}
                <Icon
                    icon="small-tick"
                    size={iconSize}
                    aria-hidden="true"
                    className={cn(
                        "absolute inset-0 flex items-center justify-center",
                        // Show tick when checked but not indeterminate
                        effectiveChecked && !indeterminate ? "opacity-100" : "opacity-0",
                        // Disabled: icon opacity 0.5 (Blueprint: input:disabled ::before { opacity: 0.5 })
                        disabled && effectiveChecked && !indeterminate && "opacity-50",
                    )}
                    svgProps={{ className: "fill-white" }}
                />
                {/* Dash icon — shown when indeterminate */}
                <Icon
                    icon="small-minus"
                    size={iconSize}
                    aria-hidden="true"
                    className={cn(
                        "absolute inset-0 flex items-center justify-center",
                        indeterminate ? "opacity-100" : "opacity-0",
                        // Disabled: icon opacity 0.5
                        disabled && indeterminate && "opacity-50",
                    )}
                    svgProps={{ className: "fill-white" }}
                />
            </span>

            {label}
        </label>
    );
});
