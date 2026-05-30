# Screen-reader smoke checklist (manual)

> **Why this exists.** jsdom (the 70 Vitest tests) proves ARIA *wiring* — roles, names, states,
> `aria-activedescendant` movement. axe (the smoke tests + the chrome sweep in handoff 0070) proves
> there are no rule violations. **Neither validates what a screen reader actually *announces*.** This
> is the last-mile manual pass: run each widget with a real SR and confirm the announcements are
> sensible. Record pass/fail in the table at the bottom and file anything that reads wrong.

This complements, and does not replace, the automated coverage. Do it once per release on the
high-traffic widgets; you don't need to re-run it for an unrelated visual tweak.

## Setup

- **macOS / VoiceOver:** `Cmd+F5` toggles VO. Rotor = `VO+U` (VO = `Ctrl+Option`). Test in Safari
  (best AT support) **and** Chrome if you can.
- **Windows / NVDA:** `Ctrl+Alt+N` starts NVDA. Test in Firefox and Chrome. `NVDA+Space` toggles
  focus/browse mode (forms widgets need focus mode).
- Run the gallery: `pnpm dev` → `http://localhost:5173`. Isolate a widget with
  `?component=<id>` (e.g. `?component=select`). **Note:** several Select/Suggest/MultiSelect/
  Timezone specimens are rendered *force-open* "for comparison" (`popoverProps={{open:true}}`) — to
  test real announcements, use a specimen you open yourself (or the demo apps), not a force-open one.
- Test **both** themes (toggle in the gallery); contrast/focus visibility differ, announcements
  should not.

## What "pass" means for every widget

On focus the SR announces **role + accessible name + state/value**. On change it announces the new
state/value. Nothing reads as "clickable"/"group" with no name, and no control is silent.

## Per-widget scripts

### Combobox family — Select / Suggest / MultiSelect / Omnibar  *(highest traffic)*
1. Tab to the trigger → hear name + "pop up button"/"menu button" (collapsed).
2. Open (Enter/Space, or focus for Suggest/MultiSelect) → focus lands in the filter input; hear
   "combobox", the input's name, "expanded".
3. Arrow Down/Up → each highlighted option is announced (name, and "selected" for the current one);
   the **list** position is read (`aria-activedescendant` moves — VO should speak each option without
   you leaving the input).
4. Type to filter → result count change is perceivable; arrowing still announces options.
5. Enter to select → popup closes, focus returns to the trigger, trigger now announces the new value.
6. Escape → closes, focus returns, no selection change.
7. **MultiSelect:** removing a chip (its ✕) announces what was removed; the list is
   `aria-multiselectable` so selected options announce "selected".

### Menu / MenuItem (in a Popover dropdown)
1. Open the menu → hear "menu". 2. Arrow keys move through "menu item"s, each announced by name;
dividers are skipped/announced as separators. 3. An item with a secondary label (e.g. `⌘,`) — confirm
the shortcut text isn't read as a confusing second control. 4. Enter activates; Escape closes and
returns focus. *(There are no submenus — the no-op caret was removed in handoff 0071.)*

### ContextMenu
Right-click (or Shift+F10 / the context-menu key) the target → menu opens, focus moves in,
arrow/typeahead work, items announced as "menu item", Escape closes and restores focus.

### Tabs
1. Tab to the tablist → hear "tab list" then the selected "tab, selected, N of M". 2. Arrow
Left/Right (horizontal) moves **and** selects (automatic activation), each announced; Home/End jump.
3. Tab again moves into the active panel ("tab panel"). 4. Disabled tab is announced as dimmed/skipped.

### Dialog / Drawer / Alert
1. Open → focus moves into the overlay; the **title** is announced as the dialog name ("dialog" /
Alert = "alert dialog"). 2. Tab cycles **within** the overlay only (focus trap — never reaches the
page behind). 3. Escape (where enabled) closes; focus **returns** to the element that opened it.
4. Alert: the message + confirm/cancel buttons are reachable and named.

### NumericInput
Focus → "spin button" + name + current value. Arrow Up/Down (and Shift/Alt for major/minor) change
the value and the new value is announced. Confirm `aria-valuemin/max` bound the announced range.
*(Live-verified 2026-05-30: spinbuttons + stepper buttons are correctly named.)*

### TimePicker
Each segment is a named "spin button" (Hours/Minutes/…); arrow keys change and announce the value;
the AM/PM control announces as a select/button with its value; arrows on the steppers are
`aria-hidden` (not announced as controls).

### Slider
Focus the thumb → "slider" + name + value (+ min/max). Arrow keys change and announce the new value.
Confirm the focus ring is visible (added in handoff 0070) and the thumb has a name (`aria-label`).

### Popover (interactive content)
Open → the panel is announced as a dialog with its `ariaLabel`/`ariaLabelledby` name; content is
reachable; Escape closes and returns focus.

### Form controls — Checkbox / Radio / Switch / InputGroup
Each announces role + label + state ("checked"/"not checked", "on"/"off"). InputGroup must have a
real name (label or `aria-label`) — a placeholder alone is **not** a name.

## Known / watch-items (from the 2026-05-30 live a11y-tree spot-check)

- **Select with consumer-controlled open** (`popoverProps.open`): Select's internal `isOpen` does
  **not** sync to an externally-controlled open prop, so the inner combobox reports
  `aria-expanded="false"` / no `aria-activedescendant` while the listbox is visibly open. Only affects
  consumers who drive open themselves (and the gallery's force-open specimens) — normal
  click/keyboard open is correct (proven by `select.test.tsx`). Low priority; documented in
  handoff 0071. If a consumer needs controlled-open, sync `isOpen` from `popoverProps.open`.
- The `aria-allowed-attr` residual on Suggest/MultiSelect trigger wrapper divs (handoff 0070) is
  cosmetic in the tree; verify the SR still announces the *inner* combobox correctly (it carries the
  authoritative ARIA).

## Results log

| Widget | VoiceOver/Safari | NVDA/Firefox | Notes |
|--------|------------------|--------------|-------|
| Select / Suggest / MultiSelect / Omnibar | | | |
| Menu / MenuItem | | | |
| ContextMenu | | | |
| Tabs | | | |
| Dialog / Drawer / Alert | | | |
| NumericInput | | | |
| TimePicker | | | |
| Slider | | | |
| Popover | | | |
| Checkbox / Radio / Switch / InputGroup | | | |
