/**
 * DateInput — pixel-faithful Blueprint v6.15 reimplementation with a clean modern API.
 *
 * DateInput = InputGroup (shows formatted date) + Popover containing DatePicker.
 * Clicking or focusing the input opens the popover; picking a day fills the input
 * and closes (unless timePrecision keeps it open).
 *
 * Reuses: DatePicker, Popover, InputGroup, Icon, cn.
 *
 * Design spec source:
 *   packages/datetime/src/components/date-input/_date-input.scss
 *   packages/datetime/src/components/date-input/dateInputProps.ts
 *   packages/datetime/src/components/date-input/dateInput.tsx
 *
 * Key metrics:
 *   - The input is a standard InputGroup (30px medium height)
 *   - Popover placement: bottom-start (Blueprint DateInput default)
 *   - Popover is minimal (no extra content padding; DatePicker has its own padding)
 *   - The right element is an optional calendar icon button (or consumer-provided)
 *   - Default format: M/d/yyyy (date-fns style, but we use Intl for zero dependency)
 *     e.g. "1/15/2026" for Jan 15, 2026
 *   - Error state: intent="danger" on InputGroup when typed text fails to parse
 *   - Dark mode: Popover handles dark portal wrapper via the `dark` prop
 *
 * Portal + dark pattern (from popover.tsx):
 *   Pass `dark` prop → Popover wraps portal in <div className="dark"> so Tailwind
 *   dark utilities apply inside the portaled popover panel.
 *
 * @see https://blueprintjs.com/docs/#datetime/date-input
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { DatePicker } from "./date-picker";
import type { TimePrecision } from "./time-picker";
import { Icon } from "./icon";
import { InputGroup } from "./input-group";
import { Popover } from "./popover";

// ---------------------------------------------------------------------------
// Formatting helpers (no date-fns dep — use native Intl / Date)
// ---------------------------------------------------------------------------

/** Default format: M/d/yyyy — matches Blueprint's default dateFnsFormat for en-US */
const DEFAULT_FORMAT_DATE = (date: Date): string => {
    // e.g. "1/15/2026" for Jan 15, 2026 (no zero-padding)
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const y = date.getFullYear();
    return `${m}/${d}/${y}`;
};

/** Parse M/d/yyyy string → Date. Returns null for empty string, invalid Date for bad input. */
const DEFAULT_PARSE_DATE = (str: string): Date | null => {
    if (!str.trim()) return null;
    // Try M/d/yyyy or M-d-yyyy
    const parts = str.trim().split(/[\/\-\.]/);
    if (parts.length === 3) {
        const m = parseInt(parts[0], 10);
        const d = parseInt(parts[1], 10);
        const y = parseInt(parts[2], 10);
        if (!isNaN(m) && !isNaN(d) && !isNaN(y) && y >= 100) {
            const date = new Date(y, m - 1, d);
            // Validate: month/day must round-trip (catches Feb 30 etc.)
            if (date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d) {
                return date;
            }
        }
    }
    // Fallback: native Date parsing
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) return parsed;
    return new Date(NaN); // invalid date sentinel
};

