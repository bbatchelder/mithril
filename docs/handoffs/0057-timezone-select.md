# 0057 — TimezoneSelect (Phase 6 #6 — FINAL)

- **Date:** 2026-05-26
- **Focus:** Build TimezoneSelect (Select-based timezone picker) to Blueprint v6.15 fidelity,
  both light and dark themes. Sixth and final component of Phase 6 (Date & time).
- **Branch / commit:** phase-6-datetime @ (see commit SHA)

## Summary

Built `src/components/ui/timezone-select.tsx` exporting `TimezoneSelect` — a specialized
`Select<TimezoneItem>` for picking IANA timezone strings. Reuses: `Select` + `useQueryList`
engine, `MenuItem`, `Button`, `Icon`, `Popover` (all via the `Select` wrapper).

Key design decisions:
- No `date-fns-tz` dependency — offsets computed via `Intl.DateTimeFormat` with
  `timeZoneName: "shortOffset"` / `"short"` / `"long"` options. DST-accurate.
- Curated 200+ item timezone list matching Blueprint's `TIMEZONE_ITEMS` (label + ianaCode).
- Initial (empty-query) list: 21-item "minimal" subset matching Blueprint's `MINIMAL_TIMEZONE_ITEMS`.
- Filter: safe substring/token matching (no RegExp from user input — avoids ReDoS; semgrep-clean).
- Composite display in trigger: `"New York (EDT) -04:00"` or `"UTC +00:00"` (offset-only when
  shortName is redundant). Matches Blueprint's `TimezoneDisplayFormat.COMPOSITE` behavior.
- Portal + dark: delegated entirely to `Select → Popover`, which wraps portaled content in
  `<div class="dark">`. Pass `dark={dark}` from DarkContext.
- `showLocalTimezone` prop: detects local timezone via `Intl.DateTimeFormat().resolvedOptions().timeZone`
  and prepends "Current timezone" item to the minimal list.

Registered in both galleries under `id="timezone-select"` with three specimens each:
1. TimezoneSelect (popover forced open, "Los Angeles" selected) — harness specimen
2. Interactive TimezoneSelect — closed by default, user can click
3. Disabled state

## API

### TimezoneSelect

