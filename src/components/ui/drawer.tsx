/**
 * Drawer — pixel-faithful Blueprint v6.15 reimplementation on Radix Dialog.
 *
 * ## What Drawer is
 * Drawer is an overlay (backdrop + panel) where the panel is anchored to a screen edge
 * instead of centered. Blueprint implements it via Overlay2 + a panel div. We reuse
 * the @radix-ui/react-dialog portal/overlay/focus-trap/escape/scroll-lock machinery
 * (same as Dialog), but position the panel at the edge instead of center.
 *
 * ## Design decisions
 *
 * ### API (modern, not drop-in with Blueprint)
 * - `open` / `defaultOpen` / `onOpenChange` — Radix-idiomatic.
 * - `position?: "left"|"right"|"top"|"bottom"` — panel edge. @default "right"
 * - `size?: number|string` — width (left/right) or height (top/bottom). @default "50%"
 *   (= DrawerSize.STANDARD). Accept inline style value (string or number).
 * - `title?` — when provided, renders the drawer header.
 * - `icon?` — icon in the header before the title (use `<Icon>`).
 * - `closeButton?` — show close button. @default true
 * - `canEscapeKeyClose?` — @default true
 * - `canOutsideClickClose?` — @default true
 * - `dark` — from DarkContext; required for portal dark-mode.
 * - `className` / `style` — forwarded to the drawer panel.
 * - `children` — panel content (use DrawerBody / DrawerFooter).
 *
 * ### Portal + dark-mode solution (same as Dialog/Alert)
 * Wrap Radix Portal children in `<div className={dark ? "dark" : ""}
 * style={{ pointerEvents: "none" }}>`. The panel sets `text-foreground` explicitly.
 *
 * ### Position/size
 * The panel is `position: fixed` anchored to the given edge, spanning the full
 * perpendicular dimension:
 *   right:  top:0; bottom:0; right:0; width:<size>
 *   left:   top:0; bottom:0; left:0;  width:<size>
 *   top:    top:0; left:0; right:0;   height:<size>
 *   bottom: bottom:0; left:0; right:0; height:<size>
 *
 * Position classes use literal Tailwind utilities (fixed edge classes).
 * Size is dynamic (user-provided number/string) — set via inline style={...},
 * which is correct and NOT a Tailwind tree-shaking concern since it's a computed
 * dimension value, not a token reference.
 *
 * ### Shadow
 * Panel uses `shadow-card-4` (Blueprint drawer = elevation-shadow-4; card-4 has the
 * correct base + dark insets, same as Card's shadow-card-N tokens).
 *
 * ### Blueprint metrics (extracted from _drawer.scss, $pt-spacing=4px)
 * - Panel bg (light): white (#ffffff)
 * - Panel bg (dark): dark-gray3 (#2f343c)
 * - Panel shadow: elevation-4 → shadow-card-4
 * - Panel display: flex column; no padding; no margin
 * - Header: flex row; align-items center; flex: 0 0 auto
 *   min-height: $pt-icon-size-large + $drawer-padding = 20px + 20px = 40px
 *   padding: $drawer-padding * 0.25 = 5px; padding-left: $drawer-padding = 20px
 *   box-shadow (light): 0 1px 0 rgba(17,20,24,0.15) (= $pt-divider-black)
 *   box-shadow (dark):  0 1px 0 rgba(0,0,0,0.4) (= $pt-dark-divider-black)
 * - Header icon: color $pt-icon-color (muted); margin-right: $drawer-padding*0.5 = 10px
 * - Header title (h4): flex: 1 1 auto; line-height inherited; margin: 0;
 *   :last-child gets margin-right: $drawer-padding = 20px
 * - DrawerBody: flex: 1 1 auto; overflow: auto; line-height: $pt-spacing*4.5 = 18px
 * - DrawerFooter: flex: 0 0 auto; padding: $drawer-padding*0.5 $drawer-padding = 10px 20px
 *   box-shadow: inset 0 1px 0 $pt-divider-black (light) / inset 0 1px 0 $pt-dark-divider-black (dark)
 */

import * as RadixDialog from "@radix-ui/react-dialog";

import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Icon } from "./icon";

/** Common drawer sizes. */
export const DrawerSize = {
    SMALL: "360px",
    STANDARD: "50%",
    LARGE: "90%",
} as const;

