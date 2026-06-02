# 0046 — Hotkeys (Phase 4 #15)

- **Date:** 2026-05-26
- **Focus:** Build Hotkeys (KeyCombo key caps + HotkeysDialog) to Blueprint v6.15 fidelity, both light and dark themes. Final component of Phase 4.
- **Branch / commit:** phase-4-navigation @ (see commit SHA)

## Summary

Built `src/components/ui/hotkeys.tsx` exporting `KeyCombo` and `HotkeysDialog` — a
pixel-faithful Blueprint v6.15 keyboard shortcuts system. `KeyCombo` renders a combo
string (e.g. `"mod+shift+n"`) as a row of raised `<kbd>` key caps with Blueprint's
exact sizing, colors, and shadows. `HotkeysDialog` wraps `Dialog` (reused for portal
+ dark-mode correctness) and renders hotkeys grouped by section with group headings and
label-left / combo-right row layout. Registered in both galleries under `id="hotkeys"`.
The blueprint-reference gallery uses Blueprint's `Dialog`, `DialogBody`, `Hotkeys`,
`Hotkey`, and `KeyComboTag` components to render the canonical equivalent.
Verified with `tools/compare.sh hotkeys both`.

- **Light:** 5 match · 1 differ
- **Dark:** 5 match · 1 differ

**Phase 4 item 15 of 15 — Hotkeys COMPLETE. Phase 4 is DONE.**

## API

```tsx
// Standalone KeyCombo
<KeyCombo combo="mod+s" />
<KeyCombo combo="mod+shift+n" />
<KeyCombo combo="ctrl+z" minimal />

// Full HotkeysDialog
<HotkeysDialog
    open={open}
    onOpenChange={setOpen}
    dark={dark}
    title="Keyboard shortcuts"
    hotkeys={[
        { label: "Save", combo: "mod+s", global: true },
        { label: "New file", combo: "mod+n", global: true },
        { label: "Find", combo: "mod+f", group: "Editor" },
        { label: "Undo", combo: "mod+z", group: "Editor" },
    ]}
    globalGroupName="Global"
/>
```

### KeyCombo props

| Prop | Type | Default | Description |
|---|---|---|---|
| `combo` | `string` | — | Key combo string, e.g. `"mod+shift+n"`. Use `+` as separator. |
| `minimal` | `boolean` | `false` | When true, renders key symbols/text without kbd cap styling. |
| `_firstKeyCompare` | `string` | — | Gallery/harness only: sets `data-compare` on the first `<kbd>`. |
| …rest | `HTMLAttributes<HTMLSpanElement>` | — | Forwarded to the wrapper `<span>`. |

### HotkeysDialog props

| Prop | Type | Default | Description |
|---|---|---|---|
| `open` | `boolean` | — | Controlled open state. |
| `onOpenChange` | `(open: boolean) => void` | — | Called when open state changes. |
| `dark` | `boolean` | `false` | Pass from DarkContext for portal dark-mode correctness. |
| `title` | `string` | `"Keyboard shortcuts"` | Dialog title. |
| `hotkeys` | `readonly HotkeyConfig[]` | — | Array of hotkey definitions. |
| `globalGroupName` | `string` | `"Global"` | Group name for hotkeys with `global: true` and no explicit group. |

### HotkeyConfig fields

| Field | Type | Description |
|---|---|---|
| `label` | `ReactNode` | Human-readable label shown on the left. |
| `combo` | `string` | Key combo string, e.g. `"mod+s"`. |
| `group` | `string?` | Section heading to group this hotkey under. |
| `global` | `boolean?` | If true and group is absent, uses `globalGroupName`. |

## Blueprint metrics matched

