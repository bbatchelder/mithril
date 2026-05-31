# 0078 — MultistepDialog polish, control-spacing + icon-only Button fixes, and next-steps plan

- **Date:** 2026-05-31
- **Focus:** Post-0077 polish driven by user review of the MultistepDialog demo, plus two real
  fidelity fixes it surfaced (control vertical rhythm; icon-only button width). Ends with a
  prioritized **what's next** plan so the next session can pick a direction immediately.
- **Branch:** `public-readiness` (in sync with origin)

## Summary

After MultistepDialog shipped (0077), the user asked to (1) make the demo realistic and (2) explain the
empty area under the footer. That review surfaced **two latent fidelity gaps in other components**, both
now fixed:

1. **Control vertical spacing** — analyst `Radio`/`Checkbox`/`Switch` were missing Blueprint's
   `.bp6-control { margin-bottom: 8px }`, and the `RadioGroup` label used `mb-2` vs Blueprint's
   `.bp6-label` 16px. Stacked controls rendered ~8px/row too tight.
2. **Icon-only Button width** — icon-only buttons grew to 32px (16px icon + 8×2 padding) instead of
   collapsing to their 30px `min-width` like Blueprint, which keeps the padding and pulls the icon in
   with `-7px` margins. This was the long-standing `dialog-close`/`drawer-close` 32×30-vs-30×30 flag.

Both fixed at the source (not papered over in the demo), with zero compare regressions.

## What shipped (since 0077)

- **`e73bb69` — realistic demo + control margin-bottom**
  - `MultistepDialogGallery` in **both** galleries now has real per-step content: step 1 FormGroup +
    InputGroup/HTMLSelect/TextArea; step 2 email InputGroup + RadioGroup (Owner/Editor/Viewer) + Switch;
    step 3 a primary `Callout` summary + a `<dl>` definition list. Mirrored on the Blueprint side so the
    fidelity compare stays apples-to-apples (analyst uses our APIs; reference uses Blueprint's — note
    Blueprint `RadioGroup.onChange` passes the event, ours passes the value; reference uses inline styles,
    not Tailwind).
  - **Radio/Checkbox/Switch:** block mode now `block mb-2` (Blueprint `.bp6-control` margin-bottom 8px).
  - **RadioGroup label:** `mb-2` → `mb-4` (Blueprint `.bp6-label` 16px).
  - **control-card:** reset bumped to `!mb-0` (important) so cards stay flush regardless of Tailwind
    class ordering vs the control's new `mb-2`.
  - **Callout icon (Review step):** analyst `Callout.icon` is a **ReactNode**, not an `IconName` — passing
    `icon="info-sign"` rendered a dark/foreground glyph. Fixed by **omitting `icon`** so `intent="primary"`
    supplies its default `info-sign` in the correct blue. (This is exactly the P2.4 footgun — see next steps.)
- **`47a00cf` — icon-only buttons render square**
  - Added an `iconOnly` CVA variant to `buttonVariants` + per-size compounds
    (`{ iconOnly:true, fill:false, size }` → `w-6` / `w-7.5` / `w-10`). The `Button` render computes
    `iconOnly = !asChild && children == null && (icon != null || endIcon != null)` and passes it.
  - Pins `width` to the square dimension (width is **not** a fidelity-compared prop — see the compared
    list in `tools/comparison/capture-styles.js`: padding/margin/minWidth/height yes, width no), so
    padding/min-width stay matching Blueprint and the icon centers/overflows like Blueprint's.

## Current state (verified)

- `pnpm build` ✓ · `pnpm test` **240 pass** (29 files).
- `compare.sh` computed-style **clean (0 differ)** for: multistep-dialog (9), dialog (5), drawer (4),
  button (18), radio (6), checkbox (6), switch (6), control-card (7), navbar (3), numeric-input (7),
  input-group (12) — both themes.
- `dialog-close`/`drawer-close` now **30×30** (size mismatch eliminated); close-button SSIM 0.85→0.97
  (light). multistep-dialog min SSIM now 0.97/0.94.
- Working tree clean; `public-readiness` == `origin/public-readiness`.

## Accepted residual deltas (documented)

