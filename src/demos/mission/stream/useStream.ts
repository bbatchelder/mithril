/**
 * useStream — the seeded, deterministic "live data" engine behind Skylark.
 *
 * A single clock (setInterval) advances the simulation. Each tick the engine:
 *   1. moves every airborne drone along its patrol loop (or back to base),
 *   2. random-walks telemetry (battery / signal / altitude / speed) within bounds,
 *   3. emits discrete events (waypoint reached, low battery, anomaly, recovered…),
 *   4. appends samples to per-drone ring buffers.
 *
 * All randomness comes from a seeded PRNG, so at the default speed the stream is
 * identical on every reload. `speed` runs N sub-steps per clock tick (faster feel,
 * diverges from the 1× sequence — that's expected for a user control).
 */
import { useCallback, useEffect, useRef, useState } from "react";

import { Rng } from "../prng";
import {
    type Drone,
    type DroneStatus,
    type StreamEvent,
    type TelemetryHistory,
    GROUND_STATION,
    HISTORY_LEN,
    emptyHistory,
    makeFleet,
} from "../data";

const SEED = 0x5ca1ab1e;
const TICK_MS = 1000;
const MAX_EVENTS = 60;

export type StreamSpeed = 1 | 2 | 5;

export interface StreamState {
    tick: number;
    drones: Drone[];
    events: StreamEvent[];
    history: Record<string, TelemetryHistory>;
    playing: boolean;
    speed: StreamSpeed;
    play: () => void;
    pause: () => void;
    toggle: () => void;
    setSpeed: (s: StreamSpeed) => void;
}

// ─── Geo helpers (planar approximation — fine at city scale) ─────────────────

function bearing(from: [number, number], to: [number, number]): number {
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    // degrees clockwise from north
    const deg = (Math.atan2(dx, dy) * 180) / Math.PI;
    return (deg + 360) % 360;
}