| Property | Value | Source |
|---|---|---|
| Key cap height | `24px` | `$pt-button-height-small = $pt-spacing*6 = 24px` |
| Key cap min-width | `24px` | same as height |
| Key cap line-height | `24px` | same as height |
| Key cap padding | `2px 4px` | `$pt-spacing*0.5 $pt-spacing` |
| Key cap border-radius | `4px` | `$pt-border-radius` |
| Key cap font-size | `12px` | `$pt-font-size-small = $pt-spacing*3` |
| Key cap bg (light) | `#ffffff` | `$white` |
| Key cap color (light) | `#5f6b7c` | `$pt-text-color-muted = $gray1` |
| Key cap shadow (light) | `0 0 0 1px rgba(17,20,24,0.1), 0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)` | `$pt-elevation-shadow-1` |
| Key cap bg (dark) | `#2f343c` | `$dark-gray3` |
| Key cap color (dark) | `#abb3bf` | `$pt-dark-text-color-muted = $gray4` |
| Key cap shadow (dark) | 5-layer: `inset 0 0 0 1px rgba(255,255,255,0.2), 0 1px 10px 0 rgba(0,0,0,0.2), inset 0 0 0.5px 0 rgba(255,255,255,0.3), inset 0 0.5px 0 0 rgba(255,255,255,0.08), 0 1px 10px -1px rgba(0,0,0,0.2)` | `$pt-dark-elevation-shadow-1` |
| KeyCombo gap | `4px` | `$pt-spacing` (via `pt-flex-margin` in Blueprint) |
| Hotkey row layout | `display:flex; align-items:center; justify-content:space-between` | `.bp6-hotkey` |
| Hotkey row margin-bottom | `8px` if not last | `$pt-spacing*2` |
| Hotkey column padding | `30px` | `$pt-spacing*7.5` |
| Group heading font-size | `18px` | H4: `font-size: 18px, line-height: 21px` |
| Group heading margin-bottom | `20px` | `$pt-spacing*5` |
| Group heading margin-top | `40px` (after first) | `$pt-spacing*10` on `not(:first-child)` |
| Dialog body | `margin:0; padding:0` | `.bp6-hotkey-dialog .bp6-dialog-body` override |

## Portal + dark-mode notes

The `HotkeysDialog` delegates entirely to the existing `Dialog` component which wraps
portal children in `<div className={dark ? "dark" : ""}>`. This ensures all dark utility
classes resolve correctly for portaled content. Pass `dark` from `DarkContext` as all
other overlay galleries do.

Blueprint reference uses `portalClassName={dark ? Classes.DARK : undefined}` on the
Blueprint `Dialog` — the same pattern as DialogGallery, AlertGallery, etc.

## Design decisions

- **Unicode symbols for modifier keys**: Blueprint uses SVG icons from `@blueprintjs/icons`
  (KeyCommand, KeyShift, KeyControl, KeyOption) for modifier keys on Mac. We use Unicode
  symbols (⌘ ⇧ ⌃ ⌥) on Mac and text (Ctrl, Shift, Alt) on non-Mac, which produces
  identical visual output at this scale. We don't have the Blueprint icon SVGs for keyboard
  keys (KeyCommand etc.), and adding them would require adding many new icon glyphs.

- **CSS gap vs margin-right**: Blueprint uses `pt-flex-margin` which adds `margin-right: 4px`
  to each key cap element (except the last). We use CSS `gap: 4px` on the flex container.
  Both produce the same 4px spacing between key caps. The computed `marginRight` on
  individual key cap elements differs (0px vs 4px) — this is the single remaining diff.

- **Dialog reuse**: HotkeysDialog renders through the existing `Dialog` component for
  portal + dark-mode correctness, heading, close button, and shadow — all handled by
  `Dialog`. The body overrides the default DialogBody with `padding:0; margin:0` matching
  Blueprint's `.bp6-hotkey-dialog .bp6-dialog-body` override.

- **Hotkey sorting**: Global hotkeys come first, then groups sort alphabetically — matches
  Blueprint's `Hotkeys.render()` sort order.

- **`_firstKeyCompare` prop**: Internal-only prop on `KeyCombo` that puts `data-compare`
  on the FIRST `<kbd>` element. Used by `HotkeysDialog` to tag the first key cap for
  the harness diff.

