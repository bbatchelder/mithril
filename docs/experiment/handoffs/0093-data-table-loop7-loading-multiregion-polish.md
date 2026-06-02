# 0093 — P1.1 / DataTable Loop 7: loading + multi-region + polish + docs (phase complete)

- **Date:** 2026-06-01
- **Focus:** Loop 7 (final) — loading/skeleton state, multi-region selection, keyboard polish
  (Home/End/PageUp/PageDown), and a usage doc section. **P1.1 is now done (7/7 loops).**
- **Branch:** `public-readiness` — not merged.

## Summary

The grid gains the last of the `Table2`-parity features:

- **Loading state** — a `loading?: boolean` prop. Every body cell, column header, and gutter cell
  swaps its value for a Blueprint-spec **skeleton bar** (body/gutter 4px = `h-1`, header 8px =
  `h-2`), reusing the existing `Skeleton` primitive. Loading cells go `flex flex-col justify-center
  text-transparent` so the bar centers vertically over the cell surface; selection/edit affordances
  (double-click, resize/reorder handles) are suppressed while loading. The chrome + column sizes are
  preserved, so the grid keeps its shape while data streams in.
- **Multi-region selection** — `selectionMode="multi"`. **Cmd/Ctrl-click** adds a fresh region (the
  reducer's pre-existing `additive` flag); Shift still extends the active region (Shift wins if both
  are held). The pointer handlers now forward `e.metaKey || e.ctrlKey` from cell/gutter/header
  mousedown. **Clipboard copy serializes every region** via a new pure `regionsToTSV` helper
  (per-region TSV blocks joined by a blank line). Keyboard nav always collapses to a single region.
- **Keyboard polish** — `Home`/`End` jump to the row's first/last column; with **Cmd/Ctrl** they
  jump to the grid's top-left / bottom-right corner. `PageUp`/`PageDown` move by a viewport of rows
  (`floor((clientHeight − 30px header) / rowHeight)`, ≥1). All respect Shift to extend from the
  anchor. `moveFocus` was refactored to delegate to a shared `applyFocus(r, c, extend)` core that
  Home/End/Page reuse for absolute positioning.
- **Docs** — a `DataTableUsage` section at the bottom of the mithril gallery (quick-start code +
  keyboard cheatsheet); `skeleton` added to the data-table registry deps.

This is **Loop 7 of 7 — the DataTable / P1.1 phase is complete.**

## Decisions

- **Loading bars are deterministic full-width; Blueprint's are random.** Blueprint's `LoadableContent`
  (used by `Cell loading`) renders the skeleton at a **`Math.random()`-driven 25–75% width**
  (`variableLength`), re-rolled every mount — so an exact pixel diff of the loading state is
  *impossible by design*. We chose clean, deterministic **full-width** bars (the standard modern
  skeleton look, and testable). Consequence: the loading specimen is **visual-only (no `data-compare`)**
  in both galleries — the `Skeleton` primitive's own fidelity is already gated by `skeleton-box` /
  `skeleton-line` (1.000), and the loading cell is just that primitive in a flex cell.
- **`regionsToTSV` is a thin pure wrapper over `regionToTSV`.** A single-region list (the only case in
  `single` mode) yields *exactly* the old string (no separators), so single-mode copy is byte-for-byte
  unchanged; multi-mode joins region blocks with a blank line. Pure ⇒ unit-tested directly.
- **Multi is pointer-only; keyboard always collapses to one region** (matching Blueprint) — so the
  focused cell stays unambiguous and `applyFocus` only ever writes `[region]`.
- **`applyFocus` extracted from `moveFocus`.** `moveFocus` computes a delta + wrap then calls
  `applyFocus`; Home/End/Page compute absolute targets and call it directly. One clamp/region/scroll
  path, three callers.
- **PageDown defaults to 1 row when the viewport is unmeasured** (`clientHeight` 0 in jsdom / an
  auto-height grid) — `pageRows()` is `max(1, …)`, so the key never no-ops.

## Verified

