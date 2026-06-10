/* eslint-disable no-restricted-imports */
/**
 * Skylark — Drone Swarm Mission Control, played as a game.
 *
 * A seeded engine (`stream/engine.ts`, driven by `useStream`) runs one timed
 * *shift* over a MapLibre basemap: the operator launches and recalls a
 * battery-limited fleet, tasks investigations, and banks score before the clock
 * runs out (see docs/skylark-game.md). Exercises the read-heavy/structural slice
 * of the library that the SOC and Board demos didn't: Tree, Section, CardList,
 * Skeleton, Dialog, plus the live map.
 */
import { useContext, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Drawer, DrawerBody } from "@/components/ui/drawer";
import {
    HotkeysContext,
    HotkeysProvider,
    useHotkeys,
    type HotkeyConfig,
} from "@/components/ui/hotkeys";
import { Icon } from "@/components/ui/icon";
import { InputGroup } from "@/components/ui/input-group";
import { Menu, MenuItem, MenuDivider } from "@/components/ui/menu";
import { Navbar, NavbarGroup, NavbarHeading, NavbarDivider } from "@/components/ui/navbar";
import { MenuPopover, Popover } from "@/components/ui/popover";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Section } from "@/components/ui/section";
import { Switch } from "@/components/ui/switch";
import { Tag } from "@/components/ui/tag";
import { Tooltip } from "@/components/ui/tooltip";
import { useToaster } from "@/components/ui/toast";
import { useDark } from "@/lib/dark-context";
import { AppChromeControls } from "@/lib/app-chrome";

import { BlueDetail } from "./BlueDetail";
import { DroneDetail } from "./DroneDetail";
import { EventFeed } from "./EventFeed";
import { FleetTree } from "./FleetTree";
import { MissionMap } from "./MissionMap";
import { ShiftDebrief } from "./ShiftDebrief";
import { TargetDetail } from "./TargetDetail";
import { TelemetryPanel } from "./TelemetryPanel";
import { FIRES_PER_SHIFT, PAD_COUNT, SHIFT_TICKS } from "./stream/engine";
import { type StreamSpeed, useStream } from "./stream/useStream";
import { GROUND_STATION, STATUS_META, formatClock, formatMissionClock } from "./data";

const SPEED_OPTIONS = [
    { label: "1×", value: "1" },
    { label: "2×", value: "2" },
    { label: "5×", value: "5" },
];