function isValidDate(d: Date | null): d is Date {
    return d != null && !isNaN(d.getTime());
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DateInputProps {
    /** Controlled selected date value. Use with `onChange`. */
    value?: Date | null;
    /** Default value for uncontrolled mode. */
    defaultValue?: Date | null;
    /**
     * Called when the user selects a date (from the calendar or typed input).
     * Receives the new Date, or null if cleared.
     */
    onChange?: (newDate: Date | null) => void;
    /**
     * Formats a date as a string for display in the input.
     * @default M/d/yyyy (e.g. "1/15/2026")
     */
    formatDate?: (date: Date) => string;
    /**
     * Parses a date string (typed by the user) into a Date.
     * Return null for empty, invalid Date (isNaN) for parse error.
     * @default parses M/d/yyyy
     */
    parseDate?: (str: string) => Date | null;
    /** Placeholder text for the input when no date is selected. */
    placeholder?: string;
    /** Minimum selectable date. @default 1 Jan 1900 */
    minDate?: Date;
    /** Maximum selectable date. @default 31 Dec 2100 */
    maxDate?: Date;
    /**
     * Show a TimePicker below the calendar (passed through to DatePicker).
     * "minute" | "second" | "millisecond"
     */
    timePrecision?: TimePrecision;
    /**
     * Whether to close the popover when the user clicks a date.
     * When timePrecision is set, stays open for time editing.
     * @default true
     */
    closeOnSelection?: boolean;
    /** Whether the input is disabled. @default false */
    disabled?: boolean;
    /**
     * Whether the input fills its container width.
     * @default false
     */
    fill?: boolean;
    /**
     * Props passed to the underlying InputGroup.
     * `value`, `disabled`, `type`, `size` are reserved.
     */
    inputProps?: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "disabled" | "type" | "size">;
    /**
     * Props passed to the Popover.
     * `open`, `content`, `dark` are reserved.
     */
    popoverProps?: {
        side?: "top" | "right" | "bottom" | "left";
        align?: "start" | "center" | "end";
        sideOffset?: number;
    };
    /**
     * Pass the app-level dark state so the portaled popover inherits dark mode.
     * Same pattern as Dialog, Drawer, Select, Suggest.
     */
    dark?: boolean;
    /** Additional className on the root container. */
    className?: string;
}

// ---------------------------------------------------------------------------
// DateInput
// ---------------------------------------------------------------------------

/**
 * DateInput — text input with a popover DatePicker.
 *
 * @example
 * ```tsx
 * const [date, setDate] = useState<Date | null>(null);
 *
 * <DateInput
 *   value={date}
 *   onChange={setDate}
 *   placeholder="M/d/yyyy"
 *   dark={dark}
 * />
 * ```
 */
export function DateInput({
    value,
    defaultValue,
    onChange,
    formatDate = DEFAULT_FORMAT_DATE,
    parseDate = DEFAULT_PARSE_DATE,
    placeholder = "M/d/yyyy",
    minDate = new Date(1900, 0, 1),
    maxDate = new Date(2100, 11, 31),
    timePrecision,
    closeOnSelection = true,
    disabled = false,
    fill = false,
    inputProps = {},
    popoverProps = {},
    dark = false,
    className,
}: DateInputProps) {
    // ---- Controlled / uncontrolled date value ----
    const isControlled = value !== undefined;
    const [internalDate, setInternalDate] = useState<Date | null>(() => {
        if (isControlled) return value ?? null;
        return defaultValue ?? null;
    });

    const currentDate: Date | null = isControlled ? (value ?? null) : internalDate;

    // Sync internal date when controlled value changes
    useEffect(() => {
        if (isControlled) {
            setInternalDate(value ?? null);
        }
    }, [isControlled, value]);

    // ---- Popover open state ----
    const [isOpen, setIsOpen] = useState(false);

    // ---- Input text state ----
    // While the user is typing (focused), we track the raw string.
    // When not focused, we display the formatted date.
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [inputText, setInputText] = useState<string>(() =>
        currentDate && isValidDate(currentDate) ? formatDate(currentDate) : "",
    );

    // Sync input text when controlled date changes and input is not focused
    useEffect(() => {
        if (!isInputFocused) {
            setInputText(
                currentDate && isValidDate(currentDate) ? formatDate(currentDate) : "",
            );
        }
    }, [currentDate, formatDate, isInputFocused]);

    // ---- Error state: typed text doesn't parse to a valid date ----
    const [isError, setIsError] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);

    // ---- Calendar day selection (from DatePicker) ----
    const handleDateChange = useCallback(
        (newDate: Date | null) => {
            if (!isControlled) {
                setInternalDate(newDate);
            }
            onChange?.(newDate);

            // Format and show in input
            setInputText(newDate && isValidDate(newDate) ? formatDate(newDate) : "");
            setIsError(false);

            // Close on selection unless timePrecision keeps it open
            if (closeOnSelection && !timePrecision) {
                setIsOpen(false);
                setIsInputFocused(false);
            }
        },
        [closeOnSelection, formatDate, isControlled, onChange, timePrecision],
    );

    // ---- Input focus: open popover ----
    const handleFocus = useCallback(
        (e: React.FocusEvent<HTMLInputElement>) => {
            setIsInputFocused(true);
            setIsOpen(true);
            // Show formatted string when focusing so user can edit it
            setInputText(
                currentDate && isValidDate(currentDate) ? formatDate(currentDate) : "",
            );
            inputProps?.onFocus?.(e);
        },
        [currentDate, formatDate, inputProps],
    );

    // ---- Input blur: parse typed value ----
    const handleBlur = useCallback(
        (e: React.FocusEvent<HTMLInputElement>) => {
            setIsInputFocused(false);

            const trimmed = inputText.trim();
            if (!trimmed) {
                // Cleared
                if (!isControlled) setInternalDate(null);
                onChange?.(null);
                setInputText("");
                setIsError(false);
                inputProps?.onBlur?.(e);
                return;
            }

            const parsed = parseDate(trimmed);
            if (parsed === null) {
                // Empty result — treat as cleared
                if (!isControlled) setInternalDate(null);
                onChange?.(null);
                setInputText("");
                setIsError(false);
            } else if (isValidDate(parsed) && parsed >= minDate && parsed <= maxDate) {
                // Valid in-range date
                if (!isControlled) setInternalDate(parsed);
                onChange?.(parsed);
                setInputText(formatDate(parsed));
                setIsError(false);
            } else {
                // Invalid or out-of-range
                setIsError(true);
                // Keep the typed string so user can see what was wrong
            }

            inputProps?.onBlur?.(e);
        },
        [formatDate, inputProps, inputText, isControlled, maxDate, minDate, onChange, parseDate],
    );

    // ---- Input change: live parse while typing ----
    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value;
            setInputText(raw);

            if (!raw.trim()) {
                // Empty — clear error
                setIsError(false);
                inputProps?.onChange?.(e);
                return;
            }

            const parsed = parseDate(raw.trim());
            if (parsed !== null && isValidDate(parsed) && parsed >= minDate && parsed <= maxDate) {
                // Valid live parse — update calendar selection immediately
                if (!isControlled) setInternalDate(parsed);
                onChange?.(parsed);
                setIsError(false);
            }
            // Don't set error on every keystroke — wait for blur

            inputProps?.onChange?.(e);
        },
        [inputProps, isControlled, maxDate, minDate, onChange, parseDate],
    );

    // ---- Keyboard: Escape closes, Enter parses ----
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Escape") {
                setIsOpen(false);
                inputRef.current?.blur();
            } else if (e.key === "Enter") {
                const parsed = parseDate(inputText.trim());
                if (parsed !== null && isValidDate(parsed) && parsed >= minDate && parsed <= maxDate) {
                    if (!isControlled) setInternalDate(parsed);
                    onChange?.(parsed);
                    setInputText(formatDate(parsed));
                    setIsError(false);
                    if (closeOnSelection) {
                        setIsOpen(false);
                        setIsInputFocused(false);
                    }
                }
            }
            inputProps?.onKeyDown?.(e);
        },
        [
            closeOnSelection,
            formatDate,
            inputProps,
            inputText,
            isControlled,
            maxDate,
            minDate,
            onChange,
            parseDate,
        ],
    );

    // ---- Popover open change ----
    const handleOpenChange = useCallback((open: boolean) => {
        setIsOpen(open);
        if (!open) {
            setIsInputFocused(false);
        }
    }, []);

    // ---- Displayed input value ----
    const displayValue = isInputFocused ? inputText : (currentDate && isValidDate(currentDate) ? formatDate(currentDate) : "");

    // ---- Calendar icon right element ----
    const calendarIcon = (
        <button
            type="button"
            tabIndex={-1}
            aria-label="Open date picker"
            disabled={disabled}
            onClick={() => {
                if (!disabled) {
                    setIsOpen((o) => !o);
                    if (!isOpen) {
                        inputRef.current?.focus();
                    }
                }
            }}
            className={cn(
                "flex items-center justify-center",
                "w-full h-full",
                "bg-transparent border-0 p-0",
                "text-foreground-muted",
                disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:text-foreground",
                "transition-colors duration-100",
            )}
        >
            <Icon icon="calendar" size={16} aria-hidden />
        </button>
    );

    // ---- DatePicker (popover content) ----
    const pickerContent = (
        <DatePicker
            value={isValidDate(currentDate ?? null) ? (currentDate as Date) : null}
            onChange={handleDateChange}
            month={isValidDate(currentDate ?? null) ? new Date((currentDate as Date).getFullYear(), (currentDate as Date).getMonth(), 1) : undefined}
            minDate={minDate}
            maxDate={maxDate}
            timePrecision={timePrecision}
        />
    );

    return (
        <div
            className={cn(
                "inline-block",
                fill && "w-full block",
                className,
            )}
        >
            <Popover
                open={isOpen && !disabled}
                onOpenChange={handleOpenChange}
                content={pickerContent}
                side={popoverProps.side ?? "bottom"}
                align={popoverProps.align ?? "start"}
                sideOffset={popoverProps.sideOffset ?? 4}
                arrow={false}
                minimal={true}
                hasContentPadding={false}
                dark={dark}
                disabled={disabled}
            >
                <InputGroup
                    ref={inputRef}
                    type="text"
                    autoComplete="off"
                    placeholder={placeholder}
                    value={displayValue}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    fill={fill}
                    intent={isError ? "danger" : "none"}
                    rightElement={calendarIcon}
                    aria-haspopup="dialog"
                    aria-expanded={isOpen}
                    {...inputProps}
                />
            </Popover>
        </div>
    );
}

DateInput.displayName = "DateInput";
