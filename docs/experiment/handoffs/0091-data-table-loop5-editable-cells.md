# 0091 — P1.1 / DataTable Loop 5: editable cells

- **Date:** 2026-06-01
- **Focus:** Loop 5 — inline cell editing: double-click an `editable` cell to edit, Enter/blur
  commits, Esc reverts.
- **Branch:** `public-readiness` — not merged.

## Summary

Columns marked `editable` get inline editing. **Double-clicking** such a cell swaps its static value
for a new borderless `EditableCell` (`data-table/editable-cell.tsx`): an absolutely-positioned input
that fills the cell (`inset:0; padding:0 8px`), seeded with the value, auto-focused with the text
selected. **Enter or blur commits** via the new `onCellEdit` callback; **Esc reverts**. The editing
chrome is the Blueprint editing focus ring — the *same* `shadow-input-focus` token the InputGroup uses
on focus, which is byte-for-byte Blueprint's `.bp6-editable-text-editing` box-shadow in both themes.

The grid owns **which** cell is editing (`editingCell` state in `data-table.tsx`); the body renders
the editor for the matching cell and routes commit/cancel back up. The grid never mutates `data` —
the consumer applies the change in `onCellEdit` (the gallery specimen does exactly this with local
state). New public API: the column `editable` flag (already declared since Loop 1) is now wired, plus
`onCellEdit?: (edit: DataTableCellEdit) => void` where `DataTableCellEdit = { row, col, columnId, value }`.

This is **Loop 5 of the P1.1 phase.** Remaining: 6 keyboard nav + clipboard, 7 loading/multi-region/polish.

## Blueprint fidelity (verified against the CSS source + live computed styles)

From `@blueprintjs/table@6.1.1/lib/css/table.css` + `@blueprintjs/core` `blueprint.css`:
- `.bp6-table-editable-text` — `inset:0; padding:0 8px; position:absolute` (the editor fills the cell).
- `.bp6-editable-text.bp6-editable-text-editing::before` — `background-color:#fff` +
  `box-shadow: inset 0 0 0 1px rgba(33,93,176,.752), 0 0 0 1px rgba(33,93,176,.752), inset 0 1px 1px rgba(17,20,24,.2)`
  (light). Dark drops the inset-shadow term: `…rgba(138,187,255,.752)…`. **This is exactly the
  `--input-focus` token** (`tokens.css:268` light / `:376` dark) → the `shadow-input-focus` utility.
- With both editing- and selection-enabled, the cell cursor stays `cell` (selection-enabled rule wins
  by source order), so editable cells keep the Loop-3 crosshair — no cursor change was needed.

Live check (mithril gallery, editing open): the editor's computed `boxShadow` came back as
`rgba(33,93,176,0.753) 0 0 0 1px inset, rgba(33,93,176,0.753) 0 0 0 1px, rgba(17,20,24,0.2) 0 1px 1px inset`,
`backgroundColor rgb(255,255,255)`, `fontSize 12px`, `padding 8px/8px`, `position absolute`, rect
160×20, focused, selection `[0,13]` — i.e. the full Blueprint editing spec, verbatim.

## Decisions

- **Built `editable-cell.tsx`, did NOT reuse `editable-text.tsx`** (as the 0090 next-steps flagged):
  `EditableText` owns its own click-to-edit / confirm / cancel lifecycle, which fights the grid's
  "the grid decides which cell is editing" model. `EditableCell` is a thin, *always-editing* input —
  it mounts only when its cell is the editing cell, so the grid stays the single source of truth.
- **Double-click to start editing** (Blueprint's primary gesture). **Enter-to-edit on the focused
  cell is deferred to Loop 6** (keyboard nav) — the grid container isn't focusable yet, so there's no
  keydown to hang it off without half-wiring focus management. Within the editor, Enter/Esc already
  work. The 0090 note mentioned "double-click / Enter"; double-click is the complete Loop-5 path and
  Enter-to-edit lands naturally once the grid gains focus in Loop 6.
- **Commit on Enter or blur; revert on Esc.** A `doneRef` latch makes the blur that React fires when
  the editor unmounts (right after an Enter/Esc) a no-op, so a commit never double-fires.
- **`mousedown`/`keydown` stop-propagate** inside the editor so the grid's selection-drag and (future)
  keyboard-nav handlers don't react while you're typing.
- **Grid doesn't mutate `data`.** `onCellEdit` hands back `{ row, col, columnId, value }` (value is a
  string); the consumer owns the data. Keeps the component controlled-data-friendly and predictable.
