import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

export type TextAreaIntent = "none" | "primary" | "success" | "warning" | "danger";
export type TextAreaSize = "small" | "medium" | "large";

/**
 * TextArea — pixel-faithful Blueprint textarea with clean modern API.
 *
 * Divergences from InputGroup (by design — Blueprint spec differences):
 *   - NOT `line-height: height`. Textarea uses `height: auto; line-height: inherit`
 *     (normal running line-height ~1.28581). This is multiline text, not a fixed-height input.
 *   - Vertical padding applies on all sides: `padding: 8px` for medium/large;
 *     `padding: 8px` for small (both $input-padding-horizontal and $input-small-padding = 8px).
 *   - `resize: both` by default (Blueprint textarea is resizable by default).
 *     When `autoResize={true}`, Blueprint sets `resize: horizontal` (only horizontal).
 *   - `height: auto` — height is determined by content + rows, not a fixed px height.
 *   - `max-width: 100%` — Blueprint adds this to textareas to keep them in-bounds.
 *
 * Box-shadow tokens are identical to InputGroup (same Blueprint `pt-input` mixin base):
 *   - `shadow-input` for resting (no intent)
 *   - `shadow-input-intent-<intent>` for intent-colored resting border
 *   - `focus:shadow-input-focus[-<intent>]` for focus ring
 *
 * autoResize (JS approach — mirrors Blueprint's maybeSyncHeightToScrollHeight):
 *   Sets height=0 first, then height=scrollHeight to get the minimum height that fits
 *   all content. Runs on mount + on value change. When active, disables vertical resize.
 *
 * Size → font-size (matches Button + InputGroup size system):
 *   small  = 12px ($pt-font-size-small)
 *   medium = 14px ($pt-font-size)     — default
 *   large  = 16px ($pt-font-size-large)
 */

// Resting box-shadow by intent (literal utility class names, resolved via @theme inline)
const INTENT_SHADOW: Record<TextAreaIntent, string> = {
    none: "shadow-input",
    primary: "shadow-input-intent-primary",
    success: "shadow-input-intent-success",
    warning: "shadow-input-intent-warning",
    danger: "shadow-input-intent-danger",
};

// Focus box-shadow by intent (applied via focus: variant)
const INTENT_FOCUS_SHADOW: Record<TextAreaIntent, string> = {
    none: "focus:shadow-input-focus",
    primary: "focus:shadow-input-focus-primary",
    success: "focus:shadow-input-focus-success",
    warning: "focus:shadow-input-focus-warning",
    danger: "focus:shadow-input-focus-danger",
};

export const textAreaVariants = cva(
    [
        // Structure — textarea-specific: height auto, max-width constrained, box-sizing
        "block max-w-full appearance-none outline-none box-border",
        // Vertical resize by default (Blueprint textarea is resizable)
        // Override: autoResize removes vertical resize (handled via className prop)
        "resize",
        // Typography — inherit font-family from body; line-height is natural (not equal to height)
        // Blueprint: height:auto; line-height:inherit — do NOT set a fixed line-height here
        "font-sans font-normal",
        // Colors (resting, no intent)
        "bg-white dark:bg-black/30",
        "text-foreground",
        "placeholder:text-foreground-muted placeholder:opacity-100",
        // Transition (Blueprint: box-shadow 100ms ease)
        "transition-shadow duration-100 ease-bp",
        // Disabled
        "disabled:bg-[rgba(211,216,222,0.5)] dark:disabled:bg-[rgba(64,72,84,0.5)]",
        "disabled:text-foreground-disabled disabled:shadow-none disabled:cursor-not-allowed",
        "disabled:placeholder:text-foreground-disabled",
        // Tailwind v4 preflight resets textarea border — ensure box-sizing is correct
        // (border-box is already set via preflight in Tailwind v4 * { box-sizing: border-box })
    ],
    {
        variants: {
            size: {
                // Blueprint _input.scss: textarea padding = $input-padding-horizontal (8px) for medium/large.
                // Small padding = $input-small-padding = $pt-input-height-small - $pt-icon-size-standard
                //               = 24 - 16 = 8px — same as medium/large.
                // All sizes: p-2 (8px all sides).
                // Font sizes: small=12px, medium=14px, large=16px (Blueprint font scale).
                // Border-radius: always 4px (no round variant for textarea — Blueprint doesn't add one).
                small: "p-2 text-body-sm rounded-bp",
                medium: "p-2 text-body rounded-bp",
                large: "p-2 text-body-lg rounded-bp",
            },
            fill: {
                true: "w-full",
                false: "",
            },
            intent: {
                none: "",
                primary: "",
                success: "",
                warning: "",
                danger: "",
            },
        },
        defaultVariants: { size: "medium", fill: false, intent: "none" },
    },
);

export interface TextAreaProps
    extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "size">,
        Pick<VariantProps<typeof textAreaVariants>, "size" | "fill" | "intent"> {
    /**
     * Whether the textarea auto-grows vertically as the user types.
     * When `true`, vertical resize is disabled (horizontal only, like Blueprint).
     * Uses scrollHeight measurement on input/change events — mirrors Blueprint's approach.
     * @default false
     */
    autoResize?: boolean;
}

/**
 * TextArea — pixel-faithful Blueprint textarea with clean modern API.
 *
 * Ref forwarded to the underlying `<textarea>` element.
 *
 * @see https://blueprintjs.com/docs/#core/components/text-area
 */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
    {
        className,
        size = "medium",
        intent = "none",
        fill = false,
        autoResize = false,
        disabled,
        onChange,
        value,
        style,
        ...textareaProps
    },
    ref,
) {
    const innerRef = useRef<HTMLTextAreaElement | null>(null);

    // Sync height to scrollHeight when autoResize is enabled.
    // Blueprint's maybeSyncHeightToScrollHeight: set height=0 first, then height=scrollHeight.
    const syncHeight = () => {
        const el = innerRef.current;
        if (!el || !autoResize) return;
        el.style.height = "0px";
        el.style.height = `${el.scrollHeight}px`;
    };

    // Sync on mount and whenever value changes (controlled mode).
    useEffect(() => {
        syncHeight();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoResize, value]);

    const intentShadow = INTENT_SHADOW[intent ?? "none"];
    const focusShadow = INTENT_FOCUS_SHADOW[intent ?? "none"];

    return (
        <textarea
            ref={(el) => {
                innerRef.current = el;
                if (typeof ref === "function") {
                    ref(el);
                } else if (ref) {
                    (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
                }
            }}
            disabled={disabled}
            value={value}
            style={style}
            {...textareaProps}
            onChange={(e) => {
                syncHeight();
                onChange?.(e);
            }}
            className={cn(
                textAreaVariants({ size, fill, intent }),
                intentShadow,
                focusShadow,
                // autoResize: disable vertical resize (only horizontal allowed, per Blueprint)
                autoResize && "resize-x",
                className,
            )}
        />
    );
});
