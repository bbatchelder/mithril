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

**Pick the seam by how many fixed rails flank the content.** A single rail + fluid content reflows
cleanly at `md`. But a **shell with two fixed rails around a canvas** (a map, a node editor, a board)
has no room to spare at 768 — both rails crush the canvas *and* the toolbar overflows — so make `lg`
the seam for the whole shell: below it use the compact treatment, at `lg+` restore the three columns.
Then **stagger the navbar's own density**: defer the heaviest inline controls (wide labeled switches, the
search field) to `xl` and fold them into a compact "view options" popover in the `lg`–`xl` band, so the
freshly-restored three-column navbar doesn't immediately overflow at exactly 1024.

## Shell reflow (desktop-dense → mobile)

Each of the five shell elements (see [layout-and-shell.md](layout-and-shell.md) §1) has a canonical
mobile form:

- **Left rail → hamburger drawer.** Hide the rail below the seam; move its nav into a left `Drawer`
  opened by a hamburger in the top bar. A **nav-chrome** rail's drawer **stays dark regardless of the
  app's light/dark mode** — the layout-and-shell §1 portal rule inverted: you *force* the portaled
  drawer dark rather than letting it inherit light. Selecting a destination closes the drawer.
  **But only force-dark a nav-chrome rail.** If the left rail is a **data roster / master list** (a light
  `bg-surface` panel, not dark nav), its drawer should **inherit the app theme (`dark={dark}`)** instead
  — forcing it dark would misrepresent a light data surface as chrome.
- **Pinned inspector → full-screen.** The master-detail right inspector (~320–400px pinned on desktop)
  becomes full-width on mobile: when a row is selected, **hide the master list** and let the detail
  fill the viewport (it owns its own header + close). Don't shrink both to fit — that squeezes the
  list into an unusable sliver. **When the "master" is a live canvas (a map), don't take over the
  screen** — float the inspector as a **non-modal bottom sheet** anchored to the canvas's own `relative`
  container (`absolute inset-x-0 bottom-0`, hidden at `lg+`), *not* a modal `Drawer` with a scrim, so the
  canvas stays visible and interactive above it. A fixed-width desktop drawer reused on mobile should
  size **`min(<width>px, 100vw)`** so it goes full-width on a phone instead of overflowing.
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

## Collapsible chrome & canvas-first defaults

The reflow rules above aren't only about *small* screens. On a canvas-led surface (map, editor, board),
let the **canvas lead at every width** — make the chrome summonable on the desktop too:

- **Make the rails collapsible on desktop, not just below the seam.** One always-visible toggle can serve
  both jobs: collapse the *inline* rail on `lg+`, or open the *overlay* drawer below `lg`. Resolve which
  at click time with `window.matchMedia("(min-width: 1024px)").matches` — no resize listener, and it
  sidesteps the fact that a portaled `Drawer` can't be hidden by a parent's `lg:` class.
- **Gate the inspector on selection.** Don't fill a pinned inspector with a low-value "nothing selected"
  roll-up — **mount it only when something is selected**, and give it a close button that *deselects*,
  handing the width back to the canvas.
- **Collapse secondary strips by default.** A log/event feed along the bottom should start collapsed — a
  tappable `Header (N)` bar that expands into a fixed-height scroll area — so a fresh load is mostly
  canvas, the same rule at desktop and phone widths.

## Touch & input

- **Coarse pointers need bigger hit areas.** The dense desktop defaults (30px control row, 24–30px
  table rows) assume a mouse. On touch, *keep the visual density but enlarge the tappable area* — give
  rows/cards a comfortable tap height (~44px) and pad icon-only buttons. Idiom: `min-h-11 lg:min-h-0` —
  ~44px below the seam, back to the dense default at `lg+`.
- **Don't strand essentials in hover-only affordances.** Tooltips have no touch equivalent, so a
  keyboard-shortcut hint in a tooltip is a fine *enhancement* but never the only home for essential
  info; kebab/overflow menus must be tappable, not hover-reveal.
- **Overlays.** A right `Drawer`/side popover on desktop can become a **bottom sheet** on mobile;
  full-screen is the right move for the primary detail view (see the inspector reflow above).

## Verifying responsive work

Check new/divergent surfaces at **~390 (phone), 768 (`md` seam), 1440 (desktop)** — in **both light and
dark**. For a shell that uses the `lg` seam (two rails around a canvas), **also check 1024 exactly** —
that's where a restored three-column navbar tends to over-pack before `xl` relieves it. Run the dev server however you like: `pnpm dev` → :5173, or under
[`tap`](https://www.npmjs.com/package/@cerebralutopia/tap) — a process supervisor with queryable logs
that's handy for agent-driven sessions (`npm i -g @cerebralutopia/tap`, then `tap run mithril pnpm dev`
to start it, `tap observe mithril` to read/search logs, `tap restart mithril` to bounce it).
