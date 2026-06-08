import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";

import { cn } from "@/lib/utils";
import type { Intent } from "@/lib/types";
import { Icon, type IconGlyph, type IconName } from "./icon";

export type InputGroupIntent = Intent;
export type InputGroupSize = "small" | "medium" | "large";

/**
 * Size → exact pixel height (matches Button's size system and Blueprint's $pt-input-height vars).
 *   small  = 24px ($pt-input-height-small  = $pt-spacing * 6)
 *   medium = 30px ($pt-input-height         = $pt-spacing * 7.5) — default
 *   large  = 40px ($pt-input-height-large   = $pt-spacing * 10)
 */

/**
 * Box-shadow derivation (Blueprint _common.scss):
 *
 * Resting (no intent):
 *   `shadow-input` → var(--input-shadow)
 *   Light: inset 0 0 0 1px rgba(17,20,24,0.2), inset 0 1px 1px rgba(17,20,24,0.3)
 *   Dark:  inset 0 0 0 1px rgba(255,255,255,0.2), inset 0 -1px 1px 0 rgba(255,255,255,0.3)
 *
 * Resting (with intent):
 *   `shadow-input-intent-<X>` → inset 0 0 0 1px <intent-color>, var(--input-shadow)
 *   Light colors: blue-3/green-3/orange-3/red-3 (pt-intent-colors)
 *   Dark  colors: blue-4/green-4/orange-4/red-4 (pt-dark-input-intent-box-shadow-colors)
 *
 * Focus (no intent):
 *   inset 0 0 0 1px <ring-color>, 0 0 0 1px <ring-color>, inset 0 1px 1px rgba(0,0,0,0.2)
 *   where ring = rgba(33,93,176,0.752) light / rgba(138,187,255,0.752) dark
 *   — encoded as focus:shadow-input-focus literal class
 *
 * Focus (with intent):
 *   Same shape but using the intent color as the ring color (Blueprint pt-input-intent focus).
 *   — encoded as focus:shadow-input-focus-<intent>
 *
 * NOTE: Focus ring is not captured by the harness (resting state only). It is verified
 * visually via screenshots. The harness diffs: height, paddingLeft, paddingRight,
 * borderRadius, boxShadow, backgroundColor, color, fontSize.
 *
 * Icon padding (from Blueprint _input-group.scss + _common.scss):
 *   medium: left-icon shifts padding-left to $pt-input-height = 30px
 *   large:  left-icon shifts padding-left to $pt-button-height-large = 40px
 *   small:  left-icon shifts padding-left to $pt-icon-size-standard + $input-small-padding = 16+8 = 24px
 *   (same rule applies to rightElement via padding-right)
 *
 * Disabled:
 *   Light: bg=rgba(light-gray-1, 0.5), box-shadow=none, color=$pt-text-color-disabled
 *   Dark:  bg=rgba(dark-gray-5, 0.5), box-shadow=none, color=$pt-dark-text-color-disabled
 */

// Resting box-shadow by intent (literal utility class names must exist in tokens / @theme inline)
const INTENT_SHADOW: Record<InputGroupIntent, string> = {
    none: "shadow-input",
    primary: "shadow-input-intent-primary",
    success: "shadow-input-intent-success",
    warning: "shadow-input-intent-warning",
    danger: "shadow-input-intent-danger",
};

// Focus box-shadow by intent (applied via focus: variant)
const INTENT_FOCUS_SHADOW: Record<InputGroupIntent, string> = {
    none: "focus:shadow-input-focus",
    primary: "focus:shadow-input-focus-primary",
    success: "focus:shadow-input-focus-success",
    warning: "focus:shadow-input-focus-warning",
    danger: "focus:shadow-input-focus-danger",
};

