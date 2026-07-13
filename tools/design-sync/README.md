# design-sync — the Claude Design kit generator

Builds the **"Mithril Design System"** project on [claude.ai/design](https://claude.ai/design)
(projectId `00e2117f-9bf2-4e92-be5e-ec9d44825f1f`), so Claude Design can mock up mithril-based
app UI. The kit is a static bundle under `dist-design/bundle/ui_kits/mithril/`:

- `components/<id>.html` — one preview card per gallery showcase, showing the component in
  **light and dark**. These are not hand-written: each frame is the **real rendered DOM**
  captured from the dev server's isolated harness (`?component=<id>&theme=…`), so fidelity is
  inherited from the actual implementation (open dialogs, drawers, popovers, portals included).
- `examples/<id>.html` — **full-page design examples** (group "Examples"): complete surfaces
  composed from mithril components (app shells, catalog tables, search heroes) that a mockup
  can start from. Same captured-DOM pipeline, but rendered full-bleed via `?example=<id>&theme=…`
  at the entry's own width (typically 1440px vs the 900px component cards). Source pages live in
  `src/examples/` and register in `src/examples/registry.ts` (gen-meta parses that file textually
  — keep entry fields literal, in `id, title, description, width` order).
- `foundations/*.html` — token cards (palette, intents/semantic tokens, typography,
  elevation/radius/motion, built-in themes) generated from literals mirrored out of
  `src/styles/tokens.css`.
- `assets/mithril.css` — the compiled app stylesheet (Tailwind CLI over
  `src/styles/globals.css`) plus a `:where(:root)` addendum re-declaring the full static token
  set as plain vars (Tailwind v4 tree-shakes unused `@theme` vars; `:where()` keeps the addendum
  at zero specificity so `[data-theme]` overrides always win).
- `README.md` — the usage guide the mockup agent reads (link the CSS, `.dark` wrapper,
  `data-theme`, "copy markup from the cards, don't invent utility classes").

Every card's **first line** is a `<!-- @dsCard group="…" name="…" width="…" height="…" -->`
marker — the Claude Design app builds its Design System pane index from these.

## Workflow

Prereqs: dev server running (`tap run mithril-demo -- pnpm run dev`), the `agent-browser` CLI
on PATH. Both capture and check drive `agent-browser`; its daemon can wedge on a cold-start
race — if a run fails immediately with "daemon may be busy or unresponsive", run
`agent-browser close --all` and retry (the capture script can resume via its slice/id args).

```bash
tools/design-sync/capture-all.sh        # 1. capture all showcases → dist-design/captures/
                                        #    (also: `… 1 33` slice, or `… dialog toast` id list)
node tools/design-sync/build.mjs        # 2. compile CSS + assemble bundle → dist-design/bundle/
node tools/design-sync/render-check.mjs # 3. verify every card renders (serves the bundle itself)
```

`render-check` opens each card over HTTP and asserts: CSS resolved (body at 14px, frame
backgrounds non-transparent), light ≠ dark, non-trivial content, and nothing pokes past a
frame's clipped bottom edge. It screenshots every card into `dist-design/.render-check/` for
eyeballing and exits non-zero on any finding.

**4. Push** — done by Claude via the `DesignSync` tool (there is no local upload script):
`finalize_plan` with `localDir: dist-design/bundle`, `writes: ["ui_kits/mithril/**"]` against the
projectId above, then `write_files` with one `localPath` entry per file. Prefer updating changed
components only (the tool is built for incremental sync); re-check the Design System pane on
claude.ai afterwards.

## Gotchas learned building this

- **Portal wrappers are zero-height statics** — a dialog's measured height must come from the
  portal's *descendants*, skipping full-viewport backdrops (see `extract.js`). And `#root` must
  be excluded from body-child scans: its `min-h-screen` wrapper always spans the viewport.
- **Fixed-position overlays in a static card** are contained by giving the frame div a CSS
  `transform` (makes it the containing block) + `overflow: hidden`.
- **The frame paints the theme background itself** — the captured `min-h-full` bg wrapper's
  percentage chain breaks through `#root`, so portal content below it would sit on page-white.
- **Enter animations measure short in headless capture** (rAF throttling freezes mid-flight
  positions): `FRAME_MIN` in `build.mjs` floors the affected cards (toast, omnibar, hotkeys).
- **Dark mode needs no synthesis**: captures are taken per theme, and mithril portals carry
  their own `.dark` wrapper inside the portal, so each capture is self-contained.
- The `AnchorButton`/`ButtonGroup` cards land in "Other" because they're absent from
  `CATEGORIES` in `src/App.tsx` — fix them there if it grates; the kit mirrors the gallery.
- The claude.ai pane warns "Missing brand font: Oxygen" — cosmetic; Oxygen is just the Linux
  fallback in the *system* font stack, there is no font file to upload.
- **Adding a NEW card file doesn't update the pane index**: the Design System pane reads
  `_ds_manifest.json` (project root), compiled from the `@dsCard` markers by the app's own
  self-check — which does not re-run on a DesignSync write. After pushing a brand-new card,
  `get_file` the manifest, append a `{path, group, name, subtitle}` entry to its `cards`
  array, and `write_files` it back (root path, so it needs its own finalize_plan). Edits to
  an *existing* card need no manifest touch.
