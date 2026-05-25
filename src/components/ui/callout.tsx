import { forwardRef } from "react";

import { cn } from "@/lib/utils";
import { Icon } from "./icon";
import type { IconName } from "./icons";

export type CalloutIntent = "none" | "primary" | "success" | "warning" | "danger";

// ── Default intent icons ────────────────────────────────────────────────────
// Blueprint: when `icon` is omitted and intent is set, a default icon is shown.
//   primary  → info-sign
//   success  → tick
//   warning  → warning-sign
//   danger   → error
//   none     → no icon (even if intent=none, no default icon)
// To suppress the default icon explicitly, pass icon={null}.
const DEFAULT_INTENT_ICONS: Record<CalloutIntent, IconName | null> = {
    none: null,
    primary: "info-sign",
    success: "tick",
    warning: "warning-sign",
    danger: "error",
};

// ── Intent color classes ─────────────────────────────────────────────────────
// Light: blueprint's $pt-intent-text-colors → blue2/green2/orange2/red2
//   = --intent-*-text tokens (= --color-blue-2 etc. in light)
// Dark:  blueprint's $pt-dark-intent-text-colors → blue5/green5/orange5/red5
//   = palette tier -5 (NOT the color-mix() tokens which resolve differently)
//   blue5=#8abbff, green5=#72ca9b, orange5=#fbb360, red5=#fa999c
// Non-minimal bg: rgba(intentColor, 0.1) light / rgba(intentColor, 0.2) dark.
// Blueprint maps intent color as: primary→blue3, success→green3, warning→orange3, danger→red3.

const CALLOUT_INTENT: Record<CalloutIntent, { text: string; bg: string }> = {
    none: { text: "", bg: "" },
    primary: {
        // light: blue-2 (#215db0) / dark: blue-5 (#8abbff=rgb(138,187,255))
        text: "text-blue-2 dark:text-blue-5",
        bg: "bg-blue-3/10 dark:bg-blue-3/20",
    },
    success: {
        // light: green-2 (#1c6e42) / dark: green-5 (#72ca9b=rgb(114,202,155))
        text: "text-green-2 dark:text-green-5",
        bg: "bg-green-3/10 dark:bg-green-3/20",
    },
    warning: {
        // light: orange-2 (#935610) / dark: orange-5 (#fbb360=rgb(251,179,96))
        text: "text-orange-2 dark:text-orange-5",
        bg: "bg-orange-3/10 dark:bg-orange-3/20",
    },
    danger: {
        // light: red-2 (#ac2f33) / dark: red-5 (#fa999c=rgb(250,153,156))
        text: "text-red-2 dark:text-red-5",
        bg: "bg-red-3/10 dark:bg-red-3/20",
    },
};

// ── Icon color classes ───────────────────────────────────────────────────────
// No intent: $pt-icon-color = gray-1 (light) / $pt-dark-icon-color = gray-4 (dark)
//   = foreground-muted token
// With intent: same as text color (palette tier -2 light / tier -5 dark)
const ICON_COLOR: Record<CalloutIntent, string> = {
    none: "text-foreground-muted",
    primary: "text-blue-2 dark:text-blue-5",
    success: "text-green-2 dark:text-green-5",
    warning: "text-orange-2 dark:text-orange-5",
    danger: "text-red-2 dark:text-red-5",
};

export interface CalloutProps extends React.HTMLAttributes<HTMLDivElement> {
    /**
     * Visual intent / color scheme.
     * Sets text color, background tint, icon color, and the default icon glyph.
     * @default "none"
     */
    intent?: CalloutIntent;

    /**
     * Icon to render on the left side.
     * - Omit (undefined): shows the default intent icon (or no icon for intent="none").
     * - Pass a ReactNode: renders that element as the icon.
     * - Pass null: explicitly suppresses the icon even when intent is set.
     * @default undefined (auto by intent)
     */
    icon?: React.ReactNode | null;

    /**
     * Optional title text rendered as an h5 heading inside the callout.
     * Typography: 16px / 19px / 600 — mirrors Blueprint's H5 element.
     */
    title?: string;

    /**
     * Compact style: reduces padding from 16px → 8px.
     * @default false
     */
    compact?: boolean;

    /**
     * Minimal style: removes the background color fill.
     * @default false
     */
    minimal?: boolean;
}

/**
 * Pixel-faithful Blueprint Callout.
 *
 * Layout (mirrors Blueprint's `.bp6-callout` SCSS):
 *   - Base: `border-radius:4px; padding:16px; position:relative; width:100%;`
 *   - Non-minimal: `background-color: rgba(gray3, 0.15)` light / `rgba(gray3, 0.2)` dark.
 *   - With icon: `padding-left: 40px` (= 16+16+8); icon absolutely positioned `left:16; top:18`.
 *   - Compact: padding 8px; with icon `padding-left:32` (=8+16+8); icon `left:8; top:10`.
 *
 * Intent → default icon map:
 *   primary → info-sign | success → tick | warning → warning-sign | danger → error | none → (none)
 *
 * Intent text colors (light/dark):
 *   primary: blue2 / color-mix(blue3,white) | success: green2 / color-mix(green3,white)
 *   warning: orange2 / color-mix(orange3,white) | danger: red2 / color-mix(red3,white)
 *
 * @see https://blueprintjs.com/docs/#core/components/callout
 */
