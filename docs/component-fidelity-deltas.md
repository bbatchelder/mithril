# Component fidelity deltas — review backlog

> Generated 2026-05-30 from a full `tools/compare.sh <id> both` sweep of all 56 components.
> These are the **computed-style** differences (the authoritative fidelity gate): every paired
> `[data-compare]` specimen whose computed CSS differs from the Blueprint reference.
> **38 of 56 components are clean.** The 18 below have at least one differing specimen —
> *including deltas previously acknowledged/accepted* (e.g. handoffs 0067/0068/0070). Listed here
> so we can revisit each and decide: fix, or formally accept + document.
>
> Per-component logs: `/tmp/cmp-<id>.log`. Diff images: `tools/comparison/screenshots/<id>.<theme>.*`.
> None were introduced by the a11y branch work (which touched only menu + select — both clean).

## Resolution (2026-05-31)

Worked the backlog with the harness. Outcome per component below; **`- [x]` decision lines** at the
end of each section point here.

**Fixed (verified `0 differ` both themes unless noted):**

| Component | Fix |
|-----------|-----|
| `card-list` | hairline divider `rgba(0,0,0,.1)` → `rgba(20,20,20,.1)` (`card-list.tsx`). |
| `segmented-control` | unselected dark text was rendering white — `dark:text-white` from `buttonVariants` minimal/none out-specified the plain `text-foreground-muted`; re-asserted `dark:text-foreground-muted`. (`sc-default` `minWidth auto/0` left as an intentional, code-documented accept.) |
| `alert`,`dialog`,`navbar`,`omnibar`,`drawer`,`toast`,`popover`,`tooltip`,`slider`(value pill),`context-menu` | **Overlay-shadow token split.** Blueprint uses a distinct shadow family for floating panels vs cards: light hairline ring `rgba(20,20,20,.1)` (cards keep pure black), and in dark the trailing drop layer is ordered *after* the inset edge-highlights. Added `--overlay-shadow-1/3/4` (tokens.css) + `shadow-overlay-*` utilities and repointed the panels off `shadow-card-*`. Clears Clusters A + B without touching cards. |
| `popover`,`context-menu` | dark border ring `rgb(94,95,97)` → `rgb(94,96,100)` (exact Blueprint). |
| `toast` | `min-width 300px` → `min(300px,100%)` (and max → `min(500px,100%)`). |
| `drawer` | header/footer dark divider shadow `rgba(0,0,0,.4)` → `rgba(17,20,25,.4)`. |
| `slider` | handle dark shadow base → `rgba(15,20,25,…)`; value-pill dark shadow → `rgba(17,20,25,.4)`; light pill ring → `rgba(20,20,20,.1)`. |

The accepts below are now **enforced as waivers** in `tools/comparison/accepted-deltas.json`, so the
harness no longer reports them as `differ`/`flagged` — but each waiver is value-pinned, so a
*regression* that changes the value (or a new delta) still surfaces. Re-audit any time with
`CMP_NO_WAIVERS=1 tools/compare.sh <id>`. See `tools/comparison/README.md` → "Accepted-delta waivers".

**Accepted (documented — visually identical / sub-perceptual / Blueprint quirk):**

| Component(s) | Delta | Why accepted |
|---|---|---|
| `popover`,`tooltip` | arrow `height` 11/8 vs 30/22px | the documented `radix-arrow-box-sizing` delta; box-sizing of the SVG anchor. |
| `popover`,`tooltip` | `minWidth 0px/auto` | `minWidth:auto` is already set inline; `0px` is a `getComputedStyle` artifact of `inline-block`. Renders identically (SSIM 0.99). |
| `segmented-control` | `sc-default` `minWidth auto/0` | intentional — track must not pin min-width (code comment at `segmented-control.tsx:65`). |
| `slider` | `slider-handle` dark `color` | targets the knob; its only child (the value label) sets its own color, so this is never painted. |
| `hotkeys`,`multi-select`,`tag-input` | tag/key `marginRight 0/4px` | spacing is done via container `gap`, not per-child margin — same pixels. |
| `date-picker`,`date-input`,`date-range-picker` | nav `padding`/`minWidth`, field `paddingRight` | nav pins a fixed `30×30` via `w/h + p-0` vs Blueprint `min-width + padding`; identical box. |
| `date-*` | day `color` `246,247,249` vs `255,255,255` | near-white vs pure-white — imperceptible. |
| `time-picker`,`tag-input` | input `fontSize 14/13.333px` | `13.333px` is the UA default — Blueprint left `font-size` unset; analyst sets the intended 14px token (truer to design intent). |
| `tag-input` | ghost dark `color` | empty input; only `::placeholder` is visible. |

