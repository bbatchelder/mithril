# 0083 — P1.1 / DataTable Loop 1: engine wiring + static grid skeleton

- **Date:** 2026-06-01
- **Focus:** Start the data-grid epic (parity roadmap P1.1) — Loop 1 of 7: wire the headless
  engine, lock the public API + DOM scaffold, and hit Blueprint `Table2` token fidelity for the
  static (non-virtualized) grid.
- **Branch:** `public-readiness` — not merged.

## Summary

DataTable now exists as a multi-file component: `data-table.tsx` (public component + types) plus a
`data-table/` directory of internals (`header.tsx`, `body.tsx`, `gutter.tsx`). It renders a real grid via
**TanStack Table v8** (`getCoreRowModel`) dressed in analyst tokens: a sticky column-header row, a numbered
row-header gutter, ruled cells, and Blueprint's box-shadow frame. The API is the **modern flat `columns`
array + `data`** (not Blueprint's `<Column>` children) — see the plan/architecture decision. Registered in
both galleries under id `data-table` (new **"Data"** sidebar category); the Blueprint reference gallery
gained `@blueprintjs/table@6.1.1` + a `<Table2>` specimen for the compare harness.

This is **Loop 1 of a 7-loop phase**. Remaining loops: 2 virtualization, 3 selection, 4 resize/reorder,
5 editable cells, 6 keyboard nav + clipboard, 7 loading/multi-region/polish. Plan file:
`~/.claude/plans/snuggly-wibbling-clover.md`.

## Current state

- **Verified:**
  - `pnpm build` ✓ · `pnpm typecheck` ✓ · `pnpm test` **272 pass** (261 → 272; **11 new** in
    `__tests__/data-table.test.tsx`: grid roles + aria counts, header text, gridcell count, key + function
    accessors, custom `cell` renderer, 1-based gutter, `numberedRows={false}`, align class, `height`,
    12px cell scale, axe smoke).
  - **Visual fidelity** via `tools/compare.sh data-table both` against the new Blueprint `<Table2>`
    specimen: per-specimen crop SSIM **0.957 light / 0.936 dark** (mismatch **1.2% / 2.6%**), height
    matches (460×150 both themes). Cell/header/gutter geometry, borders, backgrounds, and frame match
    Blueprint's **exact CSS values** (extracted from `@blueprintjs/table` `lib/css/table.css`, captured in
    code comments). The residual 1–2.6% is cross-engine text antialiasing (React 18 reference vs React 19
    analyst) — sub-perceptual; see Gotchas.
- **Registry:** `registry.json` regenerated — **67 items**. `data-table` ships 4 files (entry + 3
  subfiles), npm dep `@tanstack/react-table`, registryDeps `utils` + `tokens`. (`@tanstack/react-virtual`
  is **not** listed yet — Loop 2 adds the import.)
- **New deps:** `@tanstack/react-table` 8.21.3, `@tanstack/react-virtual` 3.13.26 (installed now, the
  virtual one is used starting Loop 2). Reference gallery (dev-only, gitignored): `@blueprintjs/table` ^6.

## Blueprint Table2 spec captured (authoritative, from table.css v6.1.1)

- Cell: `font-size:12px; height:20px; line-height:20px; padding:0 8px`; border
  `inset 0 -1px 0 <b>, inset -1px 0 0 <b>` (bottom+right).
- Column header: `line-height/min-height:30px`, border `0 1px 0 <b>` (bottom; dark adds `inset -1px 0 0`
  right divider). Header text **always left-aligned** (does not follow column align).
- Row-header/gutter: `font 12px; padding 0 4px; text-align right; min-width 30px`; border
  `inset 0 -1px 0 <b>, 1px 0 0 <b>`.
- Frame: `.bp6-table-container { box-shadow: 0 0 0 1px <b> }` (no layout border).
- Surface: light `#f6f7f9` (== analyst `--background`), dark `#383e47` (no analyst token → literal).
- `<b>` = `rgba(17,20,24,0.15)` light · `rgba(17,20,24,0.4)` dark. Cell text == `--foreground`.

## Decisions made (and why)

- **`columns` array + `data` API, not `<Column>` children** — native shape of TanStack (the engine we
  wrap), modern idiom, best types. Diverges from Blueprint's children API by design (fresh API mandate).
- **Multi-file component in `data-table/`** — too large for the flat-file convention; mirrors `icon/`.
  `gen-registry.mjs` was taught to scan a component's `<id>/` subdir: it ships every subfile **and** unions
  the subfiles' *external* imports (npm / `@/lib` / `@/components/ui`) into the item's deps, ignoring
  relative sibling imports. Also: `@tanstack/` added to `NPM_PREFIXES` and kept as a full specifier (like
  `@radix-ui/`).
