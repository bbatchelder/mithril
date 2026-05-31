# 0070 — a11y WCAG remediation (P0 + P1 audit & fixes)

- **Date:** 2026-05-29
- **Branch:** `a11y-behavior-gaps` (STAYS OPEN — still no PR; continues from 0069 @ `e0964b7`)
- **Status:** The P0 and P1 items from handoff 0069 are **DONE**. The library is now WCAG-clean for the
  audited surface (keyboard/ARIA + axe over all 56 components in both themes, including open overlays),
  with two documented residuals (see below). §2 completeness gaps (Hotkeys engine, submenus) remain.

## What shipped (3 commits this session)

1. `0722b83` — **P0**: combobox accessible names; Slider focus-visible ring; `prefers-reduced-motion`
   reset (Spinner exempt via `bp-spinner-animation` hook). Also fixed a pre-existing test flake by
   running Vitest files sequentially (`fileParallelism: false`) + `asyncUtilTimeout: 5000`.
2. `90a386b` — **P1 component ARIA**: CardList `role="listitem"` children; TimePicker named spinbutton
   segments + AM/PM select + aria-hidden arrows; Slider forwards `aria-label` to the Radix Thumb.
3. `fe94c53` — **P1 open-overlay ARIA + Button + gallery labels**: Button loading keeps its name
   (`opacity-0` not `invisible`, + `aria-busy`); MenuItem `listoption` options are non-interactive
   `<div>`s (click handler on the `<li>`); Popover `ariaLabel`/`ariaLabelledby` → its dialog panel;
   Select trigger is the real button (clone, not a wrapper div); Select/Suggest/MultiSelect name their
   popover panels; ~35 gallery demo instances labelled. Added `axe-core` dev dep for the audit.
4. (this doc + docs/memory updates) — `comparison-vs-blueprint.md` §1/§3 rewritten to reflect closure;
   contrast posture documented; agent memory updated.

## How it was audited (repeatable — see [[axe-audit-via-local-server]])

axe-core served from the Vite dev server (`/@fs/…/node_modules/axe-core/axe.min.js` — the CDN is
sandbox-blocked), driven via chrome-devtools MCP. Looped all 56 hash routes in both themes, **and**
re-ran with overlays OPEN (dialogs, drawer, popover, menu dropdown, context-menu, alert, the combobox
listboxes, date-picker panels). Excluded `page-has-heading-one` + `heading-order` (dev-harness
document-outline artifacts — components emit correct semantic headings: Section→h6, Callout→h5,
NonIdealState→h4, matching Blueprint) and triaged `color-contrast` separately.

Result: **zero axe violations** across all components (closed + open) except the two residuals below.
`pnpm build` green, `pnpm test` 53/53 stable, `tools/compare.sh` neutral on every touched component
(option specimens SSIM ≥0.984; all computed-style diffs unchanged from baseline).

## Two documented residuals (conscious, not blocking)

1. **`aria-allowed-attr` on Suggest/MultiSelect trigger wrapper divs.** Radix `Popover.Trigger` stamps
   `aria-haspopup`/`aria-expanded`/`aria-controls` onto the wrapper `<div>`, which is invalid on a
   roleless div — while the *inner* combobox input already carries the authoritative combobox ARIA. The
   clean fix is `anchorOnly` (Radix Anchor adds no trigger ARIA), but it regressed Suggest's
   focus-driven filtering (Anchor's open-autofocus steals focus from the input), so it's left as-is.
   Select avoided this entirely by making its single Button the direct trigger. Revisit if Suggest's
   focus/open is ever refactored.
2. **Color contrast (Blueprint-parity deltas).** Palette is a 1:1 Blueprint port. Disabled/inactive
   text is sub-4.5:1 but **WCAG-exempt** (1.4.3). The **file-input prompt** ("Choose file…", 2.45:1
   light / 3.75:1 dark) and a **Tree muted label** (~4.2:1, 12px) are sub-AA on *non-disabled* text but
   match Blueprint exactly — fixing them breaks the fidelity gate, so they're documented deltas
   (consumers can darken `--foreground-muted` / the file-input prompt color). Non-text contrast (1.4.11)
   of muted icon carets is likewise Blueprint-faithful and not chased.

## Still genuinely open (§2 completeness — separate efforts)

- **Hotkeys engine** — `Hotkeys`/`KeyCombo` is display-only; no key binding/dispatch (Blueprint has
  `useHotkeys`). Both a completeness and an operability item.
- **Submenus** — `MenuItem`'s `hasSubmenu` caret opens nothing. Implement via Radix `*.Sub` through the
  `MenuItemSlotContext` mechanism (0067), or drop the caret.

## Optional follow-ups (not done)

- A `vitest-axe` smoke test per component would lock role/name/ARIA regressions into CI (jsdom can't do
  contrast/layout, so it complements — not replaces — the chrome axe sweep). Skipped to avoid a new dep;
  the 53 existing tests already assert the key ARIA wiring.
- Real screen-reader pass (VoiceOver/NVDA) on the high-traffic widgets — jsdom + axe can't validate
  lived announcements. (Handoff 0069 P1.2.)

## Branch state

`a11y-behavior-gaps`, 4 commits beyond 0069's `e0964b7` (3 code + this handoff). **Leave open** per the
user's standing instruction — no PR yet. When opening the PR, the working tree must be clean and
`pnpm build` + `pnpm test` + the compare harness all green (they are).
