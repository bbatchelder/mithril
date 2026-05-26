# 0016 — Switch (Phase 2 #5)

- **Date:** 2026-05-25
- **Focus:** Build Switch component to Blueprint v6.15 fidelity; Phase 2 #5 form control
- **Branch / commit:** phase-2-forms @ (see commit SHA)

## Summary

Built `src/components/ui/switch.tsx` exporting `Switch` with a clean modern API. Switch follows the same inline rendering pattern as Checkbox and Radio (not ControlBase) for fine-grained class control. The pill track is a `<span>` with em-based sizing (font-size: 16/20px), and the sliding knob is a child `<span>` positioned absolutely inside the track — matching Blueprint's `::before` approach visually without arbitrary CSS. Inner labels (`innerLabel` / `innerLabelChecked`) are implemented as absolutely-positioned spans inside the track that toggle visibility. Registered in both galleries with 6 matching `data-compare` specimens on the track span. Comparison result: **6 match · 0 differ** in both light and dark themes on the second run (first run had 1 delta: dark mode disabled-checked text color was `text-white/60` when it should be `text-foreground-disabled`; fixed with `dark:text-foreground-disabled` override).

## Current state

- **Switch:** Fully implemented and verified — `tools/compare.sh switch both` → 6/6 match both themes.
- **Checkbox regression:** `tools/compare.sh checkbox both` → 6/6 match both themes (no regression).
- **Radio regression:** `tools/compare.sh radio both` → 6/6 match both themes (no regression).
- **control-base.tsx:** NOT modified — Switch renders inline like Checkbox/Radio.
- **Build:** `pnpm build` green (tsc + vite); blueprint-reference `tsc --noEmit` green.
- **Phase 2 progress:** Switch checked in ROADMAP.md; 5/12 Phase 2 components done.

## Decisions made (and why)

- **Inline rendering (not ControlBase)** — Checkbox and Radio both render all classes inline for fine-grained conditional control. Switch follows the same pattern. ControlBase is available but the indicator is switch-specific (pill + knob) so inlining is cleaner and avoids awkward slot composition.

- **`[border-radius:28px]` / `[border-radius:35px]` not `rounded-full`** — Blueprint's `border-radius: $switch-width` = `1.75em` at 16px = 28px, at 20px = 35px. Tailwind v4's `rounded-full` emits `border-radius: calc(infinity * 1px)` which Chrome computes to `33554432px`. The harness does string comparison so these differ. Using literal px values matches Blueprint's computed `getComputedStyle` output exactly.

- **Knob as child `<span>` (not `::before`)** — Blueprint implements the knob as `.bp6-control-indicator::before`. We can't use `::before` on a Tailwind-styled span without arbitrary CSS injection. A child `<span>` with `position: absolute; top: 50%; translateY(-50%); left: 2px / calc(2px + 100% - 1em)` is visually identical. The harness does not capture `::before` styles so no diff impact.

- **Padding = 36px (standard) / 43px (large)** — Blueprint's `indicator-position` mixin for switch: `indicator-position(1.75 * 16px) = indicator-position(28px)`, padding = `28px + $control-indicator-spacing` = `28px + 8px = 36px`. Large: `1.75 * 20px = 35px + 8px = 43px`. Using `pl-[36px]` / `pl-[43px]` (arbitrary values) since no standard Tailwind utility exists for these exact values.

- **Knob size: 12px standard / 16px large** — `$switch-indicator-size = 1em - 2 * $switch-indicator-margin`. `$switch-indicator-margin = $pt-spacing * 0.5 = 4px * 0.5 = 2px`. So knob = `16px - 4px = 12px` (std) / `20px - 4px = 16px` (large). Using `w-3 h-3` (12px) and `w-4 h-4` (16px).

