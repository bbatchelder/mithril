# Visual fidelity audit — analyst-ui vs Blueprint reference

**Date:** 2026-05-27 · **Branch:** `public-readiness` · **Harness:** `tools/compare.sh <id> both`
**Scope:** all 56 components in `src/App.tsx`, both themes (112 component·theme runs).
**Method:** computed-style diff + per-specimen SSIM/size diff (the reliable gate) + full-page diff.
Worst offenders had their `*.spec.png` crops and full-page screenshots eyeballed to separate
**real fidelity gaps** from **font/animation/portal noise**.

> Originally a findings report — now annotated with remediation status as of 2026-05-28.

## Remediation status (2026-05-28)

All 10 Tier 1 + Tier 2 items in the TL;DR are addressed. Per-item state:

| # | Component | State | Fix |
|---|---|---|---|
| 1 | Popover + Tooltip arrow | ✅ fixed | commit `0968348` |
| 2 | Switch inner labels       | ✅ fixed | commit `e6dfc96` |
| 3 | Date family header        | ✅ fixed | commit `bde164f` |
| 4 | Hotkeys / KeyCombo        | ✅ fixed | commit `5859787` |
| 5 | Slider                    | ✅ fixed | this commit — value-pill `translateY(20)` + axis-label `translateY(32)` so they share a row below the handle (no collision); reverted handle to Blueprint's actual `rounded-bp` (4px) with `rgba(18,20,24,0.5)` outer-ring + 1px drop shadow (audit's "round knob" description was wrong — Blueprint computed is 4px) |
| 6 | FileInput default width   | ✅ fixed | this commit — added `w-[250px]` to the non-`fill` label. Both the `<input>` and box span are `position:absolute`, so the label had no in-flow content and a flex-column parent was stretching it to 100% |
| 7 | MultiSelect active item   | ✅ fixed | this commit — added `outline-none focus-visible:outline-none` to MenuItem. The "outline ring" was the browser's default focus ring on top of the (correct) filled active background; Radix Popover autofocuses the first focusable child on open, which painted the ring |
| 8 | NumericInput stepper      | ✅ verified — no code change | Investigated and the stepper width is correct: Blueprint sets `width:24px` locally but the global `.bp6-button { min-width: 30px }` overrides it, so Blueprint renders at 30px just like analyst. The audit's "6px off" wording was about the input-width side, which is gallery-dependent and matches once both galleries pin the same explicit width |
| 9 | Select trigger            | ✅ fixed | this commit — gallery config: pass `fill` to the `<Select>` wrapper (not just the inner Button) so the trigger fills its 300px parent like the reference gallery |
| 10 | TagInput chip width       | ✅ fixed | this commit — Tag remove-button right-padding `pr-1.5` (6px) → `pr-0.5` (2px) to match Blueprint's `.bp6-tag-remove { padding: 2px; padding-left: 0 }`. Chip went from +6px wider than Blueprint to +2px (visually matched) |

Tier 3 (Button/Checkbox/Radio confirmed-known) and Tier 4 (reference-gallery cleanups, benign style-only diffs like dialog/drawer shadow-ring `rgb(0,0,0)` vs `rgb(20,20,20)` @ 10%) are intentionally left as-is per the audit's classification.

---

## TL;DR — what's actually broken

The per-specimen SSIM ranking is **misleading at the top**: the four lowest scores
(panel-stack, tooltip, multi-select, time-picker — all ≈0.01) include genuine bugs *and*
pure harness artifacts. After eyeballing every flag, the real gaps are:

