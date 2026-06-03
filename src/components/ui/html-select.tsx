import { forwardRef } from "react";

import { cn } from "@/lib/utils";
import { Icon } from "./icon";
import { caretDown, doubleCaretVertical, type IconGlyph } from "./icons";

export type HTMLSelectIconName = "double-caret-vertical" | "caret-down";

// The two glyphs this control can show, imported as objects so they tree-shake
// (and render with no `registerIcons` call). The public `iconName` prop stays a
// readable string union; this maps it to the glyph.
const ICON_BY_NAME: Record<HTMLSelectIconName, IconGlyph> = {
    "double-caret-vertical": doubleCaretVertical,
    "caret-down": caretDown,
};

export interface OptionProps {
    /** Option label (defaults to value if omitted). */
    label?: string;
    /** Option value. */
    value: string | number;
    /** Whether this option is disabled. */
    disabled?: boolean;
}

export interface HTMLSelectProps
    extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "multiple" | "size"> {
    /**
     * Shorthand for supplying options: an array of strings, numbers, or
     * `{ label?, value, disabled? }` objects. If no `label` is given, `value`
     * is used as the label.
     */
    options?: ReadonlyArray<string | number | OptionProps>;

    /** Whether to use large styles (40px height). @default false */
    large?: boolean;

    /** Whether to use minimal styles (no background/shadow at rest). @default false */
    minimal?: boolean;

    /** Whether the select should fill its container. @default false */
    fill?: boolean;

    /**
     * Name of the icon displayed on the right side.
     * @default "double-caret-vertical"
     */
    iconName?: HTMLSelectIconName;

    /** Multiple select is not supported. */
    multiple?: never;

    /** Additional class name applied to the outer wrapper div. */
    className?: string;
}

/**
 * HTMLSelect — pixel-faithful Blueprint `<HTMLSelect>` reimplementation.
 *
 * Renders a native `<select>` element styled like a Blueprint default (none-intent
 * solid) Button, with an absolutely-positioned caret icon on the right.
 *
 * DOM structure:
 *   <div> (wrapper — position:relative, inline-block / block when fill)
 *     <select> (styled button-like, appearance:none)
 *     <Icon>   (absolute right caret, pointer-events:none)
 *   </div>
 *
 * Design spec (Blueprint v6.15):
 *   - Default height: 30px (h-7.5); Large height: 40px (h-10)
 *   - Border-radius: 4px (rounded-bp)
 *   - Padding: 0 24px 0 8px (default); large right = 28px
 *   - Background/shadow: identical to solid/none Button (bg-light-gray-5 + shadow-button
 *     in light; bg-dark-gray-3 + dark shadow in dark)
 *   - Minimal: no bg/shadow at rest; hover/active match minimal Button
 *   - Caret: right:8px, top:7px default; right:12px, top:12px large
 *   - Disabled: muted background, no shadow, muted text
 *
 * `data-compare` should be placed on the `<select>` element (the measured node).
 *
 * @see https://blueprintjs.com/docs/#core/components/html-select
 */
