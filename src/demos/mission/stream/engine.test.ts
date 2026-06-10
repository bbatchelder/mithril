/**
 * Game-rule tests for the Skylark shift engine. The sim is seeded and pure, so
 * every scenario here is deterministic: we build a sim, poke its state, step it,
 * and assert on the rules (manual launch/recall, pad rotation, crash-at-0%,
 * fog of war, sensor matching, scoring, shift end) — no React, no timers.
 */
import { describe, expect, it } from "vitest";

import type { BlueKind } from "../blue";
import { type Drone, GROUND_STATION } from "../data";
import type { Target } from "../targets";
import {
    BAD_INTEL_PENALTY,
    BASE_LINK_RANGE,
    BLAST_RADIUS,
    BLUE_HIT_PENALTY,
    CIVILIAN_STRIKE_PENALTY,
    CRASH_PENALTY,
    DEFAULT_SEED,
    DETECT_SCORE,
    FIRES_PER_SHIFT,
    FIRE_DELAY_TICKS,
    GRADE_BANDS,
    HIT_TICKS,
    HOSTILE_DORMANT_TICKS,
    ISR_COVER_TICKS,
    JAM_RADIUS,
    MUNITIONS_MAX,
    PAD_COUNT,
    PASS_SCORE_PER_VERIFIED,
    REARM_TICKS,
    RELAY_RANGE,
    SHIFT_TICKS,
    STALE_TICKS,
    STRIKE_SCORE,
    type Sim,
    commit,
    designate,
    investigate,
    launch,
    letterGrade,
    makeSim as engineMakeSim,
    passIntel,
    recall,
    resumePatrol,
    startShift,
    step,
    strike,
} from "./engine";

/**
 * A fresh sim holds in the briefing phase (frozen, actions inert) — these
 * tests exercise the running game, so build started. The briefing itself is
 * covered in its own describe below.
 */
function makeSim(seed?: number) {
    const sim = engineMakeSim(seed);
    startShift(sim);
    return sim;
}

function find(sim: Sim, id: string) {
    const d = sim.drones.find((x) => x.id === id);
    if (!d) throw new Error(`no drone ${id}`);
    return d;
}

function findBlue(sim: Sim, kind: BlueKind) {
    const b = sim.blues.find((x) => x.kind === kind);
    if (!b) throw new Error(`no blue ${kind}`);
    return b;
}

/**
 * Strip ground-truth hostility from the seeded roster so no target drifts and
 * no blue gets hit mid-test — scenarios then opt back in per target.
 */
function pacify(sim: Sim) {
    for (const t of sim.targets) t.affiliation = "civilian";
}

/** Make a target an *armed* hostile (spawned and past its dormancy window). */
function arm(t: Target) {
    t.affiliation = "hostile";
    t.spawnTick = -HOSTILE_DORMANT_TICKS;
}

