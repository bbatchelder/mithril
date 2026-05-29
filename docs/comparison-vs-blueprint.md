# analyst-ui vs. Blueprint — an honest appraisal

> **Who this is for:** anyone deciding whether to adopt **analyst-ui** or stay on **Palantir Blueprint**
> (`@blueprintjs/*`). It is written to help you choose, not to sell you. Every claim below was checked
> against the actual source of *both* libraries (analyst-ui's components and a clone of Blueprint v6.15)
> and then adversarially re-verified. Where analyst-ui falls short, this document says so plainly.

analyst-ui is a from-scratch reimplementation of Blueprint's **design language** on a modern stack
(React 19 · TypeScript · Tailwind v4 · Radix primitives · CVA), distributed shadcn-style so you **own
the component source**. Blueprint is treated as the *design spec*, not a code source. The result is
visually faithful to Blueprint v6.15 with a cleaner, more modern API — but it is **not** a maturity- or
behavior-equivalent drop-in replacement, and the differences matter.

---

## TL;DR

**Pick analyst-ui if** you are greenfield on **React 19 + Tailwind v4**, you want to *own and restyle*
the component source, you value a clean modern prop API and a small CSS payload, and your app needs
**none of**: a data grid, a global hotkey system, or a multi-step wizard dialog — **and** you are
prepared to finish the keyboard/ARIA behavior on a handful of components yourself.

**Pick Blueprint if** you want to consume a UI library and move on: you value out-of-the-box
accessibility, breadth of components, a real test safety net, `npm`-update bug/security fixes, and a
CSS file that drops into any React app regardless of your build tooling.

Neither is strictly better. analyst-ui wins the **authoring experience**; Blueprint wins the
**engineering maturity**. The honest catch is that most of analyst-ui's headline advantages are
**double-edged** — see "The ownership trade" below.

---

## Side-by-side

| Dimension | Edge | Why (verified) |
| --- | --- | --- |
| **API ergonomics** (new code) | **analyst-ui** | Union props (`variant`/`size`/`intent`), no boolean-soup, Radix-idiomatic `open`/`onOpenChange`, generic function components, **4** `@deprecated` markers vs Blueprint's **59** |
| **Styling & theming** | *Depends* | analyst: typed CVA + Tailwind, **~16.6 KB gzip CSS** for all 56 components — but **requires** Tailwind v4. Blueprint: drop-in **~66 KB gzip** `blueprint.css`, zero build coupling, a real token-derivation pipeline |
| **Distribution / ownership** | *Double-edged* | analyst: in-tree, auditable, minimal deps. Blueprint: `npm update` ships fixes; analyst's `npx shadcn add` path **is not actually wired up yet** |
| **Accessibility & behavior** | **Blueprint (decisive)** | analyst's Radix-backed components are solid; its **hand-rolled** Tabs/Menu/Select-family/Hotkeys have real keyboard & ARIA gaps |
| **Visual fidelity** | **analyst matches** | Palette/intents/type are an exact 1:1 port; dark surfaces correctly OKLCH-derived. But values are *frozen* to v6.15 |
| **Completeness & maturity** | **Blueprint (decisive)** | No data grid, no hotkey engine, no MultistepDialog; analyst is new, single-author, **0 tests** vs Blueprint's **152** |
| **Bundle size** | *Split* | analyst leaner on CSS always & on JS for icon-light apps; **Blueprint far leaner on icons** (per-glyph tree-shaking) |

---

## Where analyst-ui genuinely wins

These held up under scrutiny — they are real, not marketing.

- **A cleaner, more modern API.** `Button` takes `variant`/`size`/`intent` unions with **zero**
  deprecated boolean duplicates; Blueprint's still carries `large`/`small`/`minimal`/`outlined`/
  `rightIcon` as deprecated shims it must dispatch at runtime. Across the library analyst carries **4**
  `@deprecated` markers vs Blueprint's **59**. Overlays use the symmetric Radix idiom
  (`open` / `defaultOpen` / `onOpenChange`) instead of Blueprint's `isOpen` / `defaultIsOpen` /
  `onInteraction(nextOpenState, e)` split. `Select<T>` is a plain generic function with a reusable
  `useQueryList<T>` hook — no class, no deprecated `ofType<T>()` shim.

- **A much smaller CSS payload.** Tailwind's JIT emits only the classes you reference: the entire
  56-component showcase builds to **~16.6 KB gzip** of CSS. Blueprint ships a single monolithic
  `blueprint.css` (**~66 KB gzip**) that loads in full even if you use one button.

- **A leaner dependency surface (for non-icon code).** A copied `card.tsx` pulls in nothing but `cva`
  and `clsx`; `popover.tsx` pulls only `@radix-ui/react-popover`. Blueprint core ships **two popover
  engines simultaneously** (`@popperjs/core` + `react-popper` **and** `@floating-ui/react`) plus
  `react-transition-group` and `normalize.css`.

- **React 19 native.** Blueprint v6.15 pins its peer dependency to React 18 across every package;
  analyst-ui is built and typed for React 19.

- **Unusually honest engineering.** The fidelity work is documented delta-by-delta with commit hashes,
  and the project openly records its own limitations (including a silently-failed edit in one handoff).
  That candor is a genuine asset when you're evaluating trust.

---

## Where Blueprint genuinely wins

These are the load-bearing reasons analyst-ui is **not yet** a hands-down replacement.

### 1. Accessibility — the decisive gap

"Built on Radix, therefore accessible" is **only half true**. It holds for the self-contained
primitives, which are at genuine parity-or-better:

- ✅ **Dialog / Drawer / Alert** (real Radix focus trap, scroll-lock, Escape, `aria-modal`, focus return)
- ✅ **Tooltip** (hover + focus, configurable delays, Escape)
- ✅ **Checkbox / Radio / Switch** (genuine visually-hidden native `<input>`)
- ✅ **SegmentedControl** (a faithful port of Blueprint's accessible radiogroup)
- ✅ **Date pickers** (calendar grid delegated to `react-day-picker` v10)

But it **breaks down** wherever analyst hand-rolls the widget or feeds Radix non-Radix children:

- ❌ **Tabs** — no `onKeyDown` at all. A keyboard user **cannot move between tabs.** Blueprint does
  arrow-key focus movement with wrap.
- ❌ **Menu** — hardcodes `role="menuitem"` on every item with **no roving-tabindex / arrow-key model**
  and no `roleStructure` (Blueprint emits correct `menuitem`/`option`/`aria-selected`).
- ❌ **Select / Suggest / MultiSelect / Omnibar** — **missing the entire combobox WAI-ARIA pattern**
  (`role=combobox/listbox/option`, `aria-activedescendant`, `aria-expanded`, `aria-controls`,
  `aria-haspopup`, `aria-autocomplete`). They keyboard-navigate but announce as a plain menu with no
  active-option feedback.
- ❌ **ContextMenu** — wraps Radix's primitive but renders analyst's own `<Menu>` instead of
  `RadixContextMenu.Item`, so it gets right-click/positioning/Escape but **not** arrow-key navigation,
  typeahead, or submenus.
- ❌ **Hotkeys** — **display-only.** It renders key-caps and a dialog but has no key-binding/dispatch
  engine. Blueprint's `useHotkeys` actually parses combos and fires callbacks.
- ❌ Smaller: **NumericInput** lacks `spinbutton`/`aria-value*`; **Alert** is `role="dialog"` instead of
  `alertdialog`; **Popover** has no hover interaction mode.

Because analyst has **0 tests** and you **own the source**, these gaps are yours to discover and fix —
and the visual comparison harness cannot catch a missing keyboard handler.

### 2. Completeness

Blueprint ships substantial capabilities analyst has **no counterpart** for:

- **Table2** — a ~13,000-LOC virtualized data grid (selection, resize, reorder, editable cells,
  clipboard). analyst's `html-table` is CSS-only styling of a `<table>`.
- **A real hotkey engine** (see above).
- **MultistepDialog / DialogStep**, **ButtonGroup**, **AnchorButton**, and reusable behavioral infra
  (standalone `ResizeSensor`, `OverflowList`, `Overlay2`, `Portal`/provider, hooks).

The roadmap marks "table" and "hotkeys" as done, but those ship as **visual/name parity, not capability
parity** — they are shells.

### 3. Maturity, testing & risk

- **Tests: 0 vs 152.** analyst has no test runner; verification is screenshot-only. Blueprint has 152
  colocated test files covering keyboard/ARIA behavior.
- analyst is a young, single-author project; Blueprint is a years-old, multi-package production library
  with published versions, an issue history, and a large user base.

### 4. Icons

analyst vendors **all 706 glyphs as one static map** with **no tree-shaking** — importing the `Icon`
component drags in **~195 KB gzip** of path data regardless of how many icons you use (the documented
escape hatch is "trim the map by hand"). Blueprint ships **per-icon ES modules** with default
async/lazy loading, so unused glyphs cost nothing.

### 5. Distribution & upgrades

- Blueprint bug/security fixes arrive as a **version bump** (`npm update`). analyst's owned source gets
  **no automatic upstream fixes** — ever.
- analyst's headline `npx shadcn@latest add <url>/button` install path **is aspirational**: the
  `registry.json` is never served (only the demo gallery is deployed). Today the only working adoption
  path is **hand-copying files**.

### 6. A living token system

Blueprint **derives** its theme at runtime via `oklch(from <intent> …)` with an `@supports` sRGB
fallback — change one variable and the whole theme re-derives, and it degrades gracefully on older
browser engines. analyst **bakes the resolved sRGB values as frozen literals** (it even hand-patches
one-off hex values) and ships **no `@supports` fallback** for its raw `oklch()`/`color-mix()` usage. So
"matches Blueprint exactly" is **non-inferiority to a frozen v6.15 snapshot**, not an advantage that
lets the theme evolve or re-theme from a single source.

---

## On visual fidelity (analyst's strongest claim)

This one largely holds. The static palette (16 color scales), intents, and type scale are a verified,
byte-exact 1:1 port of Blueprint's design tokens, and the harder dark surface/elevation values are
correctly **resolved** from Blueprint's OKLCH derivations (independently recomputed and confirmed). The
verification method — a computed-style diff **plus** a per-specimen SSIM image crop, in both light and
dark themes — is above average, and accepted deltas are documented honestly.

Two caveats keep this from being a slam-dunk advantage:

1. The fidelity is **bought with a frozen, fallback-less, hand-maintained** token set (see §6 above).
2. The computed-style gate deliberately **omits** some real visual properties (font-family, line-height,
   vertical padding, border-style), so a green "N match" has documented blind spots — and there's no
   automated regression net to catch drift over time.

"Looks exactly like Blueprint" is real and verified on the captured axes. It is **non-inferiority**, not
a reason on its own to switch.

---

## The ownership trade (read this before deciding)

Almost every analyst-ui advantage and its biggest liability are **the same fact viewed from two sides**:

| The pitch | The catch |
| --- | --- |
| "You own the source — edit anything, no upstream waiting." | You maintain 56 components **forever**, with **no tests** behind them. |
| "No black-box dependency to audit." | True for the wrappers — but the behavioral guts of Dialog/Popover/Tooltip/Slider/Toast are still **Radix in `node_modules`**, with their own transitive trees. |
| "Tiny, modern dependency surface." | You are now the maintainer of everything that *isn't* a dependency. |
| "Pixel-faithful to Blueprint." | Faithful to v6.15 **specifically**, and **frozen** there — it can't track the spec as Blueprint evolves. |

If your team is going to fork and heavily customize a UI library anyway, this trade is in your favor. If
you want to *consume* a UI library and get on with your product, it is not.

---

## Decision guide

- **Greenfield React 19 + Tailwind v4 app, design-system-savvy team, no data grid / hotkeys / wizard
  needs, willing to harden a11y →** analyst-ui is a great fit and a genuinely nicer authoring experience.
- **You need a data grid, a global hotkey system, or multi-step dialogs →** Blueprint (or pair Blueprint
  with analyst-ui only for the surface analyst covers well).
- **Accessibility/Section-508/WCAG is a hard requirement out of the box →** Blueprint today; analyst-ui
  only after the §1 gaps are closed and tested.
- **You're not on Tailwind, or you want drop-in CSS with no build coupling →** Blueprint.
- **You want to own, audit, and restyle every line, and you'll invest in maintenance →** analyst-ui.

---

*This appraisal reflects the state of both libraries as audited on 2026-05-29 (analyst-ui at branch
`public-readiness`; Blueprint v6.15). For the prioritized plan to close the gaps above, see
[`docs/blueprint-parity-roadmap.md`](./blueprint-parity-roadmap.md).*
