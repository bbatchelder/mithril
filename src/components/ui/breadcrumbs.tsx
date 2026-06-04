"use client";

import { forwardRef } from "react";

import { cn } from "@/lib/utils";
import { Icon } from "./icon";
import { chevronRight, type IconName } from "./icons";

/**
 * Breadcrumbs component — pixel-faithful reimplementation of Blueprint's Breadcrumbs.
 *
 * Blueprint spec (`packages/core/src/components/breadcrumbs/_breadcrumbs.scss`, v6.15):
 *
 * $pt-spacing = 4px
 * $pt-input-height = $pt-spacing * 7.5 = 30px
 * $pt-icon-size-standard = $pt-spacing * 4 = 16px
 * $pt-font-size-large = $pt-spacing * 4 = 16px
 *
 * Container (.bp6-breadcrumbs):
 *   display: flex; flex-wrap: wrap; align-items: center
 *   height: $pt-input-height = 30px
 *   list-style: none; margin: 0; padding: 0; cursor: default
 *
 * List item (> li):
 *   display: flex; align-items: center
 *   ::after chevron-right separator:
 *     16×16px SVG; margin: 0 $pt-spacing (4px); color = $pt-icon-color
 *   :last-of-type::after: display:none (no trailing separator)
 *
 * Crumb base (.bp6-breadcrumb, .bp6-breadcrumb-current, .bp6-breadcrumbs-collapsed):
 *   display: inline-flex; align-items: center
 *   font-size: $pt-font-size-large = 16px
 *
 * Link crumbs (.bp6-breadcrumb):
 *   color: $pt-text-color-muted = $gray1 = #5f6b7c (light) / $gray4 = #abb3bf (dark)
 *   hover: text-decoration: none (Blueprint suppresses underline; color implicitly restores on hover)
 *   .bp6-icon: margin-right: $pt-spacing = 4px
 *
 * Disabled (.bp6-disabled):
 *   color: $pt-text-color-disabled = rgba($gray1, 0.6) (light) / rgba($gray4, 0.6) (dark)
 *   cursor: not-allowed
 *
 * Current crumb (.bp6-breadcrumb-current):
 *   color: inherit (inherits full text color from parent)
 *   font-weight: 600
 *
 * Separator icon color = $pt-icon-color = $pt-text-color-muted (light: gray-1, dark: gray-4)
 *
 * TODO(follow-up): overflow collapse via OverflowList+Menu+Popover
 *   Blueprint renders a .bp6-breadcrumbs-collapsed button when items overflow the available
 *   width, showing a "…" (more icon) that opens a Menu of hidden crumbs via Popover.
 *   This requires OverflowList + Menu + Popover — deferred to a follow-up PR.
 *
 * @see https://blueprintjs.com/docs/#core/components/breadcrumbs
 */

// ─── BreadcrumbItem ──────────────────────────────────────────────────────────

export interface BreadcrumbItem {
    /**
     * Display text for this crumb. At least one of `text` or `icon` should be provided.
     */
    text?: React.ReactNode;

    /**
     * Blueprint icon name to show left of the text.
     */
    icon?: IconName;

    /**
     * Accessible title for the icon (when the crumb has only an icon and no text).
     */
    iconTitle?: string;

    /**
     * Href for link crumbs. If omitted and no `onClick` is given, crumb renders as a span.
     */
    href?: string;

    /**
     * Click handler. If provided alongside `href`, both navigate; disabled crumbs ignore it.
     */
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;

    /**
     * Whether this is the currently active / final crumb. Current crumbs render bold
     * and non-interactive (as a span, not an anchor).
     * @default false
     */
    current?: boolean;

    /**
     * Whether the crumb is disabled. Disabled crumbs are non-interactive and dimmed.
     * @default false
     */
    disabled?: boolean;

    /**
     * Extra class applied to the individual crumb element.
     */
    className?: string;

    /**
     * Forwarded to the crumb element (anchor or span).
     */
    "data-compare"?: string;
}

// ─── Breadcrumb (single crumb) ───────────────────────────────────────────────

export interface BreadcrumbProps extends Omit<BreadcrumbItem, "data-compare"> {
    /** data-compare attribute forwarded to the crumb element for harness comparison. */
    "data-compare"?: string;
}

/**
 * A single crumb in a Breadcrumbs trail. Rendered internally by Breadcrumbs;
 * can also be composed directly.
 *
 * Quick reference:
 *   <Breadcrumb text="Home" href="/" icon="home" />
 *   <Breadcrumb text="Settings" href="/settings" />
 *   <Breadcrumb text="Current Page" current />
 */
