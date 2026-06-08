"use client";

import { forwardRef, useCallback, useRef, useState } from "react";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";
import type { Intent } from "@/lib/types";
import { buttonVariants, type ButtonSize } from "@/components/ui/button";
import { resolveIcon, type IconProp } from "@/components/ui/icon";

export type SegmentedControlIntent = Extract<Intent, "none" | "primary">;

export interface SegmentedControlOption {
    /** Display label for the segment. */
    label: string;
    /** Value associated with this segment. */
    value: string;
    /** Whether this specific segment is disabled. */
    disabled?: boolean;
    /** Optional icon rendered before the label. An icon-name string (e.g. `"list"`) or a custom element. */
    icon?: IconProp;
}

export interface SegmentedControlProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
    /** List of segments. */
    options: SegmentedControlOption[];
    /** Controlled selected value. */
    value?: string;
    /** Uncontrolled default selected value. */
    defaultValue?: string;
    /** Called when the user selects a segment. */
    onValueChange?: (value: string) => void;
    /**
     * Visual intent applied to the selected segment.
     * "none" → white (light) / dark-gray-5 (dark) raised look.
     * "primary" → primary blue fill.
     * @default "none"
     */
    intent?: SegmentedControlIntent;
    /**
     * Segment size — controls button height (24 / 30 / 40px).
     * @default "medium"
     */
    size?: ButtonSize;
    /**
     * @deprecated Use size="large" instead.
     */
    large?: boolean;
    /**
     * @deprecated Use size="small" instead.
     */
    small?: boolean;
    /** Expand track to fill container width; each segment grows equally. */
    fill?: boolean;
    /** Render as an inline element. */
    inline?: boolean;
    /** Disable all segments. */
    disabled?: boolean;
    /** ARIA role for the container. @default "radiogroup" */
    role?: "radiogroup" | "group" | "toolbar" | "menu";
}

/**
 * The track container: light-gray5 bg (light) / dark-gray2 (dark), 2px padding+gap, 4px radius.
 * inline and fill are layout variants; the rest are modifiers.
 */
const trackVariants = cva(
    // Base: display flex, gap 2px = 0.5, padding 2px = 0.5, rounded-mithril = 4px
    // NOTE: do NOT pin the track's min-width to quiet the harness sc-default flag. min-width:auto
    // resolves per-specimen (flex-item-ness depends on each gallery container), so Blueprint's
    // track computes 0px in one specimen and auto in others — forcing a value is whack-a-mole.
    "flex gap-0.5 p-0.5 rounded-mithril bg-light-gray-5 dark:bg-dark-gray-2",
    {
        variants: {
            inline: { true: "inline-flex", false: "flex" },
            fill: { true: "w-full", false: "" },
        },
        defaultVariants: { inline: false, fill: false },
    },
);

/**
 * Selected segment backgrounds by intent:
 * - none:    white (light) / dark-gray5 (dark) — the "raised" look
 * - primary: primary blue fill (same both themes)
 *
 * These are literal class strings (no runtime var()) so Tailwind emits them.
 */
const SELECTED_BG: Record<SegmentedControlIntent, string> = {
    none: "bg-white dark:bg-dark-gray-5",
    primary: "bg-primary hover:bg-primary-hover active:bg-primary-active text-primary-foreground",
};

/**
 * Selected segment text color by intent:
 * - none:    foreground (normal text, overrides minimal's muted)
 * - primary: white — already included in SELECTED_BG above
 */
const SELECTED_TEXT: Record<SegmentedControlIntent, string> = {
    none: "text-foreground",
    primary: "", // already handled in SELECTED_BG
};

/**
 * SegmentedControl — a horizontal group of mutually exclusive options styled as minimal
 * Buttons on a light-gray5 track. The selected segment is "raised" (white bg in light /
 * dark-gray5 in dark for none-intent; primary fill for primary intent).
 *
 * Unselected segments: muted text color, transparent background (minimal variant).
 * Selected segments: raised appearance — white/dark-gray5 bg + normal foreground (none intent)
 *                     or primary fill + white text (primary intent).
 *
 * Uses Blueprint's minimal Button sizing classes for segment height (24/30/40px).
 *
 * @example
 * <SegmentedControl
 *   options={[
 *     { label: "Day", value: "day" },
 *     { label: "Week", value: "week" },
 *     { label: "Month", value: "month" },
 *   ]}
 *   defaultValue="week"
 *   onValueChange={(v) => console.log(v)}
 * />
 */
