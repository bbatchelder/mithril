import { forwardRef } from "react";

import { cn } from "@/lib/utils";
import { ICON_GLYPHS, type IconName } from "./icons";

export type { IconName };

export type IconIntent = "none" | "primary" | "success" | "warning" | "danger";

export interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
    /** Glyph name (from the vendored Blueprint subset). */
    icon: IconName;
    /**
     * Pixel size of the icon. Sizes ≥ 20 use the 20-grid paths and a 0 0 20 20
     * viewBox; sizes < 20 use the 16-grid paths and a 0 0 16 16 viewBox —
     * mirroring Blueprint's `svgIconContainer.tsx`.
     * @default 16
     */
    size?: number;
    /**
     * Intent color applied as `color` on the icon span (SVG inherits via `fill: currentcolor`).
     *   - "none"    → inherits from parent context (no explicit color set, same as Blueprint)
     *   - intents   → intent text color token (light: intent-2; dark: intent-5)
     * @default "none"
     */
    intent?: IconIntent;
    /**
     * Accessible title rendered as a `<title>` element inside the SVG.
     * When provided the SVG gets `role="img"` and `aria-labelledby`; when omitted
     * the icon is purely decorative (`aria-hidden="true"`).
     */
    title?: string;
    /**
     * Additional props forwarded to the inner `<svg>` element.
     */
    svgProps?: React.SVGAttributes<SVGSVGElement>;
}

/**
 * Pixel-faithful Blueprint icon: SVG container + vendored path data.
 *
 * Color behavior (mirrors Blueprint's SVG icon wrapper):
 *   - no intent → inherits `color` from parent; SVG fills via `fill: currentcolor`
 *   - with intent → explicit intent text color on the span wrapper (blue2/green2/…
 *     in light; blue5/green5/… in dark — same as `--intent-*-text` tokens)
 *
 * Size: size < 20 → 16-grid paths + `0 0 16 16` viewBox;
 *       size ≥ 20 → 20-grid paths + `0 0 20 20` viewBox (Blueprint's rule).
 *
 * To add glyphs: see `src/components/ui/icons/index.ts`.
 *
 * @see https://blueprintjs.com/docs/#core/components/icon
 */
export const Icon = forwardRef<HTMLSpanElement, IconProps>(function Icon(
    { icon, size = 16, intent = "none", title, className, svgProps, ...spanProps },
    ref,
) {
    const isLarge = size >= 20;
    const gridSize = isLarge ? 20 : 16;
    const viewBox = `0 0 ${gridSize} ${gridSize}`;
    const paths = ICON_GLYPHS[icon][gridSize];

    // Unique id for aria-labelledby when title is provided
    const titleId = title ? `icon-title-${icon}-${size}` : undefined;

    // Intent → Tailwind color class applied to the SPAN wrapper (not the SVG).
    // SVG uses `fill: currentcolor` and inherits. This mirrors Blueprint's
    // `.bp6-intent-*` which sets `color:` on the span, not `fill:` on the SVG.
    //
    // Color mapping (mirrors Blueprint's `$pt-intent-text-colors`):
    //   light: blue-2 / green-2 / orange-2 / red-2
    //   dark:  blue-5 / green-5 / orange-5 / red-5
    //
    // NOTE: These are different from `--intent-*-text` which uses color-mix for
    // outlined buttons. Icon intent colors follow Blueprint's simpler palette tiers.
    //
    // "none" → `text-foreground` so SVG inherits the current theme's foreground
    //   color (dark-gray-1 in light, light-gray-5 in dark). Without this, dark mode
    //   icons would inherit `body { color: var(--foreground) }` which resolves from
    //   `:root` (light) — same fix as Card's `text-foreground` class.
    const intentColor: Record<IconIntent, string> = {
        none: "text-foreground",
        primary: "text-blue-2 dark:text-blue-5",
        success: "text-green-2 dark:text-green-5",
        warning: "text-orange-2 dark:text-orange-5",
        danger: "text-red-2 dark:text-red-5",
    };

    return (
        // Outer span mirrors Blueprint's `.bp6-icon` wrapper:
        //   display:inline-block, flex:0 0 auto, vertical-align:text-bottom.
        // `color` is inherited from parent when no intent is set, or overridden
        // by intentColor. The SVG picks it up via fill:currentcolor.
        // HTML attributes (including data-compare, aria-*, etc.) land here — same
        // as Blueprint, which spreads htmlProps on the outer span.
        <span
            ref={ref}
            aria-hidden={title ? undefined : true}
            {...spanProps}
            className={cn(
                // Blueprint's .bp6-icon: display:inline-block, flex:0 0 auto,
                // vertical-align:text-bottom, min-width unset (auto).
                // `min-w-[auto]` overrides Tailwind v4's preflight `min-width:0` reset.
                "inline-block shrink-0 min-w-[auto] align-text-bottom",
                intentColor[intent],
                className,
            )}
        >
            <svg
                data-icon={icon}
                viewBox={viewBox}
                width={size}
                height={size}
                role={title ? "img" : undefined}
                aria-labelledby={titleId}
                className="block fill-current"
                {...svgProps}
            >
                {title && <title id={titleId}>{title}</title>}
                {paths.map((d, i) => (
                    <path key={i} d={d} fillRule="evenodd" />
                ))}
            </svg>
        </span>
    );
});
