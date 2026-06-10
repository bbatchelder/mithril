/**
 * useStream — the React side of the Skylark shift simulation.
 *
 * The actual game rules live in the pure engine module (`engine.ts`); this hook
 * owns the clock (setInterval), exposes an immutable render snapshot, and wraps
 * the operator actions (launch / recall / investigate / restart) so they mutate
 * the sim and commit a fresh snapshot immediately — even while paused.
 *
 * A shift is built from a scenario seed (`initialSeed`, defaulting to the
 * engine's hand-tuned scenario) and holds in the `briefing` phase — nothing
 * ticks — until `start()`. `speed` runs N sub-steps per clock tick (faster feel,
 * diverges from the 1× sequence — that's expected for a user control). When the
 * shift clock runs out the engine flips to `ended` and the interval stops;
 * `restart(seed?)` rebuilds the sim (same seed unless given a new one), returns
 * to the briefing, and bumps `epoch` so map-side accumulations (trails) reset.
 */
import { useCallback, useEffect, useRef, useState } from "react";

import {
    type FireMission,
    type ScoreBreakdown,
    type ShiftPhase,
    type ShiftScore,
    type ShiftStats,
    type Sim,
    commit,
    designate as engineDesignate,
    investigate as engineInvestigate,
    launch as engineLaunch,
    passIntel as enginePassIntel,
    recall as engineRecall,
    resumePatrol as engineResume,
    strike as engineStrike,
    makeSim,
    startShift,
    step,
} from "./engine";
import type { BlueUnit, IsrRequest } from "../blue";
import type { Drone, DroneStatus, StreamEvent, TelemetryHistory } from "../data";
import type { Target } from "../targets";

const TICK_MS = 1000;

export type StreamSpeed = 1 | 2 | 5;

export interface StreamState {
    tick: number;
    /** "briefing" (built, not started) → "running" → "ended" (sim frozen). */
    phase: ShiftPhase;
    /** The scenario seed this shift was built from — share it to share the shift. */
    seed: number;
    drones: Drone[];
    targets: Target[];
    blues: BlueUnit[];
    isr: IsrRequest[];
    events: StreamEvent[];
    /** Uncapped chronological log of key calls and outcomes — the debrief timeline. */
    keyEvents: StreamEvent[];
    history: Record<string, TelemetryHistory>;
    score: ShiftScore;
    breakdown: ScoreBreakdown;
    stats: ShiftStats;
    padsUsed: number;
    /** External fire missions remaining this shift. */
    fires: number;
    /** Fire rounds launched and not yet landed. */
    firesInFlight: FireMission[];
    /** Increments on restart — consumers reset accumulated state (map trails) on change. */
    epoch: number;
    playing: boolean;
    speed: StreamSpeed;
    /** Begin the shift from the briefing (no-op once running/ended). */
    start: () => void;
    play: () => void;
    pause: () => void;
    toggle: () => void;
    setSpeed: (s: StreamSpeed) => void;
    /** Launch a grounded drone out to its patrol route. */
    launch: (droneId: string) => void;
    /** Recall an airborne drone to base (aborts any investigation). */
    recall: (droneId: string) => void;
    /** Turn a returning drone around — back to its patrol. */
    resumePatrol: (droneId: string) => void;
    /** Task a specific drone to investigate a detected target; raises its confidence on arrival. */
    investigate: (targetId: string, droneId: string) => void;
    /** Pass a target's intel to the nearest blue unit (scores against ground truth). */
    passIntel: (targetId: string) => void;
    /** Task a Talon to strike a target — one pass, one munition, ROE resolves on arrival. */
    strike: (targetId: string, droneId: string) => void;
    /** Task a drone to designate a target for external fires (delayed off-map round). */
    designate: (targetId: string, droneId: string) => void;
    /** Rebuild the sim — same seed by default, a new scenario if one is given — back to the briefing. */
    restart: (seed?: number) => void;
}

export function useStream(initialSeed?: number): StreamState {
    // Lazily built so re-renders don't rebuild a throwaway sim every second.
    const simRef = useRef<Sim | null>(null);
    if (simRef.current === null) simRef.current = makeSim(initialSeed);

    const [snapshot, setSnapshot] = useState(() => commit(simRef.current!));
    // The shift opens in the briefing — the clock starts with `start()`.
    const [playing, setPlaying] = useState(false);
    const [speed, setSpeedState] = useState<StreamSpeed>(1);
    const [epoch, setEpoch] = useState(0);

    // Keep the latest speed available to the interval without re-subscribing.
    const speedRef = useRef<StreamSpeed>(speed);
    speedRef.current = speed;

    useEffect(() => {
        if (!playing) return;
        const handle = window.setInterval(() => {
            const sim = simRef.current!;
            const steps = speedRef.current;
            for (let i = 0; i < steps; i++) step(sim);
            setSnapshot(commit(sim));
            // Shift over: stop the clock (step() is a no-op once ended anyway).
            if (sim.phase === "ended") setPlaying(false);
        }, TICK_MS);
        return () => window.clearInterval(handle);
    }, [playing]);

    const start = useCallback(() => {
        const sim = simRef.current!;
        if (sim.phase !== "briefing") return;
        startShift(sim);
        setSnapshot(commit(sim));
        setPlaying(true);
    }, []);
    const play = useCallback(() => {
        if (simRef.current!.phase === "running") setPlaying(true);
    }, []);
    const pause = useCallback(() => setPlaying(false), []);
    const toggle = useCallback(() => {
        setPlaying((p) => (simRef.current!.phase !== "running" ? false : !p));
    }, []);
    const setSpeed = useCallback((s: StreamSpeed) => setSpeedState(s), []);

    // Operator actions run outside the tick: mutate the sim and commit immediately
    // so the UI reflects them even while paused.
    const act = useCallback((fn: (sim: Sim) => void) => {
        const sim = simRef.current!;
        fn(sim);
        setSnapshot(commit(sim));
    }, []);

    const launch = useCallback((id: string) => act((sim) => engineLaunch(sim, id)), [act]);
    const recall = useCallback((id: string) => act((sim) => engineRecall(sim, id)), [act]);
    const resumePatrol = useCallback((id: string) => act((sim) => engineResume(sim, id)), [act]);
    const investigate = useCallback(
        (targetId: string, droneId: string) => act((sim) => engineInvestigate(sim, targetId, droneId)),
        [act],
    );
    const passIntel = useCallback((targetId: string) => act((sim) => enginePassIntel(sim, targetId)), [act]);
    const strike = useCallback(
        (targetId: string, droneId: string) => act((sim) => engineStrike(sim, targetId, droneId)),
        [act],
    );
    const designate = useCallback(
        (targetId: string, droneId: string) => act((sim) => engineDesignate(sim, targetId, droneId)),
        [act],
    );

    const restart = useCallback((seed?: number) => {
        simRef.current = makeSim(seed ?? simRef.current!.seed);
        setSnapshot(commit(simRef.current));
        setEpoch((e) => e + 1);
        // Back to the briefing — the next shift starts when the operator says so.
        setPlaying(false);
    }, []);

    return {
        ...snapshot,
        epoch,
        playing,
        speed,
        start,
        play,
        pause,
        toggle,
        setSpeed,
        launch,
        recall,
        resumePatrol,
        investigate,
        passIntel,
        strike,
        designate,
        restart,
    };
}

export type { Drone, DroneStatus };
