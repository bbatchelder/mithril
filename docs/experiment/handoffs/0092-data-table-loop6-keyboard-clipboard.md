# 0092 — P1.1 / DataTable Loop 6: keyboard navigation + clipboard

- **Date:** 2026-06-01
- **Focus:** Loop 6 — make the grid keyboard-driveable (arrow/Tab/Enter cell navigation, edit
  shortcuts) and add Cmd/Ctrl-C → TSV clipboard copy.
- **Branch:** `public-readiness` — not merged.

## Summary

The grid container (the scroll viewport, already the `role="grid"` element) is now **focusable**
(`tabIndex={0}` when selectable) and owns a keydown dispatcher:

- **Arrows** move the focused cell and collapse the selection to that single cell; **Shift+Arrow**
  grows the active region from the anchor (the anchor is the cell where the last non-extend move
  landed). Movement clamps at the grid edges.
- **Tab / Shift+Tab** move horizontally and **wrap** at a row edge into the next/previous row.
- **Enter / Shift+Enter** move vertically; but on an **editable** focused cell, **Enter or F2 starts
  editing** instead (the deferred half of Loop 5).
- A keyboard **edit commit advances** the focused cell spreadsheet-style: Enter→down, Shift+Enter→up,
  Tab→right, Shift+Tab→left (a blur commits in place). Esc cancels. After any edit ends, focus
  returns to the grid so navigation continues.
- **Cmd/Ctrl-C** copies the active region as **TSV** (tab-separated columns, newline-separated rows)
  via the async Clipboard API, with a hidden-textarea `execCommand` fallback.
- The focused cell is **scrolled into view** in the virtualized grid (math accounts for the 30px
  sticky header).

The first keystroke when nothing is focused anchors at the top-left cell `{0,0}` (it does **not**
apply the delta), matching Blueprint.

This is **Loop 6 of 7.** Remaining: 7 loading/skeleton + multi-region + polish + docs.

## Decisions

- **Focusable container, cell shows the indicator.** The grid div gets `tabIndex` + `outline-none`;
  the *focused cell's* 2px outline is the visible affordance (Blueprint suppresses the container's own
  ring the same way). `outline-none` keeps the resting compare crop identical — verified, SSIM
  unchanged (0.993/0.977 basic, 0.974/0.951 selection). Clicking a cell focuses the grid (tabindex
  ancestor), so pointer- and keyboard-driving compose.
- **Keyboard nav reuses the selection model but bypasses the pointer reducer for Shift-extend.**
  Plain moves dispatch a single-cell region + move the anchor; Shift-extend builds the region inline
  from `anchorRef` to the new cell **and** moves the focused cell to the growing edge (the pointer
  reducer's `extendActive` keeps focus at the anchor — right for drag, wrong for keyboard, where the
  focus *is* the moving end). Kept the reducer untouched so its 15 unit tests stay valid.
- **`regionToTSV` is a pure, exported helper** in `selection.ts` `(region, rowCount, colCount,
  getValue) → string`; the grid supplies `getValue` from TanStack (`row.getValue(colId)`). Null/
  undefined → empty field; a `null` rows/cols range (band / whole-table) expands to all rows/cols.
  Pure ⇒ unit-tested directly (4 tests) without touching the clipboard.
- **Copy targets the active (last) region.** Single-mode grids have one region; multi-region copy is
  a Loop-7 concern. The clipboard write is best-effort and never throws.
- **Edit lifecycle threads a `move` direction.** `EditableCell.onCommit(value, move?)` reports the
  key that committed; `handleCellEditCommit` fires `onCellEdit`, refocuses the grid, then advances.
- **Enter on a non-editable cell moves down** (spreadsheet feel); only editable cells intercept Enter
  for editing.

## Verified

- `pnpm build` ✓ · `pnpm typecheck` ✓ · `pnpm test` **311 → 325** (+14): grid focusable only when
  selectable; arrows move + clamp; Shift+Arrow extends from the anchor; Tab wraps at a row edge;
  first-keystroke anchors at `{0,0}`; Enter/F2 start editing on an editable cell; Enter on a
  non-editable cell moves down; an Enter-commit advances focus down; Cmd/Ctrl-C writes the expected
  TSV (spied `navigator.clipboard.writeText`); plus 4 pure `regionToTSV` cases.
