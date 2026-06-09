/**
 * engine — the pure, seeded simulation core behind Skylark (no React).
 *
 * A single `step()` advances the shift one tick. Each tick the engine:
 *   1. moves every airborne drone (patrol loop, investigation orbit, or return leg),
 *   2. random-walks telemetry (battery / signal / altitude / speed) within bounds,
 *   3. applies the game rules — battery warnings, crash-at-0%, pad rotation, scoring,
 *   4. emits discrete events and appends samples to per-drone ring buffers,
 *   5. ends the shift once the clock runs out.
 *
 * Skylark is a *game*: there is no autopilot fleet management. Drones do not recall
 * themselves at low battery and do not relaunch when charged — `launch` / `recall`
 * are operator actions, and a drone that hits 0% mid-air crashes (`lost`) and costs
 * score. All randomness comes from a seeded PRNG, so a shift is deterministic at 1×.
 * The React side lives in `useStream.ts`; keeping this module pure keeps the game
 * rules unit-testable (see `engine.test.ts`).
 */
import { Rng } from "../prng";
import {
    type Drone,
    type StreamEvent,
    type TelemetryHistory,
    GROUND_STATION,
    HISTORY_LEN,
    emptyHistory,
    makeFleet,
} from "../data";
import { type Target, makeTargets, upgradeTarget } from "../targets";

const SEED = 0x5ca1ab1e;
const MAX_EVENTS = 60;

// ─── Game rules ──────────────────────────────────────────────────────────────

/** Shift length in sim ticks (15 min at 1×). */
export const SHIFT_TICKS = 900;
/** Charging pads at base — only this many drones can charge at once. */
export const PAD_COUNT = 3;
/** Intel points per confidence tier raised by a completed investigation. */
export const SCORE_PER_TIER = 25;
/** Score penalty for crashing a drone. */
export const CRASH_PENALTY = 250;
/** Battery levels (percent) that trigger the one-shot low/critical warnings. */
export const BATTERY_WARN = 25;
export const BATTERY_CRITICAL = 10;
/** Idle drones below this battery are pulled onto a pad when one frees up. */
const PAD_WANT = 95;

export type ShiftPhase = "running" | "ended";

export interface ShiftScore {
    /** Points earned from delivered intelligence. */
    intel: number;
    /** Points lost (stored positive; subtracted from the total). */
    penalties: number;
    total: number;
}

