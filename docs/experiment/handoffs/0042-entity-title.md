# 0042 — EntityTitle (Phase 4 #11)

- **Date:** 2026-05-26
- **Focus:** Build EntityTitle (icon + title + subtitle + tags block) to Blueprint v6.15 fidelity, both light and dark themes.
- **Branch / commit:** phase-4-navigation @ (see commit SHA)

## Summary

Built `src/components/ui/entity-title.tsx` exporting `EntityTitle` — a structured heading block
composing icon, title, subtitle, and tags/right content. Supports 7 size levels (text + h1–h6),
loading state via skeleton placeholders, ellipsize/fill layout, and ReactNode icon (custom avatars).
Registered in both galleries under `id="entity-title"`. Verified with `tools/compare.sh entity-title both`.

- **Light:** 10 match · 0 differ — perfect.
- **Dark:** 10 match · 0 differ — perfect.

**Phase 4 item 11 of 15 — EntityTitle COMPLETE.**

## API

```tsx
// Basic title only
<EntityTitle title="Project Alpha" />

// Icon + title + subtitle
<EntityTitle
    icon="folder-close"
    title="Project Alpha"
    subtitle="Last updated 2 hours ago"
/>

// Icon + title + subtitle + tags
<EntityTitle
    icon="folder-close"
    title="Project Alpha"
    subtitle="Last updated 2 hours ago"
    tags={<Tag intent="primary">Active</Tag>}
/>

// H1 heading level
<EntityTitle
    size="h1"
    icon="folder-close"
    title="Large Heading Title"
    subtitle="Subtitle scales up to 14px for h1/h2/h3"
/>

// Fill + ellipsize (constrained container)
<EntityTitle
    icon="folder-close"
    title="Very long title that truncates"
    subtitle="subtitle"
    fill
    ellipsize
/>

// Loading
<EntityTitle
    icon="folder-close"
    title="Loading..."
    subtitle="Loading subtitle"
    loading
/>

// Custom ReactNode icon (avatar)
<EntityTitle
    icon={<img src="/avatar.png" style={{ width: 24, height: 24 }} />}
    title="User Name"
/>

// With titleURL
<EntityTitle
    title="External Link"
    titleURL="https://example.com"
/>
```

### EntityTitle props

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | `ReactNode` | — | Primary title content (required). |
| `subtitle` | `ReactNode` | — | Muted text below the title. Font-size scales with `size`. |
| `icon` | `IconName \| ReactNode` | — | Icon name (string) or custom ReactNode rendered left of the title. |
| `tags` | `ReactNode` | — | Content rendered after the title in the title row (e.g. `<Tag>`). |
| `size` | `EntityTitleSize` | `"text"` | Heading level: `"text"` (body) or `"h1"`–`"h6"`. |
| `as` | `keyof JSX.IntrinsicElements` | — | Override the title's HTML element (default: div for text, h1–h6 for heading sizes). |
| `ellipsize` | `boolean` | `false` | Truncate title + subtitle with ellipsis on overflow. |
| `fill` | `boolean` | `false` | Expand to 100% width; title grows to fill remaining space. |
| `loading` | `boolean` | `false` | Show skeleton placeholders (icon + title + subtitle). |
| `titleURL` | `string` | — | Wrap title in `<a>` pointing to this URL (new tab). |
| `className` | `string` | — | Extra classes on root div. |
| …rest | `HTMLAttributes<HTMLDivElement>` | — | Forwarded to root div (supports `data-compare`, `aria-*`, etc.). |

Note: `title` is `ReactNode` so `HTMLAttributes<HTMLDivElement>.title` is omitted via `Omit<..., "title">`.

## Blueprint metrics matched

| Property | Value | Source |
|---|---|---|
| Root `display` | `flex` | `.bp6-entity-title { display: flex }` |
| Root `align-items` | `center` | `.bp6-entity-title { align-items: center }` |
| Root `min-width` | `0` | `.bp6-entity-title { min-width: 0 }` |
| Root `gap` (text/h4/h5/h6) | `8px` | `gap: $pt-spacing * 2 = 4px * 2` |
| Root `gap` (h1/h2/h3) | `16px` | `gap: $pt-spacing * 4 = 4px * 4` |
| Title-and-tags `gap` | `4px` | `gap: $pt-spacing = 4px` |
| Tags-container `gap` | `2px` | `gap: $pt-spacing * 0.5 = 2px` |
| Tags-container `margin-left` | `4px` | `margin-left: $pt-spacing = 4px` |
| Subtitle `margin-top` | `2px` | `margin-top: $pt-spacing * 0.5 = 2px` |
| Subtitle font-size (h1/h2/h3) | `14px` | `$pt-font-size` (h1–h3 bigger subtitle) |
| Subtitle font-size (text/h4/h5/h6) | `12px` | `$pt-font-size-small` |
| Subtitle `color` | `foreground-muted` | `.bp6-text-muted` = gray-1 / gray-4 |
| Title `margin-bottom` | `0` | override heading default |
| Title `min-width` | `0` | prevents flex overflow |
| Icon container w/ subtitle | `align-self: flex-start` | `.bp6-entity-title-has-subtitle` |
| Icon container without subtitle | `display: flex; align-items: center` | aligns icon vertically |
| Icon container height (h1) | `40px` | `height: list.nth($props, 2)` = h1 line-height |
| Icon container height (h2) | `32px` | h2 line-height |
| Icon container height (h3) | `25px` | h3 line-height |
| Icon container height (h4) | `21px` | h4 line-height |
| Icon container height (h5) | `19px` | h5 line-height |
| Icon container height (h6) | `16px` | h6 line-height |
| Icon size (text/h4/h5/h6) | `16px` | standard icon size |
| Icon size (h1/h2/h3) | `20px` | large icon for large headings |

