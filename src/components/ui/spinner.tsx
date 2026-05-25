import { createElement, forwardRef } from "react";

import { cn } from "@/lib/utils";

/**
 * Spinner component — pixel-faithful reimplementation of Blueprint's `bp6-spinner`.
 *
 * Blueprint spec:
 *   DOM: outer .bp6-spinner > .bp6-spinner-animation > svg > path.track + path.head
 *   Track: stroke rgba(gray1, 0.2) light / rgba(black, 0.5) dark
 *   Head:  stroke rgba(gray1, 0.8) light / gray3 dark; stroke-linecap: round
 *   Intent: overrides head stroke with the intent color
 *   Indeterminate: head = 25% arc (dashoffset = 280 - 0.25*280 = 210)
 *   Determinate: dashoffset = 280 - value*280; animation: none on inner wrapper
 *   a11y: role="progressbar", aria-valuemin/max=0/100, aria-valuenow when determinate
 *
 * Blueprint palette values (sourced from design-tokens/palette.tokens.json):
 *   gray1  = #5f6b7c → rgba(95, 107, 124, …)
 *   gray3  = #8f99a8
 *   black  = #111418 → rgba(17, 20, 24, …)
 *
 * Stroke colors used as literal arbitrary-value Tailwind classes:
 *   track light → stroke-[rgba(95,107,124,0.2)]
 *   track dark  → dark:stroke-[rgba(17,20,24,0.5)]
 *   head light  → stroke-[rgba(95,107,124,0.8)]
 *   head dark   → dark:stroke-[#8f99a8]
 *   primary     → stroke-[#2d72d2]  (blue3)
 *   success     → stroke-[#238551]  (green3)
 *   warning     → stroke-[#c87619]  (orange3)
 *   danger      → stroke-[#cd4246]  (red3)
 *
 * IMPORTANT — Tailwind v4 tree-shakes @theme tokens that are only accessed via
 * runtime var() in inline styles. All stroke colors use LITERAL arbitrary-value
 * classes (not var() refs) so they are always emitted.
 *
 * @see https://blueprintjs.com/docs/#core/components/spinner
 */

/** SVG circle track path — a 45px-radius circle at center (50,50), traversed twice. */
const SPINNER_TRACK = "M 50,50 m 0,-45 a 45,45 0 1 1 0,90 a 45,45 0 1 1 0,-90";

/** Unitless path length used for stroke-dash* attributes. */
const PATH_LENGTH = 280;

/** Minimum allowed spinner size in pixels. */
const MIN_SIZE = 10;

/**
 * Named size constants, matching Blueprint's SpinnerSize enum.
 *   SpinnerSize.SMALL    = 20
 *   SpinnerSize.STANDARD = 50  (default)
 *   SpinnerSize.LARGE    = 100
 */
export const SpinnerSize = {
    SMALL: 20,
    STANDARD: 50,
    LARGE: 100,
} as const;

export type SpinnerIntent = "none" | "primary" | "success" | "warning" | "danger";

export interface SpinnerProps extends React.HTMLAttributes<HTMLElement> {
    /**
     * Width and height of the spinner in pixels. Must be ≥ 10.
     * Named constants available: SpinnerSize.SMALL (20), .STANDARD (50, default), .LARGE (100).
     * @default 50
     */
    size?: number;

    /**
     * A value between 0 and 1 (inclusive) representing progress.
     * - Omit (or undefined) → indeterminate: head arcs 25%, animation rotates.
     * - Provide → determinate: head arcs value*100%, animation frozen (no-spin).
     * Values outside [0,1] are clamped.
     */
    value?: number;

    /**
     * Intent color applied to the head path stroke.
     * - "none" → default gray head (theme-aware)
     * - others → intent color (primary=blue3, success=green3, warning=orange3, danger=red3)
     * @default "none"
     */
    intent?: SpinnerIntent;

    /**
     * Override the rendered HTML wrapper tag.
     * Use an SVG element (e.g. "g") when rendering inside an <svg>.
     * @default "div"
     */
    as?: keyof React.JSX.IntrinsicElements;

    /**
     * Alias for `as` (Blueprint API compat). `as` takes precedence if both are provided.
     * @default "div"
     */
    tagName?: keyof React.JSX.IntrinsicElements;

    /**
     * Additional props forwarded to the inner track <path> element.
     * Use to add `data-compare` for the comparison harness.
     */
    trackProps?: React.SVGAttributes<SVGPathElement> & { [key: `data-${string}`]: string | undefined };

    /**
     * Additional props forwarded to the inner head <path> element.
     * Use to add `data-compare` for the comparison harness.
     */
    headProps?: React.SVGAttributes<SVGPathElement> & { [key: `data-${string}`]: string | undefined };
}

/** Clamp a value to [min, max]. */
function clamp(val: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, val));
}

