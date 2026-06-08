"use client";

/**
 * Toast / Toaster — pixel-faithful Blueprint v6.15 reimplementation on Radix Toast.
 *
 * ## Design decisions
 *
 * ### API
 * - `Toast` — the card component (intent?, icon?, message/children, action?, onDismiss?, timeout?)
 * - `ToastProvider` — wraps the app/subtree; accepts `position` (default "top") and `dark`
 * - `Toaster` + `useToaster()` — imperative API to show/dismiss toasts
 * - For the gallery we render static visible toasts using `open={true}` on Radix Toast.Root.
 *
 * ### Radix mapping
 * - `Toast.Provider` → manages timing, swipe direction; exposes `duration` + `swipeDirection`
 * - `Toast.Root` → the toast card outer element (open/close state, animation). We apply all
 *   the toast card styling directly to Root (no asChild needed).
 * - `Toast.Title` → accessible message span (role="alert" descendant)
 * - `Toast.Action` → the optional action button (requires `altText` for screen-readers)
 * - `Toast.Close` → the dismiss button
 * - `Toast.Viewport` → fixed-position portal that stacks toasts; no overlay/backdrop
 *
 * ### Portal + dark-mode solution (same pattern as Dialog/Tooltip/Popover)
 * Radix Toast.Viewport portals to document.body (outside the .dark ancestor div).
 * We wrap the Viewport in a `<div className={dark ? "dark" : ""}>` to restore dark context.
 * `pointer-events: none` on the wrapper; Viewport restores its own pointer-events.
 *
 * ### Blueprint metrics (extracted from _toast.scss)
 * - Card bg (light): white (#ffffff)
 * - Card bg (dark): dark-gray4 (#383e47)
 * - Border-radius: 4px ($pt-border-radius)
 * - Box-shadow (light): inset 0 0 0 1px rgba(17,20,24,0.2), 0 2px 4px rgba(17,20,24,0.2), 0 8px 24px rgba(17,20,24,0.2)
 *   (= $pt-toast-box-shadow = inset border-shadow(0.2) + 2 drop shadows with $black=17,20,24)
 * - Box-shadow (dark): $pt-dark-elevation-shadow-3 = same as shadow-card-3 dark values
 * - Min-width: 300px (= $pt-spacing * 75 = 4px * 75). Blueprint uses min(300px,100%) — we use 300px
 *   since the viewport constrains total width.
 * - Max-width: 500px (= $pt-spacing * 125 = 4px * 125)
 * - Margin-top between toasts: 20px (= $pt-spacing * 5) — handled by viewport gap
 * - Min-height: 40px (= $toast-height = $pt-button-height-large = $pt-spacing * 10)
 * - Layout: flex row align-items:flex-start
 * - Message padding: 11px top/bottom (= centered-text($toast-height) = floor((40-18)*0.5) = 11px)
 *   Message: flex-1 1 auto; padding: 11px top/bottom; word-break: break-word
 * - Icon margin: 12px all sides, right=0 (= ($toast-height - $pt-icon-size-standard)/2 = (40-16)/2 = 12px)
 *   Icon color (light): gray-1 (#5f6b7c = $pt-icon-color = $pt-text-color-muted)
 *   Icon color (dark): gray-4 (#abb3bf = $pt-dark-icon-color = $pt-dark-text-color-muted)
 * - Button group padding: 5px all, 0 left (= ($toast-height - $pt-button-height) * 0.5 = 5px)
 *
 * ### Intent styling (from _toast.scss $toast-intent-colors map + pt-toast-intent mixin)
 * - primary:  bg=blue3 (#2d72d2), text=white, btn-hover=blue2 (#215db0), btn-active=blue1 (#184a90)
 * - success:  bg=green3 (#238551), text=white, btn-hover=green2 (#1c6e42), btn-active=green1 (#165a36)
 * - warning:  bg=orange5 (#fbb360), text=dark-gray1 (#1c2127), btn-hover=orange4 (#ec9a3c), btn-active=orange3 (#c87619)
 *             Note: Blueprint warning uses $orange5 bg (NOT $orange3) and $dark-gray1 text.
 * - danger:   bg=red3 (#cd4246), text=white, btn-hover=red2 (#ac2f33), btn-active=red1 (#8e292c)
 *
 * ### Viewport positioning
 * Blueprint default position = TOP (center). Configurable via `position` prop.
 * Radix Viewport is `fixed` — positioned via CSS based on the `position` prop.
 * z-index: 80 (Blueprint: $pt-z-index-overlay * 2 = ~40 * 2 — we use 80 to be above dialogs).
 */

