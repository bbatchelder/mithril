import { forwardRef, useCallback, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { Icon } from "./icon";
import { InputGroup, type InputGroupIntent, type InputGroupSize } from "./input-group";

/**
 * NumericInput — Blueprint-faithful numeric input with increment/decrement stepper.
 *
 * Composition:
 *   - Outer container: `display:flex; flex-direction:row; align-items:stretch` (ControlGroup-style row).
 *   - Field: `<InputGroup>` (standard text input) with `fill` so it takes remaining space in the row.
 *     The input keeps its full `rounded-bp` (4px all corners) — Blueprint does NOT square input
 *     corners when adjacent to the stepper. The visual flush appearance comes from the stepper
 *     buttons sitting immediately adjacent with no gap and sharing the same box-shadow line.
 *   - Stepper: a vertical flex column (`self-stretch`) containing two `<button>` elements.
 *     Blueprint's layout math (`_numeric-input.scss`):
 *       `flex: 1 1 ($pt-button-height-small * 0.5 - 1)` = `flex: 1 1 11px`
 *       `min-height: 0; padding: 0; width: $pt-button-height-small` = `24px`
 *     Large: width = $pt-button-height-large = 40px
 *     The two buttons together equal the input height (30px medium / 40px large / 24px small).
 *
 * Stepper button radii (Blueprint vertical ButtonGroup pattern):
 *   - buttonPosition="right": increment button top-right corners round (`rounded-tr-bp`);
 *     decrement button bottom-right corners round (`rounded-br-bp`). Inner (left) edges square.
 *   - buttonPosition="left": increment top-left round; decrement bottom-left round.
 *   - NO `overflow-hidden` on the stepper container — buttons carry their own individual radii.
 *
 * Intent on stepper buttons: Blueprint colors the stepper buttons with the active intent
 * (same solid intent colors as Button). This is applied via the intent prop.
 *
 * Dark theme known-intentional deltas (same as Button component):
 *   - color: analyst rgb(246,247,249) vs blueprint rgb(255,255,255) — dark foreground decision
 *   - backgroundColor: analyst rgb(47,52,60) vs blueprint rgb(48,55,64) — color-mix vs static value
 *
 * @see https://blueprintjs.com/docs/#core/components/numeric-input
 */

export type NumericInputIntent = InputGroupIntent;
export type NumericInputSize = InputGroupSize;

export interface NumericInputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "value" | "defaultValue" | "onChange" | "type"> {
    /** Controlled value. If provided, component is controlled. */
    value?: number | string;
    /** Default value for uncontrolled mode. @default "" */
    defaultValue?: number | string;
    /** Callback on value change: (valueAsNumber, valueAsString) */
    onValueChange?: (valueAsNumber: number, valueAsString: string) => void;

    /** Minimum allowed value. */
    min?: number;
    /** Maximum allowed value. */
    max?: number;
    /** Increment between successive values (no modifier). @default 1 */
    stepSize?: number;
    /** Increment with Shift key held. Pass null to disable. @default 10 */
    majorStepSize?: number | null;
    /** Increment with Alt key held. Pass null to disable. @default 0.1 */
    minorStepSize?: number | null;

    /**
     * Position of the stepper buttons relative to the input.
     * @default "right"
     */
    buttonPosition?: "left" | "right" | "none";

    /** Clamp value to [min, max] on blur. @default false */
    clampValueOnBlur?: boolean;
    /** Reject non-numeric key presses. @default true */
    allowNumericCharactersOnly?: boolean;

    /** Visual size. @default "medium" */
    size?: NumericInputSize;
    /** Shorthand for size="large". @deprecated use size="large" */
    large?: boolean;

    /** Whether the input fills its container width. @default false */
    fill?: boolean;
    /** Disabled state. */
    disabled?: boolean;
    /** Intent (applies to input field AND stepper buttons). */
    intent?: NumericInputIntent;
    /** Icon on the left side of the input field. */
    leftIcon?: React.ComponentProps<typeof InputGroup>["leftIcon"];

    /** Extra className on the outer wrapper div. */
    className?: string;
}

// ── Intent color maps for solid stepper buttons ──────────────────────────────
// Mirrors Button component's SOLID map for none+intents (literal utility strings).
const STEPPER_COLORS: Record<NumericInputIntent, string> = {
    none: "bg-light-gray-5 hover:bg-light-gray-4 active:bg-light-gray-2 dark:bg-dark-gray-3 dark:hover:bg-dark-gray-2 dark:active:bg-dark-gray-1 text-foreground dark:text-foreground",
    primary: "bg-primary hover:bg-primary-hover active:bg-primary-active text-primary-foreground",
    success: "bg-success hover:bg-success-hover active:bg-success-active text-success-foreground",
    warning: "bg-orange-5 hover:bg-orange-4 active:bg-orange-3 text-warning-foreground",
    danger: "bg-danger hover:bg-danger-hover active:bg-danger-active text-danger-foreground",
};

function clamp(val: number, min: number | undefined, max: number | undefined): number {
    let v = val;
    if (min !== undefined && v < min) v = min;
    if (max !== undefined && v > max) v = max;
    return v;
}

function getStep(
    base: number,
    majorStepSize: number | null | undefined,
    minorStepSize: number | null | undefined,
    e: React.MouseEvent | React.KeyboardEvent,
): number {
    if (e.shiftKey && majorStepSize != null) return majorStepSize;
    if (e.altKey && minorStepSize != null) return minorStepSize;
    return base;
}

/**
 * NumericInput — pixel-faithful Blueprint numeric text input with vertical stepper.
 *
 * Ref is forwarded to the underlying `<input>` element.
 */
export const NumericInput = forwardRef<HTMLInputElement, NumericInputProps>(function NumericInput(
    {
        value: valueProp,
        defaultValue = "",
        onValueChange,
        min,
        max,
        stepSize = 1,
        majorStepSize = 10,
        minorStepSize = 0.1,
        buttonPosition = "right",
        clampValueOnBlur = false,
        allowNumericCharactersOnly = true,
        size = "medium",
        large = false,
        fill = false,
        disabled = false,
        intent = "none",
        leftIcon,
        className,
        style,
        onKeyDown,
        onBlur,
        ...inputProps
    },
    ref,
) {
    const resolvedSize: NumericInputSize = large ? "large" : size;

    // ── Internal state (uncontrolled mode) ──────────────────────────────────
    const [internalValue, setInternalValue] = useState<string>(
        valueProp !== undefined ? String(valueProp) : String(defaultValue),
    );
    const isControlled = valueProp !== undefined;
    const displayValue = isControlled ? String(valueProp) : internalValue;

    const inputRef = useRef<HTMLInputElement | null>(null);

    // ── Value mutation helper ───────────────────────────────────────────────
    const applyValue = useCallback(
        (newStr: string) => {
            const num = parseFloat(newStr);
            const numOrNaN = isNaN(num) ? NaN : num;
            if (!isControlled) setInternalValue(newStr);
            onValueChange?.(numOrNaN, newStr);
        },
        [isControlled, onValueChange],
    );

    // ── Stepper step ────────────────────────────────────────────────────────
    const step = useCallback(
        (direction: 1 | -1, e: React.MouseEvent | React.KeyboardEvent) => {
            const delta = getStep(stepSize, majorStepSize, minorStepSize, e) * direction;
            const current = parseFloat(displayValue);
            const base = isNaN(current) ? 0 : current;
            const next = base + delta;
            const clamped = clamp(next, min, max);
            // Avoid floating-point drift: format to maximum step precision
            const precision = Math.max(
                (stepSize.toString().split(".")[1] ?? "").length,
                ((minorStepSize ?? 0).toString().split(".")[1] ?? "").length,
            );
            const str = precision > 0 ? clamped.toFixed(precision) : String(clamped);
            applyValue(str);
        },
        [displayValue, stepSize, majorStepSize, minorStepSize, min, max, applyValue],
    );

    // ── Handlers ────────────────────────────────────────────────────────────
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        applyValue(e.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "ArrowUp") {
            e.preventDefault();
            step(1, e);
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            step(-1, e);
        }
        onKeyDown?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        if (clampValueOnBlur) {
            const num = parseFloat(displayValue);
            if (!isNaN(num)) {
                const clamped = clamp(num, min, max);
                if (clamped !== num) applyValue(String(clamped));
            }
        }
        onBlur?.(e);
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!allowNumericCharactersOnly) return;
        // Allow: digits, decimal point, minus, plus, e (scientific notation), and control keys
        if (!/[\d.\-+eE]/.test(e.key) && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
        }
    };

    // ── Stepper layout ──────────────────────────────────────────────────────
    // Stepper button width: 24px (medium/small) = $pt-button-height-small, 40px (large) = $pt-button-height-large
    // Each button: flex: 1 1 11px (= $pt-button-height-small * 0.5 - 1); min-height: 0; padding: 0
    const stepperWidth = resolvedSize === "large" ? "w-10 min-w-10" : "w-6 min-w-6";

    // Intent color classes for stepper buttons
    const stepperColors = STEPPER_COLORS[intent ?? "none"];

    // ── Stepper button radii ────────────────────────────────────────────────
    // Blueprint's vertical ButtonGroup pattern:
    //   - Increment (top) button: rounds BOTH top corners → `rounded-t-bp` (= 4px 4px 0px 0px)
    //   - Decrement (btm) button: rounds BOTH bottom corners → `rounded-b-bp` (= 0px 0px 4px 4px)
    // Blueprint does NOT square the inner edge (the edge adjacent to the input) on the buttons.
    // The visual flush look comes from box-shadow layering, not from squaring corners.
    // A `margin-bottom: -1px` on the increment button merges its border with the decrement button.
    const [incrRadius, decrRadius] = buttonPosition !== "none"
        ? ["rounded-t-bp", "rounded-b-bp"]
        : ["", ""];

    // ── Stepper button common classes ───────────────────────────────────────
    // shadow-button = Blueprint's solid button shadow (matches .bp6-button)
    // Blueprint sets `width: 24px` on the .bp6-numeric-input stepper button, but
    // the global `.bp6-button { min-width: 30px }` rule still applies because
    // they're different properties — final rendered width = max(min,width) = 30px.
    // Match that with min-w-[30px] so the stepper sits at 30px like Blueprint.
    const stepperButtonBase = cn(
        // Layout — flex split: each button takes half the input height
        "flex-1 flex items-center justify-center",
        "basis-[11px] min-h-0 p-0",
        stepperWidth,
        "min-w-[30px]",
        // Colors from intent map (resting/hover/active). Disabled overrides below.
        stepperColors,
        // Shadow: Blueprint's solid button shadow
        "shadow-button",
        // Misc
        "outline-none cursor-pointer select-none transition-colors duration-100 ease-bp",
        // Disabled — match the input's disabled treatment regardless of intent
        // (Blueprint resets intent colors on disabled steppers to the neutral disabled tone).
        "disabled:cursor-not-allowed disabled:shadow-none",
        "disabled:bg-[rgba(211,216,222,0.5)] dark:disabled:bg-[rgba(64,72,84,0.5)]",
        "disabled:hover:bg-[rgba(211,216,222,0.5)] dark:disabled:hover:bg-[rgba(64,72,84,0.5)]",
        "disabled:text-foreground-disabled",
        // SVG sizing — Icon's own wrapper span carries text-foreground; pass `!text-current`
        // on each Icon below so it inherits the button's intent-foreground (white on colored bg).
        "[&_svg]:size-[12px] [&_svg]:shrink-0",
    );

    const incrementBtn = (
        <button
            type="button"
            className={cn(stepperButtonBase, incrRadius, "mb-[-1px]")}
            tabIndex={-1}
            disabled={disabled}
            aria-label="Increment value"
            onMouseDown={(e) => {
                e.preventDefault(); // prevent input blur
                step(1, e);
            }}
        >
            <Icon icon="chevron-up" size={12} className="!text-current" aria-hidden />
        </button>
    );

    const decrementBtn = (
        <button
            type="button"
            className={cn(stepperButtonBase, decrRadius)}
            tabIndex={-1}
            disabled={disabled}
            aria-label="Decrement value"
            onMouseDown={(e) => {
                e.preventDefault(); // prevent input blur
                step(-1, e);
            }}
        >
            <Icon icon="chevron-down" size={12} className="!text-current" aria-hidden />
        </button>
    );

    // ── Stepper column ──────────────────────────────────────────────────────
    // Vertical flex column, self-stretch so it matches the input height.
    // NO overflow-hidden — buttons carry their own corner radii.
    // Blueprint's ControlGroup adds `margin-right: $pt-spacing * 0.5 = 2px` between
    // non-last children; the stepper inherits that gap from the input. Mirror it
    // with an ml-/mr- on the stepper depending on which side it sits.
    const stepper = (
        <div
            className={cn(
                "flex flex-col self-stretch",
                buttonPosition === "right" && "ml-[2px]",
                buttonPosition === "left" && "mr-[2px]",
            )}
            aria-hidden
        >
            {incrementBtn}
            {decrementBtn}
        </div>
    );

    // ── Outer wrapper (horizontal flex row, items-stretch) ──────────────────
    // items-stretch makes children match the tallest child (the input's height).
    //
    // Width semantics match Blueprint: `style` (and its `width`) is forwarded to the
    // inner <input>, NOT the wrapper. Blueprint's NumericInput spreads htmlInputProps
    // (incl. style) onto its InputGroup, so a `width` sizes the field and the ~30px
    // stepper sits *outside* it (total ≈ width + 2px gap + 30). When `fill`, the
    // control instead stretches to 100% and the input flexes to fill the row.
    return (
        <div
            className={cn(
                "flex flex-row items-stretch",
                fill ? "w-full" : "inline-flex",
                className,
            )}
            style={fill ? style : undefined}
        >
            {buttonPosition === "left" && stepper}

            {/* When `fill`, flex-1 lets the InputGroup take the remaining row space.
                Otherwise the field is content/width-sized and the wrapper shrinks to it. */}
            <div className={cn("min-w-0", fill && buttonPosition !== "none" ? "flex-1" : "")}>
                <InputGroup
                    ref={(el) => {
                        // Forward ref to both our internal ref and the caller's forwarded ref
                        inputRef.current = el;
                        if (typeof ref === "function") ref(el);
                        else if (ref) ref.current = el;
                    }}
                    type="text"
                    inputMode="decimal"
                    size={resolvedSize}
                    intent={intent}
                    fill={fill}
                    style={fill ? undefined : style}
                    disabled={disabled}
                    leftIcon={leftIcon}
                    value={displayValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onKeyPress={handleKeyPress}
                    onBlur={handleBlur}
                    className={cn(
                        // Remove native number-input spinners (preflight + WebKit)
                        "[appearance:textfield] [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden",
                    )}
                    {...inputProps}
                />
            </div>

            {buttonPosition === "right" && stepper}
        </div>
    );
});

NumericInput.displayName = "NumericInput";
