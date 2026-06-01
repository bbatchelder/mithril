#!/usr/bin/env node
// Visual diff of the two full-page screenshots the harness already captures.
// Writes a diff IMAGE (the primary artifact) plus an SSIM + pixel-mismatch number
// as a triage hint.
//
//   node diff-pixels.mjs <mithril.png> <blueprint.png> <diff-out.png> [label]
//
// WHY this exists: the computed-style diff (diff-styles.mjs) only inspects the tagged
// [data-compare] elements, so it is blind to layout-FLOW bugs — e.g. a Checkbox label
// wrapping BELOW its indicator instead of beside it (the indicator's own styles look
// fine; the breakage is the sibling text's flow). A whole-render diff surfaces exactly
// that: the diff image shows the misplaced/duplicated content at a glance.
//
// ALIGNMENT: mithril and Blueprint are independent implementations, so their
// galleries start content a few px apart; without alignment every text edge shows up
// "doubled" — noise that buries the signal. We apply ONE global (dx,dy) shift that
// best registers the two, then diff. This cancels the benign uniform offset while
// PRESERVING real structural differences (which no single shift can hide) — so they
// stand out in the diff image.
//
// READ THE NUMBER AS A GUIDE, NOT A GATE: because the two galleries have slightly
// different row spacing, a faithful multi-row component still drifts and won't hit
// 1.0. Use SSIM/mismatch to decide WHICH diffs to look at first, then EYEBALL the
// diff image to judge benign drift vs. a real regression. The image is the deliverable.

import { readFileSync, writeFileSync } from "node:fs";

const [aPath, bPath, outPath, label = ""] = process.argv.slice(2);
if (!aPath || !bPath || !outPath) {
    console.error("usage: diff-pixels.mjs <mithril.png> <blueprint.png> <diff-out.png> [label]");
    process.exit(2);
}

const C = { dim: "\x1b[2m", red: "\x1b[31m", green: "\x1b[32m", yellow: "\x1b[33m", bold: "\x1b[1m", reset: "\x1b[0m" };

// Soft-fail if the optional image deps aren't installed, so the harness still runs.
let PNG, pixelmatch;
try {
    ({ PNG } = await import("pngjs"));
    pixelmatch = (await import("pixelmatch")).default;
} catch {
    console.log(`${C.bold}visual diff${label ? ` · ${label}` : ""}${C.reset}  ${C.dim}skipped — run \`pnpm install\` (needs pixelmatch + pngjs)${C.reset}`);
    process.exit(0);
}

const a = PNG.sync.read(readFileSync(aPath));
const b = PNG.sync.read(readFileSync(bPath));

// Compare the common top-left region (both galleries top-align their content).
const W = Math.min(a.width, b.width);
const H = Math.min(a.height, b.height);

/** Crop an image's top-left W×H into a tight RGBA buffer. */
function crop(img) {
    const out = Buffer.alloc(W * H * 4);
    for (let y = 0; y < H; y++) {
        const s = y * img.width * 4;
        img.data.copy(out, y * W * 4, s, s + W * 4);
    }
    return out;
}
const ca = crop(a);
const cb = crop(b);

/** Rec. 601 luma, one Float64 per pixel. */
function gray(rgba) {
    const g = new Float64Array(W * H);
    for (let i = 0; i < W * H; i++) {
        const o = i * 4;
        g[i] = 0.299 * rgba[o] + 0.587 * rgba[o + 1] + 0.114 * rgba[o + 2];
    }
    return g;
}
const gA = gray(ca);
const gB = gray(cb);

// --- registration: one global (dx,dy) shift of B onto A minimizing mean abs luma diff ---
const MAX_DX = 4;
const MAX_DY = 40;
const STEP = 2; // subsample for speed
function meanAbsDiff(dx, dy) {
    const x0 = Math.max(0, dx);
    const x1 = Math.min(W, W + dx);
    const y0 = Math.max(0, dy);
    const y1 = Math.min(H, H + dy);
    let sum = 0;
    let n = 0;
    for (let y = y0; y < y1; y += STEP) {
        for (let x = x0; x < x1; x += STEP) {
            sum += Math.abs(gA[y * W + x] - gB[(y - dy) * W + (x - dx)]);
            n++;
        }
    }
    return n ? sum / n : Infinity;
}
let best = { dx: 0, dy: 0, mad: Infinity };
for (let dy = -MAX_DY; dy <= MAX_DY; dy++) {
    for (let dx = -MAX_DX; dx <= MAX_DX; dx++) {
        const mad = meanAbsDiff(dx, dy);
        if (mad < best.mad) best = { dx, dy, mad };
    }
}
const { dx, dy } = best;

