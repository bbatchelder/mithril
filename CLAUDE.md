# mithril — agent guide

mithril is a **modern, owned-source component library / design system** — ~60 components on React 19 +
Tailwind v4 + Radix + CVA, distributed shadcn-style (consumers copy and **own** the source). Read
[`README.md`](README.md) for the full story; it's the source of truth for direction and scope.

> **History.** mithril began as an autonomous-agent experiment: a long-horizon loop built the whole
> component surface top-down, with no human reading the code, judged only against Blueprint v6.15's
> pixels. That phase is **complete** — every [`docs/experiment/ROADMAP.md`](docs/experiment/ROADMAP.md) item is built. The
> loop's rules (branch-per-phase, handoff-per-component, "pause only on hard blockers") are **retired**
> and live in [`docs/experiment/`](docs/experiment) for the record. The repo is now a maintained personal
> design system, evolving by ordinary engineering.

## Blueprint is the baseline, not the spec

This is the single most important reframe from the experiment era. Pixel-fidelity to Blueprint v6.15 was
the *acceptance test for the original build* — an objective pass/fail signal for the loop. It is **not**
the ongoing goal:

- mithril does **not** track Blueprint's evolution and is **not** trying to match future Blueprint releases.
- The design language is **expected to diverge** from Blueprint — absorbing ideas from other systems and
  adding original ones (mobile-friendliness, charts, mapping; see README "Direction").
- So: **new or changed components have no Blueprint target to hit.** Use the comparison harness when you
  *want* to check fidelity of an existing component or stay coherent with the baseline — not as a gate
  you must pass. The visual coherence that matters now comes from `src/styles/tokens.css`, not from
  Blueprint parity.

## Stack & distribution

- **Stack:** React 19 · TypeScript · Vite · Tailwind v4 (CSS-first `@theme`) · Radix primitives · CVA.
- **Distribution:** shadcn-style — consumers own the component source, pulled via the served registry
  (`https://bbatchelder.github.io/mithril/r/`). `registry.json` is generated from source with
  `pnpm gen:registry`; the published items are built with `pnpm build:registry`.

## Key locations

- `src/styles/tokens.css` — the design foundation (palette, intents, surfaces, elevation, type, motion).
  Originally ported 1:1 from Blueprint's DTCG tokens; now the source of mithril's *own* visual coherence.
  Semantic tokens are **derived at runtime from a small seed set** (intent vars + gray ramp) via
  `oklch(from …)` / `color-mix()`, with static `@supports` fallbacks — overriding a seed on `<html>`
  re-tints the whole theme. See [`docs/theming.md`](docs/theming.md).
- `src/components/ui/` — the owned components (CVA + Radix). No third-party icon dep: the **full Blueprint
  icon set (706 glyphs) is generated** by `tools/gen-icons.mjs` (re-run to refresh) into
  `src/components/ui/icons/`. `index.ts` holds **one `export const <camelName>: IconGlyph` per glyph**, so
  a bundler ships only the glyphs you import (`import { add } from ".../icons"; <Icon icon={add} />`
  tree-shakes). The dynamic string form (`<Icon icon="add" />`) resolves through a **registry**
  (`registry.ts`): call `registerIcons(ICON_GLYPHS)` from `icons/all.ts` for all glyphs, or a subset.
  Components import their own structural glyphs as objects so they render standalone. `ICON_GLYPHS` lives
  in `all.ts` and must stay typed `Record<IconName, IconGlyph>` (explicit union, **never** `as const`) or
  it hits TS2590.
- `src/App.tsx` — the app shell (`pnpm dev` → :5173). The root is a **landing app gallery**; hash-routed
  into one of: the **Component Showcase** (`#showcase` / `#showcase/<id>`, a top app bar over an
  IBM-Carbon-style tiled overview grouped by category, each tile deep-linking to a component page) or a
  demo app (`#soc`, `#board`, `#mission`). There is **no persistent global sidebar** — each app owns its
  full width and carries its own chrome (back-to-gallery + theme chooser) via `<AppChromeControls>` from
  `src/lib/app-chrome.tsx`. Each overview tile carries badges (test count + a11y/keyboard/behavior split,
  axe-audited, server-renderable vs client, portals/Radix/asChild traits, compound-export count) sourced
  from `src/components/ui/component-meta.generated.ts` — re-run `pnpm gen:meta`
  (`tools/gen-component-meta.mjs`) after adding components or tests. A component's page also shows a
  props/API table from `component-props.generated.ts` (`pnpm gen:props`, via react-docgen-typescript).
  Each app keeps its **own** palette +
  light/dark independently. Isolated harness mode (`?component=<id>`) is unchanged. Demo apps live under
  `src/demos/` and are registered in `src/demos/registry.ts` (each entry carries an `icon` for its card).
