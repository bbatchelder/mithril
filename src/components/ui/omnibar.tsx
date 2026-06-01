/**
 * Omnibar — pixel-faithful Blueprint v6.15 reimplementation.
 *
 * ## Architecture
 * Omnibar is a command-palette overlay: a portaled, backdrop-covered panel pinned
 * near the top of the viewport with a full-width search InputGroup above a filtered
 * QueryList Menu. It uses the same `useQueryList` engine as Select/Suggest/MultiSelect.
 *
 * ## Portal + dark-mode
 * The panel is portaled (rendered at document.body). The `dark` prop wraps the portal
 * in `<div className="dark">` so Tailwind dark utilities apply. This is the same
 * pattern as Dialog (see dialog.tsx). Pass `dark` from DarkContext wherever Omnibar
 * is used.
 *
 * ## Blueprint metrics (from packages/select/src/components/omnibar/_omnibar.scss)
 * - Width: $pt-spacing * 125 = 500px
 * - Left: calc(50% - 250px)  (horizontally centered)
 * - Top: (100 - 60) * 0.5 = 20% of viewport height
 * - Height: 60vh (the result list area is max-height: calc(60vh - 40px) where 40px
 *   is $omnibar-input-height = $pt-spacing * 10 = 40px, the large input height)
 * - Background (light): white
 * - Background (dark): dark-gray3 (#2f343c)
 * - Shadow: elevation-4 (shadow-card-4)
 * - Border-radius: 4px
 * - Backdrop: rgba(0,0,0,0.2) (lighter than Dialog's 0.7)
 * - Input: transparent bg, no border-radius (square), no box-shadow
 * - Menu: transparent bg, no border-radius, inset 0 1px 0 $pt-divider-black (top separator),
 *         max-height: calc(60vh - 40px), overflow: auto
 *
 * @see https://blueprintjs.com/docs/#select/omnibar
 */

import * as ReactDOM from "react-dom";
import { cloneElement, isValidElement, useCallback, useEffect, useId, useRef, useState } from "react";
import type { ReactElement, ReactNode, KeyboardEvent } from "react";

import { cn } from "@/lib/utils";
import { useQueryList } from "./select";
import type { UseQueryListOptions, ItemRendererProps } from "./select";
import { InputGroup } from "./input-group";
import { Menu } from "./menu";
import { search } from "./icons";

/** The subset of MenuItem props Omnibar injects onto each rendered option. */
type OmnibarOptionAriaProps = {
    id?: string;
    roleStructure?: "menuitem" | "listoption" | "none";
};

/* ============================================================
 * Props
 * ============================================================ */

export interface OmnibarProps<T> extends Omit<UseQueryListOptions<T>, "onItemSelect"> {
    /**
     * Whether the Omnibar is open. This is a controlled prop — the component
     * will not open/close itself; only `isOpen` controls it.
     */
    isOpen: boolean;

    /**
     * Called when the user requests to close the Omnibar (Escape key or backdrop click).
     * Update `isOpen` to false in this callback.
     */
    onClose?: (event?: React.SyntheticEvent<HTMLElement> | KeyboardEvent | MouseEvent) => void;

    /**
     * Called when an item is selected (click or Enter key).
     */
    onItemSelect?: (item: T, e?: React.SyntheticEvent<HTMLElement>) => void;

    /**
     * Render function for each filtered item. Typically returns a MenuItem.
     * Receives the item, its modifiers (active, disabled, matchesPredicate),
     * the current query, and a click handler.
     */
    itemRenderer: (item: T, props: ItemRendererProps<T>) => ReactNode;

    /**
     * Content to display when no items match the current query.
     * @default null
     */
    noResults?: ReactNode;

    /**
     * Additional props forwarded to the search InputGroup.
     * `value` and `onChange` are managed by Omnibar.
     */
    inputProps?: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "size">;

    /**
     * Additional props passed to the portal overlay wrapper.
     * Use `portalClassName` to pass `Classes.DARK` in dark theme (Blueprint reference gallery pattern).
     */
    overlayProps?: {
        className?: string;
        portalClassName?: string;
    };

    /**
     * Pass the app's dark state so the portaled panel inherits dark mode.
     * Radix/React portals content to document.body (outside the .dark ancestor div),
     * so we wrap portal children in a div with dark class when this is true.
     * @default false
     */
    dark?: boolean;

    /** Callback or key to determine if an item is disabled. */
    itemDisabled?: keyof T | ((item: T, index: number) => boolean);

    /** Additional class on the omnibar panel element. */
    className?: string;
}

/**
 * Omnibar — command-palette overlay with search InputGroup + filtered QueryList.
 *
 * This is a controlled component: always pass `isOpen` and update it in `onClose`.
 * Omnibar portals its content to document.body and adds a dark backdrop.
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 * <Omnibar<string>
 *   isOpen={open}
 *   onClose={() => setOpen(false)}
 *   items={["Apple", "Banana", "Cherry"]}
 *   itemPredicate={(q, item) => item.toLowerCase().includes(q.toLowerCase())}
 *   itemRenderer={(item, { modifiers, handleClick }) => (
 *     <MenuItem key={item} text={item} active={modifiers.active} onClick={handleClick} />
 *   )}
 *   onItemSelect={(item) => { setSelected(item); setOpen(false); }}
 *   dark={dark}
 * />
 * ```
 */
