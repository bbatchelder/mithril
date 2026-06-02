# 0069 — a11y remediation plan (pick-up doc for the rest of accessibility)

- **Date:** 2026-05-29
- **Branch:** `a11y-behavior-gaps` (STAYS OPEN — do not merge yet; continues from 0068 @ `89b73be`)
- **Status:** §1 (the keyboard/ARIA audit) is CLOSED. This doc captures everything *still* needed to
  call the library genuinely accessible, so a later session can resume without re-discovering it.

## Where we are

Handoffs 0066–0068 closed the entire **§1** audit from `docs/comparison-vs-blueprint.md` /
[[a11y-gaps-vs-blueprint]] — the verified keyboard/ARIA gaps in the hand-rolled components — each with
Vitest coverage (49 tests, zero visual regression):

- Tabs (rebuilt on `@radix-ui/react-tabs`), Menu `roleStructure`, Select/Suggest/MultiSelect/Omnibar
  combobox ARIA (hand-rolled on `useQueryList`), ContextMenu (real Radix items), NumericInput spinbutton,
  Alert alertdialog, Popover hover mode.

**But "§1 closed" ≠ "fully accessible."** §1 was a *specific catalogue of keyboard/ARIA gaps*, not a WCAG
audit. The items below are confirmed-open or unverified. **The library is NOT yet WCAG-clean; do not claim
it is until this doc is worked through.**

## Test/verify infrastructure already in place (use it)

- `pnpm test` — Vitest + Testing Library + jsdom. Tests live in `src/components/ui/__tests__/`.
  `pnpm typecheck:test` type-checks them. `src/test/setup.ts` has jsdom polyfills (ResizeObserver,
  pointer-capture, scrollIntoView) — extend it as needed.
- Vitest proves ARIA *wiring* + keyboard handling, NOT lived AT behavior, contrast, or focus *visibility*.
- Gotchas (carry forward): portaled content sits under a `pointer-events:none` wrapper →
  `userEvent.setup({ pointerEventsCheck: 0 })`; Suggest/MultiSelect open on **focus** (click toggles them
  shut); type into derived-value inputs with `user.type`, plain inputs filter with `user.keyboard`;
  clicking a portaled option races blur-close (assert via controlled state instead).
- **Not yet present:** any automated `axe` pass; contrast checks; reduced-motion handling.

## P0 — Concrete confirmed gaps (small, do these first, each with tests)

### P0.1 — Combobox inputs have no accessible name
Select / Suggest / MultiSelect filter inputs rely on `placeholder` only (e.g. `"Filter..."`) — a
placeholder is NOT an accessible name (WCAG 4.1.2 / 2.4.6). Omnibar's *dialog* has `aria-label="Omnibar"`
but its input is still placeholder-only.
- **Fix:** add an `aria-label` (and/or accept a `label`/`aria-label` prop) to each combobox input.
  Default something sensible (e.g. `aria-label={placeholder}` as a floor, but prefer a real label prop).
- **Files:** `select.tsx` (filter `InputGroup` ~L566), `suggest.tsx` (ghost input), `multi-select.tsx`
  (ghost input ~L534), `omnibar.tsx` (search `InputGroup` ~L307).
- **Test:** `getByRole("combobox", { name: ... })` resolves a non-empty accessible name.

