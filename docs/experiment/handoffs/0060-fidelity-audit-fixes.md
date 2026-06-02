# 0060 — fidelity audit fixes verified

- **Date:** 2026-05-28
- **Focus:** Verify the 10 Tier 1+2 fixes from `docs/fidelity-audit-2026-05-27.md` via `tools/compare.sh both`; close out the audit cycle.
- **Branch / commit:** `public-readiness` @ `e72175a` + a follow-on FileInput tightening committed in this loop.

## Summary

Ran `tools/compare.sh both` on every component touched by the audit (slider, file-input, multi-select, select, tag-input, numeric-input) and spot-checked the earlier-committed fixes (popover, tooltip, switch, hotkeys, date-picker). All 10 audit items hold. One small tightening (FileInput `w-[250px]` → `w-[253px]`) landed during verification when the diff showed Blueprint's actual computed width is 253, not 250. Three new minor findings were surfaced but are sub-perceptual and deferred — they're documented below so a future loop can revisit if we ever tighten the bar.

## Current state

**Verified clean (via `compare.sh both` + eyeballed diff PNGs):**

| Component | Light SSIM | Dark SSIM | Notes |
|---|---|---|---|
| popover | 0.9972 | 0.9725 | arrow points up + snug ✓ |
| tooltip | 0.9921 | 0.9671 | inherits popover fix ✓ |
| switch | 0.9401 | 0.9219 | 6/6 styles match, inner labels no longer clipped ✓ |
| hotkeys | 0.9710 | 0.9570 | glyph+word KeyCombo confirmed ✓ |
| date-picker | 0.9044 | 0.8852 | borderless header + grouped nav ✓ |
| slider | 0.9824 | 0.9562 | pill + axis on shared row, no collision ✓ |
| file-input | **0.9967** | 0.9590 | tightened to `w-[253px]` this loop |
| multi-select | 0.9962 | 0.9606 | no focus ring on active item ✓ |
| select | 0.9919 | 0.9578 | trigger fills 300×30 ✓ |
| tag-input | 0.9866 | 0.9554 | chip width within +2px target ✓ |
| numeric-input | 0.9727 | 0.9357 | stepper flush; 30px width ✓ |

The residual computed-style diffs that remain across all of these are the four already-documented Tier 4 categories: dark `--foreground` decision (`#f6f7f9` vs near-white), `rgb(0,0,0)` vs `rgb(20,20,20)` @ 10% shadow color, `min-width: auto` vs `0`, and arrow-element measurement (mithril's `data-compare` is on the inner SVG wedge, Blueprint's wraps the full 30×30 rotation box).

**Build / typecheck:** not re-run this loop — only edit was a single Tailwind utility swap (`w-[250px]` → `w-[253px]`) which can't affect types.

## Decisions made (and why)

- **FileInput `w-[250px]` → `w-[253px]`.** Blueprint's computed wrapper width is 253px, not 250. The audit doc said "~250px" so the original fix was approximate; the harness flagged a clean 3px size mismatch on every non-fill specimen. Tightening it dropped light SSIM from 0.9895 → 0.9967 and pixel mismatch from 0.20% → 0.05%. One-char change in `src/components/ui/file-input.tsx` line 136.
- **Accepted three new sub-perceptual gaps instead of fixing.** See gotchas below.

## Gotchas / things to know

1. **`tools/compare.sh | tail -N` deadlocks.** Symptom: script runs to completion, full output exists in the script's stdout, but the parent bash stays alive and the `tail` never flushes — looks like a 75-minute hang. Cause: the spawned `pnpm dev` (or one of its vite/esbuild descendants) inherits a write end of the pipe to `tail` through the `(cd … && nohup … &)` subshell and keeps it open for its entire life. Fix: redirect compare output to a file (`> /tmp/cmp-X.log 2>&1`) instead of piping through `tail`. If you do pipe and it wedges, killing the orphaned `bash tools/compare.sh` processes lets `tail` flush. Worth a comment in `tools/compare.sh` or a `--quiet` flag that doesn't print, but not urgent.

