/* eslint-disable no-restricted-imports */
/**
 * ShiftDebrief — the end-of-shift dialog. Opens when the shift clock runs out:
 * letter grade over the final score, the per-category score table (fed by the
 * engine's itemized `ScoreBreakdown`), the decision timeline (the uncapped
 * `keyEvents` log), the operational counters, and the shareable scenario seed.
 * Restart either replays the same seed or rolls a fresh scenario.
 */
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { Tag } from "@/components/ui/tag";

import { SeedChip } from "./SeedChip";
import { type StreamEvent, formatMissionClock } from "./data";
import { type ScoreBreakdown, type ShiftScore, type ShiftStats, letterGrade } from "./stream/engine";

interface ShiftDebriefProps {
    open: boolean;
    score: ShiftScore;
    breakdown: ScoreBreakdown;
    stats: ShiftStats;
    /** The uncapped chronological log of key calls and outcomes. */
    keyEvents: StreamEvent[];
    seed: number;
    /** Fleet size at shift start, for the "airframes recovered" line. */
    fleetSize: number;
    dark: boolean;
    onClose: () => void;
    /** Rebuild the same scenario — same seed, back to the briefing. */
    onReplay: () => void;
    /** Roll a fresh scenario (new seed). */
    onNewShift: () => void;
}

/** Grade letter → the text-color class for the badge (literal so Tailwind keeps them). */
const GRADE_TONE: Record<string, string> = {
    S: "text-intent-success-text",
    A: "text-intent-success-text",
    B: "text-intent-primary-text",
    C: "text-foreground",
    D: "text-intent-warning-text",
    F: "text-intent-danger-text",
};

function ScoreRow({ label, value, accent }: { label: string; value: string; accent?: "good" | "bad" }) {
    const tone =
        accent === "good" ? "text-intent-success-text" : accent === "bad" ? "text-intent-danger-text" : "text-foreground";
    return (
        <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-body text-foreground-muted">{label}</span>
            <span className={`text-body font-semibold tabular-nums ${tone}`}>{value}</span>
        </div>
    );
}

function StatCell({ label, value }: { label: string; value: number }) {
    return (
        <div className="flex flex-col gap-0.5 bg-background px-3 py-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">{label}</span>
            <span className="text-base font-semibold tabular-nums text-foreground">{value}</span>
        </div>
    );
}

const SEVERITY_TONE: Record<StreamEvent["severity"], string> = {
    info: "text-foreground-muted",
    success: "text-intent-success-text",
    warning: "text-intent-warning-text",
    danger: "text-intent-danger-text",
};