- **Dark mode disabled-checked text** — Light mode: `$switch-checked-text-color-disabled = rgba($white, 0.6)` → `text-white/60`. Dark mode: `$dark-switch-checked-text-color-disabled = $pt-dark-text-color-disabled = rgba($gray4, 0.6)` → `text-foreground-disabled`. Applied as `text-white/60 dark:text-foreground-disabled` so the dark variant overrides.

- **React state for effectiveChecked** — Same rationale as Checkbox/Radio: `peer-checked:` variants only work on siblings, not descendants. Track knob position and track color both depend on checked state, so we track it in React.

- **`overflow-hidden` on track** — Prevents the knob from visually overflowing the pill track boundaries on some browsers. Blueprint clips via the pill shape naturally.

- **Inner labels implemented as visibility-toggled spans** — Blueprint uses `visibility: hidden/visible` (not `display: none`) so layout is preserved and the track width doesn't jump. Our implementation uses `visible` / `invisible` Tailwind classes which map to `visibility: visible/hidden`.

## Gotchas / things to know

- **`[border-radius:28px]` / `[border-radius:35px]`** — Same lesson as Radio's `[border-radius:50%]`. Must use literal computed px values. For switch the border-radius is the computed value of `1.75em` at the indicator's font-size (16px = 28px, 20px = 35px).

- **Track width via min-width** — Blueprint uses `min-width: $switch-width` (1.75em) and `width: auto`. We use `min-w-[28px]` / `min-w-[35px]` with no explicit width so inner labels can expand the track if needed.

- **pt-spacing = 4px, not 8px** — Blueprint's `$pt-spacing = 4px`. The switch indicator margin = `$pt-spacing * 0.5 = 2px`. The control indicator spacing = `$pt-spacing * 2 = 8px`. The task description mentioned "2px margin" for the knob — correct. Confirmed by checking Blueprint source.

- **Dark disabled-checked text color trap** — First run had 1 delta: analyst emitted `rgba(255, 255, 255, 0.6)` for the dark disabled-checked track, but Blueprint emits `rgba(172, 178, 192, 0.6)` (= `rgba(gray4, 0.6)`). Fix: `dark:text-foreground-disabled` override on the `text-white/60` class.

- **control-base.tsx NOT modified** — No regression risk for checkbox/radio from that path.

- **Knob left position for checked** — `left: calc(2px + 100% - 1em)`. Here `100%` is the track width (28px/35px) and `1em` is the knob font-size context (which is the indicator's font-size: 16px/20px). Written as `left-[calc(2px+100%-16px)]` / `left-[calc(2px+100%-20px)]` in Tailwind.

## Next steps

> Phase 2 continues. Next: Label + FormGroup.

1. **Label** — `src/components/ui/label.tsx`. Blueprint: `.bp6-label` with `for` attribute, optional inline style, optional `<small>` helper text. Simple component; foundational for FormGroup.
2. **FormGroup** — `src/components/ui/form-group.tsx`. Blueprint: `.bp6-form-group` wrapper with label, helper text, intent validation states, optional inline layout. Wraps any form control (InputGroup, Checkbox, etc.).
   - Blueprint source: `packages/core/src/components/forms/formGroup.tsx`, `packages/core/src/components/forms/_form-group.scss`.
   - Register in both galleries; run `tools/compare.sh form-group both`.

## How to resume

```bash
# Both servers
pnpm dev                                              # :5173
cd tools/blueprint-reference && pnpm dev              # :5174

# Verification
tools/compare.sh switch both
tools/compare.sh checkbox both   # regression check
tools/compare.sh radio both      # regression check

# Check Phase 2 progress
grep -A 15 "Phase 2" docs/ROADMAP.md
```

- Relevant files:
  - `src/components/ui/switch.tsx` (new)
  - `src/App.tsx` (SwitchGallery + COMPONENTS entry)
  - `tools/blueprint-reference/src/App.tsx` (TaggedSwitch + SwitchGallery + COMPONENTS entry)
  - `docs/ROADMAP.md` (Switch checked)
- Open questions for the user: None — Switch complete; next is Label + FormGroup.