| # | Component(s) | Gap | Severity | Status |
|---|---|---|---|---|
| 1 | **Popover + Tooltip** | Arrow points **down & detached** in the gap below the trigger; Blueprint's points **up, snug** on the content's top edge. Shared root cause (Tooltip is built on Popover). | **High** | ✅ |
| 2 | **Switch** (inner labels) | Track too narrow → inner `OFF`/`ON` label clipped/overlapping the thumb. | **High** | ✅ |
| 3 | **Date family** (date-picker, date-input, date-range-picker, date-range-input) | Calendar **header**: month/year render as bordered `HTMLSelect` dropdowns vs Blueprint's borderless caret selects; nav arrows spread `space-between` vs grouped. Standalone DatePicker also lays the grid out centered in a full-width card. | **High** | ✅ |
| 4 | **Hotkeys / KeyCombo** | Modifier keycaps omit the platform **glyph**; Blueprint pairs glyph + word (`⌘ cmd`, `⇧ shift`, `^ ctrl`). | **Med** | ✅ |
| 5 | **Slider** | Value-label pill hangs low and collides with the axis tick labels; handle reads as a bordered rounded-square vs a round knob. | **Med** | ✅ (pill aligned; handle kept Blueprint's actual 4px radius) |
| 6 | **FileInput** | Defaults to **full container width** (~760px) vs Blueprint's inline ~250px. | **Med** (verify gallery cfg) | ✅ |
| 7 | **MultiSelect** | Active menu item drawn with a blue **outline ring** vs Blueprint's filled background highlight. | **Low** | ✅ |
| 8 | **NumericInput** | Stepper button group slightly **detached** from the field (+~6px) vs Blueprint's flush stepper. | **Low** | ✅ (no change — stepper already matches Blueprint's effective 30px) |
| 9 | **Select** | Trigger hugs content vs Blueprint's full-width trigger with right-pinned caret. | **Low** (verify gallery cfg) | ✅ (gallery config) |
| 10 | **TagInput** | Tag chips render slightly wider (more space before the × remove icon). | **Low** | ✅ |

**Confirmed-known (do not re-report):** Button ~1–2px wider + dark `--foreground` decision; Checkbox/Radio control-row height (~18 vs ~26px).

Everything else that flagged is **benign noise or a reference-gallery artifact** — see the last section.

---

## Tier 1 — real gaps, fix priority

### 1. Popover + Tooltip arrow (shared) — **High**
- **Specimens:** `popover-arrow` (0.275 dark / 0.348 light), `tooltip-arrow` (0.007 dark / 0.009 light).
- **Observed:** For bottom-placed overlays, analyst renders the arrow as a **downward chevron floating in the gap** between trigger and content, and the content sits with a visibly larger gap below the trigger. Blueprint renders the arrow **pointing up, attached to the content's top edge**, tucked snug under the trigger.
- **Likely cause:** Arrow rotation/anchoring in the Popover arrow element (wrong rotation for the `bottom` side, and/or the arrow is placed on the wrong edge / offset pushes content away). Floating-UI arrow middleware side mapping.
- **Fix:** In the Popover arrow logic, rotate/position the arrow per resolved side so it points *toward* the trigger and sits on the panel edge; remove the extra offset so the panel hugs the trigger. Tooltip inherits the fix.
- **Eyeball:** `popover.dark.{analyst,blueprint}.png`, `tooltip.dark.{analyst,blueprint}.png`.

### 2. Switch with inner labels — **High**
- **Specimen:** `switch-inner-labels` (0.282 light / 0.649 dark), 1px size flag.
- **Observed:** With inner labels, analyst's track isn't wide enough — `OFF` renders clipped/overlapping the thumb (a smudged `O̶FF`). Blueprint widens the track so `OFF`/`ON` sits clearly beside the thumb.
- **Likely cause:** The inner-label variant doesn't add the extra track width Blueprint applies (Blueprint bumps `.bp6-control.bp6-switch` width when `.bp6-control-indicator-child` text is present).
- **Fix:** Increase track min-width (or add horizontal padding for the label) when `innerLabel`/`innerLabelChecked` are set.
- **Eyeball:** `switch.light.{analyst,blueprint}.png` — "Inner labels" section.

### 3. Date family — calendar header — **High**
- **Specimens:** `date-picker-weekday` (0.377/0.388), `date-input-field` (0.847), `dri-end` (0.815/0.819), `drp-day` (0.865/0.904).
- **Observed:** The calendar **body** (day grid, selected-day highlight, range highlight) matches Blueprint well in the popover contexts. The **header** differs consistently:
  - Month/year pickers render as **bordered `HTMLSelect` boxes** in analyst; Blueprint uses **borderless minimal selects** (label + small up/down caret, no box).
  - Nav arrows are pushed to the calendar's outer edges (`justify-content: space-between`) in analyst; Blueprint groups `[month][year][<][>]` together.
  - **Standalone `DatePicker`** additionally lays the whole calendar out **centered inside a full-width card** rather than a compact left-aligned block — so it reads much wider than Blueprint.
- **Likely cause:** The month/year navigation control uses the full `HTMLSelect` (bordered) variant instead of a minimal/borderless one; header flex uses `space-between`; the standalone picker container is `width:100%`/centered instead of `width: max-content`.
- **Fix:** Swap header selects to a borderless/minimal style with a caret; group nav controls next to the year; constrain the standalone DatePicker to content width.
- **Eyeball:** `date-picker.light.{analyst,blueprint}.png` (clearest), then `date-input` / `date-range-input` for the header treatment.

