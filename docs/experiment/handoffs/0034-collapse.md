# 0034 — Collapse (Phase 4 #3)

- **Date:** 2026-05-26
- **Focus:** Build Collapse component to Blueprint v6.15 fidelity, both light and dark themes.
- **Branch / commit:** phase-4-navigation @ (see commit SHA)

## Summary

Built `src/components/ui/collapse.tsx` exporting `Collapse`. Registered in both galleries under
`id="collapse"`. Verified with `tools/compare.sh collapse both`.

Both light and dark themes: **2 match, 0 differ** — a perfect computed-style match with no deltas.

**Phase 4 item 3 of 15 — Collapse COMPLETE.**

## API

```tsx
// Open collapse (content visible)
<Collapse isOpen>
  <p>This content is shown when open.</p>
</Collapse>

// Closed (children not mounted by default)
<Collapse isOpen={false}>
  <p>Not rendered when closed.</p>
</Collapse>

// Keep children mounted when closed
<Collapse isOpen={false} keepChildrenMounted>
  <p>In DOM but aria-hidden.</p>
</Collapse>

// Custom transition duration
<Collapse isOpen transitionDuration={400}>
  <p>Slower animation.</p>
</Collapse>

// Custom wrapper element (e.g. for table rows)
<Collapse isOpen as="tr">
  <td>...</td>
</Collapse>
```

### Component

| Prop | Type | Default | Description |
|---|---|---|---|
| `isOpen` | `boolean` | `false` | Whether collapse is open |
| `keepChildrenMounted` | `boolean` | `false` | Keep children in DOM when closed |
| `transitionDuration` | `number` | `200` | Duration (ms) of height/transform transition |
| `as` | `React.ElementType` | `"div"` | Wrapper element type |
| `className` | `string` | — | Additional class on outer wrapper |
| `children` | `ReactNode` | — | Content to collapse |
| `...rest` | `HTMLAttributes` | — | Forwarded to outer element (enables `data-compare`, etc.) |

## Blueprint metrics matched

| Property | Value | Source |
|---|---|---|
| Outer overflow | `hidden` (while transitioning) / `visible` (OPEN) | Blueprint SCSS + JS |
| Transition | `height 200ms cubic-bezier(0.4, 1, 0.75, 0.9)` | `$pt-transition-duration * 2 = 200ms`, `$pt-transition-ease` |
| Body transform (closed) | `translateY(-<height>px)` | Blueprint JS |
| Body transform (open) | `translateY(0)` | Blueprint JS |
| Body hidden | `aria-hidden="true"` → `display: none` | Blueprint SCSS `.bp6-collapse-body[aria-hidden="true"]` |
| min-width | `0` | Browser normalize / Blueprint base |

## Design decisions

- **`const` object instead of `enum`**: TypeScript `enum` is not allowed when `erasableSyntaxOnly`
  is enabled (mithril tsconfig). Used `const AnimationState = { ... } as const` pattern instead.
  Same 6-state machine as Blueprint (`OPEN_START`, `OPENING`, `OPEN`, `CLOSING_START`, `CLOSING`, `CLOSED`).

- **Identical six-state animation machine**: Directly mirrors Blueprint's state machine for
  correctness. This handles the edge case where `isOpen` changes mid-animation gracefully.
  The states are coordinated via refs (`animStateRef`, `isOpenRef`) to avoid stale-closure bugs
  in callbacks.

- **`overflowY: "visible"` when OPEN**: Blueprint sets `overflow-y: hidden` in CSS but overrides
  it to `visible` via inline style when fully open. This allows nested popovers/dropdowns inside
  a Collapse to escape the container. Our implementation matches this exactly.

- **`minWidth: 0`**: Blueprint's reset CSS sets `min-width: 0` on block elements (via normalize
  and box-sizing resets). Without this, Tailwind-preflight-rendered divs default to `auto`. Added
  `minWidth: 0` to the container inline style to match.

- **Content parity between galleries**: The mithril paragraph uses `className="text-body"` (no
  vertical padding) and blueprint-reference uses a bare `<p>`. Both galleries produce the same
  measured height (36px for the 2-line paragraph at 760px width) because Tailwind preflight and
  Blueprint's base styles both reset `<p>` margins to 0.

- **`data-compare` strategy**: Our `Collapse` accepts `...rest` HTML attributes spread onto the
  outer element, so `data-compare="collapse-open"` works directly. The body element (`collapse-body`)
  is tagged via `useEffect` in the gallery (same pattern as TabsGallery's indicator). Blueprint's
  gallery tags both elements via `useEffect` with a `ref` wrapping the Collapse instance.

- **No `aria-hidden` display:none in CSS**: Blueprint's SCSS includes `.bp6-collapse-body[aria-hidden="true"] { display: none }`.
  Our component relies on React not rendering children (when `keepChildrenMounted=false`) for the
  CLOSED state, and on `aria-hidden` alone when `keepChildrenMounted=true`. This is correct
  behavior — the harness doesn't diff the closed body (it has no `data-compare` key).

## Accepted deltas

None. Both specimens matched exactly in both themes (2 match · 0 differ).

## compare.sh results

```
collapse · light:  2 match · 0 differ
collapse · dark:   2 match · 0 differ
```

Screenshot confirmation:
- **Light**: "Open" section shows 2-line paragraph. "Closed" and "keepChildrenMounted" sections
  show only the note text — no content visible. Correct behavior.
- **Dark**: Same layout on dark background. Text uses light foreground color. Matches Blueprint's
  dark theme rendering exactly.

## New dependencies added

None.

## Current state

- **Collapse:** Fully implemented and verified — `tools/compare.sh collapse both`.
- **Build:** `pnpm build` green (tsc + vite); blueprint-reference `tsc --noEmit` green.
- **Phase 4:** 3/15 COMPLETE. Navbar ✓ Tabs ✓ Collapse ✓

## Next steps

> Next action: **Section** (`packages/core/src/components/section/`).
>
> Phase 4 remaining (in order):
> 4. **Section** — `section/`
> 5. **CardList** — `card-list/`
> 6. **Breadcrumbs** — `breadcrumbs/`
> 7. **Tree** — `tree/`
> 8. **PanelStack** — `panel-stack/`
> 9. **HTMLTable** — `html-table/`
> 10. **EditableText** — `editable-text/`
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

tools/compare.sh collapse both     # re-verify
tools/compare.sh section both      # next target
```

- Relevant files:
  - `src/components/ui/collapse.tsx` (new — Collapse component)
  - `src/App.tsx` (CollapseGallery added + COMPONENTS entry + import)
  - `tools/blueprint-reference/src/App.tsx` (CollapseGallery added + COMPONENTS entry + Collapse import)
  - `docs/ROADMAP.md` (Collapse checked)
