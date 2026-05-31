# Handoff: Project Board (kanban) demo app

> Branch: `demo-apps` · Worktree: `../analyst-ui-demo-apps`
> Continues the **example demo applications** stream started in `0066-soc-demo-app.md`.

## TL;DR — current state

- Second demo built and committed: the **Project Board** ("Orbit Board") kanban demo under
  `src/demos/board/`. Registered in `src/demos/registry.ts` as `id: "board"`.
- There are now **two demos** (SOC Console + Project Board) behind the sidebar **Demos** toggle.
- `pnpm build` is green (`tsc -b && vite build`, 0 type errors). **No new dependencies.**
  The shared component library (`src/components/ui/*`) is untouched.
- README now has an **Example apps** section listing both demos (the `0066` handoff asked for this
  once there was more than one).

## How to run / view

```bash
pnpm install          # if node_modules is missing in this worktree
pnpm dev              # Vite preview (default :5173; ran on :5175 this session — ports 5173/5174 were busy)
```
- Sidebar **Demos** toggle → **Project Board**, or deep-link: `http://localhost:<port>/#demo-board`.
- `pnpm build` is the verification gate (no unit tests for demos; verification is visual/manual).

## What the Project Board demonstrates

A realistic kanban product UI that exercises a large, previously-uncovered slice of the library
(especially **form controls**, which the SOC demo barely touched):

- **Navbar** — grid icon + "Orbit Board" + "Sprint 24" `Tag`, global search `InputGroup`,
  "New task" `Button`, an overlapping team `Avatar` stack (`Tooltip`), and an identity `Popover`/`Menu`.
- **Toolbar** — assignee `Select`, labels `MultiSelect` (removable chips), an **"Only my tasks"**
  `Switch`, a clear-filters `Button` (with active-filter count), and a **sprint** `ProgressBar`
  (done points / total). All filtering is wired to state.
- **Board** — four columns (Backlog / In Progress / In Review / Done) as **native HTML5 drag-and-drop**
  targets. Cards are `draggable`; dropping moves the task and fires a `toast`. Each column has a colored
  dot, a count chip, a "+" to create a task in that column, and a `NonIdealState`-style empty message.
- **Task card** (`Card` interactive + compact) — left priority accent bar, ticket id, title, label
  `Tag`s, a subtask `ProgressBar` with `n/m`, a footer (priority glyph w/ `Tooltip`, due date, comment
  count, story points), an assignee `Avatar`, and a per-card actions `Menu` in a `Popover`
  (Open / Move to → / Delete). Row click opens the detail drawer.
- **New task dialog** (`Dialog`) — forms-heavy: `FormGroup` + `InputGroup`, `TextArea`, two
  `SegmentedControl`s (Status, Priority), assignee `Select`, **`NumericInput`** (story points),
  labels `MultiSelect`, and an "Assign to me" `Switch`. Create is disabled until a title is entered.
- **Task detail drawer** (`Drawer`, right) — `Tabs`: **Details** (inline-editable `EditableText`
  description; assignee/status `Select`s; priority `SegmentedControl`; labels `MultiSelect`; a
  `Checkbox` checklist with a `ProgressBar` and an add-item `InputGroup`) and **Activity** (comment
  list with avatars + a `TextArea` to post). The title is an inline `EditableText`.
- **Interactivity** — every mutation (move / patch / toggle subtask / add subtask / comment / create /
  delete) updates state and most fire a `toast`.

## File map

