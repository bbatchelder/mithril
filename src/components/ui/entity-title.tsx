import { createElement, forwardRef } from "react";

import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./icon";
import { document as documentIcon } from "./icons";
import { skeletonClass } from "./skeleton";

/**
 * EntityTitle component — pixel-faithful Blueprint EntityTitle with a clean modern API.
 *
 * Blueprint spec (`_entity-title.scss`):
 *
 *   Root (.bp6-entity-title):
 *     display: flex
 *     align-items: center
 *     min-width: 0
 *     gap: $pt-spacing * 2 (8px) for heading=text/h4/h5/h6
 *     gap: $pt-spacing * 4 (16px) for heading=h1/h2/h3
 *
 *   Icon container (.bp6-entity-title-icon-container):
 *     when has-subtitle: align-self: flex-start
 *     when no-subtitle: align-items: center; display: flex
 *     Icon is always 16px (standard) for text/h4/h5/h6 headings.
 *     For h1-h3, the icon is placed in a flex container with height = heading's line-height
 *     to center it visually within the taller heading.
 *
 *   Text container (.bp6-entity-title-text):
 *     display: flex; flex-direction: column
 *     flex-grow: 1 when fill
 *
 *   Title-and-tags row (.bp6-entity-title-title-and-tags):
 *     display: flex; align-items: center; flex-direction: row
 *     gap: $pt-spacing (4px)
 *
 *   Tags container (.bp6-entity-title-tags-container):
 *     display: flex; gap: $pt-spacing * 0.5 (2px); margin-left: $pt-spacing (4px)
 *
 *   Title (.bp6-entity-title-title):
 *     margin-bottom: 0; min-width: 0; overflow-wrap: break-word
 *     flex-grow: 1 when fill
 *
 *   Subtitle (.bp6-entity-title-subtitle):
 *     font-size: $pt-font-size-small (12px) for h4/h5/h6/text headings
 *     font-size: $pt-font-size (14px) for h1/h2/h3 headings
 *     margin-top: $pt-spacing * 0.5 (2px)
 *     text-muted color
 *
 *   Icon container size for h1-h3: height = line-height of heading (40px/32px/25px)
 *   Icon container for h4-h6: display:flex; align-items:center; height = line-height (21px/19px/16px)
 *
 * @see https://blueprintjs.com/docs/#core/components/entity-title
 */

/**
 * Valid heading size levels. Maps to Blueprint's H1–H6 + Text (default body) hierarchy.
 * - "text" (default): renders a Body Text heading (14px / 1.28581)
 * - "h1"–"h6": renders a semantic heading at Blueprint's exact sizes
 */
export type EntityTitleSize = "text" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

// ── Per-size metrics ─────────────────────────────────────────────────────────
// Derived from Blueprint's $headings map and _entity-title.scss rules.

/**
 * Gap between icon and text block.
 * h1/h2/h3 → 16px ($pt-spacing * 4), all others → 8px ($pt-spacing * 2).
 */
const ROOT_GAP: Record<EntityTitleSize, string> = {
    text: "gap-2",   // 8px
    h1:   "gap-4",   // 16px
    h2:   "gap-4",   // 16px
    h3:   "gap-4",   // 16px
    h4:   "gap-2",   // 8px
    h5:   "gap-2",   // 8px
    h6:   "gap-2",   // 8px
};

/**
 * Icon container height for each heading level — matches the heading's line-height
 * so the icon is vertically centred against the title text.
 * "text" → no explicit height needed (aligned by flex align-items:center on root).
 */
const ICON_CONTAINER_HEIGHT: Record<EntityTitleSize, string> = {
    text: "",           // natural — root align-items:center handles it
    h1:   "h-[40px]",  // line-height 40px
    h2:   "h-[32px]",  // line-height 32px
    h3:   "h-[25px]",  // line-height 25px
    h4:   "h-[21px]",  // line-height 21px
    h5:   "h-[19px]",  // line-height 19px
    h6:   "h-[16px]",  // line-height 16px
};

/**
 * Subtitle font-size class.
 * h1/h2/h3 → 14px ($pt-font-size), h4/h5/h6/text → 12px ($pt-font-size-small).
 */
const SUBTITLE_SIZE: Record<EntityTitleSize, string> = {
    text: "text-[12px]",  // $pt-font-size-small
    h1:   "text-[14px]",  // $pt-font-size
    h2:   "text-[14px]",
    h3:   "text-[14px]",
    h4:   "text-[12px]",  // $pt-font-size-small
    h5:   "text-[12px]",
    h6:   "text-[12px]",
};

