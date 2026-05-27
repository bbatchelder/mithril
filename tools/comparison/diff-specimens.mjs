#!/usr/bin/env node
// Per-specimen visual diff. Crops every paired [data-compare] specimen from each
// full-page screenshot BY ITS OWN bounding rect, then compares the crops.
//
//   node diff-specimens.mjs <analyst.png> <blueprint.png> \
//        <analyst.rects.json> <blueprint.rects.json> <out-prefix> [label]
//
// WHY this is the reliable gate (vs. diff-pixels.mjs full-page):
//   The whole-page diff is dominated by benign gallery-spacing drift between the two
//   independent galleries, so its SSIM can't separate a faithful component from a
//   broken one. Cropping each specimen by its own rect removes ALL gallery layout from
//   the comparison — what's left is just the component's pixels vs Blueprint's, aligned
//   by content. A faithful specimen lands at SSIM ≈ 1.0 and ~0% mismatch; a real pixel
//   difference (color, border, size, internal layout) drops it sharply.
//
//   Two signals per specimen:
//     • size delta — if the rects differ in w/h, the component is the wrong size
//       (this is how a wrapped/oversized control is caught, when the WHOLE control is
//       tagged rather than just an inner box).
//     • SSIM + pixel mismatch — over the common (min) crop region.
//
// Coverage note: a specimen is only as good as its tag. Tagging an inner box (e.g. a
// checkbox indicator) compares that box precisely but won't see a mislaid sibling label
// — tag the whole control for that. The full-page diff image remains the catch-all.

import { readFileSync, writeFileSync } from "node:fs";

const [aPng, bPng, aRectsPath, bRectsPath, outPrefix, label = ""] = process.argv.slice(2);
if (!aPng || !bPng || !aRectsPath || !bRectsPath || !outPrefix) {
    console.error("usage: diff-specimens.mjs <a.png> <b.png> <a.rects.json> <b.rects.json> <out-prefix> [label]");
    process.exit(2);
}

const C = { dim: "\x1b[2m", red: "\x1b[31m", green: "\x1b[32m", yellow: "\x1b[33m", bold: "\x1b[1m", reset: "\x1b[0m" };

let PNG, pixelmatch;
try {
    ({ PNG } = await import("pngjs"));
    pixelmatch = (await import("pixelmatch")).default;
} catch {
    console.log(`${C.bold}specimen diff${label ? ` · ${label}` : ""}${C.reset}  ${C.dim}skipped — run \`pnpm install\` (needs pixelmatch + pngjs)${C.reset}`);
    process.exit(0);
}

/** Unwrap the agent-browser `eval --json` envelope → the key→rect object. */
function loadRects(path) {
    const outer = JSON.parse(readFileSync(path, "utf8").trim());
    if (!outer.success) throw new Error(`rect capture failed for ${path}: ${outer.error}`);
    return JSON.parse(outer.data.result);
}

const imgA = PNG.sync.read(readFileSync(aPng));
const imgB = PNG.sync.read(readFileSync(bPng));
const rectsA = loadRects(aRectsPath);
const rectsB = loadRects(bRectsPath);

/** Crop an integer pixel box out of a PNG into a tight RGBA buffer. */
function cropRect(img, rect) {
    const dpr = rect.dpr || 1;
    const x = Math.max(0, Math.round(rect.x * dpr));
    const y = Math.max(0, Math.round(rect.y * dpr));
    const w = Math.min(img.width - x, Math.round(rect.w * dpr));
    const h = Math.min(img.height - y, Math.round(rect.h * dpr));
    if (w <= 0 || h <= 0) return { w: 0, h: 0, data: Buffer.alloc(0) };
    const data = Buffer.alloc(w * h * 4);
    for (let row = 0; row < h; row++) {
        const s = ((y + row) * img.width + x) * 4;
        img.data.copy(data, row * w * 4, s, s + w * 4);
    }
    return { w, h, data };
}

/** SSIM over a single same-sized RGBA region (grayscale, ≤8×8 windows). */
function ssim(a, b, w, h) {
    const lumA = new Float64Array(w * h);
    const lumB = new Float64Array(w * h);
    for (let i = 0; i < w * h; i++) {
        const o = i * 4;
        lumA[i] = 0.299 * a[o] + 0.587 * a[o + 1] + 0.114 * a[o + 2];
        lumB[i] = 0.299 * b[o] + 0.587 * b[o + 1] + 0.114 * b[o + 2];
    }
    const win = Math.max(2, Math.min(8, w, h));
    const C1 = (0.01 * 255) ** 2;
    const C2 = (0.03 * 255) ** 2;
    let sum = 0;
    let n = 0;
    for (let by = 0; by + win <= h; by += win) {
        for (let bx = 0; bx + win <= w; bx += win) {
            let mA = 0;
            let mB = 0;
            for (let yy = 0; yy < win; yy++)
                for (let xx = 0; xx < win; xx++) {
                    const i = (by + yy) * w + (bx + xx);
                    mA += lumA[i];
                    mB += lumB[i];
                }
            const N = win * win;
            mA /= N;
            mB /= N;
            let vA = 0;
            let vB = 0;
            let cov = 0;
            for (let yy = 0; yy < win; yy++)
                for (let xx = 0; xx < win; xx++) {
                    const i = (by + yy) * w + (bx + xx);
                    const dA = lumA[i] - mA;
                    const dB = lumB[i] - mB;
                    vA += dA * dA;
                    vB += dB * dB;
                    cov += dA * dB;
                }
            vA /= N - 1;
            vB /= N - 1;
            cov /= N - 1;
            sum += ((2 * mA * mB + C1) * (2 * cov + C2)) / ((mA * mA + mB * mB + C1) * (vA + vB + C2));
            n++;
        }
    }
    return n ? sum / n : 1;
}

