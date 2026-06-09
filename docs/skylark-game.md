# Skylark — the game

Skylark (the `mission` demo, `src/demos/mission/`) is being converted **in place** from a passive
mission-control demo into a playable drone-operations game. This doc is the design of record;
decisions here were agreed with the author on 2026-06-09.

## The fantasy

You're the flight director running one ISR-and-strike **shift** over the bay. Find contacts,
classify them, protect blue forces, and decide what to do about threats — all while rotating a
battery-limited fleet through a handful of charging pads.

**Core loop:** Detect → Classify → Decide → Sustain.

## Locked decisions

- **Convert Skylark in place** — no fork, no mode toggle. The pre-game demo lives in git history.
- **Structure: timed shift + debrief** — one bounded shift (~15 min at 1×), score tallied in an
  end-of-shift debrief; seeded scenarios for replayability (daily-seed friendly).
- **Strikes: both kinds** — armed strike drones (limited munitions, rearm at base) *and* scarce
  external fires (a drone designates; an off-map strike arrives after a delay).
- **Tone: RTS-with-pause** — pause-to-plan encouraged (the speed control already does this);
  consequences are real but recoverable (lose a drone, not the run).

## Systems

1. **Fog of war.** Contacts spawn hidden across the shift on a seeded escalation curve. A drone
   detects within its sensor footprint; detection yields an unclassified track at Low confidence.
   Unattended tracks go stale and must be re-found. Most contacts are civilian noise.
2. **Sensor–target matrix.** Thermal resolves heat sources, SIGINT resolves RF emitters, EO/IR
   resolves vehicles/vessels, LiDAR resolves structures. Wrong-sensor investigation caps at
   Medium confidence — fleet composition and *which drone you send* matter.
3. **Per-contact decisions.** Investigate / Shadow (keeps the track alive, occupies a drone) /
   Pass intel to blue (value scales with confidence; bad intel costs score) / Strike.
4. **Strikes.** The intel confidence-tier system is the core risk mechanic: striking a verified
   hostile scores big; striking below High confidence is a gamble; hitting a civilian is a severe
   penalty. External fires need continuous designation and can be dodged by moving targets.
5. **Blue forces.** Friendly units on visible routes; red contacts vector toward them. Warned
   blues reroute or hold; an unwarned blue meeting a hostile takes casualties. Blues radio ISR
   requests as side objectives.
6. **Endurance & base.** Launch and recall are manual. Limited charging pads for the whole fleet,
   drain scaled by speed and sensing, and a drone that hits 0% mid-air **crashes and is lost for
   the shift**.
7. **Relay & jamming.** Intel only streams home while a drone has link to base or a relay chain;
   out-of-link drones bank intel until reconnected. RF-emitter contacts become jammers (reusing
   the anomaly machinery).
8. **Debrief.** End-of-shift dialog: score breakdown, timeline of key calls, letter grade, and
   the seed for sharing. The engine is deterministic-by-seed, so a "daily seed" mode is cheap.

## Build stages (each a working, mergeable PR)

1. **Game state + manual fleet control** — shift countdown, launch/recall, charging pads,
   crash-at-0%, score scaffold + HUD, basic end-of-shift debrief with restart. *(this PR)*
2. **Fog of war + contact lifecycle** — spawn schedule, sensor footprints, unknown tracks,
   staleness, sensor-matched investigation with a drone picker.
3. **Blue forces + intel passing.**
4. **Strikes** — armed "Talon" class, munitions/rearm, external fires, ROE scoring.
5. **Relay/link layer + jamming.**
6. **Briefing + full debrief + daily seed.**
7. **Balance and polish pass.**

## Stage 1 rules (implemented)

- The shift runs `SHIFT_TICKS` (900) sim ticks, then the sim freezes and the debrief opens.
  Restarting rebuilds the sim from the seed.
- **No more autopilot fleet management:** the auto-recall at low battery and the auto-relaunch at
  full charge are gone. Drones warn at 25% and 10% battery; at 0% an airborne drone crashes
  (status `lost`, −250 points, gone for the shift).
- **Launch** (idle or charging drone at base → flies out to its patrol route from base) and
  **recall** (airborne drone → returns, lands, takes a pad or waits) are operator actions, in the
  telemetry panel and on hotkeys (`l` / `r`). Recalling mid-investigation aborts the
  investigation. A returning drone can be turned around ("resume patrol").
- **Charging pads:** `PAD_COUNT` (3) pads. Landed drones take a free pad, otherwise wait at base
  (`idle`); when a pad frees, the lowest-battery drone at base takes it. A fully-charged drone
  releases its pad and sits ready — launching is your call.
- **Score scaffold:** completed investigations award intel points per confidence tier raised;
  lost drones cost points. The HUD strip (top-left of the map) shows shift time remaining, score,
  pads in use, and airborne count. The engine also tracks launches/recalls/investigations for the
  debrief.
- The sim core was extracted from the `useStream` hook into a pure module
  (`stream/engine.ts`) so game rules are unit-testable (`stream/engine.test.ts`).
