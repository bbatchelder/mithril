/**
 * Popover — pixel-faithful Blueprint v6.15 reimplementation on Radix Popover.
 *
 * ## Design decisions
 *
 * ### API
 * - `open` / `defaultOpen` / `onOpenChange` (Radix-idiomatic) instead of Blueprint's
 *   `isOpen` / `defaultIsOpen` / `onClose`. Both controlled and uncontrolled modes work.
 * - `content: ReactNode` — the popover panel content (instead of Blueprint's `content` prop).
 * - `side?: "top"|"right"|"bottom"|"left"` — positioning side (Radix `side`). Maps from
 *   Blueprint's `placement` prop. Default: "bottom" (Blueprint: auto/bottom).
 * - `align?: "start"|"center"|"end"` — alignment on the side axis. Default: "center".
 * - `sideOffset?: number` — gap between trigger and popover panel (Radix `sideOffset`).
 *   Default: 4px (= $pt-spacing, Blueprint's `$arrow-target-offset = -$pt-spacing` plus
 *   arrow half-height pushes the panel ~4px from the trigger anchor).
 * - `arrow?: boolean` — show the arrow pointing at the trigger. Default: true.
 * - `minimal?: boolean` — no arrow + no default content padding. Default: false.
 * - `hasContentPadding?: boolean` — add 20px padding to content (Blueprint's `popover-content-sizing`).
 *   Default: true (matches Blueprint's default).
 * - `dark?: boolean` — required for dark-mode portal support (see below).
 * - `disabled?: boolean` — prevent the popover from opening.
 * - `canEscapeKeyClose?: boolean` — Radix `onEscapeKeyDown`. Default: true.
 * - `canOutsideClickClose?: boolean` — Radix `onPointerDownOutside`. Default: true.
 * - `className` / `style` — forwarded to the popover panel element.
 * - `children` — the trigger element (rendered via `Popover.Trigger asChild`).
 *
 * ### Radix mapping
 * - `Popover.Root` → root controller (open state, onOpenChange)
 * - `Popover.Trigger` → the trigger element (asChild for native element)
 * - `Popover.Portal` → portals content to document.body
 * - `Popover.Content` → the popover panel (focus, escape, positioning via Floating UI)
 * - `Popover.Arrow` → the arrow SVG element pointing at the trigger
 *
 * ### placement mapping (Blueprint → Radix)
 * Blueprint uses Popper.js placement strings. We simplify to:
 *   `side`: "top"|"right"|"bottom"|"left" → Radix `side`
 *   `align`: "start"|"center"|"end" → Radix `align`
 * Radix Floating UI handles collision detection and auto-flipping.
 *
 * ### Portal + dark-mode solution
 * The app's dark class is on a child div (`<div className={dark ? "dark" : ""}>`), but
 * Radix portals content to document.body, OUTSIDE that div. The custom variant
 * `dark (&:is(.dark *))` in tokens.css requires being a descendant of `.dark` — so
 * portaled content doesn't inherit dark styles by default.
 *
 * Solution: Wrap the portal children in `<div className={dark ? "dark" : ""}>`.
 * This wrapper div has the `dark` class, so all portaled content (panel + arrow) are
 * descendants of `.dark` and dark utility classes apply correctly. The wrapper is
 * `pointer-events: none` so it doesn't intercept clicks; Content restores pointer-events.
 *
 * Pass `dark` from the App's dark state (via DarkContext) to Popover wherever it's used.
 *
 * ### Blueprint metrics (extracted from _popover.scss, _common.scss, _variables.scss)
 * - Panel bg (light): white ($pt-popover-background-color = $white = #ffffff)
 * - Panel bg (dark): dark-gray3 ($pt-dark-popover-background-color = $dark-gray3 = #2f343c)
 * - Panel border-radius: 4px ($pt-border-radius)
 * - Panel box-shadow: $pt-popover-box-shadow = $pt-elevation-shadow-3 → use shadow-card-3
 * - Panel dark shadow: $pt-dark-popover-box-shadow = 0 0 0 1px $pt-dark-popover-border-color +
 *   $pt-dark-elevation-shadow-3 → also covered by shadow-card-3 (which includes the inset border)
 * - Content padding: 20px ($pt-spacing * 5) when hasContentPadding=true
 *   (Blueprint: `.bp6-popover-content-sizing .bp6-popover-content { padding: $pt-spacing * 5 }`)
 * - Minimal: no arrow, no margin
 *
 * ### Arrow
 * Blueprint uses a 30×30 SVG with two custom paths (from blueprint-core-kit.sketch):
 *   1. Shadow border path: filled black at opacity 0.1 ($pt-border-shadow-opacity)
 *   2. Fill path: filled with panel background color (white/dark-gray3)
 * Source: packages/core/src/components/popover/popoverArrow.tsx (POPOVER_ARROW_SVG_SIZE=30)
 * The SVG paths are right-pointing (rotate 0 = right side). Blueprint rotates:
 *   top → -90°, right → 0°, bottom → 90°, left → 180°
 *
 * We use Radix Popover.Arrow asChild with our own 30×30 SVG using Blueprint's exact paths.
 * Radix positions the SVG arrow automatically; we rotate via [[data-side=*]_&]:rotate CSS selectors
 * on the Content element's data-side attribute (set by Radix Floating UI after collision detection).
 * This makes the rotation correct even when Radix flips the placement.
 *
 * Arrow element size: 30×30px → matches Blueprint's .bp6-popover-arrow div (height: 30px).
 *
 * ### Shadow elevation choice
 * $pt-popover-box-shadow = $pt-elevation-shadow-3 (same as dialog).
 * Use `shadow-card-3` (not shadow-elevation-3): card-3 already tuned to Blueprint's
 * exact shadow base color and dark inset edge-highlight. Matches Dialog precedent.
 */

