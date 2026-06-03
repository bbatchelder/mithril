/* eslint-disable no-restricted-imports */
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { InputGroup } from "@/components/ui/input-group";
import { Menu, MenuItem, MenuDivider } from "@/components/ui/menu";
import { Navbar, NavbarGroup, NavbarHeading, NavbarDivider } from "@/components/ui/navbar";
import { NonIdealState } from "@/components/ui/non-ideal-state";
import { MenuPopover } from "@/components/ui/popover";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select } from "@/components/ui/select";
import { Tag } from "@/components/ui/tag";
import { Tooltip } from "@/components/ui/tooltip";
import { useToaster } from "@/components/ui/toast";
import { useDark } from "@/lib/dark-context";
import { AppChromeControls } from "@/lib/app-chrome";

import { AlertDetail } from "./AlertDetail";
import { AlertTable, type RowAction } from "./AlertTable";
import { NewIncidentDialog, type NewIncidentDraft } from "./NewIncidentDialog";
import { StatBar, type Kpi } from "./StatBar";
import {
    type Alert,
    type AlertStatus,
    type Severity,
    ALERTS,
    ANALYSTS,
    SEVERITY_LABEL,
    STATUS_OPTIONS,
    SEVERITY_OPTIONS,
} from "./data";

function severityLabel(value: Severity | "all"): string {
    return value === "all" ? "All severities" : SEVERITY_LABEL[value];
}