### 4. Hotkeys / KeyCombo — **Med**
- **Specimens:** `hotkey-key` (0.138 light), `hotkey-combo` (0.223 dark), 3px size flag.
- **Observed:** Blueprint renders each modifier keycap as **glyph + word** (`⌘ cmd`, `⇧ shift`, `^ ctrl`). Analyst shows only the word (`cmd`, `shift`) and renders some modifiers as glyph-only caps — the platform glyph is missing from the labelled caps, so caps are narrower.
- **Likely cause:** KeyCombo modifier rendering omits the platform-icon glyph that should precede the modifier name.
- **Fix:** Prepend the modifier glyph (⌘/⇧/⌥/^) inside the same keycap as the modifier label, matching Blueprint's `<KeyCombo>` rendering.
- **Eyeball:** `hotkeys.light.{analyst,blueprint}.png` — both the top "KeyCombo:" row and the dialog rows.

### 5. Slider — **Med**
- **Specimens:** `slider-success` (0.427 light / 0.578 dark), `slider-primary`, etc. (6 flagged).
- **Observed:** Two issues — (a) the value-label pill hangs **lower** with a gap below the handle and **collides with the axis tick labels** (0/5/10 row); Blueprint tucks it tight under the handle aligned to that row. (b) The handle reads as a **bordered rounded-square** in analyst vs Blueprint's cleaner round knob.
- **Likely cause:** Label `top`/offset too large; handle border-radius/border not matching the round Blueprint thumb.
- **Fix:** Reduce the value-label vertical offset; round the handle and drop/soften its border.
- **Eyeball:** `slider.light.{analyst,blueprint}.png`.

### 6. FileInput default width — **Med (verify)**
- **Specimens:** `fi-large` (0.755 light / 0.739 dark), 4px size flag.
- **Observed:** analyst's FileInput stretches to **full container width** (~760px, Browse pushed far right) on the non-fill variants, while Blueprint's default is **inline ~250px**. (The explicit "Fill" row in analyst is paradoxically narrower.)
- **Likely cause:** FileInput root defaults to `display:flex; width:100%` instead of inline-flex content width; the `fill` prop may be inverted/mis-wired in the gallery.
- **Fix / verify:** Confirm whether the gallery passes `fill`; if not, make the default inline width and gate full-width behind `fill`.
- **Eyeball:** `file-input.light.{analyst,blueprint}.png`.

---

## Tier 2 — real but minor

### 7. MultiSelect active item — **Low**
- `multi-select-tag` (0.008 dark / 0.035 light) is inflated by a 1px input-row height offset; the **chips match**. The real diff: analyst draws the active menu item ("Apple") with a blue **outline ring**; Blueprint fills it with a muted blue background. Align the active-item treatment to the filled highlight (as Select already does). `multi-select.dark.{analyst,blueprint}.png`.

### 8. NumericInput stepper — **Low**
- `ni-step-button` (0.828 dark / 0.855 light), 6px size flag. Stepper group sits with a small gap / slightly detached from the field and is ~6px off in width; Blueprint's stepper is flush against the input as one unit. Intent-colored steppers otherwise match. `numeric-input.light.{analyst,blueprint}.png`.

### 9. Select trigger — **Low (verify)**
- `select-trigger` (0.54), 5px size flag. analyst's trigger hugs content (`Cherry ▾`, caret adjacent, ~80px); Blueprint's is full-width (~300px) with the caret pinned right via space-between. The dropdown list matches well. Likely a gallery-config difference (reference button set to `fill`) — confirm before treating as a component gap. `select.light.{analyst,blueprint}.png`.

### 10. TagInput chips — **Low**
- `tag-input-container` (0.733/0.735), 2px size flag. Chips render slightly wider — more space before the × remove icon. (The "left icon" demo also uses a *search* icon in analyst vs a *tag* icon in Blueprint — gallery content, not a gap.) `tag-input.light.{analyst,blueprint}.png`.

---

## Tier 3 — confirmed-known (already documented; not new)

