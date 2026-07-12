// Runs inside the harness page (?component=<id>&theme=<light|dark>) via
// `agent-browser eval` — returns the rendered body DOM plus a content height
// for the preview frame.
(() => {
    const clone = document.body.cloneNode(true);
    for (const el of clone.querySelectorAll("script, style, link, vite-error-overlay")) el.remove();
    // Height = harness content column bottom (+ p-10 bottom padding), extended by any
    // portal/fixed overlay content (dialogs, toasts, popovers). Portal wrappers are
    // zero-height statics, so scan their descendants; ignore full-viewport backdrops
    // (they stretch to whatever frame height we pick) and clamp to the viewport.
    const col = document.querySelector("#root .mx-auto");
    let maxBottom = col ? col.getBoundingClientRect().bottom + 40 : document.documentElement.scrollHeight;
    const vw = innerWidth, vh = innerHeight;
    for (const el of document.body.children) {
        if (el.id === "root") continue; // its min-h-screen wrapper always spans the viewport
        for (const d of [el, ...el.querySelectorAll("*")]) {
            const r = d.getBoundingClientRect();
            if (r.height <= 0 || r.width <= 0) continue;
            if (r.width >= vw * 0.9 && r.height >= vh * 0.9) continue; // backdrop
            const b = Math.min(r.bottom, vh) + 40;
            if (b > maxBottom) maxBottom = b;
        }
    }
    return { html: clone.innerHTML, height: Math.ceil(maxBottom) };
})()
