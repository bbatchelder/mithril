# Mobile & responsive adaptation

mithril descends from desktop-only operator systems (Bloomberg, Grafana, btop), but genuine
**mobile-friendliness is a deliberate mithril addition**, not an afterthought. The rule that makes it
work: the dense register **reflows; it is not thrown away.** Chrome (rail, toolbars) collapses into
summonable surfaces and the *data stays dense* — 2-up tiles and stacked cards, never consumer-app
whitespace. *"Default to more compact than feels right"* (the core density rule) still holds at 390px.

## Where breakpoints live

mithril ships **no grid system and no breakpoints baked into component chrome** (see
[visual-foundations.md](visual-foundations.md)) — components stay breakpoint-agnostic. Responsive
decisions live in **app composition**: the page chooses where to reflow with Tailwind's `sm`/`md`/`lg`
utilities. `md` (768px) is the usual desktop↔mobile seam; `lg` (1024px) restores the densest
multi-column layouts.

## Shell reflow (desktop-dense → mobile)

Each of the five shell elements (see [layout-and-shell.md](layout-and-shell.md) §1) has a canonical
mobile form:

- **Left rail → hamburger drawer.** Hide the rail below `md`; move its nav into a left `Drawer` opened
  by a hamburger in the top bar. The drawer **stays dark regardless of the app's light/dark mode** —
  this is the layout-and-shell §1 portal rule inverted: you *force* the portaled drawer dark rather
  than letting it inherit light. Selecting a destination closes the drawer.
- **Pinned inspector → full-screen.** The master-detail right inspector (~320–400px pinned on desktop)
  becomes full-width on mobile: when a row is selected, **hide the master list** and let the detail
  fill the viewport (it owns its own header + close). Don't shrink both to fit — that squeezes the
  list into an unusable sliver.
- **App top bar → condense + secondary toolbar.** Keep the hamburger, a **truncating** title (never
  let it wrap), and the account/profile + theme controls in the bar. Relocate search and primary
  actions (`+ New …`, command palette) into a **secondary toolbar strip** directly below the bar; drop
  non-essential adornments (a `LIVE` status pill) at the smallest widths. Hide that strip while the
  full-screen inspector is open. A search input duplicated across the bar and the strip should share
  state but focus **whichever is visible** (the hidden one's `offsetParent` is `null`).
- **Dense table → stacked cards.** A wide operator table (many columns, a min-width that forces
  horizontal scroll) becomes a **list of cards** below `md`. Group the same fields per card: an
  identity row (severity/status tags + overflow kebab), title + subtitle, then a metadata row
  (id · asset · assignee · age). Prefer cards over horizontal scroll or column-hiding — triage needs
  every field glanceable.
- **KPI / stat row → fewer columns, stack internals.** A 4-up tile row goes **2-up on mobile (not
  1-up — two fit and read denser)**, 4-up at `lg`. Inside a narrowed tile, stack the value above its
  inline sparkline so the number never wraps; restore value-beside-spark at `sm+`.

## Touch & input

- **Coarse pointers need bigger hit areas.** The dense desktop defaults (30px control row, 24–30px
  table rows) assume a mouse. On touch, *keep the visual density but enlarge the tappable area* — give
  rows/cards a comfortable tap height (~44px) and pad icon-only buttons.
- **Don't strand essentials in hover-only affordances.** Tooltips have no touch equivalent, so a
  keyboard-shortcut hint in a tooltip is a fine *enhancement* but never the only home for essential
  info; kebab/overflow menus must be tappable, not hover-reveal.
- **Overlays.** A right `Drawer`/side popover on desktop can become a **bottom sheet** on mobile;
  full-screen is the right move for the primary detail view (see the inspector reflow above).

## Verifying responsive work

Check new/divergent surfaces at **three widths — ~390 (phone), 768 (`md` seam), 1440 (desktop)** — in
**both light and dark**. Run the dev server however you like: `pnpm dev` → :5173, or under
[`tap`](https://www.npmjs.com/package/@cerebralutopia/tap) — a process supervisor with queryable logs
that's handy for agent-driven sessions (`npm i -g @cerebralutopia/tap`, then `tap run mithril pnpm dev`
to start it, `tap observe mithril` to read/search logs, `tap restart mithril` to bounce it).