- **Close-button SSIM ~0.93–0.97** is now purely small-cross **glyph anti-aliasing** + the centering
  mechanism difference (analyst flex-center-overflow vs Blueprint negative-margin). Sub-perceptual; the
  size mismatch (the real issue) is gone.
- **`button` gallery text specimens** still show "size mismatch" / low SSIM (e.g. `btn-size-medium`
  0.595) — **pre-existing**, verified identical by `git stash`. It's the documented per-Button
  font-glyph-advance drift (the computed-style gate omits `fontFamily`/glyph advance by design).

## The empty area below Back/Next (answered for the record)

Not a region — the right content panel and the step rail are a flex row, so both stretch to the taller
column. With one-sentence panels the rail was taller, leaving blank space under the footer; with realistic
(taller) content the content column wins and the gap closes. Faithful to Blueprint.

## Next steps — prioritized plan (pick one to start)

> Roadmap: `docs/blueprint-parity-roadmap.md`. Phase A (P0 a11y+tests) ✅. Phase B (P1) mostly done —
> MultistepDialog/ButtonGroup/AnchorButton ✅; remaining = promote infra + the data grid. Phase C (P2)
> entirely open. Branch is literally `public-readiness`, which reframes priorities toward shipping.

1. **★ Recommended — P2.1: make the install path work + add CI.**
   - **Why:** for a shadcn-style *own-the-source* lib, the headline install method not working is the
     most embarrassing public-release gap. `README.md` has a ⚠️ admitting `npx shadcn add` is
     non-functional: `registry.json` is generated (`pnpm gen:registry`) but **never served** — the
     deploy workflow (`.github/workflows/deploy.yml`, Pages on push to `main`) only publishes the gallery
     `dist`, and `registry.json` lives at repo root, not in `public/`. There is also **no CI gate** on
     PRs (no build/test/lint workflow — only deploy-on-main).
   - **Do:** emit `registry.json` (+ per-item JSON if `shadcn` needs it) into the build output at a stable
     URL; verify `npx shadcn@latest add <url>/<component>` end-to-end into a scratch project; add a CI
     workflow running `pnpm build` + `pnpm test` + a **registry-drift guard** (`pnpm gen:registry` then
     `git diff --exit-code registry.json`). Update the README ⚠️ once it works.
   - **Done when:** a fresh project installs any component via the documented command; CI guards freshness.

2. **P1.3 — promote infra (finishes Phase B except the grid).**
   - Export `ResizeSensor`, `OverflowList` (currently inlined in `breadcrumbs.tsx`), and `Portal`/provider
     as independently importable, registered, tested components. Small/medium, self-contained.

3. **P2.4 + P2.3 — DX quick wins (mechanical, library-wide).**
   - **P2.4:** accept `IconName | React.ReactNode` on every `icon`/`endIcon` prop (string → render
     `<Icon>` internally) so `<Button icon="add" />` and `<Callout icon="info-sign" />` work without an
     import. This is the **exact footgun** hit on the Review-step Callout this session.
   - **P2.3:** introduce one shared `Intent` type (a tiny `lib/types.ts`) to replace ~19 duplicated
     `*Intent` unions; keep the shadcn self-contained-file ergonomics in mind.

4. **P1.1 — the data grid (`DataTable`/`Table`).**
   - Biggest feature-parity lever; a **multi-loop phase of its own**. Compose a headless engine
     (TanStack Table + TanStack Virtual) under analyst's API + tokens: column resize/reorder, row/cell/
     region selection, editable cells, sticky headers, virtualized scroll, keyboard cell nav, clipboard.
   - Not release-blocking; scope deliberately before starting.

## How to resume

```bash
cd /Users/bbatchelder/Code/analyst-ui
git switch public-readiness && git pull
pnpm test         # 240 pass
pnpm build        # green
# Then pick a next-step above. For P2.1, start by inspecting:
#   .github/workflows/deploy.yml   (only publishes dist; add registry + CI)
#   tools/gen-registry.mjs         (the generator; wire drift guard around it)
#   README.md  (the ⚠️ "registry not yet served" section ~line 106)
```

- Relevant components touched this session: `button.tsx`, `radio.tsx`, `checkbox.tsx`, `switch.tsx`,
  `control-card.tsx`; galleries `src/App.tsx` + `tools/blueprint-reference/src/App.tsx`.
- New deps: **none**.
