# 0026 — Drawer (Phase 3 #3 — Edge-anchored overlay panel)

- **Date:** 2026-05-25
- **Focus:** Build Drawer (+ DrawerBody, DrawerFooter + both gallery registrations) to Blueprint v6.15 fidelity using Radix Dialog portal pattern.
- **Branch / commit:** phase-3-overlays @ (see commit SHA)

## Summary

Built `src/components/ui/drawer.tsx` exporting `Drawer`, `DrawerBody`, `DrawerFooter`, and `DrawerSize`.
Drawer is a Dialog variant where the panel is anchored to a screen edge instead of centered. Implemented
directly on `@radix-ui/react-dialog` (no new deps) reusing the portal + dark-mode wrapper pattern
established by Dialog and Alert. Registered in both galleries under `id="drawer"` with 3 matching
`data-compare` specimens. All 4 portal + dark-mode rules applied.

**Compare result:**
- Light: **2 match · 1 differ** — 1 accepted sub-perceptual delta (panel boxShadow base color)
- Dark: **1 match · 2 differ** — both accepted (sub-perceptual or KNOWN-INTENTIONAL)

## Portal + dark-mode rules applied (all 4)

1. **Mithril portal children wrapped in `<div className={dark?'dark':''} style={{pointerEvents:'none'}}>`**
   — implemented directly in drawer.tsx (same as dialog.tsx and alert.tsx). Passes `dark` from DarkContext
   in DrawerGallery.

2. **Drawer panel sets `text-foreground`**
   — `RadixDialog.Content` has `text-foreground` class. Confirmed: dark text is correct in dark mode.

3. **Reference gallery passes `portalClassName={Classes.DARK}` when `?theme=dark`**
   — Blueprint's `DrawerProps` extends `OverlayableProps` which includes `portalClassName`, so this is
   correctly typed (unlike Alert which needed `as any` cast). Dark comparison is valid.

4. **Use `shadow-card-4` for the panel shadow**
   — confirmed: `shadow-card-4` class on the panel (elevation-4 light + card-4 dark insets).
   Blueprint drawer light = `$pt-elevation-shadow-4`; dark = `$pt-dark-dialog-box-shadow = $pt-dark-elevation-shadow-3`
   (Blueprint uses elevation-3 dark for drawer, not elevation-4). The visual delta is sub-perceptual.

## Current state

- **Drawer:** Fully implemented and verified — `tools/compare.sh drawer both`.
  - Light: 2/3 match · 1 differ (accepted panel box-shadow minor delta)
  - Dark: 1/3 match · 2 differ (header divider base-color + panel shadow elevation mismatch, both accepted)
- **Build:** `pnpm build` green (tsc + vite); blueprint-reference `tsc --noEmit` green.
- **Phase 3 progress:** Dialog + Alert + Drawer checked in ROADMAP.md; 3/8 Phase 3 components done.

## API

```tsx
// Drawer size constants
DrawerSize.SMALL    // "360px"
DrawerSize.STANDARD // "50%" (default)
DrawerSize.LARGE    // "90%"

<Drawer
  open={open}                    // controlled open state
  defaultOpen={true}             // uncontrolled initial open
  onOpenChange={setOpen}         // called when open changes
  position="right"               // "left"|"right"|"top"|"bottom" @default "right"
  size={DrawerSize.SMALL}        // width (left/right) or height (top/bottom) @default "50%"
  title="Drawer Title"           // when provided, renders the header
  icon={<Icon icon="cog" />}     // icon in the header before the title
  closeButton={true}             // @default true
  canEscapeKeyClose={true}       // @default true
  canOutsideClickClose={true}    // @default true
  dark={dark}                    // from DarkContext — required for portal dark-mode
  className="..."
  style={{}}
>
  <DrawerBody className="p-5">   // flex: 1 1 auto; overflow: auto; no padding by default
    <p>Content here</p>
  </DrawerBody>
  <DrawerFooter>                  // flex: 0 0 auto; padding 10px 20px; inset top divider
    <Button>Cancel</Button>
    <Button intent="primary">Save</Button>
  </DrawerFooter>
</Drawer>
```

