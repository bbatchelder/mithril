# 0055 — DateRangePicker (Phase 6 #4)

- **Date:** 2026-05-26
- **Focus:** Build DateRangePicker (two side-by-side month calendars for range selection) to Blueprint v6.15
  fidelity, both light and dark themes. Fourth component of Phase 6 (Date & time).
- **Branch / commit:** phase-6-datetime @ (see commit SHA)

## Summary

Built `src/components/ui/date-range-picker.tsx` exporting `DateRangePicker` — a two-calendar inline
range picker built on react-day-picker v10 range mode with custom caption components.
Reuses: `HTMLSelect`, `Icon`, `cn`.

Key behaviors:
- Two side-by-side months (January + February 2026 for the harness)
- Range endpoints filled blue (`bg-blue-3`, white text) — Jan 8 and Jan 20
- In-range days (Jan 9–19) get a light blue band background
- Blueprint-accurate border-radius behavior: start cell squares right edge, end squares left, middle is 0
- Outside-month days hidden (`invisible`) — Blueprint hides them in range mode
- Compact layout — same anti-stretch fix as DatePicker (no `w-full` on `month_grid`, `inline-block` root)
- Custom `DateRangePickerCaption` per calendar: left has prev button left, right has next button right

Registered in both galleries under `id="date-range-picker"` with two specimens:
- Two-month contiguous (main specimen, Jan+Feb 2026)
- Single-month variant

Verified with `tools/compare.sh date-range-picker both` (light 3·0, dark 2·1).
DatePicker regression: light 4·0 / dark 2·2 (unchanged).

**Phase 6: 4/6. DateRangePicker ✓. Next: DateRangeInput.**

## API

### DateRangePicker

```tsx
const [range, setRange] = useState<DateRangePickerValue>({ start: null, end: null });

<DateRangePicker
  value={range}
  onChange={setRange}
  contiguousCalendarMonths={true}
/>
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `DateRangePickerValue` | — | Controlled selected range. Use with `onChange`. |
| `defaultValue` | `DateRangePickerValue` | — | Default value for uncontrolled mode. |
| `onChange` | `(v: DateRangePickerValue) => void` | — | Called on selection change. Either boundary may be null (selection in progress). |
| `minDate` | `Date` | `Jan 1 1900` | Earliest selectable date. |
| `maxDate` | `Date` | `Dec 31 2100` | Latest selectable date. |
| `contiguousCalendarMonths` | `boolean` | `true` | When true, navigating left also moves right. |
| `singleMonthOnly` | `boolean` | `false` | Show only one month calendar. |
| `timePrecision` | `"minute" \| "second" \| "millisecond"` | — | **STUB** — TODO: add TimePicker integration. |
| `allowSingleDayRange` | `boolean` | `false` | Allow start === end (single day range). |
| `disabled` | `boolean` | `false` | Disable the entire picker. |
| `className` | `string` | — | Added to the root `<div>`. |

```ts
export interface DateRangePickerValue {
    start: Date | null;
    end: Date | null;
}
```

## Blueprint spec reference

Source: `packages/datetime/src/components/date-range-picker/` (v6.15)

Key behaviors matched:
- Two contiguous months side-by-side (flex row, gap between)
- Range endpoints: `bg-blue-3` (#2d72d2), white text, 4px border-radius (squaring edges for band)
- Range middle: `rgba($blue3, 0.1)` light / `rgba($blue3, 0.2)` dark background; color `$blue2` light / `$light-gray5` dark
- Outside-month days hidden (Blueprint hides them in range mode, unlike single DatePicker)
- Caption: left calendar has `[<]` on far left, dropdowns centered; right calendar has `[>]` on far right

Key differences from Blueprint's implementation (by design):
- Blueprint's `value` is `[Date | null, Date | null]` (tuple). Ours is `{ start, end }` (object).
- Blueprint's nav button layout in contiguous mode uses `flex-direction: row-reverse` + `::before` pseudo-element to center dropdowns. Our layout achieves the same visual effect with explicit placement in a simpler flex structure.
- `shortcuts` prop (sidebar shortcut menu) not implemented — stubbed as TODO.
- `timePrecision` not implemented — stubbed as TODO (DateRangeInput #5 may need it).

## Dual-gallery harness approach

**Analyst gallery (`src/App.tsx`):**
- Fixed range: `DRP_START = Jan 8, 2026`, `DRP_END = Jan 20, 2026`
- The component auto-initializes to January 2026 (left) from the start date; February 2026 (right) is the contiguous next month
- `data-compare` keys stamped directly in the custom `DayButton` component based on day number

**Blueprint reference (`tools/blueprint-reference/src/App.tsx`):**
- Same fixed range passed as `value={[DRP_START_BP, DRP_END_BP]}`
- `initialMonth={DRP_LEFT_MONTH_BP}` locks left calendar to January 2026
- `shortcuts={false}` hides the shortcut sidebar
- `useEffect` + `querySelector` stamps `data-compare` keys on Blueprint's rdp v8 DOM
- Blueprint rdp v8 uses classes: `rdp-day_range_start`, `rdp-day_range_end`, `rdp-day_range_middle`

**data-compare key strategy:**
- `drp-day` → Jan 4 (stable, non-range, non-outside day)
- `drp-day-range` → Jan 10 (an in-range middle day — first day of second row in range)
- `drp-day-endpoint` → Jan 8 (start) and Jan 20 (end) — both tagged, harness picks first found

## Accepted deltas

- **`drp-day` dark color: analyst `rgb(246,247,249)` vs Blueprint `rgb(255,255,255)`.**
  Known dark foreground delta from project memory — analyst uses `#f6f7f9` (light-gray-5) as
  dark text color; Blueprint reference renders pure white. **KNOWN ACCEPTED DELTA.**

