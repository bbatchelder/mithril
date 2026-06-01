# 0084 — P1.1 / DataTable Loop 2: row virtualization + scroll sync

- **Date:** 2026-06-01
- **Focus:** Loop 2 of 7 — virtualize the body with `@tanstack/react-virtual` so the grid handles
  thousands of rows; keep the header/gutter sticky with free horizontal scroll sync.
- **Branch:** `public-readiness` — not merged.

## Summary

`data-table/body.tsx` now windows rows with `useVirtualizer`: the body is a relative spacer of
`getTotalSize()` px and each visible row is absolutely positioned via `translateY(round(start))` (offsets
rounded to integers to avoid border-seam flicker). The `role="grid"` container is the scroll viewport
(a `useRef` passed down from `data-table.tsx`); a fixed `height` bounds it. Because the sticky header,
gutter, and body all live in that **one** scroll element, horizontal scroll syncs with zero JS. A 1,000-row
virtualized specimen was added to both galleries (`data-compare="data-table-virtual"`).

This is **Loop 2 of a 7-loop phase** (P1.1). Remaining: 3 selection, 4 resize/reorder, 5 editable cells,
6 keyboard nav + clipboard, 7 loading/multi-region/polish. Plan: `~/.claude/plans/snuggly-wibbling-clover.md`.

## Current state

- **Verified:**
  - `pnpm build` ✓ · `pnpm typecheck` ✓ · `pnpm test` **275 pass** (272 → 275; **3 new** virtualization
    tests: windowed subset for a tall dataset, body-spacer height == `count × rowHeight`, gutter still
    starts at 1). The Loop-1 tests still pass under virtualization (14 total in `data-table.test.tsx`).
  - **Visual** via `compare.sh data-table both`: `data-table-basic` unchanged (crop SSIM 0.957 light /
    0.936 dark — no regression). `data-table-virtual` (460×300) renders the correct **windowed 14 of 1,000
    rows** at scroll 0 with the sticky header — crop SSIM 0.646 light / 0.636 dark; the larger mismatch
    (~6–8%) is cumulative cross-engine text antialiasing over 14 visible rows (sub-perceptual; same nature
    as Loop 1, just more rows). The analyst full-page screenshot confirms virtualization works in a real
    (agent-)browser: 14 windowed rows out of 1,000, bottom row clipped, header pinned.
- **Registry:** regenerated — `data-table` now lists **both** `@tanstack/react-table` +
  `@tanstack/react-virtual` (the subdir scan picks up `body.tsx`'s new import). 67 items.

## Decisions made (and why)

- **Seed `initialRect` from the known viewport** (`{ width: 0, height: height ?? rows.length × rowHeight }`).
  Two wins: (1) **production** — the first paint renders the correct window with no empty-then-fill
  flicker, since a fixed-height grid's viewport *is* `height` and an auto-height grid shows all rows; the
  ResizeObserver corrects it once measured. (2) **testability** — jsdom has no layout and its (stubbed)
  ResizeObserver never measures, so without a seed the virtualizer renders 0 rows. **This was the Loop-2
  gotcha** (see below). It's the right fix, not a test hack — the viewport height is genuinely known.
- **One scroll container owns both axes** — header `sticky top-0`, gutter `sticky left-0`, corner both;
  the row virtualizer reads `scrollTop` from the same element. Horizontal scroll sync is therefore free
  (no dual-pane drift).
- **Round virtualizer offsets to integers** (`Math.round(virtualRow.start)`) — sub-pixel row offsets make
  the 1px inset cell borders shimmer/seam during scroll.
- **Column virtualization deferred** (not in this loop). Row virtualization covers the overwhelmingly
  common case; horizontal windowing with a sticky gutter + synced header is materially more complex and
  better as its own focused sub-loop. The `enableColumnVirtualization` prop is **not** added yet — add it
  when column virtualization lands. Documented so it isn't assumed present.

## Gotchas / things to know

- **`@tanstack/react-virtual` renders nothing in jsdom without a seeded viewport.** Root cause traced in
  `virtual-core`: `getSize()` returns `scrollRect ?? initialRect`'s height, and `calculateRange` bails when
  `outerSize <= 0`. `getRect()` reads the scroll element's **`offsetHeight`** (0 in jsdom), and the rect
  `ResizeObserver` never fires for an **ancestor** scroll element in jsdom (it fires for a same-component
  element — confirmed by isolating both structures). Fix: `initialRect` seeded from the `height` prop
  (above). The earlier attempt to stub `offsetHeight`/`getBoundingClientRect` did **not** work for the
  ancestor-ref case and was dropped — `initialRect` is the clean fix and needs no DOM stubs.
- **Live-Chrome verification was blocked by the same dev-server module-cache quirk documented in 0082:**
  the `:5173` dev server serves the latest bundle to agent-browser (so `compare.sh` screenshots are
  current and correct), but a persistent Chrome tab kept serving a stale module (showed the Button
  specimens for `?component=data-table`) across cache-bust queries and fresh tabs. The scroll-driven
  re-windowing therefore wasn't eyeballed by hand — but the agent-browser screenshot proves correct
  initial windowing (14/1,000), and scroll fires the *same* range computation. Worth one glance after a
  clean browser profile if convenient.
- **Sub-perceptual delta (carried from Loop 1):** the residual crop mismatch is cross-engine text
  antialiasing (React-18 reference vs React-19 analyst); the computed-style gate is clean apart from the
  `minWidth: auto vs 0px` Section-parent wrapper artifact.

## Next steps (Loop 3 — selection: row + cell + focused cell)

1. **`data-table/selection.ts`** — region types + a reducer (NOT TanStack's checkbox `rowSelection`):
   `SelectionRegion = {type:"cell"|"rows"|"columns", rows?, columns?}`; hit-testing + geometry from the
   virtualizer offsets + column x-positions.
2. **Overlay rendering in `body.tsx`** — absolutely-positioned translucent-blue region div(s) + a separate
   2px focused-cell outline div. Blueprint `.bp6-table-selection-region`: light fill `rgba(45,114,210,0.1)`
   + border `1px solid #2d72d2`; dark fill `rgba(76,144,240,0.1)` + `1px solid #4c90f0` (note: this is
   blue-3, NOT the text `--selection` token). Z-order: cells < fill < region-border < focused outline <
   sticky header/gutter.
3. **Handlers in `data-table.tsx`** — click → cell (focused outline); gutter click → row band; header click
   → column band; shift-click/drag → rectangular region. Controlled + uncontrolled `selection`
   (array-of-region shape from day one; single region unless `selectionMode="multi"` — multi deferred to
   Loop 7).
4. Tests: pure-function reducer tests on click/shift-click sequences (robust in jsdom).

## How to resume

```bash
cd /Users/bbatchelder/Code/analyst-ui
git switch public-readiness && git pull
pnpm install          # `pnpm install --force` if ERR_PNPM_IGNORED_BUILDS
pnpm build && pnpm test                       # green / 275
tools/compare.sh data-table both > /tmp/cmp.log 2>&1 ; grep -E 'data-table-(basic|virtual)' /tmp/cmp.log
```

- Changed: `src/components/ui/data-table.tsx` (scroll ref + `height`→body), `data-table/body.tsx`
  (virtualized), `__tests__/data-table.test.tsx` (+3), `src/App.tsx` + `tools/blueprint-reference/src/App.tsx`
  (virtual specimen), `registry.json`, this handoff, `docs/blueprint-parity-roadmap.md`.
- Plan: `~/.claude/plans/snuggly-wibbling-clover.md`.
