# Observability Surfaces (Deep Dive — Grafana)

Monitoring, metrics, logs, and traces dashboards. **Grafana is the archetype** — the de-facto grammar
for operator dashboards — so this deep dive uses it as the reference. Read it when building a monitoring
dashboard, a status/NOC wall, an SLO view, or any "panels + time range + thresholds" surface.

> Grafana the application is AGPL-3.0, but its design tokens are public in `@grafana/data`. Token values
> below are from the published source (`themes/palette.ts`, `createColors/Spacing/Typography.ts`,
> `core/constants.ts`) — see [Sources](#sources). Treat the *surface grammar* as the reusable part;
> render the chrome in **mithril's tokens** (§10).

## 1. The dashboard shell

A Grafana dashboard is thin chrome wrapping a grid of panels — the data is the interface.

- **Top bar**: dashboard title / breadcrumb (left); the **control cluster** (right): time-range picker,
  refresh + auto-refresh interval, zoom-out, settings (gear), save, share, **+ Add panel**.
- **Variable bar**: a row of **template-variable dropdowns** under the title (`$datasource`, `$cluster`,
  `$host`, `$interval`). Changing one re-queries every panel bound to it. Multi-select + an `All` option
  are standard.
- **Body**: the panel grid. No left rail by default — the dashboard *is* the surface. (In mithril you'd
  typically still wrap it in the standard dark left rail from [layout-and-shell.md](layout-and-shell.md).)

## 2. The grid system (verified constants)

Panels are placed on a fixed grid via `GridPos { x, y, w, h }`:

- **24 columns** (`GRID_COLUMN_COUNT = 24`); `x` 0–23, `w` 1–24.
- **Cell height 30px** (`GRID_CELL_HEIGHT = 30`) with an **8px vertical margin** (`GRID_CELL_VMARGIN = 8`);
  `h`/`y` counted in these units.
- **Minimum panel height 90px** (`3 × 30`); default new-panel span 4 cols; `PANEL_BORDER = 2px`.

The 30px cell height equals mithril's default control-row height (`h-control`) — the systems agree on
the underlying rhythm. Map `w` to a 24-col layout and `h` units to `30px + 8px` gaps.

## 3. Panel anatomy

- **Header**: title (left); the panel menu appears on hover via a caret (quiet — no persistent chrome).
  Optional description "i" and a loading/refresh indicator.
- **Viz area**: edge-to-edge; ~8px internal padding. Panels can be made **transparent** to sit directly
  on the canvas. Subtle 1px border, no float shadow — pure *quiet chrome, loud data*.
- **Panel types**: **time series** (default), **stat** (big number + sparkline), **gauge** /
  **bar gauge**, **table**, **logs** (+ log-volume histogram), **heatmap**, **state timeline**,
  **status history**, **geomap**, **node graph**, **trace view**, **histogram**, **pie** (rare).
  Stat/gauge/bar-gauge/table are the status-board workhorses.

## 4. Color & theme tokens (verified)

Grafana is **dark-default**. Like Carbon's dark themes, surfaces step **lighter** as they rise — canvas
darkest, panels above it:

| Token | Dark | Light |
|---|---|---|
| `background.canvas` | `#111217` | `#fbfbfb` |
| `background.primary` (panels) | `#181b1f` | `#ffffff` |
| `background.secondary` (headers, raised) | `#22252b` | `#f4f5f5` |
| `text.primary` | `#ccccdc` | `#24292e` |
| `text.secondary` | ~65% alpha | ~65% alpha |
| borders | low-alpha tints of the text base | low-alpha |

Semantic colors (state, not chrome): primary `#3d71d9` (text `#6e9fff`), success `#1a7f4b`, warning
`#ff9900`, error `#d10e5c` (dark `main` values).

> Borders are low-alpha light-on-dark — the same family as mithril's `border-border`. The "panels one
> step lighter than canvas" model matches Carbon's dark layering ([carbon.md](carbon.md) §3), so the two
> dark inspirations compose cleanly.

## 5. Status & thresholds (the observability-specific contribution)

The thing Grafana adds: **encode state in color via thresholds**.

- A **threshold** is a base value + ordered steps, each mapping a numeric range to a color. Canonical
  ramp: **green (base) → orange/yellow → red**. Stat, gauge, bar-gauge, table cells, and time-series
  can all color *by threshold*.
- **Color modes**: `thresholds` (by value), `palette-classic` (categorical by series, §6),
  `continuous` gradients, `fixed`.
- **Alert states**: **Normal** green, **Pending** orange/yellow, **Alerting/Firing** red,
  **No Data**/**Error** neutral gray. Keep these exact — operators read color before text.

Fully compatible with mithril's intent semantics (success=green, warning=orange, danger=red). The
difference: in a dashboard, color *is data*, so it appears far more than the "1–3 spots of color" rule
that governs ordinary chrome. **Loud data, quiet frame** — the frame still stays gray.

## 6. Data-viz palette

Grafana's **classic palette** (56 colors). Leads, in order: `#7eb26d` green · `#eab839` yellow ·
`#6ed0e0` light-blue · `#ef843c` orange · `#e24d42` red · `#1f78c1` blue · `#ba43a9` purple ·
`#705da0` violet. Like mithril's extended palette, **data viz only — never chrome**. Prefer a curated
subset; reserve red/green for series where they don't collide with threshold semantics.

## 7. Time & interaction conventions

- **Time-range picker** (top-right): relative quick ranges (`5m, 15m, 1h, 6h, 24h, 7d, 30d`) + absolute
  from/to; applies to every panel.
- **Auto-refresh**: interval dropdown (`off, 5s, 10s, 30s, 1m, 5m…`) beside the range.
- **Shared crosshair / tooltip**: hovering one time-series highlights the same timestamp across panels.
- **Annotations**: vertical event markers (deploys, incidents).
- **Variables & repeat**: template variables drive queries and can **repeat** a panel/row per value.
- **Zoom**: click-drag on a graph narrows the global time range.

## 8. Typography & spacing (verified)

- **Spacing**: 8px base (`spacing(1) = 8px`) — same rhythm mithril uses.
- **Type scale**: base **14px**; `h1 28 · h2 24 · h3 22 · h4 18 · h5 16 · h6 14`; body 14, small 12.
  Weights restrained — 400 / 500 (no heavy weight), which suits the quiet register.
- **Fonts**: Grafana uses Inter + Roboto Mono — a **divergence**; keep Grafana's *scale and weights*,
  render in mithril's families (system sans + `font-mono`).

## 9. Where Grafana agrees vs. diverges

| Dimension | mithril | Grafana | Verdict |
|---|---|---|---|
| Density rhythm | 4/8px grid, 30px rows | 8px unit, 30px grid cell | **Agrees** |
| Dark layering | zones step | canvas → panel → raised | **Agrees** (matches Carbon) |
| Color discipline | 1–3 spots in chrome | sparse chrome, color-rich *data* | **Agrees** (data ≠ chrome) |
| Body font | system sans | Inter | **Diverge** — keep mithril's |
| Status encoding | intent colors | threshold ramps + alert states | **Grafana adds** this |

## 10. Applying Grafana in mithril

Build the **surface grammar** — panel grid, hover-quiet panel headers, the time-range + refresh +
variable control cluster, threshold-colored stats/gauges, shared crosshair — but render the chrome in
mithril's tokens. A dark observability starter:

```css
:root {
  /* Observability dark surface — panels one step above canvas (mithril grays) */
  --canvas:    #1c2127;  /* mithril dark-gray-1 / bg-background */
  --panel:     #252a31;  /* bg-surface, one step lighter        */
  --raised:    #2f343c;  /* bg-elevated — panel header/dropdowns */
  --text:      #f6f7f9;
  --text-muted:#abb3bf;
  --border:    rgba(95,107,124,0.18);

  /* Status — threshold ramp (data color, used freely on data) */
  --ok:    #32a467;  /* green-4  */
  --warn:  #ec9a3c;  /* orange-4 */
  --crit:  #e76a6e;  /* red-4    */
  --nodata:#5f6b7c;  /* gray-1   */

  --grid-cols: 24;
  --grid-cell-h: 30px;
  --grid-gap: 8px;
  --font-sans: system-ui, -apple-system, sans-serif;  /* not Inter */
  --font-mono: ui-monospace, "SFMono-Regular", monospace;
}
```

**Cautions.** Keep threshold colors (green/orange/red) reserved for *state* so they stay legible; don't
also use red/green as categorical series on the same panel. A dashboard earns more color than ordinary
chrome — but only in the panels; the frame, headers, and variable bar stay gray.

## Sources

- [Grafana dashboards & panels docs](https://grafana.com/docs/grafana/latest/)
- [`@grafana/data` themes](https://github.com/grafana/grafana/tree/main/packages/grafana-data/src/themes) — token values
- [`public/app/core/constants.ts`](https://github.com/grafana/grafana/blob/main/public/app/core/constants.ts) — grid constants
- [Grafana alerting — states](https://grafana.com/docs/grafana/latest/alerting/) — Normal / Pending / Alerting / NoData / Error
