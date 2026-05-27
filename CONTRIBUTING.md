# Contributing to analyst-ui

Thanks for your interest! analyst-ui has one overriding principle: **pixel-faithful to Blueprint, with a
clean modern API.** Everything below serves that.

## Principles

- **Blueprint is the design spec, not a code source.** Match its visuals exactly (color, density, elevation,
  type, motion). Do *not* copy Blueprint's SCSS/BEM implementation — re-implement with CVA + Radix.
- **Design clean, modern APIs.** Components are *not* drop-in compatible with Blueprint's props. Prefer the
  conventions you'd expect from a contemporary React/Tailwind library.
- **Tokens are the source of fidelity.** Visual values live in [`src/styles/tokens.css`](./src/styles/tokens.css).
  Reference them through *literal* Tailwind utility classes (`bg-blue-3`, `shadow-elevation-2`) — Tailwind v4
  tree-shakes unused `@theme` vars, so runtime `var()` in inline styles gets dropped.

## Development setup

```bash
pnpm install
pnpm dev        # gallery at :5173
pnpm build      # tsc -b + vite build (must stay green)
pnpm typecheck
```

For side-by-side comparison you'll want a local clone of [`palantir/blueprint`](https://github.com/palantir/blueprint)
at v6.15. Point the harness at it via the `BLUEPRINT_SRC` env var (defaults to `../blueprint`).

## The loop for a new/changed component

1. **Build** it in `src/components/ui/<name>.tsx` with CVA (and a Radix primitive where one fits).
2. **Show it** in the gallery — add a `<NameGallery />` and register it in the `COMPONENTS` array in
   `src/App.tsx`, and in `tools/blueprint-reference/src/App.tsx` under the **same `id`**. Tag matching
   specimens on both sides with `data-compare="<key>"`.
3. **Verify fidelity** — `pnpm build` green, then `tools/compare.sh <id>` (screenshots + computed-style
   diff vs Blueprint, both themes). Aim for an exact match; document any small, deliberate deltas.
4. **Sync the registry** — `pnpm gen:registry` (it derives deps from your imports; don't hand-edit
   `registry.json`).

## Verification is visual

There are no unit tests — correctness is verified against the real Blueprint via `tools/compare.sh`. See
[`tools/comparison/README.md`](./tools/comparison/README.md).

## Commit conventions

- Branch off `main`; don't commit directly to it.
- Keep a change self-contained: component + gallery entries + any token changes + registry regen in one commit.

## License

By contributing you agree your contributions are licensed under the project's [Apache-2.0](./LICENSE) license.
