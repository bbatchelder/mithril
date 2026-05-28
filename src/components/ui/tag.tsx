import { forwardRef, useCallback } from "react";

import { cn } from "@/lib/utils";
import { Icon } from "./icon";

export type TagIntent = "none" | "primary" | "success" | "warning" | "danger";
export type TagSize = "medium" | "large";

// ── Solid intent colors ─────────────────────────────────────────────────────
// Blueprint `.bp6-tag` solid: bg = intent-default-rest (gray-1 = #5f6b7c),
// text = intent-default-foreground (white). Intent variants follow token map.
// Warning is a special case: Blueprint lifts the bg by oklch l+0.19 (≈ orange-5),
// keeps black text — matches the Button warning pattern.
//
// Hover/active for solid tags are only applied when `interactive` is true.
const TAG_SOLID: Record<TagIntent, string> = {
    none: [
        "bg-gray-1 text-white",
        "data-[interactive=true]:hover:bg-dark-gray-5 data-[interactive=true]:active:bg-dark-gray-4",
        "data-[active=true]:bg-dark-gray-4",
    ].join(" "),
    primary: [
        "bg-primary text-primary-foreground",
        "data-[interactive=true]:hover:bg-primary-hover data-[interactive=true]:active:bg-primary-active",
        "data-[active=true]:bg-primary-active",
    ].join(" "),
    success: [
        "bg-success text-success-foreground",
        "data-[interactive=true]:hover:bg-success-hover data-[interactive=true]:active:bg-success-active",
        "data-[active=true]:bg-success-active",
    ].join(" "),
    // Warning solid: Blueprint lifts orange-3 by oklch l+0.19 for bg (≈ orange-5 but warmer)
    // and lightens warning-foreground (#111418) by oklch l+0.05 for text (≈ dark-gray).
    // Tokens carry exact computed values; hover/active use static palette tiers.
    warning: [
        "bg-tag-solid-warning-bg text-tag-solid-warning-text",
        "data-[interactive=true]:hover:bg-orange-4 data-[interactive=true]:active:bg-orange-3",
        "data-[active=true]:bg-orange-3",
    ].join(" "),
    danger: [
        "bg-danger text-danger-foreground",
        "data-[interactive=true]:hover:bg-danger-hover data-[interactive=true]:active:bg-danger-active",
        "data-[active=true]:bg-danger-active",
    ].join(" "),
};