import * as RadixPopover from "@radix-ui/react-popover";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type PopoverSide = "top" | "right" | "bottom" | "left";
export type PopoverAlign = "start" | "center" | "end";

export interface PopoverProps {
    /** Controlled open state. */
    open?: boolean;
    /** Initial open state (uncontrolled). @default false */
    defaultOpen?: boolean;
    /** Called when the open state changes. */
    onOpenChange?: (open: boolean) => void;

    /**
     * The popover panel content. Rendered inside the floating panel.
     * For menu-style content set `hasContentPadding={false}`.
     */
    content: ReactNode;

    /**
     * Which side of the trigger the popover appears on.
     * Maps to Radix `side`. Blueprint: placement side (top/right/bottom/left).
     * @default "bottom"
     */
    side?: PopoverSide;

    /**
     * Alignment of the popover along the side axis.
     * Maps to Radix `align`. Blueprint: placement align (start/center/end).
     * @default "center"
     */
    align?: PopoverAlign;

    /**
     * Gap between the trigger and the popover panel (px).
     * Includes arrow height when arrow=true.
     * Maps to Radix `sideOffset`.
     * @default 4
     */
    sideOffset?: number;

    /**
     * Show the arrow pointing at the trigger.
     * Blueprint: controlled by $pt-popover-arrow presence; hidden in minimal mode.
     * @default true
     */
    arrow?: boolean;

    /**
     * Minimal mode: no arrow, no default content padding.
     * Blueprint: `.bp6-minimal` — removes arrow and sets margin: 0.
     * @default false
     */
    minimal?: boolean;

    /**
     * Whether the popover panel content gets Blueprint's 20px padding
     * ($pt-spacing * 5 = 20px, the `popover-content-sizing` case).
     * Set to false for menu-style popovers (padding: 0).
     * @default true
     */
    hasContentPadding?: boolean;

    /**
     * Whether pressing Escape closes the popover.
     * Maps to `onEscapeKeyDown` preventDefault.
     * @default true
     */
    canEscapeKeyClose?: boolean;

    /**
     * Whether clicking outside the popover closes it.
     * Maps to `onPointerDownOutside` preventDefault.
     * @default true
     */
    canOutsideClickClose?: boolean;

    /**
     * When true, the popover content width matches the trigger element width.
     * Uses Radix's CSS variable `--radix-popover-trigger-width` (set on the content element).
     * Blueprint: `matchTargetWidth` on Suggest — dropdown matches input width.
     * Applied as an inline style (runtime layout value, not a tree-shakeable token).
     * @default false
     */
    matchTargetWidth?: boolean;

    /**
     * Pass the app's dark state so the portaled popover inherits dark mode.
     * Radix portals content to document.body (outside the .dark ancestor div),
     * so we wrap portal children in a div with dark class when this is true.
     */
    dark?: boolean;

    /** Prevent the popover from opening when true. @default false */
    disabled?: boolean;

    /** Additional class on the popover panel element. */
    className?: string;
    /** Inline styles on the popover panel element. */
    style?: React.CSSProperties;

