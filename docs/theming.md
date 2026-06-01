# Theming

analyst-ui's tokens are **runtime-derivable**. Almost every semantic value
(`--ring`, `--link`, intent text, tag shades, focus rings, selected-card ring,
surfaces, borders) is expressed as a relative-color derivation from a small set
of **seeds**. Change a seed and the whole theme re-tints — in both light and dark
— with no rebuild.

Two axes are orthogonal:

| Axis | What it controls | How to set it |
| --- | --- | --- |
| **Theme** | the seed set (accent + neutrals) | `data-theme="…"` on `<html>` |
| **Mode** | light vs dark variant | `.dark` **or** `[data-mode="dark"]` |

Because mode and theme are independent, **every theme automatically has a light
and a dark variant**. The dark variant re-derives from the same seeds the theme
overrode.

## The seeds

Seeds live in the `@theme` block of `src/styles/tokens.css`.

**Intent seeds** (all four are seed-driven — re-tint any of them):

```
--color-primary  / -hover / -active / -disabled / -foreground
--color-success  / -hover / -active / -disabled / -foreground
--color-warning  / -hover / -active / -disabled / -foreground
--color-danger   / -hover / -active / -disabled / -foreground
```

Everything intent-derived flows from these: solid/outlined/minimal button colors,
intent text, tag shades, focus rings, input intent/focus shadows, links,
selection, and the selected-card ring.

**Neutral seeds** — the gray ramp:

```
--color-dark-gray-1..5   --color-gray-1..5   --color-light-gray-1..5
```

Surfaces (`--background`, `--surface`, `--elevated`), borders, dividers,
disabled text, and ghost/hover backgrounds derive from these.

## Authoring a theme

A theme overrides **only seeds**. Do **not** redeclare the semantic tokens — they
re-resolve automatically. Apply the attribute at the document root so the
light-mode semantic tokens (declared on `:root`) re-resolve against your seeds:

```css
[data-theme="ocean"] {
    --color-primary: #147eb3;          /* cerulean-3 */
    --color-primary-hover: #0f6894;    /* cerulean-2 */
    --color-primary-active: #0c5174;   /* cerulean-1 */
    --color-primary-disabled: #3fa6da; /* cerulean-4 */
    /* override --color-success / -warning / -danger and the gray ramp too if desired */
}
```

```html
<html data-theme="ocean">          <!-- light -->
<html data-theme="ocean" class="dark">   <!-- dark variant of the same theme -->
```

> **Placement matters.** `data-theme` must be on an element where the semantic
> tokens are declared (i.e. `:root`/`<html>`). Setting it on a descendant only
> changes the seeds for that subtree's *own* declarations — the inherited,
> already-computed semantic values won't update. (Dark works on a subtree because
> the `.dark` block redeclares the semantic tokens there.) For app-wide theming,
> always use `<html>`.

### Example: the bundled "datex" theme

`tokens.css` ships one example, `[data-theme="datex"]`, which re-seeds **all four
intents** to a brand palette — vivid violet primary (`rgb(91, 8, 178)`), mint
success (`rgb(63, 197, 137)`), amber warning (`rgb(239, 181, 47)`), and a matched
red danger (`rgb(226, 52, 57)`) — with each intent's hover/active/disabled tiers
derived from its own color family's Blueprint OKLCH steps. The neutral ramp gets a
subtle olive hue-shift (the brand "none" tone, `rgb(59, 70, 7)`). The gallery
toggles it (the tint button in the sidebar) or via `?palette=datex` (add
`&theme=dark` for the dark variant). It's the proof that seed overrides re-tint all
four light/dark quadrants. (Note: the mint success is light enough that its solid
fill switches to dark foreground text for AA contrast — set via
`--color-success-foreground`.)

## Components must consume seeds, not palette literals

For a component to follow the theme, its intent colors must route through the
**seed / semantic tokens** — not the fixed palette. Use:

- `bg-primary` / `text-success` / `border-danger` … (intent rest/hover/active/disabled seeds)
- `text-intent-{intent}-text` — canonical intent text/icon (tier-2 light / tier-5 dark);
  used by Icon, Callout, typography.
- `text-intent-{intent}-minimal-text` — button minimal/outlined intent text (color-mix dark).
- `bg-{intent}/10`, `stroke-[var(--color-{intent})]` … for tinted/SVG fills.

Do **not** hardcode `bg-blue-3`, `text-green-2`, `stroke-[#2d72d2]`,
`bg-[rgba(45,114,210,0.1)]`, etc. — those point at the fixed palette and won't re-tint.
(Spinner/ProgressBar/Slider use `bg-[var(--color-primary)]`/`bg-primary` — always emitted,
and the seed vars stay alive via other utilities.)

The whole library is now theme-aware — every component routes intent colors through
seeds/intent tokens, verified by `tools/compare.sh` staying clean in the default theme
(both light and dark): Button, Icon, Spinner, ProgressBar, Tag, Callout, Menu, Toast,
FormGroup, EditableText, Link, DatePicker, DateRangePicker, Tree, Tabs, NumericInput,
Checkbox, Radio, Switch, Slider, DataTable, MultistepDialog. Neutral/"none" grays are
intentionally left on the palette (they track the neutral ramp, not an intent seed).

## How derivation works (P2.5)

Derivations mirror Blueprint's DTCG `com.blueprint.derive` extensions
(`lightnessOffset/Scale`, `chromaOffset/Scale`, `hueOffset`, `alpha`), which map
1:1 onto CSS relative color:

```css
--ring: oklch(from var(--color-primary-hover) l c h / 0.752);          /* alpha */
--tag-solid-warning-bg: oklch(from var(--color-warning) calc(l + 0.19) c h); /* lightness offset */
--intent-primary-text: color-mix(in oklch, var(--color-primary) 51%, white);  /* dark lighten */
```

Every offset was verified (`/tmp/oklch.py`-style sRGB↔OKLCH resolution) to
reproduce the previously hand-baked literals byte-for-byte, so the **default
theme is pixel-identical** to before — confirmed by `tools/compare.sh`.

## Progressive enhancement (P2.6)

Relative color (`oklch(from …)`) isn't in older Safari/Firefox. Every derived
token is therefore declared **twice**:

1. a **static fallback** (the resolved sRGB literal) in the base `:root` / `.dark`
   block, then
2. the **live derivation** inside
   `@supports (color: oklch(from white l c h)) { … }`.

Engines without relative-color support keep the exact verified literals (the
default theme looks identical); engines with support get the re-tintable derived
values. The `@supports` test gates the newest feature, so where it passes,
`color-mix(in oklch, …)` is available too.

## Native control parity (P2.7)

`:root` sets `color-scheme: light` and the dark scope sets `color-scheme: dark`,
so native scrollbars, form controls, and spinners follow the mode. Dark mode is
selectable by **either** `.dark` **or** `[data-mode="dark"]` (the `dark:` Tailwind
variant responds to both).

## Roadmap

Full runtime theming — a `ThemeProvider`/API with a gallery switcher and multiple
shipped themes (option #3 from the P2.5 design discussion) — is planned future
work. The current mechanism (seed override + static example) is the foundation it
will build on.
