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
    onSelect: (id: string) => void;
}

export function EventFeed({ events, selectedId, follow, dark, onSelect }: EventFeedProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (follow && scrollRef.current) scrollRef.current.scrollTop = 0;
    }, [events, follow]);

    return (
        <div className="flex h-full flex-col">
            <div className="flex shrink-0 items-center gap-2 border-b border-divider px-4 py-2">
                <Icon icon="feed" size={14} className="text-foreground-muted" />
                <span className="text-body-sm font-semibold uppercase tracking-wide text-foreground-muted">
                    Event stream
                </span>
                <Tag minimal round className="tabular-nums">
                    {events.length}
                </Tag>
            </div>
            <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto">
                {events.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-body-sm text-foreground-muted">
                        Awaiting telemetry…
                    </div>
                ) : (
                    <ul className="divide-y divide-divider">
                        {events.map((e) => (
                            <li
                                key={e.id}
                                onClick={() => onSelect(e.droneId)}
                                className={`flex cursor-pointer items-center gap-3 px-4 py-1.5 text-body-sm hover:bg-[var(--interactive-hover)] ${
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
