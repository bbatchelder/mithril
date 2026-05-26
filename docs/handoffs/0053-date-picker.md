# 0053 — DatePicker (Phase 6 #2)

- **Date:** 2026-05-26
- **Focus:** Build DatePicker (inline calendar surface) to Blueprint v6.15 fidelity,
  both light and dark themes. Second component of Phase 6 (Date & time).
- **Branch / commit:** phase-6-datetime @ (see commit SHA)

## Summary

Built `src/components/ui/date-picker.tsx` exporting `DatePicker` — an inline calendar
component built on `react-day-picker v10` with a custom `MonthCaption` component
(via `useDayPicker()` hook) that renders the [Month ▼] [Year ▼] [<] [>] caption row
matching Blueprint's layout. Reuses `TimePicker`, `HTMLSelect`, `Icon`, `cn`.

Installed `react-day-picker@10.0.1` in the analyst-ui root.
Blueprint reference already had `@blueprintjs/datetime@6.1.1` from Phase 6 #1.

Registered in both galleries under `id="date-picker"` with two specimens:
- Basic (Jan 15, 2026 selected, January 2026 displayed)
- With TimePicker (minute precision)

Verified with `tools/compare.sh date-picker both`.

**Phase 6: 2/6. DatePicker ✓. Next: DateInput.**

## API

### DatePicker

```tsx
const [value, setValue] = useState(new Date(2026, 0, 15));
const [month, setMonth] = useState(new Date(2026, 0, 1));

<DatePicker
    value={value}
    onChange={setValue}
    month={month}
    onMonthChange={setMonth}
    timePrecision="minute"   // optional TimePicker below calendar
/>
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `Date \| null` | — | Controlled selected date. Use with `onChange`. |
| `defaultValue` | `Date \| null` | — | Default date for uncontrolled mode. |
| `onChange` | `(v: Date \| null) => void` | — | Called on selection change. |
| `initialMonth` | `Date` | — | Initial display month (overridden by `value`). |
| `month` | `Date` | — | Controlled display month. Use with `onMonthChange`. |
| `onMonthChange` | `(m: Date) => void` | — | Called when the display month changes. |
| `minDate` | `Date` | `Jan 1 1900` | Earliest selectable date. |
| `maxDate` | `Date` | `Dec 31 2100` | Latest selectable date. |
| `canClearSelection` | `boolean` | `true` | Allow re-clicking selected day to clear. |
| `showOutsideDays` | `boolean` | `true` | Show adjacent-month days in the grid. |
| `highlightCurrentDay` | `boolean` | `false` | Draw a border around today's cell. |
| `timePrecision` | `"minute" \| "second" \| "millisecond"` | — | Show TimePicker below calendar. |
| `disabled` | `boolean` | `false` | Disable the entire picker. |
| `className` | `string` | — | Added to the root `<div>`. |

## Blueprint metrics matched

| Property | Value | Source |
|---|---|---|
| Datepicker bg (light) | white (`bg-white`) | `$datepicker-background-color = $white` |
| Datepicker bg (dark) | `#2f343c` (`bg-dark-gray-3`) | `$dark-datepicker-background-color = $dark-gray3` |
| Datepicker padding | 4px (`p-1`) | `$datepicker-padding = $pt-spacing = 4px` |
| Datepicker border-radius | 4px (`rounded-bp`) | `$pt-border-radius` |
| Day cell size | 30×30px | `$datepicker-day-size = 7.5 * 4px = 30px` |
| Day border-radius | 4px | `$pt-border-radius` |
| Selected day bg | `#2d72d2` (`bg-blue-3`) | `$blue3` |
| Selected day text | white | `$white` |
| Selected hover bg | `#215db0` (`hover:bg-blue-2`) | `$blue2` |
| Hover day bg | `rgba(#8f99a8, 0.15)` | `rgba($gray3, 0.15)` |
| Active day bg | `rgba(#8f99a8, 0.3)` | `rgba($gray3, 0.3)` |
| Outside-month day | `text-foreground-disabled` | `$pt-text-color-disabled` |
| Today font-weight | 400 (normal) | Blueprint overrides rdp's bold |
| Caption border-bottom | `rgba(17,20,24,0.15)` | `$pt-divider-black` |
| Caption layout | `[Month ▼] [Year ▼] [<] [>]` | Blueprint: dropdowns left, nav right |
| Nav button h | 30px | `$pt-button-height = 7.5*4 = 30px` |
| Nav button min-w | 30px | `$pt-button-height` |
| Nav button px | 8px | `2 * $pt-spacing` (computed from harness) |
| Weekday font-weight | 600 (semibold) | `.rdp-head_cell { font-weight: 600 }` |
| Weekday color | normal foreground | inherits from parent (NOT muted) |
| Weekday padding-top | 4px | `$datepicker-padding` |
| Content gap | 4px (`gap-1`) | `$pt-spacing` |
| TimePicker wrapper | flex-col, items-center, margin 4px | `.bp6-datepicker-timepicker-wrapper` |

