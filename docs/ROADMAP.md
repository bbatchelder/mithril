# Component roadmap

> **The build order is fixed.** Each session, find the first unchecked component below and build it.
> No need to ask "what's next" — this list *is* the answer. Scope = the full Blueprint surface across
> all three packages (`core`, `select`, `datetime`), ~54 fidelity targets.

## The loop (autonomous — see CLAUDE.md "The development loop")

**Branch per phase** (`phase-N-<slug>` off fresh `main`). For each unchecked item, in order:

1. **Build** the component in `src/components/ui/<name>.tsx` with CVA (+ Radix where a primitive fits).
   Match Blueprint v6.15 visuals; design a clean modern API (not drop-in compatible). Auto-install any
   needed deps.
2. **Register in BOTH galleries** — add to the `COMPONENTS` array in `src/App.tsx` *and*
   `tools/blueprint-reference/src/App.tsx` under the **same `id`**, and tag key specimens with matching
   `data-compare` keys.
3. **Verify** — `pnpm build` green, then `tools/compare.sh <id> both` → confirm light + dark
   (computed-style diff + screenshots). Aim for exact; accept + document small sub-perceptual deltas.
4. **Check the box** here, **write the next numbered handoff** in `docs/handoffs/`, then **one commit + push.**

**When a phase's last box is checked** → open a PR → merge to `main` (merge commit) → sync `main`, delete the
phase branch → cut the next phase branch → keep going. **Pause only on hard blockers** (build can't go green,
harness can't reach it after real effort, or a dependency component fails).

Ordering is **dependency-first**: a component is only listed after everything it builds on. Entries marked
*(infra)* are behavioral helpers, not standalone fidelity targets — build them inline when the first
consumer needs them.

Blueprint source (design spec, v6.15): `/Users/bbatchelder/Code/blueprint`
- core: `packages/core/src/components/`
- select: `packages/select/src/components/`
- datetime: `packages/datetime/src/components/`

---

## Phase 0 — Foundation (done)

- [x] Design tokens (`src/styles/tokens.css`)
- [x] Comparison harness (`tools/compare.sh`)
- [x] **Button** — `button/`
- [x] **Card** — `card/`

## Phase 1 — Primitives & simple display

- [x] **Icon** — `icon/`. Foundational: SVG set + size/intent coloring. Many components accept icons as
      `ReactNode`, so not a hard build-blocker, but most look incomplete without it.
- [x] **Text** — `text/`
- [x] **Divider** — `divider/`
- [x] **Spinner** — `spinner/`
- [x] **ProgressBar** — `progress-bar/`
- [x] **Skeleton** — `skeleton/` (loading-state modifier)
- [ ] **Tag** — `tag/`
- [ ] **Callout** — `callout/` (uses Icon)

## Phase 2 — Form controls

- [ ] **InputGroup** (text input) — `forms/inputGroup.tsx`. `--input-shadow` already tokenized. Intent
      validation states, sizes matching button heights (24/30/40), measured focus ring. First form control.
- [ ] **TextArea** — `forms/textArea.tsx`
- [ ] **Checkbox** — `forms/controls.tsx`
- [ ] **Radio / RadioGroup** — `forms/controls.tsx`, `forms/radioGroup.tsx`
- [ ] **Switch** — `forms/controls.tsx`
- [ ] **Label + FormGroup** — `forms/label.tsx`, `forms/formGroup.tsx`
- [ ] **ControlGroup** — `forms/controlGroup.tsx`
- [ ] **HTMLSelect** — `html-select/`
- [ ] **FileInput** — `forms/fileInput.tsx`
- [ ] **NumericInput** — `forms/numericInput.tsx` (Input + Buttons)
- [ ] **SegmentedControl** — `segmented-control/`
- [ ] **ControlCard** — `control-card/` (Card + controls)

## Phase 3 — Overlays & positioning

- [ ] **Dialog** — `dialog/` (+ Portal/Overlay *(infra)*). First Radix-portal component — work out how the
      harness reaches portaled content; `@radix-ui/react-dialog`.
- [ ] **Alert** — `alert/` (Dialog-based)
- [ ] **Drawer** — `drawer/` (Overlay-based)
- [ ] **Popover** — `popover/` (positioning primitive; Radix Popover / Floating UI). Unlocks Tooltip,
      Menu dropdowns, Select family, DateInput, ContextMenu, Breadcrumbs overflow.
- [ ] **Tooltip** — `tooltip/` (Popover-based)
- [ ] **Toast / Toaster** — `toast/`
- [ ] **Menu** (+ MenuItem, MenuDivider) — `menu/`
- [ ] **ContextMenu** — `context-menu/` (Popover + Menu)

## Phase 4 — Navigation & structure

- [ ] **Navbar** — `navbar/`
- [ ] **Tabs** — `tabs/`
- [ ] **Collapse** — `collapse/`
- [ ] **Section** — `section/` (Card-based)
- [ ] **CardList** — `card-list/` (Card-based)
- [ ] **Breadcrumbs** — `breadcrumbs/` (+ OverflowList *(infra)*, Menu, Popover)
- [ ] **Tree** — `tree/` (Icon + Collapse)
- [ ] **PanelStack** — `panel-stack/`
- [ ] **HTMLTable** — `html-table/`
- [ ] **EditableText** — `editable-text/`
- [ ] **EntityTitle** — `entity-title/`
- [ ] **NonIdealState** — `non-ideal-state/` (Icon)
- [ ] **Link** — `link/`
- [ ] **Slider** — `slider/`
- [ ] **Hotkeys** — `hotkeys/` (Dialog-based)

## Phase 5 — Composite selects (`@blueprintjs/select`)

- [ ] **TagInput** — `tag-input/` (Tag + input handling) + QueryList *(infra)*
- [ ] **Select** — `select/select/` (Popover + Menu + input)
- [ ] **Suggest** — `select/suggest/`
- [ ] **MultiSelect** — `select/multi-select/` (TagInput-based)
- [ ] **Omnibar** — `select/omnibar/`

## Phase 6 — Date & time (`@blueprintjs/datetime`)

- [ ] **TimePicker** — `datetime/time-picker/`
- [ ] **DatePicker** — `datetime/date-picker/` (react-day-picker)
- [ ] **DateInput** — `datetime/date-input/` (DatePicker + Popover + Input)
- [ ] **DateRangePicker** — `datetime/date-range-picker/`
- [ ] **DateRangeInput** — `datetime/date-range-input/`
- [ ] **TimezoneSelect** — `datetime/timezone-select/` (Select-based)
