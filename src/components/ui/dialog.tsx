"use client";

/**
 * Dialog — pixel-faithful Blueprint v6.15 reimplementation on Radix Dialog.
 *
 * ## Design decisions
 *
 * ### API
 * - `open` / `defaultOpen` / `onOpenChange` (Radix-idiomatic) instead of Blueprint's
 *   `isOpen` / `onClose`. Both controlled and uncontrolled modes work.
 * - `title?: ReactNode` — when provided, renders the dialog header.
 * - `icon?: ReactNode` — icon rendered in the header before the title (use `<Icon>`).
 * - `closeButton?: boolean` — show the close button in the header (default true).
 * - `canEscapeKeyClose?: boolean` — Radix `onEscapeKeyDown` (default true).
 * - `canOutsideClickClose?: boolean` — Radix `onPointerDownOutside` (default true).
 * - `dark?: boolean` — required for dark-mode portal support (see below).
 * - `className` / `style` — forwarded to the dialog panel element.
 * - `children` — rendered inside the dialog panel after the header.
 *
 * ### Radix mapping
 * - `Dialog.Root` → root controller (open state, onOpenChange)
 * - `Dialog.Portal` → portals content to document.body
 * - `Dialog.Overlay` → fixed backdrop (rgba(17,20,24,0.7))
 * - `Dialog.Content` → the dialog panel (focus trap, escape, scroll lock)
 * - `Dialog.Title` → accessible title (visible in header)
 * - `Dialog.Close` → close button in header
 *
 * ### Portal + dark-mode solution
 * The app's dark class is on a child div (`<div className={dark ? "dark" : ""}>`), but
 * Radix portals content to document.body, OUTSIDE that div. The custom variant
 * `dark (&:is(.dark *))` in tokens.css requires being a descendant of `.dark` — so
 * portaled content doesn't inherit dark styles by default.
 *
 * Solution: Wrap the portal children in `<div className={dark ? "dark" : ""}>`.
 * This wrapper div has the `dark` class, so all portaled content (overlay + panel) are
 * descendants of `.dark` and dark utility classes apply correctly. The wrapper is
 * `pointer-events: none` so it doesn't intercept clicks; overlay/content restore their
 * own pointer-events.
 *
 * Pass `dark` from the App's dark state (via DarkContext) to Dialog wherever it's used.
 * In production, read dark mode from a ThemeContext instead.
 *
 * ### Blueprint metrics (extracted from _dialog.scss, _dialog-body.scss, _dialog-footer.scss)
 * - Backdrop: `rgba(17, 20, 24, 0.7)` (= rgba($black, 0.7))
 * - Panel bg (light): `#f6f7f9` (light-gray5)
 * - Panel bg (dark): `#1c2127` (dark-gray1 = $pt-dark-app-background-color)
 * - Panel radius: 4px ($pt-border-radius)
 * - Panel box-shadow: elevation-3 token (light) / dark elevation-3 token (dark)
 * - Panel width: 500px ($pt-spacing * 125 = 4px * 125)
 * - Panel margin: 32px 0 ($dialog-margin = ($pt-spacing * 8) 0)
 * - Header bg (light): white; radius: 4px 4px 0 0;
 *   box-shadow: 0 1px 0 rgba(17,20,24,0.15) (= $pt-divider-black)
 * - Header bg (dark): dark-gray3 (#2f343c);
 *   box-shadow: inset 0 0 0 1px rgba(255,255,255,0.2) (= $pt-dark-divider-white)
 * - Header min-height: 38px (30px button + 2 * 4px padding)
 * - Header padding: 4px all; padding-left: 16px (= $dialog-padding = $pt-spacing*4)
 * - Header icon: flex: 0 0 auto; margin-left: -4px (-$pt-spacing); margin-right: 8px ($dialog-padding/2)
 * - Header title: flex: 1 1 auto; font-size: 14px; :last-child gets margin-right: 16px
 *
 * - Body (default = scrollable container, matching Blueprint's default DialogBody
 *   with useOverflowScrollContainer=true → .bp6-dialog-body-scroll-container):
 *   margin: 0; max-height: 70vh; overflow: auto; padding: 16px
 * - Body (minimal/non-scroll): margin: 16px; no padding
 *
 * - Footer (default = fixed, matching Blueprint's DialogFooter with minimal=false
 *   → .bp6-dialog-footer-fixed):
 *   background: white (dark: dark-gray4 #383e47);
 *   border-top: 1px solid rgba(17,20,24,0.15) (dark: rgba(255,255,255,0.2));
 *   border-radius: 0 0 4px 4px;
 *   padding: 8px 8px 8px 16px; no margin
 * - Footer actions: display: flex; justify-content: flex-end; buttons get ml-2 gap
 */

