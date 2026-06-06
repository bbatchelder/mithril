/* eslint-disable no-restricted-imports */
/**
 * EventFeed — the streaming event log strip along the bottom. Newest first;
 * when "follow" is on it stays pinned to the latest. Rows are clickable to
 * select the drone that raised the event.
 */
import { useEffect, useRef } from "react";

import { Icon } from "@/components/ui/icon";
import { Tag } from "@/components/ui/tag";
import { Tooltip } from "@/components/ui/tooltip";

import { type StreamEvent, SEVERITY_INTENT, formatMissionClock } from "./data";

interface EventFeedProps {
    events: StreamEvent[];
    selectedId: string | null;
    follow: boolean;
    dark: boolean;
    /**
     * When `onToggle` is supplied the header becomes a toggle and the list is hidden
     * (at every width) while `collapsed`; expanded, the list is a fixed-height scroll
     * area. The host starts it collapsed so the map leads.
     */
    collapsed?: boolean;
    onToggle?: () => void;
    onSelect: (id: string) => void;
}

export function EventFeed({ events, selectedId, follow, dark, collapsed = false, onToggle, onSelect }: EventFeedProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (follow && scrollRef.current) scrollRef.current.scrollTop = 0;
    }, [events, follow]);

    const header = (
        <>
            <Icon icon="feed" size={14} className="text-foreground-muted" />
            <span className="text-body-sm font-semibold uppercase tracking-wide text-foreground-muted">
                Event stream
            </span>
            <Tag minimal round className="tabular-nums">
                {events.length}
            </Tag>
            {onToggle && (
                <Icon
                    icon={collapsed ? "chevron-up" : "chevron-down"}
                    size={16}
                    className="ml-auto text-foreground-muted"
                />
            )}
        </>
    );

    return (
        <div className="flex h-full flex-col">
            {onToggle ? (
                <button
                    type="button"
                    onClick={onToggle}
                    aria-expanded={!collapsed}
                    className="flex min-h-11 w-full shrink-0 items-center gap-2 border-b border-divider px-4 py-2 text-left lg:min-h-0"
                >
                    {header}
                </button>
            ) : (
                <div className="flex shrink-0 items-center gap-2 border-b border-divider px-4 py-2">{header}</div>
            )}
            <div
                ref={scrollRef}
                className={`overflow-auto ${collapsed ? "hidden" : "h-48"}`}
            >
                {events.length === 0 ? (
                    <div className="flex h-full items-center justify-center py-6 text-body-sm text-foreground-muted">
                        Awaiting telemetry…
                    </div>
                ) : (
                    <ul className="divide-y divide-divider">
                        {events.map((e) => (
                            <li
                                key={e.id}
                                onClick={() => onSelect(e.droneId)}
                                className={`flex min-h-11 cursor-pointer items-center gap-3 px-4 py-1.5 text-body-sm hover:bg-[var(--interactive-hover)] lg:min-h-0 ${
                                    e.droneId === selectedId ? "bg-[var(--interactive-hover)]" : ""
                                }`}
                            >
                                <Tooltip content={`Mission time ${formatMissionClock(e.tick)}`} dark={dark}>
                                    <span className="w-16 shrink-0 font-mono text-body-sm tabular-nums text-foreground-muted">
                                        {formatMissionClock(e.tick)}
                                    </span>
                                </Tooltip>
                                <Tag
                                    minimal
                                    intent={SEVERITY_INTENT[e.severity]}
                                    icon={<Icon icon={e.icon} size={11} className="!text-current" />}
                                    className="w-24 shrink-0"
                                >
                                    {e.callsign}
                                </Tag>
                                <span className="truncate text-foreground">{e.message}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
