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

### Use the built-in `label` prop — don't wrap the control in your own `<label>`

`Checkbox`/`Radio`/`Switch` **are themselves a `<label>`** that lays out the indicator + caption
with Blueprint's native alignment: the indicator is `align-middle` with a deliberate vertical
nudge (e.g. the Switch track carries `-mt-[3px]`), and the whole thing defaults to `block mb-2`.
Pass the caption via the **`label` prop**, not as a sibling text node in your own wrapper:

```tsx
// ✅ caption rides the control's own alignment
<Switch inline checked={on} onChange={…}
        label={<span className="text-body-sm text-foreground-muted">Follow</span>} />

// ❌ outer flex label fights the control's internal -mt/mb → indicator sits above the text
<label className="flex items-center gap-2 text-body-sm">
  <Switch checked={on} onChange={…} /> Follow
</label>
```

Nesting the control in an external `flex items-center` wrapper looks like it should center
things, but it stacks *two* labels and the control's internal offset/margin throws the indicator
off the text baseline. Reach for **`inline`** when placing these in a horizontal row (navbar,
toolbar) — it swaps the default `block mb-2` for `inline-block` so adjacent toggles sit flush.
Style the caption by passing styled content to `label` (the control sets the base text size).

## File upload: FileInput vs FileDropzone

Two file controls, different jobs:

- **`FileInput`** — the Blueprint-faithful single-line "Choose file… / Browse" box. Purely
  presentational about the selection: *you* drive the displayed `text` + `hasSelection`; it does
  not render the chosen file name. Wire the native input via `inputProps`/`onInputChange`.
- **`FileDropzone`** — a token-styled drag-and-drop surface + file list, built on
  `react-dropzone`'s headless `useDropzone` hook (we own all the markup). Controlled
  (`files` + `onFilesChange`) or uncontrolled; attach upload `progress`/`status` per file to get
  the row ProgressBar / success / error states. Imperative `ref.open()` / `ref.clear()`.

**Gotcha — `getInputProps()` does not forward `disabled`.** react-dropzone gates interaction at
the *root* (no click-to-open, drag ignored) but leaves the hidden `<input type="file">` itself
un-disabled. If you want the native input to actually report disabled (assistive tech, form
semantics), pass it yourself: `getInputProps({ disabled })`. FileDropzone already does this.

## Accessibility note

Several hand-rolled controls have documented keyboard/ARIA gaps vs a fully-accessible baseline
(historically the Select-family, Menu, ContextMenu, Hotkeys, Tabs). "Done" in the gallery ≠
audited. If you touch one, verify keyboard nav + roles; there are Vitest behavior tests in
`src/components/ui/__tests__/` to extend (`pnpm test`).