import * as RadixDialog from "@radix-ui/react-dialog";
import { forwardRef } from "react";

import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Icon, resolveIcon, type IconProp } from "./icon";
import { smallCross } from "./icons";

export interface DialogProps {
    /** Controlled open state. */
    open?: boolean;
    /** Initial open state (uncontrolled). */
    defaultOpen?: boolean;
    /** Called when the open state changes. */
    onOpenChange?: (open: boolean) => void;
    /** Dialog title — when provided, renders the dialog header. */
    title?: React.ReactNode;
    /** Icon rendered in the header before the title. An icon-name string (e.g. `"cog"`) or a custom element. */
    icon?: IconProp;
    /** Show the close button in the header. @default true */
    closeButton?: boolean;
    /**
     * Whether pressing Escape closes the dialog. @default true
     * Maps to `onEscapeKeyDown` preventDefault.
     */
    canEscapeKeyClose?: boolean;
    /**
     * Whether clicking outside the dialog closes it. @default true
     * Maps to `onPointerDownOutside` preventDefault.
     */
    canOutsideClickClose?: boolean;
    /**
     * Pass the app's dark state so the portaled dialog inherits dark mode.
     * Radix portals content to document.body (outside the .dark ancestor div),
     * so we wrap portal children in a div with dark class when this is true.
     */
    dark?: boolean;
    /**
     * Render the portaled dialog into this element instead of `document.body`.
     * Forwarded to Radix `Dialog.Portal`'s `container`. Used by the showcase to
     * confine the overlay to its playground stage (the stage must establish a CSS
     * containing block so the dialog's `fixed` backdrop/panel resolve against it).
     */
    portalContainer?: HTMLElement | null;
    /** Additional class on the dialog panel element. */
    className?: string;
    /** Inline styles on the dialog panel element. */
    style?: React.CSSProperties;
    /** Dialog panel content (use DialogBody / DialogFooter). */
    children?: React.ReactNode;
}

/**
 * Dialog panel — uses Blueprint's panel metrics.
 *
 * Compose with `<DialogBody>` and `<DialogFooter>` for standard layout.
 *
 * @example
 * ```tsx
 * <Dialog open={open} onOpenChange={setOpen} title="Settings" icon={<Icon icon="cog" />} dark={dark}>
 *   <DialogBody>
 *     <p>Dialog body content.</p>
 *   </DialogBody>
 *   <DialogFooter actions={<><Button variant="minimal">Cancel</Button><Button intent="primary">Save</Button></>} />
 * </Dialog>
 * ```
 */
