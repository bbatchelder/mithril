# 0041 — EditableText (Phase 4 #10)

- **Date:** 2026-05-26
- **Focus:** Build EditableText (click-to-edit inline text) to Blueprint v6.15 fidelity, both light and dark themes.
- **Branch / commit:** phase-4-navigation @ (see commit SHA)

## Summary

Built `src/components/ui/editable-text.tsx` exporting `EditableText` — a click-to-edit inline text
component with controlled/uncontrolled modes, placeholder, multiline (textarea with minLines/maxLines),
confirmOnEnterKey, selectAllOnFocus, disabled, and intent props. Registered in both galleries under
`id="editable-text"`. Verified with `tools/compare.sh editable-text both`.

- **Light:** 3 match · 0 differ — perfect.
- **Dark:** 3 match · 0 differ — perfect.

**Phase 4 item 10 of 15 — EditableText COMPLETE.**

## API

```tsx
// Uncontrolled with placeholder
<EditableText
  defaultValue=""
  placeholder="Click to Edit"
/>

// Controlled
<EditableText
  value={value}
  onChange={setValue}
  onConfirm={handleConfirm}
  onCancel={handleCancel}
/>

// Controlled edit state
<EditableText
  value={value}
  isEditing={isEditing}
  onChange={setValue}
  onEdit={() => setIsEditing(true)}
  onConfirm={(v) => { setValue(v); setIsEditing(false); }}
/>

// Multiline
<EditableText
  defaultValue="multi\nline\ntext"
  multiline
  minLines={3}
  maxLines={10}
/>

// Intent (colors text + ring)
<EditableText defaultValue="primary" intent="primary" />

// Disabled
<EditableText defaultValue="readonly" disabled />
```

### EditableText props

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `string` | — | Controlled value. |
| `defaultValue` | `string` | `""` | Uncontrolled initial value. |
| `placeholder` | `string` | `"Click to Edit"` | Shown when value is empty. |
| `disabled` | `boolean` | `false` | Prevents editing. |
| `multiline` | `boolean` | `false` | Use textarea; Enter adds newline. |
| `minLines` | `number` | `1` | Min height in lines (multiline). |
| `maxLines` | `number` | `Infinity` | Max height before scroll (multiline). |
| `minWidth` | `number` | `80` | Min px width (single-line). |
| `confirmOnEnterKey` | `boolean` | `false` | In multiline: Enter confirms, Mod+Enter inserts newline. |
| `selectAllOnFocus` | `boolean` | `false` | Select all text on entering edit mode. |
| `intent` | `EditableTextIntent` | `"none"` | Colors text + ring (none/primary/success/warning/danger). |
| `isEditing` | `boolean` | — | Controlled edit state. |
| `maxLength` | `number` | — | Max character count. |
| `type` | `string` | `"text"` | Input type (single-line only). |
| `className` | `string` | — | Extra classes on root div. |
| `inputProps` | `InputHTMLAttributes & TextareaHTMLAttributes` | — | Extra props forwarded to input/textarea. |
| `onChange` | `(value: string) => void` | — | Called on every keystroke. |
| `onConfirm` | `(value: string) => void` | — | Called on blur or Enter. |
| `onCancel` | `(value: string) => void` | — | Called on Escape (restores last confirmed value). |
| `onEdit` | `(value: string \| undefined) => void` | — | Called when entering edit mode. |
| …rest | `HTMLAttributes<HTMLDivElement>` | — | Forwarded to root div (supports `data-compare`, `aria-*`, etc.). |

## Blueprint metrics matched

| Property | Value | Source |
|---|---|---|
| Root: `display` | `inline-block` | `.bp6-editable-text { display: inline-block }` |
| Root: `cursor` | `text` | `.bp6-editable-text { cursor: text }` |
| Root: `vertical-align` | `top` | `.bp6-editable-text { vertical-align: top }` |
| Root: `white-space` | `nowrap` (single-line) | `.bp6-editable-text { white-space: nowrap }` |
| Ring div inset | `-2px` all sides | `::before { inset: $pt-spacing * -0.5 }` = -2px |
| Ring div `border-radius` | `4px` | `::before { border-radius: $pt-border-radius }` |
| Ring transition | `background-color 100ms ease-bp, box-shadow 100ms ease-bp` | `$pt-transition-duration = 100ms`, `$pt-transition-ease` |
| Content span `padding-right` | `2px` | `.bp6-editable-text-content { padding-right: $pt-spacing * 0.5 }` = 2px |
| Min width (single-line) | `80px` | `minWidth: 80` default in Blueprint |
| Buffer width | `+5px` on measured scrollWidth | `BUFFER_WIDTH_DEFAULT = 5` |
| Placeholder color light | `$pt-text-color-muted = gray-1 = #5f6b7c` | `$input-placeholder-color` |
| Placeholder color dark | `$pt-dark-text-color-muted = gray-4 = #abb3bf` | `$dark-input-placeholder-color` |

