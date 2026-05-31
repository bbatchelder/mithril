/**
 * Alert — pixel-faithful Blueprint v6.15 reimplementation on Radix Dialog.
 *
 * ## What Alert is
 * Alert is a Dialog without a header — a modal confirm dialog with an optional large icon,
 * a message body, and two action buttons (confirm + optional cancel). Blueprint implements
 * it as a thin wrapper around Dialog.
 *
 * ## Design decisions
 *
 * ### API
 * - `open` / `defaultOpen` / `onOpenChange` — Radix-idiomatic (matches Dialog convention).
 * - `icon?` — ReactNode or icon name string; rendered at 40px (= $pt-icon-size-large * 2).
 * - `intent?` — applied to confirm button AND icon color.
 * - `confirmButtonText` — text for the confirm (right-most) button. @default "OK"
 * - `cancelButtonText?` — when provided, renders a cancel button to the left of confirm.
 * - `onConfirm?` — called when confirm button is clicked.
 * - `onCancel?` — called when cancel button is clicked (or escape/outside when allowed).
 * - `canEscapeKeyCancel` — whether Escape key cancels (calls onCancel). @default false
 * - `canOutsideClickCancel` — whether clicking outside cancels. @default false
 * - `dark` — from DarkContext; required for portal dark-mode (same as Dialog).
 * - `className` — forwarded to the alert panel.
 * - `children` — the message content (rendered in .bp6-alert-contents).
 *
 * ### Implementation strategy
 * Alert is implemented by composing our `Dialog` component with `title={undefined}` (no header)
 * and rendering a custom panel layout inside. The Dialog handles all Radix portal/overlay/dark-mode
 * machinery. We override the panel size (max-w-[400px] vs Dialog's w-[500px]) via className.
 *
 * ### Portal + dark-mode (inherited from Dialog)
 * Dialog already wraps portal children in `<div className={dark ? "dark" : ""}>`. Alert inherits
 * this — just pass `dark` through to Dialog. No extra work needed.
 *
 * ### Blueprint metrics (extracted from _alert.scss, $pt-spacing = 4px, $pt-icon-size-large = 20px)
 * - Panel max-width: $pt-spacing * 100 = 400px
 * - Panel padding: $pt-spacing * 5 = 20px (all sides)
 * - Body: display: flex (row); icon on left, contents (flex-1) on right
 * - Icon size: $pt-icon-size-large * 2 = 40px; margin-right: $pt-spacing * 5 = 20px; margin-top: 0
 * - Icon color: intent color when intent set, else inherited (default foreground)
 * - Contents: word-break: break-word
 * - Footer: display: flex; flex-direction: row-reverse (confirm right, cancel left)
 *   margin-top: $pt-spacing * 3 = 12px
 *   buttons: margin-left: $pt-spacing * 2 = 8px
 *
 * ### Shadow + text-foreground
 * Panel uses shadow-card-3 (matching Dialog) and text-foreground (portal inherits body's LIGHT
 * foreground otherwise → dark-on-dark text in dark mode). Same rules as Dialog.
 */

import * as RadixDialog from "@radix-ui/react-dialog";
import { useCallback } from "react";

import { cn } from "@/lib/utils";
import { Button, type ButtonIntent } from "./button";
import { Icon, type IconIntent } from "./icon";

export type AlertIntent = "none" | "primary" | "success" | "warning" | "danger";

