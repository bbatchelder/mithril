/**
 * engine — the pure, seeded simulation core behind Skylark (no React).
 *
 * A single `step()` advances the shift one tick. Each tick the engine:
 *   1. moves every airborne drone (patrol loop, investigation/designation orbit,
 *      strike run, or return leg),
 *   2. random-walks telemetry (battery / signal / altitude / speed) within bounds,
 *   3. applies the game rules — battery warnings, crash-at-0%, pad rotation
 *      (charging doubles as rearming for strike airframes), scoring,
 *   4. moves the blue forces and the hostiles stalking them (`blue.ts`), resolves
 *      unwarned-blue hits, and progresses the ISR request windows,
 *   5. lands any external-fire missions whose flight delay has elapsed — a hit
 *      only if the target is still inside the blast radius of the aim point,
 *   6. runs the fog-of-war pass — contacts spawn hidden on a seeded schedule, are
 *      detected when a drone's sensor footprint covers them, and go stale without
 *      coverage (see `targets.ts` for the track lifecycle),
 *   7. emits discrete events and appends samples to per-drone ring buffers,
 *   8. ends the shift once the clock runs out.
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
    type LngLat,
    type StreamEvent,
    type TelemetryHistory,
    GROUND_STATION,
    HISTORY_LEN,
    SENSOR_META,
    emptyHistory,
    formatMissionClock,
    makeFleet,
} from "../data";
import { type BlueUnit, type IsrRequest, makeBlues, makeIsrRequests } from "../blue";
import { type Target, makeTargets, upgradeTarget, verifiedFactCount } from "../targets";

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
/** Intel points for detecting a brand-new contact. */
export const DETECT_SCORE = 10;
/** Ticks an active track survives with no sensor coverage before going stale. */
export const STALE_TICKS = 45;
/**
 * Per-tick chance that a drone whose footprint covers a hidden/stale target
 * actually picks it up — higher when the sensor matches the target category,
 * so a sweep has tension but the right platform finds things fast.
 */
const DETECT_CHANCE_MATCHED = 0.35;
const DETECT_CHANCE = 0.15;
/** A spawned hostile within this range of a blue unit starts stalking it. */
export const THREAT_RADIUS = 0.05;
/**
 * Ticks after spawning before a hostile goes aggressive (drifts, strikes).
 * The grace window is what makes "detect → classify → warn" winnable when a
 * contact spawns right on top of a blue route.
 */
export const HOSTILE_DORMANT_TICKS = 60;
/** An unwarned blue kept inside this range of a hostile for HIT_TICKS is hit. */
export const STRIKE_RADIUS = 0.008;
/** Consecutive in-range ticks before an unwarned blue takes the hit. */
export const HIT_TICKS = 8;
/** Score penalty when a blue unit is hit. */
export const BLUE_HIT_PENALTY = 400;
/** Hostile drift speed (degrees/tick) — slower than any drone, faster than nothing. */
const HOSTILE_DRIFT = 0.001;
/** Intel points per verified fact when passing intel on a (real) hostile. */
export const PASS_SCORE_PER_VERIFIED = 15;
/** Score penalty for passing intel on a contact that is actually civilian. */
export const BAD_INTEL_PENALTY = 100;
/** Verified facts required before intel is strong enough to pass to a blue. */
export const PASS_MIN_VERIFIED = 2;
/**
 * Cumulative ticks of drone presence inside the ring that fulfil an ISR
 * request. High enough that a patrol edge grazing the ring doesn't do it —
 * fulfilling one means putting a drone whose loop covers the ring on station
 * (the rings sit on the standby birds' routes; see `makeIsrRequests`).
 */
export const ISR_COVER_TICKS = 20;
/** Munitions a strike airframe carries when fully armed. */
export const MUNITIONS_MAX = 2;
/** Pad ticks to reload a strike airframe to {@link MUNITIONS_MAX} (runs alongside charging). */
export const REARM_TICKS = 20;
/** Points for neutralizing a (real) hostile with either strike kind. */
export const STRIKE_SCORE = 200;
/** Score penalty for striking a contact that turns out to be civilian. */
export const CIVILIAN_STRIKE_PENALTY = 500;
/** External fire missions available per shift. */
export const FIRES_PER_SHIFT = 2;
/** Continuous on-orbit ticks a designating drone must hold before fires launch. */
export const DESIGNATE_TICKS = 12;
/** Ticks between fires launch and impact — the dodge window for a moving target. */
export const FIRE_DELAY_TICKS = 15;
/**
 * Hit radius around the aim point (fixed at launch). A hostile drifting at full
 * speed covers ~{@link FIRE_DELAY_TICKS} × 0.001° in flight — more than this —
 * so a target in transit escapes; one parked (or settled on its prey) does not.
 */
