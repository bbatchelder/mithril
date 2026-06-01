import { forwardRef, useRef } from "react";

import { cn } from "@/lib/utils";

/**
 * FileInput — pixel-faithful Blueprint FileInput reimplementation.
 *
 * Design decision — Browse button as a real `<span>` element (not `::after` pseudo):
 *   Blueprint renders the Browse button via `.bp6-file-upload-input::after { content: "Browse" }`.
 *   We render it as a real `<span>` inside the box span. This is cleaner (testable,
 *   accessible, inspectable) and produces an identical computed appearance. The harness
 *   cannot diff pseudo-elements so only the box span is measured — which is identical
 *   either way. The Browse button visual match is verified via screenshots.
 *
 * DOM structure:
 *   <label> (wrapper — position:relative; height matches size; cursor:pointer)
 *     <input type="file"> (visually hidden: opacity:0, width:100%, height:100%, position:absolute)
 *     <span class="file-upload-input"> (the visible box — input-like style with Browse on right)
 *       <span class="browse-button"> (Browse button — default solid none button style, h=24/30/20px)
 *     </span>
 *   </label>
 *
 * Blueprint sizing ($pt-spacing = 4px):
 *   medium: box h=30px, browse h=24px (small button), margin=(30-24)/2=3px,
 *           padding-right = $file-input-button-width + 8 = 70 + 8 = 78px
 *   large:  box h=40px, browse h=30px (medium button), margin=(40-30)/2=5px,
 *           padding-right = $file-input-button-width-large + 8 = 85 + 8 = 93px
 *   small:  box h=24px, browse h=20px (smaller button), margin=(24-20)/2=2px,
 *           padding-right = $file-input-button-width-small + 8 = 55 + 8 = 63px
 *
 * @see https://blueprintjs.com/docs/#core/components/file-input
 */

export type FileInputSize = "small" | "medium" | "large";

export interface FileInputProps extends Omit<React.LabelHTMLAttributes<HTMLLabelElement>, "onChange"> {
    /**
     * Display text when no file is selected (or when hasSelection is false).
     * Rendered in `--foreground-disabled` (rgba(95,107,124,0.6) light / rgba(171,179,191,0.6)
     * dark) — Blueprint's exact empty-state prompt color (`.bp6-file-upload-input`). Note this
     * is a faithful Blueprint-parity delta that sits below WCAG AA (~2.45:1 light); consumers
     * who need AA can darken this class. See the contrast posture in docs/comparison-vs-blueprint.
     * @default "Choose file..."
     */
    text?: React.ReactNode;

    /**
     * Text label for the Browse button on the right side.
     * @default "Browse"
     */
    buttonText?: string;

    /**
     * Whether the user has selected a file. Changes text color from muted (placeholder)
     * to full foreground color. Typically set to `!!files.length`.
     * @default false
     */
    hasSelection?: boolean;

    /**
     * Size of the file input. Controls the box and browse button heights.
     * @default "medium"
     */
    size?: FileInputSize;

    /**
     * Whether to use large styles. @deprecated Use `size="large"` instead.
     * @default false
     */
    large?: boolean;

    /**
     * Whether to expand the input to fill its container width.
     * @default false
     */
    fill?: boolean;

    /**
     * Whether the input is disabled. Disables the hidden file input and applies muted
     * styling to both the box and Browse button.
     * @default false
     */
    disabled?: boolean;

    /**
     * Convenience onChange handler for the hidden `<input type="file">`.
     * Equivalent to `inputProps.onChange`.
     */
    onInputChange?: React.ChangeEventHandler<HTMLInputElement>;

    /**
     * Props forwarded to the hidden `<input type="file">` element.
     * `type` and `disabled` are controlled and will be overridden.
     */
    inputProps?: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "disabled">;

    /** Additional class name applied to the outer label wrapper. */
    className?: string;
}