/**
 * Icon size in pixels — Blueprint always uses the standard 16px icon for entity titles.
 * For h1/h2/h3, a larger icon (20px) is conventional but Blueprint's spec uses 16px
 * for icon size itself; the container height is just set to match the heading line-height.
 * We use 20px for h1/h2/h3 to give better visual proportion (slightly larger than body
 * headings — same as Blueprint's rendered output which is 20px for H1/H2/H3 headings).
 */
const ICON_SIZE: Record<EntityTitleSize, number> = {
    text: 16,
    h1:   20,
    h2:   20,
    h3:   20,
    h4:   16,
    h5:   16,
    h6:   16,
};

export interface EntityTitleProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
    /**
     * The primary title content (required). Rendered as the heading text.
     */
    title: React.ReactNode;

    /**
     * Optional subtitle rendered below the title in muted text.
     * Font size depends on the `size` prop (14px for h1–h3, 12px for others).
     */
    subtitle?: React.ReactNode;

    /**
     * Name of a Blueprint icon, or a custom ReactNode (e.g. an avatar), rendered
     * to the left of the title block.
     */
    icon?: IconName | React.ReactNode;

    /**
     * Extra content rendered to the right of the title (e.g. `<Tag>` components).
     * Appears in the title row, after the title text.
     */
    tags?: React.ReactNode;

    /**
     * Heading size level. Controls the rendered element + font size, and scales
     * the icon and subtitle font-size accordingly.
     *
     *   "text" (default) — Blueprint body Text (14px body, no heading element)
     *   "h1"–"h6"        — Semantic headings at Blueprint's exact sizes (h1=36px…h6=14px)
     *
     * @default "text"
     */
    size?: EntityTitleSize;

    /**
     * Override the HTML element rendered for the title. Defaults to the semantic
     * element for the `size` prop ("div" for "text", "h1"–"h6" for heading sizes).
     */
    as?: keyof React.JSX.IntrinsicElements;

    /**
     * Whether the title text (and subtitle) should be ellipsized on overflow.
     * @default false
     */
    ellipsize?: boolean;

    /**
     * Whether the component should expand to fill its container width.
     * @default false
     */
    fill?: boolean;

    /**
     * Whether to render skeleton placeholders for loading state.
     * @default false
     */
    loading?: boolean;

    /**
     * If specified, wraps the title in an anchor (`<a>`) pointing to this URL.
     * Opens in a new tab.
     */
    titleURL?: string;
}

// Default HTML tag per size level
const DEFAULT_TITLE_TAG: Record<EntityTitleSize, keyof React.JSX.IntrinsicElements> = {
    text: "div",
    h1: "h1",
    h2: "h2",
    h3: "h3",
    h4: "h4",
    h5: "h5",
    h6: "h6",
};

// Title class per size (font-size / line-height / weight) — mirrors Blueprint's $headings map
const TITLE_CLASS: Record<EntityTitleSize, string> = {
    text: "text-[14px] leading-[1.28581] font-normal",
    h1:   "text-[36px] leading-[40px] font-semibold",
    h2:   "text-[28px] leading-[32px] font-semibold",
    h3:   "text-[22px] leading-[25px] font-semibold",
    h4:   "text-[18px] leading-[21px] font-semibold",
    h5:   "text-[16px] leading-[19px] font-semibold",
    h6:   "text-[14px] leading-[16px] font-semibold",
};

/**
 * EntityTitle — a structured heading block with optional icon, subtitle, and tags.
 *
 * Replicates Blueprint's `.bp6-entity-title` exactly: flex row, icon left,
 * title+subtitle column, tags/right content in the title row.
 *
 * Quick reference:
 *   <EntityTitle title="Project Alpha" />
 *   <EntityTitle title="Project Alpha" icon="folder-close" subtitle="Last updated 2h ago" />
 *   <EntityTitle title="Project Alpha" icon="folder-close" subtitle="2h ago" tags={<Tag>Active</Tag>} size="h3" />
 *   <EntityTitle title="Loading..." loading />
 */
