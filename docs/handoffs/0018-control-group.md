# 0018 — ControlGroup (Phase 2 #7)

- **Date:** 2026-05-25
- **Focus:** Build ControlGroup component to Blueprint v6.15 fidelity; Phase 2 #7 form controls
- **Branch / commit:** phase-2-forms @ (see commit SHA)

## Summary

Built `src/components/ui/control-group.tsx` — a flex container for composing form controls
(inputs, buttons, selects) flush in a horizontal row or vertical column. Registered in both
galleries with 4 matching `data-compare` specimens. Comparison result: **4 match · 0 differ**
in both light and dark themes.

Also updated `tools/comparison/capture-styles.js` to support selective flex-layout property
capture via `data-compare-flex` attribute — avoids false regressions on other component
indicators while still diffing `display/flexDirection/alignItems/flexGrow` for ControlGroup.

Added `text-foreground` to `src/App.tsx`'s content container div so dark mode text color
propagates correctly to all child elements (including pure layout containers like ControlGroup).

## Current state

- **ControlGroup:** Fully implemented and verified — `tools/compare.sh control-group both` → 4/4 match both themes.
- **Regressions:** None. form-group 7/7, switch 6/6, checkbox 6/6 all clean.
- **Build:** `pnpm build` green (tsc + vite); blueprint-reference `tsc --noEmit` green.
- **Phase 2 progress:** ControlGroup checked in ROADMAP.md; 7/12 Phase 2 components done.

## API

```tsx
<ControlGroup vertical={false} fill={false} className="..." ref={...}>
  <InputGroup placeholder="Search…" />
  <Button>Go</Button>
</ControlGroup>
```

Props: `vertical?: boolean` (default false — row layout), `fill?: boolean` (default false — children flex-grow to fill), `className?`, `children`, `ref` (forwarded to the `<div role="group">`), all standard HTML div attributes.

- Children opt out of `fill` expansion via the `data-fixed` attribute (`[&>*:not([data-fixed])]:flex-1` selector).
- The component itself is a pure layout container with no color semantics — children handle their own colors.

## Decisions made (and why)

### Z-index stacking approach

Blueprint's `$control-group-stack` defines 18 levels. We map them to integer z-index values via
literal Tailwind utility classes `z-[1]` through `z-[10]` to ensure tree-shaking:

| Level | Blueprint name       | Our z-index | Applied to                     |
|-------|---------------------|-------------|-------------------------------|
| 1     | input-disabled      | z-[1]       | `input:disabled`              |
| 2     | input-default       | z-[2]       | `input` (resting)             |
| 3     | button-disabled     | z-[3]       | `button:disabled`             |
| 4     | button-default      | z-[4]       | `button` (resting)            |
| 5     | button-focus/hover/active | z-[5] | `button:focus/hover/active`   |
| 6     | intent-button-*     | (not yet targeted specifically) |
| 7     | intent-input-default | z-[7]      | (intent inputs via class; not auto-detected) |
| 8     | input-focus         | z-[8]       | `input:focus`                 |
| 9     | intent-input-focus  | z-[9]       | (intent input focus; not separately targeted) |
| 10    | input-group-children | z-[10]     | `.input-group-slot` spans     |

Key invariant: a focused or intent child renders ABOVE its neighbors so its focus ring isn't clipped.
The discrete integer values don't need to match Blueprint's internal SCSS list indices exactly.

NOTE: Intent detection via `[class*="bp6-intent"]` CSS selector is not available in our
Tailwind-based system. Intent stacking (levels 6-9) relies on the focus/active states lifting
the element anyway. A future enhancement could be to expose a `data-intent` prop and target
`[data-intent]:z-[7]`.

### Child spacing: margin not gap

Blueprint uses `margin-right: $pt-spacing * 0.5 = 2px` (not CSS `gap`) between children. We
match this with `[&>*:not(:last-child)]:mr-0.5` (Tailwind `mr-0.5` = 2px). Using margin (not
gap) is important because `gap` would visually separate the controls, making the flush-joined
look impossible.