## Orphan keys (harmless)

- **`only in analyst: drp-nav-next, drp-nav-prev`** — the `NavButton` components in the custom
  `DateRangePickerCaption` are tagged with `data-compare="drp-nav-prev"` and `data-compare="drp-nav-next"`.
  The Blueprint reference gallery doesn't tag its nav buttons. These appear as orphans but do NOT
  affect the match/differ counts. **ORPHAN KEYS — HARMLESS.**

## compare.sh results

```
date-range-picker · light:  3 match · 0 differ  ✓ PERFECT
date-range-picker · dark:   2 match · 1 differ  (accepted: drp-day dark foreground)
```

**data-compare keys paired (both themes):**
- `drp-day` — MATCH light; 1 differ dark (dark foreground — ACCEPTED)
- `drp-day-range` — MATCH both. Light: rgba(45,114,210,0.1) bg, blue-2 text. Dark: rgba(45,114,210,0.2) bg, foreground text
- `drp-day-endpoint` — MATCH both. bg=blue-3 (#2d72d2), white text, square edges

**DatePicker regression check (date-picker.tsx NOT modified):**
```
date-picker · light:  4 match · 0 differ  ✓ PERFECT (unchanged)
date-picker · dark:   2 match · 2 differ  (accepted: dark foreground ×2 — unchanged)
```

Screenshot confirmation (light + dark):
- Two compact side-by-side calendars (January + February 2026) — NOT stretched to container
- Jan 8 and Jan 20: blue filled endpoints (bg-blue-3), white text, rounded with edge squaring
- Jan 9–19: light blue range-highlight band spanning full cell width
- Single-month variant below: same compact layout with both nav buttons
- Dark: dark-gray-3 background, correct blue range styling

## New dependencies added

None. Reuses `react-day-picker@10.0.1` already installed.

## Changes to existing files

- **`src/components/ui/date-range-picker.tsx`**: New file — DateRangePicker component.
- **`src/App.tsx`**: DateRangePickerGallery + DateRangePicker import + COMPONENTS entry.
- **`tools/blueprint-reference/src/App.tsx`**: DateRangePickerGallery + `DateRangePicker as BpDateRangePicker` import + COMPONENTS entry.
- **`docs/ROADMAP.md`**: DateRangePicker checked.

## Current state

- **DateRangePicker:** Implemented and verified — `tools/compare.sh date-range-picker both`.
- **Build:** `pnpm build` green (tsc + vite).
- **Phase 6:** 4/6 in progress. TimePicker ✓ · DatePicker ✓ · DateInput ✓ · DateRangePicker ✓

## Next steps

> Next action: **DateRangeInput** on `phase-6-datetime`.
>
> DateRangeInput = two text inputs (start + end) that open a DateRangePicker in a Popover.
> Reuses: DateRangePicker (×1), Popover, InputGroup (×2), Icon.
>
> Blueprint spec: `packages/datetime/src/components/date-range-input/`
>
> Key considerations:
> 1. Two side-by-side inputs with a dash separator (Blueprint: `—`)
> 2. Opening popover with forced `DateRangePicker` inside
> 3. Typing into either input updates the corresponding boundary
> 4. Value parsing: same M/d/yyyy format as DateInput
> 5. Controlled/uncontrolled value prop (same `DateRangePickerValue` interface as DateRangePicker)

## How to resume

```bash
git branch --show-current  # should be phase-6-datetime
pnpm dev                                              # :5173
cd tools/blueprint-reference && pnpm dev              # :5174

tools/compare.sh date-range-picker both   # re-verify
tools/compare.sh date-picker both         # regression check
```

- Relevant files:
  - `src/components/ui/date-range-picker.tsx` (new — DateRangePicker component)
  - `src/components/ui/date-picker.tsx` (not modified — DatePicker)
  - `src/App.tsx` (DateRangePickerGallery added)
  - `tools/blueprint-reference/src/App.tsx` (DateRangePickerGallery added)
  - `docs/ROADMAP.md` (DateRangePicker checked)
  - `docs/handoffs/0055-date-range-picker.md` (this file)