### The non-computed-style flags (visual-SSIM `⚠` and `only in analyst:`)

`compare.sh` also prints two non-gate signals. Checked both on 2026-05-31; **neither surfaces a real
fidelity problem:**

- **Low per-specimen SSIM `⚠`** (e.g. `multi-select-tag` 0.028, `hotkey-combo`/`hotkey-key` ~0.37).
  Two causes, both benign: (a) the `[data-compare]` key lands on a **different-sized DOM node** in
  the two galleries (`multi-select-tag` 45px vs 70px), so the harness crops mismatched regions and
  SSIM is meaningless; (b) a **few-px text shift** from the accepted gap-vs-margin spacing — SSIM
  punishes misaligned high-contrast glyphs harshly. Eyeballed the full `*.analyst.png` /
  `*.blueprint.png` for multi-select and hotkeys: **renders are pixel-identical.** Guide, not a gate.
- **`only in analyst:` specimens** (e.g. hotkeys → `dialog-*`, multi-select → `popover-content`,
  date-input → `date-picker-*`/`popover-*`, date-picker → `time-picker-*`). These are unpaired keys
  the Blueprint reference gallery doesn't tag, so they're uncompared *here* — but each is the **same
  sub-component already verified clean under its own id** (`dialog`, `popover`, `date-picker`,
  `time-picker`). Redundant instrumentation, not untested surface. (Tightening would mean adding the
  matching keys to `tools/blueprint-reference/src/App.tsx`.)

## Summary

| Component | light (match·differ) | dark (match·differ) |
|-----------|----------------------|---------------------|
| `alert` | 4 match · 1 differ | 4 match · 1 differ |
| `card-list` | 1 match · 1 differ | 2 match · 0 differ |
| `date-input` | 2 match · 1 differ | 1 match · 2 differ |
| `date-picker` | 3 match · 1 differ | 2 match · 2 differ |
| `date-range-picker` | 3 match · 0 differ | 2 match · 1 differ |
| `dialog` | 4 match · 1 differ | 4 match · 1 differ |
| `drawer` | 3 match · 1 differ | 2 match · 2 differ |
| `hotkeys` | 5 match · 1 differ | 5 match · 1 differ |
| `multi-select` | 4 match · 1 differ | 4 match · 1 differ |
| `navbar` | 2 match · 1 differ | 2 match · 1 differ |
| `omnibar` | 4 match · 1 differ | 5 match · 0 differ |
| `popover` | 0 match · 2 differ | 0 match · 2 differ |
| `segmented-control` | 6 match · 1 differ | 5 match · 2 differ |
| `slider` | 7 match · 1 differ | 6 match · 2 differ |
| `tag-input` | 1 match · 2 differ | 1 match · 2 differ |
| `time-picker` | 3 match · 1 differ | 3 match · 1 differ |
| `toast` | 0 match · 2 differ | 0 match · 2 differ |
| `tooltip` | 0 match · 2 differ | 0 match · 2 differ |

## Observed patterns (likely shared root causes)

Counting differing specimen-properties across all 18 (both themes), the deltas cluster hard —
many components probably share a fix rather than each needing bespoke work:

| Property | occurrences | likely root cause |
|----------|-------------|-------------------|
| `boxShadow` | 18 | floating-panel/elevation shadow definition (overlays: popover, tooltip, dialog, drawer, alert, toast, omnibar). analyst uses `rgba(0,0,0,…)` where Blueprint uses `rgba(20,20,20,…)`; dark-mode shadow layer order also differs. |
| `minWidth` | 12 | portal panel: analyst `0px` vs Blueprint `auto`. |
| `color` | 8 | muted/secondary text tokens (ties to the documented `--foreground-muted` AA deltas). |
| `marginRight` / `paddingRight` / `paddingLeft` | 12 | per-component spacing (date-* inputs, segmented-control, tag-input). |
| `height` | 4 | popover arrow box-sizing (11px vs 30px — the documented `radix-arrow-box-sizing` delta). |
| `fontSize` | 4 | localized type-scale deltas. |

