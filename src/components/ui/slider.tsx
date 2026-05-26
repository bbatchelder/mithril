import * as RadixSlider from "@radix-ui/react-slider";
import { forwardRef } from "react";

import { cn } from "@/lib/utils";

/**
 * Slider component — pixel-faithful reimplementation of Blueprint's `.bp6-slider`.
 *
 * Blueprint spec (all values derived from Blueprint's SCSS variables):
 *   $pt-spacing = 4px
 *   $pt-icon-size-standard = 16px  → handle size
 *   $track-size = 16px - (4px*2.5) = 6px
 *   $label-offset = 16px + 4px = 20px
 *   $pt-border-radius = 4px
 *   $pt-font-size-small = 12px
 *   $pt-input-height-large = 40px  → container height (horizontal)
 *   $slider-min-size = 4px*37.5 = 150px  → min-width (horizontal)
 *
 *   Handle box-shadow (light):
 *     0 0 0 1px rgba(0,0,0,0.5), 0 1px 1px rgba(0,0,0,0.5)
 *   Handle bg (light): pt-button default ≈ light-gray-5 (#f6f7f9)
 *   Handle bg (dark):  gray-4 (#abb3bf)
 *   Handle box-shadow (dark): inset 0 0 0 1px rgba(255,255,255,0.1), 0 1px 2px rgba(0,0,0,0.2)
 *
 *   Track bg (light): rgba(95,107,124,0.2)  (gray1@20%)
 *   Track bg (dark):  rgba(17,20,24,0.5)    (black@50%)
 *
 *   Progress (intent fill):
 *     none    → rgba(95,107,124,0.2) light / rgba(17,20,24,0.5) dark  (no fill, same as track)
 *     primary → #2d72d2 (blue-3)
 *     success → #238551 (green-3)
 *     warning → #c87619 (orange-3)
 *     danger  → #cd4246 (red-3)
 *
 *   Slider label (tick): absolute positioned, font-size:12px, padding:2px 4px,
 *     border-radius:4px, transform:translate(-50%, 20px)
 *     tooltip bg (light): #404854 (dark-gray-5) / (dark): #e5e8eb (light-gray-3)
 *     tooltip text (light): #f6f7f9 (light-gray-5) / (dark): #404854 (dark-gray-5)
 *
 * IMPORTANT — Tailwind v4 tree-shakes @theme tokens that are only accessed via
 * runtime var() in inline styles. All colors use LITERAL arbitrary-value classes.
 * Runtime `left: X%` / `width: Y%` for positioning ARE fine as inline styles.
 *
 * @see https://blueprintjs.com/docs/#core/components/sliders.slider
 */

export type SliderIntent = "none" | "primary" | "success" | "warning" | "danger";

export interface SliderProps
    extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
    /** Minimum value. @default 0 */
    min?: number;
    /** Maximum value. @default 10 */
    max?: number;
    /** Step size between values. @default 1 */
    stepSize?: number;
    /** Controlled value. */
    value?: number;
    /** Default value for uncontrolled usage. @default 0 */
    defaultValue?: number;
    /** Callback when the value changes. */
    onChange?: (value: number) => void;
    /** Callback when handle is released. */
    onRelease?: (value: number) => void;
    /**
     * Intent color of the fill track.
     * "none" renders no colored fill (matches Blueprint's default track color).
     * @default "primary"
     */
    intent?: SliderIntent;
    /** Whether the slider is non-interactive. @default false */
    disabled?: boolean;
    /** Show or hide tick labels. Set false to hide all labels. @default true */
    labelRenderer?: boolean | ((value: number) => string | React.ReactNode);
    /** Interval at which labels are rendered. @default inferred */
    labelStepSize?: number;
    /** Explicit array of values at which to render labels. Mutually exclusive with labelStepSize. */
    labelValues?: readonly number[];
    /** Number of decimal places for labels. @default inferred from stepSize */
    labelPrecision?: number;
    /** Whether to render a fill from initialValue to value. @default true */
    showTrackFill?: boolean;
    /** The value from which the fill starts (other end of fill). @default 0 */
    initialValue?: number;
    /** Whether to display in vertical orientation. @default false */
    vertical?: boolean;
}

// Intent fill colors — literal values to defeat Tailwind v4 tree-shaking
const INTENT_FILL_CLASS: Record<SliderIntent, string> = {
    none: "bg-[rgba(95,107,124,0.2)] dark:bg-[rgba(17,20,24,0.5)]",
    primary: "bg-[#2d72d2]",
    success: "bg-[#238551]",
    warning: "bg-[#c87619]",
    danger: "bg-[#cd4246]",
};

