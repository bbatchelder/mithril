# 0081 — P2.2: icon tree-shaking

- **Date:** 2026-05-31
- **Focus:** Stop `Icon` from dragging all 706 glyphs (~195 KB gzip) into every bundle. Per-glyph named
  exports + a registry for the dynamic string form.
- **Branch:** `public-readiness` — not merged.

## Summary

`tools/gen-icons.mjs` now emits **one `export const <camelName>: IconGlyph` per glyph** in
`src/components/ui/icons/index.ts` (706 named exports) instead of one big `ICON_GLYPHS` object. A bundler
ships only the glyphs you import, so the tree-shaking win is real and measured:

| Sample (esbuild, minified, react external) | gzip |
| --- | --- |
| `Icon` + **3 glyph objects** (`import { add, trash, cog }`) | **1.9 KB** |
| `Icon` + full `ICON_GLYPHS` map | **187 KB** |
| 3 glyph objects alone | 1.0 KB |
| full `ICON_GLYPHS` alone | 186 KB |

`<Icon>` now accepts **`IconName | IconGlyph`**:

```tsx
// tree-shakes — recommended:
import { add } from "@/components/ui/icons";
<Icon icon={add} />            // ships ≈ 1 glyph

// dynamic string form — resolves through the registry:
import { ICON_GLYPHS, registerIcons } from "@/components/ui/icons/all";
registerIcons(ICON_GLYPHS);    // once at app startup (or a selective subset)
<Icon icon="add" />            // now works
```

This was the user's chosen API ("registry + objects internal" over keeping strings zero-config): best
bundle size, with structural icons working standalone and only *caller-supplied* name strings needing
registration.

## The mechanism

Three icon support files (the `icon` registry item ships all of them + `icon.tsx`):

- **`icons/index.ts`** (generated) — `IconGlyph` type, the kebab `IconName` union, and 706
  `export const <camelName>: IconGlyph = {16:[…],20:[…]}`. Per-export tree-shaking from one file (no
  706-file explosion — registry stays simple). Names that camelCase to JS reserved words get an `Icon`
  suffix: `delete→deleteIcon`, `export→exportIcon`, `function→functionIcon`, `import→importIcon`,
  `package→packageIcon`, `switch→switchIcon` (verified collision-free; kebab keys unaffected).
- **`icons/all.ts`** (generated) — the full `ICON_GLYPHS: Record<IconName, IconGlyph>` map + a re-export of
  the registry fns. **Never imported by `icon.tsx`**, so it's only pulled when a consumer explicitly wants
  all glyphs. Keeps the `Record<IconName, …>` typing (the TS2590-avoidance from handoff 0059).
- **`icons/registry.ts`** (hand-written) — a `Map` + `registerIcons(partial)` + `getRegisteredGlyph(name)`.
  `icon.tsx` imports only `getRegisteredGlyph` (tiny, no glyph data), so importing `Icon` pulls zero glyphs.

`icon.tsx`: a glyph object renders directly; a string resolves via `getRegisteredGlyph` (dev-warns on an
unregistered name, renders an empty sized span — visible but non-fatal). `resolveIcon` + `IconProp` now
accept `IconGlyph`; exported `isIconGlyph` narrows glyph-object vs `ReactElement` (Alert renders its icon
slot by hand and uses it).

## What shipped

- **`tools/gen-icons.mjs`** — rewritten to emit per-glyph exports + `all.ts`; reserved-word handling.
- **`icons/registry.ts`** (new), **`icons/all.ts`** (new, generated), **`icons/index.ts`** (regenerated).
- **`icon.tsx`** — `icon: IconName | IconGlyph`; registry resolution; `IconProp`/`resolveIcon`/`isIconGlyph`.
- **~20 components** — structural/default icon-name strings → glyph-object imports, so they render
  standalone with no `registerIcons` call and tree-shake their own glyphs:
  alert, breadcrumbs, callout (intent-icon map → glyph objects), checkbox, date-input, date-picker,
  date-range-picker, dialog, drawer, entity-title (`document` imported as `documentIcon` to avoid shadowing
  the DOM global), html-select (string `iconName` prop kept; maps to 2 glyph objects internally),
  input-group (`leftIcon` widened to `IconName | IconGlyph`), numeric-input, omnibar, panel-stack, section,
  select, tag, time-picker, timezone-select, toast, tree.
