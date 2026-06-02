# 0025 — Alert (Phase 3 #2 — Dialog-based confirm dialog)

- **Date:** 2026-05-25
- **Focus:** Build Alert (+ both gallery registrations) to Blueprint v6.15 fidelity using Radix Dialog portal pattern.
- **Branch / commit:** phase-3-overlays @ (see commit SHA)

## Summary

Built `src/components/ui/alert.tsx` exporting `Alert`. Alert is a headerless Dialog — a modal confirm
dialog with an optional large icon (40px), a message body, and two action buttons (confirm + optional
cancel). Implemented directly on `@radix-ui/react-dialog` (no new deps) reusing the portal + dark-mode
wrapper pattern established by Dialog. Registered in both galleries under `id="alert"` with 5 matching
`data-compare` specimens. All 4 portal + dark-mode rules applied.

**Compare result:**
- Light: **4 match · 1 differ** — 1 accepted sub-perceptual delta (panel box-shadow first layer base color)
- Dark: **3 match · 2 differ** — both are KNOWN-INTENTIONAL documented deltas

## Portal + dark-mode rules applied (all 4)

1. **Mithril portal children wrapped in `<div className={dark?'dark':''} style={{pointerEvents:'none'}}>`**
   — implemented directly in alert.tsx (same as dialog.tsx). Passes `dark` from DarkContext in AlertGallery.