export const inputVariants = cva(
    [
        // Structure (matches Blueprint's .bp6-input)
        "relative w-full appearance-none outline-none",
        // Typography — inherit font-family from body (Blueprint does not reset font)
        "font-sans font-normal",
        // Colors (resting, no intent)
        "bg-white dark:bg-black/30",
        "text-foreground",
        "placeholder:text-foreground-muted placeholder:opacity-100",
        // Border-radius is handled per-variant: round:false → rounded-mithril (4px); round:true → compound per size
        // Transition (Blueprint: box-shadow 100ms ease)
        "transition-shadow duration-100 ease-mithril",
        // Disabled
        "disabled:bg-[rgba(211,216,222,0.5)] dark:disabled:bg-[rgba(64,72,84,0.5)]",
        "disabled:text-foreground-disabled disabled:shadow-none disabled:cursor-not-allowed",
        "disabled:placeholder:text-foreground-disabled",
    ],
    {
        variants: {
            size: {
                // Blueprint: height/line-height per size; horizontal padding = 8px for all sizes
                // (large does NOT increase h-padding; only round/search inputs get 1.5× padding)
                small: "h-6 text-body-sm px-2",
                medium: "h-7.5 text-body px-2",
                large: "h-10 text-body-lg px-2",
            },
            round: {
                // round: Blueprint sets border-radius: $pt-input-height (the element's height).
                // Tailwind rounded-full = 9999px which doesn't match. Per-size values via compound variants.
                // round:false → standard 4px border-radius.
                true: "",
                false: "rounded-mithril",
            },
            intent: {
                none: "",
                primary: "",
                success: "",
                warning: "",
                danger: "",
            },
            // Internal flag: whether a left slot (icon or element) is present
            hasLeft: {
                true: "",
                false: "",
            },
            // Internal flag: whether a right slot (element) is present
            hasRight: {
                true: "",
                false: "",
            },
        },
        compoundVariants: [
            // Round: border-radius = height (Blueprint: border-radius: $pt-input-height)
            { size: "small", round: true, class: "rounded-[24px]" },
            { size: "medium", round: true, class: "rounded-[30px]" },
            { size: "large", round: true, class: "rounded-[40px]" },
            // When left slot present: padding-left = icon+margin (depends on size)
            // Blueprint: medium/large = $pt-input-height; small = $pt-icon-size-standard + $input-small-padding = 16+8=24px
            { size: "small", hasLeft: true, class: "pl-6" },
            { size: "medium", hasLeft: true, class: "pl-7.5" },
            { size: "large", hasLeft: true, class: "pl-10" },
            { size: "small", hasRight: true, class: "pr-6" },
            { size: "medium", hasRight: true, class: "pr-7.5" },
            { size: "large", hasRight: true, class: "pr-10" },
        ],
        defaultVariants: { size: "medium", round: false, intent: "none", hasLeft: false, hasRight: false },
    },
);

export interface InputGroupProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
        Pick<VariantProps<typeof inputVariants>, "size" | "round" | "intent"> {
    /** Controls whether the input fills its container width. @default false */
    fill?: boolean;
    /**
     * Icon rendered on the left side of the input — an icon-name string (resolved
     * through the registry) or an imported glyph object (`leftIcon={search}`, which
     * tree-shakes). Mutually exclusive with `leftElement`.
     */
    leftIcon?: IconName | IconGlyph;
    /**
     * Arbitrary ReactNode rendered in the left slot (e.g. a button or spinner).
     * Mutually exclusive with `leftIcon`. Takes precedence if both are supplied.
     */
    leftElement?: React.ReactNode;
    /**
     * Arbitrary ReactNode rendered in the right slot (e.g. a clear button or tag).
     */
    rightElement?: React.ReactNode;
}

/**
 * InputGroup — pixel-faithful Blueprint text input with clean modern API.
 *
 * Ref forwarded to the underlying `<input>` element.
 *
 * @see https://blueprintjs.com/docs/#core/components/input-group
 */
export const InputGroup = forwardRef<HTMLInputElement, InputGroupProps>(function InputGroup(
    {
        className,
        size = "medium",
        intent = "none",
        round = false,
        fill = false,
        leftIcon,
        leftElement,
        rightElement,
        disabled,
        ...inputProps
    },
    ref,
) {
    const hasLeft = leftElement != null || leftIcon != null;
    const hasRight = rightElement != null;

    const intentShadow = INTENT_SHADOW[intent ?? "none"];
    const focusShadow = INTENT_FOCUS_SHADOW[intent ?? "none"];
    // Expose a real (non-"none") intent so a parent ControlGroup can raise this input above
    // its neighbors (z-index intent tier) — keeping its intent border/ring from being clipped.
    const dataIntent = intent && intent !== "none" ? intent : undefined;

    return (
        <div
            className={cn(
                "relative block",
                fill ? "w-full" : "inline-block",
                disabled && "cursor-not-allowed",
            )}
        >
            {/* Left slot: leftElement takes priority over leftIcon */}
            {hasLeft && (
                <span
                    className={cn(
                        "pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center justify-center",
                        // Icon/element slot width = input height (Blueprint sizes it as a square)
                        size === "small" && "w-6",
                        size === "medium" && "w-7.5",
                        size === "large" && "w-10",
                        // Icon color: foreground-muted in default state (Blueprint $pt-icon-color = gray1)
                        "text-foreground-muted dark:text-foreground-muted",
                        // If leftElement contains interactive content (e.g. button), allow pointer events
                        leftElement != null && "pointer-events-auto",
                    )}
                >
                    {leftElement != null ? (
                        leftElement
                    ) : leftIcon != null ? (
                        <Icon icon={leftIcon} size={16} aria-hidden />
                    ) : null}
                </span>
            )}

            <input
                ref={ref}
                disabled={disabled}
                data-has-left={hasLeft || undefined}
                data-has-right={hasRight || undefined}
                {...inputProps}
                data-intent={dataIntent}
                className={cn(
                    inputVariants({ size, round, intent, hasLeft, hasRight }),
                    intentShadow,
                    focusShadow,
                    className,
                )}
            />

            {/* Right slot */}
            {hasRight && (
                <span
                    className={cn(
                        "pointer-events-auto absolute inset-y-0 right-0 z-10 flex items-center justify-center",
                        size === "small" && "w-6",
                        size === "medium" && "w-7.5",
                        size === "large" && "w-10",
                        "text-foreground-muted dark:text-foreground-muted",
                    )}
                >
                    {rightElement}
                </span>
            )}
        </div>
    );
});
