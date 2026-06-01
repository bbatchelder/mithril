# 0094 — P2.5 / P2.6 / P2.7: derivable, themeable tokens

- **Date:** 2026-06-01
- **Focus:** Make the token pipeline runtime-derivable + themeable (P2.5), add `@supports`
  fallbacks (P2.6), and add `color-scheme` + a dual dark selector (P2.7).
- **Branch / commit:** public-readiness @ 523fa16 (this work is the next commit)

## Summary

Converted `src/styles/tokens.css` from hand-baked sRGB literals to **runtime relative-color
derivations** from a small seed set, so changing a seed re-tints the whole theme — in both light
and dark. Added a static-literal fallback + `@supports` guard for every derived value (P2.6), set
`color-scheme` and made dark respond to `.dark` **or** `[data-mode="dark"]` (P2.7). Shipped one
example theme `[data-theme="datex"]` wired into the gallery, and wrote `docs/theming.md`.

## Current state

- **Verified (compare.sh, both themes, all `N match · 0 differ`):** button, tag, card, callout,
  input-group, numeric-input, checkbox, html-select — the default theme is pixel-identical to before
  the refactor (derivations reproduce the prior literals byte-for-byte).
- **Verified (in-browser probes via agent-browser):** `[data-theme="datex"]` re-tints link, ring,
  intent text, tag-minimal text, selection, and neutral surfaces in **both** light and dark;
  `[data-mode="dark"]` activates both the dark semantic tokens and the `dark:` utility variant.
- **Verified visually:** `docs/assets/p25-datex-{light,dark}.png` (gallery in the datex theme).
- **Build/typecheck:** `pnpm build` green.
- **Math verification:** an OKLCH↔sRGB resolver (ad-hoc `/tmp/oklch.py`) confirmed every offset
  reproduces the old literal; not committed (throwaway), but the offsets are documented inline.

## Decisions made (and why)

- **Option (a) runtime derivation** (not a build step): keeps the shadcn "own the source" ergonomics —
  no toolchain, the CSS *is* the source of truth — and gives live re-tinting.
- **Seeds = `@theme` intent vars (all four intents) + the gray ramp.** A theme overrides *only* seeds;
  semantic tokens re-resolve. All four intents are seed-driven (not just primary), per request.
- **`data-theme` must be applied on `<html>`** (the gallery uses a `useEffect` on
  `document.documentElement`). Light-mode semantic tokens are declared on `:root`; CSS custom-property
  substitution resolves `var(--seed)` *at the declaring element*, so a `data-theme` on a descendant div
  leaves the inherited (default-seed) values unchanged. This bit me first try — see Gotchas.
- **Offsets mirror Blueprint's DTCG `com.blueprint.derive`** (lightness/chroma/hue offset+scale, alpha)
  → map 1:1 to `oklch(from … calc(l + Δ) …)` / `color-mix(in oklch, …)`.
- **Two neutral/near-black shadows kept non-derived:** the dark `--button-shadow` drop is achromatic
  (`oklch(0.189828 0.00940823 none / 0.2)`) — restored verbatim under `@supports` because seed-deriving
  it from `dark-gray-1` shifted hue and broke the button-dark style match (it's neutral, no re-tint value).
- **Datex theme re-seeds all four intents** (violet primary, mint success, amber warning, matched red
  danger) + an olive neutral tint (the brand "none" tone). Each intent's hover/active/disabled tiers mirror
  its own color family's Blueprint OKLCH steps. The mint success solid fill uses dark foreground text
  (`--color-success-foreground: #111418`) because white-on-mint fails AA.

## Gotchas / things to know

- **Custom-property substitution is frozen at the declaring element.** `--link: var(--color-primary-hover)`
  declared on `:root` computes with `:root`'s seed; descendants inherit the *computed* value. So themes
  must be applied where the semantic tokens live (`<html>`). Dark works on a subtree only because the
  `.dark` block *redeclares* the semantic tokens there. Documented in `docs/theming.md`.
- **`@supports` test:** gated on `(color: oklch(from white l c h))` (relative color — the newest feature);
  where it passes, `color-mix(in oklch)` is also available.
- **Tree-shaking:** the intent seed vars (`--color-primary-hover`, etc.) survive because they're referenced
  via `var()` in `:root`. Verified present in `dist/*.css` (also `data-mode` wired across utilities, 200+).
- **compare.sh uses the dev server (:5173)** — edits hot-reload; no rebuild needed before comparing. Don't
  pipe compare.sh to head/tail (see its header note); redirect to a file.

## Next steps

> P2 token work is complete. Remaining open P2 item is behavioral, not tokens:

1. **P2.8** — MenuItem submenus + Popover `hover` interactionKind + a shared controlled-input helper.
2. (Optional, future) **Full runtime theming** — a `ThemeProvider`/API + gallery theme switcher +
   multiple shipped themes (option #3). `docs/theming.md` describes the seed contract it would build on.
3. **P3.x** harness/CI hardening (P3.1 compare in CI; P3.2 widen the computed-style gate to catch the
   `boxShadow`-only kind of regression this session surfaced manually).

## How to resume

```bash
pnpm dev                                  # :5173 (analyst), tap-managed
cd tools/blueprint-reference && pnpm dev  # :5174 (reference)
# default-theme fidelity (must stay clean):
tools/compare.sh button both > /tmp/c.log 2>&1; grep -E 'match · [0-9]+ differ' /tmp/c.log
# see the datex theme:  http://localhost:5173/?palette=datex  (+ &theme=dark)
```

- Relevant files: `src/styles/tokens.css` (seeds, `:root`/`.dark` fallbacks, `@supports` derivations,
  `[data-theme="datex"]`), `src/App.tsx` (theme `useEffect` + sidebar tint toggle), `docs/theming.md`,
  `docs/blueprint-parity-roadmap.md` (P2.5/2.6/2.7 ticked).
- Open questions for the user: whether to pursue the full `ThemeProvider` runtime-theming system (#3) next.
