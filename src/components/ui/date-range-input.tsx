"use client";

/**
 * DateRangeInput — pixel-faithful Blueprint v6.15 reimplementation with a clean modern API.
 *
 * DateRangeInput = two InputGroup fields (start + end) that share a single Popover
 * containing a DateRangePicker. Focusing either input opens the shared popover.
 * Selecting a start then end date updates both inputs and closes the popover.
 *
 * Reuses: DateRangePicker, Popover, InputGroup, Icon, cn.
 *
 * Design spec source:
 *   packages/datetime/src/components/date-range-input/dateRangeInput.tsx
 *   packages/core/src/components/forms/_control-group.scss (for layout)
 *
 * Key metrics:
 *   - Two InputGroup fields (start + end) side-by-side in a flex row
 *   - Blueprint wraps both in a .bp6-control-group div (flex row, align-items: stretch)
 *   - No divider between the two inputs — they are adjacent with no gap (Blueprint: control-group)
 *   - Both inputs have the same height/style as a standard InputGroup (30px medium)
 *   - Popover placement: bottom-start; arrow visible; no inner padding (calendar carries its own)
 *   - The popover contains a DateRangePicker (two-calendar compact layout)
 *   - Focus start → open popover, clicking a start date; then click end date → both filled, close
 *   - Default format: M/d/yyyy (e.g. "1/8/2026" for Jan 8, 2026)
 *   - Error state: intent="danger" on the relevant InputGroup when typed text fails to parse
 *   - Dark mode: Popover handles dark portal wrapper via the `dark` prop
 *
 * Portal + dark pattern (from popover.tsx):
 *   Pass `dark` prop → Popover wraps portal in <div className="dark"> so Tailwind
 *   dark utilities apply inside the portaled popover panel.
 *
 * @see https://blueprintjs.com/docs/#datetime/date-range-input
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { DateRangePicker, type DateRangePickerValue } from "./date-range-picker";
import { InputGroup } from "./input-group";
import { Popover } from "./popover";

export type { DateRangePickerValue as DateRangeInputValue };

// ---------------------------------------------------------------------------
// Formatting helpers (no date-fns dep — use native Date)
// ---------------------------------------------------------------------------

/** Default format: M/d/yyyy — matches Blueprint's default for en-US */
const DEFAULT_FORMAT_DATE = (date: Date): string => {
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const y = date.getFullYear();
    return `${m}/${d}/${y}`;
};

/** Parse M/d/yyyy string → Date. Returns null for empty string, invalid Date for bad input. */
const DEFAULT_PARSE_DATE = (str: string): Date | null => {
    if (!str.trim()) return null;
    const parts = str.trim().split(/[\/\-\.]/);
    if (parts.length === 3) {
        const m = parseInt(parts[0], 10);
        const d = parseInt(parts[1], 10);
        const y = parseInt(parts[2], 10);
        if (!isNaN(m) && !isNaN(d) && !isNaN(y) && y >= 100) {
            const date = new Date(y, m - 1, d);
            if (
                date.getFullYear() === y &&
                date.getMonth() === m - 1 &&
                date.getDate() === d
            ) {
                return date;
            }
        }
    }
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) return parsed;
    return new Date(NaN); // invalid date sentinel
};

