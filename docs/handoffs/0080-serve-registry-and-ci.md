# 0080 — P2.1: serve the shadcn registry + add CI

- **Date:** 2026-05-31
- **Focus:** Make the headline `npx shadcn add` install path actually work (the most embarrassing
  public-readiness gap) and add a CI gate. The registry was *generated* but never *served*, so the
  documented install command was aspirational.
- **Branch:** `public-readiness` — **NOT merged to main** (the deploy.yml change only takes effect on
  merge; left for the user to merge + trigger the first real deploy).

## Summary

The registry now builds into the deployed output and is installable two ways, both verified end-to-end:

```bash
# 1. Direct URL — zero consumer config:
npx shadcn@latest add https://bbatchelder.github.io/analyst-ui/r/button.json

# 2. Namespaced — one components.json `registries` entry, then short names:
npx shadcn@latest add @analyst-ui/button
```

Both pull the full transitive closure (e.g. `select` → popover + menu + input-group + icon + types +
utils + tokens) and dedupe already-installed deps.

## The mechanism (and why it's two steps)

`shadcn add <url>` does **not** fetch `registry.json` — it fetches **per-item JSON with source inlined**.
And `shadcn build` (which produces those) **preserves bare-name `registryDependencies`**, which a consumer
can't resolve against our host. So the pipeline is:

1. **`shadcn build registry.json --output dist/r`** (official CLI, pinned **4.9.0** via `pnpm dlx`) — emits
   one `<name>.json` per item with `files[].content` inlined.
2. **`tools/rewrite-registry-urls.mjs`** (new, dependency-free) — rewrites every internal bare-name dep
   → `https://bbatchelder.github.io/analyst-ui/r/<name>.json`, and copies the source `registry.json` to
   `dist/r/registry.json` for discoverability. Base URL overridable via `REGISTRY_BASE_URL` (used for local
   testing against `http://localhost:PORT`).

**Why full-URL deps (not the `@analyst-ui` namespace) inside the items:** URL deps make *both* install
methods work. The direct-URL install resolves them with no config; the namespaced install fetches the same
item (whose deps are still URLs) and resolves those too. Namespaced deps would have *required* config even
for the URL install. (`registries` namespace is purely a consumer-side `{name}`→URL convenience.)

## What shipped

- **`tools/rewrite-registry-urls.mjs`** (new) — the post-processor. Only rewrites bare names that match an
  emitted item (future external deps pass through); skips already-`http`/`@`-prefixed deps.
- **`package.json`** — new script:
  `"build:registry": "pnpm dlx shadcn@4.9.0 build registry.json --output dist/r && node tools/rewrite-registry-urls.mjs"`.
  Kept **separate** from `pnpm build` so the local gallery/dev loop stays fast and offline (shadcn build
  needs network). `shadcn` is intentionally **not** a devDependency (avoids a full `node_modules` reinstall
  under the current pnpm store-version bump, and keeps `--frozen-lockfile` clean); pinned via `pnpm dlx`.
- **`.github/workflows/deploy.yml`** — added `- run: pnpm build:registry` after `pnpm build` (must run
  after — vite cleans `dist/`), before `upload-pages-artifact`. Same `dist` artifact now carries `/r`.
- **`.github/workflows/ci.yml`** (new) — on PRs + push to main: `install → build → test → registry-drift
  guard → build:registry` smoke test. The drift guard (`pnpm gen:registry` then
  `git diff --exit-code registry.json`) catches a component-import change that wasn't followed by a regen.
- **`README.md`** — replaced the ⚠️ "registry not yet served" section with both working install methods;
  reordered so the registry is the recommended path and copy-the-source is the manual alternative. Also
  fixed two stale caveats (MultistepDialog/ButtonGroup/AnchorButton are built; registry is hosted).

## Verified

- `pnpm build` ✓ · `pnpm test` **240 pass** · registry-drift guard clean (`registry.json` in sync).
- Registry build produces **63 items + index** in `dist/r` with content inlined and deps as URLs
  (`button` → icon/spinner/types/utils/tokens; `select` → input-group/menu/popover/utils/tokens).
- **End-to-end install** into a fresh scratch project (local server, `REGISTRY_BASE_URL=http://localhost:8077`):
  - Direct URL: `shadcn add …/r/select.json` → 9 files (full transitive closure).
  - Namespace: `shadcn add @analyst-ui/button` → created spinner + button, **skipped** the 5 shared deps
    already present (dedup works across methods).
- `dist/` is gitignored — no build artifacts committed.

## Caveat / note for next session

- **Local verification used the cached `shadcn` binary**, not `pnpm dlx`, because this sandbox couldn't
  reach the npm registry (`pnpm dlx`/`npx` both hit ETIMEDOUT/EHOSTUNREACH). The `shadcn build` + rewrite
  logic and the resulting install are fully proven; **CI/deploy will be the first real exercise of the
  `pnpm dlx shadcn@4.9.0` invocation** (they have network). If `pnpm dlx` ever flakes, switch the script to
  `npx -y shadcn@4.9.0` (equivalent) or vendor `shadcn` as a devDep once the pnpm store is reconciled.
- **First deploy:** merging `public-readiness` → main triggers `deploy.yml`, which will publish `/r` for the
  first time. Worth a manual `shadcn add https://bbatchelder.github.io/analyst-ui/r/button.json` against the
  live URL to confirm Pages serves the JSON with the right content-type (Pages serves `.json` fine; just
  confirm).
- Pages must be enabled for the repo (it already is — the gallery deploys today).

## Next steps (updated priorities)

Phase C P2.1 ✅ · P2.3 ✅ · P2.4 ✅. Remaining release-readiness items, roughly in order:

1. **P2.2 — icon tree-shaking.** Now more visible: every component that accepts `icon="…"` (P2.4) hard-depends
   on the 706-glyph map (~195 KB gzip). Codemod the static `ICON_GLYPHS` map to per-glyph modules so
   importing `Icon` only pulls used glyphs. Biggest bundle win.
2. **P1.3 — promote infra** (ResizeSensor, OverflowList, Portal) — finishes Phase B except the grid.
3. **P1.1 — the data grid** (`DataTable`) — the big multi-loop feature lever.

## How to resume

```bash
cd /Users/bbatchelder/Code/analyst-ui
git switch public-readiness && git pull
pnpm build && pnpm test          # green / 240
pnpm build:registry              # needs network (pnpm dlx shadcn@4.9.0) → emits dist/r
# Then to sanity-check an install after deploy:
#   npx shadcn@latest add https://bbatchelder.github.io/analyst-ui/r/button.json   (into a scratch project)
```

- New files: `tools/rewrite-registry-urls.mjs`, `.github/workflows/ci.yml`,
  `docs/handoffs/0080-serve-registry-and-ci.md`. Modified: `package.json`, `deploy.yml`, `README.md`,
  `docs/blueprint-parity-roadmap.md`. New deps: **none** (shadcn pulled on demand via `pnpm dlx`).
