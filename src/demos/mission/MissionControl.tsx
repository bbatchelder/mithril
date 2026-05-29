/* eslint-disable no-restricted-imports */
/**
 * Skylark — Drone Swarm Mission Control.
 *
 * A live, streaming demo: a seeded engine (`useStream`) drives a fleet of drones
 * that move across a MapLibre basemap while telemetry and events stream in.
 * Exercises the read-heavy/structural slice of the library that the SOC and Board
 * demos didn't: Tree, Section, Collapse, CardList, Skeleton, Breadcrumbs, PanelStack.
 */
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { InputGroup } from "@/components/ui/input-group";
import { Menu, MenuItem, MenuDivider } from "@/components/ui/menu";
import { Navbar, NavbarGroup, NavbarHeading, NavbarDivider } from "@/components/ui/navbar";
import { Popover } from "@/components/ui/popover";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Section } from "@/components/ui/section";
import { Switch } from "@/components/ui/switch";
import { Tag } from "@/components/ui/tag";
import { Tooltip } from "@/components/ui/tooltip";
import { useToaster } from "@/components/ui/toast";
import { useDark } from "@/lib/dark-context";

import { DroneDetail } from "./DroneDetail";
import { EventFeed } from "./EventFeed";
import { FleetTree } from "./FleetTree";
import { MissionMap } from "./MissionMap";
import { TelemetryPanel } from "./TelemetryPanel";
import { type StreamSpeed, useStream } from "./stream/useStream";
import { GROUND_STATION, STATUS_META, formatMissionClock } from "./data";

