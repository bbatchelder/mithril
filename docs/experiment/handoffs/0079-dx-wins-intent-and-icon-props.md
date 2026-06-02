# 0079 — DX wins: shared `Intent` type (P2.3) + string-name icon props (P2.4)

- **Date:** 2026-05-31
- **Focus:** The two mechanical, library-wide DX items from the 0078 next-steps plan — unify the
  duplicated `*Intent` unions behind one shared type, and let every icon slot accept a bare
  icon-name string (the exact footgun hit on the Callout last session).
- **Branch:** `public-readiness`

## Summary

Two independent, low-risk refactors that improve the public API without touching any rendered output
(the element path is unchanged; only a new string path is added):

1. **P2.3 — one shared `Intent`.** New `src/lib/types.ts` exports `Intent =
   "none" | "primary" | "success" | "warning" | "danger"`. All 18 component `*Intent` unions now alias
   it instead of re-declaring the literal. The vocabulary is defined once; each component keeps its
   named type (e.g. `ButtonIntent`) for a stable public API.
2. **P2.4 — `icon="add"` everywhere.** New `resolveIcon()` helper + `IconProp` type in `icon.tsx`.
   Every icon slot accepts `IconProp` (icon-name string **or** element); a string renders as `<Icon>`
   internally with host-appropriate size/color. No more `icon={<Icon icon="add" className="!text-current" />}`
   + an import for every button.

## What shipped

### P2.3 — shared `Intent` type
- **`src/lib/types.ts`** (new) — exports `Intent`. Tiny, dependency-free.
- **`tools/gen-registry.mjs`** — added a `types` `registry:lib` item (mirrors `utils`) and `@/lib/types`
  detection, so any component using `Intent` lists `types` in its `registryDependencies` and `npx shadcn add`
  pulls the file in transitively (same mechanism as `cn`).
- **18 components** now `export type XIntent = Intent` (was the 5-member literal): alert, button, callout,
  editable-text, form-group, icon, input-group, menu, multi-select, progress-bar, slider, spinner,
  tag-input, tag, text-area, toast, tooltip. `segmented-control` narrows via
  `Extract<Intent, "none" | "primary">`; `numeric-input` already aliased `InputGroupIntent` (transitively
  `Intent`). Import added right after the existing `cn` import in each.

### P2.4 — string-name icon props
- **`src/components/ui/icon.tsx`** — added:
  - `export type IconProp = IconName | React.ReactElement | false | null;` — **note** it is
    `ReactElement`, not `ReactNode`: `ReactNode` already includes `string`, so `IconName | ReactNode`
    collapses to `ReactNode` and loses `IconName` autocomplete. This mirrors Blueprint's
    `IconName | MaybeElement`. `false`/`null` keep `cond && <Icon/>` and explicit suppression valid.
  - `export function resolveIcon(icon, iconProps?)` — `typeof icon === "string" ? <Icon icon={icon} {...iconProps}/> : icon`.
    Hosts pass `iconProps` to control the string case's size/color.
- **Wired into 8 components**, each with host-appropriate `iconProps`:
  - **button / anchor-button** — `{ className: "!text-current" }` so the glyph inherits the button's text
    color (Icon defaults to `text-foreground`, which would override it — see the *Icon currentColor override*
    memory). Size handled by the existing `[&_svg]:size-4/5`. Button's `iconOnly` square detection now keys
    on the resolved nodes (`!!iconNode`).
  - **callout** — unified the default-intent-icon path with the string path:
    `resolveIcon(iconProp ?? DEFAULT_INTENT_ICONS[intent], { size:16, className: ICON_COLOR[intent], … })`.
    `icon="info-sign"` now renders the blue glyph instead of literal text. Removed a dead `typeof … "props" in`
    ternary in the render.
  - **dialog / drawer** — plain `resolveIcon(icon)` (header icons stay default-foreground, matching the prior
    element behavior — keeps the clean compare).
  - **tag** — `{ className: "!text-current" }`, default **16px** (Blueprint's `Tag` renders `<Icon icon={icon}/>`
    with no size → 16; confirmed in `packages/core/src/components/tag/tag.tsx`). The existing `size={12}`
    specimens pass a custom element and are unchanged.
  - **segmented-control** — `{ className: "!text-current" }`; size via existing `[&_svg]:size-4`.
  - **alert** — already accepted `string | ReactNode`; upgraded its type to `IconProp` for autocomplete and
    dropped the now-redundant `as` cast; `hasIcon` excludes `false`.

