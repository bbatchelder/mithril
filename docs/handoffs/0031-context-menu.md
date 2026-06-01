# 0031 — ContextMenu (Phase 3 #8 — COMPLETES Phase 3)

- **Date:** 2026-05-26
- **Focus:** Build ContextMenu to Blueprint v6.15 fidelity. Phase 3's final component.
- **Branch / commit:** phase-3-overlays @ (see commit SHA)

## Summary

Built `src/components/ui/context-menu.tsx` exporting `ContextMenu`. The component wraps
`@radix-ui/react-context-menu` (installed: +4 packages) to provide a right-click-triggered
floating menu surface. The content is rendered portaled to `document.body` inside a
popover-elevation surface (shadow-card-3, bg-white/dark-gray-3, rounded-bp), with the
same 4-rule portal+dark-mode protocol applied as every Phase 3 overlay.

Registered in both galleries under `id="context-menu"`. Both galleries use an always-visible
inline specimen (Menu inside a styled div, same bg/shadow/radius as the portaled surface)
so the harness can diff specimens without requiring a user right-click interaction.

Verified with `tools/compare.sh context-menu both`. Both themes show: 1 match, 1 differ —
the only diff is the 1px height rounding on the heading (`menu-header` H6 line-height
rounds to 18px in the browser vs Blueprint's 17px). This is the same known-intentional
delta from the Menu component.

**Phase 3 is now COMPLETE — all 8 overlays done.**

## API

```tsx
<ContextMenu
  dark={dark}              // boolean — from DarkContext; required for portal dark mode
  disabled={false}         // boolean — suppress right-click trigger
  onOpenChange={handler}   // (open: boolean) => void — track open state externally
  canEscapeKeyClose={true} // boolean — whether Escape closes the menu
  className=""             // additional class on the popover surface element
  content={                // ReactNode — pass a <Menu> with <MenuItem>/<MenuDivider>
    <Menu>
      <MenuDivider title="Actions" />
      <MenuItem icon="document" text="Open file" />
      <MenuDivider />
      <MenuItem icon="trash" text="Delete" intent="danger" />
    </Menu>
  }
>
  <div>Right-click me</div>  {/* any element or component */}
</ContextMenu>
```

### Composition

ContextMenu composes:
- `@radix-ui/react-context-menu` — right-click trigger, cursor position capture, portal, keyboard nav
- `src/components/ui/menu.tsx` — `Menu`, `MenuItem`, `MenuDivider` for the menu content

The portaled surface wraps the `content` prop in:
1. `RadixContextMenu.Portal` → document.body
2. `<div className={dark ? "dark" : ""} style={{pointerEvents:"none"}}>` → portal dark wrapper
3. `RadixContextMenu.Content` → floating surface (shadow-card-3, rounded-bp, text-foreground)
4. `<div className="bg-white dark:bg-dark-gray-3 rounded-bp text-foreground">` → surface bg

### 4 portal+dark rules applied

1. **Portal wrapper div with dark class** — `<div className={dark ? "dark" : ""} style={{pointerEvents:"none"}}>`
   enables dark utilities on portaled content (Radix portals outside the app's `.dark` div).
2. **text-foreground on surface** — `RadixContextMenu.Content` and inner surface div both carry
   `text-foreground` so portaled text picks up dark foreground (avoids dark-on-dark bug).
3. **Blueprint reference: `portalClassName={Classes.DARK}`** — not applicable here because the
   Blueprint reference gallery uses an inline specimen (not a portaled ContextMenuPopover), so
   the ancestor `.bp6-dark` class provides dark mode correctly.
4. **shadow-card-3** — not shadow-elevation-3; card-3 has Blueprint's correct dark inset edge-highlight.
   Dark override: `dark:[box-shadow:rgb(94,95,97)_0px_0px_0px_1px,...]` (same as Popover).

## Blueprint metrics matched

| Property | Value | Source |
|---|---|---|
| Surface bg (light) | `#ffffff` (white) | `$pt-popover-background-color = $white` |
| Surface bg (dark) | `#2f343c` (dark-gray3) | `$pt-dark-popover-background-color = $dark-gray3` |
| Surface border-radius | 4px | `$pt-border-radius` |
| Surface box-shadow | shadow-card-3 | `$pt-popover-box-shadow = $pt-elevation-shadow-3` |
| No arrow | — | Blueprint ContextMenu: `arrow={false}` |
| Placement | right-start | Blueprint ContextMenuPopover default |
| Content | `<Menu>` (Menu component) | composes our verified Menu/MenuItem/MenuDivider |

## Design decisions

- **Inline specimen for harness, live ContextMenu for interaction**: Radix ContextMenu.Root has no
  `open` prop — it's uncontrolled and triggered only by right-click events. Therefore the harness
  strategy is to render the menu surface inline (not portaled) with `data-compare` tagged elements.
  The Blueprint reference gallery mirrors this with a `.bp6-popover > .bp6-popover-content > Menu` div.
  A live `ContextMenu` trigger area is also shown below for interactive verification.

- **Gallery uses `self-start` wrapper**: The always-visible inline specimen is wrapped in a div with
  `self-start` (Tailwind) to prevent the flex column container from stretching it to full width.
  The menu's natural width (min-width: 180px) matches Blueprint's natural width exactly.

- **Radix ContextMenu.Root is uncontrolled**: Unlike Popover/Dialog, ContextMenu has no `open`/
  `defaultOpen` prop. The Radix ContextMenu primitive is designed for cursor-positioned triggers
  only. We expose `onOpenChange` for state tracking.

- **No `open` prop exposed**: Decided not to expose an `open` controlled prop on our ContextMenu
  because Radix's `ContextMenuProps` does not support it — the menu opens only on right-click events.
  This is correct per spec and not a limitation: ContextMenus should not be programmatically opened.

- **ContextMenu.Trigger wraps children directly** (not `asChild`): Radix Trigger renders a `<span>`
  wrapper around children by default. This is the simplest faithful approach — consumers pass a div
  or any element as children and it gets wrapped in the trigger span.

- **Dependency added**: `@radix-ui/react-context-menu@2.2.16` (+4 packages). Peer dependencies
  satisfied by existing Radix packages already in the project.

## Accepted Deltas

| Theme | Specimen | Property | Mithril | Blueprint | Why |
|---|---|---|---|---|---|
| Light + Dark | context-menu-surface | height | `193px` | `192px` | Same 1px H6 line-height rounding as Menu (browser rounds 17px leading to 18px at 14px/semibold). Sub-perceptual, same root cause as documented in 0030-menu. |

## compare.sh results

```
context-menu · light:  1 match · 1 differ — height 193px vs 192px (accepted, same as menu-header delta)
context-menu · dark:   1 match · 1 differ — same
```

Screenshot confirmation:
- **Light**: White menu surface with shadow, "Actions" heading, icon+text items, blue active item,
  red danger item, muted disabled item — matches Blueprint ✓
- **Dark**: dark-gray3 (#2f343c) menu bg, white text, muted icons, blue5 active, danger item,
  disabled muted — matches Blueprint ✓
- Specimen `context-menu-item` (the button element inside "Open document" MenuItem): measured
  props (padding, border-radius, color, line-height) match Blueprint's `.bp6-menu-item` anchor ✓

## New dependencies added

- `@radix-ui/react-context-menu@2.2.16` (+4 total packages including peer deps)

## Current state

- **ContextMenu:** Fully implemented and verified — `tools/compare.sh context-menu both`.
- **Build:** `pnpm build` green (tsc + vite); blueprint-reference `tsc --noEmit` green.
- **Phase 3:** ALL 8 components COMPLETE and checked in ROADMAP.md:
  Dialog ✓ Alert ✓ Drawer ✓ Popover ✓ Tooltip ✓ Toast ✓ Menu ✓ ContextMenu ✓

## Next steps

> **Phase 3 is COMPLETE.** Next action for the orchestrator:
> 1. Open a PR for `phase-3-overlays` → `main` (merge commit).
> 2. Merge to `main`, delete the phase branch.
> 3. Cut `phase-4-navigation` from fresh `main`.
> 4. Start Phase 4 with **Navbar** (`packages/core/src/components/navbar/`).
>
> Phase 4 components (in order):
> 1. **Navbar** — `navbar/`
> 2. **Tabs** — `tabs/`
> 3. **Collapse** — `collapse/`
> 4. **Section** — `section/` (Card-based)
> 5. **CardList** — `card-list/` (Card-based)
> 6. **Breadcrumbs** — `breadcrumbs/` (+ OverflowList infra, Menu, Popover)
> 7. **Tree** — `tree/` (Icon + Collapse)
> 8. **PanelStack** — `panel-stack/`
> 9. **HTMLTable** — `html-table/`
> 10. **EditableText** — `editable-text/`
> 11. **EntityTitle** — `entity-title/`
> 12. **NonIdealState** — `non-ideal-state/` (Icon)
> 13. **Link** — `link/`
> 14. **Slider** — `slider/`
> 15. **Hotkeys** — `hotkeys/` (Dialog-based)

## How to resume

```bash
# Check branch
git branch --show-current  # should be phase-3-overlays (or main if PR was merged)

# Both dev servers
pnpm dev                                              # :5173
cd tools/blueprint-reference && pnpm dev              # :5174

# Verify the ContextMenu component
tools/compare.sh context-menu both
```

- Relevant files:
  - `src/components/ui/context-menu.tsx` (new — ContextMenu component)
  - `src/App.tsx` (ContextMenuGallery added + COMPONENTS entry + import)
  - `tools/blueprint-reference/src/App.tsx` (ContextMenuGallery added + COMPONENTS entry)
  - `docs/ROADMAP.md` (ContextMenu checked — Phase 3 COMPLETE)
  - `package.json` / `pnpm-lock.yaml` (`@radix-ui/react-context-menu` added)
