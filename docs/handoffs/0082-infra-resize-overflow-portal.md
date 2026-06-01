# 0082 — P1.3: promote infra (ResizeSensor, OverflowList, Portal)

- **Date:** 2026-05-31
- **Focus:** Build the three privately-inlined/missing behavioral helpers as standalone, exported,
  registered, tested components — the last P1.3 item (finishes Phase B except the data grid).
- **Branch:** `public-readiness` — not merged.

## Summary

Three new components in `src/components/ui/`, all faithful to Blueprint's API but re-expressed in the
modern function/hook idiom the rest of the library uses:

- **`resize-sensor.tsx`** — `ResizeSensor` (wraps a single element child, observes it with a
  `ResizeObserver`, fires `onResize`; supports `observeParents` + `targetRef`) **plus** the underlying
  `useResizeObserver(ref, onResize, { observeParents })` hook. The component clones its child to inject a
  merged ref (React-19-correct: reads the child's ref from `props`, not the deprecated `element.ref`).
- **`overflow-list.tsx`** — `OverflowList<T>`: renders a horizontal list that collapses items into an
  overflow renderer ("+N" menu/label) when they don't fit. Blueprint's binary-search **repartition**
  algorithm (a 1px flex spacer + `ResizeSensor`, halving `chopSize` until it settles) ported from the
  class component to a function component driven by `useState` + `useLayoutEffect`. Modern API: a string
  `collapseFrom: "start" | "end"` instead of the `Boundary` enum. Props: `items`, `visibleItemRenderer`,
  `overflowRenderer`, `collapseFrom`, `minVisibleItems`, `alwaysRenderOverflow`, `observeParents`,
  `onOverflow`, `tagName`, `navigable`/`navigationAriaLabel`.
- **`portal.tsx`** — `Portal` (detaches children into a container `<div>` on `document.body` by default;
  `container`, `className`, `onChildrenMount`) **plus** `PortalProvider` + `PortalContext` for subtree-wide
  container/className defaults. The deprecated `stopPropagationEvents` prop is dropped (no-op since React 17).

`OverflowList` is built on `ResizeSensor` (registry dependency captured automatically).

## Design notes / deltas from Blueprint

- **Class → hooks.** `ResizeSensor` and `OverflowList` are Blueprint class components; both are function
  components here. The repartition state machine maps cleanly: `useLayoutEffect` (runs after every commit)
  measures the spacer and either `setState`s the next binary-search step (→ re-render → effect again) or
  finalizes and fires `onOverflow` — mirroring Blueprint's `componentDidMount`/`componentDidUpdate` flow.
- **Reset triggers.** Blueprint resets the partition when *any* of items/collapseFrom/minVisibleItems/
  alwaysRenderOverflow **or the two renderer function identities** change. We deliberately **exclude the
  renderer identities** (they're called fresh each render anyway) — so passing inline renderers doesn't
  cause an infinite reset loop, a footgun in a naive port. Documented in the source. (Pass a **stable**
  `items` array — identity change forces a recompute, same as Blueprint.)
- **`Boundary` → `"start" | "end"`** string union (Blueprint's `Boundary.START`/`END` are literally these
  strings, so behavior is identical).

## What shipped

- New: `resize-sensor.tsx`, `overflow-list.tsx`, `portal.tsx` + three test files (`__tests__/`).
- `src/App.tsx`: imports + `ResizeSensorGallery`/`OverflowListGallery`/`PortalGallery`, three `COMPONENTS`
  entries, and a new **"Infrastructure"** sidebar category (so they're discoverable, not dumped in "Other").
- `registry.json` regenerated — 66 items now: `resize-sensor` (→ tokens), `overflow-list`
  (→ resize-sensor, utils, tokens), `portal` (→ utils, tokens).

## Verified

- `pnpm build` ✓ · `pnpm typecheck` ✓ · `pnpm test` **261 pass** (240 → 261; **21 new**):
  - `resize-sensor` (6): renders child, observes it, fires `onResize`, latest-callback-without-resubscribe,
    `observeParents` observes ancestors, preserves a caller ref.
  - `overflow-list` (7): full collapse at 0 width, `minVisibleItems` from each `collapseFrom` end,
    `onOverflow` on settle, no overflow element when it fits (mocked positive width), `alwaysRenderOverflow`,
    `navigable` `<nav>`. (jsdom reports `offsetWidth=0`, so the collapse is deterministic to assert; the
    same `repartition` runs at mount, so the algorithm is exercised without a live `ResizeObserver`.)
  - `portal` (8 incl. axe): mounts into body + custom container + provider container, `className`,
    `onChildrenMount`, container removed on unmount, explicit `container` overrides provider.

## Caveat / note for next session

- **Live-browser visual confirmation of OverflowList was blocked by a dev-server module cache quirk**, not
  a code issue. After adding the gallery entries, the running vite dev server *served* the updated
  `/src/App.tsx` (verified via `curl` — all three ids present), but Chrome kept serving a cached older
  module across server restart, hard reload (⌘⇧R), cache-bust query, and a fresh tab — so `?component=
  overflow-list` fell back to the combined view. The component logic is covered by the 21 unit tests +
  green build; **a manual `?component=overflow-list` check after a clean browser/profile is worth one
  glance** to eyeball the live resize-driven collapse (the one path jsdom can't exercise: `ResizeObserver`
  firing → `repartition`, whose wiring is covered transitively by the ResizeSensor observer→callback test).
- **Not added to the Blueprint-reference gallery / no `compare.sh` run.** Per `docs/ROADMAP.md` (infra are
  "behavioral helpers, not standalone fidelity targets") and because OverflowList's pixels are
  consumer-rendered chips (not the component), the gate here is behavior tests, not pixel diff.
- A fresh `pnpm dev` was left running on :5173 (and the compare-started :5174). Kill if undesired.

## Next steps (updated priorities)

Phase B is now complete **except the data grid**. Remaining, roughly in order:

1. **P1.1 — the data grid** (`DataTable`) — the big multi-loop feature lever (virtualized rows/cols,
   selection, resize/reorder, editable cells, keyboard nav). Scope as its own phase.
2. **P2.5/P2.6/P2.7** — token derivation, `@supports` fallbacks, `color-scheme` dark parity.
3. Quick win carried over from 0081: the README a11y "known limitations" are stale (Tabs/Select-family/
   Hotkeys all landed in P0.2/P0.3) — a focused accuracy pass.

## How to resume

```bash
cd /Users/bbatchelder/Code/analyst-ui
git switch public-readiness && git pull
pnpm build && pnpm test          # green / 261
# new infra:
#   import { ResizeSensor, useResizeObserver } from "@/components/ui/resize-sensor"
#   import { OverflowList } from "@/components/ui/overflow-list"
#   import { Portal, PortalProvider } from "@/components/ui/portal"
```

- New files: `resize-sensor.tsx`, `overflow-list.tsx`, `portal.tsx`, their three `__tests__/*.test.tsx`,
  `docs/handoffs/0082-infra-resize-overflow-portal.md`. Modified: `src/App.tsx`, `registry.json`,
  `docs/blueprint-parity-roadmap.md`. New deps: **none**.