- **Visual** `compare.sh data-table both` — **unchanged** vs Loop 5 (0.993/0.977 basic + editable,
  0.974/0.951 selection, 0.641/0.644 virtual). `tabIndex`/`outline-none` don't touch the resting crop.
- **Live (mithril gallery):** ArrowDown→ArrowRight from Alice selects Bob's age (`{1,1}`); Shift+ArrowUp
  extends to the two age cells; Ctrl+C copied `"34\n29"`; in the 1,000-row grid, holding ArrowDown
  drove the focus to "Person 17" and scrolled the viewport to `scrollTop 70` — exactly the computed
  scroll-into-view value for row 16 (`30 + 16·20 + 20 − 300`).

## Gotchas

- **Synthetic keydowns need a tick between them.** Firing N keydowns in a tight JS loop (no await)
  reuses one stale `focusedCell` closure — all N compute the same next cell, so focus only advances
  once. Real keypresses re-render between events; jsdom tests fire one assert per key; a live multi-key
  drive must `await` a frame between dispatches (a CDP `Runtime.evaluate` may also time out mid-loop —
  the loop still runs; re-read state after).
- **Editor keys stop-propagate**, so the grid's keydown never double-handles Enter/Tab/Esc while
  editing; the grid handler also early-returns when `editingCell` is set, belt-and-suspenders.
- **Scroll-into-view assumes the sticky header is 30px** (`COLUMN_HEADER_HEIGHT`) and rows are a fixed
  `rowHeight`. Auto-height grids (no `height`) have `clientHeight` = full content, so the math no-ops.
- **No Home/End/PageUp/PageDown yet** — arrows/Tab/Enter cover the roadmap's "keyboard navigation";
  page/extent keys are easy follow-ups for Loop 7 polish if wanted.
- `aria-activedescendant` is not wired (the focused cell is conveyed via the single-cell selection +
  outline, not an id reference). Fine for the visual/keyboard contract; revisit if deepening a11y.

## Next steps (Loop 7 — loading + multi-region + polish + docs)

- **Loading state:** a `loading` prop → skeleton cells (Blueprint `.bp6-table-cell.bp6-loading` +
  `.bp6-skeleton`). Reuse the `skeleton` component's shimmer.
- **Multi-region selection:** `selectionMode="multi"` — Cmd/Ctrl-click adds a region (the reducer's
  `additive` flag already exists); copy should then serialize multiple regions.
- **Polish:** Home/End/PageUp/PageDown; maybe `aria-activedescendant`; revisit the `data-table-virtual`
  ~0.64 SSIM (text antialiasing over 14 rows — see 0086/0087) if a real fix surfaces.
- **Docs:** a usage section in the gallery / README for the DataTable public API now that it's feature-complete.

## How to resume

```bash
cd /Users/bbatchelder/Code/mithril
git switch public-readiness && git pull
CI=true pnpm install
CI=true pnpm build && CI=true pnpm test         # green / 325
tools/compare.sh data-table both > /tmp/cmp.log 2>&1 ; grep -E 'data-table-' /tmp/cmp.log
```

- **Changed:** `data-table.tsx` (focusable grid + `handleKeyDown`, `moveFocus`, `copySelection`,
  `scrollRowIntoView`, `focusGrid`, `isColEditable`; edit-commit now advances focus), `data-table/
  editable-cell.tsx` (`EditCommitMove` type, Enter/Tab commit with direction), `data-table/body.tsx`
  (thread `move` through `onCellEditCommit`), `data-table/selection.ts` (pure `regionToTSV`),
  `__tests__/data-table.test.tsx` (+14), `docs/blueprint-parity-roadmap.md` (Loop 6 ticked), this handoff.
- **No new files / no registry change** — Loop 6 is all edits to existing data-table modules.
- **`pnpm install` note:** still run installs/tests with `CI=true` (node_modules vs lockfile purge
  needs a TTY otherwise — see 0091).
