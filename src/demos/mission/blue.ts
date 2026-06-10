/**
 * Skylark — blue (friendly) forces and their ISR requests.
 *
 * Blue units are the things the operator protects: a ground convoy and a patrol
 * vessel on fixed route loops, plus a static checkpoint. Hostile contacts stalk
 * them (see `stream/engine.ts`); passing intel on a classified hostile warns the
 * nearest blue, which reroutes/holds and becomes immune to that specific threat.
 * An *unwarned* blue caught by a hostile takes a hit — a big score penalty, but
 * not a shift-fail (RTS-with-pause tone).
 *
 * ISR requests are the blues' side objectives: timed windows during which any
 * drone loitering (or passing slowly enough) inside the marked ring earns the
 * reward. The schedule is hand-authored and deterministic — stage 6's seed
 * plumbing is the point where it would start varying per shift.
 */
import type { IconName } from "@/components/ui/icon";
import type { TagIntent } from "@/components/ui/tag";

import type { LngLat } from "./data";

// ─── Blue units ──────────────────────────────────────────────────────────────

export type BlueKind = "convoy" | "vessel" | "checkpoint";

export type BlueStatus =
    | "moving" // following its route loop
    | "holding" // stationary (checkpoints; also their warned posture)
    | "rerouting" // warned — opening the range from a known hostile
    | "hit"; // caught by an unwarned hostile — inert for the shift

export interface BlueKindMeta {
    label: string;
    icon: IconName;
}

export const BLUE_KIND_META: Record<BlueKind, BlueKindMeta> = {
    convoy: { label: "Ground convoy", icon: "drive-time" },
    vessel: { label: "Patrol vessel", icon: "ship" },
    checkpoint: { label: "Checkpoint", icon: "shield" },
};

export interface BlueStatusMeta {
    label: string;
    intent: TagIntent;
    /** Hex used for the map diamond (canvas, not token-driven). */
    color: string;
}

export const BLUE_STATUS_META: Record<BlueStatus, BlueStatusMeta> = {
    moving: { label: "Moving", intent: "primary", color: "#2d72d2" },
    holding: { label: "Holding", intent: "primary", color: "#2d72d2" },
    rerouting: { label: "Rerouting", intent: "warning", color: "#c87619" },
    hit: { label: "Hit", intent: "danger", color: "#5f6b7c" },
};

export interface BlueUnit {
    id: string;
    callsign: string;
    kind: BlueKind;
    position: LngLat;
    /** Closed loop of waypoints (a single point for a checkpoint). */
    route: LngLat[];
    /** Index of the waypoint currently being approached. */
    waypoint: number;
    /** degrees/tick — slower than any drone. */
    speed: number;
    status: BlueStatus;
    /** Target ids this unit has been warned about (pass-intel) — immune to those. */
    warnedAbout: Set<string>;
}

/** Build the shift's blue order of battle (deterministic, hand-authored). */
export function makeBlues(): BlueUnit[] {
    const convoyRoute: LngLat[] = [
        [-122.46, 37.74],
        [-122.45, 37.775],
        [-122.425, 37.79],
        [-122.405, 37.78],
        [-122.415, 37.752],
        [-122.44, 37.73],
    ];
    const vesselRoute: LngLat[] = [
        [-122.355, 37.815],
        [-122.34, 37.79],
        [-122.338, 37.762],
        [-122.35, 37.735],
        [-122.368, 37.755],
        [-122.366, 37.79],
    ];
    const checkpointPos: LngLat = [-122.472, 37.768];
    return [
        {
            id: "blue-convoy",
            callsign: "CONVOY-2",
            kind: "convoy",
            position: [convoyRoute[0][0], convoyRoute[0][1]],
            route: convoyRoute,
            waypoint: 1,
            speed: 0.0009,
            status: "moving",
            warnedAbout: new Set(),
        },
        {
            id: "blue-vessel",
            callsign: "PELICAN-7",
            kind: "vessel",
            position: [vesselRoute[0][0], vesselRoute[0][1]],
            route: vesselRoute,
            waypoint: 1,
            speed: 0.0007,
            status: "moving",
            warnedAbout: new Set(),
        },
        {
            id: "blue-checkpoint",
            callsign: "OUTPOST-4",
            kind: "checkpoint",
            position: [checkpointPos[0], checkpointPos[1]],
            route: [checkpointPos],
            waypoint: 0,
            speed: 0,
            status: "holding",
            warnedAbout: new Set(),
        },
    ];
}

// ─── ISR requests (side objectives) ──────────────────────────────────────────

export type IsrStatus = "pending" | "active" | "done" | "missed";

export interface IsrRequest {
    id: string;
    /** Callsign of the requesting blue unit. */
    from: string;
    position: LngLat;
    /** Coverage radius in degrees (planar — matches the engine's `dist`). */
    radius: number;
    /** Tick the request opens. */
    tick: number;
    /** Window length — fulfil before `tick + durationTicks`. */
    durationTicks: number;
    reward: number;
    status: IsrStatus;
    /** Cumulative ticks any drone has spent inside the radius while active. */
    coverTicks: number;
}

/**
 * The shift's seeded ISR schedule, scaled to the shift length. The ring
 * positions are deliberate: each sits on the patrol route of a drone that
 * starts *grounded* (SK-204, SK-304, SK-104) and clear of the always-airborne
 * loops — verified empirically, a full hands-off shift accumulates less cover
 * than `ISR_COVER_TICKS` on every ring, while launching the matching standby
 * bird when the window opens fulfils it. The play is "launch the right drone",
 * not free-riding on ambient coverage.
 */
export function makeIsrRequests(shiftTicks: number): IsrRequest[] {
    const window = Math.round(shiftTicks * 0.16);
    const at = (frac: number) => Math.round(shiftTicks * frac);
    return [
        { id: "isr-1", from: "CONVOY-2", position: [-122.441, 37.713], radius: 0.015, tick: at(0.15), durationTicks: window, reward: 75, status: "pending", coverTicks: 0 },
        { id: "isr-2", from: "PELICAN-7", position: [-122.37, 37.7198], radius: 0.015, tick: at(0.45), durationTicks: window, reward: 75, status: "pending", coverTicks: 0 },
        { id: "isr-3", from: "OUTPOST-4", position: [-122.4032, 37.8312], radius: 0.015, tick: at(0.72), durationTicks: window, reward: 100, status: "pending", coverTicks: 0 },
    ];
}
