/**
 * MultiSelect — pixel-faithful Blueprint v6.15 reimplementation.
 *
 * ## Architecture
 * - Reuses `useQueryList<T>` from select.tsx — same filtering/keyboard-nav engine.
 * - The trigger IS a TagInput-like container: selected items render as removable Tag chips;
 *   a ghost text input after them filters the dropdown menu.
 * - Popover: matchTargetWidth so the menu matches the container width.
 * - Selecting an item calls `onItemSelect` (add to selection); clicking × on a chip calls `onRemove`.
 * - Backspace on empty input removes the last chip.
 * - Selected items are marked with a tick in the menu (like Select).
 * - ArrowDown/Up moves active item; Enter selects active item.
 *
 * ## Blueprint metrics (from packages/select/src/components/multi-select/_multi-select.scss)
 * - MultiSelect trigger: TagInput container (same metrics as TagInput)
 * - Menu inside popover: max-height 300px, max-width 400px, overflow auto
 * - Popover placement: bottom-start (minimal, no arrow), matchTargetWidth
 * - Input placeholder: "Search..." (Blueprint default)
 * - No clear button (optional, controlled by onClear)
 * - Ghost input filters dropdown menu
 *
 * ## Portal + dark-mode
 * Same pattern as Select/Suggest/Popover. Pass `dark` from DarkContext; portaled content
 * uses text-foreground via Menu component's built-in classes.
 *
 * @see https://blueprintjs.com/docs/#select/multi-select
 */

import { cloneElement, isValidElement, useCallback, useEffect, useId, useRef, useState } from "react";
import type { ReactElement, ReactNode, KeyboardEvent, MouseEvent } from "react";

import { cn } from "@/lib/utils";
import type { Intent } from "@/lib/types";
import { Popover } from "./popover";
import { Menu } from "./menu";
import { Tag, type TagProps } from "./tag";
import { Icon, type IconName } from "./icon";
import { type ItemModifiers, type ItemRendererProps, useQueryList } from "./select";

/** The subset of MenuItem props MultiSelect injects onto each rendered option. */
type MultiSelectOptionAriaProps = {
    id?: string;
    roleStructure?: "menuitem" | "listoption" | "none";
    selected?: boolean;
};

export type { ItemModifiers, ItemRendererProps };

/* ============================================================
 * Types
 * ============================================================ */

export type MultiSelectIntent = Intent;

export interface MultiSelectProps<T> {
    /** All items in the list. */
    items: T[];

    /**
     * Render function for each item in the list (typically a MenuItem).
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
     * Transforms a selected item into the chip content (ReactNode).
     * Shown as the Tag chip inside the TagInput container.
     */
    tagRenderer: (item: T) => ReactNode;

    /**
     * Currently selected items (controlled). Each item is shown as a chip.
     */
    selectedItems: T[];

    /** Called when an item is selected from the dropdown. */
    onItemSelect?: (item: T, e?: React.SyntheticEvent<HTMLElement>) => void;

    /**
     * Called when a chip is removed (either via × button or Backspace on empty input).
     * Receives the removed item and its index in selectedItems.
     */
    onRemove?: (item: T, index: number) => void;

    /** Controlled active (keyboard-highlighted) item. */
    activeItem?: T | null;
    /** Called when the active item changes. */
    onActiveItemChange?: (item: T | null) => void;

    /** Controlled filter query. */
    query?: string;
    /** Called when the filter query changes. */
    onQueryChange?: (query: string) => void;

    /**
     * Placeholder text for the ghost input.
     * @default "Search..."
     */
    placeholder?: string;

    /** Whether the MultiSelect is disabled. @default false */
    disabled?: boolean;

    /** Whether the trigger fills its container width. @default false */
    fill?: boolean;

    /**
     * Intent for the container border / focus ring (validation coloring).
     * @default "none"
     */
    intent?: MultiSelectIntent;

    /**
     * Element to display when no items match the current query.
     */
    noResults?: ReactNode;

    /**
     * Additional props forwarded to the Popover.
     * Use `open`/`onOpenChange` to override the internal open state (for gallery mode).
     */
    popoverProps?: Omit<React.ComponentProps<typeof Popover>, "content" | "children">;

    /**
     * Props forwarded to each Tag chip. Can be an object or a function
     * receiving the item and index that returns per-tag props.
     */
    tagProps?: Omit<TagProps, "onRemove" | "children"> | ((item: T, index: number) => Omit<TagProps, "onRemove" | "children">);

