/* eslint-disable no-restricted-imports */
/**
 * TelemetryPanel — the right rail. With a drone selected it shows live gauges,
 * sparklines, and mission progress; otherwise a fleet roll-up. Renders Skeletons
 * during the brief "connecting" phase.
 */
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card } from "@/components/ui/card";
import { CardList } from "@/components/ui/card-list";
import { Icon } from "@/components/ui/icon";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Section, SectionCard } from "@/components/ui/section";
import { Skeleton } from "@/components/ui/skeleton";
import { Tag } from "@/components/ui/tag";

import { Gauge } from "./Gauge";
import { Sparkline } from "./Sparkline";
import {
    type Drone,
    type DroneStatus,
    type TelemetryHistory,
    STATUS_META,
} from "./data";

interface TelemetryPanelProps {
    drone: Drone | null;
    history: TelemetryHistory | undefined;
    drones: Drone[];
    connecting: boolean;
    onOpenDetail: () => void;
}

function tone(value: number, warn: number, danger: number): string {
    if (value < danger) return "text-intent-danger-text";
    if (value < warn) return "text-intent-warning-text";
    return "text-intent-success-text";
}

function Metric({
    label,
    value,
    unit,
    data,
    min,
    max,
    colorClass,
}: {
    label: string;
    value: string;
    unit?: string;
    data: number[];
    min?: number;
    max?: number;
    colorClass: string;
}) {
    return (
        <Card compact className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5">
                <span className="text-body-sm uppercase tracking-wide text-foreground-muted">{label}</span>
                <span className="text-base font-semibold tabular-nums text-foreground">
                    {value}
                    {unit && <span className="ml-0.5 text-body-sm font-normal text-foreground-muted">{unit}</span>}
                </span>
            </div>
            <div className={colorClass}>
                <Sparkline data={data} min={min} max={max} width={96} height={34} />
            </div>
        </Card>
    );
}

function SkeletonBody() {
    return (
        <div className="flex flex-col gap-4 p-4">
            <Skeleton className="h-6 w-40" />
            <div className="flex gap-3">
                <Skeleton className="h-20 w-20 rounded-full" />
                <Skeleton className="h-20 w-20 rounded-full" />
            </div>
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
        </div>
    );
}

function FleetSummary({ drones }: { drones: Drone[] }) {
    const counts = drones.reduce<Record<DroneStatus, number>>(
        (acc, d) => {
            acc[d.status] += 1;
            return acc;
        },
        { active: 0, returning: 0, charging: 0, idle: 0, anomaly: 0 },
    );
    const order: DroneStatus[] = ["active", "anomaly", "returning", "charging", "idle"];
    return (
        <div className="flex flex-col gap-4 p-4">
            <Callout intent="primary" icon={<Icon icon="info-sign" />} title="No drone selected">
                Pick a drone from the fleet roster or the map to see live telemetry.
            </Callout>
            <Section title="Fleet status" compact>
                <CardList bordered={false}>
                    {order.map((s) => (
                        <Card key={s} compact className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-2 text-body">
                                <span className={`inline-block size-2.5 rounded-full ${STATUS_META[s].dot}`} />
                                {STATUS_META[s].label}
                            </span>
                            <span className="text-base font-semibold tabular-nums text-foreground">{counts[s]}</span>
                        </Card>
                    ))}
                </CardList>
            </Section>
        </div>
    );
}

export function TelemetryPanel({ drone, history, drones, connecting, onOpenDetail }: TelemetryPanelProps) {
    if (connecting) return <SkeletonBody />;
    if (!drone) return <FleetSummary drones={drones} />;

    const meta = STATUS_META[drone.status];
    const h = history ?? { battery: [], signal: [], altitude: [], speed: [] };
    const missionProgress = drone.route.length > 1 ? drone.waypoint / drone.route.length : 0;

    return (
        <div className="flex flex-col gap-4 p-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-1">
                    <span className="text-lg font-semibold tabular-nums text-foreground">{drone.callsign}</span>
                    <span className="text-body-sm text-foreground-muted">
                        {drone.model} · {drone.payload}
                    </span>
                </div>
                <Tag intent={meta.intent} icon={<Icon icon={meta.icon} size={12} className="!text-current" />}>
                    {meta.label}
                </Tag>
            </div>

            {drone.status === "anomaly" && (
                <Callout intent="danger" icon={<Icon icon="warning-sign" />} title="Telemetry anomaly">
                    Signal integrity degraded. Onboard diagnostics running; auto-recovery in progress.
                </Callout>
            )}

            {/* Gauges */}
            <div className="flex justify-around gap-2 rounded-bp border border-divider bg-surface py-3">
                <div className={tone(drone.battery, 40, 20)}>
                    <Gauge value={drone.battery / 100} display={`${Math.round(drone.battery)}%`} caption="Battery" />
                </div>
                <div className={tone(drone.signal, 55, 40)}>
                    <Gauge value={drone.signal / 100} display={`${Math.round(drone.signal)}`} caption="Signal" />
                </div>
            </div>

            {/* Mission progress */}
            <SectionCard padded>
                <div className="mb-1.5 flex items-center justify-between text-body-sm">
                    <span className="text-foreground-muted">Patrol progress</span>
                    <span className="tabular-nums text-foreground">
                        wpt {drone.waypoint + 1}/{drone.route.length}
                    </span>
                </div>
                <ProgressBar value={missionProgress} intent="primary" stripes={false} animate={false} />
            </SectionCard>

            {/* Telemetry sparklines */}
            <div className="flex flex-col gap-2">
                <Metric
                    label="Battery"
                    value={`${Math.round(drone.battery)}`}
                    unit="%"
                    data={h.battery}
                    min={0}
                    max={100}
                    colorClass={tone(drone.battery, 40, 20)}
                />
                <Metric
                    label="Signal"
                    value={`${Math.round(drone.signal)}`}
                    unit="%"
                    data={h.signal}
                    min={0}
                    max={100}
                    colorClass={tone(drone.signal, 55, 40)}
                />
                <Metric
                    label="Altitude"
                    value={`${Math.round(drone.altitude)}`}
                    unit="m"
                    data={h.altitude}
                    colorClass="text-intent-primary-text"
                />
                <Metric
                    label="Ground speed"
                    value={drone.speed.toFixed(1)}
                    unit="m/s"
                    data={h.speed}
                    colorClass="text-intent-primary-text"
                />
            </div>

            <Button
                fill
                icon={<Icon icon="panel-stats" className="!text-current" />}
                onClick={onOpenDetail}
            >
                Open full telemetry
            </Button>
        </div>
    );
}
