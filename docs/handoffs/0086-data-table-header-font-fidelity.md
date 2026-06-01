# 0086 — DataTable styling fidelity: column-header font 12 → 14px

- **Date:** 2026-06-01
- **Focus:** Make the DataTable's *visual* styling match Blueprint precisely (the prior loops
  focused on behavior). Audited the live computed geometry of both galleries and fixed the one
  real discrepancy.
- **Branch:** `public-readiness` — not merged.

## What was actually wrong

Measuring the live DOM in both galleries (analyst :5173 vs Blueprint reference :5174) showed the
grid was already near-pixel-faithful **except the column headers**:

| element | Blueprint | analyst (before) |
| --- | --- | --- |
| column header text (`.bp6-table-column-name-text`) | **14px**, line-height 30px | **12px** |
| body cell | 12px / 20px / pad 0 8px / `#1c2127` | ✓ matches |
| row-number gutter | 12px / right-aligned / `#5f6b7c` light · `#abb3bf` dark | ✓ matches |

Blueprint column headers use the body **default 14px**, *not* the 12px of body cells — the
component (and its docstring) had incorrectly used 12px for the header too. That made the header
text visibly smaller than Blueprint's.

## The fix

`data-table/header.tsx`: `text-[12px]` → `text-[14px]` on the column-header cell. Also corrected
the misleading "font 12px" claims in the header docstring and the `data-table.tsx` Blueprint-spec
comment (header text is 14px; cells are 12px).

One-line, surgical. The flex `items-center` already vertically centers the 14px text in the 30px
header (equivalent to Blueprint's line-height:30px fill).

## Verified

- `pnpm build` ✓ · `pnpm test` **276 pass** (no change — this is a pure style tweak; the geometry
  tests already assert positions, which are unchanged).
- `tools/compare.sh data-table both` — **`data-table-basic` crop SSIM jumped light 0.957 → 0.985,
  dark 0.936 → 0.961.** Light is no longer flagged.
- Precise live-DOM audit (both themes) confirms everything else already matches: container frame
  (`box-shadow 0 0 0 1px`), header/gutter/cell backgrounds (`#383e47` dark), cell color
  (`#1c2127`/`#f6f7f9`), gutter muted color (`#5f6b7c` light / `#abb3bf` dark), column x-positions,
  cell padding (0 8px), gutter padding (0 4px, right-aligned), row height 20px, header height 30px.

## Remaining (NOT a style bug)

- The `data-table-virtual` crop stays ~0.64 SSIM. That's **cumulative cross-engine text
  antialiasing over 14 visible rows** (React-18/Blueprint vs React-19/analyst sub-pixel rendering),
  the same documented sub-perceptual delta as every text-heavy specimen — not a styling defect. The
  text is at identical positions (verified); the diff overlay just amplifies non-identical pixels.
- The persistent computed-style gate item `minWidth: auto vs 0px` is the Section-parent wrapper
  artifact carried since Loop 1 — harness noise, not the component.

## Next steps

Unchanged from 0085: resume the DataTable phase at **Loop 3 — selection** (region reducer +
overlay rendering; full plan in handoff 0084's "Next steps").

## Changed

- `src/components/ui/data-table/header.tsx` (12→14px + docstring), `src/components/ui/data-table.tsx`
  (spec-comment correction), this handoff.