import * as RadixToast from "@radix-ui/react-toast";
import { createContext, useCallback, useContext, useState } from "react";

import { cn } from "@/lib/utils";
import type { Intent } from "@/lib/types";
import { Icon, type IconName } from "./icon";
import { smallCross } from "./icons";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ToastIntent = Intent;
export type ToastPosition =
    | "top"
    | "top-left"
    | "top-right"
    | "bottom"
    | "bottom-left"
    | "bottom-right";

export interface ToastAction {
    /** Button label. */
    text: string;
    /** Called when the action button is clicked. */
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export interface ToastProps {
    /** Intent determines the card background color. @default "none" */
    intent?: ToastIntent;
    /** Leading icon name (Blueprint Icon glyph name). */
    icon?: IconName;
    /** Primary toast message. Can be a string or any ReactNode. */
    message?: React.ReactNode;
    /** Alternative to `message` — children are used as the message. */
    children?: React.ReactNode;
    /** Optional action button rendered before the dismiss button. */
    action?: ToastAction;
    /**
     * Called when the toast is dismissed (either by timeout, dismiss button, or action click).
     * `didTimeoutExpire` is true when auto-dismissed by timeout.
     */
    onDismiss?: (didTimeoutExpire: boolean) => void;
    /**
     * Auto-dismiss timeout in milliseconds. 0 or negative = no timeout.
     * @default 5000
     */
    timeout?: number;
    /** Show the dismiss (×) button. @default true */
    isCloseButtonShown?: boolean;
    /** Controlled open state (for gallery: pass `open={true}`). */
    open?: boolean;
    /** Additional class applied to the toast card. */
    className?: string;
    /** data-compare attribute for harness. */
    "data-compare"?: string;
}

// ─── Intent styling maps (Blueprint spec) ────────────────────────────────────

/**
 * Per-intent background color tokens (literal utility classes — Tailwind v4 won't
 * tree-shake if these are dynamically concatenated).
 *
 * Blueprint toast-intent-colors map (from _toast.scss):
 *   primary: bg=blue3, text=white, hover=blue2, active=blue1
 *   success: bg=green3, text=white, hover=green2, active=green1
 *   warning: bg=orange5, text=dark-gray1, hover=orange4, active=orange3
 *   danger:  bg=red3, text=white, hover=red2, active=red1
 */
const INTENT_CLASSES: Record<Exclude<ToastIntent, "none">, {
    card: string;
    iconColor: string;
    btn: string;
}> = {
    // Solid intent fills via seeds (rest/hover/active = intent tier-3/2/1), so they
    // re-tint with the theme. Warning uses the lightened-amber --warning-solid-bg
    // (≈ orange-5) + warning-disabled/warning for hover/active.
    primary: {
        card: "bg-primary text-white",
        iconColor: "text-white/70",
        btn: "bg-primary text-white hover:!bg-primary-hover active:!bg-primary-active",
    },
    success: {
        card: "bg-success text-white",
        iconColor: "text-white/70",
        btn: "bg-success text-white hover:!bg-success-hover active:!bg-success-active",
    },
    warning: {
        card: "bg-warning-solid-bg text-dark-gray-1",
        iconColor: "text-dark-gray-1/70",
        btn: "bg-warning-solid-bg text-dark-gray-1 hover:!bg-warning-disabled active:!bg-warning",
    },
    danger: {
        card: "bg-danger text-white",
        iconColor: "text-white/70",
        btn: "bg-danger text-white hover:!bg-danger-hover active:!bg-danger-active",
    },
};

// ─── Toast inner content renderer ────────────────────────────────────────────

interface ToastContentProps {
    intent?: ToastIntent;
    icon?: IconName;
    message?: React.ReactNode;
    children?: React.ReactNode;
    action?: ToastAction;
    isCloseButtonShown?: boolean;
    onDismiss?: (didTimeoutExpire: boolean) => void;
}

function ToastContent({
    intent = "none",
    icon,
    message,
    children,
    action,
    isCloseButtonShown = true,
    onDismiss,
}: ToastContentProps) {
    const hasIntent = intent !== "none";
    const intentCls = hasIntent ? INTENT_CLASSES[intent] : null;

    const handleDismiss = useCallback(() => {
        onDismiss?.(false);
    }, [onDismiss]);

    const handleAction = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            action?.onClick?.(e);
            onDismiss?.(false);
        },
        [action, onDismiss],
    );

    return (
        <>
            {/* Leading icon — Blueprint: margin = 12px all sides, right=0 */}
            {icon && (
                <span
                    className={cn(
                        // Blueprint: margin = ($toast-height - $pt-icon-size-standard) * 0.5 = 12px, margin-right: 0
                        "m-3 mr-0 flex-[0_0_auto] flex items-center",
                        // Light: muted icon color ($pt-icon-color = gray-1)
                        // Dark: dark-muted icon color ($pt-dark-icon-color = gray-4)
                        !hasIntent && "text-foreground-muted",
                        hasIntent && intentCls?.iconColor,
                    )}
                >
                    <Icon icon={icon} />
                </span>
            )}

            {/* Message area — flex:1 1 auto, padding = 11px top/bottom, ~10px horizontal */}
            <RadixToast.Title asChild>
                <span
                    role="alert"
                    className="flex-[1_1_auto] py-[11px] px-[10px] text-[14px] leading-[1.28581] break-words"
                >
                    {message ?? children}
                </span>
            </RadixToast.Title>

            {/* Button group — padding: 5px all, padding-left: 0 */}
            <div className="flex-[0_0_auto] flex items-center p-[5px] pl-0">
                {/* Action button */}
                {action && (
                    <RadixToast.Action altText={action.text} asChild>
                        <button
                            onClick={handleAction}
                            className={cn(
                                "inline-flex items-center justify-center rounded-mithril px-[10px] h-[30px]",
                                "text-[14px] font-normal cursor-pointer border-0 outline-none",
                                "transition-colors",
                                !hasIntent && [
                                    "bg-transparent text-foreground",
                                    "hover:bg-black/10 dark:hover:bg-white/10",
                                    "active:bg-black/20 dark:active:bg-white/20",
                                ],
                                hasIntent && intentCls?.btn,
                            )}
                        >
                            {action.text}
                        </button>
                    </RadixToast.Action>
                )}

                {/* Dismiss button — Blueprint: minimal Button with small-cross icon */}
                {isCloseButtonShown && (
                    <RadixToast.Close asChild>
                        <button
                            onClick={handleDismiss}
                            aria-label="Close"
                            className={cn(
                                "inline-flex items-center justify-center rounded-mithril w-[30px] h-[30px]",
                                "cursor-pointer border-0 outline-none transition-colors",
                                !hasIntent && [
                                    "bg-transparent",
                                    // Blueprint: .bp6-button .bp6-icon color = rgba($white,0.7) in dark
                                    "text-foreground-muted",
                                    "hover:bg-black/10 dark:hover:bg-white/10",
                                    "active:bg-black/20 dark:active:bg-white/20",
                                ],
                                // Intent: cross gets the intentCls btn styling
                                hasIntent && intentCls?.btn,
                                // But cross specifically has icon color = rgba(text, 0.7)
                                // achieved by icon inheriting current color then opacity
                                hasIntent && intentCls?.iconColor,
                            )}
                        >
                            <Icon icon={smallCross} />
                        </button>
                    </RadixToast.Close>
                )}
            </div>
        </>
    );
}

