# Overlays — Popover, Menu, Tooltip, Dialog, Drawer, ContextMenu

The overlay family is the densest source of composition gotchas, because every overlay
**portals to `document.body`** (so dark mode must be threaded), and several are *composed*
from each other (Tooltip, Menu-dropdowns, and Select all build on Popover).

## The cardinal rule: thread `dark` through every portal

Portaled content renders outside the app's `.dark` ancestor `<div>`, so dark utilities won't
apply unless you pass the flag in. Read it from context and pass it:

```tsx
import { useDark } from "@/lib/dark-context";

const dark = useDark();
<Tooltip content="Notifications" dark={dark}> … </Tooltip>
<Popover dark={dark} content={…}> … </Popover>
<Drawer open={open} onOpenChange={setOpen} dark={dark}> … </Drawer>
```

Forget it and the panel renders light-on-dark (white menu on a dark app). Every overlay below
takes `dark`. This is the single most common overlay mistake.

## Menu inside a Popover → use `MenuPopover`

A `<Menu>` ships its own 4px inset. `Popover` defaults to `hasContentPadding={true}` (Blueprint's
20px text padding), so a menu in a bare Popover gets a fat ring of whitespace around it. **Use
`MenuPopover`** — it's `Popover` with `hasContentPadding` preset to `false`:

```tsx
import { MenuPopover } from "@/components/ui/popover";
import { Menu, MenuItem, MenuDivider } from "@/components/ui/menu";

// Dropdown action menu — the canonical recipe
<MenuPopover
  dark={dark}
  side="bottom"
  align="end"
  content={
    <Menu size="small">
      <MenuItem icon="endorsed" text="Acknowledge" onClick={ack} />
      <MenuItem icon="person" text="Assign to me" onClick={assign} />
      <MenuDivider />
      <MenuItem icon="cross" text="Close" intent="danger" onClick={close} />
    </Menu>
  }
>
  <Button variant="minimal" size="small" aria-label="Actions" icon={<Icon icon="more" />} />
</MenuPopover>
```

- The trigger goes in `children`; the menu goes in `content`.
- Give the trigger an **`aria-label`** when it's icon-only.
- **Selecting an item closes the menu.** `MenuPopover` drives its own open state and closes on a
  bubble-phase click of an enabled `role="menuitem"` — *after* the item's `onClick` runs, so the
  action still fires. (A bare `<Popover>` does **not** auto-close; that's why menus use
  `MenuPopover`.) Pass `open`/`onOpenChange` if you need to control it yourself.
- **Item clicks don't leak.** The menu portals to `<body>`, but React events still bubble through
  the React *tree* to whatever rendered the trigger. `MenuPopover` `stopPropagation()`s item
  clicks, so a menu inside a clickable row won't also fire the row's `onClick`. You still want
  `onClick={(e) => e.stopPropagation()}` on the **trigger** itself, so *opening* the menu (clicking
  the trigger) doesn't fire the row click either.
- A bare `<Popover>` is still correct for *prose/custom* content — keep its padding there.

## Menu sizing cascades

`<Menu size="small">` now cascades to every `MenuItem` child (small = ~24px rows; medium = ~30px;
large). Set it once on the `Menu`. A `MenuItem`'s own `size`/`small`/`large` still overrides per
item. Use `size="small"` for dense contexts like table row actions.

## Focus-driven popovers: `anchorOnly`

Default Popover opens on **click** (Radix toggles on trigger click). If *you* drive `open`
yourself — e.g. focusing an input opens the panel — the trailing click bubbles to the trigger and
Radix toggles it right back shut. Render the child as an **anchor**, not a trigger:

```tsx
<Popover open={open} onOpenChange={setOpen} anchorOnly dark={dark} content={…}>
  <InputGroup onFocus={() => setOpen(true)} />
</Popover>
```

`anchorOnly` provides positioning only (no click-toggle); Escape and outside-click still close.
This is how the date-range inputs stay open. For multi-element triggers where a focus-open is
toggled shut by a trailing click, this is the fix.

## Tooltip

Composed on Popover. `content` + `dark`. Keep it short; don't put interactive content in a
tooltip (use a Popover for that). Icon-only triggers still need their own `aria-label` — the
tooltip text is not an accessible name.

## ContextMenu

Right-click menu. It owns keyboard nav/typeahead via Radix and injects a *slot* so `MenuItem`s
render through the parent menu system (don't also wrap them in a `Menu`'s own roving focus). Use
the `Menu`/`MenuItem` you already know as its content.

