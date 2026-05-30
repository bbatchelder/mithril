# 0071 — a11y close-out: axe CI net, submenu caret removed, SR checklist

- **Date:** 2026-05-30
- **Branch:** `a11y-behavior-gaps` (STAYS OPEN — still no PR; continues from 0070 @ `4aa4cca`)
- **Status:** The three remaining a11y items the user picked are addressed:
  **(1)** vitest-axe CI smokes, **(2)** the misleading submenu caret dropped, **(3)** SR manual
  checklist + a live a11y-tree spot-check. One minor edge-case finding logged (Select controlled-open).

## What shipped this session

### 1. axe smoke tests in CI — `src/components/ui/__tests__/axe-smoke.test.tsx`
- **No new dependency.** `axe-core@4.11` was already a dev dep (added for the 0070 chrome sweep);
  `vitest-axe` is just a thin matcher wrapper, so we wrote our own: `src/test/axe.ts` exports `axe()`
  and registers a `toHaveNoViolations` matcher, imported from `src/test/setup.ts`.
  - **Why not `pnpm add vitest-axe`:** the working tree has an uncommitted `package.json` bump to
    `packageManager: pnpm@11.4.0` while `node_modules` is still linked from the pnpm **v10** store, so
    any `pnpm add` triggers a store migration and fails. Sidestepped entirely by reusing axe-core.
- **Scope (documented in the helper):** jsdom has no layout/paint, so the helper **disables
  `color-contrast` and `target-size`** — this layer locks **role/name/ARIA/structure** regressions
  only. Contrast/tap-targets remain the chrome sweep's job (0070). Complements, not replaces.
- **17 cases**, ~all 56 components' high-traffic interactive set: Button (incl. icon-only),
  Checkbox/Radio/Switch, InputGroup, NumericInput, Slider, TimePicker, CardList, Callout, Tag,
  HTMLTable, Menu, Tabs (inline) + Dialog, Drawer, Alert, Popover (open overlays, axe over
  `document.body`). Each renders the component *as a consumer should* (with an accessible name where
  one is required) so a dropped name/role fails CI.

### 2. Submenu caret dropped (decision **A**, with the user) — `menu.tsx`
`MenuItem`'s `hasSubmenu` prop drew a `caret-right` that **opened nothing** — a misleading affordance.
Removed the prop, its default, and the `caretNode`. Updated the one demo usage in `src/App.tsx`
(now a labelled item, `label="⌘,"`) and mirrored the Blueprint-reference gallery specimen (it had
rendered a real Blueprint submenu via children) so the side-by-side stays apples-to-apples. Neither
specimen carries a `data-compare` key, so the compare harness never diffed it → **visually neutral by
construction**. `blueprint-parity-roadmap.md` §P2.8 updated: caret removed; real submenus remain an
unbuilt §2 completeness item (ContextMenu via Radix `*.Sub` through `MenuItemSlotContext`; standalone
menus likely need Radix `DropdownMenu`).

### 3. SR manual checklist + live a11y-tree spot-check — `docs/a11y-screen-reader-checklist.md`
A per-widget VoiceOver/NVDA test script (setup, expected announcements, results table) for the
last-mile that jsdom+axe can't reach (lived announcements). **I cannot hear an SR**, so this is the
human-run artifact; I did the programmatic half — a live a11y-tree read over the running app
(chrome MCP, `?component=` routes):
- **NumericInput:** spinbuttons + stepper buttons correctly named in the live tree. ✓
- **Select combobox:** correct under genuine interaction (proven by `select.test.tsx:55/81-84` with
  real `userEvent`). The live force-open showcase specimen (`App.tsx:3568`
  `popoverProps={{open:true}}`) shows the combobox `aria-expanded="false"` / no `aria-activedescendant`
  while the listbox is visibly open — a **showcase artifact**, because the popover is held open
  externally while Select's internal `isOpen` stays false.

## Finding logged (not fixed — your call)
**Select doesn't sync internal `isOpen` to a consumer-controlled `popoverProps.open`.** So a consumer
who drives open externally (or the gallery's force-open specimens) gets a combobox whose
`aria-expanded`/`aria-activedescendant` don't reflect the visible listbox. Normal click/keyboard open
is unaffected. Low priority, edge-case. Fix would be to derive/sync `isOpen` from a controlled
`popoverProps.open`. Documented in the SR checklist's "watch-items" too.

## Verification
- `pnpm test` → **70 passed** (12 files; +17 axe smokes, +menu still 6). `pnpm typecheck` ✓
  `pnpm typecheck:test` ✓ `pnpm build` ✓.
- **`tools/compare.sh` could not run this session:** it starts `tools/blueprint-reference` via
  `pnpm dev`, which under the uncommitted pnpm@11 bump tries to reinstall and fails
  (`ERR_PNPM_IGNORED_BUILDS` on esbuild). Environment issue from the uncommitted `package.json`, not
  the a11y edits. The only touched compared component is Menu, whose changed specimen has no
  `data-compare` key (provably neutral); re-run `compare.sh menu both` once the pnpm state is resolved.

## To resolve before / at PR time
1. **pnpm version state.** Decide on the `packageManager: pnpm@11.4.0` bump in `package.json`
   (currently uncommitted). Either commit it + `pnpm install` to relink to the v11 store (then
   `pnpm add`/`compare.sh` work again), or revert it to `pnpm@10.30.3`. Until then `compare.sh` and
   `pnpm add` are blocked.
2. Run `tools/compare.sh menu both` (expect unchanged baseline) once #1 is fixed.
3. Run the SR checklist with a real screen reader; log results in its table.
4. (Optional) Fix the Select controlled-open sync finding above.

## Files
- New: `src/test/axe.ts`, `src/components/ui/__tests__/axe-smoke.test.tsx`,
  `docs/a11y-screen-reader-checklist.md`, this handoff.
- Edited: `src/components/ui/menu.tsx` (drop `hasSubmenu`), `src/App.tsx` +
  `tools/blueprint-reference/src/App.tsx` (menu demo specimen), `src/test/setup.ts` (import axe matcher),
  `docs/blueprint-parity-roadmap.md` (§P2.8). `package.json` carries an unrelated, pre-existing
  uncommitted pnpm bump — leave for the user to decide (see above).

## Branch state
`a11y-behavior-gaps`, working changes uncommitted (this session's edits + the pre-existing
`package.json` pnpm bump). **Leave open** per standing instruction — no PR yet. Commit gate: once the
pnpm state is resolved, `pnpm build` + `pnpm test` (green now) + `compare.sh menu` must pass.
