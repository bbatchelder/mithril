"use client";

/**
 * TimePicker — pixel-faithful Blueprint v6.15 reimplementation with a clean modern API.
 *
 * Design spec source: packages/datetime/src/components/time-picker/_time-picker.scss
 *
 * Key metrics (from Blueprint SCSS, $pt-spacing = 4px):
 *   - Container:   white-space:nowrap, inline component
 *   - Input row:   h=30px, inner h=28px, bg=white/rgba(black,0.3), shadow=input-shadow, rounded-bp
 *   - Divider:     w=8px, text-foreground-muted, font-size=16px (body-lg), text-center
 *   - Segment:     w=32px, h=28px, bg=transparent, no border, text-center, color=foreground
 *   - Arrow btn:   w=32px, padding=4px 0, chevron icon, text-foreground-muted with hover
 *   - Arrow gap:   adjacent arrows separated by divider width (8px = w-2)
 *   - AM/PM:       margin-left=4px (ml-1)
 *
 * @see https://blueprintjs.com/docs/#datetime/timepicker
 */

import { forwardRef, useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { Icon } from "./icon";
import { chevronDown, chevronUp } from "./icons";
import { HTMLSelect } from "./html-select";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Precision determines which segments are shown. */
export type TimePrecision = "minute" | "second" | "millisecond";

export interface TimePickerProps {
    /** Controlled value (date portion ignored). Use with `onChange`. */
    value?: Date;
    /** Default value for uncontrolled usage. Ignored if `value` is supplied. */
    defaultValue?: Date;
    /** Called when the time changes. */
    onChange?: (newValue: Date) => void;
    /**
     * Segments shown:
     *   - "minute"      → hour + minute (default)
     *   - "second"      → hour + minute + second
     *   - "millisecond" → hour + minute + second + millisecond
     * @default "minute"
     */
    precision?: TimePrecision;
    /** Show up/down arrow buttons above and below each segment. @default false */
    showArrowButtons?: boolean;
    /** Use 12-hour format with an AM/PM select. @default false */
    useAmPm?: boolean;
    /** Minimum allowed time (inclusive). Blueprint defaults to midnight. */
    minTime?: Date;
    /** Maximum allowed time (inclusive). Blueprint defaults to 23:59:59.999. */
    maxTime?: Date;
    /** Select all text in a segment on focus. @default false */
    selectAllOnFocus?: boolean;
    /** Disable all segments. @default false */
    disabled?: boolean;
    /** Autofocus the hour segment on mount. @default false */
    autoFocus?: boolean;
    /** Additional className on the root element. */
    className?: string;
}

// ---------------------------------------------------------------------------
// Time utilities
// ---------------------------------------------------------------------------

function defaultMinTime(): Date {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
}
function defaultMaxTime(): Date {
    const d = new Date(); d.setHours(23, 59, 59, 999); return d;
}
function cloneDate(d: Date): Date { return new Date(d.getTime()); }

function pad(n: number, width: number): string {
    const s = String(n);
    return s.length >= width ? s : "0".repeat(width - s.length) + s;
}

function to12Hour(h24: number): number {
    const h = h24 % 12; return h === 0 ? 12 : h;
}
function to24Hour(h12: number, isPm: boolean): number {
    if (isPm) return h12 === 12 ? 12 : h12 + 12;
    return h12 === 12 ? 0 : h12;
}

function isSameTime(a: Date, b: Date): boolean {
    return a.getHours() === b.getHours() &&
        a.getMinutes() === b.getMinutes() &&
        a.getSeconds() === b.getSeconds() &&
        a.getMilliseconds() === b.getMilliseconds();
}

function toMs(d: Date): number {
    return d.getHours() * 3600000 + d.getMinutes() * 60000 + d.getSeconds() * 1000 + d.getMilliseconds();
}

function clampTime(date: Date, min: Date, max: Date): Date {
    const t = toMs(date), mn = toMs(min), mx = toMs(max);
    if (t < mn) { const d = cloneDate(date); d.setHours(min.getHours(), min.getMinutes(), min.getSeconds(), min.getMilliseconds()); return d; }
    if (t > mx) { const d = cloneDate(date); d.setHours(max.getHours(), max.getMinutes(), max.getSeconds(), max.getMilliseconds()); return d; }
    return date;
}

function isInRange(date: Date, min: Date, max: Date): boolean {
    const t = toMs(date); return t >= toMs(min) && t <= toMs(max);
}

/** Wrap v within [0, maxVal] with rollover. */
function wrap(v: number, maxVal: number): number {
    if (v < 0) return maxVal; if (v > maxVal) return 0; return v;
}

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

interface TPState {
    hourText: string;
    minuteText: string;
    secondText: string;
    millisecondText: string;
    value: Date;
    isPm: boolean;
}

function stateFromDate(date: Date, useAmPm: boolean, min: Date, max: Date): TPState {
    const c = clampTime(date, min, max);
    const h24 = c.getHours();
    return {
        hourText: useAmPm ? String(to12Hour(h24)) : String(h24),
        minuteText: pad(c.getMinutes(), 2),
        secondText: pad(c.getSeconds(), 2),
        millisecondText: pad(c.getMilliseconds(), 3),
        value: c,
        isPm: h24 >= 12,
    };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ArrowButton({
    direction,
    label,
    onClick,
    disabled,
    "data-compare": dc,
}: {
    direction: "up" | "down";
    label: string;
    onClick: () => void;
    disabled?: boolean;
    "data-compare"?: string;
}) {
    return (
        // Decorative mouse affordance: the same increment/decrement is available from the
        // keyboard via the segment input's ArrowUp/ArrowDown (see keyOf). aria-label on a
        // roleless span is prohibited (axe aria-prohibited-attr), and exposing a click-only,
        // non-focusable control to assistive tech would be misleading — so hide it from the
        // a11y tree and keep `label` only as a mouse-hover title.
        <span
            aria-hidden="true"
            title={label}
            tabIndex={-1}
            onClick={disabled ? undefined : onClick}
            data-compare={dc}
            className={cn(
                // Blueprint: display:inline-block; width:32px (8*4); padding:4px 0; text-align:center
                // Color: $pt-icon-color = text-foreground-muted (gray-1 light / gray-4 dark)
                "inline-block w-8 py-1 text-center text-foreground-muted",
                disabled ? "cursor-not-allowed text-foreground-disabled" : "cursor-pointer hover:text-foreground",
            )}
        >
            <Icon icon={direction === "up" ? chevronUp : chevronDown} size={16} aria-hidden />
        </span>
    );
}

function SegmentInput({
    id,
    ariaLabel,
    value,
    onChange,
    onBlur,
    onKeyDown,
    onFocus,
    disabled,
    autoFocus,
    "data-compare": dc,
}: {
    id: string;
    ariaLabel: string;
    value: string;
    onChange: (t: string) => void;
    onBlur: () => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
    disabled?: boolean;
    autoFocus?: boolean;
    "data-compare"?: string;
}) {
    return (
        // type=number → implicit role=spinbutton; aria-label gives it an accessible name
        // and the value is announced. ArrowUp/Down adjust it (see onKeyDown / keyOf).
        <input
            id={id}
            aria-label={ariaLabel}
            type="number"
            value={value}
            disabled={disabled}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus={autoFocus}
            min={0}
            onChange={(e) => onChange(e.target.value)}
            onFocus={onFocus}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            data-compare={dc}
            className={cn(
                // Blueprint .bp6-timepicker-input:
                //   -moz-appearance: textfield; -webkit-appearance: textfield
                //   background: transparent; border: 0; border-radius: $pt-border-radius
                //   box-shadow: input-transition-shadow (transparent at rest)
                //   color: $pt-text-color; height: 28px (inner); outline: 0; padding: 0
                //   text-align: center; width: 32px ($timepicker-control-width)
                "w-8 h-7 p-0 bg-transparent border-0 outline-none rounded-bp",
                "text-center text-body text-foreground",
                "transition-shadow duration-100 ease-bp",
                "shadow-none focus:shadow-input-focus",
                // Remove spinners
                "[appearance:textfield]",
                "[&::-webkit-outer-spin-button]:appearance-none",
                "[&::-webkit-inner-spin-button]:appearance-none",
                disabled && "cursor-not-allowed text-foreground-disabled",
            )}
        />
    );
}

function Divider({
    text = ":",
    disabled,
    "data-compare": dc,
}: {
    text?: string;
    disabled?: boolean;
    "data-compare"?: string;
}) {
    return (
        <span
            data-compare={dc}
            className={cn(
                // Blueprint .bp6-timepicker-divider-text:
                //   color: $pt-text-color-muted; display: inline-block; font-size: 16px
                //   text-align: center; width: 8px ($timepicker-divider-width = 2*4)
                // The input-row sets line-height:28px which causes inline-block dividers
                // to be 28px tall. We set h-7 explicitly to match.
                "inline-block w-2 h-7 text-center text-body-lg text-foreground-muted",
                disabled && "text-foreground-disabled",
            )}
        >
            {text}
        </span>
    );
}

// Spacer used in arrow rows to align with dividers
function ArrowSpacer() {
    return <span className="inline-block w-2" aria-hidden />;
}

// ---------------------------------------------------------------------------
// TimePicker
// ---------------------------------------------------------------------------

export const TimePicker = forwardRef<HTMLDivElement, TimePickerProps>(function TimePicker(
    {
        value: valueProp,
        defaultValue,
        onChange,
        precision = "minute",
        showArrowButtons = false,
        useAmPm = false,
        minTime: minTimeProp,
        maxTime: maxTimeProp,
        selectAllOnFocus = false,
        disabled = false,
        autoFocus = false,
        className,
    },
    ref,
) {
    // Resolved bounds
    const minTime = minTimeProp ?? defaultMinTime();
    const maxTime = maxTimeProp ?? defaultMaxTime();

    // Initialize state once (not on every render)
    const [state, setState] = useState<TPState>(() => {
        const init = valueProp ?? defaultValue ?? minTime;
        return stateFromDate(init, useAmPm, minTime, maxTime);
    });

    // Track refs to detect changes for the controlled-value sync effect
    const prevValueRef = useRef(valueProp);
    const prevMinRef = useRef(minTimeProp);
    const prevMaxRef = useRef(maxTimeProp);

    useEffect(() => {
        const valueChanged = valueProp !== prevValueRef.current;
        const boundsChanged = minTimeProp !== prevMinRef.current || maxTimeProp !== prevMaxRef.current;
        prevValueRef.current = valueProp;
        prevMinRef.current = minTimeProp;
        prevMaxRef.current = maxTimeProp;

        if (boundsChanged || (valueProp != null && valueChanged)) {
            setState(stateFromDate(valueProp ?? state.value, useAmPm, minTime, maxTime));
        }
        // state.value intentionally excluded from deps — we only react to prop changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [valueProp, minTimeProp, maxTimeProp, useAmPm]);

    const showSeconds = precision === "second" || precision === "millisecond";
    const showMs = precision === "millisecond";

    // -----------------------------------------------------------------------
    // Commit a computed new Date value (after shift or blur)
    // -----------------------------------------------------------------------

    const doCommit = useCallback(
        (newDate: Date, prevState: TPState) => {
            if (!isInRange(newDate, minTime, maxTime)) {
                // Out of range → revert text
                setState(stateFromDate(prevState.value, useAmPm, minTime, maxTime));
                return;
            }
            const changed = !isSameTime(newDate, prevState.value);

            if (valueProp == null) {
                // Uncontrolled: update internal value
                setState(stateFromDate(newDate, useAmPm, minTime, maxTime));
            } else {
                // Controlled: revert text to prop value (parent will re-render with new value)
                setState(stateFromDate(prevState.value, useAmPm, minTime, maxTime));
            }

            if (changed) onChange?.(newDate);
        },
        [valueProp, useAmPm, minTime, maxTime, onChange],
    );

    // -----------------------------------------------------------------------
    // Arrow shifts — directly compute new date from current state
    // -----------------------------------------------------------------------

    const shiftHour = (delta: number) => {
        if (disabled) return;
        const next = cloneDate(state.value);
        if (useAmPm) {
            const h12 = to12Hour(state.value.getHours());
            const raw = h12 + delta;
            const newH12 = raw <= 0 ? 12 : raw > 12 ? 1 : raw;
            next.setHours(to24Hour(newH12, state.isPm));
        } else {
            next.setHours(wrap(state.value.getHours() + delta, 23));
        }
        doCommit(next, state);
    };

    const shiftMinute = (delta: number) => {
        if (disabled) return;
        const next = cloneDate(state.value);
        next.setMinutes(wrap(state.value.getMinutes() + delta, 59));
        doCommit(next, state);
    };

    const shiftSecond = (delta: number) => {
        if (disabled) return;
        const next = cloneDate(state.value);
        next.setSeconds(wrap(state.value.getSeconds() + delta, 59));
        doCommit(next, state);
    };

    const shiftMs = (delta: number) => {
        if (disabled) return;
        const next = cloneDate(state.value);
        next.setMilliseconds(wrap(state.value.getMilliseconds() + delta, 999));
        doCommit(next, state);
    };

    // -----------------------------------------------------------------------
    // Blur handlers — parse text then commit
    // -----------------------------------------------------------------------

    const blurSegment = (
        text: string,
        minVal: number,
        maxVal: number,
        apply: (n: number, base: Date) => void,
    ) => {
        const n = parseInt(text, 10);
        if (isNaN(n) || n < minVal || n > maxVal) {
            setState(stateFromDate(state.value, useAmPm, minTime, maxTime));
            return;
        }
        const next = cloneDate(state.value);
        apply(n, next);
        doCommit(next, state);
    };

    // -----------------------------------------------------------------------
    // Key handlers
    // -----------------------------------------------------------------------

    const keyOf = (shiftFn: (d: number) => void) =>
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "ArrowUp") { e.preventDefault(); shiftFn(1); }
            else if (e.key === "ArrowDown") { e.preventDefault(); shiftFn(-1); }
            else if (e.key === "Enter") { e.currentTarget.blur(); }
        };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        if (selectAllOnFocus) e.currentTarget.select();
    };

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------

    return (
        <div
            ref={ref}
            className={cn("inline-block whitespace-nowrap", className)}
        >
            {/* ── Top arrow row ──────────────────────────────────── */}
            {showArrowButtons && (
                <div className="px-px">
                    <ArrowButton direction="up" label="Increase hour" onClick={() => shiftHour(1)} disabled={disabled} data-compare="time-picker-arrow" />
                    <ArrowSpacer />
                    <ArrowButton direction="up" label="Increase minute" onClick={() => shiftMinute(1)} disabled={disabled} />
                    {showSeconds && <><ArrowSpacer /><ArrowButton direction="up" label="Increase second" onClick={() => shiftSecond(1)} disabled={disabled} /></>}
                    {showMs && <><ArrowSpacer /><ArrowButton direction="up" label="Increase millisecond" onClick={() => shiftMs(1)} disabled={disabled} /></>}
                </div>
            )}

            {/* ── Input row ──────────────────────────────────────── */}
            <div
                className={cn(
                    "inline-block align-middle rounded-bp h-7.5 px-px",
                    "bg-white dark:bg-black/30 shadow-input",
                    disabled && "bg-[rgba(211,216,222,0.5)] dark:bg-[rgba(64,72,84,0.5)] shadow-none",
                )}
            >
                {/* Hour */}
                <SegmentInput
                    id="tp-hour"
                    ariaLabel="Hour"
                    value={state.hourText}
                    onChange={(t) => setState((s) => ({ ...s, hourText: t }))}
                    onBlur={() => blurSegment(state.hourText, useAmPm ? 1 : 0, useAmPm ? 12 : 23, (n, base) => base.setHours(useAmPm ? to24Hour(n, state.isPm) : n))}
                    onKeyDown={keyOf(shiftHour)}
                    onFocus={handleFocus}
                    disabled={disabled}
                    autoFocus={autoFocus}
                    data-compare="time-picker-input"
                />

                <Divider text=":" disabled={disabled} data-compare="time-picker-divider" />

                {/* Minute */}
                <SegmentInput
                    id="tp-minute"
                    ariaLabel="Minute"
                    value={state.minuteText}
                    onChange={(t) => setState((s) => ({ ...s, minuteText: t }))}
                    onBlur={() => blurSegment(state.minuteText, 0, 59, (n, base) => base.setMinutes(n))}
                    onKeyDown={keyOf(shiftMinute)}
                    onFocus={handleFocus}
                    disabled={disabled}
                />

                {/* Second */}
                {showSeconds && <Divider text=":" disabled={disabled} />}
                {showSeconds && (
                    <SegmentInput
                        id="tp-second"
                        ariaLabel="Second"
                        value={state.secondText}
                        onChange={(t) => setState((s) => ({ ...s, secondText: t }))}
                        onBlur={() => blurSegment(state.secondText, 0, 59, (n, base) => base.setSeconds(n))}
                        onKeyDown={keyOf(shiftSecond)}
                        onFocus={handleFocus}
                        disabled={disabled}
                    />
                )}

                {/* Millisecond */}
                {showMs && <Divider text="." disabled={disabled} />}
                {showMs && (
                    <SegmentInput
                        id="tp-ms"
                        ariaLabel="Millisecond"
                        value={state.millisecondText}
                        onChange={(t) => setState((s) => ({ ...s, millisecondText: t }))}
                        onBlur={() => blurSegment(state.millisecondText, 0, 999, (n, base) => base.setMilliseconds(n))}
                        onKeyDown={keyOf(shiftMs)}
                        onFocus={handleFocus}
                        disabled={disabled}
                    />
                )}
            </div>

            {/* ── AM/PM select ───────────────────────────────────── */}
            {useAmPm && (
                <HTMLSelect
                    aria-label="AM/PM"
                    value={state.isPm ? "pm" : "am"}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                        const nextIsPm = e.currentTarget.value === "pm";
                        if (nextIsPm === state.isPm) return;
                        const newH24 = to24Hour(to12Hour(state.value.getHours()), nextIsPm);
                        const next = cloneDate(state.value);
                        next.setHours(newH24);
                        // Update isPm immediately for correct hour interpretation, then commit
                        const updatedState = { ...state, isPm: nextIsPm };
                        setState(updatedState);
                        doCommit(next, updatedState);
                    }}
                    disabled={disabled}
                    data-compare="time-picker-ampm"
                    className="ml-1"
                >
                    <option value="am">AM</option>
                    <option value="pm">PM</option>
                </HTMLSelect>
            )}

            {/* ── Bottom arrow row ───────────────────────────────── */}
            {showArrowButtons && (
                <div className="px-px">
                    <ArrowButton direction="down" label="Decrease hour" onClick={() => shiftHour(-1)} disabled={disabled} />
                    <ArrowSpacer />
                    <ArrowButton direction="down" label="Decrease minute" onClick={() => shiftMinute(-1)} disabled={disabled} />
                    {showSeconds && <><ArrowSpacer /><ArrowButton direction="down" label="Decrease second" onClick={() => shiftSecond(-1)} disabled={disabled} /></>}
                    {showMs && <><ArrowSpacer /><ArrowButton direction="down" label="Decrease millisecond" onClick={() => shiftMs(-1)} disabled={disabled} /></>}
                </div>
            )}
        </div>
    );
});
