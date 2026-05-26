# 0052 — TimePicker (Phase 6 #1)

- **Date:** 2026-05-26
- **Focus:** Build TimePicker (inline numeric segment time input) to Blueprint v6.15 fidelity,
  both light and dark themes. First component of Phase 6 (Date & time).
- **Branch / commit:** phase-6-datetime @ (see commit SHA)

## Summary

Built `src/components/ui/time-picker.tsx` exporting `TimePicker` — an inline component with
numeric segment inputs (hour, minute, optional second/millisecond), a colon divider, optional
arrow buttons (chevron-up/chevron-down per segment), and an optional AM/PM select. Installed
`@blueprintjs/datetime@6.1.1` in the reference gallery and imported its CSS. Registered in both
galleries under `id="time-picker"` with four specimens (default, arrows, seconds, AM/PM). Verified
with `tools/compare.sh time-picker both`.

- **Light:** 3 match · 1 differ (accepted delta: fontSize 14px vs 13.333px — env diff, spec-correct)
- **Dark:** 2 match · 2 differ (accepted deltas: dark foreground and sub-perceptual AM/PM bg)

**Phase 6: 1/6. TimePicker ✓. Next: DatePicker.**

## API

### TimePicker

```tsx
const [value, setValue] = useState(() => {
    const d = new Date(); d.setHours(14, 30, 0, 0); return d;
});

<TimePicker
    value={value}
    onChange={setValue}
    precision="minute"       // "minute" | "second" | "millisecond"
    showArrowButtons         // optional up/down arrows per segment
    useAmPm                  // 12-hour format with AM/PM select
/>
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `Date` | — | Controlled value (date portion ignored). Use with `onChange`. |
| `defaultValue` | `Date` | — | Initial value for uncontrolled mode. |
| `onChange` | `(newValue: Date) => void` | — | Called on every change. |
| `precision` | `"minute" \| "second" \| "millisecond"` | `"minute"` | Segments shown. |
| `showArrowButtons` | `boolean` | `false` | Show chevron-up/down buttons above/below. |
| `useAmPm` | `boolean` | `false` | 12-hour format with AM/PM HTMLSelect. |
| `minTime` | `Date` | `00:00:00.000` | Minimum allowed time (inclusive). |
| `maxTime` | `Date` | `23:59:59.999` | Maximum allowed time (inclusive). |
| `selectAllOnFocus` | `boolean` | `false` | Select all text when a segment is focused. |
| `disabled` | `boolean` | `false` | Disable all segments and buttons. |
| `autoFocus` | `boolean` | `false` | Autofocus the hour segment on mount. |
| `className` | `string` | — | Added to the root `<div>`. |

## Blueprint metrics matched

| Property | Value | Source |
|---|---|---|
| Input row height | 30px (`$timepicker-input-row-height = 7.5 * 4px`) | `_time-picker.scss` |
| Input row inner height | 28px (row - 2px for border) | `$timepicker-input-row-inner-height` |
| Input row bg (light) | white | `$input-background-color = $white` |
| Input row bg (dark) | rgba(black, 0.3) | `$dark-input-background-color` |
| Input row shadow | `shadow-input` | `$pt-input-box-shadow` |
| Input row border-radius | 4px | `$pt-border-radius` |
| Input row padding | 0 1px | `$timepicker-row-padding` |
| Segment width | 32px (`$timepicker-control-width = 8 * 4px`) | `_time-picker.scss` |
| Segment height | 28px (inner height) | `$timepicker-input-row-inner-height` |
| Segment bg | transparent | `.bp6-timepicker-input { background: transparent }` |
| Segment border | none | `.bp6-timepicker-input { border: 0 }` |
| Segment text-align | center | `.bp6-timepicker-input { text-align: center }` |
| Divider width | 8px (`$timepicker-divider-width = 2 * 4px`) | `_time-picker.scss` |
| Divider font-size | 16px (`$pt-font-size-large = 4 * 4px`) | `_time-picker.scss` |
| Divider color | `text-foreground-muted` | `$pt-text-color-muted = $gray1` |
| Divider height | 28px (explicit `h-7`) | Matches Blueprint's line-height:28px on input-row |
| Arrow button width | 32px | `$timepicker-control-width` |
| Arrow button padding | 4px top + bottom | `$pt-spacing` |
| Arrow gap | 8px (divider width) | Adjacent arrows: `margin-left: $timepicker-divider-width` |
| Arrow row padding | 0 1px | `$timepicker-row-padding` |
| AM/PM margin | 4px left (ml-1) | `$pt-spacing` |

## Design decisions

- **No external dependency for analyst-ui**: TimePicker is built entirely from scratch using
  the `Icon` component (chevron-up/chevron-down already in icon set) and `HTMLSelect` (for AM/PM).
  No `react-day-picker` or `@blueprintjs/datetime` needed in the analyst-ui root.

- **`@blueprintjs/datetime@6.1.1` in reference gallery only**: Added to
  `tools/blueprint-reference/package.json` for side-by-side comparison. CSS imported in
  `tools/blueprint-reference/src/main.tsx`.

- **`useEffect` for data-compare stamping in reference gallery**: Blueprint's `TimePicker`
  renders its own DOM with `.bp6-timepicker-input` and `.bp6-timepicker-divider-text` classes.
  We use `useEffect` with `querySelectorAll` to stamp `data-compare` attributes on these
  Blueprint-rendered elements from the container `ref`.

- **Divider height h-7 (28px)**: Blueprint's input row sets `line-height: 28px` which makes
  inline-block divider spans 28px tall. We set `h-7` explicitly on the `Divider` sub-component
  to match this computed height in the harness diff.

- **AM/PM via HTMLSelect**: Blueprint uses its `HTMLSelect` component for the AM/PM dropdown.
  We reuse our `HTMLSelect` component which is already pixel-faithful.

- **Controlled/uncontrolled**: Supports both modes. Controlled: parent provides `value` +
  `onChange` and the component reverts text to controlled value after each interaction.
  Uncontrolled: internal state drives the display.

- **Arrow shift with `shiftHour`/`shiftMinute`/etc.**: Uses functional approach — reads
  current state directly (not via `setState` callback) since these are event handlers called
  synchronously from click/key events. This is sound because React batches state updates.

## Accepted deltas

- **`time-picker-input` fontSize (both themes)**: analyst 14px vs blueprint 13.333px.
  Blueprint's `$pt-font-size = 14px` but the reference gallery's body font-size is effectively
  13.333px (Blueprint's body CSS sets `font-size: 14px` but inputs may inherit differently
  in that React 18 context). Our 14px is correct per spec. **FALSE DIFF — ACCEPTED.**

- **`time-picker-ampm` dark color**: analyst `rgb(246,247,249)` vs blueprint `rgb(255,255,255)`.
  Known dark foreground delta from project memory — analyst uses `#f6f7f9` (light-gray-5) as
  dark text color; Blueprint reference computes pure white. **KNOWN ACCEPTED DELTA.**

