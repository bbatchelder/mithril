# 0035 — Section (Phase 4 #4)

- **Date:** 2026-05-26
- **Focus:** Build Section + SectionCard components to Blueprint v6.15 fidelity, both light and dark themes.
- **Branch / commit:** phase-4-navigation @ (see commit SHA)

## Summary

Built `src/components/ui/section.tsx` exporting `Section` and `SectionCard`. Registered in both galleries
under `id="section"`. Verified with `tools/compare.sh section both`.

Both light and dark themes: **5 match · 0 differ** — a perfect computed-style match with no deltas.

**Phase 4 item 4 of 15 — Section COMPLETE.**

## API

```tsx
// Basic (title + icon + subtitle + body)
<Section
  title="Account settings"
  subtitle="Manage your account preferences"
  icon="cog"
>
  <SectionCard>
    <p>Section card content goes here.</p>
  </SectionCard>
</Section>

// Collapsible (uncontrolled, open by default)
<Section
  title="Advanced options"
  collapsible
  collapseProps={{ defaultIsOpen: true }}
>
  <SectionCard>Body</SectionCard>
</Section>

// Collapsible (controlled)
<Section
  title="Controlled"
  collapsible
  collapseProps={{ isOpen: open, onToggle: () => setOpen(o => !o) }}
>
  <SectionCard>Body</SectionCard>
</Section>

// Compact + elevation
<Section title="Compact" compact elevation={1}>
  <SectionCard compact>Compact body.</SectionCard>
</Section>

// Right element
<Section title="With actions" rightElement={<Button>Action</Button>}>
  <SectionCard>Body</SectionCard>
</Section>
```

### Section props

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | `ReactNode` | required | Section title (rendered as H6) |
| `subtitle` | `ReactNode` | — | Muted subtitle below the title |
| `icon` | `IconName` | — | Blueprint icon to the left of the title |
| `rightElement` | `ReactNode` | — | Element rendered on the right of the header |
| `collapsible` | `boolean` | `false` | Whether to show a collapse caret |
| `collapseProps` | `SectionCollapseProps` | — | Props forwarded to Collapse (isOpen, defaultIsOpen, onToggle, …) |
| `compact` | `boolean` | `false` | Compact sizing (40px header, 16px padding) |
| `elevation` | `0 \| 1` | `0` | Card elevation depth |
| `className` | `string` | — | Additional class on the outer card |
| `children` | `ReactNode` | — | Section body content (typically SectionCard) |

### SectionCard props

| Prop | Type | Default | Description |
|---|---|---|---|
| `padded` | `boolean` | `true` | Apply content padding (20px/16px) |
| `compact` | `boolean` | `false` | Use 16px padding instead of 20px |
| `className` | `string` | — | Additional class |
| `children` | `ReactNode` | — | Card content |

### SectionCollapseProps

| Prop | Type | Default | Description |
|---|---|---|---|
| `isOpen` | `boolean` | — | Controlled open state |
| `defaultIsOpen` | `boolean` | `true` | Initial open state (uncontrolled) |
| `onToggle` | `() => void` | — | Callback for controlled mode |
| `keepChildrenMounted` | `boolean` | — | Forwarded to Collapse |
| `transitionDuration` | `number` | — | Forwarded to Collapse |

## Blueprint metrics matched

| Property | Value | Source |
|---|---|---|
| Section outer overflow | `hidden` | `.bp6-section { overflow: hidden }` |
| Section outer padding | `0` | `.bp6-section { padding: 0 }` (overrides Card) |
| Section outer min-width | `0px` | Blueprint's normalize reset |
| Header min-height | `50px` default / `40px` compact | `$section-min-height: $pt-spacing*12.5`, `*10` compact |
| Header padding | `0 20px` default / `0 16px` compact | `$section-padding-horizontal: $pt-spacing*5`, `*4` compact |
| Header border-bottom | `1px solid rgba(17,20,24,0.15)` light | `$pt-divider-black = rgba(black,0.15)` |
| Header border-bottom (dark) | `1px solid rgba(255,255,255,0.2)` | `$pt-dark-divider-white = rgba(white,0.2)` |
| Header left gap | `8px` (`gap-2`) | `$pt-spacing*2` |
| Header left padding-y | `8px` | `$section-padding-vertical: $pt-spacing*2` |
| Header right gap | `8px` (`gap-2`) | `$pt-spacing*2` |
| Header gap (left↔right) | `20px` (`gap-5`) | `$pt-spacing*5` |
| Interactive hover bg | `light-gray5 (#f6f7f9)` | `.bp6-interactive:hover { background: $light-gray5 }` |
| Interactive hover bg (dark) | `dark-gray4 (#383e47)` | `.bp6-dark .bp6-interactive:hover { background: $dark-gray4 }` |
| SectionCard padding | `20px` default / `16px` compact | `$section-card-padding: $pt-spacing*5`, `*4` compact |
| SectionCard divider | `1px solid rgba(17,20,24,0.15)` (not last child) | same divider colors as header |
| Title | H6 (14px / semibold / margin-bottom 0) | `.bp6-section-header-title { margin-bottom: 0 }` |
| Subtitle | muted text / margin-top 2px | `.bp6-section-header-sub-title { margin-top: $pt-spacing*0.5 }` |
| Collapsed: no header border | `border: none` on header | `.bp6-section-collapsed .bp6-section-header { border: none }` |