// ─── Toast (the public-facing card component) ─────────────────────────────────

/**
 * A single toast notification. Rendered as a `Radix.Toast.Root` with Blueprint card styling.
 *
 * For the gallery, use `open={true}` to force it always visible.
 * For the Toaster (imperative), use `useToaster()` to show/dismiss.
 *
 * @example
 * ```tsx
 * // Standalone static toast (gallery)
 * <Toast open={true} icon="info-sign" message="File saved." />
 *
 * // Imperative (via Toaster)
 * const toaster = useToaster();
 * toaster.show({ icon: "tick", intent: "success", message: "Done!" });
 * ```
 */
export function Toast({
    intent = "none",
    icon,
    message,
    children,
    action,
    onDismiss,
    timeout = 5000,
    isCloseButtonShown = true,
    open,
    className,
    "data-compare": dataCompare,
}: ToastProps) {
    const hasIntent = intent !== "none";
    const intentCls = hasIntent ? INTENT_CLASSES[intent] : null;
    const [localOpen, setLocalOpen] = useState(open ?? true);

    const handleOpenChange = useCallback((nextOpen: boolean) => {
        setLocalOpen(nextOpen);
        if (!nextOpen) {
            onDismiss?.(false);
        }
    }, [onDismiss]);

    return (
        <RadixToast.Root
            open={open !== undefined ? open : localOpen}
            onOpenChange={handleOpenChange}
            duration={timeout > 0 ? timeout : Infinity}
            data-compare={dataCompare}
            className={cn(
                // Base layout — flex row, align-items:flex-start
                // Note: Toast.Root renders as <li>, so display:flex must be explicit.
                "flex items-start",
                // Blueprint: position relative (needed for stacking)
                "relative",
                // Blueprint: pointer-events:all (toasts are interactive even though container isn't).
                // `!important` is required: Radix Toast writes an inline `pointer-events: none`
                // on the <li> whenever its region loses focus — which is exactly what happens when
                // a *modal* Radix Dialog/Drawer opens (its FocusScope traps focus). Without the
                // override, an open drawer makes every toast un-closable (real clicks fall through
                // to the drawer beneath). The bang beats the inline none so toasts stay interactive.
                "!pointer-events-auto",
                // Blueprint: border-radius 4px ($pt-border-radius)
                "rounded-mithril",
                // Blueprint: min-width min(300px,100%), max-width min(500px,100%)
                "min-w-[min(300px,100%)] max-w-[min(500px,100%)]",
                // Blueprint: margin-top 20px (margin between stacked toasts)
                // NOTE: The viewport uses gap-[20px] for spacing, so this matches.
                // Blueprint .bp6-toast has margin: $toast-margin 0 0 (20px top).
                // The diff shows Blueprint having marginTop=20px — we match this.
                "mt-5",
                // Light: white bg. Dark: dark-gray4 bg.
                !hasIntent && "bg-white dark:bg-dark-gray-4",
                // Light: $pt-toast-box-shadow = inset 0 0 0 1px rgba(17,20,24,0.2), 0 2px 4px rgba(17,20,24,0.2), 0 8px 24px rgba(17,20,24,0.2)
                // Dark: $pt-dark-toast-box-shadow = $pt-dark-elevation-shadow-3 = shadow-card-3 dark
                !hasIntent && [
                    "shadow-[inset_0_0_0_1px_rgba(17,20,24,0.2),_0_2px_4px_rgba(17,20,24,0.2),_0_8px_24px_rgba(17,20,24,0.2)]",
                    "dark:shadow-overlay-3",
                ],
                // Intent card: intent-specific bg + text
                hasIntent && intentCls?.card,
                // Intent cards use the same toast box-shadow (Blueprint: same mixin, different bg)
                hasIntent && [
                    "shadow-[inset_0_0_0_1px_rgba(17,20,24,0.2),_0_2px_4px_rgba(17,20,24,0.2),_0_8px_24px_rgba(17,20,24,0.2)]",
                    "dark:shadow-overlay-3",
                ],
                // Text color for no-intent toast — set explicitly for portal context
                !hasIntent && "text-foreground",
                className,
            )}
        >
            <ToastContent
                intent={intent}
                icon={icon}
                message={message}
                action={action}
                isCloseButtonShown={isCloseButtonShown}
                onDismiss={onDismiss}
            >
                {children}
            </ToastContent>
        </RadixToast.Root>
    );
}

