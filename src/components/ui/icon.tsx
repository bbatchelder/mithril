import { forwardRef } from "react";

import { cn } from "@/lib/utils";
import type { Intent } from "@/lib/types";
import type { IconGlyph, IconName } from "./icons";
import { getRegisteredGlyph } from "./icons/registry";

export type { IconGlyph, IconName };

export type IconIntent = Intent;

/**
 * An icon slot prop: an icon-name string (autocompleted from the Blueprint set), a
 * glyph object (`import { add } from ".../icons"` — the tree-shaking form), or a
 * custom element. Mirrors Blueprint's `IconName | MaybeElement`.
 *
 * The union is built from `IconName | IconGlyph | React.ReactElement`, NOT
 * `... | React.ReactNode`: `ReactNode` already includes `string`, so unioning it
 * would collapse the whole type back to `ReactNode` and kill `IconName` autocomplete.
 * `ReactElement` excludes `string`, keeping name suggestions while still accepting any
 * element. `false`/`null` are allowed so `cond && <Icon/>` and explicit suppression
 * type-check.
 */
export type IconProp = IconName | IconGlyph | React.ReactElement | false | null;

export interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
    /**
     * The glyph to render — either an icon-name string (resolved through the
     * registry; see `registerIcons`) or a glyph object imported from `./icons`
     * (`import { add } from ".../icons"`), which tree-shakes to just that glyph.
     */
    icon: IconName | IconGlyph;
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

    // A glyph object renders directly (the tree-shaking form). A string name is
    // resolved through the registry, which a consumer populates via `registerIcons`
    // (either `ICON_GLYPHS` wholesale, or a selective subset). An unregistered name
    // resolves to `undefined` — warn in dev and render an empty (sized) span rather
    // than crash, so a missing registration is visible but non-fatal.
    const glyph = typeof icon === "string" ? getRegisteredGlyph(icon) : icon;
    if (!glyph && import.meta.env?.DEV) {
        console.warn(
            `<Icon icon="${icon}" />: glyph not registered. Import it from "./icons" and ` +
                `pass the object (\`icon={${icon}}\`), or call registerIcons(...) to enable the string form.`,
        );
    }
    const paths = glyph ? glyph[gridSize] : [];

    // Unique id for aria-labelledby when title is provided. Object glyphs have no
    // name, so fall back to a stable token.
    const iconKey = typeof icon === "string" ? icon : "glyph";
    const titleId = title ? `icon-title-${iconKey}-${size}` : undefined;

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
                data-icon={typeof icon === "string" ? icon : undefined}
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

/**
 * Resolve an icon-slot prop to a renderable node.
 *
 * Lets every icon-accepting component take a bare icon name (`icon="add"`) or an
 * imported glyph object (`icon={add}`) without the caller importing `<Icon>`: a
 * string or glyph object is rendered as `<Icon>`, anything else (an element, or
 * `false`/`null` for "no icon") is returned as-is. Hosts pass `iconProps` to control
 * the rendered case's size/color (e.g. `{ className: "!text-current" }` so the glyph
 * inherits a colored button's text color instead of Icon's default `text-foreground`).
 */
export function resolveIcon(
    icon: IconProp | undefined,
    iconProps?: Omit<IconProps, "icon">,
): React.ReactNode {
    if (typeof icon === "string" || isIconGlyph(icon)) {
        return <Icon icon={icon} {...iconProps} />;
    }
    return icon;
}

/**
 * Narrow an icon-slot value to a glyph object. Glyphs carry the `16`/`20` grid path
 * arrays; a `React.ReactElement` (the other object case) does not — distinguishing
 * them keeps the prop union (`IconName | IconGlyph | ReactElement`) unambiguous.
 * Exported for hosts (like Alert) that render the icon slot themselves rather than
 * via `resolveIcon`.
 */
export function isIconGlyph(icon: IconProp | undefined): icon is IconGlyph {
    return typeof icon === "object" && icon !== null && "16" in icon && "20" in icon;
}
