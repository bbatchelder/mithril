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
    BLUE_HIT_PENALTY,
    CRASH_PENALTY,
    DETECT_SCORE,
    HIT_TICKS,
    HOSTILE_DORMANT_TICKS,
    ISR_COVER_TICKS,
    PAD_COUNT,
    PASS_SCORE_PER_VERIFIED,
    SHIFT_TICKS,
    STALE_TICKS,
    type Sim,
    commit,
    investigate,
    launch,
    makeSim,
    passIntel,
    recall,
    resumePatrol,
    step,
} from "./engine";

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
        for (const d of sim.drones) {
            d.status = "idle";
            d.position = [GROUND_STATION.position[0], GROUND_STATION.position[1]];
            d.speed = 0;
            d.altitude = 0;
        }
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
        for (const d of sim.drones) {
            d.status = "idle";
            d.position = [GROUND_STATION.position[0], GROUND_STATION.position[1]];
            d.speed = 0;
            d.altitude = 0;
        }
        const req = sim.isr[0];
        req.tick = 1;
        req.durationTicks = 20;

        for (let i = 0; i < 25; i++) step(sim);
        expect(req.status).toBe("missed");
        expect(sim.stats.isrExpired).toBe(1);
        expect(sim.score.intel).toBe(0);
    });
});

describe("snapshot deep copies", () => {
    it("commit copies blue, ISR, and last-known-position state", () => {
        const sim = makeSim();
        const snap = commit(sim);
        expect(snap.blues[0].position).not.toBe(sim.blues[0].position);
        expect(snap.blues[0].warnedAbout).not.toBe(sim.blues[0].warnedAbout);
        expect(snap.isr[0].position).not.toBe(sim.isr[0].position);
        expect(snap.targets[0].lastKnownPosition).not.toBe(sim.targets[0].lastKnownPosition);
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
    });

    it("commit reports the score total as intel minus penalties", () => {
        const sim = makeSim();
        sim.score.intel = 100;
        sim.score.penalties = 30;
        expect(commit(sim).score.total).toBe(70);
    });
});