| File | Purpose |
| --- | --- |
| `src/demos/board/data.ts` | Types + 10 mock tasks; column/priority/label maps; members; helpers. All dates hard-coded (deterministic) |
| `src/demos/board/Avatar.tsx` | Small circular initials avatar (member color via inline style; dashed placeholder when unassigned) |
| `src/demos/board/TaskCard.tsx` | Draggable task card + per-card actions menu |
| `src/demos/board/BoardColumn.tsx` | A column: header + drop zone (dragover highlight) + cards + empty state |
| `src/demos/board/NewTaskDialog.tsx` | Create-task `Dialog` (the forms-heavy surface) |
| `src/demos/board/TaskDetail.tsx` | Detail `Drawer` with Details/Activity tabs |
| `src/demos/board/ProjectBoard.tsx` | Main demo: navbar, toolbar/filters, columns + DnD, state + mutations, toasts |
| `src/demos/registry.ts` | Added the `board` entry |
| `README.md` | New "Example apps" section |

## Integration details / gotchas (real component APIs)

- **Theming:** same pattern as SOC — the app root toggles `.dark`; portaling components (`Popover`,
  `Tooltip`, `Drawer`, `Dialog`, `Select`, `MultiSelect`, `Toaster`) render outside the `.dark` ancestor,
  so each takes a `dark` prop — thread `useDark()` through. Verified in both themes.
- **Drawer autofocus → EditableText edit-mode trap:** Radix focus-traps the Drawer and focuses the
  *first tabbable* descendant. With an `EditableText` title first in the DOM, the drawer opened straight
  into title-edit mode (tiny scrolled input). Fix: render the action buttons **first in the DOM** (Close
  button first of all) and use `order-*` to restore the visual layout, so Close receives initial focus and
  the title stays passive until clicked. The `Drawer` does **not** expose `onOpenAutoFocus`. See
  `TaskDetail.tsx` header.
- **Native HTML5 DnD is not automatable** via synthetic mouse events (browser tooling's `left_click_drag`
  doesn't fire `dragstart`/`drop`). It works for real users; the **per-card "Move to" menu** is the
  reliable, testable equivalent and was used to verify the move path.
- **No `border-intent-*` utilities** — only `text-intent-{primary,success,warning,danger}-text` exist as
  token utilities. For the drop-zone highlight use a palette class (`border-blue-3`).
- **No `alignText` prop on `Button`** — it always `justify-center`s; override with
  `className="justify-between"` for a fill select-trigger and a `grow text-left` label span.
- **`Tag` minimal intents** are reused for labels (only none/primary/success/warning/danger exist), with a
  distinguishing `icon` per label for variety.
- Component API reminders that held: `Select` needs `itemRenderer` returning a `MenuItem` +
  `selectedItem`/`onItemSelect`; `MultiSelect` renders its own TagInput-style trigger (no children) and
  takes `tagRenderer`/`tagProps`/`onRemove`; `SegmentedControl` is `onValueChange` (string values);
  `Dialog`/`Drawer` are `open`/`onOpenChange`; `Switch`/`Checkbox` use native `onChange`
  (`e.target.checked`); `NumericInput` is `onValueChange(num, str)`.

## Verified this session

- `pnpm build` green; no dependency changes; shared UI untouched.
- Browser-verified (light + dark): board render; detail drawer with both tabs and **populated +
  empty** states (checklist `0/0`, "No checklist items yet"); New-task dialog with all form controls in
  **dark mode** (NumericInput steppers, both segmented controls, select, multiselect, switch); per-card
  actions `Popover`/`Menu`; `#demo-board` deep-link.
- Not automatable, so eyeballed-only / trusted-by-construction: native drag-and-drop between columns
  (standard `draggable` + `onDragOver` preventDefault + `onDrop`), and move/create/delete toasts.

## Next steps / ideas

- Third demo to round out coverage — the still-uncovered components lean **read-heavy/structural**:
  `Tree`, `Breadcrumbs`, `Section`, `Collapse`, `Skeleton`, `CardList`, `PanelStack`, plus the
  date/time family (`DatePicker`, `DateInput`, `TimezoneSelect`). An **Analytics Dashboard** or a
  **Settings page** would absorb most of these.
- Optional polish: a landing card in the Demos view when no demo is selected; a "view source" link per
  demo; persist DnD order within a column (currently move only changes the column, not intra-column order).
