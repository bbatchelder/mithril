# Roadmap to a hands-down recommendation

> **Audience:** the mithril development team.
> **Goal:** close every gap that currently makes [`comparison-vs-blueprint.md`](./comparison-vs-blueprint.md)
> recommend Blueprint for serious apps, so that mithril becomes the **unconditional** choice over
> Blueprint for greenfield work — without giving up the things it already wins on (clean API, small CSS,
> ownership, React 19).
>
> Every item below traces to an adversarially-verified finding (audit of 2026-05-29, mithril
> `public-readiness` vs Blueprint v6.15). Items are tiered by how much they move the recommendation.

## The core problem to internalize

mithril's distribution model is *own-the-source*. That makes two things **non-optional** rather than
nice-to-have:

1. **Accessibility must be correct in the box** — consumers inherit our behavior and rarely re-derive
   keyboard/ARIA themselves.
2. **There must be a test net** — the visual comparison harness *cannot* catch a missing keyboard
   handler or ARIA attribute, and owned source with no tests silently regresses.

These two (P0) are the credibility blockers. Completeness (P1) and polish (P2/P3) come after.

---

## P0 — Credibility blockers (do these first)

> Until these land, the honest recommendation for any accessibility-sensitive app is Blueprint. These
> are the highest-leverage items by far.

> **✅ Status (2026-05-31): P0 is fully closed.** P0.1 (test foundation) and P0.2 (keyboard/ARIA gaps)
> landed via PR #13 (handoffs 0066–0073); P0.3 (`useHotkeys` engine) landed in handoff 0074. The only
> remaining accessibility-adjacent item is a live VoiceOver/NVDA pass (jsdom + axe can't validate lived
> announcements). The next work is P1 completeness.

### P0.1 — Establish a behavioral test foundation ✅ done (PR #13)

- **Problem:** 0 tests vs Blueprint's 152. Verification is screenshot-only; keyboard/ARIA regressions
  are invisible. (CLAUDE.md currently states "No unit tests — verification is visual via the harness.")
- **Action:**
  - Add Vitest + `@testing-library/react` + `@testing-library/user-event` + `jsdom`/`happy-dom`.
  - Adopt a per-component **a11y/behavior contract test** convention (keyboard map, roving focus,
    ARIA roles/attrs, controlled/uncontrolled). Start with the P0.2 components as you fix them — write
    the test *with* the fix so it locks in.
  - Add `axe-core` (`vitest-axe`) smoke assertions per component story.
  - Update CLAUDE.md/ROADMAP "no tests" policy to "visual harness for fidelity **+** unit tests for
    behavior/a11y."
- **Done when:** `pnpm test` exists and runs in CI; every component touched in P0.2/P1 ships with a
  contract test; axe smoke passes for all components.

### P0.2 — Close the hand-rolled keyboard/ARIA gaps ✅ done (PR #13)

Fix in roughly this order (highest user impact first). SegmentedControl already proves we can hand-roll
this correctly — use it as the reference pattern.