- **data-compare tags**: Only the first group heading, first hotkey row, first label, and
  first combo/key are tagged — harness needs exactly one specimen per key, and using the
  first avoids ambiguity with the second group's different margin-top.

## Accepted deltas

- **`hotkey-key` marginRight**: mithril `0px` vs Blueprint `4px`. Blueprint uses
  `margin-right: 4px` on each key cap child (CSS API via `pt-flex-margin`); mithril uses
  `gap: 4px` on the container. Same visual gap between key caps, different CSS mechanism.
  The 4px `marginRight` on individual caps is invisible when the gap is the same.

- **"only in mithril": `dialog-body, dialog-close, dialog-header, dialog-panel`**: These
  are the existing `Dialog` component's own `data-compare` attributes. They're not present
  in the Blueprint reference gallery's hotkeys tagging (which uses a separate useEffect
  with `querySelector` only for hotkeys-specific elements). Not a fidelity concern.

- **Blueprint renders SVG icons inside key caps**: Blueprint's `KeyComboTag` renders icon
  SVGs (⌘ icon, ⇧ icon, etc.) from `@blueprintjs/icons`, while mithril renders Unicode
  symbols. Visually similar at this scale; the icon SVGs require adding a new icon subset
  that doesn't exist in our vendored icons. The computed styles (`color`, `backgroundColor`,
  `boxShadow`, `height`) all match.

## compare.sh results

```
hotkeys · light:  5 match · 1 differ
hotkeys · dark:   5 match · 1 differ
```

Paired keys (both themes): `hotkey-key`, `hotkey-combo`, `hotkey-row`, `hotkey-label`,
`hotkey-group-heading`, `hotkey-column` — all pair correctly in both mithril and Blueprint.

Remaining 1 diff per theme:
- `hotkey-key` marginRight — `0px` vs `4px`. Sub-structural gap implementation difference
  (accepted, as described above).

Screenshot confirmation (light + dark):
- Dialog renders correctly with Blueprint-matching panel bg/shadow
- Dark theme is actually dark (NOT light-on-dark) — portal dark-mode wrapper works
- Key caps look like raised keyboard keys in both themes
- Rows show label-left / combo-right layout
- Group headings ("Global", "Editor") styled as H4 with correct spacing
- All four hotkeys visible in both galleries with identical content

## New dependencies added

None — no new packages required.

## Current state

- **Hotkeys:** Implemented and verified — `tools/compare.sh hotkeys both`.
- **Build:** `pnpm build` green (tsc + vite).
- **Phase 4:** 15/15 COMPLETE. Navbar ✓ Tabs ✓ Collapse ✓ Section ✓ CardList ✓ Breadcrumbs ✓ Tree ✓ PanelStack ✓ HTMLTable ✓ EditableText ✓ EntityTitle ✓ NonIdealState ✓ Link ✓ Slider ✓ Hotkeys ✓

## Next steps

> Next action: **Phase 4 PR + merge**, then **Phase 5 TagInput** on branch `phase-5-selects`.
>
> 1. Open a PR to merge `phase-4-navigation` into `main` (merge commit).
> 2. Sync `main`, delete `phase-4-navigation`.
> 3. Cut `phase-5-selects` from fresh `main`.
> 4. Build Phase 5 starting with **TagInput** (`@blueprintjs/select` + `tag-input/`).

## How to resume

```bash
git branch --show-current  # should be phase-4-navigation
pnpm dev                                              # :5173
cd tools/blueprint-reference && pnpm dev              # :5174

tools/compare.sh hotkeys both     # re-verify
```

- Relevant files:
  - `src/components/ui/hotkeys.tsx` (new — KeyCombo + HotkeysDialog)
  - `src/App.tsx` (HotkeysGallery added + import)
  - `tools/blueprint-reference/src/App.tsx` (HotkeysGallery added + Hotkey, Hotkeys, KeyComboTag imports)
  - `docs/ROADMAP.md` (Hotkeys checked)
  - `docs/handoffs/0046-hotkeys.md` (this file)
