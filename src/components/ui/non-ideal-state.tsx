import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./icon";

/**
 * NonIdealState component — pixel-faithful Blueprint NonIdealState with a clean modern API.
 *
 * Blueprint spec (`_non-ideal-state.scss`):
 *
 *   Root (.bp6-non-ideal-state):
 *     display: flex; flex-direction: column; align-items: center
 *     justify-content: center; text-align: center
 *     height: 100%; width: 100%
 *     color: $pt-text-color-muted (gray-1 = #5f6b7c light, gray-4 = #abb3bf dark)
 *     gap: $pt-spacing * 5 = 20px (via margin-bottom on children in Blueprint, we use gap)
 *
 *   Children max-width: $pt-spacing * 100 = 400px
 *
 *   .bp6-non-ideal-state-visual:
 *     color: $gray3 = #8f99a8 (muted icon color, not theme-aware in Blueprint's stylesheet)
 *
 *   .bp6-heading inside non-ideal-state:
 *     color: $pt-text-color-muted (same as root)
 *     line-height: $pt-spacing * 5 = 20px
 *     margin-bottom: $pt-spacing * 2 = 8px
 *     (margin-bottom: 0 when it's the only child)
 *
 *   Horizontal layout (.bp6-non-ideal-state-horizontal):
 *     flex-direction: row; text-align: left
 *     gap: $pt-spacing * 5 = 20px
 *
 *   Icon sizes (NonIdealStateIconSize):
 *     STANDARD: IconSize.STANDARD * 3 = 16 * 3 = 48px
 *     SMALL:    IconSize.STANDARD * 2 = 16 * 2 = 32px
 *     EXTRA_SMALL: IconSize.LARGE = 20px
 *
 * @see https://blueprintjs.com/docs/#core/components/non-ideal-state
 */

/** Icon size presets matching Blueprint's NonIdealStateIconSize enum. */
export const NonIdealStateIconSize = {
    STANDARD: 48,
    SMALL: 32,
    EXTRA_SMALL: 20,
} as const;
export type NonIdealStateIconSizeValue = (typeof NonIdealStateIconSize)[keyof typeof NonIdealStateIconSize];

const nonIdealStateVariants = cva(
    [
        // Root: flex column, centered, full dimensions, centered text
        "flex flex-col items-center justify-center text-center",
        "h-full w-full",
        // Muted text color — gray-1 light (#5f6b7c), gray-4 dark (#abb3bf)
        "text-gray-1 dark:text-gray-4",
        // Gap between children: $pt-spacing * 5 = 20px
        "gap-5",
    ],
    {
        variants: {
            layout: {
                vertical: "flex-col text-center",
                horizontal: "flex-row text-left",
            },
        },
        defaultVariants: {
            layout: "vertical",
        },
    },
);

export interface NonIdealStateProps
    extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
        VariantProps<typeof nonIdealStateVariants> {
    /**
     * An icon name or arbitrary ReactNode rendered as the primary visual above the title.
     * When a string icon name is provided, it's rendered at `iconSize` with a muted gray color.
     */
    icon?: IconName | React.ReactNode;

    /**
     * How large the icon visual should be. Accepts a preset or any pixel value.
     * @default NonIdealStateIconSize.STANDARD (48)
     */
    iconSize?: NonIdealStateIconSizeValue | number;

    /**
     * Whether to render the icon with a muted style (gray-3 color = #8f99a8).
     * Blueprint defaults this to true.
     * @default true
     */
    iconMuted?: boolean;

    /**
     * The title of the non-ideal state. Rendered as a heading (H4 style).
     */
    title?: React.ReactNode;

    /**
     * A longer description of the non-ideal state. Rendered in muted body text below the title.
     * A string value will be wrapped in a div to preserve margins.
     */
    description?: React.ReactNode;

    /**
     * An action element (typically a Button) rendered after the description.
     */
    action?: React.ReactNode;

    /**
     * Component layout direction.
     * @default "vertical"
     */
    layout?: "vertical" | "horizontal";
}

/**
 * NonIdealState — an empty/error/placeholder state component.
 *
 * Renders a centered vertical (or horizontal) column with a large visual,
 * title heading, muted description, and optional action button.
 * Matches Blueprint's `.bp6-non-ideal-state` exactly.
 *
 * Quick reference:
 *   <NonIdealState icon="search" title="No results" description="Try a different query." action={<Button>Clear</Button>} />
 *   <NonIdealState icon="warning-sign" title="Error" description="Something went wrong." />
 *   <NonIdealState icon="folder-open" title="Empty folder" layout="horizontal" />
 */
