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

The pickers render their own day grid (not a third-party calendar). When extending, keep keyboard
navigation working (arrow keys move days, Enter selects) and verify in both themes.
