# 0090 — P1.1 / DataTable Loop 4b: column reorder

- **Date:** 2026-06-01
- **Focus:** Loop 4b — drag a header's reorder handle to reorder columns, with Blueprint's
  handle glyph + drop-guide visuals.
- **Branch:** `public-readiness` — not merged.

## Summary

Each column header (when `enableColumnReordering`) gets a Blueprint-faithful **reorder handle** on
its left edge: a 22px grab-cursor zone (`.bp6-table-reorder-handle-target`) holding the
`DragHandleVertical` glyph, with the header **name indented 22px** to make room
(`.bp6-table-has-reorder-handle` overrides the base 8px left padding). Grabbing the handle and
dragging starts a reorder: a **3px blue drop guide** (the same `.bp6-table-vertical-guide` as resize)
marks the slot the column will land in, a `fixed` `cursor-grabbing` overlay keeps the cursor
consistent, and the new order **commits on release** via TanStack's `columnOrder` state. New props:
`enableColumnReordering` (default `false`) + controllable `columnOrder` / `defaultColumnOrder` /
`onColumnOrderChange`. The moved column stays selected at its new index after a drop.

This is **Loop 4b of the P1.1 phase.** Remaining: 5 editable cells, 6 keyboard nav + clipboard,
7 loading/multi-region/polish.

## The key fidelity correction (don't repeat my mistake)

I first built reorder as **whole-header drag-to-reorder with a drag threshold** (no at-rest
affordance), reasoning that Blueprint's default `Table2` shows only a `cursor:grab` and no visible
handle — which keeps the at-rest screenshot identical. **That was wrong.** Blueprint's `Table2` with
`enableColumnReordering` (even *without* the interaction bar) renders a **visible
`DragHandleVertical` handle** in every header and indents the name 22px. At the harness's 460px scale
the dotted glyph was easy to miss in the standalone screenshot; the *diff* crop (header text ghosted
~22px) and the user's full-size screenshot made it unambiguous. The fix was to **match the handle**:
once the handle + the exact `pl-[22px]` name indent were in, `data-table-basic` went from a regressed
0.935/0.928 back to the **baseline 0.986/0.977** — pixel-identical to Blueprint.

Lesson: when enabling a Blueprint feature flag changes its rendering, *match the new rendering* — and
read the diff crop, not just the standalone, at small scales.

## Blueprint fidelity (from `@blueprintjs/table@6.1.1/lib/css/table.css`, verified)

- `.bp6-table-reorder-handle-target` — `position:absolute; left:0; top:0; bottom:0; width:22px`,
  `display:flex; align-items:center; justify-content:center`, `cursor:grab` → `:active grabbing`,
  `color: rgba(95,107,124,0.6)` light / `rgba(171,179,191,0.6)` dark; `:hover` `#1c2127`/`#f6f7f9`;
  `:active` `#2d72d2` (both). Holds `.bp6-table-reorder-handle` → `<DragHandleVertical>` (16px).
- `.bp6-table-column-header-cell.bp6-table-has-reorder-handle:not(.has-interaction-bar)
  .bp6-table-column-name-text` — `padding-left:22px` (overrides the base `padding:0 8px`).
- Drop guide during reorder = the **same** `.bp6-table-vertical-guide` (3px `#2d72d2`) as resize;
  the reordering cursor overlay is `cursor:grabbing`.

## Decisions

