# Forms — inputs, selects, controls

> Seeded reference: the patterns below are the ones with non-obvious wiring. Not yet an
> exhaustive catalog of every form component — extend as you hit new cases.

## Field anatomy: Label / FormGroup / control

Wrap controls in `FormGroup` for the label + helper/error layout. Intent flows from the
`FormGroup` to its control's styling — set `intent="danger"` on the group for validation errors,
and pass `helperText` for inline guidance.

```tsx
<FormGroup label="Workspace name" labelInfo="(required)" intent={err ? "danger" : "none"}
           helperText={err ?? "Shown in the workspace sidebar and in URLs."}>
  <InputGroup intent={err ? "danger" : "none"} value={name} onChange={…} />
</FormGroup>
```

## Sizing gotcha: NumericInput / InputGroup width

`NumericInput` composes an `InputGroup` with a stepper. To set its width, the width must reach the
**inner `<input>`** (via InputGroup), not the outer wrapper — otherwise the field + stepper don't
size together. Forward `style.width` to the inner input. (Same idea anywhere you wrap an input in
a group with adornments: size the input, not just the wrapper.)

## Select / Suggest / MultiSelect / Omnibar

These are **composed on Popover** and portal their listbox, so:

- Pass **`dark={dark}`** (portal — see [overlays](overlays.md)).
- They follow the WAI-ARIA combobox contract: focus stays on the `role="combobox"` input while the
  `role="listbox"` panel is open, with the active option conveyed via `aria-activedescendant`. The
  popover is anchored (not click-toggled) and opens are driven internally — don't fight that.
- Options are `MenuItem` with `roleStructure="listoption"` (the `<li>` is the option; its inner is
  presentational to avoid nested-interactive). If you author custom option renderers, keep that
  structure.

## Toggles & control cards

`Checkbox`, `Radio`/`RadioGroup`, `Switch`, `SegmentedControl`, plus the card variants
(`CheckboxCard`, `RadioCard`, `SwitchCard`) for larger selectable tiles. `ControlGroup` lays out
adjacent controls/inputs as a single attached row.

## Accessibility note

Several hand-rolled controls have documented keyboard/ARIA gaps vs a fully-accessible baseline
(historically the Select-family, Menu, ContextMenu, Hotkeys, Tabs). "Done" in the gallery ≠
audited. If you touch one, verify keyboard nav + roles; there are Vitest behavior tests in
`src/components/ui/__tests__/` to extend (`pnpm test`).