// ─── ToastProvider + Viewport ─────────────────────────────────────────────────

export interface ToastProviderProps {
    /**
     * Duration in ms before a toast auto-dismisses. Individual toasts can override.
     * @default 5000
     */
    duration?: number;
    /**
     * Stack position for the viewport. @default "top"
     */
    position?: ToastPosition;
    /**
     * Pass the app's dark state so the portaled viewport inherits dark mode.
     * @default false
     */
    dark?: boolean;
    children?: React.ReactNode;
}

/** Position → CSS class map for the Radix Toast Viewport */
const POSITION_CLASSES: Record<ToastPosition, string> = {
    "top":          "top-5 left-1/2 -translate-x-1/2 items-center",
    "top-left":     "top-5 left-5 items-start",
    "top-right":    "top-5 right-5 items-end",
    "bottom":       "bottom-5 left-1/2 -translate-x-1/2 items-center flex-col-reverse",
    "bottom-left":  "bottom-5 left-5 items-start flex-col-reverse",
    "bottom-right": "bottom-5 right-5 items-end flex-col-reverse",
};

/**
 * Toast provider — wraps the app (or subtree). Renders the Radix Toast.Provider and
 * a fixed viewport that stacks toasts.
 *
 * @example
 * ```tsx
 * <ToastProvider dark={dark} position="top">
 *   <App />
 * </ToastProvider>
 * ```
 */
