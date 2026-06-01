/**
 * ContextMenu — Blueprint v6.15 fidelity, modern Radix API.
 *
 * A right-click-triggered popup menu. Composes:
 *   - @radix-ui/react-context-menu for right-click trigger, portal, and cursor-position
 *   - Our Menu / MenuItem / MenuDivider components for the menu content
 *   - The same popover-surface styling as Popover (shadow-card-3, rounded-bp, bg-white)
 *
 * ## Architecture
 * ContextMenu uses Radix's ContextMenu primitive which handles:
 *   - Listening for the `contextmenu` event (right-click / long-press)
 *   - Positioning the floating menu at the cursor position
 *   - Portal rendering (content appears at document.body)
 *   - Focus trapping and keyboard navigation
 *
 * Consumers pass a `<Menu>` (with `<MenuItem>`/`<MenuDivider>`) as `content`.
 * The content is wrapped in the popover surface (bg, shadow, radius) and rendered
 * in a portal, dark-mode wrapped per the 4-rule portal+dark protocol.
 *
 * ## Portal + dark-mode (4 rules applied)
 * 1. Portal children are wrapped in `<div className={dark ? "dark" : ""} style={{pointerEvents:"none"}}>`.
 *    Radix portals to document.body outside the app's .dark ancestor, so without this wrapper
 *    dark utilities don't apply. The wrapper uses pointer-events:none; Content restores them.
 * 2. The surface div has `text-foreground` so portaled text picks up the correct dark color.
 * 3. Blueprint reference gallery passes `portalClassName={Classes.DARK}` when ?theme=dark.
 * 4. Surface uses `shadow-card-3` (not shadow-elevation-3) — card-3 has Blueprint's exact
 *    dark inset edge-highlight. In dark mode an extra ring: 0 0 0 1px rgb(94,95,97) is added
 *    (same as Popover's dark shadow override).
 *
 * ## Blueprint spec
 * - Surface: bg white (light) / dark-gray3 (dark), border-radius 4px, box-shadow = elevation-3
 * - No arrow (ContextMenu never has an arrow — positioned at cursor, not anchored to a target)
 * - Content: the Menu component — 4px padding, items 4px/8px, min-width 180px
 * - Placement: right-start (Blueprint default), opens at cursor position
 *
 * @see https://blueprintjs.com/docs/#core/components/context-menu
 * @see https://www.radix-ui.com/primitives/docs/components/context-menu
 */

import * as RadixContextMenu from "@radix-ui/react-context-menu";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { MenuItemSlotContext, type MenuItemSlotProps } from "./menu";

/**
 * Slot that renders a MenuItem's interactive element as a Radix ContextMenu.Item, so
 * Radix supplies roving focus, arrow-key navigation, typeahead, and Escape. Provided to
 * the consumer's `<Menu>`/`<MenuItem>` content via MenuItemSlotContext — consumers keep
 * authoring `content={<Menu><MenuItem/></Menu>}` unchanged.
 */
function RadixMenuItemSlot({
    className,
    disabled,
    textValue,
    onSelect,
    children,
    "data-compare": dataCompare,
}: MenuItemSlotProps) {
    return (
        <RadixContextMenu.Item
            className={className}
            disabled={disabled}
            textValue={textValue}
            onSelect={(event) => onSelect?.(event)}
            data-compare={dataCompare}
        >
            {children}
        </RadixContextMenu.Item>
    );
}

export interface ContextMenuProps {
    /**
     * The right-click-triggerable area. Wrap any element/component here to give
     * it a context menu. Use a div or any element that accepts mouse events.
     */
    children: ReactNode;

    /**
     * The menu content to show on right-click. Pass a `<Menu>` with `<MenuItem>`
     * and `<MenuDivider>` components. This is rendered inside the floating surface.
     *
     * @example
     * ```tsx
     * content={
     *   <Menu>
     *     <MenuItem icon="document" text="Open" />
     *     <MenuDivider />
     *     <MenuItem icon="trash" text="Delete" intent="danger" />
     *   </Menu>
     * }
     * ```
     */
    content: ReactNode;

    /**
     * Pass the app's dark state so the portaled context menu inherits dark mode.
     * Radix portals content to document.body (outside the app's .dark ancestor),
     * so we wrap portal children in a div with the dark class when this is true.
     * Obtain from DarkContext via useContext(DarkContext) in the gallery.
     */
    dark?: boolean;

    /**
     * When true, the context menu will not open on right-click.
     * @default false
     */
    disabled?: boolean;

    /**
     * Called when the open state changes.
     * Note: Radix ContextMenu is uncontrolled — it opens on right-click events only.
     * Use this callback to track open state externally.
     */
    onOpenChange?: (open: boolean) => void;

