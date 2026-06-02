# 0012 — InputGroup (Phase 2 #1)

- **Date:** 2026-05-25
- **Focus:** Build InputGroup component to Blueprint v6.15 fidelity; first Phase 2 form control
- **Branch / commit:** phase-2-forms @ (see commit SHA)

## Summary

Built `src/components/ui/input-group.tsx` with a clean modern API supporting `size`, `intent`, `round`, `fill`, `leftIcon`, `leftElement`, `rightElement`, `disabled`, and all native input props. Composed the `<Icon>` component for `leftIcon`. Added input intent shadow and focus shadow tokens to `src/styles/tokens.css`. Registered InputGroup in both galleries with 12 matching `data-compare` specimens (on the `<input>` element). Comparison result: **12 match · 0 differ** in both light and dark themes. Two fix iterations were required: (1) large input was using 12px padding instead of 8px, (2) round border-radius used Tailwind's `rounded-full` (9999px) instead of Blueprint's exact `$pt-input-height` values (24/30/40px per size).

## Current state

- **InputGroup:** Fully implemented and verified — `tools/compare.sh input-group both` → 12/12 match both themes.
- **Tokens:** 9 new shadow tokens added (`--shadow-input-intent-*` and `--shadow-input-focus-*`) to `tokens.css` via `:root`/`.dark` + `@theme inline`.
- **Build:** `pnpm build` green (tsc + vite).
- **Phase 2 progress:** InputGroup checked in ROADMAP.md; 1/12 Phase 2 components done.

## Decisions made (and why)

- **`size?: "small"|"medium"|"large"` (default medium)** — mirrors Blueprint's `size` prop. Heights are 24/30/40px, exactly matching Button's size system and Blueprint's `$pt-input-height-small/height/height-large`.

- **`large` padding stays 8px (same as medium)** — Blueprint's `pt-input-large` mixin only changes `font-size/height/line-height`; horizontal padding stays `$input-padding-horizontal = 8px` for all sizes. The `1.5×` padding (`12px`) only applies to `round` / `type="search"` inputs. Initial mistake: used `px-3` (12px) for large.

- **`round` border-radius = exact height, not `rounded-full`** — Blueprint sets `border-radius: $pt-input-height` (30px for medium), not a generic pill value. Tailwind's `rounded-full` = 9999px which differs numerically. Fixed via CVA compound variants: `rounded-[24px]`/`rounded-[30px]`/`rounded-[40px]` per size when `round=true`. The base `rounded-bp` (4px) is placed in `round: false` variant so there's no class conflict.

- **Intent box-shadows as tokens, not arbitrary values** — Rather than inline `box-shadow` style props (which would use `var()` and get tree-shaken), I added `--input-intent-primary/success/warning/danger` in `:root`/`.dark` and mapped them via `@theme inline` to `shadow-input-intent-*` Tailwind utilities. Light colors use Blueprint's `$pt-intent-colors` (blue3/green3/orange3/red3 = the rest colors). Dark colors use `$pt-dark-input-intent-box-shadow-colors` (blue4/green4/orange4/red4).

- **Focus shadows as tokens** — Similarly, `--input-focus` and `--input-focus-<intent>` encode the full three-layer focus ring for both light (inset + outset + `inset 0 1px 1px rgba(black,0.2)`) and dark (inset + outset only; dark mixin omits the `inset 0 1px 1px` layer). Applied via `focus:shadow-input-focus` literal classes.

- **Left slot absolutely positioned, z-index 10** — Blueprint positions `.bp6-icon` / `.bp6-input-left-container` absolutely with `z-index:1`. Our `z-10` equivalent. The slot width = input height (square), centered with flexbox. `pointer-events-none` for icon; `pointer-events-auto` for `leftElement` (interactive content like buttons).

- **`bg-white dark:bg-black/30`** — Blueprint: light=`$input-background-color=#ffffff`; dark=`$dark-input-background-color=rgba($black,0.3)`. Exact match via Tailwind literal classes.