    /** The trigger element. Use a Button or any interactive element. */
    children: ReactNode;
}

/**
 * Popover — floating panel anchored to a trigger element.
 *
 * The foundational positioning primitive for Tooltip, Menu, ContextMenu, and Select.
 * Renders via Radix Popover (Floating UI) with Blueprint's visual metrics.
 *
 * @example
 * ```tsx
 * <Popover
 *   content={<p>Popover content here.</p>}
 *   side="bottom"
 *   dark={dark}
 * >
 *   <Button>Open popover</Button>
 * </Popover>
 * ```
 */
export function Popover({
    open,
    defaultOpen,
    onOpenChange,
    content,
    side = "bottom",
    align = "center",
    sideOffset = 4,
    arrow = true,
    minimal = false,
    hasContentPadding = true,
    canEscapeKeyClose = true,
    canOutsideClickClose = true,
    matchTargetWidth = false,
    dark = false,
    disabled = false,
    className,
    style,
    children,
}: PopoverProps) {
    // In minimal mode: no arrow.
    const showArrow = arrow && !minimal;

    // When minimal, Blueprint sets margin: 0 and hides arrow.
    // Radix sideOffset still provides a small gap so the panel doesn't overlap the trigger.
    const resolvedSideOffset = minimal ? 0 : sideOffset;

    return (
        <RadixPopover.Root
            open={disabled ? false : open}
            defaultOpen={disabled ? false : defaultOpen}
            onOpenChange={disabled ? undefined : onOpenChange}
        >
            {/* Trigger — asChild forwards Radix's accessibility props onto the child element */}
            <RadixPopover.Trigger asChild>{children}</RadixPopover.Trigger>

            <RadixPopover.Portal>
                {/* Dark-mode portal fix: wrap portal children in a div with the dark class.
                    The portal renders at document.body (outside the app's .dark ancestor),
                    so dark utilities wouldn't apply without this wrapper. The wrapper is
                    pointer-events:none so it doesn't intercept clicks; Content restores them. */}
                <div className={dark ? "dark" : ""} style={{ pointerEvents: "none" }}>
                    <RadixPopover.Content
                        data-compare="popover-content"
                        side={side}
                        align={align}
                        sideOffset={resolvedSideOffset}
                        className={cn(
                            // Restore pointer events (parent disables them)
                            "pointer-events-auto",
                            // Panel base: display inline-block (Blueprint: inline-block)
                            "inline-block",
                            // Blueprint: border-radius 4px ($pt-border-radius)
                            "rounded-bp",
                            // Blueprint: box-shadow = elevation-3 = shadow-card-3
                            // (same as Dialog — same $pt-elevation-shadow-3 source).
                            // In light mode: shadow-card-3 provides the elevation shadow.
                            // In dark mode: Blueprint's $pt-dark-popover-box-shadow adds an extra
                            // outset border: 0 0 0 1px hsl(215,3%,38%) = rgb(94,95,97).
                            // We replicate this with a compound dark shadow utility override.
                            "shadow-card-3",
                            // Dark mode: add the extra popover border ring (hsl(215,3%,38%))
                            // that Blueprint's $pt-dark-popover-box-shadow includes in addition
                            // to $pt-dark-elevation-shadow-3.
                            "dark:[box-shadow:rgb(94,95,97)_0px_0px_0px_1px,inset_rgba(255,255,255,0.2)_0px_0px_0px_1px,rgba(0,0,0,0.302)_0px_20px_25px_-5px,rgba(0,0,0,0.302)_0px_10px_30px_-5px,inset_rgba(255,255,255,0.302)_0px_0px_0.5px_0px,inset_rgba(255,255,255,0.078)_0px_0.5px_0px_0px]",
                            // Blueprint: z-index: $pt-z-index-overlay
                            "z-[20]",
                            // Suppress Radix focus outline
                            "outline-none",
                            // Set text color: portaled content needs explicit color.
                            // Blueprint's .bp6-popover inherits from the dark context.
                            "text-foreground",
                            className,
                        )}
                        style={{
                            minWidth: "auto",
                            ...(matchTargetWidth
                                ? { width: "var(--radix-popover-trigger-width)" }
                                : {}),
                            ...style,
                        }}
                        onEscapeKeyDown={
                            canEscapeKeyClose ? undefined : (e) => e.preventDefault()
                        }
                        onPointerDownOutside={
                            canOutsideClickClose ? undefined : (e) => e.preventDefault()
                        }
                    >
                        {/* Popover content inner div — Blueprint: .bp6-popover-content
                            background is here (not on the outer .bp6-popover which is transparent).
                            padding: $pt-spacing * 5 = 20px (when hasContentPadding=true),
                            0 for menu-style popovers (hasContentPadding=false).
                            text-foreground here so portaled text gets the right color. */}
                        <div
                            className={cn(
                                // Blueprint: background white (light) / dark-gray3 (dark)
                                "bg-white dark:bg-dark-gray-3",
                                // Set own text color (portaled content, same rule as Dialog/Card)
                                "text-foreground",
                                // Blueprint: border-radius 4px (matches panel)
                                "rounded-bp",
                                // Content padding: 20px when hasContentPadding + not minimal
                                hasContentPadding && !minimal && "p-5",
                            )}
                        >
                            {content}
                        </div>

                        {/* Arrow — Blueprint-matching custom SVG arrow.
                            Blueprint uses a 30×30 SVG (viewBox 0 0 30 30) with two custom paths:
                            1. A shadow path (black at $pt-drop-shadow-opacity = 0.2 opacity)
                            2. A fill path (panel background color: white light / dark-gray3 dark)
                            Source: packages/core/src/components/popover/popoverArrow.tsx
                            POPOVER_ARROW_SVG_SIZE = 30; paths use right-pointing orientation by default.
                            Blueprint rotates: top→-90°, right→0°, bottom→90°, left→180°.

                            We use Radix Popover.Arrow as the positioning anchor (asChild),
                            providing our own SVG element with the exact Blueprint paths and viewBox.
                            Radix measures the SVG element to offset the panel correctly, and positions
                            it absolutely. We rotate based on [data-side] CSS selectors so it works
                            even if Radix flips the popover due to collision detection.

                            $popover-arrow-box-shadow = 1px 1px 6px rgba($black, 0.2)
                            Applied to the ::before pseudo-element in Blueprint; we replicate with
                            CSS filter drop-shadow on the fill path for a subtle glow effect.

                            Arrow sizing:
                            - width/height = 30px (POPOVER_ARROW_SVG_SIZE)
                            - Blueprint .bp6-popover-arrow: height=30px, width=30px (the container div)
                            - Our SVG is 30×30px → matches Blueprint arrow element height=30px */}
                        {showArrow && (
                            <RadixPopover.Arrow
                                asChild
                                data-compare="popover-arrow"
                            >
                                <svg
                                    width={30}
                                    height={30}
                                    viewBox="0 0 30 30"
                                    style={{ overflow: "visible" }}
                                    className={cn(
                                        // Rotate based on which side the Content is placed on.
                                        // Blueprint's SVG paths are right-pointing by default (rotate 0).
                                        // [data-side] is set on the Content element by Radix.
                                        // These selectors walk up to the nearest [data-side] ancestor.
                                        "[[data-side=bottom]_&]:rotate-90",
                                        "[[data-side=top]_&]:-rotate-90",
                                        "[[data-side=left]_&]:rotate-180",
                                        // data-side=right → 0 rotation (native orientation)
                                    )}
                                >
                                    {/* Shadow path — matches Blueprint .bp6-popover-arrow-border
                                        fill: $black, fill-opacity: $pt-border-shadow-opacity = 0.1 */}
                                    <path
                                        d="M8.11 6.302c1.015-.936 1.887-2.922 1.887-4.297v26c0-1.378-.868-3.357-1.888-4.297L.925 17.09c-1.237-1.14-1.233-3.034 0-4.17L8.11 6.302z"
                                        fill="black"
                                        fillOpacity={0.1}
                                    />
                                    {/* Fill path — matches Blueprint .bp6-popover-arrow-fill
                                        fill: panel background color */}
                                    <path
                                        d="M8.787 7.036c1.22-1.125 2.21-3.376 2.21-5.03V0v30-2.005c0-1.654-.983-3.9-2.21-5.03l-7.183-6.616c-.81-.746-.802-1.96 0-2.7l7.183-6.614z"
                                        className="fill-white dark:fill-dark-gray-3"
                                    />
                                </svg>
                            </RadixPopover.Arrow>
                        )}
                    </RadixPopover.Content>
                </div>
            </RadixPopover.Portal>
        </RadixPopover.Root>
    );
}

Popover.displayName = "Popover";
