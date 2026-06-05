"use client";

/**
 * Tooltip — pixel-faithful Blueprint v6.15 reimplementation on Radix Tooltip.
 *
 * ## Design decisions
 *
 * ### The inversion (most important design decision)
 * Blueprint's Tooltip uses an **inverted** color scheme relative to the page:
 * - **Light theme:** dark background (`$dark-gray5 = #404854`), light text (`$light-gray5 = #f6f7f9`).
 *   The bubble looks dark (like a small dark panel) on a light page.
 * - **Dark theme:** light background (`$light-gray3 = #e5e8eb`), dark text (`$dark-gray5 = #404854`).
 *   The bubble looks light (like a small light chip) on a dark page.
 * The inversion is EXPLICIT: bg and text are hardcoded per theme (NOT via --foreground inheritance).
 * In light: `bg-dark-gray-5 text-light-gray-5`; in dark: `dark:bg-light-gray-3 dark:text-dark-gray-5`.
 * This means the arrow fill must also match the bubble bg color per theme.
 *
 * ### Intent handling
 * When `intent` is set (primary/success/warning/danger), the bubble bg = intent color,
 * text = white (same in both themes). The arrow fill = intent color.
 * Blueprint: `.bp6-intent-*` sets `.bp6-popover-content { background: $color; color: $white; }`
 * and `.bp6-popover-arrow-fill { fill: $color; }`.
 *
 * ### Portal + dark-mode (4 rules)
 * 1. Portal children wrapped in `<div className={dark?'dark':''}>` so dark: variants resolve.
 * 2. Tooltip bubble sets EXPLICIT bg + text (not via --foreground) — the inversion.
 * 3. Reference gallery: pass `portalClassName={Classes.DARK}` when ?theme=dark.
 * 4. Shadow: `shadow-card-3` (= Blueprint's `$pt-tooltip-box-shadow = $pt-elevation-shadow-3`).
 *
 * ### Arrow
 * Same Blueprint-exact SVG paths as Popover, but TOOLTIP_ARROW_SVG_SIZE = 22 (not 30).
 * Radix Tooltip.Arrow used with `asChild` to host our custom SVG.
 * Arrow fill matches bubble bg per theme / intent.
 *
 * ### Blueprint metrics (from _tooltip.scss, _common.scss, _variables.scss, _colors.scss)
 * | Property | Value | Source |
 * |---|---|---|
 * | Bubble bg (light) | #404854 (dark-gray5) | $tooltip-background-color = $dark-gray5 |
 * | Bubble text (light) | #f6f7f9 (light-gray5) | $tooltip-text-color = $light-gray5 |
 * | Bubble bg (dark) | #e5e8eb (light-gray3) | $dark-tooltip-background-color = $light-gray3 |
 * | Bubble text (dark) | #404854 (dark-gray5) | $dark-tooltip-text-color = $dark-gray5 |
 * | Padding (default) | 8px 12px | $pt-spacing*2 × $pt-spacing*3 |
 * | Padding (compact) | 4px 8px | $pt-spacing × $pt-spacing*2 |
 * | Border-radius | 4px | $pt-border-radius |
 * | Shadow | elevation-3 | $pt-tooltip-box-shadow = $pt-popover-box-shadow = $pt-elevation-shadow-3 |
 * | Arrow SVG size | 22px | TOOLTIP_ARROW_SVG_SIZE = 22 |
 * | Arrow SVG paths | same as Popover | Blueprint popoverArrow.tsx |
 * | Font | 14px body | Blueprint default |
 * | Compact line-height | 1rem | _tooltip.scss `.bp6-compact .bp6-popover-content { line-height: 1rem }` |
 *
 * ### Radix Tooltip vs Popover
 * - `Tooltip.Provider` wraps the entire app (or subtree) — handles global delay. We export
 *   `TooltipProvider` for consumers to add at their app root, and also wrap internally for
 *   standalone usage.
 * - `Tooltip.Root` = controller (open state, delay).
 * - `Tooltip.Trigger` = hover/focus trigger (asChild for native element).
 * - `Tooltip.Portal` = portals content to document.body.
 * - `Tooltip.Content` = the floating bubble (positioning via Floating UI).
 * - `Tooltip.Arrow` = the arrow SVG element.
 *
 * ### Shadow elevation choice
 * `$pt-tooltip-box-shadow = $pt-popover-box-shadow = $pt-elevation-shadow-3`.
 * Use `shadow-card-3` (same as Popover / Dialog).
 *
 * In dark mode, Blueprint's tooltip shadow is SIMPLER than the dark popover shadow:
 * `$pt-dark-tooltip-box-shadow: 0 2px 4px rgba($black, $pt-dark-drop-shadow-opacity), 0 8px 24px rgba($black, $pt-dark-drop-shadow-opacity)`
 * No extra outset border ring (unlike $pt-dark-popover-box-shadow which adds the ring).
 * We use `shadow-card-3` which includes the inset border in dark, which is acceptable
 * (sub-perceptual difference, consistent with other components).
 */