/** Count decimal places in a number */
function countDecimals(n: number): number {
    if (Math.floor(n) === n) return 0;
    const str = n.toString();
    const dot = str.indexOf(".");
    return dot < 0 ? 0 : str.length - dot - 1;
}

/** Compute label values for the tick axis */
function getLabelValues(
    min: number,
    max: number,
    labelStepSize?: number,
    labelValues?: readonly number[],
): number[] {
    if (labelValues !== undefined) {
        return [...labelValues];
    }
    const step = labelStepSize ?? 1;
    const vals: number[] = [];
    for (let v = min; v <= max + 1e-10; v += step) {
        vals.push(parseFloat(v.toFixed(10)));
    }
    return vals;
}

/**
 * Horizontal single-value slider. Blueprint-fidelity: track 6px tall, 16×16 handle,
 * 4px radius, tooltip-style tick labels at 20px below track top.
 *
 * ```tsx
 * // Controlled
 * <Slider value={5} onChange={setVal} />
 *
 * // With intent
 * <Slider value={7} intent="primary" min={0} max={10} labelStepSize={5} />
 *
 * // Disabled
 * <Slider value={3} disabled />
 * ```
 */
export const Slider = forwardRef<HTMLDivElement, SliderProps>(function Slider(
    {
        min = 0,
        max = 10,
        stepSize = 1,
        value,
        defaultValue = 0,
        onChange,
        onRelease,
        intent = "primary",
        disabled = false,
        labelRenderer = true,
        labelStepSize,
        labelValues,
        labelPrecision,
        showTrackFill = true,
        initialValue = 0,
        vertical = false,
        className,
        ...htmlProps
    },
    ref,
) {
    const precision = labelPrecision ?? countDecimals(stepSize);

    // Compute display label for a value
    function renderLabel(v: number): React.ReactNode {
        if (labelRenderer === false) return null;
        if (typeof labelRenderer === "function") return labelRenderer(v);
        return v.toFixed(precision);
    }

    // Radix expects array for value/defaultValue
    const controlledValue = value !== undefined ? [value] : undefined;
    const uncontrolledDefault = [defaultValue];

    // Fill range: from initialValue to value (or defaultValue)
    // We track internal value for fill computation if uncontrolled
    const currentValue = value ?? defaultValue;
    const fillStart = Math.min(initialValue, currentValue);
    const fillEnd = Math.max(initialValue, currentValue);
    const range = max - min;

    // Fill position as percentages
    const fillLeftPct = range > 0 ? ((fillStart - min) / range) * 100 : 0;
    const fillWidthPct = range > 0 ? ((fillEnd - fillStart) / range) * 100 : 0;

    // Tick labels
    const showLabels = labelRenderer !== false;
    const tickValues = showLabels
        ? getLabelValues(min, max, labelStepSize, labelValues)
        : [];

    // Blueprint-derived dimensions (all px, not runtime var()):
    //   handle: 16×16px, track: 6px tall, top-offset: 5px (=(16-6)/2)
    //   container height: 40px (pt-input-height-large)
    //   label-offset (from handle top): 20px (= 16px handle + 4px spacing)

    const fillClass = showTrackFill ? INTENT_FILL_CLASS[intent] : INTENT_FILL_CLASS["none"];

    return (
        <div
            ref={ref}
            className={cn(
                // Container: position:relative, cursor:default, user-select:none
                "relative cursor-default select-none outline-none",
                // Horizontal: height=40px, min-width=150px, width=100%
                !vertical && "h-10 min-w-[150px] w-full",
                // Vertical: height=150px, min-width=40px, width=40px
                vertical && "min-h-[150px] w-10",
                // Disabled: cursor not-allowed, opacity 0.5
                disabled && "cursor-not-allowed opacity-50",
                // Hover cursor
                !disabled && "hover:cursor-pointer",
                className,
            )}
            {...htmlProps}
        >
            {/* Radix Slider — provides drag + keyboard + a11y */}
            <RadixSlider.Root
                min={min}
                max={max}
                step={stepSize}
                value={controlledValue}
                defaultValue={controlledValue === undefined ? uncontrolledDefault : undefined}
                disabled={disabled}
                orientation={vertical ? "vertical" : "horizontal"}
                onValueChange={(vals) => onChange?.(vals[0])}
                onValueCommit={(vals) => onRelease?.(vals[0])}
                // Radix Root: fill the container
                className={cn(
                    "relative flex items-center touch-none",
                    !vertical && "w-full h-full",
                    vertical && "flex-col h-full w-full",
                )}
            >
                {/* Track container (Blueprint .bp6-slider-track) */}
                <RadixSlider.Track
                    className={cn(
                        "relative overflow-hidden rounded-bp",
                        // Track bg: rgba(gray1,0.2) light / rgba(black,0.5) dark
                        "bg-[rgba(95,107,124,0.2)] dark:bg-[rgba(17,20,24,0.5)]",
                        // Horizontal: height=6px, left=0, right=0, top=5px (centered in 40px container → (40-6)/2=17px? No — blueprint positions it centered in handle 16px: (16-6)/2=5px from the handle's origin)
                        // Radix handles centering within the container; we set explicit height
                        !vertical && "h-[6px] w-full",
                        vertical && "w-[6px] h-full",
                    )}
                >
                    {/* Progress fill (Blueprint .bp6-slider-progress with intent) */}
                    {showTrackFill && (
                        <div
                            className={cn("absolute h-full", fillClass)}
                            style={
                                !vertical
                                    ? {
                                          left: `${fillLeftPct}%`,
                                          width: `${fillWidthPct}%`,
                                      }
                                    : {
                                          bottom: `${fillLeftPct}%`,
                                          height: `${fillWidthPct}%`,
                                      }
                            }
                            data-compare="slider-progress"
                        />
                    )}
                    {/* Radix Range (we override with our custom fill above) */}
                    <RadixSlider.Range className="hidden" />
                </RadixSlider.Track>

                {/* Handle (Blueprint .bp6-slider-handle) */}
                <RadixSlider.Thumb
                    className={cn(
                        // 16×16px, border-radius:4px, position:absolute
                        "block h-4 w-4 rounded-bp",
                        // Light: button-like bg + handle box-shadow
                        // bg = pt-button default ≈ light-gray-5 (#f6f7f9)
                        "bg-[#f6f7f9]",
                        // handle-box-shadow: 0 0 0 1px rgba(black,0.5), 0 1px 1px rgba(black,0.5)
                        "shadow-[0_0_0_1px_rgba(0,0,0,0.5),0_1px_1px_rgba(0,0,0,0.5)]",
                        // hover: slightly deeper shadow
                        "hover:shadow-[0_0_0_1px_rgba(0,0,0,0.5),0_1px_2px_rgba(0,0,0,0.6)] hover:cursor-grab hover:z-[2]",
                        // active (grabbed): inset shadow + border + drop shadow
                        "active:shadow-[inset_0_1px_1px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.5),0_1px_2px_rgba(0,0,0,0.2)] active:cursor-grabbing",
                        // focus: z-index
                        "focus:z-[1] focus:outline-none",
                        // Dark: gray-4 bg + dark-button-box-shadow
                        "dark:bg-[#abb3bf]",
                        "dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1),0_1px_2px_rgba(0,0,0,0.2)]",
                        "dark:hover:bg-[#8f99a8] dark:hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1),0_1px_2px_rgba(0,0,0,0.4)]",
                        "dark:active:bg-[#738091] dark:active:shadow-[inset_0_1px_1px_rgba(0,0,0,0.1),inset_0_0_0_1px_rgba(255,255,255,0.1),0_1px_2px_rgba(0,0,0,0.4)]",
                        // Disabled state (handled by parent opacity, also pointer-events:none)
                        disabled && "pointer-events-none bg-[#c5cbd3] shadow-none dark:bg-[#5f6b7c] dark:shadow-none",
                    )}
                    data-compare="slider-handle"
                />
            </RadixSlider.Root>

            {/* Tick labels axis (Blueprint .bp6-slider-axis) */}
            {showLabels && tickValues.length > 0 && (
                <div className="absolute left-0 right-0 top-0">
                    {tickValues.map((v, i) => {
                        const pct = range > 0 ? ((v - min) / range) * 100 : 0;
                        return (
                            <div
                                key={i}
                                className={cn(
                                    // position:absolute, inline-block, font-size:12px, line-height:1
                                    "absolute inline-block text-[12px] leading-[1] whitespace-nowrap",
                                    // padding: 2px 4px, border-radius:4px
                                    "px-1 py-0.5 rounded-bp",
                                    // vertical-align: top
                                    "align-top",
                                    // tooltip-style bg/text (light: dark-gray-5 bg + light-gray-5 text)
                                    // (dark: light-gray-3 bg + dark-gray-5 text)
                                    "bg-[#404854] text-[#f6f7f9]",
                                    "dark:bg-[#e5e8eb] dark:text-[#404854]",
                                )}
                                style={{
                                    // Blueprint: transform: translate(-50%, $label-offset)
                                    // label-offset = 20px (= handle-size(16) + pt-spacing(4))
                                    left: `${pct}%`,
                                    transform: "translate(-50%, 20px)",
                                }}
                                data-compare={i === 0 ? "slider-label" : undefined}
                            >
                                {renderLabel(v)}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
});

Slider.displayName = "Slider";
