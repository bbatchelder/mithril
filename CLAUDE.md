# analyst-ui — agent guide

> **Bootstrapping a session?** Read the most recent file in `docs/handoffs/` first — it captures
> the current state and the next steps. Then skim this file for the durable rules below.
> The fixed component build order lives in `docs/ROADMAP.md` — the next component is always the first
> unchecked item there, so no need to ask "what's next."

## What this project is

A from-scratch, **pixel-faithful** reimplementation of Palantir Blueprint's design language with a
**fresh, modern API**. It is *not* a fork of Blueprint's code — Blueprint is the design spec only.

- **Stack:** React 19 · TypeScript · Vite · Tailwind v4 (CSS-first `@theme`) · Radix primitives · CVA
- **Distribution:** shadcn-style — consumers *own* the component source (copied via the registry)
- **Fidelity bar:** match Blueprint's visuals precisely; design clean modern APIs (not drop-in compatible)

## Key locations

- `src/styles/tokens.css` — the design foundation (palette, intents, surfaces, elevation, type, motion).
  Ported 1:1 from Blueprint's DTCG tokens. This is the source of visual fidelity.
- `src/components/ui/` — the owned components (built with CVA + Radix).
- `src/App.tsx` — preview/showcase app (`pnpm dev` → :5173).
- `tools/blueprint-reference/` — isolated `@blueprintjs/core@6.15` gallery for side-by-side comparison
  (`cd tools/blueprint-reference && pnpm dev` → :5174). React 18 there to satisfy Blueprint's peer dep.
- `tools/compare.sh` + `tools/comparison/` — the comparison harness (see its README). Drives `agent-browser`
  to screenshot **and** computed-style-diff a component against Blueprint in one command.
- Blueprint source clone (the design spec): `/Users/bbatchelder/Code/blueprint` (v6.15, Apache-2.0).
  Authoritative tokens: `packages/core/src/design-tokens/tokens/`.
- `docs/handoffs/` — session handoff docs; newest bootstraps the next session.

## Workflow rules

- **Visual verification is required for components.** Build the component, render it in *both* galleries
  (`src/App.tsx` and `tools/blueprint-reference/src/App.tsx`) — register it in each `COMPONENTS` array under
  the same `id`, and tag key specimens with matching `data-compare` keys. Then run `tools/compare.sh <id>`
  to screenshot **and** computed-style-diff against Blueprint (both themes) before calling a component done.
  Prefer this over driving Chrome by hand.
- **End every working session by writing a handoff** in `docs/handoffs/` (see `TEMPLATE.md`). Update the
  current task's status. Commit.
- **Tailwind v4 tree-shakes unused `@theme` vars.** Reference tokens via *literal* utility classes
  (`bg-blue-3`, `shadow-elevation-2`, `ease-bp`), not runtime `var()` in inline styles — those get
  dropped. Tokens declared in plain `:root {}` (e.g. `--elevation-0..4`) are always emitted.
- Commit messages end with the Co-Authored-By trailer. Branch before committing if on the default branch.

## Commands

```bash
pnpm dev          # analyst-ui preview at :5173
pnpm build        # typecheck (tsc -b) + vite build
pnpm typecheck
cd tools/blueprint-reference && pnpm dev   # Blueprint reference at :5174

tools/compare.sh button            # screenshot + style-diff a component vs Blueprint (both themes)
tools/compare.sh button dark       # ...one theme only (light|dark|both)
```
