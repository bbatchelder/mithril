# Handoff — overview-tile previews (`src/previews.tsx`)

Status as of 2026‑06‑05. This hands off the remaining work on the **Component Showcase overview
tiles** — the small, live "thumbnail" composition shown on each tile in the
IBM‑Carbon‑style grid (`#showcase`). Read [`CLAUDE.md`](../CLAUDE.md) first. This is a sibling to
[`component-pages-handoff.md`](component-pages-handoff.md), which covers the **playgrounds** (a
different surface — playgrounds are effectively done; previews are not).

> **Previews ≠ playgrounds.** A *preview* is a static, non‑interactive thumbnail on the overview
> grid. A *playground* is the interactive single‑instance + controls on the component page. They are
> intentionally separate framings; don't conflate them. (Where the example *content* is genuinely
> shared — e.g. AIExplainability's provenance panel — factor it into one module and import it from
> both; see `src/lib/demo/ai-explainability.tsx`.)

---

## What exists now

`src/previews.tsx` exports `PREVIEWS: Record<componentId, PreviewEntry>` and a `ComponentPreview`
component (the clipped, `inert` + `aria-hidden` frame that hosts each thumbnail on its tile). A
component **with** a `PREVIEWS` entry shows a live thumbnail; one **without** falls back to the
icon‑only tile (`hasPreview(id)` gates this in `App.tsx`). So coverage can grow incrementally.

```ts
interface PreviewEntry {
  render: () => ReactNode;       // a representative, static composition of the REAL component
  scale?: number;                // optical scale for dense/wide compositions (default 1)
  frameClassName?: string;       // override the frame's height/padding (default "h-28 px-3")
  align?: "top";                 // anchor to the top instead of centering (good for lists/panels)
}
```

### Coverage: **49 / 64** (as of this handoff)

The **Navigation & structure** batch (14) shipped here: `navbar, tabs, collapse, section,
card-list, breadcrumbs, tree, panel-stack, editable-text, entity-title, non-ideal-state, link,
slider, hotkeys`. Plus the pre‑existing 35 (buttons/display, form controls, all overlays, html-table,
ai-explainability).

### Remaining (15), grouped by approach

| Group | Ids | Approach |
| --- | --- | --- |
| **Composite selects** (5) | `select`, `suggest`, `multi-select`, `omnibar`, `tag-input` | These **portal** their dropdown — mock the *surface* inline (closed control + a static results panel built with `OVERLAY_PANEL`), like the overlay previews. `tag-input` is inline (no portal) so it can use the real component directly. |
| **Date & time** (6) | `time-picker`, `date-picker`, `date-range-picker`, `date-input`, `date-range-input`, `timezone-select` | The **calendars/time pickers render inline** → use the real component with a static `defaultValue`. The **\*-input** + `timezone-select` variants portal a popover → show the *field* (real component, closed) or mock the open surface. |
| **Data** (1) | `data-table` | Real component with a small static row set; it's intrinsically sized. Likely needs a `scale` + a bounded width; see DataTable notes in the playground handoff (always virtualized; no `fill`). |
| **Infrastructure** (3) | `resize-sensor`, `overflow-list`, `portal` | **Decision: leave icon‑only.** Behavioral/layout utilities with no meaningful static thumbnail — the icon‑tile fallback is the intended outcome (mirrors the playground handoff's group D). Don't force a preview. |

So the real remaining work is **12** (selects 5 + dates 6 + data 1); the infra trio is deliberately
skipped.

---

## How to author a preview (the recipe)

1. **Borrow the shape from the playground.** `src/playground.tsx` already has a curated, representative
   composition for almost every component in its `render`. Strip the interactivity/controls and you
   have a preview. (That's exactly how the Nav batch was built.)
2. **Keep it static — no portals, no state, no hooks.** `render` is a plain `() => ReactNode`; don't
   call `useState`/`useTreeState`/etc. inside it. For components that are normally driven by a hook,
   pass static data directly:
   - **Tree** — pass a literal `TreeNodeInfo[]` to `contents` (with `isExpanded`/`isSelected` baked
     in) instead of `useTreeState`.
   - **PanelStack** — pass a literal `stack` (controlled mode); omit `onOpen`/`onClose`.
3. **Overlays/portaled components can't live in a tile** (they portal to `document.body`). Preview the
   *surface* inline using the shared `OVERLAY_PANEL` class (see `menu`, `dialog`, `drawer`, `toast`,
   `context-menu` for worked examples). If a component renders **inline** (Tabs, Slider, Tree,
   inline calendars), just use it directly.
4. **Size it.** Give the composition a fixed `width` (inline `style`) near natural size; use `scale`
   for things that are too wide/dense (Navbar 0.6, Section 0.72, Tabs 0.8…) and `align: "top"` for
   vertical lists/panels (tree, card-list, section, panel-stack) so they read top‑down and let the
   bottom clip rather than centering and clipping both ends.
5. **Verify in BOTH themes** at `#showcase` (toggle light/dark from the top app bar). Tokens re‑tint
   automatically, but eyeball it — surfaces, borders, and selected/hover states are easy to get wrong.

### Gotchas learned here

- **PanelStack collapses to 0 height.** Its root is `position: relative` whose only child is
  `absolute inset-0`, so without an explicit height it renders blank. Give the component
  `style={{ width: "100%", height: "100%" }}` inside a fixed‑size wrapper (mirrors the playground's
  `PanelStackDemo`). This pattern applies to any "fills its container" component.
- **Icon names are plain strings.** `Tree`/`Breadcrumbs`/`NonIdealState` take `IconName` (a string
  union) — literals like `"folder-close"` are assignable, no type import needed.
- **`EditableText`/`Section`/`Collapse`** render fine statically (defaultValue / defaultIsOpen / isOpen);
  the inert frame means their click‑to‑edit / toggle never fires. Add a small eyebrow label (see
  `editable-text`) so a bare value doesn't read as plain text on the tile.
- **Don't regenerate `gen:meta`/`gen:props` for previews** — those generators key off components &
  tests, not `previews.tsx`. Adding a preview changes no badge/props data.

---

## Verification & conventions

- `pnpm build` (typecheck + vite) **and** `pnpm test` green (357 currently).
- Eyeball every new tile at `#showcase` in **both** themes.
- One coherent batch per PR (matches the playground handoff convention). Branch off `main`.
- **Measure coverage** before/after with this (catches both quoted and bareword `PREVIEWS` keys):

  ```bash
  python3 - <<'PY'
  import re
  app=open('src/App.tsx').read(); prev=open('src/previews.tsx').read()
  ids=list(dict.fromkeys(re.findall(r'\{\s*id:\s*"([a-z0-9-]+)",\s*title:',app)))
  block=re.search(r'PREVIEWS[^=]*=\s*\{(.*)\n\};',prev,re.S).group(1)
  keys={a or b for a,b in re.findall(r'^\s{4}(?:"([a-z0-9-]+)"|([a-z][a-zA-Z0-9]*)):\s*\{',block,re.M)}
  print('missing:', [i for i in ids if i not in keys])
  PY
  ```

## Key files

- `src/previews.tsx` — `PREVIEWS` (the registry), `PreviewEntry`, `OVERLAY_PANEL`, `ComponentPreview`,
  `hasPreview`.
- `src/playground.tsx` — borrow `render` shapes from here.
- `src/App.tsx` — `ComponentPreview` is rendered per tile in `ShowcaseOverview`; `hasPreview` gates the
  icon‑only fallback.
- `src/lib/demo/ai-explainability.tsx` — example of content shared between a preview and its playground.