// ── Minimal intent colors ────────────────────────────────────────────────────
// Blueprint `.bp6-tag.bp6-minimal`:
//   - none: bg = oklch(from gray-1 calc(l+0.16) c h / 0.15) — THEME-INVARIANT (gray-1 doesn't change theme)
//            ≈ rgba(141,154,174,0.15). Distinct from --interactive-hover which goes white in dark.
//            text = typography-color-default-rest ≈ dark-gray-1 (light) / near-white (dark)
//   - intent (light): bg = oklch(from intent-rest l c h / 0.1), text = intent-rest-ish (palette -2)
//   - intent (dark): bg = oklch(from intent-rest l c h / 0.2), text uses oklch +0.22/+0.25/+0.18/+0.20
//
// `--tag-minimal-*` tokens in tokens.css carry the exact computed values from Blueprint's browser.
const TAG_MINIMAL: Record<TagIntent, string> = {
    none: [
        // bg: theme-invariant gray-1-derived @ 15% (see --tag-minimal-bg token)
        "bg-tag-minimal-bg text-tag-minimal-none-text",
        "data-[interactive=true]:hover:bg-interactive-active data-[interactive=true]:active:bg-interactive-active",
        "data-[active=true]:bg-interactive-active",
    ].join(" "),
    primary: [
        // light: blue-3 at 10% + blue-2 text; dark: blue-3 at 20% + custom light blue text
        "bg-blue-3/10 text-tag-minimal-primary-text",
        "dark:bg-blue-3/20",
        "data-[interactive=true]:hover:bg-blue-3/20 data-[interactive=true]:active:bg-blue-3/30",
        "dark:data-[interactive=true]:hover:bg-blue-3/30 dark:data-[interactive=true]:active:bg-blue-3/35",
        "data-[active=true]:bg-blue-3/30 dark:data-[active=true]:bg-blue-3/35",
    ].join(" "),
    success: [
        "bg-green-3/10 text-tag-minimal-success-text",
        "dark:bg-green-3/20",
        "data-[interactive=true]:hover:bg-green-3/20 data-[interactive=true]:active:bg-green-3/30",
        "dark:data-[interactive=true]:hover:bg-green-3/30 dark:data-[interactive=true]:active:bg-green-3/35",
        "data-[active=true]:bg-green-3/30 dark:data-[active=true]:bg-green-3/35",
    ].join(" "),
    warning: [
        "bg-orange-3/10 text-tag-minimal-warning-text",
        "dark:bg-orange-3/20",
        "data-[interactive=true]:hover:bg-orange-3/20 data-[interactive=true]:active:bg-orange-3/30",
        "dark:data-[interactive=true]:hover:bg-orange-3/30 dark:data-[interactive=true]:active:bg-orange-3/35",
        "data-[active=true]:bg-orange-3/30 dark:data-[active=true]:bg-orange-3/35",
    ].join(" "),
    danger: [
        "bg-red-3/10 text-tag-minimal-danger-text",
        "dark:bg-red-3/20",
        "data-[interactive=true]:hover:bg-red-3/20 data-[interactive=true]:active:bg-red-3/30",
        "dark:data-[interactive=true]:hover:bg-red-3/30 dark:data-[interactive=true]:active:bg-red-3/35",
        "data-[active=true]:bg-red-3/30 dark:data-[active=true]:bg-red-3/35",
    ].join(" "),
};

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
    /**
     * Visual intent / color scheme.
     * "none" = dark gray bg + white text (solid) or translucent gray bg (minimal).
     * @default "none"
     */
    intent?: TagIntent;

    /**
     * Minimal style: translucent tinted background + intent-colored text,
     * instead of the solid filled background.
     * @default false
     */
    minimal?: boolean;

    /**
     * Size of the tag.
     * - "medium": 20px height, 12px font, 2px/6px padding.
     * - "large":  30px height, 14px font, 6px/8px padding.
     * @default "medium"
     */
    size?: TagSize;

    /**
     * Whether the tag should have fully rounded (pill) ends.
     * @default false
     */
    round?: boolean;

    /**
     * Whether the tag fills its container width.
     * @default false
     */
    fill?: boolean;

    /**
     * Whether the tag reacts to hover/active interactions (cursor pointer + bg shift).
     * Automatically true when `onClick` is provided.
     * @default false
     */
    interactive?: boolean;

    /**
     * Persistent pressed/selected appearance.
     * @default false
     */
    active?: boolean;

    /**
     * Icon rendered before the text content.
     */
    icon?: React.ReactNode;

    /**
     * Icon rendered after the text content (before the remove button).
     */
    endIcon?: React.ReactNode;

    /**
     * When provided, renders a remove (×) button. The callback receives the
     * mouse event from the button click.
     */
    onRemove?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

/**
 * Pixel-faithful Blueprint Tag.
 *
 * Visual mapping:
 *   solid none     → bg-gray-1 (#5f6b7c) + white text
 *   solid primary  → bg-primary (blue-3) + white text
 *   solid success  → bg-success (green-3) + white text
 *   solid warning  → bg-orange-5 (#fbb360) + black text  [Blueprint lightens orange-3 by oklch l+0.19]
 *   solid danger   → bg-danger (red-3) + white text
 *   minimal none   → bg-interactive-hover + foreground text
 *   minimal intent → bg-intent/10 + intent text (light); bg-intent/20 + lighter intent text (dark)
 *
 * Sizes:
 *   medium: min-h-5 (20px), py-0.5 (2px), px-1.5 (6px), text-body-sm (12px)
 *   large:  min-h-7.5 (30px), py-1.5 (6px), px-2 (8px), text-body (14px)
 *   round medium: border-radius 30px, px-2 (8px)
 *   round large:  border-radius 30px, px-2.5 (10px)
 *
 * @see https://blueprintjs.com/docs/#core/components/tag
 */