/** Counters surfaced in the end-of-shift debrief. */
export interface ShiftStats {
    investigations: number;
    factsRaised: number;
    dronesLost: number;
    launches: number;
    recalls: number;
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

// ─── Mutable simulation state (kept in a ref by the hook, never rendered) ────

export interface Sim {
    tick: number;
    phase: ShiftPhase;
    drones: Drone[];
    targets: Target[];
    events: StreamEvent[];
    history: Record<string, TelemetryHistory>;
    score: { intel: number; penalties: number };
    stats: ShiftStats;
    rng: Rng;
    eventId: number;
    /** Ticks remaining before an anomaly auto-recovers, per drone. */
    anomalyTimer: Record<string, number>;
    /** One-shot battery warning level already emitted, per drone. */
    batteryWarned: Record<string, "low" | "critical" | undefined>;
}

export function makeSim(): Sim {
    const drones = makeFleet();
    const history: Record<string, TelemetryHistory> = {};
    for (const d of drones) history[d.id] = emptyHistory();
    return {
        tick: 0,
        phase: "running",
        drones,
        targets: makeTargets(),
        events: [],
        history,
        score: { intel: 0, penalties: 0 },
        stats: { investigations: 0, factsRaised: 0, dronesLost: 0, launches: 0, recalls: 0 },
        rng: new Rng(SEED),
        eventId: 1,
        anomalyTimer: {},
        batteryWarned: {},
    };
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
    drone: Pick<Drone, "id" | "callsign">,
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

/** Emit an event from the ground station rather than a drone. */
function emitBase(sim: Sim, severity: StreamEvent["severity"], icon: StreamEvent["icon"], message: string): void {
    emit(sim, { id: GROUND_STATION.id, callsign: GROUND_STATION.callsign }, severity, icon, message);
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

// ─── Game-rule helpers ───────────────────────────────────────────────────────

function airborne(d: Drone): boolean {
    return d.status === "active" || d.status === "anomaly" || d.status === "returning";
}

function chargingCount(sim: Sim): number {
    return sim.drones.filter((d) => d.status === "charging").length;
}

/** Abort a drone's investigation, freeing the target to be re-tasked. */
function clearAssignment(sim: Sim, d: Drone): void {
    if (!d.assignment) return;
    const tgt = sim.targets.find((t) => t.id === d.assignment!.targetId);
    if (tgt && tgt.investigation.status !== "complete") {
        tgt.investigation = { status: "idle" };
    }
    d.task = d.assignment.prevTask;
    d.assignment = null;
}

/** Battery hit 0 mid-air: the airframe is gone for the shift. */
function crash(sim: Sim, d: Drone): void {
    clearAssignment(sim, d);
    d.status = "lost";
    d.battery = 0;
    d.speed = 0;
    d.altitude = 0;
    sim.score.penalties += CRASH_PENALTY;
    sim.stats.dronesLost += 1;
    emit(sim, d, "danger", "cross-circle", `${d.callsign} down — battery exhausted mid-flight (−${CRASH_PENALTY} pts)`);
}

/**
 * One-shot low/critical battery warnings for airborne drones. With no auto-recall,
 * these events are the operator's only prompt to act.
 */
function warnBattery(sim: Sim, d: Drone): void {
    const warned = sim.batteryWarned[d.id];
    if (d.battery < BATTERY_CRITICAL && warned !== "critical") {
        sim.batteryWarned[d.id] = "critical";
        emit(sim, d, "danger", "outdated", `${d.callsign} battery critical (${Math.round(d.battery)}%) — recall now or lose the airframe`);
    } else if (d.battery < BATTERY_WARN && !warned) {
        sim.batteryWarned[d.id] = "low";
        emit(sim, d, "warning", "outdated", `${d.callsign} low battery (${Math.round(d.battery)}%)`);
    }
}

/** Pull the neediest waiting drone onto a freed pad. */
function assignPads(sim: Sim): void {
    while (chargingCount(sim) < PAD_COUNT) {
        const waiting = sim.drones
            .filter((d) => d.status === "idle" && d.battery < PAD_WANT)
            .sort((a, b) => a.battery - b.battery);
        const next = waiting[0];
        if (!next) return;
        next.status = "charging";
        emit(sim, next, "info", "offline", `${next.callsign} on charging pad`);
    }
}

/** Land a returning drone: take a free pad, or wait at base. */
function land(sim: Sim, d: Drone): void {
    d.speed = 0;
    d.altitude = 0;
    d.position = [GROUND_STATION.position[0], GROUND_STATION.position[1]];
    if (chargingCount(sim) < PAD_COUNT) {
        d.status = "charging";
        emit(sim, d, "info", "import", `${d.callsign} landed at base — on charging pad`);
    } else {
        d.status = "idle";
        emit(sim, d, "warning", "import", `${d.callsign} landed at base — all pads busy, waiting`);
    }
}

// ─── Tick ────────────────────────────────────────────────────────────────────

/** Advance the simulation by exactly one tick (mutates `sim`). */
export function step(sim: Sim): void {
    if (sim.phase === "ended") return;
    sim.tick += 1;
    const rng = sim.rng;
    const base = GROUND_STATION.position;

    for (const d of sim.drones) {
        // Crashed airframes are inert (history flatlines at their last samples).
        if (d.status === "lost") continue;

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
                warnBattery(sim, d);
                if (d.battery <= 0) crash(sim, d);
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
                    const raised = upgradeTarget(tgt, rng);
                    const points = raised * SCORE_PER_TIER;
                    sim.score.intel += points;
                    sim.stats.investigations += 1;
                    sim.stats.factsRaised += raised;
                    tgt.investigation.status = "complete";
                    d.task = d.assignment.prevTask;
                    d.assignment = null;
                    emit(sim, d, "success", "predictive-analysis", `${d.callsign} finished ${tgt.designation} — confidence raised (+${points} pts)`);
                }
                warnBattery(sim, d);
                if (d.battery <= 0) crash(sim, d);
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
            warnBattery(sim, d);
            if (d.battery <= 0) {
                crash(sim, d);
                pushHistory(sim, d);
                continue;
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
            warnBattery(sim, d);
            if (d.battery <= 0) {
                crash(sim, d);
                pushHistory(sim, d);
                continue;
            }
            if (reached) land(sim, d);
        } else if (d.status === "charging") {
            d.battery = clamp(d.battery + rng.range(0.6, 1.1), 0, 100);
            d.signal = clamp(d.signal + rng.range(-1, 2), 70, 100);
            d.speed = 0;
            if (d.battery >= 100) {
                // Fully charged: release the pad and stand ready. Relaunching is the
                // operator's call — there is no autopilot here.
                d.battery = 100;
                d.status = "idle";
                sim.batteryWarned[d.id] = undefined;
                emit(sim, d, "success", "tick-circle", `${d.callsign} recharged — ready to launch`);
                assignPads(sim);
            }
        } else {
            // idle at base — gentle jitter only
            d.signal = clamp(d.signal + rng.range(-1, 1), 80, 100);
            d.speed = 0;
        }

        pushHistory(sim, d);
    }

    // ── Shift clock ──────────────────────────────────────────────────────
    if (sim.tick >= SHIFT_TICKS) {
        sim.phase = "ended";
        emitBase(sim, "info", "time", "Shift complete — stand down. Debrief ready.");
    }
}

// ─── Operator actions ────────────────────────────────────────────────────────

/**
 * Launch a grounded drone (idle or charging) out to its patrol route. Launching
 * off a pad frees it for the next waiting drone. Low-battery launches are allowed —
 * endurance risk is the operator's to manage.
 */
export function launch(sim: Sim, droneId: string): void {
    if (sim.phase === "ended") return;
    const d = sim.drones.find((x) => x.id === droneId);
    if (!d || (d.status !== "idle" && d.status !== "charging")) return;
    const offPad = d.status === "charging";
    d.status = "active";
    d.speed = 16;
    d.altitude = 80;
    d.waypoint = 0;
    sim.stats.launches += 1;
    if (d.battery < BATTERY_WARN) {
        emit(sim, d, "warning", "rocket-slant", `${d.callsign} launched at ${Math.round(d.battery)}% — short endurance`);
    } else {
        emit(sim, d, "info", "rocket-slant", `${d.callsign} launched — en route to patrol`);
    }
    if (offPad) assignPads(sim);
}

/**
 * Recall an airborne drone to base. Recalling mid-investigation aborts it (the
 * target becomes re-taskable).
 */
export function recall(sim: Sim, droneId: string): void {
    if (sim.phase === "ended") return;
    const d = sim.drones.find((x) => x.id === droneId);
    if (!d || !airborne(d) || d.status === "returning") return;
    clearAssignment(sim, d);
    d.status = "returning";
    sim.stats.recalls += 1;
    emit(sim, d, "info", "undo", `${d.callsign} recalled to base`);
}

/** Turn a returning drone around — back to its patrol. */
export function resumePatrol(sim: Sim, droneId: string): void {
    if (sim.phase === "ended") return;
    const d = sim.drones.find((x) => x.id === droneId);
    if (!d || d.status !== "returning") return;
    d.status = "active";
    emit(sim, d, "info", "play", `${d.callsign} recall cancelled — resuming patrol`);
}

/**
 * Task the nearest free drone to investigate a target. Prefers airborne drones;
 * falls back to launching a grounded one (idle/charging). Returning and lost
 * drones are never auto-tasked.
 */
export function investigate(sim: Sim, targetId: string): void {
    if (sim.phase === "ended") return;
    const tgt = sim.targets.find((t) => t.id === targetId);
    if (!tgt || tgt.investigation.status !== "idle") return;

    const free = sim.drones.filter(
        (d) => !d.assignment && d.status !== "returning" && d.status !== "lost",
    );
    const actives = free.filter((d) => d.status === "active" || d.status === "anomaly");
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

    const offPad = best.status === "charging";
    if (best.status === "idle" || best.status === "charging") {
        best.status = "active";
        sim.stats.launches += 1;
    }
    if (best.speed < 14) best.speed = 16;
    if (best.altitude < 60) best.altitude = 80;
    // Lock the tangent entry angle now (from where the drone starts), so the whole
    // enroute leg is a straight line onto the orbit.
    const entryAngle = joinAngle(best.position, tgt.position);
    best.assignment = { targetId, phase: "enroute", ticksLeft: 0, orbitAngle: entryAngle, prevTask: best.task };
    best.task = `Investigating ${tgt.designation}`;
    tgt.investigation = { status: "enroute", droneId: best.id, droneCallsign: best.callsign };
    emit(sim, best, "info", "locate", `${best.callsign} tasked to investigate ${tgt.designation}`);
    if (offPad) assignPads(sim);
}

// ─── Render snapshot ─────────────────────────────────────────────────────────

export interface Snapshot {
    tick: number;
    phase: ShiftPhase;
    drones: Drone[];
    targets: Target[];
    events: StreamEvent[];
    history: Record<string, TelemetryHistory>;
    score: ShiftScore;
    stats: ShiftStats;
    /** Charging pads currently occupied (of {@link PAD_COUNT}). */
    padsUsed: number;
}

/** Build an immutable render snapshot from the mutable sim (new references). */
export function commit(sim: Sim): Snapshot {
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
        phase: sim.phase,
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
        score: {
            intel: sim.score.intel,
            penalties: sim.score.penalties,
            total: sim.score.intel - sim.score.penalties,
        },
        stats: { ...sim.stats },
        padsUsed: chargingCount(sim),
    };
}