| Component | Gap (verified) | Action | Done when |
| --- | --- | --- | --- |
| **Tabs** (`tabs.tsx`) | No `onKeyDown` at all — cannot move between tabs | Add arrow-key focus movement with wrap across **enabled** tabs (Home/End optional), honoring roving `tabIndex` already present (~`:337`) | Keyboard user can traverse tabs; matches Blueprint `tabs.tsx` `handleKeyDown`; test asserts focus moves + wraps |
| **Menu / MenuItem** (`menu.tsx`) | Hardcoded `role="menuitem"`, no roving-tabindex, no arrow nav, no `roleStructure` | Add roving tabindex + Arrow/Home/End/typeahead nav; add a `roleStructure` prop (`menuitem`/`listoption`/`none`) emitting correct role + `aria-selected` | Arrow keys move active item; listbox variant emits `option`/`aria-selected`; tests cover both |
| **Select / Suggest / MultiSelect / Omnibar** | Missing the **combobox WAI-ARIA pattern** entirely | On the input/trigger set `role=combobox`, `aria-expanded`, `aria-controls`, `aria-haspopup="listbox"`, `aria-autocomplete="list"`, `aria-activedescendant`; render the list as `role=listbox` with `role=option` items (depends on Menu `roleStructure` above) | Screen reader announces active option; matches Blueprint `select.tsx` + `queryList.tsx`; tests assert the attributes track active item |
| **ContextMenu** (`context-menu.tsx`) | Wraps Radix but feeds it mithril `<Menu>`, so no arrow-nav/typeahead/submenu | Either (a) route items through `RadixContextMenu.Item`/`.Sub` so Radix's collection drives nav, or (b) reuse the now-keyboard-capable Menu from above. Add submenu support | Arrow keys + typeahead work in context menus; submenus open; test covers nav |
| **NumericInput** (`numeric-input.tsx`) | No `role=spinbutton` / `aria-value*` on the input | Add `role="spinbutton"` (when numeric-only) + `aria-valuenow/min/max` on the input, mirroring Blueprint `numericInput.tsx:466-471` | SR announces a spinbutton with current/min/max; test asserts values update on step |
| **Alert** (`alert.tsx`) | `role="dialog"` not `alertdialog` | Override the Radix Content role to `alertdialog` (or set `aria-roledescription`) for confirmation semantics | Alert exposes `role="alertdialog"`; test asserts it |
| **Hotkeys** (`hotkeys.tsx`) | ✅ done (handoff 0074) — `useHotkeys` engine added; see **P0.3** | — | Combos fire; `?` opens the dialog; 16 behavior tests |

### P0.3 — Add a `useHotkeys` engine ✅ done (handoff 0074)

- **Problem:** `hotkeys.tsx` only renders `KeyCombo` + a dialog; there is no event binding. Blueprint's
  `useHotkeys` registers global + local `keydown`/`keyup`, parses combos (`getKeyCombo`/`comboMatches`),
  dispatches callbacks, and opens the help dialog on `?`.
- **Action:** Implement a `useHotkeys(hotkeys)` hook + provider that binds listeners, parses combos
  (with platform mod-key handling), dispatches `onKeyDown`/`onKeyUp`, respects input-target exclusion,
  and wires `?` → open the existing `HotkeysDialog`. Keep `KeyCombo`/dialog as the presentation layer.
- **Done when:** registering a hotkey actually fires; `?` opens the dialog from real bindings; tests
  cover combo matching + dispatch + the `?` shortcut.
- **✅ Resolved (handoff 0074):** `useHotkeys(keys, options)` + `HotkeysProvider`/`HotkeysContext` +
  `parseKeyCombo`/`getKeyCombo`/`comboMatches` ported into `hotkeys.tsx` (one self-contained file).
  Global + local binding, input-target exclusion (`allowInInput`), `disabled`/`preventDefault`/
  `stopPropagation`, and `?` → dialog all work. 16 behavior tests in `hotkeys.test.tsx`; dogfooded in
  the Skylark demo (`src/demos/mission/MissionControl.tsx`). No new deps.

> Listed under both P0 and P1 because it is *both* an a11y/behavior correctness item and a missing
> capability.

---

## P1 — Completeness (close the capability gaps)

> These are the components/capabilities Blueprint has and mithril lacks. Without them, Blueprint stays
> the answer for any app that needs them.

### P1.1 — Data grid (the big one) ✅ done (7-loop phase)

