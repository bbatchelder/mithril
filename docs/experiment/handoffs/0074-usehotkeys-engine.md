# 0074 — useHotkeys engine (P0.3 / P1.2)

- **Date:** 2026-05-31
- **Focus:** Implement the hotkey **binding/dispatch engine** behind the existing display-only
  `Hotkeys`/`KeyCombo`/`HotkeysDialog` — closing roadmap items **P0.3** and **P1.2** (cross-listed).
- **Branch / commit:** `public-readiness` @ `4bbdcd8` (working changes **uncommitted** — see Branch state)

## Summary

`hotkeys.tsx` was presentation-only (rendered key caps + a static dialog) with **no key binding**.
This session ported Blueprint v6.15's hotkey engine into the same owned file with the project's clean
API: a `parseKeyCombo`/`getKeyCombo`/`comboMatches` parser, a `HotkeysContext` + `HotkeysProvider`
(which renders the existing `HotkeysDialog` driven by context state), and the `useHotkeys(keys, options)`
hook. Registering a hotkey now actually fires; `?` opens the help dialog from real bindings. Added
`hotkeys.test.tsx` (16 cases) as the behavior regression net. `pnpm build` + `pnpm test` green (89 total,
+16); `compare.sh hotkeys both` computed-style gate **6 match · 0 differ** in both themes (engine adds no
visuals).

## What shipped

All in `src/components/ui/hotkeys.tsx` (kept self-contained per the own-the-source model):

- **Parser** (1:1 Blueprint port): `MODIFIER_BIT_MASKS`, `SHIFT_KEYS`, `parseKeyCombo` (combo string →
  `{ modifiers, key }`), `getKeyCombo` (live `KeyboardEvent` → same shape, with the digit-via-`code`,
  letter-via-`key`, Alt-composed-char, and shifted-symbol nuances), `comboMatches`, plus a local
  `elementIsTextInput` (input/textarea/contenteditable, excluding checkbox/radio/readonly). Reuses the
  file's existing `CONFIG_ALIASES`/`isMac()` (the display parser `parseCombo` is unchanged and distinct).
- **`HotkeyConfig` extended** with the behavioral fields: `onKeyDown`/`onKeyUp` (receive native
  `KeyboardEvent`), `allowInInput`, `disabled`, `preventDefault`, `stopPropagation`. The dialog still
  only reads `label`/`combo`/`group`/`global`, so it's backward-compatible.
- **`HotkeysContext` + `HotkeysProvider`**: reducer with `ADD_HOTKEYS` (dedups by everything but the
  callbacks, so two components binding the same global combo show one dialog row) / `REMOVE_HOTKEYS` /
  `OPEN_DIALOG` / `CLOSE_DIALOG`. The provider renders the existing `HotkeysDialog` wired to
  `isDialogOpen` + the registered `hotkeys`, takes `dark`/`dialogTitle`/`globalGroupName`, and supports a
  shared `value` for nested providers (in which case it renders no dialog).
- **`useHotkeys(keys, options)`**: splits global/local, registers all with the provider for the dialog,
  binds `document` keydown/keyup for globals, returns `{ handleKeyDown, handleKeyUp }` for locals.
  Respects input-target exclusion (unless `allowInInput`), `disabled`, `preventDefault`,
  `stopPropagation`. `options.showDialogKeyCombo` (default `"?"`) opens the dialog when pressed outside a
  text input; `false` disables it. `options.document` overrides the bound document. Warns once (console)
  if used with no provider, but still binds (matches Blueprint).

## Skylark integration (demo dogfood)

Wired the engine into the **Mission Control (Skylark)** demo (`src/demos/mission/MissionControl.tsx`)
to dogfood it in a real app:

- Split the export into a thin `MissionControl` wrapper (provides `HotkeysProvider dark={dark}`) and
  `MissionControlInner` (the existing body, now a provider child) — so `useHotkeys` can be called
  directly inside it with no re-indent of the existing JSX.
- Registered global hotkeys: `p` play/pause, `1`/`2`/`5` speed, `f` follow, `/` focus search
  (`preventDefault`), `j`/`k` cycle drone selection, `o` open drone details, `escape` clear selection,
  and a display-only `?` row. `?` opens the help dialog via the provider.
- Callbacks read live state (the drone roster changes every stream tick) through a `hotkeyState` ref so
  the registered combo list stays stable (`useMemo`) — otherwise the document listener would re-bind
  every tick. `stream.toggle`/`setSpeed` are already `useCallback([])`-stable.
- Added a navbar `HotkeysHelpButton` (key icon) that opens the dialog by dispatching `OPEN_DIALOG` via
  the exported `HotkeysContext` — demonstrates programmatic open without exposing a new API.
