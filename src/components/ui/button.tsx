import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { createContext, forwardRef, useContext } from "react";

import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

export type ButtonIntent = "none" | "primary" | "success" | "warning" | "danger";
export type ButtonVariant = "solid" | "outlined" | "minimal";
export type ButtonSize = "small" | "medium" | "large";

/**
 * Lets a `<ButtonGroup>` push shared `variant`/`size` defaults down to its child
 * `<Button>`s without each call site repeating them. A button's own explicit
 * `variant`/`size` prop always wins over the group's. Lives here (not in
 * button-group.tsx) so Button stays self-contained — the dependency points
 * ButtonGroup → Button, never the reverse.
 */
export interface ButtonGroupContextValue {
    variant?: ButtonVariant;
    size?: ButtonSize;
}
export const ButtonGroupContext = createContext<ButtonGroupContextValue | null>(null);

const INTENTS: ButtonIntent[] = ["none", "primary", "success", "warning", "danger"];

/**
 * Per-(variant, intent) color classes. Written as literal utility strings so
 * Tailwind's scanner emits every color — and `data-[active]` mirrors the
 * pressed (`:active`) fill so the `active` prop renders the same look.
 */
const SOLID: Record<ButtonIntent, string> = {
    // Dark rest bg = Blueprint's oklch-derived default-control surface rgb(48,55,64) = #303740
    // (a hair lighter than the flat dark-gray-3 #2f343c used for panels). See handoff 0063.
    // Dark "none"-control text + icon are white (#fff) to match Blueprint, not #f6f7f9.
    // Body/menu text stays #f6f7f9; only the control text goes white. See handoff 0064 (Delta #1).
    none: "bg-light-gray-5 text-foreground dark:text-white dark:[&_svg]:fill-white hover:bg-light-gray-4 active:bg-light-gray-2 data-[active=true]:bg-light-gray-2 dark:bg-[#303740] dark:hover:bg-dark-gray-2 dark:active:bg-dark-gray-1 dark:data-[active=true]:bg-dark-gray-1",
    primary:
        "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active data-[active=true]:bg-primary-active",
    success:
        "bg-success text-success-foreground hover:bg-success-hover active:bg-success-active data-[active=true]:bg-success-active",
    // Warning solid is a Blueprint special case: light amber (orange-5) fill + black text.
    warning:
        "bg-orange-5 text-warning-foreground hover:bg-orange-4 active:bg-orange-3 data-[active=true]:bg-orange-3",
    danger: "bg-danger text-danger-foreground hover:bg-danger-hover active:bg-danger-active data-[active=true]:bg-danger-active",
};

// Outlined/minimal intent text uses theme-aware `--intent-*-text` tokens (palette -2
// in light, Blueprint's color-mix-with-white shade in dark). Outlined borders are that
// same color at 60% alpha — Blueprint's `color-mix(in oklch, text 60%, transparent)`.
const OUTLINED: Record<ButtonIntent, string> = {
    none: "border-border-strong text-foreground dark:text-white dark:[&_svg]:fill-white hover:bg-interactive-hover active:bg-interactive-active data-[active=true]:bg-interactive-active",
    primary:
        "border-intent-primary-text/60 text-intent-primary-text hover:bg-blue-3/10 active:bg-blue-3/20 data-[active=true]:bg-blue-3/20 dark:hover:bg-blue-4/15",
    success:
        "border-intent-success-text/60 text-intent-success-text hover:bg-green-3/10 active:bg-green-3/20 data-[active=true]:bg-green-3/20 dark:hover:bg-green-4/15",
    warning:
        "border-intent-warning-text/60 text-intent-warning-text hover:bg-orange-3/10 active:bg-orange-3/20 data-[active=true]:bg-orange-3/20 dark:hover:bg-orange-4/15",
    danger: "border-intent-danger-text/60 text-intent-danger-text hover:bg-red-3/10 active:bg-red-3/20 data-[active=true]:bg-red-3/20 dark:hover:bg-red-4/15",
};

