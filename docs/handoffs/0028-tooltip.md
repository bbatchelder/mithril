# 0028 — Tooltip (Phase 3 #5 — Popover-based)

- **Date:** 2026-05-25
- **Focus:** Build Tooltip (+ both gallery registrations) to Blueprint v6.15 fidelity using Radix Tooltip.
- **Branch / commit:** phase-3-overlays @ (see commit SHA)

## Summary

Built `src/components/ui/tooltip.tsx` exporting `Tooltip` and `TooltipProvider`.
Tooltip is a small inverted bubble anchored to a trigger element, implemented on
`@radix-ui/react-tooltip` (newly installed) using the portal + dark-mode wrapper
pattern established by Popover, Dialog, Alert, and Drawer.

The defining feature of Blueprint's Tooltip is the **color inversion**:
- **Light theme:** dark bubble (`#404854` = `dark-gray-5` bg, `#f6f7f9` = `light-gray-5` text)
- **Dark theme:** light bubble (`#e5e8eb` = `light-gray-3` bg, `#404854` = `dark-gray-5` text)

Intent tooltips use the intent color as background with white text in both themes.

Registered in both galleries under `id="tooltip"` with 2 `data-compare` specimens
(tooltip-content, tooltip-arrow). Both themes verified with `tools/compare.sh tooltip both`.

**Compare result:**
- Light: **1 match · 1 differ** — all diffs accepted (documented below)
- Dark:  **1 match · 1 differ** — all diffs accepted (documented below)

## Portal + dark-mode rules applied (all 4)

1. **Analyst portal children wrapped in `<div className={dark?'dark':''} style={{pointerEvents:'none'}}>`**
   — implemented directly in tooltip.tsx. Passes `dark` from DarkContext in TooltipGallery.

2. **Tooltip bubble sets EXPLICIT bg + text (not via --foreground inheritance)**
   — The outer `RadixTooltip.Content` has `text-light-gray-5` (both themes) to match Blueprint's
   `.bp6-tooltip` which also shows light text in both themes (inherited from dark context + set by
   `pt-dark-typography-colors` in light). The inner div has the full inversion via `bubbleBgText`.

3. **Reference gallery passes `portalClassName={Classes.DARK}` when `?theme=dark`**
   — Blueprint's `Tooltip` has `portalClassName` on its props (from `OverlayableProps`).
   Correctly typed (no `as any` cast needed). Dark comparison is valid.

4. **Use `shadow-card-3` for light + dark override for dark tooltip shadow**
   — `shadow-card-3` for light (= `$pt-elevation-shadow-3`, same as Popover/Dialog).
   Dark tooltip uses a SIMPLER shadow: `$pt-dark-tooltip-box-shadow = 0 2px 4px rgba(#111418,0.4), 0 8px 24px rgba(#111418,0.4)`.
   We override with: `dark:[box-shadow:rgba(17,20,24,0.4)_0px_2px_4px_0px,rgba(17,20,24,0.4)_0px_8px_24px_0px]`.

## API

```tsx
// Provider — wrap app root (or subtree). Optional if using standalone Tooltip.
<TooltipProvider delayDuration={100} skipDelayDuration={300}>
  <App />
</TooltipProvider>

<Tooltip
  content="Save document"     // required — the bubble content
  open={open}                  // controlled open state
  defaultOpen={false}          // uncontrolled initial open (used in gallery)
  onOpenChange={setOpen}       // called when open changes
  side="top"                   // "top"|"right"|"bottom"|"left" @default "top"
  align="center"               // "start"|"center"|"end" @default "center"
  sideOffset={2}               // gap between trigger and bubble in px @default 2
  arrow={true}                 // show/hide the arrow @default true
  intent="none"                // "none"|"primary"|"success"|"warning"|"danger" @default "none"
  compact={false}              // compact mode (4px 8px padding, 1rem line-height) @default false
  hoverOpenDelay={100}         // ms before opening @default 100
  hoverCloseDelay={0}          // ms before closing @default 0
  disabled={false}             // prevent opening @default false
  dark={dark}                  // from DarkContext — required for portal dark-mode
  data-compare="tooltip-content" // harness comparison key (optional; set on outer bubble)
  className="..."
>
  <Button>Trigger</Button>      {/* single focusable trigger element */}
</Tooltip>
```

## The Inversion (core design decision)

The inversion is Blueprint's most distinctive tooltip property. The bubble actively inverts
the page's color scheme:

