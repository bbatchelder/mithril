---
name: mithril-example-page
description: >-
  End-to-end workflow for RECREATING A REAL APP PAGE as a full-page design example in this repo —
  study a live web app in the browser, rebuild its layout as an original mithril composition under
  src/examples/, and ship it into the Claude Design kit's "Examples" group via the design-sync
  pipeline. Reach for it when the task is "recreate this page/app as an example", "add an example
  page to the design system", "rebuild <URL> in mithril", "make a design-inspiration page", or
  "add this to the Claude Design kit". Pairs with `mithril-design` (the aesthetic to translate
  INTO) and `mithril` (how to wire the components); this skill is the pipeline around them.
---

# mithril example pages — recreate a real app as a kit example

Full-page design examples are complete surfaces composed from mithril components — an app shell,
its tables, heroes, and empty states — captured into the Claude Design kit (the "Mithril Design
System" project on claude.ai/design) as an **Examples** group, so mockups can start from a whole
layout instead of a single component. The reference implementation of this whole workflow is
`src/examples/ObjectExplorer.tsx` (a Foundry-Object-Explorer-inspired ontology browser, PR #81) —
read it alongside this file.

The pipeline: **study in browser → rebuild in `src/examples/` → eyeball both themes → capture →
build → render-check → push via DesignSync → PR.**

## 1. Study the source page in the browser

Use the Chrome tools (`claude-in-chrome`) on the live app:

- Screenshot the initial view, **scroll to the full extent**, and **zoom into regions** you'll
  otherwise get wrong: icon treatments, table row anatomy (chips, status glyphs, mini bar charts),
  control clusters, tab strips, empty states.
- Inventory the structure *in words* before writing code: shell zones (rail / top bar / tab strip),
  sections in order, table columns, where the segmented controls and filters sit, what's active vs
  muted. You are extracting the **layout and information design**, not the pixels.
- Capture realistic data shapes (counts like "1.7M", label patterns, how truncation behaves) —
  believable example data is most of what makes the card read as real.

**Recreation, not copying.** The example must be an *original mithril composition*: mithril tokens,
mithril icon glyphs, your own code and your own description copy. No copied source, assets, or
brand marks — replace logos with a generic glyph. The design language is mithril's
(`src/styles/tokens.css`), so the result is *inspired by* the source's structure and will not be
pixel-identical; that is the point.

## 2. Build the page in `src/examples/`

Create `src/examples/<PageName>.tsx` and register it in `src/examples/registry.ts`.

**Registry contract** — design-sync's `gen-meta.mjs` parses the registry *textually*: keep each
entry's fields **literal and in this order**: `id`, `title`, `description`, `width`, `component`.
No computed values. `width` is the capture viewport and kit card width (1440 for desktop shells;
component cards are 900).

**Design and composition:** follow the `mithril-design` skill (non-negotiables + the
layout-and-shell recipes — dark rail with white-alpha hover rows under a `.dark` wrapper, catalog
tables, app home patterns) and the `mithril` skill for wiring. Extended colors appear **only** as
categorical object-type chips; one primary spot of color per surface.

**Capture-friendliness rules** (what makes the page a good static card):

- **Natural height, no inner scroll** — the card should show the *entire* composition. Root shape:
  `<div className="overflow-x-auto …"><div className="flex min-h-[920px] min-w-[1280px]">…` so
  narrow contexts (if the page is ever embedded) scroll horizontally instead of squishing.
- **Deterministic**: static data declared in the file; uncontrolled controls (`defaultValue`);
  no timers, randomness, or entry animations.
- **No open portals** (dialogs/popovers/tooltips) unless the overlay *is* the subject — the
  capture is a static frame.
- **Literal Tailwind classes only** (Tailwind v4 tree-shakes runtime `var()` styles), including
  arbitrary values for data-driven widths — a usage bar is `w-[62%]` as a literal class in the
  data table, never an inline style computed at runtime.
- Both themes must read well: `dark:` variants are class-based; tinted chips like
  `bg-cerulean-3/15 text-cerulean-1 dark:text-cerulean-5` adapt per theme.

## 3. Eyeball in the harness

The isolated harness renders examples full-bleed (no showcase column) and marks the wrapper with
`data-capture-root` so `extract.js` measures the true content height:

```
http://localhost:5173/?example=<id>              # light
http://localhost:5173/?example=<id>&theme=dark   # dark
```

(Dev server usually runs under tap: `tap status mithril-demo`.) Check both themes at full width.
Classic fixups: right-elements wrapping inside `InputGroup` (add `whitespace-nowrap`), truncation
columns needing `max-w-0 truncate`, chip contrast in dark.

## 4. Capture → build → render-check

```bash
tools/design-sync/capture-all.sh <id>   # id matches example ids too (no "example-" prefix)
node tools/design-sync/build.mjs        # writes examples/<id>.html into the bundle
node tools/design-sync/render-check.mjs # must end bad=0 thin=0 variantsIdentical=0 clipped=0
```

Existing component captures in `dist-design/captures/` are reused, so an example-only run is
cheap. Eyeball `dist-design/.render-check/examples_<id>.png` — it's the exact card, light and
dark stacked. `agent-browser` daemon wedged? `agent-browser close --all` and retry (see
`tools/design-sync/README.md` for all capture gotchas).

## 5. Push to the Claude Design project

Push the changed files with the `DesignSync` tool against the "Mithril Design System" project
(id in `tools/design-sync/README.md`): `finalize_plan` with `localDir: dist-design/bundle` and
writes for `ui_kits/mithril/examples/<id>.html` + `ui_kits/mithril/README.md`, then `write_files`.

**New-card gotcha (will bite):** the Design System pane's index `_ds_manifest.json` (project
root) is compiled by the claude.ai app's own self-check, which does **not** re-run on a
DesignSync write — a brand-new card never appears until you `get_file` the manifest, append
`{path, group: "Examples", name, subtitle}` to its `cards` array, and `write_files` it back
(root path → needs its own `finalize_plan`). Then reload the pane and confirm the card renders
under **Examples**. Edits to an existing card need no manifest touch.

## 6. Verify and ship

- `pnpm build` and `pnpm test` green.
- Branch off `main`, commit (Co-Authored-By trailer), open a PR describing the source
  inspiration, the sections recreated, and the verification (render-check counts, pane check).

## Registration-point checklist

Easy to half-finish — confirm every row:

| Point | Where |
|---|---|
| Page component | `src/examples/<PageName>.tsx` |
| Registry entry (literal field order) | `src/examples/registry.ts` |
| Renders in harness, both themes | `?example=<id>` / `…&theme=dark` |
| Captured + built + checked | `capture-all.sh <id>` → `build.mjs` → `render-check.mjs` all green |
| Pushed card + kit README | DesignSync `write_files` |
| Pane index knows the card | `_ds_manifest.json` cards entry appended |
| Card visible on claude.ai | Design System pane → Examples group |
| Repo green + PR | `pnpm build` · `pnpm test` · PR |
