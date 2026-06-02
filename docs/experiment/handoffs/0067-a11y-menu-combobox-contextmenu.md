# 0067 — a11y pass #2: Menu roleStructure, combobox family, ContextMenu on Radix

- **Date:** 2026-05-29
- **Branch:** `a11y-behavior-gaps` (continues from 0066)
- **Focus:** Close the rest of `comparison-vs-blueprint.md` §1 / [[a11y-gaps-vs-blueprint]] except the
  small attribute fixes: the **Menu role contract**, the **whole combobox family** (Select, Suggest,
  MultiSelect, Omnibar), and **ContextMenu** keyboard nav. Decisions were made with the user:
  combobox = hand-roll WAI-ARIA on the existing `useQueryList` (no new dep, since Radix has no combobox
  primitive); ContextMenu = render real Radix items.

## TL;DR

- **MenuItem `roleStructure`** (`menuitem` | `listoption` | `none`) ports Blueprint's role contract.
  `listoption` makes the `<li>` a `role="option"` with `aria-selected`; the Menu container `role` is
  overridable to `listbox`.
- **Combobox family** now implements the full WAI-ARIA combobox pattern on `useQueryList`: input
  `role="combobox"` (+ `aria-expanded/controls/activedescendant/autocomplete/haspopup`), Menu
  `role="listbox"` (+ `aria-multiselectable` for MultiSelect), options `role="option"` with stable ids
  and `aria-selected` — injected via `cloneElement` so **consumer itemRenderers are untouched**.
- **ContextMenu** feeds the consumer's `<Menu>`/`<MenuItem>` through a **Radix `ContextMenu.Item` slot**
  (injected by context), so Radix now provides arrow-key nav, typeahead, and Escape — without changing
  the `content={<Menu>…</Menu>}` API.
- **40 tests** total (24 new this pass). All `compare.sh` targets unchanged vs baseline (ARIA/role only).

## Why hand-rolled comboboxes (not a Radix/cmdk rebuild)
Radix has **no combobox/listbox/autocomplete primitive** (its `Select` is a native-select replacement,
not a filterable combobox). A menu is the wrong semantics for an autocomplete. The repo already owns the
filtering + active-index state machine (`useQueryList`) across all four components, so the gap was purely
ARIA + input keyboard — additive, lower-risk, fully testable. (This is the one place we *don't* lean on a
primitive, by deliberate decision — the premise "a good primitive exists" fails here.)

## Menu (`menu.tsx`)
- `MenuItem` gains `roleStructure` + `selected`. `[liRole, targetRole, ariaSelected]`:
  listoption → `["option", undefined, Boolean(selected)]`; none → `["none", undefined, undefined]`;
  menuitem (default) → `["none", "menuitem", undefined]`.
- Menu `role` is overridable (consumers pass `role="listbox"`).
- **Slot mechanism for parent menu systems:** `MenuItemSlotContext` + `MenuItemSlot`/`MenuItemSlotProps`.
  When a slot is provided, MenuItem renders its interactive element *through* the slot, and the Menu `<ul>`
  becomes `role="none"` (the parent's Content is the menu). Only ContextMenu sets it; everywhere else it's
  null and MenuItem renders its own `<button>`/`<a>` exactly as before. Keeps `menu.tsx` decoupled from
  `@radix-ui/react-context-menu` (the slot component is injected, not imported).

## Combobox family (`select.tsx`, `suggest.tsx`, `multi-select.tsx`, `omnibar.tsx`)
Each: `useId()` listbox id + `optionId(i)`; input combobox attrs; Menu `role="listbox"` + id; options
injected with `{ id, roleStructure: "listoption", selected }` via `cloneElement`. `aria-activedescendant`
tracks the highlighted option (focus stays in the input — the correct model the existing keyboard handler
already used). The first option is pre-highlighted on open (Select/Omnibar). MultiSelect listbox is
`aria-multiselectable`; Omnibar options carry no `selected` (command palette, no persistent selection).

## ContextMenu (`context-menu.tsx`)
`RadixMenuItemSlot` renders `RadixContextMenu.Item` (className/disabled/textValue/onSelect/data-compare)
and is provided via `MenuItemSlotContext.Provider` around `content`. Result: one `role="menu"` (Radix
Content), items `role="menuitem"` (Radix Items, divider auto-skipped), full keyboard nav + typeahead.
Visuals identical to baseline (item height 30 unchanged; div-vs-button verified by stash).

## Tests (`src/components/ui/__tests__/`)
menu (6), select (5), suggest (3), multi-select (2), omnibar (3), context-menu (3) — plus tabs (17) and
smoke (1) from 0066 = **40**. Notes for future test authors:
- Radix popovers set `pointer-events:none` on ancestors → use `userEvent.setup({ pointerEventsCheck: 0 })`
  or `fireEvent`, and click an option's inner control, not the `<li>`.
- Suggest/MultiSelect open on **focus**; a click while focused toggles them shut. Use `el.focus()` then
  `await screen.findByRole("listbox")`. Typing into Suggest's derived-value input needs `user.type`, not
  `user.keyboard`. Plain-controlled inputs (Select/Omnibar) filter fine with `user.keyboard`.
- Clicking a portaled option in jsdom races the blur-close (multi-select) — assert `aria-selected` with
  controlled `selectedItems` instead.

## Verification
- `pnpm test` → **40 passed**; `pnpm build` ✓; `pnpm typecheck:test` ✓.
- `compare.sh` menu 7·0, select 5·0, suggest 4·0, multi-select (pre-existing tag-margin diff only),
  omnibar (pre-existing panel-shadow diff only), context-menu 2·0 — all **identical to baseline** (every
  remaining delta pre-dates this pass; verified by stashing).

## Commits on this branch
`001b785` Menu roleStructure + Select combobox · `786ebed` Suggest/MultiSelect/Omnibar combobox ·
(this) ContextMenu Radix items + handoff. (Earlier: `1142448` Tabs + test foundation.)

## Next steps — remaining a11y (the small ones)
Only the smaller attribute fixes from §1 remain:
1. **NumericInput** — `role="spinbutton"` + `aria-valuenow/min/max/valuetext` on the input.
2. **Alert** — `role="alertdialog"` (currently `role="dialog"`).
3. **Popover** — optional hover interaction mode (Radix is click-only).

After those, update [[a11y-gaps-vs-blueprint]] to reflect what's now accessible, and consider opening the
PR for `a11y-behavior-gaps` → `public-readiness`.
