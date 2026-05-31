import { Children, useEffect, useRef, useState } from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./icon";

/**
 * Tabs — pixel-faithful reimplementation of Blueprint's `.bp6-tabs`, built on
 * `@radix-ui/react-tabs`.
 *
 * ## Why Radix
 * Blueprint is our *visual* spec, not our behavioral one (the project goal is a fresh,
 * modern API). Rather than hand-roll the tablist keyboard/ARIA model, we compose Radix's
 * primitive — roving tabindex, arrow-key navigation, Home/End, RTL-aware orientation, and
 * automatic/manual activation all come from Radix and are maintained upstream. We keep the
 * friendly `<Tabs><Tab/></Tabs>` API and own only the Blueprint *visuals* on top.
 *
 * ## Activation
 * Defaults to `activationMode="automatic"` (arrow keys move focus AND select), matching the
 * WAI-ARIA APG recommendation and the Radix/React-Aria ecosystem default. Pass
 * `activationMode="manual"` for panels with side effects (focus moves on arrow; Enter/Space
 * selects) — the escape hatch Blueprint never offered.
 *
 * ## Blueprint visual spec (`packages/core/src/components/tabs/_tabs.scss`, v6.15)
 *
 * Tab list (`.bp6-tab-list`):
 *   display: flex; align-items: flex-end; column-gap: 20px; border/margin/padding: 0
 *   position: relative  ← hosts the absolutely-positioned indicator
 *
 * Tab (`.bp6-tab`):
 *   color: --foreground; font-size: 14px; line-height: 30px ($pt-button-height)
 *   align-self: stretch; display: flex; align-items: center; cursor: pointer
 *   overflow: hidden; text-overflow: ellipsis; white-space: nowrap
 *
 * Tab — selected: color: --link; box-shadow underline rendered as a 3px indicator bar.
 * Tab — hover (enabled): color: --link.   Tab — disabled: color: --foreground-disabled.
 *
 * Tab indicator (`.bp6-tab-indicator`): 3px high bar, background --link, absolute bottom,
 * positioned over the selected tab. We measure the active trigger's offset/width and
 * position it (no slide animation — the harness checks height + color at capture only).
 *
 * Vertical (`.bp6-tabs.bp6-vertical`): list left / panel right; tabs get border-radius 4px,
 * padding 0 8px, width 100%; selected → background rgba(primary, 0.2), no underline.
 *
 * Tab panel (`.bp6-tab-panel`): margin-top 20px (horizontal) / padding-left 20px (vertical).
 * Tab icon (`.bp6-tab-icon`): margin-right 8px; color follows the tab's text color.
 *
 * Design decisions:
 *   - Controlled/uncontrolled selection via `selectedTabId` / `defaultSelectedTabId`.
 *   - Panel content lives on the `<Tab panel>` prop. Inactive panels are unmounted (Radix
 *     default) — idiomatic and cheaper than keeping them hidden.
 *   - Tab `id` is required (mirrors Blueprint). TabId may be a number; we map to/from the
 *     string values Radix uses internally.
 *
 * @see https://blueprintjs.com/docs/#core/components/tabs
 */

export type TabId = string | number;

export interface TabsProps {
    /** Unique identifier for the group. */
    id?: TabId;
    /** Controlled: which tab is selected. */
    selectedTabId?: TabId;
    /** Uncontrolled initial selected tab id. Defaults to the first tab. */
    defaultSelectedTabId?: TabId;
    /** Called when the selected tab changes. */
    onChange?: (newTabId: TabId, prevTabId: TabId | undefined) => void;
    /** Stack tabs vertically on the left side. @default false */
    vertical?: boolean;
    /** Make the tab list fill the container height (horizontal only). @default false */
    fill?: boolean;
    /**
     * Keyboard activation behavior.
     * - `"automatic"` (default): arrow keys move focus and select immediately.
     * - `"manual"`: arrow keys move focus only; Enter/Space selects.
     * @default "automatic"
     */
    activationMode?: "automatic" | "manual";
    children?: React.ReactNode;
    className?: string;
}

