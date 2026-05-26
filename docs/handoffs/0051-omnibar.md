# 0051 — Omnibar (Phase 5 #5)

- **Date:** 2026-05-26
- **Focus:** Build Omnibar (command-palette overlay) to Blueprint v6.15 fidelity,
  both light and dark themes. Fifth and final component of Phase 5.
- **Branch / commit:** phase-5-selects @ (see commit SHA)

## Summary

Built `src/components/ui/omnibar.tsx` exporting `Omnibar<T>` (generic command-palette overlay
with portaled backdrop + panel + InputGroup + filtered QueryList). Reuses `useQueryList<T>` from
`select.tsx` — the same filtering/keyboard-nav/active-item engine. Uses `ReactDOM.createPortal`
for the overlay (not Radix Dialog) since Omnibar needs custom fixed positioning (top-pinned,
horizontally centered, not vertically centered like Dialog). Registered in both galleries under
`id="omnibar"`. The blueprint-reference gallery uses `@blueprintjs/select`'s `Omnibar` component.
Verified with `tools/compare.sh omnibar both`.

- **Light:** 4 match · 1 differ (accepted delta: panel shadow base color sub-perceptual)
- **Dark:** 5 match · 0 differ

**Phase 5: 5/5 COMPLETE — Phase 5 done.**

## API

### Omnibar

