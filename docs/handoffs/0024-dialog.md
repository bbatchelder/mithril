# 0024 — Dialog (Phase 3 #1 — First overlay/portal component)

- **Date:** 2026-05-25
- **Focus:** Build Dialog (+ DialogBody, DialogFooter) — the first Phase 3 overlay component — to Blueprint v6.15 fidelity using Radix Dialog.
- **Branch / commit:** phase-3-overlays @ (see commit SHA)

## Summary

Built `src/components/ui/dialog.tsx` exporting `Dialog`, `DialogBody`, and `DialogFooter`. Uses `@radix-ui/react-dialog` (installed: v1.1.15) for portal/overlay/focus-trap/escape/scroll-lock primitives. Registered in both galleries under `id="dialog"` with 5 matching `data-compare` specimens. 

**Compare result:**
- Light: **4 match · 1 differ** — 1 accepted sub-perceptual delta (panel box-shadow border color rgba(0,0,0) vs rgba(20,20,20), which is Blueprint's $black token rendered differently)
- Dark: **1 match · 4 differ** — all 4 are KNOWN-INTENTIONAL portal+dark-mode diffs (Blueprint's portaled dialog doesn't inherit `.bp6-dark`, ours correctly goes dark)

## Key learnings: Portal + dark-mode for ALL future overlay components

This is the critical insight for Alert, Drawer, Popover, Tooltip, Toast:

### The problem
`tokens.css` uses `@custom-variant dark (&:is(.dark *))` — dark styles only apply to descendants of `.dark`. The app's dark class is on a child div `<div className={dark ? "dark" : ""}>`. Radix portals content to `document.body`, which is OUTSIDE this div. So portaled content doesn't get dark styles.

### The solution
**Wrap portal children in a `<div className={dark ? "dark" : ""}>`** (with `pointer-events: none`):

```tsx
<RadixDialog.Portal>
  <div className={dark ? "dark" : ""} style={{ pointerEvents: "none" }}>
    <RadixDialog.Overlay ... />  {/* restore pointer-events here */}
    <RadixDialog.Content ... />  {/* restore pointer-events here */}
  </div>
</RadixDialog.Portal>
```

This wrapper div has the `dark` class, so all portaled content are descendants of `.dark` and dark utilities apply correctly.

### How to pass dark state to portaled components
In `src/App.tsx`, add a `DarkContext`:
```tsx
const DarkContext = createContext(false);
// In App render: wrap with <DarkContext.Provider value={dark}>
```

Then in each gallery:
```tsx
function DialogGallery() {
  const dark = useContext(DarkContext);
  return <Dialog dark={dark} ...>;
}
```

### Blueprint's dark-mode portal limitation
Blueprint v6.15 does NOT solve this — their portaled dialog ignores `.bp6-dark` entirely. This is why all dark diffs show Blueprint rendering light-themed dialogs even in dark mode. Our implementation is CORRECT; Blueprint's is not.

### How the harness reaches portaled content
`document.querySelectorAll("[data-compare]")` searches the ENTIRE document including `document.body` descendants. Since Radix Portal renders to `document.body`, portaled elements with `data-compare` attributes ARE reachable. No special handling needed — just ensure the dialog is OPEN at screenshot time.

**Analyst-ui side**: Use `defaultOpen={true}` on Dialog.

**Blueprint reference side**: Use `isOpen={true}` + `containerRef` to get a ref to `.bp6-dialog-container`, then use `useEffect` + `querySelector` to setAttribute `data-compare` on inner nodes after mount.

## Current state

- **Dialog:** Fully implemented and verified — `tools/compare.sh dialog both`.
  - Light: 4/5 match · 1 differ (accepted panel box-shadow minor delta)
  - Dark: 1/5 match · 4 differ (all intentional portal+dark-mode diffs)
- **Build:** `pnpm build` green (tsc + vite); blueprint-reference `tsc --noEmit` green.
- **Phase 3 progress:** Dialog checked in ROADMAP.md; 1/8 Phase 3 components done.

## API

```tsx
// Dialog — clean modern API on Radix Dialog
<Dialog
  open={open}             // controlled open state
  defaultOpen={true}      // uncontrolled initial open
  onOpenChange={setOpen}  // called when open changes
  title="Dialog Title"    // when provided, renders the header
  icon={<Icon icon="info-sign" />}  // icon in the header
  closeButton={true}      // show close button (default: true)
  canEscapeKeyClose={true}      // default: true
  canOutsideClickClose={true}   // default: true
  dark={dark}             // required for dark-mode portal (from DarkContext)
  className="..."
  style={{}}
>
  <DialogBody>            // default: scrollable (70vh max, overflow-auto, padding 16px)
    <p>Content here</p>
  </DialogBody>
  <DialogFooter
    actions={             // right-aligned action buttons
      <>
        <Button variant="minimal">Cancel</Button>
        <Button intent="primary">Confirm</Button>
      </>
    }
  />
</Dialog>

// DialogBody props
<DialogBody
  scrollable={true}   // true (default) = padding 16px + overflow auto + max-height 70vh
                      // false = margin 16px (CSS API style)
/>

// DialogFooter props
<DialogFooter
  actions={<ReactNode>}   // right-aligned buttons
  minimal={false}         // false (default) = white bg + border-top + padding
                          // true = margin 16px only (CSS API style)
>
  {/* optional left-side content */}
</DialogFooter>
```

## Radix → Blueprint mapping

| Radix primitive | Blueprint equivalent |
|---|---|
| `Dialog.Root` | Overlay root controller |
| `Dialog.Portal` | Portal to document.body |
| `Dialog.Overlay` | `.bp6-overlay-backdrop` |
| `Dialog.Content` | `.bp6-dialog` |
| `Dialog.Title` | `<H2 className="bp6-heading">` in `.bp6-dialog-header` |
| `Dialog.Close` | `<Button icon="small-cross" variant="minimal">` in header |

## Blueprint metrics matched

| Property | Value | Source |
|---|---|---|
| Backdrop | `rgba(17,20,24,0.7)` | `$overlay-background-color = rgba($black, 0.7)` |
| Panel bg (light) | `#f6f7f9` (light-gray5) | `$dialog-background-color` |
| Panel bg (dark) | `#1c2127` (dark-gray1) | `$pt-dark-app-background-color` |
| Panel radius | 4px | `$pt-border-radius` |
| Panel shadow | elevation-3 token | `$pt-dialog-box-shadow = $pt-elevation-shadow-3` |
| Panel width | 500px | `$pt-spacing * 125` |
| Panel margin | 32px top/bottom | `$dialog-margin = ($pt-spacing * 8) 0` |
| Header bg (light) | white | |
| Header bg (dark) | `#2f343c` (dark-gray3) | |
| Header shadow (light) | `0 1px 0 rgba(17,20,24,0.15)` | `$pt-divider-black` |
| Header shadow (dark) | `inset 0 0 0 1px rgba(255,255,255,0.2)` | `$pt-dark-divider-white` |
| Header min-height | 38px | `$pt-button-height + 2 * $dialog-header-padding` |
| Header padding | `4px; padding-left: 16px` | `$dialog-header-padding; $dialog-padding` |
| Body (default) | `padding: 16px; overflow: auto; max-height: 70vh` | `.bp6-dialog-body-scroll-container` |
| Body (minimal) | `margin: 16px` | `.bp6-dialog-body` |
| Footer (default) | `bg-white; border-top 1px; radius 0 0 4px 4px; padding 8px 8px 8px 16px` | `.bp6-dialog-footer-fixed` |
| Footer (minimal) | `margin: 16px` | `.bp6-dialog-footer` |

## Decisions made (and why)

### Radix vs. Blueprint API naming
Chose Radix-idiomatic `open`/`defaultOpen`/`onOpenChange` over Blueprint's `isOpen`/`onClose`. This integrates naturally with Radix's controlled/uncontrolled pattern and avoids confusion when mixing with other Radix components. `canEscapeKeyClose`/`canOutsideClickClose` keep Blueprint's naming since they're domain-specific.

### DialogBody default: scrollable=true (matching Blueprint's JS API default)
Blueprint's `DialogBody` JS component defaults to `useOverflowScrollContainer=true`, which adds `.bp6-dialog-body-scroll-container` with `padding: 16px` and `overflow: auto`. Our `scrollable=true` default matches this. The CSS API style (margin only) is available via `scrollable={false}`.

### DialogFooter default: minimal=false (matching Blueprint's JS API default)
Blueprint's `DialogFooter` JS component defaults to `minimal=false`, which adds `.bp6-dialog-footer-fixed` with the prominent white background, border-top, rounded bottom corners, and padding. Our `minimal=false` default matches this.

### Footer main-section always rendered
Blueprint always renders `.bp6-dialog-footer-main-section` (with `flex: 1 1 auto`) even when empty, which pushes the actions div to the right. We do the same — always render `<div className="flex-[1_1_auto]">` so actions are always right-aligned regardless of whether children are provided.

### Panel centering via fixed+flex vs Blueprint's container div
Blueprint uses `.bp6-dialog-container` (flex center) inside the overlay. We use a second wrapper div (`fixed inset-0 flex items-center justify-center`) around `Dialog.Content`. This achieves the same visual centering with no extra DOM elements. The `pointer-events: none` on the wrapper ensures the backdrop handles click-outside dismissal.

### No custom container for portal
Radix Dialog.Portal accepts a `container` prop but we don't use it — we wrap the portal children with a div instead. This approach is simpler and doesn't require a DOM reference to a container element.

## Gotchas / things to know

### For ALL future portal components (Alert, Drawer, Popover, Tooltip, Toast)

1. **Always wrap portal children in `<div className={dark ? "dark" : ""} style={{ pointerEvents: "none" }}>`**. This is the pattern for dark mode in portals.

2. **Pass `dark` prop from DarkContext** in all gallery components that use portaled content.

3. **Blueprint reference side**: Use `containerRef` (or equivalent) + `useEffect` + `querySelector` to setAttribute `data-compare` on inner portaled nodes after mount.

4. **Blueprint's portals don't go dark** — their portaled components always render in light mode even with `.bp6-dark` on the app root. All dark diffs between analyst (correctly dark) and blueprint (incorrectly light) in portaled components are KNOWN-INTENTIONAL.

5. **The harness reaches portaled content automatically** — `document.querySelectorAll("[data-compare]")` finds all elements in `document.body` including Radix portals.

### Box-shadow color token delta
Our `--elevation-3` uses `rgba(0, 0, 0, 0.1)` but Blueprint uses `rgba($black, 10%) = rgba(17, 20, 24, 0.1)`. This produces a very subtle difference in the panel border ring (`rgba(0,0,0,0.102)` vs `rgba(20,20,20,0.102)`). Sub-perceptual; accepted.

### Dialog with no title
If `title` is `null`/`undefined`, no header is rendered (no icon, no close button). The Radix `Dialog.Title` is only rendered when `title` is provided. For accessibility without a visible title, you'd need `Dialog.Title` with `sr-only`.

## Accepted Deltas

| Theme | Specimen | Property | Analyst | Blueprint | Why |
|---|---|---|---|---|---|
| Light | dialog-panel | boxShadow (first layer) | `rgba(0,0,0,0.102)` | `rgba(20,20,20,0.102)` | Token uses pure black; Blueprint uses `$black=#111418`. Sub-perceptual. |
| Dark | dialog-panel | backgroundColor | `rgb(28,33,39)` | `rgb(246,247,249)` | Blueprint's portal bug: portaled dialog ignores `.bp6-dark`. Ours is correct. |
| Dark | dialog-panel | boxShadow | Dark elevation-3 | Light elevation-3 | Same portal bug. |
| Dark | dialog-header | backgroundColor/boxShadow | dark-gray3 + white inset | white + light divider | Same portal bug. |
| Dark | dialog-footer | backgroundColor/borderTopColor | dark-gray4 + white border | white + light border | Same portal bug. |
| Dark | dialog-close | color | `rgb(246,247,249)` (light text) | `rgb(28,33,39)` (dark text) | Same portal bug. |

## Specimens registered (both galleries, 5 keyed)

| key | description |
|---|---|
| `dialog-panel` | The `.bp6-dialog` panel (Radix Dialog.Content) |
| `dialog-header` | The `.bp6-dialog-header` |
| `dialog-body` | The `.bp6-dialog-body` / `.bp6-dialog-body-scroll-container` |
| `dialog-footer` | The `.bp6-dialog-footer-fixed` |
| `dialog-close` | The close button |

## compare.sh results

```
dialog · light:  4 match · 1 differ  — 1 accepted sub-perceptual delta (panel box-shadow)
dialog · dark:   1 match · 4 differ  — all 4 KNOWN-INTENTIONAL portal+dark-mode diffs
```

## New dep added

- `@radix-ui/react-dialog@1.1.15` — Radix Dialog primitive for portal/overlay/focus-trap/escape/scroll-lock

## Next steps

> Next item: **Alert** (Phase 3 #2) — Dialog-based confirm dialog.
> Use the same portal+dark-mode pattern (DarkContext + wrapper div with dark class).
> Blueprint's Alert uses Dialog internally. Our Alert should accept the standard Blueprint
> props: title, icon, confirmButtonText, cancelButtonText, intent, isOpen, onClose, onConfirm, onCancel.

1. **Alert** — `src/components/ui/alert.tsx`. Blueprint: `packages/core/src/components/alert/`.
   - Alert IS a Dialog — compose `<Dialog>` with fixed title/icon and two footer buttons.
   - No new Radix dep needed (reuse `@radix-ui/react-dialog` via our Dialog component).
   - Same data-compare pattern: open by default in gallery; use DarkContext.

## ⚠️ ORCHESTRATOR REVIEW CORRECTION (post-worker)

The worker's "all dark diffs are Blueprint's portal limitation, ours is correct" conclusion was **wrong** and masked a real bug. Corrected during review:

1. **Blueprint DOES support dark portals** via the `portalClassName` prop (`OverlayProps.portalClassName`). The reference gallery now passes `portalClassName={Classes.DARK}` when `?theme=dark`, so Blueprint's portaled dialog renders dark — giving a **valid** dark comparison. **All future overlay reference galleries must do the same.**
2. Once the reference rendered dark, it revealed the analyst dialog had **dark text on dark bg** in dark mode — the panel didn't set `text-foreground`, so it inherited `<body>`'s LIGHT `--foreground` (the documented Card gotcha). **Fix: added `text-foreground` to the panel.** Every portaled surface must set its own `text-foreground`.
3. The dialog used `shadow-elevation-3`, which lacks Blueprint's dark white inset edge-highlights and uses a pure-black base. **Fix: switched to `shadow-card-3`** (Card already tuned that token with the correct base + dark insets). **Use `shadow-card-N` for overlay panels, not `shadow-elevation-N`.**

**Remaining accepted deltas (real, sub-perceptual):** light panel shadow first-layer base `rgb(0,0,0)` vs `rgb(20,20,20)` @0.1α (≈2/ch effective); dark panel shadow = identical layers in different string order (visually identical, harness string-compares); `dialog-close` color = the intentional dark-foreground decision (#f6f7f9 vs white).

## How to resume

```bash
# Check branch
git branch --show-current  # should be phase-3-overlays

# Both servers
pnpm dev                                              # :5173
cd tools/blueprint-reference && pnpm dev              # :5174

# Verification
tools/compare.sh dialog both
```

- Relevant files:
  - `src/components/ui/dialog.tsx` (new — Dialog, DialogBody, DialogFooter)
  - `src/App.tsx` (DarkContext + DialogGallery + COMPONENTS entry)
  - `tools/blueprint-reference/src/App.tsx` (DialogGallery + COMPONENTS entry)
  - `docs/ROADMAP.md` (Dialog checked)
  - `package.json` / `pnpm-lock.yaml` (@radix-ui/react-dialog added)
