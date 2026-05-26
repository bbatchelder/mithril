# 0022 — SegmentedControl (Phase 2 #11)

- **Date:** 2026-05-25
- **Focus:** Build SegmentedControl component to Blueprint v6.15 fidelity; Phase 2 #11 form controls
- **Branch / commit:** phase-2-forms @ (see commit SHA)

## Summary

Built `src/components/ui/segmented-control.tsx` — a modern API reimplementation of Blueprint's SegmentedControl.
Renders a track div (light-gray5 / dark-gray2 bg, 2px padding + gap, 4px radius) containing one button per option.
Unselected segments are minimal/muted; selected segment is raised (white bg in light, dark-gray5 in dark for
none-intent; primary fill for primary intent). Registered in both galleries under `id="segmented-control"` with
7 matching `data-compare` specimens.

Compare result:
- **Light: 6 match · 1 differ** — 1 non-visual `minWidth` artifact on `sc-default` (see Accepted Deltas).
- **Dark: 5 match · 2 differ** — same minWidth artifact + known-intentional dark foreground delta on `sc-selected-segment`.

## Current state

- **SegmentedControl:** Fully implemented and verified — `tools/compare.sh segmented-control both`.
  - Light: 6/7 match · 1 differ (accepted — see below).
  - Dark: 5/7 match · 2 differ (1 accepted minWidth artifact + 1 known-intentional dark foreground delta).
- **Build:** `pnpm build` green (tsc + vite); blueprint-reference `tsc --noEmit` green.
- **Phase 2 progress:** SegmentedControl checked in ROADMAP.md; 11/12 Phase 2 components done.

## API

```tsx
<SegmentedControl
  options={[
    { label: "Day", value: "day" },
    { label: "Week", value: "week" },
    { label: "Month", value: "month" },
  ]}
  value="week"                    // controlled selected value
  defaultValue="week"             // uncontrolled default
  onValueChange={(v) => {}}       // selection callback
  intent="none"                   // "none" | "primary" (applied to selected segment, default: "none")
  size="medium"                   // "small" | "medium" | "large" (default: "medium")
  large={false}                   // deprecated: use size="large" instead
  small={false}                   // deprecated: use size="small" instead
  fill={false}                    // expand track to fill container; segments grow equally
  inline={false}                  // render as inline-flex
  disabled={false}                // disable all segments
  role="radiogroup"               // "radiogroup" | "group" | "toolbar" | "menu" (default: "radiogroup")
  className=""
  // ...all other HTMLDivElement props
/>

// Option shape:
// { label: string; value: string; disabled?: boolean; icon?: React.ReactNode }
```

## Decisions made (and why)

### Segment styling: compose buttonVariants directly, not use `<Button>` component

The selected segment needs a custom background override (white/dark-gray5) that conflicts with
the transparent bg of `variant="minimal"`. Rather than fighting the Button component's CSS
specificity, we compose `buttonVariants({ variant: "minimal", ... })` to get the sizing/height
classes, then layer in the selected-state background classes directly on the `<button>` element.
This produces identical computed styles (height, padding, font, radius) as Blueprint's buttons.

### Selected none-intent: `shadow-button` (Blueprint's button shadow) applied to selected

Blueprint's selected (non-minimal) button inherits the standard solid button shadow
(`inset 0 0 0 1px ... + 0 1px 2px ...`). We apply `shadow-button` to the selected segment
to match this behavior. Without it, the selected segment looks flat.

### Track: `bg-light-gray-5 dark:bg-dark-gray-2` — 4px radius, 2px padding + gap

Maps directly to Blueprint's `_segmented-control.scss`:
- `background-color: $light-gray5` / `.bp6-dark { background-color: $dark-gray2; }`
- `padding: $pt-spacing * 0.5 = 2px` → `p-0.5`
- `gap: $pt-spacing * 0.5 = 2px` → `gap-0.5`
- `border-radius: $pt-border-radius = 4px` → `rounded-bp`

### Unselected segments: `text-foreground-muted` overrides minimal's default foreground

Blueprint's SCSS: `.bp6-button.bp6-minimal { color: $pt-text-color-muted }`. This overrides
the default minimal button foreground color. We apply `text-foreground-muted` on unselected
buttons to match.

### Keyboard navigation: arrow keys for radiogroup/menu roles

Matches Blueprint's implementation: ArrowLeft/ArrowUp moves to previous enabled button,
ArrowRight/ArrowDown moves to next. Roving tabIndex pattern for radiogroup (selected = tabIndex 0,
others = -1; if none selected, first item = 0).

### Deprecated `large` and `small` props

