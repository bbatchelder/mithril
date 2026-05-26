# 0058 — Project complete 🎉

- **Date:** 2026-05-26
- **Status:** **The full analyst-ui roadmap is COMPLETE.** All 6 phases (54 components) built to Blueprint
  v6.15 fidelity, verified in both light and dark themes, and merged to `main`.

## What this is

analyst-ui — a from-scratch, pixel-faithful reimplementation of Palantir Blueprint v6.15's design
language with a fresh, modern API (React 19 · TypeScript · Vite · Tailwind v4 CSS-first `@theme` ·
Radix primitives · CVA; shadcn-style component ownership). Blueprint was the **design spec only** — not
a fork. Every component was verified against a live `@blueprintjs/core`/`select`/`datetime` v6.15 gallery
via the comparison harness (`tools/compare.sh <id> both`: screenshots + computed-style diff of paired
`data-compare` specimens), in both themes.

## Phases (all merged to `main`)

| Phase | Theme | PR | Components |
|---|---|---|---|
| 0 | Foundation | — | design tokens, comparison harness, **Button**, **Card** |
| 1 | Primitives & display | (early) | Icon, Text, Divider, Spinner, ProgressBar, Skeleton, Tag, Callout |
| 2 | Form controls | (early) | InputGroup, TextArea, Checkbox, Radio/RadioGroup, Switch, Label/FormGroup, ControlGroup, HTMLSelect, FileInput, NumericInput, SegmentedControl, ControlCard |
| 3 | Overlays & positioning | (early) | Dialog, Alert, Drawer, Popover, Tooltip, Toast/Toaster, Menu, ContextMenu |
| 4 | Navigation & structure | #6 | Navbar, Tabs, Collapse, Section, CardList, Breadcrumbs, Tree, PanelStack, HTMLTable, EditableText, EntityTitle, NonIdealState, Link, Slider, Hotkeys |
| 5 | Composite selects | #7 | TagInput, Select (+ `useQueryList`), Suggest, MultiSelect, Omnibar |
| 6 | Date & time | #8 | TimePicker, DatePicker, DateInput, DateRangePicker, DateRangeInput, TimezoneSelect |

Per-component handoffs: `docs/handoffs/0004`–`0057`.

## Dependencies added

- Analyst (`package.json`): `@radix-ui/react-{dialog,popover,tooltip,toast,context-menu,slider,slot}`,
  Floating UI (via Radix), `class-variance-authority`, `react-day-picker` (calendar engine), `clsx`/`tailwind-merge`.
- Reference gallery only (`tools/blueprint-reference/`): `@blueprintjs/core`, `@blueprintjs/select`,
  `@blueprintjs/datetime`, `react-transition-group` — used solely as the comparison spec.

## Durable patterns established

- **Tailwind v4 tree-shakes unused `@theme` vars** → reference tokens via *literal* utility classes
  (`bg-blue-3`, `shadow-card-3`, `ease-bp`), never runtime `var()` in inline styles. Runtime *layout*
  values (position %, computed width) may be inline.
- **Portal + dark-mode** (Dialog/Alert/Drawer/Popover/Tooltip/Toast/Menu/ContextMenu/overlays): wrap portal
  children in `<div className={dark?'dark':''}>`, every portaled surface sets `text-foreground`, the
  reference gallery passes `portalClassName={Classes.DARK}` in dark, and panels use `shadow-card-N`.
- **`matchTargetWidth`** on Popover (Radix `--radix-popover-trigger-width`) for Suggest/MultiSelect dropdowns.
- **`useQueryList<T>`** (in `select.tsx`) — the filtering/active-item/keyboard engine reused by
  Select/Suggest/MultiSelect/Omnibar/TimezoneSelect.
- **Compact react-day-picker calendars**: no `w-full` on the grid, `inline-block` root, 30px day cells.
- **Verification discipline**: a green "N match" is hollow if core sub-elements show `only in analyst`
  (unpaired) — internals are tagged on both sides and every component was eyeballed in both themes.

## Accepted sub-perceptual deltas (project-wide, documented)

- Dark none-intent `--foreground` `#f6f7f9` (rgb 246,247,249) vs Blueprint's pure white — an intentional
  design decision (kept analyst's slightly-softer dark text).
- Shadow/divider base color: pure black `rgb(0,0,0)` vs Blueprint's near-black `~rgb(17,20,24)/(20,20,20)`
  at low alpha — sub-perceptual.
- Dark default-button bg `rgb(47,52,60)` vs `rgb(48,55,64)` (≤4/channel).
- `minWidth: auto` vs `0px`; gap-vs-margin spacing (identical visual px); 1px line-height rounding;
  reference-gallery `fontSize 13.333` (Blueprint React-18 body) vs spec-correct `14px`.

## Verification status

- `pnpm build` green (tsc + vite) on `main`.
- Every component: `tools/compare.sh <id> both` clean modulo the accepted deltas above, screenshots reviewed.

## What's next (optional, beyond the roadmap)

- Registry packaging for shadcn-style distribution (consumers copy component source).
- Optional follow-ups noted in component handoffs: Breadcrumbs overflow-menu collapse, DatePicker/RangePicker
  `shortcuts` presets, Hotkeys modifier-key SVG glyphs (currently Unicode), tz list ordering parity.
