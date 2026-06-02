# 0061 — post-audit polish (NumericInput, date popovers, popover animation)

- **Date:** 2026-05-28
- **Focus:** User-reported fidelity nits found while eyeballing the live app after the
  2026-05-27 audit was closed. NumericInput stepper details, date-family popover arrows,
  the calendar year/caret overlap, and the missing popover open/close animation.
- **Branch / commit:** `public-readiness` @ `9f197e5` (5 commits past handoff 0060's `bfa12d6`).

## Summary

Five small, user-driven fixes after the audit. Each was verified with `tools/compare.sh
<id> both` and/or in-browser computed-style checks; all build green (`pnpm typecheck`).
The popover animation is the highest-leverage one — it lands on every Popover-based
component (Tooltip, Select, MultiSelect, Suggest, all date pickers).

## Current state — what's done & verified

| # | Commit | Fix | Verified |
|---|--------|-----|----------|
| 1 | `b832757` | **NumericInput**: 2px gap between input and stepper; disabled stepper uses the input's neutral disabled bg (not `opacity-50`); intent steppers get white chevrons | compare.sh numeric-input both — Disabled + Intent rows match BP, both themes |
| 2 | `f7cbca8` | **DateRangeInput**: popover arrow now shows, centered between the two inputs | compare.sh date-range-input both — SSIM 0.9155→0.9425; arrow eyeballed both themes |
| 3 | `2050775` | **Calendar caption**: year value no longer overlaps its stepper caret (caret →2px, year select min-w 60px) — applies to DatePicker, DateRangePicker (3 layouts), DateRangeInput popover | compare.sh date-picker / date-range-picker / date-range-input — year clears caret both themes |
| 4 | `ba2c0c0` | **DateInput**: popover arrow now shows, centered under the input | compare.sh date-input both — arrow eyeballed both themes |
| 5 | `9f197e5` | **Popover (shared)**: open/close scale+fade animation matching Blueprint | in-browser: computed animationName/duration/easing/origin exact; compare.sh popover both unchanged |

Build/typecheck: green. No screenshot regressions on any touched component.

## Decisions made (and why)

- **NumericInput stepper gap = 2px** (`ml-/mr-[2px]` by buttonPosition). Blueprint's
  NumericInput is a ControlGroup, which sets `margin-right: $pt-spacing * 0.5 = 2px`
  between non-last children. The stepper inherits that gap from the input.
- **NumericInput disabled steppers reset intent to neutral.** Dropped `disabled:opacity-50`
  in favor of the same `rgba(211,216,222,0.5)` / `rgba(64,72,84,0.5)` bg + `text-foreground-disabled`
  the InputGroup uses, plus a `disabled:hover:bg` pin so intent-hover doesn't reappear. Matches BP.
- **NumericInput chevrons use `!text-current`.** Icon's wrapper span defaults to
  `text-foreground` (the [[icon-current-color-override]] gotcha), which would override the
  button's `text-primary-foreground` etc. `!text-current` defers to the button color → white
  chevrons on colored intent backgrounds.
- **Date popovers show the arrow** (`arrow={true} minimal={false}`, keeping
  `hasContentPadding={false}`). Blueprint's DateInput/DateRangeInput popovers show the arrow
  by default; we'd wrongly set them minimal. Calendar carries its own padding so content
  padding stays off.
- **Harness "open" specimens must wrap the trigger.** Both `OpenDateInput` and
  `OpenDateRangeInput` in `src/App.tsx` previously used a bare `<span />` as the Popover
  trigger with the input(s) *outside* it. Radix anchors the arrow to the trigger's center, so
  a zero-width span pushed the arrow to the panel's left edge. Fix: make the input(s) the
  Popover.Trigger child. (This is a recurring harness trap — see gotchas.)
- **Calendar caret → 2px + year min-width 60px.** Faithful to `_date-picker-caption.scss`
  (`+ .icon { right: $pt-spacing*0.5 }`, `.year-select { min-width: $pt-spacing*15 }`). A
  `<select>` sizes to its widest *option*; month gets slack from "September" but every year is
  4 digits, so without the min-width "2026" butts the caret. Both pickers now share
  `CAPTION_SELECT_CLS` / `CAPTION_YEAR_SELECT_CLS` constants.
- **Popover animation: scale on Content, not the wrapper.** Radix puts the positioning
  translate on `[data-radix-popper-content-wrapper]`, so animating `transform: scale()` on
  Content doesn't fight positioning. Two keyframe pairs (fade 100ms `--ease-bp`, scale
  0.3→1 300ms `--ease-bp-bounce`) replicate Blueprint's split durations exactly;
  transform-origin = `var(--radix-popover-content-transform-origin)` (the arrow point). Normal
  popovers (with arrow) get scale+fade; minimal ones get fade-only.

