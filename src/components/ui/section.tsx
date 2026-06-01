import { forwardRef, useCallback, useId, useState } from "react";

import { cn } from "@/lib/utils";
import { Card, type CardElevation } from "./card";
import { Collapse, type CollapseProps } from "./collapse";
import { Icon } from "./icon";
import { chevronDown, chevronUp } from "./icons";
import { Text } from "./text";

/**
 * Section component — pixel-faithful reimplementation of Blueprint's Section.
 *
 * Blueprint spec (`packages/core/src/components/section/_section.scss`, v6.15):
 *
 * $pt-spacing = 4px
 *
 * Section card (outer):
 *   overflow: hidden
 *   padding: 0 (overrides Card's p-4/p-5)
 *   width: 100%
 *
 * Header (.bp6-section-header):
 *   display: flex; align-items: center; justify-content: space-between
 *   border-bottom: 1px solid rgba(17,20,24,0.15) (light) / rgba(255,255,255,0.2) (dark)
 *   min-height: 50px ($pt-spacing * 12.5)   — compact: 40px ($pt-spacing * 10)
 *   padding: 0 20px ($section-padding-horizontal = $pt-spacing*5)  — compact: 0 16px ($pt-spacing*4)
 *   gap: 20px ($pt-spacing * 5) between left and right sides
 *
 * Header left (.bp6-section-header-left):
 *   display: flex; align-items: center; gap: 8px ($pt-spacing*2)
 *   padding: 8px 0 ($section-padding-vertical = $pt-spacing*2)   — same in compact
 *
 * Title (.bp6-section-header-title):
 *   H6 (14px / semibold); margin-bottom: 0 (override heading default)
 *
 * Subtitle (.bp6-section-header-sub-title):
 *   muted text; margin-top: 2px ($pt-spacing*0.5)
 *
 * Header right (.bp6-section-header-right):
 *   display: flex; align-items: center; gap: 8px; margin-left: auto
 *
 * Interactive header (collapsible):
 *   cursor: pointer; hover/active bg: light-gray5 (#f6f7f9) / dark: dark-gray4 (#383e47)
 *
 * Body:
 *   padding: 0 (no padding on the Collapse wrapper)
 *
 * SectionCard (.bp6-section-card):
 *   padded: padding 20px ($section-card-padding = $pt-spacing*5)   — compact: 16px ($pt-spacing*4)
 *   :not(:last-child) border-bottom: 1px solid divider (same colors as header)
 *
 * When collapsed, the header border-bottom is removed.
 *
 * @see https://blueprintjs.com/docs/#core/components/section
 */

/** Elevation options for Section — only 0 and 1 are visually appropriate. */
export type SectionElevation = 0 | 1;

/** Props forwarded to the underlying Collapse component. */
export interface SectionCollapseProps
    extends Pick<CollapseProps, "className" | "isOpen" | "keepChildrenMounted" | "transitionDuration"> {
    /**
     * Whether the section is initially open (uncontrolled mode).
     * Has no effect when `isOpen` is provided (controlled mode).
     * @default true
     */
    defaultIsOpen?: boolean;

    /**
     * Controlled open state. Passing this enables controlled mode.
     */
    isOpen?: boolean;

    /**
     * Callback invoked in controlled mode when the collapse toggle is clicked.
     */
    onToggle?: () => void;
}

export interface SectionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
    /**
     * Section title (rendered as H6 / semibold). Required to render the header.
     */
    title: React.ReactNode;

    /**
     * Sub-title rendered below the title in the header.
     */
    subtitle?: React.ReactNode;

    /**
     * Blueprint icon name to render left of the title.
     */
    icon?: React.ComponentProps<typeof Icon>["icon"];

    /**
     * Element rendered on the right side of the header.
     */
    rightElement?: React.ReactNode;

    /**
     * Whether the section body is collapsible (shows a caret toggle).
     * @default false
     */
    collapsible?: boolean;

    /**
     * Props forwarded to the underlying Collapse. Use `collapseProps.isOpen` for
     * controlled mode, or `collapseProps.defaultIsOpen` for uncontrolled.
     */
    collapseProps?: SectionCollapseProps;

    /**
     * Whether to use compact sizing (min-height 40px, padding 16px).
     * @default false
     */
    compact?: boolean;

    /**
     * Card elevation depth (0 or 1). Higher values are visually inappropriate for Section.
     * @default 0
     */
    elevation?: SectionElevation;

    /** Additional class on the outer card wrapper. */
    className?: string;

    children?: React.ReactNode;
}

/**
 * Surface container with a titled header, optional collapse, and Card elevation.
 * Composes Card (surface + elevation) + Collapse (collapsible body) + Icon + Text.
 *
 * Quick reference:
 *   <Section title="Settings">
 *     <SectionCard>…</SectionCard>
 *   </Section>
 *
 *   <Section title="Details" subtitle="More info" icon="info-sign" collapsible>
 *     <SectionCard>…</SectionCard>
 *   </Section>
 *
 *   <Section title="Compact" compact elevation={1}>
 *     <SectionCard>…</SectionCard>
 *   </Section>
 */
