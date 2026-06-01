# 0021 — NumericInput (Phase 2 #10)

- **Date:** 2026-05-25
- **Focus:** Build NumericInput component to Blueprint v6.15 fidelity; Phase 2 #10 form controls
- **Branch / commit:** phase-2-forms @ (see commit SHA)

## Summary

Built `src/components/ui/numeric-input.tsx` — a modern API reimplementation of Blueprint's NumericInput.
Composes `<InputGroup>` (the text field) with a custom vertical stepper (two `<button>` elements
with chevron-up / chevron-down Icons). Registered in both galleries under `id="numeric-input"` with 7
matching `data-compare` specimens (6 on the input field, 1 on the stepper button).

Compare result:
- **Light: 7 match · 0 differ. Exact match.**
- **Dark: 6 match · 1 differ** — 1 known-intentional delta on `ni-step-button` (dark button colors).

## Current state

- **NumericInput:** Fully implemented and verified — `tools/compare.sh numeric-input both`.
  - Light: 7/7 match · 0 differ. Exact match.
  - Dark: 6/7 match · 1 differ (known-intentional dark button delta — documented below).
- **Regressions:** None checked (file-input still known to pass exactly).
- **Build:** `pnpm build` green (tsc + vite); blueprint-reference `tsc --noEmit` green.
- **Phase 2 progress:** NumericInput checked in ROADMAP.md; 10/12 Phase 2 components done.

## API

```tsx
<NumericInput
  value={5}                        // controlled value (number | string)
  defaultValue={5}                 // uncontrolled default (number | string, default: "")
  onValueChange={(num, str) => {}} // callback: (valueAsNumber, valueAsString)
  min={0}                          // minimum
  max={100}                        // maximum
  stepSize={1}                     // increment (no modifier key, default: 1)
  majorStepSize={10}               // Shift+arrow (default: 10, pass null to disable)
  minorStepSize={0.1}              // Alt+arrow (default: 0.1, pass null to disable)
  buttonPosition="right"           // "left" | "right" | "none" (default: "right")
  clampValueOnBlur={false}         // clamp to [min,max] on blur (default: false)
  allowNumericCharactersOnly={true} // reject non-numeric keys (default: true)
  size="medium"                    // "small" | "medium" | "large" (default: "medium")
  large={false}                    // deprecated shorthand for size="large"
  fill={false}                     // expand to container width
  disabled={false}                 // disabled state
  intent="none"                    // "none"|"primary"|"success"|"warning"|"danger"
  leftIcon="search"                // icon name in left slot of the input field
  style={{ width: 120 }}           // CSS style applied to outer wrapper div
  className=""                     // className on outer wrapper div
  ref={inputRef}                   // forwarded to the underlying <input> element
  // ...all other HTMLInputElement props except size/value/defaultValue/onChange/type
/>
```

## Decisions made (and why)

### Composition strategy: InputGroup + inline stepper (no separate ButtonGroup component)

The stepper is built inline inside NumericInput (two `<button>` elements in a vertical flex column).
No separate ButtonGroup component is used since it's not in the roadmap yet. This approach is clean,
self-contained, and accurately replicates Blueprint's stepper behavior.

### Input border-radius is NOT modified when adjacent to stepper

Early implementation squared the input's border-radius corners adjacent to the stepper (`rounded-r-none`).
This was WRONG. Blueprint keeps all 4 corners at `4px` on the input, even when the stepper is adjacent.
The visual "flush" appearance comes from:
1. The stepper buttons sitting immediately adjacent (no gap) via flex layout.
2. The box-shadows of input and stepper buttons forming a continuous border.
3. The stepper buttons having their inner (facing-input) corners at 0px — the same as not having rounded corners on that side — but the input itself keeps its shape.

The computed-style diff confirmed this: Blueprint's `ni-default` input has `borderRadius: 4px` (all corners),
not `4px 0px 0px 4px` (squared right corners).

### Stepper button radii: `rounded-t-bp` and `rounded-b-bp`

Blueprint's vertical ButtonGroup pattern:
- Increment (top) button: `border-radius: 4px 4px 0px 0px` → `rounded-t-bp`
- Decrement (bottom) button: `border-radius: 0px 0px 4px 4px` → `rounded-b-bp`

