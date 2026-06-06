# Visual Foundations

Color, typography, spacing, iconography, motion, and data visualization — the token vocabulary of
mithril's dense-operator aesthetic. Every value below maps to a token in `src/styles/tokens.css` and
a Tailwind v4 utility class. **Style with literal utility classes, not runtime `var()` in inline
styles** — Tailwind tree-shakes the latter (see the SKILL gotcha).

## 1. Color

mithril's palette lives in `@theme` as static primitives (generating utilities like `bg-blue-3`) plus
seed-derived semantic tokens that swap per light/dark mode and re-tint when a theme overrides seeds.

### 1.1 Grayscale (the dominant palette)

The interface is ~80% gray. The full ramp (utilities `bg-dark-gray-1`, `text-gray-1`, etc.):

| Token / utility | Hex | Typical use |
|---|---|---|
| `black` | `#111418` | Deepest backgrounds |
| `dark-gray-1` | `#1c2127` | Dark-mode page background |
| `dark-gray-2` | `#252a31` | Dark-mode panel / rail background |
| `dark-gray-3` | `#2f343c` | Dark-mode elevated surface, popover |
| `dark-gray-4` | `#383e47` | Dark-mode card / hovered row |
| `dark-gray-5` | `#404854` | Dark-mode borders, dividers |
| `gray-1` | `#5f6b7c` | Muted text on dark, secondary icons |
| `gray-2` | `#738091` | Placeholder, tertiary text |
| `gray-3` | `#8f99a8` | Disabled labels |
| `gray-4` | `#abb3bf` | Muted text on dark, subtle dividers |
| `gray-5` | `#c5cbd3` | Light-mode borders |
| `light-gray-1` | `#d3d8de` | Light-mode card border |
| `light-gray-2` | `#dce0e5` | Light-mode divider |
| `light-gray-3` | `#e5e8eb` | Light-mode subtle background |
| `light-gray-4` | `#edeff2` | Light-mode panel/elevated background |
| `light-gray-5` | `#f6f7f9` | Light-mode page background |
| `white` | `#ffffff` | Light-mode surface |

**Prefer the semantic surface tokens over raw grays** so light/dark and theming just work:

| Semantic utility | Light | Dark | Use |
|---|---|---|---|
| `bg-background` | `#f6f7f9` | `#1c2127` | App / page background (back layer) |
| `bg-surface` | `#ffffff` | `#252a31` | Cards, menus, dialogs, dark rails |
| `bg-elevated` | `#edeff2` | `#2f343c` | Raised panels, popovers |
| `text-foreground` | `#1c2127` | `#f6f7f9` | Default text |
| `text-foreground-muted` | `#5f6b7c` | `#abb3bf` | Captions, helpers, secondary |

### 1.2 Intent & extended palette

mithril has **four intents**, each a seed with rest/hover/active/disabled tiers plus a foreground:

| Intent | Rest token | Default hex | Meaning |
|---|---|---|---|
| `primary` | `--color-primary` | `#2d72d2` (blue-3) | Submit / confirm / save / navigate |
| `success` | `--color-success` | `#238551` (green-3) | Create / run / start |
| `warning` | `--color-warning` | `#c87619` (orange-3) | Warn-acknowledge (dark text) |
| `danger`  | `--color-danger`  | `#cd4246` (red-3) | Destroy |

For text/icons in an intent color, use `text-intent-primary-text` (and `-success-/-warning-/-danger-`),
which resolve to the correct shade per mode automatically — don't hand-pick a palette tier.

The **primary seed is re-tintable**: the Theme Builder / built-in themes (Blueprint·Datex·Anthropic)
override `--color-primary` (and friends) on `<html>`, re-tinting the whole UI. So never hardcode a
brand hex — reference the intent.

Semantic rules (apply regardless of theme):

- **The primary intent is the chrome accent** — focus rings, links, active nav, selection, and the
  default *submit/confirm* button.
- **CTAs are intent-typed, not primary-only.** Success(green) for *create/run* (`+ New …`, `Create`),
  danger(red) for *destroy*, warning(orange) for *warn-acknowledge*, primary for *submit/save/navigate*.
  One primary CTA per surface; intent matched to the action.
- **Saturated color is rare.** A correct screen has 1–3 small spots of color against an ocean of gray.
  Multiple differing-intent buttons on one surface is a smell — usually the page is doing too much.
- **Status colors** appear in badges, toasts, validation, callouts, chart series.
- **Backgrounds are flat.** No gradients except rare data viz.
- **Extended colors** — `cerulean, forest, gold, indigo, lime, rose, sepia, turquoise, vermilion,
  violet` (each 1–5, e.g. `bg-violet-3`) — are **NEVER for general UI chrome.** Reserve for chart
  series, categorical legends/tags, object-type icons, and avatar fallbacks. They're tuned for
  data-viz contrast, not WCAG UI contrast.

---

## 2. Typography

mithril uses the **system sans stack** (`font-sans`) — no custom display font, no Source Sans Pro, no
Inter/Geist. The system stack renders crisper than "design system" sans at 12–14px on dense UIs.

