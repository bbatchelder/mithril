# 0013 — TextArea (Phase 2 #2)

- **Date:** 2026-05-25
- **Focus:** Build TextArea component to Blueprint v6.15 fidelity; Phase 2 #2 form control
- **Branch / commit:** phase-2-forms @ (see commit SHA)

## Summary

Built `src/components/ui/text-area.tsx` with a clean modern API supporting `size`, `intent`, `fill`, `autoResize`, and all native textarea props. Reused InputGroup's shadow/intent/focus token classes identically — no new tokens needed (all already existed in `tokens.css`). Registered TextArea in both galleries with 9 matching `data-compare` specimens on the `<textarea>` element. Comparison result: **9 match · 0 differ** in both light and dark themes on the first run with no iterations required.

## Current state

- **TextArea:** Fully implemented and verified — `tools/compare.sh text-area both` → 9/9 match both themes.
- **Tokens:** No new tokens added — all input shadow/intent/focus tokens from InputGroup were reused as-is.
- **Build:** `pnpm build` green (tsc + vite).
- **InputGroup regression check:** `tools/compare.sh input-group both` → 12/12 match both themes (unaffected).
- **Phase 2 progress:** TextArea checked in ROADMAP.md; 2/12 Phase 2 components done.

## Decisions made (and why)

- **`size?: "small"|"medium"|"large"` (default medium)** — mirrors Blueprint's `size` prop and InputGroup. Font sizes: small=12px, medium=14px, large=16px (same as InputGroup/Button).

- **`p-2` (8px all sides) for ALL sizes** — Blueprint's `_input.scss` specifies `padding: $input-padding-horizontal` (8px) for textarea medium/large, and `padding: $input-small-padding` for small. `$input-small-padding = $pt-input-height-small - $pt-icon-size-standard = 24 - 16 = 8px`. Both values are 8px — all sizes use `p-2`. This is a key divergence from single-line input: the padding applies on ALL sides (top+bottom too), not just horizontal.

- **No `h-*` fixed height** — textarea uses `height: auto; line-height: inherit` per Blueprint spec (multiline content, not a fixed-height control). The comparison harness captures `height` as the computed rendered height (rows × line-height + padding), which matched Blueprint's computed height exactly with `rows=3`.

- **`resize` (both by default)** — Browser default for textarea is `resize: both`. Blueprint does not override this (the default textarea is resizable). When `autoResize={true}`, we add `resize-x` (horizontal only) — Blueprint's `.bp6-text-area-auto-resize` sets `resize: horizontal` for the same reason.

- **`autoResize` JS approach mirrors Blueprint** — Blueprint's `maybeSyncHeightToScrollHeight` sets `height=0px` first (to get minimum scrollHeight), then `height=scrollHeight`. We use a `useRef` + `useEffect` (on mount + on `value` prop change for controlled mode) + `onChange` handler for uncontrolled mode. Works for both controlled and uncontrolled usage.

- **`rounded-bp` (4px) hardcoded, no `round` variant** — Blueprint's textarea does not have a round variant. The 4px radius is set unconditionally in the size variant (in each of small/medium/large) to avoid any class conflicts.

- **No `max-w-full` needed** — Blueprint's `max-width: 100%` on textarea is a belt-and-suspenders guard against overflow. Our `block` display + standard box-sizing handles this; width is controlled by the `fill` prop or a fixed `style.width`.

- **`data-compare` on `<textarea>` directly** — Unlike InputGroup (Blueprint wraps `<input>` in a div), Blueprint's TextArea renders the `<textarea>` as the root element with `bp6-input bp6-text-area` on it directly. Our component also renders `<textarea>` as root, so `data-compare` passes straight through `...textareaProps`. No ref+querySelector helper needed on the reference side.

- **Ref forwarding via manual merge** — We need both `forwardRef` and an internal `innerRef` for autoResize. Used a callback ref pattern that populates both refs, avoiding the need for `useImperativeHandle`.

- **Same shadow/intent/focus tokens as InputGroup** — `shadow-input`, `shadow-input-intent-<X>`, `focus:shadow-input-focus[-<X>]` — all identical. No new CSS variables or `@theme inline` entries needed.

## Gotchas / things to know

- **`height: auto` means height is content-driven** — The harness compares computed height. With `rows=3`, both sides compute identical heights because font-size + line-height + padding match. If rows differed between the two galleries, heights would differ too.

- **Blueprint TextArea IS the root element** — Unlike InputGroup where the root is a div wrapper, TextArea renders the `<textarea>` directly, so arbitrary props (including `data-compare`) pass through without a ref+querySelector hack.

- **Small padding = 8px, not smaller** — `$input-small-padding = $pt-input-height-small - $pt-icon-size-standard = 24 - 16 = 8px`. It's the same as `$input-padding-horizontal = 8px`. Small textarea has identical padding to medium/large, just a smaller font-size.

- **`line-height: inherit` means browser default** — For textarea, Blueprint explicitly sets `height: auto; line-height: inherit` (overriding what the input mixin sets). Our textarea inherits `line-height` from the body (~1.28581). This produces the correct natural multiline layout.

- **`resize: both` is the browser default** — We don't need to set this explicitly; we rely on the browser default. The class `resize` in Tailwind v4 corresponds to `resize: both`. When `autoResize` is true, we override with `resize-x`.

## Next steps

> Phase 2 continues. Next: Checkbox.

1. **Checkbox** — `src/components/ui/checkbox.tsx`. Blueprint source: `packages/core/src/components/forms/controls.tsx` + `_controls.scss`. Uses a custom indicator (not native checkbox). Intent coloring applies to the indicator background when checked. Register in both galleries with `data-compare` on the wrapper or indicator element.

## How to resume

```bash
# Both servers
pnpm dev                                              # :5173
cd tools/blueprint-reference && pnpm dev              # :5174

# Verification
tools/compare.sh text-area both
tools/compare.sh input-group both   # regression check

# Check Phase 2 progress
grep -A 15 "Phase 2" docs/ROADMAP.md
```

- Relevant files:
  - `src/components/ui/text-area.tsx` (new)
  - `src/App.tsx` (TextAreaGallery + COMPONENTS entry)
  - `tools/blueprint-reference/src/App.tsx` (TextAreaGallery + COMPONENTS entry)
  - `docs/ROADMAP.md` (TextArea checked)
- Open questions for the user: None — TextArea complete; next is Checkbox.