export interface TabProps {
    /** Unique identifier for this tab. Required. */
    id: TabId;
    /** Tab label shown in the tab list. */
    title?: React.ReactNode;
    /** Icon to show before the title. Blueprint icon name or ReactNode. */
    icon?: IconName | React.ReactNode;
    /** Panel content rendered when this tab is selected. */
    panel?: React.ReactNode;
    /** Whether this tab is disabled. @default false */
    disabled?: boolean;
    /** Extra children rendered as the tab title (alternative to `title`). */
    children?: React.ReactNode;
}

/**
 * Container for Tab children + their panels.
 *
 * ```tsx
 * <Tabs id="my-tabs" defaultSelectedTabId="a">
 *   <Tab id="a" title="Alpha" panel={<p>Panel A</p>} />
 *   <Tab id="b" title="Beta" panel={<p>Panel B</p>} />
 *   <Tab id="c" title="Gamma" disabled panel={<p>Panel C</p>} />
 * </Tabs>
 * ```
 */
export function Tabs({
    selectedTabId: controlledId,
    defaultSelectedTabId,
    onChange,
    vertical = false,
    fill = false,
    activationMode = "automatic",
    children,
    className,
}: TabsProps) {
    const tabs = Children.toArray(children).filter(isTabElement) as React.ReactElement<TabProps>[];

    // Map Radix's string values back to the original (possibly numeric) TabId.
    const idFromValue = (value: string): TabId => {
        const match = tabs.find((t) => String(t.props.id) === value);
        return match ? match.props.id : value;
    };

    const firstTabId = tabs.length > 0 ? tabs[0].props.id : undefined;
    const [uncontrolledId, setUncontrolledId] = useState<TabId | undefined>(
        defaultSelectedTabId ?? firstTabId,
    );

    const isControlled = controlledId !== undefined;
    const selectedTabId = isControlled ? controlledId : uncontrolledId;

    const handleValueChange = (value: string) => {
        const newTabId = idFromValue(value);
        const prev = selectedTabId;
        onChange?.(newTabId, prev);
        if (!isControlled) setUncontrolledId(newTabId);
    };

    // ---------------------------------------------------------------------------
    // Indicator (horizontal only): measure the active trigger's offset/width within
    // the tab list and position the 3px bar over it. Driven by Radix's data-state.
    // ---------------------------------------------------------------------------
    const tablistRef = useRef<HTMLDivElement>(null);
    const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({ display: "none" });

    useEffect(() => {
        const node = tablistRef.current;
        if (!node || vertical) {
            setIndicatorStyle({ display: "none" });
            return;
        }
        const active = node.querySelector<HTMLElement>('[role="tab"][data-state="active"]');
        if (!active) {
            setIndicatorStyle({ display: "none" });
            return;
        }
        setIndicatorStyle({
            position: "absolute",
            bottom: 0,
            left: active.offsetLeft,
            width: active.clientWidth,
            height: 3,
        });
    }, [selectedTabId, vertical]);

    return (
        <TabsPrimitive.Root
            value={String(selectedTabId)}
            onValueChange={handleValueChange}
            orientation={vertical ? "vertical" : "horizontal"}
            activationMode={activationMode}
            className={cn(vertical ? "flex flex-row" : "block", className)}
        >
            {/* Tab list — Radix sets role=tablist + aria-orientation. */}
            <TabsPrimitive.List
                ref={tablistRef}
                className={cn(
                    "flex flex-none border-none m-0 p-0 list-none",
                    vertical
                        ? "flex-col items-start"
                        : cn("flex-row items-end gap-x-5 relative", fill && "h-full"),
                )}
            >
                {!vertical && (
                    <div
                        aria-hidden="true"
                        data-compare="tab-indicator"
                        className="bg-link dark:bg-link pointer-events-none"
                        style={indicatorStyle}
                    />
                )}
                {tabs.map((tab) => (
                    <TabTitle
                        key={String(tab.props.id)}
                        tabId={tab.props.id}
                        title={tab.props.title}
                        icon={tab.props.icon}
                        disabled={tab.props.disabled}
                        vertical={vertical}
                    >
                        {tab.props.children}
                    </TabTitle>
                ))}
            </TabsPrimitive.List>

            {/* Tab panels — Radix sets role=tabpanel + aria-labelledby; inactive unmount. */}
            {tabs.map((tab) =>
                tab.props.panel != null ? (
                    <TabsPrimitive.Content
                        key={String(tab.props.id)}
                        value={String(tab.props.id)}
                        className={cn(vertical ? "mt-0 pl-5" : "mt-5")}
                    >
                        {tab.props.panel}
                    </TabsPrimitive.Content>
                ) : null,
            )}
        </TabsPrimitive.Root>
    );
}

