# Comparison harness

Pixel **and** computed-style comparison of mithril against the version-matched
Blueprint reference — driven by the `agent-browser` CLI, no manual Chrome.

```bash
tools/compare.sh <component> [light|dark|both]   # default theme: both
```

Example:

```bash
tools/compare.sh button          # button, light + dark
tools/compare.sh button dark     # button, dark only
```

## What it does

For each requested theme it drives two headless `agent-browser` sessions to the two
dev servers, opened in **isolated single-component mode** so the screenshot is just
the specimens with no header chrome:

- mithril  → `http://localhost:5173/?component=<id>&theme=<theme>`
- Blueprint   → `http://localhost:5174/?component=<id>&theme=<theme>`

Both dev servers are auto-started if not already reachable (and left running).

It writes to `tools/comparison/screenshots/` (git-ignored):

| file | what |
| --- | --- |
| `<id>.<theme>.mithril.png` | full-page screenshot of mithril |
| `<id>.<theme>.blueprint.png` | full-page screenshot of the Blueprint reference |
| `<id>.<theme>.<key>.spec.png` | per-specimen diff crop (written only for flagged keys) |
| `<id>.<theme>.diff.png` | full-page pixel-diff image (auto-aligned) |
| `<id>.<theme>.{mithril,blueprint}.styles.json` | captured computed styles |
| `<id>.<theme>.{mithril,blueprint}.rects.json` | captured specimen bounding rects |

…then prints, per theme, **three** complementary diffs:

1. a **computed-style diff** of every paired specimen (exact color/size drift), then
2. a **per-specimen visual diff** (the reliable gate), then
3. a **full-page visual diff** (a holistic catch-all guide).

### Why three

The computed-style diff is precise but only sees the tagged `[data-compare]` elements,
so it is **blind to layout-flow bugs** — e.g. the real regression where a Checkbox label
wrapped *below* its indicator: the indicator's own styles matched perfectly (6/6), yet
the control was visibly broken.

The **per-specimen visual diff** (`diff-specimens.mjs`) is the reliable visual gate. It
crops each tagged specimen from each screenshot **by its own bounding rect** and compares
the crops, so gallery-level layout is removed entirely — only the component's own pixels
are compared, aligned by content. A faithful specimen lands at **SSIM ≈ 1.000 and ~0%
mismatch**; a real difference drops it sharply and/or shows a **size mismatch**. In the
checkbox case: the indicator crops stay 1.000 either way (the box is fine), but a
*whole-control* specimen goes **0.994 → 0.071** (and height 18→31px) the moment the label
wraps — a huge, unambiguous signal. (See the size note below for tagging.)

The **full-page visual diff** (`diff-pixels.mjs`) is the catch-all: it auto-aligns the two
screenshots and writes `diff.png`. Read its SSIM as a guide, **not** a gate — the two
galleries have slightly different row spacing, so a faithful multi-row component drifts and
won't reach 1.0 (the Checkbox gallery sits ~0.92 regardless). Eyeball `diff.png` to judge.

(The full-page diff first applies one global `(dx, dy)` shift to register the two
screenshots — without it every text edge shows up "doubled" from the few-pixel offset
between the two independent galleries. The shift cancels that benign offset while
preserving real structural differences, so they pop in `diff.png`.)

## Tagging specimens

Tag key specimens so the harness can pair them **by key** (the same key must exist in
both galleries — `src/App.tsx` and `tools/blueprint-reference/src/App.tsx`):