- **`columnId` resolved from visual order** — `table.getVisibleLeafColumns()[col].id` — so an edit
  after a Loop-4b reorder still reports the right column id.

## Verified

- `pnpm build` ✓ · `pnpm typecheck` ✓ · `pnpm test` **306 → 311** (+5 in `data-table.test.tsx`):
  double-click an editable cell opens an input seeded with the value; a **non-editable** cell does
  not; **type + Enter** fires `onCellEdit` `{row:1,col:0,columnId:"name",value:"Bobby"}` and closes the
  editor; **blur** commits the draft; **Esc** reverts (no callback, editor closes, value unchanged).
- **Visual** `compare.sh data-table both` — new `data-table-editable` specimen **0.986 light / 0.977
  dark = identical to the `data-table-basic` baseline** (a resting editable grid is visually a basic
  grid; the editable columns render normally until edited). `basic` 0.986/0.977, `selection`
  0.967/0.951, `virtual` 0.642/0.644 — all **unchanged** from the Loop 4b baseline.
- The only computed-style diff is the pre-existing `minWidth: auto vs 0px` on the outer wrapper,
  present identically on every data-table specimen (not introduced here).
- `registry.json` regenerated — `editable-cell.tsx` now listed under `data-table` (deps unchanged:
  `["icon","utils","tokens"]`).

## Gotchas

- **Editing is an interaction state — the harness only screenshots at rest**, so the editable
  specimen's crop equals the basic grid's. Editing-state fidelity was confirmed by reading the live
  computed `boxShadow`/padding/bg off the open editor and matching them to the Blueprint CSS source
  (above), not by a crop diff.
- **Blueprint's `EditableCell2` does not respond to synthetic `dblclick`** dispatched from the console
  (its own React event wiring differs) — the same persistent-tab flakiness noted in 0082/0084. Our
  editor *does* open from a synthetic dblclick (React `onDoubleClick`), so the mithril side was
  verifiable live; the Blueprint side was verified from its stylesheet instead.
- The reference specimen wraps `EditableCell2` in a small stateful `EditableDataTableReference` so
  `onConfirm` edits persist (Blueprint needs a controlled `value`). Name + Role are editable there,
  matching the mithril specimen.
- `EditableCell` imports `alignClass` from `./gutter` (same as `body.tsx`) so editing text aligns with
  resting text (right-aligned numeric columns, etc.). Age in the specimen is intentionally **not**
  editable, so no alignment edge case ships, but the support is there.

## Next steps (Loop 6 — keyboard navigation + clipboard)

Arrow keys move the focused cell; Tab/Shift-Tab + Enter/Shift-Enter advance; **Enter/F2 on the focused
cell starts editing** (the deferred half of this loop) and Enter-while-editing commits + moves down;
Cmd/Ctrl-C copies the selected region as TSV. The grid container becomes focusable (`tabIndex`) with a
keydown dispatcher; mind the resting-state focus outline vs the compare crop (use `focus-visible` /
`outline-none` so a click-focused grid doesn't regress the screenshot). Wire Enter-to-edit through
`setEditingCell(focusedCell)` when that column is `editable`.

## How to resume

```bash
cd /Users/bbatchelder/Code/mithril
git switch public-readiness && git pull
CI=true pnpm install
CI=true pnpm build && CI=true pnpm test         # green / 311
tools/compare.sh data-table both > /tmp/cmp.log 2>&1 ; grep -E 'data-table-' /tmp/cmp.log
```

- **New:** `src/components/ui/data-table/editable-cell.tsx` (the inline editor).
- **Changed:** `data-table.tsx` (`onCellEdit` + `DataTableCellEdit` types, `editingCell` state,
  `handleCellDoubleClick`/`handleCellEditCommit`/`handleCellEditCancel`, props threaded to the body),
  `data-table/body.tsx` (editing props, per-cell `isEditing` branch rendering `EditableCell`,
  `relative` on the cell so the editor fills it, `onDoubleClick` on editable cells),
  `__tests__/data-table.test.tsx` (+5), `src/App.tsx` + `tools/blueprint-reference/src/App.tsx`
  (`data-table-editable` specimen on both sides), `registry.json` (regen),
  `docs/blueprint-parity-roadmap.md` (Loop 5 ticked), this handoff.
- **`pnpm install` note:** this session started with `node_modules` out of sync with the lockfile;
  pnpm wanted to purge it but can't prompt without a TTY. Run installs/tests with `CI=true` (or set
  `confirmModulesPurge=false`) until that's resolved.