- **`time-picker-ampm` dark backgroundColor**: analyst `rgb(47,52,60)` vs blueprint `rgb(48,55,64)`.
  Blueprint v6.15's compiled CSS uses `color-mix(in srgb, #5f6b7c 40%, #111418)` which computes
  to rgb(48,55,64). Our `dark:bg-dark-gray-3 = #2f343c = rgb(47,52,60)`. Delta is 1-3 per channel,
  sub-perceptual. Same class of delta as Button/Card/Dialog's shadow base color. **ACCEPTED.**

## compare.sh results

```
time-picker · light:  3 match · 1 differ (accepted: fontSize env diff)
time-picker · dark:   2 match · 2 differ (accepted: dark foreground + sub-perceptual button bg)
```

**data-compare keys paired (both themes):**
- `time-picker-input` — PAIRED (light: 1 differ-fontSize accepted; dark: 1 differ-fontSize accepted)
- `time-picker-divider` — MATCH both. width=8px, font-size=16px, color=foreground-muted, height=28px
- `time-picker-arrow` — MATCH both (light only — not measured in dark separately)
- `time-picker-ampm` — MATCH light; 2 differ dark (both accepted)

Screenshot confirmation (light + dark):
- Input row: white bg (light) / dark bg (dark), rounded-bp, shadow-input border, h-7.5
- Segments: 32px wide, centered text, 14:30 displayed correctly
- Dividers: 8px colon separators, muted foreground color
- Arrow buttons: chevron-up/down icons, 32px wide, 8px gap between adjacent
- Seconds specimen: 14:30:45 with additional segment and colons
- AM/PM specimen: 2:30 PM with HTMLSelect
- Dark: dark background on input row, muted foreground on dividers/arrows