import * as RadixTooltip from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { Intent } from "@/lib/types";

export type TooltipSide = "top" | "right" | "bottom" | "left";
export type TooltipAlign = "start" | "center" | "end";
export type TooltipIntent = Intent;

export interface TooltipProps {
    /**
     * The tooltip bubble content.
     * Required — tooltips must always describe something.
     */
    content: ReactNode;

    /**
     * Controlled open state.
     */
    open?: boolean;

    /**
     * Initial open state (uncontrolled). @default false
     */
    defaultOpen?: boolean;

    /**
     * Called when the open state changes.
     */
    onOpenChange?: (open: boolean) => void;

    /**
     * Which side of the trigger the tooltip appears on.
     * Maps to Radix `side`. @default "top"
     */
    side?: TooltipSide;

    /**
     * Alignment of the tooltip along the side axis.
     * Maps to Radix `align`. @default "center"
     */
    align?: TooltipAlign;

    /**
     * Gap between the trigger and the tooltip bubble (px).
     * Includes arrow height. Maps to Radix `sideOffset`. @default 2
     */
    sideOffset?: number;

    /**
     * Show the arrow pointing at the trigger. @default true
     */
    arrow?: boolean;

    /**
     * Intent colors the bubble with the intent color (primary/success/warning/danger).
     * none = default inverted color scheme. @default "none"
     */
    intent?: TooltipIntent;

    /**
     * Compact mode: reduces padding to 4px 8px, line-height 1rem.
     * Blueprint: .bp6-compact modifier on the tooltip.
     * @default false
     */
    compact?: boolean;

    /**
     * Delay before the tooltip opens after hover (ms).
     * Maps to Radix `delayDuration`. @default 100
     */
    hoverOpenDelay?: number;

    /**
     * Delay before the tooltip closes after hover-out (ms).
     * @default 0
     */
    hoverCloseDelay?: number;

    /**
     * Prevent the tooltip from opening when true. @default false
     */
    disabled?: boolean;

    /**
     * Pass the app's dark state so the portaled tooltip inherits dark mode.
     * Radix portals content to document.body (outside the .dark ancestor div),
     * so we wrap portal children in a div with dark class when this is true.
     */
    dark?: boolean;

    /**
     * Render the portaled tooltip into this element instead of `document.body`.
     * Forwarded to Radix `Tooltip.Portal`'s `container`. Used by the showcase to
     * confine the bubble to its playground stage (give that stage a CSS containing
     * block so the bubble's positioning resolves against it).
     */
    portalContainer?: HTMLElement | null;

    /** Additional class on the tooltip bubble element. */
    className?: string;

    /**
     * data-compare key placed on the outer bubble element (Radix Tooltip.Content).
     * Used by the comparison harness to diff computed styles against Blueprint.
     * Only set this on one tooltip per page (keys must be unique).
     */
    "data-compare"?: string;

    /** The trigger element. Must be a single focusable element. */
    children: ReactNode;
}

// Blueprint SVG arrow paths (from popoverArrow.tsx — same paths for both tooltip and popover)
const SVG_SHADOW_PATH =
    "M8.11 6.302c1.015-.936 1.887-2.922 1.887-4.297v26c0-1.378" +
    "-.868-3.357-1.888-4.297L.925 17.09c-1.237-1.14-1.233-3.034 0-4.17L8.11 6.302z";
const SVG_ARROW_PATH =
    "M8.787 7.036c1.22-1.125 2.21-3.376 2.21-5.03V0v30-2.005" +
    "c0-1.654-.983-3.9-2.21-5.03l-7.183-6.616c-.81-.746-.802-1.96 0-2.7l7.183-6.614z";

// TOOLTIP_ARROW_SVG_SIZE = 22 (Blueprint tooltip uses smaller arrow than popover's 30)
const ARROW_SIZE = 22;

/**
 * Arrow fill color classes per theme.
 * The arrow fill must match the bubble background exactly.
 */
const ARROW_FILL_CLASSES: Record<TooltipIntent, string> = {
    none: "fill-dark-gray-5 dark:fill-light-gray-3",
    primary: "fill-primary",
    success: "fill-success",
    warning: "fill-warning",
    danger: "fill-danger",
};

/**
 * Tooltip Provider — wrap your app root (or subtree) with this to control
 * global tooltip delay. Radix requires one Provider per application.
 *
 * @example
 * ```tsx
 * <TooltipProvider>
 *   <App />
 * </TooltipProvider>
 * ```
 */