export const Tag = forwardRef<HTMLSpanElement, TagProps>(function Tag(
    {
        className,
        intent = "none",
        minimal = false,
        size = "medium",
        round = false,
        fill = false,
        interactive: interactiveProp = false,
        active = false,
        icon,
        endIcon,
        onRemove,
        onClick,
        children,
        ...props
    },
    ref,
) {
    // Tags are interactive if the prop is set OR if onClick is provided (Blueprint behaviour).
    const interactive = interactiveProp || onClick != null;

    const handleRemoveClick = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            // Prevent the outer tag's onClick from firing when remove is clicked.
            e.stopPropagation();
            onRemove?.(e);
        },
        [onRemove],
    );

    const colorClasses = minimal ? TAG_MINIMAL[intent] : TAG_SOLID[intent];

    return (
        <span
            ref={ref}
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            data-interactive={interactive || undefined}
            data-active={active || undefined}
            onClick={onClick}
            className={cn(
                // Base layout — matches Blueprint's inline-flex tag container.
                "inline-flex items-center gap-1 max-w-full relative",
                "border-none box-border",
                // Shape
                round ? "rounded-[30px]" : "rounded-bp",
                // Fill
                fill ? "flex w-full" : "inline-flex",
                // Size: medium vs large (padding adjusts for round)
                size === "medium" && !round && "min-h-5 min-w-5 py-0.5 px-1.5 text-body-sm leading-4",
                size === "medium" && round && "min-h-5 min-w-5 py-0.5 px-2 text-body-sm leading-4",
                size === "large" && !round && "min-h-7.5 min-w-7.5 py-1.5 px-2 text-body leading-[18px]",
                size === "large" && round && "min-h-7.5 min-w-7.5 py-1.5 px-2.5 text-body leading-[18px]",
                // Colors (solid or minimal × intent)
                colorClasses,
                // Interactive cursor
                interactive && "cursor-pointer",
                className,
            )}
            {...props}
        >
            {/* Left icon */}
            {icon != null && (
                <span className="inline-flex shrink-0 items-center">
                    {icon}
                </span>
            )}

            {/* Text content */}
            {children != null && (
                <span className={cn("min-w-0 truncate", fill && "flex-1")}>
                    {children}
                </span>
            )}

            {/* Right/end icon */}
            {endIcon != null && (
                <span className="inline-flex shrink-0 items-center">
                    {endIcon}
                </span>
            )}

            {/* Remove button — only rendered when onRemove is provided */}
            {onRemove != null && (
                <button
                    type="button"
                    aria-label="Remove tag"
                    onClick={handleRemoveClick}
                    className={cn(
                        // Blueprint .bp6-tag-remove: negative margins to tuck into tag padding,
                        // extra padding for larger click area.
                        "inline-flex items-center justify-center",
                        "bg-transparent border-none cursor-pointer p-0",
                        "opacity-70 hover:opacity-100 active:opacity-100",
                        // Negative right margin to stay within the tag padding zone.
                        size === "medium" ? "-mr-1 -my-0.5" : "-mr-2 -my-1.5",
                        // Padding on the remove button — matches Blueprint's .bp6-tag-remove:
                        //   `padding: 2px; padding-left: 0;`
                        // Earlier we used pr-1.5 (6px) which inflated chip width by ~6px.
                        size === "medium" ? "pl-0 pr-0.5 py-0.5" : "pl-0 pr-1 py-1.5",
                    )}
                >
                    <Icon
                        icon="small-cross"
                        size={size === "large" ? 20 : 16}
                        className="text-current"
                    />
                </button>
            )}
        </span>
    );
});