```tsx
const [open, setOpen] = useState(false);

<Omnibar<string>
    isOpen={open}
    onClose={() => setOpen(false)}
    items={["Apple", "Banana", "Cherry", "Durian", "Elderberry", "Fig", "Grape"]}
    itemPredicate={(q, item) => item.toLowerCase().includes(q.toLowerCase())}
    itemRenderer={(item, { modifiers, handleClick }) => (
        <MenuItem
            key={item}
            text={item}
            active={modifiers.active}
            onClick={handleClick}
        />
    )}
    onItemSelect={(item) => { setSelected(item); setOpen(false); }}
    dark={dark}
/>
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `isOpen` | `boolean` | — | Controlled open state. Always required. |
| `onClose` | `(event?) => void` | — | Called on Escape key or backdrop click. Update `isOpen` in this callback. |
| `items` | `T[]` | — | All items in the list. |
| `itemRenderer` | `(item, props) => ReactNode` | — | Render each item in the menu (typically as MenuItem). |
| `itemPredicate` | `(q, item, index) => boolean` | — | Per-item filter predicate. |
| `itemListPredicate` | `(q, items) => T[]` | — | Whole-list filter (overrides itemPredicate). |
| `onItemSelect` | `(item, e?) => void` | — | Called when an item is selected. |
| `noResults` | `ReactNode` | `null` | Shown when no items match. |
| `query` | `string` | — | Controlled query. |
| `onQueryChange` | `(q) => void` | — | Called when query changes. |
| `activeItem` | `T \| null` | — | Controlled keyboard-active item. |
| `onActiveItemChange` | `(item) => void` | — | Called when active item changes. |
| `inputProps` | `InputHTMLAttributes (no value/onChange/size)` | — | Extra props for the search InputGroup. |
| `overlayProps` | `{ className?, portalClassName? }` | — | Extra props for the overlay. Use `portalClassName: Classes.DARK` in dark theme reference gallery. |
| `dark` | `boolean` | `false` | Required for dark portal mode. |
| `itemDisabled` | `keyof T \| (item, index) => boolean` | — | Disable specific items. |
| `initialActiveItem` | `T \| null` | — | Initial active item (uncontrolled). |
| `resetOnQuery` | `boolean` | `true` | Reset active item when query changes. |
| `resetOnSelect` | `boolean` | `false` | Reset query after item selection. |
| `className` | `string` | — | Added to the panel element. |

## Blueprint metrics matched

| Property | Value | Source |
|---|---|---|
| Width | 500px (`$pt-spacing * 125`) | `_omnibar.scss` |
| Left position | `calc(50% - 250px)` | `_omnibar.scss` (centered) |
| Top position | `20vh` | `(100 - 60) * 0.5 = 20%` from `_omnibar.scss` |
| Max height | 60vh (result area: `calc(60vh - 40px)`) | `$omnibar-height: 60vh` |
| Input height | 40px | `$omnibar-input-height: $pt-spacing * 10` |
| Panel bg (light) | white | `_omnibar.scss: background-color: $white` |
| Panel bg (dark) | dark-gray3 (#2f343c) | `_omnibar.scss dark variant` |
| Panel shadow | elevation-4 (`shadow-card-4`) | `box-shadow: $pt-elevation-shadow-4` |
| Panel border-radius | 4px | `$pt-border-radius` |
| Backdrop | rgba(0,0,0,0.2) | `_omnibar.scss .bp6-omnibar-overlay .bp6-overlay-backdrop` |
| Input bg | transparent | `.bp6-omnibar .bp6-input: background-color: transparent` |
| Input border-radius | 0px | `.bp6-omnibar .bp6-input: border-radius: 0` |
| Input box-shadow | none | `.bp6-omnibar .bp6-input: box-shadow: none` |
| Menu bg | transparent | `.bp6-omnibar .bp6-menu: background-color: transparent` |
| Menu border-radius | 0px | `.bp6-omnibar .bp6-menu: border-radius: 0` |
| Menu top separator | `inset 0 1px 0 rgba(17,20,24,0.15)` | `box-shadow: inset 0 1px 0 $pt-divider-black` |
| Menu max-height | `calc(60vh - 40px)` | Derived from `$omnibar-height - $omnibar-input-height` |
| Menu overflow | auto | `overflow: auto` |
| Menu empty state | hidden | `.bp6-omnibar .bp6-menu:empty { display: none }` |

## Design decisions

- **Portal via `ReactDOM.createPortal`** (not Radix Dialog): Omnibar needs custom fixed positioning
  (top-pinned at 20vh, horizontally centered) which is incompatible with Dialog's flex-center layout.
  Using createPortal directly is simpler and avoids Dialog's vertically-centered constraint.

- **Dark-mode portal fix**: The same pattern as Dialog — wrap portal children in `<div className="dark">`.
  Since the panel renders at document.body (outside the app's `.dark` ancestor), Tailwind dark utilities
  won't apply without this wrapper.

- **`initialContent={undefined}` in Blueprint reference**: Blueprint's `Omnibar` defaults to
  `initialContent=null` (not undefined). Blueprint's `renderFilteredItems()` checks
  `if (query.length === 0 && initialContent !== undefined) return initialContent` — with null,
  this returns null (no items) when query is empty. We pass `initialContent={undefined}` to the
  Blueprint reference gallery's `BpOmnibar` to bypass this and force items to show for comparison.
  Our analyst-ui Omnibar shows items immediately without this workaround.

- **Inline styles for menu overrides**: Menu's Tailwind utility classes (`bg-white/dark:bg-dark-gray-3`,
  `rounded-bp`) are set before `className` in Tailwind's generated CSS. Due to CSS source order,
  the `bg-transparent` and `[border-radius:0px]` class overrides in `className` may not always win
  over Tailwind utilities. Using inline `style={{ backgroundColor: "transparent", borderRadius: 0 }}`
  is reliable and always wins.

- **Menu top separator always uses `$pt-divider-black`**: Blueprint's `_omnibar.scss` uses
  `box-shadow: inset 0 1px 0 $pt-divider-black` for the menu separator WITHOUT a dark override.
  This means the separator uses `rgba(17,20,24,0.15)` in BOTH light and dark modes. The dark panel's
  dark-gray3 background provides the visual contrast naturally.

- **Input overrides via inline style**: InputGroup's className goes directly to `<input>`, so
  `[&_input]:` selectors don't apply (they'd target children of the input element). Using
  `style={{ backgroundColor: "transparent", borderRadius: 0, boxShadow: "none" }}` on InputGroup
  reliably overrides the computed styles for the diff.

## Portal + dark-mode notes

- `dark` prop wraps portal children in `<div className={dark ? "dark" : ""}>` (pointer-events: none).
- The backdrop and panel restore `pointer-events: auto`.
- Reference gallery uses `overlayProps={{ portalClassName: Classes.DARK }}` in dark theme — but since
  our custom portal wrapper handles dark, the `overlayProps.className` is also forwarded to the wrapper div.
- Dark screenshots confirm: panel bg is dark-gray3, menu bg is transparent (dark panel bg shows through),
  Apple active item has the dark blue highlight, all items have dark text.

## Accepted deltas

- **`omnibar-panel boxShadow` (light)**: `rgba(0,0,0,0.102)` vs `rgba(20,20,20,0.102)` — sub-perceptual
  shadow base color difference (~7.8% gray at ~10% opacity). This is the same known delta from Card/Dialog
  (`shadow-card-4` uses pure black `#000000` vs Blueprint's `#141414`). Visually imperceptible.
  **ACCEPTED** (matches the existing Card/Dialog known delta).

