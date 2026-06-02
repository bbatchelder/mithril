# 0068 — a11y pass #3: NumericInput spinbutton, Alert alertdialog, Popover hover

- **Date:** 2026-05-29
- **Branch:** `a11y-behavior-gaps` (continues from 0067)
- **Focus:** The three small attribute/behavior fixes that remained in `comparison-vs-blueprint.md` §1.
  **This closes all of §1.**

## TL;DR

- **NumericInput** input is now `role="spinbutton"` with `aria-valuenow/valuemin/valuemax/valuetext`.
- **Alert** is now `role="alertdialog"` (was `dialog`) — it's a modal that interrupts to confirm/warn.
- **Popover** gained an optional `interactionKind="hover"` mode (Radix is click-only), with
  `hoverCloseDelay`. Default stays `"click"` — fully unchanged.
- **49 tests** total (9 new). All `compare.sh` targets identical to baseline (verified by stashing).

## NumericInput (`numeric-input.tsx`)
Added to the `<InputGroup>` input: `role="spinbutton"`, `aria-valuenow` (the parsed number, omitted when
empty/non-numeric), `aria-valuemin={min}`, `aria-valuemax={max}`, `aria-valuetext` (the display string).
Pure attribute add — `compare.sh numeric-input both` stays **7·0**. 4 tests (value/bounds, empty omits
valuenow, keyboard step updates valuenow, clamps at max).

## Alert (`alert.tsx`)
`RadixDialog.Content` now gets `role="alertdialog"` (Radix's default `dialog` is overridden via prop
pass-through). 2 tests (is alertdialog / not dialog; confirm button fires onConfirm). The `4 match · 1
differ` on `compare.sh alert` is pre-existing (panel shadow-color + 2px confirm-button width) — verified by
stashing; a `role` change can't move pixels.

## Popover (`popover.tsx`) — hover mode
New props: `interactionKind?: "click" | "hover"` (default `"click"`), `hoverCloseDelay?: number`
(default 100). In hover mode:
- Renders `children` as a Radix **Anchor** (not Trigger) so click never toggles; opens on pointer enter,
  closes on leave after the grace delay.
- Trigger mouse handlers are merged onto `children` via `cloneElement` (`composeHandlers` preserves any
  the consumer set). Content also gets enter/leave handlers so the pointer can travel trigger→panel
  without closing. Escape still closes (synced via `handleRootOpenChange`).
- Works controlled (`open`) or uncontrolled (internal `hoverOpen`).
- **Click mode is byte-identical to before** — the hover code paths are gated on `isHover`. `compare.sh
  popover both` stays at its pre-existing `0 match · 2 differ` baseline (arrow box-sizing 30×11 vs 30×30
  per [[radix-arrow-box-sizing]], shadow color, minWidth:auto) — verified by stashing. Overall SSIM
  0.997 / 0.972.
- 3 tests (click toggles; hover opens/closes; trigger→panel keeps open).

## Test infra
Added jsdom polyfills to `src/test/setup.ts` (Radix/Floating-UI need them): `ResizeObserver`,
`Element.prototype.hasPointerCapture/setPointerCapture/releasePointerCapture/scrollIntoView`. Without
`ResizeObserver`, Radix Popover positioning throws in jsdom. Note for test authors: portaled content sits
under a `pointer-events:none` wrapper, so hover/click tests on popover/menu content need
`userEvent.setup({ pointerEventsCheck: 0 })`.

## Verification
`pnpm test` → **49 passed** (11 files); `pnpm build` ✓; `pnpm typecheck:test` ✓. `compare.sh`
numeric-input 7·0; alert / popover unchanged from baseline (pre-existing deltas only).

## §1 is CLOSED
Every accessibility/behavior gap from `comparison-vs-blueprint.md` §1 / [[a11y-gaps-vs-blueprint]] is now
addressed across handoffs 0066–0068, each with Vitest coverage:
Tabs, Menu roleStructure, Select/Suggest/MultiSelect/Omnibar combobox, ContextMenu, NumericInput, Alert,
Popover. Remaining a11y items are **out of original scope**: ContextMenu/Menu **submenus** (never
implemented) and a real **Hotkeys engine** (display-only) — both are *completeness* gaps (§2), not §1.

## Branch commits
`1142448` Tabs+tests · `001b785` Menu+Select · `786ebed` Suggest/MultiSelect/Omnibar · `554d26b`
ContextMenu · (this) NumericInput/Alert/Popover + handoff.

## Next steps
Open the PR for `a11y-behavior-gaps` → `public-readiness` (or wherever the user wants it merged), then
update [[a11y-gaps-vs-blueprint]] / `comparison-vs-blueprint.md` to reflect that §1 is closed. The §2
completeness gaps (Table2, hotkey engine, submenus, MultistepDialog/ButtonGroup/AnchorButton) remain.