- **Header always left-aligned** — matches Blueprint; a right-aligned numeric column still gets a left
  header. (Cell content *does* follow `align`.)
- **Box-shadow frame, not a layout border** — matches Blueprint's `box-shadow:0 0 0 1px` and avoids the 2px
  layout-height inflation that misaligned every row border in the pixel diff (was the main SSIM killer).
- **Dark surface `#383e47` as a literal** — Blueprint's table surface (dark-gray-4) has no analyst token;
  light surface uses the `bg-background` token (it equals Blueprint's `#f6f7f9`).
- **Added a `height?: number` prop** (not in the original API sketch) — a grid needs a bounded height to
  scroll; required by Loop 2's virtualization. Omitted → grid grows to fit (Loop 1 default).

## Gotchas / things to know

- **pnpm store migration.** The repo's `node_modules` was linked to a pnpm v10 store; pnpm 11.4 wants v11.
  Resolved by `rm -rf node_modules && pnpm install` (lockfile unchanged), then approving esbuild's build
  script. `pnpm-workspace.yaml` (untracked, local-only) carries `onlyBuiltDependencies: [esbuild]`; a hook
  keeps re-injecting a harmless `allowBuilds:` placeholder above it — ignore it. If `pnpm build` ever
  aborts with `ERR_PNPM_IGNORED_BUILDS`, run `pnpm install --force` to execute esbuild's postinstall.
- **Sub-perceptual delta (documented, accepted):** the per-specimen crop's residual ~1–2.6% mismatch is
  text antialiasing differing between the React-18 Blueprint reference and the React-19 analyst render at
  ~1px sub-pixel positions. The computed-style gate is clean except `minWidth: auto vs 0px` on the
  `data-compare` **wrapper div** — an artifact of the two galleries' different `Section` parents (Blueprint
  `BpSection` content sets `min-width:0` on children), NOT the DataTable.
- **gen-registry idempotency.** `pnpm gen:registry` then `git diff registry.json` shows only the intended
  `data-table` addition vs HEAD (no drift); CI's drift guard will pass once committed.

## Next steps (Loop 2 — row virtualization)

1. **`data-table/body.tsx` → virtualized** with `@tanstack/react-virtual`: `useVirtualizer({ count,
   estimateSize: () => rowHeight, overscan: 10, getScrollElement })`. Body becomes a spacer of
   `getTotalSize()` px; each virtual row absolutely positioned via `translateY(round(virtualRow.start))`
   (round offsets to ints — seam fix).
2. **Single scroll container owns both axes** (already the case): header `sticky top-0`, gutter
   `sticky left-0`, corner both → horizontal scroll sync is free. The row virtualizer reads `scrollTop`
   from the `role="grid"` element (needs a ref + the `height` prop set).
3. Column virtualizer wired but opt-in (auto-on >40 cols) — `enableColumnVirtualization?`.
4. Tests: windowed subset under mocked measurements, spacer height == `count×rowHeight`, sticky classes.
   jsdom can't scroll — document the limit; the live resize path is eyeballed at `:5173?... #data-table`.
5. Add a tall-dataset specimen (e.g. 1000 rows, `height={360}`) to both galleries with a new
   `data-compare` key.

## How to resume

```bash
cd /Users/bbatchelder/Code/analyst-ui
git switch public-readiness && git pull
pnpm install          # if node_modules is stale; `pnpm install --force` if ERR_PNPM_IGNORED_BUILDS
pnpm build && pnpm test                      # green / 272
tools/compare.sh data-table both > /tmp/cmp.log 2>&1 ; grep -E 'SSIM|data-table-basic' /tmp/cmp.log
#   import { DataTable, type DataTableColumn } from "@/components/ui/data-table"
```

- New files: `src/components/ui/data-table.tsx`, `src/components/ui/data-table/{header,body,gutter}.tsx`,
  `src/components/ui/__tests__/data-table.test.tsx`, this handoff. Modified: `src/App.tsx`,
  `tools/blueprint-reference/src/{App.tsx,main.tsx}` + its `package.json`, `tools/gen-registry.mjs`,
  `registry.json`, `package.json`/`pnpm-lock.yaml`, `docs/blueprint-parity-roadmap.md`.
- Plan: `~/.claude/plans/snuggly-wibbling-clover.md` (7-loop breakdown).
