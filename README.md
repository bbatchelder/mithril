# analyst-ui

A modern, **pixel-faithful** reimplementation of [Palantir Blueprint](https://github.com/palantir/blueprint)'s
design language — rebuilt from scratch on a contemporary foundation, then distributed shadcn-style so you
**own the component source**.

- **React 19** + TypeScript
- **Tailwind v4** (CSS-first `@theme`) + **CVA** for variants
- **Radix UI** primitives under the overlay/positioning components (Dialog, Drawer, Alert, Popover, Tooltip, Toast, Slider, ContextMenu); the rest are hand-rolled on native elements
- **No runtime icon dependency** — the full Blueprint icon set (706 glyphs) is vendored
- Distributed **shadcn-style**: you copy and **own** the component source, not pull in a black-box package

Blueprint is treated as a **design spec, not a code source**. We port its visual DNA — color, density,
elevation, typography, motion — precisely, then re-implement every component with a clean, modern API.
The legacy SCSS/BEM machinery is left behind entirely.

> 🔗 **Live demo:** https://bbatchelder.github.io/analyst-ui/
>
> Ported tokens derive from Blueprint (Apache-2.0). See [`LICENSE`](./LICENSE) and [`NOTICE`](./NOTICE) for attribution.

## Status

Every component on the [build roadmap](./docs/ROADMAP.md) is implemented — **~56 components** across
`core`, `select`, and `datetime`, each diffed against Blueprint v6.15 with a computed-style **and**
screenshot harness in both light and dark themes. See [`docs/handoffs/`](./docs/handoffs/) for the
per-session build history.

**Visual fidelity is the verified strength.** What it does *not* yet cover: behavior is not unit-tested
(verification is visual only), and a few hand-rolled components have known keyboard/ARIA gaps. We'd rather
be straight about that than oversell — so before adopting, read the honest comparison below.

### Honest comparison vs. Blueprint

- **[analyst-ui vs. Blueprint — an honest appraisal](./docs/comparison-vs-blueprint.md)** — an
  evidence-backed look at where each library wins, its limitations, and a decision guide for *which to
  pick for your project*.
- **[Roadmap to a hands-down recommendation](./docs/blueprint-parity-roadmap.md)** — the prioritized plan
  to close every gap (accessibility, tests, completeness, distribution).

In one line: analyst-ui wins the **authoring experience** (cleaner API, ~16.6 KB CSS, lean deps, owned
source, React 19); Blueprint still wins on **engineering maturity** (out-of-the-box accessibility,
breadth — incl. a data grid — and a real test suite). Choose accordingly.

## Component catalog

| Group | Components |
| --- | --- |
| **Buttons & display** | Button · Card · Icon · Text · Divider · Spinner · ProgressBar · Skeleton · Tag · Callout |
| **Form controls** | InputGroup · TextArea · Checkbox · Radio / RadioGroup · Switch · Label + FormGroup · ControlGroup · HTMLSelect · FileInput · NumericInput · SegmentedControl · ControlCard |
| **Overlays** | Dialog · Alert · Drawer · Popover · Tooltip · Toast · Menu · ContextMenu |
| **Navigation & structure** | Navbar · Tabs · Collapse · Section · CardList · Breadcrumbs · Tree · PanelStack · HTMLTable · EditableText · EntityTitle · NonIdealState · Link · Slider · Hotkeys |
| **Composite selects** | TagInput · Select · Suggest · MultiSelect · Omnibar |
| **Date & time** | TimePicker · DatePicker · DateInput · DateRangePicker · DateRangeInput · TimezoneSelect |

## Getting started (run the gallery)

```bash
pnpm install
pnpm dev        # component gallery at http://localhost:5173
pnpm build      # typecheck + production build
pnpm typecheck
```

The gallery groups every component by category in a sidebar. Toggle light/dark from the header; deep-link to
any component with a URL hash (e.g. `#button`).

### Example apps

Beyond the per-component gallery, the **Demos** toggle in the sidebar shows full example applications that
compose the owned components into realistic product UIs (deep-link with `#demo-<id>`):

- **SOC Console** (`#demo-soc`) — a security-operations analyst console: alert queue table, investigation
  drawer with tabs, filters, and toasts.
- **Project Board** (`#demo-board`) — a kanban board with drag-and-drop between columns, label/assignee
  filtering, a new-task dialog, and an inline-editable task detail panel.
- **Mission Control** (`#demo-mission`) — *Skylark*, a drone-swarm operations console with **live streaming
  data**: a [MapLibre](https://maplibre.org/) basemap (via mapcn-style CARTO tiles, no API key) shows drones
  moving along patrol routes while telemetry and events stream in from a seeded, deterministic mock-data
  engine. Exercises the structural slice of the library — `Tree`, `Section`, `CardList`, `Skeleton`,
  `Breadcrumbs`, `PanelStack` — plus demo-local SVG sparklines and gauges. The only demo with a runtime
  dependency (`maplibre-gl`) and network calls (map tiles).

Each demo lives under `src/demos/<slug>/` and is registered in `src/demos/registry.ts`.

## Using the components

analyst-ui follows the shadcn model: you copy the source into your own project and own it from then on.

> **Prerequisite:** the components are styled with Tailwind v4 utility classes and are inert without it —
> your project must be on **Tailwind v4**. This is a deliberate trade (see the
> [appraisal](./docs/comparison-vs-blueprint.md)); if you need framework-agnostic drop-in CSS, that's a
> reason to prefer Blueprint.

### Install via the shadcn registry (recommended)

The registry is hosted at **`https://bbatchelder.github.io/analyst-ui/r/`** — one entry per component,
with its npm `dependencies` and cross-component `registryDependencies` (e.g. `Select` pulls in `Popover`,
`Menu`, and `InputGroup`; everything pulls in the design tokens + `cn`) resolved automatically. Two ways
to install — both fetch transitive dependencies for you:

```bash
# 1. Direct URL — zero config:
npx shadcn@latest add https://bbatchelder.github.io/analyst-ui/r/button.json
```

```jsonc
// 2. Namespaced — add this once to your components.json…
{
  "registries": {
    "@analyst-ui": "https://bbatchelder.github.io/analyst-ui/r/{name}.json"
  }
}
```

```bash
# …then install by short name (and tab-complete the rest):
npx shadcn@latest add @analyst-ui/button @analyst-ui/select
```

> The components are styled with Tailwind v4 — make sure `@import "tailwindcss";` is in your CSS before
> adding components (the `tokens` style is pulled in automatically as a dependency).

### Or copy the source by hand

The registry is just a convenience over copying files — you own the source either way:

1. Copy [`src/styles/tokens.css`](./src/styles/tokens.css) into your project and `@import` it after Tailwind:
   ```css
   @import "tailwindcss";
   @import "./styles/tokens.css";
   ```
2. Copy the `cn` helper ([`src/lib/utils.ts`](./src/lib/utils.ts)) — most components import it.
3. Copy the component file(s) you want from [`src/components/ui/`](./src/components/ui/) and install their
   peer deps (each component's npm + cross-component dependencies are listed in
   [`registry.json`](./registry.json), regenerated from source with `pnpm gen:registry`).

## Design tokens

[`src/styles/tokens.css`](./src/styles/tokens.css) is the heart of the visual fidelity. It follows the
shadcn + Tailwind v4 pattern:

1. **`@theme`** — static primitives that generate Tailwind utilities:
   - Full Blueprint palette (`gray`, `blue`, `green`, … `violet` × 1–5) → `bg-blue-3`, `text-gray-1`, …
   - Theme-independent intents → `bg-primary`, `bg-success`, `bg-warning`, `bg-danger` (+ `-hover`/`-active`/`-disabled`/`-foreground`)
   - Type scale (`text-body`, `text-heading-lg`, `text-code`, …), `font-sans` / `font-mono`
   - Radius (`rounded-bp`), easing (`ease-bp`, `ease-bp-bounce`)
2. **`:root` / `.dark`** — semantic variables that swap per theme: `--background`, `--surface`, `--elevated`,
   `--foreground(-muted/-disabled)`, `--border(-strong)`, `--divider`, `--ring`, elevation shadows, input shadow.
3. **`@theme inline`** — maps the semantic vars onto Tailwind tokens: `bg-background`, `bg-surface`,
   `text-foreground`, `border-border`, `shadow-elevation-{0..4}`, etc.

Palette, intents, type, radius, motion, and elevation shadows are ported **1:1** from Blueprint's DTCG token
set and SCSS variables. Dark surface colors were verified against Blueprint's OKLCH-derived values.

> Note: those OKLCH-derived dark values are currently **baked as resolved literals** (frozen to Blueprint
> v6.15) rather than computed at runtime. Runtime re-derivable theming and `@supports` fallbacks for the
> raw `oklch()`/`color-mix()` usages are on the [roadmap](./docs/blueprint-parity-roadmap.md) (P2.5–P2.6).

> **Tailwind v4 tree-shakes unused `@theme` vars.** Reference tokens via *literal* utility classes
> (`bg-blue-3`, `shadow-elevation-2`, `ease-bp`), not runtime `var()` in inline styles — those get dropped.

## Dark mode

Class-based: put `.dark` on an ancestor (a `@custom-variant dark` is declared in the tokens). The semantic
CSS variables swap automatically; components built on token utilities follow along.

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
  comparison-vs-blueprint.md    honest appraisal vs Blueprint (when to pick which)
  blueprint-parity-roadmap.md   prioritized plan to close the gaps
  fidelity-audit-2026-05-27.md  the fidelity audit
  handoffs/                     per-session build history
tools/
  gen-icons.mjs       regenerate the icon glyph map
  gen-registry.mjs    regenerate registry.json from source
  rewrite-registry-urls.mjs  post-process built items → URL deps (pnpm build:registry)
  compare.sh          screenshot + computed-style diff vs Blueprint
  blueprint-reference/  isolated Blueprint v6.15 gallery for side-by-side comparison
  comparison/         the comparison harness internals
```

## Fidelity verification

Components aren't "done" by eyeballing — each is diffed against the real Blueprint. `tools/compare.sh <id>`
spins up this gallery and a reference [`@blueprintjs/core@6.15`](./tools/blueprint-reference) gallery,
screenshots matched specimens, and reports a computed-style diff in both themes. See
[`tools/comparison/README.md`](./tools/comparison/README.md).

## Known limitations

Being upfront (full detail + the fix plan are in the [appraisal](./docs/comparison-vs-blueprint.md) and
[roadmap](./docs/blueprint-parity-roadmap.md)):

- **No test suite.** Verification is visual (fidelity harness) only — there are no unit/behavior tests, so
  keyboard/ARIA regressions aren't guarded. Owning the source means you inherit this.
- **Accessibility gaps in hand-rolled components.** Radix-backed overlays + native form controls are solid,
  but **Tabs** (no keyboard nav), **Menu**, the **Select/Suggest/MultiSelect/Omnibar** family (no combobox
  ARIA), and **ContextMenu** (no arrow-key/submenu nav) need work; **Hotkeys** is display-only (no binding
  engine).
- **Missing capabilities.** No data grid (Blueprint's `Table2` has no equivalent — `HTMLTable` is styling
  only).
- **Icons don't tree-shake.** All 706 glyphs are one static map; importing `Icon` pulls them all (~195 KB
  gzip) unless you trim the map by hand.
- **Tailwind v4 required** and **tokens are frozen** to Blueprint v6.15 (see above).

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md). In short: match Blueprint's visuals exactly, design a clean
modern API (not drop-in compatible), verify with the comparison harness, and keep `registry.json` in sync
via `pnpm gen:registry`.

## License

[Apache-2.0](./LICENSE). Design tokens and visual design are ported from Palantir Blueprint (Apache-2.0);
component implementations are original work. See [`NOTICE`](./NOTICE).
