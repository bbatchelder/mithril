# 0017 — Label + FormGroup (Phase 2 #6)

- **Date:** 2026-05-25
- **Focus:** Build Label and FormGroup components to Blueprint v6.15 fidelity; Phase 2 #6 form controls
- **Branch / commit:** phase-2-forms @ (see commit SHA)

## Summary

Built `src/components/ui/form-group.tsx` exporting both **`Label`** and **`FormGroup`** with a clean modern API. Both components are implemented inline (no external primitives needed). Registered in both galleries with 7 matching `data-compare` specimens. Comparison result: **7 match · 0 differ** in both light and dark themes.

## Current state

- **Label + FormGroup:** Fully implemented and verified — `tools/compare.sh form-group both` → 7/7 match both themes.
- **Switch regression:** `tools/compare.sh switch both` → 6/6 match both themes (no regression).
- **Checkbox regression:** `tools/compare.sh checkbox both` → 6/6 match both themes (no regression).
- **Build:** `pnpm build` green (tsc + vite); blueprint-reference `tsc --noEmit` green.
- **Phase 2 progress:** Label+FormGroup checked in ROADMAP.md; 6/12 Phase 2 components done.

## API

### Label

```tsx
<Label htmlFor="id" info="(optional)" disabled>Label text</Label>
```

Props: `info?: ReactNode` (muted secondary), `disabled?: boolean`, all standard `<label>` HTML attrs. Renders as `<label>` element. Standalone margin-bottom is 16px.

### FormGroup

```tsx
<FormGroup
  label="Field name"
  labelFor="input-id"
  labelInfo="(required)"
  subLabel="Additional hint"
  helperText="Validation message"
  intent="danger"
  inline={false}
  large={false}
  fill={false}
  disabled={false}
  contentClassName="..."
>
  <InputGroup id="input-id" />
</FormGroup>
```

Props: `label?`, `labelFor?`, `labelInfo?`, `subLabel?`, `helperText?`, `intent?` (none/primary/success/warning/danger), `inline?`, `large?`, `fill?`, `disabled?`, `contentClassName?`, `children`, `className`, `ref`.

## Decisions made (and why)

- **Single file `form-group.tsx` exports both** — Label and FormGroup are tightly related (in-group label has different margin). Keeping them together makes the margin-difference obvious and avoids a separate import.

- **Standalone Label: margin-bottom 16px; in-group label: margin-bottom 4px** — Blueprint's `_label.scss` sets `label.bp6-label { margin-bottom: $pt-spacing * 4 = 16px }` for standalone, and `_form-group.scss` overrides: `label.bp6-label { margin-bottom: $pt-spacing = 4px }` inside `.bp6-form-group`. We replicate this by rendering the FormGroup's internal label element directly (not reusing the Label component), so the margin-bottom can be 4px without inheritance issues.

- **Intent text colors via palette tier utilities, not `--intent-*-text` tokens** — Blueprint's `$pt-dark-intent-text-colors` maps to `blue5/green5/orange5/red5` (palette tier -5 raw values). The `--intent-*-text` tokens in dark mode use `color-mix()` which computes to slightly different values. Following the decision from Callout (handoff 0011): use `text-blue-2 dark:text-blue-5` etc. to hit exact pixel-perfect palette values.

- **No margin-left on info span** — Blueprint's formGroup.tsx uses `{label} <span className="bp6-text-muted">{labelInfo}</span>` with a space character for visual separation, no CSS margin. We use `{" "}{info}` with no `margin-left` to match exactly. This was caught in the first compare run where `fg-label-info` had `marginLeft: 4px vs 0px`.

- **`min-w-0` on helper text div** — Blueprint's `.bp6-form-helper-text` is inside `.bp6-form-content` which is itself a flex child. Chrome computes `min-width: 0px` for this nested structure. Our helper text is inside `div.flex.flex-col` (content wrapper), so we add `min-w-0` explicitly. The sub-label div does NOT need `min-w-0` since Blueprint's direct-flex-child sub-label also reports `auto`.

- **`fg-inner-sublabel` and `fg-inner-helper` CSS class hooks** — Added as stable selectors on the sub-label and helper text divs so the `TaggedFormGroup` wrapper in the gallery can use `querySelector` to attach `data-compare` without prop drilling. These class names are harmless in production (Tailwind doesn't tree-shake arbitrary class names that don't match any Tailwind utility).

- **Blueprint's FormGroup is a plain FC (no ref)** — The blueprint reference's `TaggedFormGroup` wraps FormGroup in a `<div ref={...}>` to get DOM access. This matches the pattern used by `TaggedSwitch` and similar helpers in the reference gallery.

## Gotchas / things to know

- **Standalone vs in-group label margin** — The key design decision: FormGroup renders its own `<label>` with `mb-[4px]`, NOT the exported Label component. This avoids CSS specificity fights and is explicit.

- **`minWidth: auto vs 0px` depends on nesting depth** — Elements that are DIRECT flex children of our form-group get `min-width: auto` (matches Blueprint). Elements that are GRANDCHILDREN (inside the content wrapper which is also flex) need explicit `min-w-0` to match Blueprint's `0px` value. This is a Chrome flex algorithm subtlety.

- **intent colors use palette tier, not --intent-*-text** — Consistent with Callout. The `--intent-*-text` tokens were designed for minimal/outlined button text (slightly different hues), not for the raw Blueprint intent text color.

- **Blueprint's Label from @blueprintjs/core is from html.js, not forms** — `Label` exported from `@blueprintjs/core` is `htmlElement("label", "bp6-label")` — a styled forwardRef label, NOT a dedicated forms component. FormGroup renders its own internal label. The standalone Label in our system corresponds to both.

- **No fg-label-disabled-info on blueprint side** — Initially added `data-compare="fg-label-disabled-info"` to blueprint reference but not analyst-ui, causing a "only in blueprint" diff. Fixed by removing it from the reference (disabled label info doesn't need its own specimen since `fg-disabled` covers the disabled color case via the helper text).

## compare.sh results

```
form-group · light:  7 match · 0 differ
form-group · dark:   7 match · 0 differ
```

Specimens: `fg-label`, `fg-label-info`, `fg-basic`, `fg-sublabel`, `fg-intent-danger`, `fg-inline`, `fg-disabled`.

## Accepted deltas

None — exact match in both themes.

## Next steps

> Phase 2 continues. Next: **ControlGroup**.

1. **ControlGroup** — `src/components/ui/control-group.tsx`. Blueprint: `.bp6-control-group` wrapper that displays controls horizontally with joined borders (no gap between them, inner elements share borders). Supports `fill` (make controls stretch) and `vertical` (column layout). Blueprint source: `packages/core/src/components/forms/controlGroup.tsx`, `packages/core/src/components/forms/_control-group.scss`.

## How to resume

```bash
# Both servers
pnpm dev                                              # :5173
cd tools/blueprint-reference && pnpm dev              # :5174

# Verification
tools/compare.sh form-group both
tools/compare.sh switch both     # regression check
tools/compare.sh checkbox both   # regression check

# Check Phase 2 progress
grep -A 15 "Phase 2" docs/ROADMAP.md
```

- Relevant files:
  - `src/components/ui/form-group.tsx` (new — exports Label + FormGroup)
  - `src/App.tsx` (FormGroupGallery + COMPONENTS entry + useRef/useEffect imports)
  - `tools/blueprint-reference/src/App.tsx` (FormGroupGallery + COMPONENTS entry + FormGroup/Label imports)
  - `docs/ROADMAP.md` (Label+FormGroup checked)
- Open questions for the user: None — Label+FormGroup complete; next is ControlGroup.
