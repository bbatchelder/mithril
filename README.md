# analyst-ui

A modern, **pixel-faithful** reimplementation of [Palantir Blueprint](https://github.com/palantir/blueprint)'s
design language — rebuilt from scratch on a contemporary foundation:

- **React 19** + TypeScript
- **Tailwind v4** (CSS-first `@theme`) + **CVA** for variants
- **Radix UI** primitives for behavior & accessibility
- Distributed **shadcn-style**: you own the component source (copied in via a registry), not a black-box dependency

Blueprint is treated as a **design spec, not a code source**. We port its visual DNA (color, density,
elevation, type) precisely, then re-implement components with clean, modern APIs. The legacy SCSS/BEM
machinery is left behind entirely.

> Ported tokens derive from Blueprint (Apache-2.0). See `LICENSE` / attribution.

## Status

Foundation in place:

- ✅ Project scaffold (Vite, React 19, TS, Tailwind v4, shadcn registry config)
- ✅ Design tokens ported into `src/styles/tokens.css`
- ⬜ Component vertical slice (Button, Card, Input, Dialog) — next
- ⬜ Component tiers (Radix-backed → composite → hard: Select/Table/Date)
- ⬜ Icons (lucide initially; Blueprint's 706-icon set as a later tier)

## Getting started

```bash
pnpm install
pnpm dev        # preview/token showcase at http://localhost:5173
pnpm build      # typecheck + production build
pnpm typecheck
```

## Design tokens

`src/styles/tokens.css` is the heart of the visual fidelity. It follows the shadcn + Tailwind v4 pattern:

1. **`@theme`** — static primitives that generate Tailwind utilities:
   - Full Blueprint palette (`gray`, `blue`, `green`, … `violet` × 1–5) → `bg-blue-3`, `text-gray-1`, …
   - Theme-independent intents → `bg-primary`, `bg-success`, `bg-warning`, `bg-danger` (+ `-hover`/`-active`/`-disabled`/`-foreground`)
   - Type scale (`text-body`, `text-heading-lg`, `text-code`, …), `font-sans`/`font-mono`
   - Radius (`rounded-bp`), easing (`ease-bp`, `ease-bp-bounce`)
2. **`:root` / `.dark`** — semantic variables that swap per theme: `--background`, `--surface`, `--elevated`,
   `--foreground(-muted/-disabled)`, `--border(-strong)`, `--divider`, `--ring`, elevation shadows, input shadow.
3. **`@theme inline`** — maps the semantic vars onto Tailwind tokens: `bg-background`, `bg-surface`,
   `text-foreground`, `border-border`, `shadow-elevation-{0..4}`, etc.

Dark mode is class-based (`.dark` on an ancestor), via the `@custom-variant dark`.

### Fidelity notes

- Palette, intents, type, radius, motion, and elevation shadows are ported **1:1** from Blueprint's DTCG
  token set and SCSS variables.
- Dark surface colors were verified against Blueprint's OKLCH-derived values
  (e.g. dark card = `oklch(from gray-1 calc(l*0.54) calc(c*0.481) h)` → `#252a31`).
- A few OKLCH-*derived* minimal/ghost interaction backgrounds are currently approximated with classic
  Blueprint translucent values (`--interactive-hover/-active`) and will be fine-tuned per-component
  against Blueprint's Storybook during the component build.

## Distribution (shadcn registry)

`components.json` + `registry.json` configure this as a shadcn-style registry. The `tokens` style item
exposes `src/styles/tokens.css` so consumers can pull the design foundation, then copy in components as
they're built.
```
