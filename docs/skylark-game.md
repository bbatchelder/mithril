# Skylark — the game

Skylark (the `mission` demo, `src/demos/mission/`) is being converted **in place** from a passive
mission-control demo into a playable drone-operations game. This doc is the design of record;
decisions here were agreed with the author on 2026-06-09. The session-to-session continuity
layer — what's left, per stage, with implementation guidance — lives in
[`skylark-game-handoff.md`](skylark-game-handoff.md).

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
   crash-at-0%, score scaffold + HUD, basic end-of-shift debrief with restart. *(PR #69)*
2. **Fog of war + contact lifecycle** — spawn schedule, sensor footprints, unknown tracks,
   staleness, sensor-matched investigation with a drone picker. *(PR #70)*
3. **Blue forces + intel passing.** *(PR #71)*
4. **Strikes** — armed "Talon" class, munitions/rearm, external fires, ROE scoring. *(PR #72)*
5. **Relay/link layer + jamming.** *(PR #73)*
6. **Briefing + full debrief + daily seed.** *(this PR)*
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

## Stage 2 rules (implemented)

- **Fog of war.** The 7-target roster is still built at sim start (deterministic), but each
  target carries a `spawnTick` on an escalation curve — two are live at tick 0, the rest arrive
  faster as the shift wears on, none after ~88% of the clock. Undetected targets are not
  rendered on the map and cannot be selected or tasked.
- **Sensors & detection.** Every drone carries a sensor — Falcons EO/IR, Surveyor S3s LiDAR,
  S2s thermal, Aethers SIGINT — with a detection footprint (SIGINT widest), drawn on the map
  around every airborne drone (the drawn circle *is* the detection boundary). Each tick, a
  spawned target inside a footprint rolls a detection chance, higher when the sensor matches
  the target's category. A new contact scores +10, stamps `detectedBy`/`detectedAt` for real,
  and fires an event.
- **Staleness.** An active track with no sensor coverage for 45 ticks goes stale: a gray ghost
  marker at the last-known position, a warning event, and a stale count in the HUD. Flying any
  drone back over it re-acquires the track (no new detection points).
- **Sensor–target matrix.** Vehicles, vessels, and personnel resolve under EO/IR; structures
  under LiDAR; heat sources under thermal; RF emitters under SIGINT. A wrong-sensor
  investigation caps every fact at Medium confidence — only the category's best sensor verifies
  facts to High, so fleet composition and *which drone you send* matter.
- **Drone picker.** `investigate(sim, targetId, droneId)` names the drone. The target panel's
  task button opens a menu of eligible drones sorted by ETA — battery and sensor on every row,
  the matching sensor tagged "best sensor", a "send nearest" shortcut on top. Tasking a
  grounded drone launches it; a stale target's button reads "re-acquire".
- The debrief adds contacts-found and tracks-left-stale counters.

## Stage 3 rules (implemented)

- **Blue forces.** Three friendly units (`blue.ts`): a ground convoy and a patrol vessel on
  fixed route loops (drawn on the map, slower than any drone) plus a static checkpoint. Blue
  diamonds are selectable like targets → a `BlueDetail` panel (kind, status, the intel warnings
  it holds, any open ISR request). They're always visible — fog of war applies to red, not blue.
- **Ground-truth affiliation.** Every contact is secretly hostile or civilian (exactly 3 of 7
  hostile, drawn deterministically from the roster seed; most contacts stay noise). The
  operator sees "Unknown" until classification settles it: a completed investigation (any
  sensor), a blue unit's report-back after pass-intel, or being attacked all reveal it. A
  revealed hostile trades its reticle for a red unit diamond on the map.
- **Hostile pressure.** After a ~1-minute post-spawn dormancy window, a hostile drifts toward
  the nearest blue within its threat radius — whether or not it's been detected. An *unwarned*
  blue held inside the strike radius for 8 straight ticks is hit: −400, the unit goes inert,
  and the attack reveals the attacker as a live hostile track. Hostiles move, so a stale
  track's ghost marker stays at the *last-known* position, not the live one.
- **Pass intel.** A target panel action, gated on 2 verified facts (so best-sensor
  investigation is the enabler): the nearest live blue is warned (`warnedAbout`), reroutes or
  holds, and becomes immune to that specific threat. Scoring resolves against ground truth —
  +15 × verified facts for a real hostile, −100 for fingering a civilian. One pass per target.
- **ISR requests.** Three seeded side objectives: timed windows with an amber ring on the map,
  fulfilled by accumulating 20 ticks of any-drone presence inside the ring. The rings sit on
  the patrol routes of the birds that start grounded and off the always-airborne loops
  (verified hands-off: zero requests self-fulfil) — the play is launching the right drone.
- The HUD adds blue/hit/ISR chips; the debrief adds intel-passes, bad-intel, blues-hit, and
  ISR-fulfilled counters, and the clean-shift tag now also requires no blue casualties.

## Stage 4 rules (implemented)

- **Strike Flight.** Two armed "Talon" drones (SK-401/402, EO/IR + 2 munitions each) join the
  fleet, held on ground alert at base — once launched they patrol and investigate like any drone,
  and they're the only airframes that can fly strike runs.
- **Talon strike.** A target-panel action on an active track: the Talon flies straight at the
  *live* position and releases on arrival — one pass, one munition. ROE resolves against ground
  truth in one place (`resolveStrike`): a real hostile is neutralized (+200), a civilian is a
  strike incident (−500). Either way the strike reveals what the contact was, and its marker
  becomes a gray struck-X ghost. A strike resolved without a verified affiliation counts as a
  "gamble taken", win or lose — the UI says exactly what's at stake before you commit, and the
  engine refuses to strike a *known* civilian.
- **Rearm.** A Talon at 0 munitions reloads during a charging-pad stay (~20 ticks, running
  alongside the charge; the pad is held until both finish). Leaving the pad abandons rearm
  progress.
- **External fires.** Two rounds per shift. Any drone can designate — it holds the investigation
  orbit for a continuous window, then the round launches at the target's position *at that
  moment* and lands 15 ticks later on that fixed aim point (a red blast ring on the map). A
  target that left the blast radius wastes the round — a hostile mid-drift dodges; a parked one
  doesn't. Breaking off the designation (recall, crash) calls nothing in and costs nothing.
- **Struck targets are out of play** — no detection or staleness, no tasking, no pass-intel, no
  hostile stalking; any drone still flying against one breaks off.
- The HUD adds a fires-remaining chip; the telemetry panel shows munitions and rearm state; the
  debrief adds neutralized / gambles-taken / strike-incidents / fires-wasted counters, and the
  clean-shift tag now also requires zero ROE incidents.

## Stage 5 rules (implemented)

- **Link model.** Every tick the engine recomputes each drone's comms path home: a drone is
  *linked* within base range, or through a chain of linked airborne relay birds (the SIGINT
  Aethers — Relay Net's actual job). Relays carry the backhaul radio: they root to base from
  half again farther out than anyone else and extend the chain that same reach, hopping
  relay-to-relay. Grounded drones at base are wired in; lost ones never link. The ranges are
  tuned so the seeded relay backbone only drops when jammed, while the west recon loops
  genuinely run dark on their far legs — the west is bank-and-deliver country.
- **Banked intel.** An investigation that completes off-link doesn't pay out: the collection
  stays aboard (no fact upgrades, no points, no affiliation reveal) and delivers automatically
  the moment the drone relinks — fly home, or just let the patrol swing back into coverage. A
  drone that crashes with intel aboard loses it, and those contacts reopen for a fresh
  investigation. Banked intel on a contact that gets struck in the meantime is discarded.
- **Jamming.** The RF-emitter contact is a *jammer*: once spawned (detected or not) it severs
  the link of any drone inside its denial radius — chain or no chain — and chews its signal
  down while inside. Striking it clears the interference; the seeded one spawns late-shift in
  the middle of the relay backbone, so the strike decision is also a comms decision.
- **Map & HUD.** The decorative uplink arcs are gone: linked drones draw a real line to their
  uplink parent (base or the relay they chain through), a severed drone wears a small red
  dashed ring, and a visible live jammer draws a violet "JAMMING" denial ring at its track
  position. The telemetry panel header gets a Linked / No link / Jammed tag plus a banked-intel
  row, the target panel calls out an active jammer, and the HUD adds no-link and banked chips.

## Stage 6 rules (implemented)

- **Briefing.** A fresh sim holds in a `briefing` phase — nothing ticks, operator actions are
  inert — until the shift is started from the pre-shift dialog: fleet roster by squadron
  (sensors, airborne/at-base posture), base resources (shift length, pads, munitions, external
  fires), an "intelligence picture" derived from the spawn schedule (expected contacts, the
  standing three-hostile assessment, ISR request count), the blue forces to protect, and the
  scenario seed. Dismissable to scout the frozen board; a HUD button reopens it, and the navbar
  wears a BRIEFING tag with the play control disabled until launch.
- **Seeds.** The whole scenario — target positions, affiliations, facts, spawn curve, ISR window
  timing — derives from one shareable seed (`makeSim(seed)`); the telemetry stream is seeded
  separately so the default seed still reproduces the stage-5 hand-tuned roster. Seeds ride the
  URL (`#mission/<hex>` or `?seed=`, plus the keyword `daily` for a date-derived shared
  scenario), display as 8-digit hex with copy buttons in the briefing and debrief, and custom
  seeds write themselves back to the hash for sharing. The engine never reads the clock or
  `Math.random` — daily/random seeds are minted in the React layer (`seed.ts`).
- **Full debrief.** A letter grade (S–F bands over the final score; placeholder thresholds for
  the stage-7 balance pass) heads the dialog, over a per-category score table fed by the
  engine's itemized `ScoreBreakdown` ledger (every award/penalty lands in exactly one bucket,
  so the table always sums to the headline score), the operational counters, and a "key calls"
  decision timeline — a new uncapped `keyEvents` log (operator calls and their outcomes only)
  that waypoint chatter can never evict, unlike the 60-event feed. Footer offers "Replay this
  seed" (same scenario, back to the briefing) and "New shift" (fresh random seed).
