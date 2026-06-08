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
 * The "Task drone to investigate" button dispatches the nearest free drone (handled
 * by the stream engine). While it flies out and collects, this panel reflects the
 * investigation status; on completion the facts' tiers rise — so confidence chips
 * recolor and upgraded rows pick up a "revised" marker, live.
 */
import { AIExplainability, AIExplainabilityDetails } from "@/components/ui/ai-explainability";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import { Tag } from "@/components/ui/tag";

import { type Target, type TargetFact, PRIORITY_META, deriveFact, deriveOverall } from "./targets";

interface TargetDetailProps {
    target: Target;
    dark: boolean;
    /** Renders a close button in the header (the pinned desktop rail). */
    onClose?: () => void;
    /** Task the nearest free drone to investigate this target. */
    onTask?: () => void;
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

/** Investigation status → the status callout + tasking button. */
function InvestigationControls({ target, onTask }: { target: Target; onTask?: () => void }) {
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

    return (
        <Button
            fill
            intent="primary"
            icon={<Icon icon="locate" className="!text-current" />}
            onClick={onTask}
        >
            Task drone to investigate
        </Button>
    );
}

export function TargetDetail({ target, dark, onClose, onTask }: TargetDetailProps) {
    const meta = PRIORITY_META[target.priority];
    const facts = target.facts.map(deriveFact);
    const verifiedCount = facts.filter((f) => f.verified).length;
    const overall = deriveOverall(target);

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
                Task a drone for a close pass to confirm low-confidence, ungrounded facts.
            </p>

            <InvestigationControls target={target} onTask={onTask} />
        </div>
    );
}

function MetaCell({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-0.5 bg-background px-3 py-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">{label}</span>
            <span className="truncate text-body-sm font-medium text-foreground">{value}</span>
        </div>
    );
}