// ---------------------------------------------------------------------------
// TabTitle (internal) — renders a Radix Trigger styled as a Blueprint tab.
// ---------------------------------------------------------------------------

interface TabTitleProps {
    tabId: TabId;
    title?: React.ReactNode;
    icon?: IconName | React.ReactNode;
    disabled?: boolean;
    vertical: boolean;
    children?: React.ReactNode;
}

function TabTitle({ tabId, title, icon, disabled = false, vertical, children }: TabTitleProps) {
    // Icon color follows the tab's text color (link when active, disabled when disabled)
    // via currentColor, so we don't need per-trigger selected state here.
    const iconEl =
        icon != null ? (
            typeof icon === "string" ? (
                <Icon icon={icon as IconName} className="mr-2 shrink-0 !text-current" />
            ) : (
                <span className="mr-2 shrink-0 inline-flex">{icon}</span>
            )
        ) : null;

    return (
        <TabsPrimitive.Trigger
            value={String(tabId)}
            disabled={disabled}
            className={cn(
                // Reset native <button> appearance so it inherits the Blueprint type system.
                "appearance-none bg-transparent border-0 [font-family:inherit] text-left",
                // Base tab: font-size 14px; line-height 30px; flex row, centered; no shrink.
                "flex items-center flex-none align-top cursor-pointer",
                "text-body text-foreground leading-[30px]",
                "overflow-hidden text-ellipsis whitespace-nowrap max-w-full",
                // Horizontal: stretch to the tab-list height so the underline sits at the bottom.
                !vertical && "self-stretch",
                // Vertical: rounded pill + padding + full width; selected gets a subtle bg.
                vertical && cn("rounded-bp px-2 w-full", "data-[state=active]:bg-blue-3/20"),
                // Selected text color = link; horizontal selected has square corners.
                "data-[state=active]:text-link dark:data-[state=active]:text-link",
                !vertical && "data-[state=active]:rounded-none",
                // Hover (enabled only) → link color.
                "enabled:hover:text-link dark:enabled:hover:text-link",
                // Disabled.
                "disabled:text-foreground-disabled disabled:cursor-not-allowed",
            )}
        >
            {iconEl}
            {title ?? children}
        </TabsPrimitive.Trigger>
    );
}

// ---------------------------------------------------------------------------
// Tab (data holder — not rendered directly; parsed by Tabs)
// ---------------------------------------------------------------------------

/**
 * Data-only component — represents a single tab. Must be a direct child of `<Tabs>`.
 * Not rendered directly; `Tabs` reads its props to render the trigger and panel.
 *
 * ```tsx
 * <Tab id="settings" title="Settings" icon="cog" panel={<SettingsPanel />} />
 * ```
 */
export function Tab(_props: TabProps): React.ReactElement | null {
    return null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isTabElement(child: React.ReactNode): boolean {
    return (
        child != null &&
        typeof child === "object" &&
        "type" in child &&
        (child as React.ReactElement).type === Tab
    );
}