const keys = [...new Set([...Object.keys(rectsA), ...Object.keys(rectsB)])].sort();
const onlyA = [];
const onlyB = [];
const rows = [];

for (const key of keys) {
    if (!(key in rectsB)) { onlyA.push(key); continue; }
    if (!(key in rectsA)) { onlyB.push(key); continue; }
    const ca = cropRect(imgA, rectsA[key]);
    const cb = cropRect(imgB, rectsB[key]);
    if (!ca.w || !cb.w) { rows.push({ key, note: "zero-size crop" }); continue; }

    // Treat a ≤1px delta as a match — that's sub-pixel rounding from the two engines'
    // text metrics, not a real size difference.
    const sizeMismatch = Math.abs(ca.w - cb.w) > 1 || Math.abs(ca.h - cb.h) > 1;
    // Compare over the common top-left region.
    const w = Math.min(ca.w, cb.w);
    const h = Math.min(ca.h, cb.h);
    const subA = Buffer.alloc(w * h * 4);
    const subB = Buffer.alloc(w * h * 4);
    for (let row = 0; row < h; row++) {
        ca.data.copy(subA, row * w * 4, row * ca.w * 4, row * ca.w * 4 + w * 4);
        cb.data.copy(subB, row * w * 4, row * cb.w * 4, row * cb.w * 4 + w * 4);
    }
    const diff = Buffer.alloc(w * h * 4);
    const mismatch = pixelmatch(subA, subB, diff, w, h, { threshold: 0.1 });
    const ratio = mismatch / (w * h);
    const score = ssim(subA, subB, w, h);

    // A specimen is "off" if it differs in size, or the crops diverge in content.
    const flagged = sizeMismatch || score < 0.97 || ratio > 0.02;
    if (flagged) {
        const out = new PNG({ width: w, height: h });
        diff.copy(out.data);
        const safe = key.replace(/[^a-z0-9._-]/gi, "_");
        writeFileSync(`${outPrefix}.${safe}.spec.png`, PNG.sync.write(out));
    }
    rows.push({ key, aw: ca.w, ah: ca.h, bw: cb.w, bh: cb.h, sizeMismatch, score, ratio, flagged });
}

// --- report ---
console.log(`${C.bold}specimen diff${label ? ` · ${label}` : ""}${C.reset}  ${C.dim}(per-[data-compare] crop · analyst vs blueprint)${C.reset}`);

const diffed = rows.filter((r) => !r.note);
const pad = (s, n) => String(s).padEnd(n);
if (diffed.length) {
    console.log(`  ${C.dim}${pad("specimen", 28)}${pad("size A→B", 18)}${pad("SSIM", 9)}mismatch${C.reset}`);
}
for (const r of rows) {
    if (r.note) {
        console.log(`  ${pad(r.key, 28)}${C.dim}${r.note}${C.reset}`);
        continue;
    }
    const size = r.sizeMismatch ? `${C.red}${r.aw}×${r.ah} → ${r.bw}×${r.bh}${C.reset}` : `${r.aw}×${r.ah}`;
    const sizeCol = r.sizeMismatch ? size + " ".repeat(Math.max(0, 18 - `${r.aw}×${r.ah} → ${r.bw}×${r.bh}`.length)) : pad(size, 18);
    const sc = r.score >= 0.97 ? C.green : r.score >= 0.9 ? C.yellow : C.red;
    const mark = r.flagged ? `${C.yellow} ⚠${C.reset}` : "";
    console.log(`  ${pad(r.key, 28)}${sizeCol}${sc}${pad(r.score.toFixed(3), 9)}${C.reset}${(r.ratio * 100).toFixed(2)}%${mark}`);
}

if (onlyA.length) console.log(`\n  ${C.dim}only in analyst:  ${onlyA.join(", ")}${C.reset}`);
if (onlyB.length) console.log(`  ${C.dim}only in blueprint: ${onlyB.join(", ")}${C.reset}`);

const worst = diffed.reduce((m, r) => (r.score < m.score ? r : m), { score: 1, key: "—" });
const sizeMismatches = diffed.filter((r) => r.sizeMismatch).length;
const flaggedCount = diffed.filter((r) => r.flagged).length;
const allGood = flaggedCount === 0 && diffed.length > 0;
const summaryColor = allGood ? C.green : C.yellow;
console.log(
    `\n  ${summaryColor}${diffed.length} specimens · min SSIM ${worst.score.toFixed(3)} (${worst.key})` +
        `${sizeMismatches ? ` · ${sizeMismatches} size mismatch` : ""}` +
        `${flaggedCount ? ` · ${flaggedCount} flagged → see *.spec.png` : " · all clean"}${C.reset}`,
);