- **`src/App.tsx`** + **`src/test/setup.ts`** — `registerIcons(ICON_GLYPHS)` (the gallery/demos and the
  test suite render icons by name).
- **`tools/gen-registry.mjs`** — `icon` item now ships `index.ts` + `all.ts` + `registry.ts`; a component
  importing a glyph from `./icons` now correctly gets `icon` as a `registryDependency` (was skipped before,
  when only `icon.tsx` imported the glyph file). `registry.json` regenerated (select/omnibar/callout/
  html-select/input-group now list `icon`).
- **CLAUDE.md**, **README.md** (replaced the stale "icons don't tree-shake" caveat), **roadmap** (P2.2 ✅).

## Verified

- `pnpm build` ✓ · `pnpm typecheck` ✓ · `pnpm test` **240 pass**.
- Bundle measurement above (esbuild against `src/`, `@`→`src` alias, react/clsx external).
- Fidelity unchanged — `tools/compare.sh` clean both themes:
  - `icon`: 19 specimens, **min SSIM 1.000, all clean** (light + dark).
  - `callout` (intent default icons now glyph objects): 8 specimens, all clean (light min 0.996, dark 0.986).
- Registry: `icon` item ships 4 files; transitive deps resolve (select → icon via input-group + directly).
- No new npm deps.

## Caveat / note for next session

- **Gallery bundle is still ~2.4 MB** — expected: `src/App.tsx` deliberately `registerIcons(ICON_GLYPHS)`
  (it renders icons by name across every demo). That's the "I want them all" path, not the tree-shaking
  measurement. A real consumer importing a handful of components gets the per-glyph win.
- **README known-limitations are partly stale beyond icons:** the a11y caveat (lines ~206–209) still says
  Tabs has no keyboard nav, Select-family lacks combobox ARIA, Hotkeys is display-only — all **resolved**
  in P0.2/P0.3 (PR #13 + handoff 0074). Worth a focused README accuracy pass for public-readiness; left
  untouched here to keep this commit scoped to icons.
- **CI registry-drift guard** only diffs `registry.json` (not the generated `icons/*.ts`). If you bump the
  Blueprint icon set, re-run both `pnpm gen:icons` and `pnpm gen:registry`.

## Next steps (updated priorities)

Phase C P2.1 ✅ · P2.2 ✅ · P2.3 ✅ · P2.4 ✅. Remaining, roughly in order:

1. **P1.3 — promote infra** (ResizeSensor, OverflowList, Portal) — finishes Phase B except the grid.
2. **P1.1 — the data grid** (`DataTable`) — the big multi-loop feature lever.
3. **P2.5/P2.6/P2.7** — token derivation, `@supports` fallbacks, `color-scheme` dark parity.
4. Quick win: the README a11y-caveat accuracy pass noted above.

## How to resume

```bash
cd /Users/bbatchelder/Code/mithril
git switch public-readiness && git pull
pnpm build && pnpm test          # green / 240
# tree-shaking is via glyph objects: import { add } from "@/components/ui/icons"; <Icon icon={add} />
# string form needs: registerIcons(ICON_GLYPHS) from "@/components/ui/icons/all"
```

- New files: `src/components/ui/icons/all.ts`, `src/components/ui/icons/registry.ts`,
  `docs/handoffs/0081-icon-tree-shaking.md`. Regenerated: `icons/index.ts`, `registry.json`.
  Modified: `gen-icons.mjs`, `gen-registry.mjs`, `icon.tsx` + ~20 components, `App.tsx`, `setup.ts`,
  CLAUDE.md, README.md, roadmap. New deps: **none**.
