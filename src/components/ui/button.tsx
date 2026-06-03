import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { createContext, forwardRef, useContext } from "react";

import { cn } from "@/lib/utils";
import type { Intent } from "@/lib/types";
import { resolveIcon, type IconProp } from "./icon";
import { Spinner } from "./spinner";

export type ButtonIntent = Intent;
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
    // Warning solid is a Blueprint special case: lightened amber fill + dark text.
    // Uses the warning seed tiers (rest = lightened-warning token ≈ orange-5,
    // hover = warning-disabled = orange-4, active = warning rest = orange-3) so it re-tints.
    warning:
        "bg-warning-solid-bg text-warning-foreground hover:bg-warning-disabled active:bg-warning data-[active=true]:bg-warning",
    danger: "bg-danger text-danger-foreground hover:bg-danger-hover active:bg-danger-active data-[active=true]:bg-danger-active",
};

// Outlined/minimal intent text uses theme-aware `--intent-*-minimal-text` tokens
// (intent hover/-2 in light, Blueprint's color-mix-with-white shade in dark). Borders
// are that same color at 60% alpha. Hover/active tints derive from the intent seed
// (rest = tier-3; dark hover = tier-4 = the *disabled* seed) so they re-tint with the theme.
const OUTLINED: Record<ButtonIntent, string> = {
    none: "border-border-strong text-foreground dark:text-white dark:[&_svg]:fill-white hover:bg-interactive-hover active:bg-interactive-active data-[active=true]:bg-interactive-active",
    primary:
        "border-intent-primary-minimal-text/60 text-intent-primary-minimal-text hover:bg-primary/10 active:bg-primary/20 data-[active=true]:bg-primary/20 dark:hover:bg-primary-disabled/15",
    success:
        "border-intent-success-minimal-text/60 text-intent-success-minimal-text hover:bg-success/10 active:bg-success/20 data-[active=true]:bg-success/20 dark:hover:bg-success-disabled/15",
    warning:
        "border-intent-warning-minimal-text/60 text-intent-warning-minimal-text hover:bg-warning/10 active:bg-warning/20 data-[active=true]:bg-warning/20 dark:hover:bg-warning-disabled/15",
    danger: "border-intent-danger-minimal-text/60 text-intent-danger-minimal-text hover:bg-danger/10 active:bg-danger/20 data-[active=true]:bg-danger/20 dark:hover:bg-danger-disabled/15",
};

const MINIMAL: Record<ButtonIntent, string> = {
    none: "text-foreground dark:text-white dark:[&_svg]:fill-white hover:bg-interactive-hover active:bg-interactive-active data-[active=true]:bg-interactive-active",
    primary:
        "text-intent-primary-minimal-text hover:bg-primary/10 active:bg-primary/20 data-[active=true]:bg-primary/20 dark:hover:bg-primary-disabled/15",
    success: "text-intent-success-minimal-text hover:bg-success/10 active:bg-success/20 data-[active=true]:bg-success/20 dark:hover:bg-success-disabled/15",
    warning: "text-intent-warning-minimal-text hover:bg-warning/10 active:bg-warning/20 data-[active=true]:bg-warning/20 dark:hover:bg-warning-disabled/15",
    danger: "text-intent-danger-minimal-text hover:bg-danger/10 active:bg-danger/20 data-[active=true]:bg-danger/20 dark:hover:bg-danger-disabled/15",
};

const VARIANT_MAP = { solid: SOLID, outlined: OUTLINED, minimal: MINIMAL } as const;

export const buttonVariants = cva(
    [
        // Tag-agnostic marker (matches Blueprint's own `.bp6-button`). Inert as styling, but
        // lets a parent ControlGroup target button-styled controls by class instead of element
        // — so an `asChild` Button or an AnchorButton (both render <a>, not <button>) still get
        // the button z-index tiers. Carried by every consumer of buttonVariants.
        "bp6-button",
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
            // Icon-only buttons render square (no text to widen them). Blueprint keeps the
            // default horizontal padding and pulls the icon in with negative margins so the
            // button collapses to its square `min-width`; we instead pin `width` to the same
            // square dimension (width is not a fidelity-compared prop, and padding/min-width
            // stay intact). The icon centers and may overflow the content box, as in Blueprint.
            iconOnly: { true: "", false: "" },
        },
        compoundVariants: [
            ...(["solid", "outlined", "minimal"] as const).flatMap((variant) =>
                INTENTS.map((intent) => ({ variant, intent, class: VARIANT_MAP[variant][intent] })),
            ),
            { iconOnly: true, fill: false, size: "small", class: "w-6" },
            { iconOnly: true, fill: false, size: "medium", class: "w-7.5" },
            { iconOnly: true, fill: false, size: "large", class: "w-10" },
        ],
        defaultVariants: { variant: "solid", intent: "none", size: "medium", fill: false, iconOnly: false },
    },
);

export interface ButtonProps
    extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color">,
        VariantProps<typeof buttonVariants> {
    /** Render as the child element (Radix Slot) — for links styled as buttons. Disables icon/loading composition. */
    asChild?: boolean;
    /** Persistent pressed appearance. */
    active?: boolean;
    /** Icon rendered before the text. An icon-name string (e.g. `"add"`) or a custom element. */
    icon?: IconProp;
    /** Icon rendered after the text. An icon-name string or a custom element. */
    endIcon?: IconProp;
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

    // Resolve string icon names to <Icon> (with `!text-current` so the glyph inherits
    // the button's text color instead of Icon's default `text-foreground`). A custom
    // element / false / null passes through; the SVG is sized by `[&_svg]:size-*` above.
    const iconNode = resolveIcon(icon, { className: "!text-current" });
    const endIconNode = resolveIcon(endIcon, { className: "!text-current" });

    // Icon-only (no text children): render square so the button matches Blueprint's
    // square icon buttons instead of growing 2px wider than its min-width.
    const iconOnly = !asChild && children == null && (!!iconNode || !!endIconNode);

    const classes = cn(
        buttonVariants({ variant: resolvedVariant, intent, size: resolvedSize, fill, iconOnly }),
        className,
    );

    // Expose a real (non-"none") intent so a parent ControlGroup can raise this button
    // above its neighbors (z-index intent tier). Omitted entirely for the default intent.
    const dataIntent = intent && intent !== "none" ? intent : undefined;

    if (asChild) {
        return (
            <Slot ref={ref} className={classes} data-active={active || undefined} data-intent={dataIntent} {...props}>
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
            data-intent={dataIntent}
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
            {iconNode && <span className={cn("inline-flex", hidden)}>{iconNode}</span>}
            {children != null && <span className={hidden}>{children}</span>}
            {endIconNode && <span className={cn("inline-flex", hidden)}>{endIconNode}</span>}
        </button>
    );
});
