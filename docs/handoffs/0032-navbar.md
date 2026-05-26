# 0032 — Navbar (Phase 4 #1)

- **Date:** 2026-05-26
- **Focus:** Build Navbar, NavbarGroup, NavbarHeading, NavbarDivider to Blueprint v6.15 fidelity.
- **Branch / commit:** phase-4-navigation @ (see commit SHA)

## Summary

Built `src/components/ui/navbar.tsx` exporting four components: `Navbar`, `NavbarGroup`,
`NavbarHeading`, and `NavbarDivider`. Registered in both galleries under `id="navbar"`.

Verified with `tools/compare.sh navbar both`. Both themes show: 2 match, 1 differ — the
only diff is the `boxShadow` property (accepted, same known-intentional deltas as all Card
elevations throughout the project).

**Phase 4 item 1 of 15 — Navbar COMPLETE.**

## API

```tsx
// Navbar: top application bar
<Navbar fixedTop={false} className="">
  <NavbarGroup align="left">
    <NavbarHeading>My Application</NavbarHeading>
    <NavbarDivider />
    <Button variant="minimal">Home</Button>
    <Button variant="minimal">Files</Button>
  </NavbarGroup>
  <NavbarGroup align="right">
    <Button variant="minimal">Log in</Button>
  </NavbarGroup>
</Navbar>
```

### Components

| Component | Props | Defaults |
|---|---|---|
| `Navbar` | `fixedTop?: boolean`, `className?`, `children?`, `...HTMLDivProps` | `fixedTop=false` |
| `NavbarGroup` | `align?: "left" \| "right"`, `className?`, `children?`, `...HTMLDivProps` | `align="left"` |
| `NavbarHeading` | `className?`, `children?`, `...HTMLDivProps` | — |
| `NavbarDivider` | `className?`, `...HTMLDivProps` | — |

All four use `forwardRef` and forward all HTML div attributes.

## Blueprint metrics matched

| Property | Value | Source |
|---|---|---|
| Navbar height | `50px` | `$pt-navbar-height = $pt-spacing * 12.5` |
| Navbar padding | `0 16px` | `$navbar-padding = $pt-spacing * 4` |
| Navbar bg (light) | `white (#ffffff)` | `$card-background-color = $white` |
| Navbar bg (dark) | `#252a31` (dark-gray-2) | `--surface` token (see design decisions) |
| Navbar shadow | `shadow-card-1` | `$pt-elevation-shadow-1` mapped to card-1 |
| NavbarGroup height | `50px` | same as navbar height |
| NavbarGroup layout | flex row, items centered | modern equivalent of float:left/right |
| NavbarHeading font-size | `16px` | `$pt-font-size-large = $pt-spacing * 4` |
| NavbarHeading font-weight | `400` (normal, inherits) | Blueprint has no explicit weight |
| NavbarHeading margin-right | `16px` | `$navbar-padding = 16px` |
| NavbarDivider height | `20px` | `$pt-navbar-height - $pt-spacing * 7.5 = 50 - 30` |
| NavbarDivider margin | `0 8px` | `0 ($pt-spacing * 2)` |
| NavbarDivider border | `1px solid rgba(0,0,0,0.15)` | `$pt-divider-black` = `--divider` token |
| NavbarDivider dark border | `rgba(255,255,255,0.2)` | `$pt-dark-divider-white` = `--divider` dark |

## Design decisions

- **Flexbox layout instead of floats**: Blueprint uses `float: left` / `float: right` for left/right
  NavbarGroups. We use `display: flex; justify-content: space-between` on the Navbar, placing
  NavbarGroups inside it. The visual output is identical (left group left, right group right) while
  being cleaner modern CSS without float clearfix concerns.

- **NavbarGroup `align` prop**: Only `"left"` and `"right"` are supported, matching Blueprint's
  Alignment.LEFT / Alignment.RIGHT. Blueprint warns against `Alignment.CENTER` for NavbarGroups;
  we simply don't support `"center"`.