## Blueprint metrics matched

| Property | Value | Source |
|---|---|---|
| Panel bg (light) | white (#ffffff) | `$drawer-background-color = $white` |
| Panel bg (dark) | `#2f343c` (dark-gray3) | `$dark-drawer-background-color = $dark-gray3` |
| Panel shadow | elevation-4 (light) / elevation-3 (dark) | `$pt-elevation-shadow-4` / `$pt-dark-dialog-box-shadow` |
| Panel display | flex column | `.bp6-drawer` |
| Panel no radius | no border-radius | drawer edges go to screen edge |
| Header min-height | 40px | `$pt-icon-size-large + $drawer-padding = 20+20px` |
| Header padding | 5px all, 20px left | `$drawer-padding * 0.25; $drawer-padding` |
| Header divider (light) | `0 1px 0 rgba(17,20,24,0.15)` | `$pt-divider-black` |
| Header divider (dark) | `0 1px 0 rgba(0,0,0,0.4)` | `$pt-dark-divider-black` |
| Header icon color | muted | `$pt-icon-color = $pt-text-color-muted` |
| Header icon margin-right | 10px | `$drawer-padding * 0.5 = 10px` |
| Header title (H4) | flex: 1 1 auto; overflow ellipsis | `.bp6-heading` |
| DrawerBody | flex: 1 1 auto; overflow auto | `.bp6-drawer-body` |
| DrawerBody line-height | 18px | `$pt-spacing * 4.5 = 18px` |
| DrawerFooter padding | 10px 20px | `$drawer-padding * 0.5 $drawer-padding` |
| DrawerFooter divider (light) | `inset 0 1px 0 rgba(17,20,24,0.15)` | `$pt-divider-black` |
| DrawerFooter divider (dark) | `inset 0 1px 0 rgba(0,0,0,0.4)` | `$pt-dark-divider-black` |

## Decisions made (and why)

### `DrawerSize` as const object not enum
Blueprint uses a TypeScript `enum DrawerSize` but our tsconfig has `erasableSyntaxOnly` which disallows
enums. Used `export const DrawerSize = { ... } as const` instead. Functionally identical.

### Panel has no border-radius
Blueprint's drawer panel goes edge-to-edge on the screen boundary (no rounded corners). The panel is
positioned with `fixed top-0 bottom-0 right-0` (or other edges), flush with the viewport. No `rounded-bp`
applied (unlike Dialog which has `rounded-bp`).

### Size via inline style (correct — not a tree-shaking concern)
The `size` prop is a dynamic runtime value (user-provided width/height string/number). Setting it via
`style={{ width: sizeValue }}` is correct and NOT a Tailwind tree-shaking concern — the Tailwind v4 rule
applies only to `@theme` CSS custom property token references, not computed dimension values.

### Reusing @radix-ui/react-dialog (no new dep)
Drawer is implemented as a Radix Dialog without the centering container. No `vaul` or other dep needed.
The portal/overlay/focus-trap/escape/scroll-lock primitives are identical to Dialog.

### DrawerBody has no default padding
Blueprint's `.bp6-drawer-body` has no padding — padding is up to the consumer. We expose className
so callers can add `className="p-5"` etc. (same pattern used in gallery).

### Blueprint dark shadow: elevation-3 not elevation-4
Blueprint's `_drawer.scss` uses `$pt-dark-dialog-box-shadow = $pt-dark-elevation-shadow-3` in dark mode
(NOT `$pt-dark-elevation-shadow-4`). Our `shadow-card-4` token maps to elevation-4 in dark, producing
a slightly different shadow (fewer layers). Visually sub-perceptual. This is Blueprint's own internal
inconsistency (using elevation-3 dark for a component that uses elevation-4 light). Accept.

### Reference gallery DrawerBody uses className not child component
The Blueprint reference uses `<div className={Classes.DRAWER_BODY}>` inside the Drawer (Blueprint's
Drawer doesn't export a separate DrawerBody component). This correctly maps to our `DrawerBody`.

## Gotchas / things to know

### drawer-close "only in mithril" note
The harness reports `only in mithril: drawer-close` — this means `data-compare="drawer-close"` exists
on our close button but not on Blueprint's (we don't tag it in the reference gallery because Blueprint's
close button is deep inside the portaled DOM with no easy selector). The harness doesn't diff it — it
just notes the key exists only on one side. This is fine and expected.

### Blueprint dark drawer uses elevation-3 shadow, not elevation-4
Per `$pt-dark-dialog-box-shadow = $pt-dark-elevation-shadow-3`. Mithril uses card-4 which is elevation-4
dark. The layers differ but both are sub-perceptual; screenshots confirm visual match.

### Header dark divider base color sub-perceptual delta
`rgba(0,0,0,0.4)` (mithril, pure black) vs `rgba(17,20,25,0.4)` (Blueprint, $black=#111418). Same
pattern as dialog/alert dividers. At 40% opacity the difference is invisible.

## Accepted Deltas

| Theme | Specimen | Property | Mithril | Blueprint | Why |
|---|---|---|---|---|---|
| Light | drawer-panel | boxShadow (1st layer) | `rgba(0,0,0,0.102)` | `rgba(20,20,20,0.102)` | Token uses pure black; Blueprint uses `$black=#111418`. Sub-perceptual. |
| Dark | drawer-header | boxShadow | `rgba(0,0,0,0.4) 0px 1px 0px` | `rgba(17,20,25,0.4) 0px 1px 0px` | Same base-color delta. Sub-perceptual. |
| Dark | drawer-panel | boxShadow | elevation-4 dark (4 layers) | elevation-3 dark (5 layers) | Blueprint's own mismatch: uses elevation-4 light / elevation-3 dark. Sub-perceptual visually. |

## Specimens registered (both galleries, 3 keyed)

| key | description |
|---|---|
| `drawer-panel` | The `.bp6-drawer` panel (Radix Dialog.Content) |
| `drawer-header` | The `.bp6-drawer-header` |
| `drawer-body` | The `.bp6-drawer-body` |

## compare.sh results

```
drawer · light:  2 match · 1 differ  — 1 accepted sub-perceptual delta (panel box-shadow base color)
drawer · dark:   1 match · 2 differ  — both accepted (header divider base-color + elevation-3 vs 4 shadow)
```

## New dep added

None — reuses `@radix-ui/react-dialog` via the existing install.

## Next steps

> Next item: **Popover** (Phase 3 #4) — Positioning primitive.
> Blueprint: `packages/core/src/components/popover/`. Radix Popover or Floating UI.
> Unlocks Tooltip, Menu dropdowns, Select family, DateInput, ContextMenu, Breadcrumbs overflow.

1. **Popover** — `src/components/ui/popover.tsx`. Consider `@radix-ui/react-popover` (already may be
   available, or install). Same portal + dark-mode pattern applies.
   - Props: `open`/`defaultOpen`/`onOpenChange`, `content`, `placement`, `interactionKind`
     (hover/click/hover-target/focus), `canEscapeKeyClose`, `canOutsideClickClose`, `dark`.
   - Radix Popover handles: portal, focus-trap, escape, positioning.
   - Same data-compare pattern: open by default; use DarkContext; reference with portalClassName dark fix.

## How to resume

```bash
# Check branch
git branch --show-current  # should be phase-3-overlays

# Both servers
pnpm dev                                              # :5173
cd tools/blueprint-reference && pnpm dev              # :5174

# Verification
tools/compare.sh drawer both
```

- Relevant files:
  - `src/components/ui/drawer.tsx` (new — Drawer, DrawerBody, DrawerFooter, DrawerSize)
  - `src/App.tsx` (DrawerGallery added + COMPONENTS entry + Drawer import)
  - `tools/blueprint-reference/src/App.tsx` (DrawerGallery added + COMPONENTS entry + Drawer import)
  - `docs/ROADMAP.md` (Drawer checked)
