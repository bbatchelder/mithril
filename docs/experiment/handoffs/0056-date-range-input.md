# 0056 — DateRangeInput (Phase 6 #5)

- **Date:** 2026-05-26
- **Focus:** Build DateRangeInput (two InputGroup fields sharing a single DateRangePicker Popover)
  to Blueprint v6.15 fidelity, both light and dark themes. Fifth component of Phase 6 (Date & time).
- **Branch / commit:** phase-6-datetime @ (see commit SHA)

## Summary

Built `src/components/ui/date-range-input.tsx` exporting `DateRangeInput` — a two-input component
(start + end date fields) that opens a shared `DateRangePicker` in a `Popover` when either input
is focused. Reuses: `DateRangePicker`, `Popover`, `InputGroup`, `cn`.

Key behaviors:
- Two `InputGroup` fields side-by-side (start + end) in an `inline-flex flex-row` container
- Focusing either input opens the shared Popover with the DateRangePicker
- Selecting start then end date fills both inputs and closes (when `closeOnSelection=true`)
- After start is selected, focus moves to end input to prompt end selection
- Typing in either field parses live (on valid parse, updates calendar selection)
- Blur parses: valid in-range text → updates value; invalid → `intent="danger"` error state
- Escape closes popover; Enter parses and updates the typed field
- Controlled/uncontrolled via `value`/`defaultValue` (`DateRangePickerValue = { start, end }`)
- Dark mode: `dark` prop passed to Popover which handles the portal dark-class wrapper

Registered in both galleries under `id="date-range-input"` with two specimens:
- Interactive DateRangeInput (defaultValue Jan 8–20, 2026)
- Open specimen: two plain `InputGroup`s + forced-open Popover with `DateRangePicker`

Verified with `tools/compare.sh date-range-input both` (light 3·0 / dark 3·0, PERFECT).
DateRangePicker regression: light 3·0 / dark 2·1 (unchanged accepted delta).

**Phase 6: 5/6. DateRangeInput ✓. Next: TimezoneSelect (the final component of Phase 6).**

## API

### DateRangeInput

