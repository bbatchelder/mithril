# 0045 — Slider (Phase 4 #14)

- **Date:** 2026-05-26
- **Focus:** Build Slider (draggable range slider with track fill, handle, and tick labels) to Blueprint v6.15 fidelity, both light and dark themes. Fix-up pass (same session): fix tick-label styling + add handle value-badge; tag slider internals for diff.
- **Branch / commit:** phase-4-navigation @ (see commit SHA)

## Summary

Built `src/components/ui/slider.tsx` exporting `Slider` — a single-value draggable slider
component. Uses `@radix-ui/react-slider` (newly installed) for drag/keyboard/a11y behavior
and applies pixel-faithful Blueprint v6.15 styling via Tailwind utility classes. Registered in
both galleries under `id="slider"`. The blueprint-reference gallery uses Blueprint's `Slider`
component directly. Verified with `tools/compare.sh slider both`.

**Fix-up pass fixes (on top of initial commit):**
1. **Tick-label styling**: Removed tooltip-style dark pill backgrounds from axis tick labels. Blueprint's `.bp6-slider-axis .bp6-slider-label` has NO background — plain text only. Mithril now renders them as transparent-bg plain text matching Blueprint.
2. **Handle value badge**: Added missing `.bp6-slider-handle .bp6-slider-label`-equivalent span inside each handle, showing the current value with dark-gray-5 bg (#404854) in light mode and light-gray-3 bg (#e5e8eb) in dark mode, plus `$pt-tooltip-box-shadow` / `$pt-dark-tooltip-box-shadow`.
3. **Internal data-compare tagging**: Added `_tagInternals` prop to Slider; tagged `slider-track`, `slider-progress`, `slider-handle`, `slider-axis-label`, `slider-handle-label` on the `slider-default` specimen only. Blueprint reference uses `BpSliderWithInternalCompare` wrapper + `useEffect` + `querySelector` to tag Blueprint's internal DOM nodes.
4. **Track structure**: Fixed track to have transparent background (matching Blueprint), with a full-width gray bg div inside the track container + the intent-colored fill div on top. Also added `min-w-0` to avoid `min-width: auto` noise.

- **Light:** 6 match · 2 differ — internals now pair and visually match.
- **Dark:** 6 match · 2 differ — internals now pair and visually match.

**Phase 4 item 14 of 15 — Slider COMPLETE.**

## API

```tsx
// Controlled with intent
<Slider value={5} onChange={setVal} min={0} max={10} intent="primary" labelStepSize={5} />

// Success intent
<Slider value={7} intent="success" min={0} max={10} />

// Disabled
<Slider value={3} disabled intent="primary" />

// Uncontrolled
<Slider defaultValue={5} />

// Custom label renderer
<Slider value={0.5} min={0} max={1} stepSize={0.1} labelRenderer={(v) => `${Math.round(v * 100)}%`} />

// No labels
<Slider value={5} labelRenderer={false} />

// Vertical
<Slider value={5} vertical />

// No fill
<Slider value={5} showTrackFill={false} />
```

### Slider props

| Prop | Type | Default | Description |
|---|---|---|---|
| `min` | `number` | `0` | Minimum value. |
| `max` | `number` | `10` | Maximum value. |
| `stepSize` | `number` | `1` | Step size between values. |
| `value` | `number` | — | Controlled value. |
| `defaultValue` | `number` | `0` | Default value for uncontrolled usage. |
| `onChange` | `(v: number) => void` | — | Callback when value changes. |
| `onRelease` | `(v: number) => void` | — | Callback when handle released. |
| `intent` | `SliderIntent` | `"primary"` | Fill color intent. |
| `disabled` | `boolean` | `false` | Non-interactive + visual dimming. |
| `labelRenderer` | `boolean \| ((v) => ReactNode)` | `true` | Render tick labels. `false` = hide all. |
| `labelStepSize` | `number` | — | Interval at which tick labels appear. |
| `labelValues` | `readonly number[]` | — | Explicit tick label positions (mutually exclusive with labelStepSize). |
| `labelPrecision` | `number` | inferred | Decimal places for tick labels. |
| `showTrackFill` | `boolean` | `true` | Show colored fill from initialValue to value. |
| `initialValue` | `number` | `0` | The "other end" of the fill range. |
| `vertical` | `boolean` | `false` | Vertical orientation. |
| `className` | `string` | — | Extra classes on root div. |
| `_tagInternals` | `boolean` | `false` | Gallery/harness only — stamps data-compare on internals. |
| …rest | `HTMLAttributes<HTMLDivElement>` | — | Forwarded to root div. |

## Blueprint metrics matched

| Property | Value | Source |
|---|---|---|
| Container height (horizontal) | `40px` | `$pt-input-height-large = $pt-spacing*10 = 40px` |
| Container min-width | `150px` | `$slider-min-size = $pt-spacing*37.5 = 150px` |
| Track height | `6px` | `$track-size = $handle-size - $pt-spacing*2.5 = 16-10 = 6px` |
| Track border-radius | `4px` | `$pt-border-radius = 4px` |
| Track bg | transparent | `.bp6-slider-track` has no background-color (overflow:hidden only) |
| Track fill bg (light) | `rgba(95,107,124,0.2)` | `rgba($gray1, 0.2)` — full-width "empty" segment |
| Track fill bg (dark) | `rgba(17,20,24,0.5)` | `rgba($black, 0.5)` |
| Handle size | `16×16px` | `$handle-size = $pt-icon-size-standard = $pt-spacing*4 = 16px` |
| Handle border-radius | `4px` | `$pt-border-radius = 4px` |
| Handle bg (light) | `#f6f7f9` | `pt-button default ≈ light-gray-5` |
| Handle bg (dark) | `#abb3bf` | `$gray4` |
| Handle shadow (light) | `0 0 0 1px rgba(0,0,0,0.5), 0 1px 1px rgba(0,0,0,0.5)` | `$handle-box-shadow` |
| Handle shadow (dark) | `inset 0 0 0 1px rgba(255,255,255,0.1), 0 1px 2px rgba(0,0,0,0.2)` | `$dark-button-box-shadow` |
| Disabled: opacity | `0.5` | `.bp6-disabled { opacity: 0.5 }` |
| Disabled: gray5 bg (light) | `#c5cbd3` | `$gray5` |
| Disabled: gray1 bg (dark) | `#5f6b7c` | `$gray1` |
| Label offset (tick) | `translate(-50%, 20px)` | `translate(-50%, $label-offset)` where `$label-offset = 16px + 4px = 20px` |
| Label font-size | `12px` | `$pt-font-size-small = $pt-spacing*3 = 12px` |
| Label padding | `2px 4px` | `$pt-spacing*0.5 $pt-spacing = 2px 4px` |
| Axis tick label bg | transparent | `.bp6-slider-axis .bp6-slider-label` has NO background set — plain text |
| Handle label bg (light) | `#404854` | `$tooltip-background-color = $dark-gray5` |
| Handle label text (light) | `#f6f7f9` | `$tooltip-text-color = $light-gray5` |
| Handle label bg (dark) | `#e5e8eb` | `$dark-tooltip-background-color = $light-gray3` |
| Handle label text (dark) | `#404854` | `$dark-tooltip-text-color = $dark-gray5` |
| Handle label border-radius | `4px` | `$pt-border-radius` |
| Handle label shadow (light) | `$pt-elevation-shadow-3` | `0 0 0 1px rgba(0,0,0,0.1), 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 15px -3px rgba(0,0,0,0.1)` |
| Handle label shadow (dark) | `$pt-dark-tooltip-box-shadow` | `0 2px 4px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.4)` |
| Handle label margin-left | `8px` | `$handle-size * 0.5 = 8px` (centers label in handle) |
| Fill: primary | `#2d72d2` | `$blue3` |
| Fill: success | `#238551` | `$green3` |
| Fill: warning | `#c87619` | `$orange3` |
| Fill: danger | `#cd4246` | `$red3` |

## Design decisions

- **Radix Slider primitive**: Used `@radix-ui/react-slider` for drag, keyboard (arrow keys, Home/End,
  PageUp/PageDown), and a11y (role=slider, aria-valuenow, etc.). Styled it to Blueprint visuals without
  using Radix's default styles. The Radix Range element is hidden; we render our own custom fill div
  with `position:absolute` and `left/width` percentages computed from `initialValue` and `value`.

- **Custom fill instead of Radix Range**: Radix's Range fills from the minimum to the current value,
  but Blueprint's slider fills from `initialValue` to `value` (like a "range with a fixed anchor point").
  We compute the fill manually:
  - `fillStart = min(initialValue, currentValue)`
  - `fillEnd = max(initialValue, currentValue)`
  - `left = (fillStart - min) / range * 100%`
  - `width = (fillEnd - fillStart) / range * 100%`

- **Track structure matches Blueprint DOM**: Blueprint's `.bp6-slider-track` has no background-color —
  it just has `border-radius` and `overflow:hidden`. The gray "empty" track color comes from a full-width
  `.bp6-slider-progress` (no intent) element inside the track. We match this with a full-width gray div
  inside the Track, plus the intent-colored fill div on top.

- **Handle value badge inside Thumb**: The handle value badge (`slider-handle-label`) is rendered as a
  `<span>` child inside `RadixSlider.Thumb`. Radix renders Thumb as `position:absolute`, and spans
  have `overflow:visible` by default, so the badge can show below the handle bounds without clipping.
  Blueprint's `.bp6-slider-handle .bp6-slider-label` uses `margin-left: 8px` (= handle-size/2) + 
  `transform: translate(-50%, 20px)` to center it horizontally below the handle.

- **Axis tick labels — no background**: Blueprint's `.bp6-slider-axis .bp6-slider-label` has no
  `background` property set. The prior implementation incorrectly applied tooltip-style dark pill
  backgrounds to axis labels. Fixed to transparent background, plain text.

- **`_tagInternals` prop**: Added an internal-only boolean prop to allow the gallery to tag ONE set
  of slider internals for the diff harness. Using this on more than one Slider per page would cause
  key collisions in the harness capture.

- **Tick labels layout**: Positioned absolutely on the container with `top:0` and 
  `transform: translate(-50%, 20px)`, matching Blueprint's `$label-offset = 20px` (= handle 16px + 
  spacing 4px). The Radix Root takes the full container height (40px), centering the track and handle
  vertically within it. Labels appear below the track at the correct offset.