export function ToastProvider({
    duration = 5000,
    position = "top",
    dark = false,
    children,
}: ToastProviderProps) {
    return (
        <RadixToast.Provider duration={duration} swipeDirection="right">
            {children}
            {/* Dark-mode portal fix: wrap Viewport in a div with the dark class.
                Radix Toast.Viewport portals to document.body (outside .dark ancestor). */}
            <div className={dark ? "dark" : ""} style={{ pointerEvents: "none" }}>
                <RadixToast.Viewport
                    className={cn(
                        // Fixed-position stack of toasts
                        "fixed flex flex-col",
                        // No gap here — margin-top on each Toast.Root provides the 20px gap
                        "p-[20px]",
                        // Above dialogs — Blueprint: $pt-z-index-overlay * 2 ~ 80
                        "z-[80]",
                        // Override: individual toasts restore pointer-events
                        "pointer-events-none",
                        // Position classes
                        POSITION_CLASSES[position],
                    )}
                />
            </div>
        </RadixToast.Provider>
    );
}

// ─── Imperative Toaster ────────────────────────────────────────────────────────

export interface ToasterState {
    id: string;
    props: ToastProps;
}

export interface ToasterContextValue {
    show: (props: ToastProps) => string;
    dismiss: (id: string) => void;
    clear: () => void;
}

const ToasterContext = createContext<ToasterContextValue | null>(null);

export interface ToasterProps extends ToastProviderProps {
    children?: React.ReactNode;
}

let _toastId = 0;

/**
 * Toaster — wraps ToastProvider and provides an imperative API via `useToaster()`.
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <Toaster dark={dark} position="top">
 *       <MyContent />
 *     </Toaster>
 *   );
 * }
 *
 * function MyContent() {
 *   const toaster = useToaster();
 *   return <Button onClick={() => toaster.show({ message: "Saved!", intent: "success" })}>Save</Button>;
 * }
 * ```
 */
export function Toaster({ children, ...providerProps }: ToasterProps) {
    const [toasts, setToasts] = useState<ToasterState[]>([]);

    const show = useCallback((props: ToastProps): string => {
        const id = `toast-${_toastId++}`;
        setToasts((prev) => [...prev, { id, props }]);
        return id;
    }, []);

    const dismiss = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const clear = useCallback(() => {
        setToasts([]);
    }, []);

    const contextValue: ToasterContextValue = { show, dismiss, clear };

    return (
        <ToasterContext.Provider value={contextValue}>
            <ToastProvider {...providerProps}>
                {children}
                {toasts.map(({ id, props }) => (
                    <Toast
                        key={id}
                        {...props}
                        onDismiss={(didTimeoutExpire) => {
                            dismiss(id);
                            props.onDismiss?.(didTimeoutExpire);
                        }}
                    />
                ))}
            </ToastProvider>
        </ToasterContext.Provider>
    );
}

/**
 * Returns the imperative Toaster API: `show`, `dismiss`, `clear`.
 * Must be called inside a `<Toaster>` subtree.
 */
export function useToaster(): ToasterContextValue {
    const ctx = useContext(ToasterContext);
    if (!ctx) {
        throw new Error("useToaster must be used inside a <Toaster>.");
    }
    return ctx;
}
