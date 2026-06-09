/**
 * Game-rule tests for the Skylark shift engine. The sim is seeded and pure, so
 * every scenario here is deterministic: we build a sim, poke its state, step it,
 * and assert on the rules (manual launch/recall, pad rotation, crash-at-0%,
 * scoring, shift end) — no React, no timers.
 */
import { describe, expect, it } from "vitest";

import { GROUND_STATION } from "../data";
import {
    CRASH_PENALTY,
    PAD_COUNT,
    SHIFT_TICKS,
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
        investigate(sim, tgt.id);
        const tasked = sim.drones.find((d) => d.assignment?.targetId === tgt.id);
        expect(tasked).toBeDefined();
        tasked!.battery = 0.01;
        step(sim);
        expect(tasked!.status).toBe("lost");
        expect(tasked!.assignment).toBeNull();
        expect(tgt.investigation.status).toBe("idle");
    });
});

describe("investigation scoring", () => {
    it("a completed investigation awards intel points", () => {
        const sim = makeSim();
        const tgt = sim.targets[0];
        investigate(sim, tgt.id);
        expect(stepUntil(sim, () => tgt.investigation.status === "complete", SHIFT_TICKS - 1)).toBe(true);
        expect(sim.score.intel).toBeGreaterThan(0);
        expect(sim.stats.investigations).toBe(1);
        expect(sim.stats.factsRaised).toBeGreaterThan(0);
    });

    it("recall aborts an investigation and frees the target", () => {
        const sim = makeSim();
        const tgt = sim.targets[0];
        investigate(sim, tgt.id);
        const tasked = sim.drones.find((d) => d.assignment?.targetId === tgt.id)!;
        recall(sim, tasked.id);
        expect(tasked.assignment).toBeNull();
        expect(tasked.status).toBe("returning");
        expect(tgt.investigation.status).toBe("idle");
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