```css
--font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell,
             "Open Sans", "Helvetica Neue", sans-serif;
--font-mono: monospace;   /* font-mono — code, IDs, RIDs, paths, timestamps */
```

### 2.1 Type scale

The tokens (utilities `text-body`, `text-heading`, `text-code`, etc.):

| Token / utility | Px |
|---|---|
| `text-body-xs` | 10 |
| `text-body-sm` | 12 |
| `text-body` (default) | **14** |
| `text-body-lg` | 16 |
| `text-heading-sm` | 16 |
| `text-heading` | 20 |
| `text-heading-lg` | 24 |
| `text-heading-xl` | 28 |
| `text-heading-display` | 46 |
| `text-code-sm` / `text-code` / `text-code-lg` | 12 / 13 / 14 |

Weights: `font-normal` (400), `font-bold` (600) — there is no heavier weight, which suits the quiet
register. Line heights: `leading-bp` (1.28581, the default) and `leading-bp-large` (1.5).

**Default UI text is 14px (`text-body`).** Panel/section headings usually max at `text-heading-sm` (16)
or `text-heading` (20). Full display sizes (`text-heading-xl`/`-display`) appear only on landing/splash
surfaces — never on operational screens.

### 2.2 Text color & rules

| Utility | Light | Dark | Use |
|---|---|---|---|
| `text-foreground` | `#1c2127` | `#f6f7f9` | Default |
| `text-foreground-muted` | `#5f6b7c` | `#abb3bf` | Captions, helpers, secondary |
| `text-foreground-disabled` | gray-1 @ 60% | gray-4 @ 60% | Disabled controls |

- Headings track tighter than body; body is set at the default.
- **Numbers in tables are tabular** (`tabular-nums`).
- **Code, IDs, RIDs, paths, timestamps are monospace** (`font-mono`).
- Truncate aggressively with single-line ellipsis in tables/lists; reveal full text on hover via tooltip.

---

## 3. Spacing, sizing, and density

mithril is **compact**. Defaults that feel right in consumer apps are too generous here.

### 3.1 Base unit

`4px` grid (`--spacing: 0.25rem`). Tailwind's spacing unit is already 4px, so `p-2` = 8px, `p-3` =
12px, `gap-4` = 16px. All paddings, margins, gaps are multiples of 4. Most component-internal padding
is `p-2` (8px) or `p-3` (12px); only page-level gutters use `p-6`+ (24px).

### 3.2 Control heights

| Token / utility | Height |
|---|---|
| `h-control-smaller` | 20px |
| `h-control-sm` | 24px |
| `h-control` (default) | **30px** |
| `h-control-lg` | 40px |
| `h-navbar` | 50px |

