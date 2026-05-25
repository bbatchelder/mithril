# Comparison harness

Pixel **and** computed-style comparison of analyst-ui against the version-matched
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

- analyst-ui  → `http://localhost:5173/?component=<id>&theme=<theme>`
- Blueprint   → `http://localhost:5174/?component=<id>&theme=<theme>`

Both dev servers are auto-started if not already reachable (and left running).

It writes to `tools/comparison/screenshots/` (git-ignored):

| file | what |
| --- | --- |
| `<id>.<theme>.analyst.png` | full-page screenshot of analyst-ui |
| `<id>.<theme>.blueprint.png` | full-page screenshot of the Blueprint reference |
| `<id>.<theme>.{analyst,blueprint}.styles.json` | captured computed styles |

…then prints a **computed-style diff** of every paired specimen. Read the two PNGs
side-by-side for the visual check; read the diff for exact color/size drift.

## How specimens are paired

Each gallery tags key specimens with a `data-compare="<key>"` attribute. The harness
pairs specimens **by key**, so the same key must exist in both galleries:

- analyst-ui: `src/App.tsx`
- Blueprint:  `tools/blueprint-reference/src/App.tsx`

When you add a component, register it in both galleries' `COMPONENTS` arrays (same
`id`) and tag matching specimens with identical `data-compare` keys.

## The color-normalization trick (important)

analyst-ui emits colors as `rgb()`; Blueprint v6.15 emits `oklch()` / `oklab()` /
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

## Files

- `compare.sh` — entry point (in `tools/`, not here).
- `capture-styles.js` — in-page computed-style capture + color normalization.
- `diff-styles.mjs` — pairs specimens by key and prints the tolerant diff.
- `screenshots/` — generated artifacts (git-ignored).