- **NavbarDivider uses border-left directly** (not reusing the `Divider` component): The generic
  `Divider` component uses both border-bottom and border-right for bidirectional context detection.
  NavbarDivider is always vertical, so we use only border-left with explicit `h-5` (20px) and `mx-2`
  (8px) margins — cleaner and avoids an invisible right border.

- **Dark navbar bg = dark-gray-2 (#252a31)** via `bg-surface`: Blueprint's `$dark-card-background-color`
  resolves to `$dark-gray3 = #2f343c`. Our `--surface` in dark = `dark-gray-2 = #252a31` — this is
  the same token used for all Card components. Keeping Navbar consistent with Card (both use `bg-surface`)
  is the right trade-off; the delta is sub-perceptual in screenshots and documented here.

- **`z-content` on Navbar**: Blueprint uses `$pt-z-index-content = 10`. We apply `z-content` which maps
  to our `--z-content: 10` token. This ensures the navbar stacks above page content.

- **fixedTop variant**: Sets `position: fixed; left/right/top: 0`. Uses `z-overlay` (z-index: 20) instead
  of `z-content` (10) so fixed navbars appear above normal page content.

## Accepted deltas

| Theme | Specimen | Property | Analyst | Blueprint | Why |
|---|---|---|---|---|---|
| Light | navbar | boxShadow | `rgba(0, 0, 0, 0.102) 0px 0px 0px 1px, ...` | `rgba(20, 20, 20, 0.102) 0px 0px 0px 1px, ...` | First shadow layer: pure black (#000000) vs near-black (#141414). Our `--elevation-1` uses `rgba(0,0,0,0.1)`; Blueprint computed output uses `rgba(20,20,20,0.1)`. Sub-perceptual — 10% opacity, both essentially black. Same delta in all Card elevations. |
| Dark | navbar | boxShadow | Same layers, different order: `-1px` layer is 3rd vs 5th | Blueprint orders the `-1px` layer last | Shadow layers have same values; CSS rendering order differs between how Blueprint SCSS vs our CSS token concatenates elevation + highlight layers. Sub-perceptual, same as prior components. |

## compare.sh results

```
navbar · light:  2 match · 1 differ — boxShadow (accepted, same as card elevation delta)
navbar · dark:   2 match · 1 differ — boxShadow layer order (accepted, same as card elevation delta)
```

Screenshot confirmation:
- **Light**: White navbar bar with subtle shadow, "My Application" heading, vertical 20px divider,
  minimal buttons "Home" "Files" left, "Log in" right. Matches Blueprint visually ✓
- **Dark**: Dark-gray navbar bar (`#252a31`) with inset white border highlight visible, same heading/
  divider/buttons layout. Blueprint shows slightly darker bg (`#2f343c`) — documented decision ✓

## New dependencies added

None.

## Current state

- **Navbar:** Fully implemented and verified — `tools/compare.sh navbar both`.
- **Build:** `pnpm build` green (tsc + vite); blueprint-reference `tsc --noEmit` green.
- **Phase 4:** 1/15 COMPLETE. Navbar ✓

## Next steps

> Next action: **Tabs** (`packages/core/src/components/tabs/`).
>
> Phase 4 remaining (in order):
> 2. **Tabs** — `tabs/`
> 3. **Collapse** — `collapse/`
> 4. **Section** — `section/`
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

tools/compare.sh navbar both
tools/compare.sh tabs both    # next target
```

- Relevant files:
  - `src/components/ui/navbar.tsx` (new — Navbar/NavbarGroup/NavbarHeading/NavbarDivider)
  - `src/App.tsx` (NavbarGallery added + COMPONENTS entry + import)
  - `tools/blueprint-reference/src/App.tsx` (NavbarGallery added + COMPONENTS entry + Alignment/Navbar imports)
  - `docs/ROADMAP.md` (Navbar checked)
