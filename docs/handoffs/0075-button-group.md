# 0075 — ButtonGroup (P1.3)

- **Date:** 2026-05-31
- **Focus:** First P1.3 quick win — a `ButtonGroup` layout/segmentation wrapper around `Button`
  (attached borders, vertical, fill, group-level `variant`/`size`). Kicks off Phase B (P1 completeness).
- **Branch / commit:** `public-readiness` @ `d8ae9e4` (this loop's changes **uncommitted** — see How to resume)

## Summary

Built `src/components/ui/button-group.tsx`: a wrapper that lays out a row/column of `<Button>`s as one
attached control. It collapses the inner radii, overlaps/removes the shared inner borders, and stacks the
hovered/active/focused button above its neighbors (z-index) so its edge isn't clipped — matching
Blueprint's `ButtonGroup`. `variant`/`size` set on the group flow down to child buttons via a new
`ButtonGroupContext` (defined in `button.tsx`, consumed by `Button`), and an explicit per-button prop
always wins. Registered in both galleries, added 9 behavior tests + 1 axe smoke case, regenerated the
registry. `pnpm build` green; `pnpm test` 99 passed (+10); `compare.sh button-group both` computed-style
gate **13 match · 0 differ** in both themes.

## What shipped

- **`button.tsx`** — added `ButtonGroupContext` (`{ variant?, size? }`) + export; `Button` reads it so a
  parent group supplies `variant`/`size` defaults (own prop overrides). Spinner size now uses the
  resolved size. The context lives here, not in `button-group.tsx`, so `Button` stays self-contained and
  the dependency points **ButtonGroup → Button**, never the reverse (own-the-source / copyability).
- **`button-group.tsx`** (new) — CVA-driven. Props: `variant` (default `solid`), `size`, `fill`,
  `vertical`, plus passthrough div attrs. Border-collapse is keyed off `variant`:
  - `solid` — overlap the 1px shadow edges with a negative margin (`-mr-px` / `-mb-px`).
  - `outlined` — drop the shared inner border (`border-r-0` / `border-b-0`) instead, to avoid a doubled rule.
  - `minimal` — no collapse (no border/shadow to merge), matching Blueprint's `:not(.bp6-minimal)` guard.
  Radius collapse uses Blueprint's exact logic: `:not(:first-child)` drops the leading radius,
  `:not(:last-child)` drops the trailing one — so a lone child keeps full radius. Renders
  `role="group"` (overridable; consumer can pass `role="toolbar"` + `aria-label`).
- **Galleries** — `ButtonGroupGallery` in `src/App.tsx` and `tools/blueprint-reference/src/App.tsx`,
  registered under `id: "button-group"` in both `COMPONENTS` arrays. Specimens: solid/outlined/minimal
  horizontal, vertical solid, per-button intents, group-level size+icons, and fill. `data-compare` keys
  (`bg-{solid,outlined,vert}-{container,first,mid,last}`, `bg-fill-container`) match one-for-one.
- **Tests** — `__tests__/button-group.test.tsx` (9): group role + child count, prop passthrough/role
  override, variant & size propagation, explicit-prop-overrides-group (both directions), solid default,
  vertical/fill layout. Added a `ButtonGroup` case to `axe-smoke.test.tsx`.
- **`registry.json`** — regenerated; new `button-group` item with `registryDependencies: [button, utils,
  tokens]`. Clean diff (only the new entry; no pre-existing drift this time).

## Current state

- **Verified:**
  - `pnpm build` ✓ (tsc -b + vite). `pnpm test` → **99 passed** (14 files, +10 this loop).
  - `tools/compare.sh button-group both`: computed-style gate **13 match · 0 differ** in light **and**
    dark — the authoritative DoD gate, clean. Vertical specimens match near-perfectly (SSIM 0.97–0.99).
- **Accepted sub-perceptual delta (documented):** the *horizontal* specimen crops flag higher pixel
  mismatch (middle button ~3px wider than Blueprint, drift accumulating rightward across the row). The
  diff image confirms the **structure is correct** — clean attached borders, collapsed corners, no doubled
  borders. The residual is the **pre-existing per-`Button` font-metric/glyph-advance width drift**
  (the computed-style gate intentionally omits `fontFamily`/glyph advance — see P3.2), amplified on the
  narrow crops. It is a Button-level delta, not a ButtonGroup defect, and vanishes on the full-width
  vertical specimens. Specimen SSIM is explicitly "guide, not a gate."

## Decisions made (and why)

- **Context propagation for `variant`/`size`, not prop-cloning** — cloning children breaks with
  Popover/Tooltip-wrapped triggers and fragments; context is the clean, modern API and matches Blueprint's
  intent (`<ButtonGroup variant="outlined">` styles the whole set once).
- **Context defined in `button.tsx`** — keeps `Button` copyable on its own and enforces the one-way
  ButtonGroup→Button dependency. Copying `button-group` pulls `button` (declared in registry deps); the
  reverse is never required.
- **Targets direct `<button>` children only** — wrapped triggers (Popover/Tooltip) are **not** collapsed
  in this version. Blueprint also styles `.bp6-popover-target > .bp6-button`; deferred as a follow-up if a
  real use-case needs an attached popover-trigger button in a group.
- **`alignText` not implemented** — Blueprint's `ButtonGroup.alignText` pushes a button's icon/text to the
  edges, which is really a `Button` feature analyst's `Button` doesn't have yet. Skipped for v1; revisit if
  needed (would be a Button change, then a passthrough).

## Gotchas / things to know

- **Display-class collisions:** each `(vertical, fill)` combo emits exactly **one** display class
  (`inline-flex` vs `flex`) via `compoundVariants` — never both — because Tailwind resolves
  `inline-flex`/`flex` by CSS source order, not class order, so emitting both is non-deterministic.
- Radius logic is inverted from the naive reading: `:not(:first-child)` removes the *leading* corner and
  `:not(:last-child)` the *trailing* one (so a single child keeps both). Don't "simplify" to
  first-child/last-child or a lone button goes square.
- The pre-existing `HotkeysDialog` "Missing Description" Radix warning still shows in test stderr
  (unrelated to this loop).

## Next steps

> Continue P1.3 quick wins (roadmap `docs/blueprint-parity-roadmap.md`), in order:

1. **AnchorButton** — `<a>`-rendered Button variant. Likely an `as`/anchor path in `button.tsx`
   (Button already forwards refs + has `asChild`). Must render `<a>` with button styling and correct
   disabled semantics (anchors can't be `disabled` — use `aria-disabled` + pointer-events-none + remove
   `href`). Blueprint ref: `anchorButton.tsx`. Register + tests.
2. **MultistepDialog / DialogStep** — build on existing `dialog.tsx`: step state, footer nav
   (Back/Next/Submit), per-step panels. New `src/components/ui/multistep-dialog.tsx`. Blueprint ref:
   `multistepDialog.tsx`. Register + tests.
3. **Promote infra** — export `ResizeSensor`, `OverflowList` (currently inlined in `breadcrumbs.tsx`),
   `Portal`/provider as independently importable components.
4. Then **P2.8 submenus** (Menu is now keyboard-capable) and eventually **P1.1 data grid** (its own phase).

## How to resume

```bash
cd /Users/bbatchelder/Code/analyst-ui
pnpm test                            # 99 pass (9 in button-group.test.tsx)
pnpm build                           # green
tools/compare.sh button-group both   # computed-style 13 match · 0 differ both themes
pnpm dev                             # :5173 → ButtonGroup section
```

- Relevant files: `src/components/ui/button-group.tsx`, `src/components/ui/button.tsx` (context),
  `src/components/ui/__tests__/button-group.test.tsx`, `src/App.tsx` + `tools/blueprint-reference/src/App.tsx`
  (`ButtonGroupGallery`), `registry.json`.
- New deps: **none** (uses CVA + existing Button).
- Open questions for the user: same standing question as 0070–0074 — whether to commit/push and whether
  to fold Phase B work onto a `phase-b-*` branch or keep accumulating on `public-readiness` (user chose to
  continue on `public-readiness` for now).