Blueprint deprecated these in favor of `size="large"` / `size="small"`. We support them via
precedence: `sizeProp ?? (large ? "large" : small ? "small" : "medium")`.

## Accepted Deltas

### `sc-default` — `minWidth: auto` (analyst) vs `0px` (blueprint) — LIGHT AND DARK

**Nature:** Non-visual browser-computed artifact. Blueprint's SCSS does not set `min-width` on
the segmented control div. The `0px` appears only on `sc-default`; Blueprint's own `sc-fill`,
`sc-large`, and `sc-disabled` all compute `auto` — identical to analyst-ui. This is a transient
browser-computed value for one specific rendered instance and has zero visual effect.

**Decision:** Accepted as non-visual implementation noise. Adding `min-w-0` to the track would
fix `sc-default` but break the other three specimens (they would then show `0px` vs Blueprint's
`auto`), proving this is purely browser-computed artifact variation.

### `sc-selected-segment` dark color — `rgb(246, 247, 249)` (analyst) vs `rgb(255, 255, 255)` (blueprint) — DARK ONLY

**Nature:** Known-intentional design decision. Analyst-ui uses `#f6f7f9` (light-gray-5) as its
dark foreground, while Blueprint uses near-white `#ffffff`. Documented in
`memory/dark-foreground-decision.md` and present in every dark-theme none-intent button across
all components. Fully acceptable and intentional.

## Gotchas / things to know

- **Do NOT apply `min-w-0` to the track.** Blueprint's SCSS doesn't set `min-width` at all.
  Adding it creates more diffs than it fixes (the other specimens compute `auto` in Blueprint).

- **Selected segment shadow:** Must apply `shadow-button` to the selected segment. Without it,
  selected appears flat (no border). Blueprint's selected segment is a non-minimal button with
  the standard solid button shadow.

- **Fill + segments:** When `fill={true}`, each segment button gets `fill: true` in `buttonVariants`,
  which applies `w-full`. Combined with the track's `w-full`, this makes each segment expand equally.

- **Blueprint reference import:** `SegmentedControl` is exported from `@blueprintjs/core` and
  accepts `data-*` directly on the outer div. Inner button elements need `ref + useEffect +
  querySelector("button")` to stamp `data-compare`.

- **Dark track background:** `dark-gray-2 = #252a31`. Blueprint's dark SC track is `dark-gray2`.
  Confirm `dark:bg-dark-gray-2` (not dark-gray-3 or dark-gray-1).

- **Selected dark background:** `dark-gray-5 = #404854`. Blueprint's selected non-primary segment
  in dark is `dark-gray5`. Confirm `dark:bg-dark-gray-5`.

## Specimens registered (both galleries, 7 keyed)

| key | description |
|---|---|
| `sc-default` | 3-option track, "week" selected — the track div (bg, padding, gap, radius) |
| `sc-selected-segment` | the selected "Week" button — bg white (light) / dark-gray5 (dark), foreground text |
| `sc-unselected-segment` | the unselected "Day" button — muted text, transparent bg |
| `sc-large` | size=large track |
| `sc-intent-primary` | selected "Week" button with intent="primary" — primary fill + white text |
| `sc-fill` | fill=true track |
| `sc-disabled` | disabled=true track |

## compare.sh results

```
segmented-control · light:  6 match · 1 differ  (1 accepted non-visual minWidth artifact)
segmented-control · dark:   5 match · 2 differ  (1 accepted minWidth artifact + 1 known-intentional dark fg delta)
```

## Next steps

> Phase 2 has 1 remaining component. Build it then open PR to merge phase-2-forms → main.

1. **ControlCard** — `src/components/ui/control-card.tsx` (LAST Phase 2 component).
   Blueprint: `packages/core/src/components/control-card/`.
   A Card that embeds a control (Checkbox/Radio/Switch) + label. Uses Card + control layout.
   After this, open PR, merge phase-2-forms → main, cut phase-3-overlays.

## How to resume

```bash
# Both servers
pnpm dev                                              # :5173
cd tools/blueprint-reference && pnpm dev              # :5174

# Verification
tools/compare.sh segmented-control both
tools/compare.sh numeric-input both      # regression check

# Check Phase 2 progress
grep -A 15 "Phase 2" docs/ROADMAP.md
```

- Relevant files:
  - `src/components/ui/segmented-control.tsx` (new — SegmentedControl component)
  - `src/App.tsx` (SegmentedControlGallery + COMPONENTS entry + import)
  - `tools/blueprint-reference/src/App.tsx` (SegmentedControlGallery + COMPONENTS entry + import)
  - `docs/ROADMAP.md` (SegmentedControl checked)
- Open questions for the user: None — SegmentedControl complete; next is ControlCard (last Phase 2).