export const HTMLSelect = forwardRef<HTMLSelectElement, HTMLSelectProps>(function HTMLSelect(
    {
        options = [],
        large = false,
        minimal = false,
        fill = false,
        iconName = "double-caret-vertical",
        disabled,
        className,
        children,
        ...selectProps
    },
    ref,
) {
    const optionElements = options.map((option) => {
        const opt: OptionProps = typeof option === "object" ? option : { value: option };
        const label = opt.label ?? String(opt.value);
        return (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {label}
            </option>
        );
    });

    return (
        <div
            className={cn(
                // Wrapper: position:relative so the icon can be absolute.
                // Blueprint: display:inline-block; fill → block/100%.
                "relative",
                fill ? "block w-full" : "inline-block",
                className,
            )}
        >
            <select
                ref={ref}
                disabled={disabled}
                {...selectProps}
                className={cn(
                    // Reset browser appearance and box model
                    "appearance-none cursor-pointer",
                    // Font: inherit from document (Tailwind v4 preflight resets select font)
                    "font-[inherit] text-body",
                    // Box model
                    "block w-full rounded-bp",
                    // Height + line-height: Blueprint uses fixed px heights
                    large ? "h-10" : "h-7.5",
                    // Padding: left=8px always; right enlarged for caret room
                    // Default: right = input-padding-horizontal * 3 = 24px
                    // Large:   right = input-padding-horizontal * 3.5 = 28px
                    large ? "pl-2 pr-7" : "pl-2 pr-6",
                    // Text color: foreground in light; white in dark to match Blueprint's
                    // dark control text (not #f6f7f9). Delta #1 — see handoff 0064.
                    "text-foreground dark:text-white",
                    // Font size: large uses body-lg (16px), default uses body (14px)
                    large ? "text-body-lg" : "text-body",
                    // Background + shadow: mirrors solid/none Button
                    // Minimal: no bg/shadow at rest; hover/active bg added below
                    minimal
                        ? [
                              "bg-transparent shadow-none",
                              // Hover/active match minimal Button (none intent)
                              "hover:bg-interactive-hover",
                              "active:bg-interactive-active",
                              // Dark minimal
                              "dark:bg-transparent dark:shadow-none",
                              "dark:hover:bg-interactive-hover dark:active:bg-interactive-active",
                          ]
                        : [
                              // Solid / none: Blueprint light-gray-5 bg + button shadow
                              "bg-light-gray-5 shadow-button",
                              "hover:bg-light-gray-4",
                              "active:bg-light-gray-2",
                              // Dark solid / none: Blueprint's oklch-derived default-control
                              // surface rgb(48,55,64) = #303740 (not the flat dark-gray-3 panel
                              // value) + dark button shadow. See handoff 0063.
                              "dark:bg-[#303740] dark:shadow-button",
                              "dark:hover:bg-dark-gray-2",
                              "dark:active:bg-dark-gray-1",
                          ],
                    // Disabled state: muted bg, no shadow, muted text, not-allowed cursor
                    // Light: rgba(light-gray-1, 0.5) bg, no shadow, muted text.
                    // Dark: Blueprint pt-dark-button-disabled = color-mix(gray3 4%, transparent)
                    //       ≈ rgba(143,153,168, 0.04) — nearly transparent.
                    //       Text = intent.default.disabled = gray-3 (#8f99a8).
                    "disabled:cursor-not-allowed",
                    "disabled:shadow-none dark:disabled:shadow-none",
                    "disabled:bg-light-gray-1/50 disabled:text-foreground-disabled",
                    "dark:disabled:bg-gray-3/[4%] dark:disabled:text-gray-3",
                    // Focus ring: Blueprint uses box-shadow, we use outline
                    "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    // Transition
                    "transition-colors duration-100 ease-bp",
                    // Select vertical alignment (Blueprint: vertical-align:middle on select)
                    "align-middle",
                )}
            >
                {optionElements}
                {children}
            </select>

            {/*
             * Caret icon: absolutely positioned on the right, vertically centered.
             * Blueprint _html-select.scss: %pt-select-icon
             *   right: $pt-spacing * 2 = 8px
             *   top: ($pt-button-height - $pt-icon-size-standard) * 0.5 = (30-16)/2 = 7px
             * Large:
             *   right: $pt-spacing * 3 = 12px
             *   top: ($pt-button-height-large - $pt-icon-size-standard) * 0.5 = (40-16)/2 = 12px
             *
             * pointer-events:none so clicks pass through to the select.
             * Icon color = $pt-icon-color (dark-gray-1 light / gray-4 dark).
             */}
            <Icon
                icon={ICON_BY_NAME[iconName]}
                size={16}
                // Hook for ControlGroup's z-11 tier — keeps the caret above an abutting
                // neighbor when a select sits inside a ControlGroup.
                data-select-caret=""
                className={cn(
                    "pointer-events-none absolute",
                    large ? "right-3 top-3" : "right-2 top-[7px]",
                    // Icon color: text-foreground-muted matches Blueprint's $pt-icon-color
                    // (gray-1 light / gray-4 dark — same as --foreground-muted)
                    "text-foreground-muted",
                    // Disabled: muted icon
                    disabled && "opacity-50",
                )}
                aria-hidden
            />
        </div>
    );
});
