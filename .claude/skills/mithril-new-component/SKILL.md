---
name: mithril-new-component
description: >-
  End-to-end workflow for ADDING A NEW COMPONENT to the mithril design system (this repo) —
  the owned-source library under src/components/ui/. Use this whenever you're creating a brand-new
  mithril component or wrapping a third-party library as one: it covers the component file itself
  AND every registration point that's easy to half-finish (gallery, playground, overview-tile
  preview, registry, tests, generators). Reach for it the moment the task is "add a <X> component",
  "build a new mithril control", "expose <library> as a mithril component", or "why isn't my new
  component showing up in the showcase / its tile / the props table?". Pairs with the `mithril`
  skill (which covers COMPOSING existing components); this one is about CREATING them.
---

# Adding a new component to mithril

A new mithril component is **not just a file** — it's a component file plus a fixed set of
**registration points** that make it a first-class citizen of the showcase and the owned-source
registry. The component file is the fun part; the registration points are rote and *easy to leave
half-done*. The classic symptom: the component works on its page but its **overview tile shows only
an icon** (you forgot `previews.tsx`), or the **props table is empty** (you didn't run `gen:props`).

This skill is the checklist that keeps you from shipping a half-wired component. Read
[`CLAUDE.md`](../../../CLAUDE.md) for project direction and the `mithril` composition skill for the
token/dark/icon rules you'll lean on while writing the component itself.

> **Templates.** To see every registration point in situ, **grep an existing component's id across
> the repo** — pick one that's actually committed on your branch. `file-input` is a safe, always-present
> choice: `grep -rn '"file-input"\|FileInput' src/App.tsx src/playground.tsx src/previews.tsx`. The
> `file-dropzone` component (a `react-dropzone` wrapper) is the canonical *worked example* of this flow,
> but it's newer — if it's absent on your branch, your checkout predates it; fall back to `file-input`.
> Always read 2–3 real neighbors before assuming a file path or variable name from this skill.

## Before you build: is it owned-source-shaped?

If the component **wraps a third-party library**, first decide whether that library *fits* mithril's
owned-source, token-styled model. A headless hook (you own the DOM, style from tokens) fits; a
pre-styled, self-contained widget (ships its own CSS/DOM/theme) fights the system. This is a real
decision with a real framework — see [`reference/library-fit.md`](reference/library-fit.md) before
adding any new npm UI dependency.

## The workflow

Work top-to-bottom. Each step says **which file** and **what to add**.

### 1. The component — `src/components/ui/<name>.tsx`

Match the surrounding components (read 2–3 neighbors first). The load-bearing conventions:

- Start with `"use client";`, use `forwardRef`, export a named component, and write a **JSDoc header
  that explains the design decisions** (not just what — *why*; see file-input/file-dropzone headers).
- **Style from tokens via literal utility classes** (`bg-blue-3`, `text-foreground-muted`,
  `shadow-input`, `rounded-bp`, `ease-bp`) — **never** runtime `var()` in inline `style`, which
  Tailwind v4 tree-shakes away. Use CVA for multi-axis variants, or plain conditional `cn()` for
  simpler components (both idioms exist in the repo). **Verify every utility class actually exists**
  before trusting it — grep the class in `src/components/ui` / `src/styles`; a typo'd token silently
  renders nothing. Opacity modifiers on intent tokens (`bg-intent-primary/10`) are fine.
- **Icons:** import glyph *objects* from `./icons` (`import { cloudUpload } from "./icons"`) so the
  component renders standalone without the registry; pass them to `<Icon icon={cloudUpload} />`. If
  you expose an `icon` prop you render via `<Icon>`, type it `IconName | IconGlyph` (NOT the broader
  `IconProp`, which includes `false`/`ReactElement` that `<Icon>` rejects — a real typecheck error).
- **Dark mode is class-based**; if the component portals (Popover/Dialog/Menu-family), thread
  `dark` — see the `mithril` skill's overlays reference.
- Wrapping a headless lib? It's the same shape as wrapping Radix: own all the markup, style from
  tokens, expose a clean typed API. Forward what the lib doesn't (e.g. react-dropzone's
  `getInputProps()` doesn't propagate `disabled` to the `<input>` — pass it yourself).
- **Intent-bearing component?** Use the shared `Intent` type from `@/lib/types` and the solid-intent
  token convention (`bg-primary` + `text-primary-foreground`, `ring-success`, etc.) — read `tag.tsx`
  for the canonical pattern rather than inventing intent classes.

### 2. Gallery registration — `src/App.tsx` (FIVE edits, in three different parts of the file)

1. **Import** the component near the other `@/components/ui/*` imports.
2. **A `<NameGallery>` function** rendering representative specimens in `<Section>`s (mirror a
   neighbor like `FileInputGallery`). For net-new design there's no Blueprint baseline — show the
   states that matter (sizes, intents, disabled, a live/controlled example).
3. **An entry in the `COMPONENTS` array** (`const COMPONENTS: {id,title,render}[]`):
   `{ id: "<name>", title: "<Name>", render: () => <NameGallery /> }`.
4. **Add the `id` to a `CATEGORIES` entry** so the tile appears in a group. There's no canonical
   bucket — read the existing `CATEGORIES` labels and pick the closest (form controls go in
   `"Form controls"`; display/visual components without a form role usually go in `"Buttons & display"`).
5. **Add an icon** in the `COMPONENT_ICONS` record (`"<name>": "<icon-name>"`) — a *separate* object
   literal lower in the file, which is why it's easy to forget. Use a real Blueprint icon name.

### 3. Playground — `src/playground.tsx` (interactive controls)

Import the component, then add a `PLAYGROUNDS["<name>"]` entry with `initial` / `controls` /
`presets` / `render` / `code` (copy a neighbor's shape). This drives the live single-instance
playground on the component page; components without an entry fall back to their Examples gallery.

### 4. Overview-tile preview — `src/previews.tsx` (THE EASY MISS)

Import the component and add a `PREVIEWS["<name>"]` entry rendering a **small, static** composition
of the real component. **No state, no portals** — overlays portal out of the tile, so preview their
*surface* inline. Without this entry the overview tile silently falls back to icon-only. This is the
single most-forgotten step.

### 5. New npm dependency? — `tools/gen-registry.mjs`

If the component imports a new npm package, add its name to the `NPM_PREFIXES` array so the registry
generator lists it as a `dependencies` entry (otherwise the published registry item won't install
the dep). Internal `@/components/ui/*` imports are picked up automatically as `registryDependencies`.

### 6. Behavior tests — `src/components/ui/__tests__/<name>.test.tsx`

Vitest + Testing Library, covering behavior / keyboard / ARIA (visuals are verified by eye, not unit
tests). Mirror a neighbor. Gotcha: a state update triggered by an **imperative `ref` handle** (or any
update outside an event) must be wrapped in `act(...)` or the assertion runs before the re-render.

Note the `__tests__/axe-smoke.test.tsx` suite crawls the whole gallery, so your new tile **will** be
audited — give interactive elements accessible names (`aria-label`) and correct roles, or you'll fail
a test you didn't write.

### 7. Generators + verify

```bash
pnpm gen:registry   # registry.json — npm deps + registryDependencies from imports
pnpm gen:meta       # per-component showcase badges (tests / RSC / portal / radix)
pnpm gen:props      # props/API table (react-docgen-typescript)
pnpm build          # tsc -b + vite — must be green
pnpm test           # full Vitest suite — must be green
```

Then **eyeball it in the running gallery in BOTH themes** (`pnpm dev` → :5173,
`#showcase/<name>`): the page (playground + props), and the overview tile under its category.

## Gotchas worth pre-empting

- **Stale preview tile after editing `previews.tsx`.** Vite HMR may keep serving the old module, so a
  freshly-added preview still shows the icon-only fallback. **Hard-reload** the page before concluding
  the preview is broken — the code is usually fine.
- **Registry description is auto-generated boilerplate** (`"<Name> — Blueprint-faithful, built on
  CVA."`) for every item, even net-new non-CVA components. It's a known cosmetic wart of
  `gen-registry.mjs`; don't hand-edit `registry.json` to "fix" one entry (the generator overwrites it)
  — change the generator if it genuinely matters.
- **`gen:meta` / `gen:props` read the source**, so re-run them after the component is final, not
  before — stale generated files are a common cause of a missing props table or wrong badge counts.

## Definition of done

The component file exists and is token-styled; it appears in the gallery (page + categorized tile
*with a real preview*), has a playground entry, has behavior tests, is in `registry.json` with the
right deps, and `pnpm build` + `pnpm test` are green in both themes. If any one of those is missing,
the component is only half-added.
