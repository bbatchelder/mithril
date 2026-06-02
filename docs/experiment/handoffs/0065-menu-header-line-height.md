# 0065 — close the Menu deltas (heading line-height + reference crop bug) + TimezoneSelect decision

- **Date:** 2026-05-29
- **Branch:** `public-readiness` (continues from 0064 @ `11de411`)
- **Focus:** Clear BOTH optional items from 0064's "Next steps": (1) the Menu 1px height delta — which
  turned out to be two real bugs (one in the component, one in the reference gallery) — and (2) formally
  record the TimezoneSelect cleaner-labels decision so the width delta is closed-by-decision.

## TL;DR

- **All Menu deltas are CLOSED.** `menu` reads **7 match · 0 differ** in light *and* dark, and every
  specimen SSIM is now healthy (menu-header crop **0.746 → 0.998** light, **0.752 → 0.985** dark).
- **Bug A (component):** `MenuDivider` heading `<h6>` listed `leading-[17px]` **before** `text-body`, so
  `text-body` shadowed it and the h6 inherited `--leading-bp` (~18px) instead of 17px. Reordered.
- **Bug B (reference gallery):** the menu-header crop was *also* low-SSIM because the hand-written
  reference `<h6>` was missing `class="bp6-heading"` — it fell back to the UA default font-size (~9.38px)
  instead of Blueprint's real 14px. Switched it to the real `<H6>` component. **mithril was correct.**
- **TimezoneSelect:** width delta is now closed *by decision* — documented in-code as an intentional
  deviation. We keep the cleaner labels.

## What it actually was

0064 filed this as "pre-existing 1px height (menu-header 18 vs 17, container 223 vs 222) — out of scope."
It turned out to be a real, single-line bug, not irreducible noise:

- Probed live: the heading `<h6>` computed `line-height: 18.0013px` (= 14px × `--leading-bp`), **not** the
  intended `17px`. The `leading-[17px]` utility was being dropped.
- Cause: in `menu.tsx` the h6 className had `"leading-[17px]"` **before** `"text-body"`. tailwind-merge
  drops the earlier line-height when `text-*` follows. This is the exact gotcha already documented on
  `MenuItem` ("Leading AFTER text-* so tailwind-merge keeps it") — the heading just had it backwards.
- The container's 223-vs-222 delta was the same 1px propagating up the `<ul>`.

## Bug A — heading line-height (the component)

`src/components/ui/menu.tsx` — `MenuDivider` titled-heading `<h6>`: moved `leading-[17px]` to **after**
`text-body`, with a comment pointing at the MenuItem note. Closed **both** computed-style diffs.

Verified live (HMR): h6 `line-height` 18.0013px → **17px**, header `<li>` 18px → **17px**.

## Bug B — reference-gallery heading was using the UA default font-size

After Bug A the computed-style diff passed but the `menu-header` **specimen** crop still SSIM'd ~0.75.
Probing both galleries live showed the *reference* h6 rendering at **font-size 9.38px**, not 14px.

Traced to Blueprint source (`../blueprint`): `MenuDivider title` renders the React `<H6>` component, which
emits `<h6 class="bp6-heading">`. The `$headings` map (`_typography.scss`) gives `h6.bp6-heading`
**14px / line-height 16px**; the `menu-heading` mixin then overrides line-height to `$pt-icon-size + 1 =
17px`. So Blueprint's real menu header is **14px / 600 / 17px — exactly what mithril already renders.**

The reference gallery had a hand-written **bare `<h6>`** (no class) to preserve `data-compare`, so it fell
back to the browser default h6 size (0.67em = 9.38px). That was the false diff — **mithril was right.**

Fix (`tools/blueprint-reference/src/App.tsx`): use the real `<H6>Actions</H6>` component instead of `<h6>`.

`tools/compare.sh menu both` after both fixes:
- **light:** 7 match · 0 differ. menu-container 0.784 → **0.990**, menu-header **0.746 → 0.998**.
- **dark:** 7 match · 0 differ. menu-container 0.790 → **0.979**, menu-header **0.752 → 0.985**.
- min SSIM across all 7 specimens now 0.973 (light) / 0.963 (dark) — healthy.

## TimezoneSelect — closed by decision (cleaner labels)

The ~23px minimal-menu width delta (and ~6px trigger delta) is now **closed by an explicit, documented
design decision**, not held as an open item. Per the project's "fresh, modern API" goal we keep the plain
place-name labels ("Calcutta", "Sydney") instead of Blueprint's verbose composites ("India - Kolkata",
"Melbourne, Sydney"). The narrower menu is the accepted, intended cost of the cleaner labels.

Documented in-code in `src/components/ui/timezone-select.tsx` (new "Design decision — cleaner labels"
block in the file header) so a future agent won't try to "fix" the width by reverting the labels.

## Files touched

- `src/components/ui/menu.tsx` (Bug A), `src/components/ui/timezone-select.tsx` (decision note)
- `tools/blueprint-reference/src/App.tsx` (Bug B)

`pnpm build` green.

## Next steps

The library is feature-complete with **no open computed-style deltas** and no held fidelity items —
the two TimezoneSelect deltas are intentional and documented. → **open the PR to merge
`public-readiness` → `main`.**