## Design decisions

- **react-day-picker v10 (not v8)**: Blueprint uses rdp v8 internally, but we use the
  latest v10. API differences: `fromDate`/`toDate` → `startMonth`/`endMonth`;
  `captionLayout="dropdown-buttons"` → `captionLayout="label"` (we bypass rdp's dropdown
  layout entirely); class name keys changed (v10 uses `root`, `day`, `day_button`, etc.
  vs v8's `rdp-day`, `rdp-head_cell` etc.).

- **Custom MonthCaption via `useDayPicker()`**: Instead of using rdp's built-in
  `captionLayout="dropdown"` (which renders dropdowns inside a `DropdownNav`), we use
  `captionLayout="label"` + `hideNavigation` and override `MonthCaption` with our own
  component that calls `useDayPicker()` to access `goToMonth`, `nextMonth`,
  `previousMonth`. This gives us full control over the caption layout matching Blueprint's
  `[Month ▼] [Year ▼] [<] [>]` row.

- **Custom `DayButton` component**: Overrides rdp's default button to apply Blueprint's
  selected (`bg-blue-3`), hover (`rgba(gray3, 0.15)`), outside-month (disabled-colored),
  and today styles, plus `data-compare` tagging for the harness.

- **Custom `Weekday` component**: Overrides rdp's weekday `<th>` to apply Blueprint's
  `font-weight:600` and `color:foreground` (NOT muted), plus `data-compare` tagging.

- **`formatWeekdayName`**: Returns 2-char abbreviated names (Su, Mo, Tu...) using
  `toLocaleDateString("en-US", {weekday:"short"}).slice(0,2)` — matches Blueprint's
  `format(date, "EEEEEE")` which returns the "narrow" weekday form.

- **Reuses TimePicker**: When `timePrecision` is set, renders our existing TimePicker
  component below the calendar grid, inside a centered flex container.

- **DatePicker is reused by DateInput and DateRangePicker**: Kept API clean and
  composable. DateInput (#3) wraps DatePicker in a Popover + Input. DateRangePicker (#4)
  uses two linked DatePicker instances.

## Fix: Calendar sizing bug resolved (post-commit fixup)

A layout fidelity gap was discovered and fixed after the initial commit: the analyst
calendar was stretched to the full container width (~760px) instead of being compact
(~250px like Blueprint). Root cause: `month_grid: "w-full border-collapse"` caused
the `<table>` to stretch to 100% width, spreading day columns far apart.

**Fix applied:**
1. Removed `w-full` from `month_grid` class (table is now content-sized — `border-collapse` only)
2. Added `inline-block` to `root` class (rdp root element) to prevent flex-stretch
3. Added `min-w-[30px]`, `border-2 border-transparent`, `px-2` to day buttons in both
   `day_button` classNames and the custom `DayButton` component — matching Blueprint's
   computed box model (min-width 30px, 2px transparent border, 8px horizontal padding)
4. Fixed `day` cell class: `"text-center align-middle"` (was `"p-0 text-center"`)

The 2px transparent border and 8px padding are inherited from `.bp6-button.bp6-minimal`
in Blueprint (via rdp v8's class mapping). Now analyst matches the same computed values.

## Accepted deltas

- **`date-picker-day` / `date-picker-nav` dark foreground color**: analyst `rgb(246,247,249)`
  vs blueprint `rgb(255,255,255)`. Known dark foreground delta from project memory —
  analyst uses `#f6f7f9` (light-gray-5) as dark text color; Blueprint reference renders
  pure white. **KNOWN ACCEPTED DELTA.**

- **`only in analyst: time-picker-divider, time-picker-input`**: The second specimen
  (DatePicker with TimePicker) renders our TimePicker component which has `data-compare`
  keys `time-picker-input` and `time-picker-divider` hardcoded. Blueprint's DatePicker+
  TimePicker specimen doesn't have these tags. These appear as "only in analyst" orphans
  but don't affect the match/differ count. **ORPHAN KEYS — HARMLESS.**

## compare.sh results (after fix)

```
date-picker · light:  4 match · 0 differ  ✓ PERFECT
date-picker · dark:   2 match · 2 differ  (accepted: dark foreground ×2)
```

**data-compare keys paired (both themes):**
- `date-picker-nav` — MATCH light; 1 differ dark (dark foreground — ACCEPTED)
- `date-picker-weekday` — MATCH both. font-weight=600, color=foreground, h=30px, pt=4px
- `date-picker-day` — MATCH both. border 2px transparent, padding 8px, minWidth 30px ✓
- `date-picker-day-selected` — MATCH light; 1 differ dark (dark foreground — ACCEPTED)

Screenshot confirmation (light + dark — compact layout):
- Calendar width ~250px, tight 7-column grid (each col ~30px), matches Blueprint layout
- Caption row: `[January ▼] [2026 ▼] [<] [>]` — matches Blueprint layout exactly
- Weekday row: Su Mo Tu We Th Fr Sa, font-weight:600, normal text color
- Day grid: 30×30 cells, 7 columns, correct 5-week January 2026 layout
- Outside-month days (28-31 from Dec): muted/disabled text color
- Selected day (Jan 15): blue-3 background (#2d72d2), white text, 4px border-radius
- Dark: dark-gray-3 background, correct blue selected day
- TimePicker below: hour + minute input row (0 : 00) aligned center

## New dependencies added

- **`react-day-picker@10.0.1`** — analyst-ui root (`package.json` + `pnpm-lock.yaml`).
  Calendar engine for DatePicker. v10 is newer than Blueprint's internal v8; API
  differences documented in Design decisions above.

## Changes to existing files

- **`src/components/ui/date-picker.tsx`**: New file — DatePicker component.
- **`src/App.tsx`**: DatePickerGallery added + DatePicker import + COMPONENTS entry +
  fixed date/month constants (`FIXED_DATE`, `FIXED_MONTH`).
- **`tools/blueprint-reference/src/App.tsx`**: DatePickerGallery added +
  `DatePicker as BpDatePicker` import + COMPONENTS entry. Uses `useEffect` +
  querySelector to stamp `data-compare` on Blueprint's rdp v8 DOM.
- **`package.json`**: Added `react-day-picker@^10.0.1` dependency.
- **`pnpm-lock.yaml`**: Updated (from pnpm install).
- **`docs/ROADMAP.md`**: DatePicker checked.

## Current state

- **DatePicker:** Implemented and verified — `tools/compare.sh date-picker both`.
- **Build:** `pnpm build` green (tsc + vite).
- **Phase 6:** 2/6 in progress. TimePicker ✓ · DatePicker ✓

## Next steps

> Next action: **DateInput** on `phase-6-datetime`.
>
> DateInput wraps DatePicker in a Popover triggered by a text Input.
> The user types a date string; clicking the Input opens the DatePicker popover.
> Reuses: DatePicker, Popover, InputGroup.
>
> Blueprint spec: `packages/datetime/src/components/date-input/`
>
> Key considerations:
> 1. Popover placement: bottom-start, matching Blueprint's `.bp6-date-input-popover`
> 2. Format string: default `"M/d/yyyy"` (date-fns format)
> 3. Parse on blur: accept typed date string, parse, update selected date
> 4. Clear button inside Input (blueprint-style right element)
> 5. DatePicker is already built — just need the Input + Popover wrapper

## How to resume

```bash
git branch --show-current  # should be phase-6-datetime
pnpm dev                                              # :5173
cd tools/blueprint-reference && pnpm dev              # :5174

tools/compare.sh date-picker both     # re-verify
```

- Relevant files:
  - `src/components/ui/date-picker.tsx` (new — DatePicker component)
  - `src/components/ui/time-picker.tsx` (reused — TimePicker)
  - `src/App.tsx` (DatePickerGallery added + DatePicker import)
  - `tools/blueprint-reference/src/App.tsx` (DatePickerGallery added + BpDatePicker import)
  - `package.json` (react-day-picker added)
  - `docs/ROADMAP.md` (DatePicker checked)
  - `docs/handoffs/0053-date-picker.md` (this file)
