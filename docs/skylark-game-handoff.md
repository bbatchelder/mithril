# Handoff — Skylark game (stages 2–7)

Status as of 2026‑06‑09 (`feat/skylark-game-stage1` @ PR #69 — stage 1 complete). This document
hands off the remaining game work so another session can pick it up cold. Read
[`CLAUDE.md`](../CLAUDE.md) first, then [`docs/skylark-game.md`](skylark-game.md) — that's the
**design of record** (the locked decisions + system sketches). This is the *what's left + how*
layer on top of it.

---

## What exists now (stage 1, PR #69)

Skylark (`src/demos/mission/`) is a playable game scaffold:

1. **Pure engine** — `stream/engine.ts` owns ALL simulation + game rules (no React). One
   exported `step(sim)` per tick; operator actions are exported functions (`launch`, `recall`,
   `resumePatrol`, `investigate`) that mutate the sim. `stream/useStream.ts` is a thin hook:
   the `setInterval` clock, an immutable `commit(sim)` snapshot, action wrappers, `restart()`.
2. **Timed shift** — `SHIFT_TICKS` (900) then `sim.phase = "ended"`, sim freezes, actions
   no-op. `ShiftDebrief.tsx` (Dialog) opens via a `phase === "ended"` effect in
   `MissionControl.tsx`; "Start next shift" calls `stream.restart()` which rebuilds the seeded
   sim and bumps `epoch` (consumed by `MissionMap` to reset trails).
3. **Manual fleet** — no auto-recall / auto-relaunch. Launch/recall/resume buttons render in
   `TelemetryPanel.tsx` (`FleetActions`), hotkeys `l` / `r` in `MissionControl.tsx`.
4. **Pads** — `PAD_COUNT` (3). `land()` takes a free pad or goes `idle` (waiting);
   `assignPads()` promotes the lowest-battery idle drone `< PAD_WANT` (95%) whenever a pad
   frees (charge complete, launch off pad).
5. **Crash** — airborne battery ≤ 0 → status `lost` (new `DroneStatus`), `CRASH_PENALTY`
   (250), inert thereafter. One-shot 25%/10% warnings via `warnBattery` + `sim.batteryWarned`.
6. **Score scaffold** — `sim.score = { intel, penalties }` (+ derived `total` in the
   snapshot), `sim.stats = { investigations, factsRaised, dronesLost, launches, recalls }`.
   Intel = `SCORE_PER_TIER` (25) × tiers raised by `upgradeTarget` (now returns the count).
7. **HUD** — two stacked overlay panels top-left of the map in `MissionControl.tsx`
   (time-left / score / pads, then airborne / anomaly / targets / base) + "SHIFT OVER" navbar
   state + a "View debrief" reopen button when the dialog is dismissed.
8. **Engine tests** — `stream/engine.test.ts` (14 cases). Pattern: build `makeSim()`, poke
   state directly, `step()`, assert. `stepUntil(sim, pred)` helper for multi-tick scenarios.

### Engine invariants — do not break

- **Deterministic by seed.** All randomness flows through `sim.rng` (`prng.ts`, mulberry32,
  seed `0x5ca1ab1e`; targets use their own `0x7a26e7` inside `makeTargets`). Never call
  `Math.random()`/`Date.now()` in the engine. Operator actions currently consume **no** RNG —
  keep it that way where possible so a replay of (seed + timed actions) stays reproducible.
- **`commit()` must deep-copy anything React renders that the sim later mutates** (positions,
  facts, assignment, investigation). When you add mutable state (contacts, blue units,
  munitions), extend `commit()` accordingly or you'll get stale-render bugs.
- **Adding a `DroneStatus`** touches four places, TS only catches three:
  `STATUS_META` (data.ts), `FleetSummary`'s reduce-init + `order` (TelemetryPanel.tsx) — both
  type-enforced — and `STATUSES` + `statusColorExpr` in `MissionMap.tsx` (NOT enforced; the map
  silently renders nothing for a status without a registered `arrow-<status>` image).
- **Events**: `emit(sim, drone, …)` / `emitBase(sim, …)` (ground-station events use
  `BASE-01`; clicking them in the feed is a harmless no-op selection). Ring buffer caps at
  `MAX_EVENTS` (60) — at 5× speed, waypoint chatter evicts operator events within a couple of
  game-minutes (see "polish" below).

### Verification conventions for this work

- `pnpm build` + `pnpm test` green before PR (CLAUDE.md rule). Engine rules get unit tests in
  `stream/engine.test.ts` — they're cheap and they caught real bugs in stage 1.
- Eyeball the gallery in **both themes** (game UI is net-new design; there's no Blueprint
  target). Drive it via chrome-devtools MCP; the speed control (`5` hotkey) makes a full shift
  ~3 wall-clock minutes.
- **Hands-off run**: restart the shift, touch nothing for a few minutes at 5×, then grep the
  event feed for operator verbs (`recalled|launched|resuming`). Zero hits = no autopilot has
  crept back in. (Beware: a human with the window open may play it — that confounded stage-1
  verification until a clean hands-off run settled it.)

---

## Stage 2 — fog of war + contact lifecycle (next up)

The biggest stage; it makes detection *the game*. Suggested shape:

1. **Structured sensors.** Payloads are display strings today. Add to `Drone` (seeded in
   `data.ts`): `sensor: SensorKind` where
   `type SensorKind = "eo-ir" | "lidar" | "thermal" | "sigint"`, and a footprint radius
   (degrees, ~0.012–0.02; relay/sigint widest). Map: Falcon → `eo-ir`, Surveyor S3 → `lidar`,
   Surveyor S2 (thermal array) → `thermal`, Aether → `sigint`.
2. **Sensor–target matrix.** Target categories already exist in `targets.ts` (vehicle convoy,
   surface vessel, fixed structure, personnel group, heat source, RF emitter). Add to each
   `CategorySpec` a `bestSensor: SensorKind` (vehicles/vessels/personnel → `eo-ir`,
   structures → `lidar`, heat → `thermal`, RF → `sigint`). Rule: investigation by the wrong
   sensor caps fact tiers at 1 (Medium) — enforce in `upgradeTarget` (pass the
   investigating drone's sensor; cap `next` accordingly).
3. **Contact lifecycle.** Replace "all 7 targets visible at tick 0" with a seeded spawn
   schedule: `makeTargets()` still builds the full roster (deterministic), but each target
   gains `spawnTick` (spread across the shift, escalation curve = denser later) and
   `track: "undetected" | "active" | "stale"`. In `step()`: a spawned, undetected target
   becomes `active` ("detected") when an airborne drone is within its sensor footprint —
   guaranteed within range, or probabilistic per tick (e.g. `rng.chance(0.3)` scaled by sensor
   match) if you want sweep tension. An `active` track with no drone in range for N ticks
   (~45) goes `stale` (still listed, position frozen + grayed, must be re-found). Only
   `active` targets render full markers; stale ones render ghosts (new paint in
   `targetsFC`/`MissionMap` — add a `track` feature property).
4. **Drone picker for investigations.** Replace the auto-nearest in `investigate()` with
   `investigate(sim, targetId, droneId)`. UI: `TargetDetail`'s task button becomes a
   `MenuPopover` listing eligible drones sorted by ETA, each row showing callsign, battery,
   sensor (flag the matching sensor with a tag — "best sensor"). Keep a "nearest" default at
   the top. The mithril skill's overlay recipes cover menu-in-popover composition gotchas.
5. **Scoring.** Detection itself can score a little (e.g. +10 per new contact); wrong-sensor
   caps make the intel ceiling lower, which is penalty enough. New stats: `detected`,
   `staleLost` (tracks that went stale and never re-found) for the debrief.
6. **Tests**: spawn determinism (same seed → same schedule), detection within footprint,
   stale after N unattended ticks, wrong-sensor tier cap, picker validation (can't task a
   returning/lost drone).

Gotchas: the HUD "7 targets" count should become "contacts: X active / Y stale";
`TargetDetail` needs an `undetected` guard (shouldn't be selectable — don't render undetected
targets in the map source at all, or selection-by-stale-id breaks). `detectedBy`/`detectedAt`
on `Target` are currently fake-seeded strings — set them for real at detection time
(`formatMissionClock(sim.tick)`).

## Stage 3 — blue forces + intel passing

1. **Model**: `interface BlueUnit { id; callsign; kind: "convoy" | "vessel" | "checkpoint";
   position; route: LngLat[]; waypoint; speed; status: "moving" | "holding" | "rerouting" |
   "hit"; warnedAbout: Set<targetId> }` in a new `blue.ts`; 2–3 seeded units. Move them in
   `step()` with the existing `moveToward` (slower than drones; checkpoints don't move).
2. **Threat behavior**: red-affiliated contacts (stage 2's classification reveals affiliation
   at tier ≥ 1) inside a threat radius of a blue unit vector toward it instead of staying
   static — give hostile targets a slow `position` drift. An unwarned blue within a strike
   radius of a hostile for M ticks → `hit` (big penalty, e.g. −400; not shift-fail per the
   RTS-with-pause tone).
3. **Pass intel** action on `TargetDetail` (eligible when ≥ Medium confidence): the nearest
   blue reroutes/holds (`warnedAbout.add(targetId)`), score scales with the target's current
   confidence (e.g. +15 × verified facts). Passing on a target that classification later
   reveals as civilian costs score (the bad-intel penalty).
4. **ISR requests** (side objectives): seeded schedule of `{ tick, position, radius,
   durationTicks, reward }`; fulfilled if any drone loiters/passes within radius during the
   window. Surface as a `warning` event + map ring; debrief counter.
5. **Map**: blue diamonds + routes (`uplinksFC`-style source), threat vectors optional.
   Blues are selectable like targets → a small `BlueDetail` panel (status, route, warnings,
   "request coverage" flavor).

## Stage 4 — strikes (both kinds)

1. **Talon class**: extend the seed with 2 strike drones (new squadron "Strike Flight",
   `sensor: "eo-ir"`, `munitions: 2`). They patrol/investigate like any drone.
2. **Strike action** (`TargetDetail`, hostile + tier-gated UI warning): like `investigate`
   but the assignment's phase chain is `enroute → strike` (one pass, no loiter); on arrival the
   target resolves: verified hostile → neutralized (+200, marker → struck ghost), civilian →
   incident (−500 + a danger event); below High confidence it's an RNG-weighted gamble based
   on actual affiliation. Munition decrements; `munitions === 0` → must rearm (rearm = a
   charging-pad stay; piggyback on the pad system, e.g. rearming occupies a pad for ~20 ticks).
3. **External fires**: `sim.fires = 2` per shift. Requires a *designating* drone (any sensor)
   in-footprint continuously for K ticks (reuse the investigation orbit), then a delay
   (~15 ticks) before impact at the target's *current* position — a moving hostile that left
   the blast radius wastes the fire. HUD shows fires remaining.
4. **ROE scoring** lives in one function (`resolveStrike(sim, target, weapon)`) so the debrief
   can itemize: neutralized / gambles taken / incidents.
5. **Tests**: munition decrement + rearm gating, designation interrupted by recall, fire
   wasted on moved target, civilian incident penalty, no strikes after shift end.

## Stage 5 — relay/link + jamming

1. **Link model**: a drone is *linked* if within base range (~0.05°) or within relay range of
   a linked `sigint`/relay drone (chain; compute per tick via BFS from base over airborne
   drones — 12 drones, trivial cost). Unlinked drones **bank** intel: investigation completion
   defers `upgradeTarget`/scoring until the drone is linked again (store
   `bankedIntel: { targetId, raised }[]` on the drone; flush on relink with a success event).
2. **Jamming**: stage-2 RF emitters get `jammer: true` — drones inside their radius lose link
   regardless of chain, and take the existing anomaly-style signal hit. Striking the jammer
   (stage 4) clears it. This finally gives the Relay Net squadron its job: park relays to
   bridge far sectors.
3. **Map**: link lines drone→drone/base (replace today's decorative `uplinks` arcs with real
   link-state lines, dashed red when jammed). `TelemetryPanel` gets a LINKED/BANKING tag.

## Stage 6 — briefing, full debrief, daily seed

1. **Briefing**: pre-shift Dialog (fleet roster, pad count, munitions/fires, "expected
   activity" flavor from the spawn schedule) with a Start button — the sim shouldn't tick
   until started (add `phase: "briefing"`; `useStream` starts paused in it).
2. **Seed plumbing**: `makeSim(seed)` (thread through `restart(seed?)`); read
   `?seed=`/`#mission/seed` from the URL; "daily" = seed derived from the date string (don't
   call `Date` inside the engine — derive the seed in the React layer and pass it in).
   Show the seed in the debrief with a copy button.
3. **Full debrief**: letter grade (thresholds over score), decision timeline (filter
   `sim.events` to operator verbs + crashes + strikes — consider a parallel
   `sim.keyEvents` log that is *not* capped at 60), per-category score table, restart-with-
   same-seed vs new-seed buttons.
4. The stage-1 debrief is intentionally minimal — replace freely; only `onRestart`/`onClose`
   wiring in `MissionControl.tsx` matters.

## Stage 7 — balance + polish (running list)

- **Event noise**: drop or de-rate waypoint events (`rng.chance(0.5)` today); add severity
  filtering to `EventFeed`; keep an uncapped `keyEvents` for the debrief (see stage 6).
- **Battery drain tuning**: current patrol drain ≈ 0.095%/tick → ~17 game-min on a full
  charge; with a 15-min shift the pads only matter because the fleet starts partial. If pads
  feel idle, raise drain (~0.13) or shorten charge.
- **Pad-hogging**: `PAD_WANT = 95` means a 96% drone never auto-pads; fine, but consider an
  explicit "charge this drone" action if players ask for control.
- **Toast spam**: every `danger` event toasts (`MissionControl` effect) — crashes + critical
  battery at 5× can stack; consider toasting only crashes/incidents.
- **HUD on mobile**: the two overlay panels + bottom sheets are untested below `lg` since the
  HUD landed — check the small-screen layout.
- **A11y**: ShiftDebrief Dialog has no description (Radix warns — pre-existing pattern
  app-wide); the HUD strip is visual-only, consider `aria-live` for the countdown's last
  minute.
- Score values (`SCORE_PER_TIER`, `CRASH_PENALTY`, stage 3/4 numbers) are placeholders —
  balance them once a full loop exists (stage 4+), not before.

---

## Process notes

- One branch + PR per stage off `main` (stage 1 = `feat/skylark-game-stage1`, PR #69). Update
  `docs/skylark-game.md`'s "Stage N rules (implemented)" section as each stage lands, and keep
  this handoff's stage list pruned.
- Project memory (`~/.claude/.../memory/skylark-game-conversion.md`) mirrors the locked
  decisions + status — update it when a stage merges.
- Demo-local components (ShiftDebrief etc.) do **not** need gallery/registry/gen:meta
  registration — that machinery is for `src/components/ui/` only.
- Two dev servers may be running locally (:5173 from an older session, :5174 newer) — both
  serve this repo fine; just mind which one the browser tab is on when testing HMR'd changes.
