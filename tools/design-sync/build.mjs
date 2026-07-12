// Build the Claude Design bundle for mithril → dist-design/bundle/ui_kits/mithril/
//
// Inputs: dist-design/meta.json + dist-design/captures/<id>.<theme>.json (both from
// capture-all.sh). Compiles the app stylesheet via the Tailwind CLI, then assembles
// one preview card per component (light+dark frames of real captured DOM) plus
// hand-generated foundations cards and the mockup-agent README.
//
// Every card's first line is a `<!-- @dsCard group="…" name="…" … -->` marker — the
// Claude Design app indexes the Design System pane from these.
//
// All foundation values are literals sourced from src/styles/tokens.css; update them
// here if the token set changes (the render-check will not catch stale literals).
import { readFileSync, writeFileSync, mkdirSync, existsSync, appendFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DIST = join(REPO, "dist-design");
const OUT = join(DIST, "bundle/ui_kits/mithril");

const metaPath = join(DIST, "meta.json");
if (!existsSync(metaPath)) throw new Error("dist-design/meta.json missing — run tools/design-sync/capture-all.sh first");
const meta = JSON.parse(readFileSync(metaPath, "utf8"));

mkdirSync(join(OUT, "components"), { recursive: true });
mkdirSync(join(OUT, "foundations"), { recursive: true });
mkdirSync(join(OUT, "assets"), { recursive: true });

/* ── Stylesheet: compile the app CSS, then append the palette addendum ───── */

execFileSync("pnpm", ["exec", "tailwindcss", "-i", "src/styles/globals.css", "-o", join(OUT, "assets/mithril.css"), "--minify"], {
    cwd: REPO,
    stdio: "inherit",
});

/* ── Token literals (from src/styles/tokens.css) ─────────────────────────── */

const RAMPS = {
    "dark-gray": ["#1c2127", "#252a31", "#2f343c", "#383e47", "#404854"],
    gray: ["#5f6b7c", "#738091", "#8f99a8", "#abb3bf", "#c5cbd3"],
    "light-gray": ["#d3d8de", "#dce0e5", "#e5e8eb", "#edeff2", "#f6f7f9"],
    blue: ["#184a90", "#215db0", "#2d72d2", "#4c90f0", "#8abbff"],
    green: ["#165a36", "#1c6e42", "#238551", "#32a467", "#72ca9b"],
    orange: ["#77450d", "#935610", "#c87619", "#ec9a3c", "#fbb360"],
    red: ["#8e292c", "#ac2f33", "#cd4246", "#e76a6e", "#fa999c"],
    cerulean: ["#0c5174", "#0f6894", "#147eb3", "#3fa6da", "#68c1ee"],
    forest: ["#1d7324", "#238c2c", "#29a634", "#43bf4d", "#62d96b"],
    gold: ["#5c4405", "#866103", "#d1980b", "#f0b726", "#fbd065"],
    indigo: ["#5642a6", "#634dbf", "#7961db", "#9881f3", "#bdadff"],
    lime: ["#43501b", "#5a701a", "#8eb125", "#b6d94c", "#d4f17e"],
    rose: ["#a82255", "#c22762", "#db2c6f", "#f5498b", "#ff66a1"],
    sepia: ["#5e4123", "#7a542e", "#946638", "#af855a", "#d0b090"],
    turquoise: ["#004d46", "#007067", "#00a396", "#13c9ba", "#7ae1d8"],
    vermilion: ["#96290d", "#b83211", "#d33d17", "#eb6847", "#ff9980"],
    violet: ["#5c255c", "#7c327c", "#9d3f9d", "#bd6bbd", "#d69fd6"],
};

const INTENTS = {
    primary: { rest: "#2d72d2", hover: "#215db0", active: "#184a90", disabled: "#4c90f0", foreground: "#ffffff" },
    success: { rest: "#238551", hover: "#1c6e42", active: "#165a36", disabled: "#32a467", foreground: "#ffffff" },
    warning: { rest: "#c87619", hover: "#935610", active: "#77450d", disabled: "#ec9a3c", foreground: "#111418" },
    danger: { rest: "#cd4246", hover: "#ac2f33", active: "#8e292c", disabled: "#e76a6e", foreground: "#ffffff" },
};

const SEMANTIC = [
    ["--background", "app background", "#f6f7f9", "#1c2127"],
    ["--surface", "cards / menus / dialogs", "#ffffff", "#252a31"],
    ["--elevated", "raised panels", "#edeff2", "#2f343c"],
    ["--foreground", "body text", "#1c2127", "#f6f7f9"],
    ["--foreground-muted", "secondary text", "#5f6b7c", "#abb3bf"],
    ["--foreground-disabled", "disabled text", "rgba(95,107,124,.6)", "rgba(171,179,191,.6)"],
    ["--link", "links", "#215db0", "rgb(138,187,255)"],
    ["--border", "hairline borders", "rgba(95,107,124,.12)", "rgba(255,255,255,.2)"],
    ["--border-strong", "emphasized borders", "rgba(95,107,124,.25)", "rgba(255,255,255,.3)"],
    ["--divider", "dividers", "rgba(17,20,24,.15)", "rgba(255,255,255,.2)"],
    ["--interactive-hover", "ghost hover fill", "rgba(143,153,168,.15)", "rgba(255,255,255,.1)"],
    ["--interactive-active", "ghost active fill", "rgba(143,153,168,.3)", "rgba(255,255,255,.16)"],
    ["--ring", "focus ring", "rgba(33,93,176,.752)", "rgba(138,187,255,.752)"],
    ["--selection", "text selection", "rgba(125,188,255,.6)", "rgba(125,188,255,.6)"],
];

const TYPE_SCALE = [
    ["--text-heading-display", 46, 600, "Display heading"],
    ["--text-heading-xl", 28, 600, "Heading XL"],
    ["--text-heading-lg", 24, 600, "Heading LG"],
    ["--text-heading", 20, 600, "Heading"],
    ["--text-heading-sm", 16, 600, "Heading SM"],
    ["--text-body-lg", 16, 400, "Body large — running text at 16px"],
    ["--text-body", 14, 400, "Body — the 14px default for all UI text"],
    ["--text-body-sm", 12, 400, "Body small — captions, metadata, table chrome"],
    ["--text-body-xs", 10, 400, "Body XS — badges and fine print"],
];

const ELEVATION = {
    light: [
        "0 0 0 1px rgba(0,0,0,.15), 0 0 5px 0 rgba(0,0,0,.02)",
        "0 0 0 1px rgba(0,0,0,.1), 0 1px 3px 0 rgba(0,0,0,.1), 0 1px 2px -1px rgba(0,0,0,.1)",
        "0 0 0 1px rgba(0,0,0,.1), 0 4px 6px -4px rgba(0,0,0,.1), 0 10px 15px -3px rgba(0,0,0,.1)",
        "0 0 0 1px rgba(0,0,0,.1), 0 20px 25px -5px rgba(0,0,0,.1), 0 10px 15px -3px rgba(0,0,0,.1)",
        "0 0 0 1px rgba(0,0,0,.1), 0 25px 50px -12px rgba(0,0,0,.3)",
    ],
    dark: [
        "inset 0 0 0 1px rgba(255,255,255,.2), 0 0 10px 0 rgba(0,0,0,.2)",
        "inset 0 0 0 1px rgba(255,255,255,.2), 0 1px 10px 0 rgba(0,0,0,.2), 0 1px 10px -1px rgba(0,0,0,.2)",
        "inset 0 0 0 1px rgba(255,255,255,.2), 0 4px 6px -4px rgba(0,0,0,.5), 0 10px 30px -5px rgba(0,0,0,.5)",
        "inset 0 0 0 1px rgba(255,255,255,.2), 0 20px 25px -5px rgba(0,0,0,.3), 0 10px 30px -5px rgba(0,0,0,.3)",
        "inset 0 0 0 1px rgba(255,255,255,.2), 0 25px 60px -12px rgba(0,0,0,.85)",
    ],
};

const THEMES = [
    { key: "", name: "Blueprint (default)", primary: "#2d72d2", success: "#238551", warning: "#c87619", danger: "#cd4246", bg: "#f6f7f9", pfg: "#ffffff", wfg: "#111418" },
    { key: "anthropic", name: "Anthropic", primary: "#db7759", success: "#a3d6c1", warning: "#c87619", danger: "#c46686", bg: "#f0eee9", pfg: "#ffffff", wfg: "#111418" },
    { key: "purple", name: "Purple", primary: "#5b08b2", success: "#00a75e", warning: "#eb7425", danger: "#c73c3c", bg: "#efeff4", pfg: "#ffffff", wfg: "#111418" },
    { key: "lagoon", name: "Lagoon", primary: "#0d9488", success: "#16a34a", warning: "#d97706", danger: "#dc2626", bg: "#eef4f4", pfg: "#ffffff", wfg: "#111418" },
    { key: "indigo", name: "Indigo", primary: "#4f46e5", success: "#059669", warning: "#d97706", danger: "#e11d48", bg: "#f3f4f9", pfg: "#ffffff", wfg: "#111418" },
    { key: "forest", name: "Forest", primary: "#4d7c0f", success: "#16a34a", warning: "#ca8a04", danger: "#b91c1c", bg: "#f1efe7", pfg: "#f8f7f2", wfg: "#1a1a17" },
    { key: "ember", name: "Ember", primary: "#ea580c", success: "#16a34a", warning: "#eab308", danger: "#dc2626", bg: "#f4f0ea", pfg: "#faf8f4", wfg: "#1c1917" },
];

const SYS_FONT = `-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen,Ubuntu,Cantarell,"Open Sans","Helvetica Neue",sans-serif`;

/* ── Page scaffold ───────────────────────────────────────────────────────── */

function page({ group, name, subtitle, width = 900, height, title, links = [], style = "", body }) {
    const attrs = [`group="${group}"`, `name="${name}"`];
    if (subtitle) attrs.push(`subtitle="${subtitle}"`);
    attrs.push(`width="${width}"`);
    if (height) attrs.push(`height="${Math.round(height)}"`);
    const linkTags = links.map((h) => `<link rel="stylesheet" href="${h}">`).join("\n");
    return `<!-- @dsCard ${attrs.join(" ")} -->
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
${linkTags}
<style>
${style}
</style>
</head>
<body>
${body}
</body>
</html>
`;
}

const F_STYLE = `
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body { width: 900px; padding: 24px 28px 28px; background: #f6f7f9; color: #1c2127;
  font: 400 14px/1.4 ${SYS_FONT}; }
h1 { font-size: 20px; font-weight: 600; margin: 0 0 4px; }
p.lede { margin: 0 0 18px; color: #5f6b7c; font-size: 12px; }
h2 { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; color: #5f6b7c; margin: 18px 0 8px; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
`;

/* ── Foundations: color palette ──────────────────────────────────────────── */

function rampRow(label, varPrefix, hexes) {
    const sw = hexes
        .map(
            (hex, i) => `
    <div class="sw"><div class="chip" style="background:${hex}"></div>
      <div class="cap"><span class="mono">${varPrefix}-${i + 1}</span><span class="mono">${hex}</span></div></div>`,
        )
        .join("");
    return `<div class="ramp"><div class="label">${label}</div>${sw}</div>`;
}

function buildColorsPage() {
    const style =
        F_STYLE +
        `
.ramp { display: flex; gap: 8px; margin-bottom: 8px; align-items: flex-start; }
.ramp .label { width: 88px; font-size: 12px; color: #5f6b7c; padding-top: 14px; }
.sw { width: 138px; }
.chip { height: 40px; border-radius: 4px; box-shadow: inset 0 0 0 1px rgba(17,20,24,.08); }
.cap { display: flex; justify-content: space-between; font-size: 9.5px; color: #5f6b7c; margin-top: 3px; }
`;
    const grays = `
<div class="ramp"><div class="label">extremes</div>
  <div class="sw"><div class="chip" style="background:#111418"></div><div class="cap"><span class="mono">--color-black</span><span class="mono">#111418</span></div></div>
  <div class="sw"><div class="chip" style="background:#ffffff"></div><div class="cap"><span class="mono">--color-white</span><span class="mono">#ffffff</span></div></div>
</div>` +
        rampRow("dark gray", "--color-dark-gray", RAMPS["dark-gray"]) +
        rampRow("gray", "--color-gray", RAMPS.gray) +
        rampRow("light gray", "--color-light-gray", RAMPS["light-gray"]);

    const core = ["blue", "green", "orange", "red"].map((k) => rampRow(k, `--color-${k}`, RAMPS[k])).join("");
    const extended = ["cerulean", "forest", "gold", "indigo", "lime", "rose", "sepia", "turquoise", "vermilion", "violet"]
        .map((k) => rampRow(k, `--color-${k}`, RAMPS[k]))
        .join("");

    return page({
        group: "Foundations",
        name: "Color palette",
        subtitle: "Gray ramps, 4 core + 10 extended color families",
        title: "mithril — Color palette",
        height: 1433,
        style,
        body: `
<h1>Color palette</h1>
<p class="lede">Static primitives. Each family is a 5-step ramp, 1 = darkest. Utilities: <span class="mono">bg-blue-3</span>, <span class="mono">text-red-2</span>… Vars: <span class="mono">var(--color-blue-3)</span>.</p>
<h2>Grays</h2>${grays}
<h2>Core (intent seeds)</h2>${core}
<h2>Extended</h2>${extended}`,
    });
}

/* ── Foundations: semantic colors & intents ──────────────────────────────── */

function buildSemanticPage() {
    const style =
        F_STYLE +
        `
.itable { display: grid; grid-template-columns: 90px repeat(5, 1fr); gap: 6px; align-items: center; }
.itable .h { font-size: 10px; text-transform: uppercase; letter-spacing: .05em; color: #5f6b7c; }
.itable .iname { font-size: 12px; color: #5f6b7c; }
.ichip { height: 38px; border-radius: 4px; display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-family: ui-monospace, Menlo, monospace; box-shadow: inset 0 0 0 1px rgba(17,20,24,.08); }
.panels { display: flex; gap: 12px; }
.panel { flex: 1; border-radius: 6px; padding: 14px 16px; }
.panel.light { background: #f6f7f9; box-shadow: inset 0 0 0 1px rgba(17,20,24,.12); }
.panel.dark { background: #1c2127; color: #f6f7f9; }
.trow { display: flex; align-items: center; gap: 8px; padding: 3px 0; font-size: 11px; }
.trow .tchip { width: 26px; height: 20px; border-radius: 3px; flex: none; box-shadow: inset 0 0 0 1px rgba(128,128,128,.35); }
.trow .tname { width: 172px; font-family: ui-monospace, Menlo, monospace; font-size: 10.5px; }
.trow .tval { opacity: .65; font-family: ui-monospace, Menlo, monospace; font-size: 10px; }
`;
    const header = `<div class="h"></div>` + ["rest", "hover", "active", "disabled", "foreground"].map((h) => `<div class="h">${h}</div>`).join("");
    const rows = Object.entries(INTENTS)
        .map(([k, v]) => {
            const chips = ["rest", "hover", "active", "disabled"]
                .map((s) => `<div class="ichip" style="background:${v[s]};color:${v.foreground}">${v[s]}</div>`)
                .join("");
            const fg = `<div class="ichip" style="background:${v.foreground};color:${v.foreground === "#ffffff" ? "#111418" : "#ffffff"}">${v.foreground}</div>`;
            return `<div class="iname mono">${k}</div>${chips}${fg}`;
        })
        .join("");

    const panel = (mode, idx) =>
        `<div class="panel ${mode}"><h2 style="margin-top:0;color:${mode === "dark" ? "#abb3bf" : "#5f6b7c"}">${mode} theme</h2>` +
        SEMANTIC.map(
            ([name, desc, l, d]) => `
  <div class="trow"><div class="tchip" style="background:${idx === 0 ? l : d}"></div>
    <div class="tname">${name}</div><div class="tval">${(idx === 0 ? l : d).replaceAll(" ", "")} · ${desc}</div></div>`,
        ).join("") +
        `</div>`;

    return page({
        group: "Foundations",
        name: "Intents & semantic tokens",
        subtitle: "primary / success / warning / danger · surfaces, text, borders per theme",
        title: "mithril — Intents & semantic tokens",
        height: 882,
        style,
        body: `
<h1>Intents &amp; semantic tokens</h1>
<p class="lede">Intents are theme-independent (<span class="mono">bg-primary</span>, <span class="mono">text-intent-danger-text</span>…). Semantic tokens swap under <span class="mono">.dark</span> / <span class="mono">[data-mode="dark"]</span> (<span class="mono">bg-background</span>, <span class="mono">bg-surface</span>, <span class="mono">text-foreground</span>…).</p>
<h2>Intents</h2>
<div class="itable">${header}${rows}</div>
<h2 style="margin-top:22px">Semantic tokens — light vs dark</h2>
<div class="panels">${panel("light", 0)}${panel("dark", 1)}</div>`,
    });
}

/* ── Foundations: typography ─────────────────────────────────────────────── */

function buildTypographyPage() {
    const style =
        F_STYLE +
        `
.spec { display: flex; align-items: baseline; gap: 14px; padding: 7px 0; border-bottom: 1px solid rgba(17,20,24,.08); }
.spec .m { width: 210px; flex: none; font-size: 10.5px; color: #5f6b7c; font-family: ui-monospace, Menlo, monospace; }
.spec .s { line-height: 1.28581; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
`;
    const specs = TYPE_SCALE.map(
        ([v, px, w, label]) => `
<div class="spec"><div class="m">${v} · ${px}px/${w}</div><div class="s" style="font-size:${px}px;font-weight:${w}">${label}</div></div>`,
    ).join("");
    const code = `
<div class="spec"><div class="m">--text-code · 13px · --font-mono</div><div class="s mono" style="font-size:13px;color:#5f6b7c;background:rgba(255,255,255,.7);padding:1px 5px;border-radius:2px">const total = rows.reduce((a, r) =&gt; a + r.qty, 0)</div></div>`;
    return page({
        group: "Foundations",
        name: "Typography",
        subtitle: "System font stack · 14px body · Blueprint scale",
        title: "mithril — Typography",
        height: 546,
        style,
        body: `
<h1>Typography</h1>
<p class="lede"><span class="mono">--font-sans</span>: native system stack (SF Pro / Segoe UI / Roboto…). Base body text is 14px, line-height <span class="mono">1.28581</span>. Weights: 400 regular, 600 bold. Utilities: <span class="mono">text-body</span>, <span class="mono">text-heading-lg</span>, <span class="mono">font-bold</span>…</p>
${specs}${code}`,
    });
}

/* ── Foundations: elevation, radius, motion ──────────────────────────────── */

function buildElevationPage() {
    const style =
        F_STYLE +
        `
.panels { display: flex; gap: 12px; }
.panel { flex: 1; border-radius: 6px; padding: 16px; }
.panel.light { background: #f6f7f9; box-shadow: inset 0 0 0 1px rgba(17,20,24,.12); }
.panel.dark { background: #1c2127; color: #f6f7f9; }
.cards { display: flex; flex-wrap: wrap; gap: 18px; }
.ecard { width: 108px; height: 64px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 10px; }
.panel.light .ecard { background: #ffffff; color: #5f6b7c; }
.panel.dark .ecard { background: #252a31; color: #abb3bf; }
.rrow { display: flex; gap: 14px; align-items: center; }
.rchip { background: #ffffff; box-shadow: inset 0 0 0 1px rgba(17,20,24,.2); width: 84px; height: 40px;
  display: flex; align-items: center; justify-content: center; font-size: 10px; color: #5f6b7c; }
.hrow { display: flex; gap: 10px; align-items: flex-end; }
.hbar { background: #2d72d2; border-radius: 3px; width: 84px; color: #fff; font-size: 9.5px;
  display: flex; align-items: center; justify-content: center; }
`;
    const cards = (mode) =>
        ELEVATION[mode].map((sh, i) => `<div class="ecard" style="box-shadow:${sh}">elevation-${i}</div>`).join("");
    const radii = [
        ["--radius-mithril-sm", 2],
        ["--radius-mithril", 4],
        ["--radius-mithril-lg", 6],
    ]
        .map(([v, px]) => `<div class="rchip" style="border-radius:${px}px">${v.slice(9)} · ${px}px</div>`)
        .join("");
    const heights = [
        ["control-smaller", 20],
        ["control-sm", 24],
        ["control", 30],
        ["control-lg", 40],
        ["navbar", 50],
    ]
        .map(([n, px]) => `<div class="hbar" style="height:${px}px">${n} ${px}</div>`)
        .join("");
    return page({
        group: "Foundations",
        name: "Elevation, radius & motion",
        subtitle: "Shadows 0–4 (light/dark) · 2/4/6px radii · control heights · easing",
        title: "mithril — Elevation, radius & motion",
        height: 585,
        style,
        body: `
<h1>Elevation, radius &amp; motion</h1>
<p class="lede">Utilities: <span class="mono">shadow-elevation-2</span>, <span class="mono">shadow-card-1</span>, <span class="mono">rounded-mithril</span>, <span class="mono">ease-mithril</span>. Cards use elevations; floating overlays use <span class="mono">shadow-overlay-1/3/4</span>.</p>
<h2>Elevation 0–4</h2>
<div class="panels">
  <div class="panel light"><div class="cards">${cards("light")}</div></div>
  <div class="panel dark"><div class="cards">${cards("dark")}</div></div>
</div>
<h2>Radius</h2><div class="rrow">${radii}</div>
<h2>Control heights (4px grid)</h2><div class="hrow">${heights}</div>
<h2>Motion</h2>
<p style="font-size:12px;color:#5f6b7c;margin:0">
<span class="mono">--ease-mithril: cubic-bezier(.4,1,.75,.9)</span> · <span class="mono">--ease-mithril-bounce: cubic-bezier(.54,1.12,.38,1.11)</span> · <span class="mono">--duration-mithril: 100ms</span></p>`,
    });
}

/* ── Foundations: built-in themes ────────────────────────────────────────── */

function buildThemesPage() {
    const style =
        F_STYLE +
        `
.trow2 { display: grid; grid-template-columns: 150px 130px repeat(4, 1fr) 110px; gap: 6px; align-items: center; margin-bottom: 6px; }
.tchip { height: 36px; border-radius: 4px; display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 600; box-shadow: inset 0 0 0 1px rgba(17,20,24,.08); }
.tname { font-size: 13px; font-weight: 600; }
.tkey { font-size: 10.5px; color: #5f6b7c; font-family: ui-monospace, Menlo, monospace; }
.h { font-size: 10px; text-transform: uppercase; letter-spacing: .05em; color: #5f6b7c; }
`;
    const header = `<div class="h">theme</div><div class="h">apply</div>` +
        ["primary", "success", "warning", "danger"].map((h) => `<div class="h">${h}</div>`).join("") +
        `<div class="h">background</div>`;
    const rows = THEMES.map((t) => {
        const chip = (bg, fg) => `<div class="tchip" style="background:${bg};color:${fg}">Aa</div>`;
        return `<div class="trow2">
  <div class="tname">${t.name}</div>
  <div class="tkey">${t.key ? `data-theme="${t.key}"` : "(no attribute)"}</div>
  ${chip(t.primary, t.pfg)}${chip(t.success, t.pfg)}${chip(t.warning, t.wfg)}${chip(t.danger, t.pfg)}
  <div class="tchip" style="background:${t.bg};color:#5f6b7c;font-weight:400;font-size:10px">${t.bg}</div>
</div>`;
    }).join("");
    return page({
        group: "Foundations",
        name: "Built-in themes",
        subtitle: "7 named seed sets — every theme has a light and a dark variant",
        title: "mithril — Built-in themes",
        height: 450,
        style,
        body: `
<h1>Built-in themes</h1>
<p class="lede">A theme overrides only seed colors on <span class="mono">&lt;html data-theme="…"&gt;</span>; every semantic token derives from seeds, so each theme automatically re-tints both light and dark (combine with <span class="mono">.dark</span>). Custom themes: override the same <span class="mono">--color-primary*</span>/<span class="mono">--color-*</span> seed vars inline.</p>
${header ? `<div class="trow2">${header}</div>` : ""}${rows}`,
    });
}

/* ── Component pages from captures ───────────────────────────────────────── */

const FRAME_MAX = 2400;
// Frames whose portal content animates in from off-layout positions measure short at
// capture time (headless rAF throttling) — give them a sane floor.
const FRAME_MIN = { toast: 380, omnibar: 580, hotkeys: 580 };
// The captured bg wrapper's min-height:100% chain breaks through #root, so portal
// content below it would sit on page-white — paint the theme bg on the frame itself.
const FRAME_BG = { light: "#f6f7f9", dark: "#1c2127" };

function componentPage(c) {
    const load = (theme) => {
        const p = join(DIST, "captures", `${c.id}.${theme}.json`);
        if (!existsSync(p)) return null;
        const j = JSON.parse(readFileSync(p, "utf8"));
        const r = j.data?.result ?? j.result ?? j;
        if (!r?.html || !r.html.includes('id="root"')) return null;
        const height = Math.max(Math.min(r.height, FRAME_MAX), FRAME_MIN[c.id] ?? 0);
        return { html: r.html.replaceAll("min-h-screen", "min-h-full"), height };
    };
    const light = load("light");
    const dark = load("dark");
    if (!light || !dark) return null;

    const CAP_H = 30;
    const total = 2 * CAP_H + light.height + dark.height;
    const style = `
html, body { margin: 0; padding: 0; }
body { width: 900px; }
.ds-cap { box-sizing: border-box; height: ${CAP_H}px; display: flex; align-items: center; padding: 0 14px;
  font: 600 10px/1 ${SYS_FONT}; letter-spacing: .08em; text-transform: uppercase;
  color: #5f6b7c; background: #edeff2; border-bottom: 1px solid rgba(17,20,24,.12); }
.ds-frame { position: relative; overflow: hidden; transform: translateZ(0); width: 900px; }
`;
    return page({
        group: c.group,
        name: c.title,
        width: 900,
        height: total,
        title: `mithril — ${c.title}`,
        links: ["../assets/mithril.css"],
        style,
        body: `
<div class="ds-cap">${c.title} · light</div>
<div class="ds-frame" style="height:${light.height}px;background:${FRAME_BG.light}">${light.html}</div>
<div class="ds-cap">${c.title} · dark</div>
<div class="ds-frame" style="height:${dark.height}px;background:${FRAME_BG.dark}">${dark.html}</div>`,
    });
}

/* ── README (the guide the mockup agent reads) ───────────────────────────── */

function buildReadme() {
    const inventory = meta.categories
        .map((cat) => {
            const items = meta.components.filter((c) => c.group === cat.label).map((c) => `\`${c.title}\``);
            return `| ${cat.label} | ${items.join(" · ")} |`;
        })
        .join("\n");
    return `# mithril — Claude Design kit

mithril is an owned-source design system (React 19 + Tailwind v4 + Radix + CVA) whose visual
language derives from Palantir Blueprint v6.15: quiet gray chrome, a 14px system-font baseline,
4px grid, compact desktop-density controls. This kit is for **mocking up mithril-based app UI as
static HTML** — every component card under \`components/\` is the *real rendered output* of the
React implementation in both light and dark themes.

## Building a mockup

1. **Link the stylesheet** (one file, self-contained):
   \`<link rel="stylesheet" href="ui_kits/mithril/assets/mithril.css">\` (adjust the relative path).
2. **Scaffold**: \`<body class="bg-background text-foreground">\` — base font (14px system stack)
   comes from the stylesheet automatically.
3. **Dark mode**: put \`class="dark"\` (or \`data-mode="dark"\`) on any ancestor — the whole subtree
   re-themes. Both themes are first-class; check mockups in each.
4. **Named themes**: \`<html data-theme="anthropic|purple|lagoon|indigo|forest|ember">\` re-tints
   everything (combines with dark). See \`foundations/themes.html\`.
5. **Copy component markup from \`components/*.html\`** — inside each "light"/"dark" frame is real
   mithril DOM. Grab the element for the variant you need (buttons, tags, inputs, menu items,
   dialog panels…) and edit text/content. Icons are inline \`<svg>\` glyphs on a 16px grid — copy
   them from the previews too.
6. **The CSS is compiled, not a framework**: only utility classes that appear in this kit's
   markup are guaranteed to exist. Don't invent new Tailwind classes or arbitrary values
   (\`w-[437px]\` won't exist unless a preview uses it) — for bespoke sizing/layout use inline
   \`style\` with token vars, e.g. \`style="width:437px; background:var(--color-blue-3)"\`.
   All palette/token vars are available (see \`foundations/\`): \`--color-<family>-<1..5>\`,
   \`--background\`, \`--surface\`, \`--elevation-0..4\`, \`--radius-mithril\`, \`--text-heading\`, etc.

## Layout vocabulary (safe, present in the CSS)

Flex/grid utilities used throughout the previews: \`flex\`, \`flex-col\`, \`items-center\`,
\`justify-between\`, \`gap-1..8\`, \`grid\`, \`p-1..10\`, \`px-2\`, \`py-1\`, \`m*-\` equivalents,
\`w-full\`, \`max-w-*\`, \`rounded-mithril\`, \`border\`, \`bg-surface\`, \`shadow-elevation-*\`.
When unsure, mirror how the component previews compose these.

## Component inventory (${meta.components.length})

| Category | Components |
|---|---|
${inventory}

## Foundations

- \`foundations/colors.html\` — gray ramps + 14 color families (5 steps each).
- \`foundations/semantic.html\` — the 4 intents (rest/hover/active/disabled/foreground) and the
  semantic tokens that swap between light and dark.
- \`foundations/typography.html\` — the Blueprint type scale on the system stack.
- \`foundations/elevation.html\` — shadows 0–4, radii (2/4/6px), control heights (20–50px), easing.
- \`foundations/themes.html\` — the 7 built-in seed themes.

## Register (how mithril UI should feel)

Dense, quiet, desktop-first: 30px default controls, 4px canonical radius, hairline borders over
heavy strokes, intent color used sparingly (one primary action per view; success/warning/danger
reserved for status). Surfaces stack background → surface → elevated with shadows, not borders.
`;
}

/* ── Palette-vars addendum (tree-shake-proof, zero specificity) ──────────── */

function appendPaletteVars() {
    const cssPath = join(OUT, "assets/mithril.css");
    const SENTINEL = "/*__MITHRIL_KIT_PALETTE__*/";
    const css = readFileSync(cssPath, "utf8");
    if (css.includes(SENTINEL)) return;
    let vars = "--color-black:#111418;--color-white:#ffffff;";
    for (const [family, hexes] of Object.entries(RAMPS))
        hexes.forEach((hex, i) => (vars += `--color-${family}-${i + 1}:${hex};`));
    for (const [intent, v] of Object.entries(INTENTS)) {
        vars += `--color-${intent}:${v.rest};--color-${intent}-hover:${v.hover};--color-${intent}-active:${v.active};--color-${intent}-disabled:${v.disabled};--color-${intent}-foreground:${v.foreground};`;
    }
    vars += `--font-sans:${SYS_FONT};--font-mono:monospace;`;
    for (const [v, px] of TYPE_SCALE) vars += `${v}:${px}px;`;
    vars += `--text-code-sm:12px;--text-code:13px;--text-code-lg:14px;`;
    vars += `--radius-mithril-sm:2px;--radius-mithril:4px;--radius-mithril-lg:6px;`;
    vars += `--height-control-smaller:20px;--height-control-sm:24px;--height-control:30px;--height-control-lg:40px;--height-navbar:50px;`;
    vars += `--size-icon:16px;--size-icon-lg:20px;`;
    vars += `--ease-mithril:cubic-bezier(.4,1,.75,.9);--ease-mithril-bounce:cubic-bezier(.54,1.12,.38,1.11);--duration-mithril:100ms;--leading-mithril:1.28581;--leading-mithril-large:1.5;`;
    appendFileSync(
        cssPath,
        `\n${SENTINEL}\n/* Full static token set as plain vars for mockup inline styles. :where() = zero\n   specificity, so named-theme/theme-builder overrides always win. */\n:where(:root){${vars}}\n`,
    );
}

/* ── main ────────────────────────────────────────────────────────────────── */

writeFileSync(join(OUT, "foundations/colors.html"), buildColorsPage());
writeFileSync(join(OUT, "foundations/semantic.html"), buildSemanticPage());
writeFileSync(join(OUT, "foundations/typography.html"), buildTypographyPage());
writeFileSync(join(OUT, "foundations/elevation.html"), buildElevationPage());
writeFileSync(join(OUT, "foundations/themes.html"), buildThemesPage());
writeFileSync(join(OUT, "README.md"), buildReadme());
appendPaletteVars();

let ok = 0;
const missing = [];
for (const c of meta.components) {
    const html = componentPage(c);
    if (!html) {
        missing.push(c.id);
        continue;
    }
    writeFileSync(join(OUT, "components", `${c.id}.html`), html);
    ok++;
}
console.log(`components written: ${ok}/${meta.components.length}`);
if (missing.length) {
    console.error("MISSING captures:", missing.join(", "));
    process.exitCode = 1;
}
