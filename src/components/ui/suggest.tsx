/**
 * Suggest — pixel-faithful Blueprint v6.15 reimplementation.
 *
 * ## Architecture
 * - Reuses `useQueryList<T>` from select.tsx — same filtering/keyboard-nav engine.
 * - The trigger IS the InputGroup (not a Button). There is NO separate filter input
 *   inside the popover; the InputGroup IS the filter.
 * - When closed + item selected: input value = `inputValueRenderer(selectedItem)`.
 * - When open: input value = query (filter text); if query empty + selected item,
 *   show the selected item text (matching Blueprint's combobox behavior).
 * - Popover: menu sits directly in popover content (no extra 4px padding container like Select).
 *   The popover width matches the trigger input (Blueprint's matchTargetWidth behavior).
 * - Active item initialized to `selectedItem` when provided (Blueprint behavior:
 *   `initialActiveItem = selectedItem` in QueryList). This matches Cherry being active when
 *   Cherry is the selectedItem.
 * - Keyboard: ArrowDown/Up moves active item, Enter selects, Escape/Tab closes and blurs.
 * - On focus: opens popover (unless `openOnKeyDown`); selects all input text.
 * - On select: fills input with item label, closes popover (unless `closeOnSelect=false`).
 *
 * ## Blueprint metrics (from _suggest.scss, _select.scss, _variables.scss)
 * - Suggest popover class: `bp6-suggest-popover`
 * - Menu: max-height: 300px ($pt-spacing * 75); max-width: 400px; overflow: auto
 * - Menu sits directly in popover content (no extra padding container like Select)
 * - Popover placement: bottom-start (minimal, no arrow)
 * - Input: plain InputGroup (no caret button) — Blueprint Suggest has no rightElement
 *
 * ## Portal + dark-mode
 * Same pattern as Select/Popover. Pass `dark` from DarkContext; portaled content
 * uses text-foreground via Menu component's built-in classes.
 *
 * @see https://blueprintjs.com/docs/#select/suggest
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode, KeyboardEvent } from "react";

import { cn } from "@/lib/utils";
import { Popover } from "./popover";
import { Menu } from "./menu";
import { InputGroup, type InputGroupProps } from "./input-group";
import { type ItemModifiers, type ItemRendererProps, useQueryList } from "./select";

export type { ItemModifiers, ItemRendererProps };

/* ============================================================
 * Types
 * ============================================================ */

export interface SuggestProps<T> {
    /** All items in the list. */
    items: T[];

    /**
     * Render function for each item in the list.
     * Return null to skip rendering this item.
     */
    itemRenderer: (item: T, props: ItemRendererProps<T>) => ReactNode;

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

    /**
     * Transforms a selected item into a string for the input value.
     * Shown in the input when a selection is made and the popover is closed.
     */
    inputValueRenderer: (item: T) => string;

    /** Called when an item is selected. */
    onItemSelect?: (item: T, e?: React.SyntheticEvent<HTMLElement>) => void;

    /**
     * The currently selected item (controlled). Pass `null` to clear selection.
     * If omitted, selection is managed internally.
     */
    selectedItem?: T | null;

    /**
     * The uncontrolled default selected item.
     * Ignored if `selectedItem` is provided.
     */
    defaultSelectedItem?: T;

    /** Controlled active (keyboard-highlighted) item. */
    activeItem?: T | null;
    /** Called when the active item changes. */
    onActiveItemChange?: (item: T | null) => void;

    /** Controlled filter query. */
    query?: string;
    /** Called when the filter query changes. */
    onQueryChange?: (query: string) => void;

    /**
     * Whether the popover should close after selecting an item.
     * @default true
     */
    closeOnSelect?: boolean;

    /**
     * Whether to reset the active item and query when the popover closes.
     * @default false
     */
    resetOnClose?: boolean;

    /**
     * Whether to wait for a keydown event before opening the popover.
     * If false, the popover opens when the input receives focus.
     * @default false
     */
    openOnKeyDown?: boolean;

    /**
     * Whether the input fills its container width.
     * @default false
     */
    fill?: boolean;

    /** Whether the input is disabled. @default false */
    disabled?: boolean;

    /**
     * Element to display when no items match the current query.
     */
    noResults?: ReactNode;

    /**
     * Additional props forwarded to the InputGroup trigger.
     * `value`, `onChange`, `disabled`, and `fill` are controlled by Suggest.
     */
    inputProps?: Omit<InputGroupProps, "value" | "onChange" | "disabled" | "fill">;

    /**
     * Callback or key to determine if an item is disabled.
     */
    itemDisabled?: keyof T | ((item: T, index: number) => boolean);

    /**
     * Additional props forwarded to the Popover.
     * Use `open`/`onOpenChange` to override the internal open state (for gallery mode).
     */
    popoverProps?: Omit<React.ComponentProps<typeof Popover>, "content" | "children">;

    /** Dark mode — required for the portaled popover to render in dark theme. */
    dark?: boolean;

