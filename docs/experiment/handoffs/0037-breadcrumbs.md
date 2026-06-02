# 0037 — Breadcrumbs (Phase 4 #6)

- **Date:** 2026-05-26
- **Focus:** Build Breadcrumbs component to Blueprint v6.15 fidelity, both light and dark themes.
- **Branch / commit:** phase-4-navigation @ (see commit SHA)

## Summary

Built `src/components/ui/breadcrumbs.tsx` exporting `Breadcrumbs` and `Breadcrumb` — a horizontal
trail of crumbs separated by chevron-right icon separators. Registered in both galleries under
`id="breadcrumbs"`. Verified with `tools/compare.sh breadcrumbs both`.

- **Light:** 2 match · 0 differ — perfect.
- **Dark:** 2 match · 0 differ — perfect.

**Phase 4 item 6 of 15 — Breadcrumbs COMPLETE.**

## API

```tsx
// Basic trail
<Breadcrumbs
  items={[
    { text: "Home", href: "/" },
    { text: "Projects", href: "/projects" },
    { text: "Current Page", current: true },
  ]}
/>

// With icons
<Breadcrumbs
  items={[
    { text: "Home", href: "/", icon: "info-sign" },
    { text: "Current", current: true, icon: "tick-circle" },
  ]}
/>

// With disabled crumb
<Breadcrumbs
  items={[
    { text: "Home", href: "/" },
    { text: "Restricted", href: "/admin", disabled: true },
    { text: "Page", current: true },
  ]}
/>

// Single standalone Breadcrumb (composable)
<Breadcrumb text="Home" href="/" />
<Breadcrumb text="Current Page" current />
```

### Breadcrumbs props

| Prop | Type | Default | Description |
|---|---|---|---|
| `items` | `BreadcrumbItem[]` | required | Ordered list of crumb definitions. |
| `className` | `string` | — | Additional class on the outer `<ul>`. |

### BreadcrumbItem / Breadcrumb props

| Prop | Type | Default | Description |
|---|---|---|---|
| `text` | `ReactNode` | — | Display text. At least one of `text` or `icon` is needed. |
| `icon` | `IconName` | — | Blueprint icon shown left of text. |
| `iconTitle` | `string` | — | Accessible title for icon-only crumbs. |
| `href` | `string` | — | Makes the crumb a link anchor. |
| `onClick` | `MouseEventHandler` | — | Click handler; disabled crumbs ignore it. |
| `current` | `boolean` | `false` | Bold, non-interactive, inherits full foreground color. |
| `disabled` | `boolean` | `false` | Dimmed, non-interactive, cursor: not-allowed. |
| `className` | `string` | — | Extra class on the crumb element. |

## Blueprint metrics matched

| Property | Value | Source |
|---|---|---|
| Container height | `30px` | `$pt-input-height = $pt-spacing * 7.5` |
| Container display | `flex; flex-wrap: wrap; align-items: center` | `.bp6-breadcrumbs` |
| Container list style | `none; margin: 0; padding: 0` | `.bp6-breadcrumbs` |
| Item display | `flex; align-items: center` | `.bp6-breadcrumbs > li` |
| Crumb font-size | `16px` | `$pt-font-size-large = $pt-spacing * 4` |
| Crumb display | `inline-flex; align-items: center` | `.bp6-breadcrumb`, `.bp6-breadcrumb-current` |
| Link crumb color (light) | `$gray1 = #5f6b7c` | `$pt-text-color-muted` → `--foreground-muted` |
| Link crumb color (dark) | `$gray4 = #abb3bf` | `$pt-dark-text-color-muted` → `--foreground-muted` |
| Disabled crumb color | `rgba($gray1, 0.6)` / `rgba($gray4, 0.6)` | `$pt-text-color-disabled` → `--foreground-disabled` |
| Current crumb color | `inherit` (full foreground) | `.bp6-breadcrumb-current { color: inherit }` |
| Current crumb weight | `600` | `.bp6-breadcrumb-current { font-weight: 600 }` |
| Icon margin-right | `4px` | `.bp6-breadcrumb .bp6-icon { margin-right: $pt-spacing }` |
| Separator | chevron-right 16px | `li::after` background SVG chevron-right |
| Separator color | `$pt-icon-color = $pt-text-color-muted` | `--foreground-muted` |
| Separator margin | `0 4px` | `margin: 0 $pt-spacing` → `mx-1` |
| Last separator | hidden | `:last-of-type::after { display: none }` |

## Design decisions

- **`items` prop API** (not a render prop): simpler than Blueprint's `breadcrumbRenderer` callback
  pattern. Consumers pass a flat array of `BreadcrumbItem` objects; the component iterates over them
  and renders the appropriate element type (anchor for link crumbs, span for current/non-interactive).
- **Separator as `<Icon>`**: Blueprint uses an SVG background image on `li::after` pseudo-elements.
  We render an `<Icon icon="chevron-right" />` real element between each pair of list items. This is
  simpler and avoids pseudo-element CSS, while producing identical visuals (same SVG path, same size,
  same color via `text-foreground-muted`).
- **Hover color restoration**: Blueprint's link crumbs implicitly restore to full text color on hover
  via context (no explicit hover rule in the SCSS for `.bp6-breadcrumb:hover` color). We achieve the
  same by adding `hover:text-foreground` on non-disabled link crumbs.
- **`Breadcrumb` is composable**: exported as a standalone component for consumers who want to
  compose custom crumb content (e.g., with custom onClick handlers or children).
- **Overflow NOT implemented**: The OverflowList + Popover + Menu collapse behavior is deferred.
  A `// TODO(follow-up)` comment in the source and this handoff document the gap.

## Accepted deltas

None. Both themes achieve exact computed-style matches (2 match, 0 differ each).

## compare.sh results

```
breadcrumbs · light:  2 match · 0 differ
breadcrumbs · dark:   2 match · 0 differ
```

Screenshot confirmation:
- **Light**: Muted gray link crumbs (Home, Projects), bold "Current Project", chevron-right separators,
  no trailing separator. Icons left-aligned. Disabled "Restricted" crumb is dimmed. Matches Blueprint reference.
- **Dark**: Same trail on dark surface (#1c2127 bg); muted light-gray (#abb3bf) link crumbs; white bold
  current crumb; lighter chevrons. Matches Blueprint dark reference.

## New dependencies added

None.

## Current state

- **Breadcrumbs:** Implemented and verified — `tools/compare.sh breadcrumbs both`.
- **Build:** `pnpm build` green (tsc + vite).
- **Phase 4:** 6/15 COMPLETE. Navbar ✓ Tabs ✓ Collapse ✓ Section ✓ CardList ✓ Breadcrumbs ✓

## Next steps

> Next action: **Tree** (`packages/core/src/components/tree/`).
>
> Phase 4 remaining (in order):
> 7. **Tree** — `tree/` (Icon + Collapse; recursive tree nodes with expand/collapse)
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

tools/compare.sh breadcrumbs both   # re-verify
tools/compare.sh tree both          # next target
```

- Relevant files:
  - `src/components/ui/breadcrumbs.tsx` (new — Breadcrumbs + Breadcrumb components)
  - `src/App.tsx` (BreadcrumbsGallery added + COMPONENTS entry + import)
  - `tools/blueprint-reference/src/App.tsx` (BreadcrumbsGallery added + COMPONENTS entry + imports)
  - `docs/ROADMAP.md` (Breadcrumbs checked)
