/**
 * Menu + MenuItem + MenuDivider — Blueprint v6.15 fidelity.
 *
 * Standalone styled list (not portaled). Compose inside a Popover/ContextMenu
 * for dropdown behavior. Dark mode works via the ancestor `.dark` class.
 *
 * @see https://blueprintjs.com/docs/#core/components/menu
 */

import { createContext, forwardRef, useContext } from "react";

import { cn } from "@/lib/utils";
import type { Intent } from "@/lib/types";
import { Icon, type IconName } from "./icon";

/* ============================================================
 * Types
 * ============================================================ */

export type MenuIntent = Intent;

/**
 * Slot for integrating MenuItem with a parent menu *system* that owns keyboard
 * navigation — e.g. Radix ContextMenu. When a slot is provided via context, each
 * MenuItem renders its interactive element through the slot (a Radix `Item`) so the
 * parent supplies roving focus, typeahead, and Escape. ContextMenu sets this; in all
 * other contexts it is null and MenuItem renders its own `<button>`/`<a>`.
 */
export interface MenuItemSlotProps {
    className?: string;
    disabled?: boolean;
    /** Plain-text label for the parent's typeahead. */
    textValue?: string;
    /** Activation (click / Enter / Space), driven by the parent menu system. */
    onSelect?: (event: Event) => void;
    /** Forwarded to the rendered item for the comparison harness. */
    "data-compare"?: string;
    children: React.ReactNode;
}
export type MenuItemSlot = React.ComponentType<MenuItemSlotProps>;
export const MenuItemSlotContext = createContext<MenuItemSlot | null>(null);
export type MenuSize = "small" | "medium" | "large";

/* ============================================================
 * Menu container
 *
 * Blueprint metrics:
 *   bg: white (light) / dark-gray3 (dark)
 *   border-radius: 4px ($pt-border-radius)
 *   min-width: 180px ($pt-spacing * 45)
 *   padding: 4px ($pt-spacing) all sides
 *   list-style: none
 * ============================================================ */

export interface MenuProps extends React.HTMLAttributes<HTMLUListElement> {
    /** Size modifier — inherited by all MenuItem children. */
    size?: MenuSize;
    /** Forwarded ul ref. */
    ulRef?: React.Ref<HTMLUListElement>;
}

export const Menu = forwardRef<HTMLUListElement, MenuProps>(function Menu(
    { className, size = "medium", ulRef, children, ...props },
    ref,
) {
    // When inside a parent menu system (Radix ContextMenu sets the slot), that parent's
    // Content element is the role="menu"; this <ul> is then presentational to avoid a
    // nested/duplicate menu role.
    const slotted = useContext(MenuItemSlotContext) != null;
    return (
        <ul
            ref={ulRef ?? ref}
            role={slotted ? "none" : "menu"}
            {...props}
            className={cn(
                // Blueprint .bp6-menu metrics:
                // background: white (light) / dark-gray3 (dark)
                "bg-white dark:bg-dark-gray-3",
                // border-radius: 4px
                "rounded-bp",
                // color: $pt-text-color / $pt-dark-text-color
                "text-foreground",
                // list-style: none; margin: 0; padding: 4px; text-align: left
                "list-none m-0 p-1 text-left",
                // min-width: 180px ($pt-spacing * 45 = 4 * 45)
                "min-w-[180px]",
                // flex column for child spacing
                "flex flex-col",
                // Blueprint's .bp6-menu is block, so its li children resolve min-width to 0px.
                // Our flex-col makes them flex items (min-width: auto); reset to 0 to match.
                "[&>li]:min-w-0",
                // Size context — pass via data attribute for MenuItem children
                size !== "medium" && `menu-size-${size}`,
                className,
            )}
            data-menu-size={size}
        >
            {children}
        </ul>
    );
});

