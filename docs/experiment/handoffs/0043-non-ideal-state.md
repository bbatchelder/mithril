# 0043 — NonIdealState (Phase 4 #12)

- **Date:** 2026-05-26
- **Focus:** Build NonIdealState (empty/error/placeholder state) to Blueprint v6.15 fidelity, both light and dark themes.
- **Branch / commit:** phase-4-navigation @ (see commit SHA)

## Summary

Built `src/components/ui/non-ideal-state.tsx` exporting `NonIdealState` — a centered column or row
state block composing a large visual (icon or ReactNode), title heading, muted description, and
optional action button. Supports vertical (default) and horizontal layouts, three icon size presets
(STANDARD/SMALL/EXTRA_SMALL), and the `iconMuted` toggle. Registered in both galleries under
`id="non-ideal-state"`. Verified with `tools/compare.sh non-ideal-state both`.

- **Light:** 2 match · 0 differ — perfect.
- **Dark:** 2 match · 0 differ — perfect.

**Phase 4 item 12 of 15 — NonIdealState COMPLETE.**

## API

```tsx
// Full state
<NonIdealState
    icon="search"
    title="No results"
    description="Your query returned no results."
    action={<Button intent="primary">Clear search</Button>}
/>

// Minimal (icon + title)
<NonIdealState icon="folder-close" title="Empty folder" />

// Title + description only
<NonIdealState title="Nothing here" description="Come back later." />

// Horizontal layout
<NonIdealState
    icon="warning-sign"
    title="Connection error"
    description="Could not connect."
    layout="horizontal"
/>

// Custom icon size
<NonIdealState icon="document" iconSize={NonIdealStateIconSize.SMALL} title="SMALL" />

// iconMuted=false (icon inherits root muted color instead of gray-3)
<NonIdealState icon="info-sign" title="Info" iconMuted={false} />

// Custom ReactNode visual (e.g. Spinner)
<NonIdealState icon={<Spinner />} title="Loading..." />
```

### NonIdealState props

