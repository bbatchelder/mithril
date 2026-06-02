# 0023 — ControlCard (Phase 2 #12 — LAST Phase 2 component)

- **Date:** 2026-05-25
- **Focus:** Build ControlCard (CheckboxCard/RadioCard/SwitchCard) — the final Phase 2 form control — to Blueprint v6.15 fidelity.
- **Branch / commit:** phase-2-forms @ (see commit SHA)

## Summary

Built `src/components/ui/control-card.tsx` exporting `CheckboxCard`, `RadioCard`, and `SwitchCard`. These compose `Card` (with interactive surface + selected ring) wrapping the respective control components (Checkbox/Radio/Switch), with the control filling the full card surface via a flex label override. Registered in both galleries under `id="control-card"` with 7 matching `data-compare` specimens. Compare result: **7 match · 0 differ in BOTH light and dark themes** — a perfect clean diff.

**Phase 2 is now COMPLETE — all 12 form controls done.** Next step: open the Phase 2 PR (`phase-2-forms → main`), merge, cut `phase-3-overlays`.

## Current state

- **ControlCard:** Fully implemented and verified — `tools/compare.sh control-card both`.
  - Light: 7/7 match · 0 differ — perfect.
  - Dark: 7/7 match · 0 differ — perfect.
- **Build:** `pnpm build` green (tsc + vite); blueprint-reference `tsc --noEmit` green.
- **Regression check:** Checkbox (6/6), Radio (6/6), Switch (6/6) all still pass after the indicator className fix.
- **Phase 2 progress:** ControlCard checked in ROADMAP.md; **12/12 Phase 2 components done.**

## API

```tsx
// CheckboxCard — indicator defaults left
<CheckboxCard
  label="Option label"
  checked={true}                  // controlled checked state
  defaultChecked={false}          // uncontrolled initial checked state
  disabled={false}
  showAsSelectedWhenChecked={true} // when checked, apply Card's selected ring (default: true)
  alignIndicator="left"           // "left" (default) | "right"
  elevation={0}                   // 0–4 (same as Card's elevation prop)
  selected={false}                // explicit selected override (bypasses showAsSelectedWhenChecked)
  compact={false}                 // 16px padding instead of 20px
  onChange={(e) => {}}
  indeterminate={false}           // CheckboxCard-only: indeterminate state
  style={{ width: 240 }}          // any HTMLDivElement props accepted
  className=""                    // card className
  controlClassName=""             // inner control label className
  checkboxProps={{}}              // extra Checkbox props
/>

// RadioCard — indicator defaults right
<RadioCard
  label="Option label"
  value="opt1"
  name="my-radio-group"
  checked={...}
  defaultChecked={...}
  disabled={false}
  showAsSelectedWhenChecked={true}
  alignIndicator="right"          // "right" (default) | "left"
  elevation={0}
  compact={false}
  onChange={(e) => {}}
  radioProps={{}}                 // extra Radio props
/>

// SwitchCard — indicator defaults right
<SwitchCard
  label="Option label"
  checked={...}
  defaultChecked={...}
  disabled={false}
  showAsSelectedWhenChecked={true}
  alignIndicator="right"          // "right" (default) | "left"
  elevation={0}
  compact={false}
  onChange={(e) => {}}
  innerLabel="OFF"                // SwitchCard-only: inner track label when unchecked
  innerLabelChecked="ON"          // SwitchCard-only: inner track label when checked
  switchProps={{}}                // extra Switch props
/>
```

## Decisions made (and why)

### Composition: Card wrapping each control (not fighting the control's own layout)

Each ControlCard (CheckboxCard/RadioCard/SwitchCard) is a `Card` component with `p-0 min-h-0` wrapping the respective control with a `className` override that:
1. Sets `display: flex; gap: 8px; align-items: flex-start; padding: 20px` (or 16px compact) on the label element — matching Blueprint's SCSS for `.bp6-control-card .bp6-control`.
2. Does NOT pass `pl-0 pr-0` — the full `p-5` covers all four sides. This is critical for correct text wrapping.

Why not duplicate the control's SCSS? The Checkbox/Radio/Switch components are already pixel-perfect. We reuse them and only override the label-level flex layout and indicator margins.

### indicatorProps.className now merged last in Checkbox and Radio cn() calls

Blueprint's SCSS: `.bp6-control-indicator { margin: 0; }` inside `.bp6-control-card`. The indicators use negative margins to pull into the label's padding gap. Inside a card, we need `margin: 0` on the indicator instead. We pass `indicatorProps={{ className: "!ml-0 !mr-0 !mt-0 !float-none shrink-0" }}` which previously had no effect because `indicatorProps.className` was spread before then overridden by the explicit `className={cn(...)}`.

**Fix:** Added `indicatorProps?.className` as the LAST argument in the `cn()` call inside both Checkbox and Radio indicator spans. This allows callers to override indicator styles without fighting specificity. Switch already had this pattern. This fix is a small improvement to those components with no regression (confirmed: checkbox/radio/switch all still pass 6/6).

### Text wrapping matches Blueprint via correct side padding

Blueprint's text wrapping in the checked specimen ("Checked option (selected ring)" at 240px card width wraps to 2 lines at available text width ≈ 176px = 240 - 20 - 16 - 8 - 20). My initial implementation had `pl-0 pr-0` overriding the `p-5`, giving 216px available text width where the text didn't wrap (58px height). Fixed by removing `pl-0 pr-0` — the `p-5` in the className correctly overrides the Checkbox's leading `pl-6` since it comes last in `cn()`.

### alignIndicator defaults: CheckboxCard="left", RadioCard="right", SwitchCard="right"