const MINIMAL: Record<ButtonIntent, string> = {
    none: "text-foreground dark:text-white dark:[&_svg]:fill-white hover:bg-interactive-hover active:bg-interactive-active data-[active=true]:bg-interactive-active",
    primary:
        "text-intent-primary-text hover:bg-blue-3/10 active:bg-blue-3/20 data-[active=true]:bg-blue-3/20 dark:hover:bg-blue-4/15",
    success: "text-intent-success-text hover:bg-green-3/10 active:bg-green-3/20 data-[active=true]:bg-green-3/20 dark:hover:bg-green-4/15",
    warning: "text-intent-warning-text hover:bg-orange-3/10 active:bg-orange-3/20 data-[active=true]:bg-orange-3/20 dark:hover:bg-orange-4/15",
    danger: "text-intent-danger-text hover:bg-red-3/10 active:bg-red-3/20 data-[active=true]:bg-red-3/20 dark:hover:bg-red-4/15",
};

const VARIANT_MAP = { solid: SOLID, outlined: OUTLINED, minimal: MINIMAL } as const;

export const buttonVariants = cva(
    [
        "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-bp align-middle",
        "font-normal select-none cursor-pointer transition-colors duration-100 ease-bp",
        "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
        "[&_svg]:shrink-0 [&_svg]:size-4",
    ],
    {
        variants: {
            variant: {
                solid: "shadow-button",
                outlined: "border bg-transparent",
                minimal: "bg-transparent",
            },
            intent: { none: "", primary: "", success: "", warning: "", danger: "" },
            size: {
                small: "h-6 min-w-6 px-2 text-body",
                medium: "h-7.5 min-w-7.5 px-2 text-body",
                large: "h-10 min-w-10 px-4 text-body-lg [&_svg]:size-5",
            },
            fill: { true: "w-full", false: "" },
        },
        compoundVariants: (["solid", "outlined", "minimal"] as const).flatMap((variant) =>
            INTENTS.map((intent) => ({ variant, intent, class: VARIANT_MAP[variant][intent] })),
        ),
        defaultVariants: { variant: "solid", intent: "none", size: "medium", fill: false },
    },
);

export interface ButtonProps
    extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color">,
        VariantProps<typeof buttonVariants> {
    /** Render as the child element (Radix Slot) — for links styled as buttons. Disables icon/loading composition. */
    asChild?: boolean;
    /** Persistent pressed appearance. */
    active?: boolean;
    /** Icon rendered before the text. */
    icon?: React.ReactNode;
    /** Icon rendered after the text. */
    endIcon?: React.ReactNode;
    /** Show a centered spinner and disable the button; width is preserved. */
    loading?: boolean;
    /** Expand to fill the container width. */
    fill?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    { className, variant, intent, size, fill, active, icon, endIcon, loading = false, disabled, asChild = false, children, ...props },
    ref,
) {
    // A parent ButtonGroup supplies variant/size defaults; an explicit prop overrides.
    const group = useContext(ButtonGroupContext);
    const resolvedVariant = variant ?? group?.variant;
    const resolvedSize = size ?? group?.size;

    const classes = cn(buttonVariants({ variant: resolvedVariant, intent, size: resolvedSize, fill }), className);

    if (asChild) {
        return (
            <Slot ref={ref} className={classes} data-active={active || undefined} {...props}>
                {children}
            </Slot>
        );
    }

    // While loading, hide the label visually but keep it in the accessibility tree so the
    // button retains its name (WCAG 4.1.2). `opacity-0` stays in the a11y tree and keeps
    // layout/width stable; `invisible` (visibility:hidden) would drop the name entirely.
    const hidden = loading ? "opacity-0" : undefined;

    return (
        <button
            ref={ref}
            className={classes}
            data-active={active || undefined}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            {...props}
        >
            {loading && (
                // Blueprint's button spinner head inherits the button's text color
                // (`stroke: $text-color`); `[&_path:last-child]` targets the head path
                // (the track stays faint). Size tracks the button's icon size (16/20).
                <span
                    className="absolute inset-0 inline-flex items-center justify-center [&_path:last-child]:!stroke-current"
                    aria-hidden="true"
                >
                    <Spinner size={resolvedSize === "large" ? 20 : 16} />
                </span>
            )}
            {icon != null && <span className={cn("inline-flex", hidden)}>{icon}</span>}
            {children != null && <span className={hidden}>{children}</span>}
            {endIcon != null && <span className={cn("inline-flex", hidden)}>{endIcon}</span>}
        </button>
    );
});
