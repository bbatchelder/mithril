# 0089 — P1.1 / DataTable Loop 4: column resize (reorder → Loop 4b)

- **Date:** 2026-06-01
- **Focus:** Loop 4 — drag a column's right edge to resize it, with Blueprint's handle + guide
  visuals. **Reorder is split to Loop 4b** (the plan's documented escape hatch — it's materially
  more complex: reorder handle, drag drop-indicator, `columnOrder` state).
- **Branch:** `public-readiness` — not merged.

## Summary

Each resizable column header gets a 4px `ew-resize` hit-target on its right edge (hidden until
hover/drag) containing a 3px `#2d72d2` line, wired to TanStack's `header.getResizeHandler()`. With
`columnResizeMode:"onEnd"` (already set since Loop 1) the real column widths stay frozen during the
drag — instead a **full-height 3px blue guide line** tracks the projected new edge
(`columnSizingInfo.deltaOffset`), and the width commits on release. A `fixed` `ew-resize` cursor
overlay keeps the cursor consistent mid-drag. New table prop `enableColumnResizing` (default
`false`) makes every column resizable; per-column `enableResizing` overrides it.

This is **Loop 4 of the 7(+1)-loop P1.1 phase.** Remaining: 4b reorder, 5 editable cells,
6 keyboard nav + clipboard, 7 loading/multi-region/polish.

## Blueprint fidelity (from `@blueprintjs/table/lib/css/table.css`, verified)

- `.bp6-table-resize-handle-target.bp6-table-resize-vertical` — `width:4px`, `right:0`, `top:0`,
  `cursor:ew-resize`, `opacity:0` → `1` on `:hover` / `.bp6-table-dragging`.
- `.bp6-table-resize-handle` — `background:#2d72d2`; the vertical handle is `width:3px` at `left:2px`.
- `.bp6-table-vertical-guide` — `background:#2d72d2`, `width:3px`, `margin-left:-3px` (right edge at
  the drag x), full height (`top:0; bottom:0`).

## Decisions

- **`onEnd` resize mode** (not `onChange`) — the whole point under virtualization: re-laying out
  every windowed row on each mousemove is wasteful and janky. The guide gives live feedback while the
  grid stays still; one commit on mouseup. `columnSizingInfo.deltaOffset` updates each move (cheap
  re-render of just the guide).
- **`stopPropagation` on the handle's mousedown** — the header cell already has an `onMouseDown` for
  column-band selection (Loop 3); without this, grabbing the handle would also select the column.
  (Tested.)
- **Guide rendered in the inner sizer** (made `relative`) so it scrolls horizontally with the content
  and spans the full header+body height via `inset-y-0`.
- **Resize splits from reorder.** Resize is a clean, complete, valuable loop on its own; reorder needs
  a separate interaction model (drag the header body, drop-indicator, `columnOrder`) and is better as
  its own focused loop (4b) than bolted on here. Plan explicitly permits this.

## Verified

- `pnpm build` ✓ · `pnpm typecheck` ✓ · `pnpm test` **297 → 301** (+4 resize tests in
  `data-table.test.tsx`): handles render only when enabled (+ per-column opt-out); **dragging a
  handle commits the new width on mouseup** (150 → 220) and **mid-drag shows the guide at the
  projected edge (left 247px) + the cursor overlay**, with widths frozen until release; grabbing the
  handle does **not** select the column. (jsdom runs the real `getResizeHandler` path — `onEnd` mode
  commits from the mouse-*up* clientX, so the test passes clientX on mouseUp.)
- **Visual** `compare.sh data-table both` — `basic` 0.986/0.977, `selection` 0.967/0.951, `virtual`
  0.642/0.644: **unchanged** from Loop 3. The resize handles are `opacity:0` at rest, so the at-rest
  screenshots are identical (matches Blueprint, whose handles are also hidden until hover).
- **Live** (agent-browser): all 4 column handles render with `cursor:ew-resize` and the 3px blue
  line. The synthetic-event *drag* didn't start the resize in a persistent Chrome tab — the
  documented stale-module / synthetic-event quirk (handoffs 0082/0084), NOT a code bug: jsdom
  exercises the same code path and commits + renders the guide correctly.

## Gotchas

- **`onEnd` commits from the mouse-UP position**, not the last mousemove. A resize test must pass
  `clientX` to `fireEvent.mouseUp` or the commit computes a huge negative delta and clamps to
  `minSize`. (Cost me the first test run.)
- The fixed `ew-resize` cursor overlay is gated on `columnSizingInfo.isResizingColumn`, which TanStack
  clears on mouseup — so it can't get stuck.
- `data-table-virtual` stays ~0.64 SSIM (text antialiasing over 14 rows; see 0086/0087).
- `minWidth: auto vs 0px` computed-style item — Section-parent wrapper harness artifact (since Loop 1).

## Next steps (Loop 4b — column reorder)

1. Drag the header body (not the resize handle) to reorder → TanStack `columnOrder` state +
   `onColumnOrderChange`. Add a `reorder handle` affordance and a **drop indicator** line at the
   target slot; a `grabbing` cursor overlay during drag (Blueprint `.bp6-table-reordering`).
2. Reconcile with selection: a header *click* selects the column (Loop 3); a header *drag* reorders.
   Distinguish by drag threshold, or gate reorder behind an explicit handle (Blueprint uses a handle).
3. Tests: `columnOrder` array mutation on a simulated reorder; click-still-selects.

## How to resume

```bash
cd /Users/bbatchelder/Code/analyst-ui
git switch public-readiness && git pull
pnpm install
pnpm build && pnpm test                       # green / 301
tools/compare.sh data-table both > /tmp/cmp.log 2>&1 ; grep -E 'data-table-' /tmp/cmp.log
```

- Changed: `data-table.tsx` (`enableColumnResizing` prop, `toColumnDef` default, resize-guide
  computation + guide/cursor-overlay JSX, inner sizer `relative`), `data-table/header.tsx` (resize
  handle + header cell `relative`), `__tests__/data-table.test.tsx` (+4), `src/App.tsx` (basic +
  virtual specimens set `enableColumnResizing`), `docs/blueprint-parity-roadmap.md`, this handoff.
- Plan: `~/.claude/plans/snuggly-wibbling-clover.md`.
