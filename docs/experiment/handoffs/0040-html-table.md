# 0040 — HTMLTable (Phase 4 #9)

- **Date:** 2026-05-26
- **Focus:** Build HTMLTable (styled `<table>`) to Blueprint v6.15 fidelity, both light and dark themes.
- **Branch / commit:** phase-4-navigation @ (see commit SHA)

## Summary

Built `src/components/ui/html-table.tsx` exporting `HTMLTable` (+ `tableVariants` CVA) — a styled
`<table>` with `bordered` / `striped` / `interactive` / `compact` boolean variants. Consumers compose
native `<thead>/<tbody>/<tfoot>/<tr>/<th>/<td>` inside (shadcn-style). Registered in both galleries under
`id="html-table"`. Verified with `tools/compare.sh html-table both`.

- **Light:** 3 match · 0 differ — perfect.
- **Dark:** 3 match · 0 differ — perfect.

**Phase 4 item 9 of 15 — HTMLTable COMPLETE.**

> **Recovery note:** the build worker verified the component (3/3 both themes) but terminated before
> wrapping up — it wrote `html-table.tsx` + both galleries (uncommitted) but did not tick the roadmap,
> write this handoff, or commit (its final message was a verification report with no commit SHA). The
> orchestrator re-verified the uncommitted work itself (`pnpm build` green, `compare.sh html-table both`
> = 3/3 both themes, screenshot review of all four variants) and completed the loop. No rework needed.

## API

```tsx
<HTMLTable>            {/* plain */}
  <thead><tr><th>Name</th><th>Role</th><th>Status</th></tr></thead>
  <tbody>
    <tr><td>Alice</td><td>Engineer</td><td>Active</td></tr>
    ...
  </tbody>
</HTMLTable>

<HTMLTable bordered striped>…</HTMLTable>   {/* column separators + odd-row stripes */}
<HTMLTable interactive>…</HTMLTable>         {/* row hover/active bg + cursor pointer */}
<HTMLTable compact>…</HTMLTable>             {/* reduced vertical cell padding */}
```

### HTMLTable props

| Prop | Type | Default | Description |
|---|---|---|---|
| `bordered` | `boolean` | `false` | Vertical column separators + per-cell top borders (via inset box-shadow, like Blueprint). |
| `striped` | `boolean` | `false` | Alternating background on odd `tbody` rows. |
| `interactive` | `boolean` | `false` | Row hover + active background; `cursor: pointer` on hover. |
| `compact` | `boolean` | `false` | Vertical cell padding 6px instead of 11px. |
| `className` | `string` | — | Additional classes on the `<table>`. |
| …rest | `TableHTMLAttributes` | — | Forwarded to the `<table>`. |

## Blueprint metrics matched

| Property | Value | Source |
|---|---|---|
| `border-spacing` / collapse | `0` / `separate` | `.bp6-html-table { border-spacing: 0 }` (separate so box-shadow borders render) |
| Font size | `14px` | `$pt-font-size` |
| th/td padding | `11px` all sides | `centered-text(40px) = floor((40-18)·0.5)` |
| th/td align | `text-align:left; vertical-align:top` | base rule |
| th color / weight | heading color / `600` | `$pt-heading-color`, `font-weight:600` |
| td color | text color | `$pt-text-color` |
| First-row top border | `inset 0 1px 0 0 rgba(17,20,24,0.15)` light / `rgba(255,255,255,0.2)` dark | `tbody/tfoot tr:first-child th,td` box-shadow; `$table-border-color` / `$dark-table-border-color` |
| bordered th sep | `inset 1px 0 0 0 <border>` on `th:not(:first-child)` | `.bp6-html-table-bordered` |
| bordered td | `inset 0 1px 0 0 <border>` all td; `inset 1px 1px 0 0` on `td:not(:first-child)` | bordered rules |
| striped odd bg | `rgba(143,153,168,0.15)` light / `rgba(95,107,124,0.15)` dark | `rgba($gray3,.15)` / `rgba($gray1,.15)` |
| interactive hover | `rgba(143,153,168,0.3)` light / `rgba(95,107,124,0.3)` dark | `.bp6-interactive tbody tr:hover td` |
| interactive active | `rgba(143,153,168,0.35)` light / `rgba(95,107,124,0.4)` dark | active rules |
| compact padding-y | `6px` | `centered-text(30px) = floor((30-18)·0.5)` |

## Design decisions

- **CVA on the `<table>` with `[&_selector]:utility` descendant variants**: every Blueprint cell rule
  (`th`/`td` padding, first-row border, bordered separators, stripes, hover) is expressed as a Tailwind v4
  arbitrary descendant selector on the table element, so consumers drop in plain native table markup.
- **Cell separators via inset box-shadow, not `border`** — matches Blueprint exactly (Blueprint uses
  `box-shadow: inset …` so separators don't affect layout/`border-spacing`). Expressed as literal
  `shadow-[inset_…_rgba(17,20,24,0.15)]` arbitrary classes (tree-shake-safe; Tailwind v4 emits them).
- **Used Blueprint's true divider base color `rgba(17,20,24,0.15)`** (not pure black) — this is why the
  diff is an EXACT 0-delta match rather than carrying the usual sub-perceptual black-vs-near-black delta.
- **shadcn-style composition**: the component is just the styled `<table>`; `thead/tbody/tr/th/td` are
  the consumer's native elements. Keeps the API minimal and the markup obvious.

## Accepted deltas

None. Both themes: 3 match · 0 differ.

## compare.sh results

```
html-table · light:  3 match · 0 differ
html-table · dark:   3 match · 0 differ
```

Screenshot confirmation (light + dark): four variants render correctly — Plain (semibold headers, first-row
top separator), Bordered+Striped (vertical column separators + odd-row stripe bg on Alice/Carol),
Interactive (identical at rest; hover not capturable statically), Compact (visibly tighter row height).
Dark uses the white-at-20% separator and near-white (`#f6f7f9`) header text per the dark-foreground decision.

## New dependencies added

None.

## Current state

- **HTMLTable:** Implemented and verified — `tools/compare.sh html-table both`.
- **Build:** `pnpm build` green (tsc + vite).
- **Phase 4:** 9/15 COMPLETE. Navbar ✓ Tabs ✓ Collapse ✓ Section ✓ CardList ✓ Breadcrumbs ✓ Tree ✓ PanelStack ✓ HTMLTable ✓

## Next steps

> Next action: **EditableText** (`packages/core/src/components/editable-text/`).
>
> Phase 4 remaining (in order):
> 10. **EditableText** — `editable-text/` (click-to-edit; span ↔ input/textarea, placeholder, multiline, confirm on blur/Enter, cancel on Esc)
> 11. **EntityTitle** — `entity-title/`
> 12. **NonIdealState** — `non-ideal-state/`
> 13. **Link** — `link/`
> 14. **Slider** — `slider/`
> 15. **Hotkeys** — `hotkeys/`

## How to resume

```bash
git branch --show-current  # should be phase-4-navigation
pnpm dev                                              # :5173
cd tools/blueprint-reference && pnpm dev              # :5174
tools/compare.sh html-table both     # re-verify
tools/compare.sh editable-text both  # next target
```

- Relevant files:
  - `src/components/ui/html-table.tsx` (new — HTMLTable + tableVariants)
  - `src/App.tsx` (HTMLTableGallery + COMPONENTS entry + import)
  - `tools/blueprint-reference/src/App.tsx` (HTMLTableGallery + COMPONENTS entry + import)
  - `docs/ROADMAP.md` (HTMLTable checked)