- `src/components/ui/__tests__/` — Vitest + Testing Library behavior/keyboard/ARIA tests (`pnpm test`).
  Visual fidelity is verified via the harness, not unit tests.
- `tools/compare.sh` + `tools/comparison/` — the comparison harness: screenshots **and** computed-style
  diffs a component against an isolated `@blueprintjs/core@6.15` reference gallery
  (`tools/blueprint-reference/`, on React 18) in both themes. A fidelity *tool*, no longer a required gate.
- Blueprint source clone (the original design spec, v6.15, Apache-2.0): clone `palantir/blueprint` locally
  and point `$BLUEPRINT_SRC` at it (defaults to `../blueprint`).
- `docs/experiment/` — the archived experiment: its narrative, the agent guide that governed the loop,
  `handoffs/` (the session-to-session continuity record), and `ROADMAP.md` (the completed build checklist
  + a "post-parity tail" of open items). Archival, not how work is tracked now.
- `.claude/skills/mithril/` — the repo-coupled **composition skill**: `SKILL.md` (mental model + index)
  and `reference/` recipes (overlays, foundations, forms, data, dates). Teaches how to *compose* these
  components correctly (the gotchas the types don't reveal). When you discover a new composition gotcha,
  add it here — overlays is the worked exemplar; the others are seeded and meant to grow.

## Working model

Ordinary engineering — the autonomous loop is over:

- **Branch off `main`, build, verify, open a PR.** No phase branches, no per-component handoffs, no
  "build the next unchecked roadmap item." Work is driven by intent (the author's apps, the Direction
  list), not by a fixed checklist.
- **Human review is back in scope.** "No human reads the code" described the *experiment artifact*; it
  does **not** govern new work. Write code that reads like the surrounding code and expect it to be read.
- **Verification before merge:** `pnpm build` green (typecheck + vite) and `pnpm test` green. When a
  change touches an existing component's visuals and you want to confirm it still matches the baseline,
  run `tools/compare.sh <id>`; for net-new or intentionally-divergent design, eyeball it in the gallery
  in both themes instead.
- **Register new components in the gallery** (`src/App.tsx`) and add a `registry.json` entry
  (`pnpm gen:registry`) so they're owned-source distributable. Auto-install deps as needed and note them.

## Durable gotchas

- **Tailwind v4 tree-shakes unused `@theme` vars.** Reference tokens via *literal* utility classes
  (`bg-blue-3`, `shadow-elevation-2`, `ease-bp`), **not** runtime `var()` in inline styles — those get
  dropped. Tokens declared in plain `:root {}` (e.g. `--elevation-0..4`) are always emitted.
- **Icons:** keep `ICON_GLYPHS` typed as `Record<IconName, IconGlyph>` (never `as const`) to avoid TS2590.
  Names that camelCase to JS reserved words get an `Icon` suffix (`delete`→`deleteIcon`, also
  export/function/import/package/switch).
- Dark mode is class-based: `.dark` (or `[data-mode="dark"]`) on an ancestor swaps the semantic vars.
- Commit messages end with the Co-Authored-By trailer. Branch before committing if on `main`.

## Direction (where this is going)

From the README's roadmap — pursued in service of the author's own apps, not a product backlog:

- **Mobile.** Evolve components/tokens to be genuinely mobile-friendly (a deliberate departure from
  Blueprint's desktop-only language).
- **Charts & mapping.** Pull in and theme a charting library and a mapping library as first-class,
  on-system citizens (the *Mission Control* demo already exercises MapLibre).
- **A coupled agent skill → a self-describing design system.** A repo-coupled agent skill now lives
  at `.claude/skills/mithril/` and teaches agents how to compose these components correctly — making
  the repo self-describing (source + composition instructions in one place). First cut: full scaffold
  with a deep "overlays" slice; the forms/data/dates references are seeded and meant to grow as new
  composition gotchas surface.

## Commands

```bash
pnpm dev          # component gallery at :5173
pnpm build        # typecheck (tsc -b) + vite build
pnpm typecheck
pnpm test         # Vitest behavior/keyboard/ARIA suite
cd tools/blueprint-reference && pnpm dev   # Blueprint v6.15 reference gallery at :5174

pnpm gen:icons       # regenerate the 706-glyph icon map from tools/gen-icons.mjs
pnpm gen:meta        # regenerate per-component showcase badge metadata (tests/RSC/portal/radix)
pnpm gen:props       # regenerate per-component props/API tables (react-docgen-typescript)
pnpm gen:registry    # regenerate registry.json from src/components/ui
pnpm build:registry  # build the published shadcn registry items into dist/r

tools/compare.sh button        # screenshot + computed-style diff vs Blueprint (both themes)
tools/compare.sh button dark   # ...one theme only (light|dark|both)
```