export const SegmentedControl = forwardRef<HTMLDivElement, SegmentedControlProps>(
    function SegmentedControl(
        {
            options,
            value: controlledValue,
            defaultValue,
            onValueChange,
            intent = "none",
            size: sizeProp,
            large,
            small,
            fill = false,
            inline = false,
            disabled: controlDisabled = false,
            role = "radiogroup",
            className,
            onKeyDown,
            ...htmlProps
        },
        ref,
    ) {
        // Resolve deprecated large/small into size
        const size: ButtonSize = sizeProp ?? (large ? "large" : small ? "small" : "medium");

        const [localValue, setLocalValue] = useState<string | undefined>(defaultValue);
        const selectedValue = controlledValue ?? localValue;

        const containerRef = useRef<HTMLDivElement>(null);

        const handleClick = useCallback(
            (value: string) => {
                setLocalValue(value);
                onValueChange?.(value);
            },
            [onValueChange],
        );

        // Arrow-key navigation for radiogroup / menu roles
        const handleKeyDown = useCallback(
            (e: React.KeyboardEvent<HTMLDivElement>) => {
                onKeyDown?.(e);
                if (role === "radiogroup" || role === "menu") {
                    const isLeft = e.key === "ArrowLeft" || e.key === "ArrowUp";
                    const isRight = e.key === "ArrowRight" || e.key === "ArrowDown";
                    if (!isLeft && !isRight) return;

                    const el = containerRef.current;
                    if (!el) return;

                    const buttons = Array.from(el.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"));
                    const focused = el.querySelector<HTMLButtonElement>(":focus");
                    const idx = focused ? buttons.indexOf(focused) : -1;
                    if (idx < 0) return;

                    e.preventDefault();
                    const next = (idx + (isRight ? 1 : -1) + buttons.length) % buttons.length;
                    buttons[next]?.click();
                    buttons[next]?.focus();
                }
            },
            [role, onKeyDown],
        );

        const isAnySelected = options.some((o) => o.value === selectedValue);

        // Compute ARIA button role for children
        const buttonRole: React.AriaRole | undefined =
            role === "radiogroup" ? "radio" : role === "menu" ? "menuitemradio" : undefined;

        return (
            <div
                {...htmlProps}
                ref={(node) => {
                    // merge refs
                    (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
                    if (typeof ref === "function") ref(node);
                    else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
                }}
                role={role}
                onKeyDown={handleKeyDown}
                className={cn(trackVariants({ inline, fill }), className)}
            >
                {options.map((option, idx) => {
                    const isSelected = selectedValue === option.value;
                    const isDisabled = controlDisabled || option.disabled;

                    // Segment base: always use button minimal sizing classes for height/padding/text
                    // Selected: add raised background + appropriate text color
                    // Unselected: transparent bg + muted text
                    // We don't use the Button component itself (can't easily override selected bg)
                    // Instead we compose button classes directly using buttonVariants + overrides.
                    const baseClasses = buttonVariants({
                        variant: "minimal",
                        intent: "none",
                        size,
                        fill: fill ? true : false,
                    });

                    let segmentClasses: string;
                    if (isSelected) {
                        segmentClasses = cn(
                            // Remove the transparent bg from minimal, add raised look
                            baseClasses,
                            // Suppress minimal's hover/active since selected is always raised
                            "shadow-button",
                            SELECTED_BG[intent],
                            SELECTED_TEXT[intent],
                            // Override minimal hover/active so the selected segment doesn't flicker
                            intent === "none"
                                ? "hover:bg-white dark:hover:bg-dark-gray-5 active:bg-white dark:active:bg-dark-gray-5"
                                : "",
                        );
                    } else {
                        // Unselected: muted text, transparent bg (minimal). Override default foreground.
                        // Must re-assert the dark color too: baseClasses (minimal/none) carries
                        // `dark:text-white`/`dark:[&_svg]:fill-white`, whose `.dark`-scoped selector
                        // out-specifies a plain `text-foreground-muted` in dark mode (would render
                        // the unselected segment white). Blueprint's unselected segment is muted.
                        segmentClasses = cn(
                            baseClasses,
                            "text-foreground-muted dark:text-foreground-muted dark:[&_svg]:fill-current",
                            // disabled segments stay disabled text (opacity is handled by button disabled:opacity-50)
                        );
                    }

                    const tabIndex =
                        role === "radiogroup" || role === "menu"
                            ? isSelected || (idx === 0 && !isAnySelected)
                                ? 0
                                : -1
                            : undefined;

                    return (
                        <button
                            key={option.value}
                            type="button"
                            role={buttonRole}
                            aria-checked={
                                role === "radiogroup" || role === "menu" ? isSelected : undefined
                            }
                            aria-pressed={
                                role === "group" || role === "toolbar" ? isSelected : undefined
                            }
                            tabIndex={tabIndex}
                            disabled={isDisabled}
                            className={segmentClasses}
                            onClick={() => !isDisabled && handleClick(option.value)}
                        >
                            {resolveIcon(option.icon, { className: "!text-current" }) && (
                                <span className="inline-flex [&_svg]:size-4 [&_svg]:shrink-0">
                                    {resolveIcon(option.icon, { className: "!text-current" })}
                                </span>
                            )}
                            <span>{option.label}</span>
                        </button>
                    );
                })}
            </div>
        );
    },
);
