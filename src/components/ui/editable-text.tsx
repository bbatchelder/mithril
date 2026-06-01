import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { forwardRef } from "react";

import { cn } from "@/lib/utils";
import type { Intent } from "@/lib/types";

export type EditableTextIntent = Intent;

export interface EditableTextProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
    /**
     * Current text value (controlled mode). Pair with `onChange`.
     */
    value?: string;

    /**
     * Default text value for uncontrolled mode.
     * @default ""
     */
    defaultValue?: string;

    /**
     * Placeholder text shown when value is empty.
     * @default "Click to Edit"
     */
    placeholder?: string;

    /**
     * Whether the component is disabled (not editable).
     * @default false
     */
    disabled?: boolean;

    /**
     * Whether the component supports multiple lines of text.
     * In multiline mode, Enter adds a newline (unless `confirmOnEnterKey` is true).
     * @default false
     */
    multiline?: boolean;

    /**
     * Minimum number of lines (essentially minimum height), when `multiline`.
     * @default 1
     */
    minLines?: number;

    /**
     * Maximum number of lines before scrolling begins, when `multiline`.
     * @default Infinity
     */
    maxLines?: number;

    /**
     * Minimum width in pixels of the input, when not `multiline`.
     * @default 80
     */
    minWidth?: number;

    /**
     * In multiline mode: if true, Enter confirms and Mod+Enter inserts newline.
     * If false (default): Enter inserts newline, Mod+Enter confirms.
     * In single-line mode: Enter always confirms.
     * @default false
     */
    confirmOnEnterKey?: boolean;

    /**
     * Whether the entire text field should be selected on focus.
     * If false, cursor is placed at the end.
     * @default false
     */
    selectAllOnFocus?: boolean;

    /**
     * Intent color for text and ring. Affects hover/focus ring and text color.
     */
    intent?: EditableTextIntent;

    /**
     * Whether the component is currently editing (controlled edit state).
     * Pair with `onEdit`.
     */
    isEditing?: boolean;

    /**
     * Maximum number of characters allowed.
     */
    maxLength?: number;

    /**
     * Input type (only when not multiline).
     * @default "text"
     */
    type?: string;

    /**
     * Additional class on the root element.
     */
    className?: string;

    /**
     * Extra attributes for the underlying input/textarea.
     */
    inputProps?: React.InputHTMLAttributes<HTMLInputElement> & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

    /**
     * Callback invoked when the user changes the value while editing.
     */
    onChange?: (value: string) => void;

    /**
     * Callback invoked when the user confirms (blur or Enter key).
     * Receives the confirmed value.
     */
    onConfirm?: (value: string) => void;

    /**
     * Callback invoked when the user cancels (Escape key).
     * Receives the last confirmed value (the value is restored to it).
     */
    onCancel?: (value: string) => void;

    /**
     * Callback invoked when the user enters edit mode.
     */
    onEdit?: (value: string | undefined) => void;
}

// Small buffer added to the measured span scrollWidth to prevent input from
// continuously growing. Mirrors Blueprint's BUFFER_WIDTH_DEFAULT = 5.
const BUFFER_WIDTH = 5;

/**
 * Returns the integer pixel line-height of an element, falling back to
 * a DOM measurement when computed style returns "normal".
 */
function getLineHeight(el: HTMLElement): number {
    const raw = getComputedStyle(el).lineHeight;
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed)) return parsed;
    // "normal" case: measure two-line vs one-line height
    const tmp = document.createElement("span");
    tmp.innerHTML = "<br>";
    el.appendChild(tmp);
    const h1 = el.offsetHeight;
    tmp.innerHTML = "<br><br>";
    const h2 = el.offsetHeight;
    el.removeChild(tmp);
    return h2 - h1;
}

