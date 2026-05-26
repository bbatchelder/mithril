import {
    forwardRef,
    useCallback,
    useRef,
    useState,
    type KeyboardEvent,
    type MouseEvent,
    type FocusEvent,
    type ClipboardEvent,
    type ReactNode,
} from "react";

import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./icon";
import { Tag, type TagProps } from "./tag";

// TODO(phase5): QueryList integration happens in MultiSelect

export type TagInputIntent = "none" | "primary" | "success" | "warning" | "danger";

/** How a value was added to the TagInput. */
export type TagInputAddMethod = "default" | "blur" | "paste";

// Resting box-shadow classes per intent (mirrors InputGroup)
const INTENT_SHADOW: Record<TagInputIntent, string> = {
    none: "shadow-input",
    primary: "shadow-input-intent-primary",
    success: "shadow-input-intent-success",
    warning: "shadow-input-intent-warning",
    danger: "shadow-input-intent-danger",
};

// Focus box-shadow classes per intent (applied when .bp6-active)
const INTENT_FOCUS_SHADOW: Record<TagInputIntent, string> = {
    none: "shadow-input-focus",
    primary: "shadow-input-focus-primary",
    success: "shadow-input-focus-success",
    warning: "shadow-input-focus-warning",
    danger: "shadow-input-focus-danger",
};

export interface TagInputProps {
    /**
     * Current tag values (controlled). Each truthy value is rendered as a Tag chip.
     */
    values: readonly ReactNode[];

    /**
     * Called when the values list changes (additions or removals).
     * Return false to prevent clearing the input after an add.
     */
    onChange?: (values: ReactNode[]) => boolean | void;

    /**
     * Called when new tags are added. Receives the array of new values and the add method.
     * Return false to prevent clearing the input.
     */
    onAdd?: (values: string[], method: TagInputAddMethod) => boolean | void;

    /**
     * Called when a tag is removed. Receives the removed value and its index.
     */
    onRemove?: (value: ReactNode, index: number) => void;

    /**
     * Controlled value of the ghost text input.
     */
    inputValue?: string;

    /**
     * Called when the ghost input value changes.
     */
    onInputChange?: React.ChangeEventHandler<HTMLInputElement>;

    /**
     * Placeholder shown when values is empty (or always if inputProps.placeholder is used).
     */
    placeholder?: string;

    /**
     * Pattern used to split pasted/typed text into multiple tags.
     * Default: /[,\n\r]/ (comma or newline).
     * Set to false to disable splitting.
     * @default /[,\n\r]/
     */
    separator?: string | RegExp | false;

    /**
     * If true, adds the current input text as a tag when the input loses focus.
     * @default false
     */
    addOnBlur?: boolean;

    /**
     * If true, pasting text containing the separator splits it into multiple tags immediately.
     * @default true
     */
    addOnPaste?: boolean;

    /**
     * Intent for the container border / focus ring (validation coloring).
     * @default "none"
     */
    intent?: TagInputIntent;

    /**
     * Large size variant: min-height 40px, larger gap between tags.
     * @default false
     */
    large?: boolean;

    /**
     * Whether the TagInput fills its container width.
     * @default false
     */
    fill?: boolean;

    /**
     * Whether the TagInput is disabled. Disables typing and tag removal.
     * @default false
     */
    disabled?: boolean;

    /**
     * Icon rendered on the left side of the container.
     */
    leftIcon?: IconName;

    /**
     * Element rendered on the right side of the container (e.g. a spinner or clear button).
     */
    rightElement?: ReactNode;

    /**
     * Props forwarded to each Tag chip. Can be an object (same for all) or
     * a function that receives the value and index and returns per-tag props.
     */
    tagProps?: Omit<TagProps, "onRemove" | "children"> | ((value: ReactNode, index: number) => Omit<TagProps, "onRemove" | "children">);

    /**
     * Additional class name on the container.
     */
    className?: string;

    /**
     * Ref forwarded to the ghost input element.
     */
    inputRef?: React.Ref<HTMLInputElement>;

    /**
     * Additional props forwarded to the ghost input element.
     */
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;

    /** Internal: data-compare key placed on the container div. */
    "data-compare"?: string;

    /** Internal: data-compare key placed on the first tag. */
    "_firstTagCompare"?: string;

    /** Internal: data-compare key placed on the ghost input. */
    "_ghostCompare"?: string;
}

/** Split an input string on the separator pattern, trim, drop empties. */
function splitValues(text: string, separator: string | RegExp | false): string[] {
    if (separator === false) return [text].filter(Boolean);
    return (text.split(separator as string))
        .map((v) => v.trim())
        .filter((v) => v.length > 0);
}

/**
 * TagInput — pixel-faithful Blueprint v6.15 tag input.
 *
 * Renders a list of removable Tag chips inside an input-group-styled container,
 * with a ghost text input that grows to fill remaining space.
 *
 * Behavior:
 *   - Enter → add tag (split on separator)
 *   - Backspace on empty input → remove last tag
 *   - Paste with multiple values (addOnPaste=true) → split + add immediately
 *   - Blur (addOnBlur=true) → add current text
 *   - Click container → focus ghost input
 *   - Click × on tag → remove that tag
 *
 * @see https://blueprintjs.com/docs/#core/components/tag-input
 */
