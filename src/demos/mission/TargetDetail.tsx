/**
 * TargetDetail — the right rail (and mobile sheet) for a selected map target.
 *
 * Mirrors `TelemetryPanel`'s framing, but instead of live gauges it surfaces the
 * AI-classified *intelligence* on a target: a header marker that rolls up the whole
 * assessment, then one row per fact. Every fact carries an {@link AIExplainability}
 * chip whose color telegraphs trust (verified + high-confidence → success; an
 * unverified, ungrounded guess → warning) and whose popover breaks the provenance
 * out in full via {@link AIExplainabilityDetails}.
 *
 * The "Task drone to investigate" button opens a picker of eligible drones sorted
 * by ETA — *which* drone matters now: only the category's best sensor can raise
 * facts to High confidence (wrong-sensor passes cap at Medium). While the chosen
 * drone flies out and collects, this panel reflects the investigation status; on
 * completion the facts' tiers rise — so confidence chips recolor and upgraded rows
 * pick up a "revised" marker, live. A stale track (coverage lost) keeps the same
 * flow: tasking a drone to its last-known position re-acquires it.
 *
 * Below the investigation controls sits "Pass intel": once enough facts are
 * verified, the assessment can be handed to the nearest blue unit — worth points
 * if the contact really is hostile, a penalty if it turns out to be civilian.
 */
import { AIExplainability, AIExplainabilityDetails } from "@/components/ui/ai-explainability";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Icon } from "@/components/ui/icon";
import { Menu, MenuDivider, MenuItem } from "@/components/ui/menu";
import { MenuPopover } from "@/components/ui/popover";
import { Section } from "@/components/ui/section";
import { Tag } from "@/components/ui/tag";

import type { BlueUnit } from "./blue";
import { type Drone, SENSOR_META, formatClock, formatMissionClock } from "./data";
import {
    type FireMission,
    CIVILIAN_STRIKE_PENALTY,
    PASS_MIN_VERIFIED,
    PASS_SCORE_PER_VERIFIED,
    STRIKE_SCORE,
    canInvestigate,
    canStrike,
    canStrikeTarget,
    etaTicks,
} from "./stream/engine";
import { type Target, type TargetFact, PRIORITY_META, deriveFact, deriveOverall } from "./targets";

interface TargetDetailProps {
    target: Target;
    /** The full fleet — the tasking picker filters it to eligible drones. */
    drones: Drone[];
    /** Blue forces — pass-intel goes to the nearest live unit. */
    blues: BlueUnit[];
    /** External fire missions remaining this shift. */
    fires: number;
    /** Rounds in flight — drives the "fires inbound" state for this target. */
    firesInFlight: FireMission[];
    dark: boolean;
    /** Renders a close button in the header (the pinned desktop rail). */
    onClose?: () => void;
    /** Task the chosen drone to investigate this target. */
    onTask?: (droneId: string) => void;
    /** Pass this target's intel to the nearest blue unit. */
    onPassIntel?: () => void;
    /** Task the chosen Talon to fly a strike run on this target. */
    onStrike?: (droneId: string) => void;
    /** Task the chosen drone to designate this target for external fires. */
    onDesignate?: (droneId: string) => void;
}

function FactRow({ fact, dark }: { fact: TargetFact; dark: boolean }) {
    return (
        <div className="flex items-center justify-between gap-3 px-3 py-2">
            <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
                    {fact.label}
                </span>
                <span className="truncate text-body font-medium text-foreground">{fact.value}</span>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
                {fact.upgraded && (
                    <Tag
                        minimal
                        intent="success"
                        icon={<Icon icon="arrow-up" size={11} className="!text-current" />}
                        title="Confidence raised after investigation"
                    >
                        revised
                    </Tag>
                )}
                <AIExplainability
                    size="small"
                    intent={fact.chipIntent}
                    label={fact.confidence}
                    dark={dark}
                    ariaLabel={`${fact.label}: ${fact.confidence} confidence, ${fact.verified ? "verified" : "unverified"} — explain`}
                    popoverProps={{ side: "left", align: "start" }}
                    popover={
                        <AIExplainabilityDetails
                            states={fact.states}
                            confidence={fact.confidenceDetail}
                            grounding={fact.grounding}
                            model={fact.model}
                        >
                            {`AI-classified attribute "${fact.label}". ${
                                fact.verified
                                    ? "Confirmed against the sensor track."
                                    : "Not yet confirmed by a close-pass — review before acting on it."
                            }`}
                        </AIExplainabilityDetails>
                    }
                />
            </div>
        </div>
    );
}

