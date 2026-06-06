# Sentinel SOC — `mithril-design` review

A test-drive of the `mithril-design` skill applied to the Sentinel SOC demo
(`src/demos/soc/`: `SocConsole.tsx`, `AlertTable.tsx`, `AlertDetail.tsx`, `StatBar.tsx`).

> **Status: implemented.** This punch list has since been applied — flat KPI cards with sparklines,
> green create CTA, `border-border` tokens, dark left rail, edge-to-edge tighter layout, command
> palette + single-key grammar, and a pinned (dockable) inspector. The demo is also now responsive
> (rail → hamburger drawer, inspector → full-screen, table → stacked cards, KPI 2-up on mobile); the
> reusable patterns were folded back into the skill (`references/mobile.md`). The notes below are kept
> as the original review record.

## Already on-register

The demo is broadly correct and this is tuning, not a rebuild:

- Quiet gray chrome — `bg-background` / `text-foreground`, `Navbar` recedes, data carries the weight.
- Intent-typed tags (severity / status), `minimal` variants.
- Monospace for system identifiers — alert IDs, asset names, source IPs, timeline timestamps.
- `tabular-nums` on KPI values.
- `rounded-bp` radius throughout.
- Portaled overlays (Drawer, Menu, Select, Tooltip) correctly receive `dark={dark}` from `useDark()`.
- Compact striped, interactive table with muted semibold headers.

## 1. Clear non-negotiable deviations

### KPI cards use shadow elevation on inline content
`StatBar.tsx:28` uses `<Card elevation={1}>`. The skill: *"Subtle elevation IS allowed… but
reserved for overlays (dialog, popover, dropdown, drawer). Inline content stays flat."* KPI cards
are inline → make them flat bordered surfaces (`elevation={0}` + `border-border`), not floating cards.

### "New incident" is the wrong intent color
`SocConsole.tsx:222` uses `intent="primary"` (blue). The color grammar maps **create → success
(green)** (`+ New …`, `Create`), reserving **primary** for submit/confirm/save. The `+ New incident`
CTA should be green. (The final confirm button inside `NewIncidentDialog` being `primary` is correct.)

### Border token choice
The demo uses `border-divider` (31×) — a *theme-invariant* black/white-based token. The skill's
canonical chrome borders are `border-border` / `border-border-strong`, which are seed-derived and
**re-tint with the active theme**. Move panel/table borders to `border-border` (and
`border-border-strong` for the table header / distinct-section separators) so borders follow custom
themes.

## 2. Layout & density (the register itself)

### No left rail
Biggest architectural gap. The skill's default shell makes the *left rail nav (often dark, ~230px)
the universal element*; the SOC console is top-bar-only. An operator tool would have a dark left rail
switching between Queue / Incidents / Assets / Detections / Hunting, with counts on items. Single
change that most moves it toward "mission control."

### Operational surface is centered, not edge-to-edge
`SocConsole.tsx:269` wraps the body in `mx-auto max-w-[1400px]`. The skill: *"Centering a hero is
allowed on a splash/home — never on an operational surface, which tiles edge-to-edge."* The alert
queue should fill the viewport width.

### Spacing is consumer-app generous
`p-6` / `gap-6` (24px) throughout the body; `py-2.5` (10px) table rows. The skill's defaults are
8–12px padding, 30px/24px table rows, and *"default to more compact than feels right."* Tighten to
`p-3/p-4` + `gap-3/gap-4`, and bring table rows to ~30px (`py-1.5`). More alerts per screen.

## 3. Power-user affordances (currently absent)

Keyboard-first interaction is a core pillar (*"every action exposes its shortcut in its tooltip"*);
the console has essentially no keyboard layer.

- **Command palette** (⌘K) and **single-key grammar** in the queue: `j/k` move rows, `Enter` open,
  `a` acknowledge, `e` escalate, `c` new incident, `/` focus search.
- **Shortcuts in tooltips** — action buttons should show their binding; currently only the
  Notifications icon even has a tooltip.

## 4. Color budget & polish (optional)

- **KPI row spends a lot of color** — four intent-tinted icons + four colored trend chips + the
  `LIVE` tag, on top of severity/status tags in the table. The skill wants *"1–3 small spots of color
  against an ocean of gray."* Consider muting the KPI icons to gray and letting only the trend chips
  (or just the danger one) carry color.
- **KPI sparklines** — the observability register often puts an inline trend sparkline on KPI tiles
  rather than just a delta chip.
- **Master-detail vs. modal drawer** — `AlertDetail` is a `DrawerSize.LARGE` overlay; the
  master-detail / "peek" pattern favors a *pinned* right inspector so you can scan the queue and read
  a row simultaneously. The drawer is fine; a dockable inspector is more on-register for triage.

## Highest leverage first

1. Add the dark left rail.
2. Go edge-to-edge + tighten spacing/row height.
3. Fix the two color rules (flat KPI cards, green "New incident").
