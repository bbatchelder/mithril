# Handoff — Skylark game (stages 6–7)

Status as of 2026‑06‑09 (stage 1 = PR #69, stage 2 = PR #70, stage 3 = PR #71, stage 4 =
PR #72, all merged; stage 5 = `feat/skylark-game-stage5`). This document hands off the remaining game work so
another session can pick it up cold. Read [`CLAUDE.md`](../CLAUDE.md) first, then
[`docs/skylark-game.md`](skylark-game.md) — that's the **design of record** (the locked
decisions + system sketches + per-stage "rules (implemented)" sections). This is the *what's
left + how* layer on top of it.

---

## What exists now (stages 1–5)

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
8. **Engine tests** — `stream/engine.test.ts`. Pattern: build `makeSim()`, poke state
   directly, `step()`, assert. Helpers: `stepUntil(sim, pred)` for multi-tick scenarios,
   `activate(sim, t)` to skip detection, `park(d, pos)` to pin a drone over a point.
9. **Fog of war (stage 2)** — drones carry `sensor: SensorKind` (+ footprint radius in
   `SENSOR_META`, data.ts); targets carry `bestSensor` / `spawnTick` / `track` /
   `lastSeenTick` (targets.ts, roster built by `makeTargets(SHIFT_TICKS)`). The detection /
   freshness / staleness pass runs at the end of `step()`. `upgradeTarget(tgt, rng, sensor)`
   caps at tier 1 on a sensor mismatch. `investigate(sim, targetId, droneId)` names the drone
   (UI: `MenuPopover` picker in `TargetDetail`, ETA-sorted via the exported `etaTicks` /
   `canInvestigate`). Undetected targets are filtered out in `MissionControl` before anything
   renders — the map never sees them. Stale paint + footprint circles live in `MissionMap`
   (`target-stale` icon, `footprints` source).
