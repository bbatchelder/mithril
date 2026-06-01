/**
 * Select + useQueryList — pixel-faithful Blueprint v6.15 reimplementation.
 *
 * ## Architecture
 * - `useQueryList<T>` — the filtering/keyboard-navigation/active-item engine.
 *   Reusable by Suggest, MultiSelect, and Omnibar (Phase 5 #3–5).
 * - `Select<T>` — composes useQueryList + Popover + Menu + InputGroup into the
 *   full filterable dropdown widget.
 *
 * ## Blueprint metrics (from packages/select/src/components/select/_select.scss
 *    and common/_variables.scss)
 * - Select popover content padding: $pt-spacing = 4px (all sides)
 * - Menu inside popover: margin-left/right: -4px to offset container padding
 *   → menu is full-width inside the popover; items get their own 8px h-padding
 * - Menu: max-height: $pt-spacing * 75 = 300px; max-width: $pt-spacing * 100 = 400px
 * - Menu: overflow: auto (scrollable); padding: 0 4px; padding-top: 4px when not first child
 * - Filter InputGroup: search left-icon, placeholder "Filter..."
 * - Selected item: tick icon on MenuItem
 * - Active item: MenuItem active prop (Blueprint blue highlight)
 *
 * ## Portal + dark-mode
 * Popover already handles the dark portal wrapper. We pass `dark` from DarkContext
 * exactly like other portaled components. All portaled content uses text-foreground.
 *
 * ## Keyboard navigation (Blueprint QueryList behavior)
 * - ArrowDown/ArrowUp: move active item index
 * - Home/End: jump to first/last item
 * - Enter: select active item
 * - Escape: close popover (handled by Popover/Radix)
 *
 * @see https://blueprintjs.com/docs/#select/select
 */

import { cloneElement, isValidElement, useCallback, useId, useRef, useState } from "react";
import type { ReactElement, ReactNode, KeyboardEvent, ChangeEvent } from "react";

import { cn } from "@/lib/utils";
import { Popover } from "./popover";
import { Menu } from "./menu";
import { InputGroup } from "./input-group";
import { search } from "./icons";

/* ============================================================
 * Types
 * ============================================================ */

export interface ItemModifiers {
    /** Whether this item is the active (keyboard-focused) item. */
    active: boolean;
    /** Whether this item is disabled. */
    disabled: boolean;
    /** Whether this item matches the current filter query. */
    matchesPredicate: boolean;
}

export interface ItemRendererProps<T> {
    /** The item to render. */
    item: T;
    /** Item index in the filtered list. */
    index: number;
    /** Modifiers describing current item state. */
    modifiers: ItemModifiers;
    /** Current filter query string. */
    query: string;
    /** Click handler to select this item. */
    handleClick: (e: React.MouseEvent<HTMLElement>) => void;
}

/**
 * The QueryList engine state and handlers exposed to Select and other consumers.
 * Exported so Suggest/MultiSelect/Omnibar can compose with it.
 */
export interface QueryListState<T> {
    /** Current filter query string. */
    query: string;
    /** Filtered items matching the current query. */
    filteredItems: T[];
    /** The active (keyboard-focused) item, or null. */
    activeItem: T | null;
    /** Set the query. Pass resetActive=true to reset active item to first match. */
    setQuery: (q: string, resetActive?: boolean) => void;
    /** Set the active item directly. */
    setActiveItem: (item: T | null) => void;
    /** Handle ArrowDown/Up/Home/End/Enter key events for navigation. */
    handleKeyDown: (e: KeyboardEvent<HTMLElement>) => void;
    /** Handle input onChange for query updates. */
    handleQueryChange: (e: ChangeEvent<HTMLInputElement>) => void;
    /** Handle item selection (for click). */
    handleItemSelect: (item: T, e?: React.SyntheticEvent<HTMLElement>) => void;
}