### Box-shadow ring values (light theme)
| State | `::before` box-shadow |
|---|---|
| Resting | `none` |
| Hover (no intent) | `inset 0 0 0 1px rgba(17,20,24,0.15)` |
| Editing (no intent) | `inset 0 0 0 1px rgba(33,93,176,0.752), 0 0 0 1px rgba(33,93,176,0.752), inset 0 1px 1px rgba(17,20,24,0.2)` |
| Hover (intent) | `inset 0 0 0 1px rgba(<intent-3>,0.4)` |
| Editing (intent) | `inset 0 0 0 1px rgba(<intent-3>,0.752), 0 0 0 1px rgba(<intent-3>,0.752), inset 0 1px 1px rgba(17,20,24,0.2)` |

### Box-shadow ring values (dark theme)
| State | `::before` box-shadow |
|---|---|
| Resting | `none` |
| Hover (no intent) | `inset 0 0 0 1px rgba(255,255,255,0.2)` |
| Editing (no intent) | `inset 0 0 0 1px rgba(138,187,255,0.752), 0 0 0 1px rgba(138,187,255,0.752)` |
| Hover (intent) | `inset 0 0 0 1px rgba(<intent-4>,0.4)` |
| Editing (intent) | `inset 0 0 0 1px rgba(<intent-4>,0.752), 0 0 0 1px rgba(<intent-4>,0.752)` |

Background:
- Editing light: `background-color: #ffffff` (`$input-background-color`)
- Editing dark: `background-color: rgba(0,0,0,0.3)` (`$dark-input-background-color`)

## Design decisions

- **Real `<div>` instead of `::before` pseudo-element**: Blueprint uses a `::before` for the ring/bg that
  extends -2px around the text. We use a real `<div>` positioned at `inset: -2px` with `pointer-events-none`
  and `aria-hidden="true"` — identical visual result, more React-idiomatic.
- **JS-driven hover/editing state**: Blueprint relies on CSS `:hover` and `.bp6-editable-text-editing` class
  for ring transitions. We track `isHovered` + `isEditing` in React state and apply shadow classes accordingly.
  All shadow class strings are literal JSX (not runtime `var()`) — Tailwind tree-shaking safe.
- **Content span always rendered**: Like Blueprint, we always render the content span (even during editing)
  so we can measure its dimensions. When editing it's `position: absolute; visibility: hidden`.
- **Controlled + uncontrolled**: Mirrors Blueprint's pattern — controlled when `value` prop is provided,
  uncontrolled otherwise (using `defaultValue`). Cancel restores to the last confirmed value via `lastValueRef`.
- **Blueprint does not forward `data-*` to root div**: Blueprint's class component doesn't spread htmlProps,
  so we used `elementRef` prop + a `useEffect` wrapper component (`BpEditableTextWithCompare`) in the
  blueprint-reference gallery to imperatively set `data-compare` on the root DOM node.
- **No CVA**: The component has too many state combinations (disabled × intent × isEditing × isHovered) that
  are driven by runtime state — CVA's static variant map doesn't help here. Shadow classes are built via
  lookup objects inside the component functions (all strings present in JSX, Tailwind sees them).

## Accepted deltas

None. Both themes: 3 match · 0 differ.

The harness compares 3 specimens (resting, placeholder, editing). The style diff includes `backgroundColor`,
`boxShadow`, `color`, `fontSize`, `fontWeight`, `height`, `paddingLeft`, `paddingRight`, `borderRadius`.

Minor visual observations from screenshot review (not diffed by harness, accepted):
- Blueprint's resting state has very slightly different vertical position due to `::before` layout vs our approach, but resting text appearance is pixel-identical.
- The editing state ring appearance is identical in both implementations.

## compare.sh results

```
editable-text · light:  3 match · 0 differ
editable-text · dark:   3 match · 0 differ
```

Screenshot confirmation (light + dark): resting value, placeholder (muted/blue text), editing state with
focus ring, multiline (3 lines), intent-colored text (primary/success/warning/danger), disabled.

## New dependencies added

None.

## Current state

- **EditableText:** Implemented and verified — `tools/compare.sh editable-text both`.
- **Build:** `pnpm build` green (tsc + vite).
- **Phase 4:** 10/15 COMPLETE. Navbar ✓ Tabs ✓ Collapse ✓ Section ✓ CardList ✓ Breadcrumbs ✓ Tree ✓ PanelStack ✓ HTMLTable ✓ EditableText ✓

## Next steps

> Next action: **EntityTitle** (`packages/core/src/components/entity-title/`).
>
> Phase 4 remaining (in order):
> 11. **EntityTitle** — `entity-title/`
> 12. **NonIdealState** — `non-ideal-state/`
> 13. **Link** — `link/`
> 14. **Slider** — `slider/`
> 15. **Hotkeys** — `hotkeys/`

## How to resume

```bash
git branch --show-current  # should be phase-4-navigation
pnpm dev                                              # :5173
cd tools/blueprint-reference && pnpm dev              # :5174
tools/compare.sh editable-text both     # re-verify
tools/compare.sh entity-title both      # next target
```

- Relevant files:
  - `src/components/ui/editable-text.tsx` (new — EditableText component)
  - `src/App.tsx` (EditableTextGallery + COMPONENTS entry + import)
  - `tools/blueprint-reference/src/App.tsx` (EditableTextGallery + BpEditableTextWithCompare + COMPONENTS entry + import)
  - `docs/ROADMAP.md` (EditableText checked)
  - `docs/handoffs/0041-editable-text.md` (this file)
