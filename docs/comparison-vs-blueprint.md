# mithril vs. Blueprint — an honest appraisal

> **Who this is for:** anyone deciding whether to adopt **mithril** or **Palantir Blueprint**
> (`@blueprintjs/*`). It is written to help you choose, not to sell you. Every claim below was checked
> against the actual source of *both* libraries (mithril's components and a clone of Blueprint v6.15).
> Where mithril falls short, this document says so plainly.

mithril is a from-scratch reimplementation of Blueprint's **design language** on a modern stack
(React 19 · TypeScript · Tailwind v4 · Radix primitives · CVA), distributed shadcn-style so you **own
the component source**. Blueprint is treated as the *design spec*, not a code source. The result is
visually faithful to Blueprint v6.15 with a cleaner, more modern API. The two libraries trade off along
one main axis: mithril wins the **authoring experience**, Blueprint wins **engineering maturity**.

---

## TL;DR

**Pick mithril if** you are greenfield on **React 19 + Tailwind v4**, you want to *own and restyle*
the component source, you value a clean modern prop API and a small CSS payload, and you're comfortable
adopting a young, single-author library (you maintain the copied source from then on).

**Pick Blueprint if** you want to consume a UI library and move on: you value years of production
hardening, the depth of a battle-tested data grid (`Table2`), `npm`-delivered bug/security fixes, a
larger test corpus, a live-screen-reader-validated a11y story, and a CSS file that drops into any React
app regardless of your build tooling.

Neither is strictly better. The honest catch is that most of mithril's advantages come bundled with the
own-the-source trade — see "The ownership trade" below.

---

## Side-by-side

| Dimension | Edge | Why (verified) |
| --- | --- | --- |
| **API ergonomics** (new code) | **mithril** | Union props (`variant`/`size`/`intent`), no boolean-soup, Radix-idiomatic `open`/`onOpenChange`, generic function components, **4** `@deprecated` markers vs Blueprint's **59** |
| **Styling & theming** | **mithril** | Typed CVA + Tailwind, far smaller CSS than Blueprint's monolithic **~66 KB gzip** `blueprint.css` — *and* a runtime-derivable, themeable token pipeline (seed overrides re-tint light+dark) with `@supports` fallbacks. Caveat: **requires** Tailwind v4 |
| **Distribution / ownership** | *Double-edged* | mithril: in-tree, auditable, minimal deps, `npx shadcn add` installs from a served registry. Blueprint: `npm update` ships fixes you don't have to apply by hand |
| **Accessibility & behavior** | *Near-parity* | Radix-backed overlays plus hand-rolled Tabs/Menu/Select-family/ContextMenu pass keyboard/ARIA contract tests + axe smokes. Residuals: no live VoiceOver/NVDA pass, no MenuItem submenus, conscious Blueprint-parity contrast deltas |
| **Visual fidelity** | **mithril matches** | Palette/intents/type are an exact 1:1 port; dark surfaces correctly OKLCH-derived and runtime-re-derivable from seeds |
| **Completeness & maturity** | **Blueprint** | mithril has a data grid, hotkey engine, and MultistepDialog — but Blueprint's `Table2` is far deeper, and Blueprint is a years-old, multi-author, multi-package library; mithril is new and single-author |
| **Tests** | **Blueprint** | mithril: **336** behavior/a11y tests across 33 files + axe smokes + the screenshot/computed-style harness. Blueprint: **152** colocated test files over a much larger surface |
| **Bundle size** | **mithril** | Leaner on CSS always; icons tree-shake per-glyph (importing `Icon` + 3 glyphs ≈ **1.9 KB gzip**), matching Blueprint's per-icon model |

---

## Where mithril wins

These held up under scrutiny — they are real, not marketing.

- **A cleaner, more modern API.** `Button` takes `variant`/`size`/`intent` unions with **zero**
  deprecated boolean duplicates; Blueprint's still carries `large`/`small`/`minimal`/`outlined`/
  `rightIcon` as deprecated shims it dispatches at runtime. Across the library mithril carries **4**
  `@deprecated` markers vs Blueprint's **59**. Overlays use the symmetric Radix idiom
  (`open` / `defaultOpen` / `onOpenChange`) instead of Blueprint's `isOpen` / `defaultIsOpen` /
  `onInteraction(nextOpenState, e)` split. `Select<T>` is a plain generic function with a reusable
  `useQueryList<T>` hook — no class, no deprecated `ofType<T>()` shim. Icon-accepting props take
  `IconName | ReactElement` library-wide, so `<Button icon="add" />` works with no `<Icon>` import.

- **A much smaller CSS payload.** Tailwind's JIT emits only the classes you reference, so the component
  CSS is a fraction of Blueprint's single monolithic `blueprint.css` (**~66 KB gzip**), which loads in
  full even if you use one button.

- **A leaner dependency surface.** A copied `card.tsx` pulls in nothing but `cva` and `clsx`;
  `popover.tsx` pulls only `@radix-ui/react-popover`. Blueprint core ships **two popover engines
  simultaneously** (`@popperjs/core` + `react-popper` **and** `@floating-ui/react`) plus
  `react-transition-group` and `normalize.css`. (The exception: `DataTable` composes TanStack
  Table + Virtual — opt-in, only if you import it.)

- **Icons that tree-shake.** Each of the 706 glyphs is a named `export const`, so a bundler ships only
  the glyphs you import (`import { add } from ".../icons"; <Icon icon={add} />` ≈ 1.9 KB for three).
  The dynamic `<Icon icon="add" />` name form resolves through a registry you opt into.

- **A runtime-derivable, themeable token system.** Semantic tokens derive at runtime from a small seed
  set (the four intent vars + the gray ramp) via `oklch(from …)` / `color-mix()`, mirroring Blueprint's
  DTCG `derive` offsets — override a seed on `<html>` and the whole theme re-tints in **both** light and
  dark. Every derived value ships a static-literal `@supports` fallback. See `docs/theming.md`.

- **A behavioral test net.** 336 Vitest + Testing Library keyboard/ARIA/behavior tests across 33 files,
  plus axe-core smoke audits over the gallery in both themes — so the hand-rolled-widget keyboard/ARIA
  behavior (Tabs, Menu, the Select family's combobox pattern, ContextMenu, NumericInput spinbutton,
  Alert `alertdialog`) is guarded by tests, not just eyeballed.

- **React 19 native.** Blueprint v6.15 pins its peer dependency to React 18 across every package;
  mithril is built and typed for React 19.

- **Unusually honest engineering.** The fidelity work is documented delta-by-delta with commit hashes,
  and the project openly records its own limitations. That candor is a genuine asset when evaluating
  trust.

---

## Where Blueprint wins

These are the load-bearing reasons mithril is **not yet** a no-questions-asked replacement.

### 1. Engineering maturity & risk

- mithril is a **young, single-author** project; Blueprint is a years-old, multi-package production
  library with published versions, an issue history, a large user base, and **`npm`-delivered bug/
  security fixes**. Owning mithril's source means *you* maintain it — no upstream pushes fixes to you.
- **Test coverage is real but not exhaustive.** mithril's 336 behavior tests + axe smokes + the visual
  harness cover the common paths, but they don't blanket every component and branch the way Blueprint's
  152-file corpus does over its larger surface.

### 2. Data-grid depth

mithril ships **`DataTable`** (composing TanStack Table v8 + TanStack Virtual v3 under mithril's API and
tokens): sticky header, numbered gutter, **row** virtualization, row/cell/region selection, column
resize and reorder, editable cells, keyboard cell navigation, and clipboard (TSV) copy. That covers the
common ground — but Blueprint's **`Table2`** is a ~13,000-LOC grid that goes deeper (e.g. **column**
virtualization, frozen rows/columns, and years of edge-case hardening). For the heaviest grid features,
Blueprint is ahead; for most product tables, `DataTable` is sufficient.

