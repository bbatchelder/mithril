# Linear — Deep Dive (the power-user interaction model)

Linear is the current benchmark for a **keyboard-first, near-zero-latency** operator experience. Its
contribution is mostly an **interaction model**, not a token set — so this deep dive operationalizes
mithril's principle 4 (*immediate feedback for power users*) with concrete patterns. Read it when
building anything list-and-detail, keyboard-driven, or command-palette-based.

> Linear is proprietary, so per the [inspirations.md](inspirations.md) posture this is **register +
> interaction**, not a derived token spec. The only widely-published token is the brand accent;
> app-internal values below are described qualitatively, observed not copied.

## 1. The interaction model (the core contribution)

The part to adopt wholesale.

- **Command palette (`Cmd/Ctrl+K`)** — the single place every action lives. Fuzzy-searchable,
  **context-aware** (shows actions for the current selection), and each row **displays its keyboard
  shortcut inline**. If an action exists, it's in the palette. The keystone; build it first.
- **Single-key actions on the focused object** — `C` create, `S` set status, `P` priority, `A`
  assignee, `L` label, `E` edit, `X` multi-select. No modifier when a row/object is focused.
- **`G`-prefixed navigation** — `G` then a letter jumps to a section. A learnable two-stroke "go to"
  grammar.
- **Selection grammar** — `↑/↓` or `J/K` move; `X` toggles select; `Shift+click`/`Shift+↓`
  range-selects; bulk actions apply to the selection.
- **Optimistic UI / instant transitions** — actions apply **immediately** with no spinner; sync
  reconciles in the background. Navigation is instant. Perceived latency ≈ 0 is a *defining* part of
  the feel.
- **Peek / side-panel detail** — selecting a row opens its detail in a right panel **without losing
  list context** (maps onto mithril's right-inspector pattern in
  [layout-and-shell.md](layout-and-shell.md) §1).
- **Inline editing + context menus everywhere** — right-click and in-place edit on virtually every
  field; the mouse path and the keyboard path both exist for every action.

**The rule that ties it together:** *every action is reachable without the mouse, and every menu item
shows its key.* That's mithril's stated contract — Linear is the proof of how far it goes.

## 2. The visual register (observe-only)

A quieter, calmer register than mithril's default operator surfaces:

- **Near-black, low-contrast layered grays** — a deep near-black canvas (~`#08090a`) with panels only a
  hair lighter; **text is mid-gray, not white**. The low contrast reads as calm and focused.
- **One restrained accent** — Linear's indigo, widely cited as **`#5e6ad2`**, used sparingly for
  selection/active/primary. Consistent with mithril's "1–3 small spots of color" rule.
- **Type** — Inter / Inter Display. mithril *avoids Inter for chrome* — borrow Linear's scale and
  restraint, render in mithril's system stack.
- **Hairline borders, small radii, very subtle + fast motion** — quick and understated; nothing
  bounces. Density is *comfortable-tight* — denser than consumer SaaS, looser than a mithril data table.

## 3. Agree vs. diverge

| Dimension | mithril | Linear | Verdict |
|---|---|---|---|
| Keyboard-first, shortcuts surfaced | core principle | taken to the limit | **Adopt wholesale** |
| One accent, used sparingly | yes (1–3 spots) | indigo `#5e6ad2` | **Agrees** |
| Command palette | implied | the keystone | **Adopt** |
| Contrast | higher (operator legibility) | low (calm/focus) | **Diverge** — keep mithril's for monitoring |
| Body font | system sans | Inter | **Diverge** — keep mithril's |
| Density | cockpit-dense | comfortable-tight | Borrow the calm only for *focus work* |

## 4. Applying in mithril

No palette starter (proprietary, observe-only) — the deliverable is an **interaction checklist**:

1. Ship a **`Cmd+K` command palette** with every action, context-aware, each shortcut shown inline.
2. Bind **single-key actions** on the focused object and a **`G`-prefixed** navigation grammar; show
   keys in tooltips and menus (already a mithril non-negotiable).
3. Make mutations **optimistic** — apply instantly, reconcile in the background; avoid spinners on
   common actions.
4. Use the **peek/inspector** pattern: row selection opens detail without losing the list.
5. Render all of it in **mithril's tokens** — the grays, the primary intent (`--color-primary`), the
   system font — not Linear's Inter/indigo.

Borrow the **low-contrast calm** only when the surface is focus work (an editor, a single-tasker). For
monitoring / high-stakes ops, keep mithril's higher contrast — legibility wins.

## 5. Accessibility & cautions

- Keyboard-first is an **a11y win only if focus management is correct** — every interactive element
  reachable by Tab, a **visible 2px `:focus-visible` ring** (mithril mandates this), correct roles, and
  the palette announced to screen readers.
- **Discoverability**: a deep shortcut grammar needs the command palette + visible hints, or new users
  are lost. Don't hide actions behind keys with no on-screen affordance.
- Low contrast is a **deliberate trade for calm** — don't carry it into surfaces where misreading a
  value has consequences.

## Sources

- [Linear — Brand](https://linear.app/brand) — brand accent / identity
- [Linear — Docs](https://linear.app/docs) — the shortcut grammar
- [How we redesigned the Linear UI](https://linear.app/now/how-we-redesigned-the-linear-ui) — first-party rationale
- [How to build a remarkable command palette — Superhuman](https://blog.superhuman.com/how-to-build-a-remarkable-command-palette/)