- **Disabled bg** — Blueprint: light=`rgba(light-gray1, 0.5)=rgba(211,216,222,0.5)`; dark=`rgba(dark-gray5, 0.5)=rgba(64,72,84,0.5)`. Used as `disabled:bg-[rgba(211,216,222,0.5)] dark:disabled:bg-[rgba(64,72,84,0.5)]` arbitrary values — tree-safe.

- **`ref` forwarded to `<input>`** — Mirrors Blueprint's `inputRef` pattern. Our API is cleaner: standard React `forwardRef`.

- **Focus ring not harness-diffed** — The harness captures resting (unfocused) computed styles. Focus ring is implemented via `focus:shadow-input-focus` literal utilities and verified visually in screenshots (the resting screenshots look correct). No `autoFocus` specimen was added to keep all keyed specimens in the stable resting state.

## Gotchas / things to know

- **Large padding is NOT 12px** — Blueprint's `pt-input-large` mixin does not increase horizontal padding. Only `round` / `type="search"` get 1.5× padding. Common mistake given that button large uses `px-4` (16px).

- **`rounded-full` (9999px) ≠ Blueprint's `border-radius: $pt-input-height`** — The harness catches this as a numeric mismatch. Use exact per-size values via CVA compound variants.

- **Tailwind class precedence for conflicting radius** — When `round:false` sets `rounded-bp` and `round:true` compound sets `rounded-[30px]`, Tailwind v4 uses stylesheet order not HTML class order. The fix: put `rounded-bp` in the `round: false` variant (not the base class) so there's no conflict with the compound variant.

- **`data-compare` goes on `<input>`, not the wrapper** — Blueprint's `.bp6-input` is the `<input>` element. The harness measures the input's computed height/padding/shadow/color. Our `data-compare` is spread via `...inputProps` onto the `<input>` directly.

- **Blueprint reference side needs a `useInputCompare` helper** — Blueprint's `InputGroup` wraps its `<input>` inside a `<div>` and doesn't forward arbitrary props to the inner input. We use `useEffect` + `querySelector('.bp6-input')` to attach `data-compare` after mount.

- **Intent shadow has 3 layers, not 2** — Blueprint's `pt-input-intent` mixin generates: `inset 0 0 0 1px <intent-color>` + `$pt-input-box-shadow` (which itself has 2 layers). Result: 3 `inset` layers total. The transparent placeholder layers from `input-transition-shadow(false)` get normalized to `rgba(0,0,0,0) 0px 0px 0px 0px` by the harness and may or may not be dropped by `cleanShadow` depending on whether they match the exact filter pattern.

- **Dark focus ring omits the `inset 0 1px 1px` layer** — The `pt-dark-input` mixin's `:focus` rule only includes `dark-input-transition-shadow(color, true)` (two layers), without the `$input-box-shadow-focus` third layer that light mode adds. Our dark focus tokens reflect this.

## Next steps

> Phase 2 continues. Next: TextArea.

1. **TextArea** — `src/components/ui/text-area.tsx`. Blueprint source: `packages/core/src/components/forms/textArea.tsx` + `_input.scss`. Shares the pt-input mixin but with `height:auto`, `line-height:inherit`, and `padding: $input-padding-horizontal` on all sides. Register in both galleries with `data-compare` on the `<textarea>` element.

## How to resume

```bash
# Both servers
pnpm dev                                              # :5173
cd tools/blueprint-reference && pnpm dev              # :5174

# Verification
tools/compare.sh input-group both

# Check Phase 2 progress
cat docs/ROADMAP.md | grep -A 20 "Phase 2"
```

- Relevant files:
  - `src/components/ui/input-group.tsx` (new)
  - `src/styles/tokens.css` (9 new shadow tokens: input intent + focus)
  - `src/App.tsx` (InputGroupGallery + COMPONENTS entry)
  - `tools/blueprint-reference/src/App.tsx` (InputGroupGallery + COMPONENTS entry)
  - `docs/ROADMAP.md` (InputGroup checked)
- Open questions for the user: None — InputGroup complete; next is TextArea.
