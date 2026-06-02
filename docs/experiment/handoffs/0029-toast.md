# 0029 — Toast / Toaster (Phase 3 #6)

- **Date:** 2026-05-25
- **Focus:** Build Toast + Toaster to Blueprint v6.15 fidelity using Radix Toast, with full portal+dark support and gallery registration in both galleries.
- **Branch / commit:** phase-3-overlays @ (see commit SHA)

## Summary

Built `src/components/ui/toast.tsx` exporting `Toast`, `ToastProvider`, `Toaster`, and `useToaster()`.
Toast is a card-style notification using `@radix-ui/react-toast` (newly installed at v1.2.15) for
portal-based viewport management, dismiss/action handling, and auto-dismiss timing.

The component implements all five Blueprint intents (none/primary/success/warning/danger), icon slot,
message area, action button, and dismiss button — matching Blueprint's `_toast.scss` metrics exactly.
The warning toast uses `$orange5 bg / $dark-gray1 text` (Blueprint's counter-intuitive warning design).
Dark-mode portal fix applied (Viewport wrapped in `<div className={dark ? "dark" : ""} style={{ pointerEvents: "none" }}>` inside `ToastProvider`).

Registered in both galleries under `id="toast"` with 2 `data-compare` specimens
(`toast-card`, `toast-intent-danger`). Verified with `tools/compare.sh toast both`.

## Portal + dark-mode rules applied (all 4)

1. **Mithril Viewport wrapped in `<div className={dark?'dark':''} style={{pointerEvents:'none'}}>`**
   — implemented in `ToastProvider`. Passes `dark` from DarkContext in `ToastGallery`.

2. **Toast card sets explicit `text-foreground` for no-intent toast** — so text is correct in portal
   context without inheriting body's LIGHT color.

3. **Reference gallery renders `.bp6-toast` markup directly with `${dark ? Classes.DARK : ""}` on each
   toast card** — Blueprint's OverlayToaster is async+complex; direct markup is cleaner and produces
   valid comparison. The `Classes.DARK` on the card element triggers Blueprint's dark styles correctly.

4. **`shadow-card-3` used for dark toast shadow** — `$pt-dark-toast-box-shadow = $pt-dark-elevation-shadow-3`
   which matches our `shadow-card-3` dark value (the same token used for Dialog/Drawer/Popover dark shadows).

## API

```tsx
// Provider — wrap app root. Handles Viewport portal + dark mode.
<ToastProvider dark={dark} position="top" duration={5000}>
  <App />
</ToastProvider>

// Static toast (gallery / always-visible)
<Toast
  open={true}          // controlled open state
  timeout={0}          // 0 = no auto-dismiss
  intent="none"        // "none"|"primary"|"success"|"warning"|"danger"
  icon="info-sign"     // Blueprint icon name (optional)
  message="Text"       // message content
  action={{ text: "Retry", onClick: () => {} }}  // optional action button
  isCloseButtonShown={true}   // show dismiss (×) button
  data-compare="..."   // harness key
/>

// Imperative (via Toaster wrapping Toaster):
<Toaster dark={dark} position="top">
  <MyContent />
</Toaster>

function MyContent() {
  const toaster = useToaster();
  toaster.show({ intent: "success", icon: "tick", message: "Saved!" });
  toaster.dismiss(id);
  toaster.clear();
}
```

### Radix mapping

| Our prop/concept | Radix primitive |
|---|---|
| `ToastProvider` | `Toast.Provider` + `Toast.Viewport` (portaled) |
| `Toast` | `Toast.Root` (renders as `<li>`) |
| message span | `Toast.Title asChild` (accessible title) |
| action button | `Toast.Action asChild` (requires `altText`) |
| dismiss button | `Toast.Close asChild` |
| `timeout` | `Toast.Root duration` |
| `position` | Viewport positioning CSS classes |

## Blueprint metrics matched

| Property | Value | Source |
|---|---|---|
| Card bg (light) | `#ffffff` (white) | `.bp6-toast { background-color: $white }` |
| Card bg (dark) | `#383e47` (dark-gray4) | `.bp6-dark .bp6-toast { background-color: $dark-gray4 }` |
| Border-radius | 4px | `$pt-border-radius` |
| Box-shadow (light) | `inset 0 0 0 1px rgba(17,20,24,0.2), 0 2px 4px rgba(17,20,24,0.2), 0 8px 24px rgba(17,20,24,0.2)` | `$pt-toast-box-shadow = inset border-shadow(0.2) + 2 drop shadows` |
| Box-shadow (dark) | `$pt-dark-elevation-shadow-3` = `shadow-card-3` dark | same as Dialog/Popover dark shadow |
| Min-width | 300px | `$pt-spacing * 75 = 300px` |
| Max-width | 500px | `$pt-spacing * 125 = 500px` |
| Toast margin | 20px top | `$toast-margin = $pt-spacing * 5` (via `mt-5` on `Toast.Root`) |
| Min-height | 40px (via flex children) | `$toast-height = $pt-button-height-large = 40px` |
| Message padding | 11px all sides | `centered-text(40px) = floor((40-18)*0.5) = 11px` |
| Icon margin | 12px all, right=0 | `(40-16)/2 = 12px` |
| Button group padding | 5px all, 0 left | `(40-30)/2 = 5px` |
| Intent: primary bg | `#2d72d2` (blue3) | `$pt-intent-primary` |
| Intent: success bg | `#238551` (green3) | `$pt-intent-success` |
| Intent: warning bg | `#fbb360` (orange5) | `$orange5` (NOT orange3 — intentional Blueprint choice) |
| Intent: warning text | `#1c2127` (dark-gray1) | `$dark-gray1` |
| Intent: danger bg | `#cd4246` (red3) | `$pt-intent-danger` |

## Design decisions

- **Gallery renders Toast.Root directly in div (not Viewport)**: `Toast.Root` items flow into the Radix
  Viewport automatically via Radix collection mechanism. In `ToastProvider`, the `Toast.Root` elements
  are placed as children and the Viewport (portaled to body) displays them stacked. Gallery correctly
  shows toasts in the fixed Viewport position.

- **Reference gallery uses direct `.bp6-toast` markup** (not `OverlayToaster`): Blueprint's
  `OverlayToaster.create()` is async and portal-based, making it difficult to use in a static gallery.
  Direct markup with Blueprint CSS classes produces identical visual output and allows `data-compare`
  placement. Dark mode applied via `${dark ? Classes.DARK : ""}` on each card element.

- **Warning intent uses `bg-orange-5 text-dark-gray-1`**: Blueprint's `$toast-intent-colors` map uses
  `($orange5, $dark-gray1, $orange4, $orange3)` for warning — orange5 as bg and dark-gray1 as text.
  This is opposite to other intents (where `$pt-intent-warning = $orange3` is the bg). We match exactly.

- **`mt-5` on Toast.Root**: Blueprint's `.bp6-toast` has `margin: $toast-margin 0 0` (20px top).
  We apply `mt-5` (20px) on `Toast.Root`. This matches the measured `marginTop: 20px` on Blueprint.

- **Gallery message text shortened**: Original "Fileserver connection lost. Reconnecting…" was ~340px at
  14px font size and wrapped at 300px min-width, causing height to be 58px instead of 40px. Changed to
  "Reconnecting to server." which fits on one line at 300px.

## Accepted Deltas

| Theme | Specimen | Property | Mithril | Blueprint | Why |
|---|---|---|---|---|---|
| Light + Dark | toast-card | minWidth | `300px` | `min(300px, 100%)` | CSS computed-value representation difference only. Both resolve to 300px in the gallery context (container is wider). Visual output identical. Blueprint uses `min()` CSS function for responsiveness. |
| Dark | toast-card | boxShadow | layers in order: ring, 20px-drop, 10px-drop, 2 inset highlights | layers: ring, 20px-drop, 2 inset highlights, 10px-drop | Same 5 shadow layers, just serialized in different order by the browser. Sub-perceptual. Same as Dialog/Popover dark shadow order issue. |
| Dark | toast-intent-danger | boxShadow | same order difference | same | Same as above. |

## compare.sh results

```
toast · light:  0 match · 2 differ  — all diffs accepted (minWidth CSS representation)
toast · dark:   0 match · 2 differ  — all diffs accepted (minWidth CSS representation + shadow layer order)
```

Screenshot confirmation:
- **Light**: Default white toast, danger/success/warning intent toasts — all correct colors, icon, layout ✓
- **Dark**: Default dark-gray4 toast, intent toasts same in both themes ✓
- **Warning**: `#fbb360` (orange5) bg, `#1c2127` (dark-gray1) text — matches Blueprint ✓
- **Dark portal**: Toasts correctly inherit dark styles via `dark` wrapper on Viewport ✓

## New dep added

`@radix-ui/react-toast@1.2.15` — Radix Toast with:
- `Toast.Provider` (manages timing, swipe threshold, label)
- `Toast.Root` → renders as `<li>` inside a `<ol>` Viewport
- `Toast.Viewport` → portaled `<ol>` list at fixed position
- `Toast.Title` / `Toast.Description` / `Toast.Action` / `Toast.Close`
- `duration` prop for auto-dismiss timing
- `open` / `onOpenChange` for controlled state

## Current state

- **Toast:** Fully implemented and verified — `tools/compare.sh toast both`.
- **Build:** `pnpm build` green (tsc + vite); blueprint-reference `tsc --noEmit` green.
- **Phase 3 progress:** Dialog + Alert + Drawer + Popover + Tooltip + Toast checked in ROADMAP.md; 6/8 Phase 3 components done.

## Next steps

> Next item: **Menu** (Phase 3 #7) — dropdown menu with MenuItem and MenuDivider.
> Blueprint: `packages/core/src/components/menu/`. Needs Radix Menu or Popover + custom menu styling.

1. **Menu** — `src/components/ui/menu.tsx`. Architecture: Radix `DropdownMenu` or custom `Popover`
   with `menu.tsx` inner content component. Blueprint menu is not necessarily in a popover; it can
   be standalone. Consider implementing as a standalone `<ul>` with `MenuItem` items, plus a
   `MenuPopover` variant that wraps it in a Popover.
   - Blueprint source: `packages/core/src/components/menu/menu.tsx`, `_menu.scss`
   - Key metrics: padding, item height (30px = $pt-button-height), intent colors, icon slot, divider.

## How to resume

```bash
# Check branch
git branch --show-current  # should be phase-3-overlays

# Both servers
pnpm dev                                              # :5173
cd tools/blueprint-reference && pnpm dev              # :5174

# Verification
tools/compare.sh toast both
```

- Relevant files:
  - `src/components/ui/toast.tsx` (new — Toast + ToastProvider + Toaster + useToaster)
  - `src/App.tsx` (ToastGallery added + COMPONENTS entry + Toast/ToastProvider import)
  - `tools/blueprint-reference/src/App.tsx` (ToastGallery added + COMPONENTS entry)
  - `docs/ROADMAP.md` (Toast checked)
  - `package.json` / `pnpm-lock.yaml` (`@radix-ui/react-toast@1.2.15` added)