function dist(a: [number, number], b: [number, number]): number {
    return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

/** Move `from` toward `to` by `step` degrees; returns [pos, reached]. */
function moveToward(
    from: [number, number],
    to: [number, number],
    step: number,
): [[number, number], boolean] {
    const d = dist(from, to);
    if (d <= step || d === 0) return [[to[0], to[1]], true];
    const t = step / d;
    return [[from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t], false];
}

function clamp(v: number, lo: number, hi: number): number {
    return v < lo ? lo : v > hi ? hi : v;
}

// ─── Mutable simulation state (kept in a ref, never rendered directly) ───────

interface Sim {
    tick: number;
    drones: Drone[];
    events: StreamEvent[];
    history: Record<string, TelemetryHistory>;
    rng: Rng;
    eventId: number;
    /** Ticks remaining before an anomaly auto-recovers, per drone. */
    anomalyTimer: Record<string, number>;
}

function makeSim(): Sim {
    const drones = makeFleet();
    const history: Record<string, TelemetryHistory> = {};
    for (const d of drones) history[d.id] = emptyHistory();
    return { tick: 0, drones, events: [], history, rng: new Rng(SEED), eventId: 1, anomalyTimer: {} };
}

const CRUISE = 0.0024; // degrees/tick for active drones
const RETURN_SPEED = 0.0032;

function emit(
    sim: Sim,
    drone: Drone,
    severity: StreamEvent["severity"],
    icon: StreamEvent["icon"],
    message: string,
): void {
    sim.events.unshift({
        id: sim.eventId++,
        tick: sim.tick,
        droneId: drone.id,
        callsign: drone.callsign,
        severity,
        icon,
        message,
    });
    if (sim.events.length > MAX_EVENTS) sim.events.length = MAX_EVENTS;
}

function pushHistory(sim: Sim, d: Drone): void {
    const h = sim.history[d.id];
    const cap = (arr: number[], v: number) => {
        arr.push(v);
        if (arr.length > HISTORY_LEN) arr.shift();
    };
    cap(h.battery, d.battery);
    cap(h.signal, d.signal);
    cap(h.altitude, d.altitude);
    cap(h.speed, d.speed);
}

/** Advance the simulation by exactly one tick (mutates `sim`). */
function step(sim: Sim): void {
    sim.tick += 1;
    const rng = sim.rng;
    const base = GROUND_STATION.position;

    for (const d of sim.drones) {
        // ── Status machine ──────────────────────────────────────────────
        if (d.status === "anomaly") {
            const left = (sim.anomalyTimer[d.id] ?? 0) - 1;
            sim.anomalyTimer[d.id] = left;
            if (left <= 0) {
                d.status = "active";
                emit(sim, d, "success", "tick-circle", `${d.callsign} fault cleared — back on task`);
            }
        }

        if (d.status === "active" || d.status === "anomaly") {
            // Move along the patrol loop.
            const target = d.route[d.waypoint];
            const [pos, reached] = moveToward(d.position, target, CRUISE);
            d.heading = bearing(d.position, target);
            d.position = pos;
            if (reached) {
                d.waypoint = (d.waypoint + 1) % d.route.length;
                if (rng.chance(0.5)) {
                    emit(sim, d, "info", "map-marker", `${d.callsign} reached waypoint ${d.waypoint + 1}`);
                }
            }
            // Battery drain.
            d.battery = clamp(d.battery - rng.range(0.05, 0.14), 0, 100);
            // Telemetry walks.
            d.altitude = clamp(d.altitude + rng.range(-3, 3), 60, 150);
            d.speed = clamp(d.speed + rng.range(-1.5, 1.5), 9, 24);
            d.signal = clamp(d.signal + rng.range(-3, 2.5), 38, 100);
            // Low battery → recall.
            if (d.battery < 18 && d.status === "active") {
                d.status = "returning";
                emit(sim, d, "warning", "outdated", `${d.callsign} low battery (${Math.round(d.battery)}%) — returning to base`);
            }
            // Random anomaly onset.
            if (d.status === "active" && rng.chance(0.004)) {
                d.status = "anomaly";
                sim.anomalyTimer[d.id] = rng.int(6, 14);
                d.signal = clamp(d.signal - 25, 20, 100);
                emit(sim, d, "danger", "warning-sign", `${d.callsign} telemetry anomaly — signal degraded`);
            }
        } else if (d.status === "returning") {
            const [pos, reached] = moveToward(d.position, base, RETURN_SPEED);
            d.heading = bearing(d.position, base);
            d.position = pos;
            d.battery = clamp(d.battery - rng.range(0.03, 0.08), 0, 100);
            d.signal = clamp(d.signal + rng.range(-2, 3), 45, 100);
            d.altitude = clamp(d.altitude - rng.range(0, 2.5), 30, 150);
            if (reached) {
                d.status = "charging";
                d.speed = 0;
                d.altitude = 0;
                emit(sim, d, "info", "import", `${d.callsign} landed at base — charging`);
            }
        } else if (d.status === "charging") {
            d.battery = clamp(d.battery + rng.range(0.6, 1.1), 0, 100);
            d.signal = clamp(d.signal + rng.range(-1, 2), 70, 100);
            d.speed = 0;
            if (d.battery >= 100) {
                d.battery = 100;
                d.status = "active";
                d.speed = 16;
                d.altitude = 95;
                d.position = d.route[0];
                d.waypoint = 1;
                emit(sim, d, "success", "rocket-slant", `${d.callsign} recharged — relaunched`);
            }
        } else {
            // idle — gentle jitter only
            d.signal = clamp(d.signal + rng.range(-1, 1), 80, 100);
            d.speed = 0;
        }

        pushHistory(sim, d);
    }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useStream(): StreamState {
    const simRef = useRef<Sim>(makeSim());
    const [snapshot, setSnapshot] = useState(() => commit(simRef.current));
    const [playing, setPlaying] = useState(true);
    const [speed, setSpeedState] = useState<StreamSpeed>(1);

    // Keep the latest speed available to the interval without re-subscribing.
    const speedRef = useRef<StreamSpeed>(speed);
    speedRef.current = speed;

    useEffect(() => {
        if (!playing) return;
        const handle = window.setInterval(() => {
            const sim = simRef.current;
            const steps = speedRef.current;
            for (let i = 0; i < steps; i++) step(sim);
            setSnapshot(commit(sim));
        }, TICK_MS);
        return () => window.clearInterval(handle);
    }, [playing]);

    const play = useCallback(() => setPlaying(true), []);
    const pause = useCallback(() => setPlaying(false), []);
    const toggle = useCallback(() => setPlaying((p) => !p), []);
    const setSpeed = useCallback((s: StreamSpeed) => setSpeedState(s), []);

    return { ...snapshot, playing, speed, play, pause, toggle, setSpeed };
}

/** Build an immutable render snapshot from the mutable sim (new references). */
function commit(sim: Sim): {
    tick: number;
    drones: Drone[];
    events: StreamEvent[];
    history: Record<string, TelemetryHistory>;
} {
    const history: Record<string, TelemetryHistory> = {};
    for (const id of Object.keys(sim.history)) {
        const h = sim.history[id];
        history[id] = {
            battery: h.battery.slice(),
            signal: h.signal.slice(),
            altitude: h.altitude.slice(),
            speed: h.speed.slice(),
        };
    }
    return {
        tick: sim.tick,
        drones: sim.drones.map((d) => ({ ...d, position: [d.position[0], d.position[1]] as [number, number] })),
        events: sim.events.slice(),
        history,
    };
}

export type { Drone, DroneStatus };