export interface AlertProps {
    /** Controlled open state. */
    open?: boolean;
    /** Initial open state (uncontrolled). */
    defaultOpen?: boolean;
    /** Called when the open state changes (including dismiss). */
    onOpenChange?: (open: boolean) => void;
    /** Large icon displayed on the left of the body (Blueprint: 40px, intent-colored). */
    icon?: string | React.ReactNode;
    /** Intent applied to the confirm button and icon color. */
    intent?: AlertIntent;
    /**
     * Text for the confirm (right-most) button.
     * @default "OK"
     */
    confirmButtonText?: string;
    /**
     * Text for the cancel button. When provided, renders a cancel button
     * to the left of the confirm button.
     */
    cancelButtonText?: string;
    /**
     * Called when the confirm button is clicked.
     */
    onConfirm?: (event?: React.SyntheticEvent<HTMLElement>) => void;
    /**
     * Called when the alert is canceled — by cancel button, Escape key (if enabled),
     * or outside click (if enabled).
     */
    onCancel?: (event?: React.SyntheticEvent<HTMLElement>) => void;
    /**
     * Whether pressing Escape cancels (calls onCancel). Blueprint default: false.
     * @default false
     */
    canEscapeKeyCancel?: boolean;
    /**
     * Whether clicking outside the alert cancels (calls onCancel). Blueprint default: false.
     * @default false
     */
    canOutsideClickCancel?: boolean;
    /**
     * Pass the app's dark state so the portaled alert inherits dark mode.
     * Same requirement as Dialog — portals render at document.body (outside .dark ancestor).
     */
    dark?: boolean;
    /** Additional class on the alert panel element. */
    className?: string;
    /** Inline styles on the alert panel element. */
    style?: React.CSSProperties;
    /** The alert message content. Rendered in .bp6-alert-contents (flex-1). */
    children?: React.ReactNode;
}

/**
 * Alert — modal confirm dialog with optional icon, message, and action buttons.
 *
 * Blueprint: a Dialog without a header. The panel has a fixed max-width (400px) and
 * contains a body row (icon + contents) and a footer row (cancel + confirm buttons).
 *
 * @example
 * ```tsx
 * <Alert
 *   open={open}
 *   onOpenChange={setOpen}
 *   icon="warning-sign"
 *   intent="danger"
 *   confirmButtonText="Delete"
 *   cancelButtonText="Cancel"
 *   onConfirm={handleDelete}
 *   onCancel={() => setOpen(false)}
 *   dark={dark}
 * >
 *   Are you sure you want to delete this item? This action cannot be undone.
 * </Alert>
 * ```
 */