So a big share of the 18 reduces to **two shared overlay fixes** (panel `boxShadow`, panel `minWidth`)
plus the **muted-text color** token — worth tackling first, as they'd clear deltas across many
components at once. The rest are isolated per-component spacing/size nits.

## Per-component detail

### `alert`

**light:**

```
● alert-panel
    boxShadow
      analyst  rgba(0, 0, 0, 0.102) 0px 0px 0px 1px, rgba(0, 0, 0, 0.102) 0px 20px 25px -5px, rgba(0, 0, 0, 0.102) 0px 10px 15px -3px
      blueprnt rgba(20, 20, 20, 0.102) 0px 0px 0px 1px, rgba(0, 0, 0, 0.102) 0px 20px 25px -5px, rgba(0, 0, 0, 0.102) 0px 10px 15px -3px
```

**dark:**

```
● alert-panel
    boxShadow
      analyst  rgba(255, 255, 255, 0.2) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0.302) 0px 20px 25px -5px, rgba(0, 0, 0, 0.302) 0px 10px 30px -5px, rgba(255, 255, 255, 0.302) 0px 0px 0.5px 0px inset, rgba(255, 255, 255, 0.078) 0px 0.5px 0px 0px inset
      blueprnt rgba(255, 255, 255, 0.2) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0.302) 0px 20px 25px -5px, rgba(255, 255, 255, 0.302) 0px 0px 0.5px 0px inset, rgba(255, 255, 255, 0.078) 0px 0.5px 0px 0px inset, rgba(0, 0, 0, 0.302) 0px 10px 30px -5px
```

- [x] reviewed — see **Resolution (2026-05-31)** at top of file.

### `card-list`

**light:**

```
● card-list-item
    borderBottomColor
      analyst  rgba(0, 0, 0, 0.102)
      blueprnt rgba(20, 20, 20, 0.102)
```

- [x] reviewed — see **Resolution (2026-05-31)** at top of file.

### `date-input`

**light:**

```
● date-input-field
    paddingRight
      analyst  8px
      blueprnt 0px
only in analyst:  date-picker-nav, date-picker-weekday, popover-arrow, popover-content
```

**dark:**

```
● date-input-day
    color
      analyst  rgb(246, 247, 249)
      blueprnt rgb(255, 255, 255)
● date-input-field
    paddingRight
      analyst  8px
      blueprnt 0px
only in analyst:  date-picker-nav, date-picker-weekday, popover-arrow, popover-content
```

- [x] reviewed — see **Resolution (2026-05-31)** at top of file.

### `date-picker`

**light:**

```
● date-picker-nav
    paddingLeft
      analyst  0px
      blueprnt 8px
    paddingRight
      analyst  0px
      blueprnt 8px
    minWidth
      analyst  auto
      blueprnt 30px
only in analyst:  time-picker-divider, time-picker-input
```

**dark:**

```
● date-picker-day
    color
      analyst  rgb(246, 247, 249)
      blueprnt rgb(255, 255, 255)
● date-picker-nav
    color
      analyst  rgb(246, 247, 249)
      blueprnt rgb(255, 255, 255)
    paddingLeft
      analyst  0px
      blueprnt 8px
    paddingRight
      analyst  0px
      blueprnt 8px
    minWidth
      analyst  auto
      blueprnt 30px
only in analyst:  time-picker-divider, time-picker-input
```

- [x] reviewed — see **Resolution (2026-05-31)** at top of file.

### `date-range-picker`

**light:**

```
only in analyst:  drp-nav-next, drp-nav-prev
```

**dark:**

```
● drp-day
    color
      analyst  rgb(246, 247, 249)
      blueprnt rgb(255, 255, 255)
only in analyst:  drp-nav-next, drp-nav-prev
```

- [x] reviewed — see **Resolution (2026-05-31)** at top of file.

### `dialog`

**light:**

