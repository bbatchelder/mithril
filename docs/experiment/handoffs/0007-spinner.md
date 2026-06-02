# 0007 — Spinner component

- **Date:** 2026-05-25
- **Focus:** Build the Spinner component to Blueprint v6.15 fidelity: SVG arc, stroke colors,
  size variants, intent overrides, determinate/indeterminate modes, dark-mode; register in
  both galleries; verify computed-style diff + screenshots.
- **Branch / commit:** `phase-1-primitives` @ (this handoff is committed with the work)

## Summary

Built `Spinner` (`src/components/ui/spinner.tsx`) — a CVA-free, forwardRef component using direct
Tailwind arbitrary-value classes for SVG stroke colors. Matches Blueprint's `bp6-spinner` pixel-
faithfully: same track/head arc geometry, stroke widths, colors, dashoffset, fill-opacity, and
animation. Extended `capture-styles.js` to capture SVG path properties (stroke, strokeWidth,
strokeDasharray, strokeDashoffset, strokeLinecap, fillOpacity) with a guard that suppresses them
for non-SVG elements. Registered in both galleries with 9 paired `data-compare` specimens
(track+head for sm/std, head for lg, head for 4 intents), all using determinate `value=0.5`.
**Verified: light 9/9 exact, dark 9/9 exact.** Divider regression: 3/3 both themes.

## Current state

**Verified (via `tools/compare.sh spinner both` — computed-style diff + screenshots, both themes):**
- **Spinner light = 9/9 exact, dark = 9/9 exact.** Compared specimens:
  `spinner-sm-track`, `spinner-sm-head`, `spinner-std-track`, `spinner-std-head`,
  `spinner-lg-head`, `spinner-primary-head`, `spinner-success-head`,
  `spinner-warning-head`, `spinner-danger-head`.
- Screenshots confirm correct arc, stroke weights, colors, and rounded linecap.
  Dark-mode track is near-invisible (rgba(black, 0.5) on a dark background) — correct per spec.

**Divider regression: 3/3 both themes (unchanged).**

**Build status:** `pnpm build` green (tsc -b + vite). CSS ~31.26 kB.

## Decisions made (and why)

### `data-compare` on internal path elements via `trackProps`/`headProps`
The key fidelity props live on the SVG `<path>` elements (stroke color, strokeWidth, dashoffset,
strokeLinecap, fillOpacity). Since Spinner renders them internally, we expose `trackProps` and
`headProps` as pass-through prop bags typed with `data-${string}` index signatures. On the
Blueprint reference side, `<Spinner>` doesn't expose path props, so we use a `TaggedSpinner`
wrapper with `useRef` + `useEffect` that calls `setAttribute("data-compare", key)` on the
`.bp6-spinner-track` / `.bp6-spinner-head` paths after mount. The harness runs after `networkidle`
so the attributes are always present.

### Determinate specimens for all diff'd comparisons
An indeterminate spinner rotates, making `stroke-dashoffset` and `transform` non-deterministic
in screenshots. All 9 diff'd specimens use `value=0.5` (dashoffset = 140, no animation). An
indeterminate section is shown visually but carries no `data-compare` keys and is not diff'd.

### `[fill-opacity:0]` not `fill-transparent`
Blueprint uses `fill-opacity: 0` on paths. Tailwind's `fill-transparent` sets `fill: transparent`
(leaving `fillOpacity` at 1 computationally). The correct Tailwind v4 arbitrary class is
`[fill-opacity:0]`, which maps directly to `fill-opacity: 0` and matches Blueprint's computed value.

### Literal arbitrary-value classes for SVG stroke colors
Stroke colors (rgba variants, hex intent colors) cannot be expressed as Tailwind `@theme` utilities
without runtime `var()` in inline styles (which would be tree-shaken). Arbitrary-value classes
like `stroke-[rgba(95,107,124,0.2)]` are literal at build time and always emitted.

### `@keyframes bp-spinner-spin` in globals.css
Added the rotation keyframe to `src/styles/globals.css`. The animation wrapper uses
`[animation:bp-spinner-spin_500ms_linear_infinite]` for indeterminate, `[animation:none]`
for determinate. Blueprint uses 500ms = 5 × $pt-transition-duration (100ms).

### `strokeLinecap: "round"` via inline style on head path
`strokeLinecap` is an SVG presentation attribute. Setting it via Tailwind would require `[stroke-linecap:round]`. Inline style is cleaner here and not subject to tree-shaking (it's a
structural attribute, not a `@theme` token).

### capture-styles.js extended with SVG/stroke props + guard
Added: `stroke`, `strokeWidth`, `strokeDasharray`, `strokeDashoffset`, `strokeLinecap`, `fillOpacity`.
Guard: if `s.strokeWidth` is falsy or empty (HTML elements return "" for SVG props), delete all
6 SVG props from the record. This prevents false diffs on other components' specimens that
happen to have a `data-compare` key but are not SVG path elements.

## Gotchas / things to know

- **`[fill-opacity:0]` not `fill-transparent`** — see above. This was the only non-obvious
  mismatch. The first run showed `fillOpacity: 1 (mithril) vs 0 (blueprint)` for all 9 specimens.

- **Dark track is near-invisible** — `rgba(17, 20, 24, 0.5)` on a `#1c2127` background is by
  design. It's what Blueprint specifies (`rgba($black, 0.5)` where `$black = #111418`).

- **No CVA** — Spinner has enough runtime computation (strokeWidth, dashoffset, viewBox) that
  CVA adds no value. The component uses direct `cn()` calls with literal class lists.

- **Blueprint reference uses `useEffect` to tag paths** — not `useLayoutEffect`, since we only
  need the attributes present when the harness reads them (after `networkidle`), not before paint.

- **`data-compare` type** — `SVGAttributes<SVGPathElement>` doesn't include `data-*` keys in
  TypeScript's strict types. We use a `{ [key: \`data-\${string}\`]: string | undefined }` index
  signature intersection to allow them without casting in the gallery.

## Next steps

> Continue the vertical slice.

1. **ProgressBar** — `src/components/ui/progress-bar.tsx`. Blueprint source:
   `packages/core/src/components/progress-bar/`. Shares the same track/head color variables
   as Spinner (from `progress-bar/_common.scss`). HTML structure: `.bp6-progress-bar >
   .bp6-progress-meter`. Animated stripes for indeterminate; intent coloring; `animate` prop.
2. **Skeleton** — `src/components/ui/skeleton.tsx`.
3. **Tag** — `src/components/ui/tag.tsx`.

## How to resume

```bash
cd /Users/bbatchelder/Code/mithril
pnpm dev                                   # mithril → http://localhost:5173
cd tools/blueprint-reference && pnpm dev   # Blueprint reference → http://localhost:5174
tools/compare.sh spinner both              # re-verify Spinner (auto-starts servers if down)
tools/compare.sh divider both              # regression: divider should still be 3/3 exact
```

- Component: `src/components/ui/spinner.tsx`
- Galleries: `SpinnerGallery` in `src/App.tsx` and `tools/blueprint-reference/src/App.tsx`
- CSS keyframe: `src/styles/globals.css` — `@keyframes bp-spinner-spin`
- capture-styles.js: `tools/comparison/capture-styles.js` — SVG props + guard
- Blueprint source: `/Users/bbatchelder/Code/blueprint` (v6.15) —
  `packages/core/src/components/spinner/spinner.tsx`,
  `packages/core/src/components/spinner/_spinner.scss`,
  `packages/core/src/components/progress-bar/_common.scss` (track/head colors).
- Open questions for the user: none.
