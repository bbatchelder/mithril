# 0003 — Card component (elevation / interactive / selected / compact)

- **Date:** 2026-05-25
- **Focus:** Build the Card component to Blueprint v6.15 fidelity, and resolve the open
  dark-`--foreground` question from 0002.
- **Branch / commit:** `card-component` @ (this handoff is committed with the work)

## Summary

Built `Card` (CVA + Radix-free div) matching Blueprint's surface: `elevation` 0–4, `interactive`
(hover raises to elevation 3, active drops to 1), `selected` (primary ring), and `compact` padding.
Added card shadow tokens to `tokens.css` (the five surface elevations plus a selection ring), with
the dark-mode inset highlights Blueprint layers at elevations 1–4. Registered Card in both galleries
and verified with the harness: **light 7/7, dark 7/7 exact** (computed-style diff + screenshots).
The user also resolved 0002's open question: **keep mithril's slightly-darker dark text** — do not
match Blueprint's near-white global foreground.

## Current state

**Verified (via `tools/compare.sh card both` — computed-style diff + screenshots, both themes):**
- **Card light = 7/7 exact, dark = 7/7 exact.** Compared specimens: `card-elevation-0..4`,
  `card-selected`, `card-compact`. Screenshots confirm the elevation ramp, dark white-inset borders,
  the brighter dark selection ring, and 16px compact padding all match Blueprint.
- My `--elevation-0..4` tokens already equalled Blueprint's `--bp-surface-shadow-0..4` exactly (both
  themes) — confirmed against the DTCG JSON, so no elevation token changes were needed.

**Build status:** `pnpm build` green (tsc -b + vite). Production CSS ~28 kB (was ~23 kB; +card shadows).
All six `shadow-card-*` utilities confirmed present in the built CSS (tree-shaking guard).

## Decisions made (and why)

- **Dark `--foreground` stays `#f6f7f9`** (the 0002 open question). User prefers the slightly darker
  text; difference vs Blueprint is ≤9/channel and sub-perceptual. **Don't "fix" small dark `color`
  diffs per-component** — it's intentional. (Also recorded in agent memory.)
- **One resting shadow class, chosen in TS** (`ELEVATION_SHADOW[elevation]` or `shadow-card-selected`),
  rather than competing CVA `shadow-*` variants. Avoids relying on tailwind-merge to resolve two
  box-shadow utilities (the 0002 `text-body-lg` drop showed that's fragile). Interactive hover/active
  use **pseudo-class variants** (`hover:`/`active:`) which out-specify the base class, so they layer
  correctly without merge games. A selected card omits hover/active, so its ring persists (Blueprint's
  precedence: `.bp-card.bp-interactive.bp-selected` out-specifies `:hover`/`:active`).
- **Dark card highlights via a `--card-highlight` token** appended to `--card-shadow-1..4` (not 0).
  Mirrors Blueprint's `inset 0 0 0.5px 0 white/0.3, inset 0 0.5px 0 0 white/0.08` over the surface shadow.
- **Selection ring uses relative oklch** — `oklch(from var(--color-blue-3) calc(l ± …) …)` — the exact
  offsets from `_card.scss` (light: `l+0.095 c-0.004 /0.2`+`/1`; dark: `l+0.224 c-0.053 /0.4`+`/1`).
  Both implementations resolve from the same blue-3, so computed colors match identically.
- **`selected` works independently of `interactive`** (cleaner modern API; Blueprint only shows the ring
  when also interactive). The compared specimen is `interactive selected` so it still matches Blueprint
  one-for-one.
- **Compared card specimens use a fixed `width`/`height`** (220×96). Card size is content-driven and not
  a fidelity concern; pinning it keeps line-height differences out of the measured `height` so the diff
  targets card chrome (bg, radius, shadow, padding).

## Gotchas / things to know

- **Body sets `color: var(--foreground)` but `.dark` lives on a child div**, so `--foreground` is only
  overridden *inside* `.dark`. A surface that doesn't set its own text color would inherit the *light*
  foreground even in dark mode. **Card sets `text-foreground` itself** for this reason — needed for
  correct dark text (and gives the small accepted delta rather than a huge one). Same applies to any
  future surface/container component.
- New card tokens: `--card-shadow-0..4` + `--card-shadow-selected` in `:root`/`.dark` (plain custom
  props, always emitted), mapped to `--shadow-card-*` in `@theme inline`. Referenced via literal
  `shadow-card-0`…`shadow-card-selected` / `hover:shadow-card-3` / `active:shadow-card-1`.
- Harness color round-trip normalized both sides' dark text to within ±3/channel here, so even the
  `color` prop passed — but don't rely on that masking the foreground delta elsewhere.

## Next steps

> Continue the vertical slice. For each: build with CVA → register in BOTH galleries (same `id`,
> matching `data-compare` keys) → `tools/compare.sh <id>` → confirm light+dark → update registry.

1. **Input** (text) — Blueprint `packages/core/src/components/forms/`. `--input-shadow` is already
   tokenized in `tokens.css`. Need intent validation states, sizes matching button heights (24/30/40),
   and a measured focus ring. First form control.
2. **Dialog** — `@radix-ui/react-dialog`; overlay + `shadow-elevation-3` (now also `shadow-card-3`
   equivalent). First Radix-portal component — figure out how the harness reaches portaled content.
3. **CardList / Section** (optional) — Blueprint composes Cards into lists; `_card-variables.scss` has
   the list item metrics if useful later.

## How to resume

```bash
cd /Users/bbatchelder/Code/mithril
pnpm dev                                   # mithril → http://localhost:5173
cd tools/blueprint-reference && pnpm dev   # Blueprint reference → http://localhost:5174
tools/compare.sh card both                 # re-verify Card (auto-starts servers if down)
```

- Component: `src/components/ui/card.tsx`. Tokens: `--card-shadow-*` in `src/styles/tokens.css`.
- Galleries: `CardGallery` in `src/App.tsx` and `tools/blueprint-reference/src/App.tsx`.
- Blueprint source: `/Users/bbatchelder/Code/blueprint` (v6.15) —
  `packages/core/src/components/card/{card.tsx,_card.scss,_card-variables.scss}`,
  surface tokens at `packages/core/src/design-tokens/tokens/{base,themes/dark}/surface.tokens.json`.
- Open questions for the user: none.
