# 0015 — Radio / RadioGroup (Phase 2 #4)

- **Date:** 2026-05-25
- **Focus:** Build Radio and RadioGroup components to Blueprint v6.15 fidelity; Phase 2 #4 form control
- **Branch / commit:** phase-2-forms @ (see commit SHA)

## Summary

Built `src/components/ui/radio.tsx` exporting both `Radio` and `RadioGroup` with clean modern APIs. Radio reuses the same structural approach as Checkbox (not ControlBase, but identical inline rendering for fine-grained class control). RadioGroup supports both `options` array and React children patterns, wiring `name`, `checked`, `onChange`, and `disabled` to child Radios. Registered in both galleries with 6 matching `data-compare` specimens on the indicator span. Comparison result: **6 match · 0 differ** in both light and dark themes on first clean run (after fixing two initial issues: `rounded-full` emitting huge pixel value instead of `50%`, and missing `text-white` color on checked indicator).

## Current state

- **Radio / RadioGroup:** Fully implemented and verified — `tools/compare.sh radio both` → 6/6 match both themes.
- **Checkbox regression:** `tools/compare.sh checkbox both` → 6/6 match both themes (no regression).
- **control-base.tsx:** NOT modified — Radio renders inline like Checkbox, control-base remains available for Switch.
- **Build:** `pnpm build` green (tsc + vite), blueprint-reference typecheck green.
- **Phase 2 progress:** Radio/RadioGroup checked in ROADMAP.md; 4/12 Phase 2 components done.

## Decisions made (and why)

- **Inline rendering (not ControlBase)** — Checkbox renders all classes inline for fine-grained control. Radio follows the same pattern for identical reasons: the indicator classes differ conditionally based on `effectiveChecked`/`disabled`, which is simplest to manage inline. ControlBase is still available for Switch if it fits there.

- **`[border-radius:50%]` not `rounded-full`** — Tailwind v4's `rounded-full` emits `border-radius: calc(infinity * 1px)`, which Chrome computes to `33554432px`. Blueprint's SCSS uses `border-radius: 50%`, which getComputedStyle returns as the literal string `"50%"`. The harness does string comparison, so these differ. Using `[border-radius:50%]` (Tailwind arbitrary value) emits the literal `50%`, matching Blueprint's computed value.

- **Center dot via `bg-[radial-gradient(white,white_28%,transparent_32%)]`** — Blueprint implements the checked radio glyph via `input:checked ~ .bp6-control-indicator::before { background-image: radial-gradient($white, $white 28%, transparent 32%) }`. We can't use `::before` on a Tailwind span without arbitrary CSS, so we use an absolutely-positioned `<span>` inside the indicator with the same gradient. Visually identical; the harness doesn't capture `backgroundImage` so no diff impact.

- **`text-white` / `text-white/60` on checked indicator** — Blueprint sets `color: $white` on the indicator when checked (so SVG fill inherits white via `currentcolor`), and `rgba($white, 0.6)` when disabled+checked. Radio must match this or the `color` property diff will fail. Missed on first pass; caught in the first compare.sh run.

- **React state for effectiveChecked** — Same rationale as Checkbox: `peer-checked:` Tailwind variants only work on siblings of the peer, not descendants. The dot is inside the indicator, so we track checked state in React. Works for both controlled (via `isControlled` check) and uncontrolled (via `onChange` handler).

- **RadioGroup `onChange` signature** — Our analyst API uses `(value: string, event)` for convenience (caller doesn't need `e.currentTarget.value`). Blueprint uses `(event: React.ChangeEvent<HTMLInputElement>)`. This is a deliberate API modernization: cleaner ergonomics, not drop-in compatible.

- **RadioGroup with children uses `cloneElement`** — Same approach as Blueprint's RadioGroup source. We inject `name`, `checked`, `onChange`, and `disabled` into child Radio elements via `cloneElement`. This is the idiomatic pattern for this type of group.

## Gotchas / things to know

- **`rounded-full` vs `border-radius: 50%`** — This is the critical radio-specific trap. Tailwind v4's `rounded-full` is `calc(infinity * 1px)` → huge computed pixel value. Always use `[border-radius:50%]` for radio circles so the harness string comparison matches Blueprint's `50%`. Do NOT use `rounded-full` here.

- **Harness compares borderRadius as string** — The harness does NOT convert borderRadius through canvas (it's not a color). It compares `getComputedStyle(el).borderRadius` directly. This means `"9999px"`, `"3.35544e+07px"`, and `"50%"` are all DIFFERENT strings even if visually equivalent.

- **Same color gotchas as Checkbox apply** — `rgba($black, 0.2)` = `rgba(17,20,24,0.2)` (use exact Blueprint black); dark checked shadow = `rgba(255,255,255,0.1)`; dark disabled needs explicit `dark:shadow-none` to override `dark:shadow-[...]`.

- **No indeterminate state for Radio** — Radio never has indeterminate. Do not add it.

- **Blueprint RadioGroup `name` is optional** — Blueprint auto-generates a unique name if omitted. Our analyst RadioGroup requires `name` (explicit is cleaner for a modern API).

## Next steps

> Phase 2 continues. Next: Switch.

1. **Switch** — `src/components/ui/switch.tsx`. Blueprint source: `packages/core/src/components/forms/controls.tsx` (the `.bp6-switch` section of `_controls.scss`). Same Control structure but indicator is a pill/toggle. Key dimensions: `$switch-width: 1.75em`, unchecked bg `rgba(gray3, 0.3)`, checked bg `primary`. The toggle knob is a `::before` circle that slides left→right. ControlBase might be useful here as a starting point since the outer label/input structure is identical. Register in both galleries; `data-compare` on the indicator span or the knob depending on what the harness should diff.

## How to resume

```bash
# Both servers
pnpm dev                                              # :5173
cd tools/blueprint-reference && pnpm dev              # :5174

# Verification
tools/compare.sh radio both
tools/compare.sh checkbox both   # regression check

# Check Phase 2 progress
grep -A 15 "Phase 2" docs/ROADMAP.md
```

- Relevant files:
  - `src/components/ui/radio.tsx` (new)
  - `src/App.tsx` (RadioGallery + COMPONENTS entry)
  - `tools/blueprint-reference/src/App.tsx` (RadioGallery + COMPONENTS entry)
  - `docs/ROADMAP.md` (Radio/RadioGroup checked)
- Open questions for the user: None — Radio/RadioGroup complete; next is Switch.