function getFontSize(el: HTMLElement): number {
    const fs = getComputedStyle(el).fontSize;
    return fs ? parseInt(fs, 10) : 0;
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

/**
 * EditableText — pixel-faithful Blueprint `.bp6-editable-text` reimplementation.
 *
 * Click-to-edit inline text. Showing the current value as plain text; on click/focus
 * it switches to an editable input (or textarea in multiline mode). Confirm on blur
 * or Enter, cancel on Escape.
 *
 * ## Box-shadow rings (the key fidelity detail — matches Blueprint exactly)
 *
 * Blueprint applies shadows to a `::before` pseudo-element that extends -2px beyond
 * the text bounds. We replicate this with a real `<div>` positioned at `-2px inset`.
 *
 * Light, resting: no shadow.
 * Light, hover:   `inset 0 0 0 1px rgba(17,20,24,0.15)` (= $pt-divider-black)
 * Light, editing: `inset 0 0 0 1px rgba(33,93,176,0.752), 0 0 0 1px rgba(33,93,176,0.752), inset 0 1px 1px rgba(17,20,24,0.2)` + white bg
 * Dark, hover:    `inset 0 0 0 1px rgba(255,255,255,0.2)` (= $pt-dark-divider-white)
 * Dark, editing:  `inset 0 0 0 1px rgba(138,187,255,0.752), 0 0 0 1px rgba(138,187,255,0.752)` + rgba(0,0,0,0.3) bg
 *
 * Intent colors replace the ring color (both hover + editing rings).
 *   Light: blue-2/green-2/orange-2/red-2 → rgba(33,93,176), rgba(28,110,66), rgba(147,86,16), rgba(172,47,51)
 *   Dark:  blue-5/green-5/orange-5/red-5 → rgba(138,187,255), rgba(114,202,155), rgba(251,179,96), rgba(250,153,156)
 *
 * @see https://blueprintjs.com/docs/#core/components/editable-text
 */
export const EditableText = forwardRef<HTMLDivElement, EditableTextProps>(function EditableText(
    {
        value: valueProp,
        defaultValue = "",
        placeholder = "Click to Edit",
        disabled = false,
        multiline = false,
        minLines = 1,
        maxLines = Infinity,
        minWidth = 80,
        confirmOnEnterKey = false,
        selectAllOnFocus = false,
        intent = "none",
        isEditing: isEditingProp,
        maxLength,
        type = "text",
        className,
        inputProps,
        onChange,
        onConfirm,
        onCancel,
        onEdit,
        // Remaining HTML attributes (data-*, aria-*, etc.) forwarded to root div
        ...rootProps
    },
    ref,
) {
    // ── Controlled / uncontrolled value ────────────────────────────────────
    const isControlled = valueProp !== undefined;
    const [internalValue, setInternalValue] = useState<string>(
        isControlled ? (valueProp ?? "") : defaultValue,
    );
    const value = isControlled ? (valueProp ?? "") : internalValue;

    // Track "last confirmed value" for cancel-to-restore
    const lastValueRef = useRef<string>(value);

    // ── Edit state (can be controlled via isEditing prop) ─────────────────
    const isEditingControlled = isEditingProp !== undefined;
    const [isEditingInternal, setIsEditingInternal] = useState(
        isEditingProp === true && !disabled,
    );
    const isEditing = isEditingControlled ? isEditingProp! && !disabled : isEditingInternal;

    // ── Sync controlled props ──────────────────────────────────────────────
    useEffect(() => {
        if (isControlled) {
            setInternalValue(valueProp ?? "");
        }
    }, [isControlled, valueProp]);

    useEffect(() => {
        if (isEditingControlled) {
            setIsEditingInternal(isEditingProp! && !disabled);
        }
    }, [isEditingControlled, isEditingProp, disabled]);

    useEffect(() => {
        if (disabled) {
            setIsEditingInternal(false);
        }
    }, [disabled]);

    // ── DOM refs ────────────────────────────────────────────────────────────
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
    const contentRef = useRef<HTMLSpanElement | null>(null);

    // ── Measured input dimensions ──────────────────────────────────────────
    const [inputHeight, setInputHeight] = useState(0);
    const [inputWidth, setInputWidth] = useState(0);

    // ── Hover state (for hover ring) ───────────────────────────────────────
    const [isHovered, setIsHovered] = useState(false);

    // ── Dimension measurement ─────────────────────────────────────────────
    const updateDimensions = useCallback(() => {
        const span = contentRef.current;
        if (!span) return;

        const lineHeight = getLineHeight(span);
        let { scrollHeight, scrollWidth } = span;

        // Add one extra line if text ends with \n in editing textarea
        if (multiline && isEditing && /\n$/.test(span.textContent ?? "")) {
            scrollHeight += lineHeight;
        }

        if (lineHeight > 0) {
            scrollHeight = clamp(
                scrollHeight,
                minLines * lineHeight,
                maxLines === Infinity ? scrollHeight : maxLines * lineHeight,
            );
        }

        const parentEl = span.parentElement;
        const minH = Math.max(
            scrollHeight,
            getFontSize(span) + 1,
            parentEl ? getLineHeight(parentEl) : 0,
        );

        setInputHeight(minH);
        setInputWidth(Math.max(scrollWidth + BUFFER_WIDTH, minWidth));
    }, [multiline, isEditing, minLines, maxLines, minWidth]);

    // Measure on first render and whenever relevant state changes
    useLayoutEffect(() => {
        updateDimensions();
    }, [value, placeholder, multiline, minLines, maxLines, minWidth, updateDimensions]);

    // Focus + selection when we enter edit mode
    useLayoutEffect(() => {
        if (!isEditing || !inputRef.current) return;
        const input = inputRef.current;
        input.focus();

        // setSelectionRange only works on supported types (text, search, url, tel, password, textarea)
        const supportsSelection =
            input instanceof HTMLTextAreaElement ||
            ["text", "search", "tel", "url", "password"].includes((input as HTMLInputElement).type ?? "");

        if (supportsSelection) {
            const len = input.value.length;
            input.setSelectionRange(selectAllOnFocus ? 0 : len, len);
        }
        if (!supportsSelection || !selectAllOnFocus) {
            input.scrollLeft = input.scrollWidth;
        }
    }, [isEditing, selectAllOnFocus]);

    // ── Expose root div ref via forwardRef ─────────────────────────────────
    const rootRef = useRef<HTMLDivElement | null>(null);
    useImperativeHandle(ref, () => rootRef.current as HTMLDivElement);

    // ── Event handlers ─────────────────────────────────────────────────────
    const enterEditing = useCallback(() => {
        if (disabled) return;
        setIsEditingInternal(true);
        onEdit?.(value);
    }, [disabled, value, onEdit]);

    const confirmEditing = useCallback(() => {
        lastValueRef.current = value;
        setIsEditingInternal(false);
        onConfirm?.(value);
    }, [value, onConfirm]);

    const cancelEditing = useCallback(() => {
        const last = lastValueRef.current;
        setIsEditingInternal(false);
        if (!isControlled) {
            setInternalValue(last);
        }
        if (value !== last) {
            onChange?.(last);
        }
        onCancel?.(last);
    }, [value, isControlled, onChange, onCancel]);

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            const v = e.currentTarget.value;
            if (!isControlled) setInternalValue(v);
            onChange?.(v);
        },
        [isControlled, onChange],
    );

    const handleBlur = useCallback(() => {
        if (isEditing) confirmEditing();
    }, [isEditing, confirmEditing]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            // Skip during IME composition
            if (e.nativeEvent.isComposing) return;

            if (e.key === "Escape") {
                cancelEditing();
                return;
            }

            if (e.key === "Enter") {
                const { altKey, ctrlKey, metaKey, shiftKey } = e;
                if (altKey || shiftKey) {
                    e.preventDefault(); // prevent browser fullscreen etc.
                }

                const hasModifier = altKey || ctrlKey || metaKey || shiftKey;

                if (multiline) {
                    if (confirmOnEnterKey) {
                        // Enter confirms; Mod+Enter inserts newline
                        if (hasModifier) {
                            // Insert newline at caret
                            const target = e.currentTarget as HTMLTextAreaElement;
                            const { selectionStart: ss, selectionEnd: se, value: tv } = target;
                            const newVal = tv.slice(0, ss ?? 0) + "\n" + tv.slice(se ?? 0);
                            if (!isControlled) setInternalValue(newVal);
                            onChange?.(newVal);
                            // Restore caret after React re-render
                            requestAnimationFrame(() => {
                                if (target.isConnected) {
                                    target.setSelectionRange((ss ?? 0) + 1, (ss ?? 0) + 1);
                                }
                            });
                        } else {
                            confirmEditing();
                        }
                    } else {
                        // Default: Enter is newline, Mod+Enter confirms
                        if (hasModifier) {
                            confirmEditing();
                        }
                        // else: let browser handle Enter as newline in textarea
                    }
                } else {
                    // Single-line: Enter always confirms
                    confirmEditing();
                }
            }
        },
        [multiline, confirmOnEnterKey, isControlled, onChange, confirmEditing, cancelEditing],
    );

    // ── Styles ─────────────────────────────────────────────────────────────
    const hasValue = value !== "";

    // Intent → text color (mirrors Blueprint's $pt-intent-text-colors and $pt-dark-intent-text-colors)
    // Light: blue-2/green-2/orange-2/red-2; Dark: blue-5/green-5/orange-5/red-5
    const intentTextClass: Record<EditableTextIntent, string> = {
        none: "text-foreground",
        primary: "text-blue-2 dark:text-blue-5",
        success: "text-green-2 dark:text-green-5",
        warning: "text-orange-2 dark:text-orange-5",
        danger: "text-red-2 dark:text-red-5",
    };

    // The ::before pseudo ring div:
    // - positioned inset: -2px (Blueprint: position-all(absolute, $pt-spacing * -0.5) = -2px)
    // - border-radius: 4px (= $pt-border-radius)
    // - transition: background-color 100ms ease-bp, box-shadow 100ms ease-bp
    //
    // Box-shadow per state/intent (literal values for Tailwind tree-shaking safety):
    //   resting:      no shadow
    //   hover:        inset 0 0 0 1px rgba(17,20,24,0.15)                                 [light]
    //                 inset 0 0 0 1px rgba(255,255,255,0.2)                               [dark]
    //   editing:      inset 0 0 0 1px rgba(33,93,176,0.752), 0 0 0 1px rgba(33,93,176,0.752), inset 0 1px 1px rgba(17,20,24,0.2)  [light]
    //                 inset 0 0 0 1px rgba(138,187,255,0.752), 0 0 0 1px rgba(138,187,255,0.752)                                   [dark]
    //
    // Intent overrides (hover): inset 0 0 0 1px rgba(<intent>,0.4) — border-shadow(0.4, $color, 1px)
    //   primary hover: rgba(45,114,210,0.4)  / dark: rgba(76,144,240,0.4)    [blue-3/blue-4]
    //   success hover: rgba(35,133,81,0.4)   / dark: rgba(50,164,103,0.4)    [green-3/green-4]
    //   warning hover: rgba(200,118,25,0.4)  / dark: rgba(236,154,60,0.4)    [orange-3/orange-4]
    //   danger hover:  rgba(205,66,70,0.4)   / dark: rgba(231,106,110,0.4)   [red-3/red-4]
    //
    // Intent editing: same as no-intent editing but with intent ring color
    //   primary editing light: inset 0 0 0 1px rgba(45,114,210,0.752), 0 0 0 1px rgba(45,114,210,0.752), inset 0 1px 1px rgba(17,20,24,0.2)
    //   primary editing dark:  inset 0 0 0 1px rgba(76,144,240,0.752), 0 0 0 1px rgba(76,144,240,0.752)
    //   (etc. for success/warning/danger)
    //
    // Disabled: box-shadow: none !important

    // We build the ring div's shadow via state-reactive classes.
    // Since we can't use CSS :hover/:focus on the ::before, we drive state in JS.
    // This is still tree-shaking safe because ALL variants are in JSX strings.

    const getRingShadow = () => {
        if (disabled) return "";
        if (isEditing) {
            // editing ring: full focus ring per intent
            const editShadows: Record<EditableTextIntent, string> = {
                none: "shadow-[inset_0_0_0_1px_rgba(33,93,176,0.752),_0_0_0_1px_rgba(33,93,176,0.752),_inset_0_1px_1px_rgba(17,20,24,0.2)] dark:shadow-[inset_0_0_0_1px_rgba(138,187,255,0.752),_0_0_0_1px_rgba(138,187,255,0.752)]",
                primary: "shadow-[inset_0_0_0_1px_rgba(45,114,210,0.752),_0_0_0_1px_rgba(45,114,210,0.752),_inset_0_1px_1px_rgba(17,20,24,0.2)] dark:shadow-[inset_0_0_0_1px_rgba(76,144,240,0.752),_0_0_0_1px_rgba(76,144,240,0.752)]",
                success: "shadow-[inset_0_0_0_1px_rgba(35,133,81,0.752),_0_0_0_1px_rgba(35,133,81,0.752),_inset_0_1px_1px_rgba(17,20,24,0.2)] dark:shadow-[inset_0_0_0_1px_rgba(50,164,103,0.752),_0_0_0_1px_rgba(50,164,103,0.752)]",
                warning: "shadow-[inset_0_0_0_1px_rgba(200,118,25,0.752),_0_0_0_1px_rgba(200,118,25,0.752),_inset_0_1px_1px_rgba(17,20,24,0.2)] dark:shadow-[inset_0_0_0_1px_rgba(236,154,60,0.752),_0_0_0_1px_rgba(236,154,60,0.752)]",
                danger: "shadow-[inset_0_0_0_1px_rgba(205,66,70,0.752),_0_0_0_1px_rgba(205,66,70,0.752),_inset_0_1px_1px_rgba(17,20,24,0.2)] dark:shadow-[inset_0_0_0_1px_rgba(231,106,110,0.752),_0_0_0_1px_rgba(231,106,110,0.752)]",
            };
            return editShadows[intent];
        }
        if (isHovered) {
            // hover ring per intent
            const hoverShadows: Record<EditableTextIntent, string> = {
                none: "shadow-[inset_0_0_0_1px_rgba(17,20,24,0.15)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]",
                primary: "shadow-[inset_0_0_0_1px_rgba(45,114,210,0.4)] dark:shadow-[inset_0_0_0_1px_rgba(76,144,240,0.4)]",
                success: "shadow-[inset_0_0_0_1px_rgba(35,133,81,0.4)] dark:shadow-[inset_0_0_0_1px_rgba(50,164,103,0.4)]",
                warning: "shadow-[inset_0_0_0_1px_rgba(200,118,25,0.4)] dark:shadow-[inset_0_0_0_1px_rgba(236,154,60,0.4)]",
                danger: "shadow-[inset_0_0_0_1px_rgba(205,66,70,0.4)] dark:shadow-[inset_0_0_0_1px_rgba(231,106,110,0.4)]",
            };
            return hoverShadows[intent];
        }
        return "";
    };

    // Background for the ring div when editing
    const getRingBg = () => {
        if (disabled || !isEditing) return "";
        // Light: white ($input-background-color); Dark: rgba(0,0,0,0.3) ($dark-input-background-color)
        return "bg-white dark:bg-[rgba(0,0,0,0.3)]";
    };

    // Content-span style (position + dimensions)
    let contentStyle: React.CSSProperties;
    if (multiline) {
        contentStyle = {
            height: !isEditing && inputHeight ? inputHeight : undefined,
        };
    } else {
        contentStyle = {
            height: inputHeight || undefined,
            lineHeight: inputHeight ? `${inputHeight}px` : undefined,
            minWidth,
        };
    }

    // Input style (sized from measured content span)
    const getInputStyle = (): React.CSSProperties => {
        if (inputHeight === 0 && inputWidth === 0) return {};
        return {
            height: inputHeight || undefined,
            lineHeight: !multiline && inputHeight ? `${inputHeight}px` : undefined,
            width: multiline ? "100%" : inputWidth,
        };
    };

    const inputSharedClass = cn(
        // Reset: no border, no bg, no shadow, no padding — just text
        "border-none bg-transparent shadow-none p-0 outline-none resize-none",
        "color-inherit font-inherit leading-inherit tracking-inherit max-w-inherit",
        "relative align-top w-full",
        // Placeholder color: $input-placeholder-color = $pt-text-color-muted = gray-1
        //                    $dark-input-placeholder-color = $pt-dark-text-color-muted = gray-4
        "placeholder:text-gray-1 dark:placeholder:text-gray-4 placeholder:opacity-100",
        "whitespace-pre-wrap",
        intentTextClass[intent],
        inputProps?.className,
    );

    // Tab index: editable when not editing; when editing the input itself handles focus
    const tabIndex = isEditing || disabled ? undefined : 0;

    return (
        <div
            ref={rootRef}
            {...rootProps}
            className={cn(
                // Blueprint's .bp6-editable-text: cursor:text, display:inline-block,
                // max-width:100%, position:relative, vertical-align:top, white-space:nowrap
                "cursor-text inline-block max-w-full relative align-top",
                multiline && "block whitespace-normal",
                disabled && "cursor-default",
                className,
            )}
            onFocus={enterEditing}
            onMouseEnter={() => !disabled && setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            tabIndex={tabIndex}
        >
            {/* The ring/background pseudo-element (Blueprint's ::before) */}
            <div
                aria-hidden="true"
                className={cn(
                    "absolute inset-[-2px] rounded-[4px] pointer-events-none",
                    "transition-[background-color,box-shadow] duration-[100ms] ease-[cubic-bezier(0.4,1,0.75,0.9)]",
                    getRingShadow(),
                    getRingBg(),
                )}
            />

            {/* Input/textarea — rendered when editing */}
            {isEditing &&
                (multiline ? (
                    <textarea
                        {...inputProps}
                        ref={(el) => { (inputRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el; }}
                        className={inputSharedClass}
                        value={value}
                        placeholder={placeholder}
                        disabled={disabled}
                        maxLength={maxLength}
                        style={getInputStyle()}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                    />
                ) : (
                    <input
                        {...inputProps}
                        ref={(el) => { (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = el; }}
                        type={type}
                        className={inputSharedClass}
                        value={value}
                        placeholder={placeholder}
                        disabled={disabled}
                        maxLength={maxLength}
                        style={getInputStyle()}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                    />
                ))}

            {/* Content span — always rendered to measure; hidden visually when editing */}
            <span
                ref={contentRef}
                className={cn(
                    "relative align-top max-w-inherit",
                    // padding-right: $pt-spacing * 0.5 = 2px (accounts for cursor bar width)
                    "pr-[2px]",
                    // when editing: absolutely positioned + invisible (but still in flow for sizing)
                    isEditing && "absolute left-0 invisible",
                    // when not editing + multiline: overflow:auto, white-space:pre-wrap, word-wrap:break-word
                    !isEditing && multiline && "overflow-auto whitespace-pre-wrap break-words",
                    // when not editing + single-line: overflow:hidden, text-overflow:ellipsis, white-space:pre
                    !isEditing && !multiline && "overflow-hidden text-ellipsis whitespace-pre",
                    // placeholder color
                    !hasValue ? "text-gray-1 dark:text-gray-4" : intentTextClass[intent],
                )}
                style={contentStyle}
            >
                {hasValue ? value : placeholder}
            </span>
        </div>
    );
});

EditableText.displayName = "EditableText";