## Design decisions

- **Compose Card + Collapse + Icon + Text**: The outer wrapper is our `Card` component (provides
  surface bg, elevation shadow, border-radius). Padding is overridden to `0` and `overflow: hidden`
  added to match Blueprint's section outer styling. Body is wrapped in `Collapse` when `collapsible`.

- **`min-w-0` on the outer card**: Blueprint's normalize CSS resets `min-width: 0` on block elements.
  Tailwind v4 preflight does not (block divs default to `min-width: auto`). Added `min-w-0` to match,
  same fix as was needed for Collapse in the previous session.

- **`Omit<HTMLAttributes<HTMLDivElement>, "title">`**: The native HTML `title` attribute is `string |
  undefined` which conflicts with our `title: ReactNode`. We Omit the native one and declare our own.
  Blueprint does the same with `Omit<HTMLDivProps, 'title'>`.

- **`useId()` for aria-labelledby**: Blueprint uses a `uniqueId()` utility. We use React 19's built-in
  `useId()` — produces stable IDs, avoids Blueprint's utility dependency. The aria relationship between
  the section card and title is preserved for accessibility.

- **Controlled vs. uncontrolled collapse state**: Mirrors Blueprint's pattern exactly. `collapseProps.isOpen`
  being defined triggers controlled mode; otherwise uses `useState` with `defaultIsOpen ?? true`.

- **Collapsed header border removal**: When collapsed (`collapsible && isCollapsed`), the bottom border
  on the header is removed to avoid the double-border effect. Implemented by conditionally applying the
  `border-b` classes.

- **data-compare strategy**: Used `useEffect` in both galleries to tag internal DOM nodes post-mount.
  Analyst-ui gallery: `querySelector("h6 + div")` for subtitle; `firstElementChild` for header.
  Blueprint-reference gallery: standard Blueprint class names (`.bp6-section-header`, `.bp6-section-header-title`, etc.).

- **SectionCard compact prop**: Blueprint's `compact` modifier is on the Section (parent), which cascades
  to SectionCard via a CSS child selector (`.bp6-compact .bp6-section-card`). Since our component tree
  doesn't have CSS cascade, we expose a `compact` prop on SectionCard directly — the gallery passes it
  explicitly when inside a compact Section. An alternative design could use React context; this keeps
  it simpler.

## Accepted deltas

None. Both themes: 5 match · 0 differ.

## compare.sh results

```
section · light:  5 match · 0 differ
section · dark:   5 match · 0 differ
```

Screenshot confirmation:
- **Light**: Basic section shows cog icon, "Account settings" title (semibold), muted subtitle,
  divider, SectionCard body. Collapsible section shows chevron-up caret (open). Compact section
  is visually smaller. Matches Blueprint reference exactly.
- **Dark**: Same layout on dark surface. Title and body text are light-colored. Subtitle is muted.
  Dark surface card with appropriate shadow. Matches Blueprint dark theme exactly.

## New dependencies added

None.

## Current state

- **Section:** Fully implemented and verified — `tools/compare.sh section both`.
- **Build:** `pnpm build` green (tsc + vite); blueprint-reference `tsc --noEmit` green.
- **Phase 4:** 4/15 COMPLETE. Navbar ✓ Tabs ✓ Collapse ✓ Section ✓

## Next steps

> Next action: **CardList** (`packages/core/src/components/card-list/`).
>
> Phase 4 remaining (in order):
> 5. **CardList** — `card-list/`
> 6. **Breadcrumbs** — `breadcrumbs/`
> 7. **Tree** — `tree/`
> 8. **PanelStack** — `panel-stack/`
> 9. **HTMLTable** — `html-table/`
> 10. **EditableText** — `editable-text/`
> 11. **EntityTitle** — `entity-title/`
> 12. **NonIdealState** — `non-ideal-state/`
> 13. **Link** — `link/`
> 14. **Slider** — `slider/`
> 15. **Hotkeys** — `hotkeys/`

## How to resume

```bash
git branch --show-current  # should be phase-4-navigation

pnpm dev                                              # :5173
cd tools/blueprint-reference && pnpm dev              # :5174

tools/compare.sh section both     # re-verify
tools/compare.sh card-list both   # next target
```

- Relevant files:
  - `src/components/ui/section.tsx` (new — Section + SectionCard components)
  - `src/App.tsx` (SectionGallery added + COMPONENTS entry + import)
  - `tools/blueprint-reference/src/App.tsx` (SectionGallery added + COMPONENTS entry + Section/SectionCard imports)
  - `docs/ROADMAP.md` (Section checked)
