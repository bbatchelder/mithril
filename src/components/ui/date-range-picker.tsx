/**
 * DateRangePicker — pixel-faithful Blueprint v6.15 reimplementation with a clean modern API.
 *
 * Two side-by-side month calendars for selecting a date range (start + end).
 * Built on react-day-picker v10 (range mode) + Blueprint design tokens.
 * Reuses: HTMLSelect, Icon, cn (same patterns as DatePicker).
 *
 * Design spec source:
 *   packages/datetime/src/components/date-range-picker/_date-range-picker.scss
 *   packages/datetime/src/components/date-picker/_date-picker.scss
 *   packages/datetime/src/_common.scss
 *
 * Key metrics (from Blueprint SCSS, $pt-spacing = 4px, $blue3 = #2d72d2):
 *   - Layout: two months side-by-side, gap matches Blueprint's flex display
 *   - Range highlight: rgba($blue3, 0.1) light / rgba($blue3, 0.2) dark
 *   - Endpoints: bg=$blue3 (#2d72d2), color=white, border-radius=4px
 *   - Range start: right border-radius zeroed (square right edge for band continuity)
 *   - Range end: left border-radius zeroed (square left edge for band continuity)
 *   - Range middle: border-radius=0, color=$blue2 (#215db0)
 *   - Outside-month days: hidden (visibility:hidden) — Blueprint hides them in range mode
 *   - Day cell size: 30×30px, same as DatePicker
 *
 * react-day-picker v10 range mode:
 *   - mode="range", selected={from, to}
 *   - modifiers: range_start, range_end, range_middle (via SelectionState enum)
 *   - onSelect receives DateRange {from?, to?}
 *
 * COMPACT layout (critical — same anti-stretch fix as DatePicker):
 *   - NO w-full on month_grid
 *   - inline-block root
 *   - 30px day cells with border-2 border-transparent px-2
 *
 * @see https://blueprintjs.com/docs/#datetime/date-range-picker
 */

import { forwardRef, useCallback, useState } from "react";
import { DayPicker, useDayPicker } from "react-day-picker";
import type { DateRange, MonthCaptionProps } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Icon } from "./icon";
import { HTMLSelect } from "./html-select";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DateRangePickerValue {
    start: Date | null;
    end: Date | null;
}