export const BLAST_RADIUS = 0.008;

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
    /** New contacts detected this shift. */
    detected: number;
    /** Tracks still stale (lost and never re-acquired) when the shift ended. */
    staleLost: number;
    /** Intel passes delivered to blue units (good and bad). */
    intelPasses: number;
    /** Passes that turned out to be on civilian contacts. */
    badIntelPasses: number;
    /** Blue units hit by hostiles this shift. */
    bluesHit: number;
    /** ISR requests fulfilled / expired unmet. */
    isrFulfilled: number;
    isrExpired: number;
    /** Hostiles destroyed by strikes (either kind). */
    neutralized: number;
    /** Strikes resolved without a verified affiliation — gambles, win or lose. */
    gamblesTaken: number;
    /** Strikes that hit a contact that was actually civilian. */
    strikeIncidents: number;
    /** External fires that landed after the target left the blast radius. */
    firesWasted: number;
}

/** An external-fire round in flight: launched at designation, lands after the delay. */
export interface FireMission {
    id: number;
    targetId: string;
    /** Aim point — the target's position when the round launched (it does not track). */
    position: LngLat;
    /** Tick the round lands on the aim point. */
    impactTick: number;
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
    blues: BlueUnit[];
    isr: IsrRequest[];
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
    /** Consecutive ticks each hostile has held an unwarned blue in strike range, keyed `targetId:blueId`. */
    threatTimer: Record<string, number>;
    /** External fire missions remaining this shift. */
    fires: number;
    /** Rounds launched and not yet landed. */
    firesInFlight: FireMission[];
    fireId: number;
    /** Pad ticks remaining until a rearming strike airframe is reloaded, per drone. */
    rearmTimer: Record<string, number>;
}