**Default control = 30px**, not 40px. Buttons, inputs, selects, dropdown triggers all align to a 30px
row in dense forms. (mithril components already default to this — don't fight it.)

### 3.3 Table / list density

- Default row height **30px**, with a "Compact" toggle at **24px**.
- Cell padding: 8px horizontal, vertical centered.
- Column dividers: 1px (`border-border` / in dark, `border-dark-gray-5`).
- Sticky headers on scroll, a shade stronger (`border-border-strong`) than rows.
- Striping **off by default** — use only when rows lack other separation cues.

(For the deepest table treatment, see [carbon.md](carbon.md) §7.)

### 3.4 Border radius

Small and rectilinear. `--radius-bp` (4px) is the single canonical radius:

| Utility | Px |
|---|---|
| `rounded-bp-sm` | 2px |
| `rounded-bp` (canonical) | **4px** |
| `rounded-bp-lg` | 6px |
| `rounded-full` | pills / avatars only |

Every chrome element — button, input, card, dialog, popover — uses `rounded-bp`. Never round more than
6px on chrome. No `rounded-2xl`.

### 3.5 Borders and dividers

Border tokens are **alpha-channel grays**, so a 1px line subtly mixes with whatever surface it sits on:

```
border-border         → gray-1 @ 12%   (between panels in a group)
border-border-strong  → gray-1 @ 25%   (distinct sections, table headers)
```

In dark mode these become white-based alphas automatically. The interface is a **mosaic of bordered
surfaces**, not a flow of free-floating cards. Many mithril buttons use a 1px **inset box-shadow ring**
(`shadow-button`) rather than `border-style` — semantically equivalent, doesn't shift the box model.

### 3.6 Layout system — there isn't one

Deliberate: mithril ships **no grid system, no breakpoints baked into chrome, no row/column
components.** Compose panels with **flexbox** + the spacing scale. Three z-index layers cover most
needs — utilities `z-base` / `z-content` / `z-overlay` (plus `z-dialog-header`, `z-max`) generated from
the `--z-index-*` tokens; use them so overlays stack above positive-z app content. (The exceptions:
dashboard/observability surfaces *do* use an explicit 24-col panel grid — see
[observability-surfaces.md](observability-surfaces.md) §2.)

### 3.7 Elevation / shadows

Shadows are subtle and **restricted to floating elements** (popovers, dialogs, dropdowns, drawers).
The 1px ring is always part of the shadow — never a drop shadow without the ring. mithril exposes three
families:

```
shadow-elevation-0 … shadow-elevation-4   /* general elevation (cards, raised) */
shadow-overlay-1 / -3 / -4                /* floating overlays (popover, dialog, drawer, tooltip) */
shadow-card-0 … shadow-card-4, shadow-card-selected   /* card surfaces + selection ring */
shadow-button                             /* the button inset-ring + tiny drop */
shadow-input / shadow-input-focus[-intent]/ shadow-input-intent-*   /* form fields */
```

Map roughly: `0` = inline rest/hover affordance, `1` = card / minor popover, `2`–`3` = dropdown /
dialog, `4` = full-screen overlay. **Inline content has no drop shadow** — inset elements rely on
borders alone. Hover/active tints use `bg-[var(--interactive-hover)]` / `--interactive-active` (neutral
gray washes that don't change the base background).

---

## 4. Iconography

mithril **vendors the full 706-glyph Blueprint icon set** (`src/components/ui/icons/`, generated by
`tools/gen-icons.mjs`) — there is no third-party icon dependency. Two discrete sizes, single-weight,
monochrome: `--size-icon` (16px) and `--size-icon-lg` (20px).

- Render by name through the registry: `<Icon icon="cog" />` (the registry is populated once in
  `App.tsx` via `registerIcons(ICON_GLYPHS)`). For library/standalone code, import the glyph object so
  it tree-shakes: `import { cog } from ".../icons"; <Icon icon={cog} />`. (Full mechanics: the
  [`mithril`](../../mithril/SKILL.md) skill, foundations recipe.)
- Icons inherit `currentColor` — they sit at the color of their adjacent label. (`Icon` defaults to
  `text-foreground` even at `intent="none"`; use `!text-current` to inherit a host's color.)
- Default size **16px** in buttons / nav, **20px** on larger surfaces, **12px** for inline metadata.
- Two-tone or filled styles are rare. Consistency of weight beats expressiveness.
- Each Callout intent has a default icon bound to it (primary→info, success→check, warning→caution,
  danger→error). Override only when intentional.

### 4.1 Icons outside mithril (standalone prototypes)

If you're building a single-file HTML demo that can't import mithril's `<Icon>`, **use inline SVG**
sized 16×16 (or 20×20), 1.5px stroke, `stroke="currentColor"`, `fill="none"` (Lucide paths are the
closest open-source match to this weight). Inherit color via `currentColor` so dark/light zones just
work.

**Never substitute an empty bordered box** (`<span>` styled as an outlined square) as a placeholder —
that hollow-square reads as a broken icon font and instantly breaks the aesthetic. **Omit the icon and
let the label stand alone** before you fake it.

```html
<!-- 16x16, stroke 1.5, currentColor — paste-in inline (folder glyph) -->
<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor"
     stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M2 4.5A1.5 1.5 0 0 1 3.5 3h2.6a1.5 1.5 0 0 1 1.1.5l1 1.1h4.3A1.5 1.5 0 0 1 14 6.1V12a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 12V4.5z"/>
</svg>
```

---

## 5. Motion

Restrained. Motion conveys state change; it does not perform.

```
ease-bp         → cubic-bezier(0.4, 1, 0.75, 0.9)    /* quick start, gentle land — the default */
ease-bp-bounce  → cubic-bezier(0.54, 1.12, 0.38, 1.11) /* rare */
duration-bp     → 100ms
```

- **Default duration 100ms** (`duration-bp`). Faster than most consumer apps — intentional.
- **Easing `ease-bp`** — not `ease-in-out` or material curves.
- Hover: instant or 50–100ms tween. Popovers/dialogs: ~150ms fade + small slide.
- Skeleton loaders: slow shimmer (~1.5s) at low contrast, gray rounded rects shaped like the content.
- Focus tokens: `--ring` (primary-hover @ 75%), `ring-width` 2px, `ring-offset` 2px — a visible 2px
  `:focus-visible` ring, never removed.
- **No bouncy springs. No parallax. No staggered lists.** Honor `prefers-reduced-motion`.

---

## 6. Data visualization

- **Categorical palette**: cycle `primary → orange-3 → green-3 → violet-3 → turquoise-3 → red-3 →
  indigo-3 → gold-3` (all available as `bg-*` utilities).
- **Sequential palette**: single-hue ramp from a color's tier-5 → tier-1 (e.g. `blue-5 → blue-1`).
- **Diverging palette**: `red-3 ↔ light-gray-3 ↔ primary`.
- Axes and grid lines are very low contrast (`light-gray-2` / `dark-gray-5`).
- Series labels appear inline at line ends, not in a legend, when space allows.
- Chart tooltips are dark, mono numerics, full precision on hover (rounded in display).
- Extended colors live **here**, never in chrome. For chart engines and conventions (candles, shared
  crosshair, thresholds), see [tradingview.md](tradingview.md) and
  [observability-surfaces.md](observability-surfaces.md).