export function Omnibar<T>({
    isOpen,
    onClose,
    onItemSelect,
    items,
    itemRenderer,
    itemPredicate,
    itemListPredicate,
    itemDisabled,
    query: controlledQuery,
    onQueryChange,
    activeItem: controlledActiveItem,
    onActiveItemChange,
    resetOnQuery = true,
    resetOnSelect = false,
    initialActiveItem,
    noResults = null,
    inputProps,
    overlayProps,
    dark = false,
    className,
}: OmnibarProps<T>) {
    const inputRef = useRef<HTMLInputElement>(null);
    const menuRef = useRef<HTMLUListElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

    // Stable ids for the WAI-ARIA combobox wiring.
    const listboxId = useId();
    const optionId = (index: number) => `${listboxId}-option-${index}`;

    useEffect(() => {
        setPortalTarget(document.body);
    }, []);

    const ql = useQueryList<T>({
        items,
        itemPredicate,
        itemListPredicate,
        onItemSelect: (item, e) => {
            onItemSelect?.(item, e);
            if (resetOnSelect) {
                ql.setQuery("", true);
            }
        },
        query: controlledQuery,
        onQueryChange,
        activeItem: controlledActiveItem,
        onActiveItemChange,
        resetOnQuery,
        resetOnSelect,
        itemDisabled,
        initialActiveItem,
    });

    // Focus the input when the omnibar opens; reset query when it closes.
    useEffect(() => {
        if (isOpen) {
            // Focus after a tick so the portal has rendered
            requestAnimationFrame(() => {
                inputRef.current?.focus();
            });
        } else {
            // Reset query to empty when closed (Blueprint behavior: Omnibar resets on close)
            if (controlledQuery === undefined) {
                ql.setQuery("", true);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    // Scroll active item into view when it changes
    useEffect(() => {
        if (isOpen && menuRef.current && ql.activeItem != null) {
            const idx = ql.filteredItems.indexOf(ql.activeItem);
            const li = menuRef.current.children[idx] as HTMLElement | undefined;
            li?.scrollIntoView?.({ block: "nearest" });
        }
    }, [isOpen, ql.activeItem, ql.filteredItems]);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent<HTMLElement>) => {
            if (e.key === "Escape") {
                e.preventDefault();
                onClose?.(e);
                return;
            }
            ql.handleKeyDown(e);
        },
        [onClose, ql],
    );

    const handleBackdropClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            // Only close if the click is on the backdrop itself (not the panel)
            if (e.target === e.currentTarget) {
                onClose?.(e.nativeEvent);
            }
        },
        [onClose],
    );

    if (!portalTarget || !isOpen) return null;

    const activeIndex = ql.activeItem != null ? ql.filteredItems.indexOf(ql.activeItem) : -1;
    const activeDescendantId = activeIndex >= 0 ? optionId(activeIndex) : undefined;

    // Blueprint _omnibar.scss metrics:
    // width: $pt-spacing * 125 = 500px
    // left: calc(50% - 250px)  (centered)
    // top: (100 - 60) * 0.5 = 20% of viewport  (in Blueprint: `top: (100 - $omnibar-height) * 0.5`)
    //   NOTE: the value is a percentage of the overlay (viewport), so 20% = 20vh
    // $omnibar-input-height: $pt-spacing * 10 = 40px
    // menu max-height: calc($omnibar-height - $omnibar-input-height) = calc(60vh - 40px)

    const panel = (
        // Dark-mode portal fix: wrap portal children in a div with the dark class.
        <div
            className={cn(dark ? "dark" : "", overlayProps?.className)}
            style={{ pointerEvents: "none" }}
        >
            {/* Backdrop — fixed, covers viewport. Blueprint: rgba($black, 0.2) (lighter than Dialog) */}
            <div
                className="fixed inset-0 bg-black/20 z-overlay pointer-events-auto"
                onClick={handleBackdropClick}
                aria-hidden="true"
            />

            {/* Omnibar panel — fixed position, top-pinned, horizontally centered */}
            {/* Blueprint: top: 20vh, width: 500px, left: calc(50% - 250px) */}
            <div
                ref={panelRef}
                data-compare="omnibar-panel"
                className={cn(
                    // Positioning: fixed, top-pinned near top of viewport
                    "fixed z-overlay",
                    // Blueprint: left: calc(50% - 250px), top: 20vh, width: 500px
                    // Blueprint: background white (light) / dark-gray3 (dark)
                    "bg-white dark:bg-dark-gray-3",
                    // Set own text color for portaled dark-mode
                    "text-foreground",
                    // Blueprint: border-radius: $pt-border-radius = 4px
                    "rounded-bp",
                    // Blueprint: box-shadow: $pt-elevation-shadow-4 (overlay variant —
                    // rgba(20,20,20) light hairline ring; dark = card-4, single drop).
                    "shadow-overlay-4",
                    // Restore pointer events (parent wrapper disables them)
                    "pointer-events-auto",
                    // Focus outline
                    "outline-none",
                    className,
                )}
                style={{
                    top: "20vh",
                    left: "calc(50% - 250px)",
                    width: 500,
                }}
                onKeyDown={handleKeyDown}
                // Blueprint: omnibar acts as a dialog for accessibility
                role="dialog"
                aria-modal="true"
                aria-label="Omnibar"
            >
                {/* Search InputGroup — Blueprint: size=large, leftIcon=Search, autoFocus */}
                {/* Input has transparent bg, no border-radius (square corners), no box-shadow.
                    className is forwarded to the <input> element by InputGroup (see input-group.tsx).
                    We override bg, border-radius, and shadow using the `!` important trick via
                    literal arbitrary-value classes placed last in cn() which beat the InputGroup
                    defaults because cn() places our className last. */}
                <InputGroup
                    data-compare="omnibar-input"
                    leftIcon={search}
                    placeholder="Search..."
                    size="large"
                    value={ql.query}
                    onChange={ql.handleQueryChange}
                    ref={inputRef}
                    // WAI-ARIA combobox: the search input owns the results listbox.
                    role="combobox"
                    aria-expanded={isOpen}
                    aria-controls={listboxId}
                    aria-activedescendant={activeDescendantId}
                    aria-autocomplete="list"
                    aria-haspopup="listbox"
                    // The placeholder is not an accessible name (WCAG 4.1.2 / 2.4.6).
                    // The dialog is labelled "Omnibar"; give the input its own name too.
                    // Consumers can override via inputProps["aria-label"] (spread wins).
                    aria-label="Search"
                    {...inputProps}
                    style={{
                        backgroundColor: "transparent",
                        borderRadius: 0,
                        boxShadow: "none",
                        outline: "none",
                    }}
                    className={cn(
                        // Override shadow/bg/radius for the input inside omnibar
                        // These go last in cn() but we also force via style prop above
                        "bg-transparent [border-radius:0px] shadow-none focus:shadow-none focus:outline-none",
                        inputProps?.className,
                    )}
                />

                {/* Menu — Blueprint: transparent bg, no border-radius, inset top separator */}
                {/* max-height: calc(60vh - 40px) = viewport 60% minus input height 40px */}
                {/* NOTE: inline style overrides used for bg/radius because Menu's Tailwind utility
                    classes (bg-white/rounded-bp) may win over arbitrary class overrides due to
                    Tailwind v4 CSS order. Inline style always wins over class-based styles. */}
                <Menu
                    ulRef={menuRef}
                    id={listboxId}
                    role="listbox"
                    data-compare="omnibar-menu"
                    style={{
                        // Blueprint: background-color: transparent (no menu bg — panel bg shows through)
                        backgroundColor: "transparent",
                        // Blueprint: border-radius: 0 (overrides Menu's default 4px)
                        borderRadius: 0,
                        // Blueprint: box-shadow: inset 0 1px 0 $pt-divider-black (top separator)
                        // NOTE: Blueprint uses $pt-divider-black for BOTH light AND dark omnibar menu.
                        // The dark panel's dark-gray3 bg provides the visual contrast, not the shadow color.
                        // $pt-divider-black = rgba(17,20,24,0.15)
                        boxShadow: "inset 0 1px 0 rgba(17, 20, 24, 0.15)",
                    }}
                    className={cn(
                        // Blueprint: max-height: calc($omnibar-height - $omnibar-input-height)
                        //           = calc(60vh - 40px)
                        "max-h-[calc(60vh-40px)] overflow-auto",
                        // Blueprint: hide when empty
                        "empty:hidden",
                    )}
                >
                    {ql.filteredItems.length === 0
                        ? noResults
                        : ql.filteredItems.map((item, index) => {
                              const isActive =
                                  ql.activeItem != null &&
                                  ql.filteredItems.indexOf(ql.activeItem) === index;
                              const isDisabled =
                                  itemDisabled != null
                                      ? typeof itemDisabled === "function"
                                          ? itemDisabled(item, index)
                                          : !!item[itemDisabled]
                                      : false;
                              const rendered = itemRenderer(item, {
                                  item,
                                  index,
                                  modifiers: {
                                      active: isActive,
                                      disabled: isDisabled,
                                      matchesPredicate: true,
                                  },
                                  query: ql.query,
                                  handleClick: (e) => {
                                      if (!isDisabled) {
                                          ql.handleItemSelect(
                                              item,
                                              e as unknown as React.SyntheticEvent<HTMLElement>,
                                          );
                                      }
                                  },
                              });
                              // Inject WAI-ARIA option semantics (see Select). A command
                              // palette has no persistent selection, so only role + id.
                              return isValidElement(rendered)
                                  ? cloneElement(rendered as ReactElement<OmnibarOptionAriaProps>, {
                                        id: optionId(index),
                                        roleStructure: "listoption",
                                    })
                                  : rendered;
                          })}
                </Menu>
            </div>
        </div>
    );

    return ReactDOM.createPortal(panel, portalTarget);
}

Omnibar.displayName = "Omnibar";