/* ============================================================
 * MenuItem
 *
 * Blueprint metrics:
 *   display: flex; flex-direction: row; gap: 8px (menu-item-padding)
 *   align-items: flex-start
 *   border-radius: 4px ($menu-item-border-radius = $pt-border-radius)
 *   padding: 4px 8px ($menu-item-padding-vertical $menu-item-padding)
 *   line-height: 22px ($menu-item-line-height)
 *   color: inherit
 *   cursor: pointer
 *
 * States:
 *   hover: rgba(gray3, 0.15) bg
 *   active (mouse): rgba(gray3, 0.3) bg
 *   .active (keyboard/selected): rgba(blue3, 0.1) bg + blue2 text (light)
 *                                  rgba(blue3, 0.2) bg + blue5 text (dark)
 *   intent: colored text; hover adds intent bg
 *   intent + active: stronger intent bg + darker text
 *   disabled: muted text, no pointer events
 *
 * Large: font-size 16px; padding-vertical 9px ($pt-spacing * 2.25)
 * Small: line-height 20px; padding-vertical 2px ($pt-spacing * 0.5)
 * ============================================================ */

// Active (keyboard/selected) state colors per intent — Blueprint's menu-item-active mixin.
// Light: rgba(intentBg, 0.1) bg, intentFg text
// Dark:  rgba(intentBg, 0.2) bg, intentFg-dark text
const ACTIVE_CLASSES: Record<MenuIntent, string> = {
    // none → uses primary colors (Blueprint behavior: no-intent active = primary tinted)
    none: [
        // bg: rgba(blue3, 0.1) light / rgba(blue3, 0.2) dark
        "bg-[rgba(45,114,210,0.1)] dark:bg-[rgba(45,114,210,0.2)]",
        // text: blue2 light / blue5 dark
        "text-blue-2 dark:text-blue-5",
        // icons inherit intent color
        "[&_.menu-icon]:text-blue-2 dark:[&_.menu-icon]:text-blue-5",
    ].join(" "),
    primary: [
        "bg-[rgba(45,114,210,0.1)] dark:bg-[rgba(45,114,210,0.2)]",
        "text-blue-2 dark:text-blue-5",
        "[&_.menu-icon]:text-blue-2 dark:[&_.menu-icon]:text-blue-5",
    ].join(" "),
    success: [
        "bg-[rgba(35,133,81,0.1)] dark:bg-[rgba(35,133,81,0.2)]",
        "text-green-2 dark:text-green-5",
        "[&_.menu-icon]:text-green-2 dark:[&_.menu-icon]:text-green-5",
    ].join(" "),
    warning: [
        "bg-[rgba(200,118,25,0.1)] dark:bg-[rgba(200,118,25,0.2)]",
        "text-orange-2 dark:text-orange-5",
        "[&_.menu-icon]:text-orange-2 dark:[&_.menu-icon]:text-orange-5",
    ].join(" "),
    danger: [
        "bg-[rgba(205,66,70,0.1)] dark:bg-[rgba(205,66,70,0.2)]",
        "text-red-2 dark:text-red-5",
        "[&_.menu-icon]:text-red-2 dark:[&_.menu-icon]:text-red-5",
    ].join(" "),
};

// Intent (non-active) text colors — Blueprint's menu-item-intent mixin.
// Light: palette -2 tier; Dark: palette -5 tier
const INTENT_CLASSES: Record<MenuIntent, string> = {
    none: "",
    primary: [
        // text: blue2 light / blue5 dark
        "text-blue-2 dark:text-blue-5",
        // hover: rgba(blue3, 0.1) light / rgba(blue3, 0.2) dark
        "hover:bg-[rgba(45,114,210,0.1)] dark:hover:bg-[rgba(45,114,210,0.2)]",
        // active (mouse press): rgba(blue3, 0.2) light / rgba(blue3, 0.3) dark
        "active:bg-[rgba(45,114,210,0.2)] dark:active:bg-[rgba(45,114,210,0.3)]",
    ].join(" "),
    success: [
        "text-green-2 dark:text-green-5",
        "hover:bg-[rgba(35,133,81,0.1)] dark:hover:bg-[rgba(35,133,81,0.2)]",
        "active:bg-[rgba(35,133,81,0.2)] dark:active:bg-[rgba(35,133,81,0.3)]",
    ].join(" "),
    warning: [
        "text-orange-2 dark:text-orange-5",
        "hover:bg-[rgba(200,118,25,0.1)] dark:hover:bg-[rgba(200,118,25,0.2)]",
        "active:bg-[rgba(200,118,25,0.2)] dark:active:bg-[rgba(200,118,25,0.3)]",
    ].join(" "),
    danger: [
        "text-red-2 dark:text-red-5",
        "hover:bg-[rgba(205,66,70,0.1)] dark:hover:bg-[rgba(205,66,70,0.2)]",
        "active:bg-[rgba(205,66,70,0.2)] dark:active:bg-[rgba(205,66,70,0.3)]",
    ].join(" "),
};

