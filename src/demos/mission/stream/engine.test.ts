/**
 * Game-rule tests for the Skylark shift engine. The sim is seeded and pure, so
 * every scenario here is deterministic: we build a sim, poke its state, step it,
 * and assert on the rules (manual launch/recall, pad rotation, crash-at-0%,
 * fog of war, sensor matching, scoring, shift end) — no React, no timers.
 */
import { describe, expect, it } from "vitest";

import { type Drone, GROUND_STATION } from "../data";
import type { Target } from "../targets";
import {
    CRASH_PENALTY,
    DETECT_SCORE,
    PAD_COUNT,
    SHIFT_TICKS,
    STALE_TICKS,
    type Sim,
    commit,
    investigate,
    launch,
    makeSim,
    recall,
    resumePatrol,
    step,
} from "./engine";

function find(sim: Sim, id: string) {
    const d = sim.drones.find((x) => x.id === id);
    if (!d) throw new Error(`no drone ${id}`);
    return d;
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
    });

    it("commit reports the score total as intel minus penalties", () => {
        const sim = makeSim();
        sim.score.intel = 100;
        sim.score.penalties = 30;
        expect(commit(sim).score.total).toBe(70);
    });
});