10. **Blue forces + intel passing (stage 3)** — `blue.ts` holds `BlueUnit` (convoy / vessel /
    checkpoint; status moving / holding / rerouting / hit) + `makeBlues()` and the seeded
    `IsrRequest` schedule (`makeIsrRequests`). Targets carry ground-truth `affiliation`
    (exactly 3 of 7 hostile, drawn from the roster seed) + `affiliationKnown` / `passedTo` /
    `lastKnownPosition`. In `step()`: `stepBlues` (route legs + warned-threat evasion) →
    `stepHostiles` (armed hostiles drift toward the nearest blue; unwarned blue inside
    `STRIKE_RADIUS` for `HIT_TICKS` → hit, −400, attack reveals the track) → `stepIsr`
    (open / progress / expire windows; fulfil = `ISR_COVER_TICKS` cumulative drone-presence
    ticks). `HOSTILE_DORMANT_TICKS` (60) is the post-spawn grace that makes warn-in-time
    winnable. `passIntel(sim, targetId)` warns the nearest live blue; scoring resolves against
    ground truth (`PASS_SCORE_PER_VERIFIED` × verified facts vs `BAD_INTEL_PENALTY`), gated by
    `canPassIntel` (≥ `PASS_MIN_VERIFIED` verified facts). UI: blue diamonds / routes / ISR
    rings + `target-hostile` red diamond in `MissionMap`, `BlueDetail` panel, pass-intel
    button + affiliation cells in `TargetDetail`, blue/hit/ISR HUD chips, four new debrief
    counters. ISR ring positions are tuned so a hands-off shift fulfils none (they sit on the
    *grounded* birds' loops — SK-204 / SK-304 / SK-104); re-verify that property if routes,
    anchors, or radii change.
11. **Strikes, both kinds (stage 4)** — `DroneAssignment` carries a `kind`
    (`investigate | strike | designate`); `strike(sim, targetId, droneId)` flies a Talon
    (SK-401/402, `munitions: number | null` on `Drone` — null = unarmed platform) straight at
    the live position and resolves on arrival; `designate(sim, targetId, droneId)` reuses the
    investigation orbit for `DESIGNATE_TICKS`, then pushes a `FireMission` (aim point frozen at
    launch) onto `sim.firesInFlight`, landed by `stepFires` after `FIRE_DELAY_TICKS` — hit only
    if the target is still within `BLAST_RADIUS` of the aim point. **All ROE scoring lives in
    `resolveStrike(sim, tgt, by)`**: hostile → +`STRIKE_SCORE` & `neutralized`; civilian →
    −`CIVILIAN_STRIKE_PENALTY` & `strikeIncidents`; unverified-at-resolution → `gamblesTaken`
    either way. Struck targets (`Target.struck` + `struckAt`) are skipped by detection /
    staleness / hostile passes and refuse all tasking; `resolveStrike` breaks off any other
    drone assigned to the target. Rearm piggybacks on pads: `sim.rearmTimer` counts a
    `REARM_TICKS` pad stay (pad held until charge *and* reload finish; leaving the pad clears
    the timer — `launch` and `dispatchDrone` both delete it). UI: strike/fires pickers +
    gamble-warning callout in `TargetDetail`, munitions row in `TelemetryPanel`, fires HUD
    chip, struck-X map icon + red blast rings (`fires` source) + kind-colored tasking lines in
    `MissionMap`, four ROE debrief counters.
12. **Relay/link + jamming (stage 5)** — `stepLinks` (end of `step()`, after `stepFires`)
    recomputes `Drone.linked` / `linkParent` / `jammed` per tick: a jam pass (live jammers =
    `Target.jammer` RF emitters, spawned + unstruck, `JAM_RADIUS`; jammed drones lose link
    regardless of chain and bleed signal), then a BFS from base — non-relays root within
    `BASE_LINK_RANGE`, relays (`sensor === "sigint"`) root *and* hop within the longer
    `RELAY_RANGE` (asymmetry tuned so the seeded relay backbone only drops when jammed; the
    west recon loops run dark on far legs by design — ~20% of hands-off airborne ticks, mostly
    SK-101/102). An investigation completing off-link pushes the target id onto
    `Drone.bankedIntel` instead of paying out; **all payout goes through `deliverIntel`**
    (upgrade + score + affiliation reveal + event), called at completion when linked or from
    `flushBankedIntel` on relink. Crash loses banked intel and reopens those targets
    (investigation back to `idle`); banked intel on a struck target is discarded at flush.
    UI: real link lines drone→parent + red severed rings (`uplinks` source, two layers) +
    violet jam rings (`jamzones` source) in `MissionMap`, Linked/No link/Jammed header tag +
    banked-intel row in `TelemetryPanel`, jammer callout in `TargetDetail`, no-link/banked
    HUD chips.

### Engine invariants — do not break

- **Deterministic by seed.** All randomness flows through `sim.rng` (`prng.ts`, mulberry32,
  seed `0x5ca1ab1e`; targets use their own `0x7a26e7` inside `makeTargets`). Never call
  `Math.random()`/`Date.now()` in the engine. Operator actions currently consume **no** RNG —
  keep it that way where possible so a replay of (seed + timed actions) stays reproducible.
- **`commit()` must deep-copy anything React renders that the sim later mutates** (positions,
  facts, assignment, investigation, `bankedIntel`, blue positions + `warnedAbout`, ISR
  positions, `lastKnownPosition`). When you add mutable state, extend `commit()` accordingly
  or you'll get stale-render bugs.
- **Adding a `DroneStatus`** touches four places, TS only catches three:
  `STATUS_META` (data.ts), `FleetSummary`'s reduce-init + `order` (TelemetryPanel.tsx) — both
  type-enforced — and `STATUSES` + `statusColorExpr` in `MissionMap.tsx` (NOT enforced; the map
  silently renders nothing for a status without a registered `arrow-<status>` image). The same
  silent-render gotcha applies to `BlueStatus` and `BLUE_STATUSES` / `blue-<status>` images.
- **Hostiles move; civilians don't.** Engine tests that park a drone over a target or assert
  exact scores call `pacify(sim)` (all-civilian) first, then `arm(t)` per scenario (hostile +
  past dormancy). New long-running tests should do the same or seeded hostiles will drift
  targets and hit blues mid-test.
- Stale tracks render at `lastKnownPosition` (kept fresh by the coverage pass) — keep that in
  mind for any new layer that draws targets.
- **Strike scoring goes through `resolveStrike` only** — never award/penalize a strike anywhere
  else, or the debrief itemization (neutralized / gambles / incidents) drifts from the score.
  When adding rules that remove a target from play, mirror the `struck` guards (fog pass,
  `stepHostiles`, `investigate`/`canPassIntel`/`canStrikeTarget`, assignment break-off,
  `flushBankedIntel`).
- **Investigation payout goes through `deliverIntel` only** (linked completion *or* banked
  flush) — award investigation intel anywhere else and the link/banking mechanic stops
  meaning anything. Engine tests that assert payout at completion must keep the target
  inside link coverage (or stage a relay); the banking tests stage targets at `SAFE`
  precisely because it's beyond every link.
- The external-fires aim point is **frozen at designation completion** — `stepFires` compares the
  target's *live* position against it at impact. Don't "helpfully" retarget the round; dodging is
  the mechanic.
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

## Stage 6 — briefing, full debrief, daily seed (next up)

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
- Score values (`SCORE_PER_TIER`, `CRASH_PENALTY`, `BLUE_HIT_PENALTY`, `BAD_INTEL_PENALTY`,
  pass/ISR rewards) and the hostile-pressure knobs (`HOSTILE_DORMANT_TICKS`, drift speed,
  `HIT_TICKS`) are placeholders — balance them once a full loop exists (stage 4+), not before.
  A hands-off shift currently ends around −2400 (7 crashes + 2 blues hit); decide whether
  that's the right "do nothing" floor.
- The pass-intel button names the nearest blue from the render snapshot; the engine re-picks
  at click time — at 5× the label can lag the actual recipient by a tick. Cosmetic.
- **Jam-edge chatter**: a drone skirting the jam boundary emits paired jammed/clear events
  (no hysteresis). Rare with the seeded geometry; add a debounce if it gets noisy. Likewise
  the west recon loops wear severed rings most of their far legs — by design (dark sector),
  but consider a one-line legend if playtests read it as a bug.

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