### `data-compare-flex` extension to capture-styles.js

The harness's global PROPS list captures common visual properties. Adding `display`,
`flexDirection`, `alignItems`, `flexGrow` globally caused false regressions in Checkbox (which
uses `display:flex` internally vs Blueprint's `inline-block` — same appearance, different
structure). Solution: added a separate `FLEX_PROPS` array in capture-styles.js that is only
captured for elements tagged with `data-compare-flex` attribute. ControlGroup specimens carry
both `data-compare` (for diff keying) and `data-compare-flex` (to opt into layout capture).

### `text-foreground` on App.tsx content container

The App.tsx content wrapper `div.min-h-screen.bg-background` lacked `text-foreground`. In dark
mode, pure layout containers (no text color class) were inheriting the browser default black
(`rgb(28, 33, 39)`) instead of the dark theme foreground (`rgb(246, 247, 249)`). Fixed by adding
`text-foreground` to the wrapper, which is the correct baseline for all content.

## Gotchas / things to know

- **ControlGroup is purely layout** — no colors, borders, or visual chrome of its own. All
  visual fidelity comes from the child components (InputGroup, Button) rendering correctly.

- **`[&_.input-group-slot]:z-[10]` requires the InputGroup to expose a stable class** — 
  our InputGroup's absolute-positioned slot spans don't currently have this class. The z-index
  rule was added preemptively but won't fire until InputGroup adds `input-group-slot` to those
  spans. For now the visual result is still correct (slots render above their input because
  they're absolutely positioned within the input's stacking context).

- **Fill child opt-out via `data-fixed`** — if a child should NOT expand when `fill` is true,
  add `data-fixed` to that child. The group applies `flex:1 1 auto` to all children not bearing
  `data-fixed`.

- **`vertical` + `fill` stacks with full-width children** — children get `flex:1 1 auto` which
  means in vertical mode each child stretches to the full cross-axis width. This matches
  Blueprint's behavior.

## compare.sh results

```
control-group · light:  4 match · 0 differ
control-group · dark:   4 match · 0 differ
```

Specimens: `cg-horizontal`, `cg-vertical`, `cg-fill`, `cg-fill-child`.

Captured properties include: `display`, `flexDirection`, `alignItems`, `flexGrow` (via
`data-compare-flex`), plus standard `height`, `marginRight`, `marginBottom`, `color`, etc.

### Regression checks (prior components unaffected)

```
form-group · light:  7 match · 0 differ
form-group · dark:   7 match · 0 differ
switch · light:      6 match · 0 differ
switch · dark:       6 match · 0 differ
checkbox · light:    6 match · 0 differ
checkbox · dark:     6 match · 0 differ
```

## Accepted deltas

None — exact match in both themes.

## Next steps

> Phase 2 continues. Next: **HTMLSelect**.

1. **HTMLSelect** — `src/components/ui/html-select.tsx`. Blueprint: `.bp6-html-select` wrapper
   around a native `<select>` element with a caret icon overlay. Supports intents, fill, and
   large/minimal variants. Blueprint source: `packages/core/src/components/html-select/`.

## How to resume

```bash
# Both servers
pnpm dev                                              # :5173
cd tools/blueprint-reference && pnpm dev              # :5174

# Verification
tools/compare.sh control-group both
tools/compare.sh form-group both     # regression check
tools/compare.sh switch both         # regression check
tools/compare.sh checkbox both       # regression check

# Check Phase 2 progress
grep -A 15 "Phase 2" docs/ROADMAP.md
```

- Relevant files:
  - `src/components/ui/control-group.tsx` (new — ControlGroup component)
  - `src/App.tsx` (ControlGroupGallery + COMPONENTS entry + text-foreground fix)
  - `tools/blueprint-reference/src/App.tsx` (ControlGroupGallery + COMPONENTS entry + ControlGroup import)
  - `tools/comparison/capture-styles.js` (FLEX_PROPS + data-compare-flex selective capture)
  - `docs/ROADMAP.md` (ControlGroup checked)
- Open questions for the user: None — ControlGroup complete; next is HTMLSelect.
