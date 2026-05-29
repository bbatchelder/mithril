# 0062 — NumericInput width forwarding (Blueprint `style.width` semantics)

- **Date:** 2026-05-29
- **Focus:** The last open *real* (non-harness) fidelity item — NumericInput's `style.width`
  landed on the wrapper instead of the inner `<input>`, so at a given width prop analyst's
  control was ~30px narrower than Blueprint's (carried as 0060 gotcha #2 / 0061 next-step #1).
- **Branch / commit:** `public-readiness` @ `6c01fd8` going in (2 commits past handoff 0061).

## Summary

Single-component fix. Blueprint's `NumericInput` spreads `htmlInputProps` (incl. `style`)
onto its inner `InputGroup`, so a `width` sizes the **field** and the ~30px stepper sits
**outside** it (total ≈ width + 2px gap + 30). Analyst was instead applying `style` to the
outer flex-row wrapper, so the stepper ate into the width and the field shrank.

Fix routes `style` to the inner `InputGroup` (which forwards it to the `<input>`) when not
`fill`, and keeps the fill path (`w-full` wrapper + `flex-1` field) for `fill`. Verified with
`tools/compare.sh numeric-input both` + eyeballed both themes.

## Current state — what's done & verified

| Metric | Before (0060) | After (this loop) |
|---|---|---|
| Light overall SSIM | 0.9727 | **0.9949** |
| Dark overall SSIM | 0.9357 | **0.9799** |
| Light computed-style | match w/ ~30px size flags | **7/7 match, 0 size flags** |
| Specimen sizes | analyst ~30px narrow | **exact** (120×30, 140×40, 268×30) |

Remaining dark diff is `ni-step-button` color `rgb(246,247,249)` vs `rgb(255,255,255)` +
bg `rgb(47,52,60)` vs `rgb(48,55,64)` — the documented dark `--foreground` /
color-mix decisions ([[dark-foreground-decision]]), intentional. Build/typecheck green.

## The change (`src/components/ui/numeric-input.tsx`)

In the return block:
- Outer wrapper `style={style}` → `style={fill ? style : undefined}`.
- Inner field wrapper `flex-1` is now gated on `fill` (`fill && buttonPosition !== "none"`),
  so when not filling, the wrapper shrinks to the field's content/explicit width.
- `InputGroup` `fill` → `fill={fill}` and added `style={fill ? undefined : style}` so the
  width prop lands on the actual `<input>` (InputGroup forwards `style` to its `<input>`).

Net: not-fill ⇒ field sized by `style.width` (or intrinsic), stepper outside, wrapper
content-sized (matches Blueprint). fill ⇒ unchanged (100% wrapper, field flexes).

## Decisions made (and why)

- **Route width to the input, not the wrapper — faithful to Blueprint's API.** Blueprint's
  `renderInput()` spreads `removeNonHTMLProps(this.props)` (which includes `style`) onto
  `InputGroup`; analyst's `InputGroup` likewise forwards `style` to the `<input>`. So the
  prop semantics now match: `<NumericInput style={{width:120}}>` ⇒ 120px field + ~30px stepper.
- **Gate `flex-1`/`fill` on the component's `fill` prop.** Without a width and without `fill`,
  forcing `fill` on the InputGroup would collapse the field to 0 inside a `flex-1`/basis-0
  wrapper. Letting the field be content-sized when not filling preserves a sane default and
  matches Blueprint's intrinsic-width input.

## Gotchas / things to know

1. **Session-transport corruption can garble tool output.** This session intermittently
   returned mangled file/bash reads (`0.area`, phantom `6px` flags, duplicated/looped
   results). The on-disk files were fine — re-reading produced clean data. If a compare
   result looks self-contradictory (e.g. a size flag in one theme but not the other for the
   same specimen), re-read the log before acting on it.
2. (carried) `tools/compare.sh` to a file, never `| tail`/`| head` (deadlocks); don't run two
   in parallel; the user manages the dev servers — probe with curl, don't pkill.

## Next steps

The last real fidelity gap is closed. Only harness-side / imperceptible items remain (all
optional, none affect the shipped components):

1. **(optional) Tier 4 reference-gallery cleanups** — PanelStack empty mount + TimezoneSelect
   dataset mismatch in `tools/blueprint-reference/src/App.tsx` (distort the compare ranking,
   not the product).
2. **(optional) Tier 4 cheap wins** — normalize `min-width: auto` → `0` on Menu/SegmentedControl;
   swap the Dialog/Drawer elevation-ring color `rgb(0,0,0)` → `rgb(20,20,20)` @10%. Imperceptible;
   just quiets recurring style-diff flags.

Otherwise the library is feature-complete and fidelity-clean.

## How to resume

```bash
curl -sf -o /dev/null --max-time 2 http://localhost:5173 && \
curl -sf -o /dev/null --max-time 2 http://localhost:5174 && echo up
tools/compare.sh numeric-input both > /tmp/cmp-numeric-input.log 2>&1   # never pipe to tail
```

- Relevant files: `src/components/ui/{numeric-input,input-group}.tsx`, `src/App.tsx`
  (NumericInput specimens), `docs/fidelity-audit-2026-05-27.md`.