## Gotchas / things to know

1. **`tools/compare.sh | tail`/`| head` deadlocks** (carried from 0060). The spawned
   `pnpm dev`/vite/esbuild inherit the pipe's write end and never release it, so the pipe
   never closes and the script *looks* hung (saw 75 min once). Always redirect to a file:
   `tools/compare.sh <id> both > /tmp/cmp-<id>.log 2>&1`, then grep the log.
2. **Don't run two `compare.sh` in parallel** — they collide auto-starting the dev servers
   and you get empty logs. Start dev servers once up front, then run compares sequentially.
3. **Harness forced-open popovers need a real trigger.** When building an always-open Popover
   specimen in `src/App.tsx`, wrap the actual control as the Popover child — never a bare
   `<span />` — or the arrow anchors to the wrong place. (Fixed for date-input & date-range-input
   this session; check this if you add more.)
4. **`<select>` width is driven by its widest option, not the current value.** Relevant any
   time a minimal in-caption select shows a fixed-width value (years, times).
5. **Popover animation vs the harness.** The forced-open specimens replay the entrance
   animation on mount, but `compare.sh` waits for networkidle + a settle, well past 300ms, so
   screenshots are stable. If you ever see a scaled/faded popover in a diff, the capture fired
   mid-animation — re-run.

## Next steps

Audit + roadmap are complete; this was reactive polish. Open/optional:

1. **(optional) NumericInput `style.width` forwarding** — still forwards to the wrapper, not the
   inner input, so the control is ~30px narrower than Blueprint at the same prop. Sub-perceptual;
   see 0060 gotcha #2. Files: `src/components/ui/numeric-input.tsx`.
2. **(optional) Tier 4 reference-gallery cleanups** from the audit (PanelStack empty mount,
   TimezoneSelect dataset mismatch, untagged `drawer-close`).
3. **(optional) Tier 4 cheap wins** — normalize `min-width:0` vs `auto`; swap the elevation-ring
   color `rgb(0,0,0)`→`rgb(20,20,20)` @10%.
4. **(optional)** Add a `--quiet` flag or a `| tail`-safe note to `tools/compare.sh` (gotcha #1).

## How to resume

```bash
# Dev servers (the user manages these now — confirm they're up, don't pkill):
curl -sf -o /dev/null --max-time 2 http://localhost:5173 && \
curl -sf -o /dev/null --max-time 2 http://localhost:5174 && echo up

# Verify any component (NEVER pipe to tail/head — see gotcha #1):
tools/compare.sh <id> both > /tmp/cmp-<id>.log 2>&1
grep -E "SSIM|specimens ·|match · " /tmp/cmp-<id>.log
```

- Relevant files: `src/components/ui/{numeric-input,date-input,date-range-input,date-picker,date-range-picker,popover}.tsx`, `src/styles/globals.css`, `src/App.tsx` (Open* specimens), `docs/fidelity-audit-2026-05-27.md`.
- Open questions for the user: whether to take on any of the optional items above, or treat the library as feature-complete.
