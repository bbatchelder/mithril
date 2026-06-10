/**
 * BlueDetail — the right rail (and mobile sheet) for a selected blue unit.
 *
 * Smaller than TargetDetail by design: a blue unit is something you *protect*,
 * not something you analyze. It shows the unit's status and posture, any open
 * ISR request it has radioed in (the ring on the map), and the intel warnings
 * it has received via pass-intel — each one linking back to the target so the
 * operator can re-check the threat.
 */
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import { Tag } from "@/components/ui/tag";

import { type BlueUnit, type IsrRequest, BLUE_KIND_META, BLUE_STATUS_META } from "./blue";
import { MetaCell } from "./TargetDetail";
import type { Target } from "./targets";

interface BlueDetailProps {
    blue: BlueUnit;
    /** Known targets — resolves warned-about ids to designations. */
    targets: Target[];
    /** The shift's ISR requests — this unit's active one renders as a callout. */
    isr: IsrRequest[];
    /** Renders a close button in the header (the pinned desktop rail). */
    onClose?: () => void;
    /** Jump to a warned-about target's detail panel. */
    onSelectTarget?: (id: string) => void;
}

export function BlueDetail({ blue, targets, isr, onClose, onSelectTarget }: BlueDetailProps) {
    const kind = BLUE_KIND_META[blue.kind];
    const status = BLUE_STATUS_META[blue.status];
    const request = isr.find((r) => r.from === blue.callsign && r.status === "active");
    const warnings = [...blue.warnedAbout]
        .map((id) => targets.find((t) => t.id === id))
        .filter((t): t is Target => Boolean(t));

    return (
        <div className="flex flex-col gap-4 p-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-start gap-2.5">
                    <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-mithril border border-divider bg-surface">
                        <Icon icon={kind.icon} size={18} className="text-intent-primary-text" />
                    </span>
                    <div className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-lg font-semibold tabular-nums text-foreground">{blue.callsign}</span>
                        <span className="text-body-sm text-foreground-muted">{kind.label}</span>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                    <Tag intent={status.intent}>{status.label}</Tag>
                    {onClose && (
                        <Button
                            variant="minimal"
                            size="small"
                            aria-label="Close blue unit details"
                            icon={<Icon icon="cross" className="!text-current" />}
                            onClick={onClose}
                        />
                    )}
                </div>
            </div>

            {blue.status === "hit" && (
                <Callout intent="danger" icon={<Icon icon="cross-circle" />} title="Unit hit">
                    {blue.callsign} was caught by a hostile contact and took casualties. It is combat
                    ineffective for the rest of the shift.
                </Callout>
            )}

            {request && (
                <Callout intent="warning" icon={<Icon icon="satellite" />} title="Requesting ISR coverage">
                    {blue.callsign} needs eyes on the marked ring — keep any drone inside it to fulfil
                    the request (+{request.reward} pts before the window closes).
                </Callout>
            )}

            {/* Unit meta */}
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-mithril border border-divider bg-divider">
                <MetaCell label="Kind" value={kind.label} />
                <MetaCell label="Status" value={status.label} />
                <MetaCell label="Route legs" value={blue.route.length > 1 ? String(blue.route.length) : "Static post"} />
                <MetaCell label="Warnings received" value={String(warnings.length)} />
            </div>

            {/* Intel warnings this unit holds */}
            <Section title="Threat warnings" icon="send-message" compact>
                {warnings.length === 0 ? (
                    <p className="px-3 py-2 text-body-sm text-foreground-muted">
                        No intel passed to this unit yet. Pass intel on a classified hostile and the
                        nearest blue will reroute or hold clear of it.
                    </p>
                ) : (
                    <div className="divide-y divide-divider">
                        {warnings.map((t) => (
                            <div key={t.id} className="flex items-center justify-between gap-3 px-3 py-2">
                                <div className="flex min-w-0 flex-col gap-0.5">
                                    <span className="text-body font-medium tabular-nums text-foreground">{t.designation}</span>
                                    <span className="truncate text-body-sm text-foreground-muted">{t.category}</span>
                                </div>
                                <Button variant="minimal" size="small" onClick={() => onSelectTarget?.(t.id)}>
                                    View track
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </Section>

            <p className="px-1 text-body-xs text-foreground-muted">
                Blue units follow their routes on their own. They can't see what your sensors see —
                an unwarned unit that crosses paths with a hostile will take the hit.
            </p>
        </div>
    );
}