export interface DrawerProps {
    /** Controlled open state. */
    open?: boolean;
    /** Initial open state (uncontrolled). */
    defaultOpen?: boolean;
    /** Called when the open state changes. */
    onOpenChange?: (open: boolean) => void;
    /**
     * Panel edge position.
     * @default "right"
     */
    position?: "left" | "right" | "top" | "bottom";
    /**
     * CSS size of the drawer panel.
     * - For left/right: sets `width`.
     * - For top/bottom: sets `height`.
     * Accept a number (px) or a CSS string (e.g. "50%", "360px").
     * @default DrawerSize.STANDARD = "50%"
     */
    size?: number | string;
    /** Drawer title — when provided, renders the drawer header. */
    title?: React.ReactNode;
    /** Icon rendered in the header before the title (use `<Icon icon="..." />`). */
    icon?: React.ReactNode;
    /** Show the close button in the header. @default true */
    closeButton?: boolean;
    /**
     * Whether pressing Escape closes the drawer. @default true
     */
    canEscapeKeyClose?: boolean;
    /**
     * Whether clicking outside the drawer closes it. @default true
     */
    canOutsideClickClose?: boolean;
    /**
     * Pass the app's dark state so the portaled drawer inherits dark mode.
     * Same requirement as Dialog — portals render at document.body (outside .dark ancestor).
     */
    dark?: boolean;
    /** Additional class on the drawer panel element. */
    className?: string;
    /** Inline styles on the drawer panel element (merged with position/size styles). */
    style?: React.CSSProperties;
    /** Drawer panel content (use DrawerBody / DrawerFooter). */
    children?: React.ReactNode;
}

/**
 * Drawer panel — Blueprint v6.15 slide-in panel anchored to a screen edge.
 *
 * Uses @radix-ui/react-dialog for portal/overlay/focus-trap machinery.
 * Compose with `<DrawerBody>` and `<DrawerFooter>` for standard layout.
 *
 * @example
 * ```tsx
 * <Drawer open={open} onOpenChange={setOpen} title="Settings" icon={<Icon icon="cog" />} dark={dark}>
 *   <DrawerBody>
 *     <p>Drawer body content.</p>
 *   </DrawerBody>
 *   <DrawerFooter>
 *     <Button variant="minimal">Cancel</Button>
 *     <Button intent="primary">Save</Button>
 *   </DrawerFooter>
 * </Drawer>
 * ```
 */
export function Drawer({
    open,
    defaultOpen,
    onOpenChange,
    position = "right",
    size = DrawerSize.STANDARD,
    title,
    icon,
    closeButton = true,
    canEscapeKeyClose = true,
    canOutsideClickClose = true,
    dark = false,
    className,
    style,
    children,
}: DrawerProps) {
    // Compute the size CSS property: width for left/right, height for top/bottom.
    const isHorizontal = position === "left" || position === "right";
    const sizeValue = typeof size === "number" ? `${size}px` : size;
    const panelSizeStyle: React.CSSProperties = isHorizontal
        ? { width: sizeValue }
        : { height: sizeValue };

    // Position classes: fixed + edge anchoring. Full perpendicular dimension.
    // right:  top-0 bottom-0 right-0 (width set by style)
    // left:   top-0 bottom-0 left-0  (width set by style)
    // top:    top-0 left-0 right-0   (height set by style)
    // bottom: bottom-0 left-0 right-0 (height set by style)
    const positionClasses: Record<string, string> = {
        right: "top-0 bottom-0 right-0",
        left: "top-0 bottom-0 left-0",
        top: "top-0 left-0 right-0",
        bottom: "bottom-0 left-0 right-0",
    };

    return (
        <RadixDialog.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
            <RadixDialog.Portal>
                {/* Dark-mode portal fix: wrap portal children in a div with the dark class.
                    The portal renders at document.body (outside the app's .dark ancestor),
                    so dark utilities wouldn't apply without this wrapper. */}
                <div className={dark ? "dark" : ""} style={{ pointerEvents: "none" }}>
                    {/* Backdrop/overlay — fixed, covers viewport.
                        Blueprint: rgba($black, 0.7) = rgba(17, 20, 24, 0.7) */}
                    <RadixDialog.Overlay
                        className="fixed inset-0 bg-black/70 z-overlay pointer-events-auto"
                    />
                    {/* Drawer panel — fixed, anchored to the edge.
                        No centering container needed (unlike Dialog which needs flex-center). */}
                    <RadixDialog.Content
                        data-compare="drawer-panel"
                        className={cn(
                            // Panel base: flex column
                            "flex flex-col",
                            // Fixed positioning + edge anchoring
                            "fixed z-overlay pointer-events-auto",
                            positionClasses[position],
                            // Blueprint: background white (light) / dark-gray3 (dark)
                            // Light: $drawer-background-color = $white
                            // Dark:  $dark-drawer-background-color = $dark-gray3 = #2f343c
                            "bg-white dark:bg-dark-gray-3",
                            // Set own text color: portal renders at body, must set text-foreground
                            // so dark mode resolves to the correct dark --foreground.
                            "text-foreground",
                            // Blueprint drawer uses elevation-4 in LIGHT but elevation-3 in DARK
                            // (Blueprint quirk). overlay-N tokens carry the rgba(20,20,20) light
                            // hairline ring + Blueprint's dark drop/highlight layer order.
                            "shadow-overlay-4 dark:shadow-overlay-3",
                            // Blueprint: no padding, no margin, no border-radius
                            "p-0 m-0",
                            // Blueprint: &:focus { outline: 0 }
                            "outline-none",
                            className,
                        )}
                        style={{ ...panelSizeStyle, ...style }}
                        onEscapeKeyDown={
                            canEscapeKeyClose ? undefined : (e) => e.preventDefault()
                        }
                        onPointerDownOutside={
                            canOutsideClickClose ? undefined : (e) => e.preventDefault()
                        }
                    >
                        {/* Header — only rendered when title is provided */}
                        {title != null && (
                            <div
                                data-compare="drawer-header"
                                className={cn(
                                    "flex items-center flex-[0_0_auto]",
                                    // Blueprint: min-height = $pt-icon-size-large + $drawer-padding = 20+20 = 40px
                                    "min-h-[40px]",
                                    // Blueprint: padding = $drawer-padding * 0.25 = 5px; padding-left = 20px
                                    "p-[5px] pl-5",
                                    // Blueprint header has NO border-radius (drawer has no rounded corners)
                                    // Light: box-shadow: 0 1px 0 rgba(17,20,24,0.15) = $pt-divider-black
                                    // Dark:  box-shadow: 0 1px 0 rgba(17,20,25,0.4) = $pt-dark-divider-black
                                    "shadow-[0_1px_0_rgba(17,20,24,0.15)] dark:shadow-[0_1px_0_rgba(17,20,25,0.4)]",
                                )}
                            >
                                {/* Icon — Blueprint: color $pt-icon-color (muted); margin-right: $drawer-padding*0.5 = 10px */}
                                {icon != null && (
                                    <span className="flex-[0_0_auto] mr-[10px] text-foreground-muted">
                                        {icon}
                                    </span>
                                )}
                                {/* Title — Blueprint: H4 (heading); flex: 1 1 auto; line-height inherited; margin: 0
                                    :last-child gets margin-right: $drawer-padding = 20px (when no close button) */}
                                <RadixDialog.Title
                                    className="flex-[1_1_auto] m-0 overflow-hidden text-ellipsis whitespace-nowrap text-heading-sm font-semibold text-foreground last:mr-5"
                                    asChild={false}
                                >
                                    {title}
                                </RadixDialog.Title>
                                {/* Close button — Blueprint: minimal Button with small-cross.
                                    Uses SmallCross at IconSize.LARGE (20px) in Blueprint source. */}
                                {closeButton && (
                                    <RadixDialog.Close asChild>
                                        <Button
                                            data-compare="drawer-close"
                                            variant="minimal"
                                            size="medium"
                                            className="shrink-0"
                                            aria-label="Close"
                                            icon={<Icon icon="small-cross" />}
                                        />
                                    </RadixDialog.Close>
                                )}
                            </div>
                        )}
                        {children}
                    </RadixDialog.Content>
                </div>
            </RadixDialog.Portal>
        </RadixDialog.Root>
    );
}

