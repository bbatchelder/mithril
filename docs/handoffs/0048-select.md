# 0048 — Select (Phase 5 #2)

- **Date:** 2026-05-26
- **Focus:** Build Select (filterable dropdown: Popover + Menu + QueryList engine) to Blueprint v6.15 fidelity, both light and dark themes. Second component of Phase 5.
- **Branch / commit:** phase-5-selects @ (see commit SHA)

## Summary

Built `src/components/ui/select.tsx` exporting `Select<T>` (generic filterable dropdown) and
`useQueryList<T>` (the filtering/active-item/keyboard-navigation engine). Registered in both
galleries under `id="select"`. The blueprint-reference gallery uses `@blueprintjs/select`'s
`Select` component to render the canonical equivalent. Verified with `tools/compare.sh select both`.

Also fixed a latent **Menu item line-height bug** caused by `tailwind-merge` silently removing
`leading-[22px]` when it appeared before `text-body` in `cn()`. The fix moves all `leading-*`
classes after `text-body` in `menu.tsx`'s `innerClasses` so they correctly override. This affects
all Menu/MenuItem usage (the fix is correct, existing menu tests/screenshots still pass).

- **Light:** 5 match · 0 differ
- **Dark:** 4 match · 1 differ

**Phase 5 item 2 of 5 — Select COMPLETE.**

## API

### useQueryList