### Galleries (verification)
- **button** "With icons" — mithril converted to the string API (`icon="add"`, `endIcon="share"`, …),
  matching the reference's existing idiom and dropping the `<Icon className="!text-current">` boilerplate.
  Added `data-compare="btn-icon-only"` (both galleries) on the icon-only button.
- **tag** — added `data-compare="tag-icon-string"` specimen (`<Tag icon="tick">`) on both sides to exercise
  the 16px string path (distinct from the 12px element specimens).

## Current state (verified)

- `pnpm build` ✓ · `pnpm test` **240 pass** (29 files) · `pnpm typecheck` ✓.
- `compare.sh` computed-style **clean (0 differ), both themes** for every touched component:
  button (19), callout (8), tag (15), segmented-control (7), dialog (5), drawer (4).
- New string specimens verified: `btn-icon-only` renders **30×30** (string-rendered icon-only button
  collapses to the square min-width exactly like Blueprint); `tag-icon-string` **100×20** at 16px — both
  `0 differ` in both themes.
- `registry.json` regenerated: 63 items (+`types`). button/anchor-button/segmented-control correctly gained
  an `icon` registry dependency (they render `<Icon>` for the string case now).
- Working tree changes are this loop's only; New deps: **none**.

## Accepted residual deltas (documented)

- **String-icon SSIM ~0.86–0.96** on the new specimens is the same sub-perceptual glyph anti-aliasing /
  centering delta already documented for close buttons (handoff 0078). Computed-style is `0 differ`; sizes
  match exactly. Not a regression.
- The pre-existing per-Button **font-glyph-advance** low-SSIM specimens (e.g. `btn-size-medium` ~0.60) are
  unchanged — still the documented `fontFamily`-omitted-by-design drift.

## Notes / decisions for the next session

- **`IconProp` is `ReactElement`, not `ReactNode`** — deliberate, to preserve `IconName` autocomplete. If a
  future call site needs to pass a fragment/array/number as an "icon", it won't type-check (correct for an
  icon slot). Document if anyone hits it.
- **Making `icon="…"` work couples a component to the icon glyph map.** button/anchor-button/segmented-control
  did not previously import `Icon`; they do now (the 706-glyph map has no tree-shaking — see CLAUDE.md /
  *icons-full-port* memory). Acceptable: it's the whole point of the convenience, and owners trim glyphs.
  This is also why P2.2 (icon tree-shaking) is worth doing.
- The element path is untouched, so this is safe to ship; the galleries now showcase the cleaner string API.

## Next steps (unchanged priorities from 0078)

1. **★ P2.1 — make the install path work + add CI.** Still the headline public-readiness gap: `registry.json`
   is generated but never *served* (deploy workflow only publishes the gallery `dist`), and there's no CI
   gate. Now is a good time — the registry generator just grew a `types` item, so a **registry-drift guard**
   (`node tools/gen-registry.mjs && git diff --exit-code registry.json`) in CI would have value immediately.
2. **P1.3 — promote infra** (ResizeSensor, OverflowList, Portal).
3. **P1.1 — the data grid** (`DataTable`) — the big multi-loop feature lever.

## How to resume

```bash
cd /Users/bbatchelder/Code/mithril
git switch public-readiness && git pull
pnpm test         # 240 pass
pnpm build        # green
# P2.3/P2.4 are done. For P2.1, inspect:
#   .github/workflows/deploy.yml   (publishes dist only — add registry + CI)
#   tools/gen-registry.mjs         (wire `git diff --exit-code registry.json` as a drift guard)
#   README.md                      (the ⚠️ "registry not yet served" section)
```

- Components touched: `icon.tsx` (+`resolveIcon`/`IconProp`), button, anchor-button, callout, dialog, drawer,
  tag, segmented-control, alert + the 18 `*Intent` aliases; new `src/lib/types.ts`; `tools/gen-registry.mjs`;
  galleries `src/App.tsx` + `tools/blueprint-reference/src/App.tsx`; `registry.json`; roadmap.
- New deps: **none**.
