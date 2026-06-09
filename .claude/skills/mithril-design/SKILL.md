---
name: mithril-design
description: Use when DESIGNING the look-and-feel of dense, data-heavy operator/analyst UIs in mithril — dashboards, internal tools, ontology/object browsers, pipeline editors, AI-agent interfaces, observability/monitoring walls, map/geospatial workspaces — with quiet gray chrome, compact data tables, and a mission-control register. Triggers include "data cockpit," "mission control," "operator UI," "data-dense desktop UI," "enterprise/internal data tool," "observability/monitoring dashboard," "Grafana-style dashboard," "terminal/TUI UI," "btop/htop-style readout," "command palette / keyboard-first tool," "candlestick/trading-terminal chart," "map/geospatial dashboard," "Bloomberg Terminal feel." This is the AESTHETIC layer for mithril; pair it with the `mithril` skill (how to compose components) and `mithril-new-component` (how to build one).
---

# mithril design — Dense Operator & Analyst Tooling

An aesthetic playbook for dense, high-stakes operator/analyst UIs — the *quiet chrome, loud data*
register of mission-control software and financial terminals, expressed in **mithril's** design
language. This is the *what should it look like* layer. For *how to wire the components* use the
[`mithril`](../mithril/SKILL.md) skill; for *how to add a new component* use `mithril-new-component`.

mithril's visual coherence comes from `src/styles/tokens.css` — a seed-derived token set (palette,
intents, surfaces, elevation, type, motion) with light/dark variants and runtime theming. This skill
tells you how to *use* those tokens to build a correct dense surface.

> mithril's tokens were originally ported from Blueprint v6.15, but mithril is now its own system:
> it does not track Blueprint, and the design language is **expected to diverge** — absorbing ideas
> from other systems (see [inspirations.md](references/inspirations.md)) and adding original ones
> (mobile-friendliness, charts, mapping). Treat the rules here as mithril's, not Blueprint's.

## When this skill applies

Apply when the goal is an **operator/analyst tool** for **dense data**: dashboards, internal tools,
object/ontology browsers, pipeline editors, AI agent UIs, observability surfaces, geospatial
workspaces — anything in the demo apps under `src/demos/` or a new app in that register. Apply when
the user asks for a "data cockpit" / "mission control" feel, a Bloomberg-terminal density, or names
a register inspiration (Grafana, TradingView, Kepler.gl, Linear, btop).

The default register is **dense desktop**, but mithril is evolving toward genuine
mobile-friendliness (a deliberate departure from the desktop-only systems this look descends from) —
so "this is for mobile too" is in-scope, not a reason to redirect. Where a pattern is desktop-dense
by nature (a 24-column dashboard grid, a multi-pane terminal), say so and offer the responsive
adaptation rather than refusing. For the canonical desktop→mobile reflow of each shell element
(rail → hamburger drawer, pinned inspector → full-screen, table → stacked cards, KPI row → 2-up) plus
touch targets and where breakpoints live, see [mobile.md](references/mobile.md).

> Mental model: **Bloomberg Terminal × modern web app**, with a mission-control inflection.

## Core philosophy (the rules everything else falls out of)

1. **Quiet chrome, loud data.** UI surfaces (nav, panels, headers) recede into neutral grays so
   data, charts, and content carry the visual weight. *"The gray scale should be used for the main UI
   frame: containers, headers, sections, boxes. If you need to call attention to a particular element,
   use one of the core colors instead."*

2. **Information density over whitespace.** Tables, panels, and metadata read like a cockpit.
   "Breathing room" reads as *unfinished* here. Default body text 14px (`text-body`); default control
   row 30px (`h-control`); default padding 8–12px (`p-2`/`p-3`).

3. **Composability.** Layouts are built from a small set of primitives (panels, tables, sidebars,
   popovers, dialogs) that nest and tile predictably. The interface is a workspace, not a page.

4. **Immediate feedback for power users.** Keyboard shortcuts, hover affordances, and inline editing
   are first-class. Every action exposes its shortcut in its tooltip. (Deep dive: [linear.md](references/linear.md).)

5. **Zone-native, not "dark-mode-native."** A common shell mixes a **dark left rail / AI panel** with
   a **light main content area**. Full-light and full-dark are both valid; most operational screens mix
   zones. AI surfaces lean dark even when embedded in light tooling; long-session ops walls often go
   fully dark.

