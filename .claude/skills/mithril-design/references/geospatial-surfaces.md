# Geospatial Surfaces (Deep Dive — Kepler.gl)

Map-centric analytical surfaces — point/arc/hexbin/heatmap layers over a basemap, with a control panel
beside the canvas. Mapping is a stated mithril direction (the Mission Control demo already exercises
MapLibre). **Kepler.gl** (Uber, MIT) is the open archetype, so this deep dive uses it as the reference.
Read it when building a map dashboard, a layer-driven geo-analytics tool, or time-animated spatial data.

> Kepler.gl is MIT, so per the [inspirations.md](inspirations.md) posture its theme tokens are
> **derived and verified** from source ([`src/styles/src/base.ts`](https://github.com/keplergl/kepler.gl/blob/master/src/styles/src/base.ts)).
> The map engine is **deck.gl** (MIT) over a **MapLibre/Mapbox** basemap. Render chrome in mithril's
> tokens. See [Sources](#sources).

## 1. The shell

A map fills the surface; a side panel controls it.

- **Left side panel** — the control surface, tabbed: **Layers**, **Filters**, **Interactions**,
  **Base map**. The Layers tab holds **layer cards** (add, configure, reorder, toggle visibility).
  Collapsible to give the map full width.
- **Map canvas** — fills the remaining space, with **floating controls** docked on it: zoom,
  geocoder/search, legend, 3D/2D toggle, split-map (dual-map compare), layer-blending.
- **Bottom** — a **time-playback slider** when data has a timestamp field: animate across time, scrub,
  set a window.
- **Hover tooltips** and **brushing** — hovering shows a field readout; filters and the time window link
  across the surface.

## 2. Theme tokens (verified — dark)

Kepler's dark grays are **cool/blue-tinted** (kin to mithril's `#1c2127`), with **teal + cyan**
cartographic accents rather than blue/purple chrome:

| Role | Hex | Use |
|---|---|---|
| `sidePanelBg` | `#242730` | Side-panel canvas (darkest) |
| `sidePanelHeaderBg` / `panelBackground` | `#29323c` | Panels, headers, input bg |
| `panelBackgroundHover` | `#3a4552` | Hover / raised |
| `inputBgdHover` / `tooltipBg` | `#3a414c` | Inputs (hover), tooltip bg |
| `textColor` | `#a0a7b4` | Body text (muted blue-gray) |
| `subtextColor` / `labelColor` | `#6a7485` | Labels, secondary |
| `titleTextColor` | `#ffffff` | Titles, emphasis |
| `primaryBtnBgd` → `primaryBtnActBgd` | `#0f9668` → `#13b17b` | Primary action (teal-green) |
| `activeColor` | `#1fbad6` | Selection / active (cyan) |

Surfaces step **lighter as they rise** (`#242730` → `#29323c` → `#3a4552`), the same dark-layering
direction as Carbon ([carbon.md](carbon.md) §3) and Grafana — the dark inspirations stay consistent.

## 3. The standout contribution — data-driven cartography

The reason to study Kepler: **encode data into the map** via configurable color/size/height scales — the
geospatial analog of Grafana thresholds.

- **Color a layer by a field** using **sequential / diverging / qualitative** scales (ColorBrewer
  palettes). A legend explains the mapping.
- **Other data-bindable channels**: opacity, point radius, stroke, 3D extrusion height, arc
  source/target color.
- **Layer types**: point, arc, line, **hexbin / grid** (spatial aggregation), **heatmap**,
  polygon/GeoJSON, icon, **trip** (animated paths), 3D extrusion.
- **The basemap is deliberately muted** — a **dark, desaturated** style so the data layers carry all the
  color. *Quiet chrome, loud data* applied to cartography: the map is chrome; the layers are the data.

## 4. Agree vs. diverge

| Dimension | mithril | Kepler.gl | Verdict |
|---|---|---|---|
| Side-panel control + canvas | left rail + main | left panel + map | **Agrees** |
| Dark, layered grays | yes | cool `#242730`→`#3a4552` | **Agrees** |
| Data encoded in color | extended palette = data-viz only | scales on map layers | **Agrees** (data ≠ chrome) |
| Muted ground so data pops | quiet chrome | desaturated basemap | **Agrees** |
| Accent hue | primary (blue/themeable) | teal `#0f9668` + cyan `#1fbad6` | **Diverge** — keep mithril's for chrome |
| Engine | — | deck.gl + MapLibre/Mapbox (heavy) | Dependency note |

## 5. Applying in mithril

Keep Kepler's **grammar** — left Layers/Filters panel, floating map controls, data-driven color scales
with a legend, the time slider — but render the chrome in mithril's tokens and let the map + layers
carry the color:

```css
:root {
  /* Geospatial surface — chrome in mithril grays, map muted, layers loud */
  --panel-bg:    #1c2127;   /* side panel (mithril dark-gray-1; or Kepler #242730) */
  --panel:       #252a31;   /* layer cards / headers (bg-surface)                  */
  --panel-hover: #2f343c;   /* bg-elevated                                         */
  --text:        #abb3bf;
  --text-muted:  #8f99a8;
  --title:       #f6f7f9;
  --accent:      #2d72d2;    /* mithril primary — chrome only */
  --layer-scale: /* ColorBrewer sequential/diverging — DATA only */;
}
```

- Use a **dark, desaturated basemap** (MapLibre dark style); never a bright/satellite base under
  analytical layers.
- Reserve vivid color for **layers**, exactly like mithril's rule that extended/categorical colors are
  **data-viz only, never chrome**.
- Put layer config, filters, and the legend in standard bordered panels; floating map controls use the
  same button vocabulary as the rest of the UI.

## 6. Cautions

- **Map color is data** — keep the surrounding chrome gray; a colorful basemap or colored panels destroy
  the read.
- **Colorblind safety**: prefer ColorBrewer's colorblind-safe sequential/diverging ramps; avoid raw
  red↔green diverging scales for critical encodings.
- **Performance**: large layers need the GPU engine (deck.gl) — don't render thousands of features as
  DOM/SVG.
- **Dependency weight**: deck.gl + a map GL library is a heavy stack; pull it in only for genuinely
  map-centric surfaces, not a single small locator map.

## Sources

- [Kepler.gl docs](https://docs.kepler.gl/) — layers, filters, interactions, color scales, custom theme
- [`src/styles/src/base.ts` (GitHub, MIT)](https://github.com/keplergl/kepler.gl/blob/master/src/styles/src/base.ts) — theme token values
- [deck.gl](https://deck.gl/) (MIT) — the layer rendering engine
- [Color palettes — Kepler.gl docs](https://docs.kepler.gl/docs/user-guides/l-color-attributes) — ColorBrewer scale usage