export interface MenuItemProps extends Omit<React.HTMLAttributes<HTMLLIElement>, "children"> {
    /** Primary label text. Required for usability. */
    text: React.ReactNode;
    /** Blueprint icon name rendered on the left. */
    icon?: IconName;
    /** Right-aligned secondary label (e.g. hotkey). */
    label?: React.ReactNode;
    /** Intent color. Affects text; on active/hover adds intent bg. */
    intent?: MenuIntent;
    /** Whether this item appears as the keyboard-focused/selected item. */
    active?: boolean;
    /** Whether this item is non-interactive. */
    disabled?: boolean;
    /** Navigate to this URL when clicked. Renders as <a>. */
    href?: string;
    /** Click handler. */
    onClick?: React.MouseEventHandler;
    /** Large size — bigger font and vertical padding. */
    large?: boolean;
    /** Small size — tighter vertical padding. */
    small?: boolean;
    /** Size mode. Overrides large/small shorthands. */
    size?: MenuSize;
    /**
     * ARIA role structure (ports Blueprint's `roleStructure`):
     * - `"menuitem"` (default): `<li role="none"><button role="menuitem">` — for a `role="menu"` parent.
     * - `"listoption"`: `<li role="option" aria-selected>` (inner role removed) — for a `role="listbox"`
     *   parent (the combobox listbox of Select/Suggest/MultiSelect/Omnibar).
     * - `"none"`: `<li role="none">` with no inner role — for wrapping in a custom list.
     * @default "menuitem"
     */
    roleStructure?: "menuitem" | "listoption" | "none";
    /**
     * Whether this option is selected. Only applies when `roleStructure="listoption"`; sets
     * `aria-selected` on the option. (Show your own tick via the `icon` prop.)
     */
    selected?: boolean;
}