export interface UseQueryListOptions<T> {
    /** All items in the list. */
    items: T[];
    /**
     * Per-item filter predicate. Called with (query, item, index).
     * Return true to include the item. If not provided, all items are shown.
     */
    itemPredicate?: (query: string, item: T, index: number) => boolean;
    /**
     * Whole-list filter predicate. Called with (query, items).
     * Takes precedence over itemPredicate when provided.
     */
    itemListPredicate?: (query: string, items: T[]) => T[];
    /** Called when an item is selected (clicked or Enter pressed). */
    onItemSelect?: (item: T, e?: React.SyntheticEvent<HTMLElement>) => void;
    /** Controlled query value. */
    query?: string;
    /** Called when the query changes. */
    onQueryChange?: (query: string) => void;
    /** Controlled active item. */
    activeItem?: T | null;
    /** Called when the active item changes. */
    onActiveItemChange?: (item: T | null) => void;
    /**
     * The initial active item for uncontrolled mode. Overrides the default
     * behavior of activating the first enabled item. Used by Suggest to initialize
     * the active item to the selectedItem (Blueprint: `initialActiveItem = selectedItem`).
     */
    initialActiveItem?: T | null;
    /** Whether to reset to the first item when the query changes. @default true */
    resetOnQuery?: boolean;
    /** Whether to reset query to empty string after selecting an item. @default false */
    resetOnSelect?: boolean;
    /** Callback or key to determine if an item is disabled. */
    itemDisabled?: keyof T | ((item: T, index: number) => boolean);
}

/** Helper: check if an item at index is disabled. */
function isItemDisabled<T>(
    item: T,
    index: number,
    itemDisabled?: keyof T | ((item: T, index: number) => boolean),
): boolean {
    if (itemDisabled == null) return false;
    if (typeof itemDisabled === "function") return itemDisabled(item, index);
    return !!item[itemDisabled];
}

/** Get filtered items for the given query. */
function getFilteredItems<T>(query: string, options: UseQueryListOptions<T>): T[] {
    const { items, itemPredicate, itemListPredicate } = options;
    if (itemListPredicate) return itemListPredicate(query, items);
    if (itemPredicate) return items.filter((item, index) => itemPredicate(query, item, index));
    return items;
}

/** Get first enabled item in the filtered list starting from startIndex in direction. */
function getFirstEnabledItem<T>(
    items: T[],
    itemDisabled?: keyof T | ((item: T, index: number) => boolean),
    direction = 1,
    startIndex = -1,
): T | null {
    if (items.length === 0) return null;
    const maxIndex = items.length - 1;
    let index = startIndex;
    let count = 0;
    do {
        index = index + direction;
        // Wrap
        if (index < 0) index = maxIndex;
        if (index > maxIndex) index = 0;
        if (!isItemDisabled(items[index], index, itemDisabled)) {
            return items[index];
        }
        count++;
    } while (count <= items.length);
    return null;
}

/**
 * useQueryList — the filtering/keyboard-navigation/active-item engine.
 *
 * The core logic shared by Select, Suggest, MultiSelect, and Omnibar.
 * Returns query state, filtered items, active item, and keyboard/query handlers.
 *
 * @example
 * ```tsx
 * const ql = useQueryList({
 *   items: ["Apple", "Banana", "Cherry"],
 *   itemPredicate: (q, item) => item.toLowerCase().includes(q.toLowerCase()),
 *   onItemSelect: (item) => setSelected(item),
 * });
 * ```
 */
