/* eslint-disable no-restricted-imports */
/**
 * ShiftBriefing — the pre-shift dialog. A fresh sim holds in the `briefing`
 * phase (nothing ticks) until the operator starts the shift from here: fleet
 * roster by squadron, base resources, expected activity drawn from the spawn
 * schedule, the blue forces to protect, and the shareable scenario seed.
 */
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Icon, type IconName } from "@/components/ui/icon";
import { Tag } from "@/components/ui/tag";

import { SeedChip } from "./SeedChip";
import type { BlueUnit } from "./blue";
import { BLUE_KIND_META } from "./blue";
import { type Drone, SENSOR_META, SQUADRONS, formatClock } from "./data";
import { FIRES_PER_SHIFT, PAD_COUNT, SHIFT_TICKS } from "./stream/engine";

interface ShiftBriefingProps {
    open: boolean;
    drones: Drone[];
    blues: BlueUnit[];
    /** Contacts seeded into the AO this shift / how many are live at tick 0. */
    contactsTotal: number;
    contactsAtStart: number;
    /** ISR request windows scheduled across the shift. */
    isrCount: number;
    seed: number;
    dark: boolean;
    onClose: () => void;
    onStart: () => void;
}

function ResourceCell({ icon, label, value }: { icon: IconName; label: string; value: string }) {
    return (
        <div className="flex flex-col gap-0.5 bg-background px-3 py-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">{label}</span>
            <span className="inline-flex items-center gap-1.5 text-base font-semibold tabular-nums text-foreground">
                <Icon icon={icon} size={14} className="text-foreground-muted" />
                {value}
            </span>
        </div>
    );
}

export function ShiftBriefing({
    open,
    drones,
    blues,
    contactsTotal,
    contactsAtStart,
    isrCount,
    seed,
    dark,
    onClose,
    onStart,
}: ShiftBriefingProps) {
    const munitions = drones.reduce((n, d) => n + (d.munitions ?? 0), 0);

    return (
        <Dialog
            open={open}
            onOpenChange={(o) => {
                if (!o) onClose();
            }}
            title="Shift briefing — Skylark"
            icon="manual"
            dark={dark}
        >
            <DialogBody>
                <div className="flex flex-col gap-4">
                    <p className="text-body text-foreground-muted">
                        You have the watch, Flight Director. One {formatClock(SHIFT_TICKS)} shift over the bay:
                        find contacts, classify them, protect the blue forces, and decide what to do about
                        threats — while rotating a battery-limited fleet through the charging pads. The shift
                        clock starts when you do.
                    </p>

                    {/* Fleet by squadron */}
                    <div className="divide-y divide-divider rounded-mithril border border-divider">
                        {SQUADRONS.map((sq) => {
                            const members = drones.filter((d) => d.squadronId === sq.id);
                            if (members.length === 0) return null;
                            const airborne = members.filter(
                                (d) => d.status === "active" || d.status === "anomaly" || d.status === "returning",
                            ).length;
                            const sensors = [...new Set(members.map((d) => SENSOR_META[d.sensor].label))].join(" · ");
                            return (
                                <div key={sq.id} className="flex items-center gap-2 px-3 py-2">
                                    <Icon icon={sq.icon} size={14} className="text-foreground-muted" />
                                    <span className="text-body font-medium text-foreground">{sq.name}</span>
                                    <Tag minimal round className="tabular-nums">
                                        {members.length}
                                    </Tag>
                                    <span className="ml-auto text-body-sm text-foreground-muted">
                                        {sensors} — {airborne} airborne, {members.length - airborne} at base
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Base resources */}
                    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-mithril border border-divider bg-divider sm:grid-cols-4">
                        <ResourceCell icon="stopwatch" label="Shift length" value={formatClock(SHIFT_TICKS)} />
                        <ResourceCell icon="lightning" label="Charging pads" value={String(PAD_COUNT)} />
                        <ResourceCell icon="target" label="Munitions aboard" value={String(munitions)} />
                        <ResourceCell icon="rocket" label="External fires" value={String(FIRES_PER_SHIFT)} />
                    </div>

                    {/* Expected activity + blue forces */}
                    <div className="flex flex-col gap-2 rounded-mithril border border-divider bg-surface px-3 py-2.5">
                        <span className="inline-flex items-center gap-1.5 text-body-sm font-semibold uppercase tracking-wide text-foreground-muted">
                            <Icon icon="predictive-analysis" size={12} className="!text-current" />
                            Intelligence picture
                        </span>
                        <p className="text-body-sm text-foreground-muted">
                            SIGINT expects roughly {contactsTotal} contacts in the AO this shift —{" "}
                            {contactsAtStart} already active, the rest arriving in waves that build late. Most
                            will be civilian noise; assessments put about three hostile actors among them.
                            Expect {isrCount} ISR support {isrCount === 1 ? "request" : "requests"} from the
                            blue forces.
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-body-sm text-foreground-muted">Protect:</span>
                            {blues.map((b) => (
                                <Tag
                                    key={b.id}
                                    minimal
                                    intent="primary"
                                    icon={<Icon icon={BLUE_KIND_META[b.kind].icon} size={12} className="!text-current" />}
                                >
                                    {b.callsign}
                                </Tag>
                            ))}
                        </div>
                    </div>

                    <SeedChip seed={seed} />
                </div>
            </DialogBody>
            <DialogFooter
                actions={
                    <>
                        <Button variant="minimal" onClick={onClose}>
                            Review the board
                        </Button>
                        <Button
                            intent="primary"
                            icon={<Icon icon="play" className="!text-current" />}
                            onClick={onStart}
                        >
                            Start shift
                        </Button>
                    </>
                }
            />
        </Dialog>
    );
}