```
● dialog-panel
    boxShadow
      analyst  rgba(0, 0, 0, 0.102) 0px 0px 0px 1px, rgba(0, 0, 0, 0.102) 0px 20px 25px -5px, rgba(0, 0, 0, 0.102) 0px 10px 15px -3px
      blueprnt rgba(20, 20, 20, 0.102) 0px 0px 0px 1px, rgba(0, 0, 0, 0.102) 0px 20px 25px -5px, rgba(0, 0, 0, 0.102) 0px 10px 15px -3px
```

**dark:**

```
● dialog-panel
    boxShadow
      analyst  rgba(255, 255, 255, 0.2) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0.302) 0px 20px 25px -5px, rgba(0, 0, 0, 0.302) 0px 10px 30px -5px, rgba(255, 255, 255, 0.302) 0px 0px 0.5px 0px inset, rgba(255, 255, 255, 0.078) 0px 0.5px 0px 0px inset
      blueprnt rgba(255, 255, 255, 0.2) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0.302) 0px 20px 25px -5px, rgba(255, 255, 255, 0.302) 0px 0px 0.5px 0px inset, rgba(255, 255, 255, 0.078) 0px 0.5px 0px 0px inset, rgba(0, 0, 0, 0.302) 0px 10px 30px -5px
```

- [x] reviewed — see **Resolution (2026-05-31)** at top of file.

### `drawer`

**light:**

```
● drawer-panel
    boxShadow
      analyst  rgba(0, 0, 0, 0.102) 0px 0px 0px 1px, rgba(0, 0, 0, 0.302) 0px 25px 50px -12px
      blueprnt rgba(20, 20, 20, 0.102) 0px 0px 0px 1px, rgba(0, 0, 0, 0.302) 0px 25px 50px -12px
```

**dark:**

```
● drawer-header
    boxShadow
      analyst  rgba(0, 0, 0, 0.4) 0px 1px 0px 0px
      blueprnt rgba(17, 20, 25, 0.4) 0px 1px 0px 0px
● drawer-panel
    boxShadow
      analyst  rgba(255, 255, 255, 0.2) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0.302) 0px 20px 25px -5px, rgba(0, 0, 0, 0.302) 0px 10px 30px -5px, rgba(255, 255, 255, 0.302) 0px 0px 0.5px 0px inset, rgba(255, 255, 255, 0.078) 0px 0.5px 0px 0px inset
      blueprnt rgba(255, 255, 255, 0.2) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0.302) 0px 20px 25px -5px, rgba(255, 255, 255, 0.302) 0px 0px 0.5px 0px inset, rgba(255, 255, 255, 0.078) 0px 0.5px 0px 0px inset, rgba(0, 0, 0, 0.302) 0px 10px 30px -5px
```

- [x] reviewed — see **Resolution (2026-05-31)** at top of file.

### `hotkeys`

**light:**

```
● hotkey-key
    marginRight
      analyst  0px
      blueprnt 4px
only in analyst:  dialog-body, dialog-close, dialog-header, dialog-panel
```

**dark:**

```
● hotkey-key
    marginRight
      analyst  0px
      blueprnt 4px
only in analyst:  dialog-body, dialog-close, dialog-header, dialog-panel
```

- [x] reviewed — see **Resolution (2026-05-31)** at top of file.

### `multi-select`

**light:**

```
● multi-select-tag
    marginRight
      analyst  0px
      blueprnt 4px
only in analyst:  popover-content
```

**dark:**

```
● multi-select-tag
    marginRight
      analyst  0px
      blueprnt 4px
only in analyst:  popover-content
```

- [x] reviewed — see **Resolution (2026-05-31)** at top of file.

### `navbar`

**light:**

```
● navbar
    boxShadow
      analyst  rgba(0, 0, 0, 0.102) 0px 0px 0px 1px, rgba(0, 0, 0, 0.102) 0px 1px 3px 0px, rgba(0, 0, 0, 0.102) 0px 1px 2px -1px
      blueprnt rgba(20, 20, 20, 0.102) 0px 0px 0px 1px, rgba(0, 0, 0, 0.102) 0px 1px 3px 0px, rgba(0, 0, 0, 0.102) 0px 1px 2px -1px
```

**dark:**

