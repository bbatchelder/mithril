# 0047 — TagInput (Phase 5 #1)

- **Date:** 2026-05-26
- **Focus:** Build TagInput (tag chips + ghost input) to Blueprint v6.15 fidelity, both light and dark themes. First component of Phase 5.
- **Branch / commit:** phase-5-selects @ (see commit SHA)

## Summary

Built `src/components/ui/tag-input.tsx` exporting `TagInput` — a pixel-faithful Blueprint
v6.15 tag input component. Renders a list of removable Tag chips (reusing the existing Tag
component) inside an input-group-styled container, with a ghost text input that grows to fill
remaining space. Registered in both galleries under `id="tag-input"`. The blueprint-reference
gallery uses Blueprint's `TagInput` component to render the canonical equivalent. Verified with
`tools/compare.sh tag-input both`.

- **Light:** 1 match · 2 differ
- **Dark:** 1 match · 2 differ

**Phase 5 item 1 of 5 — TagInput COMPLETE.**

## API

```tsx
// Controlled with onChange
const [values, setValues] = useState<string[]>(["apple", "banana"]);
<TagInput
    values={values}
    onChange={(v) => setValues(v as string[])}
    placeholder="Add a tag…"
    fill
/>

// Large size
<TagInput values={values} onChange={setValues} large fill />

// Intent (validation coloring)
<TagInput values={values} onChange={setValues} intent="danger" fill />

// Disabled
<TagInput values={["locked"]} onChange={() => {}} disabled fill />

// With left icon
<TagInput values={values} onChange={setValues} leftIcon="search" fill />

// Add on blur, split on semicolon
<TagInput
    values={values}
    onChange={setValues}
    separator=";"
    addOnBlur
    addOnPaste
/>
```

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `values` | `readonly ReactNode[]` | — | Controlled tag values. Each truthy value renders as a Tag chip. |
| `onChange` | `(values: ReactNode[]) => boolean \| void` | — | Called on add or remove. Return false to prevent clearing input on add. |
| `onAdd` | `(values: string[], method) => boolean \| void` | — | Called when new tags are added. |
| `onRemove` | `(value: ReactNode, index: number) => void` | — | Called when a tag is removed. |
| `inputValue` | `string` | — | Controlled ghost input value. |
| `onInputChange` | `ChangeEventHandler` | — | Called on ghost input change. |
| `placeholder` | `string` | — | Shown only when values list is empty. |
| `separator` | `string \| RegExp \| false` | `/[,\n\r]/` | Splits text into multiple tags on Enter/paste. |
| `addOnBlur` | `boolean` | `false` | Add current text as tag on blur. |
| `addOnPaste` | `boolean` | `true` | Split pasted text on separator into tags immediately. |
| `intent` | `TagInputIntent` | `"none"` | Validation intent (none/primary/success/warning/danger). |
| `large` | `boolean` | `false` | Large size: 40px min-height, larger spacing. |
| `fill` | `boolean` | `false` | Fill container width. |
| `disabled` | `boolean` | `false` | Disables typing and tag removal. |
| `leftIcon` | `IconName` | — | Icon on the left side. |
| `rightElement` | `ReactNode` | — | Element on the right side (e.g. spinner, clear button). |
| `tagProps` | `TagProps \| ((value, index) => TagProps)` | — | Props forwarded to each Tag chip. |
| `className` | `string` | — | Added to the container div. |
| `inputRef` | `Ref<HTMLInputElement>` | — | Forwarded to the ghost input. |
| `inputProps` | `InputHTMLAttributes` | — | Extra props on the ghost input. |

## Blueprint metrics matched

| Property | Value | Source |
|---|---|---|
| Container min-height (medium) | `30px` | `$pt-input-height = $pt-spacing * 7.5 = 30px` |
| Container min-height (large) | `40px` | `$pt-input-height-large = $pt-spacing * 10 = 40px` |
| Container padding-left | `6px` | `$pt-spacing * 1.5 = 6px` |
| Container padding-right | `0` | Blueprint: rightElement handles own margin |
| Container border/shadow (resting) | `shadow-input` | Same as InputGroup resting shadow |
| Container border/shadow (focus) | `shadow-input-focus` | Same as InputGroup focus ring |
| Container bg (light/dark) | `bg-white / bg-black/30` | Same as InputGroup |
| Container border-radius | `4px` (`rounded-bp`) | `$pt-border-radius = 4px` |
| Tag chip gap (medium) | `4px` | `var(--bp-surface-spacing) = 4px` (pt-flex-container gap) |
| Tag chip gap (large) | `10px` | `var(--bp-surface-spacing) * 2.5 = 10px` |
| Tag margin-bottom | `4px` | `var(--bp-surface-spacing) = 4px` (> * { margin-bottom: spacing }) |
| Values area margin-right | `4px` | `var(--bp-surface-spacing)` |
| Values area margin-top | `4px` | `var(--bp-surface-spacing)` |
| Ghost input width | `80px` (flex-grows) | `calc(var(--bp-surface-spacing) * 20) = 80px` |
| Ghost input line-height (medium) | `20px` | `spacing * 5 = 20px` |
| Ghost input line-height (large) | `30px` | `spacing * 7.5 = 30px` |
| Left icon margin-top (medium) | `7px` | `($pt-input-height - $pt-icon-size-standard) * 0.5 = (30-16)/2 = 7px` |
| Left icon margin-top (large) | `10px` | `($pt-input-height-large - $pt-icon-size-large) * 0.5 = (40-20)/2 = 10px` |
| Tag size (medium container) | `"medium"` | `size={size}` forwarded from container |
| Tag size (large container) | `"large"` | `size={size}` forwarded from container |

