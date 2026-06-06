/* eslint-disable no-restricted-imports */
/**
 * DroneDetail — full-screen-ish drill-in for one drone. A right `Drawer` holding
 * a controlled `PanelStack`: the root "Overview" panel has `Breadcrumbs` + `Tabs`
 * (Telemetry / Mission / Subsystems / Activity); inspecting a subsystem pushes a
 * second panel (with the PanelStack back button).
 *
 * The stack is *controlled* (driven by local `sub` state) rather than uncontrolled,
 * so each panel's `renderPanel` closure is rebuilt every tick over fresh live data
 * — an uncontrolled PanelStack would capture the first render's stale drone.
 */
import { useEffect, useMemo, useRef, useState } from "react";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Callout } from "@/components/ui/callout";
import { Card } from "@/components/ui/card";
import { CardList } from "@/components/ui/card-list";
import { Drawer, DrawerBody } from "@/components/ui/drawer";
import { Icon, type IconName } from "@/components/ui/icon";
import { PanelStack, type PanelInfo } from "@/components/ui/panel-stack";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Tabs, Tab } from "@/components/ui/tabs";
import { Tag } from "@/components/ui/tag";

import { Gauge } from "./Gauge";
import { Sparkline } from "./Sparkline";
import {
    type Drone,
    type StreamEvent,
    type TelemetryHistory,
    SEVERITY_INTENT,
    STATUS_META,
    formatMissionClock,
    squadronById,
} from "./data";

interface DroneDetailProps {
    drone: Drone | null;
    history: TelemetryHistory | undefined;
    events: StreamEvent[];
    open: boolean;
    dark: boolean;
    onClose: () => void;
}

interface Subsystem {
    key: string;
    name: string;
    icon: IconName;
    health: number; // 0–100
    readout: string;
}

function subsystems(drone: Drone): Subsystem[] {
    return [
        { key: "power", name: "Power", icon: "flash", health: drone.battery, readout: `${Math.round(drone.battery)}% cell · ${(drone.battery * 0.148).toFixed(1)}V` },
        { key: "comms", name: "Comms", icon: "globe-network", health: drone.signal, readout: `${Math.round(drone.signal)}% link · 2.4 GHz mesh` },
        { key: "nav", name: "Navigation", icon: "map-marker", health: Math.min(100, drone.signal + 6), readout: `GPS lock · ${drone.route.length} waypoints` },
        { key: "propulsion", name: "Propulsion", icon: "send-to-graph", health: drone.status === "anomaly" ? 58 : 94, readout: `${drone.speed.toFixed(1)} m/s · 4 rotors nominal` },
        { key: "payload", name: "Payload", icon: "camera", health: drone.status === "anomaly" ? 72 : 99, readout: drone.payload },
    ];
}

function healthIntent(h: number) {
    if (h < 40) return "danger" as const;
    if (h < 70) return "warning" as const;
    return "success" as const;
}

function BigMetric({ label, value, unit, data, min, max, color }: {
    label: string;
    value: string;
    unit?: string;
    data: number[];
    min?: number;
    max?: number;
    color: string;
}) {
    return (
        <div className="rounded-bp border border-divider bg-surface p-3">
            <div className="flex items-baseline justify-between">
                <span className="text-body-sm uppercase tracking-wide text-foreground-muted">{label}</span>
                <span className="text-base font-semibold tabular-nums text-foreground">
                    {value}
                    {unit && <span className="ml-0.5 text-body-sm font-normal text-foreground-muted">{unit}</span>}
                </span>
            </div>
            <div className={`mt-2 ${color}`}>
                <Sparkline data={data} min={min} max={max} width={400} height={56} />
            </div>
        </div>
    );
}