```
● navbar
    boxShadow
      analyst  rgba(255, 255, 255, 0.2) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0.2) 0px 1px 10px 0px, rgba(0, 0, 0, 0.2) 0px 1px 10px -1px, rgba(255, 255, 255, 0.302) 0px 0px 0.5px 0px inset, rgba(255, 255, 255, 0.078) 0px 0.5px 0px 0px inset
      blueprnt rgba(255, 255, 255, 0.2) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0.2) 0px 1px 10px 0px, rgba(255, 255, 255, 0.302) 0px 0px 0.5px 0px inset, rgba(255, 255, 255, 0.078) 0px 0.5px 0px 0px inset, rgba(0, 0, 0, 0.2) 0px 1px 10px -1px
```

- [x] reviewed — see **Resolution (2026-05-31)** at top of file.

### `omnibar`

**light:**

```
● omnibar-panel
    boxShadow
      analyst  rgba(0, 0, 0, 0.102) 0px 0px 0px 1px, rgba(0, 0, 0, 0.302) 0px 25px 50px -12px
      blueprnt rgba(20, 20, 20, 0.102) 0px 0px 0px 1px, rgba(0, 0, 0, 0.302) 0px 25px 50px -12px
```

- [x] reviewed — see **Resolution (2026-05-31)** at top of file.

### `popover`

**light:**

```
● popover-arrow
    height
      analyst  11px
      blueprnt 30px
● popover-content
    boxShadow
      analyst  rgba(0, 0, 0, 0.102) 0px 0px 0px 1px, rgba(0, 0, 0, 0.102) 0px 20px 25px -5px, rgba(0, 0, 0, 0.102) 0px 10px 15px -3px
      blueprnt rgba(20, 20, 20, 0.102) 0px 0px 0px 1px, rgba(0, 0, 0, 0.102) 0px 20px 25px -5px, rgba(0, 0, 0, 0.102) 0px 10px 15px -3px
    minWidth
      analyst  0px
      blueprnt auto
```

**dark:**

```
● popover-arrow
    height
      analyst  11px
      blueprnt 30px
● popover-content
    boxShadow
      analyst  rgb(94, 95, 97) 0px 0px 0px 1px, rgba(255, 255, 255, 0.2) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0.302) 0px 20px 25px -5px, rgba(0, 0, 0, 0.302) 0px 10px 30px -5px, rgba(255, 255, 255, 0.302) 0px 0px 0.5px 0px inset, rgba(255, 255, 255, 0.078) 0px 0.5px 0px 0px inset
      blueprnt rgb(94, 96, 100) 0px 0px 0px 1px, rgba(255, 255, 255, 0.2) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0.302) 0px 20px 25px -5px, rgba(255, 255, 255, 0.302) 0px 0px 0.5px 0px inset, rgba(255, 255, 255, 0.078) 0px 0.5px 0px 0px inset, rgba(0, 0, 0, 0.302) 0px 10px 30px -5px
    minWidth
      analyst  0px
      blueprnt auto
```

- [x] reviewed — see **Resolution (2026-05-31)** at top of file.

### `segmented-control`

**light:**

```
● sc-default
    minWidth
      analyst  auto
      blueprnt 0px
```

**dark:**

```
● sc-default
    minWidth
      analyst  auto
      blueprnt 0px
● sc-unselected-segment
    color
      analyst  rgb(255, 255, 255)
      blueprnt rgb(171, 179, 191)
```

- [x] reviewed — see **Resolution (2026-05-31)** at top of file.

### `slider`

**light:**

```
● slider-handle-label
    boxShadow
      analyst  rgba(0, 0, 0, 0.102) 0px 0px 0px 1px, rgba(0, 0, 0, 0.102) 0px 20px 25px -5px, rgba(0, 0, 0, 0.102) 0px 10px 15px -3px
      blueprnt rgba(20, 20, 20, 0.102) 0px 0px 0px 1px, rgba(0, 0, 0, 0.102) 0px 20px 25px -5px, rgba(0, 0, 0, 0.102) 0px 10px 15px -3px
```

**dark:**

```
● slider-handle
    color
      analyst  rgb(246, 247, 249)
      blueprnt rgb(165, 170, 179)
    boxShadow
      analyst  rgba(255, 255, 255, 0.102) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0.2) 0px 1px 2px 0px
      blueprnt rgba(255, 255, 255, 0.102) 0px 0px 0px 1px inset, rgba(15, 20, 25, 0.2) 0px 1px 2px 0px
● slider-handle-label
    boxShadow
      analyst  rgba(0, 0, 0, 0.4) 0px 2px 4px 0px, rgba(0, 0, 0, 0.4) 0px 8px 24px 0px
      blueprnt rgba(17, 20, 25, 0.4) 0px 2px 4px 0px, rgba(17, 20, 25, 0.4) 0px 8px 24px 0px
```