| Prop | Type | Default | Description |
|---|---|---|---|
| `icon` | `IconName \| ReactNode` | — | Icon name (string) or custom ReactNode. |
| `iconSize` | `NonIdealStateIconSizeValue \| number` | `48` (STANDARD) | Icon size in pixels. |
| `iconMuted` | `boolean` | `true` | When true, icon color is gray-3 (#8f99a8). When false, inherits root muted color. |
| `title` | `ReactNode` | — | Heading rendered as h4. |
| `description` | `ReactNode` | — | Muted body text; string/number values wrapped in div. |
| `action` | `ReactNode` | — | Action element (e.g. Button) after description. |
| `layout` | `"vertical" \| "horizontal"` | `"vertical"` | Flex direction. |
| `className` | `string` | — | Extra classes on root div. |
| …rest | `HTMLAttributes<HTMLDivElement>` | — | Forwarded to root div (supports `data-compare`, `aria-*`, etc.). |

### NonIdealStateIconSize constants

| Key | Value |
|---|---|
| `STANDARD` | 48 px (IconSize.STANDARD × 3) |
| `SMALL` | 32 px (IconSize.STANDARD × 2) |
| `EXTRA_SMALL` | 20 px (IconSize.LARGE) |

## Blueprint metrics matched

| Property | Value | Source |
|---|---|---|
| Root layout | `flex; flex-direction: column; align-items: center; justify-content: center` | `.bp6-non-ideal-state { @include pt-flex-container(column, ...) }` |
| Root `text-align` | `center` | `.bp6-non-ideal-state { text-align: center }` |
| Root `height` + `width` | `100%` | `.bp6-non-ideal-state { height: 100%; width: 100% }` |
| Root `color` (light) | `#5f6b7c` (gray-1) | `$pt-text-color-muted = $gray1` |
| Root `color` (dark) | `#abb3bf` (gray-4) | `$pt-dark-text-color-muted = $gray4` |
| Gap between children | `20px` | `$pt-spacing * 5 = 4px × 5` (via margin-bottom in Blueprint; CSS gap in mithril) |
| Child `max-width` | `400px` | `$pt-spacing * 100 = 400px` |
| Visual color | `#8f99a8` (gray-3) | `.bp6-non-ideal-state-visual { color: $gray3 }` |
| Horizontal layout | `flex-direction: row; text-align: left` | `.bp6-non-ideal-state-horizontal` |
| Heading (`h4`) font-size | `18px` | Blueprint H4 |
| Heading font-weight | `600` (semibold) | Blueprint H4 |
| Heading line-height | `20px` | `.bp6-heading { line-height: $pt-spacing * 5 }` |
| Heading margin-bottom (has description) | `8px` | `.bp6-heading { margin-bottom: $pt-spacing * 2 }` |
| Heading margin-bottom (only child) | `0` | `.bp6-heading:only-child { margin-bottom: 0 }` |
| Heading color | gray-1 / gray-4 (same as root) | `.bp6-non-ideal-state .bp6-heading { color: $pt-text-color-muted }` |
| IconSize.STANDARD | 16px | `@blueprintjs/icons` |
| NonIdealStateIconSize.STANDARD | 48px (16 × 3) | `NonIdealStateIconSize.STANDARD` |
| NonIdealStateIconSize.SMALL | 32px (16 × 2) | `NonIdealStateIconSize.SMALL` |
| NonIdealStateIconSize.EXTRA_SMALL | 20px (IconSize.LARGE) | `NonIdealStateIconSize.EXTRA_SMALL` |

## Design decisions

- **`icon` as `IconName | ReactNode`**: Accepts both string icon names (uses our vendored Icon) and
  arbitrary ReactNodes (custom visuals like `<Spinner />`, images). Detected by `typeof icon === "string"`.
- **`iconMuted` default `true`**: Mirrors Blueprint's default. When true, the visual wrapper gets
  `text-gray-3` (#8f99a8) which is Blueprint's fixed `$gray3` color (NOT theme-aware per the SCSS —
  `.bp6-non-ideal-state-visual { color: $gray3 }` has no dark-mode override in Blueprint's stylesheet).
- **Gap via CSS `gap` not `margin-bottom`**: Blueprint uses the `pt-flex-container` mixin which applies
  `margin-bottom: 20px` to all children except the last. CSS `gap: 20px` is the modern equivalent and
  produces identical spacing.
- **Heading as `h4`**: Blueprint uses `<H4>` for the title, which renders as an `<h4>` element with
  Blueprint heading styles (18px / 600 / 20px line-height). We emit the same native `h4`.
- **Description wrapped in div**: Blueprint calls `ensureElement(description, "div")` to wrap strings.
  We do the same: if description is a string/number, we wrap it in a `<div>`.
- **CVA for layout variants**: Vertical vs horizontal are the only variant. Simple `cva` with the
  `layout` variant handles both.
- **Icon pitfall — vendored subset**: The mithril `Icon` component only supports icon names from the
  vendored `ICON_GLYPHS` subset. Icon name `"folder-open"` is valid in Blueprint but not vendored;
  the gallery uses `"folder-close"` instead. Blueprint's `NonIdealState` accepts any Blueprint `IconName`.
- **Blueprint's NonIdealState doesn't forward htmlProps**: In the Blueprint reference gallery, we wrap
  each Blueprint specimen in a `div` + `useEffect` to imperatively set `data-compare` on the inner
  `.bp6-non-ideal-state` element (same pattern as `BpEntityTitleWithCompare`).

## Accepted deltas

None. Both themes: 2 match · 0 differ.

Minor visual observations (not diffed by harness, accepted):
- `folder-close` glyph differs slightly between mithril's vendored paths and Blueprint's — this is the same
  icon name, just slightly different path data in the vendored subset vs Blueprint's full icon package.
  Visual appearance is equivalent (both render a closed folder).
- Blueprint's `NonIdealState` visual section renders `fontSize + lineHeight` as inline styles on the wrapper
  div; we do the same. This is an intentional inline style (not a theme token) because the value is a
  dynamic JavaScript number.

## compare.sh results

```
non-ideal-state · light:  2 match · 0 differ
non-ideal-state · dark:   2 match · 0 differ
```

Screenshot confirmation (light + dark): large muted icon centered at top, title bold and slightly
smaller than icon, muted description below, action button at bottom, correct gray colors for both
themes. Horizontal layout correctly shows row direction. Icon size variants scale icon correctly.

## New dependencies added

None.

## Current state

- **NonIdealState:** Implemented and verified — `tools/compare.sh non-ideal-state both`.
- **Build:** `pnpm build` green (tsc + vite).
- **Phase 4:** 12/15 COMPLETE. Navbar ✓ Tabs ✓ Collapse ✓ Section ✓ CardList ✓ Breadcrumbs ✓ Tree ✓ PanelStack ✓ HTMLTable ✓ EditableText ✓ EntityTitle ✓ NonIdealState ✓

## Next steps

> Next action: **Link** (`packages/core/src/components/link/`).
>
> Phase 4 remaining (in order):
> 13. **Link** — `link/`
> 14. **Slider** — `slider/`
> 15. **Hotkeys** — `hotkeys/`

## How to resume

```bash
git branch --show-current  # should be phase-4-navigation
pnpm dev                                              # :5173
cd tools/blueprint-reference && pnpm dev              # :5174
tools/compare.sh non-ideal-state both     # re-verify
tools/compare.sh link both                # next target
```

- Relevant files:
  - `src/components/ui/non-ideal-state.tsx` (new — NonIdealState component)
  - `src/App.tsx` (NonIdealStateGallery + COMPONENTS entry + import)
  - `tools/blueprint-reference/src/App.tsx` (BpNonIdealStateWithCompare + NonIdealStateGallery + COMPONENTS entry + import)
  - `docs/ROADMAP.md` (NonIdealState checked)
  - `docs/handoffs/0043-non-ideal-state.md` (this file)
