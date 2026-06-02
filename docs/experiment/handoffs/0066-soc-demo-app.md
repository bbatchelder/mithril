# Handoff: SOC Mithril Console demo app

> Branch: `demo-apps` (cut from `public-readiness`) · Worktree: `../mithril-demo-apps`
> Goal of this stream of work: add **example demo applications** that show how the
> owned components compose into real product UIs — separate from the per-component showcase.

## TL;DR — current state

- A new top-level **Showcase / Demos** toggle lives in the left sidebar (`src/App.tsx`).
  "Showcase" is the existing per-component gallery (unchanged); "Demos" lists full example apps.
- One demo is built and committed: the **SOC (Security Operations Center) Mithril Console**
  ("Sentinel SOC") under `src/demos/soc/`.
- `pnpm build` is green (`tsc -b && vite build`, 0 type errors). No new dependencies.
  The shared component library (`src/components/ui/*`) is untouched.
- Committed on `demo-apps` as `Add SOC Mithril Console demo app behind a Showcase/Demos toggle`.

## How to run / view

```bash
pnpm install          # if node_modules is missing in this worktree
pnpm dev              # Vite preview (default :5173; was run on :5199 during dev)
```
- Switch to the demos with the sidebar **Demos** toggle, or deep-link directly:
  `http://localhost:<port>/#demo-soc` (cold-loads straight into the demo).
- `pnpm build` is the verification gate (no unit tests for the demo; visual/manual).

## What the SOC Console demonstrates

A realistic, information-dense security-operations UI exercising a wide slice of the library:

- **Navbar** — shield icon + "Sentinel SOC" + LIVE `Tag`, global search `InputGroup`,
  "New incident" `Button`, notifications `Tooltip`, and an identity `Popover`/`Menu`.
- **KPI row** — four `Card`s (Open alerts, Critical, Mean-time-to-ack, Analysts online) with
  trend tags (`StatBar.tsx`).
- **Filter bar** — status `SegmentedControl`, severity + assignee `Select`s, live result count.
  Filtering is wired to component state.
- **Alert queue** — `HTMLTable` (interactive + striped) of 12 mock alerts with severity/status
  `Tag`s, detector icons, assignee, age, and a per-row actions `Menu` in a `Popover`.
  Row click opens the drawer. Table fills the full content width.
- **Investigation drawer** (`AlertDetail.tsx`) — large right `Drawer` with severity/status tags,
  action `Button`s (Acknowledge / Escalate / Assign / Close incident), and `Tabs`:
  Overview (`EntityTitle` + MITRE/IOC field grid + a recommended-response `Callout`),
  Timeline, Indicators (IOC list w/ copy), Raw Event (`<pre>` JSON in a `Card`).
- **Interactivity** — acknowledge/close mutate alert status, assign changes assignee, all actions
  fire `toast`s. Empty filtered state renders `NonIdealState`.

## File map

| File | Purpose |
| --- | --- |
| `src/demos/registry.ts` | `DEMOS` list `[{ id, title, description, component }]` — add new demos here |
| `src/demos/soc/data.ts` | Types + 12 mock alerts, severity/status/detector/IOC maps. Age strings are hard-coded (no `Date.now()`) |
| `src/demos/soc/SocConsole.tsx` | Main demo: navbar, filters, table↔drawer wiring, mutations, toasts |
| `src/demos/soc/StatBar.tsx` | KPI cards |
| `src/demos/soc/AlertTable.tsx` | Alert queue table + per-row actions menu |
| `src/demos/soc/AlertDetail.tsx` | Investigation drawer (tabs, IOCs, raw event) |
| `src/lib/dark-context.ts` | Shared `DarkContext` + `useDark()` (extracted from `App.tsx`) so demos + portaled components share the dark flag |
| `src/App.tsx` | `view` state + Showcase/Demos toggle, `DemosView`, hash deep-link init |

## Integration details / gotchas (real component APIs)

- **Theming:** the app root toggles a `.dark` class; demos inherit it. Portaling components
  (`Popover`, `Tooltip`, `Drawer`, `Select`, `Toaster`) render outside the `.dark` ancestor, so
  they each take a `dark` prop — thread `useDark()` through.
- **Toaster:** each demo subtree is wrapped in its own `<Toaster>` in `DemosView`; the showcase
  mounts its own separately, so there's no double-mount. Call `useToaster()` inside the subtree.
- **Drawer:** `open` / `onOpenChange` / `position` / `size` (`DrawerSize.LARGE`) / `closeButton` —
  NOT `isOpen`/`onClose`.
- **Tabs:** require `id` on `<Tabs>`; tab body goes in a `panel` prop on `<Tab>` (not children).
- **SegmentedControl:** `onValueChange` (not `onChange`); string values only.
- **Select:** needs an `itemRenderer` returning a `MenuItem`; uses `selectedItem`/`onItemSelect`.
- **Popover:** `side` + `align` (not `placement`).
- **Icons:** use the project's vendored `Icon` component (there is **no** `lucide-react` in this repo).
  Names live in `src/components/ui/icons/index.ts` (e.g. `log-out`, `notifications-updated`).
- **EntityTitle** `size` is `"text" | "h1".."h6"`.

## Verified this session

- `pnpm build` green; no dependency changes; `html-table.tsx` and other shared UI untouched.
- Browser-verified (light + dark): Showcase↔Demos toggle, SOC console render, row→drawer with all
  four tabs, full-width table, and `#demo-soc` cold-load deep-link.

## Next steps / ideas

- Add a second demo to round out coverage — candidates discussed: **Project Board** (kanban),
  **Settings page** (forms-heavy), **Analytics Dashboard** (read-heavy). Each is just a new file
  under `src/demos/<slug>/` + one entry in `registry.ts`.
- Optional polish: a short intro/landing card in the Demos view when no demo is selected; a
  "view source" link per demo.
- Consider a brief mention of the demos in the top-level `README.md` once there's more than one.

## Notes

- Tooling note for the next session: this session hit intermittent lag/garbling in tool-result
  delivery; building via a subagent and verifying through `pnpm build` + browser screenshots was
  the reliable path.
