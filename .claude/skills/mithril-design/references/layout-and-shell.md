# Layout and Shell

How to compose a whole page in mithril's operator aesthetic — the default app shell, panel anatomy,
object/detail views, and the recurring application-level surface patterns (home screens, master-detail
managers, node-graph editors, catalog tables).

## 1. The default app shell

```
┌──────┬──────────────────────────────────────────────────────┐
│      │ App top bar (per-app): icon · name · search · CTAs   │
│      ├──────────────────────────────────────────────────────┤
│ Left │                                                      │
│ rail │  Workspace / Page content                            │
│ nav  │                                                      │
│      │  ┌─Panel─────┐  ┌─Panel──────────────┐               │
│ ~230 │  │           │  │                    │               │
│ DARK │  │           │  │                    │               │
│      │  └───────────┘  └────────────────────┘               │
│      │                                                      │
└──────┴──────────────────────────────────────────────────────┘
```

A common shell **mixes a dark rail with a light main area**:

- **Left rail navigation** (often dark): ~**230px** expanded, ~**48px** collapsed to icon-only.
  Background `bg-surface` (dark `#252a31`), foreground `text-foreground`. Top: global entries (Home,
  Search, Notifications, Recent, etc.); an uppercase section header (~11px muted, letter-spaced); a
  list of apps/views; bottom-pinned utilities (AI assist, Support, Account). Rows ~32px tall, `0 17px`
  padding, icon-left + label + optional shortcut chip. Hover = subtle white overlay; active = a lighter
  background fill (no colored left-edge stripe — selection is the fill).
- **App top bar** (per-app, not global): app icon + name (left), optional central search, an
  environment/status indicator, app-specific CTAs (often a green `+ New …`), and a Help button. There
  is no enterprise-wide fixed nav bar; the left rail is the universal element. (mithril apps carry
  their own chrome via `<AppChromeControls>` from `src/lib/app-chrome.tsx`.)
- **AI side panel** (when summoned, often dark): ~450px wide, distinct from the surrounding shell,
  follows the user across views. See [ai-surfaces.md](ai-surfaces.md).
- **Workspace / main content**: light by default (`bg-background`). Tiled panels with draggable
  splitters; each panel has a 28–32px header with title, action icons, and an overflow kebab.
- **Right inspector / details panel** (optional): 320–400px wide, often pinned, for object properties,
  run/eval traces, or contextual editing.
- **Status footer** (optional): 24px, monospace, for environment / build / RID info.

**The light/dark composition rule (mithril):** dark mode is class-based — a `.dark` or
`[data-mode="dark"]` ancestor swaps the semantic surface tokens for everything nested under it. Wrap a
*region* (the rail, the AI panel) to make it dark while the main stays light. The critical gotcha:
**any overlay that portals to `document.body`** (Popover, Tooltip, Menu, Dialog, Drawer, Select-family,
Toast) renders *outside* that ancestor, so you **must pass `dark={dark}`** (from `useDark()`) or the
portaled panel renders light-on-dark. This is the #1 shell mistake — see the
[`mithril`](../../mithril/SKILL.md) skill, overlays recipe.

**Building the always-dark rail (greenfield recipe).** Wrap the rail region in `.dark`, and write *one*
`RailNav` you can reuse in both the static rail and the mobile drawer ([mobile.md](mobile.md)). On an
always-dark rail, hover/active use **white-alpha overlays** — *not* the semantic `interactive-*` tokens,
which assume the surrounding mode and wash out on the forced-dark surface:

```tsx
// Static rail — `.dark` flips the tokens; hidden below the seam (drawer takes over).
function AppRail(props: RailNavProps) {
  return (
    <div className="dark hidden w-[230px] shrink-0 border-r border-border-strong md:block">
      <RailNav {...props} />
    </div>
  );
}

// Rail row — white-alpha hover/active on the forced-dark surface, ~32px tall.
<button className={
  "flex h-8 w-full items-center gap-2.5 rounded-mithril px-3 text-left text-body-sm transition-colors " +
  (active ? "bg-white/10 font-medium text-foreground"
          : "text-foreground-muted hover:bg-white/[0.06] hover:text-foreground")
}>
  <Icon icon={item.icon} size={16} className="shrink-0 !text-current" />
  <span className="min-w-0 grow truncate">{item.label}</span>
  {item.count != null && <span className="shrink-0 tabular-nums text-body-sm text-foreground-muted">{item.count}</span>}
</button>
```

## 2. Panel anatomy

```
┌─[ Title ──────── icon icon icon ⋮ ]─┐
│                                     │
│  Content                            │
│                                     │
└─────────────────────────────────────┘
```