```tsx
const [range, setRange] = useState<DateRangePickerValue>({ start: null, end: null });

<DateRangeInput
  value={range}
  onChange={setRange}
  dark={dark}
/>
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `DateRangePickerValue` | — | Controlled selected range. Use with `onChange`. |
| `defaultValue` | `DateRangePickerValue` | — | Default value for uncontrolled mode. |
| `onChange` | `(v: DateRangePickerValue) => void` | — | Called on selection change. |
| `formatDate` | `(d: Date) => string` | M/d/yyyy | Date → display string. |
| `parseDate` | `(s: string) => Date \| null` | M/d/yyyy parser | Display string → Date (null=empty, NaN=invalid). |
| `minDate` | `Date` | `Jan 1 1900` | Earliest selectable date. |
| `maxDate` | `Date` | `Dec 31 2100` | Latest selectable date. |
| `allowSingleDayRange` | `boolean` | `false` | Allow start === end (single day range). |
| `contiguousCalendarMonths` | `boolean` | `true` | When true, navigating left also moves right. |
| `closeOnSelection` | `boolean` | `true` | Close popover when both start and end are selected. |
| `disabled` | `boolean` | `false` | Disable both inputs and prevent popover from opening. |
| `fill` | `boolean` | `false` | Fill container width. |
| `startInputProps` | `Omit<InputHTMLAttributes, …>` | — | Passed to the start InputGroup. |
| `endInputProps` | `Omit<InputHTMLAttributes, …>` | — | Passed to the end InputGroup. |
| `popoverProps` | `{ side?, align?, sideOffset? }` | — | Passed to the Popover. |
| `dark` | `boolean` | `false` | Enable dark mode for the portaled popover. |
| `className` | `string` | — | Added to the root container div. |

```ts
// Shared with DateRangePicker
export interface DateRangePickerValue {
    start: Date | null;
    end: Date | null;
}
```

## Blueprint spec reference

Source: `packages/datetime/src/components/date-range-input/dateRangeInput.tsx` (v6.15)

Key behaviors matched:
- Two text inputs side-by-side (Blueprint: `.bp6-control-group` → `display: flex`)
- Both inputs are standard InputGroup height (30px medium)
- Shared Popover with DateRangePicker (`placement="bottom-start"`, minimal)
- Focus either input → open popover; select range → close (when closeOnSelection=true)
- Error state: `intent="danger"` on InputGroup when typed text fails to parse
- Dark mode: Popover handles dark portal wrapper via `dark` prop

Key differences from Blueprint's implementation (by design):
- Blueprint's `value` is `[Date | null, Date | null]` (tuple). Ours is `{ start, end }` (object),
  consistent with `DateRangePicker`.
- Blueprint uses `DateFnsLocalizedComponent` (date-fns dependency). Ours uses native Date (no dep).
- Blueprint's `shortcuts`, `selectAllOnFocus`, `overlappingDatesMessage`, `onError` props not
  implemented — not needed for the core fidelity target.
- Blueprint renders the two inputs via `renderTarget` API (flat DOM). Ours wraps them in an
  `inline-flex` div which Radix Popover uses as its trigger via `asChild`.
- Blueprint shows a popover arrow; ours uses `minimal={true}` / `arrow={false}` (consistent with
  DateInput which also uses minimal popover). Sub-perceptual visual difference.

## Dual-gallery harness approach

**Mithril gallery (`src/App.tsx`):**
- Two specimens: interactive `DateRangeInput` (defaultValue Jan 8–20) + open specimen
- Open specimen: two plain `InputGroup` fields + forced-open `Popover` containing `DateRangePickerForDRI`
- `DateRangePickerForDRI`: wraps `DateRangePicker` + `useEffect` to retag `drp-day-endpoint`
  - Retags ALL `drp-day-endpoint` elements: first one becomes `dri-day-endpoint`, rest are cleared
  - This ensures only Jan 8 (range_start) is tagged, matching Blueprint reference

**Blueprint reference (`tools/blueprint-reference/src/App.tsx`):**
- Two specimens: interactive `BpDateRangeInput` + forced-open `BpDateRangeInput`
- Open specimen uses `popoverProps={{ isOpen: true, portalClassName: Classes.DARK, onClose: () => {} }}`
- `useEffect` + `querySelector` stamps `data-compare` on the portaled DOM:
  - `inputs[0]` → `dri-start` (start input)
  - `inputs[1]` → `dri-end` (end input)
  - `button.rdp-day_range_start` → `dri-day-endpoint` (range start = Jan 8)

**data-compare key strategy:**
- `dri-start` → the start `<input>` element — for input styling comparison
- `dri-end` → the end `<input>` element — for input styling comparison
- `dri-day-endpoint` → the range start day (Jan 8) in the open calendar
  - Jan 8 is `range_start` → `border-radius: 4px 0px 0px 4px` (right edge squared)
  - Both galleries consistently tag Jan 8 so borderRadius comparison is stable

## Accepted deltas

None. Both themes are **PERFECT** (3 match · 0 differ).

## Orphan keys (harmless)

- **`only in mithril: drp-day, drp-day-range, drp-nav-next, drp-nav-prev, popover-content`** —
  these come from the nested `DateRangePicker` (retains its own `data-compare` keys) and the
  `Popover` component's hardcoded `data-compare="popover-content"`. Blueprint reference doesn't
  tag these. **ORPHAN KEYS — HARMLESS.**

## compare.sh results

```
date-range-input · light:  3 match · 0 differ  ✓ PERFECT
date-range-input · dark:   3 match · 0 differ  ✓ PERFECT
```

**data-compare keys paired (both themes):**
- `dri-start` — MATCH both. Input styling: boxShadow (input shadow), height 30px, backgroundColor white/dark
- `dri-end` — MATCH both. Same as dri-start
- `dri-day-endpoint` — MATCH both. bg=blue-3 (#2d72d2), white text, borderRadius 4px 0px 0px 4px (start-square)

**DateRangePicker regression check (date-range-picker.tsx NOT modified):**
```
date-range-picker · light:  3 match · 0 differ  ✓ PERFECT (unchanged)
date-range-picker · dark:   2 match · 1 differ  (accepted: drp-day dark foreground — unchanged)
```

Screenshot confirmation (light + dark):
- Two side-by-side inputs: "1/8/2026" and "1/20/2026"
- Popover open below: two compact calendars (January + February 2026)
- Jan 8 (blue filled start), Jan 9–19 (light blue range band), Jan 20 (blue filled end)
- Dark: dark-gray-3 background, correct blue range styling, truly dark panel

## New dependencies added

None. Reuses `DateRangePicker`, `Popover`, `InputGroup`, `cn` — all existing.

## Changes to existing files

- **`src/components/ui/date-range-input.tsx`**: New file — DateRangeInput component.
- **`src/App.tsx`**: DateRangeInputGallery + OpenDateRangeInput + DateRangePickerForDRI + import + COMPONENTS entry.
- **`tools/blueprint-reference/src/App.tsx`**: DateRangeInputGallery + `DateRangeInput as BpDateRangeInput` import + COMPONENTS entry.
- **`docs/ROADMAP.md`**: DateRangeInput checked.

## Current state

- **DateRangeInput:** Implemented and verified — `tools/compare.sh date-range-input both`.
- **Build:** `pnpm build` green (tsc + vite).
- **Phase 6:** 5/6 in progress. TimePicker ✓ · DatePicker ✓ · DateInput ✓ · DateRangePicker ✓ · DateRangeInput ✓

## Next steps

> Next action: **TimezoneSelect** on `phase-6-datetime`. This is the LAST component of Phase 6.
>
> TimezoneSelect = a Select-based dropdown for choosing a timezone.
> Reuses: Select (or HTMLSelect), Icon.
>
> Blueprint spec: `packages/datetime/src/components/timezone-select/`
>
> Key considerations:
> 1. List of IANA timezone strings (Intl.supportedValuesOf("timeZone") or hardcoded list)
> 2. Searchable dropdown (like a Suggest / Select with filter)
> 3. Display: local timezone offset + city name
> 4. Blueprint's TimezoneSelect uses a Popover + filterable Select internally
> 5. After TimezoneSelect: Phase 6 complete → open PR → merge to main

## How to resume

```bash
git branch --show-current  # should be phase-6-datetime
pnpm dev                                              # :5173
cd tools/blueprint-reference && pnpm dev              # :5174

tools/compare.sh date-range-input both    # re-verify
tools/compare.sh date-range-picker both   # regression check
```

- Relevant files:
  - `src/components/ui/date-range-input.tsx` (new — DateRangeInput component)
  - `src/components/ui/date-range-picker.tsx` (reused — DateRangePicker)
  - `src/components/ui/popover.tsx` (reused — Popover)
  - `src/components/ui/input-group.tsx` (reused — InputGroup)
  - `src/App.tsx` (DateRangeInputGallery added)
  - `tools/blueprint-reference/src/App.tsx` (DateRangeInputGallery added)
  - `docs/ROADMAP.md` (DateRangeInput checked)
  - `docs/handoffs/0056-date-range-input.md` (this file)