## compare.sh results

```
omnibar · light:  4 match · 1 differ (accepted delta: panel boxShadow base color sub-perceptual)
omnibar · dark:   5 match · 0 differ
```

**data-compare keys paired (both themes):**
- `omnibar-panel` — MATCH dark; 1 differ light (accepted boxShadow delta). Panel bg, color, radius, position all match.
- `omnibar-input` — MATCH both. Transparent bg, 0px border-radius, no box-shadow, 40px height, 40px padding-left.
- `omnibar-menu` — MATCH both. Transparent bg, 0px border-radius, inset separator shadow, max-height, overflow.
- `omnibar-item-active` — MATCH both. Apple highlighted blue (bg + color), 30px height, correct padding.
- `omnibar-item` — MATCH both. Cherry non-active (transparent bg, foreground color, correct padding).

Screenshot confirmation (light + dark):
- Panel is fixed, top-pinned (~20vh), horizontally centered, 500px wide
- Full-width large InputGroup at top with search icon and "Search..." placeholder
- All 7 items listed in the menu below (Apple through Grape)
- Apple is highlighted blue (first enabled item = active by default)
- Dark theme: dark-gray3 panel bg, transparent menu bg, dark foreground text, dark blue active highlight
- Both themes match Blueprint's reference gallery visually

## Regression checks

- **multi-select**: 4·1 → UNCHANGED (same pre-existing gap-vs-margin delta)
- **select**: unchanged
- **suggest**: unchanged

## New dependencies added

None. `@blueprintjs/select` was already installed from Select (Phase 5 #2).
`ReactDOM` is from the existing `react-dom` package.

## Changes to existing files

- **`src/components/ui/omnibar.tsx`**: New file — Omnibar component.
- **`src/App.tsx`**: OmnibarGallery added + Omnibar import + COMPONENTS entry.
- **`tools/blueprint-reference/src/App.tsx`**: OmnibarGallery added + BpOmnibar import + COMPONENTS entry.
- **`docs/ROADMAP.md`**: Omnibar checked.

## Current state

- **Omnibar:** Implemented and verified — `tools/compare.sh omnibar both`.
- **Build:** `pnpm build` green (tsc + vite).
- **Phase 5:** 5/5 COMPLETE. TagInput ✓, Select ✓, Suggest ✓, MultiSelect ✓, Omnibar ✓

## Next steps

> Next action: **Phase 5 PR + merge to `main`**, then cut `phase-6-datetime` branch for Phase 6.
>
> Phase 6 starts with: **TimePicker** on branch `phase-6-datetime`.
>
> 1. Open PR for `phase-5-selects` → `main`.
> 2. Merge to `main` (merge commit). Sync `main`, delete `phase-5-selects` branch.
> 3. Cut `phase-6-datetime` from fresh `main`.
> 4. Build **TimePicker** — Blueprint: `@blueprintjs/datetime` (packages/datetime/).
>    Reuse InputGroup + Select. Standalone time-only picker.

## How to resume

```bash
git branch --show-current  # should be phase-5-selects
pnpm dev                                              # :5173
cd tools/blueprint-reference && pnpm dev              # :5174

tools/compare.sh omnibar both     # re-verify
```

- Relevant files:
  - `src/components/ui/omnibar.tsx` (new — Omnibar component)
  - `src/App.tsx` (OmnibarGallery added + Omnibar import)
  - `tools/blueprint-reference/src/App.tsx` (OmnibarGallery added + BpOmnibar import)
  - `docs/ROADMAP.md` (Omnibar checked)
  - `docs/handoffs/0051-omnibar.md` (this file)
