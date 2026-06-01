# 0088 — P1.1 / DataTable Loop 3: selection (cell · row · column · focused)

- **Date:** 2026-06-01
- **Focus:** Loop 3 of 7 — region selection with a translucent-blue overlay + focused-cell
  outline, matching Blueprint `Table2`. Click a cell, gutter (row band), or header (column
  band); shift-click or drag extends; controlled + uncontrolled.
- **Branch:** `public-readiness` — not merged.

## Summary

New `data-table/selection.ts` holds a **pure region reducer** (our own model, mirroring
Blueprint's `IRegion` — `{ rows: [a,b]|null, cols: [a,b]|null }`; `null` = full band) plus
geometry (`regionRect`) and predicates (`isCellSelected`/`isColumnSelected`/`isRowSelected`).
`data-table.tsx` derives its pointer handlers from the reducer and exposes controllable
`selection` / `focusedCell` (with `default*` + `on*Change`) and a `selectionMode` (`"single"`
default · `"none"`; `"multi"` deferred to Loop 7). `body.tsx` paints each region as an
absolutely-positioned translucent-blue `<div>` (fill + 1px border) **after** the rows at `z-10`
(translucent fill over transparent cells → grid lines show through, as in Blueprint) and the
focused cell as a separate 2px outline. `header.tsx` / `gutter.tsx` handle band clicks and the
selected-header/gutter tint.

This is **Loop 3 of the 7-loop P1.1 phase.** Remaining: 4 resize/reorder, 5 editable cells,
6 keyboard nav + clipboard, 7 loading/multi-region/polish.

## Blueprint fidelity (exact, from `@blueprintjs/table/lib/css/table.css`)

- `.bp6-table-selection-region` — fill `rgba(45,114,210,0.1)` + `1px solid #2d72d2` (light);
  dark `rgba(76,144,240,0.1)` + `1px solid #4c90f0`.
- `.bp6-table-focus-region` — `2px solid #2d72d2` (both themes — no dark override).
- header/gutter **selected** tint — `rgba(45,114,210,0.1)`, applied as a background-**image**
  gradient layered over the gray bg-color (Blueprint uses a `::before` overlay), NOT a bg-color
  swap (which would show the body surface through the translucent blue).

## Decisions

- **Own reducer, not TanStack `rowSelection`.** Blueprint-style rectangular *regions* (cell
  ranges / row+column bands / whole table) don't map to TanStack's checkbox row-selection. The
  reducer is pure → click/shift-click/drag sequences are unit-tested in jsdom (no layout).
- **Overlay under-rows-but-positioned (`z-10`).** Rows are `transform`ed (each its own stacking
  context); an overlay rendered after them with `z-10` paints above the cells, while the sticky
  header (`z-30`) stays above the overlay. Region rects always start at `x ≥ gutterWidth`, so the
  overlay never covers the gutter numbers.
- **Controllable via a tiny inline `useControllableState`** (no dep); the drag/shift **anchor** is
  internal-only (a ref), never controlled. Drag ends on a window `mouseup` (release-outside-grid
  still ends it). `selectionMode="none"` omits the handlers entirely.
- **Coords use the displayed row position** (`virtualRow.index`) and the leaf-column index —
  consistent with `aria-rowindex`/`aria-colindex`. (No sort/filter yet, so position == data index.)

## Verified

- `pnpm build` ✓ · `pnpm typecheck` ✓ · `pnpm test` **297 pass** (276 → 297; **+21**: 15
  pure reducer/geometry tests in `data-table-selection.test.ts` covering cell select, shift/drag
  range extension + normalization, row/column bands, predicates, and `regionRect`; 6 DOM tests in
  `data-table.test.tsx` — controlled `aria-selected`, click-to-select, gutter row, header column,
  shift-click range, `selectionMode="none"`).
- **Visual** via `compare.sh data-table both` — new `data-table-selection` specimen (controlled
  cell-range rows 1–2 × cols 1–2 + focused cell (1,1)): crop SSIM **0.967 light / 0.951 dark**
  (basic is 0.986 / 0.977; the small extra delta is the 1px region-border position + antialiasing —
  sub-perceptual). Eyeballed both themes: blue fill, region border, and 2px focused outline land on
  the right cells and match Blueprint. `data-table-basic` unchanged (0.986 / 0.977).
- **Registry** regenerated — `data-table` now lists `selection.ts` (67 items; no new npm deps —
  `selection.ts` imports only `./*`). 

## Gotchas

- The 2px focused outline / 1px region border sit ~1px off Blueprint in the dark diff crop — a
  sub-pixel border-position delta (box-border inside vs Blueprint's overlay edge), within the same
  documented cross-engine tolerance as the rest of the grid. Not chased.
- `data-table-virtual` stays ~0.64 SSIM (cumulative text antialiasing over 14 rows; see 0086/0087).
- `minWidth: auto vs 0px` computed-style item — Section-parent wrapper harness artifact (since Loop 1).

## Next steps (Loop 4 — column resize + reorder)

1. **Resize:** TanStack column sizing with `columnResizeMode:"onEnd"` (already set — avoids
   re-rendering every virtual row mid-drag). Add a ~5px header divider hit-target + a full-height
   blue **resize guide line** shown only while `columnSizingInfo.isResizingColumn`. Wire
   `enableResizing` per column → `onColumnWidthsChange`.
2. **Reorder:** `columnOrder` state + pointer-drag on the header with a drop indicator (no dnd dep —
   match Blueprint's simple drag). If reorder proves heavy, split to Loop 4b and document.
3. Tests: width-state update on a simulated resize; order-array mutation on reorder.

## How to resume

```bash
cd /Users/bbatchelder/Code/analyst-ui
git switch public-readiness && git pull
pnpm install
pnpm build && pnpm test                       # green / 297
tools/compare.sh data-table both > /tmp/cmp.log 2>&1 ; grep -E 'data-table-(basic|virtual|selection)' /tmp/cmp.log
```

- Changed: `data-table/selection.ts` (**new**), `data-table.tsx` (selection state/props/handlers +
  re-exports `SelectionRegion`/`CellCoord`), `data-table/body.tsx` (region + focus overlays, cell +
  gutter pointer wiring), `data-table/header.tsx` (column-band click + selected tint, select-all
  corner), `data-table/gutter.tsx` (row-band click + selected tint),
  `__tests__/data-table-selection.test.ts` (**new**, +15), `__tests__/data-table.test.tsx` (+6),
  `src/App.tsx` + `tools/blueprint-reference/src/App.tsx` (selection specimen), `registry.json`,
  `docs/blueprint-parity-roadmap.md`, this handoff.
- Plan: `~/.claude/plans/snuggly-wibbling-clover.md`.