    /**
     * Whether pressing Escape closes the context menu.
     * Maps to Radix `onEscapeKeyDown`.
     * @default true
     */
    canEscapeKeyClose?: boolean;

    /** Additional class on the popover surface element. */
    className?: string;
}

/**
 * ContextMenu — right-click-triggered menu in a popover surface.
 *
 * The trigger area responds to right-click (contextmenu event). The menu
 * appears at the cursor position, portaled to document.body.
 *
 * @example
 * ```tsx
 * <ContextMenu
 *   dark={dark}
 *   content={
 *     <Menu>
 *       <MenuItem icon="document" text="Open file" />
 *       <MenuDivider />
 *       <MenuItem icon="trash" text="Delete" intent="danger" />
 *     </Menu>
 *   }
 * >
 *   <div className="p-8 border border-dashed">Right-click me</div>
 * </ContextMenu>
 * ```
 */
export function ContextMenu({
    children,
    content,
    dark = false,
    disabled = false,
    onOpenChange,
    canEscapeKeyClose = true,
    className,
}: ContextMenuProps) {
    return (
        <RadixContextMenu.Root onOpenChange={onOpenChange}>
            {/* Trigger wraps the right-clickable children.
                Radix listens for the contextmenu event and captures cursor position.
                When disabled, the Radix Trigger's disabled prop suppresses the menu.
                We render children directly (not asChild) so the trigger wraps them. */}
            <RadixContextMenu.Trigger
                disabled={disabled}
            >
                {children}
            </RadixContextMenu.Trigger>

            <RadixContextMenu.Portal>
                {/* Portal + dark-mode wrapper (Rule 1):
                    Wrap in .dark div so dark utilities apply to portaled content.
                    pointer-events:none prevents the wrapper from intercepting clicks;
                    Content restores pointer-events via the pointer-events-auto class. */}
                <div className={dark ? "dark" : ""} style={{ pointerEvents: "none" }}>
                    <RadixContextMenu.Content
                        className={cn(
                            // Restore pointer events (parent disables them)
                            "pointer-events-auto",
                            // Blueprint .bp6-context-menu-popover surface:
                            // Background: white (light) / dark-gray3 (dark)
                            // Applied on inner content div, not here — same as Popover
                            // border-radius: 4px ($pt-border-radius)
                            "rounded-bp",
                            // box-shadow: $pt-popover-box-shadow = $pt-elevation-shadow-3
                            // Use shadow-overlay-3 (same as Popover/Dialog — rgba(20,20,20) light
                            // hairline ring + Blueprint dark drop/highlight layer order).
                            "shadow-overlay-3",
                            // Dark mode: add the extra popover border ring (hsl(215,3%,38%) = rgb(94,96,100))
                            // Blueprint's $pt-dark-popover-box-shadow includes this 1px outset ring.
                            "dark:[box-shadow:rgb(94,96,100)_0px_0px_0px_1px,inset_rgba(255,255,255,0.2)_0px_0px_0px_1px,rgba(0,0,0,0.302)_0px_20px_25px_-5px,inset_rgba(255,255,255,0.302)_0px_0px_0.5px_0px,inset_rgba(255,255,255,0.078)_0px_0.5px_0px_0px,rgba(0,0,0,0.302)_0px_10px_30px_-5px]",
                            // z-index: above normal content (Blueprint $pt-z-index-overlay)
                            "z-[20]",
                            // Suppress Radix focus outline
                            "outline-none",
                            // Rule 2: Set text-foreground so portaled text picks up the correct dark color.
                            // Without this, portaled elements inherit <body>'s LIGHT foreground (dark-on-dark bug).
                            "text-foreground",
                            className,
                        )}
                        onEscapeKeyDown={
                            canEscapeKeyClose ? undefined : (e) => e.preventDefault()
                        }
                    >
                        {/* Surface background + border-radius (matches Popover content div).
                            Blueprint: .bp6-popover-content has bg-white dark:bg-dark-gray-3 and rounded-bp.
                            text-foreground again here so any text inside the surface gets the right color. */}
                        <div
                            className={cn(
                                // Background: white (light) / dark-gray3 (dark)
                                "bg-white dark:bg-dark-gray-3",
                                // Rule 2 (redundant belt+suspenders): text-foreground on the surface
                                "text-foreground",
                                // border-radius: 4px
                                "rounded-bp",
                            )}
                        >
                            {/* Inject the Radix item slot so the consumer's MenuItems
                                become Radix ContextMenu.Items (keyboard nav + typeahead). */}
                            <MenuItemSlotContext.Provider value={RadixMenuItemSlot}>
                                {content}
                            </MenuItemSlotContext.Provider>
                        </div>
                    </RadixContextMenu.Content>
                </div>
            </RadixContextMenu.Portal>
        </RadixContextMenu.Root>
    );
}

ContextMenu.displayName = "ContextMenu";