- **Literal Tailwind classes**: All colors use `bg-[#hex]` or `bg-[rgba(...)]` literal values to
  satisfy Tailwind v4's tree-shaking (no runtime `var()` in inline styles). Runtime inline styles
  are only used for `left: X%` and `width: Y%` positioning.

- **`rounded-bp` pitfall avoided**: Used `rounded-bp` (which maps to `--radius-bp = 4px`) for track
  and handle border-radius, not `rounded-full`.

- **Dark handle colors**: Blueprint says "don't use pt-dark-button() here, since we want to appear
  more like a light theme button" — so in dark mode the handle uses `$gray4` (#abb3bf) at rest,
  `$gray3` (#8f99a8) on hover, `$gray2` (#738091) when active.

## Accepted deltas

- **Handle shadow base color** (light): `rgba(0,0,0,0.502)` vs Blueprint `rgba(18,20,24,0.502)`.
  Mithril uses pure `#000000` for `$black`; Blueprint resolves to `rgb(18,20,24)`. Sub-perceptual
  at ~50% alpha (both appear as near-black).
- **Handle shadow base color** (dark): `rgba(0,0,0,0.2)` vs Blueprint `rgba(15,20,25,0.2)`.
  Same `$black` variable difference. Sub-perceptual.
- **Handle-label shadow base** (light): `rgba(0,0,0,0.102)` vs `rgba(20,20,20,0.102)`. First layer
  only; other layers match exactly (`rgba(0,0,0,0.102)`). Sub-perceptual at 10% opacity.
- **Handle-label shadow base** (dark): `rgba(0,0,0,0.4)` vs `rgba(17,20,25,0.4)`. Same pattern.
- **Dark handle text color**: mithril `rgb(246,247,249)` vs Blueprint `rgb(165,170,179)`. Blueprint's
  resolved color for `.bp6-slider-handle` text in dark mode differs from our inherited dark body text.
  The handle value badge has its own explicit text color so this doesn't affect badge rendering.
- **Track min-width**: mithril `auto` vs Blueprint `0px`. The `w-full` class sets `min-width: auto`
  in Tailwind. Visual effect is the same (track fills available width). Structural-only.

## compare.sh results

```
slider · light:  6 match · 2 differ
slider · dark:   6 match · 2 differ
```

Paired internal keys (both themes): `slider-track`, `slider-progress`, `slider-handle`,
`slider-axis-label`, `slider-handle-label` (all pair correctly — present in both mithril and Blueprint).

Remaining 2 diffs per theme:
1. `slider-handle` boxShadow — base color `rgba(0,0,0)` vs `rgba(18,20,24)` (sub-perceptual `$black` difference)
2. `slider-handle-label` boxShadow — first layer base color only (sub-perceptual `$black` difference)
(Dark also has `slider-handle` color diff for text — known-intentional, doesn't affect badge color)

Screenshot confirmation (light + dark): tick labels (0, 5, 10) now render as plain text below
the track with no background. Handle value badges (5, 6, 3) appear as dark rounded pills directly
below each handle knob. Both themes visually match Blueprint.

## New dependencies added

- `@radix-ui/react-slider@1.3.6` — Radix slider primitive for drag/keyboard/a11y behavior.

## Current state

- **Slider:** Implemented and verified — `tools/compare.sh slider both`.
- **Build:** `pnpm build` green (tsc + vite).
- **Phase 4:** 14/15 COMPLETE. Navbar ✓ Tabs ✓ Collapse ✓ Section ✓ CardList ✓ Breadcrumbs ✓ Tree ✓ PanelStack ✓ HTMLTable ✓ EditableText ✓ EntityTitle ✓ NonIdealState ✓ Link ✓ Slider ✓

## Next steps

> Next action: **Hotkeys** (`packages/core/src/components/hotkeys/`).
>
> Phase 4 remaining (in order):
> 15. **Hotkeys** — `hotkeys/` (Dialog-based)
>
> This is the LAST component of Phase 4. After Hotkeys, open a PR to merge phase-4-navigation
> into main (merge commit), then cut a phase-5 branch for the composite selects phase.

## How to resume

```bash
git branch --show-current  # should be phase-4-navigation
pnpm dev                                              # :5173
cd tools/blueprint-reference && pnpm dev              # :5174

tools/compare.sh slider both     # re-verify
tools/compare.sh hotkeys both    # next target
```

- Relevant files:
  - `src/components/ui/slider.tsx` (updated — tick-label fix + handle value-badge + _tagInternals)
  - `src/App.tsx` (SliderGallery updated — _tagInternals on default specimen)
  - `tools/blueprint-reference/src/App.tsx` (BpSliderWithInternalCompare wrapper + useEffect tagging)
  - `docs/ROADMAP.md` (Slider checked)
  - `docs/handoffs/0045-slider.md` (this file)
  - `package.json` + `pnpm-lock.yaml` (@radix-ui/react-slider added)
