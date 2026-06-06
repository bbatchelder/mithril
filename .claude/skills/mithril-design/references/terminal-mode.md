# Terminal Mode (Deep Dive — btop)

A **maximal-density sub-register** that makes a web surface read like a TUI: monospace everywhere,
box-drawing borders, character-cell meters and graphs, a persistent keybind bar. This is the literal
*terminal* in mithril's "Bloomberg Terminal × modern web app" mental model. Anchored on **btop** (the
resource monitor); the idioms generalize from htop, k9s, and lazygit.

**Use it for**: status walls / NOC monitors, resource & telemetry readouts, embedded "live" panels, ops
dashboards that want a hacker-terminal register, or a single instrument panel inside an otherwise-
standard screen.
**Don't use it for**: primary CRUD, forms, long-form content, or any surface where the data *must* be
machine-readable to assistive tech without extra work (see [§9](#9-accessibility--cautions)). Terminal
mode is a deliberate flourish — commit a panel or a whole screen to it; never half-apply it.

> btop is GPL-3.0 (an app, not a token system), so the reusable part is its **visual idioms**,
> translated to HTML/CSS below. Palette and symbol sets are from the btop source — see [Sources](#sources).

## 1. The character cell is the unit

Everything aligns to a monospace grid. Size in `ch` and line-height units, not px. Numbers are
right-aligned and tabular. Pick a true monospace with box-drawing + block coverage — **IBM Plex Mono**,
JetBrains Mono, Cascadia Code, or a Nerd Font. (This extends mithril's "monospace for identifiers" rule
to *everything*.)

```css
.tui { font-family: "IBM Plex Mono", ui-monospace, monospace;
       font-size: 13px; line-height: 1.2; font-variant-numeric: tabular-nums;
       background: #000; color: #ccc; }
```

## 2. Titled-border boxes (the signature idiom)

btop's most recognizable, most portable move: a panel whose **title sits inline in the top border rule**
— `┌─ cpu ──────────────┐`. Two ways on the web:

**A — CSS border with a cut-in label** (cleanest, scales to any width):
```css
.box { position: relative; border: 1px solid #303030; padding: 8px; }
.box > .title {
  position: absolute; top: -0.65em; left: 8px; padding: 0 4px;
  background: #000; color: #eee;            /* mask the border behind the label */
  font-size: 12px; text-transform: lowercase;
}
.box > .title::before { content: "─ "; color: #303030; }  /* optional rule lead-in */
```

**B — Literal box-drawing glyphs** (truest to btop; best for fixed-width readouts): compose the frame
from `┌ ┐ └ ┘ ├ ┤ ┬ ┴ ┼ ─ │` (U+2500–U+257F) and write the title into the top run. Use when the panel
is a fixed character grid.

Boxes tile **edge-to-edge** — corners join, gaps are 0 or one cell. The whole viewport reads as one
instrument, not floating cards.

## 3. Block & braille meters and mini-graphs

Graphs are drawn from characters, no charting library:

- **Block** (recommended for web) — the vertical eighths ladder `' ▁▂▃▄▅▆▇█'` (space + U+2581–U+2588),
  9 levels. Map `v∈[0,1]` to `blocks[Math.round(v * 8)]`.
- **Braille** (U+2800–U+28FF) — 2× horizontal resolution, but font coverage is inconsistent; prefer
  block unless you control the font.
- **tty** — a 3-symbol fallback for real TTYs; rarely needed in a browser.

```js
const BLOCKS = [' ','▁','▂','▃','▄','▅','▆','▇','█'];
const spark = series => series.map(v => BLOCKS[Math.round(v * 8)]).join('');
// "▁▂▄▅▇█▆▃" — a full history graph in one text run
```
```html
<!-- horizontal meter: filled run + dim track, value labelled for a11y -->
<span class="meter" role="meter" aria-valuenow="72" aria-valuemin="0" aria-valuemax="100">
  <span class="fill">████████████</span><span class="track">░░░░░</span>
</span> <span class="val">72%</span>
```

## 4. In-cell threshold gradients

btop colors a meter **along its length** — green at low load, yellow at mid, red at high. The
per-character version of Grafana's threshold model ([observability-surfaces.md](observability-surfaces.md)
§5): the CPU gradient runs `#77ca9b → #cbc06c → #dc4c4c`. Two web approaches:

- **Per-segment color**: color each block char by its position along the gradient. Truest to btop.
- **Clipped CSS gradient** (simpler): a full-width `linear-gradient(90deg, #77ca9b, #cbc06c, #dc4c4c)`
  revealed only up to the fill width.

```css
.fill { background: linear-gradient(90deg,#77ca9b,#cbc06c,#dc4c4c);
        -webkit-background-clip: text; color: transparent; }
```

## 5. Palette — btop "Default" theme (decoded)

| Role | Hex | Use |
|---|---|---|
| `main_bg` | `#000000` | Near-black canvas |
| `div_line` | `#303030` | Box borders / dividers (dim — decorative only) |
| `inactive_fg` | `#404040` | Disabled / unfocused, meter track |
| `graph_text` | `#606060` | Axis / graph labels |
| `main_fg` | `#cccccc` | Body text |
| `title` | `#eeeeee` | Box titles, emphasis |
| `hi_fg` / `selected_bg` | `#b54040` / `#6a2f2f` | Highlighted key / selected row |
| accent | `#0de756` | "online/ok" bright green |

Vivid 3-stop **data gradients** (start → mid → end), used only on meters/graphs:

| Series | Start | Mid | End |
|---|---|---|---|
| CPU / load | `#77ca9b` | `#cbc06c` | `#dc4c4c` |
| Memory used | `#592b26` | `#d9626d` | `#ff4769` |
| Net download | `#291f75` | `#4f43a3` | `#b0a9de` |
| Net upload | `#620665` | `#7d4180` | `#dcafde` |
| Temperature | `#4897d4` | `#5474e8` | `#ff40b6` |

The register in one line: **near-black canvas, dim gray chrome, light-gray text, saturated gradients
reserved entirely for data.** The most extreme expression of *quiet chrome, loud data* in this skill.

## 6. The keybind / status bar

A persistent bottom row lists available keys — `[q]uit  [↑↓]select  [f]ilter  [+/-]range`. It makes
mithril's "every action exposes its shortcut" principle literal. Render as a single mono row in
`graph_text`/`title` colors, keys bracketed and highlighted.

## 7. How it composes with the rest of the skill

- It's a **sub-register**, not the default. Most surfaces stay in standard mithril chrome; reach for
  terminal mode for the surfaces in the intro list.
- The threshold gradient is the same semantic ramp as Grafana's (green→yellow→red) — keep the meaning
  consistent across both.
- Monospace identifiers, tabular numerics, and one-instrument density are already mithril
  non-negotiables; terminal mode turns them up to maximum.
- **Don't interleave** terminal-mode panels with standard `rounded-bp` card chrome on the same surface —
  the two registers fight. Commit a panel or a screen.

## 8. Minimal recipe

```html
<div class="tui">
  <section class="box"><span class="title">cpu</span>
    <div>load <span class="fill">█████████████▇▅▂</span> <span class="val">71%</span></div>
    <div class="muted">8 cores · 3.4 GHz · 54°C</div>
  </section>
  <footer class="bar"><b>[q]</b>uit <b>[↑↓]</b>select <b>[f]</b>ilter</footer>
</div>
```
```css
.tui .box .muted { color: #606060; }
.tui .val { color: #eee; }
.tui .bar { color: #606060; border-top: 1px solid #303030; padding: 2px 8px; }
.tui .bar b { color: #b54040; }
```

## 9. Accessibility & cautions

- **Block/braille glyphs are decorative.** Screen readers announce them as gibberish. Always pair a
  graph/meter with a real numeric value and an `aria-label`; never encode meaningful data *only* as
  block characters. The `role="meter"` + `aria-valuenow` pattern in §3 is the baseline.
- **Contrast**: `#303030` dividers on `#000` are intentionally low — fine for decorative rules, **never
  for text**. Body text (`#ccc` on `#000`) clears AA; keep labels at `#606060` or lighter.
- **Font dependency**: requires a true monospace with box-drawing + block coverage. Prefer block over
  braille; provide a `monospace` fallback.
- **Motion**: if meters animate/refresh, honor `prefers-reduced-motion` and throttle updates.
- **Don't ship it where it doesn't belong** — forms and CRUD break in this register. It's an
  instrument-panel flourish, not a default.

## Sources

- [btop (aristocratos/btop)](https://github.com/aristocratos/btop) — the reference app (GPL-3.0)
- [`src/btop_theme.cpp`](https://github.com/aristocratos/btop/blob/main/src/btop_theme.cpp) — "Default" theme palette
- [btop README — graph symbols & Unicode blocks](https://github.com/aristocratos/btop/blob/main/README.md)