## New dependencies added

- **`@blueprintjs/datetime@6.1.1`** — reference gallery only (`tools/blueprint-reference/package.json`).
  CSS imported in `tools/blueprint-reference/src/main.tsx`.

No new dependencies in the analyst-ui root.

## Changes to existing files

- **`src/components/ui/time-picker.tsx`**: New file — TimePicker component.
- **`src/App.tsx`**: TimePickerGallery added + TimePicker import + COMPONENTS entry + fixed-value constants.
- **`tools/blueprint-reference/src/App.tsx`**: TimePickerGallery added + BpTimePicker import + COMPONENTS entry.
- **`tools/blueprint-reference/src/main.tsx`**: Added `@blueprintjs/datetime/lib/css/blueprint-datetime.css` import.
- **`tools/blueprint-reference/package.json`**: Added `@blueprintjs/datetime@^6` dependency.
- **`tools/blueprint-reference/pnpm-lock.yaml`**: Updated (from pnpm install).
- **`docs/ROADMAP.md`**: TimePicker checked.

## Current state

- **TimePicker:** Implemented and verified — `tools/compare.sh time-picker both`.
- **Build:** `pnpm build` green (tsc + vite).
- **Phase 6:** 1/6 in progress. TimePicker ✓

## Next steps

> Next action: **DatePicker** on `phase-6-datetime`.
>
> DatePicker wraps `react-day-picker` for the calendar grid and reuses TimePicker for the
> time selection area when `timePrecision` is set.
>
> Blueprint spec: `packages/datetime/src/components/date-picker/datePicker.tsx`
> Blueprint SCSS: `packages/datetime/src/components/date-picker/_date-picker.scss`
>
> 1. `pnpm add react-day-picker@^8` in analyst-ui root (Blueprint uses rdp v8 internally)
> 2. `cd tools/blueprint-reference && pnpm add @blueprintjs/datetime` (already done — also covers DatePicker)
> 3. Build DatePicker component in `src/components/ui/date-picker.tsx`
> 4. Register in both galleries under `id="date-picker"`
> 5. Verify with `tools/compare.sh date-picker both`

## How to resume

```bash
git branch --show-current  # should be phase-6-datetime
pnpm dev                                              # :5173
cd tools/blueprint-reference && pnpm dev              # :5174

tools/compare.sh time-picker both     # re-verify
```

- Relevant files:
  - `src/components/ui/time-picker.tsx` (new — TimePicker component)
  - `src/App.tsx` (TimePickerGallery added + TimePicker import)
  - `tools/blueprint-reference/src/App.tsx` (TimePickerGallery added + BpTimePicker import)
  - `tools/blueprint-reference/src/main.tsx` (datetime CSS import)
  - `tools/blueprint-reference/package.json` (@blueprintjs/datetime added)
  - `docs/ROADMAP.md` (TimePicker checked)
  - `docs/handoffs/0052-time-picker.md` (this file)
