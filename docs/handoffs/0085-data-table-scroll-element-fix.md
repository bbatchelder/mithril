# 0085 — DataTable bugfix: virtualizer never re-windowed on scroll

- **Date:** 2026-06-01
- **Focus:** Fix a user-reported bug in the Loop-2 virtualized grid: only the first ~25 rows
  rendered, scrolling revealed empty space, and a theme switch (any re-render) made the
  scrolled-to rows appear — until the next refresh.
- **Branch:** `public-readiness` — not merged.

## The bug

In the 1,000-row virtualized specimen, the grid rendered its initial window (~25 rows) and then
**never re-windowed on scroll** — you could scroll (the spacer was the right height) but the rows
stayed at the top, leaving empty space below. Toggling the theme (or any unrelated re-render) made
the correct rows for the current scroll position appear; a refresh reset it.

## Root cause

The scroll **viewport element** was wired with a plain `useRef` in the parent (`data-table.tsx`),
but the **virtualizer runs in the child** (`data-table/body.tsx`) and reads it via
`getScrollElement: () => scrollRef.current`. React commits **bottom-up**: a child's layout effect
runs *before* a parent host node's ref is attached. So when the virtualizer's `_willUpdate` layout
effect first ran, `scrollRef.current` was still `null` — the virtualizer set `scrollElement = null`,
attached **no scroll listener**, and never retried (it only re-subscribes when the element
*changes*, and nothing re-rendered it). The ~25 rows came purely from the `initialRect` seed
(Loop 2), masking the missing connection. A theme switch forced a re-render → `_willUpdate` ran
again → `scrollRef.current` was now set → it finally subscribed *and* read the live `scrollTop`,
which is why themes "fixed" it.

Confirmed by instrumenting the live virtualizer in a real browser: `scrollElement: false`,
`scrollOffset: 0` before and after a scroll to 6000px.

## The fix

Use a **state-backed callback ref** for the scroll element instead of `useRef`
(`data-table.tsx`): `const [scrollEl, setScrollEl] = useState(null)` + `<div ref={setScrollEl}>`,
passing `scrollEl` (the element, not a ref) to `DataTableBody`. When the node mounts, `setScrollEl`
runs as a callback ref and triggers the re-render that lets the virtualizer pick up a non-null
element and subscribe to scroll. (`body.tsx` now takes `scrollEl: HTMLDivElement | null` and does
`getScrollElement: () => scrollEl`.)

This is the canonical TanStack pattern for a scroll element that isn't co-located with the
virtualizer. The `initialRect` seed (Loop 2) stays — it still removes first-paint flicker and now
correctly hands off to the real ResizeObserver measurement once connected.

## Verified

- **Real browser** (agent-browser via the compare harness, which renders fresh/uncached code —
  unlike a persistent Chrome tab, which serves a stale module per the 0082 cache quirk):
  scroll to 6000px now re-windows to rows **291–325** (was stuck at 1–25); a scrolled screenshot
  shows Person 201–214 with the sticky header pinned and no empty space.
- `pnpm build` ✓ · `pnpm typecheck` ✓ · `pnpm test` **276 pass** (275 → 276; **+1 regression
  guard**: "connects the scroll viewport so the virtualizer subscribes to scroll" — asserts a
  `scroll` listener is attached to the grid, which only happens once `scrollElement` is non-null;
  it fails against the old `useRef` wiring). `compare.sh` unchanged (0.957/0.936 basic), since the
  bug was scroll-after-mount and the harness screenshots at scroll 0.

## Gotchas / things to know

- **jsdom can't reproduce this class of bug:** it clamps `scrollTop` to 0 (no layout), so scroll
  never fires, and its effect timing differs. The bug + fix were proven by driving `agent-browser`
  directly (`agent-browser --session X open … / eval … / screenshot`) against `:5173` — the
  reliable way to test the live grid given the persistent-Chrome module-cache quirk.
- **Test viewport stub:** because the element now genuinely connects in jsdom, the virtualizer's
  rect measurement reads the element's `offsetHeight` (0 in jsdom) and overrides `initialRect`. The
  test file therefore stubs `offsetHeight`/`offsetWidth` (200px viewport) in `beforeAll` so windows
  render — see the comment in `data-table.test.tsx`.

## Next steps

Resume the DataTable phase at **Loop 3 — selection** (see handoff 0084's "Next steps"). No change
to that plan; this was a fix to Loop 2.

## How to resume

```bash
cd /Users/bbatchelder/Code/analyst-ui
git switch public-readiness && git pull
pnpm build && pnpm test                       # green / 276
# verify the live scroll fix (real browser, uncached):
SES=dt; agent-browser --session $SES open "http://localhost:5173/?component=data-table&theme=light"
agent-browser --session $SES eval '(()=>{const g=document.querySelector(`[data-compare="data-table-virtual"] [role="grid"]`);g.scrollTop=6000;g.dispatchEvent(new Event("scroll"));return"ok"})()'
agent-browser --session $SES eval '[...document.querySelectorAll(`[data-compare="data-table-virtual"] [role="rowheader"]`)].map(e=>e.textContent)' --json
```

- Changed: `src/components/ui/data-table.tsx` (state-backed scroll-el ref),
  `src/components/ui/data-table/body.tsx` (`scrollEl` prop), `__tests__/data-table.test.tsx`
  (+regression guard, restored viewport stub), this handoff.