- **Button** — light: computed styles **18/18 match**; the flags are the documented ~1–2px width drift (font metrics/letter-spacing). Dark: the 3 style diffs are the documented `--foreground` decision (`#f6f7f9` vs Blueprint's near-white). `btn-size-medium` 0.595–0.598.
- **Checkbox / Radio** — control-row height ~18px vs Blueprint ~26px. Confirmed: `cb-control-*` carries a 2px crop flag; the radio/checkbox **indicators** themselves are 1.000 (the box is fine — it's the row line-height/min-height).

---

## Tier 4 — benign noise / reference-gallery artifacts (NOT analyst gaps)

These flagged in the ranking but are not real analyst fidelity gaps. Several point at the
**reference gallery / harness**, worth a separate cleanup pass:

- **panel-stack** (0.007/0.009) — **reference artifact.** The Blueprint reference rendered an **empty panel** (content didn't mount), so the crop compares analyst's correct header/content against blank. analyst is fine. → *fix the reference gallery's PanelStack mount.*
- **time-picker** (`time-picker-divider` -0.001/0.039) — thin 1px divider crop; SSIM is meaningless on a near-empty sliver. AM/PM + fields match. Benign.
- **timezone-select** (0.144/0.151) — the two galleries render **different timezone datasets**, so per-item crops compare mismatched rows. Styling/layout faithful. (Minor real note: analyst auto-highlights the first row; Blueprint shows none.) → *align gallery data for a clean signal.*
- **progress-bar** (0.371/0.488) — **animation noise.** Styles 8/8 match; meters are visually identical — the diagonal stripes are at different animation phases between galleries.
- **input-group** (0.708, 12 flagged) — **AA noise.** Styles 12/12 match; inputs visually identical. Low SSIM is sub-pixel text/border anti-aliasing on near-empty boxes. (Detached × on "right element" appears in *both* galleries.)
- **context-menu / menu** (0.79 / 0.746) — **bare-surface width artifact.** The reference renders a bare `Menu` in a full-width container (so ⌘F right-aligns to the page edge); analyst's bare Menu stays content-width. In real popovers (Select/timezone/multi-select) analyst's menu fills and right-aligns correctly. Style diffs are trivial (`min-width: auto` vs `0`, 1px heights).
- **toast** (0.678/0.745) — only style diff is `min-width: 300px` vs `min(300px, 100%)`; identical at desktop width. Visually faithful (intents, icons, actions, close).
- **dialog / drawer** (0.836/0.81) — only style diff is the 1px box-shadow ring color `rgb(0,0,0)` vs `rgb(20,20,20)` at ~10% opacity — imperceptible. `only in analyst: drawer-close` = a **reference-gallery tagging gap** (key not paired). → *tag `drawer-close` in the reference, or drop the tag.*
- **entity-title** (0.715) — large-heading AA + the known row-spacing drift between galleries; the titles/headings themselves match.
- **alert** (0.627) — faithful; `alert-confirm` flag is the known button-width drift.
- **segmented-control** (0.892/0.893) — trivial `min-width: auto` vs `0`; visually faithful.
- **Clean (SSIM ≥ ~0.95, no real flags):** card, icon, text, divider, spinner, skeleton, callout, text-area, form-group*, control-group, html-select, control-card, card-list, breadcrumbs, tree, html-table, editable-text, non-ideal-state, link, navbar, tabs, collapse, section, suggest, omnibar, date-range-picker (body).
  - *form-group: `fg-label-info` flags on a minor inline-spacing nit ("label (optional)" spacing) + a slightly different disabled-label color — cosmetic, low priority.*

---

## Recurring root-cause themes (cheap wins across components)

1. **Popover arrow direction/anchoring** — one fix clears Popover **and** Tooltip (Tier 1 #1).
2. **`min-width: auto` vs `0`** appears on menu/segmented-control/etc. — analyst's default; visually inert, but normalizing to `0` would silence several style-diff flags.
3. **Dialog/Drawer shadow-ring color** (`rgb(0,0,0)` vs `rgb(20,20,20)` @ 10%) — a one-token tweak to the elevation/border-shadow color would clear both (imperceptible, optional).
4. **Reference-gallery cleanup** (separate from analyst): PanelStack empty mount, timezone dataset mismatch, untagged `drawer-close` — these distort the ranking, not the product.

## How to re-run
```bash
tools/compare.sh <id> both        # single component, both themes
# full sweep (clean logs): see tools/comparison/audit-logs/ from this run
```
Per-specimen `*.spec.png` crops and full-page `*.diff.png` for every flagged key are in
`tools/comparison/screenshots/`.
