# IBM Carbon — Deep Dive

Carbon is IBM's open-source design system (Apache-2.0). It's the **closest open sibling to mithril's
register** — dense, enterprise, gray-dominant — arrived at independently. That makes it the most useful
second inspiration to mine for concrete specs, and a good cross-check when a mithril rule feels
arbitrary.

Read this when you want a Carbon-flavored variant, when you're building **data-heavy tables**
(Carbon's standout strength), or when you want elevation handled by **layering** instead of shadows.

> All token values below are from the published Carbon source (`@carbon/colors`, `@carbon/layout`,
> `@carbon/motion`, `@carbon/type`) and the data-table spec — see [Sources](#sources). Carbon's current
> major is **v11**. Render the chrome in mithril's tokens unless you're deliberately going full-Carbon.

## 1. What Carbon uniquely contributes

- **Layering as elevation.** Carbon conveys depth by *stepping the gray* (`background` → `layer-01` →
  `layer-02` → `layer-03`), not by floating shadows. The purest expression of *quiet chrome* — flatter
  than mithril's surface shadows. Adopt it wholesale for full-dark operator surfaces.
- **Data-table rigor.** Five explicit row densities, a fixed 16px cell rhythm, clear header/cell type
  rules. The most directly reusable part of Carbon.
- **Square corners.** Carbon's signature `border-radius: 0` — the sharpest dial toward "instrument
  panel, not consumer app."
- **The 2x Grid + 8px mini-unit.** A stricter spatial system.
- **IBM Plex.** A purpose-built type superfamily with a genuine monospace sibling for identifiers.

## 2. Carbon vs. mithril's defaults

| Dimension | mithril | Carbon | Note |
|---|---|---|---|
| Corner radius | `rounded-bp` 4px on chrome | **0px** (square) | Carbon is more austere; pick one and commit |
| Body font | system sans stack | **IBM Plex Sans** | Don't mix the two families |
| Monospace | `font-mono` | **IBM Plex Mono** | Both satisfy "mono for identifiers" |
| Primary accent | `--color-primary` (blue-3 `#2d72d2`, themeable) | **Blue 60 `#0f62fe`** | Carbon's blue is brighter |
| Elevation | 1px-ring shadows on overlays, flat inline | **layering (step the gray)** | Don't combine — choose layers *or* shadows |
| Dark base | `#1c2127` (slightly blue) | **`#161616`** (near-neutral) | Carbon darks are cooler-neutral |
| Light base | `#f6f7f9` | **`#f4f4f4`** | Near-identical |
| Default control height | 30px (`h-control`) | 40px (md) / 48px (lg) | Carbon's default is *less* dense — use sm/xs |
| Borders | 1px low-alpha (`border-border`) | 1px solid token; inputs lean on a **strong bottom border** | Carbon's "single underline field" is a tell |

The two systems agree on what matters: gray-dominant chrome, color used sparingly for intent,
monospace identifiers, compact density.

## 3. Color

### Gray ramp
`Gray 10 #f4f4f4` · `20 #e0e0e0` · `30 #c6c6c6` · `40 #a8a8a8` · `50 #8d8d8d` · `60 #6f6f6f` ·
`70 #525252` · `80 #393939` · `90 #262626` · `100 #161616`. Plus `White #ffffff`.

### Blue ramp (interactive)
`Blue 10 #edf5ff` · `20 #d0e2ff` · `30 #a6c8ff` · `40 #78a9ff` · `50 #4589ff` ·
**`60 #0f62fe` (primary)** · `70 #0043ce` · `80 #002d9c` · `90 #001d6c` · `100 #001141`.

### Support (semantic)
- Error `Red 60 #da1e28` (light) → `Red 50 #fa4d56` on dark.
- Success `Green 50 #24a148` / `Green 60 #198038` → `Green 40 #42be65` on dark.
- Warning `Yellow 30 #f1c21b` (both modes; pair with dark text).
- Info `Blue 70 #0043ce` → `Blue 50 #4589ff` on dark.
- Data-viz hues `Magenta 60 #d02670`, `Purple 60 #8a3ffc`, `Cyan 50 #1192e8`, `Teal 50 #009d9a` —
  like mithril's extended palette, **data-viz only, never chrome**.

### Themes + layering model

| Token | White | Gray 10 | Gray 90 | Gray 100 |
|---|---|---|---|---|
| `background` | `#ffffff` | `#f4f4f4` | `#262626` | `#161616` |
| `layer-01` | `#f4f4f4` | `#ffffff` | `#393939` | `#262626` |
| `layer-02` | `#ffffff` | `#f4f4f4` | `#525252` | `#393939` |
| `layer-03` | `#f4f4f4` | `#ffffff` | `#6f6f6f` | `#525252` |

Each nested surface steps to the next layer; `field-01`/`field-02` give inputs a background per level.
A distinctive **`focus` ring is `#0f62fe` on light but pure `#ffffff` on dark**.

> Mapping to mithril: `g100` ≈ full-dark zone, `g90` ≈ dark rails, `g10`/White ≈ light main. Carbon's
> dark base `#161616` is cooler than mithril's `#1c2127` — choose one ramp per project, don't interleave.

## 4. Typography

**IBM Plex Sans** (UI), **IBM Plex Mono** (identifiers), **IBM Plex Serif** (rare). Two type sets:
**productive** (operator surfaces — use this) and **expressive** (large fluid headings).

| Token | Size / line-height | Weight | Use |
|---|---|---|---|
| `label-01` / `helper-text-01` | 12 / 16 | 400 | Field labels, captions, helper/error |
| `body-compact-01` | 14 / 18 | 400 | **Default dense UI body** |
| `body-01` | 14 / 20 | 400 | Body in roomier layouts |
| `heading-compact-01` | 14 / 18 | 600 | Dense headings, table headers |
| `heading-02` | 16 / 24 | 600 | Section headings |
| `heading-03` / `heading-04` | 20 / 28 · 28 / 36 | 400 | Page sub-headings / titles |
| `code-01` / `code-02` | 12 / 16 · 14 / 20 | 400 | Code (Plex Mono) |

Carbon's default dense body is **14px** — matching mithril's non-negotiable. `heading-05/06/07`
(32–54px) are splash-only.

## 5. Spacing & grid

`spacing-01 2px` · `02 4px` · `03 8px` · `04 12px` · `05 16px` · `06 24px` · `07 32px` · `08 40px` ·
`09 48px` · `10 64px` …. Component-internal padding lives in `01–05`; `spacing-05` (16px) is the
workhorse cell/edge padding. **2x Grid**: 16 columns, gutters 32/16/1px (wide/narrow/condensed).

## 6. Motion

Use **productive** easings for operator tooling (short, snappy, no bounce):

| | Standard | Entrance | Exit |
|---|---|---|---|
| Productive | `cubic-bezier(0.2, 0, 0.38, 0.9)` | `cubic-bezier(0, 0, 0.38, 0.9)` | `cubic-bezier(0.2, 0, 1, 0.9)` |

Durations: `fast-01 70ms` · `fast-02 110ms` · `moderate-01 150ms` · `moderate-02 240ms` ·
`slow-01 400ms` · `slow-02 700ms`. Hover uses fast; panels/overlays use moderate; ≥ slow-02 reads
sluggish on an operator surface.

## 7. Data tables (Carbon's strongest contribution)

Five row densities — reach for **xs/sm** to match mithril's density:

| Size | Row height |
|---|---|
| xs (compact) | **24px** |
| sm (short) | **32px** |
| md / lg (default) / xl | 40 / 48 / 64px |

- Header row matches body row size; labels 14px / **600**, cells 14px / 400.
- Cell padding **16px** L/R (`spacing-05`), including first/last cells.
- Numerics right-align and are tabular; identifiers in Plex Mono.
- Zebra striping optional and off by default; sticky header standard for long tables.

This maps cleanly onto mithril's table rules — Carbon's xs/sm rows (24/32px) ≈ mithril's 24/30px
control rows.

## 8. Buttons & fields

- Size ramp `sm 32 · md 40 · lg 48 (default) · xl 64`.
- **Square corners**, no shadow. Hierarchy: Primary (Blue 60) → Secondary (Gray 80) → Tertiary
  (outline) → Ghost (text) → Danger (Red 60, with its own set).
- Carbon buttons use **asymmetric padding** (label left, icon pinned right) — a recognizable tell,
  optional to adopt.
- Text inputs lean on a **strong bottom border** over a quiet field background — the "single underline
  field." One primary action per view, same as mithril.

## 9. Applying Carbon in mithril

Reach for Carbon over mithril's defaults when: the surface is **table-dominant**; you want **flat
layering instead of shadows**; or the user asks for an "IBM/enterprise" / maximally austere look.
Otherwise mithril's tokens remain the baseline.

A Carbon-flavored **full-dark (g100) operator surface** — drop-in custom properties:

```css
:root {
  /* Carbon g100 layering — elevation by gray step, not shadow */
  --bg:        #161616;  /* background  */
  --layer-01:  #262626;  /* panels      */
  --layer-02:  #393939;  /* nested/cards*/
  --layer-03:  #525252;  /* popovers    */
  --field:     #262626;  /* input bg    */

  --text-primary:   #f4f4f4;
  --text-secondary: #c6c6c6;
  --text-placeholder:#6f6f6f;
  --border-subtle:  #393939;
  --border-strong:  #6f6f6f;

  --interactive: #4589ff;  /* Blue 50 — interactive lightens on dark */
  --link:        #78a9ff;  /* Blue 40 */
  --focus:       #ffffff;  /* Carbon's white focus ring on dark */
  --support-error:   #fa4d56;
  --support-success: #42be65;
  --support-warning: #f1c21b;

  --radius: 0;             /* Carbon square corners */
  --font-sans: "IBM Plex Sans", system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;
}
```

**Cautions.** Don't mix Plex with the system stack, or Carbon layering with mithril shadows — pick one
elevation model and stay in it. If you go square-cornered Carbon, the *whole* surface must be square
(0px), inputs and cards included; a stray 4px radius reads as a mistake.

## Sources

- [Carbon Design System docs](https://carbondesignsystem.com/) — tokens, type sets, spacing, motion, data table
- [`@carbon/colors`](https://www.npmjs.com/package/@carbon/colors) · [`@carbon/layout`](https://www.npmjs.com/package/@carbon/layout) · [`@carbon/type`](https://www.npmjs.com/package/@carbon/type) · [`@carbon/motion`](https://www.npmjs.com/package/@carbon/motion) — token source values
- [Carbon Themes — layering](https://carbondesignsystem.com/elements/color/tokens/) — background / layer / field model
- [GitHub: carbon-design-system/carbon](https://github.com/carbon-design-system/carbon) — token source of truth
