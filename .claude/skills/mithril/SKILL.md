---
name: mithril
description: >-
  Compose mithril UI components correctly — this repo's owned-source design system
  (~60 components on React 19 + Tailwind v4 + Radix + CVA). Use when building or
  editing UI in this repo: anything under src/components/ui/ or the demo apps in
  src/demos/, wiring overlays (Popover/Menu/Tooltip/Dialog/Drawer), forms, data
  tables, or date/time pickers — and especially when you hit a composition gotcha
  (menu-in-popover padding, dark-mode portals, Tailwind token tree-shaking, icon
  rendering by name, focus-driven popovers). Teaches the patterns the component
  types alone don't reveal.
---

# Building with mithril

mithril is a **modern, owned-source** component library (shadcn-style: consumers copy
and own the source). You are usually *composing* these components into apps (`src/demos/`)
or *extending* the library (`src/components/ui/`). This skill captures the cross-component
patterns and gotchas — the things that are correct per-component but easy to get wrong when
you wire them together.

> Read [`CLAUDE.md`](../../../CLAUDE.md) for the project's direction and `README.md` for the
> full story. This skill is the *how-to-compose* layer on top of those.

## Mental model — internalize these first

1. **Tokens, not literals — and not runtime `var()` in inline styles.** Tailwind v4
   tree-shakes unused `@theme` vars. Style with *literal utility classes*
   (`bg-blue-3`, `text-intent-primary-text`, `shadow-elevation-2`, `ease-bp`). Do **not**
   write `style={{ background: "var(--blue-3)" }}` — that token gets dropped. Arbitrary-value
   classes that reference always-emitted `:root` vars are fine (`bg-[var(--interactive-hover)]`).
   See [`reference/foundations.md`](reference/foundations.md).

2. **Dark mode is class-based and must be *threaded through portals*.** Dark is
   `.dark` / `[data-mode="dark"]` on an ancestor (descendant variant: `&:where(.dark *, …)`).
   Any component that **portals to `document.body`** (Popover, Tooltip, Menu-in-Popover,
   Dialog, Drawer, Select-family, Toast) renders *outside* the app's `.dark` ancestor, so you
   **must pass `dark={dark}`** (from `useDark()`), or the portaled panel renders light-on-dark.
   This is the #1 thing to remember for overlays.

3. **Icons render by name through a registry, or as tree-shakeable glyph objects.**
   `<Icon icon="cog" />` (string) resolves through a registry that must be populated with
   `registerIcons(ICON_GLYPHS)` (done once in `App.tsx`). For app code that's fine. For
   library/standalone code, import the glyph object: `import { cog } from ".../icons"`. See
   [`reference/foundations.md`](reference/foundations.md).

4. **Theme by overriding *seeds*, on `<html>` only.** Semantic tokens are derived at runtime
   from a small seed set (intent vars + gray ramp). Override a seed on `<html>` to re-tint the
   whole theme (the bundled `datex` theme does this). Don't redeclare semantic tokens.

5. **Verify the way the repo verifies.** `pnpm build` (typecheck + vite) and `pnpm test` must
   stay green. For *visual* changes to an existing component, `tools/compare.sh <id>`; for new
   or intentionally-divergent design, eyeball it in the gallery (`pnpm dev` → :5173) in **both**
   themes. Blueprint is the *baseline*, not a spec to chase.

## Where things are

- `src/components/ui/<name>.tsx` — the components. Their JSDoc headers are detailed and worth reading.
- `src/App.tsx` — the gallery/showcase; every component has a live specimen. Hash-routed
  (`#showcase/<id>`). The canonical "how is this used" reference.
- `src/demos/` — full example apps (Sentinel SOC, Orbit Board, Skylark). Real composition.
- `src/styles/tokens.css` — the token/seed foundation. `src/styles/globals.css` — keyframes + base.
- Register a new component in the gallery (`src/App.tsx`) and run `pnpm gen:registry`.

## Composition recipes (load the slice you need)

- **[Overlays](reference/overlays.md)** — Popover, Menu, Tooltip, Dialog, Drawer, ContextMenu.
  The dense, high-gotcha area: dark threading, **menu-in-popover → `MenuPopover`**, focus-driven
  opens (`anchorOnly`), menu sizing, exit animations. *Start here — it's the worked exemplar.*
- **[Foundations](reference/foundations.md)** — tokens, theming, dark mode, icons. The rules
  behind recipe #1–#4 above.
- **[Forms](reference/forms.md)** — inputs, selects, controls, validation/intent wiring.
- **[Data](reference/data.md)** — tables (HTMLTable vs DataTable), trees, lists.
- **[Dates & time](reference/dates.md)** — date/time/range pickers and inputs.

## Fast rules of thumb

- Putting a `<Menu>` in a popover? Use **`<MenuPopover>`**, not `<Popover>` (it presets
  `hasContentPadding={false}`; a bare Popover wraps the menu in 20px of padding).
- Rendering *any* overlay that portals? Pass **`dark={dark}`**.
- Reaching for an inline `style={{ …token… }}`? Stop — use a utility class instead.
- Adding an exit animation to a Radix Dialog-based overlay? Don't wrap its portal children in a
  plain `<div>` (Dialog's Portal Presence-wraps each child; an un-animated wrapper kills the
  exit). See overlays → "Animating overlays".
