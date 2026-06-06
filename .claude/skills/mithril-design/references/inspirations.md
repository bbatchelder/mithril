# Inspirations

mithril's dense-operator aesthetic is a **synthesis of several sources**, not a clone of any one. This
file maps what each contributes and how far to lean on it, and indexes the register deep-dives. The
list is expected to grow as new inspirations get mined into concrete, reusable rules.

## How to use an inspiration

Two postures, depending on the source:

- **Derive concrete specs** (tokens, densities, conventions) only from **open-source / openly-licensed**
  systems. These can be referenced precisely and pulled into mithril's defaults.
- **Read for register only** — observe the *feel*, never reproduce specifics — for **proprietary
  products** (terminals, intelligence/defense tools). Capture the mood; don't copy the chrome.

Keep that distinction explicit in any new reference. mithril is its own system: even when a deep-dive
derives values from an open source, **render the chrome in mithril's tokens** (see
[visual-foundations.md](visual-foundations.md)), not the inspiration's fonts/accent.

## The backbone

mithril *is* the design system here — its tokens (`src/styles/tokens.css`) and components
(`src/components/ui/`) are the source of truth. The inspirations below inform **surface-level
conventions** (how a dashboard, terminal, chart, or map surface is structured), not the base token set.

- **Bloomberg Terminal lineage** — the mental model (*Bloomberg Terminal × modern web app*):
  financial/operator density, keyboard-first, quiet chrome. Register reference, not a spec source.

> mithril's tokens were originally ported from Blueprint v6.15, but mithril does **not** track
> Blueprint and is expected to diverge. Don't treat Blueprint as a live authority — treat
> `tokens.css` as the baseline.

## Design systems (spec-derivable, open source)

| System | What it uniquely adds | Status |
|---|---|---|
| **IBM Carbon** (Apache-2.0) | Layering-as-elevation (no shadows), rigorous data tables, square corners, the 2x grid. The closest open sibling to mithril's register. | **Deep dive: [carbon.md](carbon.md)** |
| **Radix / shadcn/ui** (MIT) | Unstyled neutral primitives — mithril is built on Radix + a shadcn-style owned-source model, so these are foundational, not just inspirational. | In use |
| Ant Design, Atlassian, Fluent 2, Adobe Spectrum, Base Web | Broad enterprise component libraries — useful for component *coverage* and patterns, but general-purpose, **not density exemplars**. Mine selectively. | Noted |

## Observability / ops dashboards

Dense operational data, dark, status-driven.

- **Grafana** (AGPL app; design tokens open) — the archetype: panel grid, variable-driven dashboards,
  time-range controls, threshold/alert-state color. **Deep dive:
  [observability-surfaces.md](observability-surfaces.md)**.
- Datadog, Kibana/Elastic, Splunk, Honeycomb, Sentry — register + pattern references.

## Financial / trading terminals (extends Bloomberg)

- **TradingView** — modern charting density, multi-pane, observable on the open web. **Deep dive:
  [tradingview.md](tradingview.md)** (chart specifics grounded in the open-source Lightweight Charts
  library). Charts are a stated mithril direction.
- Refinitiv/LSEG Workspace, FactSet, Koyfin, IBKR TWS — multi-pane terminal layouts. *Register only.*

## Mission-control / geospatial / C2

- **Kepler.gl** (MIT) — open-source geospatial analytics. **Deep dive:
  [geospatial-surfaces.md](geospatial-surfaces.md)**. Mapping is a stated mithril direction (the
  Mission Control demo already exercises MapLibre).
- ESRI ArcGIS Pro, Mapbox/CesiumJS, Anduril Lattice — geospatial + command-and-control. *Register only.*

## Power-user interaction model

- **Linear** — keyboard-first, command-palette, crisp dense UI. **Deep dive: [linear.md](linear.md)**.
- Superhuman, Raycast, Height — shortcut-everywhere conventions.

## TUI / terminal aesthetic (a distinct sub-register)

- **btop** — the prime exemplar: titled-border boxes, block/braille meters and mini-graphs,
  threshold-gradient fills, maximal character-cell density. **Deep dive:
  [terminal-mode.md](terminal-mode.md)**.
- **k9s, htop, lazygit** — adjacent terminal lineage. **Textual / Rich** — a TUI layout grammar.

## AI surfaces

Chat side-panels, tool-call traces, streaming, citations, evals — a surface family mithril targets
directly (the SOC demo and the project's AI direction). **Deep dive: [ai-surfaces.md](ai-surfaces.md)**.

## Contrast set (what NOT to do)

Explicit foils, useful only to name anti-patterns: Material Design data tables, generic consumer-SaaS
dashboards (rounded cards, big gradients, airy whitespace, mascots).