- Header: 1px bottom border (`border-border`), title left, action buttons right, kebab for overflow.
- Background: one step up from the page (`bg-surface` over `bg-background`; `bg-elevated` when raised).
- Resizable via splitters between adjacent panels. Bordered, flat — no float shadow on inline panels.

## 3. Object / detail views

A central pattern: an entity renders as a multi-tab page with a fixed header (name, type badge, key
properties), a tab bar (Overview · Activity · Linked · History · …), and tabbed content panels below.
Mirror this for any detail view. **Prominent properties get type-aware treatment** at the top — media
in a viewer, time-series as inline charts, geospatial as an inline map, the rest in a table below.
Selecting a related row can open a side-panel preview without leaving the page (the peek pattern; see
[linear.md](linear.md) §1).

## 4. Application-level surface patterns

The recurring scaffolds for whole app surfaces, distilled to vendor-neutral patterns.

### 4.1 App home / splash

Light main; per-app top bar; a hero block (headline + sub-tagline); a row of large template/quickstart
cards; a pill-tabbed list (Recents / Favorites / All) with an empty-state illustration; optionally a
bottom "reference examples" grid of screenshot thumbnails. **Centering a hero is allowed on a
splash/home — never on an operational surface**, which tiles edge-to-edge.

### 4.2 Master-detail resource manager

For "manage N things of a type":

- **Secondary left rail** (~190–230px, can be light even when the global rail is dark) sitting between
  the global rail and content, with a **resource count `[N]` on every item** so the user has a constant
  inventory.
- **Card-grid + empty-slot "+ Create new …" card** — the create affordance is a card *inside* the grid,
  same shape as real entries, centered `+` icon and label.
- **Drawer-style detail editors** with horizontal tabs — edit a child resource without leaving the
  parent's context.
- **Status-pill cluster as a side card** to the metadata card (Status / Visibility / ID / RID / …).
- **Type-icon vocabulary** the user learns once and reuses — e.g. `99` string, `1.3` numeric,
  calendar date, checkbox boolean — used consistently in pickers, cells, and editor headers.

### 4.3 Catalog table

A table-of-types/datasets entry point: compact rows (~28px), monospace IDs, columns like
`NAME | STATUS | COUNT | USAGE | TAGS | DESCRIPTION`; the count cell can embed an inline mini bar-chart
strip next to the number. Right of the header: a relevancy/sort dropdown + filter pills
(All / Mine / Shared / Favorites). Each row carries a colored object-type icon (the one sanctioned use
of extended colors in chrome).

### 4.4 Node-graph / canvas editor

A directed-graph or canvas builder (pipelines, flows, ontology link maps):

- **Left palette** of node types / inputs; **center canvas** with draggable node cards; **right config
  pane** that appears when a node is selected.
- Node cards are rectangular, bordered, with **input ports** (one side) and **output ports** (other) —
  give the two port kinds a consistent visual distinction. Structural nodes (Join, Union, Split) get
  unique icons and dedicated config panes.
- Organize complexity with **color groups, text/annotation nodes, checkpoints, find-and-replace, and
  show/hide controls**. Run/preview affordances live **on-node** (Preview / Deliver) so authors can
  sample intermediate state without committing.
- Small **inline mini-graphs** (zoomable node-edge diagrams) can be embedded as a *section* of a detail
  page rather than a full screen.

### 4.5 Tab strip in the work area

Thin chrome-like tabs at the top of the main content (each: icon + name + ×) with a trailing `+` to add
another — distinct from in-page pill tabs (Recents / Favorites / All). Use for multi-document /
multi-exploration work areas.

### 4.6 Cross-surface conventions

- **Banners**: a thin strip across the top of an app (lightbulb/info icon + message + right-aligned
  action with an `↗` external indicator). Don't let it compete with the page CTA cluster.
- **Persistent bottom toolbar** on detail pages for escape hatches (console, preview mode) — kept
  visually distinct from the page-level primary CTA.
- **Loading state**: gray rounded rectangles (`~light-gray-2`) shaped like the content to arrive, slow
  shimmer.
- **Inline migration / outdated-config callouts** with a right-aligned upgrade CTA — surface upgrade
  paths without a modal interruption.

## 5. Responsive adaptation (dense desktop → mobile)

Each of the five shell elements above has a canonical mobile form — rail → hamburger drawer, pinned
inspector → full-screen, top bar → condense + secondary toolbar, dense table → stacked cards, KPI row
→ 2-up. The density **reflows; it is not thrown away.** Full guidance (plus touch targets and where
breakpoints live) is in [mobile.md](mobile.md).
