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
- `src/components/ui/` — the owned components (built with CVA + Radix). No third-party icon dep:
  `src/components/ui/icons/index.ts` is the **full Blueprint icon set (706 glyphs), generated** by
  `tools/gen-icons.mjs` (re-run to refresh). Trade-off, by decision: it's one static map keyed by the
  `IconName` union, so importing `Icon` bundles all glyphs (no tree-shaking) — owners trim unused entries.
  Keep `ICON_GLYPHS` typed as `Record<IconName, IconGlyph>` (an explicit union, **never** `as const`) or
  indexing it hits TS2590. See `docs/handoffs/0059`.
- `src/App.tsx` — preview/showcase app (`pnpm dev` → :5173).
- `tools/blueprint-reference/` — isolated `@blueprintjs/core@6.15` gallery for side-by-side comparison
  (`cd tools/blueprint-reference && pnpm dev` → :5174). React 18 there to satisfy Blueprint's peer dep.
- `tools/compare.sh` + `tools/comparison/` — the comparison harness (see its README). Drives `agent-browser`
  to screenshot **and** computed-style-diff a component against Blueprint in one command.
- Blueprint source clone (the design spec): `/Users/bbatchelder/Code/blueprint` (v6.15, Apache-2.0).
  Authoritative tokens: `packages/core/src/design-tokens/tokens/`.
- `docs/handoffs/` — session handoff docs; newest bootstraps the next session.

## The development loop (autonomous)

The goal is to build out `docs/ROADMAP.md` **autonomously, without stopping between components.**
Work the roadmap top-down; the next component is always the first unchecked item.

- **Branch per phase.** Cut `phase-N-<slug>` (e.g. `phase-1-primitives`) from fresh `main`. All of a
  phase's component commits land on that branch.
- **One loop = one component.** Per loop: build → register in BOTH galleries → `tools/compare.sh <id> both`
  → tick the box in `ROADMAP.md` → write the next numbered handoff (`docs/handoffs/000N-*.md`) →
  **one commit, then push.** The commit bundles the component, gallery edits, token changes, the roadmap
  tick, and the handoff.
- **Phase complete** → open a PR → merge to `main` (merge commit) → sync `main`, delete the phase branch
  → cut the next phase branch. Then continue.
- **Definition of done (commit gate):** `pnpm build` green **and** `compare.sh` clean in both themes.
  Aim for an exact computed-style match; if a small sub-perceptual delta remains after real effort, accept
  it, **document it in the handoff**, and move on (e.g. the dark-`--foreground` call — see agent memory).
- **Pause only on hard blockers.** Make all fidelity / technical / API calls yourself and document them.
  Stop for the user only when genuinely stuck: build can't go green, the harness can't reach the component
  after real effort, or a *dependency* component (e.g. Popover) fails and blocks everything downstream.
- **Auto-install dependencies** as components need them (`pnpm add @radix-ui/...`, Floating UI,
  `react-day-picker`, …) and list each new package in that loop's handoff.
- **The harness is ours to extend.** If `compare.sh` / the galleries can't reach a component (e.g. portaled
  Dialog content), adapt the harness rather than treating it as a blocker.
- No unit tests — verification is visual via the harness. Add registry entries as components are built.
  Keep saving durable, non-obvious learnings to agent memory.

## Workflow rules

- **Visual verification is required for components.** Build the component, render it in *both* galleries
  (`src/App.tsx` and `tools/blueprint-reference/src/App.tsx`) — register it in each `COMPONENTS` array under
  the same `id`, and tag key specimens with matching `data-compare` keys. Then run `tools/compare.sh <id>`
  to screenshot **and** computed-style-diff against Blueprint (both themes) before calling a component done.
  Prefer this over driving Chrome by hand.
- **Write a handoff at the end of every loop** in `docs/handoffs/` (see `TEMPLATE.md`) — one per component,
  numbered. The newest bootstraps the next session.
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
