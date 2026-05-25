# 0006 — Divider component

- **Date:** 2026-05-25
- **Focus:** Build the Divider component to Blueprint v6.15 fidelity: 1px border-bottom/border-right,
  4px margin, dark-mode border-color swap, compact variant; register in both galleries; verify.
- **Branch / commit:** `phase-1-primitives` @ (this handoff is committed with the work)

## Summary

Built `Divider` (`src/components/ui/divider.tsx`) — a CVA+forwardRef component matching Blueprint's
`bp6-divider` exactly. The element renders with both `border-bottom` and `border-right` at 1px solid
using the `--color-divider` semantic token (rgba(black,0.15) in light, rgba(white,0.2) in dark).
Margin is `4px` on all sides (compact = 0). Registered in both galleries with 3 paired `data-compare`
specimens. Extended `capture-styles.js` to track bottom/right borders and margins.
Verified: **light 3/3 exact, dark 3/3 exact**.

Key discovery: `$pt-spacing = 4px` (not 10px). The CLAUDE.md description "margin: 10px" was incorrect —
Blueprint's `_variables.scss` defines `$pt-spacing: 4px`.

## Current state

**Verified (via `tools/compare.sh divider both` — computed-style diff + screenshots, both themes):**
- **Divider light = 3/3 exact, dark = 3/3 exact.** Compared specimens:
  `divider-default`, `divider-vertical`, `divider-compact`.
- Screenshots confirm horizontal rule in flex-column context, vertical bar in flex-row context,
  compact variant (no margin), both themes.

**Build status:** `pnpm build` green (tsc -b + vite). CSS ~30.2 kB.

## Decisions made (and why)

### `$pt-spacing = 4px`, not 10px
Blueprint's `packages/core/src/common/_variables.scss` defines `$pt-spacing: 4px`. CLAUDE.md's
"margin: 10px" comment was a misread. The correct margin is `m-1` (4px) in Tailwind v4.

### Both borders always present
Blueprint's `.bp6-divider` sets both `border-bottom: 1px` and `border-right: 1px` unconditionally.
The visible border depends on parent flex direction. We mirror this — no `orientation` prop needed
to achieve pixel fidelity, and adding one as a convenience would be additive.

### Dark-mode border-color via `dark:border-divider`
Since `.dark` is on a child `<div>` (not `<html>`), we must use the `dark:` variant utility to
re-evaluate `--color-divider` within the dark scope. The `@theme inline` mapping in `tokens.css`
ensures `border-divider` / `dark:border-divider` both resolve to `--color-divider` which swaps
from rgba(black,0.15) → rgba(white,0.2) inside `.dark`.

### `text-foreground` on DividerGallery outer div
The empty divider element inherits CSS `color` from its ancestor. We added `text-foreground` to
the gallery outer div so the inherited color matches Blueprint's `bp6-dark` inherited foreground
in dark mode (both become `#f6f7f9` / light-gray-5).

### capture-styles.js extended
Added `borderBottomColor`, `borderBottomWidth`, `borderRightColor`, `borderRightWidth`,
`marginTop`, `marginBottom`, `marginLeft`, `marginRight` to `PROPS`. Also added zero-width
cleanup for bottom/right borders (matching existing top-border logic). These additions don't
break existing component diffs since zero-width border colors are suppressed.

### No `orientation` convenience prop
Blueprint has no `orientation` prop — the direction is inferred from the container's flex layout.
We match this behavior exactly. Adding `orientation` is possible but would be additive API
beyond Blueprint's surface, so it's deferred.

### `as` / `tagName` polymorphic element (default `div`)
Matches Blueprint's `tagName` prop pattern. `as` takes precedence for consistency with the
rest of the library (Text, etc.).

## Gotchas / things to know

- **`$pt-spacing = 4px`** — Not 10px. The CLAUDE.md description was wrong. Confirmed from
  `packages/core/src/common/_variables.scss` line 33.

- **Both borders are always rendered** — The element has both `border-bottom` and `border-right`
  at 1px. In a flex-column container, `border-right` is invisible (no right neighbor). In a
  flex-row container, `border-bottom` is invisible (the element stretches to fill height).

- **Empty element height in flex-row** — In `flex-row, align-items: stretch` at `height: 32px`,
  the divider stretches to `32 - 4 - 4 = 24px` (32px minus top+bottom margins). This matches
  Blueprint exactly.

- **capture-styles.js now captures more props** — The expanded PROPS list (bottom/right borders +
  margins) is used for ALL components. This won't cause regressions for prior components because:
  (a) margin = 0 for most components, and (b) bottom/right borders at 0-width get their color
  deleted by the zero-width guard.

## Next steps

> Continue the vertical slice. For each: build with CVA → register in BOTH galleries (same `id`,
> matching `data-compare` keys) → `tools/compare.sh <id>` → confirm light+dark → update registry.

1. **Spinner** — `src/components/ui/spinner.tsx`. Blueprint source:
   `packages/core/src/components/spinner/`. SVG-based with animated stroke dashoffset,
   size variants (small=20px, standard=50px, large=100px), intent coloring on stroke.
2. **ProgressBar** — `src/components/ui/progress-bar.tsx`.

## How to resume

```bash
cd /Users/bbatchelder/Code/analyst-ui
pnpm dev                                   # analyst-ui → http://localhost:5173
cd tools/blueprint-reference && pnpm dev   # Blueprint reference → http://localhost:5174
tools/compare.sh divider both              # re-verify Divider (auto-starts servers if down)
```

- Component: `src/components/ui/divider.tsx`
- Galleries: `DividerGallery` in `src/App.tsx` and `tools/blueprint-reference/src/App.tsx`
- Blueprint source: `/Users/bbatchelder/Code/blueprint` (v6.15) —
  `packages/core/src/components/divider/divider.tsx`,
  `packages/core/src/components/divider/_divider.scss`,
  `packages/core/src/common/_variables.scss` (for `$pt-spacing = 4px`),
  `packages/core/src/common/_color-aliases.scss` (for `$pt-divider-black`, `$pt-dark-divider-white`).
- Open questions for the user: none.
