# 0019 — HTMLSelect (Phase 2 #8)

- **Date:** 2026-05-25
- **Focus:** Build HTMLSelect component to Blueprint v6.15 fidelity; Phase 2 #8 form controls
- **Branch / commit:** phase-2-forms @ (see commit SHA)

## Summary

Built `src/components/ui/html-select.tsx` — a native `<select>` element styled like a Blueprint
default (solid/none) Button, with an absolutely-positioned caret icon. Vendored the
`double-caret-vertical` glyph (16px + 20px paths) into `src/components/ui/icons/index.ts`.
Registered in both galleries with 5 matching `data-compare` specimens (on the `<select>` element).
Compare result: **light: 5 match · 0 differ; dark: 1 match · 4 differ (all accepted deltas)**.

## Current state

- **HTMLSelect:** Fully implemented and verified — `tools/compare.sh html-select both`.
  - Light: 5/5 match · 0 differ. Exact match.
  - Dark: 1 match (hs-disabled) · 4 differ (hs-default, hs-large, hs-minimal, hs-fill).
    All 4 dark diffs are the same two pre-existing accepted deltas shared with Button (see below).
- **Regressions:** None. control-group 4/4 both themes still clean.
- **Build:** `pnpm build` green (tsc + vite); blueprint-reference `tsc --noEmit` green.
- **Phase 2 progress:** HTMLSelect checked in ROADMAP.md; 8/12 Phase 2 components done.

## API

```tsx
<HTMLSelect
  options={["Apple", "Banana", "Cherry"]}  // or {label?, value, disabled?}[]
  large={false}          // 40px height (default: 30px)
  minimal={false}        // no bg/shadow at rest
  fill={false}           // width:100%
  disabled={false}
  iconName="double-caret-vertical"  // or "caret-down"
  onChange={handler}
  value={controlled}
  ref={selectRef}        // forwarded to <select>
/>
```

Props: `options?`, `large?`, `minimal?`, `fill?`, `disabled?`, `iconName?`, `multiple?` (blocked),
all standard HTML `<select>` attributes (value, onChange, name, etc.), `className`, `ref`.

Children: raw `<option>` elements (appended after options shorthand).

## Decisions made (and why)

### `data-compare` placed on `<select>` via forwardRef

Blueprint's comparison specimen is `select` inside `.bp6-html-select`. Since the component
forwards ref to `<select>`, the analyst gallery uses `ref={(el) => el?.setAttribute("data-compare", "key")}`.
Blueprint reference gallery uses `useRef` + `useEffect` to stamp the ref since Blueprint's
`HTMLSelect` doesn't accept data-* directly on the outer div. Both sides attach to the `<select>`.

### Caret icon positioning (exact Blueprint metrics)

Blueprint `_html-select.scss`:
- `right: $pt-spacing * 2 = 8px` → Tailwind `right-2` (8px)
- `top: ($pt-button-height - $pt-icon-size-standard) / 2 = (30-16)/2 = 7px` → `top-[7px]`
- Large: `right: $pt-spacing * 3 = 12px` → `right-3`; `top: (40-16)/2 = 12px` → `top-3`

### Dark disabled background: gray-3/[4%]

Blueprint dark disabled: `color-mix(in srgb, palette.gray.3 4%, transparent)` = `rgba(143,153,168,0.04)`.
Our implementation: `dark:disabled:bg-gray-3/[4%]` which produces the same value.
Previous attempt used `dark-gray-3/15` which was incorrect (too opaque, wrong hue).

### Explicit `dark:disabled:shadow-none`

In Tailwind v4, `disabled:shadow-none` alone doesn't reliably override `dark:shadow-button` because
both selectors have equal specificity. Added `dark:disabled:shadow-none` explicitly alongside
`disabled:shadow-none` to ensure no shadow in disabled dark state. Without this, the harness
reported a box-shadow on hs-disabled dark.

### Dark disabled text: `dark:disabled:text-gray-3`