function hyp(a: [number, number], b: [number, number]): number {
    return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

function stepUntil(sim: Sim, pred: () => boolean, max = 1000): boolean {
    for (let i = 0; i < max; i++) {
        if (pred()) return true;
        step(sim);
    }
    return pred();
}

/** Mark a target as a live track (as if a drone had already found it). */
function activate(sim: Sim, t: Target) {
    t.track = "active";
    t.lastSeenTick = sim.tick;
}

/** Pin a drone over a point: collapse its patrol route so it loiters there. */
function park(d: Drone, pos: [number, number]) {
    d.position = [pos[0], pos[1]];
    d.route = [[pos[0], pos[1]]];
    d.waypoint = 0;
}

/** Ground the whole fleet at base (idle) — clears the sky of sensors and relays. */
function groundFleet(sim: Sim) {
    for (const d of sim.drones) {
        d.status = "idle";
        d.position = [GROUND_STATION.position[0], GROUND_STATION.position[1]];
        d.speed = 0;
        d.altitude = 0;
    }
}

/** A spot far from every blue route — even an armed hostile parked here never drifts. */
const SAFE: [number, number] = [-122.28, 37.85];

/** Push every other contact's spawn past the shift so nothing else scores or moves. */
function isolate(sim: Sim, keep: Target) {
    for (const t of sim.targets) if (t !== keep) t.spawnTick = SHIFT_TICKS * 2;
}

/** Stage a lone strikeable contact at {@link SAFE}: active track, isolated roster. */
function stageStrikeTarget(sim: Sim, affiliation: "hostile" | "civilian"): Target {
    pacify(sim);
    const tgt = sim.targets[0]; // spawnTick 0
    tgt.affiliation = affiliation;
    tgt.position = [SAFE[0], SAFE[1]];
    tgt.lastKnownPosition = [SAFE[0], SAFE[1]];
    isolate(sim, tgt);
    activate(sim, tgt);
    return tgt;
}

describe("fleet is manual — no autopilot", () => {
    it("does not auto-recall a low-battery drone", () => {
        const sim = makeSim();
        const d = find(sim, "sk-101"); // active
        d.battery = 15; // below the old auto-recall threshold
        step(sim);
        expect(d.status).not.toBe("returning");
    });

    it("a fully-charged drone goes idle (ready), it does not relaunch", () => {
        const sim = makeSim();
        const d = find(sim, "sk-204"); // charging
        d.battery = 99.9;
        step(sim);
        expect(d.battery).toBe(100);
        expect(d.status).toBe("idle");
        expect(d.position).toEqual(GROUND_STATION.position);
    });
});

describe("launch", () => {
    it("sends an idle drone out from base toward its patrol route", () => {
        const sim = makeSim();
        const d = find(sim, "sk-104"); // idle at base
        launch(sim, d.id);
        expect(d.status).toBe("active");
        expect(sim.stats.launches).toBe(1);

        const before = [...d.position];
        step(sim);
        expect(d.position).not.toEqual(before); // flying, not teleported
    });

    it("launching off a pad frees it for the next waiting drone", () => {
        const sim = makeSim();
        const queued = find(sim, "sk-304"); // idle at 91% — below the pad-want threshold
        expect(queued.status).toBe("idle");
        launch(sim, "sk-204"); // the drone occupying the only used pad
        expect(find(sim, "sk-204").status).toBe("active");
        expect(queued.status).toBe("charging");
    });

    it("ignores airborne and lost drones", () => {
        const sim = makeSim();
        const d = find(sim, "sk-101"); // active
        launch(sim, d.id);
        expect(d.status).toBe("active");
        expect(sim.stats.launches).toBe(0);
    });
});

describe("recall and landing", () => {
    it("recalls an airborne drone, which lands and takes a free pad", () => {
        const sim = makeSim();
        const d = find(sim, "sk-101");
        recall(sim, d.id);
        expect(d.status).toBe("returning");
        expect(sim.stats.recalls).toBe(1);

        expect(stepUntil(sim, () => d.status !== "returning")).toBe(true);
        expect(d.status).toBe("charging");
        expect(d.position).toEqual(GROUND_STATION.position);
    });

    it("lands as idle (waiting) when all pads are busy", () => {
        const sim = makeSim();
        for (const id of ["sk-102", "sk-201", "sk-202"]) find(sim, id).status = "charging";
        expect(sim.drones.filter((d) => d.status === "charging").length).toBeGreaterThanOrEqual(PAD_COUNT);

        const d = find(sim, "sk-101");
        d.position = [GROUND_STATION.position[0] + 0.001, GROUND_STATION.position[1]];
        d.status = "returning";
        step(sim);
        expect(d.status).toBe("idle");
    });

    it("a returning drone can be turned around", () => {
        const sim = makeSim();
        const d = find(sim, "sk-101");
        recall(sim, d.id);
        resumePatrol(sim, d.id);
        expect(d.status).toBe("active");
    });
});

describe("crash at 0% battery", () => {
    it("loses the airframe and costs score", () => {
        const sim = makeSim();
        const d = find(sim, "sk-101");
        d.battery = 0.01;
        step(sim);
        expect(d.status).toBe("lost");
        expect(d.speed).toBe(0);
        expect(sim.score.penalties).toBe(CRASH_PENALTY);
        expect(sim.stats.dronesLost).toBe(1);

        // Lost airframes are inert from then on.
        const pos = [...d.position];
        step(sim);
        expect(d.status).toBe("lost");
        expect(d.position).toEqual(pos);
    });

    it("crashing mid-investigation frees the target to be re-tasked", () => {
        const sim = makeSim();
        const tgt = sim.targets[0];
        activate(sim, tgt);
        investigate(sim, tgt.id, "sk-101");
        const tasked = find(sim, "sk-101");
        expect(tasked.assignment?.targetId).toBe(tgt.id);
        tasked.battery = 0.01;
        step(sim);
        expect(tasked.status).toBe("lost");
        expect(tasked.assignment).toBeNull();
        expect(tgt.investigation.status).toBe("idle");
    });
});

describe("investigation scoring", () => {
    it("a completed investigation awards intel points", () => {
        const sim = makeSim();
        const tgt = sim.targets[0];
        activate(sim, tgt);
        investigate(sim, tgt.id, "sk-101");
        expect(stepUntil(sim, () => tgt.investigation.status === "complete", SHIFT_TICKS - 1)).toBe(true);
        expect(sim.score.intel).toBeGreaterThan(0);
        expect(sim.stats.investigations).toBe(1);
        expect(sim.stats.factsRaised).toBeGreaterThan(0);
    });

    it("recall aborts an investigation and frees the target", () => {
        const sim = makeSim();
        const tgt = sim.targets[0];
        activate(sim, tgt);
        investigate(sim, tgt.id, "sk-101");
        const tasked = find(sim, "sk-101");
        recall(sim, tasked.id);
        expect(tasked.assignment).toBeNull();
        expect(tasked.status).toBe("returning");
        expect(tgt.investigation.status).toBe("idle");
    });
});

describe("fog of war — spawn schedule", () => {
    it("is deterministic by seed and spread across the shift", () => {
        const a = makeSim().targets.map((t) => t.spawnTick);
        const b = makeSim().targets.map((t) => t.spawnTick);
        expect(a).toEqual(b);
        // The opening pair is live at tick 0; the rest escalate across the shift.
        expect(a[0]).toBe(0);
        expect(a[1]).toBe(0);
        expect(Math.max(...a)).toBeGreaterThan(SHIFT_TICKS / 2);
        expect(Math.max(...a)).toBeLessThanOrEqual(SHIFT_TICKS * 0.88);
    });

    it("everything starts undetected, and unspawned targets cannot be detected", () => {
        const sim = makeSim();
        expect(sim.targets.every((t) => t.track === "undetected")).toBe(true);

        const late = sim.targets.find((t) => t.spawnTick > 100 && t.spawnTick < 500);
        expect(late).toBeDefined();
        park(find(sim, "sk-101"), late!.position);
        while (sim.tick < late!.spawnTick - 1) step(sim);
        expect(late!.track).toBe("undetected");
    });
});

describe("fog of war — detection and staleness", () => {
    it("an airborne drone detects a spawned contact inside its footprint (+pts)", () => {
        const sim = makeSim();
        pacify(sim); // keep the contact static under the parked drone
        const tgt = sim.targets[0]; // spawnTick 0
        park(find(sim, "sk-101"), tgt.position);
        expect(stepUntil(sim, () => tgt.track === "active", 80)).toBe(true);
        expect(tgt.detectedBy).toBe("SK-101");
        expect(tgt.detectedAt).not.toBe("");
        expect(sim.score.intel).toBeGreaterThanOrEqual(DETECT_SCORE);
        expect(sim.stats.detected).toBeGreaterThanOrEqual(1);
    });

    it("an active track with no coverage goes stale, and re-acquiring scores nothing new", () => {
        const sim = makeSim();
        pacify(sim); // keep the contact static while the fleet is grounded
        const tgt = sim.targets[0];
        activate(sim, tgt);
        // Ground the whole fleet — no airborne sensor anywhere.
        groundFleet(sim);
        for (let i = 0; i <= STALE_TICKS; i++) step(sim);
        expect(tgt.track).toBe("stale");

        const d = find(sim, "sk-101");
        d.status = "active";
        park(d, tgt.position);
        const detectedBefore = sim.stats.detected;
        const intelBefore = sim.score.intel;
        expect(stepUntil(sim, () => tgt.track === "active", 80)).toBe(true);
        expect(sim.stats.detected).toBe(detectedBefore);
        expect(sim.score.intel).toBe(intelBefore);
    });
});

describe("sensor–target matrix", () => {
    it("wrong-sensor investigation caps fact tiers at Medium (and never lowers)", () => {
        const sim = makeSim();
        const tgt = sim.targets[0]; // vehicle convoy
        expect(tgt.bestSensor).toBe("eo-ir");
        activate(sim, tgt);
        const before = tgt.facts.map((f) => f.tier);
        investigate(sim, tgt.id, "sk-301"); // SIGINT bird — wrong sensor
        expect(find(sim, "sk-301").assignment?.targetId).toBe(tgt.id);
        expect(stepUntil(sim, () => tgt.investigation.status === "complete", SHIFT_TICKS - 1)).toBe(true);
        tgt.facts.forEach((f, i) => {
            expect(f.tier).toBeGreaterThanOrEqual(before[i]);
            expect(f.tier).toBeLessThanOrEqual(Math.max(1, before[i]));
        });
    });

    it("the matching sensor can raise facts to High", () => {
        const sim = makeSim();
        const tgt = sim.targets[0];
        activate(sim, tgt);
        investigate(sim, tgt.id, "sk-101"); // EO/IR — the convoy's best sensor
        expect(stepUntil(sim, () => tgt.investigation.status === "complete", SHIFT_TICKS - 1)).toBe(true);
        expect(tgt.facts.some((f) => f.tier === 2)).toBe(true);
    });
});

describe("investigation tasking guards", () => {
    it("cannot task onto an undetected target", () => {
        const sim = makeSim();
        const tgt = sim.targets[0]; // spawned but not yet detected
        investigate(sim, tgt.id, "sk-101");
        expect(tgt.investigation.status).toBe("idle");
        expect(find(sim, "sk-101").assignment).toBeNull();
    });

    it("cannot task a returning or lost drone", () => {
        const sim = makeSim();
        const tgt = sim.targets[0];
        activate(sim, tgt);
        investigate(sim, tgt.id, "sk-103"); // returning
        expect(find(sim, "sk-103").assignment).toBeNull();
        const d = find(sim, "sk-101");
        d.status = "lost";
        investigate(sim, tgt.id, "sk-101");
        expect(d.assignment).toBeNull();
        expect(tgt.investigation.status).toBe("idle");
    });

    it("a stale track can be tasked — the re-acquire flow", () => {
        const sim = makeSim();
        const tgt = sim.targets[0];
        activate(sim, tgt);
        tgt.track = "stale";
        investigate(sim, tgt.id, "sk-101");
        expect(tgt.investigation.status).toBe("enroute");
    });
});

describe("blue forces", () => {
    it("seeds deterministic blues; convoys run their routes, checkpoints hold", () => {
        const sim = makeSim();
        pacify(sim);
        expect(sim.blues.length).toBeGreaterThanOrEqual(2);
        const convoy = findBlue(sim, "convoy");
        const checkpoint = findBlue(sim, "checkpoint");
        const convoyStart = [...convoy.position];
        const checkpointStart = [...checkpoint.position];
        step(sim);
        expect(convoy.position).not.toEqual(convoyStart);
        expect(convoy.status).toBe("moving");
        expect(checkpoint.position).toEqual(checkpointStart);
        expect(checkpoint.status).toBe("holding");
    });

    it("seeds exactly three hostile contacts", () => {
        const sim = makeSim();
        expect(sim.targets.filter((t) => t.affiliation === "hostile").length).toBe(3);
    });

    it("a hostile drifts toward a blue in threat range; civilians stay put", () => {
        const sim = makeSim();
        pacify(sim);
        const checkpoint = findBlue(sim, "checkpoint");
        const hostile = sim.targets[0];
        arm(hostile);
        hostile.position = [checkpoint.position[0] - 0.03, checkpoint.position[1]];
        const civ = sim.targets[1]; // spawnTick 0
        civ.position = [checkpoint.position[0] + 0.03, checkpoint.position[1]];
        const civStart = [...civ.position];

        const before = hyp(hostile.position, checkpoint.position);
        for (let i = 0; i < 20; i++) step(sim);
        expect(hyp(hostile.position, checkpoint.position)).toBeLessThan(before);
        expect(civ.position).toEqual(civStart);
    });

    it("a freshly spawned hostile is dormant — no drift, no strikes — until the window passes", () => {
        const sim = makeSim();
        pacify(sim);
        const checkpoint = findBlue(sim, "checkpoint");
        const hostile = sim.targets[0]; // spawnTick 0
        hostile.affiliation = "hostile";
        hostile.position = [checkpoint.position[0] + 0.002, checkpoint.position[1]];
        const start = [...hostile.position];

        for (let i = 0; i < HOSTILE_DORMANT_TICKS - 1; i++) step(sim);
        expect(hostile.position).toEqual(start);
        expect(checkpoint.status).toBe("holding");

        for (let i = 0; i < HIT_TICKS + 1; i++) step(sim);
        expect(checkpoint.status).toBe("hit");
    });

    it("an unwarned blue held in strike range is hit — penalty, and the attack reveals the track", () => {
        const sim = makeSim();
        pacify(sim);
        const checkpoint = findBlue(sim, "checkpoint");
        const hostile = sim.targets[0];
        arm(hostile);
        hostile.position = [checkpoint.position[0] + 0.002, checkpoint.position[1]];

        for (let i = 0; i < HIT_TICKS; i++) step(sim);
        expect(checkpoint.status).toBe("hit");
        expect(sim.score.penalties).toBe(BLUE_HIT_PENALTY);
        expect(sim.stats.bluesHit).toBe(1);
        // Being attacked is its own (bad) contact report.
        expect(hostile.track).toBe("active");
        expect(hostile.affiliationKnown).toBe(true);

        // Hit blues are inert and can't be hit again.
        for (let i = 0; i < HIT_TICKS * 2; i++) step(sim);
        expect(sim.score.penalties).toBe(BLUE_HIT_PENALTY);
    });

    it("a warned blue evades and cannot be hit by that target", () => {
        const sim = makeSim();
        pacify(sim);
        const convoy = findBlue(sim, "convoy");
        const hostile = sim.targets[0];
        arm(hostile);
        hostile.position = [convoy.position[0] + 0.002, convoy.position[1]];
        convoy.warnedAbout.add(hostile.id);

        step(sim);
        expect(convoy.status).toBe("rerouting");
        for (let i = 0; i < 100; i++) step(sim);
        expect(convoy.status).not.toBe("hit");
        expect(sim.stats.bluesHit).toBe(0);
    });
});

describe("pass intel", () => {
    it("rejects undetected targets, weak intel, and double passes", () => {
        const sim = makeSim();
        pacify(sim);
        const tgt = sim.targets[0];
        tgt.facts.forEach((f) => (f.tier = 2));
        passIntel(sim, tgt.id); // still undetected
        expect(tgt.passedTo).toBe("");

        activate(sim, tgt);
        tgt.facts.forEach((f) => (f.tier = 0));
        passIntel(sim, tgt.id); // nothing verified
        expect(tgt.passedTo).toBe("");
        expect(sim.stats.intelPasses).toBe(0);
    });

    it("passing on a real hostile warns the nearest blue and scores per verified fact", () => {
        const sim = makeSim();
        pacify(sim);
        const checkpoint = findBlue(sim, "checkpoint");
        const tgt = sim.targets[0];
        tgt.affiliation = "hostile";
        tgt.position = [checkpoint.position[0] + 0.01, checkpoint.position[1]];
        activate(sim, tgt);
        tgt.facts.forEach((f) => (f.tier = 2));

        passIntel(sim, tgt.id);
        const expected = tgt.facts.length * PASS_SCORE_PER_VERIFIED;
        expect(sim.score.intel).toBe(expected);
        expect(tgt.passedTo).toBe(checkpoint.callsign);
        expect(tgt.affiliationKnown).toBe(true);
        expect(checkpoint.warnedAbout.has(tgt.id)).toBe(true);
        expect(sim.stats.intelPasses).toBe(1);
        expect(sim.stats.badIntelPasses).toBe(0);

        // One pass per target.
        passIntel(sim, tgt.id);
        expect(sim.score.intel).toBe(expected);
        expect(sim.stats.intelPasses).toBe(1);
    });

    it("passing on a civilian costs the bad-intel penalty", () => {
        const sim = makeSim();
        pacify(sim);
        const tgt = sim.targets[0]; // civilian via pacify
        activate(sim, tgt);
        tgt.facts.forEach((f) => (f.tier = 2));

        passIntel(sim, tgt.id);
        expect(sim.score.intel).toBe(0);
        expect(sim.score.penalties).toBe(BAD_INTEL_PENALTY);
        expect(sim.stats.badIntelPasses).toBe(1);
        expect(tgt.affiliationKnown).toBe(true);
    });
});

describe("ISR requests", () => {
    it("a drone loitering inside the ring during the window fulfils the request", () => {
        const sim = makeSim();
        pacify(sim);
        const req = sim.isr[0];
        req.tick = 1; // open immediately
        park(find(sim, "sk-101"), req.position);

        for (let i = 0; i < ISR_COVER_TICKS + 2; i++) step(sim);
        expect(req.status).toBe("done");
        expect(sim.stats.isrFulfilled).toBe(1);
        expect(sim.score.intel).toBeGreaterThanOrEqual(req.reward);
    });

    it("an uncovered request expires when the window closes", () => {
        const sim = makeSim();
        pacify(sim);
        // Ground the whole fleet — nothing can cover the ring.
        groundFleet(sim);
        const req = sim.isr[0];
        req.tick = 1;
        req.durationTicks = 20;

        for (let i = 0; i < 25; i++) step(sim);
        expect(req.status).toBe("missed");
        expect(sim.stats.isrExpired).toBe(1);
        expect(sim.score.intel).toBe(0);
    });
});

describe("strike drones (Talon)", () => {
    it("seeds two armed Talons; the rest of the fleet is unarmed", () => {
        const sim = makeSim();
        const talons = sim.drones.filter((d) => d.munitions !== null);
        expect(talons.map((d) => d.id)).toEqual(["sk-401", "sk-402"]);
        expect(talons.every((d) => d.munitions === MUNITIONS_MAX)).toBe(true);
        // Strike birds start grounded — they never fly (or take a pad) hands-off.
        expect(talons.every((d) => d.status === "idle" && d.battery >= 95)).toBe(true);
    });

    it("an unverified strike on a real hostile neutralizes it — and counts the gamble", () => {
        const sim = makeSim();
        const tgt = stageStrikeTarget(sim, "hostile");
        strike(sim, tgt.id, "sk-401");
        const talon = find(sim, "sk-401");
        expect(talon.assignment?.kind).toBe("strike");
        expect(talon.status).toBe("active"); // tasking launched it
        expect(sim.stats.launches).toBe(1);

        expect(stepUntil(sim, () => tgt.struck, 100)).toBe(true);
        expect(sim.score.intel).toBe(STRIKE_SCORE);
        expect(sim.stats.neutralized).toBe(1);
        expect(sim.stats.gamblesTaken).toBe(1);
        expect(sim.stats.strikeIncidents).toBe(0);
        expect(tgt.affiliationKnown).toBe(true);
        expect(tgt.struckAt).not.toBe("");
        expect(talon.munitions).toBe(MUNITIONS_MAX - 1);
        expect(talon.assignment).toBeNull();
        expect(talon.task).toBe("Strike alert");
    });

    it("a verified-hostile strike is no gamble", () => {
        const sim = makeSim();
        const tgt = stageStrikeTarget(sim, "hostile");
        tgt.affiliationKnown = true;
        strike(sim, tgt.id, "sk-401");
        expect(stepUntil(sim, () => tgt.struck, 100)).toBe(true);
        expect(sim.stats.neutralized).toBe(1);
        expect(sim.stats.gamblesTaken).toBe(0);
    });

    it("a gamble that hits a civilian is a strike incident", () => {
        const sim = makeSim();
        const tgt = stageStrikeTarget(sim, "civilian");
        strike(sim, tgt.id, "sk-401");
        expect(stepUntil(sim, () => tgt.struck, 100)).toBe(true);
        expect(sim.score.intel).toBe(0);
        expect(sim.score.penalties).toBe(CIVILIAN_STRIKE_PENALTY);
        expect(sim.stats.strikeIncidents).toBe(1);
        expect(sim.stats.gamblesTaken).toBe(1);
        expect(sim.stats.neutralized).toBe(0);
        expect(tgt.affiliationKnown).toBe(true);
    });

    it("rejects known civilians, stale/undetected tracks, unarmed drones, and dry Talons", () => {
        const sim = makeSim();
        const tgt = stageStrikeTarget(sim, "civilian");
        tgt.affiliationKnown = true; // engine won't knowingly violate ROE
        strike(sim, tgt.id, "sk-401");
        expect(find(sim, "sk-401").assignment).toBeNull();

        tgt.affiliationKnown = false;
        tgt.track = "stale";
        strike(sim, tgt.id, "sk-401");
        expect(find(sim, "sk-401").assignment).toBeNull();
        tgt.track = "active";

        strike(sim, tgt.id, "sk-101"); // unarmed recon bird
        expect(find(sim, "sk-101").assignment).toBeNull();

        find(sim, "sk-401").munitions = 0;
        strike(sim, tgt.id, "sk-401");
        expect(find(sim, "sk-401").assignment).toBeNull();
    });

    it("recalling a strike run keeps the munition and leaves the target standing", () => {
        const sim = makeSim();
        const tgt = stageStrikeTarget(sim, "hostile");
        strike(sim, tgt.id, "sk-401");
        for (let i = 0; i < 5; i++) step(sim);
        recall(sim, "sk-401");
        const talon = find(sim, "sk-401");
        expect(talon.assignment).toBeNull();
        expect(talon.status).toBe("returning");
        expect(talon.munitions).toBe(MUNITIONS_MAX);
        for (let i = 0; i < 30; i++) step(sim);
        expect(tgt.struck).toBe(false);
    });

    it("a dry Talon rearms during a pad stay — holding the pad past full charge", () => {
        const sim = makeSim();
        pacify(sim);
        const talon = find(sim, "sk-401");
        talon.munitions = 0;
        talon.battery = 99;
        talon.status = "charging";
        for (let i = 0; i < 5; i++) step(sim);
        expect(talon.battery).toBe(100);
        expect(talon.status).toBe("charging"); // still reloading
        expect(talon.munitions).toBe(0);
        for (let i = 5; i < REARM_TICKS; i++) step(sim);
        expect(talon.munitions).toBe(MUNITIONS_MAX);
        expect(talon.status).toBe("idle");
    });

    it("a strike breaks off another drone's investigation of the same target", () => {
        const sim = makeSim();
        const tgt = stageStrikeTarget(sim, "hostile");
        investigate(sim, tgt.id, "sk-102");
        strike(sim, tgt.id, "sk-401");
        expect(stepUntil(sim, () => tgt.struck, 100)).toBe(true);
        expect(find(sim, "sk-102").assignment).toBeNull();
        expect(tgt.investigation.status).toBe("idle");
    });
});

describe("external fires", () => {
    it("a held designation launches a round that destroys a stationary target", () => {
        const sim = makeSim();
        const tgt = stageStrikeTarget(sim, "hostile");
        park(find(sim, "sk-101"), tgt.position);
        designate(sim, tgt.id, "sk-101");
        expect(find(sim, "sk-101").assignment?.kind).toBe("designate");

        expect(stepUntil(sim, () => sim.firesInFlight.length === 1, 60)).toBe(true);
        expect(sim.fires).toBe(FIRES_PER_SHIFT - 1);
        expect(find(sim, "sk-101").assignment).toBeNull(); // designator released at launch
        expect(tgt.struck).toBe(false); // round still in flight

        expect(stepUntil(sim, () => tgt.struck, FIRE_DELAY_TICKS + 2)).toBe(true);
        expect(sim.score.intel).toBe(STRIKE_SCORE);
        expect(sim.stats.neutralized).toBe(1);
        expect(sim.stats.firesWasted).toBe(0);
    });

    it("a target that leaves the blast radius wastes the round", () => {
        const sim = makeSim();
        const tgt = stageStrikeTarget(sim, "hostile");
        park(find(sim, "sk-101"), tgt.position);
        designate(sim, tgt.id, "sk-101");
        expect(stepUntil(sim, () => sim.firesInFlight.length === 1, 60)).toBe(true);

        // The aim point is frozen at launch — slide the target out from under it.
        tgt.position = [tgt.position[0] + BLAST_RADIUS * 2, tgt.position[1]];
        expect(stepUntil(sim, () => sim.firesInFlight.length === 0, FIRE_DELAY_TICKS + 2)).toBe(true);
        expect(tgt.struck).toBe(false);
        expect(sim.stats.firesWasted).toBe(1);
        expect(sim.score.intel).toBe(0);
    });

    it("an interrupted designation calls nothing in and costs nothing", () => {
        const sim = makeSim();
        const tgt = stageStrikeTarget(sim, "hostile");
        park(find(sim, "sk-101"), tgt.position);
        designate(sim, tgt.id, "sk-101");
        for (let i = 0; i < 5; i++) step(sim);
        recall(sim, "sk-101");
        expect(find(sim, "sk-101").assignment).toBeNull();
        for (let i = 0; i < FIRE_DELAY_TICKS * 2; i++) step(sim);
        expect(sim.fires).toBe(FIRES_PER_SHIFT);
        expect(sim.firesInFlight.length).toBe(0);
        expect(tgt.struck).toBe(false);
    });

    it("requires rounds remaining and one designator per target", () => {
        const sim = makeSim();
        const tgt = stageStrikeTarget(sim, "hostile");
        designate(sim, tgt.id, "sk-101");
        designate(sim, tgt.id, "sk-102"); // second designator on the same target
        expect(find(sim, "sk-102").assignment).toBeNull();

        const sim2 = makeSim();
        const tgt2 = stageStrikeTarget(sim2, "hostile");
        sim2.fires = 0;
        designate(sim2, tgt2.id, "sk-101");
        expect(sim2.drones.find((d) => d.id === "sk-101")?.assignment).toBeNull();
    });
});

describe("struck targets are out of play", () => {
    it("cannot be tasked, passed, or re-struck — and never goes stale", () => {
        const sim = makeSim();
        const tgt = stageStrikeTarget(sim, "hostile");
        strike(sim, tgt.id, "sk-401");
        expect(stepUntil(sim, () => tgt.struck, 100)).toBe(true);

        investigate(sim, tgt.id, "sk-102");
        expect(find(sim, "sk-102").assignment).toBeNull();
        tgt.facts.forEach((f) => (f.tier = 2));
        passIntel(sim, tgt.id);
        expect(tgt.passedTo).toBe("");
        strike(sim, tgt.id, "sk-402");
        expect(find(sim, "sk-402").assignment).toBeNull();

        // No coverage for longer than the stale window — the wreck stays put.
        for (const d of sim.drones) {
            d.status = "idle";
            d.position = [GROUND_STATION.position[0], GROUND_STATION.position[1]];
        }
        for (let i = 0; i <= STALE_TICKS + 5; i++) step(sim);
        expect(tgt.track).toBe("active");
    });

    it("a struck hostile stops stalking blues", () => {
        const sim = makeSim();
        pacify(sim);
        const checkpoint = findBlue(sim, "checkpoint");
        const hostile = sim.targets[0];
        arm(hostile);
        hostile.struck = true;
        hostile.position = [checkpoint.position[0] + 0.002, checkpoint.position[1]];
        const start = [...hostile.position];
        for (let i = 0; i < HIT_TICKS * 2; i++) step(sim);
        expect(hostile.position).toEqual(start);
        expect(checkpoint.status).not.toBe("hit");
    });
});

describe("relay link", () => {
    it("links drones near base directly; far drones with no chain are severed", () => {
        const sim = makeSim();
        pacify(sim);
        groundFleet(sim);
        const near = find(sim, "sk-101");
        near.status = "active";
        park(near, [GROUND_STATION.position[0] + 0.02, GROUND_STATION.position[1]]);
        const far = find(sim, "sk-102");
        far.status = "active";
        park(far, SAFE);
        step(sim);
        expect(near.linked).toBe(true);
        expect(near.linkParent).toBe("base");
        expect(far.linked).toBe(false);
        expect(far.linkParent).toBeNull();
    });

    it("an airborne relay bird chains the link out; a non-relay at the same spot does not", () => {
        const base = GROUND_STATION.position;
        // mid sits inside base range; far is beyond base range but within relay range of mid.
        const mid: [number, number] = [base[0] + BASE_LINK_RANGE - 0.005, base[1]];
        const farPos: [number, number] = [mid[0] + RELAY_RANGE - 0.005, base[1]];

        const sim = makeSim();
        pacify(sim);
        groundFleet(sim);
        const relay = find(sim, "sk-301"); // SIGINT Aether — a relay
        relay.status = "active";
        park(relay, mid);
        const far = find(sim, "sk-101");
        far.status = "active";
        park(far, farPos);
        step(sim);
        expect(far.linked).toBe(true);
        expect(far.linkParent).toBe(relay.id);

        const sim2 = makeSim();
        pacify(sim2);
        groundFleet(sim2);
        const eo = find(sim2, "sk-102"); // EO/IR — receives, never extends
        eo.status = "active";
        park(eo, mid);
        const far2 = find(sim2, "sk-101");
        far2.status = "active";
        park(far2, farPos);
        step(sim2);
        expect(eo.linked).toBe(true);
        expect(far2.linked).toBe(false);
    });

    it("grounded drones are wired in at base; lost drones never link", () => {
        const sim = makeSim();
        pacify(sim);
        groundFleet(sim);
        const lost = find(sim, "sk-102");
        lost.status = "active";
        park(lost, SAFE);
        lost.battery = 0.01;
        step(sim);
        expect(find(sim, "sk-101").linked).toBe(true);
        expect(lost.status).toBe("lost");
        expect(lost.linked).toBe(false);
    });
});

describe("banked intel (off-link investigations)", () => {
    /**
     * Stage a dark investigation: a lone active contact at {@link SAFE} — far
     * beyond base range with the rest of the fleet grounded (no relay chain) —
     * with all facts floored, and SK-101 dispatched to it from base.
     */
    function stageDarkInvestigation(sim: Sim) {
        pacify(sim);
        groundFleet(sim);
        const tgt = sim.targets[0];
        isolate(sim, tgt);
        tgt.position = [SAFE[0], SAFE[1]];
        tgt.lastKnownPosition = [SAFE[0], SAFE[1]];
        activate(sim, tgt);
        tgt.facts.forEach((f) => (f.tier = 0));
        const d = find(sim, "sk-101");
        d.battery = 100;
        investigate(sim, tgt.id, d.id);
        return { tgt, d };
    }

    it("an investigation completed off-link banks — no upgrade, no score, no reveal", () => {
        const sim = makeSim();
        const { tgt, d } = stageDarkInvestigation(sim);
        expect(stepUntil(sim, () => tgt.investigation.status === "complete", SHIFT_TICKS - 1)).toBe(true);
        expect(d.bankedIntel).toEqual([tgt.id]);
        expect(tgt.facts.every((f) => f.tier === 0)).toBe(true);
        expect(tgt.affiliationKnown).toBe(false);
        expect(sim.score.intel).toBe(0);
        expect(sim.stats.investigations).toBe(1);
        expect(sim.stats.factsRaised).toBe(0);
    });

    it("relinking delivers the banked intel — upgrade, score, reveal", () => {
        const sim = makeSim();
        const { tgt, d } = stageDarkInvestigation(sim);
        expect(stepUntil(sim, () => d.bankedIntel.length === 1, SHIFT_TICKS - 1)).toBe(true);
        recall(sim, d.id);
        expect(stepUntil(sim, () => d.bankedIntel.length === 0, SHIFT_TICKS - 1)).toBe(true);
        // Delivered the moment it re-entered link range — still inbound, not landed.
        expect(d.status).toBe("returning");
        expect(tgt.facts.some((f) => f.tier > 0)).toBe(true);
        expect(tgt.affiliationKnown).toBe(true);
        expect(sim.score.intel).toBeGreaterThan(0);
        expect(sim.stats.factsRaised).toBeGreaterThan(0);
    });

    it("a crash loses the banked intel and reopens the target", () => {
        const sim = makeSim();
        const { tgt, d } = stageDarkInvestigation(sim);
        expect(stepUntil(sim, () => d.bankedIntel.length === 1, SHIFT_TICKS - 1)).toBe(true);
        d.battery = 0.01;
        step(sim);
        expect(d.status).toBe("lost");
        expect(d.bankedIntel).toEqual([]);
        expect(tgt.investigation.status).toBe("idle");
        expect(tgt.facts.every((f) => f.tier === 0)).toBe(true);
        expect(sim.score.intel).toBe(0);
        // The contact is open again — a fresh bird can re-fly the collection.
        investigate(sim, tgt.id, "sk-102");
        expect(find(sim, "sk-102").assignment?.targetId).toBe(tgt.id);
    });

    it("banked intel on a struck contact is discarded at flush", () => {
        const sim = makeSim();
        const { tgt, d } = stageDarkInvestigation(sim);
        expect(stepUntil(sim, () => d.bankedIntel.length === 1, SHIFT_TICKS - 1)).toBe(true);
        tgt.struck = true;
        recall(sim, d.id);
        expect(stepUntil(sim, () => d.bankedIntel.length === 0, SHIFT_TICKS - 1)).toBe(true);
        expect(tgt.facts.every((f) => f.tier === 0)).toBe(true);
        expect(sim.score.intel).toBe(0);
    });
});

describe("jamming", () => {
    /** The roster's RF emitter, made live (spawned) with everything else pushed out. */
    function stageJammer(sim: Sim): Target {
        pacify(sim);
        groundFleet(sim);
        const jam = sim.targets.find((t) => t.jammer);
        if (!jam) throw new Error("no jammer in the roster");
        isolate(sim, jam);
        jam.spawnTick = 0;
        return jam;
    }

    it("the RF emitter is the roster's jammer", () => {
        const sim = makeSim();
        const jammers = sim.targets.filter((t) => t.jammer);
        expect(jammers.length).toBeGreaterThanOrEqual(1);
        expect(jammers.every((t) => t.category === "RF emitter")).toBe(true);
    });

    it("a live jammer severs the link inside its radius — even in base range — and chews signal", () => {
        const sim = makeSim();
        const jam = stageJammer(sim);
        const base = GROUND_STATION.position;
        jam.position = [base[0] + 0.01, base[1]];
        const d = find(sim, "sk-101");
        d.status = "active";
        park(d, [jam.position[0], jam.position[1]]);
        const signalBefore = d.signal;
        for (let i = 0; i < 10; i++) step(sim);
        expect(d.jammed).toBe(true);
        expect(d.linked).toBe(false);
        expect(d.signal).toBeLessThan(signalBefore);

        // Striking the jammer clears the interference next tick.
        jam.struck = true;
        step(sim);
        expect(d.jammed).toBe(false);
        expect(d.linked).toBe(true);
    });

    it("an unspawned jammer doesn't jam", () => {
        const sim = makeSim();
        const jam = stageJammer(sim);
        jam.spawnTick = SHIFT_TICKS;
        const d = find(sim, "sk-101");
        d.status = "active";
        park(d, [jam.position[0], jam.position[1]]);
        step(sim);
        expect(d.jammed).toBe(false);
    });

    it("a drone just outside the radius keeps its link", () => {
        const sim = makeSim();
        const jam = stageJammer(sim);
        const base = GROUND_STATION.position;
        jam.position = [base[0], base[1]];
        const d = find(sim, "sk-101");
        d.status = "active";
        park(d, [base[0] + JAM_RADIUS + 0.002, base[1]]);
        step(sim);
        expect(d.jammed).toBe(false);
        expect(d.linked).toBe(true);
    });
});

describe("snapshot deep copies", () => {
    it("commit copies blue, ISR, fires, banked-intel, and last-known-position state", () => {
        const sim = makeSim();
        sim.firesInFlight.push({ id: 1, targetId: "tgt-alpha", position: [-122.4, 37.8], impactTick: 10 });
        sim.drones[0].bankedIntel.push("tgt-alpha");
        const snap = commit(sim);
        expect(snap.blues[0].position).not.toBe(sim.blues[0].position);
        expect(snap.blues[0].warnedAbout).not.toBe(sim.blues[0].warnedAbout);
        expect(snap.isr[0].position).not.toBe(sim.isr[0].position);
        expect(snap.targets[0].lastKnownPosition).not.toBe(sim.targets[0].lastKnownPosition);
        expect(snap.fires).toBe(FIRES_PER_SHIFT);
        expect(snap.firesInFlight[0].position).not.toBe(sim.firesInFlight[0].position);
        expect(snap.drones[0].bankedIntel).not.toBe(sim.drones[0].bankedIntel);
        expect(snap.drones[0].bankedIntel).toEqual(["tgt-alpha"]);
        expect(snap.breakdown).not.toBe(sim.breakdown);
        expect(snap.keyEvents).not.toBe(sim.keyEvents);
    });
});

describe("briefing phase", () => {
    it("a fresh sim holds in briefing — no ticks, no actions — until started", () => {
        const sim = engineMakeSim();
        expect(sim.phase).toBe("briefing");

        step(sim);
        expect(sim.tick).toBe(0);

        launch(sim, "sk-104");
        expect(find(sim, "sk-104").status).toBe("idle");
        expect(sim.stats.launches).toBe(0);

        startShift(sim);
        expect(sim.phase).toBe("running");
        step(sim);
        expect(sim.tick).toBe(1);
        launch(sim, "sk-104");
        expect(sim.stats.launches).toBe(1);
    });

    it("startShift only fires from the briefing", () => {
        const sim = makeSim(); // already started
        const logged = sim.keyEvents.length;
        startShift(sim);
        expect(sim.keyEvents.length).toBe(logged);

        sim.phase = "ended";
        startShift(sim);
        expect(sim.phase).toBe("ended");
    });
});

describe("seeded scenarios", () => {
    const fingerprint = (sim: Sim) =>
        sim.targets.map((t) => [t.spawnTick, t.affiliation, t.position[0], t.position[1]].join(":")).join("|");

    it("defaults to the hand-tuned scenario seed", () => {
        expect(engineMakeSim().seed).toBe(DEFAULT_SEED);
    });

    it("the same seed rebuilds the same scenario; a different seed varies it", () => {
        expect(fingerprint(engineMakeSim(123))).toBe(fingerprint(engineMakeSim(123)));
        expect(fingerprint(engineMakeSim(123))).not.toBe(fingerprint(engineMakeSim(456)));
        // ISR window timing rides the scenario seed too.
        expect(engineMakeSim(123).isr.map((r) => r.tick)).not.toEqual(engineMakeSim(456).isr.map((r) => r.tick));
    });

    it("every seed deals exactly three hostiles and one jammer", () => {
        for (const seed of [1, 0xbeef, 0x12345678]) {
            const sim = engineMakeSim(seed);
            expect(sim.targets.filter((t) => t.affiliation === "hostile").length).toBe(3);
            expect(sim.targets.filter((t) => t.jammer).length).toBe(1);
        }
    });

    it("a replay — same seed, same actions — lands on the identical state", () => {
        const run = () => {
            const sim = makeSim(777);
            launch(sim, "sk-104");
            for (let i = 0; i < 120; i++) step(sim);
            recall(sim, "sk-101");
            for (let i = 0; i < 120; i++) step(sim);
            return commit(sim);
        };
        const a = run();
        const b = run();
        expect(a.score).toEqual(b.score);
        expect(a.stats).toEqual(b.stats);
        expect(a.drones.map((d) => d.position)).toEqual(b.drones.map((d) => d.position));
    });
});

describe("score breakdown", () => {
    it("itemizes every point — categories sum to the headline score over a full shift", () => {
        const sim = makeSim();
        while (sim.phase !== "ended") step(sim);
        const b = sim.breakdown;
        expect(b.detection + b.investigation + b.intelPasses + b.strikes + b.isr).toBe(sim.score.intel);
        expect(b.crashes + b.bluesHit + b.badIntel + b.strikeIncidents).toBe(sim.score.penalties);
        // Hands-off shifts bleed airframes — the ledger must have caught it.
        expect(b.crashes).toBeGreaterThan(0);
    });
});

describe("debrief timeline (keyEvents)", () => {
    it("records calls and outcomes, uncapped and chronological, without patrol chatter", () => {
        const sim = makeSim();
        launch(sim, "sk-104");
        while (sim.phase !== "ended") step(sim);

        // The feed is capped; the timeline is not, and keeps the early calls.
        expect(sim.events.length).toBeLessThanOrEqual(60);
        expect(sim.keyEvents.some((e) => e.message.includes("Shift started"))).toBe(true);
        expect(sim.keyEvents.some((e) => e.message.includes("launched"))).toBe(true);
        expect(sim.keyEvents.some((e) => e.message.includes("down — battery exhausted"))).toBe(true);
        expect(sim.keyEvents.some((e) => e.message.includes("waypoint"))).toBe(false);

        const ticks = sim.keyEvents.map((e) => e.tick);
        expect([...ticks].sort((x, y) => x - y)).toEqual(ticks);
    });
});

describe("letter grade", () => {
    it("maps totals onto contiguous bands", () => {
        expect(letterGrade(-500).grade).toBe("F");
        expect(letterGrade(0).grade).toBe("D");
        expect(letterGrade(GRADE_BANDS[0].min + 1000).grade).toBe(GRADE_BANDS[0].grade);
        // Each band's floor earns exactly that band.
        for (const band of GRADE_BANDS.filter((b) => Number.isFinite(b.min))) {
            expect(letterGrade(band.min).grade).toBe(band.grade);
            expect(letterGrade(band.min - 1).grade).not.toBe(band.grade);
        }
    });
});

describe("shift clock", () => {
    it("ends the shift at SHIFT_TICKS and freezes the sim", () => {
        const sim = makeSim();
        sim.tick = SHIFT_TICKS - 1;
        step(sim);
        expect(sim.phase).toBe("ended");

        const tick = sim.tick;
        step(sim);
        expect(sim.tick).toBe(tick);

        // Operator actions are inert after the shift.
        launch(sim, "sk-104");
        expect(find(sim, "sk-104").status).toBe("idle");

        const tgt = sim.targets[0];
        tgt.track = "active";
        tgt.facts.forEach((f) => (f.tier = 2));
        passIntel(sim, tgt.id);
        expect(tgt.passedTo).toBe("");

        tgt.affiliation = "hostile";
        strike(sim, tgt.id, "sk-401");
        expect(find(sim, "sk-401").assignment).toBeNull();
        designate(sim, tgt.id, "sk-101");
        expect(find(sim, "sk-101").assignment).toBeNull();
        expect(sim.fires).toBe(FIRES_PER_SHIFT);
    });

    it("commit reports the score total as intel minus penalties", () => {
        const sim = makeSim();
        sim.score.intel = 100;
        sim.score.penalties = 30;
        expect(commit(sim).score.total).toBe(70);
    });
});
