# 0066 — a11y pass #1: Vitest test foundation + Tabs rebuilt on Radix

- **Date:** 2026-05-29
- **Branch:** `a11y-behavior-gaps` (cut from `public-readiness` @ `2738d0c`)
- **Focus:** Begin closing the accessibility/behavior gaps in [[a11y-gaps-vs-blueprint]] /
  `docs/comparison-vs-blueprint.md` §1. Two pieces: stand up a behavior test runner (roadmap P0.1),
  then fix **Tabs** (P0.2). Scope was **Tabs-only, then reassess** (user's call).

## TL;DR

- **New test foundation:** Vitest + Testing Library + jsdom. `pnpm test` runs behavior/ARIA unit
  tests the visual harness can't see. Deliberate, scoped deviation from the old "no unit tests" rule —
  visuals still verified by `compare.sh`; *behavior* now has its own net.
- **Tabs rebuilt on `@radix-ui/react-tabs`** (not a hand-rolled keyboard handler). Decision made with
  the user: Blueprint is our *visual* spec, not behavioral; the repo's pattern is "own the visuals,
  lean on Radix for behavior" (the audit found every Radix-backed component is the one that checks out).
- **Public API preserved**, **visuals identical** (`compare.sh tabs both` → 5·0, same SSIM as before),
  **18 tests green**.

## Why Radix (the key decision)

The first cut hand-rolled Blueprint's manual-activation keyboard model. On review we changed course:
- WAI-ARIA APG and the ecosystem (Radix, React Aria) default to **automatic activation** (arrow =
  move focus AND select); Blueprint's manual-only model is the outlier.
- Hand-rolling combobox/tablist a11y is exactly what bit the other components. Standardizing on Radix
  for *behavior* (and owning only Blueprint *visuals*) is the coherent architecture and de-risks the
  remaining a11y work (Menu, Select-family).

## Test foundation (P0.1)

- Dev deps: `vitest@3`, `jsdom`, `@testing-library/{react,dom,user-event,jest-dom}`.
- `vitest.config.ts` — separate from `vite.config.ts` (no Tailwind plugin in tests); jsdom env,
  globals, `setupFiles: src/test/setup.ts`, includes `src/**/*.{test,spec}.{ts,tsx}`.
- `src/test/setup.ts` — jest-dom matchers + `cleanup()` after each test.
- Scripts: `pnpm test`, `pnpm test:watch`, `pnpm typecheck:test`.
- **Test placement matters:** tests live in `src/components/ui/__tests__/`, NOT directly in
  `src/components/ui/`. `tools/gen-registry.mjs` does `readdirSync(UI_DIR).filter(f=>f.endsWith('.tsx'))`
  — a `*.test.tsx` in `ui/` would mint a bogus registry entry. A `__tests__/` subdir is skipped.
- **tsconfig:** `tsconfig.app.json` now **excludes** test dirs (keeps `pnpm build` + registry clean);
  `tsconfig.test.json` (extends app, `exclude: []`, `@testing-library/jest-dom` + `node` types)
  type-checks tests via `pnpm typecheck:test`.

## Tabs rebuild (P0.2)

`src/components/ui/tabs.tsx` now composes `TabsPrimitive.Root/List/Trigger/Content` internally while
keeping the friendly `<Tabs id …><Tab id title icon panel disabled/></Tabs>` API. New `activationMode?:
"automatic" | "manual"` prop (**default `"automatic"`**). What we kept owning:

- **Visuals** — all Blueprint type/color/spacing classes reapplied to the Radix `Trigger` (a native
  `<button>`, so it gets `appearance-none bg-transparent border-0 [font-family:inherit] text-left` to
  inherit the type system). Selected/hover/disabled now key off `data-[state=active]` / `enabled:` /
  `disabled:` instead of a context boolean.
- **Sliding indicator** — still our measure-offset bar, now driven by
  `[role="tab"][data-state="active"]`.
- **Icon** — uses `!text-current` so it follows the tab's text color (link when active) — simpler than
  the old per-tab intent.
- **TabId numbers** — mapped to/from the string values Radix uses.
- **Removed `focus-visible:outline-none`** that the first cut had — suppressing the focus ring is an
  a11y regression; the harness captures the unfocused state so fidelity is unaffected.

### Behavior changes vs the old hand-rolled component (all intentional / more correct)
- **Automatic activation** by default (arrow selects); `manual` available.
- **Orientation-correct arrows** — horizontal uses Left/Right, vertical uses Up/Down (old code fired on
  both axes). **Home/End** now work (Radix). RTL-aware.
- **Roving-focus model differs:** the `[role="tablist"]` carries `tabindex=0` (the single tab stop) and
  delegates to the active/first tab on focus; individual tabs rove at `-1`. (This tripped an initial
  test that assumed the old "selected tab = tabindex 0" model — see gotcha below.)
- **Inactive panels unmount** (Radix default) instead of staying hidden — idiomatic, cheaper.
- Disabled tabs use the native `disabled` attribute (not `aria-disabled`).

### Tests (`src/components/ui/__tests__/tabs.test.tsx`, 17)
ARIA structure (orientation H/V, aria-selected, tab↔panel linkage, **Radix roving-focus: tablist is the
tab stop**, panel unmount, disabled); mouse (click selects + onChange, disabled inert, roving tabindex
follows selection); keyboard automatic (arrow selects+moves, skip disabled, wrap, Home/End, vertical
Up/Down); keyboard manual (arrow focus-only then Enter/Space selects); controlled mode.

## Verification

- `pnpm test` → **18 passed** (17 Tabs + 1 smoke).
- `pnpm build` ✓ · `pnpm typecheck:test` ✓.
- `tools/compare.sh tabs both` → **5 match · 0 differ** both themes; SSIM identical to the pre-rewrite
  baseline (light 0.984, dark 0.960; `tab-indicator` 1.000). Dark `tab-default` 0.949 is the same
  pre-existing dark text-AA noise, unchanged.

## Gotchas / things to know

1. **Radix roving focus = "group is the tab stop."** `[role="tablist"]` gets `tabindex=0`; tabs are
   `-1` until focused. Don't assert "selected tab has tabindex 0" — that's the old model. See
   [[radix-roving-focus-model]].
2. **An `act()` warning** prints during the keyboard tests — it's our indicator `useEffect` doing
   `setState` after Radix's selection change. Benign; tests pass. (jsdom has no layout so the indicator
   math is a no-op there anyway.)