2. **The alert surface sets `text-foreground`**
   — `RadixDialog.Content` has `text-foreground` class. Confirmed: dark text is correct (#f6f7f9) in dark mode.

3. **Reference gallery passes `portalClassName={Classes.DARK}` when `?theme=dark`**
   — Blueprint's `AlertProps` extends `OverlayLifecycleProps` (not `OverlayableProps`), so `portalClassName`
   isn't in the type. Workaround: spread `{...(portalClassName: dark ? Classes.DARK : undefined} as any)}`.
   At runtime the prop is forwarded via `...overlayProps` to `Dialog` which does accept it. TypeScript clean.

4. **Use `shadow-card-3` for the panel shadow**
   — confirmed: `shadow-card-3` class on the panel (inherited approach from Dialog).

## Current state

- **Alert:** Fully implemented and verified — `tools/compare.sh alert both`.
  - Light: 4/5 match · 1 differ (accepted panel box-shadow minor delta)
  - Dark: 3/5 match · 2 differ (all intentional documented deltas)
- **Build:** `pnpm build` green (tsc + vite); blueprint-reference `tsc --noEmit` green.
- **Phase 3 progress:** Dialog + Alert checked in ROADMAP.md; 2/8 Phase 3 components done.

## API

```tsx
<Alert
  open={open}                    // controlled open state
  defaultOpen={true}             // uncontrolled initial open
  onOpenChange={setOpen}         // called when open changes
  icon="warning-sign"            // string icon name OR ReactNode
  intent="danger"                // applied to confirm button + icon color
  confirmButtonText="Delete"     // @default "OK"
  cancelButtonText="Cancel"      // when provided, renders cancel button
  onConfirm={handleDelete}       // called on confirm click + dialog closes
  onCancel={() => setOpen(false)} // called on cancel; dialog closes automatically
  canEscapeKeyCancel={false}     // @default false (Blueprint default)
  canOutsideClickCancel={false}  // @default false (Blueprint default)
  dark={dark}                    // from DarkContext — required for portal dark-mode
>
  Are you sure you want to delete this item?
</Alert>
```

## Blueprint metrics matched

| Property | Value | Source |
|---|---|---|
| Panel max-width | 400px | `$pt-spacing * 100 = 4px * 100` |
| Panel padding | 20px all | `$pt-spacing * 5 = 4px * 5` |
| Icon size | 40px | `$pt-icon-size-large * 2 = 20px * 2` |
| Icon margin-right | 20px | `$pt-spacing * 5` |
| Icon color | intent color (or inherited) | `.bp6-alert-body .bp6-icon { color: intent }` |
| Footer direction | row-reverse | `flex-direction: row-reverse` |
| Footer margin-top | 12px | `$pt-spacing * 3` |
| Button gap | 8px | `margin-left: $pt-spacing * 2` |
| Cancel button style | solid default (no intent) | `<Button text={...} />` no variant/intent |

## Decisions made (and why)

### Icon data-compare placement
`data-compare="alert-icon"` goes directly on the `<Icon>` component (it receives HTML attrs via spanProps
spread), not on a wrapper span. This ensures the measured node has the correct computed `color` (intent-
colored) and `fontSize` (set via `className="text-[40px]"` matching Blueprint's CSS `font-size: 40px`).

### Custom ReactNode icon fallback
When `icon` is a ReactNode (not a string), we wrap it in a span with `data-compare="alert-icon"` and
`text-[40px]`. Less precise than string icons but handles the general case.

### Cancel button is solid (not minimal)
Blueprint's `<Button text={cancelButtonText} />` uses no variant — the default is solid. Using `minimal`
gives transparent background which doesn't match Blueprint's Cancel button appearance.

### Direct Radix implementation (not composing Dialog)
Alert is implemented directly on `@radix-ui/react-dialog` rather than composing our `Dialog` component
because Alert has very different panel layout (no header, custom body, custom footer, max-w-[400px] vs
500px). Composing Dialog would require overriding too much. The shared portal + dark-mode pattern is
copy-applied (clean, minimal duplication).

### Blueprint AlertProps type limitation for portalClassName
Blueprint's `AlertProps extends OverlayLifecycleProps` which doesn't include `portalClassName`. We
use `{...({ portalClassName: ... } as any)}` spread in the reference gallery. This is correct at runtime
(the prop is spread via `...overlayProps` to Blueprint's internal `Dialog` which accepts it) and keeps
the TypeScript build clean.

## Gotchas / things to know

### alert-cancel dark bg/color deltas are KNOWN-INTENTIONAL
- `color rgb(246,247,249)` vs `rgb(255,255,255)`: the dark-foreground decision (memory: dark-foreground-decision.md)
- `backgroundColor rgb(47,52,60)` vs `rgb(48,55,64)`: documented ≤4/ch dark button bg delta

### alert-panel dark boxShadow string-order
Dark shadow layers are identical but in different string order. Visual result is identical; harness does
string comparison. Accepted — same behavior as dialog-panel dark shadow.

### alert-panel light boxShadow base color
First layer: `rgba(0,0,0,0.102)` vs `rgba(20,20,20,0.102)`. Token uses pure black; Blueprint uses
`$black=#111418`. Sub-perceptual (≈2/ch effective). Same as dialog-panel accepted delta.

### Reference gallery: portalClassName not in AlertProps type
Blueprint's `Alert` doesn't expose `portalClassName` in its TypeScript type (it's in `OverlayableProps`
which `AlertProps` doesn't extend). But at runtime it works via `...overlayProps`. Use `as any` cast.

## Accepted Deltas

| Theme | Specimen | Property | Mithril | Blueprint | Why |
|---|---|---|---|---|---|
| Light | alert-panel | boxShadow (1st layer) | `rgba(0,0,0,0.102)` | `rgba(20,20,20,0.102)` | Token uses pure black; Blueprint uses `$black=#111418`. Sub-perceptual. |
| Dark | alert-panel | boxShadow | Identical layers, different order | Same layers, different order | String comparison artifact; visually identical. |
| Dark | alert-cancel | color | `rgb(246,247,249)` | `rgb(255,255,255)` | Intentional dark-foreground decision (#f6f7f9 not white). |
| Dark | alert-cancel | backgroundColor | `rgb(47,52,60)` | `rgb(48,55,64)` | Documented ≤4/ch dark button bg delta. |

## Specimens registered (both galleries, 5 keyed)

| key | description |
|---|---|
| `alert-panel` | The `.bp6-alert` panel (Radix Dialog.Content) |
| `alert-icon` | The large icon element (40px, intent-colored) |
| `alert-footer` | The `.bp6-alert-footer` |
| `alert-confirm` | Confirm button (right-most, uses intent) |
| `alert-cancel` | Cancel button (left of confirm, solid default) |

## compare.sh results

```
alert · light:  4 match · 1 differ  — 1 accepted sub-perceptual delta (panel box-shadow base color)
alert · dark:   3 match · 2 differ  — both KNOWN-INTENTIONAL (dark-foreground + button bg, same as Dialog)
```

## New dep added

None — reuses `@radix-ui/react-dialog` via the existing install.

## Next steps

> Next item: **Drawer** (Phase 3 #3) — Overlay-based slide-in panel.
> Use the same portal + dark-mode pattern (DarkContext + wrapper div with dark class).
> Blueprint's Drawer uses an Overlay (backdrop + panel). Panel slides in from an edge.

1. **Drawer** — `src/components/ui/drawer.tsx`. Blueprint: `packages/core/src/components/drawer/`.
   - Drawer is an Overlay-based slide-in panel with optional title/icon/close, body, and footer.
   - Props: `isOpen`, `position` (top/right/bottom/left), `size` (sm/md/lg/full), `title`, `icon`, `className`, `onClose`, etc.
   - Same data-compare pattern: open by default in gallery; use DarkContext; reference with portalClassName dark fix.
   - Radix doesn't have a Drawer primitive — use `@radix-ui/react-dialog` or build on `vaul` (a Radix-based drawer).
   - No new Radix dep needed if using Dialog.Root in a slide-in variant; or add `vaul` if it helps.

## How to resume

```bash
# Check branch
git branch --show-current  # should be phase-3-overlays

# Both servers
pnpm dev                                              # :5173
cd tools/blueprint-reference && pnpm dev              # :5174

# Verification
tools/compare.sh alert both
```

- Relevant files:
  - `src/components/ui/alert.tsx` (new — Alert)
  - `src/App.tsx` (AlertGallery added + COMPONENTS entry)
  - `tools/blueprint-reference/src/App.tsx` (AlertGallery added + COMPONENTS entry + Alert import)
  - `docs/ROADMAP.md` (Alert checked)