/** Investigation status → the status callout + the drone-picker tasking menu. */
function InvestigationControls({
    target,
    drones,
    dark,
    onTask,
}: {
    target: Target;
    drones: Drone[];
    dark: boolean;
    onTask?: (droneId: string) => void;
}) {
    const inv = target.investigation;
    const drone = inv.droneCallsign ?? "A drone";

    if (inv.status === "enroute" || inv.status === "investigating") {
        const collecting = inv.status === "investigating";
        return (
            <>
                <Callout intent="primary" icon={<Icon icon="locate" />} title="Investigation in progress">
                    {collecting
                        ? `${drone} is on station over ${target.designation}, collecting close-pass sensor data.`
                        : `${drone} has been tasked and is en route to ${target.designation}.`}
                </Callout>
                <Button fill loading disabled>
                    {collecting ? "Collecting intel…" : `${drone} en route…`}
                </Button>
            </>
        );
    }

    if (inv.status === "complete") {
        return (
            <>
                <Callout intent="success" icon={<Icon icon="tick-circle" />} title="Investigation complete">
                    {drone} re-acquired {target.designation}. Attributes were re-classified and confidence
                    ratings revised — see the updated chips above.
                </Callout>
                <Button fill variant="minimal" disabled icon={<Icon icon="tick-circle" className="!text-current" />}>
                    Investigation complete
                </Button>
            </>
        );
    }

    // Eligible fleet, nearest first. Grounded drones count (tasking launches them);
    // their ETA is measured from base.
    const eligible = drones
        .filter(canInvestigate)
        .map((d) => ({ drone: d, eta: etaTicks(d.position, target.position) }))
        .sort((a, b) => a.eta - b.eta);
    const stale = target.track === "stale";

    if (eligible.length === 0) {
        return (
            <Button fill disabled icon={<Icon icon="locate" className="!text-current" />}>
                No drone available to task
            </Button>
        );
    }

    const nearest = eligible[0];
    return (
        <MenuPopover
            dark={dark}
            side="top"
            align="start"
            content={
                <Menu size="small">
                    <MenuItem
                        icon="send-to-map"
                        text={`Send nearest — ${nearest.drone.callsign}`}
                        label={`ETA ${formatClock(nearest.eta)}`}
                        onClick={() => onTask?.(nearest.drone.id)}
                    />
                    <MenuDivider title="All eligible drones" />
                    {eligible.map(({ drone: d, eta }) => (
                        <MenuItem
                            key={d.id}
                            icon={SENSOR_META[d.sensor].icon}
                            text={
                                <span className="inline-flex items-center gap-1.5">
                                    {d.callsign}
                                    <span className="text-foreground-muted">{SENSOR_META[d.sensor].label}</span>
                                    {d.sensor === target.bestSensor && (
                                        <Tag minimal intent="success">
                                            best sensor
                                        </Tag>
                                    )}
                                </span>
                            }
                            label={`${Math.round(d.battery)}% · ETA ${formatClock(eta)}`}
                            onClick={() => onTask?.(d.id)}
                        />
                    ))}
                </Menu>
            }
        >
            <Button fill intent="primary" icon={<Icon icon="locate" className="!text-current" />} endIcon={<Icon icon="caret-up" className="!text-current" />}>
                {stale ? "Task drone to re-acquire" : "Task drone to investigate"}
            </Button>
        </MenuPopover>
    );
}

/**
 * The pass-intel action. Gated on {@link PASS_MIN_VERIFIED} verified facts (the
 * engine enforces the same rule); one pass per target. The button names the
 * nearest live blue so the operator knows who'll act on it.
 */