## Dialog & Drawer

Both are built on Radix Dialog (portal + focus-trap + scroll-lock + escape).

```tsx
<Drawer
  open={open}
  onOpenChange={(next) => { if (!next) onClose(); }}
  size={DrawerSize.LARGE}     // or a number/px/percent; position="right" default
  dark={dark}
  title="Details"             // omit for a chromeless panel
>
  <DrawerBody className="px-5 pb-5"> … </DrawerBody>
  <DrawerFooter> <Button intent="primary">Save</Button> </DrawerFooter>
</Drawer>
```

- **Controlled is the norm**: keep the component mounted and toggle `open`. Don't
  `{open && <Drawer …/>}` — conditionally unmounting kills the close animation.
- `dark` is required (portal).
- **Autofocus trap**: Radix focuses the first tabbable child on open. If your first child opens
  into an edit mode (e.g. an `EditableText`), put the Close button first in the DOM and reorder
  visually with `order-*`, or it opens straight into editing.

## Toasts must stay clickable above a modal Dialog/Drawer

A subtle two-Radix-primitives interaction (already fixed in `Toast`, documented here so it isn't
re-broken). Dialog/Drawer are **modal** by default: Radix's `DismissableLayer` sets
`document.body { pointer-events: none }` and re-enables only its own layer. Separately, **Radix
Toast writes an inline `pointer-events: none` onto each toast `<li>`** whenever the toast region
loses focus — which is exactly what a modal overlay's focus-trap causes. That inline style beats a
plain `pointer-events-auto` *class*, so with a drawer open every toast becomes un-closable: real
clicks on the × fall straight through to the drawer beneath. (It still *looks* fine — the toast is
`z-80`, above the overlay — so this reads as a z-index bug but isn't.)

Fix lives on `Toast.Root`: **`!pointer-events-auto`** (→ `pointer-events: auto !important`), which
out-specifies Radix's inline `none`. The bang is load-bearing — a non-`!` class won't beat an
inline style. If you ever rebuild the toast or see "can't close a toast while a drawer is open,"
this is why. Diagnose with `getComputedStyle(toastLi).pointerEvents` while the overlay is open: it
must read `auto`, and `document.elementFromPoint(...)` over the × must return the close button (a
programmatic `.click()` lies here — it bypasses hit-testing; use a real click or `elementFromPoint`).

## Animating overlays (component-author note)

If you add enter/exit animations to a **Dialog-based** overlay (Dialog/Drawer/Alert), do **not**
wrap the portal children in a plain `<div>` (a common dark-mode-wrapper habit). Radix
**`Dialog.Portal` wraps each direct child in its own `<Presence>`** — an un-animated wrapper
div becomes that Presence child and gets unmounted *instantly* on close, killing the panel's
slide/fade-out. (Radix **Popover**'s portal does *not* Presence-wrap, which is why the same
wrapper is harmless there.)

Fix: make the **animated element itself** (Overlay, Content) the direct portal child, and put the
`dark` class **on the Content** instead of a wrapper. Its descendants then have a `.dark`
ancestor as usual; the Content's *own* dark-dependent styles use self-matching `[&.dark]:` (the
descendant `dark:` variant can't target a class on the same element). Animations are driven by
`data-state` + keyframes in `base.css` (see `mithril-drawer-*`, `mithril-popover-*`), and
`prefers-reduced-motion` is already neutralized globally.

> Currently only Drawer and Popover animate. Dialog and Alert still use the wrapper pattern;
> they'd need this same restructuring before they can animate out.

## Checklist for any overlay

- [ ] `dark={dark}` passed (from `useDark()`)?
- [ ] Menu content → `MenuPopover` (or explicit `hasContentPadding={false}`)? (it also closes on
      select + contains item clicks — don't re-implement either)
- [ ] Icon-only trigger has an `aria-label`?
- [ ] Trigger inside a clickable parent → `stopPropagation` on the **trigger** click (the menu's
      *item* clicks are already contained by `MenuPopover`)?
- [ ] Focus-driven open fighting click-toggle → `anchorOnly`?
- [ ] Interactive popover panel has `ariaLabel`/`ariaLabelledby` (Radix gives it `role="dialog"`)?
- [ ] Toasts need to stay closable over a modal Dialog/Drawer → `Toast.Root` keeps
      `!pointer-events-auto` (don't drop the `!`)?