2. **NumericInput `style.width` semantics differ from Blueprint.** Both galleries pass `style={{ width: 120 }}` to the `<NumericInput>` element. In Blueprint that width applies to the inner `<input>` (so the input is 120px, plus a ~30px stepper sitting outside, total ~150). In mithril it applies to the wrapper (so input is ~90px, stepper sits inside, total 120px). End result: at the same prop value, mithril's NumericInput is ~30px narrower than Blueprint's. The audit said "matches once both galleries pin the same explicit width" — that turned out to be slightly inaccurate; what actually matches is the stepper button (30×30 in both) and the visual SSIM is still 0.97/0.94 because both controls look proportional. If we ever want exact width parity we'd need to forward `style.width` to the input element in `numeric-input.tsx`. Not done this loop.

3. **TagInput chip spacing is via flex `gap`, not per-chip `margin-right`.** Blueprint sets `.bp6-tag { margin-right: 4px }` on chips; mithril leaves margin at 0 and spaces chips via the wrapper's flex `gap`. The visual result is equivalent (same gap between chips in both galleries) but the computed-style diff flags `marginRight: 0 vs 4px` and `tag-input-ghost { color: rgb(28,33,39) vs rgb(0,0,0); fontSize: 14 vs 13.33 }`. All sub-perceptual; not flagged in the original audit so left as-is.

4. **Select dropdown menu is 8px wider than Blueprint's** (192 vs 184). Trigger is exact at 300×30. Sub-perceptual; styles 5/5 match light. Not in the audit; left as-is.

5. **`tools/compare.sh` auto-starts dev servers but assumes single-invocation.** If you run it concurrently in two shells, both will try to start `pnpm dev` (the second will no-op via curl probe, but the duplicate orphaned bash processes that the pipe-deadlock left behind look stuck for the same reason — vite inherits FDs from each). Starting the dev servers once up front with `nohup pnpm dev > /tmp/aui-dev.log 2>&1 </dev/null &; disown` (and same for `tools/blueprint-reference`) and then running `compare.sh` for each component is the cleanest pattern.

## Next steps

The audit is fully closed. The roadmap is also complete (per handoff 0058). Open work for future loops, in rough order of payoff:

1. **(optional) NumericInput width-prop forwarding.** Forward `style.width` to the inner `<input>` to match Blueprint's API semantics. Files: `src/components/ui/numeric-input.tsx`. Verify with `tools/compare.sh numeric-input both`; expect ni-default/intent/buttons-left/disabled to drop their size flags.
2. **(optional) Audit's Tier 4 reference-gallery cleanups.**
   - PanelStack mount in `tools/blueprint-reference/src/App.tsx` renders empty in compare crops.
   - TimezoneSelect datasets diverge between galleries (mithril auto-highlights first row, Blueprint shows none); align rows for a clean comparison signal.
   - `drawer-close` `data-compare` key is not paired in the reference gallery.
3. **(optional) Tier 4 cheap wins.** Normalize `min-width: 0` → `auto` on Menu/SegmentedControl, swap the elevation-ring color token from `rgb(0,0,0)` → `rgb(20,20,20)` @ 10% to silence the recurring Dialog/Drawer/Popover diff. All imperceptible visually; just quiets the harness.
4. **(optional) Pipe-deadlock note in `tools/compare.sh`.** Add a docstring comment warning against `| tail` / `| head` and explaining the FD inheritance reason.

## How to resume

```bash
# Re-bootstrap if needed:
nohup pnpm dev > /tmp/aui-dev.log 2>&1 </dev/null & disown
nohup bash -c 'cd tools/blueprint-reference && pnpm dev' > /tmp/bp-dev.log 2>&1 </dev/null & disown

# Wait for both to listen:
until curl -sf -o /dev/null --max-time 1 http://localhost:5173 \
   && curl -sf -o /dev/null --max-time 1 http://localhost:5174; do sleep 1; done

# Then for any component:
tools/compare.sh <component> both > /tmp/cmp-<component>.log 2>&1
# Inspect:
grep -E "(specimens|SSIM|match|differ|⚠)" /tmp/cmp-<component>.log
```

- Relevant files: `docs/fidelity-audit-2026-05-27.md` (annotated with ✅ per item), `src/components/ui/file-input.tsx` (line 136), the 11 component logs from this loop in `/tmp/cmp-*.log`, and the screenshots in `tools/comparison/screenshots/`.
- Open questions for the user: whether to bother with the (1)-(4) optional items above or call the audit fully closed and move on to something new.