function PassIntelControls({
    target,
    blues,
    verifiedCount,
    onPassIntel,
}: {
    target: Target;
    blues: BlueUnit[];
    verifiedCount: number;
    onPassIntel?: () => void;
}) {
    if (target.passedTo) {
        return (
            <Button fill variant="minimal" disabled icon={<Icon icon="tick-circle" className="!text-current" />}>
                Intel passed to {target.passedTo}
            </Button>
        );
    }

    const alive = blues.filter((b) => b.status !== "hit");
    if (alive.length === 0) {
        return (
            <Button fill disabled icon={<Icon icon="send-message" className="!text-current" />}>
                No blue unit able to receive
            </Button>
        );
    }

    const nearest = alive.reduce((a, b) =>
        etaTicks(b.position, target.position) < etaTicks(a.position, target.position) ? b : a,
    );
    const ready = verifiedCount >= PASS_MIN_VERIFIED;
    return (
        <div className="flex flex-col gap-1.5">
            <Button
                fill
                disabled={!ready}
                icon={<Icon icon="send-message" className="!text-current" />}
                onClick={onPassIntel}
            >
                Pass intel to {nearest.callsign}
            </Button>
            <span className="px-1 text-body-xs text-foreground-muted">
                {ready
                    ? `Worth +${verifiedCount * PASS_SCORE_PER_VERIFIED} pts if hostile — a civilian call costs score.`
                    : `Needs ${PASS_MIN_VERIFIED} verified facts (${verifiedCount}/${PASS_MIN_VERIFIED}) — investigate with the best sensor first.`}
            </span>
        </div>
    );
}

/**
 * The strike actions — the core risk mechanic. Two weapons: a Talon strike run
 * (one munition, resolves on arrival) and external fires (a drone designates for
 * a window, then a delayed round lands on the aim point). Both resolve against
 * ground truth, so striking below a verified-hostile classification is a gamble —
 * the warning callout says exactly what's at stake. Known civilians never offer a
 * strike (the engine refuses too); stale tracks must be re-acquired first.
 */
function StrikeControls({
    target,
    drones,
    fires,
    firesInFlight,
    dark,
    onStrike,
    onDesignate,
}: {
    target: Target;
    drones: Drone[];
    fires: number;
    firesInFlight: FireMission[];
    dark: boolean;
    onStrike?: (droneId: string) => void;
    onDesignate?: (droneId: string) => void;
}) {
    if (!canStrikeTarget(target)) {
        // Known civilian (no strike offered) — or a stale track (re-acquire first,
        // which is what the investigation button above already says).
        return null;
    }

    const striker = drones.find((d) => d.assignment?.kind === "strike" && d.assignment.targetId === target.id);
    const designator = drones.find((d) => d.assignment?.kind === "designate" && d.assignment.targetId === target.id);
    const inbound = firesInFlight.some((f) => f.targetId === target.id);
    const verified = target.affiliationKnown; // canStrikeTarget ⇒ hostile if known

    if (striker || designator || inbound) {
        return (
            <>
                {striker && (
                    <Callout intent="danger" icon={<Icon icon="locate" />} title="Strike run in progress">
                        {striker.callsign} is wings-hot inbound on {target.designation} — recall the drone to abort.
                    </Callout>
                )}
                {designator && (
                    <Callout intent="warning" icon={<Icon icon="send-to-map" />} title="Designating for external fires">
                        {designator.callsign} is holding the designation orbit over {target.designation}. The
                        round launches once the designation window completes.
                    </Callout>
                )}
                {inbound && (
                    <Callout intent="danger" icon={<Icon icon="error" />} title="Fires inbound">
                        A round is in the air for {target.designation}. It lands on the marked aim point — a
                        target that moves off it survives.
                    </Callout>
                )}
            </>
        );
    }

    const talons = drones
        .filter(canStrike)
        .map((d) => ({ drone: d, eta: etaTicks(d.position, target.position) }))
        .sort((a, b) => a.eta - b.eta);
    const designators = drones
        .filter(canInvestigate)
        .map((d) => ({ drone: d, eta: etaTicks(d.position, target.position) }))
        .sort((a, b) => a.eta - b.eta);

    return (
        <div className="flex flex-col gap-1.5">
            {verified ? (
                <Callout intent="danger" icon={<Icon icon="warning-sign" />} title="Weapons release authorized">
                    {target.designation} is a verified hostile — a strike pays +{STRIKE_SCORE} pts.
                </Callout>
            ) : (
                <Callout intent="warning" icon={<Icon icon="warning-sign" />} title="Below High confidence — striking is a gamble">
                    Affiliation unverified. The strike resolves against ground truth: a hostile pays +
                    {STRIKE_SCORE} pts, a civilian costs −{CIVILIAN_STRIKE_PENALTY}. Investigate with the best
                    sensor to verify first.
                </Callout>
            )}
            {talons.length === 0 ? (
                <Button fill disabled icon={<Icon icon="airplane" className="!text-current" />}>
                    No armed Talon available
                </Button>
            ) : (
                <MenuPopover
                    dark={dark}
                    side="top"
                    align="start"
                    content={
                        <Menu size="small">
                            {talons.map(({ drone: d, eta }) => (
                                <MenuItem
                                    key={d.id}
                                    icon="airplane"
                                    intent="danger"
                                    text={
                                        <span className="inline-flex items-center gap-1.5">
                                            {d.callsign}
                                            <span className="text-foreground-muted">
                                                {d.munitions} munition{d.munitions === 1 ? "" : "s"}
                                            </span>
                                        </span>
                                    }
                                    label={`${Math.round(d.battery)}% · ETA ${formatClock(eta)}`}
                                    onClick={() => onStrike?.(d.id)}
                                />
                            ))}
                        </Menu>
                    }
                >
                    <Button fill intent="danger" icon={<Icon icon="locate" className="!text-current" />} endIcon={<Icon icon="caret-up" className="!text-current" />}>
                        Strike with Talon
                    </Button>
                </MenuPopover>
            )}
            {fires === 0 ? (
                <Button fill disabled icon={<Icon icon="send-to-map" className="!text-current" />}>
                    External fires expended
                </Button>
            ) : designators.length === 0 ? (
                <Button fill disabled icon={<Icon icon="send-to-map" className="!text-current" />}>
                    No drone available to designate
                </Button>
            ) : (
                <MenuPopover
                    dark={dark}
                    side="top"
                    align="start"
                    content={
                        <Menu size="small">
                            <MenuDivider title="Designating drone" />
                            {designators.map(({ drone: d, eta }) => (
                                <MenuItem
                                    key={d.id}
                                    icon={SENSOR_META[d.sensor].icon}
                                    text={
                                        <span className="inline-flex items-center gap-1.5">
                                            {d.callsign}
                                            <span className="text-foreground-muted">{SENSOR_META[d.sensor].label}</span>
                                        </span>
                                    }
                                    label={`${Math.round(d.battery)}% · ETA ${formatClock(eta)}`}
                                    onClick={() => onDesignate?.(d.id)}
                                />
                            ))}
                        </Menu>
                    }
                >
                    <Button fill variant="outlined" intent="danger" icon={<Icon icon="send-to-map" className="!text-current" />} endIcon={<Icon icon="caret-up" className="!text-current" />}>
                        Call external fires ({fires} left)
                    </Button>
                </MenuPopover>
            )}
            <span className="px-1 text-body-xs text-foreground-muted">
                Fires need a drone holding the designation orbit; the round lands after a delay on a fixed
                aim point, so a moving target can slip it. A Talon chases the live track.
            </span>
        </div>
    );
}