export const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(function Breadcrumb(
    { text, icon, iconTitle, href, onClick, current = false, disabled = false, className, ...rest },
    ref,
) {
    // Blueprint's .bp6-breadcrumb base:
    //   display: inline-flex; align-items: center; font-size: 16px ($pt-font-size-large)
    //
    // Muted color for link/non-current crumbs:
    //   light: $gray1 (#5f6b7c) = text-gray-1
    //   dark:  $gray4 (#abb3bf) = text-gray-4 (= --foreground-muted token)
    //   The --foreground-muted semantic token maps exactly to these values.
    //
    // Current crumb:
    //   color: inherit (full foreground); font-weight: 600
    //
    // Disabled crumb:
    //   color: rgba($gray1, 0.6) light / rgba($gray4, 0.6) dark = --foreground-disabled
    const baseClasses = cn(
        // Base layout: inline-flex, centered, 16px font (= $pt-font-size-large = 4*4px)
        "inline-flex items-center text-body-lg",
        // Current crumb: bold, inherits foreground color
        current && "font-semibold text-foreground",
        // Link/non-current: muted color (gray-1 light / gray-4 dark)
        !current && !disabled && "text-foreground-muted",
        // Disabled: even more muted (rgba(gray1, 0.6) light / rgba(gray4, 0.6) dark)
        disabled && "text-foreground-disabled cursor-not-allowed",
        className,
    );

    const iconEl = icon ? (
        <Icon
            icon={icon}
            title={iconTitle}
            // Blueprint: .bp6-breadcrumb .bp6-icon { margin-right: $pt-spacing = 4px }
            className="mr-1"
        />
    ) : null;

    // Current crumbs OR crumbs with no href/onClick render as a plain span (non-interactive).
    if (current || (href == null && onClick == null)) {
        return (
            <span
                ref={ref as React.Ref<HTMLSpanElement>}
                className={baseClasses}
                {...rest}
            >
                {iconEl}
                {text}
            </span>
        );
    }

    // Link crumbs: anchor with hover color restoration.
    // Blueprint hover: text-decoration:none (no underline); color implicitly becomes full text color.
    // We use hover:text-foreground to restore from muted → full color on hover.
    return (
        <a
            ref={ref as React.Ref<HTMLAnchorElement>}
            href={href}
            onClick={disabled ? undefined : onClick}
            tabIndex={disabled ? undefined : 0}
            className={cn(
                baseClasses,
                // On hover, restore to full foreground color (Blueprint behavior: color restores on hover)
                !disabled && "hover:text-foreground hover:no-underline",
            )}
            {...rest}
        >
            {iconEl}
            {text}
        </a>
    );
});

Breadcrumb.displayName = "Breadcrumb";

// ─── Breadcrumbs (container) ─────────────────────────────────────────────────

export interface BreadcrumbsProps extends React.HTMLAttributes<HTMLUListElement> {
    /**
     * Ordered list of crumb definitions. Renders as `<li>` items with chevron separators.
     */
    items: BreadcrumbItem[];

    /**
     * Extra class on the outer `<ul>`.
     */
    className?: string;
}

/**
 * Horizontal breadcrumb trail with chevron-right separators.
 *
 * Quick reference:
 *   <Breadcrumbs
 *     items={[
 *       { text: "Home", href: "/" },
 *       { text: "Projects", href: "/projects" },
 *       { text: "Current Project", current: true },
 *     ]}
 *   />
 *
 * TODO(follow-up): overflow collapse via OverflowList+Menu+Popover
 *   When items overflow the available container width, Blueprint collapses middle crumbs into
 *   a "…" button that opens a Menu via Popover. Deferred — requires OverflowList + Popover + Menu.
 */
export const Breadcrumbs = forwardRef<HTMLUListElement, BreadcrumbsProps>(function Breadcrumbs(
    { items, className, ...htmlProps },
    ref,
) {
    return (
        // Container: .bp6-breadcrumbs
        //   display: flex; flex-wrap: wrap; align-items: center
        //   height: $pt-input-height = 30px (4 * 7.5)
        //   list-style: none; margin: 0; padding: 0; cursor: default
        <ul
            ref={ref}
            className={cn(
                "flex flex-wrap items-center",
                "h-[30px]", // $pt-input-height = $pt-spacing * 7.5 = 30px
                "list-none m-0 p-0 cursor-default",
                className,
            )}
            {...htmlProps}
        >
            {items.map((item, index) => {
                const isLast = index === items.length - 1;
                const { "data-compare": dataCompare, ...itemRest } = item;

                return (
                    // List item: .bp6-breadcrumbs > li
                    //   display: flex; align-items: center
                    //   ::after: chevron-right 16px × 16px, margin: 0 4px, color = $pt-icon-color
                    //   :last-of-type::after: display: none
                    <li
                        key={index}
                        className="flex items-center"
                    >
                        <Breadcrumb
                            {...itemRest}
                            data-compare={dataCompare}
                        />
                        {/* Separator: chevron-right, 16px, muted icon color.
                            Blueprint uses ::after pseudo with SVG background; we render an Icon.
                            Color: $pt-icon-color = $pt-text-color-muted = foreground-muted.
                            Margin: 0 $pt-spacing = 0 4px → mx-1 (4px each side).
                            Hidden on last item (::last-of-type::after { display: none }). */}
                        {!isLast && (
                            <Icon
                                icon={chevronRight}
                                // Inherits text-foreground-muted color via className override
                                className="text-foreground-muted mx-1 shrink-0"
                                aria-hidden
                            />
                        )}
                    </li>
                );
            })}
        </ul>
    );
});

Breadcrumbs.displayName = "Breadcrumbs";