Drawer.displayName = "Drawer";

// --- DrawerBody ---

export interface DrawerBodyProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Drawer body content. */
    children?: React.ReactNode;
}

/**
 * Drawer body — the main scrollable content area of a drawer.
 *
 * Blueprint .bp6-drawer-body: flex: 1 1 auto; overflow: auto;
 * line-height: $pt-spacing * 4.5 = 18px.
 */
export function DrawerBody({ className, children, ...props }: DrawerBodyProps) {
    return (
        <div
            data-compare="drawer-body"
            className={cn(
                "flex-[1_1_auto] overflow-auto",
                // Blueprint: line-height = $pt-spacing * 4.5 = 18px
                "leading-[18px]",
                // Blueprint: padding is up to consumers; DrawerBody itself has no padding
                className,
            )}
            {...props}
        >
            {children}
        </div>
    );
}

DrawerBody.displayName = "DrawerBody";

// --- DrawerFooter ---

export interface DrawerFooterProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Footer content (action buttons, etc.). */
    children?: React.ReactNode;
}

/**
 * Drawer footer — optional bottom action area.
 *
 * Blueprint .bp6-drawer-footer:
 * - flex: 0 0 auto
 * - padding: $drawer-padding*0.5 $drawer-padding = 10px 20px
 * - box-shadow: inset 0 1px 0 $pt-divider-black (light) / inset 0 1px 0 $pt-dark-divider-black (dark)
 */
export function DrawerFooter({ className, children, ...props }: DrawerFooterProps) {
    return (
        <div
            className={cn(
                "flex-[0_0_auto]",
                // Blueprint: padding = 10px 20px
                "py-[10px] px-5",
                // Blueprint: inset 0 1px 0 $pt-divider-black = rgba(17,20,24,0.15)
                // Dark: inset 0 1px 0 $pt-dark-divider-black = rgba(17,20,25,0.4)
                "shadow-[inset_0_1px_0_rgba(17,20,24,0.15)] dark:shadow-[inset_0_1px_0_rgba(17,20,25,0.4)]",
                className,
            )}
            {...props}
        >
            {children}
        </div>
    );
}

DrawerFooter.displayName = "DrawerFooter";