- Design choices to avoid conflicts: `o` (not `enter`) opens details, since global `enter` would
  double-fire with button/menu-item activation. `escape` only clears selection when the drawer is
  closed (the Drawer's own Radix Escape handles the open case). Single-letter combos are safe while a
  button is focused (only Space/Enter activate). Not bound inside text inputs (`allowInInput` unset).

Verified: `pnpm build` ✓ (typechecks the wiring). Behavioral end-to-end in the live app was **not**
browser-verified this session (chrome-MCP navigate was declined); the engine itself is covered by the 16
unit tests. Dev server confirmed serving at `:5176/#demo-mission`.

## Current state

- **Verified:**
  - `pnpm test` → **89 passed** (13 files, +16 new in `hotkeys.test.tsx`): parser/match, global
    keydown/keyup dispatch, no-match, listener cleanup on unmount, text-input exclusion + `allowInInput`,
    `disabled`, `preventDefault` (asserts `event.defaultPrevented`), local-only dispatch (global listener
    does NOT fire local hotkeys), `?` opens the provider dialog + lists registered hotkeys, and `?`
    suppressed while typing in a field.
  - `pnpm build` ✓ (tsc -b + vite). `pnpm typecheck` ✓.
  - `tools/compare.sh hotkeys both`: computed-style **6 match · 0 differ** in light + dark. The waived
    specimens (`hotkey-combo`, `hotkey-key`) are the **pre-existing** accepted KeyCombo-glyph deltas, not
    new. The added live-demo gallery section did not disturb any `data-compare` specimen.
- **Not verified:** live VoiceOver/NVDA pass (standing manual item, unchanged). No live-browser drive of
  the new gallery demo — engine behavior is covered by jsdom tests; visuals by the harness.

## Decisions made (and why)

- **Engine lives in `hotkeys.tsx`, not a new `lib/` file** — keeps the shadcn own-the-source model: one
  file owns all hotkey concerns (Blueprint splits it across 5 files; we don't need to). The file is
  larger but self-contained and copyable via the registry.
- **No `HotkeysTarget` class-component shim** — that exists in Blueprint only for class components.
  React-19, hook-first API ⇒ skipped (roadmap asked for "hook + provider").
- **Reused the existing `CONFIG_ALIASES`/`isMac()`** rather than re-declaring — the display parser's
  alias values are already lowercased and compatible with `parseKeyCombo` (which lowercases input first).
- **Tests use explicit `ctrl`/`shift` combos, not `mod`** — `mod` resolves via `isMac()`/navigator
  platform, which is environment-dependent in jsdom. Parser-level `mod` behavior is still covered
  indirectly (it maps to `ctrl`/`meta` bitmask).
- **Regenerated `registry.json`** — picks up the true import graph. The diff also reconciles
  **pre-existing drift** unrelated to this change (context-menu→menu, tabs Radix deps, hotkeys→icon dep
  that predated this session). All legitimate; `gen:registry` is the source of truth (see P2.1).

## Gotchas / things to know

- The `HotkeysDialog` still emits a Radix "Missing `Description`/`aria-describedby`" dev warning when
  open (pre-existing — the dialog sets a title but no description). Harmless; surfaced in the new dialog
  test's stderr. If chased later, add a visually-hidden description to `HotkeysDialog`.
- `getKeyCombo` for `?` → `{ modifiers: shift, key: "/" }` (shift+slash), matching `parseKeyCombo("?")`.
  When testing the dialog open, fire `{ key: "?", code: "Slash", shiftKey: true }`.
- `fireEvent` is used (not `userEvent`) for the global path because the listener is on `document` and
  `fireEvent.keyDown(target, …)` lets us set `code`/modifier flags precisely and control `e.target` for
  the input-exclusion cases.

## Next steps

> Per the roadmap (`docs/blueprint-parity-roadmap.md`) sequencing, with P0 now fully closed:

1. **P1.3 quick wins** — `ButtonGroup`, `AnchorButton`, `MultistepDialog`/`DialogStep`. Files:
   new `src/components/ui/button-group.tsx`, `multistep-dialog.tsx`; `AnchorButton` likely an `as`/anchor
   path in `button.tsx`. Blueprint refs: `buttonGroup.tsx`, `anchorButton.tsx`, `multistepDialog.tsx`.
2. **P2.8 submenus** — the now-keyboard-capable `Menu` unblocks declarative `MenuItem` submenus (Radix
   `*.Sub` via `MenuItemSlotContext`); also Popover `interactionKind="hover"`.
3. **P1.1 data grid** — the big multi-loop phase (TanStack Table + Virtual under mithril's API + tokens).

## How to resume

```bash
cd /Users/bbatchelder/Code/mithril
pnpm test                       # 89 pass (16 in hotkeys.test.tsx)
pnpm build                      # green
tools/compare.sh hotkeys both   # 6 match · 0 differ both themes
pnpm dev                        # :5173 → Hotkeys section has a live "useHotkeys" demo
```

- Relevant files: `src/components/ui/hotkeys.tsx` (engine), `src/components/ui/__tests__/hotkeys.test.tsx`,
  `src/App.tsx` (`HotkeysLiveDemo` + `HotkeysGallery` wrapped in `HotkeysProvider`), `registry.json`.
- New deps: **none** (engine is dependency-free; uses React + existing Dialog/Icon).
- Open questions for the user: whether to commit/push this (left **uncommitted** per the recent
  no-PR-yet pattern in 0070–0073) and whether to fold it into a phase branch or keep on
  `public-readiness`.