export function useQueryList<T>(options: UseQueryListOptions<T>): QueryListState<T> {
    const {
        onItemSelect,
        query: controlledQuery,
        onQueryChange,
        activeItem: controlledActiveItem,
        onActiveItemChange,
        resetOnQuery = true,
        resetOnSelect = false,
        itemDisabled,
        initialActiveItem,
    } = options;

    const isControlledQuery = controlledQuery !== undefined;
    const isControlledActive = controlledActiveItem !== undefined;

    const [internalQuery, setInternalQuery] = useState("");

    // Eagerly initialize active item on mount (lazy initializer runs synchronously).
    // Priority: controlled > initialActiveItem > first enabled item.
    const [internalActiveItem, setInternalActiveItem] = useState<T | null>(() => {
        if (isControlledActive) return null; // controlled — don't init
        // If initialActiveItem is provided and is in the filtered items, use it.
        if (initialActiveItem !== undefined && initialActiveItem !== null) {
            const initialFiltered = getFilteredItems("", options);
            if (initialFiltered.includes(initialActiveItem)) {
                return initialActiveItem;
            }
        }
        const initialFiltered = getFilteredItems("", options);
        return getFirstEnabledItem(initialFiltered, itemDisabled, 1, -1);
    });

    const query = isControlledQuery ? controlledQuery : internalQuery;

    // Compute filtered items whenever query or items change
    const filteredItems = getFilteredItems(query, options);

    // Active item: use controlled if provided, else internal
    const activeItem = isControlledActive ? (controlledActiveItem ?? null) : internalActiveItem;

    const setActiveItem = useCallback(
        (item: T | null) => {
            if (!isControlledActive) {
                setInternalActiveItem(item);
            }
            onActiveItemChange?.(item);
        },
        [isControlledActive, onActiveItemChange],
    );

    const setQuery = useCallback(
        (newQuery: string, resetActive = resetOnQuery) => {
            if (!isControlledQuery) {
                setInternalQuery(newQuery);
            }
            onQueryChange?.(newQuery);

            if (resetActive) {
                const newFiltered = getFilteredItems(newQuery, options);
                const first = getFirstEnabledItem(newFiltered, itemDisabled, 1, -1);
                setActiveItem(first);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [isControlledQuery, onQueryChange, resetOnQuery, setActiveItem],
    );

    const handleQueryChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            setQuery(e.target.value);
        },
        [setQuery],
    );

    const handleItemSelect = useCallback(
        (item: T, e?: React.SyntheticEvent<HTMLElement>) => {
            setActiveItem(item);
            onItemSelect?.(item, e);
            if (resetOnSelect) {
                setQuery("", true);
            }
        },
        [onItemSelect, resetOnSelect, setActiveItem, setQuery],
    );

    const handleKeyDown = useCallback(
        (e: KeyboardEvent<HTMLElement>) => {
            const { key } = e;
            if (key === "ArrowDown" || key === "ArrowUp") {
                e.preventDefault();
                const currentIndex = activeItem != null ? filteredItems.indexOf(activeItem) : -1;
                const direction = key === "ArrowDown" ? 1 : -1;
                const next = getFirstEnabledItem(filteredItems, itemDisabled, direction, currentIndex);
                if (next != null) setActiveItem(next);
            } else if (key === "Home") {
                e.preventDefault();
                const first = getFirstEnabledItem(filteredItems, itemDisabled, 1, -1);
                if (first != null) setActiveItem(first);
            } else if (key === "End") {
                e.preventDefault();
                const last = getFirstEnabledItem(filteredItems, itemDisabled, -1, filteredItems.length);
                if (last != null) setActiveItem(last);
            } else if (key === "Enter") {
                e.preventDefault();
                if (activeItem != null) {
                    handleItemSelect(activeItem, e as unknown as React.SyntheticEvent<HTMLElement>);
                }
            }
        },
        [activeItem, filteredItems, itemDisabled, setActiveItem, handleItemSelect],
    );

    return {
        query,
        filteredItems,
        activeItem,
        setQuery,
        setActiveItem,
        handleKeyDown,
        handleQueryChange,
        handleItemSelect,
    };
}

/** The subset of MenuItem props Select injects onto each rendered option. */
type MenuItemAriaProps = {
    id?: string;
    roleStructure?: "menuitem" | "listoption" | "none";
    selected?: boolean;
};

/* ============================================================
 * Select props
 * ============================================================ */

export interface SelectProps<T> {
    /** All items in the list. */
    items: T[];

    /**
     * Render function for each item in the list.
     * Return null to skip rendering this item (it won't appear in the list).
     */
    itemRenderer: (item: T, props: ItemRendererProps<T>) => ReactNode;

    /**
     * Per-item filter predicate. Called with (query, item, index).
     * Return true to show the item. If not provided, all items are shown.
     */
    itemPredicate?: (query: string, item: T, index: number) => boolean;

    /**
     * Whole-list filter predicate. Called with (query, items).
     * Takes precedence over itemPredicate when provided.
     */
    itemListPredicate?: (query: string, items: T[]) => T[];

    /** Called when an item is selected. */
    onItemSelect?: (item: T, e?: React.SyntheticEvent<HTMLElement>) => void;

    /**
     * The currently selected item (for showing the tick icon).
     * Does not control the active/highlighted item (see activeItem for that).
     */
    selectedItem?: T | null;

    /** Controlled active (keyboard-highlighted) item. */
    activeItem?: T | null;
    /** Called when the active item changes. */
    onActiveItemChange?: (item: T | null) => void;

    /** Controlled filter query. */
    query?: string;
    /** Called when the filter query changes. */
    onQueryChange?: (query: string) => void;

    /**
     * Whether the dropdown includes a filter InputGroup.
     * @default true
     */
    filterable?: boolean;

    /**
     * Placeholder text for the filter input.
     * @default "Filter..."
     */
    placeholder?: string;

    /** Whether the Select is disabled. @default false */
    disabled?: boolean;

    /** Whether the trigger fills its container width. @default false */
    fill?: boolean;

    /**
     * Whether to reset the query and active item to defaults when the popover closes.
     * @default false
     */
    resetOnClose?: boolean;

    /**
     * Whether to reset the query to empty after selecting an item.
     * @default false
     */
    resetOnSelect?: boolean;