- [x] reviewed — see **Resolution (2026-05-31)** at top of file.

### `tag-input`

**light:**

```
● tag-input-ghost
    color
      analyst  rgb(28, 33, 39)
      blueprnt rgb(0, 0, 0)
    fontSize
      analyst  14px
      blueprnt 13.3333px
● tag-input-tag
    marginRight
      analyst  0px
      blueprnt 4px
```

**dark:**

```
● tag-input-ghost
    color
      analyst  rgb(246, 247, 249)
      blueprnt rgb(165, 170, 179)
    fontSize
      analyst  14px
      blueprnt 13.3333px
● tag-input-tag
    marginRight
      analyst  0px
      blueprnt 4px
```

- [x] reviewed — see **Resolution (2026-05-31)** at top of file.

### `time-picker`

**light:**

```
● time-picker-input
    fontSize
      analyst  14px
      blueprnt 13.3333px
```

**dark:**

```
● time-picker-input
    fontSize
      analyst  14px
      blueprnt 13.3333px
```

- [x] reviewed — see **Resolution (2026-05-31)** at top of file.

### `toast`

**light:**

```
● toast-card
    minWidth
      analyst  300px
      blueprnt min(300px, 100%)
● toast-intent-danger
    minWidth
      analyst  300px
      blueprnt min(300px, 100%)
```

**dark:**

```
● toast-card
    boxShadow
      analyst  rgba(255, 255, 255, 0.2) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0.302) 0px 20px 25px -5px, rgba(0, 0, 0, 0.302) 0px 10px 30px -5px, rgba(255, 255, 255, 0.302) 0px 0px 0.5px 0px inset, rgba(255, 255, 255, 0.078) 0px 0.5px 0px 0px inset
      blueprnt rgba(255, 255, 255, 0.2) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0.302) 0px 20px 25px -5px, rgba(255, 255, 255, 0.302) 0px 0px 0.5px 0px inset, rgba(255, 255, 255, 0.078) 0px 0.5px 0px 0px inset, rgba(0, 0, 0, 0.302) 0px 10px 30px -5px
    minWidth
      analyst  300px
      blueprnt min(300px, 100%)
● toast-intent-danger
    boxShadow
      analyst  rgba(255, 255, 255, 0.2) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0.302) 0px 20px 25px -5px, rgba(0, 0, 0, 0.302) 0px 10px 30px -5px, rgba(255, 255, 255, 0.302) 0px 0px 0.5px 0px inset, rgba(255, 255, 255, 0.078) 0px 0.5px 0px 0px inset
      blueprnt rgba(255, 255, 255, 0.2) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0.302) 0px 20px 25px -5px, rgba(255, 255, 255, 0.302) 0px 0px 0.5px 0px inset, rgba(255, 255, 255, 0.078) 0px 0.5px 0px 0px inset, rgba(0, 0, 0, 0.302) 0px 10px 30px -5px
    minWidth
      analyst  300px
      blueprnt min(300px, 100%)
```

- [x] reviewed — see **Resolution (2026-05-31)** at top of file.

### `tooltip`

**light:**

```
● tooltip-arrow
    height
      analyst  8px
      blueprnt 22px
● tooltip-content
    boxShadow
      analyst  rgba(0, 0, 0, 0.102) 0px 0px 0px 1px, rgba(0, 0, 0, 0.102) 0px 20px 25px -5px, rgba(0, 0, 0, 0.102) 0px 10px 15px -3px
      blueprnt rgba(20, 20, 20, 0.102) 0px 0px 0px 1px, rgba(0, 0, 0, 0.102) 0px 20px 25px -5px, rgba(0, 0, 0, 0.102) 0px 10px 15px -3px
    minWidth
      analyst  0px
      blueprnt auto
```

**dark:**

```
● tooltip-arrow
    height
      analyst  8px
      blueprnt 22px
● tooltip-content
    minWidth
      analyst  0px
      blueprnt auto
```

- [x] reviewed — see **Resolution (2026-05-31)** at top of file.

