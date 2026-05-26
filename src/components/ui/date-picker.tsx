/**
 * DatePicker — pixel-faithful Blueprint v6.15 reimplementation with a clean modern API.
 *
 * Built on react-day-picker v10 (calendar engine) + Blueprint design tokens.
 * Reuses: TimePicker, HTMLSelect, Icon, cn.
 *
 * Design spec source:
 *   packages/datetime/src/components/date-picker/_date-picker.scss
 *   packages/datetime/src/components/date-picker/_date-picker-caption.scss
 *   packages/datetime/src/common/_common.scss (datepicker variables)
 *   packages/datetime/src/common/_react-day-picker-overrides.scss
 *
 * Key metrics (from Blueprint SCSS, $pt-spacing = 4px):
 *   - Datepicker bg: white (light) / dark-gray-3 #2f343c (dark)
 *   - Padding: 4px ($datepicker-padding = $pt-spacing)
 *   - Day cell size: 30px ($datepicker-day-size = 7.5 * 4px)
 *   - Cell border-radius: 4px ($pt-border-radius)
 *   - Selected day: bg=$blue3 (#2d72d2), border-radius=4px, color=white
 *   - Hover day: bg=rgba($gray3, 0.15) (#8f99a8 @ 15%)
 *   - Outside-month day: color=$pt-text-color-disabled
 *   - Today: overrides rdp's bold font-weight back to 400 (normal)
 *   - Caption: [prev-btn] [dropdowns] [next-btn] all in one flex-row
 *     bordered-bottom with padding-bottom=$datepicker-padding
 *     height = $datepicker-header-height = 10*4 = 40px
 *   - Weekday header: font-weight=600, padding-top=4px
 *
 * react-day-picker v10 API notes:
 *   - fromDate/toDate → startMonth/endMonth
 *   - captionLayout="dropdown-buttons" → captionLayout="dropdown"
 *   - navLayout="around" puts PreviousMonthButton+NextMonthButton flanking MonthCaption
 *   - ClassNames keys are string literals matching UI enum values
 *   - We override MonthCaption (useDayPicker hook) to include nav buttons in one row
 *
 * @see https://blueprintjs.com/docs/#datetime/date-picker
 */

