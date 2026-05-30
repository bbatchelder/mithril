/* eslint-disable no-restricted-imports */
/**
 * FleetTree — the left-rail roster. A controlled `Tree` of Squadron → Drone,
 * each drone row showing a status dot and battery. Selecting a drone drives the
 * map and the telemetry panel.
 */
import { useMemo, useState } from "react";

import { Tree, type TreeNodeInfo } from "@/components/ui/tree";

import { type Drone, SQUADRONS, STATUS_META } from "./data";

interface FleetTreeProps {
    drones: Drone[];
    selectedId: string | null;
    query?: string;
    onSelect: (id: string) => void;
}

function StatusDot({ status }: { status: Drone["status"] }) {
    return (
        <span
            className={`inline-block size-2 rounded-full ${STATUS_META[status].dot}`}
            title={STATUS_META[status].label}
        />
    );
}

function batteryTone(b: number): string {
    if (b < 20) return "text-intent-danger-text";
    if (b < 40) return "text-intent-warning-text";
    return "text-foreground-muted";
}

export function FleetTree({ drones, selectedId, query = "", onSelect }: FleetTreeProps) {
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

    const q = query.trim().toLowerCase();
    const contents = useMemo<TreeNodeInfo[]>(() => {
        return SQUADRONS.map((sq) => {
            const members = drones.filter(
                (d) =>
                    d.squadronId === sq.id &&
                    (!q || d.callsign.toLowerCase().includes(q) || d.model.toLowerCase().includes(q) || d.task.toLowerCase().includes(q)),
            );
            const airborne = members.filter((d) => d.status === "active" || d.status === "anomaly").length;
            const isExpanded = q ? true : !collapsed.has(sq.id);
            return {
                id: sq.id,
                icon: sq.icon,
                label: <span className="font-medium">{sq.name}</span>,
                isExpanded,
                secondaryLabel: (
                    <span className="text-body-sm text-foreground-muted tabular-nums">
                        {airborne}/{members.length}
                    </span>
                ),
                childNodes: members.map<TreeNodeInfo>((d) => ({
                    id: d.id,
                    icon: "airplane",
                    isSelected: d.id === selectedId,
                    label: (
                        <span className="inline-flex items-center gap-2">
                            <StatusDot status={d.status} />
                            <span className="tabular-nums">{d.callsign}</span>
                        </span>
                    ),
                    secondaryLabel: (
                        <span className={`text-body-sm tabular-nums ${batteryTone(d.battery)}`}>
                            {Math.round(d.battery)}%
                        </span>
                    ),
                })),
            };
        });
    }, [drones, selectedId, collapsed, q]);

    return (
        <Tree
            contents={contents}
            onNodeClick={(node) => {
                const id = String(node.id);
                if (SQUADRONS.some((s) => s.id === id)) {
                    // Clicking a squadron row toggles it too.
                    toggle(id);
                } else {
                    onSelect(id);
                }
            }}
            onNodeExpand={(node) => toggle(String(node.id), true)}
            onNodeCollapse={(node) => toggle(String(node.id), false)}
        />
    );

    function toggle(id: string, expand?: boolean) {
        setCollapsed((prev) => {
            const next = new Set(prev);
            const shouldExpand = expand ?? next.has(id);
            if (shouldExpand) next.delete(id);
            else next.add(id);
            return next;
        });
    }
}
