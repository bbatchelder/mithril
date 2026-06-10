/**
 * useStream — the React side of the Skylark shift simulation.
 *
 * The actual game rules live in the pure engine module (`engine.ts`); this hook
 * owns the clock (setInterval), exposes an immutable render snapshot, and wraps
 * the operator actions (launch / recall / investigate / restart) so they mutate
 * the sim and commit a fresh snapshot immediately — even while paused.
 *
 * `speed` runs N sub-steps per clock tick (faster feel, diverges from the 1×
 * sequence — that's expected for a user control). When the shift clock runs out
 * the engine flips to `ended` and the interval stops; `restart()` rebuilds the
 * sim from the seed and bumps `epoch` so map-side accumulations (trails) reset.
 */
import { useCallback, useEffect, useRef, useState } from "react";

import {
    type FireMission,
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
    step,
} from "./engine";
import type { BlueUnit, IsrRequest } from "../blue";
import type { Drone, DroneStatus, StreamEvent, TelemetryHistory } from "../data";
import type { Target } from "../targets";

const TICK_MS = 1000;

export type StreamSpeed = 1 | 2 | 5;

export interface StreamState {
    tick: number;
    /** "running" until the shift clock expires, then "ended" (sim frozen). */
    phase: "running" | "ended";
    drones: Drone[];
    targets: Target[];
    blues: BlueUnit[];
    isr: IsrRequest[];
    events: StreamEvent[];
    history: Record<string, TelemetryHistory>;
    score: ShiftScore;
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
    /** Rebuild the sim from the seed and start a fresh shift. */
    restart: () => void;
}

export function useStream(): StreamState {
    const simRef = useRef<Sim>(makeSim());
    const [snapshot, setSnapshot] = useState(() => commit(simRef.current));
    const [playing, setPlaying] = useState(true);
    const [speed, setSpeedState] = useState<StreamSpeed>(1);
    const [epoch, setEpoch] = useState(0);

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
            // Shift over: stop the clock (step() is a no-op once ended anyway).
            if (sim.phase === "ended") setPlaying(false);
        }, TICK_MS);
        return () => window.clearInterval(handle);
    }, [playing]);

    const play = useCallback(() => {
        if (simRef.current.phase !== "ended") setPlaying(true);
    }, []);
    const pause = useCallback(() => setPlaying(false), []);
    const toggle = useCallback(() => {
        setPlaying((p) => (simRef.current.phase === "ended" ? false : !p));
    }, []);
    const setSpeed = useCallback((s: StreamSpeed) => setSpeedState(s), []);

    // Operator actions run outside the tick: mutate the sim and commit immediately
    // so the UI reflects them even while paused.
    const act = useCallback((fn: (sim: Sim) => void) => {
        const sim = simRef.current;
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

    const restart = useCallback(() => {
        simRef.current = makeSim();
        setSnapshot(commit(simRef.current));
        setEpoch((e) => e + 1);
        setPlaying(true);
    }, []);

    return {
        ...snapshot,
        epoch,
        playing,
        speed,
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
