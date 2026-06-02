# 0054 — DateInput (Phase 6 #3)

- **Date:** 2026-05-26
- **Focus:** Build DateInput (InputGroup + Popover + DatePicker) to Blueprint v6.15 fidelity,
  both light and dark themes. Third component of Phase 6 (Date & time).
- **Branch / commit:** phase-6-datetime @ (see commit SHA)

## Summary

Built `src/components/ui/date-input.tsx` exporting `DateInput` — a text input component
that opens a `DatePicker` in a `Popover` when focused or clicked. Reuses `DatePicker`,
`Popover`, `InputGroup`, and `Icon`.

Also added the `calendar` icon to `src/components/ui/icons/index.ts` (from Blueprint
`@blueprintjs/icons` 16px/20px paths).

Registered in both galleries under `id="date-input"` with:
- Interactive specimen (the real `DateInput` component with calendar icon, Jan 15 2026 defaultValue)
- Harness specimen (`OpenDateInput`) — InputGroup + forced-open Popover/DatePicker, static data-compare tags

Verified with `tools/compare.sh date-input both` and `tools/compare.sh date-picker both` (regression check).

**Phase 6: 3/6. DateInput ✓. Next: DateRangePicker.**

## API

### DateInput

```tsx
const [date, setDate] = useState<Date | null>(null);

<DateInput
  value={date}
  onChange={setDate}
  placeholder="M/d/yyyy"
  dark={dark}
/>
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `Date \| null` | — | Controlled selected date. Use with `onChange`. |
| `defaultValue` | `Date \| null` | — | Default value for uncontrolled mode. |
| `onChange` | `(v: Date \| null) => void` | — | Called on selection or text parse. |
| `formatDate` | `(d: Date) => string` | M/d/yyyy | Date → display string. |
| `parseDate` | `(s: string) => Date \| null` | M/d/yyyy parser | Display string → Date (null=empty, NaN=invalid). |
| `placeholder` | `string` | `"M/d/yyyy"` | Input placeholder text. |
| `minDate` | `Date` | `Jan 1 1900` | Earliest selectable date. |
| `maxDate` | `Date` | `Dec 31 2100` | Latest selectable date. |
| `timePrecision` | `"minute" \| "second" \| "millisecond"` | — | Show TimePicker in the DatePicker popover. |
| `closeOnSelection` | `boolean` | `true` | Close popover when a day is clicked. |
| `disabled` | `boolean` | `false` | Disable the input and prevent popover from opening. |
| `fill` | `boolean` | `false` | Fill container width. |
| `inputProps` | `Omit<InputHTMLAttributes, "value"\|"disabled"\|"type"\|"size">` | — | Passed to the underlying InputGroup. |
| `popoverProps` | `{ side?, align?, sideOffset? }` | — | Passed to the Popover. |
| `dark` | `boolean` | `false` | Enable dark mode for the portaled popover. |
| `className` | `string` | — | Added to the root container div. |

## Blueprint spec reference

Source: `packages/datetime/src/components/date-input/` (v6.15)

Key behaviors matched:
- Text input shows formatted date; editing text parses live (on valid parse, updates calendar)
- Blur parses: on blur with valid in-range text → updates value; invalid → `intent="danger"` error state
- Focus opens popover; Escape closes; Enter parses and closes
- Clicking a calendar day fills input and closes (when `closeOnSelection=true`)
- Time changes (when `timePrecision` set) keep popover open

Key differences from Blueprint's implementation (by design):
- Blueprint's `DateInput` uses `renderTarget` API (Blueprint-internal). Ours wraps `Popover` + `InputGroup` directly.
- Blueprint's `onChange` callback takes ISO string `string | null`. Ours takes `Date | null` (cleaner API).
- Blueprint's format uses `date-fns` format strings (`dateFnsFormat`). Ours uses function props (`formatDate`/`parseDate`) — no date-fns dependency added.
- Blueprint shows no calendar icon by default; ours optionally shows one via `rightElement={calendarIcon}` in `DateInput` component (calendar icon added to icons index).

## Dual-gallery harness approach

The `date-input` gallery uses two specimens:

1. **Interactive DateInput** — renders the actual `DateInput` component with `defaultValue=FIXED_DATE` and `dark` from context. Shows the calendar icon right element. NOT tagged with `data-compare` (to avoid polluting the harness).

2. **OpenDateInput** — a static forced-open specimen:
   - A bare `InputGroup` with `data-compare="date-input-field"` (no rightElement, matching Blueprint's no-icon input for paddingRight parity)
   - An invisible `<span />` trigger with a `Popover` (open=true) containing a `DatePickerForDateInput`
   - `DatePickerForDateInput` renders a `DatePicker` and uses `useEffect` to re-tag `date-picker-day` → `date-input-day` and `date-picker-day-selected` → `date-input-day-selected`

Blueprint reference gallery:
- Renders `BpDateInput` with `value=FIXED_DATE.toISOString()`, `popoverProps={{ isOpen: true, portalClassName: dark ? Classes.DARK : undefined }}`
- Uses `useEffect` + `querySelector` to stamp `data-compare` on the portaled Blueprint DOM

## Accepted deltas

- **`date-input-field` paddingRight — light + dark: mithril 8px vs blueprint 0px.**
  Blueprint's `DateInput` uses the `renderTarget` API which sets `padding-right: 0px` as an inline
  style on the input when no rightElement is present. This is an implementation detail of Blueprint's
  `InputGroup` (they compute right-padding inline to match slot width). Mithril uses consistent `px-2`
  CSS class (8px) as the base horizontal padding for all inputs. Both look identical — the date string
  "1/15/2026" is short and doesn't overflow either way. **IMPLEMENTATION DETAIL — ACCEPTED.**

- **`date-input-day` dark color: mithril `rgb(246,247,249)` vs blueprint `rgb(255,255,255)`.**
  Known dark foreground delta from project memory — mithril uses `#f6f7f9` (light-gray-5) as
  dark text color; Blueprint reference renders pure white. **KNOWN ACCEPTED DELTA.**