3. **Tests go in `__tests__/`**, never directly in `src/components/ui/` (registry scan). See above.
4. New deps this loop: `@radix-ui/react-tabs` (dep) + the test toolchain (devDeps). Registry picks up
   `@radix-ui/*` automatically.

## Files touched

- New: `vitest.config.ts`, `tsconfig.test.json`, `src/test/setup.ts`, `src/test/setup.test.ts`,
  `src/components/ui/__tests__/tabs.test.tsx`, this handoff.
- Edited: `src/components/ui/tabs.tsx` (full Radix rebuild), `package.json` (deps + scripts),
  `tsconfig.app.json` (exclude tests).

## Next steps (remaining a11y gaps, in roadmap order)

Reassess with the user. With the Radix precedent set, prefer primitives where they fit:

1. **Menu / MenuItem** — roving tabindex + arrow nav + `roleStructure`. (Radix has no standalone Menu;
   evaluate `@radix-ui/react-menubar`/composition vs a hand-rolled roving model with tests.)
2. **Select / Suggest / MultiSelect / Omnibar** — full combobox WAI-ARIA pattern.
3. **ContextMenu** — feed Radix `RadixContextMenu.Item` (not the plain `<Menu>`) so arrow nav /
   typeahead / submenus work.
4. Smaller: **NumericInput** `role="spinbutton"` + `aria-value*`; **Alert** `role="alertdialog"`;
   **Popover** hover mode.

Each ships with tests now that the runner exists. When §1 is closed, update [[a11y-gaps-vs-blueprint]].