    /**
     * Element to display when no items match the current query.
     * @default null
     */
    noResults?: ReactNode;

    /**
     * Additional props forwarded to the filter InputGroup.
     * `value` and `onChange` are controlled by Select.
     * `size` is excluded because InputGroup uses "small"|"medium"|"large" string sizes,
     * not the numeric HTML `size` attribute.
     */
    inputProps?: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "size">;

    /**
     * Additional props forwarded to the Popover.
     * `open`/`onOpenChange` are managed by Select internally, but can be overridden
     * via popoverProps for gallery use (e.g., forcing open for screenshots).
     * Pass `dark` via this for the portal dark-mode fix.
     */
    popoverProps?: Omit<React.ComponentProps<typeof Popover>, "content" | "children">;

    /**
     * Whether to determine if an item is disabled. Either a key in T or a function.
     */
    itemDisabled?: keyof T | ((item: T, index: number) => boolean);

    /**
     * Whether the active item should scroll into view.
     * @default true
     */
    scrollToActiveItem?: boolean;

    /** Dark mode — required for the portaled popover to render in dark theme. */
    dark?: boolean;

    /** The trigger element (typically a Button showing the selected item). */
    children: ReactNode;

    /** Additional class on the popover panel. */
    className?: string;
}

/**
 * Select — filterable dropdown built on Popover + Menu + QueryList engine.
 *
 * Generic over `<T>`. Use `itemRenderer` to control how each item is displayed.
 * The selected item typically shows a "tick" icon in the itemRenderer.
 *
 * @example
 * ```tsx
 * const [selected, setSelected] = useState<string | null>(null);
 * <Select
 *   items={["Apple", "Banana", "Cherry"]}
 *   itemPredicate={(q, item) => item.toLowerCase().includes(q.toLowerCase())}
 *   itemRenderer={(item, { modifiers, handleClick }) => (
 *     <MenuItem
 *       key={item}
 *       text={item}
 *       active={modifiers.active}
 *       icon={item === selected ? "tick" : undefined}
 *       onClick={handleClick}
 *     />
 *   )}
 *   onItemSelect={setSelected}
 *   dark={dark}
 * >
 *   <Button rightIcon="caret-down">{selected ?? "Select an item…"}</Button>
 * </Select>
 * ```
 */