6. **Restrained, technical sensibility.** Slightly austere. Avoid playful illustrations, gradients,
   soft shadows, mascots, emoji in chrome, or rounded "consumer SaaS" warmth.

## The non-negotiables

These are the rules that, if broken, immediately break the aesthetic. Follow them even if you skip
the rest. Style with **literal Tailwind utility classes bound to mithril tokens** — never runtime
`var()` in inline styles (Tailwind v4 tree-shakes those tokens; see [the gotcha](#durable-gotcha)).

- **Page background**: `bg-background` (`#f6f7f9` light / `#1c2127` dark). A dark rail/zone uses
  `bg-surface` (`#252a31` in dark) or a literal `bg-dark-gray-2`. Surfaces step: `bg-background` →
  `bg-surface` → `bg-elevated`.
- **Body text**: 14px (`text-body`), mithril's system sans stack (`font-sans`). Headings `text-heading-sm`
  (16) / `text-heading` (20); content rarely exceeds 20px. **Never** Inter, Geist, or other "design
  system" sans — the system stack renders crisper at 12–14px on dense UIs.
- **Intent is typed, and saturated color is rare.** mithril has one default primary
  (`--color-primary`, blue-3 `#2d72d2`), re-tintable by overriding seeds (the Theme Builder / built-in
  themes Blueprint·Datex·Anthropic — see [`docs/theming.md`](../../../docs/theming.md)). Regardless of
  theme, **CTAs are intent-typed**: **primary** for *submit/confirm/save*, **success (green)** for
  *create/run* (`+ New …`, `Create`), **danger (red)** for *destroy*, **warning (orange)** for
  *warn-acknowledge*. A correct screen has **1–3 small spots of color against an ocean of gray**.
- **Border radius**: `rounded-mithril` (4px) is the canonical token for buttons, inputs, cards, dialogs,
  popovers. `rounded-mithril-sm` (2px) and `rounded-mithril-lg` (6px) exist; pills/avatars use `rounded-full`.
  Never `rounded-2xl`; nothing over 6px on chrome.
- **Borders**: 1px, low-contrast — `border-border` (gray-1 @ 12%) between panels in a group,
  `border-border-strong` (@ 25%) to separate distinct sections or table headers. The interface is a
  **mosaic of bordered surfaces**, not free-floating cards.
- **No gradients in chrome. No glassmorphism. No neumorphism.** Subtle elevation IS allowed via
  `shadow-elevation-{0..4}` / `shadow-overlay-{1,3,4}` (each layers a 1px ring with a small drop) — but
  reserved for *overlays* (dialog, popover, dropdown, drawer). Inline content stays flat.
- **One primary intent CTA per surface.** Everything else is default gray, minimal (transparent), or
  outlined.
- **Monospace for system identifiers**: code, IDs, RIDs, paths, timestamps (`font-mono`). Sans for
  everything else.
- **Numbers in tables are tabular** (`tabular-nums`).
- **Extended colors** (cerulean, forest, gold, indigo, lime, rose, sepia, turquoise, vermilion,
  violet) are **NEVER for general UI chrome** — they're for data viz, categorical tags, and object-type
  icons only.
- **Focus ring**: a visible 2px ring on `:focus-visible` (`--ring` / `ring-width` 2px / `ring-offset`
  2px). Never removed.

## Quick checklist for any new screen

1. Is the page background `bg-background` (full light/dark) or — commonly — a dark rail (`bg-surface`
   in dark) over a light main (`bg-background`)?
2. Are all panels bounded by 1px low-alpha borders (`border-border`), with 8–16px internal padding?
3. Is body text 14px (`text-body`) in the system sans stack?
4. Exactly one primary intent CTA per surface, intent matching the action (primary=submit,
   success=create, danger=destroy, warning=warn)?
5. Are control rows 30px (`h-control`) and aligned to the 4px grid?
6. Is there a left rail nav, and where appropriate a right inspector and/or AI side panel?
7. Are tables compact (30px or 24px row height), with monospace IDs and tabular numerics?
8. Do interactive elements have a 2px `:focus-visible` ring and tooltips with keyboard shortcuts?
9. If the screen mixes light and dark zones, is each zone an ancestor `.dark` / `[data-mode="dark"]`
   region — and do **portaled overlays inside it receive `dark={dark}`** (see the `mithril` skill)?
10. Could a Bloomberg user sit down and operate this without a tour?

## Where to read what

This skill is split into reference files. Read the one(s) that match the task — don't preload everything.

| Task | Reference |
|---|---|
| Understand the inspirations behind this aesthetic and what each contributes | [inspirations.md](references/inspirations.md) |
| Pick typography, spacing, color, icons, motion, elevation, data-viz ramps — the token vocabulary | [visual-foundations.md](references/visual-foundations.md) |
| Compose a whole page (left rail, top bar, panel layout, object-detail view, builder/canvas surfaces) | [layout-and-shell.md](references/layout-and-shell.md) |
| Adapt a dense desktop surface to mobile/responsive (rail→drawer, inspector→full-screen, table→cards, KPI 2-up, touch targets) | [mobile.md](references/mobile.md) |
| Build an AI surface (chat side-panel, tool-call traces, streaming, citations, eval/observability) | [ai-surfaces.md](references/ai-surfaces.md) |
| Build a data-table-heavy or maximally-austere "IBM/enterprise" variant, or use flat layering instead of shadows | [carbon.md](references/carbon.md) |
| Build an observability/monitoring dashboard (panel grid, time-range, thresholds, alert states) — Grafana-style | [observability-surfaces.md](references/observability-surfaces.md) |
| Build a maximal-density "terminal mode" surface (monospace, box-drawing, block/braille meters, keybind bar) — btop-style | [terminal-mode.md](references/terminal-mode.md) |
| Design the keyboard-first interaction layer (command palette, single-key grammar, optimistic UI, peek panel) — Linear-style | [linear.md](references/linear.md) |
| Build price/time-series charts or a trading-terminal layout (candlesticks, multi-pane, shared crosshair) — TradingView-style | [tradingview.md](references/tradingview.md) |
| Build a map/geospatial surface (layer panel, data-driven color scales, muted basemap, time playback) — Kepler.gl-style | [geospatial-surfaces.md](references/geospatial-surfaces.md) |
| Write UI copy (labels, errors, empty states) or check anti-patterns | [voice-and-anti-patterns.md](references/voice-and-anti-patterns.md) |

## Working pattern

When the user describes what they're building:

1. **Identify the surface.** Is it a generic dashboard, or a specific register (observability,
   terminal, charts, geospatial, AI, keyboard-first)? The latter has additional conventions in its
   deep-dive file.
2. **Anchor on the non-negotiables above.** They're 80% of the aesthetic.
3. **Read only the reference files relevant to the immediate task.** Quote the rules that bear on what
   you're building; don't dump the whole guide.
4. **Reach for mithril components, not hand-rolled markup.** The library covers buttons, inputs,
   tables, overlays, dates, etc. For *how* to compose them (and the gotchas the types don't reveal),
   switch to the [`mithril`](../mithril/SKILL.md) skill. This skill governs the *look*; that one
   governs the *wiring*.
5. **For any data-density question, default to "more compact than feels right."** Consumer-app
   instincts will mislead you here.
6. **Verify the way the repo verifies.** Eyeball new/divergent surfaces in the gallery in **both**
   themes **and at desktop + mobile widths** (~390 / 768 / 1440 — see [mobile.md](references/mobile.md));
   `pnpm build` + `pnpm test` stay green. Run the dev server with `pnpm dev` → :5173, or under
   [`tap`](https://www.npmjs.com/package/@cerebralutopia/tap) for queryable logs + restart-on-demand
   (`npm i -g @cerebralutopia/tap`; `tap run mithril pnpm dev`, then `tap observe mithril` /
   `tap restart mithril`).

## Durable gotcha

**Tailwind v4 tree-shakes unused `@theme` vars.** Reference tokens via *literal* utility classes
(`bg-blue-3`, `shadow-elevation-2`, `ease-mithril`, `rounded-mithril`), **not** runtime `var()` in inline styles
— those get dropped. Arbitrary-value classes that reference always-emitted `:root` vars are fine
(`bg-[var(--interactive-hover)]`). This is the #1 way a "correct" design renders wrong in mithril.