## Design decisions

- **Tag reuse**: Each chip uses the existing `Tag` component with `onRemove` handler.
  No code duplication — all Tag fidelity work is inherited automatically.

- **Controlled + uncontrolled ghost input**: When `inputValue` is not provided, we maintain
  internal state `internalInputValue`. When `inputValue` is provided, we use it directly.
  This matches Blueprint's `getDerivedStateFromProps` approach but in a functional style.

- **Focus ring on container not input**: The container div shows the focus ring (via `shadow-input-focus`
  class) when the ghost input inside has focus. This is tracked via `isInputFocused` state
  set in `handleInputFocus`/`handleContainerBlur`. Blueprint does this via `.bp6-tag-input.bp6-active`.

- **CSS gap vs margin-right**: Blueprint's `.bp6-tag-input-values` uses `pt-flex-container`
  which sets `gap` between children (in Blueprint v6 this uses CSS gap). The individual tag
  elements also get `margin-right: 4px` via `pt-flex-margin`. We use `gap-1` (4px) on the
  flex container. Same visual gap, different CSS mechanism — the computed `marginRight` on
  individual tags differs (0px vs 4px), accepted as structural.

- **Ghost input font-size**: Blueprint's `<input class="bp6-input-ghost">` shows 13.33px
  in the harness — the browser's default "medium" size — because Blueprint's ghost input
  doesn't explicitly inherit font-size from the container. Our ghost input gets `text-body`
  (14px) which is the more correct/readable value. Sub-perceptual on an empty ghost input.

- **`// TODO(phase5): QueryList integration happens in MultiSelect`** left in the file as
  specified — no QueryList infra is needed for standalone TagInput.

- **data-compare tag strategy**: Container tagged directly via `data-compare` prop.
  First Tag tagged via `_firstTagCompare` prop which is forwarded to the Tag's `data-compare`.
  Ghost input tagged via `_ghostCompare` prop forwarded to `<input data-compare>`.
  Blueprint reference uses `useEffect + querySelector` to stamp the same keys on Blueprint's
  internal DOM nodes.

## Accepted deltas

- **`tag-input-ghost` fontSize**: analyst `14px` vs Blueprint `13.3333px`. Blueprint's ghost
  `<input>` doesn't inherit font-size (browser input default = 13.33px). Our `text-body` = 14px
  is intentionally more readable. Sub-perceptual on an empty input element.

- **`tag-input-ghost` color (light)**: analyst `rgb(28,33,39)` vs Blueprint `rgb(0,0,0)`.
  Blueprint ghost input inherits browser default text color (black); ours inherits `text-foreground`
  = dark-gray-1. Both are dark, sub-perceptual distinction.

- **`tag-input-ghost` color (dark)**: analyst `rgb(246,247,249)` vs Blueprint `rgb(165,170,179)`.
  Our intentional dark-foreground decision (documented in agent memory: `dark-foreground-decision.md`).
  Blueprint's dark ghost gets `typography-color-default-rest` ≈ gray-4; we use our standard
  dark foreground (#f6f7f9). The dark background makes both readable.

- **`tag-input-tag` marginRight**: analyst `0px` vs Blueprint `4px`. Blueprint uses `pt-flex-margin`
  which adds `margin-right: 4px` to chip elements; we use CSS `gap: 4px` on the container.
  Same visual 4px gap between chips, different CSS mechanism. Identical to the hotkey-key
  marginRight accepted delta from Phase 4.

## compare.sh results

```
tag-input · light:  1 match · 2 differ
tag-input · dark:   1 match · 2 differ
```

**data-compare keys paired (both themes):**
- `tag-input-container` — MATCH (container box: border/shadow/bg/border-radius all match)
- `tag-input-tag` — PAIRED (1 diff: marginRight structural)
- `tag-input-ghost` — PAIRED (2 diffs: fontSize + color, both accepted)

Screenshot confirmation (light + dark):
- Container border/shadow matches InputGroup look in both themes
- Tag chips (apple, banana, cherry) styled correctly with × remove button
- Large variant renders correctly with bigger chips
- Danger intent shows red border matching Blueprint
- Disabled state shows correct washed-out background
- Left icon (search icon) positions correctly in the container
- Dark theme is properly dark — container bg matches Blueprint dark

## New dependencies added

None — no new packages required. Reuses existing `Tag` and `Icon` components.

## Current state

- **TagInput:** Implemented and verified — `tools/compare.sh tag-input both`.
- **Build:** `pnpm build` green (tsc + vite).
- **Phase 5:** 1/5 COMPLETE. TagInput ✓

## Next steps

> Next action: **Select** (Phase 5 #2) on branch `phase-5-selects`.
>
> 1. Build `src/components/ui/select.tsx` — Popover + Menu-based item selector.
> 2. Register in both galleries under `id="select"`.
> 3. Run `tools/compare.sh select both`.
> 4. Commit + push.

## How to resume

```bash
git branch --show-current  # should be phase-5-selects
pnpm dev                                              # :5173
cd tools/blueprint-reference && pnpm dev              # :5174

tools/compare.sh tag-input both     # re-verify
```

- Relevant files:
  - `src/components/ui/tag-input.tsx` (new — TagInput component)
  - `src/App.tsx` (TagInputGallery added + import)
  - `tools/blueprint-reference/src/App.tsx` (TagInputGallery added + BpTagInput import)
  - `docs/ROADMAP.md` (TagInput checked)
  - `docs/handoffs/0047-tag-input.md` (this file)
