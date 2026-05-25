import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import { forwardRef } from "react";

import { cn } from "@/lib/utils";

export type ButtonIntent = "none" | "primary" | "success" | "warning" | "danger";
export type ButtonVariant = "solid" | "outlined" | "minimal";
export type ButtonSize = "small" | "medium" | "large";

const INTENTS: ButtonIntent[] = ["none", "primary", "success", "warning", "danger"];

/**
 * Per-(variant, intent) color classes. Written as literal utility strings so
 * Tailwind's scanner emits every color — and `data-[active]` mirrors the
 * pressed (`:active`) fill so the `active` prop renders the same look.
 */
const SOLID: Record<ButtonIntent, string> = {
    none: "bg-light-gray-5 text-foreground hover:bg-light-gray-4 active:bg-light-gray-2 data-[active=true]:bg-light-gray-2 dark:bg-dark-gray-4 dark:hover:bg-dark-gray-3 dark:active:bg-dark-gray-2 dark:data-[active=true]:bg-dark-gray-2",
    primary:
        "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active data-[active=true]:bg-primary-active",
    success:
        "bg-success text-success-foreground hover:bg-success-hover active:bg-success-active data-[active=true]:bg-success-active",
    // Warning solid is a Blueprint special case: light amber (orange-5) fill + black text.
    warning:
        "bg-orange-5 text-warning-foreground hover:bg-orange-4 active:bg-orange-3 data-[active=true]:bg-orange-3",
    danger: "bg-danger text-danger-foreground hover:bg-danger-hover active:bg-danger-active data-[active=true]:bg-danger-active",
};

const OUTLINED: Record<ButtonIntent, string> = {
    none: "border-border-strong text-foreground hover:bg-interactive-hover active:bg-interactive-active data-[active=true]:bg-interactive-active",
    primary:
        "border-blue-3/50 text-blue-2 hover:bg-blue-3/10 active:bg-blue-3/20 data-[active=true]:bg-blue-3/20 dark:border-blue-4/50 dark:text-blue-4 dark:hover:bg-blue-4/15",
    success:
        "border-green-3/50 text-green-2 hover:bg-green-3/10 active:bg-green-3/20 data-[active=true]:bg-green-3/20 dark:border-green-4/50 dark:text-green-4 dark:hover:bg-green-4/15",
    warning:
        "border-orange-3/50 text-orange-2 hover:bg-orange-3/10 active:bg-orange-3/20 data-[active=true]:bg-orange-3/20 dark:border-orange-4/50 dark:text-orange-4 dark:hover:bg-orange-4/15",
    danger: "border-red-3/50 text-red-2 hover:bg-red-3/10 active:bg-red-3/20 data-[active=true]:bg-red-3/20 dark:border-red-4/50 dark:text-red-4 dark:hover:bg-red-4/15",
};

const MINIMAL: Record<ButtonIntent, string> = {
    none: "text-foreground hover:bg-interactive-hover active:bg-interactive-active data-[active=true]:bg-interactive-active",
    primary:
        "text-blue-2 hover:bg-blue-3/10 active:bg-blue-3/20 data-[active=true]:bg-blue-3/20 dark:text-blue-4 dark:hover:bg-blue-4/15",
    success: "text-green-2 hover:bg-green-3/10 active:bg-green-3/20 data-[active=true]:bg-green-3/20 dark:text-green-4 dark:hover:bg-green-4/15",
    warning: "text-orange-2 hover:bg-orange-3/10 active:bg-orange-3/20 data-[active=true]:bg-orange-3/20 dark:text-orange-4 dark:hover:bg-orange-4/15",
    danger: "text-red-2 hover:bg-red-3/10 active:bg-red-3/20 data-[active=true]:bg-red-3/20 dark:text-red-4 dark:hover:bg-red-4/15",
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
    const classes = cn(buttonVariants({ variant, intent, size, fill }), className);

    if (asChild) {
        return (
            <Slot ref={ref} className={classes} data-active={active || undefined} {...props}>
                {children}
            </Slot>
        );
    }

    const hidden = loading ? "invisible" : undefined;

    return (
        <button
            ref={ref}
            className={classes}
            data-active={active || undefined}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <span className="absolute inset-0 inline-flex items-center justify-center" aria-hidden="true">
                    <LoaderCircle className="animate-spin" />
                </span>
            )}
            {icon != null && <span className={cn("inline-flex", hidden)}>{icon}</span>}
            {children != null && <span className={hidden}>{children}</span>}
            {endIcon != null && <span className={cn("inline-flex", hidden)}>{endIcon}</span>}
        </button>
    );
});
