# 0072 — component fidelity delta cleanup

- **Date:** 2026-05-31
- **Focus:** Work the `docs/component-fidelity-deltas.md` backlog — fix the real deltas, formally accept + document the rest.
- **Branch / commit:** a11y-behavior-gaps @ (pre-commit)

## Summary

Drove `tools/compare.sh` over the 18 flagged components and discovered most "deltas" are
computed-style *mechanism* differences that render pixel-identical (gap vs margin, fixed-width vs
min-width+padding, explicit vs UA-default font-size, `getComputedStyle` artifacts). Two were real
visual bugs and are fixed; the floating-panel shadow family was genuinely wrong and is fixed via a
new token family; the rest are accepted + documented. Full decision table is at the top of
`docs/component-fidelity-deltas.md` ("Resolution (2026-05-31)").

## Current state

Verified via `tools/compare.sh <id> both` (computed-style gate), `pnpm build` green throughout.

- **Real fixes (now `0 differ` both themes):**
  - `card-list` — divider hairline `rgba(0,0,0,.1)` → `rgba(20,20,20,.1)`.
  - `segmented-control` — unselected dark text bug: `dark:text-white` (from `buttonVariants`
    minimal/none) out-specified the plain `text-foreground-muted` override; re-asserted
    `dark:text-foreground-muted dark:[&_svg]:fill-current`. Dark went 2→1 differ (remaining
    `sc-default minWidth` is an intentional accept).
  - **Overlay-shadow token split** (`tokens.css`): added `--overlay-shadow-1/3/4` (+ `.dark`) and
    `--shadow-overlay-1/3/4` utilities. Light hairline ring is `rgba(20,20,20,.1)` (Cluster A); dark
    interleaves the trailing drop *after* the inset edge-highlights (Cluster B). Repointed
    `popover`, `dialog`, `alert`, `drawer`, `omnibar`, `navbar`, `tooltip`, `context-menu`, and the
    `slider` value-pill (light, inline) off `shadow-card-*`. **Cards untouched** — they legitimately
    use the pure-black ring + drops-then-highlights order (verified: `card` still 7/7).
  - `popover`/`context-menu` dark border ring `rgb(94,95,97)` → `rgb(94,96,100)`.
  - `toast` — `min-w-[300px]`→`min-w-[min(300px,100%)]`, max likewise. Both specimens clean.
  - `drawer` — header/footer dark divider shadow `rgba(0,0,0,.4)` → `rgba(17,20,25,.4)`.
  - `slider` — handle dark shadow base `rgba(0,0,0,…)` → `rgba(15,20,25,…)`; value-pill dark shadow
    → `rgba(17,20,25,.4)`.
  - Components now fully clean both themes: `card-list`, `dialog`, `alert`, `navbar`, `omnibar`,
    `toast`, `drawer`, `context-menu`. No regressions on `card`, `menu`.

- **Accepted + documented** (see Resolution table): popover/tooltip arrow `height`
  (radix-arrow-box-sizing) and `minWidth 0/auto` (getComputedStyle artifact, renders identical);
  `sc-default minWidth`; `slider-handle` dark `color` (invisible knob); tag/key `marginRight`
  (gap-based spacing); date-* nav padding/minWidth & field padding (fixed 30×30 box); date-* day
  near-white color; `fontSize 14/13.333` (UA default; analyst truer to intent); `tag-input` ghost
  dark color (empty input).

- **Not verified / assumed:** the accepted items above were *not* re-run this session (unchanged
  code) — their values are from the 2026-05-30 sweep. The multi-select / date-* popovers now inherit
  the overlay-shadow change but their flagged deltas weren't shadow, so no behavior change expected.

## Decisions made (and why)

- **Blueprint has two shadow families, not one.** Cards render the elevation hairline as
  `rgba(0,0,0,.1)`; floating panels render it as `rgba(20,20,20,.1)`, and dark panels interleave the
  second drop with the inset highlights. analyst had collapsed both into `--card-shadow-*`, so a
  global token edit fixed panels but regressed all 4 card elevations (caught via harness). The split
  into `--overlay-shadow-*` is the correct model. **Do not "simplify" them back together.**
- The hairline deltas are sub-perceptual (1px @ 10% alpha); fixed anyway for exact computed match per
  user direction, since the token split is clean and low-risk.
- Left `slider-handle` dark `color` mismatched rather than add a `dark:text-[…]` to a knob with no
  rendered text — it would be misleading code for a never-painted value.

## Gotchas / things to know

- `shadow-overlay-*` must be referenced as **literal utility classes** (they are) or Tailwind v4
  tree-shakes the `@theme` vars — same rule as the rest of the token system.
- `--overlay-shadow-4` dark `= var(--card-shadow-4)` on purpose: elevation-4 has a single drop, so
  there's nothing to interleave (omnibar dark was already clean).
- Several code comments still said `shadow-card-N` matched Blueprint exactly — they didn't (ring was
  pure black). Comments updated where touched.

## Harness: accepted-delta waivers

Added a waiver layer so the harness stops re-flagging reviewed-benign deltas while still catching
regressions:

- `tools/comparison/accepted-deltas.json` — per-component waivers: **styles** (value-pinned
  `[analyst, blueprint]` pairs — suppressed only while the live values still match; drift re-flags),
  **unpaired** (`only in analyst` keys covered under their own id), **visual** (`expectSize` /
  `ssimArtifact` — a *new* size mismatch always re-flags).
- `tools/comparison/waivers.mjs` — shared loader + matchers; `diff-styles.mjs` / `diff-specimens.mjs`
  consult it. `CMP_NO_WAIVERS=1` disables all waivers for re-auditing.
- Verified: all 11 reviewed components now report `0 differ` both themes; a tampered value (minWidth
  `0px`→`200px`) and a new prop both re-flag; `button` (no waiver) and the raw escape-hatch unaffected.
- Docs: `tools/comparison/README.md` → "Accepted-delta waivers".

The visual SSIM gate is still intentionally sensitive ("a guide, not a gate") — only the specific
reviewed specimens are waived; broad small-text SSIM noise on un-reviewed specimens (sc-fill,
slider-default, time-picker-input, …) is left as-is.

## Next steps

1. Commit this work (all on `a11y-behavior-gaps`, per the user's branch choice).
2. Optional: the accepted items are defensible but if a future pass wants *zero* differs, the
   remaining candidates are all in the Resolution "Accepted" table — none are visual.

## How to resume

```bash
pnpm build
tools/compare.sh popover both   # spot-check; servers auto-start on :5173/:5174
```

- Relevant files: `src/styles/tokens.css` (overlay-shadow tokens), the 11 repointed components,
  `docs/component-fidelity-deltas.md` (Resolution table).
- Open questions for the user: none — the three judgment calls (Cluster A/B/toast) were approved and
  done; everything else is documented-accept.