| Theme | Bubble bg | Bubble text | Source |
|---|---|---|---|
| Light | `#404854` (dark-gray-5) | `#f6f7f9` (light-gray-5) | `$tooltip-background-color`, `$tooltip-text-color` |
| Dark | `#e5e8eb` (light-gray-3) | `#404854` (dark-gray-5) | `$dark-tooltip-background-color`, `$dark-tooltip-text-color` |
| Intent (all) | intent color | white | `.bp6-intent-* .bp6-popover-content { background: $color; color: $white }` |

Implementation:
- **Outer `RadixTooltip.Content`**: transparent bg, `text-light-gray-5` (both themes) — matches Blueprint's
  `.bp6-tooltip` outer which inherits light text from dark-typography or dark-context.
- **Inner `<div>`**: `bg-dark-gray-5 text-light-gray-5 dark:bg-light-gray-3 dark:text-dark-gray-5` — the
  actual visible bubble with the full inversion.
- **Arrow fill**: `fill-dark-gray-5 dark:fill-light-gray-3` for default; intent color for intent bubbles.

## Blueprint metrics matched

| Property | Value | Source |
|---|---|---|
| Bubble bg (light) | `#404854` (dark-gray-5) | `$tooltip-background-color = $dark-gray5` |
| Bubble text (light) | `#f6f7f9` (light-gray-5) | `$tooltip-text-color = $light-gray5` |
| Bubble bg (dark) | `#e5e8eb` (light-gray-3) | `$dark-tooltip-background-color = $light-gray3` |
| Bubble text (dark) | `#404854` (dark-gray-5) | `$dark-tooltip-text-color = $dark-gray5` |
| Padding (default) | 8px 12px | `$tooltip-padding-vertical = $pt-spacing*2`, `$tooltip-padding-horizontal = $pt-spacing*3` |
| Padding (compact) | 4px 8px | `$tooltip-padding-compact-vertical/horizontal` |
| Compact line-height | 1rem | `.bp6-compact .bp6-popover-content { line-height: 1rem }` |
| Border-radius | 4px | `$pt-border-radius` |
| Light shadow | elevation-3 | `$pt-tooltip-box-shadow = $pt-popover-box-shadow = $pt-elevation-shadow-3` → `shadow-card-3` |
| Dark shadow | 2-layer simple | `$pt-dark-tooltip-box-shadow = 0 2px 4px rgba($black,0.4), 0 8px 24px rgba($black,0.4)` |
| Arrow SVG size | 22px | `TOOLTIP_ARROW_SVG_SIZE = 22` (smaller than popover's 30) |
| Arrow SVG paths | same as Popover | Blueprint `popoverArrow.tsx` (same paths, same viewBox, different element size) |
| Intent text | `$white` | ALL intents use white text (incl. warning) |

## Shadow elevation choice

Light tooltip: `$pt-tooltip-box-shadow = $pt-elevation-shadow-3` → `shadow-card-3` (same as Popover/Dialog).

Dark tooltip: Blueprint uses `$pt-dark-tooltip-box-shadow` which is SIMPLER than `$pt-dark-elevation-shadow-3`:
- No outset border ring (unlike dark popover: `0 0 0 1px $pt-dark-popover-border-color`)
- No inset highlights (unlike dark card shadows which add `card-highlight`)
- Just 2 plain drop shadows: `0 2px 4px rgba($black,0.4), 0 8px 24px rgba($black,0.4)`

We replicate this with a Tailwind arbitrary value dark override.

## Arrow approach

Same Blueprint-exact SVG paths as Popover (from `popoverArrow.tsx`), but with:
- `width={22} height={22}` (TOOLTIP_ARROW_SVG_SIZE = 22, smaller than popover's 30)
- `viewBox="0 0 30 30"` (same paths, same coordinate space — element scales them)
- Fill colors per theme/intent (matches bubble bg exactly)
- Same rotation via `[[data-side=*]_&]` CSS selectors

## Structural decision: outer transparent + inner colored

Blueprint's `.bp6-tooltip` (outer) is transparent — shadow is on outer, bg/text are on `.bp6-popover-content` (inner).

Our structure mirrors this:
- `RadixTooltip.Content` (outer, `data-compare="tooltip-content"`) — transparent bg, shadow, text-light-gray-5
- Inner `<div>` — has `bg-dark-gray-5 text-light-gray-5 dark:bg-light-gray-3 dark:text-dark-gray-5`, padding

This structural match makes the harness comparison valid (comparing transparent outer vs transparent outer).

## data-compare strategy

With two tooltips open simultaneously (default + danger), we can't use `data-compare` on all instances
because the harness key must be unique. Solution:
- Pass `data-compare="tooltip-content"` only to the first (default) tooltip via explicit prop
- Arrow gets `data-compare="tooltip-arrow"` automatically when parent has `data-compare`
- Danger intent tooltip: verified via screenshots only (no data-compare)

In the Blueprint reference gallery, `querySelector(`.${Classes.TOOLTIP}`)` (singular, not querySelectorAll)
naturally picks the first tooltip.

## Current state

- **Tooltip:** Fully implemented and verified — `tools/compare.sh tooltip both`.
  - Light: 1/2 match · 1 differ (tooltip-arrow MATCH; tooltip-content: known-intentional deltas only)
  - Dark: 1/2 match · 1 differ (tooltip-arrow MATCH; tooltip-content: known-intentional delta only)
- **Build:** `pnpm build` green (tsc + vite); blueprint-reference `tsc --noEmit` green.
- **Phase 3 progress:** Dialog + Alert + Drawer + Popover + Tooltip checked in ROADMAP.md; 5/8 Phase 3 components done.

## Accepted Deltas

| Theme | Specimen | Property | Analyst | Blueprint | Why |
|---|---|---|---|---|---|
| Light | tooltip-content | boxShadow (1st layer) | `rgba(0,0,0,0.102)` | `rgba(20,20,20,0.102)` | Token uses pure black; Blueprint uses `$black=#111418`. Sub-perceptual. Same as Dialog/Drawer/Popover. |
| Light | tooltip-content | minWidth | `0px` | `auto` | Radix Tooltip.Content internally sets `min-width: 0` as part of its positioning reset. Blueprint has no explicit min-width. Visual difference: none. |
| Dark | tooltip-content | minWidth | `0px` | `auto` | Same as light — Radix internal. |

## INVERSION CONFIRMED

Screenshots confirm:
- **Light theme:** Dark bubble (`#404854` bg, `#f6f7f9` text) on light page ✓
- **Dark theme:** Light bubble (`#e5e8eb` bg, `#404854` text) on dark page ✓
- **Danger intent:** Red bg, white text in both themes ✓
- **Arrow:** Correct color (dark fill in light, light fill in dark, danger fill for intent) ✓

## Specimens registered (both galleries, 2 keyed)

| key | description |
|---|---|
| `tooltip-content` | The `.bp6-tooltip` outer panel (Radix Tooltip.Content — transparent with shadow) |
| `tooltip-arrow` | The `.bp6-popover-arrow` arrow element (Radix Tooltip.Arrow SVG) |

## compare.sh results

```
tooltip · light:  1 match · 1 differ  — tooltip-arrow MATCH; tooltip-content: known-intentional deltas only
tooltip · dark:   1 match · 1 differ  — tooltip-arrow MATCH; tooltip-content: known-intentional delta only
```

## New dep added

`@radix-ui/react-tooltip@1.2.8` — Radix Tooltip with Floating UI positioning + hover delay + Provider.

Key differences vs Radix Popover:
- Requires `Tooltip.Provider` (we wrap internally + export `TooltipProvider` for app-level use)
- `delayDuration` / `skipDelayDuration` for hover interaction timing
- `disableHoverableContent` — prevents tooltip from closing when user hovers into the tooltip bubble

## Next steps

> Next item: **Toast / Toaster** (Phase 3 #6) — overlay-based notification.
> Blueprint: `packages/core/src/components/toast/`. Auto-dismissing messages.
> Props: message, intent, icon, action, timeout, onDismiss.
> Architecture: Toaster singleton or portal-based stack.

1. **Toast** — `src/components/ui/toast.tsx`. Consider Radix Toast (`@radix-ui/react-toast`) which provides
   the overlay + dismiss + action pattern. Blueprint Toaster manages a stack of Toasts.
   - Portal pattern (same dark-mode wrapper).
   - Intent colors (same as Callout/Tag/Button).
   - Auto-dismiss timer, manual close button.
   - Stack positioning: bottom-right (Blueprint default: `Position.BOTTOM_RIGHT`).

## How to resume

```bash
# Check branch
git branch --show-current  # should be phase-3-overlays

# Both servers
pnpm dev                                              # :5173
cd tools/blueprint-reference && pnpm dev              # :5174

# Verification
tools/compare.sh tooltip both
```

- Relevant files:
  - `src/components/ui/tooltip.tsx` (new — Tooltip + TooltipProvider)
  - `src/App.tsx` (TooltipGallery added + COMPONENTS entry + Tooltip import)
  - `tools/blueprint-reference/src/App.tsx` (TooltipGallery added + COMPONENTS entry + Tooltip import)
  - `docs/ROADMAP.md` (Tooltip checked)
  - `package.json` / `pnpm-lock.yaml` (`@radix-ui/react-tooltip@1.2.8` added)
