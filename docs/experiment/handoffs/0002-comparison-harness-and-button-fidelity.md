# 0002 — Comparison harness (agent-browser) + Button fidelity fixes

- **Date:** 2026-05-25
- **Focus:** Replace hand-driven Chrome comparison with a scriptable `agent-browser` harness
  (screenshots **+** computed-style diff), then fix the Button fidelity gaps it surfaced.
- **Branch / commit:** `harness-and-button-fidelity` @ (this handoff is committed with the work)

## Summary

Built a reusable comparison harness — `tools/compare.sh <component> [light|dark|both]` — that drives two
headless `agent-browser` sessions to the two dev servers, screenshots each in isolated single-component
mode, captures color-normalized computed styles, and prints a per-specimen diff. Both galleries were
instrumented with a `?component=&theme=` URL API, a `COMPONENTS` registry, and `data-compare` keys. Then
used the harness to find and fix four real Button fidelity gaps. Button is now **light 18/18, dark 15/18**
(remaining 3 are sub-perceptual `none`-intent residuals — see below).

## Current state

**Verified (via `tools/compare.sh button both` — screenshots + computed-style diff, light + dark):**
- **Harness works end-to-end.** Auto-starts dev servers if down, pairs specimens by `data-compare` key,
  normalizes oklch/oklab/`color(srgb)` → rgb, diffs with ±3/channel tolerance.
- **Button light = 18/18 exact.** Dark = 15/18; the 3 diffs are all `none`/default intent and
  sub-perceptual (see Decisions).
- Four Button fixes verified: large font-size (now 16px), dark intent text shades, outlined border
  color+alpha, solid box-shadow.

**Build status:** `pnpm typecheck` and `pnpm build` green. Production CSS ~23 kB.

**Not yet addressed:** the global dark-`--foreground` question (next steps #1).

## Decisions made (and why)

- **`agent-browser` CLI over MCP Chrome driving.** Fully scriptable; `--session` gives two parallel
  browsers, `set viewport` pins size, `get styles`/`eval` read computed values. Repeatable, no manual clicks.
- **Galleries render isolated per-component for screenshots** (`?component=<id>` → no header chrome,
  `?theme=light|dark` → URL-driven theme). Deterministic, no toggle-clicking.
- **Color normalization uses `getImageData`, NOT `canvas.fillStyle`.** The 0001 handoff's fillStyle trick
  **no longer works** — this Chromium preserves the authored color space (oklch stays oklch). Painting a
  pixel and reading it back is the reliable normalizer. See `tools/comparison/capture-styles.js`.
- **Diff omits structurally-divergent props** (`fontFamily`, `lineHeight`, vertical padding, `borderStyle`),
  drops zero-width border colors, and strips Tailwind's transparent no-op shadow layers — mithril
  (flex+fixed-height) and Blueprint (padding+line-height) differ there while looking identical.
- **Button fixes (all sourced from Blueprint v6.15):**
  - `tailwind-merge` was silently dropping the custom `text-body-lg` (it lumped the font-size class with
    `text-primary-foreground` as one `text-*` group). Fixed in `src/lib/utils.ts` via `extendTailwindMerge`
    declaring our `text-body*`/`text-heading*` font-size names. **This affected every button**, visible only
    on `large`.
  - Minimal/outlined intent **text** = intent-hover (palette `-2`) in light, `color-mix(in oklch,
    intent-rest, white)` in dark — now theme-aware `--intent-*-text` tokens. Outlined **border** = that text
    color at `/60` (Blueprint's `color-mix(... 60%, transparent)`).
  - Solid **box-shadow** ported to Blueprint's exact computed values (oklch inset/drop; dark inset `0.1`).
  - `none` solid dark fill shifted `dark-gray-4/3/2` → `-3/2/1` to match Blueprint's bg/hover/active steps.

## Gotchas / things to know

- **Harness color normalization is accurate down to ~0.1 alpha; below that, near-black low-alpha colors
  drift ~10/channel** after the canvas round-trip. For shadows, port Blueprint's **exact oklch string** into
  the token so both sides normalize identically (deterministic match). Diff tolerance is ±3/channel.
- **Adding a component to the harness:** register it in BOTH galleries' `COMPONENTS` arrays under the same
  `id`, and tag matching specimens with identical `data-compare` keys. Then `tools/compare.sh <id>`.
- The remaining dark `none` diffs: text `rgb(246,247,249)` vs `rgb(255,255,255)` (global foreground) and bg
  `rgb(47,52,60)` vs `rgb(48,55,64)` (Blueprint derives the dark default fill slightly bluer than raw
  `dark-gray-3`). Both ≤9/channel, below visual threshold — **don't chase them per-button.**
- Tailwind v4 tree-shaking still applies (use literal utilities). `--intent-*-text` are `@theme inline`
  vars overridden in `.dark {}`; referenced via literal `text-intent-primary-text` / `border-…/60`, so they
  emit.

## Next steps

> Continue the vertical slice. For each component: build with CVA → register in BOTH galleries (same `id`,
> matching `data-compare` keys) → `tools/compare.sh <id>` → confirm light+dark → update registry.

1. **(Optional, foundational) Dark `--foreground`.** mithril dark text = `light-gray-5` (#f6f7f9);
   Blueprint derives `intent.default.rest` (gray-1) → near-white (`lightnessOffset 0.212`). Decide whether
   to match globally — it shifts ALL dark text, so it's a deliberate call, not a button patch. This is the
   only non-cosmetic diff left on Button.
2. **Card** — Blueprint `packages/core/src/components/card/`. `elevation` (0–4 → `shadow-elevation-*`),
   `interactive` (hover elevation bump), `selected`. Uses `--surface` bg + border.
3. **Input** (text) — Blueprint `packages/core/src/components/forms/`. `--input-shadow` (tokenized),
   intent validation states, sizes matching button heights (24/30/40). Measure focus ring.
4. **Dialog** — `@radix-ui/react-dialog`; overlay + `shadow-elevation-3`. First Radix-portal component.

## How to resume

```bash
cd /Users/bbatchelder/Code/mithril
pnpm dev                                   # mithril → http://localhost:5173
cd tools/blueprint-reference && pnpm dev   # Blueprint reference → http://localhost:5174
tools/compare.sh button both               # re-verify Button (auto-starts servers if down)
```

- Harness: `tools/compare.sh`, `tools/comparison/{capture-styles.js,diff-styles.mjs,README.md}`.
- Component pattern: `src/components/ui/button.tsx` (CVA + intent maps + theme-aware `--intent-*-text`).
- Tokens: `src/styles/tokens.css`. Blueprint source: `/Users/bbatchelder/Code/blueprint` (v6.15);
  DTCG tokens at `packages/core/src/design-tokens/tokens/` are authoritative.
- Open question for the user: dark `--foreground` (step 1) — match Blueprint's near-white globally?
