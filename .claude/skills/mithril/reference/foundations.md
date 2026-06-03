# Foundations — tokens, theming, dark mode, icons

The rules every component sits on. Get these wrong and styles silently vanish, themes don't
re-tint, or icons don't render.

## Tokens & Tailwind v4 tree-shaking

Tailwind v4 **tree-shakes unused `@theme` variables**. The practical consequences:

- **Style with literal utility classes.** `bg-blue-3`, `text-intent-primary-text`,
  `shadow-elevation-2`, `ease-bp`, `rounded-bp`. These keep the underlying token alive *and*
  apply it.
- **Never put a `@theme` token in an inline `style`.** `style={{ background: "var(--blue-3)" }}`
  fails — nothing references `--blue-3` as a class, so Tailwind drops it and the var is undefined
  at runtime. Use `className="bg-blue-3"` instead.
- **Arbitrary-value classes are OK for always-emitted `:root` vars.** Vars declared in plain
  `:root {}` (not `@theme`) are always present, so `bg-[var(--interactive-hover)]`,
  `shadow-[inset_0_1px_0_rgba(...)]` are safe. This is the escape hatch when no utility exists.
- **Inline `style` is correct for genuinely dynamic values** — a user-provided width, a computed
  position. Those aren't tokens, so tree-shaking doesn't apply.

## Theming (seed derivation)

Semantic tokens (`--primary`, `--foreground`, surfaces, intents) are **derived at runtime** from
a small **seed set** (the four intent vars + the gray ramp) via `oklch(from …)` / `color-mix()`,
with static `@supports` fallbacks. To make a theme:

- **Override seeds, and only on `<html>`.** Setting a seed on `<html>` re-tints the entire theme
  because the light-mode semantic tokens (declared on `:root`) re-resolve against it. Setting it
  on a descendant leaves the already-computed inherited values unchanged — it won't work.
- **Don't redeclare semantic tokens** in a theme — just the seeds. The bundled `[data-theme="datex"]`
  re-seeds the four intents to a brand palette; backgrounds stay identical (it only re-tints intents).
- Every theme automatically has light and dark variants (dark re-derives from the same seeds).

See `src/styles/tokens.css` and `docs/theming.md`.

## Dark mode

- Class-based: `.dark` **or** `[data-mode="dark"]` on an ancestor swaps the semantic vars.
- The Tailwind `dark:` variant is **descendant-only** (`&:where(.dark *, [data-mode="dark"] *)`).
  So a `dark:` utility needs a `.dark` **ancestor** — a `.dark` class on the *same* element does
  **not** satisfy it. (When you must style an element that itself carries the `.dark` class, use a
  self-matching arbitrary variant like `[&.dark]:bg-dark-gray-3`, or a var-backed token — the
  CSS custom properties *are* redefined on the `.dark` element itself.)
- **Portals**: see [`overlays.md`](overlays.md) — pass `dark` into any component that portals.

## Icons (706-glyph Blueprint port, no third-party dep)

Two ways to render, pick per context:

- **By name (dynamic):** `<Icon icon="cog" />`. Resolves through a registry that must be
  populated. `App.tsx` calls `registerIcons(ICON_GLYPHS)` once, so all names work in the gallery
  and demos. If you build something that renders standalone (outside that registration), names
  won't resolve.
- **By glyph object (tree-shakeable):** `import { cog } from "@/components/ui/icons"; <Icon icon={cog} />`.
  Ships only the glyphs you import. This is how library components import their own structural
  glyphs so they render standalone.

Gotchas:

- `ICON_GLYPHS` (in `icons/all.ts`) must stay typed `Record<IconName, IconGlyph>` — an explicit
  union, **never** `as const` — or it triggers TS2590 ("expression too complex").
- Names that camelCase to a JS reserved word get an `Icon` suffix: `delete` → `deleteIcon` (also
  `export`/`function`/`import`/`package`/`switch`).
- **Icon color**: `Icon` defaults to `text-foreground` even at `intent="none"`. To make it inherit
  a host's color (e.g. inside a colored Button/Tag), add `className="!text-current"`.
- Icon props that accept a name string should be typed `IconName | ReactElement` (use the
  `resolveIcon` helper in `icon.tsx`), **not** `| ReactNode` — `ReactNode` collapses autocomplete
  for the name union.

## Regenerating / distributing

- `pnpm gen:icons` — regenerate the glyph map from `tools/gen-icons.mjs`.
- `pnpm gen:registry` — regenerate `registry.json` from `src/components/ui` (run after adding a
  component so it's owned-source distributable).
- `pnpm build:registry` — build the published shadcn registry items.