    /** Additional class on the popover menu container. */
    className?: string;
}

/* ============================================================
 * Helper: check if item is disabled
 * ============================================================ */
function isItemDisabledFn<T>(
    item: T,
    index: number,
    itemDisabled?: keyof T | ((item: T, index: number) => boolean),
): boolean {
    if (itemDisabled == null) return false;
    if (typeof itemDisabled === "function") return itemDisabled(item, index);
    return !!item[itemDisabled];
}

/**
 * Suggest — typeahead input with a filterable dropdown menu.
 *
 * The trigger IS the InputGroup. Typing filters the menu items.
 * Selecting an item fills the input with the item's label (via `inputValueRenderer`).
 *
 * @example
 * ```tsx
 * const [selected, setSelected] = useState<string | null>(null);
 * <Suggest<string>
 *   items={["Apple", "Banana", "Cherry"]}
 *   itemPredicate={(q, item) => item.toLowerCase().includes(q.toLowerCase())}
 *   inputValueRenderer={(item) => item}
 *   itemRenderer={(item, { modifiers, handleClick }) => (
 *     <MenuItem
 *       key={item}
 *       text={item}
 *       active={modifiers.active}
 *       onClick={handleClick}
 *     />
 *   )}
 *   selectedItem={selected}
 *   onItemSelect={setSelected}
 *   dark={dark}
 * />
 * ```
 */
