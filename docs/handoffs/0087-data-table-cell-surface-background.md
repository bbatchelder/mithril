# 0087 — DataTable styling fidelity: body cells get their own surface background

- **Date:** 2026-06-01
- **Focus:** Continue the styling-fidelity pass from 0086. User reported the analyst body cells
  shared the column-header background; Blueprint draws them on a distinct surface.
- **Branch:** `public-readiness` — not merged.

## What was wrong

Analyst painted the whole grid with `bg-background`, so the body cells, header, and gutter were all
the **same** color. Blueprint draws the body on a distinct cell surface:

| element | Blueprint light | Blueprint dark | analyst before |
| --- | --- | --- | --- |
| header / gutter / corner | `#f6f7f9` (light-gray-5) | `#383e47` (dark-gray-4) | `#f6f7f9` / `#383e47` ✓ |
| **body cell** | `#ffffff` (white) | `#2f343c` (dark-gray-3) | `#f6f7f9` / `#383e47` ✗ |

So cells should be **white** in light (brighter than the gray chrome) and **`#2f343c`** in dark
(darker than the chrome). Confirmed by walking each element's parent chain to the first painted
background in both galleries: Blueprint puts the cell surface on `.bp6-table-body-virtual-client`
with transparent cells over it; header/gutter live on `.bp6-table-column-headers` /
`.bp6-table-row-headers` (the `#f6f7f9` surface).

## The fix

`data-table/body.tsx`: added `bg-white dark:bg-[#2f343c]` to the **rowgroup** (the body spacer) —
mirroring Blueprint's structure. The body region is now the cell surface; the gutter cells paint
their own gray bg over it, the data cells stay transparent, and the surface correctly fills white
past the last column. One class, no geometry change. (Header/gutter already used `bg-background`
= `#f6f7f9` / `dark:bg-[#383e47]`, which already matched Blueprint — left untouched.)

## Verified

- `pnpm build` ✓ · `pnpm test` **276 pass** (pure style; positions unchanged).
- `tools/compare.sh data-table both`:
  - `data-table-basic` crop: **dark 0.961 → 0.977**; light steady at 0.986 (light cell went
    `#f6f7f9` → white, now matching Blueprint).
  - full-page **dark SSIM 0.7245 → 0.7670** (the white/dark cell-vs-chrome contrast now matches).
- Eyeballed both themes: header row + gutter column are visibly the gray chrome; body cells are the
  brighter (light) / darker (dark) surface — matches Blueprint.

## Remaining (NOT a style bug)

- `data-table-virtual` stays ~0.64 SSIM — cumulative cross-engine text antialiasing over 14 rows
  (documented sub-perceptual; see 0086). Unchanged in nature.
- `minWidth: auto vs 0px` computed-style item — Section-parent wrapper harness artifact (since
  Loop 1), not the component.

## Next steps

Unchanged: resume the DataTable phase at **Loop 3 — selection** (handoff 0084's "Next steps").

## Changed

- `src/components/ui/data-table/body.tsx` (rowgroup cell-surface bg + docstring), this handoff.
