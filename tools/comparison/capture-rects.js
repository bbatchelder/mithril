// In-page capture of every [data-compare] specimen's bounding rect, for per-specimen
// visual diffing (diff-specimens.mjs). Each specimen is then cropped from the full-page
// screenshot by ITS OWN rect on each side, so the comparison is immune to gallery-level
// layout drift — only the component's own pixels are compared.
//
// Specimens carry either:
//   • data-compare   — paired in BOTH the computed-style diff and this visual diff, or
//   • data-vcompare  — VISUAL-ONLY (e.g. a whole-control wrapper): paired here but kept
//                      out of the computed-style diff, where a bare layout wrapper would
//                      just add noise.
//
// Returns a JSON string: { "<compare-key>": { x, y, w, h, dpr } } in CSS pixels.
// (The harness runs the dev servers at devicePixelRatio 1, but dpr is captured so the
// cropper scales correctly on HiDPI too.)
JSON.stringify(
    [...document.querySelectorAll("[data-compare], [data-vcompare]")].reduce((acc, el) => {
        const r = el.getBoundingClientRect();
        acc[el.getAttribute("data-compare") || el.getAttribute("data-vcompare")] = {
            x: r.left,
            y: r.top,
            w: r.width,
            h: r.height,
            dpr: window.devicePixelRatio || 1,
        };
        return acc;
    }, {}),
)