export function Suggest<T>({
    items,
    itemRenderer,
    itemPredicate,
    itemListPredicate,
    inputValueRenderer,
    onItemSelect,
    selectedItem: controlledSelectedItem,
    defaultSelectedItem,
    activeItem: controlledActiveItem,
    onActiveItemChange,
    query: controlledQuery,
    onQueryChange,
    closeOnSelect = true,
    resetOnClose = false,
    openOnKeyDown = false,
    fill = false,
    disabled = false,
    noResults = null,
    inputProps,
    itemDisabled,
    popoverProps,
    dark = false,
    className,
}: SuggestProps<T>) {
    // ── Selected item state ─────────────────────────────────────────────────
    const isControlledSelected = controlledSelectedItem !== undefined;
    const [internalSelectedItem, setInternalSelectedItem] = useState<T | null>(
        defaultSelectedItem ?? null,
    );
    const selectedItem = isControlledSelected
        ? (controlledSelectedItem ?? null)
        : internalSelectedItem;

    // ── Open state ──────────────────────────────────────────────────────────
    const [isOpen, setIsOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const menuRef = useRef<HTMLUListElement>(null);

    // When popoverProps.open is explicitly provided, honour it for gallery mode
    const controlledOpen = popoverProps?.open;
    const resolvedOpen = controlledOpen !== undefined ? controlledOpen : isOpen;

    // ── QueryList engine ────────────────────────────────────────────────────
    // Blueprint behavior: initialActiveItem = selectedItem. When selectedItem is
    // provided, the active item starts at selectedItem (not the first enabled item).
    // This ensures Cherry (selected) is the initial active/highlighted item.
    const ql = useQueryList<T>({
        items,
        itemPredicate,
        itemListPredicate,
        query: controlledQuery,
        onQueryChange,
        activeItem: controlledActiveItem,
        onActiveItemChange,
        // Pass selectedItem as initialActiveItem so the active item starts at the
        // selected item (Blueprint: initialActiveItem = selectedItem in QueryList).
        initialActiveItem: selectedItem ?? undefined,
        resetOnSelect: false, // we handle this manually
        itemDisabled,
        onItemSelect: handleItemSelect,
    });

    // ── Input value logic ────────────────────────────────────────────────────
    // When open:
    //   - If query is non-empty: show query as input value.
    //   - If query is empty + selectedItem: show selectedItemText as value
    //     (matches Blueprint: combobox shows selected item text even when popover is open).
    // When closed + selected: show the item's label via inputValueRenderer.
    // When closed + no selection: retain query (or "" if resetOnClose).
    const selectedItemText = selectedItem != null ? inputValueRenderer(selectedItem) : "";
    const inputValue = resolvedOpen
        ? ql.query !== "" ? ql.query : selectedItemText
        : selectedItemText !== ""
          ? selectedItemText
          : resetOnClose
            ? ""
            : ql.query;

    // Placeholder: when open, show selected item label as placeholder so user sees
    // what was selected while they type a new query.
    const {
        placeholder = "Search...",
        autoComplete = "off",
        onFocus: inputOnFocus,
        onKeyDown: inputOnKeyDown,
        ...restInputProps
    } = inputProps ?? {};
    const inputPlaceholder = resolvedOpen && selectedItemText && ql.query === "" ? "" : placeholder;

    // ── Handlers ────────────────────────────────────────────────────────────

    const openPopover = useCallback(() => {
        if (!disabled && controlledOpen === undefined) {
            setIsOpen(true);
        }
    }, [disabled, controlledOpen]);

    const closePopover = useCallback(() => {
        if (controlledOpen === undefined) {
            setIsOpen(false);
        }
        if (resetOnClose) {
            ql.setQuery("", true);
        }
    }, [controlledOpen, resetOnClose, ql]);

    function handleItemSelect(item: T, e?: React.SyntheticEvent<HTMLElement>) {
        // Update selected item
        if (!isControlledSelected) {
            setInternalSelectedItem(item);
        }
        onItemSelect?.(item, e);

        if (closeOnSelect) {
            inputRef.current?.blur();
            if (controlledOpen === undefined) {
                setIsOpen(false);
            }
            // Reset query so input shows selected item text when closed
            ql.setQuery("", false);
        } else {
            // Keep open: refocus input and select all text
            inputRef.current?.focus();
            requestAnimationFrame(() => {
                inputRef.current?.select();
            });
        }
    }

    const handleInputFocus = useCallback(
        (e: React.FocusEvent<HTMLInputElement>) => {
            // Select text on focus (Blueprint behavior)
            requestAnimationFrame(() => {
                inputRef.current?.select();
            });
            if (!openOnKeyDown) {
                openPopover();
            }
            inputOnFocus?.(e);
        },
        [openPopover, openOnKeyDown, inputOnFocus],
    );

    const handleInputKeyDown = useCallback(
        (e: KeyboardEvent<HTMLInputElement>) => {
            const { key } = e;

            if (key === "Escape" || key === "Tab") {
                inputRef.current?.blur();
                closePopover();
            } else if (
                openOnKeyDown &&
                key !== "Backspace" &&
                key !== "ArrowLeft" &&
                key !== "ArrowRight"
            ) {
                openPopover();
            }

            // Delegate arrow/home/end/enter to QueryList engine when open
            if (resolvedOpen) {
                ql.handleKeyDown(e as unknown as KeyboardEvent<HTMLElement>);
            }

            inputOnKeyDown?.(e);
        },
        [closePopover, openPopover, openOnKeyDown, resolvedOpen, ql, inputOnKeyDown],
    );

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            // Open when typing if not already open
            if (!resolvedOpen && !openOnKeyDown) {
                openPopover();
            }
            ql.handleQueryChange(e);
        },
        [openPopover, openOnKeyDown, resolvedOpen, ql],
    );

    // Scroll active item into view when popover opens
    useEffect(() => {
        if (resolvedOpen && menuRef.current && ql.activeItem != null) {
            const idx = ql.filteredItems.indexOf(ql.activeItem);
            const li = menuRef.current.children[idx] as HTMLElement | undefined;
            li?.scrollIntoView?.({ block: "nearest" });
        }
    }, [resolvedOpen, ql.activeItem, ql.filteredItems]);

    // ── Popover content ──────────────────────────────────────────────────────

    const popoverContent = (
        <Menu
            ulRef={menuRef}
            data-compare="suggest-menu"
            className={cn(
                "overflow-auto",
                "max-h-[300px] max-w-[400px]",
                // Override Menu's min-w-[180px] — width is controlled by popover matchTargetWidth
                "min-w-0",
                className,
            )}
        >
            {ql.filteredItems.length === 0
                ? noResults
                : ql.filteredItems.map((item, index) => {
                      const isActive =
                          ql.activeItem != null &&
                          ql.filteredItems.indexOf(ql.activeItem) === index;
                      const isDisabled = isItemDisabledFn(item, index, itemDisabled);
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
                      return rendered;
                  })}
        </Menu>
    );

    // ── Build Popover props without duplicates ────────────────────────────────
    // popoverProps may contain open/onOpenChange for gallery mode;
    // we need to merge carefully to avoid duplicate JSX prop errors.
    const {
        open: _popoverOpen, // pulled out to avoid duplicate
        onOpenChange: popoverOnOpenChange,
        ...restPopoverProps
    } = popoverProps ?? {};

    const handlePopoverOpenChange = useCallback(
        (open: boolean) => {
            if (open) {
                if (controlledOpen === undefined) setIsOpen(true);
            } else {
                closePopover();
            }
            popoverOnOpenChange?.(open);
        },
        [controlledOpen, closePopover, popoverOnOpenChange],
    );

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <Popover
            open={resolvedOpen}
            onOpenChange={handlePopoverOpenChange}
            content={popoverContent}
            side="bottom"
            align="start"
            minimal
            hasContentPadding={false}
            matchTargetWidth
            dark={dark}
            disabled={disabled}
            {...restPopoverProps}
        >
            {/* Trigger wrapper — Popover.Trigger wraps this as asChild */}
            <div
                className={cn("inline-block", fill && "w-full")}
                style={fill ? { width: "100%" } : undefined}
            >
                <InputGroup
                    ref={inputRef}
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    onKeyDown={handleInputKeyDown}
                    placeholder={inputPlaceholder}
                    autoComplete={autoComplete}
                    disabled={disabled}
                    fill={fill}
                    {...restInputProps}
                />
            </div>
        </Popover>
    );
}

Suggest.displayName = "Suggest";
