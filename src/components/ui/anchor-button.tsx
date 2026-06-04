"use client";

import { type VariantProps } from "class-variance-authority";
import { forwardRef, useContext } from "react";

import { cn } from "@/lib/utils";
import { buttonVariants, ButtonGroupContext } from "./button";
import { resolveIcon, type IconProp } from "./icon";
import { Spinner } from "./spinner";

export interface AnchorButtonProps
    extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "color">,
        VariantProps<typeof buttonVariants> {
    /** Persistent pressed appearance. */
    active?: boolean;
    /** Disable the anchor: removes `href`, sets `aria-disabled`, takes it out of the tab order. */
    disabled?: boolean;
    /** Icon rendered before the text. An icon-name string (e.g. `"add"`) or a custom element. */
    icon?: IconProp;
    /** Icon rendered after the text. An icon-name string or a custom element. */
    endIcon?: IconProp;
    /** Show a centered spinner and disable the anchor; width is preserved. */
    loading?: boolean;
    /** Expand to fill the container width. */
    fill?: boolean;
}

/**
 * An `<a>` rendered with `Button`'s exact styling but anchor + disabled semantics.
 *
 * Use this when a button-styled control needs to be a real link (navigation, an `href`,
 * right-click "open in new tab"). It reuses `buttonVariants` from `button.tsx` so the look
 * stays identical and DRY, and consumes `ButtonGroupContext` so it composes inside a
 * `<ButtonGroup>` just like `Button`.
 *
 * Semantics: an enabled anchor with an `href` is a *real link*, so it keeps its native
 * `link` role — assistive tech announces it as a link and "open in new tab" works. We only
 * apply `role="button"` when the element is *not* a link: either it's disabled (no `href`) or
 * it's used as a button with no `href` (activated via `onClick`).
 *
 * Disabled handling: an `<a>` can't be natively `disabled`, so — matching Blueprint's
 * `AnchorButton` — we set `role="button"` + `aria-disabled`, drop `href`, pull it out of the
 * tab order (`tabIndex={-1}`), kill pointer events, and block click/keyboard activation.
 */
export const AnchorButton = forwardRef<HTMLAnchorElement, AnchorButtonProps>(function AnchorButton(
    {
        className,
        variant,
        intent,
        size,
        fill,
        active,
        icon,
        endIcon,
        loading = false,
        disabled: disabledProp,
        href,
        tabIndex,
        children,
        onClick,
        onKeyDown,
        ...props
    },
    ref,
) {
    // A parent ButtonGroup supplies variant/size defaults; an explicit prop overrides.
    const group = useContext(ButtonGroupContext);
    const resolvedVariant = variant ?? group?.variant;
    const resolvedSize = size ?? group?.size;

    // `loading` implies disabled (even if disabled={false}), matching Button/Blueprint.
    const disabled = disabledProp || loading;

    // An enabled anchor with an href is a genuine link — keep its native `link` role.
    // Otherwise (disabled, or no href and acting as a button) expose `role="button"`.
    const isLink = !disabled && href != null;

    const classes = cn(
        buttonVariants({ variant: resolvedVariant, intent, size: resolvedSize, fill }),
        // Anchors can't be natively `disabled`, so `buttonVariants`' `disabled:` utilities
        // (which key off the `:disabled` pseudo-class) never fire on an <a>. Re-apply the same
        // muted treatment Button gets — opacity-50, no shadow, not-allowed cursor — keyed off our
        // JS `disabled` flag instead, and block interaction with `pointer-events-none` (the
        // keyboard/click guards below belt-and-suspenders the activation block).
        disabled && "pointer-events-none cursor-not-allowed opacity-50 shadow-none",
        className,
    );

    // While loading, hide the label visually but keep it in the accessibility tree so the
    // control retains its name (WCAG 4.1.2). `opacity-0` stays in the a11y tree and keeps
    // layout/width stable; `invisible` (visibility:hidden) would drop the name entirely.
    const hidden = loading ? "opacity-0" : undefined;

    // Mirror Button: expose a real (non-"none") intent so a parent ControlGroup raises this
    // anchor above its neighbors (z-index intent tier), matched via the `.bp6-button` marker.
    const dataIntent = intent && intent !== "none" ? intent : undefined;

    // Resolve string icon names to <Icon> (with `!text-current` so the glyph inherits the
    // anchor's text color); a custom element / false / null passes through unchanged.
    const iconNode = resolveIcon(icon, { className: "!text-current" });
    const endIconNode = resolveIcon(endIcon, { className: "!text-current" });

    return (
        <a
            ref={ref}
            role={isLink ? undefined : "button"}
            className={classes}
            data-active={active || undefined}
            data-intent={dataIntent}
            aria-disabled={disabled || undefined}
            // Remove href when disabled so the anchor isn't a navigable/activatable link.
            href={disabled ? undefined : href}
            // Out of the tab order when disabled; otherwise honor an explicit tabIndex (default 0).
            tabIndex={disabled ? -1 : (tabIndex ?? 0)}
            aria-busy={loading || undefined}
            onClick={(event) => {
                if (disabled) {
                    event.preventDefault();
                    return;
                }
                onClick?.(event);
            }}
            onKeyDown={(event) => {
                if (disabled && (event.key === "Enter" || event.key === " ")) {
                    event.preventDefault();
                    return;
                }
                onKeyDown?.(event);
            }}
            {...props}
        >
            {loading && (
                // Spinner head inherits the control's text color (`stroke: currentColor`);
                // `[&_path:last-child]` targets the head path (the track stays faint).
                // Size tracks the control's icon size (16/20).
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
        </a>
    );
});