Blueprint dark disabled text = `--bp-typography-color-default-disabled` = `intent.default.disabled`
= `palette.gray.3` = `#8f99a8` = rgb(143,153,168). Our `--foreground-disabled` dark is gray-4 at 60%
opacity which doesn't match. Used `dark:disabled:text-gray-3` directly (= `#8f99a8`).

### Light/large padding

- Default: `pl-2 pr-6` = 8px left, 24px right (`input-padding-horizontal × 3`)
- Large: `pl-2 pr-7` = 8px left, 28px right (`input-padding-horizontal × 3.5`)
These exact values from Blueprint's `%pt-select` and `%pt-select-large` SCSS rules.

## compare.sh results

```
html-select · light:  5 match · 0 differ
html-select · dark:   1 match · 4 differ
```

### Dark accepted deltas (same as Button dark)

All 4 dark diffs are pre-existing accepted deltas that exist identically in `btn-solid-none` dark:

| Property | analyst | blueprint | Δ/ch | Reason |
|----------|---------|-----------|------|--------|
| `color` | `rgb(246, 247, 249)` | `rgb(255, 255, 255)` | 6–9 | Documented dark foreground decision: our #f6f7f9 vs Blueprint's #ffffff (Memory file) |
| `backgroundColor` | `rgb(47, 52, 60)` | `rgb(48, 55, 64)` | 1–4 | Blueprint uses color-mix(gray1 40%, black) ≈ #30374; our static dark-gray-3 = #2f343c |

### Regression checks (prior components unaffected)

```
control-group · light:  4 match · 0 differ
control-group · dark:   4 match · 0 differ
button · dark:          15 match · 3 differ  (same 3 pre-existing accepted deltas as before)
```

## Gotchas / things to know

- **`appearance-none` is critical** — Tailwind v4 preflight does NOT reset `<select>` appearance.
  Without `appearance-none`, the browser renders its own native dropdown arrow that overlaps the Icon.

- **Font inheritance** — Tailwind v4 preflight also resets `<select>` font to a system font.
  Add `font-[inherit]` to inherit the document font stack.

- **Width 100% on select element** — Blueprint's `%pt-select` sets `width: 100%` on the `<select>`
  element itself (to fill the wrapper). Our implementation uses `block w-full` on the select. The
  wrapper controls the outer width via `fill ? "block w-full" : "inline-block"`.

- **`double-caret-vertical` glyph vendored** — Path data copied from:
  `tools/blueprint-reference/node_modules/@blueprintjs/icons/src/generated/{16px,20px}/paths/double-caret-vertical.ts`
  Added to `src/components/ui/icons/index.ts`.

- **`caret-down` was already vendored** — Found in icons/index.ts; no action needed.

## Next steps

> Phase 2 continues. Next: **FileInput**.

1. **FileInput** — `src/components/ui/file-input.tsx`. Blueprint: `forms/fileInput.tsx`.
   A styled file picker: a div wrapper containing a real `<input type="file">` (opacity:0, absolute)
   and a visible label-like element styled as a button. Supports `large`, `fill`, `disabled`.
   Blueprint source: `packages/core/src/components/forms/fileInput.tsx` + `_file-input.scss`.

## How to resume

```bash
# Both servers
pnpm dev                                              # :5173
cd tools/blueprint-reference && pnpm dev              # :5174

# Verification
tools/compare.sh html-select both
tools/compare.sh control-group both     # regression check

# Check Phase 2 progress
grep -A 15 "Phase 2" docs/ROADMAP.md
```

- Relevant files:
  - `src/components/ui/html-select.tsx` (new — HTMLSelect component)
  - `src/components/ui/icons/index.ts` (added double-caret-vertical glyph)
  - `src/App.tsx` (HTMLSelectGallery + COMPONENTS entry + import)
  - `tools/blueprint-reference/src/App.tsx` (HTMLSelectGallery + COMPONENTS entry + import)
  - `docs/ROADMAP.md` (HTMLSelect checked)
- Open questions for the user: None — HTMLSelect complete; next is FileInput.