export function makeSim(): Sim {
    const drones = makeFleet();
    const history: Record<string, TelemetryHistory> = {};
    for (const d of drones) history[d.id] = emptyHistory();
    return {
        tick: 0,
        phase: "running",
        drones,
        targets: makeTargets(SHIFT_TICKS),
        blues: makeBlues(),
        isr: makeIsrRequests(SHIFT_TICKS),
        events: [],
        history,
        score: { intel: 0, penalties: 0 },
        stats: {
            investigations: 0,
            factsRaised: 0,
            dronesLost: 0,
            launches: 0,
            recalls: 0,
            detected: 0,
            staleLost: 0,
            intelPasses: 0,
            badIntelPasses: 0,
            bluesHit: 0,
            isrFulfilled: 0,
            isrExpired: 0,
            neutralized: 0,
            gamblesTaken: 0,
            strikeIncidents: 0,
            firesWasted: 0,
        },
        rng: new Rng(SEED),
        eventId: 1,
        anomalyTimer: {},
        batteryWarned: {},
        threatTimer: {},
        fires: FIRES_PER_SHIFT,
        firesInFlight: [],
        fireId: 1,
        rearmTimer: {},
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

/** Abort a drone's assignment, freeing the target to be re-tasked. */
function clearAssignment(sim: Sim, d: Drone): void {
    if (!d.assignment) return;
    if (d.assignment.kind === "investigate") {
        const tgt = sim.targets.find((t) => t.id === d.assignment!.targetId);
        if (tgt && tgt.investigation.status !== "complete") {
            tgt.investigation = { status: "idle" };
        }
    }
    d.task = d.assignment.prevTask;
    d.assignment = null;
}

/** True for a strike airframe that is below a full load (a pad stay reloads it). */
function needsRearm(d: Drone): boolean {
    return d.munitions !== null && d.munitions < MUNITIONS_MAX;
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
            .filter((d) => d.status === "idle" && (d.battery < PAD_WANT || needsRearm(d)))
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

        // ── Tasked assignment overrides the patrol entirely ─────────────
        if (d.assignment) {
            const a = d.assignment;
            const tgt = sim.targets.find((t) => t.id === a.targetId);
            if (!tgt || tgt.struck) {
                // Target gone (struck by someone else mid-flight): break off.
                clearAssignment(sim, d);
            } else if (a.kind === "strike") {
                // Strike run: fly straight at the live position — one pass, no loiter.
                const from = d.position;
                const [pos, reached] = moveToward(from, tgt.position, RETURN_SPEED);
                d.heading = bearing(from, tgt.position);
                d.position = pos;
                d.battery = clamp(d.battery - rng.range(0.04, 0.1), 0, 100);
                d.signal = clamp(d.signal + rng.range(-2, 2), 40, 100);
                d.speed = clamp(d.speed + rng.range(-1, 1), 14, 26);
                d.altitude = clamp(d.altitude + rng.range(-3, 3), 60, 150);
                if (reached) {
                    d.munitions = (d.munitions ?? 1) - 1;
                    d.task = a.prevTask;
                    d.assignment = null;
                    emit(
                        sim,
                        d,
                        "warning",
                        "locate",
                        `${d.callsign} weapon released on ${tgt.designation}${
                            d.munitions === 0 ? " — munitions expended, rearm at base" : ""
                        }`,
                    );
                    resolveStrike(sim, tgt, d.callsign);
                }
                warnBattery(sim, d);
                if (d.battery <= 0) crash(sim, d);
                pushHistory(sim, d);
                continue;
            } else if (a.phase === "enroute") {
                // Fly straight to the tangent entry point on the orbit (orbitAngle was
                // fixed at dispatch). A straight run to it arrives tangent to the ring,
                // so the drone rolls into the loiter without crossing the target.
                const from = d.position;
                const entry = ringPoint(tgt.position, a.orbitAngle);
                const [pos, reached] = moveToward(from, entry, RETURN_SPEED);
                d.heading = bearing(from, entry);
                d.position = pos;
                d.battery = clamp(d.battery - rng.range(0.04, 0.1), 0, 100);
                d.signal = clamp(d.signal + rng.range(-2, 2), 40, 100);
                d.speed = clamp(d.speed + rng.range(-1, 1), 14, 26);
                d.altitude = clamp(d.altitude + rng.range(-3, 3), 60, 150);
                if (reached) {
                    if (a.kind === "designate") {
                        a.phase = "designating";
                        a.ticksLeft = DESIGNATE_TICKS;
                        emit(sim, d, "info", "locate", `${d.callsign} on station over ${tgt.designation} — designating for external fires`);
                    } else {
                        a.phase = "investigating";
                        a.ticksLeft = rng.int(12, 18);
                        tgt.investigation.status = "investigating";
                        emit(sim, d, "info", "geosearch", `${d.callsign} on station over ${tgt.designation} — collecting`);
                    }
                }
                warnBattery(sim, d);
                if (d.battery <= 0) crash(sim, d);
                pushHistory(sim, d);
                continue;
            } else {
                // Loiter: continue CCW around the orbit from the tangent entry point.
                a.orbitAngle += ORBIT_STEP;
                const prev = d.position;
                const next = ringPoint(tgt.position, a.orbitAngle);
                d.heading = bearing(prev, next);
                d.position = next;
                d.speed = clamp(d.speed + rng.range(-1, 1), 11, 18);
                d.signal = clamp(d.signal + rng.range(-1, 2), 60, 100);
                d.battery = clamp(d.battery - rng.range(0.03, 0.07), 0, 100);
                d.altitude = clamp(d.altitude + rng.range(-2, 2), 60, 150);
                a.ticksLeft -= 1;
                if (a.ticksLeft <= 0) {
                    if (a.kind === "designate") {
                        // Designation held for the full window: call the fires in.
                        d.task = a.prevTask;
                        d.assignment = null;
                        launchFires(sim, d, tgt);
                    } else {
                        const matched = d.sensor === tgt.bestSensor;
                        const raised = upgradeTarget(tgt, rng, d.sensor);
                        const points = raised * SCORE_PER_TIER;
                        sim.score.intel += points;
                        sim.stats.investigations += 1;
                        sim.stats.factsRaised += raised;
                        tgt.investigation.status = "complete";
                        // A close pass certainly holds the track, whatever the detection pass rolled.
                        tgt.lastSeenTick = sim.tick;
                        tgt.lastKnownPosition = [tgt.position[0], tgt.position[1]];
                        if (tgt.track !== "active") tgt.track = "active";
                        // Classification at ≥ Medium settles whose side the contact is on.
                        tgt.affiliationKnown = true;
                        const hostile = tgt.affiliation === "hostile";
                        const verdict = hostile ? "assessed HOSTILE" : "assessed civilian";
                        d.task = a.prevTask;
                        d.assignment = null;
                        emit(
                            sim,
                            d,
                            hostile ? "danger" : matched ? "success" : "warning",
                            "predictive-analysis",
                            matched
                                ? `${d.callsign} finished ${tgt.designation} — ${verdict}, confidence raised (+${points} pts)`
                                : `${d.callsign} finished ${tgt.designation} — wrong sensor for ${tgt.category.toLowerCase()}, capped at Medium; ${verdict} (+${points} pts)`,
                        );
                    }
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
            // A pad stay doubles as rearming for a strike airframe below full load.
            if (needsRearm(d)) {
                const left = (sim.rearmTimer[d.id] ?? REARM_TICKS) - 1;
                sim.rearmTimer[d.id] = left;
                if (left <= 0) {
                    d.munitions = MUNITIONS_MAX;
                    delete sim.rearmTimer[d.id];
                    emit(sim, d, "success", "tick-circle", `${d.callsign} rearmed — ${MUNITIONS_MAX} munitions aboard`);
                }
            }
            if (d.battery >= 100 && !needsRearm(d)) {
                // Fully charged (and reloaded): release the pad and stand ready.
                // Relaunching is the operator's call — there is no autopilot here.
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

    // ── Blue forces, hostile pressure, fires, ISR windows ────────────────
    stepBlues(sim);
    stepHostiles(sim);
    stepFires(sim);
    const flying = sim.drones.filter(airborne);
    stepIsr(sim, flying);

    // ── Fog of war: detection, track freshness, staleness ────────────────
    // Runs after movement so footprints test this tick's positions (including
    // hostile drift). For each spawned target, find a covering airborne drone
    // (preferring one whose sensor matches the category); coverage keeps an
    // active track fresh, and rolls the detection chance for hidden or stale ones.
    // Struck targets are out of play — frozen where they died, never stale.
    for (const t of sim.targets) {
        if (t.struck) continue;
        if (t.track === "undetected" && sim.tick < t.spawnTick) continue;

        let spotter: Drone | null = null;
        for (const d of flying) {
            if (dist(d.position, t.position) > SENSOR_META[d.sensor].range) continue;
            if (d.sensor === t.bestSensor) {
                spotter = d;
                break;
            }
            spotter ??= d;
        }

        if (t.track === "active") {
            if (spotter) {
                t.lastSeenTick = sim.tick;
                t.lastKnownPosition = [t.position[0], t.position[1]];
            } else if (sim.tick - t.lastSeenTick >= STALE_TICKS) {
                t.track = "stale";
                emitBase(sim, "warning", "eye-off", `Track ${t.designation} stale — no coverage since ${formatMissionClock(t.lastSeenTick)}; re-acquire to keep it`);
            }
        } else if (spotter) {
            const chance = spotter.sensor === t.bestSensor ? DETECT_CHANCE_MATCHED : DETECT_CHANCE;
            if (rng.chance(chance)) {
                const isNew = t.track === "undetected";
                t.track = "active";
                t.lastSeenTick = sim.tick;
                t.lastKnownPosition = [t.position[0], t.position[1]];
                if (isNew) {
                    t.detectedBy = spotter.callsign;
                    t.detectedAt = formatMissionClock(sim.tick);
                    sim.score.intel += DETECT_SCORE;
                    sim.stats.detected += 1;
                    emit(sim, spotter, "warning", "eye-open", `${spotter.callsign} new contact — ${t.designation} (${t.category.toLowerCase()}) (+${DETECT_SCORE} pts)`);
                } else {
                    emit(sim, spotter, "success", "eye-open", `${spotter.callsign} re-acquired ${t.designation} — track active again`);
                }
            }
        }
    }

    // ── Shift clock ──────────────────────────────────────────────────────
    if (sim.tick >= SHIFT_TICKS) {
        sim.phase = "ended";
        sim.stats.staleLost = sim.targets.filter((t) => t.track === "stale").length;
        emitBase(sim, "info", "time", "Shift complete — stand down. Debrief ready.");
    }
}

// ─── Blue forces + hostile pressure + ISR ────────────────────────────────────

/** True once a hostile is spawned *and* past its dormancy window — it now stalks. */
function hostileArmed(sim: Sim, t: Target): boolean {
    return !t.struck && t.affiliation === "hostile" && sim.tick >= t.spawnTick + HOSTILE_DORMANT_TICKS;
}

/** The nearest warned-about armed hostile within threat range of this blue, if any. */
function nearestWarnedThreat(sim: Sim, b: BlueUnit): Target | null {
    let best: Target | null = null;
    let bestD = THREAT_RADIUS;
    for (const t of sim.targets) {
        if (!hostileArmed(sim, t) || !b.warnedAbout.has(t.id)) continue;
        const d = dist(t.position, b.position);
        if (d <= bestD) {
            bestD = d;
            best = t;
        }
    }
    return best;
}

/**
 * Move the blue units: convoys and vessels run their route loops; checkpoints
 * hold. A unit warned about a nearby hostile (pass-intel) breaks off and opens
 * the range instead — the warning is also what makes it immune to that threat
 * (see {@link stepHostiles}).
 */
function stepBlues(sim: Sim): void {
    for (const b of sim.blues) {
        if (b.status === "hit") continue;
        if (b.kind === "checkpoint") {
            b.status = "holding";
            continue;
        }
        const threat = nearestWarnedThreat(sim, b);
        if (threat) {
            b.status = "rerouting";
            const dx = b.position[0] - threat.position[0];
            const dy = b.position[1] - threat.position[1];
            const d = Math.hypot(dx, dy);
            if (d > 0) {
                b.position = [b.position[0] + (dx / d) * b.speed, b.position[1] + (dy / d) * b.speed];
            }
            continue;
        }
        b.status = "moving";
        const [pos, reached] = moveToward(b.position, b.route[b.waypoint], b.speed);
        b.position = pos;
        if (reached) b.waypoint = (b.waypoint + 1) % b.route.length;
    }
}

/**
 * Hostile contacts stalk blue forces: an armed hostile (spawned + past its
 * dormancy window) drifts toward the nearest live blue within
 * {@link THREAT_RADIUS}, and an *unwarned* blue kept inside
 * {@link STRIKE_RADIUS} for {@link HIT_TICKS} consecutive ticks takes the hit.
 * This runs whether or not the operator has detected the hostile — fog of war
 * cuts both ways.
 */
function stepHostiles(sim: Sim): void {
    for (const t of sim.targets) {
        if (!hostileArmed(sim, t)) continue;
        const blues = sim.blues.filter((b) => b.status !== "hit");

        let prey: BlueUnit | null = null;
        let preyD = THREAT_RADIUS;
        for (const b of blues) {
            const d = dist(t.position, b.position);
            if (d <= preyD) {
                preyD = d;
                prey = b;
            }
        }
        if (prey) {
            const [pos] = moveToward(t.position, prey.position, HOSTILE_DRIFT);
            t.position = pos;
        }

        for (const b of blues) {
            const key = `${t.id}:${b.id}`;
            if (b.warnedAbout.has(t.id) || dist(t.position, b.position) > STRIKE_RADIUS) {
                sim.threatTimer[key] = 0;
                continue;
            }
            const held = (sim.threatTimer[key] ?? 0) + 1;
            sim.threatTimer[key] = held;
            if (held >= HIT_TICKS) hitBlue(sim, b, t);
        }
    }
}

/** An unwarned blue was caught: penalty, and the attack is its own contact report. */
function hitBlue(sim: Sim, b: BlueUnit, t: Target): void {
    b.status = "hit";
    sim.score.penalties += BLUE_HIT_PENALTY;
    sim.stats.bluesHit += 1;
    // Being attacked reveals the attacker — an unseen hostile becomes a live,
    // known-hostile track on the spot (no detection points; this is the bad way
    // to find a contact).
    if (t.track !== "active") {
        t.track = "active";
        if (!t.detectedBy) {
            t.detectedBy = b.callsign;
            t.detectedAt = formatMissionClock(sim.tick);
        }
    }
    t.lastSeenTick = sim.tick;
    t.lastKnownPosition = [t.position[0], t.position[1]];
    t.affiliationKnown = true;
    emit(
        sim,
        { id: b.id, callsign: b.callsign },
        "danger",
        "cross-circle",
        `${b.callsign} hit by ${t.designation} — casualties reported (−${BLUE_HIT_PENALTY} pts)`,
    );
}

/** Open, progress, and expire the shift's seeded ISR requests. */
function stepIsr(sim: Sim, flying: Drone[]): void {
    for (const r of sim.isr) {
        if (r.status === "pending" && sim.tick >= r.tick) {
            r.status = "active";
            emitBase(sim, "warning", "satellite", `ISR request from ${r.from} — keep a drone over the marked ring (+${r.reward} pts)`);
        }
        if (r.status !== "active") continue;
        if (sim.tick >= r.tick + r.durationTicks) {
            r.status = "missed";
            sim.stats.isrExpired += 1;
            emitBase(sim, "warning", "satellite", `ISR window from ${r.from} closed — request unmet`);
            continue;
        }
        if (flying.some((d) => dist(d.position, r.position) <= r.radius)) {
            r.coverTicks += 1;
            if (r.coverTicks >= ISR_COVER_TICKS) {
                r.status = "done";
                sim.score.intel += r.reward;
                sim.stats.isrFulfilled += 1;
                emitBase(sim, "success", "satellite", `ISR request from ${r.from} fulfilled (+${r.reward} pts)`);
            }
        }
    }
}

// ─── Strikes (ROE scoring) ───────────────────────────────────────────────────

/**
 * Resolve a strike on a target — the single ROE scoring point for both weapon
 * kinds (Talon munition and external fires), so the debrief can itemize
 * neutralized / gambles taken / incidents. The outcome is ground truth:
 * a real hostile is neutralized (+{@link STRIKE_SCORE}), a civilian is an
 * incident (−{@link CIVILIAN_STRIKE_PENALTY}) — confidence doesn't change
 * physics, it only decides whether the operator *knew*. A strike resolved
 * without a verified affiliation counts as a gamble either way.
 */
function resolveStrike(sim: Sim, tgt: Target, by: string): void {
    const verified = tgt.affiliationKnown;
    tgt.struck = true;
    tgt.struckAt = formatMissionClock(sim.tick);
    // The strike is its own (terminal) contact report: the wreckage is visible
    // and tells you what it was.
    tgt.track = "active";
    tgt.lastSeenTick = sim.tick;
    tgt.lastKnownPosition = [tgt.position[0], tgt.position[1]];
    tgt.affiliationKnown = true;
    // Anyone still flying against this target breaks off (investigation or
    // designation in progress — there's nothing left to task).
    for (const d of sim.drones) {
        if (d.assignment?.targetId === tgt.id) {
            clearAssignment(sim, d);
            emit(sim, d, "info", "undo", `${d.callsign} breaking off — ${tgt.designation} destroyed`);
        }
    }
    if (!verified) sim.stats.gamblesTaken += 1;
    if (tgt.affiliation === "hostile") {
        sim.score.intel += STRIKE_SCORE;
        sim.stats.neutralized += 1;
        emitBase(
            sim,
            "success",
            "tick-circle",
            `${tgt.designation} neutralized by ${by} — confirmed hostile${verified ? "" : " (unverified strike)"} (+${STRIKE_SCORE} pts)`,
        );
    } else {
        sim.score.penalties += CIVILIAN_STRIKE_PENALTY;
        sim.stats.strikeIncidents += 1;
        emitBase(
            sim,
            "danger",
            "error",
            `STRIKE INCIDENT — ${tgt.designation} assessed civilian after the fact; casualties on the ground (−${CIVILIAN_STRIKE_PENALTY} pts)`,
        );
    }
}

/**
 * Designation held for the full window: expend a fire mission. The aim point is
 * frozen at the target's *current* position — the round lands there
 * {@link FIRE_DELAY_TICKS} later whether or not the target stayed.
 */
function launchFires(sim: Sim, d: Drone, tgt: Target): void {
    if (sim.fires <= 0) {
        // Another designation beat this one to the last round.
        emitBase(sim, "warning", "disable", `Fire mission on ${tgt.designation} denied — no rounds remaining`);
        return;
    }
    sim.fires -= 1;
    sim.firesInFlight.push({
        id: sim.fireId++,
        targetId: tgt.id,
        position: [tgt.position[0], tgt.position[1]],
        impactTick: sim.tick + FIRE_DELAY_TICKS,
    });
    emit(
        sim,
        d,
        "warning",
        "send-to-map",
        `${d.callsign} designation complete — fires inbound on ${tgt.designation}, impact in ${FIRE_DELAY_TICKS}s (${sim.fires} left)`,
    );
}

/** Land any fire missions whose flight delay has elapsed. */
function stepFires(sim: Sim): void {
    if (sim.firesInFlight.length === 0) return;
    const landing = sim.firesInFlight.filter((f) => sim.tick >= f.impactTick);
    if (landing.length === 0) return;
    sim.firesInFlight = sim.firesInFlight.filter((f) => sim.tick < f.impactTick);
    for (const f of landing) {
        const tgt = sim.targets.find((t) => t.id === f.targetId);
        if (tgt && !tgt.struck && dist(tgt.position, f.position) <= BLAST_RADIUS) {
            resolveStrike(sim, tgt, "external fires");
        } else {
            sim.stats.firesWasted += 1;
            emitBase(
                sim,
                "warning",
                "error",
                `External fires impact — ${tgt ? tgt.designation : "target"} cleared the blast area; round wasted`,
            );
        }
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
    // Leaving the pad abandons any rearm progress — the count restarts next stay.
    delete sim.rearmTimer[d.id];
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
 * True if this drone can be tasked to investigate right now: not already
 * assigned, not heading home, not lost. Grounded drones (idle/charging) count —
 * tasking one launches it. Shared by the engine guard and the UI's picker.
 */
export function canInvestigate(d: Drone): boolean {
    return !d.assignment && d.status !== "returning" && d.status !== "lost";
}

/** Enroute flight time (ticks at 1×) from `from` to `to` — the picker's ETA sort key. */
export function etaTicks(from: LngLat, to: LngLat): number {
    return Math.ceil(dist(from, to) / RETURN_SPEED);
}

/**
 * Shared dispatch prep for tasking: a grounded drone (idle/charging) is launched
 * by the tasking; launching off a pad frees it for the next waiting drone.
 */
function dispatchDrone(sim: Sim, d: Drone): void {
    const offPad = d.status === "charging";
    if (d.status === "idle" || d.status === "charging") {
        d.status = "active";
        delete sim.rearmTimer[d.id];
        sim.stats.launches += 1;
    }
    if (d.speed < 14) d.speed = 16;
    if (d.altitude < 60) d.altitude = 80;
    if (offPad) assignPads(sim);
}

/**
 * Task a specific drone to investigate a detected target (the UI's picker chooses
 * which — sensor match matters, see `upgradeTarget`). The target must be a known
 * track (active, or stale — flying out re-acquires it) with no investigation done
 * or underway. A grounded drone (idle/charging) is launched by the tasking;
 * returning and lost drones can't be tasked.
 */
export function investigate(sim: Sim, targetId: string, droneId: string): void {
    if (sim.phase === "ended") return;
    const tgt = sim.targets.find((t) => t.id === targetId);
    if (!tgt || tgt.track === "undetected" || tgt.struck || tgt.investigation.status !== "idle") return;
    const d = sim.drones.find((x) => x.id === droneId);
    if (!d || !canInvestigate(d)) return;

    dispatchDrone(sim, d);
    // Lock the tangent entry angle now (from where the drone starts), so the whole
    // enroute leg is a straight line onto the orbit.
    const entryAngle = joinAngle(d.position, tgt.position);
    d.assignment = { targetId, kind: "investigate", phase: "enroute", ticksLeft: 0, orbitAngle: entryAngle, prevTask: d.task };
    d.task = `Investigating ${tgt.designation}`;
    tgt.investigation = { status: "enroute", droneId: d.id, droneCallsign: d.callsign };
    emit(sim, d, "info", "locate", `${d.callsign} tasked to investigate ${tgt.designation}`);
}

/**
 * True if this drone can fly a strike run right now: a strike airframe with a
 * munition aboard, not already assigned, not heading home, not lost. Grounded
 * Talons count — tasking one launches it. Shared by the engine guard and the
 * UI's picker.
 */
export function canStrike(d: Drone): boolean {
    return d.munitions !== null && d.munitions > 0 && canInvestigate(d);
}

/**
 * True if this target can be put under fire: a live, active track that hasn't
 * been struck and isn't a *known* civilian (the engine won't knowingly violate
 * ROE — unknown affiliations are the gamble). Shared by the engine guards and
 * the UI's strike/fires sections.
 */
export function canStrikeTarget(t: Target): boolean {
    return !t.struck && t.track === "active" && !(t.affiliationKnown && t.affiliation === "civilian");
}

/**
 * Task a Talon to strike a target: it flies straight at the live position and
 * releases on arrival (one pass, one munition — see `resolveStrike` for the ROE
 * outcome). One strike run per target at a time.
 */
export function strike(sim: Sim, targetId: string, droneId: string): void {
    if (sim.phase === "ended") return;
    const tgt = sim.targets.find((t) => t.id === targetId);
    if (!tgt || !canStrikeTarget(tgt)) return;
    if (sim.drones.some((d) => d.assignment?.kind === "strike" && d.assignment.targetId === targetId)) return;
    const d = sim.drones.find((x) => x.id === droneId);
    if (!d || !canStrike(d)) return;

    dispatchDrone(sim, d);
    d.assignment = { targetId, kind: "strike", phase: "enroute", ticksLeft: 0, orbitAngle: 0, prevTask: d.task };
    d.task = `Strike run on ${tgt.designation}`;
    emit(sim, d, "warning", "locate", `${d.callsign} wings hot — strike run on ${tgt.designation}`);
}

/**
 * Task a drone (any sensor) to designate a target for external fires: it holds
 * the loiter orbit for {@link DESIGNATE_TICKS}, then a round launches at the
 * target's position at that moment and lands {@link FIRE_DELAY_TICKS} later.
 * Breaking the designation (recall, crash) calls nothing in and costs nothing.
 * One designation per target at a time; needs a round remaining.
 */
export function designate(sim: Sim, targetId: string, droneId: string): void {
    if (sim.phase === "ended" || sim.fires <= 0) return;
    const tgt = sim.targets.find((t) => t.id === targetId);
    if (!tgt || !canStrikeTarget(tgt)) return;
    if (sim.drones.some((d) => d.assignment?.kind === "designate" && d.assignment.targetId === targetId)) return;
    const d = sim.drones.find((x) => x.id === droneId);
    if (!d || !canInvestigate(d)) return;

    dispatchDrone(sim, d);
    const entryAngle = joinAngle(d.position, tgt.position);
    d.assignment = { targetId, kind: "designate", phase: "enroute", ticksLeft: 0, orbitAngle: entryAngle, prevTask: d.task };
    d.task = `Designating ${tgt.designation}`;
    emit(sim, d, "info", "send-to-map", `${d.callsign} tasked to designate ${tgt.designation} for external fires`);
}

/**
 * True if this target's intel is strong enough to pass to a blue unit and
 * hasn't been passed yet ({@link PASS_MIN_VERIFIED} verified facts — i.e. an
 * investigation with the right sensor, or lucky starting facts). Shared by the
 * engine guard and the UI's button state.
 */
export function canPassIntel(t: Target): boolean {
    return t.track !== "undetected" && !t.struck && !t.passedTo && verifiedFactCount(t) >= PASS_MIN_VERIFIED;
}

/**
 * Pass the current intel on a target to the nearest live blue unit. The blue
 * is warned (it reroutes/holds and becomes immune to that target); scoring
 * resolves against ground truth — a real hostile pays per verified fact, a
 * civilian costs the bad-intel penalty. One pass per target.
 */
export function passIntel(sim: Sim, targetId: string): void {
    if (sim.phase === "ended") return;
    const tgt = sim.targets.find((t) => t.id === targetId);
    if (!tgt || !canPassIntel(tgt)) return;

    let blue: BlueUnit | null = null;
    let bestD = Infinity;
    for (const b of sim.blues) {
        if (b.status === "hit") continue;
        const d = dist(b.position, tgt.position);
        if (d < bestD) {
            bestD = d;
            blue = b;
        }
    }
    if (!blue) return;

    blue.warnedAbout.add(tgt.id);
    tgt.passedTo = blue.callsign;
    // The blue's report-back settles the affiliation either way.
    tgt.affiliationKnown = true;
    sim.stats.intelPasses += 1;
    if (tgt.affiliation === "hostile") {
        const points = verifiedFactCount(tgt) * PASS_SCORE_PER_VERIFIED;
        sim.score.intel += points;
        emitBase(sim, "success", "send-message", `Intel on ${tgt.designation} passed to ${blue.callsign} — unit warned and breaking off (+${points} pts)`);
    } else {
        sim.score.penalties += BAD_INTEL_PENALTY;
        sim.stats.badIntelPasses += 1;
        emitBase(sim, "warning", "send-message", `${blue.callsign} assesses ${tgt.designation} as civilian traffic — bad intel pass (−${BAD_INTEL_PENALTY} pts)`);
    }
}

// ─── Render snapshot ─────────────────────────────────────────────────────────

export interface Snapshot {
    tick: number;
    phase: ShiftPhase;
    drones: Drone[];
    targets: Target[];
    blues: BlueUnit[];
    isr: IsrRequest[];
    events: StreamEvent[];
    history: Record<string, TelemetryHistory>;
    score: ShiftScore;
    stats: ShiftStats;
    /** Charging pads currently occupied (of {@link PAD_COUNT}). */
    padsUsed: number;
    /** External fire missions remaining (of {@link FIRES_PER_SHIFT}). */
    fires: number;
    /** Rounds launched and not yet landed (the map draws their aim points). */
    firesInFlight: FireMission[];
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
            lastKnownPosition: [t.lastKnownPosition[0], t.lastKnownPosition[1]] as [number, number],
            investigation: { ...t.investigation },
            facts: t.facts.map((f) => ({ ...f, sources: f.sources.slice() })),
        })),
        blues: sim.blues.map((b) => ({
            ...b,
            position: [b.position[0], b.position[1]] as [number, number],
            warnedAbout: new Set(b.warnedAbout),
        })),
        isr: sim.isr.map((r) => ({ ...r, position: [r.position[0], r.position[1]] as [number, number] })),
        events: sim.events.slice(),
        history,
        score: {
            intel: sim.score.intel,
            penalties: sim.score.penalties,
            total: sim.score.intel - sim.score.penalties,
        },
        stats: { ...sim.stats },
        padsUsed: chargingCount(sim),
        fires: sim.fires,
        firesInFlight: sim.firesInFlight.map((f) => ({ ...f, position: [f.position[0], f.position[1]] as [number, number] })),
    };
}