### 3. Accessibility residuals

mithril's keyboard/ARIA behavior is solid and test-covered: Tabs on Radix; Menu `roleStructure`; the
Select/Suggest/MultiSelect/Omnibar combobox WAI-ARIA pattern with `aria-activedescendant`; ContextMenu
on real Radix items; NumericInput `spinbutton`; Alert `alertdialog`. The residuals:

- **No live screen-reader pass.** Verification is jsdom + axe-core, which cannot validate lived
  VoiceOver/NVDA announcements. Blueprint has years of real-AT exposure.
- **No `MenuItem` submenus.** Nested/declarative submenus aren't built. Blueprint has auto
  hover-Popover submenus.
- **Color-contrast posture (WCAG 1.4.3).** Because the palette is a 1:1 Blueprint port, a few
  *non-disabled* muted tones inherit Blueprint's sub-AA contrast — the **file-input prompt**
  (2.45:1 light / 3.75:1 dark) and a **Tree** muted label (~4.2:1). These **match Blueprint exactly**;
  fixing them would break the fidelity gate, so they're documented conscious deltas. Consumers needing
  strict AA can darken `--foreground-muted` / the prompt color (they own the source). Disabled/inactive
  text below 4.5:1 is WCAG-*exempt* and also matches Blueprint.

### 4. Drop-in, build-agnostic CSS