    /**
     * Callback or key to determine if an item is disabled.
     */
    itemDisabled?: keyof T | ((item: T, index: number) => boolean);

    /** Dark mode — required for the portaled popover to render in dark theme. */
    dark?: boolean;

    /** Additional class on the container div. */
    className?: string;

    /** Additional class on the popover menu container. */
    menuClassName?: string;

    /** Left icon on the TagInput container. */
    leftIcon?: IconName;

    /** Internal: data-compare key placed on the container div. */
    "data-compare"?: string;
}

/* ============================================================
 * Shadow classes — mirrors TagInput's INTENT_SHADOW/INTENT_FOCUS_SHADOW
 * ============================================================ */
const INTENT_SHADOW: Record<MultiSelectIntent, string> = {
    none: "shadow-input",
    primary: "shadow-input-intent-primary",
    success: "shadow-input-intent-success",
    warning: "shadow-input-intent-warning",
    danger: "shadow-input-intent-danger",
};

const INTENT_FOCUS_SHADOW: Record<MultiSelectIntent, string> = {
    none: "shadow-input-focus",
    primary: "shadow-input-focus-primary",
    success: "shadow-input-focus-success",
    warning: "shadow-input-focus-warning",
    danger: "shadow-input-focus-danger",
};

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
 * MultiSelect — filterable dropdown with selected items shown as chips in the trigger.
 *
 * Generic over `<T>`. Use `itemRenderer` to control how each item appears in the menu.
 * Use `tagRenderer` to control how each selected item appears as a chip in the trigger.
 *
 * @example
 * ```tsx
 * const [selected, setSelected] = useState<string[]>([]);
 * <MultiSelect<string>
 *   items={["Apple", "Banana", "Cherry"]}
 *   selectedItems={selected}
 *   itemPredicate={(q, item) => item.toLowerCase().includes(q.toLowerCase())}
 *   tagRenderer={(item) => item}
 *   itemRenderer={(item, { modifiers, handleClick }) => (
 *     <MenuItem
 *       key={item}
 *       text={item}
 *       active={modifiers.active}
 *       icon={selected.includes(item) ? "tick" : undefined}
 *       onClick={handleClick}
 *     />
 *   )}
 *   onItemSelect={(item) => setSelected((s) => [...s, item])}
 *   onRemove={(item) => setSelected((s) => s.filter((x) => x !== item))}
 *   dark={dark}
 *   fill
 * />
 * ```
 */