export function ShiftDebrief({
    open,
    score,
    breakdown,
    stats,
    keyEvents,
    seed,
    fleetSize,
    dark,
    onClose,
    onReplay,
    onNewShift,
}: ShiftDebriefProps) {
    const grade = letterGrade(score.total);
    const earnings: { label: string; value: number }[] = [
        { label: "Contacts detected", value: breakdown.detection },
        { label: "Investigations delivered", value: breakdown.investigation },
        { label: "Intel passed to blue", value: breakdown.intelPasses },
        { label: "Hostiles neutralized", value: breakdown.strikes },
        { label: "ISR support", value: breakdown.isr },
    ];
    const penalties: { label: string; value: number }[] = [
        { label: "Airframes lost", value: breakdown.crashes },
        { label: "Blue casualties", value: breakdown.bluesHit },
        { label: "Bad intel passes", value: breakdown.badIntel },
        { label: "Strike incidents", value: breakdown.strikeIncidents },
    ];

    return (
        <Dialog
            open={open}
            onOpenChange={(o) => {
                if (!o) onClose();
            }}
            title="Shift complete — debrief"
            icon="clipboard"
            dark={dark}
        >
            <DialogBody>
                <div className="flex flex-col gap-4">
                    {/* Grade + headline score */}
                    <div className="flex items-center gap-4 rounded-mithril border border-divider bg-surface px-4 py-3">
                        <span
                            className={`flex size-14 shrink-0 items-center justify-center rounded-mithril border-2 border-current text-3xl font-bold ${GRADE_TONE[grade.grade] ?? "text-foreground"}`}
                        >
                            {grade.grade}
                        </span>
                        <div className="flex min-w-0 flex-1 flex-col">
                            <span className="text-body font-semibold text-foreground">{grade.label}</span>
                            <span className="text-body-sm text-foreground-muted">
                                +{score.intel} earned · −{score.penalties} in penalties
                            </span>
                        </div>
                        <span className="text-2xl font-bold tabular-nums text-foreground">{score.total}</span>
                    </div>

                    {/* Per-category score table */}
                    <div className="divide-y divide-divider rounded-mithril border border-divider">
                        {earnings.map((row) => (
                            <ScoreRow
                                key={row.label}
                                label={row.label}
                                value={`+${row.value}`}
                                accent={row.value > 0 ? "good" : undefined}
                            />
                        ))}
                        {penalties.map((row) => (
                            <ScoreRow
                                key={row.label}
                                label={row.label}
                                value={`−${row.value}`}
                                accent={row.value > 0 ? "bad" : undefined}
                            />
                        ))}
                    </div>

                    {/* Decision timeline */}
                    <div className="overflow-hidden rounded-mithril border border-divider">
                        <div className="flex items-center gap-2 border-b border-divider bg-surface px-3 py-2">
                            <Icon icon="history" size={14} className="text-foreground-muted" />
                            <span className="text-body-sm font-semibold uppercase tracking-wide text-foreground-muted">
                                Key calls
                            </span>
                            <Tag minimal round className="tabular-nums">
                                {keyEvents.length}
                            </Tag>
                        </div>
                        <ul className="max-h-48 divide-y divide-divider overflow-auto">
                            {keyEvents.map((e) => (
                                <li key={e.id} className="flex items-start gap-2 px-3 py-1.5">
                                    <span className="shrink-0 pt-px font-mono text-body-sm tabular-nums text-foreground-muted">
                                        {formatMissionClock(e.tick)}
                                    </span>
                                    <Icon icon={e.icon} size={12} className={`mt-1 shrink-0 ${SEVERITY_TONE[e.severity]}`} />
                                    <span className="min-w-0 text-body-sm text-foreground">{e.message}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Operational counters */}
                    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-mithril border border-divider bg-divider sm:grid-cols-4">
                        <StatCell label="Contacts found" value={stats.detected} />
                        <StatCell label="Tracks left stale" value={stats.staleLost} />
                        <StatCell label="Investigations" value={stats.investigations} />
                        <StatCell label="Facts raised" value={stats.factsRaised} />
                        <StatCell label="Intel passes" value={stats.intelPasses} />
                        <StatCell label="Bad intel" value={stats.badIntelPasses} />
                        <StatCell label="Neutralized" value={stats.neutralized} />
                        <StatCell label="Gambles taken" value={stats.gamblesTaken} />
                        <StatCell label="Strike incidents" value={stats.strikeIncidents} />
                        <StatCell label="Fires wasted" value={stats.firesWasted} />
                        <StatCell label="Blues hit" value={stats.bluesHit} />
                        <StatCell label="ISR fulfilled" value={stats.isrFulfilled} />
                        <StatCell label="Launches" value={stats.launches} />
                        <StatCell label="Recalls" value={stats.recalls} />
                        <StatCell label="Drones lost" value={stats.dronesLost} />
                        <StatCell label="Recovered" value={fleetSize - stats.dronesLost} />
                    </div>

                    {stats.dronesLost === 0 && stats.bluesHit === 0 && stats.strikeIncidents === 0 && (
                        <Tag
                            minimal
                            intent="success"
                            icon={<Icon icon="endorsed" size={12} className="!text-current" />}
                            className="self-start"
                        >
                            Clean shift — every airframe home, every blue unit intact, no ROE incidents
                        </Tag>
                    )}

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
                            icon={<Icon icon="repeat" className="!text-current" />}
                            onClick={onReplay}
                        >
                            Replay this seed
                        </Button>
                        <Button
                            intent="primary"
                            icon={<Icon icon="refresh" className="!text-current" />}
                            onClick={onNewShift}
                        >
                            New shift
                        </Button>
                    </>
                }
            />
        </Dialog>
    );
}