export const MenuItem = forwardRef<HTMLLIElement, MenuItemProps>(function MenuItem(
    {
        text,
        icon,
        label,
        intent = "none",
        active = false,
        disabled = false,
        href,
        onClick,
        large = false,
        small = false,
        size,
        roleStructure = "menuitem",
        selected,
        className,
        ...liProps
    },
    ref,
) {
    // A parent menu system (Radix ContextMenu) may inject a slot to own keyboard nav.
    const Slot = useContext(MenuItemSlotContext);

    // Role structure (mirrors Blueprint): [liRole, targetRole, ariaSelected].
    const [liRole, targetRole, ariaSelected]: [
        string | undefined,
        string | undefined,
        boolean | undefined,
    ] =
        roleStructure === "listoption"
            ? ["option", undefined, Boolean(selected)]
            : roleStructure === "none"
              ? ["none", undefined, undefined]
              : ["none", "menuitem", undefined];
    // Extract data-compare to forward to the inner interactive element
    // (mirrors Blueprint: MenuItem spreads htmlProps onto the inner <a>, not the <li>)
    const dataCompare = (liProps as Record<string, unknown>)["data-compare"] as string | undefined;
    if (dataCompare !== undefined) {
        delete (liProps as Record<string, unknown>)["data-compare"];
    }
    // Determine effective size
    const effectiveSize = size ?? (large ? "large" : small ? "small" : "medium");

    // Base classes for the inner anchor/button/div element
    const innerClasses = cn(
        // Blueprint .bp6-menu-item base layout
        "flex flex-row items-start gap-[8px]",
        // border-radius: 4px
        "rounded-bp",
        // Suppress browser default focus ring — Blueprint's .bp6-menu-item is `outline:none`.
        // The active/hover bg + intent text already provide the focus indication, so the
        // browser ring on top reads as a duplicate "outline + filled bg" treatment.
        "outline-none focus:outline-none focus-visible:outline-none",
        // padding: 4px 8px (medium); line-height: 22px
        effectiveSize === "small" && "px-[8px] py-[2px]",
        effectiveSize === "medium" && "px-[8px] py-[4px]",
        effectiveSize === "large" && "px-[8px] py-[9px] text-body-lg",
        // text styling — line-height comes AFTER text-body-* so leading-* wins over any
        // implicit line-height that tailwind-merge infers from text-body (see utils.ts).
        "text-body no-underline select-none",
        // Leading (line-height) AFTER text-* so tailwind-merge keeps it (text-body would shadow leading-* if earlier)
        effectiveSize === "small" && "leading-[20px]",
        (effectiveSize === "medium" || effectiveSize === "large") && "leading-[22px]",
        // default text color: inherit (from Menu which has text-foreground)
        "text-inherit",
        // transitions
        "transition-colors duration-100 ease-bp",
        // non-disabled hover/active
        !disabled && !active && intent === "none" && [
            "hover:bg-[rgba(143,153,168,0.15)] hover:cursor-pointer hover:no-underline",
            "active:bg-[rgba(143,153,168,0.3)]",
        ],
        // intent coloring (only when not active — active overrides below)
        !disabled && !active && intent !== "none" && INTENT_CLASSES[intent],
        // active/selected state
        !disabled && active && ACTIVE_CLASSES[intent],
        // disabled
        disabled && "text-foreground-disabled cursor-not-allowed",
        // full width for block items
        "w-full",
    );

    const iconNode = icon ? (
        <span
            className={cn(
                "menu-icon flex flex-col justify-center shrink-0",
                effectiveSize === "small" ? "h-[20px]" : "h-[22px]",
                // Icon color: muted by default (Blueprint's $pt-icon-color = $pt-text-color-muted)
                // active state overrides via parent's [&_.menu-icon] classes
                !disabled && !active && "text-foreground-muted",
                disabled && "text-foreground-disabled",
            )}
            aria-hidden="true"
        >
            <Icon icon={icon} size={16} />
        </span>
    ) : null;

    const labelNode = label ? (
        <span className={cn(
            "menu-item-label ml-auto shrink-0 text-body",
            disabled ? "text-foreground-disabled" : active ? "text-inherit" : "text-foreground-muted",
        )}>
            {label}
        </span>
    ) : null;

    const content = (
        <>
            {iconNode}
            <span className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                {text}
            </span>
            {labelNode}
        </>
    );

    const inner = Slot ? (
        // Inside a parent menu system (Radix ContextMenu): render the interactive element
        // through the slot so the parent owns roving focus, typeahead, and activation.
        <Slot
            className={cn(innerClasses, "text-left")}
            disabled={disabled}
            textValue={typeof text === "string" ? text : undefined}
            onSelect={(event) => onClick?.(event as unknown as React.MouseEvent)}
            data-compare={dataCompare}
        >
            {content}
        </Slot>
    ) : roleStructure === "listoption" ? (
        // Listbox option (Select/Suggest/MultiSelect): the <li role="option"> IS the
        // option. Focus stays on the combobox input (aria-activedescendant), so the
        // inner element must NOT be a focusable button/anchor — that would nest an
        // interactive control inside the option (axe nested-interactive / WCAG 4.1.2).
        // The click handler lives on the <li> (below) so a click anywhere in the option
        // selects; keyboard selection happens on the input. This inner div is presentational.
        <div className={innerClasses} data-compare={dataCompare}>
            {content}
        </div>
    ) : href && !disabled ? (
        <a
            href={href}
            onClick={onClick}
            className={innerClasses}
            tabIndex={0}
            role={targetRole}
            data-compare={dataCompare}
        >
            {content}
        </a>
    ) : (
        <button
            type="button"
            onClick={!disabled ? onClick : undefined}
            disabled={disabled}
            className={cn(innerClasses, "border-none bg-none text-left")}
            tabIndex={disabled ? -1 : 0}
            role={targetRole}
            aria-disabled={disabled}
            data-compare={dataCompare}
        >
            {content}
        </button>
    );

    return (
        <li
            ref={ref}
            role={liRole}
            aria-selected={ariaSelected}
            // In listbox mode the option itself is the click target (its inner div is
            // presentational), so a click anywhere in the option selects it.
            onClick={roleStructure === "listoption" && !disabled ? onClick : undefined}
            className={cn("block", className)}
            {...liProps}
        >
            {inner}
        </li>
    );
});