export function TargetDetail({ target, drones, blues, fires, firesInFlight, dark, onClose, onTask, onPassIntel, onStrike, onDesignate }: TargetDetailProps) {
    const meta = PRIORITY_META[target.priority];
    const facts = target.facts.map(deriveFact);
    const verifiedCount = facts.filter((f) => f.verified).length;
    const overall = deriveOverall(target);
    const stale = target.track === "stale";

    return (
        <div className="flex flex-col gap-4 p-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-start gap-2.5">
                    <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-mithril border border-divider bg-surface">
                        <Icon icon={target.icon} size={18} className="text-foreground-muted" />
                    </span>
                    <div className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-lg font-semibold tabular-nums text-foreground">{target.designation}</span>
                        <span className="text-body-sm text-foreground-muted">{target.classification}</span>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                    <Tag intent={meta.intent} icon={<Icon icon={meta.icon} size={12} className="!text-current" />}>
                        {meta.label}
                    </Tag>
                    {onClose && (
                        <Button
                            variant="minimal"
                            size="small"
                            aria-label="Close target details"
                            icon={<Icon icon="cross" className="!text-current" />}
                            onClick={onClose}
                        />
                    )}
                </div>
            </div>

            {/* Struck — the strike's outcome is the target's epitaph */}
            {target.struck &&
                (target.affiliation === "hostile" ? (
                    <Callout intent="success" icon={<Icon icon="tick-circle" />} title="Target neutralized">
                        {target.designation} was destroyed at {target.struckAt} — confirmed hostile.
                    </Callout>
                ) : (
                    <Callout intent="danger" icon={<Icon icon="error" />} title="Strike incident">
                        {target.designation} was struck at {target.struckAt} and assessed civilian after the
                        fact — casualties reported on the ground.
                    </Callout>
                ))}

            {/* Stale track — coverage lost; position is last known */}
            {stale && (
                <Callout intent="warning" icon={<Icon icon="eye-off" />} title="Track stale">
                    No sensor has covered {target.designation} since {formatMissionClock(target.lastSeenTick)}.
                    The position shown is last known — task a drone to re-acquire the track.
                </Callout>
            )}

            {/* Live jammer — this contact is actively denying drone comms around it */}
            {target.jammer && !target.struck && (
                <Callout intent="warning" icon={<Icon icon="feed" />} title="Active jammer">
                    {target.designation} is jamming drone uplinks inside the marked ring — a drone in
                    it loses its link home and banks intel aboard. Striking the emitter clears the
                    interference.
                </Callout>
            )}

            {/* Overall AI assessment */}
            <Callout intent={meta.intent} icon={<Icon icon="predictive-analysis" />} title="AI assessment">
                <div className="flex flex-col gap-2.5">
                    <span>{target.summary}</span>
                    <AIExplainability
                        size="small"
                        intent={meta.intent === "danger" ? "warning" : "primary"}
                        label={`${verifiedCount}/${facts.length} verified`}
                        dark={dark}
                        className="self-start"
                        popoverProps={{ side: "bottom", align: "start" }}
                        popover={
                            <AIExplainabilityDetails
                                states={overall.states}
                                confidence={overall.confidence}
                                grounding={overall.grounding}
                                model={overall.model}
                            >
                                Rolled up from every classified attribute below. Confidence and
                                verification vary per fact — open each chip to see its source.
                            </AIExplainabilityDetails>
                        }
                    />
                </div>
            </Callout>

            {/* Detection meta */}
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-mithril border border-divider bg-divider">
                <MetaCell label="Category" value={target.category} />
                <MetaCell label="Priority" value={meta.label} />
                <MetaCell label="Detected by" value={target.detectedBy} />
                <MetaCell label="First seen" value={target.detectedAt} />
                <MetaCell label="Best sensor" value={SENSOR_META[target.bestSensor].label} />
                <MetaCell
                    label="Track"
                    value={
                        target.struck ? (
                            <span className="text-foreground-muted">Struck</span>
                        ) : stale ? (
                            <span className="text-intent-warning-text">Stale</span>
                        ) : (
                            <span className="text-intent-success-text">Active</span>
                        )
                    }
                />
                <MetaCell
                    label="Affiliation"
                    value={
                        target.affiliationKnown ? (
                            target.affiliation === "hostile" ? (
                                <span className="text-intent-danger-text">Hostile</span>
                            ) : (
                                <span className="text-intent-success-text">Civilian</span>
                            )
                        ) : (
                            "Unknown"
                        )
                    }
                />
                <MetaCell label="Intel" value={target.passedTo ? `Passed to ${target.passedTo}` : "Not passed"} />
            </div>

            {/* Classified facts */}
            <Section title="Classified intelligence" icon="predictive-analysis" compact>
                <div className="divide-y divide-divider">
                    {facts.map((f) => (
                        <FactRow key={f.id} fact={f} dark={dark} />
                    ))}
                </div>
            </Section>

            <p className="px-1 text-body-xs text-foreground-muted">
                Each attribute is labelled with the model's confidence and whether it's been verified.
                Task a drone for a close pass to confirm low-confidence facts — only the category's
                best sensor ({SENSOR_META[target.bestSensor].label}) can take them to High.
            </p>

            {!target.struck && (
                <>
                    <InvestigationControls target={target} drones={drones} dark={dark} onTask={onTask} />
                    <PassIntelControls target={target} blues={blues} verifiedCount={verifiedCount} onPassIntel={onPassIntel} />
                    <StrikeControls
                        target={target}
                        drones={drones}
                        fires={fires}
                        firesInFlight={firesInFlight}
                        dark={dark}
                        onStrike={onStrike}
                        onDesignate={onDesignate}
                    />
                </>
            )}
        </div>
    );
}

/** Label-over-value cell for the detail panels' meta grids (also used by BlueDetail). */
export function MetaCell({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-0.5 bg-background px-3 py-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">{label}</span>
            <span className="truncate text-body-sm font-medium text-foreground">{value}</span>
        </div>
    );
}