## Design decisions

- **`size` prop instead of Blueprint's `heading` component prop**: Blueprint takes a heading component
  (`heading={H1}`) as a React.FC, which is not type-safe and couples callers to Blueprint internals.
  We use a string union `"text" | "h1" | ... | "h6"` — cleaner, fully typed, and maps to the same visuals.
- **`as` prop for element override**: The title's HTML element defaults to `div` for `size="text"` and
  `h1`–`h6` for heading sizes. Pass `as="span"` etc. to override without changing the size.
- **`icon` as `IconName | ReactNode`**: Accepts both string icon names (uses our vendored Icon component)
  and arbitrary ReactNodes (custom avatars, images). Detected by `typeof icon === "string"`.
- **No CVA**: The metrics are looked up via simple Record maps (ROOT_GAP, ICON_CONTAINER_HEIGHT, etc.)
  keyed by `EntityTitleSize`. CVA's variant system isn't needed since there's no state machine — just
  pure size-based lookups.
- **forwardRef with `Omit<HTMLAttributes,'title'>`**: `HTMLAttributes<HTMLDivElement>` has `title: string`
  but our `title` prop is `ReactNode`. We `Omit<..., 'title'>` to avoid the conflict.
- **Loading skeleton**: We reuse `skeletonClass` from skeleton.tsx on the icon, title row, and subtitle.
  Blueprint uses a "square" icon placeholder for the loading icon; we use "document" since "square" is not
  in our vendored icon set. Visual result is equivalent.
- **Blueprint's `BpEntityTitleWithCompare` wrapper**: Blueprint's EntityTitle is typed as `React.FC`
  (ref not exposed). We wrap each specimen in a div, then use `querySelector('.bp6-entity-title')` +
  `setAttribute('data-compare', ...)` in `useEffect` to tag the correct root element for the harness —
  same approach as `BpEditableTextWithCompare` from #10.

## Accepted deltas

None. Both themes: 10 match · 0 differ.

The harness compares 10 specimens: basic, full (icon+title+subtitle), tags, and 7 size variants (text/h1–h6).
Computed-style diff includes: color, backgroundColor, fontSize, fontWeight, marginTop, borderRadius, height, etc.

Minor visual observations (not diffed by harness, accepted):
- The gallery wrapper divs (section labels) differ in styling between the two galleries but are not `data-compare` tagged — not captured.
- Blueprint's title-only specimen ("Project Alpha") renders with `display:block` from the `Text` component; ours uses `display:block` from the `div` element — same visual.

## compare.sh results

```
entity-title · light:  10 match · 0 differ
entity-title · dark:   10 match · 0 differ
```

Screenshot confirmation (light + dark): icon+title alignment correct, subtitle muted + 2px below title,
tag placed correctly in title row, H1–H6 size scaling correct with icon container heights matched,
loading skeleton visible, fill+ellipsize truncates at 300px width.

## New dependencies added

None.

## Current state

- **EntityTitle:** Implemented and verified — `tools/compare.sh entity-title both`.
- **Build:** `pnpm build` green (tsc + vite).
- **Phase 4:** 11/15 COMPLETE. Navbar ✓ Tabs ✓ Collapse ✓ Section ✓ CardList ✓ Breadcrumbs ✓ Tree ✓ PanelStack ✓ HTMLTable ✓ EditableText ✓ EntityTitle ✓

## Next steps

> Next action: **NonIdealState** (`packages/core/src/components/non-ideal-state/`).
>
> Phase 4 remaining (in order):
> 12. **NonIdealState** — `non-ideal-state/`
> 13. **Link** — `link/`
> 14. **Slider** — `slider/`
> 15. **Hotkeys** — `hotkeys/`

## How to resume

```bash
git branch --show-current  # should be phase-4-navigation
pnpm dev                                              # :5173
cd tools/blueprint-reference && pnpm dev              # :5174
tools/compare.sh entity-title both     # re-verify
tools/compare.sh non-ideal-state both  # next target
```

- Relevant files:
  - `src/components/ui/entity-title.tsx` (new — EntityTitle component)
  - `src/App.tsx` (EntityTitleGallery + COMPONENTS entry + import)
  - `tools/blueprint-reference/src/App.tsx` (BpEntityTitleWithCompare + EntityTitleGallery + COMPONENTS entry + import)
  - `docs/ROADMAP.md` (EntityTitle checked)
  - `docs/handoffs/0042-entity-title.md` (this file)