/* ============================================================
 * MenuDivider
 *
 * Blueprint metrics:
 *   Without title (.bp6-menu-divider):
 *     border-top: 1px solid rgba(17,20,24,0.15) — $pt-divider-black
 *     dark: rgba(255,255,255,0.2) — $pt-dark-divider-white
 *     margin: 4px -4px (negative margin to span full menu width)
 *
 *   With title (.bp6-menu-header = menu-divider + heading):
 *     Same border, plus:
 *     cursor: default
 *     padding-left: 4px ($menu-item-padding - $pt-spacing = 8-4)
 *     H6 heading: bold, font-size 14px, overflow ellipsis,
 *       line-height 17px (16px icon + 1px), padding 8px 8px 0 8px
 *       (first-of-type has no border-top)
 *
 * NOTE: Blueprint's first-of-type removes the top border on the first heading.
 * We implement this via CSS directly — the &:first-of-type selector handles it.
 * ============================================================ */

export interface MenuDividerProps extends Omit<React.HTMLAttributes<HTMLLIElement>, "title"> {
    /** Optional section heading text. When provided renders as a labeled header. */
    title?: React.ReactNode;
}

export const MenuDivider = forwardRef<HTMLLIElement, MenuDividerProps>(function MenuDivider(
    { title, className, ...props },
    ref,
) {
    if (title) {
        // .bp6-menu-header: divider + H6 heading
        return (
            <li
                ref={ref}
                role="separator"
                className={cn(
                    // border-top (same as divider), but first-of-type removes it
                    "block border-t border-divider dark:border-[rgba(255,255,255,0.2)]",
                    // negative margin to span full width (same as divider)
                    "-mx-1 my-1",
                    // cursor default + left padding
                    "cursor-default pl-1",
                    // first-of-type rule: no top border AND no top padding on h6 child
                    "[&:first-of-type]:border-t-0 [&:first-of-type>h6]:pt-0",
                    className,
                )}
                {...props}
            >
                <h6 className={cn(
                    // Blueprint .menu-heading: bold, overflow-ellipsis
                    "font-semibold overflow-hidden text-ellipsis whitespace-nowrap",
                    // font-size: 14px (same as body — Blueprint heading-typography
                    // for H6 uses the same font size, just bold)
                    "text-body",
                    // line-height: 17px (icon size 16px + 1px for descenders).
                    // MUST come AFTER text-body so tailwind-merge keeps it — text-body
                    // otherwise shadows leading-* with the default --leading-bp (~18px).
                    // See the matching note on MenuItem above.
                    "leading-[17px]",
                    // margin: 0; padding: 8px 8px 0 8px
                    "m-0 px-[8px] pt-[8px] pb-0",
                    // color: foreground (heading color = text color in Blueprint)
                    "text-foreground",
                )}>
                    {title}
                </h6>
            </li>
        );
    }

    // .bp6-menu-divider: horizontal rule
    return (
        <li
            ref={ref}
            role="separator"
            className={cn(
                "block border-t border-divider dark:border-[rgba(255,255,255,0.2)]",
                // margin: 4px -4px (spanning full menu padding)
                "-mx-1 my-1",
                className,
            )}
            {...props}
        />
    );
});