### P0.2 — Focus-ring suppression
`focus-visible:outline-none` / `focus:outline-none` appears in `menu.tsx`, `omnibar.tsx`, `slider.tsx`
(found via `grep -rl 'focus-visible:outline-none\|focus:outline-none' src/components/ui/*.tsx`).
- **Slider thumb** losing a visible focus indicator is a likely WCAG 2.4.7 failure — highest priority here.
- **Omnibar input** suppresses its focus outline.
- **MenuItem** suppresses it but compensates with an active background (lower risk; still review).
- **Fix:** replace blanket `outline-none` with a real `focus-visible` ring (Blueprint uses
  `$pt-focus-indicator-color`; there's a `focus-outline` mixin in the Blueprint clone). Make sure the
  visual harness still matches the *unfocused* state (it should — focus rings only show on `:focus-visible`).
- **Test:** harder to unit-test; verify via the axe/manual pass in P1. At minimum assert the class is gone.

### P0.3 — `prefers-reduced-motion` not respected
We added scale/fade animations (Popover open/close `bp-popover-animated*` in `globals.css`, others) with
no reduced-motion fallback — WCAG 2.3.3.
- **Fix:** add a global `@media (prefers-reduced-motion: reduce)` block in `src/styles/globals.css` that
  neutralizes transitions/animations (or gate the `bp-popover-animated*` keyframes on it). Tailwind's
  `motion-reduce:` variant can cover utility-driven animations.
- **Verify:** DevTools "Emulate prefers-reduced-motion" + visual check.

## P1 — Audit-driven (run the audit, then fix what it finds)

### P1.1 — Automated axe + contrast + focus pass over the gallery
No automated a11y checks exist. Run a real audit over `:5173` (both themes):
- Use the `chrome-devtools-mcp:a11y-debugging` skill (axe-core, ARIA, focus, contrast, tap targets), or
  drive `axe-core` via the chrome MCP over each `?component=<id>` view.
- **Color contrast (WCAG AA):** explicitly check — "matches Blueprint's palette" is NOT proof of AA.
  Pay attention to muted text (`--foreground-muted` / `#abb3bf` carets), disabled text, intent-on-intent.
- **Touch targets (2.5.8):** stepper buttons, tag remove ✕, small controls.
- Capture findings into a `P1.x` checklist and remediate. Consider adding a lightweight `vitest-axe`
  smoke test per component so contrast/role regressions are caught in CI going forward.

### P1.2 — Real screen-reader smoke (VoiceOver/NVDA)
jsdom can't validate announcements. Do a manual SR pass on the high-traffic widgets (combobox family,
Tabs, Menu/ContextMenu, Dialog/Drawer/Alert) — confirm role/name/state/value are announced sensibly,
active-descendant moves are read, and dialogs trap/return focus. Record results in this branch.

## P2 — Functional gaps with a11y impact (larger; overlap §2 completeness)

### P2.1 — Submenus
`MenuItem` renders a submenu caret (`hasSubmenu`) that opens **nothing** — a misleading affordance.
Either implement real submenus (Radix `ContextMenu.Sub` / `DropdownMenu.Sub` via the slot mechanism added
in 0067 — see `MenuItemSlotContext` in `menu.tsx`) or drop the caret until it works.

### P2.2 — Hotkeys engine
`Hotkeys`/`KeyCombo` is display-only (no key binding/dispatch). A real `useHotkeys` engine is both a
completeness (§2) and an a11y/operability item. Larger effort; scope separately.

## Suggested order when resuming
1. P0.1 → P0.2 → P0.3 (small, self-contained, testable) — commit per fix.
2. P1.1 audit → triage findings → fix (contrast is the likely big one). Add `vitest-axe` smokes.
3. P1.2 SR smoke.
4. P2.1 / P2.2 as separate efforts (they're really §2 completeness).
5. When P0+P1 are clean: update [[a11y-gaps-vs-blueprint]] and `comparison-vs-blueprint.md` (§1 *and* the
   WCAG posture), then open the PR for `a11y-behavior-gaps`.

## Branch state
`a11y-behavior-gaps` @ `89b73be`, pushed. 5 feature commits (Tabs+tests, Menu+Select, Suggest/Multi/Omni,
ContextMenu, NumericInput/Alert/Popover) + handoffs 0066–0069. Working tree clean except this handoff.
**Leave the branch open** per the user's instruction — there is no PR yet.

## Don't-forget facts
- `comparison-vs-blueprint.md` / `blueprint-parity-roadmap.md` / README were committed by the user as
  `cbf7d41` on this branch (not on `public-readiness`). They state "0 tests" and the §1 gaps as open —
  **update them** once this remediation lands so the public appraisal reflects reality.
- Visual fidelity is the gate for *looks* (`tools/compare.sh`); a11y fixes here are ARIA/behavior and must
  stay visually neutral (every fix so far was verified against baseline by stashing). Keep that discipline.