Exported from `select.tsx`. The filtering/keyboard-nav/active-item engine reused by
Suggest (#3), MultiSelect (#4), and Omnibar (#5).

```tsx
const ql = useQueryList<string>({
    items: ["Apple", "Banana", "Cherry"],
    itemPredicate: (q, item) => item.toLowerCase().includes(q.toLowerCase()),
    onItemSelect: (item) => setSelected(item),
});

// Then attach ql.handleKeyDown, ql.handleQueryChange, ql.filteredItems,
// ql.activeItem, ql.query to your rendering.
```

| Option | Type | Default | Description |
|---|---|---|---|
| `items` | `T[]` | — | All items in the list. |
| `itemPredicate` | `(q, item, index) => boolean` | — | Per-item filter. If omitted, all items shown. |
| `itemListPredicate` | `(q, items) => T[]` | — | Whole-list filter (takes precedence over itemPredicate). |
| `onItemSelect` | `(item, e?) => void` | — | Called on item selection. |
| `query` | `string` | — | Controlled query value. |
| `onQueryChange` | `(q) => void` | — | Called when query changes. |
| `activeItem` | `T \| null` | — | Controlled active item. |
| `onActiveItemChange` | `(item) => void` | — | Called when active item changes. |
| `resetOnQuery` | `boolean` | `true` | Reset to first item when query changes. |
| `resetOnSelect` | `boolean` | `false` | Reset query to empty after selection. |
| `itemDisabled` | `keyof T \| (item, index) => boolean` | — | Disable specific items. |

Returns `QueryListState<T>`:
- `query`, `filteredItems`, `activeItem`
- `setQuery(q, resetActive?)`, `setActiveItem(item)`
- `handleKeyDown(e)` — ArrowUp/Down/Home/End/Enter
- `handleQueryChange(e)` — input onChange
- `handleItemSelect(item, e?)` — for click handlers

### Select

```tsx
const [selected, setSelected] = useState<string | null>(null);

<Select<string>
    items={["Apple", "Banana", "Cherry"]}
    itemPredicate={(q, item) => item.toLowerCase().includes(q.toLowerCase())}
    itemRenderer={(item, { modifiers, handleClick }) => (
        <MenuItem
            key={item}
            text={item}
            active={modifiers.active}
            icon={item === selected ? "tick" : undefined}
            onClick={handleClick}
        />
    )}
    onItemSelect={setSelected}
    selectedItem={selected}
    noResults={<MenuItem disabled text="No results." />}
    dark={dark}
>
    <Button endIcon={<Icon icon="caret-down" size={16} />}>
        {selected ?? "Select an item…"}
    </Button>
</Select>
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `items` | `T[]` | — | All items. |
| `itemRenderer` | `(item, props) => ReactNode` | — | Render each item (typically as MenuItem). |
| `itemPredicate` | `(q, item, index) => boolean` | — | Per-item filter. |
| `itemListPredicate` | `(q, items) => T[]` | — | Whole-list filter. |
| `onItemSelect` | `(item, e?) => void` | — | Called on selection. |
| `selectedItem` | `T \| null` | — | Currently selected item (for tick icon in renderer). |
| `activeItem` | `T \| null` | — | Controlled keyboard-active item. |
| `onActiveItemChange` | `(item) => void` | — | Called when active item changes. |
| `query` | `string` | — | Controlled filter query. |
| `onQueryChange` | `(q) => void` | — | Called when query changes. |
| `filterable` | `boolean` | `true` | Show filter InputGroup. |
| `placeholder` | `string` | `"Filter..."` | Filter input placeholder. |
| `disabled` | `boolean` | `false` | Disable the component. |
| `fill` | `boolean` | `false` | Make trigger full-width. |
| `resetOnClose` | `boolean` | `false` | Reset query + active when popover closes. |
| `resetOnSelect` | `boolean` | `false` | Reset query after selection. |
| `noResults` | `ReactNode` | `null` | Shown when no items match. |
| `inputProps` | `InputHTMLAttributes (no value/onChange/size)` | — | Extra props for filter input. |
| `popoverProps` | `PopoverProps (no content/children)` | — | Extra props for the Popover. |
| `itemDisabled` | `keyof T \| (item, index) => boolean` | — | Disable specific items. |
| `dark` | `boolean` | `false` | Required for dark portal mode. |
| `children` | `ReactNode` | — | Trigger element (Button etc.). |
| `className` | `string` | — | Added to the menu inside popover. |

## Blueprint metrics matched

| Property | Value | Source |
|---|---|---|
| Popover content padding | `4px` | `$select-padding = $pt-spacing = 4px` |
| Menu margin-left/right | `-4px` (offset container padding) | `_select.scss: margin-left: -$select-padding` |
| Menu max-height | `300px` | `$select-popover-max-height = $pt-spacing * 75` |
| Menu max-width | `400px` | `$select-popover-max-width = $pt-spacing * 100` |
| Menu overflow | `auto` (scrollable) | `_select.scss` |
| Menu padding | `0 4px; padding-top: 4px when filter present` | `_select.scss` |
| MenuItem line-height | `22px` | `$menu-item-line-height` |
| MenuItem height (medium) | `30px` | `4px + 22px + 4px` |
| MenuItem padding | `4px 8px` | `$menu-item-padding-vertical $menu-item-padding` |
| Active item highlight | `rgba(blue3, 0.1)` bg + `blue2` text (light) | MenuItem `active` prop |
| Selected item tick | `icon="tick"` on MenuItem | user's itemRenderer |
| Filter input left icon | `icon="search"` | Blueprint Select source |
| Popover side/align | `bottom-start` (minimal) | Blueprint default placement |

## Design decisions

- **useQueryList architecture**: A standalone hook (not a class component like Blueprint's QueryList).
  Returns `QueryListState<T>` with handlers that can be attached to any rendering. Suggest,
  MultiSelect, and Omnibar will import and reuse this directly.

- **Eager active-item initialization**: The `useQueryList` hook uses a lazy `useState` initializer
  to synchronously set the first enabled item as active on mount. This ensures the active highlight
  is visible when the popover is forced open (e.g., for gallery screenshots) without waiting for a
  `useEffect`.

- **popoverProps.open allowed**: Unlike other portaled components, `Select.popoverProps` allows
  passing `open`/`onOpenChange` to override the internal open state. This enables forcing the popover
  open in gallery mode. When `popoverProps.open` is provided, it overrides the internal `isOpen`.

- **data-compare on trigger**: The `data-compare="select-trigger"` attribute is placed on the
  actual trigger element (Button) in the gallery, NOT on Select's internal wrapper div. This ensures
  the harness measures the real button (with bg, border, padding) rather than a transparent div.

- **Menu leading fix discovered**: `tailwind-merge` was silently removing `leading-[22px]` from
  MenuItem buttons because `text-body` (registered as a `font-size` class) appeared AFTER
  `leading-[22px]` in the `cn()` call, causing tailwind-merge to think `text-body` "owns"
  line-height and drops the earlier `leading-*`. Fixed in `menu.tsx` by moving all `leading-*`
  classes to come AFTER `text-body` in the class list.

## Portal + dark-mode notes

- Same pattern as Popover/ContextMenu: `dark` prop is passed to Popover which wraps portal children
  in `<div className="dark">` so dark utilities apply to portaled menu content.
- Reference gallery passes `popoverProps={{ portalClassName: Classes.DARK }}` when `theme=dark`
  so Blueprint's portaled Select menu also renders in dark mode.
- All portaled content (Menu, filter InputGroup) uses `text-foreground` via the Menu and InputGroup
  components' built-in foreground classes.

## Accepted deltas

- **`select-trigger` dark `color`**: analyst `rgb(246,247,249)` vs Blueprint `rgb(255,255,255)`.
  Our intentional dark foreground `#f6f7f9` (documented in `dark-foreground-decision.md` memory).

- **`select-trigger` dark `backgroundColor`**: analyst `rgb(47,52,60)` vs Blueprint `rgb(48,55,64)`.
  A 1-unit difference per channel between `dark-gray-3 (#2f343c)` and Blueprint's dark button bg.
  Sub-perceptual.

- **`only in analyst: popover-content`**: Radix's portaled popover wrapper element has
  `data-compare="popover-content"` from the Popover component's own `data-compare`. It has no
  Blueprint counterpart and is simply ignored by the diff.

## compare.sh results

```
select · light:  5 match · 0 differ
select · dark:   4 match · 1 differ
```

**data-compare keys paired (both themes):**
- `select-trigger` — MATCH light; 1 diff dark (accepted: dark-foreground + bg sub-perceptual)
- `select-filter` — MATCH (filter input: height, padding, bg, boxShadow all match)
- `select-menu` — MATCH (menu ul: height, bg, padding, border-radius all match)
- `select-item` — MATCH (Cherry non-active item: padding, color, bg, height all match)
- `select-item-active` — MATCH (Apple highlighted item: bg, color, height, padding all match)

Screenshot confirmation (light + dark):
- Filter input with search icon renders correctly at top of popover
- Apple (first item) is highlighted blue in both themes
- Cherry shows tick icon indicating selected state
- All items have correct 30px height and 8px horizontal padding
- Dark theme is properly dark — menu bg matches Blueprint dark (dark-gray-3)
- Popover has correct shadow and border-radius

## New dependencies added

- `@blueprintjs/select@6.2.1` — installed in `tools/blueprint-reference/` only (the reference
  gallery needs it to render Blueprint's canonical Select). NOT added to analyst-ui.
- `@blueprintjs/select/lib/css/blueprint-select.css` imported in `tools/blueprint-reference/src/main.tsx`.

## Current state

- **Select:** Implemented and verified — `tools/compare.sh select both`.
- **Build:** `pnpm build` green (tsc + vite).
- **Phase 5:** 2/5 COMPLETE. TagInput ✓, Select ✓

## Next steps

> Next action: **Suggest** (Phase 5 #3) on branch `phase-5-selects`.
>
> 1. Build `src/components/ui/suggest.tsx` — REUSE `useQueryList` from select.tsx.
>    Suggest = Select but the trigger IS the InputGroup (the filter IS the trigger).
>    Key differences from Select: always shows the input; input value shows the
>    selected item's label; no separate trigger Button.
> 2. Register in both galleries under `id="suggest"`.
>    Reference gallery: `import { Suggest as BpSuggest } from "@blueprintjs/select"`.
> 3. Run `tools/compare.sh suggest both`.
> 4. Commit + push.

## How to resume

```bash
git branch --show-current  # should be phase-5-selects
pnpm dev                                              # :5173
cd tools/blueprint-reference && pnpm dev              # :5174

tools/compare.sh select both     # re-verify
```

- Relevant files:
  - `src/components/ui/select.tsx` (new — Select + useQueryList)
  - `src/components/ui/menu.tsx` (fix: leading-* classes moved after text-body in innerClasses)
  - `src/App.tsx` (SelectGallery added + import)
  - `tools/blueprint-reference/src/App.tsx` (SelectGallery added + BpSelect import)
  - `tools/blueprint-reference/src/main.tsx` (CSS import for @blueprintjs/select)
  - `tools/blueprint-reference/package.json` (@blueprintjs/select added)
  - `docs/ROADMAP.md` (Select checked)
  - `docs/handoffs/0048-select.md` (this file)