/**
 * Compute the SVG viewBox such that the stroked track sits exactly at the frame edge.
 * Blueprint: radius = 45 + strokeWidth/2; viewBox spans [50-r, 50-r, r*2, r*2].
 */
function getViewBox(strokeWidth: number): string {
    const r = 45 + strokeWidth / 2;
    const x = (50 - r).toFixed(2);
    const w = (r * 2).toFixed(2);
    return `${x} ${x} ${w} ${w}`;
}

/**
 * Circular progress indicator. Indeterminate by default (omit `value`).
 *
 * ```tsx
 * // Indeterminate (spinning)
 * <Spinner />
 * <Spinner size={SpinnerSize.SMALL} intent="primary" />
 *
 * // Determinate (frozen at 60%)
 * <Spinner value={0.6} size={SpinnerSize.LARGE} />
 * ```
 */
export const Spinner = forwardRef<HTMLElement, SpinnerProps>(function Spinner(
    {
        size = SpinnerSize.STANDARD,
        value,
        intent = "none",
        as,
        tagName,
        className,
        trackProps,
        headProps,
        ...htmlProps
    },
    ref,
) {
    const tag = as ?? tagName ?? "div";

    // Enforce minimum size.
    const sizePx = Math.max(MIN_SIZE, size);

    // stroke-width formula matches Blueprint exactly:
    //   Math.min(16, (4 * 100) / sizePx)
    // → small(20): 16, standard(50): 8, large(100): 4.
    const strokeWidth = Math.min(16, (4 * 100) / sizePx);

    // stroke-dashoffset: full circle (280) minus the filled arc.
    // indeterminate → 25% arc; determinate → clamp(value,0,1)*280.
    const strokeDashoffset =
        PATH_LENGTH - PATH_LENGTH * (value == null ? 0.25 : clamp(value, 0, 1));

    // Determinate spinners freeze the animation.
    const isDeterminate = value != null;

    // a11y: aria-valuenow only when determinate.
    const ariaValueNow = isDeterminate ? value * 100 : undefined;

    // Head stroke classes — intent overrides the default gray.
    // All classes are literal strings (no runtime var() refs) to satisfy Tailwind v4
    // tree-shaking rules. Arbitrary-value classes are always emitted.
    const headStrokeClass =
        intent === "primary"
            ? "stroke-[#2d72d2]"
            : intent === "success"
              ? "stroke-[#238551]"
              : intent === "warning"
                ? "stroke-[#c87619]"
                : intent === "danger"
                  ? "stroke-[#cd4246]"
                  : // "none" — default: gray1@80% light, gray3 dark
                    "stroke-[rgba(95,107,124,0.8)] dark:stroke-[#8f99a8]";

    return createElement(
        tag,
        {
            "aria-label": "loading",
            "aria-valuemax": 100,
            "aria-valuemin": 0,
            "aria-valuenow": ariaValueNow,
            role: "progressbar",
            ref,
            className: cn(
                // Outer container: flex centering + overflow:visible for edge circles.
                "flex items-center justify-center overflow-visible align-middle",
                className,
            ),
            ...htmlProps,
        },
        createElement(
            tag,
            {
                // Animation wrapper — isolated from the outer display layout.
                // Blueprint rotates this inner element; SVG itself stays a static block.
                className: isDeterminate
                    ? // Determinate: no spin.
                      "[animation:none]"
                    : // Indeterminate: rotate 360° over 500ms (5 × $pt-transition-duration=100ms).
                      "[animation:bp-spinner-spin_500ms_linear_infinite]",
            },
            <svg
                width={sizePx}
                height={sizePx}
                strokeWidth={strokeWidth.toFixed(2)}
                viewBox={getViewBox(strokeWidth)}
                style={{ display: "block" }}
            >
                {/* Track — full circle, dim color. fill-opacity:0 so only stroke shows. */}
                <path
                    d={SPINNER_TRACK}
                    // track light: rgba(gray1, 0.2) = rgba(95,107,124,0.2)
                    // track dark:  rgba(black, 0.5) = rgba(17,20,24,0.5)
                    className="[fill-opacity:0] stroke-[rgba(95,107,124,0.2)] dark:stroke-[rgba(17,20,24,0.5)]"
                    {...trackProps}
                />
                {/* Head — arc showing progress, with rounded linecap. */}
                <path
                    d={SPINNER_TRACK}
                    pathLength={PATH_LENGTH}
                    strokeDasharray={`${PATH_LENGTH} ${PATH_LENGTH}`}
                    strokeDashoffset={strokeDashoffset}
                    className={cn(
                        "[fill-opacity:0]",
                        // Smooth dashoffset transitions for determinate value updates.
                        "transition-[stroke-dashoffset] duration-[200ms] ease-[cubic-bezier(0.4,1,0.75,0.9)]",
                        headStrokeClass,
                    )}
                    style={{
                        strokeLinecap: "round",
                        transformOrigin: "center",
                    }}
                    {...headProps}
                />
            </svg>,
        ),
    );
});
