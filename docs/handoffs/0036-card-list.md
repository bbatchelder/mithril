# 0036 — CardList (Phase 4 #5)

- **Date:** 2026-05-26
- **Focus:** Build CardList container to Blueprint v6.15 fidelity, both light and dark themes.
- **Branch / commit:** phase-4-navigation @ (see commit SHA)

## Summary

Built `src/components/ui/card-list.tsx` exporting `CardList` — a vertical list of flat `Card` rows
separated by hairline dividers. Registered in both galleries under `id="card-list"`. Verified with
`tools/compare.sh card-list both`.

- **Light:** 2 specimens — 1 exact match + 1 accepted sub-perceptual delta (divider base color, see below).
- **Dark:** 2 match · 0 differ — perfect.

**Phase 4 item 5 of 15 — CardList COMPLETE.**

> **Recovery note:** the CardList build worker terminated before wrapping up — it wrote
> `card-list.tsx` + both galleries but did not verify/tick/handoff/commit (its final message was just
> a dev-server health check). The orchestrator (this session) re-verified the uncommitted work itself
> (`pnpm build` green, `compare.sh card-list both`, screenshot review), found it sound modulo the known
> divider delta, and completed the loop. No rework to the component was needed.

## API

```tsx
// Bordered (default) — has the elevation ring + rounded corners
<CardList>
  <Card>Item one</Card>
  <Card interactive>Item two — clickable (hover highlight)</Card>
  <Card>Item three</Card>
</CardList>

// Compact — 16px horizontal padding instead of 20px (cascades to all rows)
<CardList compact>
  <Card>Compact item one</Card>
  <Card interactive>Compact item two</Card>
</CardList>

// Flush — no border/shadow/radius; use when nesting inside another bordered container
<CardList bordered={false}>
  <Card>Flush item one</Card>
  <Card>Flush item two</Card>
</CardList>
```

### CardList props

| Prop | Type | Default | Description |
|---|---|---|---|
| `bordered` | `boolean` | `true` | Show the container's elevation ring + rounded corners. Set `false` when nesting inside another bordered surface (e.g. SectionCard). In dark, `false` adds a 1px margin + `width: calc(100% - 2px)` to clear the inset ring. |
| `compact` | `boolean` | `false` | Reduce row horizontal padding (20px → 16px). Cascades to every child Card. |
| `className` | `string` | — | Additional class on the outer container. |
| `children` | `ReactNode` | — | Card rows. |

Child rows are ordinary `Card` components. Interactive rows use `<Card interactive>`; selected rows
set `data-selected` (the container styles them via descendant selectors).

## Blueprint metrics matched

| Property | Value | Source |
|---|---|---|
| Outer overflow | `auto` | `.bp6-card-list { overflow: auto }` |
| Outer padding | `0` (`1px` dark, bordered) | `.bp6-card-list` / dark inset-ring clearance |
| Outer width | `100%` | `.bp6-card-list { width: 100% }` |
| Outer elevation | `0` | uses `Card elevation={0}` |
| Row display | `flex; align-items: center` | `.bp6-card-list > .bp6-card` |
| Row border-radius / shadow | `0` / `none` | flat within list |
| Row min-height | `47px` | `$pt-button-height(30) + 2·8 + 1px` |
| Row padding | `8px 20px` / `8px 16px` compact | `$card-list-item-padding[-compact]` |
| Divider (between rows) | `1px solid rgba(0,0,0,0.1)` light | `$pt-divider-black-muted` (note: **muted** 0.1, not Section's 0.15) |
| Divider (dark) | `1px solid rgba(255,255,255,0.1)` | `$pt-dark-divider-white-muted` |
| First/last row corners | restore container radius | `.bp6-card-list-bordered` first/last child |
| Interactive hover/active bg | `#f6f7f9` light / `#2f343c` dark | `$light-gray5` / `$dark-gray3` |
| Selected bg | `#edeff2` light / `#383e47` dark | `$light-gray4` / `$dark-gray4` |

## Design decisions

- **Composes `Card`**: the outer container is `<Card elevation={0}>` (surface bg, radius, shadow ring),
  with `p-0 overflow-auto w-full min-w-0` overriding Card's default padding. Rows are ordinary Cards.
- **Descendant utility selectors** instead of CSS-in-JS: row flattening, dividers, hover/selected
  states are all expressed as `[&>div...]` Tailwind v4 arbitrary variants on the container, so a
  consumer just drops plain `<Card>`s inside. Interactive rows are targeted via `[&>div.cursor-pointer:hover]`
  (Card adds `cursor-pointer` when `interactive`); selected rows via `[&>div[data-selected]]`.
- **Compact cascades** from the container (`compact ? [&>div]:px-4 : [&>div]:px-5`) — matches Blueprint's
  parent-modifier behavior; no need to set compact per row.
- **Dark flush/bordered ring clearance**: `dark:p-[1px]` (bordered) and `dark:m-[1px] dark:w-[calc(100%-2px)]`
  (flush) reproduce Blueprint's 1px inset-ring clearance in dark theme.

## Accepted deltas

- **Light `card-list-item` `borderBottomColor`**: analyst `rgba(0,0,0,0.102)` vs Blueprint
  `rgba(20,20,20,0.102)`. The same established sub-perceptual base-color delta seen on every divider/shadow
  (pure black vs Blueprint's near-black `#141414`) at ~0.1 alpha → ≈2/channel effective, imperceptible.
  Dark divider matches exactly. No other deltas.

## compare.sh results

```
card-list · light:  1 match · 1 differ  (divider base color — accepted, sub-perceptual)
card-list · dark:   2 match · 0 differ
```

Screenshot confirmation:
- **Light**: Bordered list (4 rows w/ rounded outer corners + hairline dividers), Compact list (tighter
  horizontal padding), Flush list (no border/shadow). Interactive rows highlight on hover. Matches reference.
- **Dark**: Same three lists on dark surface; light row text; muted white dividers; proper inset ring. Matches.

## New dependencies added

None.

## Current state

- **CardList:** Implemented and verified — `tools/compare.sh card-list both`.
- **Build:** `pnpm build` green (tsc + vite).
- **Phase 4:** 5/15 COMPLETE. Navbar ✓ Tabs ✓ Collapse ✓ Section ✓ CardList ✓

## Next steps

> Next action: **Breadcrumbs** (`packages/core/src/components/breadcrumbs/`).
>
> Phase 4 remaining (in order):
> 6. **Breadcrumbs** — `breadcrumbs/` (horizontal crumbs separated by chevron-right; current crumb bold,
>    earlier crumbs muted-link; reuse Icon. Render a simple non-overflowing trail; note overflow-menu
>    collapse (OverflowList + Menu + Popover) as a follow-up.)
> 7. **Tree** — `tree/` (Icon + Collapse)
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

tools/compare.sh card-list both     # re-verify
tools/compare.sh breadcrumbs both   # next target
```

- Relevant files:
  - `src/components/ui/card-list.tsx` (new — CardList container)
  - `src/App.tsx` (CardListGallery added + COMPONENTS entry + import)
  - `tools/blueprint-reference/src/App.tsx` (CardListGallery added + COMPONENTS entry + imports)
  - `docs/ROADMAP.md` (CardList checked)