export const Section = forwardRef<HTMLDivElement, SectionProps>(function Section(
    {
        title,
        subtitle,
        icon,
        rightElement,
        collapsible = false,
        collapseProps,
        compact = false,
        elevation = 0,
        className,
        children,
        ...htmlProps
    },
    ref,
) {
    // Controlled vs. uncontrolled open state (Blueprint pattern).
    const isControlled = collapseProps?.isOpen !== undefined;
    const [isCollapsedUncontrolled, setIsCollapsed] = useState<boolean>(
        !(collapseProps?.defaultIsOpen ?? true),
    );
    const isCollapsed = isControlled ? !collapseProps?.isOpen : isCollapsedUncontrolled;

    const toggleIsCollapsed = useCallback(() => {
        if (isControlled) {
            collapseProps?.onToggle?.();
        } else {
            setIsCollapsed((prev) => !prev);
        }
    }, [collapseProps, isControlled]);

    // Unique IDs for aria-labelledby association.
    const sectionTitleId = useId();

    const isHeaderRightContainerVisible = rightElement != null || collapsible;

    // When collapsed the section header's border-bottom is removed (Blueprint rule).
    const headerHasBorder = !collapsible || !isCollapsed;

    return (
        <Card
            ref={ref}
            elevation={elevation as CardElevation}
            // Override Card's padding — Section always has padding: 0 on the card itself.
            // Width: 100% matches Blueprint's `.bp6-section { width: 100% }`.
            // min-w-0: Blueprint's normalize reset sets min-width: 0 on block elements.
            className={cn("p-0 overflow-hidden w-full min-w-0", className)}
            aria-labelledby={sectionTitleId}
            {...htmlProps}
        >
            {/* Header */}
            <div
                className={cn(
                    // Base layout
                    "flex items-center justify-between relative w-full",
                    // Gap between left and right groups
                    "gap-5",
                    // Horizontal padding: 20px default / 16px compact
                    compact ? "px-4" : "px-5",
                    // Min-height: 50px default / 40px compact
                    compact ? "min-h-[40px]" : "min-h-[50px]",
                    // Bottom divider (removed when fully collapsed)
                    headerHasBorder && "border-b border-b-[rgba(17,20,24,0.15)] dark:border-b-[rgba(255,255,255,0.2)]",
                    // Interactive (collapsible) hover state
                    collapsible && [
                        "cursor-pointer",
                        "hover:bg-light-gray-5 active:bg-light-gray-5",
                        "dark:hover:bg-dark-gray-4 dark:active:bg-dark-gray-4",
                    ],
                )}
                onClick={collapsible ? toggleIsCollapsed : undefined}
            >
                {/* Left: icon + title + subtitle */}
                <div
                    className={cn(
                        "flex items-center",
                        // Gap between icon and text group
                        "gap-2",
                        // Vertical padding: 8px ($pt-spacing*2) both default and compact
                        "py-2",
                    )}
                >
                    {icon && (
                        <Icon
                            icon={icon}
                            aria-hidden
                            tabIndex={-1}
                            className="text-foreground-muted"
                        />
                    )}
                    <div>
                        {/* Title: H6 style (14px / semibold) — margin-bottom: 0 */}
                        <Text
                            id={sectionTitleId}
                            variant="h6"
                            className="mb-0"
                        >
                            {title}
                        </Text>
                        {subtitle && (
                            <div className="text-foreground-muted text-[14px] leading-[1.28581] mt-[2px]">
                                {subtitle}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: rightElement + caret */}
                {isHeaderRightContainerVisible && (
                    <div className="flex items-center gap-2 ml-auto">
                        {rightElement}
                        {collapsible && (
                            <span
                                role="button"
                                tabIndex={0}
                                aria-pressed={isCollapsed}
                                aria-expanded={!isCollapsed}
                                aria-label={isCollapsed ? "expand section" : "collapse section"}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        toggleIsCollapsed();
                                    }
                                }}
                                className="inline-flex justify-center align-middle text-foreground-muted"
                            >
                                <Icon icon={isCollapsed ? chevronDown : chevronUp} />
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Body */}
            {collapsible ? (
                <Collapse
                    {...collapseProps}
                    isOpen={!isCollapsed}
                >
                    {children}
                </Collapse>
            ) : (
                children
            )}
        </Card>
    );
});

Section.displayName = "Section";

// ─── SectionCard ─────────────────────────────────────────────────────────────

export interface SectionCardProps extends React.HTMLAttributes<HTMLDivElement> {
    /**
     * Whether to apply visual padding (20px default / 16px compact via parent).
     * The `compact` context is not passed automatically — size the padding via
     * the `className` prop or a wrapper when used inside a compact Section.
     *
     * @default true
     */
    padded?: boolean;

    /** Whether this card uses compact padding (16px instead of 20px). */
    compact?: boolean;

    /** Additional class on the card wrapper. */
    className?: string;

    children?: React.ReactNode;
}

/**
 * Content sub-panel within a Section. Multiple SectionCards stack vertically with
 * bottom dividers between them (except the last card).
 *
 * Quick reference:
 *   <Section title="Settings">
 *     <SectionCard>First card content</SectionCard>
 *     <SectionCard>Second card content</SectionCard>
 *   </Section>
 */
export const SectionCard = forwardRef<HTMLDivElement, SectionCardProps>(function SectionCard(
    { padded = true, compact = false, className, children, ...htmlProps },
    ref,
) {
    return (
        <div
            ref={ref}
            className={cn(
                // Bottom divider between consecutive cards — CSS :not(:last-child) equivalent
                // via the sibling combinator. Tailwind doesn't have :not(:last-child) directly,
                // so we use [&:not(:last-child)] to add the border only when not the last child.
                "[&:not(:last-child)]:border-b [&:not(:last-child)]:border-b-[rgba(17,20,24,0.15)] dark:[&:not(:last-child)]:border-b-[rgba(255,255,255,0.2)]",
                // Padding when padded=true: 20px default, 16px compact
                padded && (compact ? "p-4" : "p-5"),
                className,
            )}
            {...htmlProps}
        >
            {children}
        </div>
    );
});

SectionCard.displayName = "SectionCard";