function isValidDate(d: Date | null | undefined): d is Date {
    return d != null && !isNaN(d.getTime());
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DateRangeInputProps {
    /**
     * Controlled selected range. Use with `onChange`.
     * Pass `{ start: null, end: null }` to display empty inputs in controlled mode.
     */
    value?: DateRangePickerValue;
    /** Default value for uncontrolled mode. */
    defaultValue?: DateRangePickerValue;
    /**
     * Called when the user selects a date range (from the calendar or typed input).
     * Either boundary may be null (selection in progress).
     */
    onChange?: (newValue: DateRangePickerValue) => void;
    /**
     * Formats a date as a string for display in the input.
     * @default M/d/yyyy (e.g. "1/8/2026")
     */
    formatDate?: (date: Date) => string;
    /**
     * Parses a date string (typed by the user) into a Date.
     * Return null for empty, invalid Date (isNaN) for parse error.
     * @default parses M/d/yyyy
     */
    parseDate?: (str: string) => Date | null;
    /** Minimum selectable date. @default 1 Jan 1900 */
    minDate?: Date;
    /** Maximum selectable date. @default 31 Dec 2100 */
    maxDate?: Date;
    /** Whether to allow a range where start === end (single day). @default false */
    allowSingleDayRange?: boolean;
    /**
     * Whether the two calendars are shown contiguously.
     * When true (default), navigating left also moves right.
     * @default true
     */
    contiguousCalendarMonths?: boolean;
    /**
     * Whether to close the popover when a complete range is selected.
     * @default true
     */
    closeOnSelection?: boolean;
    /** Whether the inputs are non-interactive. @default false */
    disabled?: boolean;
    /** Whether the component fills its container width. @default false */
    fill?: boolean;
    /**
     * Props passed to the start-date InputGroup.
     * `value`, `disabled`, `type`, `size` are reserved.
     */
    startInputProps?: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "disabled" | "type" | "size">;
    /**
     * Props passed to the end-date InputGroup.
     * `value`, `disabled`, `type`, `size` are reserved.
     */
    endInputProps?: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "disabled" | "type" | "size">;
    /**
     * Props passed to the Popover.
     * `open`, `content`, `dark` are reserved.
     */
    popoverProps?: {
        side?: "top" | "right" | "bottom" | "left";
        align?: "start" | "center" | "end";
        sideOffset?: number;
        /** Portal the calendar into this element instead of `document.body` (showcase use). */
        portalContainer?: HTMLElement | null;
    };
    /**
     * Pass the app-level dark state so the portaled popover inherits dark mode.
     * Same pattern as Dialog, DateInput, Select, Suggest.
     */
    dark?: boolean;
    /** Additional className on the root container div. */
    className?: string;
}

// ---------------------------------------------------------------------------
// DateRangeInput
// ---------------------------------------------------------------------------

/**
 * DateRangeInput — two text inputs with a shared popover DateRangePicker.
 *
 * @example
 * ```tsx
 * const [range, setRange] = useState<DateRangePickerValue>({ start: null, end: null });
 *
 * <DateRangeInput
 *   value={range}
 *   onChange={setRange}
 *   dark={dark}
 * />
 * ```
 */
export function DateRangeInput({
    value,
    defaultValue,
    onChange,
    formatDate = DEFAULT_FORMAT_DATE,
    parseDate = DEFAULT_PARSE_DATE,
    minDate = new Date(1900, 0, 1),
    maxDate = new Date(2100, 11, 31),
    allowSingleDayRange = false,
    contiguousCalendarMonths = true,
    closeOnSelection = true,
    disabled = false,
    fill = false,
    startInputProps = {},
    endInputProps = {},
    popoverProps = {},
    dark = false,
    className,
}: DateRangeInputProps) {
    // ---- Controlled / uncontrolled range value ----
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState<DateRangePickerValue>(() => {
        if (isControlled) return value ?? { start: null, end: null };
        return defaultValue ?? { start: null, end: null };
    });

    const currentValue: DateRangePickerValue = isControlled
        ? (value ?? { start: null, end: null })
        : internalValue;

    // Sync internal value when controlled value changes
    useEffect(() => {
        if (isControlled) {
            setInternalValue(value ?? { start: null, end: null });
        }
    }, [isControlled, value]);

    // ---- Popover open state ----
    const [isOpen, setIsOpen] = useState(false);

    // ---- Which input is focused (for managing popover + text state) ----
    type ActiveField = "start" | "end" | null;
    const [activeField, setActiveField] = useState<ActiveField>(null);

    // ---- Input text states ----
    const [startText, setStartText] = useState<string>(() =>
        isValidDate(currentValue.start) ? formatDate(currentValue.start) : "",
    );
    const [endText, setEndText] = useState<string>(() =>
        isValidDate(currentValue.end) ? formatDate(currentValue.end) : "",
    );

    // ---- Error states ----
    const [startError, setStartError] = useState(false);
    const [endError, setEndError] = useState(false);

    // Sync input text when controlled value changes and field is not focused
    useEffect(() => {
        if (activeField !== "start") {
            setStartText(isValidDate(currentValue.start) ? formatDate(currentValue.start) : "");
        }
    }, [currentValue.start, formatDate, activeField]);

    useEffect(() => {
        if (activeField !== "end") {
            setEndText(isValidDate(currentValue.end) ? formatDate(currentValue.end) : "");
        }
    }, [currentValue.end, formatDate, activeField]);

    const startInputRef = useRef<HTMLInputElement>(null);
    const endInputRef = useRef<HTMLInputElement>(null);
    // Wraps both inputs (the popover anchor). Selecting a start date programmatically moves
    // focus to the end input; because the popover is anchored (not triggered), Radix's
    // dismissable layer treats that focus leaving the content as an "outside" interaction
    // and closes the popover. Guarding interactions that land back inside our own inputs
    // keeps the focus-driven flow alive (same pattern as Suggest/MultiSelect). See popover.tsx.
    const rootRef = useRef<HTMLDivElement>(null);
    const handleInteractOutside = useCallback(
        (e: Event & { detail?: { originalEvent?: Event } }) => {
            const target = (e.detail?.originalEvent?.target ?? e.target) as Node | null;
            if (target && rootRef.current?.contains(target)) e.preventDefault();
        },
        [],
    );

    // True when a blur's focus target is still *inside* the widget — the sibling input or
    // the portaled calendar popover. Clicking a calendar day blurs the focused input; if the
    // blur handler then parsed + committed the field, its onChange would race the calendar's
    // own onChange and wipe the in-progress range (each day click just resets `start`). So the
    // blur commit must be skipped while focus stays within the widget; the calendar owns the
    // value during selection.
    const isInternalFocusTarget = useCallback((related: EventTarget | null): boolean => {
        const node = related as HTMLElement | null;
        if (!node) return false;
        if (rootRef.current?.contains(node)) return true; // the sibling input
        return Boolean(node.closest?.('[role="dialog"]')); // inside the calendar popover
    }, []);

    // ---- Calendar range selection ----
    const handleRangeChange = useCallback(
        (newRange: DateRangePickerValue) => {
            if (!isControlled) {
                setInternalValue(newRange);
            }
            onChange?.(newRange);

            // Update input text to reflect new range
            setStartText(isValidDate(newRange.start) ? formatDate(newRange.start) : "");
            setEndText(isValidDate(newRange.end) ? formatDate(newRange.end) : "");
            setStartError(false);
            setEndError(false);

            // If range is complete (both start and end), close and unfocus
            if (closeOnSelection && isValidDate(newRange.start) && isValidDate(newRange.end)) {
                setIsOpen(false);
                setActiveField(null);
            }
            // NOTE: we deliberately do NOT move DOM focus to the end input after the start
            // is picked. Calling endInputRef.focus() here remounts the open calendar
            // mid-interaction (the entering/exiting Presence copy detaches the day buttons),
            // which swallows the very next click — the end date. The popover stays open on
            // the calendar, which is prompt enough; the user clicks the end day directly.
        },
        [closeOnSelection, formatDate, isControlled, onChange],
    );

    // ---- Focus handlers ----
    const handleStartFocus = useCallback(
        (e: React.FocusEvent<HTMLInputElement>) => {
            setActiveField("start");
            setIsOpen(true);
            setStartText(isValidDate(currentValue.start) ? formatDate(currentValue.start) : "");
            startInputProps?.onFocus?.(e);
        },
        [currentValue.start, formatDate, startInputProps],
    );

    const handleEndFocus = useCallback(
        (e: React.FocusEvent<HTMLInputElement>) => {
            setActiveField("end");
            setIsOpen(true);
            setEndText(isValidDate(currentValue.end) ? formatDate(currentValue.end) : "");
            endInputProps?.onFocus?.(e);
        },
        [currentValue.end, formatDate, endInputProps],
    );

    // ---- Blur handlers: parse typed value ----
    const handleStartBlur = useCallback(
        (e: React.FocusEvent<HTMLInputElement>) => {
            // Focus moving into the calendar (clicking a day) or to the sibling input is not a
            // real exit — skip the parse/commit so it doesn't race the calendar's onChange.
            if (isInternalFocusTarget(e.relatedTarget)) return;

            setActiveField((prev) => (prev === "start" ? null : prev));

            const trimmed = startText.trim();
            if (!trimmed) {
                const newValue = { ...currentValue, start: null };
                if (!isControlled) setInternalValue(newValue);
                onChange?.(newValue);
                setStartText("");
                setStartError(false);
            } else {
                const parsed = parseDate(trimmed);
                if (parsed === null) {
                    const newValue = { ...currentValue, start: null };
                    if (!isControlled) setInternalValue(newValue);
                    onChange?.(newValue);
                    setStartText("");
                    setStartError(false);
                } else if (isValidDate(parsed) && parsed >= minDate && parsed <= maxDate) {
                    const newValue = { ...currentValue, start: parsed };
                    if (!isControlled) setInternalValue(newValue);
                    onChange?.(newValue);
                    setStartText(formatDate(parsed));
                    setStartError(false);
                } else {
                    setStartError(true);
                }
            }

            startInputProps?.onBlur?.(e);
        },
        [
            startText,
            currentValue,
            isControlled,
            onChange,
            parseDate,
            minDate,
            maxDate,
            formatDate,
            startInputProps,
            isInternalFocusTarget,
        ],
    );

    const handleEndBlur = useCallback(
        (e: React.FocusEvent<HTMLInputElement>) => {
            if (isInternalFocusTarget(e.relatedTarget)) return;

            setActiveField((prev) => (prev === "end" ? null : prev));

            const trimmed = endText.trim();
            if (!trimmed) {
                const newValue = { ...currentValue, end: null };
                if (!isControlled) setInternalValue(newValue);
                onChange?.(newValue);
                setEndText("");
                setEndError(false);
            } else {
                const parsed = parseDate(trimmed);
                if (parsed === null) {
                    const newValue = { ...currentValue, end: null };
                    if (!isControlled) setInternalValue(newValue);
                    onChange?.(newValue);
                    setEndText("");
                    setEndError(false);
                } else if (isValidDate(parsed) && parsed >= minDate && parsed <= maxDate) {
                    const newValue = { ...currentValue, end: parsed };
                    if (!isControlled) setInternalValue(newValue);
                    onChange?.(newValue);
                    setEndText(formatDate(parsed));
                    setEndError(false);
                } else {
                    setEndError(true);
                }
            }

            endInputProps?.onBlur?.(e);
        },
        [
            endText,
            currentValue,
            isControlled,
            onChange,
            parseDate,
            minDate,
            maxDate,
            formatDate,
            endInputProps,
            isInternalFocusTarget,
        ],
    );

    // ---- Change handlers: live parse while typing ----
    const handleStartChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value;
            setStartText(raw);
            if (!raw.trim()) {
                setStartError(false);
                startInputProps?.onChange?.(e);
                return;
            }
            const parsed = parseDate(raw.trim());
            if (parsed !== null && isValidDate(parsed) && parsed >= minDate && parsed <= maxDate) {
                const newValue = { ...currentValue, start: parsed };
                if (!isControlled) setInternalValue(newValue);
                onChange?.(newValue);
                setStartError(false);
            }
            startInputProps?.onChange?.(e);
        },
        [startInputProps, currentValue, parseDate, minDate, maxDate, isControlled, onChange],
    );

    const handleEndChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value;
            setEndText(raw);
            if (!raw.trim()) {
                setEndError(false);
                endInputProps?.onChange?.(e);
                return;
            }
            const parsed = parseDate(raw.trim());
            if (parsed !== null && isValidDate(parsed) && parsed >= minDate && parsed <= maxDate) {
                const newValue = { ...currentValue, end: parsed };
                if (!isControlled) setInternalValue(newValue);
                onChange?.(newValue);
                setEndError(false);
            }
            endInputProps?.onChange?.(e);
        },
        [endInputProps, currentValue, parseDate, minDate, maxDate, isControlled, onChange],
    );

    // ---- Keyboard handlers ----
    const handleStartKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Escape") {
                setIsOpen(false);
                startInputRef.current?.blur();
            } else if (e.key === "Enter") {
                const parsed = parseDate(startText.trim());
                if (parsed !== null && isValidDate(parsed) && parsed >= minDate && parsed <= maxDate) {
                    const newValue = { ...currentValue, start: parsed };
                    if (!isControlled) setInternalValue(newValue);
                    onChange?.(newValue);
                    setStartText(formatDate(parsed));
                    setStartError(false);
                }
            } else if (e.key === "Tab" && !e.shiftKey) {
                // Tab from start → end (natural tab order handles this, but open the popover)
                setActiveField("end");
            }
            startInputProps?.onKeyDown?.(e);
        },
        [
            startText,
            currentValue,
            parseDate,
            minDate,
            maxDate,
            isControlled,
            onChange,
            formatDate,
            startInputProps,
        ],
    );

    const handleEndKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Escape") {
                setIsOpen(false);
                endInputRef.current?.blur();
            } else if (e.key === "Enter") {
                const parsed = parseDate(endText.trim());
                if (parsed !== null && isValidDate(parsed) && parsed >= minDate && parsed <= maxDate) {
                    const newValue = { ...currentValue, end: parsed };
                    if (!isControlled) setInternalValue(newValue);
                    onChange?.(newValue);
                    setEndText(formatDate(parsed));
                    setEndError(false);
                }
            }
            endInputProps?.onKeyDown?.(e);
        },
        [
            endText,
            currentValue,
            parseDate,
            minDate,
            maxDate,
            isControlled,
            onChange,
            formatDate,
            endInputProps,
        ],
    );

    // ---- Popover open change ----
    const handleOpenChange = useCallback((open: boolean) => {
        setIsOpen(open);
        if (!open) {
            setActiveField(null);
        }
    }, []);

    // ---- Displayed input values ----
    const startDisplay =
        activeField === "start"
            ? startText
            : isValidDate(currentValue.start)
              ? formatDate(currentValue.start)
              : "";
    const endDisplay =
        activeField === "end"
            ? endText
            : isValidDate(currentValue.end)
              ? formatDate(currentValue.end)
              : "";

    // ---- Popover content: the DateRangePicker ----
    const pickerContent = (
        <DateRangePicker
            value={currentValue}
            onChange={handleRangeChange}
            minDate={minDate}
            maxDate={maxDate}
            allowSingleDayRange={allowSingleDayRange}
            contiguousCalendarMonths={contiguousCalendarMonths}
        />
    );

    return (
        <Popover
            open={isOpen && !disabled}
            onOpenChange={handleOpenChange}
            content={pickerContent}
            side={popoverProps.side ?? "bottom"}
            align={popoverProps.align ?? "start"}
            sideOffset={popoverProps.sideOffset ?? 4}
            portalContainer={popoverProps.portalContainer}
            arrow={true}
            minimal={false}
            hasContentPadding={false}
            dark={dark}
            disabled={disabled}
            /* Keep DOM focus on the inputs (the focus-driven anchor pattern); don't let the
               calendar grab focus when the popover opens. Without this the calendar steals
               focus on open, and the start→end focus shift then remounts the calendar
               mid-interaction, dropping the end-date click. */
            autoFocusContent={false}
            /* The two inputs share one popover and open it on focus; the wrapping
               trigger would otherwise toggle the popover back closed on the trailing
               click (the popover only survived while the mouse was held). Use an
               anchor instead so focus-driven open survives. See popover.tsx anchorOnly. */
            anchorOnly
            /* Keep the popover open when start-selection moves focus to the end input. */
            onInteractOutside={handleInteractOutside}
        >
            {/*
             * Blueprint wraps both inputs in a .bp6-control-group div (flex row, align-items:stretch).
             * We replicate this with an inline-flex container — no gap between the inputs
             * (they sit adjacent, Blueprint behavior).
             * Popover.Trigger uses asChild, so it attaches to this div.
             * This means clicking anywhere in the row opens the popover;
             * but individual input focus is handled by the focus handlers above.
             */}
            <div
                ref={rootRef}
                className={cn(
                    "inline-flex flex-row",
                    "items-stretch",
                    fill && "w-full",
                    className,
                )}
            >
                <InputGroup
                    ref={startInputRef}
                    type="text"
                    autoComplete="off"
                    placeholder="M/d/yyyy"
                    value={startDisplay}
                    onChange={handleStartChange}
                    onFocus={handleStartFocus}
                    onBlur={handleStartBlur}
                    onKeyDown={handleStartKeyDown}
                    disabled={disabled}
                    fill={fill}
                    intent={startError ? "danger" : "none"}
                    aria-label="Start date"
                    aria-haspopup="dialog"
                    aria-expanded={isOpen}
                    {...startInputProps}
                />
                <InputGroup
                    ref={endInputRef}
                    type="text"
                    autoComplete="off"
                    placeholder="M/d/yyyy"
                    value={endDisplay}
                    onChange={handleEndChange}
                    onFocus={handleEndFocus}
                    onBlur={handleEndBlur}
                    onKeyDown={handleEndKeyDown}
                    disabled={disabled}
                    fill={fill}
                    intent={endError ? "danger" : "none"}
                    aria-label="End date"
                    aria-haspopup="dialog"
                    aria-expanded={isOpen}
                    {...endInputProps}
                />
            </div>
        </Popover>
    );
}

DateRangeInput.displayName = "DateRangeInput";