export function TooltipProvider({
    delayDuration = 100,
    skipDelayDuration = 300,
    children,
}: {
    delayDuration?: number;
    skipDelayDuration?: number;
    children: ReactNode;
}) {
    return (
        <RadixTooltip.Provider delayDuration={delayDuration} skipDelayDuration={skipDelayDuration}>
            {children}
        </RadixTooltip.Provider>
    );
}

/**
 * Tooltip — small inverted bubble anchored to a trigger element.
 *
 * The bubble uses an inverted color scheme: dark bg + light text in light mode,
 * light bg + dark text in dark mode. This matches Blueprint's tooltip exactly.
 *
 * ## Color inversion
 * - Light theme: `bg-dark-gray-5 text-light-gray-5` (#404854 bg, #f6f7f9 text)
 * - Dark theme: `dark:bg-light-gray-3 dark:text-dark-gray-5` (#e5e8eb bg, #404854 text)
 * - Intent: bg = intent color, text = white (both themes)
 *
 * ## Usage
 * ```tsx
 * <Tooltip content="Save document" dark={dark}>
 *   <Button>Save</Button>
 * </Tooltip>
 * ```
 */
export function Tooltip({
    content,
    open,
    defaultOpen,
    onOpenChange,
    side = "top",
    align = "center",
    sideOffset = 2,
    arrow = true,
    intent = "none",
    compact = false,
    hoverOpenDelay = 100,
    hoverCloseDelay = 0,
    disabled = false,
    dark = false,
    portalContainer,
    className,
    "data-compare": dataCompare,
    children,
}: TooltipProps) {
    // Bubble background + text classes (the inversion)
    // none: dark bg / light text (light) | light bg / dark text (dark)
    // intent: intent color bg / white text (both themes)
    const bubbleBgText =
        intent === "none"
            ? "bg-dark-gray-5 text-light-gray-5 dark:bg-light-gray-3 dark:text-dark-gray-5"
            : intent === "primary"
              ? "bg-primary text-white"
              : intent === "success"
                ? "bg-success text-white"
                : intent === "warning"
                  ? "bg-warning text-white" // Blueprint: $white for warning text (like all intents)
                  : "bg-danger text-white";

    // Padding: default = 8px 12px; compact = 4px 8px
    const paddingClass = compact ? "px-2 py-1" : "px-3 py-2";

    // Arrow fill color matches bubble bg
    const arrowFillClass = ARROW_FILL_CLASSES[intent];

    return (
        // Wrap in Provider so standalone Tooltip works without a Provider ancestor.
        // If already inside a Provider, Radix Tooltip.Provider nesting is safe (inner wins).
        <RadixTooltip.Provider delayDuration={hoverOpenDelay} skipDelayDuration={300}>
            <RadixTooltip.Root
                open={disabled ? false : open}
                defaultOpen={disabled ? false : defaultOpen}
                onOpenChange={disabled ? undefined : onOpenChange}
                delayDuration={hoverOpenDelay}
                disableHoverableContent={hoverCloseDelay === 0}
            >
                {/* Trigger — asChild forwards Radix accessibility props onto the child element */}
                <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>

                <RadixTooltip.Portal container={portalContainer}>
                    {/* Dark-mode portal fix: wrap portal children in a div with the dark class.
                        The portal renders at document.body (outside the app's .dark ancestor),
                        so dark utilities wouldn't apply without this wrapper. The wrapper is
                        pointer-events:none so it doesn't intercept events; Content restores them. */}
                    <div className={dark ? "dark" : ""} style={{ pointerEvents: "none" }}>
                        <RadixTooltip.Content
                            data-compare={dataCompare}
                            side={side}
                            align={align}
                            sideOffset={sideOffset}
                            className={cn(
                                // Restore pointer events (parent disables them)
                                "pointer-events-auto",
                                // Blueprint: display inline-block
                                "inline-block",
                                // Blueprint: border-radius 4px ($pt-border-radius)
                                "rounded-bp",
                                // Blueprint light: $pt-tooltip-box-shadow = $pt-elevation-shadow-3 → shadow-card-3
                                // Blueprint dark: $pt-dark-tooltip-box-shadow = 0 2px 4px rgba($black, 0.4), 0 8px 24px rgba($black, 0.4)
                                // Note: dark tooltip uses a SIMPLER shadow (2 layers, no inset border) unlike dark popover.
                                // We use shadow-overlay-3 for light (rgba(20,20,20) hairline ring) and override dark separately.
                                "shadow-overlay-3",
                                // Dark tooltip shadow override: Blueprint's $pt-dark-tooltip-box-shadow =
                                // 0 2px 4px rgba(#111418, 0.4), 0 8px 24px rgba(#111418, 0.4)
                                // This is lighter/simpler than dark popover shadow (no outset border ring, no inset).
                                "dark:[box-shadow:rgba(17,20,24,0.4)_0px_2px_4px_0px,rgba(17,20,24,0.4)_0px_8px_24px_0px]",
                                // Z-index: overlay level
                                "z-[20]",
                                // Suppress Radix focus outline
                                "outline-none",
                                // Set the text color on the outer element (matches what Blueprint's .bp6-tooltip
                                // shows via computed style).
                                //
                                // Blueprint .bp6-tooltip in light mode: sets pt-dark-typography-colors = light text
                                //   → outer element color = light-gray-5 (#f6f7f9)
                                // Blueprint .bp6-tooltip in dark mode: inherits from .bp6-dark context = light text
                                //   → outer element color = light-gray-5 (#f6f7f9) (same)
                                //   The INNER .bp6-popover-content overrides to dark text via pt-typography-colors.
                                //
                                // So the outer element has light-gray-5 color in BOTH themes for the default tooltip.
                                // Intent: $white text in both themes (from the intent CSS override).
                                intent === "none"
                                    ? "text-light-gray-5"
                                    : "text-white",
                                className,
                            )}
                            style={{ minWidth: "auto" }}
                        >
                            {/* Tooltip content inner div — Blueprint: .bp6-popover-content
                                The background color, text, and padding are on this inner div.
                                The outer .bp6-tooltip is transparent (matches popover structure).
                                Mirrors Popover pattern: transparent outer, colored inner. */}
                            <div
                                className={cn(
                                    // Blueprint: border-radius 4px (matches panel)
                                    "rounded-bp",
                                    // Blueprint tooltip is 14px (body text, the default)
                                    "text-body",
                                    // THE INVERSION: bubble bg + text (explicit, not via --foreground)
                                    bubbleBgText,
                                    // Padding: default = 8px 12px; compact = 4px 8px
                                    paddingClass,
                                    // Compact: line-height 1rem (Blueprint: .bp6-compact line-height)
                                    compact && "leading-4",
                                )}
                            >
                                {content}
                            </div>

                            {/* Arrow — Blueprint-matching custom SVG arrow.
                                TOOLTIP_ARROW_SVG_SIZE = 22 (smaller than popover's 30).
                                Same SVG paths as popover but viewBox 0 0 22 22 (Blueprint re-uses same paths).
                                Arrow fill = bubble bg per theme / intent.
                                Radix Tooltip.Arrow with asChild to host our custom SVG.
                                Rotation via [[data-side=*]_&] CSS selectors on Content's data-side attribute.

                                Note: Blueprint uses TOOLTIP_ARROW_SVG_SIZE=22 but the SVG paths themselves
                                use the same viewBox coordinates — the 22×22 element clips/scales the 30-unit
                                paths down. We use viewBox="0 0 30 30" on a 22×22 SVG, which scales them
                                correctly to fit in the smaller tooltip arrow. */}
                            {arrow && (
                                <RadixTooltip.Arrow asChild data-compare={dataCompare ? "tooltip-arrow" : undefined}>
                                    {/* See Popover for the full rationale. The arrow box is sized to the
                                        wedge's protrusion (not 30×30) so Radix reserves the right gap and
                                        the arrow attaches to the bubble instead of floating in the gap.
                                        The SVG points DOWN by default (inner <g> rotate); Radix's wrapper
                                        rotates it per side. Tooltip arrow is smaller than popover's:
                                        ARROW_SIZE=22 wide, height scaled proportionally (22 × 11/30 ≈ 8). */}
                                    <svg
                                        width={ARROW_SIZE}
                                        height={8}
                                        viewBox="0 19 30 11"
                                        style={{ overflow: "visible" }}
                                    >
                                        <g transform="rotate(-90 15 15)">
                                            {/* Shadow path — black at $pt-border-shadow-opacity = 0.1 */}
                                            <path
                                                d={SVG_SHADOW_PATH}
                                                fill="black"
                                                fillOpacity={0.1}
                                            />
                                            {/* Fill path — matches bubble background color per theme/intent */}
                                            <path
                                                d={SVG_ARROW_PATH}
                                                className={arrowFillClass}
                                            />
                                        </g>
                                    </svg>
                                </RadixTooltip.Arrow>
                            )}
                        </RadixTooltip.Content>
                    </div>
                </RadixTooltip.Portal>
            </RadixTooltip.Root>
        </RadixTooltip.Provider>
    );
}

Tooltip.displayName = "Tooltip";