export const NonIdealState = forwardRef<HTMLDivElement, NonIdealStateProps>(function NonIdealState(
    {
        icon,
        iconSize = NonIdealStateIconSize.STANDARD,
        iconMuted = true,
        title,
        description,
        action,
        layout = "vertical",
        className,
        children,
        ...htmlProps
    },
    ref,
) {
    // ── Visual (icon or custom ReactNode) ─────────────────────────────────────
    // Blueprint wraps the visual in .bp6-non-ideal-state-visual with:
    //   color: $gray3 = #8f99a8 (fixed, not theme-aware in Blueprint's stylesheet).
    // When iconMuted=true (default), Blueprint applies .bp6-icon-muted on the Icon.
    // The visual wrapper gets fontSize + lineHeight = iconSize (Blueprint inline styles).
    let visualNode: React.ReactNode = null;
    if (icon != null) {
        let iconContent: React.ReactNode;
        if (typeof icon === "string") {
            // String → Blueprint IconName — render our Icon component.
            // iconMuted=true → gray-3 (#8f99a8); iconMuted=false → inherit gray-1/gray-4 from root.
            iconContent = (
                <Icon
                    icon={icon as IconName}
                    size={iconSize}
                    // Blueprint's .bp6-non-ideal-state-visual sets color: $gray3 = #8f99a8.
                    // iconMuted=false means inherit from root (gray-1 / gray-4).
                    className={iconMuted ? "text-gray-3" : undefined}
                    aria-hidden={true}
                    tabIndex={-1}
                />
            );
        } else {
            // Arbitrary ReactNode (e.g. <Spinner />, custom image)
            iconContent = icon;
        }

        visualNode = (
            // .bp6-non-ideal-state-visual: color $gray3, fontSize + lineHeight = iconSize (inline)
            // We set color via text-gray-3 on the wrapper so ReactNode visuals also inherit it.
            <div
                className={cn(
                    // Blueprint: color: $gray3 = #8f99a8 on visual wrapper.
                    // iconMuted=false → inherit from parent (text-gray-1/dark:text-gray-4 on root).
                    iconMuted ? "text-gray-3" : undefined,
                    // max-width constraint from children rule: $pt-spacing * 100 = 400px
                    "max-w-[400px]",
                )}
                // Blueprint applies fontSize + lineHeight = iconSize as inline styles on the visual div.
                // We set this here to match exactly — this is NOT an @theme token so inline is correct.
                style={{ fontSize: iconSize, lineHeight: `${iconSize}px` }}
            >
                {iconContent}
            </div>
        );
    }

    // ── Text block (title + description) ─────────────────────────────────────
    // Blueprint wraps title + description in .bp6-non-ideal-state-text.
    // The heading (.bp6-heading / H4) gets:
    //   color: $pt-text-color-muted (same as root — gray-1/gray-4)
    //   line-height: $pt-spacing * 5 = 20px
    //   margin-bottom: $pt-spacing * 2 = 8px (0 when only child)
    let textNode: React.ReactNode = null;
    if (title != null || description != null) {
        const hasDescription = description != null;

        // Wrap raw string/number descriptions in a div (Blueprint uses ensureElement(description, "div"))
        const descriptionNode =
            description == null
                ? null
                : typeof description === "string" || typeof description === "number"
                ? <div>{description}</div>
                : description;

        textNode = (
            <div className="max-w-[400px]">
                {title != null && (
                    // Blueprint renders title as <H4> which is a .bp6-heading h4.
                    // Metrics: font-size 18px (h4), font-weight 600, line-height 20px ($pt-spacing*5),
                    //   margin-bottom: 8px (when has description), 0 (only child).
                    // Color: same as root — gray-1 light / gray-4 dark.
                    <h4
                        className={cn(
                            // Blueprint H4: 18px, semibold, line-height 20px, margin-bottom 8px
                            "text-[18px] font-semibold leading-[20px]",
                            // Heading color = muted text color (gray-1/gray-4) — Blueprint is explicit
                            "text-gray-1 dark:text-gray-4",
                            // margin-bottom: 8px when description follows; 0 when only child
                            hasDescription ? "mb-2" : "mb-0",
                        )}
                    >
                        {title}
                    </h4>
                )}
                {descriptionNode}
            </div>
        );
    }

    return (
        <div
            ref={ref}
            {...htmlProps}
            className={cn(nonIdealStateVariants({ layout }), className)}
        >
            {visualNode}
            {textNode}
            {action != null && (
                <div className="max-w-[400px]">
                    {action}
                </div>
            )}
            {children}
        </div>
    );
});

NonIdealState.displayName = "NonIdealState";
