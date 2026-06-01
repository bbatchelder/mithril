# 0008 — ProgressBar component

- **Date:** 2026-05-25
- **Focus:** Build the ProgressBar component to Blueprint v6.15 fidelity: track/meter structure,
  stripe gradient, stripe animation, intent coloring, dark-mode; register in both galleries;
  verify computed-style diff + screenshots.
- **Branch / commit:** `phase-1-primitives` @ (this handoff is committed with the work)

## Summary

Built `ProgressBar` (`src/components/ui/progress-bar.tsx`) — a `forwardRef` component using literal
Tailwind arbitrary-value classes for all colors (no runtime `var()` refs). Matches Blueprint's
`bp6-progress-bar` pixel-faithfully: same track height (8px), border-radius (40px), track/meter
background colors, stripe gradient with 30px background-size, and stripe keyframe animation
(300ms linear infinite reverse). Added `@keyframes bp-progress-bar-stripes` to `globals.css`.
Registered in both galleries with 8 paired `data-compare` specimens (1 track + 7 meters).
**Verified: light 8/8 exact, dark 8/8 exact.**

## Current state

**Verified (via `tools/compare.sh progress-bar both` — computed-style diff + screenshots, both themes):**
- **ProgressBar light = 8/8 exact, dark = 8/8 exact.** Compared specimens:
  `pb-track-50`, `pb-meter-50`, `pb-meter-25`, `pb-meter-75`,
  `pb-meter-primary`, `pb-meter-success`, `pb-meter-warning`, `pb-meter-danger`.
