# Handoff: Mission Control (Skylark) — live streaming demo app

> Branch: `demo-apps` · Worktree: `../mithril-demo-apps`
> Continues the **example demo applications** stream (`0066-soc`, `0067-board`).

## TL;DR — current state

- Third demo built and committed: **Skylark — Drone Swarm Mission Control**, the first **live, streaming**
  demo. Under `src/demos/mission/`, registered in `src/demos/registry.ts` as `id: "mission"`.
- There are now **three demos** (SOC Console · Project Board · Mission Control) behind the sidebar **Demos** toggle.
- `pnpm build` is **green** (`tsc -b && vite build`, 0 type errors).
- **One new dependency: `maplibre-gl` (^5.24).** This is the first demo with a runtime dep *and* the first
  to make network calls (CARTO basemap tiles). The shared component library (`src/components/ui/*`) is **untouched**.
- README "Example apps" section updated with the Mission Control entry.
- Browser-verified in **both themes** (see "Verified" below).

## How to run / view

```bash
pnpm install     # if node_modules is missing in this worktree
pnpm dev         # Vite preview (this session ran on :5180; 5173 was another app)
```
- Sidebar **Demos** → **Mission Control**, or deep-link `http://localhost:<port>/#demo-mission`.
- `pnpm build` is the verification gate (no unit tests for demos; verification is visual/manual).

## What the demo demonstrates

A drone-swarm ops console over the San Francisco Bay. The point was twofold: (1) cover the **read-heavy /
structural** components the SOC + Board demos skipped, and (2) add a **live data** dimension.

- **Navbar** — Skylark brand, "Swarm Ops" / LIVE-PAUSED `Tag`s, global `InputGroup` search (filters the tree),
  mission clock, **play/pause** `Button`, **speed** `SegmentedControl` (1×/2×/5×), **Follow** `Switch`,
  identity `Popover`/`Menu`.
- **Left rail** — fleet roster as a controlled **`Tree`** (Squadron → Drone) inside a **`Section`**; each drone
  row has a live status dot + battery %. Selecting drives the map + telemetry panel.
- **Center** — a live **MapLibre** map (`MissionMap.tsx`): a per-status arrow marker per drone (rotated by
  heading), **route trails**, dashed **uplink arcs** to the ground station, **clustering** when zoomed out, a
  base marker, and a selection ring. Plus a status overlay chip (airborne count / anomalies / base).
- **Center bottom** — streaming **event feed**: severity-tagged rows (`Tag` intents), `Tooltip` timestamps,
  auto-scroll honoring the stream's play state.
- **Right rail** — **`TelemetryPanel`**: two radial **gauges** (battery/signal), a patrol `ProgressBar`, four
  metric cards with **sparklines**, an anomaly `Callout`, and **`Skeleton`** placeholders during a ~1.2s
  "connecting" phase. With no drone selected it shows a fleet roll-up (`Callout` + `CardList`).
- **Drill-in `Drawer`** (`DroneDetail.tsx`) — a **`PanelStack`** with **`Breadcrumbs`** + **`Tabs`** (Telemetry
  / Mission / Subsystems / Activity). The Subsystems tab is a `CardList`; clicking a subsystem **pushes** a
  second panel (with the PanelStack back button) showing a health gauge + diagnostics.
- **Toasts** — new `danger` events (anomalies) fire a `toaster.show(...)`.

Structural components newly exercised: **Tree, Section, CardList, Skeleton, Breadcrumbs, PanelStack** (Collapse
is used internally by Tree/Section).

## The streaming engine (seeded + deterministic)

`src/demos/mission/`:
- **`prng.ts`** — `mulberry32` + a small `Rng` helper.
- **`stream/useStream.ts`** — one `setInterval` (1000ms) clock. Each tick: moves airborne drones along their
  patrol loops (or back to base), random-walks telemetry within bounds, emits events, and pushes samples into
  bounded ring buffers. Mutable sim lives in a ref; a `commit()` builds an immutable render snapshot. Exposes
  `play/pause/toggle/setSpeed`. **Speed** runs N sub-steps per tick. Seeded → **identical on every reload at 1×**.
- **`data.ts`** — types, `STATUS_META`, the seeded 12-drone fleet (3 squadrons), patrol routes, ground station,
  Bay-area geography, helpers (`formatMissionClock`, etc.).
- **`Sparkline.tsx` / `Gauge.tsx`** — demo-local inline-SVG primitives (colour via `currentColor`).

Determinism caveat: the **drone data** is reproducible; the **map tiles** are network-served, so pixel-exact
map screenshots are not reproducible (the surrounding Blueprint UI still is).

## File map