export function Alert({
    open,
    defaultOpen,
    onOpenChange,
    icon,
    intent,
    confirmButtonText = "OK",
    cancelButtonText,
    onConfirm,
    onCancel,
    canEscapeKeyCancel = false,
    canOutsideClickCancel = false,
    dark = false,
    className,
    style,
    children,
}: AlertProps) {
    const handleConfirm = useCallback(
        (event: React.MouseEvent<HTMLElement>) => {
            onConfirm?.(event);
        },
        [onConfirm],
    );

    const handleCancel = useCallback(
        (event?: React.MouseEvent<HTMLElement>) => {
            onCancel?.(event);
            // Close the dialog when cancel is triggered
            onOpenChange?.(false);
        },
        [onCancel, onOpenChange],
    );

    const handleConfirmAndClose = useCallback(
        (event: React.MouseEvent<HTMLElement>) => {
            handleConfirm(event);
            onOpenChange?.(false);
        },
        [handleConfirm, onOpenChange],
    );

    // Whether an icon will be rendered (used to decide whether to render the icon slot)
    const hasIcon = icon != null;

    return (
        <RadixDialog.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
            <RadixDialog.Portal>
                {/* Dark-mode portal fix: wrap portal children in a div with the dark class.
                    See dialog.tsx for full explanation. Same pattern required for all portaled
                    components (Dialog, Alert, Drawer, Popover, etc.). */}
                <div className={dark ? "dark" : ""} style={{ pointerEvents: "none" }}>
                    {/* Backdrop — same as Dialog */}
                    <RadixDialog.Overlay className="fixed inset-0 bg-black/70 z-overlay pointer-events-auto" />
                    {/* Panel container — centered, same as Dialog */}
                    <div className="fixed inset-0 flex items-center justify-center z-overlay pointer-events-none">
                        <RadixDialog.Content
                            data-compare="alert-panel"
                            // Blueprint Alert is an alertdialog (a modal that interrupts to
                            // confirm/warn), not a plain dialog. Override Radix's role="dialog".
                            role="alertdialog"
                            className={cn(
                                // Layout
                                "flex flex-col",
                                // Background: same as Dialog (light-gray5 / dark-gray1)
                                "bg-light-gray-5 dark:bg-dark-gray-1",
                                // text-foreground: portal renders at body, so must set own color.
                                // Under the .dark wrapper, resolves to dark --foreground. Same rule
                                // as Dialog and Card.
                                "text-foreground",
                                // Blueprint: border-radius 4px
                                "rounded-bp",
                                // Blueprint: box-shadow = card-3 (Dialog verified this is correct;
                                // shadow-elevation-N uses pure-black base, shadow-card-N uses
                                // $black=#111418 base + dark-mode white inset edge-highlights)
                                "shadow-overlay-3",
                                // Blueprint: max-width = $pt-spacing * 100 = 400px (Alert is narrower than Dialog's 500px)
                                "w-full max-w-[400px]",
                                // Blueprint: padding = $pt-spacing * 5 = 20px (all sides)
                                "p-5",
                                // Blueprint: margin = ($pt-spacing * 8) 0 = 32px top/bottom (same as Dialog)
                                "my-8",
                                // Restore pointer events
                                "pointer-events-auto",
                                // No focus outline
                                "outline-none",
                                className,
                            )}
                            style={style}
                            onEscapeKeyDown={
                                canEscapeKeyCancel
                                    ? () => handleCancel()
                                    : (e) => e.preventDefault()
                            }
                            onPointerDownOutside={
                                canOutsideClickCancel
                                    ? () => handleCancel()
                                    : (e) => e.preventDefault()
                            }
                            // Alert has no visible title; provide sr-only for accessibility
                            aria-describedby={undefined}
                        >
                            {/* Accessible title (sr-only) — required by Radix for a11y */}
                            <RadixDialog.Title className="sr-only">
                                Alert
                            </RadixDialog.Title>

                            {/* Body: flex row — icon on left + contents on right */}
                            {/* Blueprint .bp6-alert-body: display: flex */}
                            <div className="flex">
                                {/* Icon — Blueprint: font-size 40px; margin-right 20px; margin-top 0 */}
                                {/* data-compare goes directly on the Icon span (it receives HTML attrs
                                    via spanProps spread). Blueprint's .bp6-alert-body .bp6-icon sets
                                    font-size: 40px via CSS — replicate with text-[40px] on the icon
                                    itself so the measured node has the correct computed fontSize AND
                                    color (intent-colored text on the same span). */}
                                {hasIcon && (
                                    typeof icon === "string" ? (
                                        <Icon
                                            data-compare="alert-icon"
                                            icon={icon as Parameters<typeof Icon>[0]["icon"]}
                                            size={40}
                                            intent={intent as IconIntent}
                                            className="flex-[0_0_auto] mr-5 mt-0 text-[40px]"
                                        />
                                    ) : (
                                        // Custom ReactNode icon — wrap in span with data-compare
                                        <span
                                            data-compare="alert-icon"
                                            className="flex-[0_0_auto] mr-5 mt-0 text-[40px]"
                                        >
                                            {icon}
                                        </span>
                                    )
                                )}
                                {/* Contents — Blueprint .bp6-alert-contents: word-break: break-word */}
                                <div className="flex-[1_1_auto] [word-break:break-word] text-body">
                                    {children}
                                </div>
                            </div>

                            {/* Footer: buttons right-to-left (confirm right, cancel left) */}
                            {/* Blueprint .bp6-alert-footer: flex; flex-direction: row-reverse; margin-top 12px */}
                            {/* Buttons get margin-left 8px */}
                            <div
                                data-compare="alert-footer"
                                className="flex flex-row-reverse mt-3"
                            >
                                {/* Confirm button — always present, right-most, uses intent */}
                                <Button
                                    data-compare="alert-confirm"
                                    intent={intent as ButtonIntent}
                                    onClick={handleConfirmAndClose}
                                    className="ml-2"
                                >
                                    {confirmButtonText}
                                </Button>
                                {/* Cancel button — only rendered when cancelButtonText is provided.
                                    Blueprint uses a default (solid) button with no intent — NOT minimal. */}
                                {cancelButtonText && (
                                    <Button
                                        data-compare="alert-cancel"
                                        onClick={() => handleCancel()}
                                        className="ml-2"
                                    >
                                        {cancelButtonText}
                                    </Button>
                                )}
                            </div>
                        </RadixDialog.Content>
                    </div>
                </div>
            </RadixDialog.Portal>
        </RadixDialog.Root>
    );
}

Alert.displayName = "Alert";
