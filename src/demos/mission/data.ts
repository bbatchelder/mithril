/**
 * Skylark — drone-swarm mission control. Static domain model + seeded fleet.
 *
 * Everything here is deterministic: the fleet, routes, and ground station are
 * fixed, and the live simulation (see `stream/useStream.ts`) is driven by a
 * seeded PRNG. Geography is the San Francisco Bay so the CARTO basemap shows a
 * recognizable coastline.
 */
import type { IconName } from "@/components/ui/icon";
import type { TagIntent } from "@/components/ui/tag";

// ─── Geo ───────────────────────────────────────────────────────────────────

/** [lng, lat] — GeoJSON order. */
export type LngLat = [number, number];

/** Ground station all uplinks arc back to. */
export const GROUND_STATION = {
    id: "base",
    name: "Skylark Base",
    callsign: "BASE-01",
    position: [-122.404, 37.79] as LngLat,
};

/** Initial map camera. */
export const MAP_CENTER: LngLat = [-122.41, 37.77];
export const MAP_ZOOM = 11.4;

// ─── Drones ──────────────────────────────────────────────────────────────────

export type DroneStatus =
    | "active" // on task, healthy
    | "returning" // heading back to base (recalled by the operator)
    | "charging" // docked on a base pad, recharging
    | "idle" // at base, ready to launch (or waiting for a free pad)
    | "anomaly" // fault detected
    | "lost"; // crashed mid-air (battery ran out) — gone for the shift

export interface StatusMeta {
    label: string;
    intent: TagIntent;
    /** Hex used for map layers (canvas, not token-driven). */
    color: string;
    dot: string; // tailwind bg-* for the tree status dot
    icon: IconName;
}

export const STATUS_META: Record<DroneStatus, StatusMeta> = {
    active: { label: "Active", intent: "success", color: "#238551", dot: "bg-green-3", icon: "play" },
    returning: { label: "Returning", intent: "warning", color: "#c87619", dot: "bg-orange-3", icon: "undo" },
    charging: { label: "Charging", intent: "primary", color: "#2d72d2", dot: "bg-blue-3", icon: "offline" },
    idle: { label: "Idle", intent: "none", color: "#8f99a8", dot: "bg-gray-3", icon: "pause" },
    anomaly: { label: "Anomaly", intent: "danger", color: "#cd4246", dot: "bg-red-3", icon: "warning-sign" },
    lost: { label: "Lost", intent: "danger", color: "#5f6b7c", dot: "bg-gray-1", icon: "cross-circle" },
};

/**
 * A drone tasked to investigate a {@link Target}. While set, the stream engine
 * overrides the drone's patrol: it flies to the target (`enroute`), loiters and
 * collects (`investigating`), then upgrades the target's intelligence and clears
 * the assignment — restoring `prevTask`.
 */
export interface DroneAssignment {
    targetId: string;
    phase: "enroute" | "investigating";
    /** Ticks remaining in the `investigating` phase. */
    ticksLeft: number;
    /** Current angle (radians) along the loiter orbit, advanced each tick. */
    orbitAngle: number;
    /** The task to restore once the investigation completes. */
    prevTask: string;
}

export interface Drone {
    id: string;
    callsign: string;
    squadronId: string;
    model: string;
    task: string;
    payload: string;
    status: DroneStatus;
    /** Set when the drone is tasked to investigate a target; otherwise null. */
    assignment: DroneAssignment | null;
    /** 0–100 */
    battery: number;
    /** metres */
    altitude: number;
    /** m/s */
    speed: number;
    /** 0–100 link quality */
    signal: number;
    /** degrees clockwise from north */
    heading: number;
    position: LngLat;
    /** Closed loop of waypoints the drone patrols. */
    route: LngLat[];
    /** Index of the waypoint currently being approached. */
    waypoint: number;
}

export interface Squadron {
    id: string;
    name: string;
    icon: IconName;
}

export const SQUADRONS: Squadron[] = [
    { id: "sq-recon", name: "Recon Wing", icon: "eye-open" },
    { id: "sq-survey", name: "Survey Grid", icon: "grid-view" },
    { id: "sq-relay", name: "Relay Net", icon: "globe-network" },
];

/** Build a small closed patrol loop around an anchor point. */
function loop(anchor: LngLat, spread: number, n: number): LngLat[] {
    const pts: LngLat[] = [];
    for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        // Deterministic, slightly irregular ring.
        const r = spread * (0.7 + 0.3 * ((i % 3) / 2));
        pts.push([anchor[0] + Math.cos(a) * r * 1.3, anchor[1] + Math.sin(a) * r]);
    }
    return pts;
}

interface SeedSpec {
    id: string;
    callsign: string;
    squadronId: string;
    model: string;
    task: string;
    payload: string;
    status: DroneStatus;
    battery: number;
    anchor: LngLat;
    spread: number;
    legs: number;
}

