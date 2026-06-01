// Shared waiver loader for the comparison harness. Reads accepted-deltas.json and
// exposes per-component lookups used by diff-styles.mjs and diff-specimens.mjs.
//
// A waiver suppresses a KNOWN, reviewed delta but still catches regressions:
//   - style waivers are VALUE-PINNED (the live analyst/blueprint values must still match
//     a recorded pair, color-tolerant) — change the value and it re-surfaces.
//   - visual expectSize waivers re-flag if the size mismatch drifts from the recorded one.
//   - visual ssimArtifact waivers re-flag the moment a NEW size mismatch appears.
//
// Set CMP_NO_WAIVERS=1 to disable all waivers (raw output — useful to re-audit).

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));

let REGISTRY = {};
if (!process.env.CMP_NO_WAIVERS) {
    try {
        REGISTRY = JSON.parse(readFileSync(join(HERE, "accepted-deltas.json"), "utf8"));
    } catch (e) {
        console.error(`waivers: could not read accepted-deltas.json (${e.message}); proceeding with none`);
    }
}

/** The leading token of a "popover · light" label is the component id. */
export function componentFromLabel(label = "") {
    return String(label).split("·")[0].trim();
}

/** Per-component waiver bundle ({} if none / disabled). */
export function waiversFor(label) {
    const c = componentFromLabel(label);
    const w = REGISTRY[c];
    return w && typeof w === "object" ? w : {};
}

// ---- color-tolerant value equality (mirrors diff-styles.mjs) -----------------
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
export function valuesEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.replace(rgbToken, "•") !== b.replace(rgbToken, "•")) return false;
    const ca = a.match(rgbToken) || [];
    const cb = b.match(rgbToken) || [];
    if (ca.length !== cb.length) return false;
    return ca.every((c, i) => colorClose(c, cb[i]));
};

/**
 * Is this (specimen, prop) delta an accepted, still-matching waiver?
 * Returns true only when the live analyst & blueprint values match one recorded pair.
 */
export function isStyleWaived(waivers, key, prop, analystVal, blueprintVal) {
    const pairs = waivers.styles?.[key]?.[prop];
    if (!Array.isArray(pairs)) return false;
    return pairs.some(
        ([a, b]) => valuesEqual(analystVal, a) && valuesEqual(blueprintVal, b),
    );
}

/** Specimen keys expected to be "only in analyst" (paired/verified under their own id). */
export function isUnpairedWaived(waivers, key) {
    return Array.isArray(waivers.unpaired) && waivers.unpaired.includes(key);
}

/**
 * Visual-specimen waiver. Given the measured crop sizes + whether it's size-mismatched,
 * decide whether the flag should be suppressed. Preserves regression detection:
 *   expectSize  → suppress only while the live sizes match the recorded ones (±SIZE_TOL).
 *   ssimArtifact→ suppress only while NOT size-mismatched (a new size mismatch re-flags).
 */
const SIZE_TOL = 3;
export function isVisualWaived(waivers, key, { aw, ah, bw, bh, sizeMismatch }) {
    const v = waivers.visual?.[key];
    if (!v) return false;
    if (v.ssimArtifact) return !sizeMismatch;
    if (Array.isArray(v.expectSize)) {
        const [eaw, eah, ebw, ebh] = v.expectSize;
        return (
            Math.abs(aw - eaw) <= SIZE_TOL &&
            Math.abs(ah - eah) <= SIZE_TOL &&
            Math.abs(bw - ebw) <= SIZE_TOL &&
            Math.abs(bh - ebh) <= SIZE_TOL
        );
    }
    return false;
}