// Overlap rectangle after shifting B by (dx,dy) onto A.
const ox0 = Math.max(0, dx);
const oy0 = Math.max(0, dy);
const ow = Math.min(W, W + dx) - ox0;
const oh = Math.min(H, H + dy) - oy0;

// Aligned RGBA buffers over the overlap, for pixelmatch + the diff image.
const alignedA = Buffer.alloc(ow * oh * 4);
const alignedB = Buffer.alloc(ow * oh * 4);
for (let y = 0; y < oh; y++) {
    const aRow = ((oy0 + y) * W + ox0) * 4;
    const bRow = ((oy0 + y - dy) * W + (ox0 - dx)) * 4;
    ca.copy(alignedA, y * ow * 4, aRow, aRow + ow * 4);
    cb.copy(alignedB, y * ow * 4, bRow, bRow + ow * 4);
}

// --- pixelmatch (includeAA:false skips anti-aliasing / font-hinting noise) ---
const diff = Buffer.alloc(ow * oh * 4);
const mismatch = pixelmatch(alignedA, alignedB, diff, ow, oh, { threshold: 0.1 });
const outPng = new PNG({ width: ow, height: oh });
diff.copy(outPng.data);
writeFileSync(outPath, PNG.sync.write(outPng));
const total = ow * oh;
const ratio = mismatch / total;

// --- SSIM (grayscale, 8×8 non-overlapping windows) over the aligned overlap ---
function ssim(rgbaA, rgbaB, w, h) {
    const lumA = new Float64Array(w * h);
    const lumB = new Float64Array(w * h);
    for (let i = 0; i < w * h; i++) {
        const o = i * 4;
        lumA[i] = 0.299 * rgbaA[o] + 0.587 * rgbaA[o + 1] + 0.114 * rgbaA[o + 2];
        lumB[i] = 0.299 * rgbaB[o] + 0.587 * rgbaB[o + 1] + 0.114 * rgbaB[o + 2];
    }
    const win = 8;
    const C1 = (0.01 * 255) ** 2;
    const C2 = (0.03 * 255) ** 2;
    let sum = 0;
    let n = 0;
    for (let by = 0; by + win <= h; by += win) {
        for (let bx = 0; bx + win <= w; bx += win) {
            let mA = 0;
            let mB = 0;
            for (let y = 0; y < win; y++)
                for (let x = 0; x < win; x++) {
                    const i = (by + y) * w + (bx + x);
                    mA += lumA[i];
                    mB += lumB[i];
                }
            const N = win * win;
            mA /= N;
            mB /= N;
            let vA = 0;
            let vB = 0;
            let cov = 0;
            for (let y = 0; y < win; y++)
                for (let x = 0; x < win; x++) {
                    const i = (by + y) * w + (bx + x);
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
const score = ssim(alignedA, alignedB, ow, oh);

// --- report (triage hint; the diff image is the deliverable) ---
const pct = (x) => (x * 100).toFixed(2) + "%";
const scoreColor = score >= 0.97 ? C.green : score >= 0.94 ? C.yellow : C.red;
const band = score >= 0.97 ? "high" : score >= 0.94 ? "moderate" : "low";
// Neutral wording on purpose: a dense multi-row gallery reads "low" from benign
// inter-row spacing drift, not necessarily a bug — so the verdict never claims
// pass/fail, it just routes attention to the diff image.
const hint = `${scoreColor}${band}${C.reset} similarity — judge from the diff image`;

console.log(`${C.bold}visual diff${label ? ` · ${label}` : ""}${C.reset}  ${C.dim}(SSIM + pixel mismatch · guide, not a gate)${C.reset}`);
console.log(`  aligned by      ${C.dim}dx ${dx >= 0 ? "+" : ""}${dx}px, dy ${dy >= 0 ? "+" : ""}${dy}px · overlap ${ow}×${oh}${C.reset}`);
console.log(`  SSIM            ${scoreColor}${score.toFixed(4)}${C.reset}  ${C.dim}(1.0 = identical)${C.reset}`);
console.log(`  pixel mismatch  ${pct(ratio)}  ${C.dim}(${mismatch.toLocaleString()} / ${total.toLocaleString()} px)${C.reset}`);
console.log(`  diff image      ${outPath.split("/").pop()}  ${C.dim}← eyeball this${C.reset}`);
console.log(`  ${hint}`);
