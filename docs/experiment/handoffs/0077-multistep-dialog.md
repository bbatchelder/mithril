# 0077 — MultistepDialog / DialogStep (P1.3)

- **Date:** 2026-05-31
- **Focus:** P1.3 — a multi-step wizard dialog built on the owned `Dialog`. Third item of Phase B
  (P1 completeness), after ButtonGroup (0075) and AnchorButton (0076).
- **Branch / commit:** `public-readiness` (see How to resume for commit status)

## Summary

Built `src/components/ui/multistep-dialog.tsx`: `MultistepDialog` + `DialogStep`. The component
**composes the owned `Dialog`** (inherits portal, dark-mode wrapper, focus trap, Escape, scroll-lock,
header) and renders Blueprint's multistep layout inside it: a left **step rail** (`role="tablist"`)
and a right **content panel** holding the active step's `panel` + a `DialogFooter` with **Back / Next**
nav that becomes a **final/Submit** button on the last step. Steps are declared as `<DialogStep
id title panel />` children (Blueprint-style data-only components; `MultistepDialog` reads them).

Started the session from **uncommitted WIP** where the component and its test had **drifted apart**:
the test encoded a `role="tab"` rail (matching Blueprint's real internal structure) while the component
hand-rolled an `<ol>/<li>` rail. I rebuilt the rail to **faithfully match Blueprint** (`_multistep-dialog.scss`
/ `multistepDialog.tsx`): step containers with per-state bg + bottom dividers, a 24px circle icon, and a
title — colored by **active / viewed / upcoming** state. Reconciled to **9 match · 0 differ** computed-style
in both themes and resolved an **axe `nested-interactive`** violation Blueprint itself has.

## What shipped

- **`multistep-dialog.tsx`** (new) — `MultistepDialog` + `DialogStep` (+ `MultistepDialogProps`,
  `DialogStepProps`, `StepButtonProps`). Modern API: Radix-idiomatic `open`/`defaultOpen`/`onOpenChange`
  (via Dialog), uncontrolled step nav (`initialStepIndex`, internal `current` + `maxVisited`),
  `onChange(newId, prevId, event)`. Footer buttons via `backButtonProps`/`nextButtonProps`/
  `finalButtonProps` (full `Button` props; **label via `children`**, our Button convention — not Blueprint's
  `text`), with per-step `back/nextButtonProps` overrides. Imports only `./button`, `./dialog`, `@/lib/utils`.
- **Galleries** — `MultistepDialogGallery` in both `src/App.tsx` and
  `tools/blueprint-reference/src/App.tsx`, registered under `id: "multistep-dialog"`. Renders ONE wizard open
  on **step 2 of 3** (`initialStepIndex={1}`) so the harness captures a viewed + active step + Back/Next
  footer at once. `data-compare` keys: `multistep-panels`, `multistep-rail`, `multistep-step-active`,
  `multistep-circle-active`, `multistep-panel` (component-emitted, like Dialog) + inherited `dialog-panel`/
  `-header`/`-footer`/`-close`. Reference tags Blueprint's `.bp6-*` equivalents via a `useEffect`
  querySelector pass (Dialog/Drawer pattern).
- **Tests** — `__tests__/multistep-dialog.test.tsx` (12): first-panel render; Back hidden on step 1; Next
  advances (panel + active tab); `onChange(new, prev)`; Back returns; final/Submit button + onClick; rail
  navigation to a viewed step; unvisited step disabled; `aria-current` tracking; `initialStepIndex`; Escape
  → `onOpenChange(false)`; closed renders nothing. Added a `MultistepDialog` case to `axe-smoke.test.tsx`.
- **`registry.json`** — regenerated; `multistep-dialog` with `registryDependencies: [button, dialog, utils, tokens]`.
  Clean diff (only the new entry, +19 lines).

## Current state

- **Verified:** `pnpm build` ✓. `pnpm test` → **240 passed** (29 files; +12 multistep +1 axe).
- **compare.sh:** `tools/compare.sh multistep-dialog both` → **9 match · 0 differ** computed-style in both
  themes. Full-page SSIM light **0.974** / dark **0.966**.
- **Accepted sub-perceptual deltas (documented):**
  1. **`dialog-close` 32×30 vs 30×30** (min SSIM 0.85/0.83) — the **inherited Dialog close-button** metric
     (our minimal Button is 32px wide vs Blueprint 30px). Not introduced here; shows on the plain Dialog
     compare too. A Button/Dialog-level item.
  2. **`multistep-panel` / `-panels` / `-rail` ~0.95 SSIM** (light) — the pre-existing per-Button/text
     font-metric / glyph-advance drift (computed-style gate omits glyph advance). Structure + colors match
     exactly; the diff image is text anti-aliasing only.

## Decisions made (and why)

- **Composed `Dialog` rather than re-implementing the overlay** — inherits portal + dark wrapper + focus
  trap + Escape + header for free; the component only owns the panels layout. Footer lives **inside the
  right panel** (Blueprint structure), not full-width.
- **Rebuilt the rail to Blueprint's real structure** — Blueprint's MultistepDialog rail is `role="tablist"`
  with `role="tab"` step containers + a `role="button"` inner div (`multistepDialog.tsx`). The WIP `<ol>`
  rail diverged. Faithful spec (`_multistep-dialog.scss`, `_pt-spacing: 4px`): 24px circle icon
  (`bg blue3` active / `gray3` viewed / `text-disabled` upcoming), title (`blue3`/`blue5` active /
  `text` viewed / disabled upcoming), step container bg (`white` viewed / `light-gray5` upcoming; dark
  `dark-gray4`/`dark-gray3`) + 1px bottom divider; right panel `light-gray5`/`dark-gray3`, min-width 800px.
- **`role="tab"` on the inner `<button>`, container is `role="presentation"` — a11y improvement over
  Blueprint.** Blueprint nests `role="tab"` (container) **and** `role="button"` (inner) → axe
  `nested-interactive` (serious). We keep ONE interactive element: the `<button role="tab">` carries
  `aria-selected`/`aria-current`/`disabled`; the container is presentational and only carries the
  bg+divider (+ the `multistep-step-active` `data-compare` key, so pairing is unaffected). `getAllByRole("tab")`
  returns the buttons; `toBeDisabled()` + click work directly on them. axe clean.
- **Real `<button disabled>` for unvisited steps** (vs Blueprint's `aria-disabled` div) — native disabled
  semantics + keyboard, and satisfies `toBeDisabled()`. Only steps with index ≤ `maxVisited` are navigable
  (jump back, never skip ahead).
- **Footer label via `children`, dropped Blueprint's `text` prop** — consistency with our `Button` (which
  labels via `children`); `StepButtonProps = ButtonProps`.
- **`!w-[800px] !min-w-[800px]`** — Blueprint sets `minWidth: 800` inline; the computed-style gate reads
  `minWidth` specifically, so both are needed (vs a plain Dialog's 500px). Circle uses `rounded-[50%]`
  (not `rounded-full` = 9999px) to match Blueprint's literal `border-radius: 50%`.

## Gotchas / things to know

- **The 0076 reference-gallery trap struck again:** the WIP reference gallery had the `COMPONENTS` entry
  for `multistep-dialog` but **no `MultistepDialogGallery` function and no import** — `compare.sh` would
  report "no specimens on blueprint". Fixed by adding both. Always `grep -c 'function <X>Gallery'` in the
  reference returns 1 before running compare.
- **`StepButtonProps = ButtonProps`** means `finalButtonProps={{ children: "Create" }}` sets the label;
  passing `text` does nothing now.
- The component emits `data-compare` keys (like `Dialog` does) — expected, not drift. The reference pairs
  them by querying Blueprint's `Classes.*` constants in a `useEffect`.

## Next steps

> Continue P1.3 (`docs/blueprint-parity-roadmap.md`):

1. **Promote infra** — export `ResizeSensor`, `OverflowList` (inlined in `breadcrumbs.tsx`), `Portal`/provider
   as independently importable, registered, tested components.
2. Then **P2.8 submenus**, eventually **P1.1 data grid** (own phase).

## How to resume

```bash
cd /Users/bbatchelder/Code/mithril
pnpm test                                 # 240 pass (12 in multistep-dialog.test.tsx, +1 axe)
pnpm build                                # green
tools/compare.sh multistep-dialog both    # 9 match · 0 differ both themes
pnpm dev                                  # :5173 → MultistepDialog section (Overlays group)
```

- Relevant files: `src/components/ui/multistep-dialog.tsx`,
  `src/components/ui/__tests__/multistep-dialog.test.tsx`, `src/components/ui/__tests__/axe-smoke.test.tsx`,
  `src/App.tsx` + `tools/blueprint-reference/src/App.tsx` (`MultistepDialogGallery`), `registry.json`,
  `docs/blueprint-parity-roadmap.md`.
- New deps: **none** (composes existing Dialog/Button).