> Composing **TanStack Table v8 + TanStack Virtual v3** under mithril's API + tokens. Modern `columns`
> array + `data` API (not Blueprint's `<Column>` children). Loop plan:
> `~/.claude/plans/snuggly-wibbling-clover.md`.
> - [x] **Loop 1** — engine wiring + static grid skeleton (handoff 0083): sticky header, numbered gutter,
>   ruled cells, Blueprint `Table2` token fidelity (crop SSIM 0.957 light / 0.936 dark).
> - [x] **Loop 2** — row virtualization + sticky header + scroll sync (handoff 0084): `@tanstack/react-virtual`
>   windowing, single-scroll-container axis sync, `initialRect`-seeded viewport. Column virtualization deferred.
> - [x] **Loop 3** — selection (row + cell + focused cell) (handoff 0088): own region reducer
>   (`selection.ts`), translucent-blue region overlays + 2px focused outline, click/shift-click/drag
>   handlers, header/gutter band selection + selected tint, controlled+uncontrolled `selection`/`focusedCell`.
> - [x] **Loop 4** — column **resize** (handoff 0089): per-column right-edge `ew-resize` handle
>   (TanStack `getResizeHandler`, `columnResizeMode:"onEnd"`), full-height blue resize guide + drag
>   cursor overlay, `enableColumnResizing` prop. Cursor + text-select fidelity also landed here.
> - [x] **Loop 4b** — column **reorder** (handoff 0090): per-header `DragHandleVertical` reorder
>   handle (Blueprint `.bp6-table-reorder-handle-target`, 22px grab zone + 22px name indent),
>   drag-to-reorder with a blue drop guide + grabbing cursor overlay, TanStack `columnOrder` state,
>   `enableColumnReordering` + controllable `columnOrder`/`onColumnOrderChange`.
> - [x] **Loop 5** — editable cells (handoff 0091): per-column `editable` flag; double-click an
>   editable cell → borderless inline `EditableCell` seeded + auto-selected, **Enter/blur commits**
>   (`onCellEdit`), **Esc reverts**. Editing ring = the `shadow-input-focus` token (== Blueprint
>   `.bp6-editable-text-editing` box-shadow, both themes); the grid owns `editingCell` state.
> - [x] **Loop 6** — keyboard navigation + clipboard (handoff 0092): the grid is focusable;
>   arrows move the focused cell (Shift extends from the anchor), Tab/Shift-Tab wrap on row
>   edges, Enter/Shift-Enter move vertically, Enter/F2 start an edit on editable cells (the
>   commit then advances down/right), and Cmd/Ctrl-C copies the selection as TSV. Row
>   scroll-into-view keeps the focused cell visible in the virtualized grid.
> - [x] **Loop 7** — loading/skeleton + multi-region + polish + docs (handoff 0093): `loading`
>   prop → Blueprint-spec skeleton bars in cells (4px) / headers (8px) / gutter, reusing the
>   `Skeleton` primitive; `selectionMode="multi"` (Cmd/Ctrl-click adds a region, copy serializes
>   all via `regionsToTSV`); Home/End (Cmd/Ctrl ⇒ grid corners) + PageUp/PageDown nav; a gallery
>   usage section. Loading bars are deterministic full-width — Blueprint randomizes its widths
>   (`LoadableContent variableLength`, 25-75%), so loading is visual-only, not a keyed diff.

- **Problem:** No equivalent to Blueprint's **Table2** (~13k LOC: virtualized rows/cols, selection,
  resize, reorder, editable cells, clipboard). `html-table` is CSS-only.
- **Action:** Build a `DataTable`/`Table` component. Strongly consider composing a headless engine
  (e.g. TanStack Table + TanStack Virtual) under mithril's API + tokens rather than re-deriving 13k LOC.
  Cover: column resize/reorder, row/cell/region selection, editable cells, sticky headers, virtualized
  scroll, keyboard cell navigation, clipboard copy.
- **Done when:** a virtualized, selectable, resizable grid ships with keyboard nav + tests; documented
  in the gallery and registry.
- **Note:** This is a multi-loop effort — scope it as its own phase. It is the single largest lever for
  "feature parity."

### P1.2 — Hotkey engine ✅ done (handoff 0074)

