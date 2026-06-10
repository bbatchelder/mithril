/* eslint-disable no-restricted-imports */
/**
 * ShiftDebrief — the end-of-shift dialog. Opens when the shift clock runs out:
 * score breakdown (intel earned vs penalties), the operational counters behind
 * it, and a restart action that rebuilds the sim from the seed.
 *
 * Stage-1 scaffold: later stages add the decision timeline, a letter grade, and
 * the seed/share affordance (see docs/skylark-game.md).
 */
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { Tag } from "@/components/ui/tag";

import type { ShiftScore, ShiftStats } from "./stream/engine";

interface ShiftDebriefProps {
    open: boolean;
    score: ShiftScore;
    stats: ShiftStats;
    /** Fleet size at shift start, for the "airframes recovered" line. */
    fleetSize: number;
    dark: boolean;
    onClose: () => void;
    onRestart: () => void;
}

function ScoreRow({ label, value, accent }: { label: string; value: string; accent?: "good" | "bad" }) {
    const tone =
        accent === "good" ? "text-intent-success-text" : accent === "bad" ? "text-intent-danger-text" : "text-foreground";
    return (
        <div className="flex items-center justify-between px-3 py-2">
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

export function ShiftDebrief({ open, score, stats, fleetSize, dark, onClose, onRestart }: ShiftDebriefProps) {
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
                    {/* Headline score */}
                    <div className="flex items-center justify-between rounded-mithril border border-divider bg-surface px-4 py-3">
                        <span className="text-body font-medium text-foreground-muted">Final score</span>
                        <span className="text-2xl font-bold tabular-nums text-foreground">{score.total}</span>
                    </div>

                    {/* Breakdown */}
                    <div className="divide-y divide-divider rounded-mithril border border-divider">
                        <ScoreRow label="Points earned (intel, strikes, ISR)" value={`+${score.intel}`} accent="good" />
                        <ScoreRow
                            label="Penalties (losses, bad calls)"
                            value={`−${score.penalties}`}
                            accent={score.penalties > 0 ? "bad" : undefined}
                        />
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
                            icon={<Icon icon="refresh" className="!text-current" />}
                            onClick={onRestart}
                        >
                            Start next shift
                        </Button>
                    </>
                }
            />
        </Dialog>
    );
}