export function MultiSelect<T>({
    items,
    itemRenderer,
    itemPredicate,
    itemListPredicate,
    tagRenderer,
    selectedItems,
    onItemSelect,
    onRemove,
    activeItem: controlledActiveItem,
    onActiveItemChange,
    query: controlledQuery,
    onQueryChange,
    placeholder = "Search...",
    disabled = false,
    fill = false,
    intent = "none",
    noResults = null,
    popoverProps,
    tagProps,
    itemDisabled,
    dark = false,
    className,
    menuClassName,
    leftIcon,
    "data-compare": dataCompare,
}: MultiSelectProps<T>) {
    // ── Open state ──────────────────────────────────────────────────────────
    const [isOpen, setIsOpen] = useState(false);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const menuRef = useRef<HTMLUListElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Stable ids for the WAI-ARIA combobox wiring.
    const listboxId = useId();
    const optionId = (index: number) => `${listboxId}-option-${index}`;

    // When popoverProps.open is explicitly provided, honour it for gallery mode
    const controlledOpen = popoverProps?.open;
    const resolvedOpen = controlledOpen !== undefined ? controlledOpen : isOpen;

    // ── QueryList engine ────────────────────────────────────────────────────
    const ql = useQueryList<T>({
        items,
        itemPredicate,
        itemListPredicate,
        query: controlledQuery,
        onQueryChange,
        activeItem: controlledActiveItem,
        onActiveItemChange,
        itemDisabled,
        onItemSelect: handleItemSelect,
        resetOnSelect: true, // clear ghost input after each selection
    });

    // ── Handlers ─────────────────────────────────────────────────────────────

    function handleItemSelect(item: T, e?: React.SyntheticEvent<HTMLElement>) {
        onItemSelect?.(item, e);
        // Refocus input so user can keep typing/selecting
        requestAnimationFrame(() => {
            inputRef.current?.focus();
        });
    }

    const openPopover = useCallback(() => {
        if (!disabled && controlledOpen === undefined) {
            setIsOpen(true);
        }
    }, [disabled, controlledOpen]);

    const closePopover = useCallback(() => {
        if (controlledOpen === undefined) {
            setIsOpen(false);
        }
    }, [controlledOpen]);

    // Handle container focus
    const handleContainerClick = useCallback(() => {
        if (!disabled) {
            inputRef.current?.focus();
        }
    }, [disabled]);

    const handleContainerBlur = useCallback(
        (e: React.FocusEvent<HTMLDivElement>) => {
            const currentTarget = e.currentTarget;
            requestAnimationFrame(() => {
                // If focus has left the container AND the popover, close it
                if (!currentTarget.contains(document.activeElement)) {
                    setIsInputFocused(false);
                    closePopover();
                }
            });
        },
        [closePopover],
    );

    const handleInputFocus = useCallback(() => {
        setIsInputFocused(true);
        openPopover();
    }, [openPopover]);

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            openPopover();
            ql.handleQueryChange(e);
        },
        [openPopover, ql],
    );

    const handleInputKeyDown = useCallback(
        (e: KeyboardEvent<HTMLInputElement>) => {
            const { key } = e;

            if (key === "Escape") {
                inputRef.current?.blur();
                closePopover();
                return;
            }

            // Backspace on empty input → remove last chip
            if (
                key === "Backspace" &&
                e.currentTarget.selectionStart === 0 &&
                e.currentTarget.value.length === 0 &&
                selectedItems.length > 0
            ) {
                e.preventDefault();
                const lastIndex = selectedItems.length - 1;
                onRemove?.(selectedItems[lastIndex], lastIndex);
                return;
            }

            // Open on any other key
            if (key !== "Tab" && key !== "ArrowLeft" && key !== "ArrowRight") {
                openPopover();
            }

            // Delegate arrow/home/end/enter to QueryList engine when open
            if (resolvedOpen) {
                ql.handleKeyDown(e as unknown as KeyboardEvent<HTMLElement>);
            }
        },
        [closePopover, openPopover, resolvedOpen, ql, selectedItems, onRemove],
    );

    // Tag remove handler
    const handleTagRemove = useCallback(
        (index: number) => (_e: MouseEvent<HTMLButtonElement>) => {
            onRemove?.(selectedItems[index], index);
        },
        [onRemove, selectedItems],
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
    // Blueprint MultiSelect wraps the menu in a div with 4px padding (select-popover),
    // and the menu has -4px left/right margin to extend to full popover width.
    // This matches Blueprint's .bp6-select-popover > .bp6-popover-content behavior.
    const activeIndex = ql.activeItem != null ? ql.filteredItems.indexOf(ql.activeItem) : -1;
    const activeDescendantId = resolvedOpen && activeIndex >= 0 ? optionId(activeIndex) : undefined;

    const popoverContent = (
        <div onKeyDown={ql.handleKeyDown} className="p-1">
            <Menu
                ulRef={menuRef}
                id={listboxId}
                role="listbox"
                aria-multiselectable
                data-compare="multi-select-menu"
                className={cn(
                    "-mx-1 overflow-auto",
                    "max-h-[300px] max-w-[400px]",
                    "min-w-0",
                    menuClassName,
                )}
            >
                {ql.filteredItems.length === 0
                    ? noResults
                    : ql.filteredItems.map((item, index) => {
                          const isActive = activeIndex === index;
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
                          // Inject WAI-ARIA option semantics (see Select). aria-selected
                          // reflects whether the item is already chosen.
                          return isValidElement(rendered)
                              ? cloneElement(rendered as ReactElement<MultiSelectOptionAriaProps>, {
                                    id: optionId(index),
                                    roleStructure: "listoption",
                                    selected: selectedItems.some((s) => s === item),
                                })
                              : rendered;
                      })}
            </Menu>
        </div>
    );

    // ── Build Popover props without duplicates ────────────────────────────────
    const {
        open: _popoverOpen,
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

    // ── Shadow ────────────────────────────────────────────────────────────────
    const shadowClass = isInputFocused ? INTENT_FOCUS_SHADOW[intent] : INTENT_SHADOW[intent];

    // ── Placeholder: only shown when no chips (Blueprint behavior) ───────────
    const resolvedPlaceholder = selectedItems.length > 0 ? undefined : placeholder;

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
            // Anchor (not Trigger): the ghost input owns all the popup ARIA
            // (aria-haspopup/expanded/controls). A Trigger would stamp those onto the roleless
            // container <div> — invalid there (axe aria-allowed-attr). Open/close is driven by
            // focus/typing here, so we don't need Radix's click-to-toggle.
            anchorOnly
            // Keep DOM focus on the ghost input when the listbox opens (combobox contract) —
            // Radix would otherwise move focus into the panel and break type-to-filter.
            autoFocusContent={false}
            // Name the Radix dialog panel (axe aria-dialog-name); override via popoverProps.
            ariaLabel="Options"
            {...restPopoverProps}
        >
            {/* Anchor: the TagInput-like container with chips + ghost input (positioning only, no ARIA) */}
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div
                ref={containerRef}
                data-compare={dataCompare}
                onBlur={handleContainerBlur}
                onClick={handleContainerClick}
                className={cn(
                    // Base layout — same as TagInput container
                    "relative flex flex-row items-start flex-wrap",
                    "bg-white dark:bg-black/30",
                    "rounded-bp",
                    // min-height 30px (medium TagInput), min-width 150px (Blueprint MultiSelect default)
                    "min-h-7.5 min-w-[150px] pl-1.5 pr-0",
                    // Transition (matches InputGroup)
                    "transition-shadow duration-100 ease-bp",
                    shadowClass,
                    // Fill
                    fill ? "w-full" : "inline-flex",
                    // Disabled
                    disabled && [
                        "bg-[rgba(211,216,222,0.5)] dark:bg-[rgba(64,72,84,0.5)]",
                        "shadow-none cursor-not-allowed",
                    ],
                    !disabled && "cursor-text",
                    className,
                )}
            >
                {/* Left icon */}
                {leftIcon != null && (
                    <span
                        className={cn(
                            "pointer-events-none flex shrink-0 items-center justify-center text-foreground-muted",
                            "mt-[7px] ml-[3px] mr-[7px]",
                        )}
                    >
                        <Icon icon={leftIcon} size={16} aria-hidden />
                    </span>
                )}

                {/* Tag chips + ghost input */}
                <div
                    className={cn(
                        "flex flex-row flex-wrap items-center",
                        "flex-1 min-w-0 self-stretch",
                        "gap-1",
                        "mr-1 mt-1",
                        "[&>*]:mb-1",
                    )}
                >
                    {selectedItems.map((item, index) => {
                        const resolvedTagProps =
                            typeof tagProps === "function"
                                ? tagProps(item, index)
                                : (tagProps ?? {});
                        return (
                            <Tag
                                key={index}
                                size="medium"
                                onRemove={disabled ? undefined : handleTagRemove(index)}
                                data-compare={index === 0 ? "multi-select-tag" : undefined}
                                {...resolvedTagProps}
                            >
                                {tagRenderer(item)}
                            </Tag>
                        );
                    })}

                    {/* Ghost input */}
                    <input
                        ref={inputRef}
                        value={ql.query}
                        disabled={disabled}
                        placeholder={resolvedPlaceholder}
                        onChange={handleInputChange}
                        onFocus={handleInputFocus}
                        onKeyDown={handleInputKeyDown}
                        // WAI-ARIA combobox: the ghost input owns the multi-select listbox.
                        role="combobox"
                        aria-expanded={resolvedOpen}
                        aria-controls={listboxId}
                        aria-activedescendant={activeDescendantId}
                        aria-autocomplete="list"
                        aria-haspopup="listbox"
                        // A placeholder is not an accessible name (WCAG 4.1.2 / 2.4.6),
                        // and resolvedPlaceholder goes undefined once items are picked —
                        // so name the combobox from the raw placeholder.
                        aria-label={placeholder}
                        className={cn(
                            "flex-[1_1_auto] bg-transparent border-none outline-none shadow-none",
                            "text-foreground placeholder:text-foreground-muted placeholder:opacity-100",
                            "font-sans font-normal",
                            "w-20",
                            "h-5 text-body leading-[20px]",
                            disabled && "cursor-not-allowed text-foreground-disabled",
                            "p-0",
                        )}
                    />
                </div>
            </div>
        </Popover>
    );
}

MultiSelect.displayName = "MultiSelect";