export function MissionControl() {
    const dark = useDark();
    const toaster = useToaster();
    const stream = useStream();

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [autoFollow, setAutoFollow] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [query, setQuery] = useState("");

    // Brief "connecting" phase so the telemetry panel shows Skeletons on first paint.
    const [connecting, setConnecting] = useState(true);
    useEffect(() => {
        const t = window.setTimeout(() => setConnecting(false), 1200);
        return () => window.clearTimeout(t);
    }, []);

    // Surface new danger events as toasts (live-data → Toaster).
    const lastToastId = useRef(0);
    useEffect(() => {
        const top = stream.events[0];
        if (top && top.id > lastToastId.current) {
            lastToastId.current = top.id;
            if (top.severity === "danger") {
                toaster.show({ intent: "danger", icon: top.icon, message: top.message });
            }
        }
    }, [stream.events, toaster]);

    const selected = stream.drones.find((d) => d.id === selectedId) ?? null;
    const activeCount = stream.drones.filter((d) => d.status === "active" || d.status === "anomaly").length;
    const anomalyCount = stream.drones.filter((d) => d.status === "anomaly").length;

    const handleSelect = (id: string | null) => setSelectedId(id);
    const openDetail = () => {
        if (selectedId) setDetailOpen(true);
    };

    return (
        <div className="flex h-screen flex-col bg-background text-foreground">
            {/* ── Navbar ──────────────────────────────────────────────────── */}
            <Navbar className="shrink-0">
                <NavbarGroup align="left">
                    <span className="mr-2 inline-flex items-center justify-center">
                        <Icon icon="airplane" size={20} className="text-intent-primary-text" />
                    </span>
                    <NavbarHeading className="font-semibold">Skylark</NavbarHeading>
                    <Tag minimal intent="primary">
                        Swarm Ops
                    </Tag>
                    <Tag
                        minimal
                        intent={stream.playing ? "success" : "none"}
                        icon={<Icon icon={stream.playing ? "pulse" : "pause"} size={12} className="!text-current" />}
                    >
                        {stream.playing ? "LIVE" : "PAUSED"}
                    </Tag>
                    <NavbarDivider />
                    <div className="hidden md:block">
                        <InputGroup
                            leftIcon="search"
                            placeholder="Search drones…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            style={{ width: 220 }}
                        />
                    </div>
                </NavbarGroup>

                <NavbarGroup align="right">
                    <span className="mr-1 font-mono text-body-sm tabular-nums text-foreground-muted">
                        {formatMissionClock(stream.tick)}
                    </span>
                    <Tooltip content={stream.playing ? "Pause stream" : "Resume stream"} dark={dark}>
                        <Button
                            variant="minimal"
                            aria-label={stream.playing ? "Pause" : "Play"}
                            icon={<Icon icon={stream.playing ? "pause" : "play"} className="!text-current" />}
                            onClick={stream.toggle}
                        />
                    </Tooltip>
                    <SegmentedControl
                        options={[
                            { label: "1×", value: "1" },
                            { label: "2×", value: "2" },
                            { label: "5×", value: "5" },
                        ]}
                        value={String(stream.speed)}
                        onValueChange={(v) => stream.setSpeed(Number(v) as StreamSpeed)}
                    />
                    <NavbarDivider />
                    <label className="flex items-center gap-2 text-body-sm text-foreground-muted">
                        <Switch checked={autoFollow} onChange={(e) => setAutoFollow(e.target.checked)} />
                        Follow
                    </label>
                    <NavbarDivider />
                    <Popover
                        side="bottom"
                        align="end"
                        dark={dark}
                        content={
                            <Menu>
                                <MenuDivider title="Flight Director" />
                                <MenuItem icon="person" text="Cmdr. Reyes" />
                                <MenuItem icon="cog" text="Mission settings" />
                                <MenuItem icon="manual" text="Flight rules" />
                                <MenuDivider />
                                <MenuItem icon="log-out" text="End shift" intent="danger" />
                            </Menu>
                        }
                    >
                        <Button
                            variant="minimal"
                            icon={<Icon icon="person" className="!text-current" />}
                            endIcon={<Icon icon="caret-down" className="!text-current" />}
                        >
                            Reyes
                        </Button>
                    </Popover>
                </NavbarGroup>
            </Navbar>

            {/* ── Body ────────────────────────────────────────────────────── */}
            <div className="flex min-h-0 flex-1">
                {/* Left rail — fleet roster */}
                <aside className="flex w-72 shrink-0 flex-col overflow-auto border-r border-divider bg-surface">
                    <Section
                        title="Fleet"
                        icon="layers"
                        rightElement={
                            <Tag minimal round className="tabular-nums">
                                {stream.drones.length}
                            </Tag>
                        }
                        compact
                    >
                        <div className="px-1 py-1">
                            <FleetTree drones={stream.drones} selectedId={selectedId} query={query} onSelect={handleSelect} />
                        </div>
                    </Section>
                </aside>

                {/* Center — map + event feed */}
                <main className="flex min-w-0 flex-1 flex-col">
                    {/* z-0 confines MapLibre's controls (z-index:2) to the map's own
                        stacking context, so they can't paint over the portaled Drawer. */}
                    <div className="relative z-0 min-h-0 flex-1">
                        <MissionMap
                            drones={stream.drones}
                            selectedId={selectedId}
                            onSelect={handleSelect}
                            autoFollow={autoFollow}
                            dark={dark}
                            className="h-full w-full"
                        />
                        {/* Status overlay */}
                        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-2">
                            <div className="pointer-events-auto flex items-center gap-3 rounded-bp border border-divider bg-surface/95 px-3 py-2 shadow-card-1 backdrop-blur">
                                <span className="inline-flex items-center gap-1.5 text-body-sm font-medium text-foreground">
                                    <span className={`inline-block size-2 rounded-full ${STATUS_META.active.dot}`} />
                                    {activeCount} airborne
                                </span>
                                {anomalyCount > 0 && (
                                    <span className="inline-flex items-center gap-1.5 text-body-sm font-medium text-intent-danger-text">
                                        <Icon icon="warning-sign" size={12} className="!text-current" />
                                        {anomalyCount} anomaly
                                    </span>
                                )}
                                <span className="text-body-sm text-foreground-muted">·</span>
                                <span className="inline-flex items-center gap-1.5 text-body-sm text-foreground-muted">
                                    <Icon icon="cell-tower" size={12} className="!text-current" />
                                    {GROUND_STATION.callsign}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Event feed strip */}
                    <div className="h-48 shrink-0 border-t border-divider bg-surface">
                        <EventFeed
                            events={stream.events}
                            selectedId={selectedId}
                            follow={stream.playing}
                            dark={dark}
                            onSelect={handleSelect}
                        />
                    </div>
                </main>

                {/* Right rail — telemetry */}
                <aside className="w-80 shrink-0 overflow-auto border-l border-divider bg-background">
                    <TelemetryPanel
                        drone={selected}
                        history={selectedId ? stream.history[selectedId] : undefined}
                        drones={stream.drones}
                        connecting={connecting}
                        onOpenDetail={openDetail}
                    />
                </aside>
            </div>

            {/* ── Drill-in drawer ─────────────────────────────────────────── */}
            <DroneDetail
                drone={selected}
                history={selectedId ? stream.history[selectedId] : undefined}
                events={stream.events}
                open={detailOpen}
                dark={dark}
                onClose={() => setDetailOpen(false)}
            />
        </div>
    );
}

export default MissionControl;
