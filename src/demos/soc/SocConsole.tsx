/* eslint-disable no-restricted-imports */
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { KeyCombo } from "@/components/ui/hotkeys";
import { Icon, type IconName } from "@/components/ui/icon";
import { InputGroup } from "@/components/ui/input-group";
import { Menu, MenuItem, MenuDivider } from "@/components/ui/menu";
import { Navbar, NavbarGroup, NavbarHeading, NavbarDivider } from "@/components/ui/navbar";
import { NonIdealState } from "@/components/ui/non-ideal-state";
import { Omnibar } from "@/components/ui/omnibar";
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
import { SocRail, RailNav, type RailItem } from "./SocRail";
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

/** A command-palette entry. */
interface Command {
    id: string;
    label: string;
    icon: IconName;
    /** Optional shortcut chip shown on the right. */
    hint?: string;
    run: () => void;
}

export function SocConsole() {
    const toaster = useToaster();
    const dark = useDark();

    // Alert state — actions mutate status / assignee in place.
    const [alerts, setAlerts] = useState<Alert[]>(ALERTS);

    // Rail navigation — only "queue" is wired; the rest illustrate the shell.
    const [activeView, setActiveView] = useState("queue");

    // Filters
    const [statusFilter, setStatusFilter] = useState<AlertStatus | "all">("all");
    const [severityFilter, setSeverityFilter] = useState<Severity | "all">("all");
    const [assigneeFilter, setAssigneeFilter] = useState<string>("All assignees");
    const [search, setSearch] = useState("");
    // Two search inputs (navbar on md+, secondary toolbar on mobile); focus whichever is visible.
    const searchRef = useRef<HTMLInputElement>(null);
    const searchMobileRef = useRef<HTMLInputElement>(null);
    const focusSearch = () => {
        const mobile = searchMobileRef.current;
        const el = mobile != null && mobile.offsetParent !== null ? mobile : searchRef.current;
        el?.focus();
    };

    // Rail visibility. On md+ the dark rail is inline and `railOpen` collapses it;
    // below md it's an overlay drawer driven by `navOpen` (rail always hidden inline).
    const [railOpen, setRailOpen] = useState(true);
    const [navOpen, setNavOpen] = useState(false);

    // One menu button drives both: collapse the inline rail on desktop, or summon the
    // overlay drawer on mobile. Resolved at click time so there's no resize listener.
    const toggleRail = () => {
        if (window.matchMedia("(min-width: 768px)").matches) setRailOpen((v) => !v);
        else setNavOpen(true);
    };

    // Inspector (pinned, not an overlay)
    const [selectedId, setSelectedId] = useState<string | null>(null);
    // Keyboard cursor row (j/k)
    const [focusedId, setFocusedId] = useState<string | null>(null);

    // New-incident wizard + command palette
    const [newIncidentOpen, setNewIncidentOpen] = useState(false);
    const [cmdOpen, setCmdOpen] = useState(false);

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
            { label: "Open alerts", value: String(open), icon: "issue", trend: "+3", trendIntent: "warning", trendDirection: "up", spark: [14, 15, 13, 16, 18, 17, 19, open] },
            { label: "Critical", value: String(critical), icon: "high-priority", trend: "+1", trendIntent: "danger", trendDirection: "up", spark: [1, 2, 2, 1, 3, 2, 3, critical] },
            { label: "Mean time to ack", value: "8m 12s", icon: "time", trend: "-9%", trendIntent: "success", trendDirection: "down", spark: [12, 11, 13, 10, 9, 10, 8, 8] },
            { label: "Analysts online", value: "4", icon: "people", spark: [3, 4, 4, 5, 4, 4, 3, 4] },
        ];
    }, [alerts]);

    // Rail counts derived from live alert state.
    const railItems: RailItem[] = useMemo(() => {
        const open = alerts.filter((a) => a.status !== "resolved").length;
        const inProgress = alerts.filter((a) => a.status === "in-progress").length;
        const assets = new Set(alerts.map((a) => a.asset)).size;
        const detectors = new Set(alerts.map((a) => a.detector)).size;
        return [
            { id: "queue", label: "Alert queue", icon: "inbox", count: open },
            { id: "incidents", label: "Incidents", icon: "shield", count: inProgress },
            { id: "assets", label: "Assets", icon: "desktop", count: assets },
            { id: "detections", label: "Detections", icon: "feed", count: detectors },
            { id: "hunting", label: "Threat hunting", icon: "search-template" },
        ];
    }, [alerts]);

    const railFooter: RailItem[] = [
        { id: "ai", label: "AI assist", icon: "predictive-analysis" },
        { id: "settings", label: "Settings", icon: "cog" },
    ];

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
        setSelectedId(null);
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
        setFocusedId(alert.id);
    };

    const clearFilters = () => {
        setStatusFilter("all");
        setSeverityFilter("all");
        setAssigneeFilter("All assignees");
        setSearch("");
    };

    const assigneeOptions = ["All assignees", ...ANALYSTS];

    // ── Command palette entries ──────────────────────────────────────────────
    const commands: Command[] = useMemo(() => {
        const focused = alerts.find((a) => a.id === focusedId) ?? null;
        const actions: Command[] = [
            { id: "new", label: "New incident", icon: "plus", hint: "c", run: () => setNewIncidentOpen(true) },
            { id: "search", label: "Focus search", icon: "search", hint: "/", run: focusSearch },
            { id: "clear", label: "Clear all filters", icon: "filter-remove", run: clearFilters },
            { id: "f-new", label: "Filter: New alerts", icon: "issue", run: () => setStatusFilter("new") },
            { id: "f-prog", label: "Filter: In progress", icon: "time", run: () => setStatusFilter("in-progress") },
            { id: "f-res", label: "Filter: Resolved", icon: "tick-circle", run: () => setStatusFilter("resolved") },
            { id: "f-all", label: "Filter: All statuses", icon: "filter", run: () => setStatusFilter("all") },
        ];
        if (focused != null) {
            actions.push(
                { id: "ack", label: `Acknowledge ${focused.id}`, icon: "endorsed", hint: "a", run: () => handleAcknowledge(focused) },
                { id: "esc", label: `Escalate ${focused.id}`, icon: "arrow-up", hint: "e", run: () => handleEscalate(focused) },
            );
        }
        const jumps: Command[] = alerts.map((a) => ({
            id: `open-${a.id}`,
            label: `Open ${a.id} — ${a.title}`,
            icon: "chevron-right",
            run: () => {
                setActiveView("queue");
                openAlert(a);
            },
        }));
        return [...actions, ...jumps];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [alerts, focusedId]);

    // ── Keyboard layer ───────────────────────────────────────────────────────
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            const target = e.target as HTMLElement | null;
            const typing =
                target != null &&
                (target.tagName === "INPUT" ||
                    target.tagName === "TEXTAREA" ||
                    target.isContentEditable);

            // ⌘K / Ctrl+K toggles the command palette — even while typing.
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setCmdOpen((o) => !o);
                return;
            }

            if (typing || cmdOpen || newIncidentOpen) return;

            // "/" focuses search from anywhere in the queue view.
            if (e.key === "/" && activeView === "queue") {
                e.preventDefault();
                focusSearch();
                return;
            }
            if (e.key === "c") {
                e.preventDefault();
                setNewIncidentOpen(true);
                return;
            }
            if (activeView !== "queue" || filtered.length === 0) return;

            const idx = filtered.findIndex((a) => a.id === focusedId);
            const focused = idx >= 0 ? filtered[idx] : null;

            switch (e.key) {
                case "j":
                case "ArrowDown": {
                    e.preventDefault();
                    const next = idx < 0 ? 0 : Math.min(idx + 1, filtered.length - 1);
                    setFocusedId(filtered[next].id);
                    break;
                }
                case "k":
                case "ArrowUp": {
                    e.preventDefault();
                    const prev = idx < 0 ? 0 : Math.max(idx - 1, 0);
                    setFocusedId(filtered[prev].id);
                    break;
                }
                case "Enter":
                    if (focused != null) {
                        e.preventDefault();
                        openAlert(focused);
                    }
                    break;
                case "a":
                    if (focused != null) {
                        e.preventDefault();
                        handleAcknowledge(focused);
                    }
                    break;
                case "e":
                    if (focused != null) {
                        e.preventDefault();
                        handleEscalate(focused);
                    }
                    break;
            }
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeView, cmdOpen, newIncidentOpen, filtered, focusedId]);

    const activeRailLabel =
        [...railItems, ...railFooter].find((i) => i.id === activeView)?.label ?? "Alert queue";

    return (
        <div className="flex h-screen bg-background text-foreground">
            {/* ── Dark left rail ─────────────────────────────────────────── */}
            <SocRail
                open={railOpen}
                items={railItems}
                footerItems={railFooter}
                activeId={activeView}
                onSelect={setActiveView}
            />

            {/* ── Main column ────────────────────────────────────────────── */}
            <div className="flex min-w-0 flex-1 flex-col">
                {/* App top bar */}
                <Navbar className="shrink-0">
                    <NavbarGroup align="left" className="min-w-0">
                        {/* Toggle navigation — collapses the inline rail (md+) or opens
                            the overlay drawer (below md). */}
                        <Tooltip content="Toggle navigation" dark={dark}>
                            <Button
                                variant="minimal"
                                aria-label="Toggle navigation"
                                icon={<Icon icon="menu" className="!text-current" />}
                                onClick={toggleRail}
                            />
                        </Tooltip>
                        <NavbarHeading className="truncate whitespace-nowrap font-semibold">
                            {activeRailLabel}
                        </NavbarHeading>
                        <Tag
                            minimal
                            intent="success"
                            className="hidden sm:inline-flex"
                            icon={<Icon icon="pulse" size={12} className="!text-current" />}
                        >
                            LIVE
                        </Tag>
                        <NavbarDivider className="hidden md:block" />
                        <div className="hidden md:block">
                            <InputGroup
                                ref={searchRef}
                                leftIcon="search"
                                placeholder="Search alerts, assets, IPs…   /"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ width: 300 }}
                            />
                        </div>
                    </NavbarGroup>
                    <NavbarGroup align="right">
                        {/* Primary actions live in the navbar on md+; on mobile they move to the
                            secondary toolbar below. */}
                        <div className="hidden items-center gap-1 md:flex">
                            <Tooltip
                                dark={dark}
                                content={
                                    <span className="inline-flex items-center gap-1.5">
                                        Command palette <KeyCombo combo="mod+k" minimal />
                                    </span>
                                }
                            >
                                <Button
                                    variant="minimal"
                                    aria-label="Open command palette"
                                    icon={<Icon icon="search-template" className="!text-current" />}
                                    onClick={() => setCmdOpen(true)}
                                />
                            </Tooltip>
                            <Tooltip
                                dark={dark}
                                content={
                                    <span className="inline-flex items-center gap-1.5">
                                        New incident <KeyCombo combo="c" minimal />
                                    </span>
                                }
                            >
                                <Button
                                    intent="success"
                                    icon={<Icon icon="plus" className="!text-current" />}
                                    onClick={() => setNewIncidentOpen(true)}
                                >
                                    New incident
                                </Button>
                            </Tooltip>
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
                        </div>
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

                {/* Secondary toolbar (mobile only) — search + primary actions relocated
                    from the navbar. Hidden while the inspector is open. */}
                {activeView === "queue" && selected == null && (
                    <div className="flex items-center gap-2 border-b border-border bg-surface px-3 py-2 md:hidden">
                        <div className="flex-1">
                            <InputGroup
                                ref={searchMobileRef}
                                fill
                                leftIcon="search"
                                placeholder="Search…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Button
                            variant="minimal"
                            aria-label="Open command palette"
                            icon={<Icon icon="search-template" className="!text-current" />}
                            onClick={() => setCmdOpen(true)}
                        />
                        <Button
                            intent="success"
                            aria-label="New incident"
                            icon={<Icon icon="plus" className="!text-current" />}
                            onClick={() => setNewIncidentOpen(true)}
                        />
                    </div>
                )}

                {/* Body: queue + pinned inspector tile edge-to-edge */}
                <div className="flex min-h-0 flex-1">
                    {activeView === "queue" ? (
                        <div
                            className={
                                "min-w-0 flex-1 overflow-auto " +
                                // On mobile the inspector takes the full width, so hide the queue
                                // behind it; on md+ they sit side by side.
                                (selected != null ? "hidden md:block" : "")
                            }
                        >
                            <div className="flex flex-col gap-4 p-4">
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
                                    <div className="rounded-mithril border border-border bg-surface">
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
                                        focusedId={focusedId}
                                        dark={dark}
                                        onSelect={openAlert}
                                        onAction={handleRowAction}
                                    />
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="min-w-0 flex-1 overflow-auto p-4">
                            <div className="rounded-mithril border border-border bg-surface">
                                <NonIdealState
                                    icon="dashboard"
                                    title={`${activeRailLabel} view`}
                                    description="This view is illustrative in the demo — the alert queue is the working surface."
                                    action={
                                        <Button
                                            icon={<Icon icon="inbox" className="!text-current" />}
                                            onClick={() => setActiveView("queue")}
                                        >
                                            Back to queue
                                        </Button>
                                    }
                                />
                            </div>
                        </div>
                    )}

                    {/* Pinned detail inspector */}
                    <AlertDetail
                        alert={activeView === "queue" ? selected : null}
                        dark={dark}
                        onClose={() => setSelectedId(null)}
                        onAcknowledge={handleAcknowledge}
                        onEscalate={handleEscalate}
                        onAssign={handleAssign}
                        onCloseIncident={handleCloseIncident}
                        onCopyIoc={handleCopyIoc}
                    />
                </div>
            </div>

            {/* ── Mobile rail drawer (hamburger) ─────────────────────────── */}
            <Drawer
                open={navOpen}
                onOpenChange={setNavOpen}
                position="left"
                size={240}
                closeButton={false}
                dark
            >
                <RailNav
                    items={railItems}
                    footerItems={railFooter}
                    activeId={activeView}
                    onSelect={(id) => {
                        setActiveView(id);
                        setNavOpen(false);
                    }}
                />
            </Drawer>

            {/* ── Command palette (⌘K) ───────────────────────────────────── */}
            <Omnibar<Command>
                isOpen={cmdOpen}
                dark={dark}
                onClose={() => setCmdOpen(false)}
                items={commands}
                itemPredicate={(q, cmd) => cmd.label.toLowerCase().includes(q.toLowerCase())}
                itemRenderer={(cmd, { modifiers, handleClick }) => (
                    <MenuItem
                        key={cmd.id}
                        icon={cmd.icon}
                        text={cmd.label}
                        active={modifiers.active}
                        label={cmd.hint != null ? <KeyCombo combo={cmd.hint} minimal /> : undefined}
                        onClick={handleClick}
                    />
                )}
                onItemSelect={(cmd) => {
                    setCmdOpen(false);
                    cmd.run();
                }}
                inputProps={{ placeholder: "Type a command or search alerts…" }}
                noResults={<MenuItem disabled text="No matching commands" />}
            />

            {/* ── New-incident wizard ────────────────────────────────────── */}
            <NewIncidentDialog
                isOpen={newIncidentOpen}
                dark={dark}
                onClose={() => setNewIncidentOpen(false)}
                onCreate={handleCreateIncident}
            />
        </div>
    );
}

export default SocConsole;
