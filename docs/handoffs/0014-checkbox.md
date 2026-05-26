# 0014 — Checkbox (Phase 2 #3)

- **Date:** 2026-05-25
- **Focus:** Build Checkbox component to Blueprint v6.15 fidelity; Phase 2 #3 form control
- **Branch / commit:** phase-2-forms @ (see commit SHA)

## Summary

Built `src/components/ui/checkbox.tsx` with clean modern API supporting `checked`/`defaultChecked`, `indeterminate`, `disabled`, `label`, `large`, `inline`, `alignIndicator`, and all native input props. Added `small-tick` and `small-minus` icon paths to `src/components/ui/icons/index.ts`. Created `src/components/ui/control-base.tsx` as a shared ControlBase primitive for Radio and Switch reuse. Registered Checkbox in both galleries with 6 matching `data-compare` specimens on the indicator span. Comparison result: **6 match · 0 differ** in both light and dark themes on the first-clean run.

## Current state

- **Checkbox:** Fully implemented and verified — `tools/compare.sh checkbox both` → 6/6 match both themes.
- **ControlBase:** Created `src/components/ui/control-base.tsx` — shared label+input+indicator structure for Radio (#4) and Switch (#5). Not yet used by Checkbox itself (Checkbox renders inline for clarity), but ready for Radio to consume.
- **Icons added:** `small-tick` and `small-minus` (16px and 20px paths) vendored from Blueprint icons package.
- **Build:** `pnpm build` green (tsc + vite).
- **Phase 2 progress:** Checkbox checked in ROADMAP.md; 3/12 Phase 2 components done.

## Decisions made (and why)

- **React state for icon visibility** — Blueprint drives tick/dash glyph visibility via `input:checked ~ .bp6-control-indicator::before { background-image: ... }` CSS sibling selectors. In Tailwind, `peer-checked:` works on siblings of the peer input, but NOT on descendants of those siblings. Since the icons live INSIDE the indicator span, `peer-checked:` can't reach them. Solution: track `effectiveChecked` in React state (synced for controlled mode via `useEffect`, updated for uncontrolled mode via `onChange`). Then conditionally apply `opacity-100` / `opacity-0` classes to the icon spans. This is reliable, works for controlled + uncontrolled, and produces identical visual output.

- **Indicator background/shadow use explicit Tailwind classes (not peer-*)** — Same rationale: since we track `isActive = effectiveChecked || !!indeterminate` in React, we can apply the checked/indeterminate bg+shadow classes conditionally. This means hover/active classes are also conditioned on `isActive` (hover checked → `group-hover:bg-primary-hover` vs hover unchecked → `group-hover:bg-[rgba(143,153,168,0.15)]`). This is clean and avoids complex CSS specificity fights.

- **`font-size: 16px/20px` on the indicator** — Blueprint uses `font-size: $control-indicator-size` (16px default / 20px large) on the indicator span and em-based `width/height: 1em` sizing. The harness captures `fontSize` as a diffed property. I set `text-[16px]` and `text-[20px]` on the indicator to match (even though we use explicit `w-4/h-4` or `w-5/h-5` for sizing). This is required to pass the harness — not a visual difference.

- **`color: white` on indicator when active** — Blueprint sets `color: $white` on the checked indicator (so SVG fill inherits white via `currentcolor`), and `color: rgba($white, 0.6)` when disabled+checked. I apply `text-white` when `isActive && !disabled` and `text-white/60` when `isActive && disabled`. This matches Blueprint exactly.

- **Checked box-shadow uses `rgba(17,20,24,0.2)` not `rgba(0,0,0,0.2)`** — Blueprint's `$black = #111418 = rgb(17,20,24)`. The harness normalizes via canvas and the tolerance is ±3/channel; pure black `rgb(0,0,0)` would differ by 17 channels and fail. Using the exact Blueprint `$black` value passes cleanly.

- **Dark disabled shadow uses `dark:shadow-none` explicitly** — The dark unchecked indicator has `dark:shadow-[inset_0_0_0_1px_#8f99a8]`. When disabled, `shadow-none` alone doesn't override it. Adding `dark:shadow-none` explicitly removes the shadow in dark theme for disabled states.

- **`indicatorProps` prop for harness data-compare** — The `data-compare` key needs to be on the indicator span (not the label), but the harness can't reach inside a component without a mechanism. Added `indicatorProps?: React.HTMLAttributes<HTMLSpanElement>` to the API, spread onto the indicator span. Blueprint reference side uses the `ref.current.querySelector(".bp6-control-indicator").setAttribute(...)` pattern (same as TaggedSpinner/Tag).

- **Separate ControlBase module** — `src/components/ui/control-base.tsx` exports `ControlBase` (a headless label + hidden input + indicator primitive). Checkbox does NOT use it directly (it renders inline for clarity and fine-grained control). Radio and Switch will use ControlBase — they share the identical label/input/indicator DOM pattern and differ only in indicator shape (50% radius for Radio, pill+toggle for Switch) and glyph.

- **`group` on the label** — The label (`<label>`) is the hover/active target (cursor covers the whole row). Using Tailwind's `group` on the label and `group-hover:` / `group-active:` on the indicator drives the background transitions without any JavaScript, matching Blueprint's `.bp6-control:hover .bp6-control-indicator { background-color: ... }` rule.

## Gotchas / things to know

- **`peer-*` only reaches siblings, not descendants** — Tailwind's `peer-checked:` generates `.peer:checked ~ .peer-checked\:foo`. The `~` combinator only applies to siblings. Elements INSIDE a sibling cannot use `peer-*`. This is why we use React state instead of pure CSS for icon visibility and indicator bg/shadow.

- **Blueprint's indicator `font-size` is structural, not typographic** — It's purely used to get `width/height: 1em = indicatorSize`. We don't use em-based sizing, but we must emit the correct `font-size` on the element so the harness comparison passes.

- **Dark disabled unchecked still has a dark-mode shadow** — The base `dark:shadow-[inset_0_0_0_1px_#8f99a8]` class is always present in the class list. To override it when disabled, you MUST add `dark:shadow-none` explicitly — a plain `shadow-none` won't override the dark variant.

- **Box-shadow alpha color must match Blueprint's `$black`** — Blueprint's `rgba($black, 0.2) = rgba(#111418, 0.2) = rgba(17,20,24,0.2)`. The harness color tolerance is ±3/channel. Using `rgba(0,0,0,0.2)` (pure black) would differ by 17 in the R channel and fail. Always use the exact Blueprint `$black` value.

- **Canvas rounding of `rgba(255,255,255,0.1)`** — In dark theme, the checked shadow is `rgba(255,255,255,0.1)`. Canvas renders this as `rgba(255,255,255,0.102)` (float rounding) on the analyst side and similarly on Blueprint. Both are within the ±0.06 alpha tolerance.

## Next steps

> Phase 2 continues. Next: Radio / RadioGroup.

1. **Radio / RadioGroup** — `src/components/ui/radio.tsx` + `src/components/ui/radio-group.tsx`. Blueprint source: `packages/core/src/components/forms/controls.tsx` + `_controls.scss`. Uses the same ControlBase structure as Checkbox, but indicator border-radius = 50% (circle) and checked glyph = radial-gradient dot (`background-image: radial-gradient($white, $white 28%, transparent 32%)`). RadioGroup wraps Radio items in a `<div>` with `display:flex; flex-direction:column` (or row for inline). Register in both galleries with `data-compare` on the indicator span.

## How to resume

```bash
# Both servers
pnpm dev                                              # :5173
cd tools/blueprint-reference && pnpm dev              # :5174

# Verification
tools/compare.sh checkbox both
tools/compare.sh text-area both     # regression check
tools/compare.sh input-group both   # regression check

# Check Phase 2 progress
grep -A 15 "Phase 2" docs/ROADMAP.md
```

- Relevant files:
  - `src/components/ui/checkbox.tsx` (new)
  - `src/components/ui/control-base.tsx` (new — shared base for Radio/Switch)
  - `src/components/ui/icons/index.ts` (added small-tick, small-minus)
  - `src/App.tsx` (CheckboxGallery + COMPONENTS entry)
  - `tools/blueprint-reference/src/App.tsx` (CheckboxGallery + COMPONENTS entry)
  - `docs/ROADMAP.md` (Checkbox checked)
- Open questions for the user: None — Checkbox complete; next is Radio / RadioGroup.
