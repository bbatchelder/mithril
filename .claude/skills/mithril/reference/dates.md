# Dates & time

> Seeded reference: the components and their shared overlay wiring. Extend with concrete recipes
> as you use them.

## The pieces

- **`TimePicker`** — hours/minutes/seconds spinner.
- **`DatePicker`** — inline calendar.
- **`DateRangePicker`** — inline two-month range calendar.
- **`DateInput`** — text field + calendar in a popover.
- **`DateRangeInput`** — two fields + range calendar in a popover.
- **`TimezoneSelect`** — Select-based timezone chooser.

## Shared wiring (the part that bites)

The **input** variants (`DateInput`, `DateRangeInput`, `TimezoneSelect`) open a **portaled
popover**, so the overlay rules apply:

- Pass **`dark={dark}`** (portal — see [overlays](overlays.md)).
- They open on **focus** and keep the popover anchored (not click-toggled). This is exactly the
  `anchorOnly` case from [overlays](overlays.md): focusing the field opens the panel, and an
  anchor (not a trigger) keeps a trailing click from toggling it back shut. `DateRangeInput` is
  the canonical reason that prop exists.

## Calendar internals

The pickers render their own day grid (via react-day-picker). When extending, keep keyboard
navigation working (arrow keys move days, Enter selects) and verify in both themes.

## Focus-driven input popovers (DateInput / DateRangeInput) — the fragile bits

These open a calendar on **focus** and let you **type** into the field. That combination is delicate;
the things that bite (all are real bugs that were fixed here, guard them when you touch these):

- **`autoFocusContent={false}` is mandatory.** Without it Radix auto-focuses the first control in
  the calendar (the month `<select>`) the instant the field is focused, so you can never type a date —
  keystrokes land in the dropdown. Keep DOM focus on the input (the combobox contract).
- **Don't couple the input's "is editing" flag to the popover's open state.** The popover briefly
  toggles closed→open as it settles focus; if `handleOpenChange(false)` clears the editing flag
  (`isInputFocused` / `activeField`), the field flips to its formatted-value branch and becomes
  read-only (every keystroke resets). Track real focus loss via the input's `onBlur` only.
- **Blur must not commit while focus stays inside the widget.** Clicking a calendar day blurs the
  focused field; if the blur handler parses + commits, its `onChange` races the calendar's `onChange`
  and wipes the in-progress range (each click just resets `start`). Skip the blur commit when
  `e.relatedTarget` is the sibling input or inside the popover (`closest('[role="dialog"]')`).
- **Don't programmatically move focus between the two range inputs mid-selection.** Calling
  `endInput.focus()` after picking the start remounts the open calendar (Presence entering/exiting
  copy detaches the day buttons) and swallows the next click. The open calendar is prompt enough.

## DateRangePicker navigation

Contiguous mode (the default) advances the **pair by a single month** (Jan/Feb → Feb/Mar). Don't set
react-day-picker's `pagedNavigation` — it jumps by `numberOfMonths` (2) and skips a month.