const SEED: SeedSpec[] = [
    // Recon Wing — north bay sweep
    { id: "sk-101", callsign: "SK-101", squadronId: "sq-recon", model: "Falcon X2", task: "Coastline recon", payload: "EO/IR gimbal", status: "active", battery: 82, anchor: [-122.47, 37.81], spread: 0.03, legs: 6 },
    { id: "sk-102", callsign: "SK-102", squadronId: "sq-recon", model: "Falcon X2", task: "Bridge approach watch", payload: "EO/IR gimbal", status: "active", battery: 64, anchor: [-122.45, 37.83], spread: 0.025, legs: 5 },
    { id: "sk-103", callsign: "SK-103", squadronId: "sq-recon", model: "Falcon X1", task: "Perimeter patrol", payload: "EO/IR gimbal", status: "returning", battery: 19, anchor: [-122.43, 37.8], spread: 0.022, legs: 5 },
    { id: "sk-104", callsign: "SK-104", squadronId: "sq-recon", model: "Falcon X1", task: "Standby", payload: "EO/IR gimbal", status: "idle", battery: 96, anchor: [-122.41, 37.815], spread: 0.02, legs: 5 },
    // Survey Grid — city raster
    { id: "sk-201", callsign: "SK-201", squadronId: "sq-survey", model: "Surveyor S3", task: "Grid A-7 mapping", payload: "LiDAR + RGB", status: "active", battery: 73, anchor: [-122.42, 37.76], spread: 0.02, legs: 8 },
    { id: "sk-202", callsign: "SK-202", squadronId: "sq-survey", model: "Surveyor S3", task: "Grid B-2 mapping", payload: "LiDAR + RGB", status: "active", battery: 58, anchor: [-122.4, 37.74], spread: 0.018, legs: 8 },
    { id: "sk-203", callsign: "SK-203", squadronId: "sq-survey", model: "Surveyor S2", task: "Thermal survey", payload: "Thermal array", status: "anomaly", battery: 41, anchor: [-122.44, 37.75], spread: 0.02, legs: 6 },
    { id: "sk-204", callsign: "SK-204", squadronId: "sq-survey", model: "Surveyor S2", task: "Charging", payload: "LiDAR + RGB", status: "charging", battery: 34, anchor: [-122.43, 37.728], spread: 0.02, legs: 6 },
    // Relay Net — high-altitude comms mesh
    { id: "sk-301", callsign: "SK-301", squadronId: "sq-relay", model: "Aether R1", task: "Comms relay node", payload: "Mesh radio", status: "active", battery: 88, anchor: [-122.38, 37.79], spread: 0.035, legs: 5 },
    { id: "sk-302", callsign: "SK-302", squadronId: "sq-relay", model: "Aether R1", task: "Comms relay node", payload: "Mesh radio", status: "active", battery: 77, anchor: [-122.36, 37.77], spread: 0.03, legs: 5 },
    { id: "sk-303", callsign: "SK-303", squadronId: "sq-relay", model: "Aether R1", task: "Backhaul link", payload: "Mesh radio", status: "active", battery: 69, anchor: [-122.39, 37.755], spread: 0.028, legs: 6 },
    { id: "sk-304", callsign: "SK-304", squadronId: "sq-relay", model: "Aether R0", task: "Standby", payload: "Mesh radio", status: "idle", battery: 91, anchor: [-122.365, 37.735], spread: 0.025, legs: 5 },
];

/** Build the initial fleet from the seed spec. */
export function makeFleet(): Drone[] {
    return SEED.map((s) => {
        const route = loop(s.anchor, s.spread, s.legs);
        // Idle/charging drones sit on the ground at base; launching flies them out
        // from there to their patrol route (waypoint 0).
        const grounded = s.status === "idle" || s.status === "charging";
        return {
            id: s.id,
            callsign: s.callsign,
            squadronId: s.squadronId,
            model: s.model,
            task: s.task,
            payload: s.payload,
            status: s.status,
            assignment: null,
            battery: s.battery,
            altitude: grounded ? 0 : 90 + (s.legs % 4) * 12,
            speed: s.status === "active" ? 14 + (s.legs % 3) * 2 : 0,
            signal: 78 + (s.legs % 5) * 4,
            heading: 0,
            position: grounded ? GROUND_STATION.position : route[0],
            route,
            waypoint: grounded ? 0 : 1,
        };
    });
}

// ─── Events ──────────────────────────────────────────────────────────────────

export type EventSeverity = "info" | "success" | "warning" | "danger";

export interface StreamEvent {
    id: number;
    /** Simulation tick when it fired. */
    tick: number;
    droneId: string;
    callsign: string;
    severity: EventSeverity;
    icon: IconName;
    message: string;
}

export const SEVERITY_INTENT: Record<EventSeverity, TagIntent> = {
    info: "none",
    success: "success",
    warning: "warning",
    danger: "danger",
};

// ─── Telemetry history ─────────────────────────────────────────────────────

/** Bounded ring buffers of recent samples, per drone. */
export interface TelemetryHistory {
    battery: number[];
    signal: number[];
    altitude: number[];
    speed: number[];
}

export const HISTORY_LEN = 48;

export function emptyHistory(): TelemetryHistory {
    return { battery: [], signal: [], altitude: [], speed: [] };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Format a tick count as MM:SS. */
export function formatClock(ticks: number): string {
    const t = Math.max(0, ticks);
    const mm = Math.floor(t / 60);
    const ss = t % 60;
    return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

/** Format a tick count as a mission-elapsed clock (T+MM:SS). */
export function formatMissionClock(tick: number): string {
    return `T+${formatClock(tick)}`;
}

export function squadronById(id: string): Squadron | undefined {
    return SQUADRONS.find((s) => s.id === id);
}