export function Dialog({
    open,
    defaultOpen,
    onOpenChange,
    title,
    icon,
    closeButton = true,
    canEscapeKeyClose = true,
    canOutsideClickClose = true,
    dark = false,
    portalContainer,
    className,
    style,
    children,
}: DialogProps) {
    return (
        <RadixDialog.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
            <RadixDialog.Portal container={portalContainer}>
                {/* Dark-mode portal fix: wrap portal children in a div with the dark class.
                    The portal renders at document.body (outside the app's .dark ancestor),
                    so dark utilities wouldn't apply without this wrapper. The wrapper is
                    pointer-events:none so it doesn't intercept clicks. */}
                <div className={dark ? "dark" : ""} style={{ pointerEvents: "none" }}>
                    {/* Backdrop/overlay — fixed, covers viewport.
                        Blueprint: rgba($black, 0.7) = rgba(17, 20, 24, 0.7) */}
                    <RadixDialog.Overlay
                        className="fixed inset-0 bg-black/70 z-overlay pointer-events-auto"
                    />
                    {/* Panel container — flex-center for vertical+horizontal centering of the panel */}
                    <div className="fixed inset-0 flex items-center justify-center z-overlay pointer-events-none">
                        <RadixDialog.Content
                            data-compare="dialog-panel"
                            className={cn(
                                // Panel base: flex column, rounded corners, elevation shadow
                                "flex flex-col",
                                // Blueprint: background light-gray5 (light) / dark-gray1 (dark)
                                "bg-light-gray-5 dark:bg-dark-gray-1",
                                // Set own text color: the portal renders at document.body, so the
                                // panel inherits body's LIGHT --foreground unless it applies
                                // color:var(--foreground) itself (it's under the .dark wrapper, so
                                // text-foreground resolves to the dark foreground). Same rule as Card.
                                "text-foreground",
                                // Blueprint: border-radius 4px
                                "rounded-mithril",
                                // Blueprint: box-shadow = elevation-3. Use the card-3 token (not
                                // elevation-3): Card already tuned it to Blueprint's exact shadow
                                // base color (#111418, not pure black) AND the dark-mode white inset
                                // edge-highlights the dialog panel needs. Verified 7/7 both themes.
                                // overlay-3: rgba(20,20,20) hairline ring (light) + reordered
                                // dark drop/highlight layers to match Blueprint exactly.
                                "shadow-overlay-3",
                                // Blueprint: width = $pt-spacing * 125 = 500px
                                "w-[500px]",
                                // Blueprint: margin = ($pt-spacing * 8) 0 = 32px top/bottom
                                "my-8",
                                // Restore pointer events (parent container disables them)
                                "pointer-events-auto",
                                // Blueprint: &:focus { outline: 0 }
                                "outline-none",
                                className,
                            )}
                            style={style}
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
                                    data-compare="dialog-header"
                                    className={cn(
                                        "flex items-center flex-[0_0_auto]",
                                        // Blueprint: background white (light) / dark-gray3 (dark)
                                        "bg-white dark:bg-dark-gray-3",
                                        // Blueprint: border-radius 4px 4px 0 0
                                        "rounded-t-mithril",
                                        // Light: 0 1px 0 rgba(17,20,24,0.15) = $pt-divider-black
                                        // Dark: inset 0 0 0 1px rgba(255,255,255,0.2) = $pt-dark-divider-white
                                        "shadow-[0_1px_0_rgba(17,20,24,0.15)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]",
                                        // Blueprint: min-height = $pt-button-height + 2 * $dialog-header-padding = 30 + 8 = 38px
                                        "min-h-[38px]",
                                        // Blueprint: padding: 4px ($dialog-header-padding); padding-left: 16px ($dialog-padding)
                                        "p-1 pl-4",
                                    )}
                                >
                                    {/* Icon — Blueprint: flex: 0 0 auto; margin-left: -$pt-spacing = -4px; margin-right: $dialog-padding*0.5 = 8px */}
                                    {resolveIcon(icon) && (
                                        <span className="flex-[0_0_auto] -ml-1 mr-2 text-foreground-muted">
                                            {resolveIcon(icon)}
                                        </span>
                                    )}
                                    {/* Title — Blueprint: flex: 1 1 auto; font-size: 14px; ellipsis
                                        :last-child gets margin-right: $dialog-padding = 16px (when no close button) */}
                                    <RadixDialog.Title className="flex-[1_1_auto] m-0 overflow-hidden text-ellipsis whitespace-nowrap text-body font-semibold text-foreground last:mr-4">
                                        {title}
                                    </RadixDialog.Title>
                                    {/* Close button — Blueprint: minimal Button with small-cross glyph.
                                        No explicit margin; header padding (4px right) provides gap. */}
                                    {closeButton && (
                                        <RadixDialog.Close asChild>
                                            <Button
                                                data-compare="dialog-close"
                                                variant="minimal"
                                                size="medium"
                                                className="shrink-0"
                                                aria-label="Close"
                                                icon={<Icon icon={smallCross} />}
                                            />
                                        </RadixDialog.Close>
                                    )}
                                </div>
                            )}
                            {children}
                        </RadixDialog.Content>
                    </div>
                </div>
            </RadixDialog.Portal>
        </RadixDialog.Root>
    );
}

Dialog.displayName = "Dialog";

// --- DialogBody ---

export interface DialogBodyProps extends React.HTMLAttributes<HTMLDivElement> {
    /**
     * Enable scrolling with a max-height. Matches Blueprint's DialogBody
     * `useOverflowScrollContainer=true` default (→ .bp6-dialog-body-scroll-container):
     *   margin: 0; max-height: 70vh; overflow: auto; padding: 16px.
     *
     * When false (minimal), matches the CSS API style (→ .bp6-dialog-body):
     *   margin: 16px; no padding.
     *
     * @default true
     */
    scrollable?: boolean;
}

