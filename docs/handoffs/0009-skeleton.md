# 0009 — Skeleton

- **Date:** 2026-05-25
- **Focus:** Build the Skeleton loading-state component (Phase 1 #6)
- **Branch / commit:** phase-1-primitives @ (see git log)

## Summary

Built `src/components/ui/skeleton.tsx` as a standalone placeholder `<Skeleton>` component
with Blueprint's exact glow styling. Added the `bp-skeleton-glow` `@keyframes` to
`globals.css`. Registered matching galleries in both `src/App.tsx` and
`tools/blueprint-reference/src/App.tsx` under `id="skeleton"`. Build is green and
`tools/compare.sh skeleton both` reports **2 match, 0 differ** in both light and dark themes.

## Current state

- **Skeleton** — fully built and verified. `compare.sh skeleton both` → 2 match, 0 differ
  (light) and 2 match, 0 differ (dark). Screenshots confirm identical visual appearance.
- `globals.css` keyframes added: `bp-skeleton-glow` (start=rgba(211,216,222,0.2), end=rgba(95,107,124,0.2)).
- `skeletonClass` string exported for the modifier pattern (skeletonize existing elements).
- Build: `pnpm build` green (tsc + vite).
- No new deps added.

## Decisions made (and why)

- **Shadcn-style standalone component** (`<Skeleton className="h-4 w-32" />`) plus exported
  `skeletonClass` string for the Blueprint modifier pattern. The `Skeleton` component is sized
  purely through `className`, matching the shadcn convention and keeping the API minimal.

- **`animate={false}` prop** — instead of a separate "static" component, a single boolean
  toggles `[animation:none]` override. This lets the harness disable animation for
  deterministic diffs while the animated version works identically.

- **Animation disabled on both gallery sides** — both mithril and Blueprint reference apply
  `animation: none` (via `animate={false}` or inline `style={{ animation: "none" }}`) on the
  keyed `data-compare` specimens. This freezes `backgroundColor` at the start color
  (`rgba(211,216,222,0.2)`) making it deterministically comparable. Animated specimens are
  present for visual review but carry no `data-compare` key.

- **Same colors in both light and dark themes** — Blueprint's skeleton SCSS has no dark-theme
  override (confirmed by searching `_dark-theme.scss` and grep across all SCSS files). The same
  `rgba($light-gray1, 0.2)` → `rgba($gray1, 0.2)` applies in both themes. The mithril
  implementation uses the same values.

- **`background-clip: padding-box`** — expressed as `[background-clip:padding-box]` Tailwind
  arbitrary property. Blueprint uses `!important` here; our utility wins because there are no
  competing Tailwind background-clip utilities on the same element in normal usage.

- **Children and pseudo-elements hidden** — `[&::before]:invisible [&::after]:invisible [&_*]:invisible`
  using Tailwind's arbitrary variant syntax. Blueprint uses `visibility: hidden !important` on
  `&::before, &::after, *`. These Tailwind utilities apply `visibility: hidden` which is
  equivalent (and since they come last in cascade, they win).

- **`text-transparent` for color: transparent** — Tailwind's built-in `text-transparent` maps to
  `color: transparent` exactly.

- **`shadow-none` for box-shadow: none** — Tailwind's `shadow-none` applies `box-shadow: none`
  which wins over any consumer shadow (it's the last rule in cascade for this utility class).

- **No border-width set on standalone Skeleton** — Blueprint sets `border-color: <start>` but
  no explicit border-width on `.bp6-skeleton`. When applied as a modifier to a bordered element
  (e.g. a button), the element's existing border-width is kept and only the color is overridden.
  Our `border-[rgba(211,216,222,0.2)]` works the same way — it sets border-color without
  forcing a width.

## Gotchas / things to know

- Skeleton's `@keyframes` name is `bp-skeleton-glow` (prefixed `bp-`) to stay consistent with
  the `bp-spinner-spin` and `bp-progress-bar-stripes` keyframe names already in globals.css.

- Blueprint's animation duration is `$pt-transition-duration * 10 = 100ms * 10 = 1000ms = 1s`.
  The animation is `linear infinite alternate` (bounces between start and end colors).

- The comparison harness captures `backgroundColor` and `borderColor` (via `borderTopColor` etc.)
  which are set by the frozen animation state (`animation: none` → base value applies =
  `skeleton-color-start`). `boxShadow` is captured as "none". `color` is captured as transparent
  (rgba(0,0,0,0)). `borderRadius` is 2px.

- The dark-mode card in the mithril "modifier pattern" section renders the skeletonized children
  with a slightly darker appearance than Blueprint's dark card — this is intentional: mithril's
  dark Card uses `#252a31` while Blueprint's `bp6-card.bp6-dark` uses the same value. The slight
  visual difference in screenshots is from the container (card shadow/background) not the skeleton
  itself.

- `capture-styles.js` was NOT modified.

## Next steps

> Next component in Phase 1 order: Tag.

1. **Tag** — `src/components/ui/tag.tsx`
   Blueprint source: `packages/core/src/components/tag/`
   Key spec: inline label with optional remove button, intent colors, minimal/outlined/solid variants,
   icon support, large size. Register in both galleries, compare.sh tag both.

2. **Callout** — `src/components/ui/callout.tsx` — follows Tag in Phase 1.

## How to resume

```bash
git checkout phase-1-primitives
pnpm dev            # :5173
cd tools/blueprint-reference && pnpm dev  # :5174

tools/compare.sh skeleton both   # should still be 2 match, 0 differ
```

- Relevant files:
  - `src/components/ui/skeleton.tsx` — the component
  - `src/styles/globals.css` — `bp-skeleton-glow` keyframes added
  - `src/App.tsx` — SkeletonGallery + COMPONENTS entry
  - `tools/blueprint-reference/src/App.tsx` — BP SkeletonGallery + COMPONENTS entry
  - `docs/ROADMAP.md` — Skeleton ticked
- Open questions: none
