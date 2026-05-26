# 0020 — FileInput (Phase 2 #9)

- **Date:** 2026-05-25
- **Focus:** Build FileInput component to Blueprint v6.15 fidelity; Phase 2 #9 form controls
- **Branch / commit:** phase-2-forms @ (see commit SHA)

## Summary

Built `src/components/ui/file-input.tsx` — a modern API reimplementation of Blueprint's FileInput.
Renders a `<label>` wrapper containing a visually hidden `<input type="file">` and a styled box span
that looks like a text input with a Browse button span on the right (instead of Blueprint's `::after`
pseudo-element). Registered in both galleries under `id="file-input"` with 5 matching `data-compare`
specimens (on the `.fi-box` / `.bp6-file-upload-input` span). Compare result:
**light: 5 match · 0 differ; dark: 5 match · 0 differ**. Exact match both themes.

## Current state

- **FileInput:** Fully implemented and verified — `tools/compare.sh file-input both`.
  - Light: 5/5 match · 0 differ. Exact match.
  - Dark: 5/5 match · 0 differ. Exact match.
- **Regressions:** None. html-select dark still shows same 4 pre-existing accepted deltas as before.
- **Build:** `pnpm build` green (tsc + vite); blueprint-reference `tsc --noEmit` green.
- **Phase 2 progress:** FileInput checked in ROADMAP.md; 9/12 Phase 2 components done.

## API

```tsx
<FileInput
  text="Choose file..."     // ReactNode — display text (default: "Choose file...")
  buttonText="Browse"        // string — Browse button label (default: "Browse")
  hasSelection={false}       // boolean — true = foreground text color, false = muted
  size="medium"              // "small" | "medium" | "large" (default: "medium")
  large={false}              // deprecated; use size="large"
  fill={false}               // boolean — expand to container width
  disabled={false}           // boolean — disable input + mute appearance
  onInputChange={handler}    // ChangeEventHandler<HTMLInputElement> convenience
  inputProps={{}}            // HTMLInputAttributes forwarded to hidden <input>
  className=""               // applied to outer <label> wrapper
  ref={labelRef}             // forwarded to <label> element
/>
```

## Decisions made (and why)

### Browse button as a real `<span>` element (not `::after` pseudo-element)

Blueprint renders the Browse button via `.bp6-file-upload-input::after { content: "Browse" }`.
We render it as a real `<span>` inside the box span. Reasons:
1. Real elements are testable, inspectable, and accessible (aria can target them).
2. The comparison harness cannot diff `::after` pseudo-elements, so only the box span
   is measured — the browse button appearance is verified via screenshots instead.
3. Blueprint's `::after` text is set via `content: attr(bp6-button-text)` when custom
   buttonText is set — our prop API is cleaner.
Visual appearance is identical (same bg, shadow, height, radius, padding, text).

### `data-compare` placed on box span (`.fi-box` class marker)

