// Render-check every card in the built bundle over HTTP (relative CSS resolution
// included): the CSS must load, light/dark frames must actually diverge, no card may
// be near-empty, and no frame's content may poke past its clipped bottom edge.
// Also patches foundation marker heights with the measured scrollHeight (component
// card heights are computed exactly at build time and are left alone).
//
// Serves dist-design/bundle itself — needs only the `agent-browser` CLI (foreground;
// it is unreachable from harness background tasks). Exits non-zero on any finding.
import { execFile as execFileCb } from "node:child_process";
import { promisify } from "node:util";
import { createServer } from "node:http";
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DIST = join(REPO, "dist-design");
const BUNDLE = join(DIST, "bundle");
const KIT = join(BUNDLE, "ui_kits/mithril");
const SHOTS = join(DIST, ".render-check");
mkdirSync(SHOTS, { recursive: true });
const S = "mithril-ds-check";
const PORT = 8877;

const MIME = { ".html": "text/html", ".css": "text/css", ".md": "text/markdown" };
const server = createServer(async (req, res) => {
    try {
        const p = resolve(BUNDLE, "." + decodeURIComponent(new URL(req.url, "http://x").pathname));
        if (!p.startsWith(BUNDLE)) throw new Error("traversal");
        const data = await readFile(p);
        res.writeHead(200, { "content-type": MIME[p.slice(p.lastIndexOf("."))] ?? "application/octet-stream" }).end(data);
    } catch {
        res.writeHead(404).end();
    }
});
await new Promise((r) => server.listen(PORT, r));

const execFile = promisify(execFileCb);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// MUST be async: the bundle is served by THIS process, so a synchronous exec would
// block the event loop while the browser waits on the server — a deadlock that
// presents as "daemon may be busy or unresponsive". Retries cover cold starts.
const ab = async (...args) => {
    for (let attempt = 1; ; attempt++) {
        try {
            const { stdout } = await execFile("agent-browser", ["--session", S, ...args], { maxBuffer: 64 * 1024 * 1024 });
            return stdout.toString();
        } catch (e) {
            if (attempt >= 3) throw e;
            await sleep(1500 * attempt);
        }
    }
};

const PROBE = `(() => {
  const frames = [...document.querySelectorAll(".ds-frame")];
  const bgs = frames.map((f) => {
    const el = f.querySelector('[class*="bg-background"]');
    return el ? getComputedStyle(el).backgroundColor : null;
  });
  // Content poking past a frame's bottom edge = clipped card (bad height).
  const clip = frames.map((f) => {
    const fr = f.getBoundingClientRect();
    let m = -1e9;
    for (const d of f.querySelectorAll("*")) {
      const r = d.getBoundingClientRect();
      if (r.height <= 0 || r.width <= 0) continue;
      if (r.height >= fr.height - 1 && r.width >= fr.width - 1) continue; // backdrop
      // visible bottom = clipped by any overflowing ancestor (virtualized lists etc.)
      let b = r.bottom;
      for (let a = d.parentElement; a && a !== f; a = a.parentElement) {
        const s = getComputedStyle(a);
        if (s.overflowY !== "visible" || s.overflowX !== "visible")
          b = Math.min(b, a.getBoundingClientRect().bottom);
      }
      if (b > m) m = b;
    }
    return Math.round(m - fr.bottom);
  });
  return {
    h: Math.ceil(document.body.getBoundingClientRect().height),
    elts: document.querySelectorAll("*").length,
    bodyFontSize: getComputedStyle(document.body).fontSize,
    frameBgs: bgs,
    clip,
  };
})()`;

await ab("set", "viewport", "940", "1200");

const listDir = (dir) => {
    try {
        return readdirSync(join(KIT, dir)).filter((f) => f.endsWith(".html")).map((f) => `${dir}/${f}`);
    } catch {
        return [];
    }
};
const files = [...listDir("foundations"), ...listDir("components"), ...listDir("examples")];

// Example cards are wider than the 940px default — probe them at their own width
// (from the @dsCard marker) so nothing is squeezed or clipped by the viewport.
const cardWidth = (rel) => Number(/width="(\d+)"/.exec(readFileSync(join(KIT, rel), "utf8"))?.[1] ?? 900);

const report = { total: files.length, bad: [], thin: [], variantsIdentical: [], clipped: [], perFile: {} };

for (const rel of files) {
    if (rel.startsWith("examples/")) await ab("set", "viewport", String(cardWidth(rel) + 40), "1200");
    await ab("open", `http://localhost:${PORT}/ui_kits/mithril/${rel}`);
    try { await ab("wait", "--load", "networkidle"); } catch {}
    await ab("wait", "500");
    let probe = null;
    try {
        const out = JSON.parse(await ab("eval", "--json", PROBE));
        probe = out.data?.result ?? out.result;
    } catch {}
    const name = rel.replace("/", "_").replace(".html", "");
    try { await ab("screenshot", "--full", join(SHOTS, `${name}.png`)); } catch {}

    // Capture-based cards (components + examples) get the strict frame checks and
    // exact build-time heights; foundations are hand-generated (height patched below).
    const isComponent = rel.startsWith("components/") || rel.startsWith("examples/");
    let bad = false, thin = false, identical = false;
    if (!probe || probe.elts < 25) bad = true;
    if (probe && probe.bodyFontSize !== "14px" && isComponent) bad = true; // base layer CSS didn't load
    if (probe && isComponent) {
        const [l, d] = probe.frameBgs;
        if (!l || !d || l === "rgba(0, 0, 0, 0)" || d === "rgba(0, 0, 0, 0)") bad = true;
        else if (l === d) identical = true;
    }
    if (probe && probe.h < 150) thin = true;
    const clipped = isComponent && probe?.clip?.some((c) => c > 4);

    if (bad) report.bad.push(rel);
    if (thin) report.thin.push(rel);
    if (identical) report.variantsIdentical.push(rel);
    if (clipped) report.clipped.push(rel);
    report.perFile[rel] = probe ? { ...probe, bad, thin, identical, clipped } : { error: true, bad };

    // Patch foundation marker heights with measured truth (components are exact already).
    if (!isComponent && probe?.h) {
        const p = join(KIT, rel);
        const src = readFileSync(p, "utf8");
        const patched = src.replace(/(<!-- @dsCard [^>]*height=")(\d+)(")/, `$1${probe.h}$3`);
        if (patched !== src) writeFileSync(p, patched);
    }
    console.log(
        `${rel}: h=${probe?.h} elts=${probe?.elts} bgs=${JSON.stringify(probe?.frameBgs)} clip=${JSON.stringify(probe?.clip)}` +
            `${bad ? " BAD" : ""}${thin ? " THIN" : ""}${identical ? " IDENTICAL" : ""}${clipped ? " CLIPPED" : ""}`,
    );
}

server.close();
server.closeAllConnections(); // the browser holds keep-alive sockets; close() alone never drains
writeFileSync(join(DIST, ".render-check.json"), JSON.stringify(report, null, 2));
const n = (k) => report[k].length;
console.log(`\ntotal=${report.total} bad=${n("bad")} thin=${n("thin")} variantsIdentical=${n("variantsIdentical")} clipped=${n("clipped")}`);
if (n("bad") + n("thin") + n("variantsIdentical") + n("clipped") > 0) process.exitCode = 1;
