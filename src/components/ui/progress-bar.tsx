import { forwardRef } from "react";

import { cn } from "@/lib/utils";
import type { Intent } from "@/lib/types";

/**
 * ProgressBar component — pixel-faithful reimplementation of Blueprint's `bp6-progress-bar`.
 *
 * Blueprint spec:
 *   DOM: .bp6-progress-bar (track) > .bp6-progress-meter (fill)
 *   Track: display:block; position:relative; overflow:hidden; width:100%;
 *          height:8px (= $pt-spacing*2 = 4px*2); border-radius:40px (= $pt-spacing*10 = 4px*10)
 *          background: $progress-track-color (rgba(gray1,0.2) light / rgba(black,0.5) dark)
 *   Meter: position:absolute; height:100%; border-radius:40px; width: value% (default 100%);
 *          transition: width 200ms (= dur*2 = 100ms*2) ease;
 *          background-color: $progress-head-color (rgba(gray1,0.8) light / gray3 dark)
 *          background-image: linear-gradient(-45deg, rgba(white,0.2) 25%, transparent 25%,
 *            transparent 50%, rgba(white,0.2) 50%, rgba(white,0.2) 75%, transparent 75%)
 *          background-size: 30px 30px (= $pt-spacing*7.5 = 4px*7.5)
 *   Stripes animation: `linear-progress-bar-stripes` (dur*3=300ms) linear infinite reverse
 *                      when NOT no-animation and NOT no-stripes.
 *   Intent: meter background-color = intent color.
 *   a11y: role="progressbar", aria-valuemin/max=0/100, aria-valuenow when determinate.
 *
 * Blueprint palette values:
 *   gray1  = #5f6b7c → rgba(95, 107, 124, …)
 *   gray3  = #8f99a8
 *   black  = #111418 → rgba(17, 20, 24, …)
 *   white  = #ffffff → rgba(255, 255, 255, …)
 *
 * Colors used as literal arbitrary-value Tailwind classes (NOT runtime var() refs):
 *   track light  → bg-[rgba(95,107,124,0.2)]
 *   track dark   → dark:bg-[rgba(17,20,24,0.5)]
 *   head light   → bg-[rgba(95,107,124,0.8)]
 *   head dark    → dark:bg-[#8f99a8]
 *   primary      → bg-[#2d72d2]
 *   success      → bg-[#238551]
 *   warning      → bg-[#c87619]
 *   danger       → bg-[#cd4246]
 *
 * IMPORTANT — Tailwind v4 tree-shakes @theme tokens that are only accessed via
 * runtime var() in inline styles. All colors use LITERAL arbitrary-value classes
 * so they are always emitted.
 *
 * @see https://blueprintjs.com/docs/#core/components/progress-bar
 */

export type ProgressBarIntent = Intent;

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
    /**
     * A value between 0 and 1 (inclusive) representing progress.
     * - Omit (or undefined) → indeterminate: meter fills 100% of bar.
     * - Provide → determinate: meter fills value*100%.
     * Values outside [0,1] are clamped.
     */
    value?: number;

    /**
     * Intent color applied to the meter fill.
     * - "none" → default gray head (theme-aware)
     * - others → intent color (primary=blue3, success=green3, warning=orange3, danger=red3)
     * @default "none"
     */
    intent?: ProgressBarIntent;

    /**
     * Whether the meter should show diagonal stripes.
     * @default true
     */
    stripes?: boolean;

    /**
     * Whether the stripes should animate.
     * @default true
     */
    animate?: boolean;

    /**
     * Additional props forwarded to the inner meter div.
     * Use to add `data-compare` for the comparison harness.
     */
    meterProps?: React.HTMLAttributes<HTMLDivElement> & { [key: `data-${string}`]: string | undefined };
}

/** Clamp a value to [min, max]. */
function clamp(val: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, val));
}

/**
 * Linear progress bar. Indeterminate by default (omit `value`).
 *
 * ```tsx
 * // Indeterminate (full bar, animated stripes)
 * <ProgressBar />
 * <ProgressBar intent="primary" />
 *
 * // Determinate (frozen at 60%)
 * <ProgressBar value={0.6} intent="success" />
 *
 * // No stripes or animation
 * <ProgressBar value={0.4} stripes={false} animate={false} />
 * ```
 */
export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(function ProgressBar(
    {
        value,
        intent = "none",
        stripes = true,
        animate = true,
        className,
        meterProps,
        ...htmlProps
    },
    ref,
) {
    const isDeterminate = value != null;
    const percent = isDeterminate ? 100 * clamp(value, 0, 1) : undefined;
    // Indeterminate (no value) → full-width meter, matching Blueprint's `.bp6-progress-meter`
    // default of `width: 100%`. A literal string keeps this out of Tailwind's @theme tree-shaking.
    // Without it the absolutely-positioned meter has no width and collapses to 0px (blank bar).
    const width = percent != null ? `${percent}%` : "100%";

    // a11y: aria-valuenow only when determinate, rounded to nearest integer per Blueprint.
    const ariaValueNow = percent != null ? Math.round(percent) : undefined;

    // Meter background-color classes — intent overrides the default gray. Arbitrary
    // values reference the intent *rest* seed var (Blueprint $pt-intent-colors) so the
    // meter re-tints with the theme. Always-emitted; seed vars kept alive elsewhere.
    const meterBgClass =
        intent === "primary"
            ? "bg-[var(--color-primary)]"
            : intent === "success"
              ? "bg-[var(--color-success)]"
              : intent === "warning"
                ? "bg-[var(--color-warning)]"
                : intent === "danger"
                  ? "bg-[var(--color-danger)]"
                  : // "none" — default: rgba(gray1,0.8) light, gray3 dark
                    "bg-[rgba(95,107,124,0.8)] dark:bg-[#8f99a8]";

    // Stripe animation: only when both stripes=true and animate=true.
    // Blueprint: animation: linear-progress-bar-stripes 300ms (= dur*3) linear infinite reverse
    const showStripes = stripes;
    const showAnimation = stripes && animate;

    return (
        <div
            ref={ref}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={ariaValueNow}
            className={cn(
                // Track: block, relative, overflow:hidden, w:100%, h:8px, border-radius:40px
                "relative block h-2 w-full overflow-hidden rounded-[40px]",
                // Track background: rgba(gray1,0.2) light / rgba(black,0.5) dark
                "bg-[rgba(95,107,124,0.2)] dark:bg-[rgba(17,20,24,0.5)]",
                className,
            )}
            {...htmlProps}
        >
            <div
                className={cn(
                    // Meter: absolute, full height, border-radius:40px
                    "absolute h-full rounded-[40px]",
                    // Transition: width 200ms ease (= $pt-transition-duration*2 ease)
                    "transition-[width] duration-200 ease-linear",
                    // Meter background-color (intent or default gray)
                    meterBgClass,
                    // Stripes: background-image linear-gradient when stripes enabled
                    // Background-size: 30px 30px (= $pt-spacing*7.5 = 4px*7.5)
                    showStripes
                        ? "[background-image:linear-gradient(-45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%)] [background-size:30px_30px]"
                        : "",
                    // Animation: only when stripes AND animate
                    showAnimation
                        ? "[animation:bp-progress-bar-stripes_300ms_linear_infinite_reverse]"
                        : "",
                )}
                style={{ width }}
                {...meterProps}
            />
        </div>
    );
});