Both horizontal sides of each button stay rounded (Blueprint doesn't square the inner edge facing the input).
The `overflow-hidden` approach (to clip child radii from the container) was abandoned in favor of
explicit per-button corner radii, which correctly produce the computed values Blueprint shows.

### `margin-bottom: -1px` on increment button

Blueprint's vertical ButtonGroup merges the border between the two buttons via `-1px` margin.
Applied as `mb-[-1px]` on the increment button. This results in the computed `marginBottom: -1px`
that Blueprint shows on the top stepper button.

### Intent coloring applies to BOTH the input AND the stepper buttons

Blueprint colors the stepper buttons with the active intent (same solid colors as solid Button with intent).
We implement this via the `STEPPER_COLORS` map, which mirrors the Button component's `SOLID` map.
Without this, the stepper buttons would always appear as the default gray-on-gray style, which doesn't
match Blueprint's intent behavior.

### `min-width: 30px` on stepper buttons

Blueprint's `.bp6-button` has a global `min-width: $pt-button-height = 30px`. Even though the
NumericInput SCSS overrides `width` to `24px`, the global min-width rule (`min-width: 30px`) is not
overridden — so Blueprint's stepper button computes `minWidth: 30px`. We match this with `min-w-[30px]`.

### `style` prop goes to outer wrapper div, not the input

The NumericInput component destructures `style` from `inputProps` and applies it to the outer wrapper
div. This allows callers to set `style={{ width: 120 }}` to size the overall component (matching
Blueprint's behavior where the wrapping ControlGroup div accepts width). The forwarded `ref` goes to
the underlying `<input>` element (inside InputGroup), NOT the wrapper div.

### `fill` behavior

When `fill={true}`, the outer wrapper gets `w-full` (instead of `inline-flex`). The InputGroup
inside is always wrapped in a `flex-1 min-w-0` div so it takes the remaining row space after the
stepper. When `fill={false}`, the outer wrapper is `inline-flex` and `style` controls the width.

### No native number spinners

Applied `[appearance:textfield]` and `[&::-webkit-inner-spin-button]:hidden` to the input to
suppress native browser number spinners. This was needed because we use `type="text"` (with
`inputMode="decimal"`) rather than `type="number"`, but the appearance class is applied as a
belt-and-suspenders measure.

### `inputMode="decimal"` on the input

The field uses `type="text"` (to avoid browser-native step behavior) with `inputMode="decimal"` for
proper mobile keyboard behavior (shows numeric keypad with decimal point).

## compare.sh results

```
numeric-input · light:  7 match · 0 differ    (EXACT)
numeric-input · dark:   6 match · 1 differ
```

### Accepted dark delta

Specimen: `ni-step-button` (the increment stepper button, default/none intent)

| Property | mithril | blueprint |
|---|---|---|
| `color` | `rgb(246, 247, 249)` | `rgb(255, 255, 255)` |
| `backgroundColor` | `rgb(47, 52, 60)` | `rgb(48, 55, 64)` |

**Why accepted:** These are the known-intentional dark theme color decisions documented since
handoff 0002 (Button component). The mithril dark foreground is slightly darker `#f6f7f9`
vs Blueprint's near-white `#ffffff` (our intentional design decision). The button background
`rgb(47,52,60)` vs `rgb(48,55,64)` is the color-mix result (dark-gray-3) vs Blueprint's static
value — a sub-4/channel difference that is sub-perceptual.

These same deltas appear on every dark-theme `none`-intent button in every component that uses
Button styling. They are documented in `memory/dark-foreground-decision.md`.

## Specimens registered (both galleries, 7 keyed)

| key | description |
|---|---|
| `ni-default` | value=5, medium, right stepper — `<input>` element |
| `ni-large` | size=large, value=5 — `<input>` element |
| `ni-disabled` | disabled — `<input>` element |
| `ni-intent-primary` | intent=primary — `<input>` element |
| `ni-buttons-left` | buttonPosition="left" — `<input>` element |
| `ni-fill` | fill=true, 300px container — `<input>` element |
| `ni-step-button` | increment button (top stepper button) |

## Gotchas / things to know

- **Do NOT modify the input's border-radius when adjacent to stepper.** Blueprint keeps `4px` on all
  corners. Squaring them (`rounded-r-none`) causes a diff. The flush look comes from box-shadow.

- **Stepper button radii are per-button, not via `overflow-hidden` on container.** Using `overflow-hidden`
  on the container kills all individual button corner radii. Apply `rounded-t-bp` to increment and
  `rounded-b-bp` to decrement directly.

- **Both top corners round on the increment button, both bottom corners round on decrement.**
  Blueprint's vertical ButtonGroup rounds all corners of the top/bottom button (not just the outer corner).
  The inner corner faces the input but is still rounded at 4px. The computed diff confirmed:
  `4px 4px 0px 0px` for the increment button.

- **`marginBottom: -1px`** on the increment button — required to merge borders between the two
  stepper buttons. Without it, there's a visible gap/double-border between them.

- **Intent applies to stepper buttons.** Build the `STEPPER_COLORS` map (mirrors Button's SOLID map)
  and apply the intent color classes to both stepper buttons.

- **Blueprint reference gallery needs the `NumericInput` import** from `@blueprintjs/core` — it's a
  named export. Blueprint's NumericInput is a class component; use a wrapper div + querySelector to
  stamp `data-compare` on inner `.bp6-input` and `.bp6-button-group .bp6-button` elements.

## Next steps

> Phase 2 continues. Next: **SegmentedControl**.

1. **SegmentedControl** — `src/components/ui/segmented-control.tsx`.
   Blueprint: `packages/core/src/components/segmented-control/`.
   A horizontal group of options rendered as a radio-like selector with a sliding indicator.
   Key specs: uses `ControlGroup`-style layout; segments are Buttons; selected segment has
   active/pressed styling; supports intent, fill, small sizes.

## How to resume

```bash
# Both servers
pnpm dev                                              # :5173
cd tools/blueprint-reference && pnpm dev              # :5174

# Verification
tools/compare.sh numeric-input both
tools/compare.sh file-input both      # regression check

# Check Phase 2 progress
grep -A 15 "Phase 2" docs/ROADMAP.md
```

- Relevant files:
  - `src/components/ui/numeric-input.tsx` (new — NumericInput component)
  - `src/App.tsx` (NumericInputGallery + COMPONENTS entry + import)
  - `tools/blueprint-reference/src/App.tsx` (TaggedNumericInput + NumericInputGallery + COMPONENTS entry + import)
  - `docs/ROADMAP.md` (NumericInput checked)
- Open questions for the user: None — NumericInput complete; next is SegmentedControl.