export const EntityTitle = forwardRef<HTMLDivElement, EntityTitleProps>(function EntityTitle(
    {
        title,
        subtitle,
        icon,
        tags,
        size = "text",
        as,
        ellipsize = false,
        fill = false,
        loading = false,
        titleURL,
        className,
        ...htmlProps
    },
    ref,
) {
    const hasSubtitle = subtitle != null;
    const iconSize = ICON_SIZE[size];

    // ── Render icon ───────────────────────────────────────────────────────────
    // Blueprint checks if icon is a string (IconName) or ReactNode (MaybeElement).
    // We detect by checking if it's a string (→ use our Icon component) or otherwise
    // pass it through as-is (avatar, custom ReactNode, etc.).
    let iconNode: React.ReactNode = null;
    if (icon != null) {
        if (loading) {
            // Blueprint uses a "square" icon as a skeleton placeholder; we use "document"
            // which has similar dimensions and is in our icon set.
            iconNode = (
                <Icon
                    icon={documentIcon}
                    size={iconSize}
                    className={cn("text-foreground-muted", skeletonClass)}
                    aria-hidden
                    tabIndex={-1}
                />
            );
        } else if (typeof icon === "string") {
            iconNode = (
                <Icon
                    icon={icon as IconName}
                    size={iconSize}
                    className="text-foreground-muted"
                    aria-hidden
                    tabIndex={-1}
                />
            );
        } else {
            // Custom ReactNode (avatar, etc.)
            iconNode = icon;
        }
    }

    // ── Render title ──────────────────────────────────────────────────────────
    const titleTag = as ?? DEFAULT_TITLE_TAG[size];
    const titleContent = titleURL != null ? (
        <a href={titleURL} target="_blank" rel="noreferrer">
            {title}
        </a>
    ) : title;

    const titleElement = createElement(
        titleTag,
        {
            className: cn(
                // Blueprint: margin-bottom:0, min-width:0, overflow-wrap:break-word
                "mb-0 min-w-0 break-words",
                // Text color — explicit so dark scope resolves correctly
                "text-foreground",
                // Per-size typography
                TITLE_CLASS[size],
                // Ellipsize
                ellipsize && "overflow-hidden text-ellipsis whitespace-nowrap",
                // Fill: flex-grow:1
                fill && "grow",
                // Loading skeleton
                loading && skeletonClass,
            ),
        },
        titleContent,
    );

    // ── Render subtitle ───────────────────────────────────────────────────────
    const subtitleElement = hasSubtitle ? (
        <div
            className={cn(
                // Blueprint: .bp6-text-muted color + entity-title-subtitle
                "text-foreground-muted",
                // font-size depends on heading level (14px for h1/h2/h3, 12px otherwise)
                SUBTITLE_SIZE[size],
                // line-height: Blueprint uses the default line-height (1.28581) for body text
                "leading-[1.28581]",
                // margin-top: $pt-spacing * 0.5 = 2px
                "mt-[2px]",
                // Ellipsize
                ellipsize && "overflow-hidden text-ellipsis whitespace-nowrap",
                // Loading skeleton
                loading && skeletonClass,
            )}
        >
            {subtitle}
        </div>
    ) : null;

    // ── Icon container ────────────────────────────────────────────────────────
    // Blueprint:
    //   when has-subtitle: align-self: flex-start (pin icon to top)
    //   when no-subtitle:  display:flex; align-items:center (vertically center icon)
    //   For h1/h2/h3/h4/h5/h6: set height = heading line-height to keep icon aligned with text baseline.
    const iconContainerElement = iconNode != null ? (
        <div
            className={cn(
                // When has subtitle, pin to top; otherwise center with flex
                hasSubtitle
                    ? "self-start"
                    : "flex items-center",
                // For all heading sizes, set container height = heading line-height
                // so icon is vertically centred against the title text
                ICON_CONTAINER_HEIGHT[size],
                // For all sizes, display:flex and align-items:center
                "flex items-center",
            )}
        >
            {iconNode}
        </div>
    ) : null;

    return (
        <div
            ref={ref}
            {...htmlProps}
            className={cn(
                // Root: display:flex, align-items:center, min-width:0
                "flex items-center min-w-0",
                // Gap between icon and text block (size-dependent)
                ROOT_GAP[size],
                // Fill: width:100%
                fill && "w-full",
                // Ellipsize overflow hidden on root
                ellipsize && "overflow-hidden",
                className,
            )}
        >
            {iconContainerElement}

            {/* Text block: flex column, grows when fill */}
            <div
                className={cn(
                    "flex flex-col",
                    fill && "grow",
                    // Ellipsize: overflow hidden on text block
                    ellipsize && "overflow-hidden",
                )}
            >
                {/* Title + tags row */}
                <div
                    className={cn(
                        // Blueprint: display:flex; align-items:center; flex-direction:row; gap:$pt-spacing (4px)
                        "flex items-center flex-row gap-1",
                        loading && skeletonClass,
                    )}
                >
                    {titleElement}
                    {tags != null && (
                        // Tags container: display:flex; gap: $pt-spacing*0.5 (2px); margin-left: $pt-spacing (4px)
                        <div className="flex gap-[2px] ml-[4px]">
                            {tags}
                        </div>
                    )}
                </div>

                {subtitleElement}
            </div>
        </div>
    );
});

EntityTitle.displayName = "EntityTitle";