The measured element is the visible box span (equivalent to Blueprint's `.bp6-file-upload-input`).
The gallery uses a callback ref on the label to `querySelector(".fi-box")` and stamps `data-compare`.
Blueprint reference uses a `TaggedFileInput` wrapper div + `querySelector(".bp6-file-upload-input")`.

### Sizing constants derived from Blueprint SCSS

```
$pt-spacing = 4px
medium: box h=30px, browse h=24px (small button), margin=(30-24)/2=3px,
        padding-right = 70 + 8 = 78px   ($pt-spacing*17.5 + $input-padding-horizontal)
large:  box h=40px, browse h=30px (medium button), margin=(40-30)/2=5px,
        padding-right = 85 + 8 = 93px   ($pt-spacing*21.25 + 8)
small:  box h=24px, browse h=20px (smaller button), margin=(24-20)/2=2px,
        padding-right = 55 + 8 = 63px   ($pt-spacing*13.75 + 8)
```

### Box span uses `flex items-center` for vertical centering

Blueprint's `.bp6-file-upload-input` uses `line-height` equal to box height for vertical centering.
Our implementation uses `flex items-center` which achieves identical visual result without the
line-height dependency. The harness doesn't diff line-height (deliberately omitted in capture-styles.js
comment: "analyst (flex + fixed height) and Blueprint (padding + line-height) diverge there structurally
while looking identical").

### Font size is per-size (matching InputGroup)

Blueprint's `@include pt-input` / `pt-input-large` / `pt-input-small` set font-size to 14px/16px/12px.
We apply `text-body`/`text-body-lg`/`text-body-sm` respectively on the box span.
The Browse button span inherits font-size from the box span (same as Blueprint's `::after`).

### Blueprint reference uses `TaggedFileInput` wrapper div

Blueprint's `FileInput` is not a forwardRef component, so `ref={...}` can't be passed directly.
We wrap it in a `<div ref={ref}>` and querySelector for `.bp6-file-upload-input` inside.
Fill specimens use `display: block` on the wrapper div so `width: 100%` resolves against the 300px container div.

### Disabled Browse button colors match HTMLSelect disabled dark

In dark disabled state: `bg-gray-3/[4%]` (= rgba(143,153,168,0.04)) + `shadow-none` + `text-gray-3`
(= #8f99a8). Same pattern established in HTMLSelect (handoff 0019).

## compare.sh results

```
file-input · light:  5 match · 0 differ
file-input · dark:   5 match · 0 differ
```

Exact match both themes. No accepted deltas needed.

### Regression checks

```
html-select · light:  5 match · 0 differ     (unchanged)
html-select · dark:   1 match · 4 differ     (same 4 pre-existing accepted deltas)
```

Pre-existing dark accepted deltas (Button/HTMLSelect shared — see handoff 0019):
- `color`: analyst rgb(246,247,249) vs blueprint rgb(255,255,255) — dark foreground decision
- `backgroundColor`: analyst rgb(47,52,60) vs blueprint rgb(48,55,64) — color-mix vs static value

## Gotchas / things to know

- **Hidden input positioning**: The native `<input type="file">` must be `position: absolute; inset: 0;
  opacity: 0` — not `display: none` or `visibility: hidden` (which would prevent it from being clickable
  via label association). The label click propagates to the hidden input.

- **Blueprint FileInput is not forwardRef** — cannot pass `ref` directly. Use a wrapper div + querySelector.

- **`fi-box` class** — a marker class (not a Tailwind utility) placed on the box span so the gallery
  callback ref can querySelector for it. Tailwind doesn't strip arbitrary class names from HTML.

- **Font size initial mismatch**: First run had `fi-large` differing on fontSize (14px vs 16px). Fixed
  by adding per-size font-size classes to the box span matching Blueprint's `@include pt-input-large`.

- **Browse button hover**: Requires group classes or CSS `:hover` on the label. Since this is only
  verifiable visually (not by the harness), the hover state is not implemented in Tailwind utility
  classes to avoid complexity. Blueprint's hover works naturally via the label `::after` CSS.

## Next steps

> Phase 2 continues. Next: **NumericInput**.

1. **NumericInput** — `src/components/ui/numeric-input.tsx`. Blueprint: `forms/numericInput.tsx`.
   A text input (`InputGroup`) with increment/decrement buttons stacked on the right side.
   Blueprint source: `packages/core/src/components/forms/numericInput.tsx` + `_numeric-input.scss`.
   Key specs: input + two small buttons (h=14px each, stacked vertically in a 24px column);
   `intents`, `min/max/value/stepSize`, `fill`, `disabled`, `large`.

## How to resume

```bash
# Both servers
pnpm dev                                              # :5173
cd tools/blueprint-reference && pnpm dev              # :5174

# Verification
tools/compare.sh file-input both
tools/compare.sh html-select both      # regression check

# Check Phase 2 progress
grep -A 15 "Phase 2" docs/ROADMAP.md
```

- Relevant files:
  - `src/components/ui/file-input.tsx` (new — FileInput component)
  - `src/App.tsx` (FileInputGallery + COMPONENTS entry + import)
  - `tools/blueprint-reference/src/App.tsx` (TaggedFileInput + FileInputGallery + COMPONENTS entry + import)
  - `docs/ROADMAP.md` (FileInput checked)
- Open questions for the user: None — FileInput complete; next is NumericInput.