import { forwardRef, useCallback, useState } from "react";
import { DayPicker, useDayPicker } from "react-day-picker";
import type { Modifiers, MonthCaptionProps } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Icon } from "./icon";
import { HTMLSelect } from "./html-select";
import { TimePicker, type TimePrecision } from "./time-picker";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DatePickerProps {
    /** Controlled selected value. Use with `onChange`. */
    value?: Date | null;
    /** Default value for uncontrolled usage. */
    defaultValue?: Date | null;
    /**
     * Called when the user selects a date (or clears with `canClearSelection`).
     * Receives the new Date, or null if cleared.
     */
    onChange?: (newValue: Date | null) => void;
    /** Initial month to display. Overrides value/defaultValue for initial display. */
    initialMonth?: Date;
    /** Controlled: the currently displayed month. Use with `onMonthChange`. */
    month?: Date;
    /** Called when the displayed month changes. */
    onMonthChange?: (newMonth: Date) => void;
    /** Minimum selectable date. @default 1 Jan 1900 */
    minDate?: Date;
    /** Maximum selectable date. @default 31 Dec 2100 */
    maxDate?: Date;
    /** Whether clicking a selected day deselects it. @default true */
    canClearSelection?: boolean;
    /** Show days from adjacent months in the grid. @default true */
    showOutsideDays?: boolean;
    /**
     * When true, draw a border around today's date cell.
     * @default false
     */
    highlightCurrentDay?: boolean;
    /**
     * Show a TimePicker below the calendar.
     * Pass a precision string to enable: "minute" | "second" | "millisecond"
     */
    timePrecision?: TimePrecision;
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
// NavButton sub-component
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
                // Blueprint: .bp6-button.bp6-minimal
                // min-height=30px ($pt-button-height=7.5*4), min-width=30px
                // padding: 5px 10px → but Blueprint minimal icon-only buttons show 8px px
                // From computed diff: paddingLeft=8px, paddingRight=8px, minWidth=30px
                "inline-flex items-center justify-center",
                "h-[30px] min-w-[30px] px-2 py-0 rounded-bp",
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
// Custom MonthCaption — renders [prev] [dropdowns] [next] in one row
// Uses useDayPicker() for nav access (must be called inside DayPicker context)
// ---------------------------------------------------------------------------

function DatePickerCaption({ calendarMonth, displayIndex }: MonthCaptionProps) {
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

    // Year dropdown options (minDate.year .. maxDate.year)
    const minYear = 1900;
    const maxYear = 2100;
    const yearOptions = Array.from(
        { length: maxYear - minYear + 1 },
        (_, i) => ({ value: minYear + i, label: String(minYear + i) }),
    );

    const currentMonth = calendarMonth.date.getMonth();
    const currentYear = calendarMonth.date.getFullYear();

    return (
        <div
            className={cn(
                // Blueprint .rdp-caption (rdp layout):
                //   display:flex, flex-direction:row, justify-content:space-between
                //   align-items:center
                //   border-bottom: solid 1px $pt-divider-black (rgba(17,20,24,0.15) light)
                //   padding-bottom: $datepicker-padding (4px)
                //   height fits within $datepicker-header-height (40px)
                "flex flex-row items-center justify-between",
                "border-b border-[rgba(17,20,24,0.15)] dark:border-[rgba(255,255,255,0.2)]",
                "pb-1",
                classNames.month_caption,
            )}
        >
            {/* Dropdowns group: [Month ▼] [Year ▼] — Blueprint puts these on the LEFT */}
            <div className="flex flex-row items-center gap-1">
                {/* Month select */}
                <HTMLSelect
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
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </HTMLSelect>

                {/* Year select */}
                <HTMLSelect
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
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </HTMLSelect>
            </div>

            {/* Nav buttons: [<] [>] — Blueprint puts these on the RIGHT */}
            <div className="flex flex-row items-center">
                <NavButton
                    direction="prev"
                    onClick={handlePrev}
                    disabled={!previousMonth}
                    data-compare={displayIndex === 0 ? "date-picker-nav" : undefined}
                />
                <NavButton
                    direction="next"
                    onClick={handleNext}
                    disabled={!nextMonth}
                />
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// DatePicker
// ---------------------------------------------------------------------------

export const DatePicker = forwardRef<HTMLDivElement, DatePickerProps>(function DatePicker(
    {
        value,
        defaultValue,
        onChange,
        initialMonth,
        month: monthProp,
        onMonthChange,
        minDate = DEFAULT_MIN_DATE,
        maxDate = DEFAULT_MAX_DATE,
        canClearSelection = true,
        showOutsideDays = true,
        highlightCurrentDay = false,
        timePrecision,
        disabled = false,
        className,
    },
    ref,
) {
    // ---- Controlled/uncontrolled value ----
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState<Date | null>(() => {
        if (value !== undefined) return value ?? null;
        if (defaultValue !== undefined) return defaultValue ?? null;
        return null;
    });

    const currentValue: Date | null = isControlled ? (value ?? null) : internalValue;

    // ---- Displayed month (uncontrolled) ----
    const [internalMonth, setInternalMonth] = useState<Date>(() => {
        if (monthProp !== undefined) return monthProp;
        if (initialMonth != null) return initialMonth;
        if (currentValue != null) return currentValue;
        const today = new Date();
        if (today >= minDate && today <= maxDate) return today;
        return minDate;
    });

    const displayMonth: Date = monthProp !== undefined ? monthProp : internalMonth;

    const handleMonthChange = useCallback(
        (newMonth: Date) => {
            if (monthProp === undefined) setInternalMonth(newMonth);
            onMonthChange?.(newMonth);
        },
        [monthProp, onMonthChange],
    );

    // ---- Day selection ----
    const handleSelect = useCallback(
        (selected: Date | undefined, _triggerDate: Date, modifiers: Modifiers) => {
            if (modifiers.disabled) return;

            if (selected === undefined) {
                // User clicked the already-selected day
                if (canClearSelection) {
                    if (!isControlled) setInternalValue(null);
                    onChange?.(null);
                }
                return;
            }

            // Preserve time portion from current value
            const newDate = new Date(selected);
            if (currentValue != null) {
                newDate.setHours(
                    currentValue.getHours(),
                    currentValue.getMinutes(),
                    currentValue.getSeconds(),
                    currentValue.getMilliseconds(),
                );
            }

            if (!isControlled) {
                setInternalValue(newDate);
                // Navigate to selected month if it differs from display month
                if (monthProp === undefined) {
                    setInternalMonth(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
                }
            }
            onChange?.(newDate);
        },
        [canClearSelection, currentValue, isControlled, monthProp, onChange],
    );

    // ---- Time picker handler ----
    const handleTimeChange = useCallback(
        (newTime: Date) => {
            const base = currentValue ?? new Date();
            const merged = new Date(base);
            merged.setHours(
                newTime.getHours(),
                newTime.getMinutes(),
                newTime.getSeconds(),
                newTime.getMilliseconds(),
            );
            if (!isControlled) setInternalValue(merged);
            onChange?.(merged);
        },
        [currentValue, isControlled, onChange],
    );

    // ---- Weekday name formatter ---- Blueprint uses 2-char narrow (Su Mo Tu etc)
    const formatWeekdayName = useCallback((date: Date) => {
        // Returns "Su", "Mo", "Tu", etc — 2-letter from short name
        return date.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2);
    }, []);

    return (
        <div
            ref={ref}
            className={cn(
                // Blueprint .bp6-datepicker:
                //   background: white (light) / dark-gray-3 (dark)
                //   border-radius: 4px ($pt-border-radius)
                //   display: flex, padding: 4px, position: relative, user-select: none
                "inline-flex flex-col",
                "rounded-bp",
                "bg-white dark:bg-dark-gray-3",
                "p-1",
                "relative select-none",
                disabled && "opacity-50 pointer-events-none",
                className,
            )}
        >
            {/* .bp6-datepicker-content: flex col, items-center, gap-1 (4px) */}
            <div className="flex flex-col items-center gap-1">
                <DayPicker
                    mode="single"
                    selected={currentValue ?? undefined}
                    onSelect={handleSelect}
                    month={displayMonth}
                    onMonthChange={handleMonthChange}
                    startMonth={minDate}
                    endMonth={maxDate}
                    showOutsideDays={showOutsideDays}
                    // Use "label" layout — our custom MonthCaption renders dropdowns directly
                    // (bypasses rdp's captionLayout="dropdown" so we control the exact layout)
                    captionLayout="label"
                    hideNavigation
                    formatters={{
                        formatWeekdayName,
                    }}
                    classNames={{
                        root: "rdp-analyst inline-block",
                        months: "flex flex-col",
                        month: "flex flex-col mx-1",
                        month_caption: "",
                        // Blueprint: table is NOT w-full — it is content-sized (inline-block rdp).
                        // Setting w-auto prevents the table from stretching to its container,
                        // which was causing spread-out columns. Blueprint's min-width = 210px
                        // (7 columns × 30px) is achieved naturally by the 30px day cells.
                        month_grid: "border-collapse",
                        weekdays: "",
                        weekday: cn(
                            // Blueprint .rdp-head_cell: font-weight:600, padding-top:4px
                            // color inherits parent (normal text, NOT muted)
                            "text-center text-body font-semibold text-foreground",
                            "w-[30px] h-[30px] pt-1 p-0",
                        ),
                        weeks: "",
                        week: "",
                        // day is the <td> cell wrapper — let it be compact, no padding
                        day: "text-center align-middle",
                        day_button: cn(
                            // Base: 30×30, rounded-4px, transparent bg
                            // Blueprint day button: min-width 30px + 8px px + 2px transparent border
                            "w-[30px] h-[30px] min-w-[30px] rounded-bp",
                            "inline-flex items-center justify-center",
                            "text-body font-normal cursor-pointer",
                            // 2px transparent border (matches Blueprint .bp6-button computed style)
                            "border-2 border-transparent bg-transparent",
                            // 8px horizontal padding
                            "px-2 py-0 m-0",
                            "text-foreground",
                            "transition-colors duration-100",
                            "hover:bg-[rgba(143,153,168,0.15)] dark:hover:bg-[rgba(143,153,168,0.15)] hover:text-foreground dark:hover:text-white",
                            "active:bg-[rgba(143,153,168,0.3)]",
                            "disabled:cursor-not-allowed disabled:text-foreground-disabled disabled:bg-transparent disabled:hover:bg-transparent",
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
                    }}
                    components={{
                        MonthCaption: DatePickerCaption,
                        // Override DayButton to apply selected styles and data-compare tags.
                        // We tag:
                        //   date-picker-day-selected → the selected day (Jan 15)
                        //   date-picker-day           → a stable normal day (Jan 4, 2026)
                        //                               chosen because it won't be today, outside, or selected
                        DayButton: ({ day, modifiers, className: _cls, ...rest }) => {
                            const isSelected = modifiers.selected;
                            const isOutside = modifiers.outside;
                            const isDisabled = modifiers.disabled;
                            const isToday = modifiers.today;
                            // Jan 4 = day 4 of the displayed month
                            const isNormalDayToTag =
                                !isSelected && !isOutside && !isToday && !isDisabled &&
                                day.date.getDate() === 4;
                            return (
                                <button
                                    {...rest}
                                    data-compare={
                                        isSelected
                                            ? "date-picker-day-selected"
                                            : isNormalDayToTag
                                              ? "date-picker-day"
                                              : undefined
                                    }
                                    className={cn(
                                        // Base styles: Blueprint day button box model —
                                        // min-width 30px, height 30px, 8px px, 2px transparent border
                                        "w-[30px] h-[30px] min-w-[30px]",
                                        "[border-radius:4px]",
                                        "inline-flex items-center justify-center",
                                        "text-body font-normal",
                                        // 2px transparent border to match Blueprint computed style
                                        "border-2 border-transparent",
                                        // 8px horizontal padding (px-2), no vertical padding
                                        "px-2 py-0 m-0",
                                        "transition-colors duration-100",
                                        // Non-selected, non-disabled: default state
                                        !isSelected && !isDisabled && "cursor-pointer text-foreground bg-transparent",
                                        !isSelected && !isDisabled && "hover:bg-[rgba(143,153,168,0.15)] dark:hover:bg-[rgba(143,153,168,0.15)] hover:text-foreground dark:hover:text-white",
                                        !isSelected && !isDisabled && "active:bg-[rgba(143,153,168,0.3)]",
                                        // Outside month: disabled-colored text
                                        isOutside && !isSelected && "text-foreground-disabled dark:text-foreground-disabled",
                                        // Today (with highlightCurrentDay): border
                                        isToday && highlightCurrentDay && "border border-[rgba(17,20,24,0.15)] dark:border-[rgba(255,255,255,0.2)]",
                                        // Blueprint: today font-weight is overridden back to 400 (not bold)
                                        isToday && "font-normal",
                                        // Selected: Blueprint $blue3, white text, rounded-4px
                                        isSelected && "bg-blue-3 text-white cursor-pointer",
                                        isSelected && "hover:bg-blue-2",
                                        isSelected && "active:bg-blue-1",
                                        // Disabled
                                        isDisabled && "cursor-not-allowed text-foreground-disabled bg-transparent hover:bg-transparent",
                                    )}
                                />
                            );
                        },
                        // Tag weekday header for data-compare
                        Weekday: ({ children, className: _cls, ...wdRest }) => (
                            <th
                                {...wdRest}
                                data-compare="date-picker-weekday"
                                className={cn(
                                    // Blueprint .rdp-head_cell:
                                    //   font-size: inherit (14px), font-weight: 600
                                    //   padding-top: 4px ($datepicker-padding)
                                    //   text-decoration: none, text-transform: none
                                    //   color: inherits parent = $pt-text-color (NOT muted)
                                    "text-center text-body font-semibold text-foreground",
                                    "w-[30px] h-[30px] pt-1 p-0",
                                )}
                            >
                                {children}
                            </th>
                        ),
                    }}
                />

                {/* TimePicker below calendar (optional) */}
                {timePrecision != null && (
                    <div className="flex flex-col items-center my-1">
                        <TimePicker
                            value={currentValue ?? undefined}
                            onChange={handleTimeChange}
                            precision={timePrecision}
                            disabled={disabled}
                        />
                    </div>
                )}
            </div>
        </div>
    );
});
