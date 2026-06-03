# Data — tables, trees, lists

> Seeded reference: the load-bearing patterns. Extend as you build more data-heavy UI.

## HTMLTable vs DataTable

- **`HTMLTable`** — a styled `<table>` (Blueprint metrics: `striped`, `interactive`, `bordered`).
  You own the markup: write your own `<thead>`/`<tbody>`, sorting, and row click. Best when the
  table is bespoke (custom cells, inline actions, row-detail drawers — see Sentinel SOC's
  `AlertTable`). Row actions: an icon `Button` in the last cell opening a `MenuPopover`; if rows
  are clickable, `stopPropagation` on the action trigger.
- **`DataTable`** — higher-level: column defs, built-in selection. Selection logic is unit-tested
  (`__tests__/data-table-selection.test.ts`). Reach for it when you want columns-as-config rather
  than hand-written rows.

## Tree

Radix-style roving focus. **Mental model:** `tabindex=0` is on the **group container** (the
tree/tablist role), and items rove at `-1`. Don't assert "the selected item has tabindex 0" — the
container holds the tab stop. Use `useTreeState` for expand/collapse + selection. Nodes take an
`icon`, `label`, `secondaryLabel`, and nested `childNodes`.

## Lists & structure

- **`CardList`** — a vertical list of rows in a bordered surface; pairs with `Section`/`SectionCard`.
- **`Section` / `SectionCard`** — titled, optionally collapsible content regions.
- **`OverflowList`** — measures and collapses overflowing items into a trailing affordance
  (uses `ResizeSensor`).

## Verifying

DataTable selection and table behavior have Vitest coverage; visual fidelity is checked via the
gallery / `tools/compare.sh`, not unit tests.