- **Handle, not whole-header drag.** With a visible handle, grabbing the handle reorders and the
  header *body* still does Loop-3 column selection — clean separation, no drag-threshold ambiguity,
  and pixel-faithful. (Blueprint's whole-header-grab + "sole-selection" gating only applies in its
  *handle-less* mode, which this version of `Table2` doesn't use for reordering.) The handle's
  `mousedown` `stopPropagation`s so a grab never also selects the column.
- **`columnOrder` via TanStack state.** Reorder commits a full reordered id list to the controllable
  `columnOrder`; `getHeaderGroups()`/`getVisibleLeafColumns()` already respect it, so header+body
  re-lay-out for free. Drag uses *visual* indices (consistent with selection + body geometry).
- **`onEnd`-style commit.** Like resize, the grid stays still during the drag — only the cheap guide
  re-renders on mousemove — and the order commits once on mouseup. Drop slot = first column whose
  centre is right of the cursor (insertion index `0..colCount`); a target right of the source
  collapses by one after removal.
- **Drag tracked in a ref**, document `mousemove`/`mouseup` listeners attached on handle-grab and
  removed on release; a `reorderGuideX` state drives the guide + grabbing overlay render. A grab that
  never crosses the 5px threshold is a no-op (no order change, no selection change).
- **Registry import path.** `header.tsx` now depends on the `icon` component. It lives in the
  `data-table/` subdir, so it imports via **`@/components/ui/icon` / `@/components/ui/icons`**, NOT
  `../icon` — `gen-registry.mjs` filters subfile specifiers starting with `.` (line 133), so a `../`
  import would be silently dropped and `icon` would be missing from the registry deps. The `@/…` form
  matches the bare-name regex and is captured. `registry.json` now lists `icon` for `data-table`.

## Verified

- `pnpm build` ✓ · `pnpm typecheck` ✓ · `pnpm test` **302 → 306** (+4 reorder tests in
  `data-table.test.tsx`): handle renders per column only when enabled; **dragging a handle past the
  threshold reorders the columns on release** (Name → end ⇒ order `["age","role","name"]`, headers
  `["Age","Role","Name"]`, moved col selected at its new index) with the guide + grabbing overlay
  shown mid-drag; **grabbing a handle does not select the column**; a sub-threshold grab leaves the
  order unchanged. (jsdom runs the real reorder path — `getSize()` + a 0-left sizer rect make the
  drop-slot math deterministic from `clientX`.)
- **Visual** `compare.sh data-table both` — `basic` **0.986/0.977**, `selection` 0.967/0.951,
  `virtual` 0.642/0.644: **basic identical to the Loop 4 baseline** (handle + indent are pixel-exact
  vs Blueprint), selection/virtual unchanged. The analyst gallery now shows the dotted handles on the
  Basic-grid headers, matching Blueprint's reference 1:1.
- `registry.json` regenerated — `data-table.registryDependencies` now `["icon","utils","tokens"]`.

## Gotchas

- **Reorder enabled on BOTH galleries' `basic` specimen only** (analyst `src/App.tsx` +
  `tools/blueprint-reference/src/App.tsx`). `virtual`/`selection` keep it off on both sides so their
  crops stay matched. Enabling it on Blueprint is what surfaced the handle.
- The drop guide centres a 3px line on the slot boundary (`left: guideX - 1`); the resize guide puts
  its right edge at the cursor (`left: x - 3`). Different anchoring on purpose.
- `data-table-virtual` stays ~0.64 SSIM (text antialiasing over 14 rows; see 0086/0087) — unchanged.
- Live synthetic-event drag in a persistent Chrome tab is still flaky (the documented stale-module
  quirk, handoffs 0082/0084) — jsdom exercises the same reorder commit path and the compare harness
  confirms the handles render, so this is not a code issue.

## Next steps (Loop 5 — editable cells)

Per-column `editable`: double-click / Enter on the focused cell → inline borderless input seeded with
the value → Enter/blur commits (`onCellEdit`), Esc reverts. Build a small `editable-cell.tsx` on
`input-group.tsx`'s borderless-input + focus-ring pattern; **do NOT reuse `editable-text.tsx`** (its
focus lifecycle fights the grid's focused-cell model). Tests (user-event): dbl-click → seeded input;
type+Enter → callback; Esc → revert.

## How to resume

```bash
cd /Users/bbatchelder/Code/analyst-ui
git switch public-readiness && git pull
pnpm install
pnpm build && pnpm test                       # green / 306
tools/compare.sh data-table both > /tmp/cmp.log 2>&1 ; grep -E 'data-table-' /tmp/cmp.log
```

- Changed: `data-table.tsx` (`enableColumnReordering` + `columnOrder`/`defaultColumnOrder`/
  `onColumnOrderChange` props, `columnOrder` controllable state wired into `useReactTable`,
  `handleReorderStart` drag logic, reorder drop-guide + grabbing-overlay JSX), `data-table/header.tsx`
  (reorder handle + `DragHandleVertical` glyph + `pl-[22px]` name indent, `@/components/ui/icon`
  import), `__tests__/data-table.test.tsx` (+4), `src/App.tsx` + `tools/blueprint-reference/src/App.tsx`
  (basic specimen `enableColumnReordering`), `registry.json` (regen), `docs/blueprint-parity-roadmap.md`,
  this handoff.
- Plan: `~/.claude/plans/snuggly-wibbling-clover.md`.
