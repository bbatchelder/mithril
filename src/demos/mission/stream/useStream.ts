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
import { type Target, makeTargets, upgradeTarget } from "../targets";

const SEED = 0x5ca1ab1e;
const TICK_MS = 1000;
const MAX_EVENTS = 60;

export type StreamSpeed = 1 | 2 | 5;

export interface StreamState {
    tick: number;
    drones: Drone[];
    targets: Target[];
    events: StreamEvent[];
    history: Record<string, TelemetryHistory>;
    playing: boolean;
    speed: StreamSpeed;
    play: () => void;
    pause: () => void;
    toggle: () => void;
    setSpeed: (s: StreamSpeed) => void;
    /** Task the nearest free drone to investigate a target; raises its confidence on arrival. */
    investigate: (targetId: string) => void;
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
    targets: Target[];
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
    return { tick: 0, drones, targets: makeTargets(), events: [], history, rng: new Rng(SEED), eventId: 1, anomalyTimer: {} };
}

const CRUISE = 0.0024; // degrees/tick for active drones
const RETURN_SPEED = 0.0032;
// Loiter orbit while investigating: a tight ellipse (x scaled by ORBIT_ASPECT to
// match the patrol loops — so it reads as a circle on screen) that the drone
// circles, advancing ORBIT_STEP radians per tick.
const ORBIT_RADIUS = 0.005;
const ORBIT_ASPECT = 1.3;
const ORBIT_STEP = 0.45;

/** Point on the loiter orbit at center-angle `angle` (radians, CCW). */
function ringPoint(center: [number, number], angle: number): [number, number] {
    return [center[0] + Math.cos(angle) * ORBIT_RADIUS * ORBIT_ASPECT, center[1] + Math.sin(angle) * ORBIT_RADIUS];
}

/**
 * Center-angle of the orbit point a drone at `from` should aim for so it joins the
 * ring *tangentially* (flying straight there arrives with velocity already tangent
 * to the orbit — no overflight of the target). Computed in the orbit's normalized
 * space, where the ellipse is a circle, then used to advance CCW (+angle) to match
 * the loiter direction.
 */
function joinAngle(from: [number, number], center: [number, number]): number {
    const u = (from[0] - center[0]) / ORBIT_ASPECT; // normalize x → unit-aspect circle
    const v = from[1] - center[1];
    const d = Math.hypot(u, v);
    const beta = Math.atan2(v, u); // bearing of the drone from the orbit center
    if (d <= ORBIT_RADIUS) return beta; // already inside: head out to the nearest ring point
    // Tangent point sits γ = acos(R/d) off the center→drone bearing; +γ is the CCW one.
    return beta + Math.acos(ORBIT_RADIUS / d);
}

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
        // ── Tasked investigation overrides the patrol entirely ──────────
        if (d.assignment) {
            const tgt = sim.targets.find((t) => t.id === d.assignment!.targetId);
            if (!tgt) {
                d.assignment = null;
            } else if (d.assignment.phase === "enroute") {
                // Fly straight to the tangent entry point on the orbit (orbitAngle was
                // fixed at dispatch). A straight run to it arrives tangent to the ring,
                // so the drone rolls into the loiter without crossing the target.
                const from = d.position;
                const entry = ringPoint(tgt.position, d.assignment.orbitAngle);
                const [pos, reached] = moveToward(from, entry, RETURN_SPEED);
                d.heading = bearing(from, entry);
                d.position = pos;
                d.battery = clamp(d.battery - rng.range(0.04, 0.1), 0, 100);
                d.signal = clamp(d.signal + rng.range(-2, 2), 40, 100);
                d.speed = clamp(d.speed + rng.range(-1, 1), 14, 26);
                d.altitude = clamp(d.altitude + rng.range(-3, 3), 60, 150);
                if (reached) {
                    d.assignment.phase = "investigating";
                    d.assignment.ticksLeft = rng.int(12, 18);
                    tgt.investigation.status = "investigating";
                    emit(sim, d, "info", "geosearch", `${d.callsign} on station over ${tgt.designation} — collecting`);
                }
                pushHistory(sim, d);
                continue;
            } else {
                // Loiter: continue CCW around the orbit from the tangent entry point.
                d.assignment.orbitAngle += ORBIT_STEP;
                const prev = d.position;
                const next = ringPoint(tgt.position, d.assignment.orbitAngle);
                d.heading = bearing(prev, next);
                d.position = next;
                d.speed = clamp(d.speed + rng.range(-1, 1), 11, 18);
                d.signal = clamp(d.signal + rng.range(-1, 2), 60, 100);
                d.battery = clamp(d.battery - rng.range(0.03, 0.07), 0, 100);
                d.altitude = clamp(d.altitude + rng.range(-2, 2), 60, 150);
                d.assignment.ticksLeft -= 1;
                if (d.assignment.ticksLeft <= 0) {
                    upgradeTarget(tgt, rng);
                    tgt.investigation.status = "complete";
                    d.task = d.assignment.prevTask;
                    d.assignment = null;
                    emit(sim, d, "success", "predictive-analysis", `${d.callsign} finished ${tgt.designation} — intelligence updated, confidence raised`);
                }
                pushHistory(sim, d);
                continue;
            }
        }

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

    // Task the nearest free, airborne-capable drone to investigate a target. Runs
    // outside the tick: mutate the sim and commit immediately so the UI reflects the
    // dispatch even while paused (the drone then moves once the stream is playing).
    const investigate = useCallback((targetId: string) => {
        const sim = simRef.current;
        const tgt = sim.targets.find((t) => t.id === targetId);
        if (!tgt || tgt.investigation.status !== "idle") return;

        const free = sim.drones.filter((d) => !d.assignment && d.status !== "charging");
        const actives = free.filter((d) => d.status === "active");
        const pool = actives.length > 0 ? actives : free;
        if (pool.length === 0) return;

        let best = pool[0];
        let bestDist = Infinity;
        for (const d of pool) {
            const dd = dist(d.position, tgt.position);
            if (dd < bestDist) {
                bestDist = dd;
                best = d;
            }
        }

        best.status = "active";
        if (best.speed < 14) best.speed = 16;
        if (best.altitude < 60) best.altitude = 95;
        // Lock the tangent entry angle now (from where the drone starts), so the whole
        // enroute leg is a straight line onto the orbit.
        const entryAngle = joinAngle(best.position, tgt.position);
        best.assignment = { targetId, phase: "enroute", ticksLeft: 0, orbitAngle: entryAngle, prevTask: best.task };
        best.task = `Investigating ${tgt.designation}`;
        tgt.investigation = { status: "enroute", droneId: best.id, droneCallsign: best.callsign };
        emit(sim, best, "info", "locate", `${best.callsign} tasked to investigate ${tgt.designation}`);
        setSnapshot(commit(sim));
    }, []);

    return { ...snapshot, playing, speed, play, pause, toggle, setSpeed, investigate };
}

/** Build an immutable render snapshot from the mutable sim (new references). */
function commit(sim: Sim): {
    tick: number;
    drones: Drone[];
    targets: Target[];
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
        drones: sim.drones.map((d) => ({
            ...d,
            position: [d.position[0], d.position[1]] as [number, number],
            assignment: d.assignment ? { ...d.assignment } : null,
        })),
        targets: sim.targets.map((t) => ({
            ...t,
            position: [t.position[0], t.position[1]] as [number, number],
            investigation: { ...t.investigation },
            facts: t.facts.map((f) => ({ ...f, sources: f.sources.slice() })),
        })),
        events: sim.events.slice(),
        history,
    };
}

export type { Drone, DroneStatus };