Matches Blueprint: `CheckboxCard` overrides `Alignment.START` (left); `RadioCard` and `SwitchCard` use `ControlCard`'s default `Alignment.END` (right). The API maps `"left"/"right"` strings (not Blueprint's deprecated "start"/"end" Alignment enum).

### Card gets `p-0 min-h-0` (padding zeroed, min-height reset)

Matches Blueprint's `.bp6-card.bp6-control-card { min-height: auto; padding: 0; }`. The Card component's `compact` prop is always `false` since we handle padding on the inner control label.

### showAsSelectedWhenChecked wired to Card's selected prop

When checked (and `showAsSelectedWhenChecked=true`), the Card renders `selected={true}` which applies `shadow-card-selected` (the primary ring). The explicit `selected` prop on ControlCard overrides this behavior. This matches Blueprint exactly.

### No new deps

No new npm packages required. Composition-only using existing Card, Checkbox, Radio, Switch components.

## Gotchas / things to know

- **`pl-0 pr-0` must NOT be applied to the control label.** It was tempting to zero side padding when zeroing the indicator margins, but the full `p-5` on the label provides the 20px side padding needed for the text container to be narrowed to 176px (matching Blueprint). Without it, text doesn't wrap and the height differs.

- **indicatorProps.className fix is required.** Without the fix to Checkbox/Radio's cn() call, the indicator retains its default `-ml-6 mr-2` margins regardless of what's in indicatorProps. Always put `indicatorProps?.className` last in the indicator span's cn() call.

- **Blueprint reference `RadioCard` doesn't accept `name` directly.** It uses `inputProps={{ name: "..." }}`. Our API accepts `name` directly on RadioCard (passed to the underlying Radio component).

- **Switch indicatorProps interaction.** Switch already had `indicatorProps?.className` merged last, so no fix needed there. But we still pass the reset class to zero the track's pull-in margins.

- **Blueprint reference `CheckboxCard`/`RadioCard`/`SwitchCard` accept `data-*` directly.** They forward to the card root `.bp6-card` element. No ref+setAttribute trick needed for Blueprint reference specimens.

- **`!` prefix in Tailwind v4.** The `!ml-0 !mr-0 !mt-0` pattern works in Tailwind v4 to produce `!important` rules. Combined with tailwind-merge's last-wins behavior in `cn()`, this reliably overrides the indicator's inline negative margins.

## Accepted Deltas

None — both light and dark are 7/7 exact matches. No accepted deltas needed.

## Specimens registered (both galleries, 7 keyed)

| key | description |
|---|---|
| `cc-checkbox` | CheckboxCard unchecked, left-aligned indicator |
| `cc-checkbox-checked` | CheckboxCard defaultChecked=true → card has selected ring (blue) |
| `cc-radio` | RadioCard unchecked, right-aligned indicator |
| `cc-switch` | SwitchCard unchecked, right-aligned switch track |
| `cc-compact` | CheckboxCard compact=true (16px padding) |
| `cc-disabled` | CheckboxCard disabled=true (muted indicator + card not interactive) |
| `cc-align-right` | CheckboxCard alignIndicator="right" (indicator on right) |

## compare.sh results

```
control-card · light:  7 match · 0 differ  — perfect
control-card · dark:   7 match · 0 differ  — perfect
```

Prior components confirmed unaffected by indicatorProps.className fix:
```
checkbox · light: 6 match · 0 differ
checkbox · dark:  6 match · 0 differ
radio · light:    6 match · 0 differ
radio · dark:     6 match · 0 differ
switch · light:   6 match · 0 differ
switch · dark:    6 match · 0 differ
```

## Phase 2 Status: COMPLETE

All 12 Phase 2 form controls are done:
1. InputGroup ✓
2. TextArea ✓
3. Checkbox ✓
4. Radio / RadioGroup ✓
5. Switch ✓
6. Label + FormGroup ✓
7. ControlGroup ✓
8. HTMLSelect ✓
9. FileInput ✓
10. NumericInput ✓
11. SegmentedControl ✓
12. ControlCard ✓ ← just completed

## Next steps

> Phase 2 is COMPLETE. Open the Phase 2 PR, merge `phase-2-forms → main` (merge commit), sync main, delete the phase branch, then cut `phase-3-overlays` and start Phase 3 #1: Dialog.

1. **Open PR** — `phase-2-forms → main`. Title: "Phase 2 — Form controls (12 components)". Summarize all 12 components.
2. **Merge** — merge commit (not squash, preserve history).
3. **Cut new branch** — `git checkout main && git pull && git checkout -b phase-3-overlays`.
4. **Dialog** — first Phase 3 component (`dialog/`). Blueprint: `packages/core/src/components/dialog/`. Uses Radix `@radix-ui/react-dialog`. Work out harness reach for portaled content.

## How to resume

```bash
# Check branch
git branch --show-current  # should be phase-2-forms

# Both servers
pnpm dev                                              # :5173
cd tools/blueprint-reference && pnpm dev              # :5174

# Verification
tools/compare.sh control-card both
tools/compare.sh checkbox both  # regression
tools/compare.sh radio both     # regression
tools/compare.sh switch both    # regression
```

- Relevant files:
  - `src/components/ui/control-card.tsx` (new — CheckboxCard, RadioCard, SwitchCard)
  - `src/components/ui/checkbox.tsx` (indicatorProps.className now merged last in cn())
  - `src/components/ui/radio.tsx` (same fix)
  - `src/App.tsx` (ControlCardGallery + COMPONENTS entry + import)
  - `tools/blueprint-reference/src/App.tsx` (ControlCardGallery + COMPONENTS entry + import)
  - `docs/ROADMAP.md` (ControlCard checked — Phase 2 complete)
- Open questions for the user: None — ready to open Phase 2 PR.