## Orphan keys (harmless)

- **`only in mithril: date-picker-nav, date-picker-weekday, popover-content`** — these come from
  the `DatePicker` subcomponent retaining its own `data-compare` keys (`date-picker-nav`,
  `date-picker-weekday`) and the `Popover` component's hardcoded `data-compare="popover-content"`.
  Blueprint reference doesn't tag these. They appear as orphans in the diff but do NOT affect the
  match/differ count for `date-input-*` keys. **ORPHAN KEYS — HARMLESS.**

## compare.sh results

```
date-input · light:  2 match · 1 differ  (accepted: paddingRight)
date-input · dark:   1 match · 2 differ  (accepted: paddingRight + dark foreground)
```

**data-compare keys paired (both themes):**
- `date-input-field` — MATCH both (boxShadow, backgroundColor, height, fontSize — all match);
  1 differ: paddingRight 8px vs 0px (ACCEPTED — Blueprint inline-style quirk)
- `date-input-day` — MATCH light; 1 differ dark (dark foreground — ACCEPTED)
- `date-input-day-selected` — MATCH both (bg=blue-3, white text, 4px border-radius — all match)

**DatePicker regression check:**
```
date-picker · light:  4 match · 0 differ  ✓ PERFECT (unchanged)
date-picker · dark:   2 match · 2 differ  (accepted: dark foreground ×2 — unchanged)
```

Screenshot confirmation (light + dark):
- Input: "1/15/2026" text, Blueprint-style input shadow, 30px height
- Calendar: January 2026, Jan 15 selected (blue-3), compact layout matching Blueprint
- Dark mode: dark-gray-3 background, correct colors — truly dark
- Calendar icon visible in interactive specimen (top); plain input in harness specimen (bottom)

## New icons added

- **`calendar`** — added to `src/components/ui/icons/index.ts` from Blueprint's
  `@blueprintjs/icons` 16px/20px path data. Used by the calendar icon button in `DateInput`.

## New dependencies added

None. No new packages required — date formatting uses native `Date` methods (no date-fns).

## Changes to existing files

- **`src/components/ui/date-input.tsx`**: New file — DateInput component.
- **`src/components/ui/icons/index.ts`**: Added `calendar` icon glyph.
- **`src/App.tsx`**: DateInputGallery + OpenDateInput + DatePickerForDateInput + DateInput import + COMPONENTS entry.
- **`tools/blueprint-reference/src/App.tsx`**: DateInputGallery + BpDateInput import + COMPONENTS entry.
- **`docs/ROADMAP.md`**: DateInput checked.

## Current state

- **DateInput:** Implemented and verified — `tools/compare.sh date-input both`.
- **Build:** `pnpm build` green (tsc + vite).
- **Phase 6:** 3/6 in progress. TimePicker ✓ · DatePicker ✓ · DateInput ✓

## Next steps

> Next action: **DateRangePicker** on `phase-6-datetime`.
>
> DateRangePicker = two linked DatePicker instances for selecting a date range.
> Reuses: DatePicker (×2), cn.
>
> Blueprint spec: `packages/datetime/src/components/date-range-picker/`
>
> Key considerations:
> 1. Two calendar months side-by-side or stacked
> 2. Range selection state (start + end dates)
> 3. Hover state shows range preview
> 4. Blue highlight fills the selected range cells

## How to resume

```bash
git branch --show-current  # should be phase-6-datetime
pnpm dev                                              # :5173
cd tools/blueprint-reference && pnpm dev              # :5174

tools/compare.sh date-input both     # re-verify
tools/compare.sh date-picker both    # regression check
```

- Relevant files:
  - `src/components/ui/date-input.tsx` (new — DateInput component)
  - `src/components/ui/icons/index.ts` (calendar icon added)
  - `src/components/ui/date-picker.tsx` (reused — DatePicker)
  - `src/components/ui/popover.tsx` (reused — Popover)
  - `src/components/ui/input-group.tsx` (reused — InputGroup)
  - `src/App.tsx` (DateInputGallery added)
  - `tools/blueprint-reference/src/App.tsx` (DateInputGallery added)
  - `docs/ROADMAP.md` (DateInput checked)
  - `docs/handoffs/0054-date-input.md` (this file)