/**
 * Dialog body — the main content area of a dialog.
 *
 * Default (scrollable=true) matches Blueprint's `DialogBody` with
 * `useOverflowScrollContainer=true` (the JS API default):
 *   padding: 16px; max-height: 70vh; overflow: auto; no margin.
 *
 * Set `scrollable={false}` for the CSS-API style: margin: 16px; no padding.
 */
export const DialogBody = forwardRef<HTMLDivElement, DialogBodyProps>(function DialogBody(
    { className, scrollable = true, ...props },
    ref,
) {
    return (
        <div
            ref={ref}
            data-compare="dialog-body"
            className={cn(
                "flex-[1_1_auto]",
                scrollable
                    ? // Blueprint .bp6-dialog-body-scroll-container:
                      // margin: 0; max-height: 70vh; overflow: auto; padding: $dialog-padding (16px)
                      "m-0 max-h-[70vh] overflow-auto p-4"
                    : // Blueprint .bp6-dialog-body (CSS API, margin-only):
                      // margin: $dialog-padding (16px); no padding
                      "m-4",
                className,
            )}
            {...props}
        />
    );
});

// --- DialogFooter ---

export interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
    /**
     * Action buttons rendered right-aligned in the footer.
     * Wrap multiple buttons in a fragment; they get an 8px left margin gap.
     */
    actions?: React.ReactNode;
    /**
     * Use a minimal appearance (no background, border, or extra padding).
     * Matches Blueprint's DialogFooter `minimal=true` → .bp6-dialog-footer (CSS API).
     * Default (false) uses the fixed/prominent footer style.
     *
     * @default false
     */
    minimal?: boolean;
    /** Left-side "main section" content (optional). */
    children?: React.ReactNode;
}

/**
 * Dialog footer — contains action buttons and optional left-side content.
 *
 * Default (minimal=false) matches Blueprint's `DialogFooter` JS API default
 * (→ .bp6-dialog-footer.bp6-dialog-footer-fixed):
 *   Light: bg-white; border-top: 1px solid rgba(17,20,24,0.15); border-radius: 0 0 4px 4px;
 *          padding: 8px 8px 8px 16px; no margin.
 *   Dark:  bg-dark-gray-4; border-top: 1px solid rgba(255,255,255,0.2).
 *
 * Set `minimal={true}` for the CSS API style: margin: 16px; no background/border.
 */
export const DialogFooter = forwardRef<HTMLDivElement, DialogFooterProps>(function DialogFooter(
    { className, actions, minimal = false, children, ...props },
    ref,
) {
    return (
        <div
            ref={ref}
            data-compare="dialog-footer"
            className={cn(
                "flex-[0_0_auto] flex items-center justify-between gap-4",
                minimal
                    ? // Blueprint .bp6-dialog-footer (CSS API): margin: 16px; no bg/border
                      "m-4"
                    : // Blueprint .bp6-dialog-footer.bp6-dialog-footer-fixed (JS API default):
                      // Light: white bg; border-top divider; rounded bottom; padding 8px 8px 8px 16px
                      // Dark: dark-gray4 bg; border-top divider-white
                      [
                          // background
                          "bg-white dark:bg-dark-gray-4",
                          // border-top: 1px solid $pt-divider-black (light) / $pt-dark-divider-white (dark)
                          "border-t border-t-[rgba(17,20,24,0.15)] dark:border-t-[rgba(255,255,255,0.2)]",
                          // border-radius: 0 0 4px 4px
                          "rounded-b-mithril",
                          // padding: 8px 8px 8px 16px
                          "pt-2 pr-2 pb-2 pl-4",
                      ].join(" "),
                className,
            )}
            {...props}
        >
            {/* Left-side main section — always rendered (flex: 1 1 auto) so actions are always pushed right.
                Blueprint's .bp6-dialog-footer-main-section is always rendered. */}
            <div className="flex-[1_1_auto]">{children}</div>
            {/* Right-side actions — buttons get 8px left gap ($pt-spacing * 2) */}
            {actions && (
                <div className="flex justify-end [&>*+*]:ml-2">
                    {actions}
                </div>
            )}
        </div>
    );
});