export function Select<T>({
    items,
    itemRenderer,
    itemPredicate,
    itemListPredicate,
    onItemSelect,
    selectedItem: _selectedItem, // Part of public API; user passes it to their itemRenderer via closure
    activeItem: controlledActiveItem,
    onActiveItemChange,
    query: controlledQuery,
    onQueryChange,
    filterable = true,
    placeholder = "Filter...",
    disabled = false,
    fill = false,
    resetOnClose = false,
    resetOnSelect = false,
    noResults = null,
    inputProps,
    popoverProps,
    itemDisabled,
    dark = false,
    children,
    className,
}: SelectProps<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const menuRef = useRef<HTMLUListElement>(null);

    // Stable ids for the WAI-ARIA combobox wiring (listbox + per-option ids that
    // aria-activedescendant points at).
    const listboxId = useId();
    const optionId = (index: number) => `${listboxId}-option-${index}`;

    const ql = useQueryList<T>({
        items,
        itemPredicate,
        itemListPredicate,
        onItemSelect: (item, e) => {
            handleItemSelect(item, e);
        },
        query: controlledQuery,
        onQueryChange,
        activeItem: controlledActiveItem,
        onActiveItemChange,
        resetOnSelect,
        itemDisabled,
    });

    const handleItemSelect = useCallback(
        (item: T, e?: React.SyntheticEvent<HTMLElement>) => {
            setIsOpen(false);
            onItemSelect?.(item, e);
            ql.setActiveItem(item);
            if (resetOnSelect) {
                ql.setQuery("", true);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [onItemSelect, resetOnSelect],
    );

    const handleOpenChange = useCallback(
        (open: boolean) => {
            if (disabled) return;
            setIsOpen(open);
            if (!open && resetOnClose) {
                ql.setQuery("", true);
            }
            if (open) {
                // Focus the filter input after a tick (after popover is positioned)
                requestAnimationFrame(() => {
                    inputRef.current?.focus();
                });
                // Scroll active item into view
                requestAnimationFrame(() => {
                    if (menuRef.current && ql.activeItem != null) {
                        const idx = ql.filteredItems.indexOf(ql.activeItem);
                        const li = menuRef.current.children[idx] as HTMLElement | undefined;
                        li?.scrollIntoView?.({ block: "nearest" });
                    }
                });
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [disabled, resetOnClose],
    );

    // The popup may be governed internally (isOpen) OR controlled by a consumer via
    // popoverProps.open (e.g. the gallery force-open specimens). The combobox's ARIA must
    // track whichever actually shows the listbox, else aria-expanded / aria-activedescendant
    // go stale (reporting "collapsed" / no active option) while the listbox is visible.
    // (Suggest/MultiSelect already do this; Select was the outlier.)
    const controlledOpen = popoverProps?.open;
    const resolvedOpen = controlledOpen !== undefined ? controlledOpen : isOpen;

    // The id of the active (keyboard-highlighted) option, for aria-activedescendant.
    const activeIndex = ql.activeItem != null ? ql.filteredItems.indexOf(ql.activeItem) : -1;
    const activeDescendantId = resolvedOpen && activeIndex >= 0 ? optionId(activeIndex) : undefined;

    // Render the menu content (filter input + menu items)
    const popoverContent = (
        <div
            onKeyDown={ql.handleKeyDown}
            // Blueprint: .bp6-select-popover > .bp6-popover-content has padding: 4px
            className="p-1"
        >
            {filterable && (
                <InputGroup
                    leftIcon={search}
                    placeholder={placeholder}
                    value={ql.query}
                    onChange={ql.handleQueryChange}
                    ref={inputRef}
                    // WAI-ARIA combobox: input owns the listbox + tracks the active option.
                    role="combobox"
                    aria-expanded={resolvedOpen}
                    aria-controls={listboxId}
                    aria-activedescendant={activeDescendantId}
                    aria-autocomplete="list"
                    aria-haspopup="listbox"
                    // A placeholder is not an accessible name (WCAG 4.1.2 / 2.4.6).
                    // Default the combobox's name to the placeholder; consumers can
                    // override via inputProps["aria-label"] (spread wins below).
                    aria-label={placeholder}
                    {...inputProps}
                    className={cn("mb-0", inputProps?.className)}
                />
            )}
            {/* Blueprint: menu margin-left/right -4px to offset the 4px container padding */}
            {/* max-height 300px, max-width 400px, overflow auto */}
            {/* padding: 0 4px; padding-top: 4px if not first child (i.e. filter present) */}
            <Menu
                ulRef={menuRef}
                id={listboxId}
                role="listbox"
                data-compare="select-menu"
                className={cn(
                    "-mx-1 overflow-auto",
                    "max-h-[300px] max-w-[400px]",
                    "px-1 py-0",
                    filterable && "pt-1",
                    className,
                )}
            >
                {ql.filteredItems.length === 0
                    ? noResults
                    : ql.filteredItems.map((item, index) => {
                          const isActive = activeIndex === index;
                          const isDisabled = isItemDisabled(item, index, itemDisabled);
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
                                      ql.handleItemSelect(item, e as unknown as React.SyntheticEvent<HTMLElement>);
                                  }
                              },
                          });
                          // Inject the WAI-ARIA option semantics so consumers' itemRenderers
                          // don't each have to: role=option (via roleStructure), a stable id for
                          // aria-activedescendant, and aria-selected from the selected item.
                          return isValidElement(rendered)
                              ? cloneElement(rendered as ReactElement<MenuItemAriaProps>, {
                                    id: optionId(index),
                                    roleStructure: "listoption",
                                    selected: _selectedItem != null && item === _selectedItem,
                                })
                              : rendered;
                      })}
            </Menu>
        </div>
    );

    return (
        <Popover
            open={isOpen}
            onOpenChange={handleOpenChange}
            content={popoverContent}
            side="bottom"
            align="start"
            minimal
            hasContentPadding={false}
            dark={dark}
            disabled={disabled}
            // Radix gives the Popover panel role="dialog"; name it so it isn't an
            // anonymous dialog (axe aria-dialog-name). Override via popoverProps.
            ariaLabel="Options"
            {...popoverProps}
        >
            {/* The trigger child IS the Popover trigger (asChild), so Radix's trigger ARIA
                (aria-haspopup/expanded/controls) lands on the consumer's interactive element
                — valid only on a real control, not a wrapper <div> (axe aria-allowed-attr).
                For `fill`, merge w-full into the child instead of wrapping it. */}
            {fill && isValidElement<{ className?: string }>(children)
                ? cloneElement(children, {
                      className: cn(children.props.className, "w-full"),
                  })
                : children}
        </Popover>
    );
}

Select.displayName = "Select";