function MissionControlInner() {
    const dark = useDark();
    const toaster = useToaster();
    const stream = useStream();

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
    const [selectedBlueId, setSelectedBlueId] = useState<string | null>(null);
    const [autoFollow, setAutoFollow] = useState(false);
    const [matchOrientation, setMatchOrientation] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [query, setQuery] = useState("");
    // Fleet roster visibility. On lg+ the rail is inline and `railOpen` collapses it;
    // below lg it's an overlay drawer driven by `navOpen` (the rail is always hidden
    // inline there). The event feed starts collapsed at every width.
    const [railOpen, setRailOpen] = useState(true);
    const [navOpen, setNavOpen] = useState(false);
    const [feedOpen, setFeedOpen] = useState(false);
    const [debriefOpen, setDebriefOpen] = useState(false);

    // The shift clock ran out → surface the debrief (dismissable; reopenable from the HUD).
    const ended = stream.phase === "ended";
    useEffect(() => {
        if (ended) setDebriefOpen(true);
    }, [ended]);

    // One menu button drives both: collapse the inline rail on desktop, or summon the
    // overlay drawer on small screens. Resolved at click time so no resize listener.
    const toggleFleet = () => {
        if (window.matchMedia("(min-width: 1024px)").matches) setRailOpen((v) => !v);
        else setNavOpen(true);
    };

    // Brief "connecting" phase so the telemetry panel shows Skeletons on first paint.
    const [connecting, setConnecting] = useState(true);
    useEffect(() => {
        const t = window.setTimeout(() => setConnecting(false), 1200);
        return () => window.clearTimeout(t);
    }, []);

    // Surface new danger events as toasts (live-data → Toaster).
    const lastToastId = useRef(0);
    useEffect(() => {
        const top = stream.events[0];
        if (top && top.id > lastToastId.current) {
            lastToastId.current = top.id;
            if (top.severity === "danger") {
                toaster.show({ intent: "danger", icon: top.icon, message: top.message });
            }
        }
    }, [stream.events, toaster]);

    // Known map contacts — owned by the stream engine so detection, tasking, and
    // the resulting confidence upgrades all flow through the sim tick. Undetected
    // targets are fog of war: never rendered, never selectable.
    const targets = stream.targets.filter((t) => t.track !== "undetected");
    const activeTracks = targets.filter((t) => t.track === "active").length;
    const staleTracks = targets.length - activeTracks;

    const selected = stream.drones.find((d) => d.id === selectedId) ?? null;
    const selectedTarget = targets.find((t) => t.id === selectedTargetId) ?? null;
    const selectedBlue = stream.blues.find((b) => b.id === selectedBlueId) ?? null;
    const activeCount = stream.drones.filter((d) => d.status === "active" || d.status === "anomaly").length;
    const anomalyCount = stream.drones.filter((d) => d.status === "anomaly").length;
    const bluesHit = stream.blues.filter((b) => b.status === "hit").length;
    const isrOpen = stream.isr.filter((r) => r.status === "active").length;

    // Drones, targets, and blue units share the single right rail / mobile sheet,
    // so selecting one clears the others.
    const handleSelect = (id: string | null) => {
        setSelectedId(id);
        if (id) {
            setSelectedTargetId(null);
            setSelectedBlueId(null);
            // Picking a drone from the hamburger roster dismisses the drawer so the
            // map (and the mobile telemetry sheet) come forward.
            setNavOpen(false);
        }
    };
    const handleSelectTarget = (id: string | null) => {
        setSelectedTargetId(id);
        if (id) {
            setSelectedId(null);
            setSelectedBlueId(null);
            setNavOpen(false);
        }
    };
    const handleSelectBlue = (id: string | null) => {
        setSelectedBlueId(id);
        if (id) {
            setSelectedId(null);
            setSelectedTargetId(null);
            setNavOpen(false);
        }
    };
    const openDetail = () => {
        if (selectedId) setDetailOpen(true);
    };

    // ── Keyboard shortcuts (useHotkeys) ──────────────────────────────────
    // The hotkey callbacks need the *latest* live state (the drone roster changes
    // every stream tick), so we read it through a ref and keep the registered combo
    // list stable — otherwise we'd re-bind the document listener on every tick.
    const searchRef = useRef<HTMLInputElement>(null);
    const hotkeyState = useRef({ drones: stream.drones, selectedId, detailOpen });
    hotkeyState.current = { drones: stream.drones, selectedId, detailOpen };

    const cycleSelection = (dir: 1 | -1) => {
        const { drones, selectedId: cur } = hotkeyState.current;
        if (drones.length === 0) return;
        const idx = drones.findIndex((d) => d.id === cur);
        // From no selection, ArrowDown/j picks the first, ArrowUp/k the last.
        const next = idx === -1 ? (dir === 1 ? 0 : drones.length - 1) : (idx + dir + drones.length) % drones.length;
        setSelectedId(drones[next].id);
    };

    const hotkeyActions = useMemo(
        () => ({
            togglePlay: () => stream.toggle(),
            setSpeed: (s: StreamSpeed) => stream.setSpeed(s),
            toggleFollow: () => setAutoFollow((v) => !v),
            toggleMatch: () => setMatchOrientation((v) => !v),
            focusSearch: () => searchRef.current?.focus(),
            next: () => cycleSelection(1),
            prev: () => cycleSelection(-1),
            launchSelected: () => {
                const { drones, selectedId: cur } = hotkeyState.current;
                const d = cur ? drones.find((x) => x.id === cur) : null;
                if (d && (d.status === "idle" || d.status === "charging")) stream.launch(d.id);
            },
            // One key covers both directions: recall an airborne drone, or turn a
            // returning one back around.
            recallSelected: () => {
                const { drones, selectedId: cur } = hotkeyState.current;
                const d = cur ? drones.find((x) => x.id === cur) : null;
                if (!d) return;
                if (d.status === "returning") stream.resumePatrol(d.id);
                else stream.recall(d.id);
            },
            openDetail: () => {
                if (hotkeyState.current.selectedId) setDetailOpen(true);
            },
            // Esc clears the selection only when the drawer is closed; when it's open
            // we leave it to the Drawer's own Escape handling (no double-action).
            dismiss: () => {
                if (!hotkeyState.current.detailOpen) {
                    setSelectedId(null);
                    setSelectedTargetId(null);
                    setSelectedBlueId(null);
                }
            },
        }),
        // stream.toggle/setSpeed are stable across renders; cycleSelection reads via ref.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );

    const hotkeys = useMemo<HotkeyConfig[]>(
        () => [
            { combo: "p", label: "Play / pause stream", group: "Stream", global: true, onKeyDown: hotkeyActions.togglePlay },
            { combo: "1", label: "Speed 1×", group: "Stream", global: true, onKeyDown: () => hotkeyActions.setSpeed(1) },
            { combo: "2", label: "Speed 2×", group: "Stream", global: true, onKeyDown: () => hotkeyActions.setSpeed(2) },
            { combo: "5", label: "Speed 5×", group: "Stream", global: true, onKeyDown: () => hotkeyActions.setSpeed(5) },
            { combo: "f", label: "Toggle map follow", group: "View", global: true, onKeyDown: hotkeyActions.toggleFollow },
            { combo: "m", label: "Toggle match orientation", group: "View", global: true, onKeyDown: hotkeyActions.toggleMatch },
            { combo: "/", label: "Focus search", group: "View", global: true, preventDefault: true, onKeyDown: hotkeyActions.focusSearch },
            { combo: "j", label: "Select next drone", group: "Fleet", global: true, onKeyDown: hotkeyActions.next },
            { combo: "k", label: "Select previous drone", group: "Fleet", global: true, onKeyDown: hotkeyActions.prev },
            { combo: "l", label: "Launch selected drone", group: "Fleet", global: true, onKeyDown: hotkeyActions.launchSelected },
            { combo: "r", label: "Recall / resume selected drone", group: "Fleet", global: true, onKeyDown: hotkeyActions.recallSelected },
            { combo: "o", label: "Open drone details", group: "Fleet", global: true, onKeyDown: hotkeyActions.openDetail },
            { combo: "escape", label: "Clear selection", group: "Fleet", global: true, onKeyDown: hotkeyActions.dismiss },
            // Display-only row: `?` is handled by the provider (opens this dialog) before
            // any registered callback would run, so this entry is purely for the listing.
            { combo: "?", label: "Show this dialog", group: "General", global: true },
        ],
        [hotkeyActions],
    );
    useHotkeys(hotkeys);

    return (
        <div className="flex h-screen flex-col bg-background text-foreground">
            {/* ── Navbar ──────────────────────────────────────────────────── */}
            <Navbar className="shrink-0">
                <NavbarGroup align="left" className="min-w-0">
                    {/* Toggle the fleet roster — collapses the inline rail (lg+) or
                        opens the overlay drawer (below lg). */}
                    <Tooltip content="Toggle fleet roster" dark={dark}>
                        <Button
                            variant="minimal"
                            aria-label="Toggle fleet roster"
                            icon={<Icon icon="menu" className="!text-current" />}
                            onClick={toggleFleet}
                        />
                    </Tooltip>
                    <span className="mr-2 hidden items-center justify-center sm:inline-flex">
                        <Icon icon="airplane" size={20} className="text-intent-primary-text" />
                    </span>
                    <NavbarHeading className="truncate whitespace-nowrap font-semibold">Skylark</NavbarHeading>
                    <Tag minimal intent="primary" className="hidden sm:inline-flex">
                        Swarm Ops
                    </Tag>
                    <Tag
                        minimal
                        intent={ended ? "warning" : stream.playing ? "success" : "none"}
                        className="shrink-0"
                        icon={
                            <Icon
                                icon={ended ? "time" : stream.playing ? "pulse" : "pause"}
                                size={12}
                                className="!text-current"
                            />
                        }
                    >
                        {ended ? "SHIFT OVER" : stream.playing ? "LIVE" : "PAUSED"}
                    </Tag>
                    <NavbarDivider className="hidden lg:block" />
                    <div className="hidden w-40 lg:block xl:w-56">
                        <InputGroup
                            ref={searchRef}
                            fill
                            leftIcon="search"
                            placeholder="Search drones…  ( / )"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                </NavbarGroup>

                <NavbarGroup align="right">
                    <span className="mr-1 hidden font-mono text-body-sm tabular-nums text-foreground-muted sm:inline-block">
                        {formatMissionClock(stream.tick)}
                    </span>
                    <Tooltip content={ended ? "Shift over" : stream.playing ? "Pause stream" : "Resume stream"} dark={dark}>
                        <Button
                            variant="minimal"
                            aria-label={stream.playing ? "Pause" : "Play"}
                            disabled={ended}
                            icon={<Icon icon={stream.playing ? "pause" : "play"} className="!text-current" />}
                            onClick={stream.toggle}
                        />
                    </Tooltip>

                    {/* Map-view controls inline on xl+; folded into a popover below xl
                        (so the lg three-column navbar stays uncrowded). */}
                    <div className="hidden items-center gap-2 xl:flex">
                        <SegmentedControl
                            options={SPEED_OPTIONS}
                            value={String(stream.speed)}
                            onValueChange={(v) => stream.setSpeed(Number(v) as StreamSpeed)}
                        />
                        <NavbarDivider />
                        <Switch
                            inline
                            checked={autoFollow}
                            onChange={(e) => setAutoFollow(e.target.checked)}
                            label={<span className="text-body-sm text-foreground-muted">Follow</span>}
                        />
                        <Switch
                            inline
                            checked={matchOrientation}
                            onChange={(e) => setMatchOrientation(e.target.checked)}
                            label={<span className="text-body-sm text-foreground-muted">Match orientation</span>}
                        />
                    </div>
                    <div className="xl:hidden">
                        <Popover
                            side="bottom"
                            align="end"
                            dark={dark}
                            content={
                                <ViewControls
                                    speed={stream.speed}
                                    onSpeed={stream.setSpeed}
                                    follow={autoFollow}
                                    onFollow={setAutoFollow}
                                    match={matchOrientation}
                                    onMatch={setMatchOrientation}
                                />
                            }
                        >
                            <Button
                                variant="minimal"
                                aria-label="View options"
                                icon={<Icon icon="settings" className="!text-current" />}
                            />
                        </Popover>
                    </div>

                    <NavbarDivider className="hidden lg:block" />
                    <div className="hidden lg:block">
                        <HotkeysHelpButton dark={dark} />
                    </div>
                    <NavbarDivider />
                    <MenuPopover
                        side="bottom"
                        align="end"
                        dark={dark}
                        content={
                            <Menu>
                                <MenuDivider title="Flight Director" />
                                <MenuItem icon="person" text="Cmdr. Reyes" />
                                <MenuItem icon="cog" text="Mission settings" />
                                <MenuItem icon="manual" text="Flight rules" />
                                <MenuDivider />
                                <MenuItem icon="log-out" text="End shift" intent="danger" />
                            </Menu>
                        }
                    >
                        <Button
                            variant="minimal"
                            aria-label="Flight director menu"
                            icon={<Icon icon="person" className="!text-current" />}
                            endIcon={<Icon icon="caret-down" className="!text-current" />}
                        >
                            <span className="hidden sm:inline">Reyes</span>
                        </Button>
                    </MenuPopover>
                    <NavbarDivider />
                    <AppChromeControls />
                </NavbarGroup>
            </Navbar>

            {/* ── Body ────────────────────────────────────────────────────── */}
            <div className="flex min-h-0 flex-1">
                {/* Left rail — fleet roster (inline on lg+ when railOpen; below lg it's
                    the overlay drawer). Collapsing it hands the width back to the map. */}
                <aside
                    className={
                        "hidden w-72 shrink-0 flex-col overflow-auto border-r border-divider bg-surface " +
                        (railOpen ? "lg:flex" : "")
                    }
                >
                    <Section
                        title="Fleet"
                        icon="layers"
                        rightElement={
                            <Tag minimal round className="tabular-nums">
                                {stream.drones.length}
                            </Tag>
                        }
                        compact
                    >
                        <div className="px-1 py-1">
                            <FleetTree drones={stream.drones} selectedId={selectedId} query={query} onSelect={handleSelect} />
                        </div>
                    </Section>
                </aside>

                {/* Center — map + event feed */}
                <main className="flex min-w-0 flex-1 flex-col">
                    {/* z-0 confines MapLibre's controls (z-index:2) to the map's own
                        stacking context, so they can't paint over the portaled Drawer
                        or the mobile telemetry sheet anchored to this container. */}
                    <div className="relative z-0 min-h-0 flex-1">
                        <MissionMap
                            drones={stream.drones}
                            targets={targets}
                            blues={stream.blues}
                            isr={stream.isr}
                            fires={stream.firesInFlight}
                            selectedId={selectedId}
                            selectedTargetId={selectedTargetId}
                            selectedBlueId={selectedBlueId}
                            onSelect={handleSelect}
                            onSelectTarget={handleSelectTarget}
                            onSelectBlue={handleSelectBlue}
                            autoFollow={autoFollow}
                            matchOrientation={matchOrientation}
                            epoch={stream.epoch}
                            dark={dark}
                            className="h-full w-full"
                        />
                        {/* Status overlay — game HUD row + ops row */}
                        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-2">
                            <div className="pointer-events-auto flex items-center gap-3 rounded-mithril border border-divider bg-surface/95 px-3 py-2 shadow-card-1 backdrop-blur">
                                <span
                                    className={`inline-flex items-center gap-1.5 text-body-sm font-semibold tabular-nums ${
                                        !ended && SHIFT_TICKS - stream.tick < 60 ? "text-intent-danger-text" : "text-foreground"
                                    }`}
                                >
                                    <Icon icon="stopwatch" size={12} className="!text-current" />
                                    {ended ? "00:00" : formatClock(SHIFT_TICKS - stream.tick)} left
                                </span>
                                <span className="text-body-sm text-foreground-muted">·</span>
                                <span className="inline-flex items-center gap-1.5 text-body-sm font-semibold tabular-nums text-foreground">
                                    <Icon icon="star" size={12} className="!text-current" />
                                    {stream.score.total} pts
                                </span>
                                <span className="text-body-sm text-foreground-muted">·</span>
                                <span className="inline-flex items-center gap-1.5 text-body-sm tabular-nums text-foreground-muted">
                                    <Icon icon="lightning" size={12} className="!text-current" />
                                    pads {stream.padsUsed}/{PAD_COUNT}
                                </span>
                                <span className="text-body-sm text-foreground-muted">·</span>
                                <span
                                    className={`inline-flex items-center gap-1.5 text-body-sm tabular-nums ${
                                        stream.fires === 0 ? "text-intent-warning-text font-medium" : "text-foreground-muted"
                                    }`}
                                >
                                    <Icon icon="rocket" size={12} className="!text-current" />
                                    fires {stream.fires}/{FIRES_PER_SHIFT}
                                </span>
                            </div>
                            <div className="pointer-events-auto flex items-center gap-3 rounded-mithril border border-divider bg-surface/95 px-3 py-2 shadow-card-1 backdrop-blur">
                                <span className="inline-flex items-center gap-1.5 text-body-sm font-medium text-foreground">
                                    <span className={`inline-block size-2 rounded-full ${STATUS_META.active.dot}`} />
                                    {activeCount} airborne
                                </span>
                                {anomalyCount > 0 && (
                                    <span className="inline-flex items-center gap-1.5 text-body-sm font-medium text-intent-danger-text">
                                        <Icon icon="warning-sign" size={12} className="!text-current" />
                                        {anomalyCount} anomaly
                                    </span>
                                )}
                                <span className="text-body-sm text-foreground-muted">·</span>
                                <span className="inline-flex items-center gap-1.5 text-body-sm text-foreground-muted">
                                    <Icon icon="target" size={12} className="!text-current" />
                                    {activeTracks} contacts
                                </span>
                                {staleTracks > 0 && (
                                    <span className="inline-flex items-center gap-1.5 text-body-sm font-medium text-intent-warning-text">
                                        <Icon icon="eye-off" size={12} className="!text-current" />
                                        {staleTracks} stale
                                    </span>
                                )}
                                <span className="text-body-sm text-foreground-muted">·</span>
                                <span className="inline-flex items-center gap-1.5 text-body-sm text-foreground-muted">
                                    <Icon icon="shield" size={12} className="!text-current" />
                                    {stream.blues.length - bluesHit} blue
                                </span>
                                {bluesHit > 0 && (
                                    <span className="inline-flex items-center gap-1.5 text-body-sm font-medium text-intent-danger-text">
                                        <Icon icon="cross-circle" size={12} className="!text-current" />
                                        {bluesHit} hit
                                    </span>
                                )}
                                {isrOpen > 0 && (
                                    <span className="inline-flex items-center gap-1.5 text-body-sm font-medium text-intent-warning-text">
                                        <Icon icon="satellite" size={12} className="!text-current" />
                                        {isrOpen} ISR
                                    </span>
                                )}
                                <span className="text-body-sm text-foreground-muted">·</span>
                                <span className="inline-flex items-center gap-1.5 text-body-sm text-foreground-muted">
                                    <Icon icon="cell-tower" size={12} className="!text-current" />
                                    {GROUND_STATION.callsign}
                                </span>
                            </div>
                            {ended && !debriefOpen && (
                                <Button
                                    className="pointer-events-auto"
                                    intent="primary"
                                    icon={<Icon icon="clipboard" className="!text-current" />}
                                    onClick={() => setDebriefOpen(true)}
                                >
                                    View debrief
                                </Button>
                            )}
                        </div>

                        {/* Mobile telemetry — a non-modal bottom sheet over the map (lg+
                            uses the pinned right rail). The map stays visible above it. */}
                        {selected && (
                            <div className="absolute inset-x-0 bottom-0 z-10 flex max-h-[60%] flex-col rounded-t-mithril border-t border-divider bg-background shadow-overlay-3 lg:hidden">
                                <div className="relative shrink-0 pt-2">
                                    <div className="mx-auto h-1 w-9 rounded-full bg-divider" />
                                    <Button
                                        variant="minimal"
                                        size="small"
                                        aria-label="Close telemetry"
                                        className="absolute right-1 top-1"
                                        icon={<Icon icon="cross" className="!text-current" />}
                                        onClick={() => setSelectedId(null)}
                                    />
                                </div>
                                <div className="min-h-0 flex-1 overflow-auto">
                                    <TelemetryPanel
                                        drone={selected}
                                        history={selectedId ? stream.history[selectedId] : undefined}
                                        drones={stream.drones}
                                        connecting={connecting}
                                        onOpenDetail={openDetail}
                                        onLaunch={stream.launch}
                                        onRecall={stream.recall}
                                        onResume={stream.resumePatrol}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Mobile target sheet — same bottom-sheet treatment for a
                            selected map target (lg+ uses the pinned right rail). */}
                        {selectedTarget && (
                            <div className="absolute inset-x-0 bottom-0 z-10 flex max-h-[60%] flex-col rounded-t-mithril border-t border-divider bg-background shadow-overlay-3 lg:hidden">
                                <div className="relative shrink-0 pt-2">
                                    <div className="mx-auto h-1 w-9 rounded-full bg-divider" />
                                    <Button
                                        variant="minimal"
                                        size="small"
                                        aria-label="Close target details"
                                        className="absolute right-1 top-1"
                                        icon={<Icon icon="cross" className="!text-current" />}
                                        onClick={() => setSelectedTargetId(null)}
                                    />
                                </div>
                                <div className="min-h-0 flex-1 overflow-auto">
                                    <TargetDetail
                                        target={selectedTarget}
                                        drones={stream.drones}
                                        blues={stream.blues}
                                        fires={stream.fires}
                                        firesInFlight={stream.firesInFlight}
                                        dark={dark}
                                        onTask={(droneId) => stream.investigate(selectedTarget.id, droneId)}
                                        onPassIntel={() => stream.passIntel(selectedTarget.id)}
                                        onStrike={(droneId) => stream.strike(selectedTarget.id, droneId)}
                                        onDesignate={(droneId) => stream.designate(selectedTarget.id, droneId)}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Mobile blue-unit sheet — same treatment for a selected blue. */}
                        {selectedBlue && (
                            <div className="absolute inset-x-0 bottom-0 z-10 flex max-h-[60%] flex-col rounded-t-mithril border-t border-divider bg-background shadow-overlay-3 lg:hidden">
                                <div className="relative shrink-0 pt-2">
                                    <div className="mx-auto h-1 w-9 rounded-full bg-divider" />
                                    <Button
                                        variant="minimal"
                                        size="small"
                                        aria-label="Close blue unit details"
                                        className="absolute right-1 top-1"
                                        icon={<Icon icon="cross" className="!text-current" />}
                                        onClick={() => setSelectedBlueId(null)}
                                    />
                                </div>
                                <div className="min-h-0 flex-1 overflow-auto">
                                    <BlueDetail
                                        blue={selectedBlue}
                                        targets={targets}
                                        isr={stream.isr}
                                        onSelectTarget={handleSelectTarget}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Event feed — collapsible at every width, collapsed by default so
                        the map leads. Expanding it opens a fixed-height scroll area. */}
                    <div className="shrink-0 border-t border-divider bg-surface">
                        <EventFeed
                            events={stream.events}
                            selectedId={selectedId}
                            follow={stream.playing}
                            dark={dark}
                            collapsed={!feedOpen}
                            onToggle={() => setFeedOpen((o) => !o)}
                            onSelect={handleSelect}
                        />
                    </div>
                </main>

                {/* Right rail — inspector. Present once a drone, a target, OR a blue unit
                    is selected (lg+; below lg the bottom sheets above stand in); close it
                    to deselect and reclaim the width for the map. Selections are mutually
                    exclusive, so at most one panel renders. */}
                {(selected || selectedTarget || selectedBlue) && (
                <aside className="hidden w-80 shrink-0 overflow-auto border-l border-divider bg-background lg:block">
                    {selectedTarget ? (
                        <TargetDetail
                            target={selectedTarget}
                            drones={stream.drones}
                            blues={stream.blues}
                            fires={stream.fires}
                            firesInFlight={stream.firesInFlight}
                            dark={dark}
                            onClose={() => setSelectedTargetId(null)}
                            onTask={(droneId) => stream.investigate(selectedTarget.id, droneId)}
                            onPassIntel={() => stream.passIntel(selectedTarget.id)}
                            onStrike={(droneId) => stream.strike(selectedTarget.id, droneId)}
                            onDesignate={(droneId) => stream.designate(selectedTarget.id, droneId)}
                        />
                    ) : selectedBlue ? (
                        <BlueDetail
                            blue={selectedBlue}
                            targets={targets}
                            isr={stream.isr}
                            onClose={() => setSelectedBlueId(null)}
                            onSelectTarget={handleSelectTarget}
                        />
                    ) : (
                        <TelemetryPanel
                            drone={selected}
                            history={selectedId ? stream.history[selectedId] : undefined}
                            drones={stream.drones}
                            connecting={connecting}
                            onClose={() => setSelectedId(null)}
                            onOpenDetail={openDetail}
                            onLaunch={stream.launch}
                            onRecall={stream.recall}
                            onResume={stream.resumePatrol}
                        />
                    )}
                </aside>
                )}
            </div>

            {/* ── Mobile fleet roster drawer (hamburger) ──────────────────── */}
            <Drawer
                open={navOpen}
                onOpenChange={setNavOpen}
                position="left"
                size={288}
                title="Fleet"
                icon={<Icon icon="layers" />}
                dark={dark}
            >
                <DrawerBody className="p-0">
                    <div className="border-b border-divider p-2">
                        <InputGroup
                            fill
                            leftIcon="search"
                            placeholder="Search drones…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                    <div className="px-1 py-1">
                        <FleetTree drones={stream.drones} selectedId={selectedId} query={query} onSelect={handleSelect} />
                    </div>
                </DrawerBody>
            </Drawer>

            {/* ── Drill-in drawer ─────────────────────────────────────────── */}
            <DroneDetail
                drone={selected}
                history={selectedId ? stream.history[selectedId] : undefined}
                events={stream.events}
                open={detailOpen}
                dark={dark}
                onClose={() => setDetailOpen(false)}
            />

            {/* ── End-of-shift debrief ────────────────────────────────────── */}
            <ShiftDebrief
                open={debriefOpen}
                score={stream.score}
                stats={stream.stats}
                fleetSize={stream.drones.length}
                dark={dark}
                onClose={() => setDebriefOpen(false)}
                onRestart={() => {
                    setDebriefOpen(false);
                    stream.restart();
                }}
            />
        </div>
    );
}

/**
 * Map-view controls (stream speed + Follow + Match orientation), stacked for the
 * compact "View options" popover. On xl+ these render inline in the navbar instead.
 */
function ViewControls({
    speed,
    onSpeed,
    follow,
    onFollow,
    match,
    onMatch,
}: {
    speed: StreamSpeed;
    onSpeed: (s: StreamSpeed) => void;
    follow: boolean;
    onFollow: (v: boolean) => void;
    match: boolean;
    onMatch: (v: boolean) => void;
}) {
    return (
        <div className="flex w-52 flex-col gap-3">
            <div className="flex flex-col gap-1.5">
                <span className="text-body-sm font-medium text-foreground-muted">Stream speed</span>
                <SegmentedControl
                    fill
                    options={SPEED_OPTIONS}
                    value={String(speed)}
                    onValueChange={(v) => onSpeed(Number(v) as StreamSpeed)}
                />
            </div>
            <Switch checked={follow} onChange={(e) => onFollow(e.target.checked)} label="Follow selected" />
            <Switch checked={match} onChange={(e) => onMatch(e.target.checked)} label="Match orientation" />
        </div>
    );
}

/**
 * Navbar affordance that opens the generated hotkeys help dialog. Must render
 * inside `HotkeysProvider` (it dispatches `OPEN_DIALOG` to the hotkeys context).
 */
function HotkeysHelpButton({ dark }: { dark: boolean }) {
    const [, dispatch] = useContext(HotkeysContext);
    return (
        <Tooltip content="Keyboard shortcuts (?)" dark={dark}>
            <Button
                variant="minimal"
                aria-label="Keyboard shortcuts"
                icon={<Icon icon="key" className="!text-current" />}
                onClick={() => dispatch({ type: "OPEN_DIALOG" })}
            />
        </Tooltip>
    );
}

/**
 * Skylark entry point. Wraps the console in `HotkeysProvider` so `useHotkeys`
 * (inside `MissionControlInner`) can register shortcuts and `?` opens the help dialog.
 */
export function MissionControl() {
    const dark = useDark();
    return (
        <HotkeysProvider dark={dark} dialogTitle="Skylark keyboard shortcuts">
            <MissionControlInner />
        </HotkeysProvider>
    );
}

export default MissionControl;