export const FileInput = forwardRef<HTMLLabelElement, FileInputProps>(function FileInput(
    {
        text = "Choose file...",
        buttonText = "Browse",
        hasSelection = false,
        size: sizeProp = "medium",
        large = false,
        fill = false,
        disabled = false,
        onInputChange,
        inputProps = {},
        className,
        ...labelProps
    },
    ref,
) {
    // Normalize size: legacy `large` prop maps to "large" size
    const size: FileInputSize = large ? "large" : sizeProp;

    const inputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onInputChange?.(e);
        inputProps?.onChange?.(e);
    };

    return (
        <label
            ref={ref}
            {...labelProps}
            className={cn(
                // Wrapper: inline-block by default; fill → block/100%
                "relative",
                // Blueprint's computed width is 253px (input min-width + button gutter +
                // 3px border accounting). Required because both the native input and the
                // visible box span are position:absolute — the label has no in-flow content,
                // so without an explicit width a flex-column parent stretches it to 100%.
                fill ? "block w-full" : "inline-block w-[253px]",
                // Height matches the box span (sized by size variant)
                size === "small" && "h-6",
                size === "medium" && "h-7.5",
                size === "large" && "h-10",
                // Cursor: pointer (like a button); not-allowed when disabled
                disabled ? "cursor-not-allowed" : "cursor-pointer",
                className,
            )}
        >
            {/*
             * Hidden native file input. Blueprint: opacity:0, positioned absolute so
             * it sits over the entire label area and captures clicks.
             * min-width: large enough to cover the label (Blueprint: $pt-spacing*50=200px;
             * we use 100% which fills the label). Clicks on the box (including the Browse
             * button span) propagate to the label → input through label association.
             */}
            <input
                {...inputProps}
                ref={inputRef}
                type="file"
                disabled={disabled}
                onChange={handleChange}
                className={cn(
                    "absolute inset-0 w-full h-full opacity-0",
                    disabled ? "cursor-not-allowed" : "cursor-pointer",
                )}
            />

            {/*
             * The visible box — styled like a text input (shadow-input, bg-white).
             * Positioned absolute to fill the label (= same height). Blueprint does
             * position: absolute; left:0; right:0; top:0. We use inset-0 for the same.
             *
             * data-compare is placed HERE (the box element, not the label wrapper)
             * because this is the element the harness diffs against Blueprint's
             * .bp6-file-upload-input span.
             */}
            <span
                className={cn(
                    // Marker class for gallery data-compare attachment via querySelector
                    "fi-box",
                    // Fill the label area
                    "absolute inset-0",
                    // Input-like appearance
                    "rounded-bp",
                    "font-sans font-normal",
                    // Font size: matches Blueprint's input size (same as InputGroup)
                    // small=12px(text-body-sm), medium=14px(text-body), large=16px(text-body-lg)
                    size === "small" && "text-body-sm",
                    (size === "medium") && "text-body",
                    size === "large" && "text-body-lg",
                    "overflow-hidden text-ellipsis whitespace-nowrap",
                    // Left padding like an input (Blueprint: @include pt-input → $input-padding-horizontal = 8px)
                    "pl-2",
                    // Vertical centering — achieved via flex
                    "flex items-center",
                    // User-select: none (Blueprint: user-select: none on .bp6-file-upload-input)
                    "select-none",
                    // Transition (mirrors InputGroup)
                    "transition-shadow duration-100 ease-bp",
                    // Background + input shadow (same as InputGroup/TextArea)
                    "bg-white dark:bg-black/30",
                    "shadow-input",
                    // Text color: placeholder-like by default; foreground when hasSelection
                    hasSelection
                        ? "text-foreground"
                        : "text-foreground-disabled dark:text-foreground-disabled",
                    // Disabled state: muted bg, no shadow (same as InputGroup disabled)
                    disabled && [
                        "bg-[rgba(211,216,222,0.5)] dark:bg-[rgba(64,72,84,0.5)]",
                        "shadow-none",
                        "text-foreground-disabled dark:text-foreground-disabled",
                    ],
                    // Right padding: must accommodate Browse button width + gutter
                    // medium: 70px button + 8px padding = 78px
                    // large:  85px button + 8px padding = 93px
                    // small:  55px button + 8px padding = 63px
                    size === "small" && "pr-[63px]",
                    size === "medium" && "pr-[78px]",
                    size === "large" && "pr-[93px]",
                )}
            >
                {/* Visible text (truncated with ellipsis) */}
                <span className="min-w-0 truncate">{text}</span>

                {/*
                 * Browse button — rendered as a real <span> (not ::after pseudo-element).
                 * Uses the default/none solid Button colors: bg-light-gray-5 + shadow-button
                 * (light); bg-dark-gray-3 + shadow-button (dark).
                 *
                 * Blueprint positioning: position:absolute; right:0; top:0; margin=$button-padding.
                 * button-padding = (input-height - button-height-small) / 2 = (30-24)/2 = 3px.
                 * We pull it out of the text flow with absolute + margin.
                 *
                 * Heights and margins by size:
                 *   medium: h=24px (small button), margin=3px
                 *   large:  h=30px (medium button), margin=5px
                 *   small:  h=20px (smaller button), margin=2px
                 *
                 * Width by size:
                 *   medium: 70px ($pt-spacing * 17.5)
                 *   large:  85px ($pt-spacing * 21.25)
                 *   small:  55px ($pt-spacing * 13.75)
                 *
                 * The Browse button does NOT receive pointer-events because it's inside
                 * the label — clicks bubble up to the label which triggers the file input.
                 * Blueprint's ::after also doesn't have pointer events separate from the parent.
                 */}
                <span
                    className={cn(
                        // Layout: absolute, right-aligned with margin
                        "absolute right-0 top-0",
                        "flex items-center justify-center",
                        "whitespace-nowrap overflow-hidden text-ellipsis",
                        "rounded-bp",
                        "text-center leading-none",
                        // Font: inherit font-size from parent box span (which is size-appropriate)
                        "font-sans font-normal",
                        // Default/none solid Button colors (mirrors HTMLSelect and Button solid/none)
                        "bg-light-gray-5 shadow-button",
                        "text-foreground",
                        "dark:bg-[#303740] dark:shadow-button",
                        // White in dark to match Blueprint's none-control text (Delta #1, handoff 0064).
                        "dark:text-white",
                        // Hover: Blueprint pt-button-hover (via label:hover → span:hover inheritance)
                        // Note: hover is verified visually; the harness only captures resting state.
                        // Disabled: muted appearance
                        disabled && [
                            "bg-light-gray-1/50 shadow-none text-foreground-disabled",
                            "dark:bg-gray-3/[4%] dark:shadow-none dark:text-gray-3",
                        ],
                        // Size: height + margin
                        size === "small" && "h-5 w-[55px] mx-0.5 my-0.5",
                        size === "medium" && "h-6 w-[70px] mx-[3px] my-[3px]",
                        size === "large" && "h-7.5 w-[85px] mx-[5px] my-[5px]",
                    )}
                >
                    {buttonText}
                </span>
            </span>
        </label>
    );
});