export const Callout = forwardRef<HTMLDivElement, CalloutProps>(function Callout(
    {
        className,
        intent = "none",
        icon: iconProp,
        title,
        compact = false,
        minimal = false,
        children,
        ...divProps
    },
    ref,
) {
    // Resolve the icon element to render:
    //   - iconProp=null → no icon
    //   - iconProp=undefined → default icon by intent (may be null for intent="none")
    //   - iconProp=ReactNode → use as-is
    let iconElement: React.ReactNode = null;
    let hasIcon = false;

    if (iconProp === null) {
        // Explicitly suppressed
        iconElement = null;
        hasIcon = false;
    } else if (iconProp !== undefined) {
        // Explicit custom element
        iconElement = iconProp;
        hasIcon = true;
    } else {
        // Auto: pick by intent
        const defaultIconName = DEFAULT_INTENT_ICONS[intent];
        if (defaultIconName !== null) {
            iconElement = (
                <Icon
                    icon={defaultIconName}
                    size={16}
                    aria-hidden
                    tabIndex={-1}
                    className={ICON_COLOR[intent]}
                />
            );
            hasIcon = true;
        }
    }

    const hasBodyContent = children != null && children !== false && children !== "";

    // ── Padding ──────────────────────────────────────────────────────────────
    // normal:  16px; with icon: 40px left (16+16+8)
    // compact:  8px; with icon: 32px left (8+16+8)
    const paddingBase = compact ? "p-2" : "p-4"; // 8px or 16px
    const paddingLeft = hasIcon
        ? compact
            ? "pl-8" // 32px
            : "pl-10" // 40px
        : undefined;

    // ── Icon position ─────────────────────────────────────────────────────────
    // normal:  left:16px (= padding), top:18px (= 16 + header-margin-top 2px)
    // compact: left:8px, top:10px (= 8 + 2)
    const iconLeft = compact ? "left-2" : "left-4"; // 8px or 16px
    const iconTop = compact ? "top-[10px]" : "top-[18px]";

    const { text: intentText, bg: intentBg } = CALLOUT_INTENT[intent];

    return (
        <div
            ref={ref}
            {...divProps}
            className={cn(
                // Base structure — mirrors .bp6-callout running-typography
                "relative w-full rounded-bp",
                // running-typography: font-size:14px, line-height:1.5
                "text-[14px] leading-[1.5]",
                // Non-minimal background: rgba(gray3, 0.15) light / rgba(gray3, 0.2) dark
                // gray3 = #8f99a8 = rgb(143,153,168)
                !minimal && "bg-[rgba(143,153,168,0.15)] dark:bg-[rgba(143,153,168,0.2)]",
                // Intent background (overrides base bg for intented non-minimal)
                !minimal && intent !== "none" && intentBg,
                // Intent text color (applies to ALL content: title, body, icon via inheritance)
                intent !== "none" && intentText,
                // Padding
                paddingBase,
                paddingLeft,
                className,
            )}
        >
            {/* Absolutely positioned icon (first child in Blueprint) */}
            {hasIcon && iconElement != null && (
                <span
                    className={cn(
                        "absolute inline-flex items-center justify-center",
                        iconLeft,
                        iconTop,
                        // Icon color: intent overrides text; no-intent uses foreground-muted
                        // (The Icon component itself carries the color class, but we add it
                        // here too as a wrapper fallback to match Blueprint's CSS structure)
                    )}
                    aria-hidden
                >
                    {typeof iconElement === "object" && iconElement !== null && "props" in (iconElement as object)
                        ? iconElement
                        : iconElement}
                </span>
            )}

            {/* Title — H5 typography: 16px/19px/600, margin-top:2px */}
            {title && (
                <h5
                    className={cn(
                        // H5 base: 16px font-size, 600 weight.
                        // Callout overrides line-height to 16px (= $pt-icon-size-standard),
                        // NOT the normal H5 line-height of 19px.
                        // margin-top: 2px (= $callout-header-margin-top = $pt-spacing * 0.5)
                        // margin-bottom: 0 normally; 4px (= $pt-spacing) when has body content.
                        "text-[16px] leading-[16px] font-semibold",
                        "mt-[2px]",
                        hasBodyContent ? "mb-[4px]" : "mb-0",
                        // Title inherits intent text color from parent; no extra color needed.
                    )}
                >
                    {title}
                </h5>
            )}

            {/* Body content */}
            {children}
        </div>
    );
});