export function SocConsole() {
    const toaster = useToaster();
    const dark = useDark();

    // Alert state — actions mutate status / assignee in place.
    const [alerts, setAlerts] = useState<Alert[]>(ALERTS);

    // Filters
    const [statusFilter, setStatusFilter] = useState<AlertStatus | "all">("all");
    const [severityFilter, setSeverityFilter] = useState<Severity | "all">("all");
    const [assigneeFilter, setAssigneeFilter] = useState<string>("All assignees");
    const [search, setSearch] = useState("");

    // Drawer
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    // New-incident wizard
    const [newIncidentOpen, setNewIncidentOpen] = useState(false);

    const selected = useMemo(
        () => alerts.find((a) => a.id === selectedId) ?? null,
        [alerts, selectedId],
    );

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return alerts.filter((a) => {
            if (statusFilter !== "all" && a.status !== statusFilter) return false;
            if (severityFilter !== "all" && a.severity !== severityFilter) return false;
            if (assigneeFilter !== "All assignees" && a.assignee !== assigneeFilter) return false;
            if (q) {
                const hay = `${a.id} ${a.title} ${a.asset} ${a.source} ${a.detector}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [alerts, statusFilter, severityFilter, assigneeFilter, search]);

    const kpis: Kpi[] = useMemo(() => {
        const open = alerts.filter((a) => a.status !== "resolved").length;
        const critical = alerts.filter((a) => a.severity === "critical" && a.status !== "resolved").length;
        return [
            { label: "Open alerts", value: String(open), icon: "issue", iconIntent: "primary", trend: "+3", trendIntent: "warning", trendDirection: "up" },
            { label: "Critical", value: String(critical), icon: "high-priority", iconIntent: "danger", trend: "+1", trendIntent: "danger", trendDirection: "up" },
            { label: "Mean time to ack", value: "8m 12s", icon: "time", iconIntent: "success", trend: "-9%", trendIntent: "success", trendDirection: "down" },
            { label: "Analysts online", value: "4", icon: "people", iconIntent: "primary" },
        ];
    }, [alerts]);

    // ── Mutations ────────────────────────────────────────────────────────────
    const setStatus = (id: string, status: AlertStatus) =>
        setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));

    const setAssignee = (id: string, assignee: string) =>
        setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, assignee } : a)));

    const handleAcknowledge = (alert: Alert) => {
        setStatus(alert.id, "in-progress");
        toaster.show({ intent: "primary", icon: "endorsed", message: `${alert.id} acknowledged — moved to In Progress.` });
    };

    const handleEscalate = (alert: Alert) => {
        toaster.show({ intent: "warning", icon: "arrow-up", message: `${alert.id} escalated to the incident lead.` });
    };

    const handleAssign = (alert: Alert, analyst: string) => {
        setAssignee(alert.id, analyst);
        toaster.show({
            intent: "success",
            icon: "person",
            message: analyst === "Unassigned" ? `${alert.id} unassigned.` : `${alert.id} assigned to ${analyst}.`,
        });
    };

    const handleCloseIncident = (alert: Alert) => {
        setStatus(alert.id, "resolved");
        toaster.show({ intent: "success", icon: "tick-circle", message: `Incident ${alert.id} closed and resolved.` });
        setDrawerOpen(false);
    };

    const handleCreateIncident = (draft: NewIncidentDraft) => {
        // Next sequential ALRT-#### id from the highest existing number.
        const maxNum = alerts.reduce((max, a) => {
            const n = Number.parseInt(a.id.replace(/\D/g, ""), 10);
            return Number.isNaN(n) ? max : Math.max(max, n);
        }, 0);
        const id = `ALRT-${maxNum + 1}`;

        const alert: Alert = {
            id,
            title: draft.title.trim(),
            severity: draft.severity,
            status: "new",
            detector: draft.detector,
            source: `${draft.detector} / Manual — Analyst-created incident`,
            asset: draft.asset.trim(),
            assetKind: draft.assetKind,
            assignee: draft.assignee,
            mitre: "—",
            mitreName: "Unclassified",
            sourceIp: draft.sourceIp.trim() || "—",
            firstSeen: "Just now",
            age: "just now",
            description: draft.description.trim(),
            timeline: [
                {
                    label: "Incident created",
                    timestamp: "now",
                    icon: "edit",
                    detail: `Manually opened by Maya Okonkwo`,
                },
            ],
            iocs: draft.sourceIp.trim() ? [{ type: "ip", value: draft.sourceIp.trim() }] : [],
        };

        setAlerts((prev) => [alert, ...prev]);
        toaster.show({
            intent: "success",
            icon: "new-object",
            message: `Incident ${id} created — "${alert.title}".`,
        });
    };

    const handleCopyIoc = (value: string) => {
        void navigator.clipboard?.writeText(value);
        toaster.show({ intent: "none", icon: "duplicate", message: `Copied indicator: ${value}` });
    };

    const handleRowAction = (action: RowAction, alert: Alert) => {
        switch (action) {
            case "acknowledge":
                handleAcknowledge(alert);
                break;
            case "assign-me":
                handleAssign(alert, "Maya Okonkwo");
                break;
            case "escalate":
                handleEscalate(alert);
                break;
            case "close":
                handleCloseIncident(alert);
                break;
        }
    };

    const openAlert = (alert: Alert) => {
        setSelectedId(alert.id);
        setDrawerOpen(true);
    };

    const clearFilters = () => {
        setStatusFilter("all");
        setSeverityFilter("all");
        setAssigneeFilter("All assignees");
        setSearch("");
    };

    const assigneeOptions = ["All assignees", ...ANALYSTS];

    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            {/* ── Top navbar ─────────────────────────────────────────────── */}
            <Navbar className="shrink-0">
                <NavbarGroup align="left">
                    <span className="mr-2 inline-flex items-center justify-center">
                        <Icon icon="shield" size={20} className="text-intent-primary-text" />
                    </span>
                    <NavbarHeading className="font-semibold">Sentinel SOC</NavbarHeading>
                    <Tag minimal intent="success" icon={<Icon icon="pulse" size={12} className="!text-current" />}>
                        LIVE
                    </Tag>
                    <NavbarDivider />
                    <div className="hidden md:block">
                        <InputGroup
                            leftIcon="search"
                            placeholder="Search alerts, assets, IPs…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ width: 300 }}
                        />
                    </div>
                </NavbarGroup>
                <NavbarGroup align="right">
                    <Button
                        intent="primary"
                        icon={<Icon icon="plus" className="!text-current" />}
                        onClick={() => setNewIncidentOpen(true)}
                    >
                        New incident
                    </Button>
                    <Tooltip content="Notifications" dark={dark}>
                        <Button
                            variant="minimal"
                            aria-label="Notifications"
                            icon={<Icon icon="notifications-updated" className="!text-current" />}
                            onClick={() =>
                                toaster.show({ intent: "none", icon: "notifications-updated", message: "No new notifications." })
                            }
                        />
                    </Tooltip>
                    <NavbarDivider />
                    <MenuPopover
                        side="bottom"
                        align="end"
                        dark={dark}
                        content={
                            <Menu>
                                <MenuDivider title="Maya Okonkwo" />
                                <MenuItem icon="person" text="Profile" />
                                <MenuItem icon="cog" text="Preferences" />
                                <MenuDivider />
                                <MenuItem icon="log-out" text="Sign out" intent="danger" />
                            </Menu>
                        }
                    >
                        <Button
                            variant="minimal"
                            icon={<Icon icon="person" className="!text-current" />}
                            endIcon={<Icon icon="caret-down" className="!text-current" />}
                        >
                            Maya O.
                        </Button>
                    </MenuPopover>
                    <NavbarDivider />
                    <AppChromeControls />
                </NavbarGroup>
            </Navbar>

            {/* ── Body ───────────────────────────────────────────────────── */}
            <div className="flex-1 overflow-auto">
                <div className="mx-auto flex max-w-[1400px] flex-col gap-6 p-6">
                    {/* KPI row */}
                    <StatBar kpis={kpis} />

                    {/* Filter bar */}
                    <div className="flex flex-wrap items-center gap-3">
                        <SegmentedControl
                            options={STATUS_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
                            value={statusFilter}
                            onValueChange={(v) => setStatusFilter(v as AlertStatus | "all")}
                        />

                        <Select<Severity | "all">
                            items={SEVERITY_OPTIONS}
                            filterable={false}
                            dark={dark}
                            selectedItem={severityFilter}
                            onItemSelect={(v) => setSeverityFilter(v)}
                            itemRenderer={(item, { modifiers, handleClick }) => (
                                <MenuItem
                                    key={item}
                                    text={severityLabel(item)}
                                    active={modifiers.active}
                                    icon={item === severityFilter ? "tick" : undefined}
                                    onClick={handleClick}
                                />
                            )}
                        >
                            <Button
                                variant="outlined"
                                icon={<Icon icon="filter" className="!text-current" />}
                                endIcon={<Icon icon="caret-down" className="!text-current" />}
                            >
                                {severityLabel(severityFilter)}
                            </Button>
                        </Select>

                        <Select<string>
                            items={assigneeOptions}
                            filterable
                            dark={dark}
                            placeholder="Filter analysts…"
                            selectedItem={assigneeFilter}
                            itemPredicate={(q, item) => item.toLowerCase().includes(q.toLowerCase())}
                            onItemSelect={(v) => setAssigneeFilter(v)}
                            itemRenderer={(item, { modifiers, handleClick }) => (
                                <MenuItem
                                    key={item}
                                    text={item}
                                    active={modifiers.active}
                                    icon={item === assigneeFilter ? "tick" : undefined}
                                    onClick={handleClick}
                                />
                            )}
                        >
                            <Button
                                variant="outlined"
                                icon={<Icon icon="person" className="!text-current" />}
                                endIcon={<Icon icon="caret-down" className="!text-current" />}
                            >
                                {assigneeFilter}
                            </Button>
                        </Select>

                        <div className="grow" />

                        <span className="text-body-sm text-foreground-muted">
                            {filtered.length} of {alerts.length} alerts
                        </span>
                    </div>

                    {/* Alerts queue */}
                    {filtered.length === 0 ? (
                        <div className="rounded-bp border border-divider bg-surface">
                            <NonIdealState
                                icon="search"
                                title="No alerts match your filters"
                                description="Try widening the status, severity, or assignee filters, or clearing your search."
                                action={
                                    <Button
                                        icon={<Icon icon="cross" className="!text-current" />}
                                        onClick={clearFilters}
                                    >
                                        Clear filters
                                    </Button>
                                }
                            />
                        </div>
                    ) : (
                        <AlertTable
                            alerts={filtered}
                            selectedId={selectedId}
                            dark={dark}
                            onSelect={openAlert}
                            onAction={handleRowAction}
                        />
                    )}
                </div>
            </div>

            {/* ── New-incident wizard ────────────────────────────────────── */}
            <NewIncidentDialog
                isOpen={newIncidentOpen}
                dark={dark}
                onClose={() => setNewIncidentOpen(false)}
                onCreate={handleCreateIncident}
            />

            {/* ── Detail drawer ──────────────────────────────────────────── */}
            <AlertDetail
                alert={selected}
                isOpen={drawerOpen}
                dark={dark}
                onClose={() => setDrawerOpen(false)}
                onAcknowledge={handleAcknowledge}
                onEscalate={handleEscalate}
                onAssign={handleAssign}
                onCloseIncident={handleCloseIncident}
                onCopyIoc={handleCopyIoc}
            />
        </div>
    );
}

export default SocConsole;