export function DroneDetail({ drone, history, events, open, dark, onClose }: DroneDetailProps) {
    const [sub, setSub] = useState<string | null>(null);

    // Live data is read through a ref so the memoized panels (below) keep a STABLE
    // identity across ticks. PanelStack memoizes a wrapper component on panel
    // identity — a fresh panel object every tick would remount the subtree each
    // second and reset the Tabs selection / drill-in. The panels capture only the
    // ref + setSub (both stable); every value is recomputed from the ref at render.
    const dataRef = useRef<{ drone: Drone | null; history: TelemetryHistory | undefined; events: StreamEvent[] }>({
        drone,
        history,
        events,
    });
    dataRef.current = { drone, history, events };

    const droneId = drone?.id;

    // Reset the drill-in whenever the drawer (re)opens or the drone changes.
    useEffect(() => {
        if (!open) setSub(null);
    }, [open]);
    useEffect(() => {
        setSub(null);
    }, [droneId]);

    // Stable-identity root panel — rebuilt only when the drone changes, not per tick.
    const overviewPanel = useMemo<PanelInfo>(
        () => ({
            title: "Overview",
            renderPanel: () => {
                const d = dataRef.current.drone;
                if (!d) return null;
                const meta = STATUS_META[d.status];
                const squadron = squadronById(d.squadronId);
                const h = dataRef.current.history ?? { battery: [], signal: [], altitude: [], speed: [] };
                const subs = subsystems(d);
                const droneEvents = dataRef.current.events.filter((e) => e.droneId === d.id);
                return (
                    <div className="flex flex-col gap-4 p-4">
                        <Breadcrumbs
                            items={[
                                { icon: "home", text: "Fleet" },
                                { icon: squadron?.icon, text: squadron?.name },
                                { text: d.callsign, current: true },
                            ]}
                        />

                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-lg font-semibold text-foreground">{d.callsign}</div>
                                <div className="text-body-sm text-foreground-muted">{d.task}</div>
                            </div>
                            <Tag intent={meta.intent} icon={<Icon icon={meta.icon} size={12} className="!text-current" />}>
                                {meta.label}
                            </Tag>
                        </div>

                        <Tabs id={`drone-tabs-${d.id}`} defaultSelectedTabId="telemetry">
                            <Tab
                                id="telemetry"
                                title="Telemetry"
                                panel={
                                    <div className="flex flex-col gap-3 pt-3">
                                        <div className="flex justify-around rounded-bp border border-divider bg-surface py-3">
                                            <div className={tone(d.battery, 40, 20)}>
                                                <Gauge value={d.battery / 100} display={`${Math.round(d.battery)}%`} caption="Battery" size={96} />
                                            </div>
                                            <div className={tone(d.signal, 55, 40)}>
                                                <Gauge value={d.signal / 100} display={`${Math.round(d.signal)}`} caption="Signal" size={96} />
                                            </div>
                                        </div>
                                        <BigMetric label="Battery" value={`${Math.round(d.battery)}`} unit="%" data={h.battery} min={0} max={100} color={tone(d.battery, 40, 20)} />
                                        <BigMetric label="Signal" value={`${Math.round(d.signal)}`} unit="%" data={h.signal} min={0} max={100} color={tone(d.signal, 55, 40)} />
                                        <BigMetric label="Altitude" value={`${Math.round(d.altitude)}`} unit="m" data={h.altitude} color="text-intent-primary-text" />
                                        <BigMetric label="Ground speed" value={d.speed.toFixed(1)} unit="m/s" data={h.speed} color="text-intent-primary-text" />
                                    </div>
                                }
                            />
                            <Tab
                                id="mission"
                                title="Mission"
                                panel={
                                    <div className="flex flex-col gap-3 pt-3">
                                        <Field label="Task" value={d.task} />
                                        <Field label="Payload" value={d.payload} />
                                        <Field label="Model" value={d.model} />
                                        <div>
                                            <div className="mb-1.5 flex items-center justify-between text-body-sm">
                                                <span className="text-foreground-muted">Patrol progress</span>
                                                <span className="tabular-nums text-foreground">wpt {d.waypoint + 1}/{d.route.length}</span>
                                            </div>
                                            <ProgressBar value={d.waypoint / d.route.length} intent="primary" stripes={false} animate={false} />
                                        </div>
                                    </div>
                                }
                            />
                            <Tab
                                id="subsystems"
                                title="Subsystems"
                                panel={
                                    <div className="pt-3">
                                        <CardList>
                                            {subs.map((s) => (
                                                <Card key={s.key} interactive onClick={() => setSub(s.key)} className="flex items-center gap-3">
                                                    <Icon icon={s.icon} className="text-foreground-muted" />
                                                    <div className="flex grow flex-col">
                                                        <span className="text-body font-medium text-foreground">{s.name}</span>
                                                        <span className="text-body-sm text-foreground-muted">{s.readout}</span>
                                                    </div>
                                                    <Tag minimal intent={healthIntent(s.health)} className="tabular-nums">
                                                        {Math.round(s.health)}%
                                                    </Tag>
                                                    <Icon icon="chevron-right" className="text-foreground-muted" />
                                                </Card>
                                            ))}
                                        </CardList>
                                    </div>
                                }
                            />
                            <Tab
                                id="activity"
                                title="Activity"
                                panel={
                                    <div className="pt-3">
                                        {droneEvents.length === 0 ? (
                                            <div className="py-8 text-center text-body-sm text-foreground-muted">No events yet for this drone.</div>
                                        ) : (
                                            <ul className="divide-y divide-divider">
                                                {droneEvents.map((e) => (
                                                    <li key={e.id} className="flex items-center gap-3 py-2 text-body-sm">
                                                        <span className="w-16 shrink-0 font-mono tabular-nums text-foreground-muted">{formatMissionClock(e.tick)}</span>
                                                        <Tag minimal intent={SEVERITY_INTENT[e.severity]} icon={<Icon icon={e.icon} size={11} className="!text-current" />} />
                                                        <span className="text-foreground">{e.message}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                }
                            />
                        </Tabs>
                    </div>
                );
            },
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [droneId],
    );

    // Stable-identity subsystem panel — rebuilt when the drone or chosen subsystem changes.
    const subPanel = useMemo<PanelInfo | null>(() => {
        if (!sub) return null;
        return {
            title: "Subsystem",
            renderPanel: () => {
                const d = dataRef.current.drone;
                if (!d) return null;
                const active = subsystems(d).find((s) => s.key === sub);
                if (!active) return null;
                return (
                    <div className="flex flex-col gap-4 p-4">
                        <Breadcrumbs
                            items={[
                                { icon: "home", text: "Fleet" },
                                { text: d.callsign, onClick: () => setSub(null) },
                                { text: active.name, current: true },
                            ]}
                        />
                        <div className="flex items-center gap-3">
                            <Icon icon={active.icon} size={20} className="text-foreground-muted" />
                            <span className="text-lg font-semibold text-foreground">{active.name}</span>
                            <div className="grow" />
                            <Tag intent={healthIntent(active.health)} className="tabular-nums">
                                {Math.round(active.health)}% health
                            </Tag>
                        </div>
                        <div className="flex justify-center rounded-bp border border-divider bg-surface py-4">
                            <div className={tone(active.health, 70, 40)}>
                                <Gauge value={active.health / 100} display={`${Math.round(active.health)}%`} caption="Health" size={120} />
                            </div>
                        </div>
                        {active.health < 70 && (
                            <Callout intent={healthIntent(active.health) === "danger" ? "danger" : "warning"} title="Degraded subsystem">
                                {active.name} is operating below nominal. Telemetry is being sampled at an elevated rate.
                            </Callout>
                        )}
                        <Field label="Readout" value={active.readout} />
                        <Field label="Last self-test" value={`Passed · ${formatMissionClock(Math.max(0, d.waypoint * 7))}`} />
                    </div>
                );
            },
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [droneId, sub]);

    if (!drone) return null;

    const stack: PanelInfo[] = subPanel ? [overviewPanel, subPanel] : [overviewPanel];

    return (
        <Drawer
            open={open}
            onOpenChange={(next) => !next && onClose()}
            position="right"
            size="min(560px, 100vw)"
            title={`${drone.callsign} · ${drone.model}`}
            icon={<Icon icon="airplane" />}
            dark={dark}
        >
            <DrawerBody className="p-0">
                <PanelStack
                    stack={stack}
                    onClose={() => setSub(null)}
                    showPanelHeader
                    className="h-full"
                />
            </DrawerBody>
        </Drawer>
    );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-body-sm font-medium text-foreground-muted">{label}</span>
            <span className="text-body text-foreground">{value}</span>
        </div>
    );
}

function tone(value: number, warn: number, danger: number): string {
    if (value < danger) return "text-intent-danger-text";
    if (value < warn) return "text-intent-warning-text";
    return "text-intent-success-text";
}