See **P0.3** (cross-listed) — resolved.

### P1.3 — Missing composite & infra components

| Missing | Action | Done when |
| --- | --- | --- |
| **MultistepDialog / DialogStep** ✅ done (handoff 0077) | Build on existing Dialog: step state, footer nav (Back/Next/Submit), per-step panels | Multi-step wizard works; registry + gallery + tests |
| **ButtonGroup** ✅ done (handoff 0075) | Layout/segmentation wrapper around Button (attached borders, vertical, fill) | Matches Blueprint visuals; registry entry |
| **AnchorButton** ✅ done (handoff 0076) | `<a>`-rendered button variant reusing Button's `buttonVariants` | Renders `<a role="button">` with button styling + disabled semantics; registry entry |
| **Standalone `ResizeSensor`, `OverflowList`, `Portal`/provider** ✅ done (handoff 0082) | Built as exported, reusable components/hooks: `ResizeSensor` + `useResizeObserver`, `OverflowList` (Blueprint's binary-search repartition ported to a function component, built on `ResizeSensor`), `Portal` + `PortalProvider`/`PortalContext`. Each is registered (gallery + registry) and has behavior + axe tests (21 new). | Each is independently importable + registered + tested |

---

## P2 — Distribution & DX polish (turn near-wins into clean wins)

### P2.1 — Make the shadcn install path actually work ✅ done (handoff 0080)

- **Resolved (handoff 0080):** `pnpm build:registry` runs the official `shadcn build` (pinned 4.9.0 via
  `pnpm dlx`) to emit per-item JSON with source inlined, then `tools/rewrite-registry-urls.mjs` rewrites
  every cross-component `registryDependencies` from bare names → full URLs and copies the `registry.json`
  index — all into `dist/r/`. `deploy.yml` runs it after `pnpm build`, so Pages now serves the registry at
  `https://bbatchelder.github.io/mithril/r/<name>.json`. New `ci.yml` gates PRs/main on
  build + test + a **registry-drift guard** (`pnpm gen:registry` then `git diff --exit-code registry.json`)
  + a `build:registry` smoke test. Verified end-to-end into a scratch project both ways: direct URL
  (`shadcn add <url>/r/select.json` → full transitive closure) and the `@mithril` namespace
  (`shadcn add @mithril/button`, deduping already-installed deps). README updated with both methods.
- **Problem:** `registry.json` is generated but **never served** — only the demo gallery is deployed.
  The README's `npx shadcn add <url>/button` is aspirational; the only real path today is hand-copying.
- **Action:** Serve the registry: emit `registry.json` (and per-item JSON if needed) into the deployed
  `public/` output, wire the deploy (GitHub Pages/CI) to publish it at a stable URL, and verify
  `npx shadcn@latest add <url>/<component>` end-to-end. Add a CI check that regenerates the registry
  (`pnpm gen:registry`) and fails on drift (the manifest is only "can't drift" by discipline today).
- **Done when:** a fresh project can install any component via the documented command; CI guards
  registry freshness.

### P2.2 — Fix icon tree-shaking ✅ done (handoff 0081)

- **Resolved (handoff 0081):** `tools/gen-icons.mjs` now emits `icons/index.ts` with **one
  `export const <camelName>: IconGlyph` per glyph** (706 named exports) — so a bundler ships only the
  glyphs you import. `Icon` accepts `IconName | IconGlyph`: a **glyph object** (`<Icon icon={add} />`,
  imported from `./icons`) renders directly and tree-shakes; a **name string** (`<Icon icon="add" />`)
  resolves through a small **registry** (`icons/registry.ts`), populated via `registerIcons(ICON_GLYPHS)`
  from `icons/all.ts` (the "I want them all" convenience) or a selective subset. The full `ICON_GLYPHS` map
  moved to `all.ts` and is never reachable from `icon.tsx`. The ~20 components with structural/default icons
  were converted to glyph-object imports, so they render standalone (no registration) and tree-shake their
  own glyphs; the gallery + test setup call `registerIcons(ICON_GLYPHS)`. **Measured:** importing `Icon` +
  3 glyph objects bundles **~1.9 KB gzip** vs **~187 KB** for the full map. Fidelity unchanged (icon +
  callout harness clean, both themes; 240 tests green).
- **Problem:** All 706 glyphs live in one `ICON_GLYPHS` `Record`, synchronously indexed — importing
  `Icon` drags in **~195 KB gzip** with zero tree-shaking. Blueprint ships per-icon ES modules + async
  split-by-size loading.
- **Action:** Change `tools/gen-icons.mjs` to emit **one module per glyph** (e.g.
  `icons/glyphs/<name>.ts`) plus an optional async registry/loader, so a bundler drops unused glyphs.
  Keep a convenience barrel for "I want them all," but make per-icon import the default path. Preserve
  the `IconName` union typing that avoids TS2590 (see icons memory).
- **Done when:** importing `Icon` + using 3 glyphs ships ≈ those 3, not 195 KB; measured in a sample
  bundle; documented.

### P2.3 — Unify the type vocabulary ✅ done (handoff 0079)

- **Resolved (handoff 0079):** added `src/lib/types.ts` exporting one `Intent` (registered as a `types`
  registry:lib item, pulled in transitively like `cn`). All 18 `*Intent` unions now alias it
  (`export type ButtonIntent = Intent`), keeping each component's public type name while the vocabulary
  is defined once; `SegmentedControlIntent` narrows via `Extract<Intent, "none" | "primary">`. A consumer
  can now write `(intent: Intent) => …` generically.
- **Problem:** No shared `Intent` type — ~19 duplicated `*Intent` string unions
  (`ButtonIntent`, `MenuIntent`, `TagIntent`, `InputGroupIntent`, …). Consumers can't write generic
  intent-typed helpers. Blueprint has shared `IntentProps`/`ActionProps`/`ControlledValueProps`/
  `OptionProps`.
- **Action:** Introduce a shared `types.ts` (or `lib/`) exporting one `Intent`, plus small shared prop
  mixins, and have components reference them. Keep the shadcn "self-contained file" ergonomics in mind —
  a single tiny shared types module is an acceptable shared dep (like `cn`).
- **Done when:** one `Intent` type is the single source; components import it; a consumer can type
  `(intent: Intent) => …` generically.

### P2.4 — Normalize the icon prop convention ✅ done (handoff 0079)

- **Resolved (handoff 0079):** added `resolveIcon()` + the `IconProp` type to `icon.tsx`. Every icon slot
  now accepts `IconProp` (`IconName | React.ReactElement | false | null` — NOT `… | ReactNode`, which
  would collapse to `ReactNode` and kill `IconName` autocomplete; mirrors Blueprint's `IconName |
  MaybeElement`). Wired into button, anchor-button, callout, dialog, drawer, tag, segmented-control, and
  alert (upgraded). A string renders as `<Icon>` with host-appropriate size/color; custom elements pass
  through. `<Button icon="add" />` / `<Callout icon="info-sign" />` now work with no `<Icon>` import.
- **Problem:** Inconsistent: `MenuItem.icon` is `IconName` (string) but `Button.icon`/`endIcon` are
  `React.ReactNode`, forcing `icon={<Icon icon="add" />}` + an import for every button.
- **Action:** Accept `IconName | React.ReactNode` everywhere (string → render `<Icon>` internally).
  Apply library-wide so the low-boilerplate `icon="floppy-disk"` form works consistently.
- **Done when:** `<Button icon="add" />` works; all icon-accepting components share the convention.

### P2.5 — Restore a derivable token pipeline ✅ done (option a)

- **Resolved:** chose **(a) derive at runtime.** Every seed-dependent semantic token in `tokens.css`
  (intent text, tag shades, focus/ring, link, selection, input intent+focus shadows, selected-card ring,
  surfaces, borders, ghost backgrounds, disabled text) is now an `oklch(from var(--seed) …)` /
  `color-mix()` derivation. Offsets mirror Blueprint's DTCG `com.blueprint.derive` extensions and were
  verified (OKLCH↔sRGB resolver) to reproduce the prior baked literals byte-for-byte, so the default
  theme stays pixel-identical (`compare.sh` clean: button/tag/card/callout/input-group/numeric-input/
  checkbox/html-select all `N match · 0 differ` both themes).
- **Themeable:** seeds = the `@theme` intent vars (all four intents) + the gray ramp. A theme overrides
  **only seeds** (apply `data-theme` on `<html>`); both light AND dark variants re-derive automatically
  because mode (light/dark) and theme (seed set) are orthogonal. Ships one example, `[data-theme="datex"]`
  (vivid violet primary + mint/amber/red brand status intents; re-tints intents only — neutrals left at the
  default grays), wired into the gallery (sidebar tint button / `?palette=datex`).
- **Library-wide component sweep:** every component now routes its intent colors through the seed/intent
  tokens (canonical `--intent-*-text` for icon/text, `bg-primary`/`bg-{intent}` for fills, `bg-{intent}/N`
  for tints) instead of palette literals, so the whole library re-tints with the theme. Verified
  `compare.sh`-clean in both themes across Button, Icon, Spinner, ProgressBar, Tag, Callout, Menu, Toast,
  FormGroup, EditableText, Link, DatePicker, DateRangePicker, Tree, Tabs, NumericInput, Checkbox, Radio,
  Switch, Slider, DataTable (selection/focus overlays), MultistepDialog. Neutral/"none" grays intentionally
  stay on the palette. (Two distinct intent-text tokens: canonical `--intent-*-text` = tier-2/tier-5 for
  typography/icon/callout; `--intent-*-minimal-text` = color-mix dark for button minimal/outlined.)
- **Future:** full runtime theming (a `ThemeProvider`/API + multi-theme gallery switcher — option #3) is
  noted as planned future work in `docs/theming.md`.
- **Done when:** changing a seed re-tints the theme. ✅ See `docs/theming.md`.

### P2.6 — Add progressive-enhancement fallbacks ✅ done

- **Resolved:** every derived token is declared twice — a static sRGB-literal fallback in the base
  `:root`/`.dark` block, then the live derivation inside `@supports (color: oklch(from white l c h))`.
  Engines without relative-color keep the exact verified literals; supporting engines get the re-tintable
  values. The `@supports` test gates the newest feature (relative color), so `color-mix(in oklch)` is
  covered by the same guard.
- **Done when:** the theme renders correctly without `oklch(from …)` support. ✅ (fallbacks = the literals
  that shipped before this change).

### P2.7 — Dark-mode selector & native-control parity ✅ done

- **Resolved:** `:root` sets `color-scheme: light`, the dark scope sets `color-scheme: dark` (native
  scrollbars/controls/spinners follow the mode). Dark mode now activates via **either** `.dark` **or**
  `[data-mode="dark"]` — the `@custom-variant dark` matches both, and the dark semantic block is keyed to
  both selectors. Verified `[data-mode="dark"]` drives both the semantic tokens and the `dark:` utility
  variant.
- **Done when:** native controls follow dark mode and both selector styles work. ✅

### P2.8 — MenuItem submenus + Popover hover; controlled-input safety

- **MenuItem submenus:** the no-op `hasSubmenu` caret was **removed** (it was a misleading affordance —
  see handoff 0071). Submenus remain unbuilt: add declarative children-driven submenus (like Blueprint's
  auto hover-Popover) — for the ContextMenu case via Radix `*.Sub` through `MenuItemSlotContext`, and a
  hosted model (likely Radix `DropdownMenu`) for standalone menus.
- **Popover `interactionKind`:** add `hover`/`hover-target-only` modes (+ open/close delays) so
  hovercards can be Popovers. mithril already has `matchTargetWidth`; this fills the remaining behavioral
  gap. (Radix Popover is click/focus-only — may need a small hover wrapper or Floating UI for hover.)
- **Controlled inputs:** consider an `AsyncControllableInput`-equivalent / shared controlled-state
  helper instead of per-component `internalChecked` + `useEffect` mirroring, to dodge the known React
  controlled-input pitfall once and consistently.
- **Done when:** nested `<MenuItem>` renders a submenu; Popover supports hover; controlled inputs share
  one safe pattern with tests.

---

## P3 — Hardening & longevity

- **P3.1 — CI for the comparison harness.** Run `tools/compare.sh` in CI (or a CI-friendly variant) so
  fidelity regressions are caught automatically, not point-in-time by hand.
- **P3.2 — Widen the computed-style gate.** The gate omits `fontFamily`, `lineHeight`, vertical padding,
  and `borderStyle` — add them (or add explicit visual-regression image diffs) to close the documented
  blind spots that hid Button width / Checkbox-Radio row-height drift.
- **P3.3 — Broaden React peer range** if you want to court Blueprint's installed base (currently React
  19-only); at minimum document the React 19 requirement prominently.
- **P3.4 — Per-component a11y status badges** in the gallery/registry so consumers can see what's been
  behavior-tested vs visual-only (interim honesty while P0.2 rolls out).
- **P3.5 — Migration note from Blueprint** (prop-name mapping table) to lower switching cost for
  existing Blueprint users.

---

## What "hands-down" looks like (acceptance)

mithril becomes the unconditional recommendation over Blueprint when **all** of the following are
true:

1. **A11y parity:** Tabs/Menu/Select-family/ContextMenu/NumericInput/Alert/Hotkeys all pass keyboard +
   ARIA contract tests and `axe` smoke (P0.2, P0.3).
2. **Test net:** every component has behavior/a11y unit tests running in CI (P0.1); fidelity harness runs
   in CI (P3.1).
3. **Completeness:** a real data grid, hotkey engine, and MultistepDialog/ButtonGroup/AnchorButton ship
   (P1).
4. **Install path works:** `npx shadcn add` installs from a served registry, guarded against drift (P2.1).
5. **Icons tree-shake** (P2.2) and the **type vocabulary is unified** (P2.3); icon prop convention is
   consistent (P2.4).
6. **Theme is derivable** (or the freeze is a documented, fallback-backed intentional choice) with
   `@supports` graceful degradation (P2.5, P2.6).

At that point mithril keeps everything it already wins — cleaner API, ~16.6 KB CSS, lean deps,
React 19, owned source, verified fidelity — **and** matches Blueprint on the axes where Blueprint
currently wins. That is the hands-down state.

## Suggested sequencing

1. **Phase A (P0): ✅ complete.** test foundation → Tabs → Menu/MenuItem roleStructure → Select-family
   combobox ARIA → ContextMenu → NumericInput/Alert → `useHotkeys`. *(Accessibility recommendation gap
   closed; only a live VoiceOver/NVDA pass remains.)*
2. **Phase B (P1):** MultistepDialog/ButtonGroup/AnchorButton + promoted infra → **then** the data grid
   as its own multi-loop phase. *(Closes the completeness gap.)*
3. **Phase C (P2):** serve the registry + CI drift guard → icon tree-shaking → shared `Intent` + icon
   prop convention → token derivation + `@supports` + `color-scheme`.
4. **Phase D (P3):** harness in CI, widen the style gate, badges, migration guide.

---

*Derived from the verified comparison audit of 2026-05-29. Companion document:
[`docs/comparison-vs-blueprint.md`](./comparison-vs-blueprint.md).*
