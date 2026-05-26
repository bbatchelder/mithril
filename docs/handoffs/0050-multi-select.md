# 0050 — MultiSelect (Phase 5 #4)

- **Date:** 2026-05-26
- **Focus:** Build MultiSelect (TagInput chips + QueryList popover) to Blueprint v6.15 fidelity,
  both light and dark themes. Fourth component of Phase 5.
- **Branch / commit:** phase-5-selects @ (see commit SHA)

## Summary

Built `src/components/ui/multi-select.tsx` exporting `MultiSelect<T>` (generic multi-select
with chip trigger + filterable menu). Reuses `useQueryList<T>` from `select.tsx` — the same
filtering/keyboard-nav/active-item engine. Registered in both galleries under `id="multi-select"`.
The blueprint-reference gallery uses `@blueprintjs/select`'s `MultiSelect` component.
Verified with `tools/compare.sh multi-select both`.

- **Light:** 4 match · 1 differ (accepted delta: chip marginRight gap-vs-margin)
- **Dark:** 4 match · 1 differ (accepted delta: chip marginRight gap-vs-margin)

**Phase 5 item 4 of 5 — MultiSelect COMPLETE.**

## API

### MultiSelect

```tsx
const [selected, setSelected] = useState<string[]>(["Banana", "Cherry"]);

<MultiSelect<string>
    items={["Apple", "Banana", "Cherry", "Durian"]}
    selectedItems={selected}
    tagRenderer={(item) => item}
    itemPredicate={(q, item) => item.toLowerCase().includes(q.toLowerCase())}
    itemRenderer={(item, { modifiers, handleClick }) => (
        <MenuItem
            key={item}
            text={item}
            active={modifiers.active}
            icon={selected.includes(item) ? "tick" : undefined}
            onClick={handleClick}
        />
    )}
    onItemSelect={(item) => {
        if (!selected.includes(item)) setSelected((s) => [...s, item]);
    }}
    onRemove={(_item, index) => setSelected((s) => s.filter((_, i) => i !== index))}
    dark={dark}
    fill
/>
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `items` | `T[]` | — | All items. |
| `selectedItems` | `T[]` | — | Currently selected items (controlled). |
| `itemRenderer` | `(item, props) => ReactNode` | — | Render each item in the menu (typically as MenuItem). |
| `tagRenderer` | `(item) => ReactNode` | — | Render each selected item as a chip. |
| `itemPredicate` | `(q, item, index) => boolean` | — | Per-item filter. |
| `itemListPredicate` | `(q, items) => T[]` | — | Whole-list filter. |
| `onItemSelect` | `(item, e?) => void` | — | Called when an item is selected from the menu. |
| `onRemove` | `(item, index) => void` | — | Called when a chip is removed (× button or Backspace). |
| `activeItem` | `T \| null` | — | Controlled keyboard-active item. |
| `onActiveItemChange` | `(item) => void` | — | Called when active item changes. |
| `query` | `string` | — | Controlled filter query. |
| `onQueryChange` | `(q) => void` | — | Called when query changes. |
| `placeholder` | `string` | `"Search..."` | Ghost input placeholder (shown when no chips). |
| `fill` | `boolean` | `false` | Make trigger full-width. |
| `disabled` | `boolean` | `false` | Disable the component. |
| `intent` | `"none"\|"primary"\|...` | `"none"` | Container border/focus intent. |
| `noResults` | `ReactNode` | `null` | Shown when no items match. |
| `popoverProps` | `PopoverProps (no content/children)` | — | Extra props for the Popover. |
| `tagProps` | `TagProps \| (item, index) => TagProps` | — | Extra props for each chip. |
| `itemDisabled` | `keyof T \| (item, index) => boolean` | — | Disable specific items. |
| `leftIcon` | `IconName` | — | Icon on the left side of the container. |
| `dark` | `boolean` | `false` | Required for dark portal mode. |
| `className` | `string` | — | Added to the container. |
| `menuClassName` | `string` | — | Added to the menu inside popover. |
| `data-compare` | `string` | — | Internal: data-compare key on the container (for harness). |

## Blueprint metrics matched

| Property | Value | Source |
|---|---|---|
| Trigger container | TagInput-like (same styling) | Blueprint `MultiSelect → TagInput` |
| Min-width | 150px | Blueprint `.bp6-multi-select { min-width: 150px }` |
| Min-height | 30px | Blueprint TagInput medium height |
| Popover placement | `bottom-start` (minimal, no arrow) | Blueprint MultiSelect default |
| matchTargetWidth | `true` | Blueprint `matchTargetWidth: true` default for MultiSelect |
| Menu max-height | 300px | `$pt-spacing * 75 = 300px` |
| Menu max-width | 400px | `$pt-spacing * 100 = 400px` |
| Menu overflow | `auto` (scrollable) | Blueprint select scss |
| Menu margin | `-4px` left/right | Blueprint select-popover: 4px padding + menu -4px margin |
| Popover content wrapper | 4px padding (`p-1`) | Blueprint `.bp6-select-popover .bp6-popover-content` |
| Selected item mark | tick icon in menu | Blueprint marks selected items via itemRenderer |
| Backspace on empty | removes last chip | Blueprint MultiSelect behavior |

## Design decisions

- **Reuses `useQueryList`**: The same filtering/keyboard-nav engine from `select.tsx` powers
  MultiSelect. `resetOnSelect: true` clears the ghost input after each selection, which opens
  the menu to the full unfiltered list immediately after selection.

- **Container is the Popover trigger**: The TagInput-like container div serves as the Radix
  Popover trigger (`asChild`). Container click focuses the ghost input. Input focus opens the
  popover. This matches Blueprint's behavior where clicking the tag-input area opens the
  dropdown.

- **`data-compare` prop for gallery isolation**: Since MultiSelectGallery renders two instances
  (open comparison + disabled), the `data-compare` prop is passed explicitly to only the
  open (comparison) instance. This prevents the harness from accidentally capturing the
  disabled instance's computed styles.

- **Popover content wrapped in `p-1` div**: To match Blueprint's `-4px` margin on the menu,
  the popover content is a `div` with `p-1` (4px padding), and the menu has `-mx-1`
  (matching the Select pattern). This produces the correct `marginLeft: -4px` / `marginRight: -4px`
  on the menu element, matching Blueprint's style exactly.

- **KeyDown handling moved to popover content div**: Unlike Select (where the filter input
  handles keydown + propagates to querylist), MultiSelect's ghost input handles most key events
  itself. The `ql.handleKeyDown` is also attached to the popover content div for completeness
  when focus is in the menu area.

- **Gallery tagging**: `multi-select-item-active` is Apple (index 0, first enabled item =
  active by default). `multi-select-item` is Durian (index 3, non-active, non-selected).
  `multi-select-menu` is tagged via `data-compare` on the Menu component directly (portaled).
  `multi-select-container` and `multi-select-tag` are tagged via `data-compare` props passed
  from the gallery to the component.

## Portal + dark-mode notes

- Same pattern as Select/Suggest/Popover: `dark` prop wraps portal children in `<div className="dark">`.
- Reference gallery passes `popoverProps={{ portalClassName: Classes.DARK, isOpen: true, ... }}`
  when `theme=dark` so Blueprint's portaled MultiSelect menu renders in dark mode.
- Dark screenshots confirm: dark bg menu, dark container, properly colored chips.

## Accepted deltas

- **`multi-select-tag marginRight: 0px vs 4px`**: Blueprint's Tag chips inside MultiSelect
  have explicit `margin-right: 4px`. Our implementation uses `gap-1` (CSS Gap, 4px) on the
  flex container — same visual spacing, different implementation property. This is the standard
  gap-vs-margin delta (identical in appearance). **ACCEPTED**.

- **`only in analyst: popover-content`**: Radix's portaled popover wrapper element has
  `data-compare="popover-content"` from the Popover component. It has no Blueprint counterpart
  and is simply ignored by the diff. **ACCEPTED** (same as Select/Suggest).

## compare.sh results

```
multi-select · light:  4 match · 1 differ (accepted delta: marginRight gap-vs-margin)
multi-select · dark:   4 match · 1 differ (accepted delta: marginRight gap-vs-margin)
```

**data-compare keys paired (both themes):**
- `multi-select-container` — MATCH (trigger container: bg, shadow, min-width, height all match)
- `multi-select-tag` — 1 differ: marginRight 0px vs 4px (gap-vs-margin, ACCEPTED)
- `multi-select-menu` — MATCH (menu ul: bg, padding, border-radius, height all match)
- `multi-select-item-active` — MATCH (Apple highlighted active item: blue bg, color, height)
- `multi-select-item` — MATCH (Durian non-active item: padding, color, bg, height all match)

Screenshot confirmation (light + dark):
- Container shows Banana + Cherry chips with × remove buttons
- Ghost input follows chips for continued typing
- Menu opens below matching container width
- Apple is highlighted blue (first enabled item = active)
- Banana + Cherry show tick icon (selected items)
- Dark theme is properly dark — container and menu bg match Blueprint dark theme

## Regression checks

- **tag-input**: 1 match · 2 differ — UNCHANGED (same pre-existing deltas as before)
- **select**: light 5·0, dark 4·1 — UNCHANGED (same pre-existing deltas as before)

## New dependencies added

None. `@blueprintjs/select` was already installed from Select (Phase 5 #2).

## Changes to existing files

- **`src/components/ui/multi-select.tsx`**: New file — MultiSelect component.
- **`src/App.tsx`**: MultiSelectGallery added + MultiSelect import + COMPONENTS entry.
- **`tools/blueprint-reference/src/App.tsx`**: MultiSelectGallery added + BpMultiSelect import + COMPONENTS entry.
- **`docs/ROADMAP.md`**: MultiSelect checked.

## Current state

- **MultiSelect:** Implemented and verified — `tools/compare.sh multi-select both`.
- **Build:** `pnpm build` green (tsc + vite).
- **Phase 5:** 4/5 COMPLETE. TagInput ✓, Select ✓, Suggest ✓, MultiSelect ✓

## Next steps

> Next action: **Omnibar** (Phase 5 #5) on branch `phase-5-selects`.
>
> 1. Build `src/components/ui/omnibar.tsx` — REUSE `useQueryList` from select.tsx.
>    Omnibar = modal/overlay QueryList (no trigger button — opens programmatically).
>    Blueprint: Dialog-style overlay with an InputGroup at the top + menu below.
>    Blueprint source: `packages/select/src/components/omnibar/omnibar.tsx`.
> 2. Register in both galleries under `id="omnibar"`.
>    Reference gallery: `import { Omnibar as BpOmnibar } from "@blueprintjs/select"`.
> 3. Run `tools/compare.sh omnibar both`.
> 4. Commit + push. Then open PR for Phase 5 and merge to main.

## How to resume

```bash
git branch --show-current  # should be phase-5-selects
pnpm dev                                              # :5173
cd tools/blueprint-reference && pnpm dev              # :5174

tools/compare.sh multi-select both     # re-verify
```

- Relevant files:
  - `src/components/ui/multi-select.tsx` (new — MultiSelect component)
  - `src/App.tsx` (MultiSelectGallery added + MultiSelect import)
  - `tools/blueprint-reference/src/App.tsx` (MultiSelectGallery added + BpMultiSelect import)
  - `docs/ROADMAP.md` (MultiSelect checked)
  - `docs/handoffs/0050-multi-select.md` (this file)