- `data-compare="<key>"` — paired in the computed-style diff **and** the per-specimen
  visual diff. Use for the element whose styles you want checked (e.g. a control's box).
- `data-vcompare="<key>"` — **visual-only** (skipped by the computed-style diff). Use for
  a whole-control wrapper or any region you only want compared as pixels, where running it
  through the style diff would just add noise.

**A specimen is only as good as what its tag covers.** Tagging an inner box (a checkbox
indicator) compares that box precisely but can't see a mislaid sibling label — wrap the
whole control in an `inline-block` span with `data-vcompare` to catch layout-flow bugs
(the rect then spans box + label, so a wrap shows up as a size mismatch + SSIM collapse).

When you add a component, register it in both galleries' `COMPONENTS` arrays (same `id`)
and tag matching specimens with identical keys on both sides.

## The color-normalization trick (important)

mithril emits colors as `rgb()`; Blueprint v6.15 emits `oklch()` / `oklab()` /
`color(srgb …)`. `getComputedStyle` and `canvas.fillStyle` now **preserve** the
authored color space, so a naive string compare flags every color as different.

`capture-styles.js` normalizes every color — including those inside `box-shadow` —
by painting it to a 1×1 canvas and reading the pixel back via `getImageData`, which
always yields integer `rgb()`. `diff-styles.mjs` then compares colors numerically
with a ±2-per-channel tolerance to absorb oklch→sRGB rounding.

To keep the diff signal-rich, `capture-styles.js` deliberately **omits** props where
the two implementations diverge structurally but look identical (`fontFamily`,
`lineHeight`, vertical padding, `borderStyle`), drops zero-width border colors, and
strips Tailwind's transparent no-op shadow layers. Adjust the `PROPS` list there if a
component needs different coverage.

## Accepted-delta waivers (`accepted-deltas.json`)

Some deltas are reviewed and **accepted** — visually identical / sub-perceptual / a Blueprint
quirk (e.g. `popover` `minWidth:auto`→`0px` on an `inline-block`, tag spacing done via `gap`
instead of per-child `margin-right`, the radix arrow box-sizing). `accepted-deltas.json` waives
them so they stop showing as `differ` / `flagged`, **without going blind to regressions** — a
waiver only applies while the live values still match what's pinned:

- **styles** — value-pinned `[ [analystVal, blueprintVal], … ]` per `specimen.cssProp`. Suppressed
  only while the live pair still matches (color-tolerant). Change the component and the value drifts
  → the waiver misses → it re-surfaces as a `differ` for re-review. New, unwaived props always flag.
- **unpaired** — specimen keys expected `only in mithril` (each verified under its own component id,
  e.g. the hotkeys dialog is covered by `dialog`). A *new* unpaired key still flags.
- **visual** — `expectSize: [aw,ah,bw,bh]` suppresses a known size mismatch only while the sizes
  still match (±3px); `ssimArtifact: true` suppresses a low-SSIM flag only while the specimen is
  **not** size-mismatched. Either way a *new* size mismatch (the layout-flow regression signal —
  e.g. a wrapped label going 18→31px) always re-flags.

The summary then reads e.g. `2 match · 0 differ` + a dim `waived: …` note, and `… all clean · N
waived`. Run `CMP_NO_WAIVERS=1 tools/compare.sh <id>` to see the **raw**, un-waived output (use this
to re-audit an accepted delta). The "why" for each entry lives in
`docs/component-fidelity-deltas.md` (Resolution).

## Files

- `compare.sh` — entry point (in `tools/`, not here).
- `accepted-deltas.json` — reviewed-delta waivers (see "Accepted-delta waivers" above).
- `waivers.mjs` — shared waiver loader + value/size matchers used by the two diff scripts.
- `capture-styles.js` — in-page computed-style capture + color normalization.
- `capture-rects.js` — in-page bounding-rect capture for `[data-compare]`/`[data-vcompare]`.
- `diff-styles.mjs` — pairs specimens by key and prints the tolerant computed-style diff.
- `diff-specimens.mjs` — crops each specimen by its rect and prints the per-specimen
  SSIM/size/mismatch table (the reliable gate). Writes `*.spec.png` for flagged keys.
- `diff-pixels.mjs` — registers the two full-page screenshots and emits SSIM + pixel-mismatch +
  the `diff.png` (holistic guide).
- `diff-specimens.mjs` and `diff-pixels.mjs` need `pixelmatch` + `pngjs` (dev deps); both
  soft-skip with a note if those aren't installed.
- `screenshots/` — generated artifacts (git-ignored).
