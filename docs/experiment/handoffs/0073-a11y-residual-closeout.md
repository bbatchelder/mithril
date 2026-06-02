# 0073 — a11y residual close-out: combobox anchor ARIA + contrast verdict

- **Date:** 2026-05-31
- **Branch:** `a11y-behavior-gaps` (STAYS OPEN — still no PR; continues from 0072)
- **Status:** Took a fresh look at the **two documented a11y residuals** from 0070. **Residual 1
  (aria-allowed-attr on Suggest/MultiSelect triggers) is now FIXED cleanly.** Residual 2 (color
  contrast) is confirmed a faithful Blueprint port with **no clean fix that preserves the fidelity
  gate** — left as a conscious delta (now better documented + consumer-overridable).

## Residual 1 — FIXED: combobox trigger `aria-allowed-attr`

**Problem (0070):** Radix `Popover.Trigger` stamps `aria-haspopup`/`aria-expanded`/`aria-controls`
onto the roleless wrapper `<div>` that Suggest/MultiSelect anchor to — invalid on a div with no role
(axe `aria-allowed-attr`, critical). The inner combobox `<input>` already carried the authoritative
ARIA. 0070 noted the clean fix was `anchorOnly` but that bare `anchorOnly` "regressed focus-driven
filtering," so it was left documented.

**Root cause of the old regression (settled by reading Radix source):** the popover Content's
`FocusScope` runs a mount-autofocus (`@radix-ui/react-focus-scope` index.mjs L74–83): if focus isn't
already inside the portaled panel, it focuses the panel's first tabbable or the container. Bare
`anchorOnly` didn't change that — opening the listbox moved focus off the input → type-to-filter broke.
The earlier attempt only swapped Trigger→Anchor; it never stopped the autofocus.

**Fix (clean, two parts):**
1. **New `Popover` prop `autoFocusContent` (default `true`).** When `false`, Content gets
   `onOpenAutoFocus={(e) => e.preventDefault()}`. Per FocusScope L80 (`if (!mountEvent.defaultPrevented)`),
   preventing default short-circuits **all** mount focus movement — deterministic and
   browser-independent (not reliant on "the container happens to be unfocusable", which was the jsdom-only
   accident the old attempt leaned on). `popover.tsx`.
2. **Suggest + MultiSelect now use `anchorOnly` + `autoFocusContent={false}`.** `Popover.Anchor` adds
   **no** trigger ARIA (verified in Radix `react-popover` index.mjs: Anchor renders a bare
   `PopperPrimitive.Anchor`; only Trigger stamps the aria-*). Open/close was already driven by
   focus/typing/Escape/outside-click, so dropping Radix's click-to-toggle changes nothing user-visible
   (clicking the focused input no longer toggles it shut — strictly more combobox-correct).

**Why it's the right fix, not a symptom patch:** the WAI-ARIA combobox contract is exactly "the
`role=combobox` input keeps DOM focus while its `role=listbox` is open; the active option is conveyed via
`aria-activedescendant`, not by moving focus." `anchorOnly + autoFocusContent={false}` implements that
literally. Select was never affected (its trigger is a real `<button>`); Omnibar is a Dialog, no
Popover trigger — scope is just these two.

## Residual 2 — color contrast: confirmed faithful port, NOT cleanly fixable

Pulled Blueprint's compiled `@blueprintjs/core@6.15` CSS (the exact source the harness diffs against):
- **File-input prompt** `.bp6-file-upload-input`: `color: rgba(95,107,124,0.6)` light (blueprint.css
  L7508) / `rgba(171,179,191,0.6)` dark (L7620). That is **exactly** our `--foreground-disabled` — i.e.
  Blueprint itself renders the "Choose file…" prompt at ~2.45:1. Not a porting bug; a faithful match.
- **Tree muted label**: `--foreground-muted` = `$pt-text-color-muted` = gray-1 `#5f6b7c` — faithful.

The contrast **is** the visual, so any AA fix necessarily diverges from Blueprint and breaks the
`compare.sh` computed-style gate — against the project's core fidelity mandate. There is no fix that is
both AA-clean and Blueprint-faithful. Correct resolution stands: **conscious Blueprint-parity delta**,
with the shadcn ownership model giving consumers the override (darken the class / token). Tidied up:
- `file-input.tsx` `text` prop doc was wrong ("foreground-muted") — corrected to name
  `--foreground-disabled`, the Blueprint-exact value, and the AA caveat + override path.
- `comparison-vs-blueprint.md` already documents the posture; residual-1 paragraph rewritten to "Resolved".

## Verification

- `pnpm test` → **73 passed** (12 files; +2 new axe smokes). The two new cases
  (`axe-smoke.test.tsx` → "combobox triggers (open)") render Suggest/MultiSelect, open the listbox by
  focus, and run axe over `document.body`. **Confirmed they FAIL on the old code** (`aria-allowed-attr:
  aria-expanded="true"`) and **PASS after the fix** — a real CI guard, not a tautology.
- Focus retention is guarded by the existing `suggest.test.tsx` "filters options as the user types"
  (and the MultiSelect equivalent): `user.type` after open only filters if the combobox keeps focus.
  Still green.
- `pnpm build` ✓, `pnpm typecheck:test` ✓.
- `tools/compare.sh suggest both` + `multi-select both`: **computed-style diff 0 differ** in both themes
  (4/4 and 5/5 specimens) — the authoritative gate. SSIM/per-specimen numbers unchanged from the 0072
  baseline (the multi-select-tag / container deltas are the pre-existing accepted-delta waivers). The
  change is aria-only (Anchor vs Trigger + prevented autofocus), so visually neutral by construction.
- **Not done:** live VoiceOver/NVDA pass (the standing P1.2 manual item — unchanged) and a live-browser
  axe spot-check (chrome-MCP navigate was declined this session; the jsdom-axe guard + Radix-source
  determinism cover the same ground for this specific structural rule).

## Harness note

Added `region` to the jsdom-axe disabled rules (`src/test/axe.ts`). It's a best-practice *page-landmark*
rule ("all content in landmarks"); a bare test document has no `<main>` and Radix portals the panel to
`document.body` (outside any landmark by design), so it fires in jsdom for the combobox family even
though the real-browser 0070 sweep (real app shell) does not. Same class of dev-harness artifact as the
already-excluded `page-has-heading-one` / `heading-order`; it doesn't judge a component's own ARIA wiring.

## Files

- Edited: `src/components/ui/popover.tsx` (new `autoFocusContent` prop), `src/components/ui/suggest.tsx`
  + `src/components/ui/multi-select.tsx` (`anchorOnly` + `autoFocusContent={false}` + comments),
  `src/test/axe.ts` (`region` disabled + rationale), `src/components/ui/__tests__/axe-smoke.test.tsx`
  (+2 combobox-open cases, `screen` import), `src/components/ui/file-input.tsx` (doc correction),
  `docs/comparison-vs-blueprint.md` (residual 1 → resolved), this handoff.
- New deps: none.

## Branch state

`a11y-behavior-gaps`, working changes **uncommitted** (this session's edits). **Leave open** per standing
instruction — no PR yet. Commit gate met: `pnpm build` + `pnpm test` green, `compare.sh` style-clean on
both touched components. With this, every tracked a11y remediation item except the manual SR pass is
closed; the only remaining accessibility-adjacent work is the §2 completeness features (Hotkeys engine,
real submenus).