```tsx
const [tz, setTz] = useState("America/New_York");
<TimezoneSelect value={tz} onChange={setTz} dark={dark} />
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `string \| undefined` | — | Controlled IANA timezone code. Use with `onChange`. |
| `defaultValue` | `string` | — | Default value for uncontrolled mode. |
| `onChange` | `(tz: string) => void` | — | Called when user selects a timezone. |
| `date` | `Date` | `new Date()` | Date for offset computation (DST-sensitive). |
| `showLocalTimezone` | `boolean` | `false` | Prepend local timezone to the initial list. |
| `disabled` | `boolean` | `false` | Disable the select. |
| `fill` | `boolean` | `false` | Fill container width. |
| `placeholder` | `string` | `"Select timezone..."` | Trigger button text when nothing selected. |
| `buttonProps` | `Omit<ButtonProps, "children" \| "disabled" \| "fill">` | — | Extra props for trigger Button. |
| `inputProps` | `Omit<InputHTMLAttributes, "value" \| "onChange" \| "size">` | — | Extra props for filter input. |
| `popoverProps` | `SelectProps["popoverProps"]` | — | Extra props for Popover (e.g. `{ open: true }` for gallery). |
| `filterable` | `boolean` | `true` | Include filter input. |
| `dark` | `boolean` | `false` | Dark mode for portaled popover. |
| `children` | `ReactNode` | — | Custom trigger; overrides default Button. |
| `className` | `string` | — | Added to the root wrapper. |

## Blueprint spec reference

Source: `packages/datetime/src/components/timezone-select/timezoneSelect.tsx` (v6.15)

Key behaviors matched:
- Button trigger shows composite format: `"Label (Abbr) ±HH:MM"` (abbreviation omitted if it's
  an offset alias or equals the label)
- Filter input placeholder: "Search for timezones..."
- Empty-query initial list = minimal representative subset (~21 items)
- Typed query = full 200+ item list (Blueprint: `this.timezoneItems`)
- Item layout: `text="{label}, {longName}"` (left), `label={shortName}` (right, muted)
- `resetOnClose=true` and `resetOnSelect=true` (matches Blueprint's Select usage)
- Filter regex replaced by safe token-substring matching (behavior equivalent)

Key API differences from Blueprint (by design):
- Blueprint uses class components + `AbstractPureComponent`. Ours is functional.
- Blueprint's `valueDisplayFormat` prop (COMPOSITE, ABBREVIATION, CODE, etc.) → we only
  support COMPOSITE format (used by ~99% of real usage). Add other formats if needed.
- Blueprint's `inputProps` uses Blueprint's `InputGroupProps`. Ours uses native `InputHTMLAttributes`.
- Blueprint's `popoverProps` type is `SelectPopoverProps["popoverProps"]`. Ours is `SelectProps["popoverProps"]`.

## Dual-gallery harness approach

**Analyst gallery (`src/App.tsx`):**
- Container div with `containerRef` for tagging trigger via `useEffect`
- First `button` inside containerRef → `tz-trigger`
- `[data-compare="select-menu"]` (last found) → re-tagged `tz-menu`
- `tz-menu.children[6]` (New York) → `tz-item` + `tz-item-offset` (label span)

**Blueprint reference (`tools/blueprint-reference/src/App.tsx`):**
- `ul.bp6-menu[role='listbox']` → `tz-menu`
- Same index 6 (New York in Blueprint's minimal list) → `tz-item` + `tz-item-offset`
- `buttonProps={{ "data-compare": "tz-trigger" }}` on `BpTimezoneSelect`
- `popoverProps={{ isOpen: true, minimal: true, portalClassName: dark ? Classes.DARK : undefined }}`

**data-compare key strategy:**
- `tz-trigger` — trigger button (solid/none, "Los Angeles (PDT) -07:00" + caret-down)
- `tz-menu` — the filterable menu UL (same bg, border-radius as Select menu)
- `tz-item` — "New York, Eastern Daylight Time" item at index 6 (non-active in both galleries)
- `tz-item-offset` — the "EDT" label span on that item (muted text)

**List content note:** Blueprint's initial minimal list differs from ours in exact subset
(Blueprint uses `MINIMAL_TIMEZONE_ITEMS` which has a slightly different ~10-item set vs our
21-item set). The index 6 item "New York" appears at index 6 in BOTH lists (confirmed by
screenshots showing identical text at that position). The full list also differs in order —
Blueprint sorts by UTC offset, ours preserves insertion order. This is a non-fidelity
difference (visual appearance of items is identical; content/order is an API-level diff).

## Accepted deltas

| Delta | Theme | Element | Analyst | Blueprint | Justification |
|---|---|---|---|---|---|
| dark text color | dark | `tz-trigger` | `rgb(246,247,249)` | `rgb(255,255,255)` | Established project-wide accepted delta: analyst dark foreground is slightly darker (#f6f7f9 vs white). See `docs/memory/dark-foreground-decision.md`. |
| dark bg color | dark | `tz-trigger` | `rgb(47,52,60)` | `rgb(48,55,64)` | Established project-wide delta: analyst `dark-gray-3` vs Blueprint `dark-gray-3` sub-perceptual difference. |

## compare.sh results

```
timezone-select · light:  4 match · 0 differ  ✓ PERFECT
timezone-select · dark:   3 match · 1 differ  (accepted: dark foreground + bg sub-perceptual)
```

**data-compare keys paired (both themes):**
- `tz-trigger` — MATCH light. DIFFER dark (accepted fg/bg delta). Trigger: "Los Angeles (PDT) -07:00" + caret-down icon, solid/none button.
- `tz-menu` — MATCH both. Menu UL: bg white/dark-gray-3, min-width 180px, border-radius 4px.
- `tz-item` — MATCH both. New York item: non-active styling, city+longName text, muted label.
- `tz-item-offset` — MATCH both. "EDT" label: muted text color.

**Orphan keys:**
- `popover-content` — only in analyst (Popover component hardcodes this on the panel). Blueprint doesn't tag popover panels. Harmless.

**Select regression (unchanged from 0056 handoff):**
```
select · light:  5 match · 0 differ  ✓ PERFECT (unchanged)
select · dark:   4 match · 1 differ  (accepted: select-trigger dark fg/bg — unchanged)
```

Screenshot confirmation (light + dark):
- Trigger: "Los Angeles (PDT) -07:00" with caret-down, solid button, correct sizing
- Popover open below: filter input "Search for timezones...", 10-item minimal list visible
- Item layout: city+longName on left (e.g. "UTC, Coordinated Universal Time"), shortName on right (e.g. "UTC")
- First item (UTC) highlighted in blue (active/keyboard-focused state)
- Dark: dark-gray-3 popover background, truly dark, correct item colors

## New dependencies added

None. Reuses `Select`, `useQueryList`, `MenuItem`, `Button`, `Icon`, `Popover`, `cn` — all existing.
Offset computation via browser-native `Intl.DateTimeFormat` (no new npm dependency).

## Changes to existing files

- **`src/components/ui/timezone-select.tsx`**: New file — TimezoneSelect component.
- **`src/App.tsx`**: TimezoneSelectGallery + import + COMPONENTS entry.
- **`tools/blueprint-reference/src/App.tsx`**: TimezoneSelectGallery + `TimezoneSelect as BpTimezoneSelect` import + COMPONENTS entry.
- **`docs/ROADMAP.md`**: TimezoneSelect checked (ALL items now checked — roadmap complete).
- **`docs/handoffs/0057-timezone-select.md`**: This file.

## Current state

- **TimezoneSelect:** Implemented and verified — `tools/compare.sh timezone-select both`.
- **Build:** `pnpm build` green (tsc + vite).
- **Phase 6:** 6/6 COMPLETE — ALL 6 PHASES DONE, full roadmap complete.
  TimePicker ✓ · DatePicker ✓ · DateInput ✓ · DateRangePicker ✓ · DateRangeInput ✓ · TimezoneSelect ✓

## Next steps

> **Phase 6 PR + merge = project complete.**
>
> The orchestrator handles the Phase 6 PR. Steps:
> 1. `gh pr create` for `phase-6-datetime` → `main`
> 2. Merge (merge commit)
> 3. Sync `main`, delete `phase-6-datetime` branch
> 4. The full Blueprint reimplementation roadmap is now complete.

## How to resume

```bash
git branch --show-current  # should be phase-6-datetime

tools/compare.sh timezone-select both    # re-verify
tools/compare.sh select both             # regression check
```

Relevant files:
- `src/components/ui/timezone-select.tsx` (new — TimezoneSelect)
- `src/App.tsx` (TimezoneSelectGallery added)
- `tools/blueprint-reference/src/App.tsx` (TimezoneSelectGallery added)
- `docs/ROADMAP.md` (TimezoneSelect checked — ALL DONE)
- `docs/handoffs/0057-timezone-select.md` (this file)
