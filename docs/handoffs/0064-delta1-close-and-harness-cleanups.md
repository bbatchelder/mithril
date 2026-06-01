# 0064 — close Delta #1 (dark control text) + reference-harness cleanups

- **Date:** 2026-05-29
- **Branch:** `public-readiness` (continues from 0063 @ `e3566eb`)
- **Focus:** Knock out the remaining optional harness items from 0063's "Next steps", then
  close **Delta #1** (the last intentionally-open dark computed-style diff) after an A/B review.

## TL;DR

- **Delta #1 is now CLOSED.** All six affected components read **0 differ in both light and dark**.
- The earlier "keep #f6f7f9 / don't match Blueprint's near-white" framing was **inaccurate** and is
  superseded (agent memory updated). Body/menu text was never the issue — it already matches.
- Harness cleanups: panel-stack back button (real 8px fidelity fix), timezone dataset aligned to
  Blueprint's exact minimal list, menu min-width quieted. SegmentedControl min-width left as
  documented noise.

## Delta #1 — what it actually was (corrected)

Probing both galleries live, Blueprint's dark mode:

| Element | Blueprint dark | Analyst (before) | |
|---|---|---|---|
| Body / menu / general text | `#f6f7f9` | `#f6f7f9` | already matched |
| Intent solid buttons (primary/success/danger) | `#ffffff` | `#ffffff` | already matched |
| Carets / muted glyphs (e.g. html-select) | `#abb3bf` | `#abb3bf` | already matched |
| **Default / minimal / outlined-"none" control text + icons** | **`#ffffff`** | `#f6f7f9` | **Delta #1** |

So `--foreground` stays `light-gray-5` (#f6f7f9) — **do not touch it**. Only the dark **none-control**
text/icons were off. The user reviewed an A/B (the ~3%-lightness difference is essentially
imperceptible) and chose to match Blueprint.

### The fix (white on dark none-controls)

- `button.tsx` — added `dark:text-white dark:[&_svg]:fill-white` to all three `none` variants
  (SOLID/OUTLINED/MINIMAL). The `[&_svg]:fill-white` whitens the icon, since `Icon` sets its own
  `text-foreground` for intent="none" and won't inherit the button's color (see [[icon-current-color-override]]).
- `numeric-input.tsx` — `STEPPER_COLORS.none`: `dark:text-foreground` → `dark:text-white`
  (chevrons inherit via the stepper's existing `!text-current`).
- `html-select.tsx` — trigger text `dark:text-white` (the caret stays `#abb3bf` — Blueprint matches).
- `file-input.tsx` — Browse button `dark:text-foreground` → `dark:text-white`.
- PanelStack back + TimezoneSelect trigger inherit the Button/HTMLSelect fix automatically.

Verified: button 18·0, numeric-input 7·0, html-select 5·0, file-input 5·0, panel-stack 3·0,
timezone-select 4·0 — **in both themes**. No light-mode regression (`dark:` isolates the change).

## Harness cleanups (0063 "Next steps")

1. **PanelStack back button — real 8px fidelity fix.** The "empty mount" framing was a misdiagnosis;
   the actual issue was the back button rendering **66px vs Blueprint's 58px**. Cause: the `Button`
   default `gap-2` (8px) on top of the icon's own `mx-[2px]`. Blueprint has no icon→text gap there.
   Added `gap-0` to the header-back button (`panel-stack.tsx`). Now 58px, specimen pairs cleanly.

2. **TimezoneSelect dataset aligned to Blueprint.** Analyst's `MINIMAL_IANA_CODES` claimed to "match
   Blueprint's MINIMAL_TIMEZONE_ITEMS" but was a different, smaller curated set in a different order.
   Replaced it with Blueprint 6.15's exact 33-item list/order (using analyst's alias codes for three:
   `Asia/Calcutta`≙Kolkata, `Asia/Katmandu`≙Kathmandu, `Asia/Rangoon`≙Yangon), and changed `initialItems`
   to **map over the code list** (preserve order) instead of `filter` (allItems order). Fixed the stale
   "index 6 = New York" comment in BOTH galleries — Blueprint's real order puts **Denver** at index 6.
   Result: tz-item-offset specimen SSIM **0.144 → 0.953**, tz-item 0.647 → 0.927, tz-menu 0.636 → 0.902.
   - Residual: tz-item/tz-menu still ~23px narrower and tz-trigger ~6px — analyst keeps its cleaner
     product labels ("Calcutta"/"Sydney" vs Blueprint "India - Kolkata"/"Melbourne, Sydney"). Accepted.
   - **Did NOT pair `popover-content`** in the reference: analyst's Popover auto-tags its transparent
     transition WRAPPER, which is a different nesting level than Blueprint's styled `.bp6-popover-content`
     panel — pairing them yields a false bg/shadow/radius diff. The benign "only in analyst" note is honest.

3. **Menu min-width quieted (deterministic).** Menu `<ul>` is `flex flex-col`, so its `<li>` children
   were flex items (`min-width: auto`) where Blueprint's block `<ul>` resolves them to `0px`. Added
   `[&>li]:min-w-0`. Menu's two remaining diffs are **pre-existing 1px height** deltas (menu-header
   18 vs 17, container 223 vs 222) — out of scope, sub-perceptual.

4. **SegmentedControl min-width = irreducible harness noise — left alone (documented in code).**
   `min-width: auto` resolves per-specimen (flex-item-ness depends on each gallery's container), so
   Blueprint's track computes `0px` in the sc-default specimen but `auto` in sc-disabled/fill/large.
   Forcing any value is whack-a-mole (fixing one specimen reverses three). Reverted; left at the
   original 1-diff state with a NOTE comment in `segmented-control.tsx`.

## Files touched

- `src/components/ui/button.tsx`, `numeric-input.tsx`, `html-select.tsx`, `file-input.tsx`,
  `panel-stack.tsx`, `menu.tsx`, `segmented-control.tsx`, `timezone-select.tsx`
- `src/App.tsx` (timezone tz-item comment), `tools/blueprint-reference/src/App.tsx` (timezone tags)

`pnpm build` green. Harness clean (0 differ) on all touched components in both themes.

## Gotchas / things to know

1. **Delta #1 is closed** — there is no longer any intentionally-open dark computed-style diff in the
   library. If a future dark `color` diff appears, it's a real bug, not "the known fg delta."
2. **Don't whiten body text.** Only dark *none-control* text/icons are white; `--foreground` stays
   #f6f7f9 (matches Blueprint's body). Carets/muted glyphs stay `#abb3bf`.
3. **Icons in none-buttons need `dark:[&_svg]:fill-white`** — `Icon` for intent="none" sets its own
   `text-foreground` and won't inherit the host's `dark:text-white`. (see [[icon-current-color-override]])
4. **SegmentedControl min-width** is context-dependent noise — do not try to "fix" it in the component.
5. (carried) `tools/compare.sh` to a file, never `| tail`/`| head` (deadlock); run sequentially.

## Next steps

The library is feature-complete and now has **no open dark fidelity deltas**. Remaining truly-optional:

1. (optional) Menu 1px height (menu-header 18 vs 17) — sub-perceptual, pre-existing.
2. (optional) TimezoneSelect: adopt Blueprint's exact minimal-item *labels* ("India - Kolkata",
   "Melbourne, Sydney") to also close the ~23px menu-width specimen delta — but that overwrites
   analyst's deliberately-cleaner product labels. Held.

Otherwise: **open the PR to merge `public-readiness` → `main`.**