export interface DateRangePickerProps {
    /** Controlled selected range. Use with `onChange`. */
    value?: DateRangePickerValue;
    /** Default value for uncontrolled usage. */
    defaultValue?: DateRangePickerValue;
    /**
     * Called when the user selects or updates the range.
     * Receives the new range; either boundary may be null (selection in progress).
     */
    onChange?: (newValue: DateRangePickerValue) => void;
    /** Minimum selectable date. @default 1 Jan 1900 */
    minDate?: Date;
    /** Maximum selectable date. @default 31 Dec 2100 */
    maxDate?: Date;
    /**
     * Whether the two months are shown contiguously (left+1 = right).
     * When true (default), navigating the left also moves the right.
     * @default true
     */
    contiguousCalendarMonths?: boolean;
    /**
     * When true, show only a single month calendar.
     * @default false
     */
    singleMonthOnly?: boolean;
    /**
     * Show TimePicker inputs below the calendars.
     * Pass "minute" | "second" | "millisecond" to enable.
     * @default undefined (no time picker)
     * @stub TODO: implement TimePicker integration
     */
    timePrecision?: "minute" | "second" | "millisecond";
    /** Whether to allow a range where start === end (single day). @default false */
    allowSingleDayRange?: boolean;
    /** Disable the entire picker. @default false */
    disabled?: boolean;
    /** Additional className on the root element. */
    className?: string;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_MIN_DATE = new Date(1900, 0, 1);
const DEFAULT_MAX_DATE = new Date(2100, 11, 31);

// ---------------------------------------------------------------------------
// NavButton — reused from DatePicker pattern
// ---------------------------------------------------------------------------

function NavButton({
    direction,
    onClick,
    disabled,
    "data-compare": dc,
}: {
    direction: "prev" | "next";
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    disabled?: boolean;
    "data-compare"?: string;
}) {
    return (
        <button
            type="button"
            onClick={disabled ? undefined : onClick}
            data-compare={dc}
            aria-label={direction === "prev" ? "Previous month" : "Next month"}
            className={cn(
                "inline-flex items-center justify-center",
                "h-[30px] w-[30px] p-0 rounded-bp",
                "bg-transparent border-0",
                "text-foreground",
                disabled
                    ? "cursor-not-allowed text-foreground-disabled"
                    : "cursor-pointer hover:bg-[rgba(143,153,168,0.15)] dark:hover:bg-[rgba(143,153,168,0.15)] active:bg-[rgba(143,153,168,0.3)]",
                "transition-colors duration-100",
            )}
        >
            <Icon
                icon={direction === "prev" ? "chevron-left" : "chevron-right"}
                size={16}
                aria-hidden
            />
        </button>
    );
}

// ---------------------------------------------------------------------------
// Custom MonthCaption for DateRangePicker
// Each calendar has its own caption with nav buttons.
// Left calendar: [<] [Month ▼] [Year ▼]   (prev on left, no next)
// Right calendar:       [Month ▼] [Year ▼] [>]   (no prev, next on right)
// Both: [Month ▼] [Year ▼] [<] [>] for single-month mode
// ---------------------------------------------------------------------------

function DateRangePickerCaption({
    calendarMonth,
    displayIndex,
    totalMonths,
}: MonthCaptionProps & { totalMonths?: number }) {
    const {
        nextMonth,
        previousMonth,
        goToMonth,
        classNames,
        formatters: { formatMonthDropdown },
        labels: { labelMonthDropdown, labelYearDropdown },
    } = useDayPicker();

    const handlePrev = useCallback(() => {
        if (previousMonth) goToMonth(previousMonth);
    }, [previousMonth, goToMonth]);

    const handleNext = useCallback(() => {
        if (nextMonth) goToMonth(nextMonth);
    }, [nextMonth, goToMonth]);

    // Month dropdown options (0-11)
    const monthOptions = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(calendarMonth.date.getFullYear(), i, 1);
        return { value: i, label: formatMonthDropdown(d) };
    });

    // Year dropdown options
    const minYear = 1900;
    const maxYear = 2100;
    const yearOptions = Array.from(
        { length: maxYear - minYear + 1 },
        (_, i) => ({ value: minYear + i, label: String(minYear + i) }),
    );

    const currentMonth = calendarMonth.date.getMonth();
    const currentYear = calendarMonth.date.getFullYear();

    const isLeft = displayIndex === 0;
    const isSingleMonth = totalMonths === 1;

    return (
        <div
            className={cn(
                "flex flex-row items-center",
                "border-b border-[rgba(17,20,24,0.15)] dark:border-[rgba(255,255,255,0.2)]",
                "pb-1",
                // Blueprint contiguous layout is symmetric — the nav button hugs the OUTER
                // edge of each calendar, dropdowns inset on the inner edge:
                //   left caption:  [prev][month][year] packed left  → justify-start
                //   right caption: [month][year][next] packed right → justify-end
                // (DOM order already puts prev first in the left branch and next last in the
                // right branch, so plain flex-row + start/end matches; no row-reverse.)
                // Single month: [dropdowns] … [prev][next] → justify-between.
                isSingleMonth ? "justify-between" : isLeft ? "justify-start" : "justify-end",
                classNames.month_caption,
            )}
        >
            {/* Nav buttons group */}
            {isSingleMonth ? (
                /* Single month: both buttons on right */
                <>
                    <div className="flex flex-row items-center gap-1">
                        <HTMLSelect
                            minimal
                            value={currentMonth}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                const newMonth = new Date(calendarMonth.date);
                                newMonth.setMonth(Number(e.target.value));
                                goToMonth(newMonth);
                            }}
                            aria-label={labelMonthDropdown()}
                            className="[&_select]:font-semibold [&_select]:pl-1 [&_select]:pr-4"
                        >
                            {monthOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </HTMLSelect>
                        <HTMLSelect
                            minimal
                            value={currentYear}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                const newMonth = new Date(calendarMonth.date);
                                newMonth.setFullYear(Number(e.target.value));
                                goToMonth(newMonth);
                            }}
                            aria-label={labelYearDropdown({})}
                            className="[&_select]:font-semibold [&_select]:pl-1 [&_select]:pr-4"
                        >
                            {yearOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </HTMLSelect>
                    </div>
                    <div className="flex flex-row items-center">
                        <NavButton
                            direction="prev"
                            onClick={handlePrev}
                            disabled={!previousMonth}
                            data-compare="drp-nav-prev"
                        />
                        <NavButton
                            direction="next"
                            onClick={handleNext}
                            disabled={!nextMonth}
                            data-compare="drp-nav-next"
                        />
                    </div>
                </>
            ) : isLeft ? (
                /* Left calendar (flex-row-reverse): dropdowns on right, prev on left */
                <>
                    {/* This appears on the LEFT due to flex-row-reverse */}
                    <NavButton
                        direction="prev"
                        onClick={handlePrev}
                        disabled={!previousMonth}
                        data-compare="drp-nav-prev"
                    />
                    {/* Dropdowns — appear on the RIGHT in row-reverse */}
                    <div className="flex flex-row items-center gap-1">
                        <HTMLSelect
                            minimal
                            value={currentMonth}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                const newMonth = new Date(calendarMonth.date);
                                newMonth.setMonth(Number(e.target.value));
                                goToMonth(newMonth);
                            }}
                            aria-label={labelMonthDropdown()}
                            className="[&_select]:font-semibold [&_select]:pl-1 [&_select]:pr-4"
                        >
                            {monthOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </HTMLSelect>
                        <HTMLSelect
                            minimal
                            value={currentYear}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                const newMonth = new Date(calendarMonth.date);
                                newMonth.setFullYear(Number(e.target.value));
                                goToMonth(newMonth);
                            }}
                            aria-label={labelYearDropdown({})}
                            className="[&_select]:font-semibold [&_select]:pl-1 [&_select]:pr-4"
                        >
                            {yearOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </HTMLSelect>
                    </div>
                </>
            ) : (
                /* Right calendar: dropdowns on left, next on right */
                <>
                    <div className="flex flex-row items-center gap-1">
                        <HTMLSelect
                            minimal
                            value={currentMonth}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                const newMonth = new Date(calendarMonth.date);
                                newMonth.setMonth(Number(e.target.value));
                                goToMonth(newMonth);
                            }}
                            aria-label={labelMonthDropdown()}
                            className="[&_select]:font-semibold [&_select]:pl-1 [&_select]:pr-4"
                        >
                            {monthOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </HTMLSelect>
                        <HTMLSelect
                            minimal
                            value={currentYear}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                const newMonth = new Date(calendarMonth.date);
                                newMonth.setFullYear(Number(e.target.value));
                                goToMonth(newMonth);
                            }}
                            aria-label={labelYearDropdown({})}
                            className="[&_select]:font-semibold [&_select]:pl-1 [&_select]:pr-4"
                        >
                            {yearOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </HTMLSelect>
                    </div>
                    <NavButton
                        direction="next"
                        onClick={handleNext}
                        disabled={!nextMonth}
                        data-compare="drp-nav-next"
                    />
                </>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// DateRangePicker
// ---------------------------------------------------------------------------

export const DateRangePicker = forwardRef<HTMLDivElement, DateRangePickerProps>(
    function DateRangePicker(
        {
            value,
            defaultValue,
            onChange,
            minDate = DEFAULT_MIN_DATE,
            maxDate = DEFAULT_MAX_DATE,
            contiguousCalendarMonths = true,
            singleMonthOnly = false,
            timePrecision: _timePrecision, // stub — TODO
            allowSingleDayRange = false,
            disabled = false,
            className,
        },
        ref,
    ) {
        const numMonths = singleMonthOnly ? 1 : 2;

        // ---- Controlled/uncontrolled value ----
        const isControlled = value !== undefined;
        const [internalValue, setInternalValue] = useState<DateRangePickerValue>(() => {
            if (value !== undefined) return value;
            if (defaultValue !== undefined) return defaultValue;
            return { start: null, end: null };
        });

        const currentValue: DateRangePickerValue = isControlled ? value : internalValue;

        // ---- Display month (left calendar) ----
        const [displayMonth, setDisplayMonth] = useState<Date>(() => {
            const start = isControlled ? value.start : defaultValue?.start ?? null;
            if (start != null) return new Date(start.getFullYear(), start.getMonth(), 1);
            const today = new Date();
            if (today >= minDate && today <= maxDate) return new Date(today.getFullYear(), today.getMonth(), 1);
            return new Date(minDate.getFullYear(), minDate.getMonth(), 1);
        });

        // ---- Range selection handler ----
        const handleSelect = useCallback(
            (range: DateRange | undefined) => {
                if (!range) {
                    const newValue = { start: null, end: null };
                    if (!isControlled) setInternalValue(newValue);
                    onChange?.(newValue);
                    return;
                }

                const from = range.from ?? null;
                let to = range.to ?? null;

                // If same-day range is not allowed and from === to, clear end
                if (!allowSingleDayRange && from != null && to != null) {
                    if (
                        from.getFullYear() === to.getFullYear() &&
                        from.getMonth() === to.getMonth() &&
                        from.getDate() === to.getDate()
                    ) {
                        to = null;
                    }
                }

                const newValue: DateRangePickerValue = { start: from, end: to };
                if (!isControlled) setInternalValue(newValue);
                onChange?.(newValue);
            },
            [allowSingleDayRange, isControlled, onChange],
        );

        // ---- Month navigation handler ----
        const handleMonthChange = useCallback((newMonth: Date) => {
            setDisplayMonth(new Date(newMonth.getFullYear(), newMonth.getMonth(), 1));
        }, []);

        // ---- Weekday name formatter ----
        const formatWeekdayName = useCallback((date: Date) => {
            return date.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2);
        }, []);

        // Convert internal value to react-day-picker DateRange format
        const rdpRange: DateRange | undefined =
            currentValue.start == null && currentValue.end == null
                ? undefined
                : { from: currentValue.start ?? undefined, to: currentValue.end ?? undefined };

        return (
            <div
                ref={ref}
                className={cn(
                    // Blueprint .bp6-datepicker.bp6-daterangepicker:
                    //   display:flex, background:white (light) / dark-gray-3 (dark)
                    //   border-radius:4px, padding:4px, user-select:none
                    "inline-flex flex-col",
                    "rounded-bp",
                    "bg-white dark:bg-dark-gray-3",
                    "p-1",
                    "relative select-none",
                    disabled && "opacity-50 pointer-events-none",
                    className,
                )}
            >
                <DayPicker
                    mode="range"
                    selected={rdpRange}
                    onSelect={handleSelect}
                    month={displayMonth}
                    onMonthChange={handleMonthChange}
                    numberOfMonths={numMonths}
                    // In contiguous mode, navigation moves both months together
                    pagedNavigation={contiguousCalendarMonths && numMonths > 1}
                    startMonth={minDate}
                    endMonth={maxDate}
                    // Outside days are hidden in range picker (Blueprint behavior)
                    showOutsideDays={false}
                    captionLayout="label"
                    hideNavigation
                    formatters={{
                        formatWeekdayName,
                    }}
                    classNames={{
                        // CRITICAL: inline-block on root prevents flex-stretch (compact fix)
                        root: "rdp-analyst-range inline-block",
                        months: "flex flex-row gap-4",
                        month: "flex flex-col mx-1",
                        month_caption: "",
                        // Pin each grid to Blueprint's fixed 210px (7 × 30px) so the table
                        // doesn't stretch to the caption width and spread the columns.
                        month_grid: "border-collapse w-[210px] table-fixed",
                        weekdays: "",
                        weekday: cn(
                            "text-center text-body font-semibold text-foreground",
                            "w-[30px] h-[30px] px-0 pb-0 pt-1",
                        ),
                        weeks: "",
                        week: "",
                        day: "text-center align-middle",
                        day_button: cn(
                            "w-[30px] h-[30px] min-w-[30px] rounded-bp",
                            "inline-flex items-center justify-center",
                            "text-body font-normal cursor-pointer",
                            "border-2 border-transparent bg-transparent",
                            "px-2 py-0 m-0",
                            "text-foreground",
                            "transition-colors duration-100",
                        ),
                        outside: "opacity-100",
                        today: "",
                        selected: "",
                        disabled: "",
                        hidden: "invisible",
                        caption_label: "sr-only",
                        nav: "",
                        button_next: "",
                        button_previous: "",
                        dropdowns: "",
                        dropdown: "",
                        dropdown_root: "",
                        months_dropdown: "",
                        years_dropdown: "",
                        chevron: "",
                        range_start: "",
                        range_end: "",
                        range_middle: "",
                    }}
                    components={{
                        MonthCaption: (props) => (
                            <DateRangePickerCaption {...props} totalMonths={numMonths} />
                        ),
                        // Custom DayButton to apply range-aware styles
                        DayButton: ({ day, modifiers, className: _cls, ...rest }) => {
                            const isRangeStart = modifiers.range_start;
                            const isRangeEnd = modifiers.range_end;
                            const isRangeMiddle = modifiers.range_middle;
                            const isEndpoint = isRangeStart || isRangeEnd;
                            const isOutside = modifiers.outside;
                            const isDisabled = modifiers.disabled;
                            const isToday = modifiers.today;

                            // Tag strategy for data-compare:
                            // drp-day         → a normal day (Jan 4, 2026 in left calendar)
                            // drp-day-range   → an in-range/between day (Jan 10, stable)
                            // drp-day-endpoint → the start day (Jan 8) or end day (Jan 20)
                            const dayNum = day.date.getDate();
                            const isNormalDayToTag =
                                !isEndpoint && !isRangeMiddle && !isOutside && !isToday && !isDisabled &&
                                dayNum === 4;
                            const isRangeDayToTag = isRangeMiddle && dayNum === 10;
                            const isEndpointToTag = isEndpoint && (dayNum === 8 || dayNum === 20);

                            let dataCompare: string | undefined;
                            if (isEndpointToTag) dataCompare = "drp-day-endpoint";
                            else if (isRangeDayToTag) dataCompare = "drp-day-range";
                            else if (isNormalDayToTag) dataCompare = "drp-day";

                            return (
                                <button
                                    {...rest}
                                    data-compare={dataCompare}
                                    className={cn(
                                        // Base: 30×30 box model matching Blueprint
                                        "w-[30px] h-[30px] min-w-[30px]",
                                        "[border-radius:4px]",
                                        "inline-flex items-center justify-center",
                                        "text-body font-normal",
                                        "border-2 border-transparent",
                                        "px-2 py-0 m-0",
                                        "transition-colors duration-100",

                                        // Endpoints (range_start / range_end) — filled blue like selected day
                                        isEndpoint && "bg-blue-3 text-white cursor-pointer",
                                        isEndpoint && "hover:bg-blue-2",
                                        isEndpoint && "active:bg-blue-1",
                                        // Start: square right edge (continues into range band)
                                        isRangeStart && !isRangeEnd && "[border-top-right-radius:0px] [border-bottom-right-radius:0px]",
                                        // End: square left edge (continues from range band)
                                        isRangeEnd && !isRangeStart && "[border-top-left-radius:0px] [border-bottom-left-radius:0px]",

                                        // Range middle — light blue background band, no border-radius
                                        // Light: rgba($blue3, 0.1), color=$blue2
                                        // Dark: rgba($blue3, 0.2), color=$light-gray5 (foreground)
                                        isRangeMiddle && "bg-[rgba(45,114,210,0.1)] dark:bg-[rgba(45,114,210,0.2)]",
                                        isRangeMiddle && "text-blue-2 dark:text-foreground",
                                        isRangeMiddle && "[border-radius:0px]",
                                        isRangeMiddle && "cursor-pointer",
                                        isRangeMiddle && "hover:bg-[rgba(45,114,210,0.2)] dark:hover:bg-[rgba(45,114,210,0.4)]",

                                        // Outside month: hidden (Blueprint hides these in range mode)
                                        isOutside && "invisible",

                                        // Normal day (not endpoint, not range, not outside)
                                        !isEndpoint && !isRangeMiddle && !isOutside && !isDisabled &&
                                            "cursor-pointer text-foreground bg-transparent",
                                        !isEndpoint && !isRangeMiddle && !isOutside && !isDisabled &&
                                            "hover:bg-[rgba(143,153,168,0.15)] dark:hover:bg-[rgba(143,153,168,0.15)]",
                                        !isEndpoint && !isRangeMiddle && !isOutside && !isDisabled &&
                                            "hover:text-foreground dark:hover:text-white",
                                        !isEndpoint && !isRangeMiddle && !isOutside && !isDisabled &&
                                            "active:bg-[rgba(143,153,168,0.3)]",

                                        // Disabled
                                        isDisabled && "cursor-not-allowed text-foreground-disabled bg-transparent hover:bg-transparent",

                                        // Today: normal font-weight (Blueprint overrides rdp bold)
                                        isToday && "font-normal",
                                    )}
                                />
                            );
                        },
                        // Weekday header — same as DatePicker
                        Weekday: ({ children, className: _cls, ...wdRest }) => (
                            <th
                                {...wdRest}
                                className={cn(
                                    "text-center text-body font-semibold text-foreground",
                                    "w-[30px] h-[30px] px-0 pb-0 pt-1",
                                )}
                            >
                                {children}
                            </th>
                        ),
                    }}
                />
            </div>
        );
    },
);