export const TagInput = forwardRef<HTMLDivElement, TagInputProps>(function TagInput(
    {
        values,
        onChange,
        onAdd,
        onRemove,
        inputValue: inputValueProp,
        onInputChange,
        placeholder,
        separator = /[,\n\r]/,
        addOnBlur = false,
        addOnPaste = true,
        intent = "none",
        large = false,
        fill = false,
        disabled = false,
        leftIcon,
        rightElement,
        tagProps,
        className,
        inputRef: inputRefProp,
        inputProps,
        "data-compare": dataCompare,
        _firstTagCompare,
        _ghostCompare,
    },
    ref,
) {
    // Internal uncontrolled input value state (used when inputValueProp is not provided)
    const [internalInputValue, setInternalInputValue] = useState("");
    const inputValue = inputValueProp !== undefined ? inputValueProp : internalInputValue;

    // Tracks whether the ghost input currently has focus (for active focus ring)
    const [isInputFocused, setIsInputFocused] = useState(false);

    const localInputRef = useRef<HTMLInputElement>(null);

    // Combine local ref with forwarded inputRef
    const setInputRef = useCallback(
        (el: HTMLInputElement | null) => {
            (localInputRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
            if (inputRefProp) {
                if (typeof inputRefProp === "function") {
                    inputRefProp(el);
                } else {
                    (inputRefProp as React.MutableRefObject<HTMLInputElement | null>).current = el;
                }
            }
        },
        [inputRefProp],
    );

    // Add tags from a raw string (split on separator)
    const addTags = useCallback(
        (text: string, method: TagInputAddMethod) => {
            const newValues = splitValues(text, separator);
            if (newValues.length === 0) return;

            let shouldClearInput = onAdd?.(newValues, method) !== false;
            if (onChange) {
                const result = onChange([...values, ...newValues]);
                if (result === false) shouldClearInput = false;
            }

            if (shouldClearInput && inputValueProp === undefined) {
                setInternalInputValue("");
            }
        },
        [onAdd, onChange, values, separator, inputValueProp],
    );

    // Remove a tag at a specific index
    const removeTag = useCallback(
        (index: number) => {
            onRemove?.(values[index], index);
            onChange?.(values.filter((_, i) => i !== index));
        },
        [onRemove, onChange, values],
    );

    // Click on the container → focus the ghost input
    const handleContainerClick = useCallback(() => {
        localInputRef.current?.focus();
    }, []);

    // Blur on the container — check if focus left the container entirely
    const handleContainerBlur = useCallback(
        (e: FocusEvent<HTMLDivElement>) => {
            const currentTarget = e.currentTarget;
            requestAnimationFrame(() => {
                if (!currentTarget.contains(document.activeElement)) {
                    if (addOnBlur && inputValue.length > 0) {
                        addTags(inputValue, "blur");
                    }
                    setIsInputFocused(false);
                }
            });
        },
        [addOnBlur, inputValue, addTags],
    );

    const handleInputFocus = useCallback(() => {
        setIsInputFocused(true);
    }, []);

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const val = e.currentTarget.value;
            if (inputValueProp === undefined) {
                setInternalInputValue(val);
            }
            onInputChange?.(e);
            inputProps?.onChange?.(e);
        },
        [inputValueProp, onInputChange, inputProps],
    );

    const handleInputKeyDown = useCallback(
        (e: KeyboardEvent<HTMLInputElement>) => {
            const { value, selectionEnd } = e.currentTarget;

            // Enter → add tags (if not composing)
            if (e.key === "Enter" && !e.nativeEvent.isComposing && value.length > 0) {
                e.preventDefault();
                addTags(value, "default");
                return;
            }

            // Backspace on empty input → remove last tag
            if (e.key === "Backspace" && selectionEnd === 0 && value.length === 0 && values.length > 0) {
                e.preventDefault();
                removeTag(values.length - 1);
                return;
            }

            inputProps?.onKeyDown?.(e);
        },
        [addTags, removeTag, values, inputProps],
    );

    const handleInputPaste = useCallback(
        (e: ClipboardEvent<HTMLInputElement>) => {
            if (!addOnPaste) return;

            const text = e.clipboardData.getData("text");
            if (!text || text.length === 0) return;

            // Only intercept paste if there are multiple values to add
            if (separator === false) return;
            const parts = text.split(separator as string).map((v) => v.trim()).filter(Boolean);
            if (parts.length <= 1) return;

            e.preventDefault();
            addTags(text, "paste");
        },
        [addOnPaste, separator, addTags],
    );

    const handleTagRemove = useCallback(
        (index: number) => (_e: MouseEvent<HTMLButtonElement>) => {
            removeTag(index);
        },
        [removeTag],
    );

    // Resolve placeholder: Blueprint shows it only when values are empty
    const isSomeValueDefined = values.some(Boolean);
    const resolvedPlaceholder =
        placeholder == null || isSomeValueDefined ? inputProps?.placeholder : placeholder;

    // Shadow: use focus shadow when active (input focused), resting shadow otherwise
    const shadowClass = isInputFocused ? INTENT_FOCUS_SHADOW[intent] : INTENT_SHADOW[intent];

    return (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div
            ref={ref}
            data-compare={dataCompare}
            onBlur={handleContainerBlur}
            onClick={handleContainerClick}
            className={cn(
                // Base input appearance: same border/shadow/bg as InputGroup
                "relative flex flex-row items-start flex-wrap",
                "bg-white dark:bg-black/30",
                "rounded-bp",
                // Sizing: padding on container (Blueprint: padding-left = 1.5 * spacing)
                // medium: min-height 30px, large: min-height 40px
                large ? "min-h-10 pl-2" : "min-h-7.5 pl-1.5",
                // padding-right: 0 (Blueprint: rightElement handles its own margin)
                "pr-0",
                // Transition (matches InputGroup)
                "transition-shadow duration-100 ease-bp",
                // Shadow (resting or focus)
                shadowClass,
                // Intent colors on border (resting shadow already encodes intent color)
                // Fill
                fill ? "w-full" : "inline-flex",
                // Disabled
                disabled && [
                    "bg-[rgba(211,216,222,0.5)] dark:bg-[rgba(64,72,84,0.5)]",
                    "shadow-none cursor-not-allowed",
                ],
                // Cursor (clicking container focuses input)
                !disabled && "cursor-text",
                className,
            )}
        >
            {/* Left icon */}
            {leftIcon != null && (
                <span
                    className={cn(
                        "pointer-events-none flex shrink-0 items-center justify-center text-foreground-muted",
                        // Blueprint: icon margins to center in one-line input
                        // medium: margin-top = 1.75 * spacing = 7px; large: 2.5 * spacing = 10px
                        large
                            ? "mt-[10px] ml-1.5 mr-[7px]"
                            : "mt-[7px] ml-[3px] mr-[7px]",
                    )}
                >
                    <Icon icon={leftIcon} size={large ? 20 : 16} aria-hidden />
                </span>
            )}

            {/* Tag values + ghost input */}
            <div
                className={cn(
                    // .bp6-tag-input-values: flex-wrap row, fills vertically
                    "flex flex-row flex-wrap items-center",
                    "flex-1 min-w-0 self-stretch",
                    // Spacing: gap between chips (Blueprint: pt-flex-container gap = 1 spacing unit = 4px)
                    // large: Blueprint uses 2.5 * spacing = 10px gap
                    large ? "gap-[10px]" : "gap-1",
                    // Margin: Blueprint uses margin-right: 1 spacing + margin-top: 1 spacing
                    "mr-1 mt-1",
                    // Children have margin-bottom = 1 spacing = 4px (Blueprint: > * { margin-bottom: spacing })
                    "[&>*]:mb-1",
                )}
            >
                {values.map((value, index) => {
                    if (!value) return null;
                    const resolvedTagProps =
                        typeof tagProps === "function" ? tagProps(value, index) : (tagProps ?? {});
                    return (
                        <Tag
                            key={`${String(value)}__${index}`}
                            size={large ? "large" : "medium"}
                            onRemove={disabled ? undefined : handleTagRemove(index)}
                            data-compare={index === 0 ? _firstTagCompare : undefined}
                            {...resolvedTagProps}
                        >
                            {value}
                        </Tag>
                    );
                })}

                {/* Ghost input — no border, no shadow, grows to fill remaining space */}
                <input
                    ref={setInputRef}
                    value={inputValue}
                    disabled={disabled}
                    placeholder={resolvedPlaceholder}
                    data-compare={_ghostCompare}
                    {...inputProps}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    onKeyDown={handleInputKeyDown}
                    onPaste={handleInputPaste}
                    className={cn(
                        // .bp6-input-ghost: no border, no shadow, transparent bg, flex-fill
                        "flex-[1_1_auto] bg-transparent border-none outline-none shadow-none",
                        "text-foreground placeholder:text-foreground-muted placeholder:opacity-100",
                        "font-sans font-normal",
                        // width=80px (Blueprint: width: calc(spacing*20) = 80px, flex allows grow beyond)
                        "w-20",
                        // line-height: Blueprint uses spacing * 5 (medium) or * 7.5 (large)
                        large ? "h-7.5 text-body-lg leading-[30px]" : "h-5 text-body leading-[20px]",
                        // Disabled
                        disabled && "cursor-not-allowed text-foreground-disabled",
                        // padding: 0 (ghost input has no padding of its own)
                        "p-0",
                        inputProps?.className,
                    )}
                />
            </div>

            {/* Right element (e.g. clear button, spinner) */}
            {rightElement != null && (
                <span
                    className={cn(
                        "flex shrink-0 items-center",
                        // Blueprint: button/spinner margin = 0.75 * spacing
                        large ? "m-[5px] ml-0" : "m-[3px] ml-0",
                    )}
                >
                    {rightElement}
                </span>
            )}
        </div>
    );
});