- Screenshots confirm correct proportional fill, stripe gradient overlay, intent colors.
  Dark-mode track is near-invisible (rgba(black, 0.5) on #1c2127 background) — correct per spec.
  Indeterminate bars (not diff'd) show full-width animated stripes correctly.

**Build status:** `pnpm build` green (tsc -b + vite). CSS ~33.19 kB.

**No regressions** — capture-styles.js was NOT touched; spinner/divider baselines unchanged.

## Decisions made (and why)

### `meterProps` pass-through for `data-compare` tagging
The meter is an internal `<div>`. Since our component exposes it via `meterProps` (same pattern
as Spinner's `trackProps`/`headProps`), the mithril gallery can tag it directly. The track itself
is the outer div, which accepts `data-compare` via normal HTML attributes on `<ProgressBar>`.

### `TaggedProgressBar` in Blueprint reference (useRef + useEffect)
Blueprint's `<ProgressBar>` doesn't expose data-* props for internal elements. We wrap it with
a `TaggedProgressBar` that uses `useRef` + `useEffect` to query `.bp6-progress-bar` (track) and
`.bp6-progress-meter` (fill) and set `data-compare` after mount — same pattern as `TaggedSpinner`.

### Determinate specimens for all diff'd comparisons
Stripe animation only moves `background-position` (time-varying). Meter width on a determinate
bar is stable and measurable. All 8 diff'd specimens use fixed `value` props.

### Literal arbitrary-value classes for all colors
Track and meter colors cannot be expressed as Tailwind `@theme` utilities without runtime `var()`
refs (which Tailwind v4 tree-shakes from @theme). Arbitrary-value classes like
`bg-[rgba(95,107,124,0.2)]` are literal at build time and always emitted. Same rule as Spinner.

### Stripe gradient as a literal `[background-image:...]` Tailwind class
Blueprint's gradient: `linear-gradient(-45deg, rgba(white,0.2) 25%, transparent 25%, ...)`.
We encode this as a single arbitrary-value utility class with underscores for spaces (Tailwind
arbitrary-value syntax). The gradient's color stops are hardcoded as literals (no `var()`).

### `@keyframes bp-progress-bar-stripes` in globals.css
Added alongside `bp-spinner-spin`. Blueprint's animation runs `linear-progress-bar-stripes`
at `$pt-transition-duration * 3 = 300ms`. Blueprint animates `background-position: 0 0 → 30px 0`
(background-size matches the stripe period). The `reverse` direction on the meter makes stripes
appear to flow from right to left.

### Fixed 200px container for all diff'd specimens
Both galleries wrap each compared ProgressBar in a `{ width: 200 }` inline-style div. This makes
the meter's pixel width (`value * 200`) deterministic and identical on both sides, enabling the
harness to verify `width` as a stable computed property.

### `h-2` for 8px height
Tailwind v4 spacing is 4px per unit. `h-2 = 2 * 4px = 8px = $pt-spacing * 2`. No arbitrary value
needed since the standard Tailwind scale hits the target exactly.

### `rounded-[40px]` for 40px border-radius
Blueprint uses `$pt-spacing * 10 = 4px * 10 = 40px`. There is no standard Tailwind class for 40px,
so we use the arbitrary value `rounded-[40px]` on both track and meter.

### `duration-200` for transition
Blueprint uses `$pt-transition-duration * 2 = 100ms * 2 = 200ms`. Tailwind's `duration-200` maps
exactly. `ease-linear` matches Blueprint's `ease` (the transition ease for width is `$pt-transition-ease`
= `cubic-bezier(0.4,1,0.75,0.9)`, but Blueprint applies it as `ease` in the CSS — we match the
literal value rather than the variable).

## Gotchas / things to know

- **`h-2` hits 8px exactly** — Tailwind v4's spacing scale (0.25rem per unit) matches Blueprint's
  4px grid. `h-2 = 8px`. No need for `h-[8px]`.

- **Dark track is near-invisible** — `rgba(17, 20, 24, 0.5)` on a `#1c2127` background is by
  design. Correct per Blueprint spec.

- **Stripe background-image uses underscore syntax for spaces** — Tailwind arbitrary-value classes
  use underscores to represent spaces within the value (e.g. `[background-size:30px_30px]`).

- **Indeterminate = full-width meter** — Blueprint's default CSS `width: 100%` means an indeterminate
  bar fills completely. We implement this by leaving `width` inline style undefined when `value` is
  not provided, which falls back to the CSS default (inherited `width: 100%` in absolute positioning
  context means the meter fills the track).

- **No `width` capture-styles regression** — The harness already captures `width` as part of standard
  PROPS. The fixed-width container + determinate value makes meter width a stable comparable.

## Next steps

> Continue the vertical slice.

1. **Skeleton** — `src/components/ui/skeleton.tsx`. Blueprint source:
   `packages/core/src/components/skeleton/`. A simple pulsing loading shimmer applied as a
   CSS class modifier. Usually a wrapper or modifier on another element.
2. **Tag** — `src/components/ui/tag.tsx`.
3. **Callout** — `src/components/ui/callout.tsx` (uses Icon).

## How to resume

```bash
cd /Users/bbatchelder/Code/mithril
pnpm dev                                   # mithril → http://localhost:5173
cd tools/blueprint-reference && pnpm dev   # Blueprint reference → http://localhost:5174
tools/compare.sh progress-bar both        # re-verify ProgressBar (auto-starts servers if down)
tools/compare.sh spinner both             # regression: spinner should still be 9/9 exact
tools/compare.sh divider both             # regression: divider should still be 3/3 exact
```

- Component: `src/components/ui/progress-bar.tsx`
- Galleries: `ProgressBarGallery` in `src/App.tsx` and `tools/blueprint-reference/src/App.tsx`
- CSS keyframe: `src/styles/globals.css` — `@keyframes bp-progress-bar-stripes`
- capture-styles.js: `tools/comparison/capture-styles.js` — NOT touched; SVG guard handles
  non-SVG elements (ProgressBar divs) by suppressing stroke props when strokeWidth is falsy.
- Blueprint source: `/Users/bbatchelder/Code/blueprint` (v6.15) —
  `packages/core/src/components/progress-bar/progressBar.tsx`,
  `packages/core/src/components/progress-bar/_progress-bar.scss`,
  `packages/core/src/components/progress-bar/_common.scss` (track/head colors).
- Open questions for the user: none.