- `pnpm build` ✓ · `pnpm typecheck` ✓ · `pnpm test` **325 → 337** (+12): 2 `regionsToTSV` cases
  (single-region == `regionToTSV`; multi joins with a blank line); 3 loading cases (skeletons replace
  cell+header values, values return when not loading, no edit-on-double-click while loading); 3
  multi-region cases (Cmd-click adds in multi / replaces in single; Cmd-C copies all regions
  blank-line-separated); 4 keyboard-extent cases (End/Home, Cmd+End/Home corners, Shift+End extends,
  PageDown/PageUp by a stubbed 70px page).
- **Visual** `compare.sh data-table both` — `data-table-multi` **0.976 light / 0.947 dark**, on par
  with `data-table-selection` (0.974/0.951); basic/editable unchanged (0.993/0.977); `data-table-virtual`
  is the known **0.641/0.644** text-antialiasing delta (handoffs 0086/0087), pre-existing. Multi crop
  eyeballed: region `{0,0}` + region `{2,3}×{2,3}` with the focused cell on `Manager` — pixel-identical
  to Blueprint's two-region + `focusedCell` render.
- **Loading** eyeballed in both themes (visual-only): full-width bars centered in cells/headers/gutter,
  chrome + column widths preserved.

## Gotchas

- **A keyed loading diff is a trap.** Blueprint re-randomizes its loading-bar widths every render, so
  any SSIM gate on it fluctuates run-to-run (we saw 0.80–0.89). Keep loading visual-only.
- **The `:not(.bp6-loading)` dark rule is about *text color*, not background.** Dark loading cells are
  still transparent over the `#2f343c` body surface (same as non-loading) — the early "background
  mismatch" hypothesis was wrong; the real gap was full-width vs random-width bars.
- **`pageRows()` reads `clientHeight` live at keydown.** An auto-height grid (`clientHeight` = full
  content) makes a "page" the whole grid → PageDown jumps to the last row. That's reasonable; document
  if it surprises.
- Multi-mode `additive` is gated on `selectionMode === "multi"` *inside* the handlers, so a Cmd-click in
  single mode is a plain replace (asserted) — the reducer never sees `additive: true` outside multi.

## Next steps (P1.1 phase wrap-up)

- **Open the phase PR** and merge `public-readiness` → `main` (per the autonomous-loop policy). Note
  this branch was *not* cut as `phase-N-<slug>` — it bundles the public-readiness work; confirm the
  intended merge target before opening the PR.
- The next roadmap item is the first unchecked box after P1.1 in `docs/blueprint-parity-roadmap.md`.
- **Optional later polish:** column virtualization (Loop 2 deferred it); `aria-activedescendant`;
  revisit the `data-table-virtual` ~0.64 SSIM if a real antialiasing fix surfaces.

## How to resume

```bash
cd /Users/bbatchelder/Code/mithril
git switch public-readiness && git pull
CI=true pnpm install
CI=true pnpm build && CI=true pnpm test         # green / 337
tools/compare.sh data-table both > /tmp/cmp.log 2>&1 ; grep -E 'data-table-' /tmp/cmp.log
```

- **Changed:** `data-table.tsx` (`loading` prop, `"multi"` selection mode + additive handlers,
  `applyFocus`/`moveToExtent`/`pageRows`, Home/End/PageUp/PageDown keys, `copySelection` → all
  regions), `data-table/body.tsx` (loading skeleton cells + additive mousedown), `data-table/header.tsx`
  (loading header skeleton + additive + suppressed handles), `data-table/gutter.tsx` (loading gutter
  skeleton + additive), `data-table/selection.ts` (pure `regionsToTSV`), `App.tsx` + reference
  `App.tsx` (loading **visual-only** + `data-table-multi` keyed specimens + usage section / Blueprint
  `TableLoadingOption` import), `registry.json` (data-table → `skeleton` dep),
  `__tests__/data-table.test.tsx` (+12), `docs/blueprint-parity-roadmap.md` (Loop 7 ticked, P1.1 ✅),
  this handoff.
- **No new files / no registry-entry change** beyond adding the `skeleton` dependency.
- **`pnpm install` note:** still run installs/tests with `CI=true` (see 0091).
