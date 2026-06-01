#!/usr/bin/env node
// Diff computed styles of paired [data-compare] specimens between mithril and
// Blueprint. Invoked by compare.sh; can also be run standalone:
//   node tools/comparison/diff-styles.mjs <mithril.styles.json> <blueprint.styles.json> [label]
//
// Each input is the raw `agent-browser eval --json` envelope whose `data.result`
// is itself a JSON string of { "<compare-key>": { "<cssProp>": "<value>", ... } }.

import { readFileSync } from "node:fs";
import { waiversFor, isStyleWaived, isUnpairedWaived } from "./waivers.mjs";

const [analystPath, blueprintPath, label = ""] = process.argv.slice(2);
const waivers = waiversFor(label);
if (!analystPath || !blueprintPath) {
    console.error("usage: diff-styles.mjs <mithril.styles.json> <blueprint.styles.json> [label]");
    process.exit(2);
}

/** Unwrap the agent-browser eval envelope → the specimen→props object. */
function load(path) {
    const raw = readFileSync(path, "utf8").trim();
    const outer = JSON.parse(raw);
    if (!outer.success) throw new Error(`eval failed for ${path}: ${outer.error}`);
    return JSON.parse(outer.data.result);
}

const A = load(analystPath);
const B = load(blueprintPath);

// Color tolerance: capture-styles.js normalizes every color to rgb()/rgba() via a
// 1×1 canvas, but oklch→sRGB rounding can drift a channel by ±1. Compare colors
// numerically (incl. those embedded in box-shadow) so identical-looking values
// match, while non-color parts (lengths, "inset") must match exactly.
const CHANNEL_TOL = 3;
const ALPHA_TOL = 0.06;
const rgbToken = /rgba?\([^)]*\)/g;
const parseRgb = (c) => {
    const n = (c.match(/[\d.]+/g) || []).map(Number);
    return { r: n[0], g: n[1], b: n[2], a: n[3] ?? 1 };
};
const colorClose = (a, b) => {
    const x = parseRgb(a);
    const y = parseRgb(b);
    return (
        Math.abs(x.r - y.r) <= CHANNEL_TOL &&
        Math.abs(x.g - y.g) <= CHANNEL_TOL &&
        Math.abs(x.b - y.b) <= CHANNEL_TOL &&
        Math.abs(x.a - y.a) <= ALPHA_TOL
    );
};
function valuesEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    // The non-color skeleton (lengths, keywords) must be identical...
    if (a.replace(rgbToken, "•") !== b.replace(rgbToken, "•")) return false;
    // ...and each positional color must match within tolerance.
    const ca = a.match(rgbToken) || [];
    const cb = b.match(rgbToken) || [];
    if (ca.length !== cb.length) return false;
    return ca.every((c, i) => colorClose(c, cb[i]));
}

const C = { dim: "\x1b[2m", red: "\x1b[31m", green: "\x1b[32m", yellow: "\x1b[33m", bold: "\x1b[1m", reset: "\x1b[0m" };

const keys = [...new Set([...Object.keys(A), ...Object.keys(B)])].sort();
let mismatchCount = 0;
let matchCount = 0;
let waivedProps = 0; // accepted (value-pinned) property deltas suppressed this run
const onlyA = [];
const onlyB = [];
const waivedUnpaired = [];

console.log(`${C.bold}computed-style diff${label ? ` · ${label}` : ""}${C.reset}  ${C.dim}(mithril → blueprint)${C.reset}`);

for (const key of keys) {
    if (!(key in B)) {
        (isUnpairedWaived(waivers, key) ? waivedUnpaired : onlyA).push(key);
        continue;
    }
    if (!(key in A)) { onlyB.push(key); continue; }
    const props = [...new Set([...Object.keys(A[key]), ...Object.keys(B[key])])];
    const allDiffs = props.filter((p) => !valuesEqual(A[key][p], B[key][p]));
    // A delta is suppressed only while its live values still match a recorded waiver pair;
    // any drift (a regression) falls through to `diffs` and re-surfaces.
    const diffs = allDiffs.filter((p) => !isStyleWaived(waivers, key, p, A[key][p], B[key][p]));
    waivedProps += allDiffs.length - diffs.length;
    if (diffs.length === 0) {
        matchCount++;
        continue;
    }
    mismatchCount++;
    console.log(`\n${C.yellow}● ${key}${C.reset}`);
    for (const p of diffs) {
        console.log(`    ${p}`);
        console.log(`      ${C.red}mithril  ${A[key][p] ?? "—"}${C.reset}`);
        console.log(`      ${C.green}blueprnt ${B[key][p] ?? "—"}${C.reset}`);
    }
}

if (onlyA.length) console.log(`\n${C.dim}only in mithril:  ${onlyA.join(", ")}${C.reset}`);
if (onlyB.length) console.log(`${C.dim}only in blueprint: ${onlyB.join(", ")}${C.reset}`);

const accepted =
    (waivedProps ? `${waivedProps} accepted delta${waivedProps === 1 ? "" : "s"}` : "") +
    (waivedProps && waivedUnpaired.length ? ", " : "") +
    (waivedUnpaired.length ? `${waivedUnpaired.length} accepted unpaired` : "");
if (accepted) console.log(`\n${C.dim}waived: ${accepted} (see accepted-deltas.json)${C.reset}`);

const summary = `${matchCount} match · ${mismatchCount} differ`;
console.log(`\n${mismatchCount ? C.yellow : C.green}${summary}${C.reset}`);
