# 0011 — Callout (Phase 1 complete — all 8/8 done)

- **Date:** 2026-05-25
- **Focus:** Build Callout component to Blueprint v6.15 fidelity; complete Phase 1
- **Branch / commit:** phase-1-primitives @ (see commit SHA)

## Summary

Built `src/components/ui/callout.tsx` with a clean modern API supporting `intent`, `icon`, `title`, `compact`, `minimal`, and all standard div HTML attributes. Composed the `<Icon>` component for default intent glyphs. Registered Callout in both galleries with 8 matching `data-compare` specimens. Two fixes were required after the first compare run: (1) the callout title must use `line-height:16px` (overriding H5's normal 19px) per Blueprint's SCSS, and (2) dark intent text colors must use palette tier -5 (`blue5/green5/orange5/red5`) directly, not the `color-mix()` `--intent-*-text` tokens which resolve to slightly different values. Comparison result: **8 match · 0 differ** in both light and dark themes. **Phase 1 is now COMPLETE — all 8 components done.**

## Current state

- **Callout:** Fully implemented and verified — `tools/compare.sh callout both` → 8/8 match both themes.
- **Icons:** All 4 default intent icons (info-sign, tick, warning-sign, error) were already vendored in `icons/index.ts` — no new additions needed.
- **Build:** `pnpm build` green (tsc + vite).
- **Phase 1 all green:** Button, Card, Icon, Text, Divider, Spinner, ProgressBar, Skeleton, Tag, Callout — all checked in ROADMAP.md.

## Decisions made (and why)

- **`icon?: ReactNode | null`** — `undefined` = auto-pick by intent; `null` = explicitly suppress; `ReactNode` = custom element. This mirrors Blueprint's "omit=auto, null=none" contract from the original `CalloutProps`.
- **Default intent → icon map** — `primary→info-sign`, `success→tick`, `warning→warning-sign`, `danger→error`, `none→(none)`. Taken directly from Blueprint's `renderIcon()` switch statement.
- **Title line-height = 16px, not 19px** — Blueprint's `_callout.scss` overrides the normal H5 `line-height:19px` to `line-height: $pt-icon-size-standard = 16px`. This is crucial for height matching; using 19px caused a 3px height gap across all specimens.
- **Dark intent text = palette tier -5, not `color-mix()` tokens** — `$pt-dark-intent-text-colors` in Blueprint's SCSS uses `blue5/green5/orange5/red5` (the raw palette values). The `--intent-*-text` tokens in dark mode use `color-mix(in oklch, intent-rest 51%, white)` which resolves to slightly different values (e.g. rgb(149,184,235) vs Blueprint's rgb(138,187,255)). Using `text-blue-5 dark:text-blue-5` style utilities hits the exact palette values.
- **Icon color for no-intent = `foreground-muted`** — Blueprint's `$pt-icon-color = gray1` (light) and `$pt-dark-icon-color = gray4` (dark), which map to `--foreground-muted`. This applies when intent="none" but an explicit icon ReactNode is passed.
- **Absolutely positioned icon** — The icon is positioned `absolute` inside the `relative` callout. Normal padding-left is extended to make room (`+16px icon width + 8px gap`). This exactly mirrors Blueprint's CSS layout.
- **`hasBodyContent` check** — Title `margin-bottom` is 0 with no children, 4px when children exist (= `$pt-spacing`). Blueprint adds `.bp6-callout-has-body-content` class to control this; we compute it inline from `children != null`.
- **No new tokens added** — All needed color utilities are already available as literal Tailwind classes (`bg-blue-3/10`, `text-blue-5`, etc.) or existing tokens. No tokens.css changes required.

## Gotchas / things to know

- **Callout title line-height is NOT the H5 default** — The callout SCSS overrides `line-height` to exactly `$pt-icon-size-standard (16px)`, not the H5 default of 19px. This is an important divergence from the general heading typography — it ensures the icon (absolutely positioned at the same top offset) visually aligns with the title.
- **Blueprint Callout forwards `data-compare` directly** — Unlike Tag/Spinner/ProgressBar which needed the `useRef+useEffect` wrapper trick, Blueprint's Callout spreads all `htmlProps` on the outer `<div>`. So `data-compare` can be passed as a normal prop on both sides.
- **Dark intent text colors diverge from `--intent-*-text`** — The callout uses raw palette `text-blue-5/dark:text-blue-5` etc., not the `text-intent-primary-text` utility. The `--intent-*-text` tokens in dark use `color-mix()` which gives lighter intermediate values (designed for outlined buttons), not Blueprint's `$pt-dark-intent-text-colors`.
- **Tailwind `bg-[rgba(...)]` for neutral bg** — The non-intent callout background uses arbitrary value syntax `bg-[rgba(143,153,168,0.15)]` since `gray-3` is not defined as a Tailwind opacity modifier. This is literal and tree-safe.
- **Position:relative required** — The callout div needs `relative` positioning so the absolutely-positioned icon spans its position correctly. Tailwind's `relative` class handles this.

## Next steps

> Phase 1 is complete. Next: open a PR for phase-1-primitives → main, get it merged, delete the branch, cut phase-2-form-controls off fresh main. First Phase 2 component is InputGroup.

1. **Open PR** — phase-1-primitives → main. PR description: "Phase 1 Primitives — Icon, Text, Divider, Spinner, ProgressBar, Skeleton, Tag, Callout (Blueprint v6.15 pixel-faithful, all 8/8 verified)". Merge commit (not squash).
2. **Sync main, delete phase branch, cut phase-2-form-controls** — `git checkout main && git pull && git branch -d phase-1-primitives && git checkout -b phase-2-form-controls`.
3. **InputGroup** — Phase 2 #1. Blueprint source: `packages/core/src/components/forms/inputGroup.tsx`. `--input-shadow` already tokenized. Intent validation states, sizes matching button heights (24/30/40), measured focus ring.

## How to resume

```bash
# Both servers
pnpm dev                                              # :5173
cd tools/blueprint-reference && pnpm dev              # :5174

# Verification
tools/compare.sh callout both

# Phase 1 PR
git push origin phase-1-primitives
gh pr create --title "Phase 1 Primitives" --body "..."
```

- Relevant files: `src/components/ui/callout.tsx` (new), `src/App.tsx` (CalloutGallery + COMPONENTS entry), `tools/blueprint-reference/src/App.tsx` (CalloutGallery + COMPONENTS entry), `docs/ROADMAP.md` (Callout checked — Phase 1 complete)
- Open questions for the user: None — Phase 1 is complete; orchestrator should open the Phase 1 PR now.
