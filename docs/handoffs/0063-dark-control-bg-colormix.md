# 0063 — close the dark default-control background delta ("Delta #2")

- **Date:** 2026-05-29
- **Focus:** The recurring dark-mode `backgroundColor` flag on default ("none") controls —
  analyst rendered `dark-gray-3` (#2f343c = rgb 47,52,60) where Blueprint's oklch-derived
  default-control surface resolves to **rgb(48,55,64) = #303740**. Imperceptible (≤4/channel)
  but flagged on button / numeric-input / html-select / file-input every dark run.
- **Branch / commit:** `public-readiness` @ `32c6fd7` going in.

## Background — two deltas that travelled together

The dark "known-intentional delta" on these components was actually **two** things the harness
reported on the same elements:

1. **Delta #1 — foreground text/icon color:** analyst `#f6f7f9` (light-gray-5) vs Blueprint
   near-white `#ffffff`. A deliberate aesthetic choice (see [[dark-foreground-decision]]) — **kept**.
2. **Delta #2 — control background:** analyst flat `dark-gray-3` (#2f343c) vs Blueprint's
   oklch-derived `--bp-surface-background-color-default-rest` → **rgb(48,55,64)**. Not a decision,
   just analyst using the flat palette value where Blueprint derives a hair lighter. **This loop closes it.**

## Why dark-gray-3 needed surgical treatment

`dark-gray-3` plays **two roles** in the dark theme:
- **Panels/surfaces** (popover, dialog, drawer, menu, omnibar, context-menu, date pickers,
  navbar): Blueprint's dark card/popover surface genuinely **is** `dark-gray-3` (#2f343c).
  These match and were **not** touched.
- **Control backgrounds** (Button `none`, NumericInput stepper, HtmlSelect trigger, FileInput
  Browse): Blueprint derives `rgb(48,55,64)`. These are Delta #2 and were retargeted.

So the fix is **per-site**, not a global `--color-dark-gray-3` change (which would wrongly shift
every panel too).

## The change

Replaced `dark:bg-dark-gray-3` → `dark:bg-[#303740]` (= exactly `rgb(48,55,64)`) at the four
control-background sites only:

- `src/components/ui/button.tsx` — `SOLID.none` rest
- `src/components/ui/numeric-input.tsx` — `STEPPER_COLORS.none` rest
- `src/components/ui/html-select.tsx` — trigger (both `none` and `intent` branches, 2 occurrences)
- `src/components/ui/file-input.tsx` — Browse button

Hover/active left on the `dark-gray-2`/`dark-gray-1` scale: the harness captures **resting state
only**, those states aren't flagged, and they already follow Blueprint's faithful darken-on-hover
pattern. Each site carries a short comment pointing here.

## Verification (compare.sh <id> dark)

| Component | Before | After | Remaining |
|---|---|---|---|
| html-select | bg 47,52,60 → 48,55,64 | **6 match · 0 differ** | none |
| file-input | bg flagged | **7 match · 0 differ** | none |
| button | bg + color | **3 match · 1 differ** | only Delta #1 (intentional fg) |
| numeric-input | bg + color | **6 match · 1 differ** | only Delta #1 (intentional fg) |

html-select now reports `analyst rgb(48,55,64) == blueprint rgb(48,55,64)`. Build/typecheck green.

## Decisions made (and why)

- **Arbitrary literal `#303740`, not a new named token.** Used at 4 sites with explanatory
  comments — consistent with the codebase's existing one-off control literals (e.g. the disabled
  `bg-[rgba(211,216,222,0.5)]`). Blueprint 6.15 is a frozen design spec, so the value won't drift.
  `#303740` = `rgb(48,55,64)` exactly (0x30,0x37,0x40).
- **Rest-only.** The harness diffs resting computed styles; hover/active aren't measured and look
  correct, so retargeting only `rest` closes the flag without guessing Blueprint's hover/active
  oklch values.
- **Did NOT touch panel/surface uses of dark-gray-3** — those match Blueprint already.

## Gotchas / things to know

1. **`dark-gray-3` is overloaded** (panel surface AND legacy control bg). Before changing it,
   `grep "dark:bg-dark-gray-3"` and separate `bg-white dark:bg-dark-gray-3` (panels — leave) from
   the button/stepper/trigger uses (controls — Blueprint derives rgb(48,55,64)).
2. **Session-transport corruption persists this session** (carried from 0062): `Read` intermittently
   returned garbled file content and `pnpm build` showed a stale identical JS hash. Ground truth came
   from `grep` (reads the real file) + checking `dist/assets/*.css` for the literal `303740`. `Edit`
   matches the real file, so edits are safe even when `Read` display is garbled. Re-verify via the
   live harness, not the build log.
3. (carried) compare.sh → a file, never `| tail`; run sequentially; user manages dev servers.

## Next steps

Both dark deltas are now characterized and one is closed. Remaining optional items (unchanged):

1. **(optional) Tier 4 reference-gallery cleanups** — PanelStack empty mount + TimezoneSelect
   dataset mismatch in `tools/blueprint-reference/src/App.tsx`.
2. **(optional) Tier 4 cheap win** — normalize `min-width: auto` → `0` on Menu/SegmentedControl.
3. **(decision held) Delta #1** — the `#f6f7f9` dark foreground is intentionally kept; revisit only
   if you want to match Blueprint's near-white.

Otherwise the library is feature-complete; the only remaining dark computed-style diff anywhere is
the deliberate foreground-color choice.
