# 0049 — Suggest (Phase 5 #3)

- **Date:** 2026-05-26
- **Focus:** Build Suggest (typeahead: InputGroup trigger + QueryList + Popover + Menu) to Blueprint v6.15 fidelity, both light and dark themes. Third component of Phase 5.
- **Branch / commit:** phase-5-selects @ (see commit SHA)

## Summary

Built `src/components/ui/suggest.tsx` exporting `Suggest<T>` (generic typeahead input). Reuses
`useQueryList<T>` from `select.tsx` — the same filtering/keyboard-nav/active-item engine.
Registered in both galleries under `id="suggest"`. The blueprint-reference gallery uses
`@blueprintjs/select`'s `Suggest` component. Verified with `tools/compare.sh suggest both`.

Also extended `useQueryList` in `select.tsx` to accept `initialActiveItem?: T | null` — this
allows Suggest to initialize the active item to the `selectedItem` on mount, matching Blueprint's
`initialActiveItem = selectedItem` behavior.

- **Light:** 4 match · 0 differ
- **Dark:** 4 match · 0 differ

**Phase 5 item 3 of 5 — Suggest COMPLETE.**

## API

### Suggest

```tsx
const [selected, setSelected] = useState<string | null>(null);

<Suggest<string>
    items={["Apple", "Banana", "Cherry"]}
    itemPredicate={(q, item) => item.toLowerCase().includes(q.toLowerCase())}
    inputValueRenderer={(item) => item}
    itemRenderer={(item, { modifiers, handleClick }) => (
        <MenuItem
            key={item}
            text={item}
            active={modifiers.active}
            icon={item === selected ? "tick" : undefined}
            onClick={handleClick}
        />
    )}
    selectedItem={selected}
    onItemSelect={setSelected}
    dark={dark}
    fill
/>
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `items` | `T[]` | — | All items. |
| `itemRenderer` | `(item, props) => ReactNode` | — | Render each item (typically as MenuItem). |
| `inputValueRenderer` | `(item) => string` | — | Transform selected item to input string. |
| `itemPredicate` | `(q, item, index) => boolean` | — | Per-item filter. |
| `itemListPredicate` | `(q, items) => T[]` | — | Whole-list filter. |
| `onItemSelect` | `(item, e?) => void` | — | Called on selection. |
| `selectedItem` | `T \| null` | — | Currently selected item (controlled). |
| `defaultSelectedItem` | `T` | — | Initial selected item (uncontrolled). |
| `activeItem` | `T \| null` | — | Controlled keyboard-active item. |
| `onActiveItemChange` | `(item) => void` | — | Called when active item changes. |
| `query` | `string` | — | Controlled filter query. |
| `onQueryChange` | `(q) => void` | — | Called when query changes. |
| `closeOnSelect` | `boolean` | `true` | Close popover after selection. |
| `resetOnClose` | `boolean` | `false` | Reset query + active when popover closes. |
| `openOnKeyDown` | `boolean` | `false` | Open popover on keydown (not focus). |
| `fill` | `boolean` | `false` | Make input full-width. |
| `disabled` | `boolean` | `false` | Disable the component. |
| `noResults` | `ReactNode` | `null` | Shown when no items match. |
| `inputProps` | `InputGroupProps (no value/onChange/disabled/fill)` | — | Extra props for input. |
| `popoverProps` | `PopoverProps (no content/children)` | — | Extra props for the Popover. |
| `itemDisabled` | `keyof T \| (item, index) => boolean` | — | Disable specific items. |
| `dark` | `boolean` | `false` | Required for dark portal mode. |
| `className` | `string` | — | Added to the menu inside popover. |

## Blueprint metrics matched

| Property | Value | Source |
|---|---|---|
| Popover placement | `bottom-start` (minimal, no arrow) | Blueprint default |
| Menu max-height | `300px` | `$select-popover-max-height = $pt-spacing * 75` |
| Menu max-width | `400px` | `$select-popover-max-width = $pt-spacing * 100` |
| Menu overflow | `auto` (scrollable) | `_suggest.scss` |
| Menu min-width | `0` (overrides Menu's 180px) | popover width sets width |
| Input value when open | Shows selected item text (not placeholder) | Blueprint combobox behavior |
| Initial active item | `selectedItem` (not first item) | Blueprint: `initialActiveItem = selectedItem` |
| No caret button | Plain InputGroup, no rightElement | Blueprint Suggest has no caret button |
| No filter inside popover | Menu is direct child of popover content | Select has filter input; Suggest does not |

## Design decisions

- **No caret button**: Blueprint's Suggest has no caret/dropdown button in the InputGroup.
  The input is a plain text input — clicking focuses and types. This matches Blueprint's design.
  If a caret is desired in the consumer's app, they can pass it via `inputProps.rightElement`.

- **initialActiveItem in useQueryList**: Added `initialActiveItem?: T | null` to `UseQueryListOptions`.
  When provided and in the filtered list, the active item starts at this value instead of the
  first enabled item. Suggest passes `selectedItem` as `initialActiveItem` to match Blueprint's
  `initialActiveItem = selectedItem` behavior in QueryList.

- **Input value when popover is open**: When the popover is open and query is empty (no user typing
  yet), the input shows the `selectedItem` text as the VALUE (not placeholder). This matches Blueprint's
  rendering where the input shows "Cherry" as solid foreground text when the popover is force-opened
  in gallery mode with `selectedItem="Cherry"` and empty query.

- **Gallery tagging approach**: `suggest-input` is stamped via `useEffect` targeting the
  `.suggest-gallery-wrapper input[0]` (the first input inside the wrapper, which is the open Suggest).
  This avoids stamping `data-compare` in the component itself which would pick up the disabled instance.
  `suggest-menu` IS tagged in the component via `data-compare="suggest-menu"` (there's only one
  portaled menu since only one Suggest is open at a time).

- **Active item for comparison**: Both galleries show Cherry (index 2) as `suggest-item-active`
  (it's the selected item and thus the initial active item), and Apple (index 0) as `suggest-item`
  (non-active). This was initially incorrect; fixed by aligning the `initialActiveItem` logic.

- **No roleStructure="listoption"**: Blueprint's reference gallery does NOT use `roleStructure="listoption"`
  on MenuItems for the Suggest comparison. This avoids the `paddingLeft: 20px` indent that `roleStructure`
  adds via `.bp6-menu-item-is-selectable`, making both sides have `paddingLeft: 8px` for clean comparison.

- **popoverProps.open for gallery mode**: Same pattern as Select — pass `popoverProps={{ open: true, onOpenChange: () => {} }}` to force the popover open in gallery mode for static screenshots.

## Portal + dark-mode notes

- Same pattern as Select/Popover: `dark` prop is passed to Popover which wraps portal children
  in `<div className="dark">` so dark utilities apply to portaled menu content.
- Reference gallery passes `popoverProps={{ portalClassName: Classes.DARK, matchTargetWidth: true }}` 
  when `theme=dark` so Blueprint's portaled Suggest menu also renders in dark mode.
- Menu component has built-in `text-foreground` so portaled content inherits correct color.

## Accepted deltas

- **`only in mithril: popover-content`**: Radix's portaled popover wrapper element has
  `data-compare="popover-content"` from the Popover component's own `data-compare`. It has no
  Blueprint counterpart and is simply ignored by the diff.

## compare.sh results

```
suggest · light:  4 match · 0 differ
suggest · dark:   4 match · 0 differ
```

**data-compare keys paired (both themes):**
- `suggest-input` — MATCH (input: height, bg, boxShadow, color, paddingLeft/Right all match)
- `suggest-menu` — MATCH (menu ul: height, bg, padding, border-radius all match)
- `suggest-item` — MATCH (Apple non-active item: padding, color, bg, height all match)
- `suggest-item-active` — MATCH (Cherry highlighted active+selected item: blue bg, color, height all match)

Screenshot confirmation (light + dark):
- Input shows "Cherry" as solid foreground text (selected item value, not placeholder)
- Cherry is highlighted blue in both themes (active item = selected item)
- Apple is the non-active first item with normal styling
- Cherry shows tick icon indicating selected state
- All items have correct 30px height and 8px horizontal padding
- Dark theme is properly dark — menu bg matches Blueprint dark (dark-gray-3)
- Popover has correct shadow and border-radius

## New dependencies added

None. `@blueprintjs/select` was already installed in `tools/blueprint-reference/` from Select (Phase 5 #2).

## Post-commit fix: matchTargetWidth on Popover (2026-05-26)

After the initial commit, a follow-up fix was applied to close the visual fidelity gap where
Suggest's dropdown was narrower than the input trigger.

**Fix:** Added `matchTargetWidth?: boolean` prop to `src/components/ui/popover.tsx`. When `true`,
the Popover content element gets `style={{ width: "var(--radix-popover-trigger-width)" }}` — a
runtime inline style using Radix's CSS variable (set by Radix Floating UI on the content/positioner
element). This is intentionally an inline style (not a Tailwind class) because it's a runtime layout
value, not a tree-shakeable design token.

Suggest passes `matchTargetWidth` (defaulting true) to its Popover, matching Blueprint's
`matchTargetWidth` default on Suggest. The prop is opt-in and does NOT affect Select, Tooltip,
or the base Popover component (no regressions).

`compare.sh suggest both` confirmed: 4 match · 0 differ in both themes. Select, Popover, and Tooltip
regression checks all stayed at their pre-existing counts.

## Changes to existing files

- **`src/components/ui/select.tsx`**: Added `initialActiveItem?: T | null` to `UseQueryListOptions`.
  Used by `useQueryList` to initialize the active item to a specific item on mount (instead of always
  defaulting to the first enabled item). Priority: controlled `activeItem` > `initialActiveItem` > first enabled.

## Current state

- **Suggest:** Implemented and verified — `tools/compare.sh suggest both`.
- **Build:** `pnpm build` green (tsc + vite).
- **Phase 5:** 3/5 COMPLETE. TagInput ✓, Select ✓, Suggest ✓

## Next steps

> Next action: **MultiSelect** (Phase 5 #4) on branch `phase-5-selects`.
>
> 1. Build `src/components/ui/multi-select.tsx` — REUSE `useQueryList` from select.tsx.
>    MultiSelect = TagInput + QueryList + Popover + Menu.
>    The trigger is a TagInput showing the selected items as tags.
>    Multiple items can be selected; clicking an item adds it; a tag's × button removes it.
>    Blueprint: `@blueprintjs/select`'s `MultiSelect` component.
> 2. Register in both galleries under `id="multi-select"`.
>    Reference gallery: `import { MultiSelect as BpMultiSelect } from "@blueprintjs/select"`.
> 3. Run `tools/compare.sh multi-select both`.
> 4. Commit + push.

## How to resume

```bash
git branch --show-current  # should be phase-5-selects
pnpm dev                                              # :5173
cd tools/blueprint-reference && pnpm dev              # :5174

tools/compare.sh suggest both     # re-verify
```

- Relevant files:
  - `src/components/ui/suggest.tsx` (new — Suggest component)
  - `src/components/ui/select.tsx` (modified: added `initialActiveItem` to UseQueryListOptions + useQueryList)
  - `src/App.tsx` (SuggestGallery added + Suggest import)
  - `tools/blueprint-reference/src/App.tsx` (SuggestGallery added + BpSuggest import)
  - `docs/ROADMAP.md` (Suggest checked)
  - `docs/handoffs/0049-suggest.md` (this file)