Blueprint ships a single `blueprint.css` that works in any React app regardless of build tooling.
mithril's components are styled with **Tailwind v4 utility classes and are inert without it** — there is
no framework-agnostic drop-in build. This is a deliberate trade (it's what buys the tiny CSS and the
token system), but if you're not on Tailwind v4 it's disqualifying.

---

## On visual fidelity (mithril's strongest claim)

This one holds. The static palette (16 color scales), intents, and type scale are a verified,
byte-exact 1:1 port of Blueprint's design tokens, and the harder dark surface/elevation values are
correctly **resolved** from Blueprint's OKLCH derivations (independently recomputed and confirmed) —
and are **runtime-re-derivable** from seeds. The verification method — a computed-style diff **plus** a
per-specimen SSIM image crop, in both light and dark themes — is above average, and accepted deltas are
documented honestly.

One caveat keeps this from being a slam-dunk: the computed-style gate deliberately **omits** some real
visual properties (font-family, line-height, vertical padding, border-style), so a green "N match" has
documented blind spots, and the harness runs by hand rather than in CI. "Looks exactly like Blueprint"
is real and verified on the captured axes.

---

## The ownership trade (read this before deciding)

Almost every mithril advantage and its biggest liability are **the same fact viewed from two sides**:

| The pitch | The catch |
| --- | --- |
| "You own the source — edit anything, no upstream waiting." | You maintain ~60 components **forever**; the test net is yours to keep green, and no upstream ships you fixes. |
| "No black-box dependency to audit." | True for the wrappers — but the behavioral guts of Dialog/Popover/Tooltip/Slider/Toast (and `DataTable`'s engine) are still **Radix/TanStack in `node_modules`**, with their own transitive trees. |
| "Tiny, modern dependency surface." | You are now the maintainer of everything that *isn't* a dependency. |
| "Pixel-faithful to Blueprint." | Faithful to v6.15 **specifically** — re-derivable from seeds, but it tracks a v6.15 snapshot, not Blueprint's evolving spec. |

If your team is going to fork and heavily customize a UI library anyway, this trade is in your favor. If
you want to *consume* a UI library and get on with your product, it tilts toward Blueprint.

---

## Decision guide

- **Greenfield React 19 + Tailwind v4 app, design-system-savvy team →** mithril is a great fit and a
  genuinely nicer authoring experience.
- **You need the heaviest data grid (column virtualization, frozen rows/cols) →** Blueprint's `Table2`
  is deeper; mithril's `DataTable` covers most product tables.
- **Accessibility / Section-508 / WCAG is a hard requirement →** mithril's keyboard/ARIA is solid and
  test-covered, so it's viable for most surfaces — but verify the residuals against your needs (no live
  screen-reader pass, no MenuItem submenus, the documented Blueprint-parity contrast deltas).
- **You're not on Tailwind, or you want drop-in CSS with no build coupling →** Blueprint.
- **You want a years-hardened, multi-author library with upstream-delivered fixes →** Blueprint.
- **You want to own, audit, restyle, and re-theme every line, and you'll invest in maintenance →**
  mithril.

---

*This appraisal reflects the state of both libraries as of 2026-06-01 (mithril on `main`; Blueprint
v6.15). Per-component build history is in [`docs/handoffs/`](./handoffs/); open work is tracked in
[`docs/ROADMAP.md`](./ROADMAP.md).*
