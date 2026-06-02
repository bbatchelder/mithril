# mithril

**An experiment in agent-mediated development: humans set intent and architecture and judge the result; agents write and test the code; no human reviews the diffs.**

The test case - reproduce [Palantir Blueprint](https://github.com/palantir/blueprint)'s look and feel as a modern, owned-source component library - was chosen because pixel fidelity is *objectively measurable*, which turns a fuzzy "build a nice UI kit" goal into a hard pass/fail signal an autonomous loop can run against over a long horizon.

The artifact that came out the other end (~60 components on React 19 + Tailwind v4) worked well enough that it's now the seed of a personal design system. So this repo is two things at once: **a record of the experiment**, and **the baseline for where the design language goes next**.

> 🔗 **Live demo:** <https://bbatchelder.github.io/mithril/>

---

## The experiment

This was a test of how far a long-horizon **goal loop** — Claude Code driving Claude Opus 4.8 — could carry a single large, well-specified task with the human deliberately kept out of the code.

**The development model.** The division of labor is the whole point:

- **Humans** describe what they want, brainstorm and plan with the agents, and make the **final architectural decisions** (architecture is brainstormed jointly; the human makes the call). Humans also do the final QA — but *only* on look, feel, and behavior.
- **Agents** write the code, write the tests, run the harness, and self-correct against it.
- **No human reads the implementation code.** Not the diffs, not the structure, not the idiom.

That boundary is the experiment, and it's worth being exact about which guarantees exist and which were deliberately waived:

- **Guarded (measured):** behavior and appearance. A 336-test Vitest + Testing Library suite (keyboard/ARIA/behavior across 33 files), axe-core smoke audits in both themes, and a computed-style **+** screenshot diff harness against Blueprint v6.15.
- **Waived (by design):** human review of the code itself — its architecture, readability, internal quality. A human helped *decide* the architecture and signed off on how things look and behave; a human never audited *how the code is written*.

**Why Blueprint, why pixel-faithful.** Fidelity was the **acceptance criterion**. "Make a good component library" can't fail a test; "match Blueprint v6.15's computed styles and rendered pixels" can. Choosing an objectively-verifiable target is what made the loop falsifiable: either the agents hit the measured target across 171 commits with no human reading the code, or they didn't. The comparison harness (`tools/compare.sh`) is the **reward function** that kept the loop honest.

**The meta-experiment: running such a project at all.** Separate from "can agents build it" is "how do you *set up* a project like this" — the workflow, the guardrails, and especially **continuity across sessions**. A long task outlives any single context window, so each work session hands off to the next through a written record. That's what [`docs/handoffs/`](docs/handoffs) is: not incidental build notes, but the artifact of how the session-to-session continuity problem was actually solved.

**A note on the controversy.** "Agents wrote it, no human read it" is a polarizing claim, and this README isn't going to argue the philosophy. The posture is just to be precise: here is exactly where human judgment enters (intent, architecture, look/feel/behavior QA), here is exactly what's measured (behavior, appearance) and what isn't (code-level review), and here is a working artifact and the harness that judged it. Draw your own conclusions from the evidence.

---

## What it produced

The result is a modern, owned-source library that reproduces Blueprint's visual DNA — color, density, elevation, typography, motion, but on a contemporary stack:

- **React 19** + TypeScript
- **Tailwind v4** (CSS-first `@theme`) + **CVA** for variants
- **Radix UI** primitives under the overlay/positioning and tablist components (Dialog, Drawer, Alert, Popover, Tooltip, Toast, Slider, Tabs, ContextMenu); the rest are hand-rolled on native elements
- **TanStack Table** + **TanStack Virtual** under the `DataTable` grid (virtualized rows, selection, resize/reorder, editable cells)
- **No runtime icon dependency** — the full Blueprint icon set (706 glyphs) is vendored and tree-shakes per glyph
- Distributed **shadcn-style**: you copy and **own** the component source, not pull in a black-box package

**Blueprint is the baseline, not the spec.** This is where mithril diverges sharply from a clone. The project is **not** tracking Blueprint's evolution and is **not** trying to stay faithful to future Blueprint releases. v6.15 was the measurable target for the experiment; from here it's a starting point to evolve from, absorbing ideas from other design systems and adding original ones. Fidelity to Blueprint was the *acceptance test for the build*, and it is expected (intended, even) to decay as the design language becomes its own thing.

> *On the name.* Continuing Palantir's Tolkien homage: mithril is **light** (this library aims to be a far lighter dependency than Blueprint — especially the CSS) and **malleable yet strong** — it can be beaten into new shapes without losing integrity, which is exactly the shadcn own-the-source bet: fork it, reshape it into your own language, and it doesn't fall apart. (In the legend it's also mined from a single source and then worked by many hands into many forms — a fitting image for one Blueprint-derived baseline, reforged by many agents.)

---

## Direction

Where this is headed (roadmap items, pursued in service of the author's own apps — not a product backlog with delivery promises):

- **Mobile.** Blueprint is expressly a desktop design language. A core goal here is to evolve the components and tokens so they're genuinely mobile-friendly — a deliberate departure from the baseline.
- **Charts & graphs.** Pull in a charting/graphing library and style/theme it to match, so data viz is a first-class, on-system citizen rather than a bolt-on.
- **Mapping.** Same treatment for a mapping library (the *Mission Control* demo already exercises MapLibre; the goal is a properly themed, on-system mapping story).
- **A coupled agent skill → a self-describing design system.** An agent skill is in development, tightly coupled to this repo, that teaches agents how to employ these components *correctly*. This is the natural endpoint of the experiment's own premise: an agent built this, so agents should be first-class consumers of it. The components plus the skill make the repo **self-describing** — the same place that holds the source also holds the instructions for composing it correctly. The skill will land in (or be linked from) this repo before any wider launch.

---

## Status & honest scope

Every component on the [build roadmap](docs/ROADMAP.md) is implemented — **~60 components** across `core`, `select`, and `datetime` (plus a virtualized `DataTable` grid), each diffed against Blueprint v6.15 with a computed-style **and** screenshot harness in light and dark themes.

Being upfront about exactly what this is:

- **Personal project, single author, no support.** This was built for the author's own use. There's no support commitment, the API may churn, and the design language will intentionally drift away from Blueprint over time. Please don't file bugs expecting a maintained product.
- **Code is unreviewed by humans, by design.** See the experiment section — this is the premise, not an oversight. Correctness/behavior are test-guarded; code-level quality was never human-audited.
- **Younger and single-author vs. Blueprint.** Blueprint has years of production hardening, broader edge-case coverage, and `npm`-delivered bug/security fixes. The shadcn ownership model means *you* maintain copied source, with no upstream pushing fixes.
- **Tests are real but not exhaustive.** 336 keyboard/ARIA/behavior tests + axe smokes + the visual harness guard the common paths; they don't blanket every component and branch the way Blueprint's larger corpus does.
- **A few inherited Blueprint contrast deltas.** Some muted/disabled tones (the file-input prompt ~2.45:1 light / 3.75:1 dark; a Tree muted label ~4.2:1) were ported exactly from Blueprint and inherit its sub-AA contrast. These were conscious fidelity choices for the experiment; owning the source lets you darken the token if you need strict AA — and the move *away* from Blueprint is exactly where these get fixed.
- **Tailwind v4 required.** Components are styled with Tailwind v4 utility classes and are inert without it. Deliberate trade (it buys the tiny CSS and the token system); if you need framework-agnostic drop-in CSS, that's a reason to prefer Blueprint.
- **Data grid is newer than Blueprint's.** `DataTable` (TanStack-backed: row virtualization, selection, resize/reorder, editable cells, keyboard/clipboard) covers the common ground; Blueprint's `Table2` is a far larger, more battle-tested grid (column virtualization, frozen rows/cols).

> **How this relates to its Blueprint baseline** — a detailed, evidence-backed breakdown of where mithril and Blueprint each land (API, theming, bundle, a11y, fidelity method, the ownership trade) lives in [`docs/comparison-vs-blueprint.md`](docs/comparison-vs-blueprint.md). It's framed as "how the baseline differs," not "which library you should adopt."

---

## Preview

The component gallery — light and dark themes (`pnpm dev`, or the [live demo](https://bbatchelder.github.io/mithril/)):

[![mithril component gallery — light theme](docs/assets/gallery-light.png)](docs/assets/gallery-light.png) [![mithril component gallery — dark theme](docs/assets/gallery-dark.png)](docs/assets/gallery-dark.png)

### Demo apps

Three full applications built entirely with mithril (in the gallery under the **Demos** tab) — proof the components compose into real product UIs:

| [SOC Console](https://bbatchelder.github.io/mithril/#demo-soc) | [Project Board](https://bbatchelder.github.io/mithril/#demo-board) | [Mission Control](https://bbatchelder.github.io/mithril/#demo-mission) |
| --- | --- | --- |
| [![SOC Console demo](docs/assets/demo-soc.png)](docs/assets/demo-soc.png) | [![Project Board demo](docs/assets/demo-board.png)](docs/assets/demo-board.png) | [![Mission Control demo](docs/assets/demo-mission.png)](docs/assets/demo-mission.png) |
| Security-alert triage console | Kanban project board | Live drone-swarm telemetry + MapLibre map |

---

## Component catalog

| Group | Components |
| --- | --- |
| **Buttons & display** | Button · ButtonGroup · AnchorButton · Card · Icon · Text · Divider · Spinner · ProgressBar · Skeleton · Tag · Callout |
| **Form controls** | InputGroup · TextArea · Checkbox · Radio / RadioGroup · Switch · Label + FormGroup · ControlGroup · HTMLSelect · FileInput · NumericInput · SegmentedControl · ControlCard |
| **Overlays** | Dialog · MultistepDialog · Alert · Drawer · Popover · Tooltip · Toast · Menu · ContextMenu |
| **Navigation & structure** | Navbar · Tabs · Collapse · Section · CardList · Breadcrumbs · Tree · PanelStack · HTMLTable · DataTable · EditableText · EntityTitle · NonIdealState · Link · Slider · Hotkeys |
| **Composite selects** | TagInput · Select · Suggest · MultiSelect · Omnibar |
| **Date & time** | TimePicker · DatePicker · DateInput · DateRangePicker · DateRangeInput · TimezoneSelect |

---

## Getting started (run the gallery)

```
pnpm install
pnpm dev        # component gallery at http://localhost:5173
pnpm build      # typecheck + production build
pnpm typecheck
```

The gallery groups every component by category in a sidebar. Toggle light/dark from the header; deep-link to any component with a URL hash (e.g. `#button`).

### Example apps

Beyond the per-component gallery, the **Demos** toggle shows full example applications that compose the components into realistic product UIs (deep-link with `#demo-<id>`):

- **SOC Console** (`#demo-soc`) — a security-operations console: alert queue table, investigation drawer with tabs, filters, and toasts.
- **Project Board** (`#demo-board`) — a kanban board with drag-and-drop between columns, label/assignee filtering, a new-task dialog, and an inline-editable task detail panel.
- **Mission Control** (`#demo-mission`) — *Skylark*, a drone-swarm operations console with **live streaming data**: a [MapLibre](https://maplibre.org/) basemap (CARTO tiles, no API key) shows drones moving along patrol routes while telemetry and events stream from a seeded, deterministic mock-data engine. Exercises the structural slice — `Tree`, `Section`, `CardList`, `Skeleton`, `Breadcrumbs`, `PanelStack` — plus demo-local SVG sparklines and gauges. The only demo with a runtime dependency (`maplibre-gl`) and network calls (map tiles).

Each demo lives under `src/demos/<slug>/` and is registered in `src/demos/registry.ts`.

---

## Using the components yourself

You're welcome to. This was built for the author, but if it's useful to you, please use it, fork it, reshape it — that's what owning the source is for. Just go in with the honest deal above: it's a personal, single-author, no-support project whose design language will diverge from Blueprint over time.

mithril follows the shadcn model: you copy the source into your own project and own it from then on.

> **Prerequisite:** the components are styled with Tailwind v4 utility classes and are inert without it — your project must be on **Tailwind v4**.

### Install via the shadcn registry (recommended)

The registry is hosted at **`https://bbatchelder.github.io/mithril/r/`** — one entry per component, with its npm `dependencies` and cross-component `registryDependencies` (e.g. `Select` pulls in `Popover`, `Menu`, and `InputGroup`; everything pulls in the design tokens + `cn`) resolved automatically.

```
# 1. Direct URL — zero config:
npx shadcn@latest add https://bbatchelder.github.io/mithril/r/button.json
```

```
// 2. Namespaced — add this once to your components.json…
{
  "registries": {
    "@mithril": "https://bbatchelder.github.io/mithril/r/{name}.json"
  }
}
```

```
# …then install by short name (and tab-complete the rest):
npx shadcn@latest add @mithril/button @mithril/select
```

> Make sure `@import "tailwindcss";` is in your CSS before adding components (the `tokens` style is pulled in automatically as a dependency).

### Or copy the source by hand

The registry is just a convenience over copying files — you own the source either way:

1. Copy [`src/styles/tokens.css`](src/styles/tokens.css) into your project and `@import` it after Tailwind:

   ```
   @import "tailwindcss";
   @import "./styles/tokens.css";
   ```

2. Copy the `cn` helper ([`src/lib/utils.ts`](src/lib/utils.ts)) — most components import it.
3. Copy the component file(s) you want from [`src/components/ui/`](src/components/ui) and install their peer deps (each component's npm + cross-component dependencies are listed in [`registry.json`](registry.json), regenerated with `pnpm gen:registry`).

---

## Design tokens

[`src/styles/tokens.css`](src/styles/tokens.css) is the heart of the visual fidelity, following the shadcn + Tailwind v4 pattern:

1. **`@theme`** — static primitives that generate Tailwind utilities: full Blueprint palette (`gray`, `blue`, … `violet` × 1–5) → `bg-blue-3`, `text-gray-1`; theme-independent intents → `bg-primary`, `bg-success`, `bg-warning`, `bg-danger` (+ `-hover`/`-active`/`-disabled`/`-foreground`); type scale (`text-body`, `text-heading-lg`, `text-code`), `font-sans`/`font-mono`; radius (`rounded-bp`), easing (`ease-bp`, `ease-bp-bounce`).
2. **`:root` / `.dark`** — semantic variables that swap per theme: `--background`, `--surface`, `--elevated`, `--foreground(-muted/-disabled)`, `--border(-strong)`, `--divider`, `--ring`, elevation shadows, input shadow.
3. **`@theme inline`** — maps the semantic vars onto Tailwind tokens: `bg-background`, `bg-surface`, `text-foreground`, `border-border`, `shadow-elevation-{0..4}`.

Palette, intents, type, radius, motion, and elevation shadows are ported **1:1** from Blueprint's DTCG token set and SCSS variables; dark surface colors were verified against Blueprint's OKLCH-derived values.

> **Runtime-derivable & themeable.** Semantic tokens are derived at runtime from a small **seed** set (the four intent vars + the gray ramp) via CSS relative-color `oklch(from …)` / `color-mix()`, mirroring Blueprint's DTCG `derive` offsets — so overriding a seed on `<html>` re-tints the whole theme in both light and dark. Every derived value ships a static-literal `@supports` fallback. A worked example theme (`[data-theme="datex"]`) is wired into the gallery; see [`docs/theming.md`](docs/theming.md).

> **Tailwind v4 tree-shakes unused `@theme` vars.** Reference tokens via *literal* utility classes (`bg-blue-3`, `shadow-elevation-2`, `ease-bp`), not runtime `var()` in inline styles — those get dropped.

---

## Dark mode

Class-based: put `.dark` (or `[data-mode="dark"]`) on an ancestor (a `@custom-variant dark` is declared in the tokens). The semantic CSS variables swap automatically; components built on token utilities follow along.

---

## Project structure

```
src/
  components/ui/      the owned components (CVA + Radix)
  components/ui/icons/index.ts   706 Blueprint glyphs (generated by tools/gen-icons.mjs)
  styles/tokens.css   the design foundation
  styles/globals.css  Tailwind entry + animation keyframes + base layer
  lib/utils.ts        the cn() class-merge helper
  App.tsx             the gallery
docs/
  ROADMAP.md                    the component checklist (build order)
  comparison-vs-blueprint.md    how this differs from its Blueprint baseline
  theming.md                    the runtime-derivable, seed-based token system
  fidelity-audit-2026-05-27.md  the fidelity audit
  handoffs/                     the experiment's session-to-session continuity record
tools/
  gen-icons.mjs       regenerate the icon glyph map
  gen-registry.mjs    regenerate registry.json from source
  rewrite-registry-urls.mjs  post-process built items → URL deps (pnpm build:registry)
  compare.sh          screenshot + computed-style diff vs Blueprint (the loop's reward harness)
  blueprint-reference/  isolated Blueprint v6.15 gallery for side-by-side comparison
  comparison/         the comparison harness internals
```

---

## Fidelity verification

Each component was diffed against the real Blueprint, which is what gave the goal loop its pass/fail signal. `tools/compare.sh <id>` spins up this gallery and a reference [`@blueprintjs/core@6.15`](tools/blueprint-reference) gallery, screenshots matched specimens, and reports a computed-style diff in both themes. See [`tools/comparison/README.md`](tools/comparison/README.md).

---

## License

[Apache-2.0](LICENSE). Design tokens and visual design are ported from Palantir Blueprint (Apache-2.0); component implementations are original work. See [`NOTICE`](NOTICE).