| File | Purpose |
| --- | --- |
| `mission/prng.ts` | `mulberry32` seeded PRNG + `Rng` helper |
| `mission/data.ts` | Types, `STATUS_META`, seeded fleet/routes/station, geo + format helpers |
| `mission/stream/useStream.ts` | The clock + generators + ring buffers + play/pause/speed |
| `mission/MissionMap.tsx` | Demo-local MapLibre wrapper: sources/layers, clustering, arrows, trails, uplinks |
| `mission/Sparkline.tsx`, `mission/Gauge.tsx` | Inline-SVG viz primitives |
| `mission/FleetTree.tsx` | Left-rail controlled `Tree` (squadron→drone) with search filter |
| `mission/TelemetryPanel.tsx` | Right rail: gauges, sparklines, progress, callout, skeleton, fleet roll-up |
| `mission/EventFeed.tsx` | Bottom streaming event log |
| `mission/DroneDetail.tsx` | Drill-in `Drawer` + `PanelStack` + `Breadcrumbs` + `Tabs` |
| `mission/MissionControl.tsx` | Composition: navbar, layout, stream state, theming, toasts |
| `src/demos/registry.ts` | Added the `mission` entry |
| `README.md` | Mission Control entry in "Example apps" |

## Integration details / gotchas (hard-won this session)

- **MapLibre overrides `position`.** `maplibre-gl.css` sets `.maplibregl-map { position: relative }`, which beat
  our `absolute inset-0` utility → the container collapsed to **height 0** (map invisible, no errors). Fix: give
  the container an explicit `h-full w-full` (its wrapper has a definite flex height) and add a `ResizeObserver`
  that calls `map.resize()`. See `MissionMap.tsx` + the map wrapper in `MissionControl.tsx`.
- **Map controls bled through the portaled Drawer.** MapLibre's zoom control has `z-index: 2`, which lifted it
  into the **root** stacking context *above* the Drawer (whose `z-overlay` class computes to `auto`). Fix: add
  **`z-0`** to the map wrapper so the controls are confined to the map's own stacking context. (Did **not**
  touch the shared Drawer.)
- **PanelStack remounts its panel subtree when the panel object identity changes.** `PanelStack`/`PanelContent`
  memoizes a wrapper component on `[panel]`. Passing a fresh `PanelInfo` every tick (to show live data)
  remounted everything each second → the `Tabs` selection reset and any drill-in was wiped. Fix in
  `DroneDetail.tsx`: give the panels **stable identities** via `useMemo([droneId])` / `useMemo([droneId, sub])`
  and have their `renderPanel` read **live data from a ref** (`dataRef.current`) instead of closing over
  per-tick values. This is the inverse of the usual uncontrolled-PanelStack staleness — here the danger is
  *too-fresh* identities, not stale ones.
- **MapLibre `setStyle` drops custom sources/layers.** On dark/light toggle we `setStyle(...)` then re-run an
  idempotent `installLayers()` on the `styledata` event; interaction handlers are bound **once** on mount
  (they survive `setStyle`). Arrow icons are per-status canvas images registered via `map.addImage`.
- **Theming:** same pattern as SOC/Board — portaling components (`Popover`, `Tooltip`, `Drawer`, `Toaster`) take
  a `dark` prop threaded from `useDark()`; the map swaps CARTO positron ↔ dark-matter styles.
- **Tokens:** there is **no `bg-surface-hover`** — use `bg-[var(--interactive-hover)]` for row hover/selected.

## Verified this session (browser, both themes)

- Map renders in **light + dark**; drones move along routes; trails / clusters / base / **selection ring** all
  draw; dark toggle swaps the basemap and re-installs custom layers.
- Fleet `Tree` shows live status/battery; selecting a drone drives map + telemetry.
- Telemetry panel: gauges + four sparklines update live; anomaly `Callout`; patrol `ProgressBar`; `Skeleton` on
  first paint; fleet `CardList` roll-up when nothing selected.
- Event feed streams (caps at 60) and follows; **danger-event toasts** fire (saw the anomaly toast).
- Drawer drill-in: `Breadcrumbs` + `Tabs` (now **persist across ticks**); Subsystems `CardList` → `PanelStack`
  **push** to a subsystem panel with **back button**; pop returns to overview.
- Play/pause, 1×/2×/5× speed, Follow switch, search filter, identity menu.

## Next steps / ideas

- Still-uncovered components lean further structural/util: `HTMLTable` variants, `Slider` (a speed/altitude
  slider would fit here), `Hotkeys`, `Suggest`, `FileInput`. A **Settings / Admin** demo would absorb most.
- Optional polish for this demo: persist intra-route progress on pause/resume (already deterministic);
  a Slider for playback scrubbing; a heatmap/density layer (would justify the deck.gl-on-MapLibre upgrade path
  we discussed but declined for v1); per-drone "recall"/"launch" command buttons wired to the sim.
- Bundle note: `maplibre-gl` pushes the single JS chunk to ~2.4 MB (690 KB gzip). If this matters, code-split
  the demos behind dynamic `import()` (the Vite warning already suggests `manualChunks`).
