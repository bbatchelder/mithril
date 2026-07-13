// Parse COMPONENTS + CATEGORIES out of src/App.tsx → dist-design/meta.json.
// The Claude Design kit mirrors the gallery's own inventory and grouping, so the
// showcase registry in App.tsx is the single source of truth here too.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT = join(REPO, "dist-design");

const src = readFileSync(join(REPO, "src/App.tsx"), "utf8");

const components = [];
for (const m of src.matchAll(/\{ id: "([^"]+)", title: "([^"]+)", render:/g)) {
    components.push({ id: m[1], title: m[2] });
}
if (components.length === 0) throw new Error("no COMPONENTS entries matched in src/App.tsx — registry shape changed?");

const catBlock = src.match(/const CATEGORIES[^=]*=\s*\[([\s\S]*?)\n\];/);
if (!catBlock) throw new Error("CATEGORIES block not found in src/App.tsx");
const categories = [];
for (const m of catBlock[1].matchAll(/\{ label: "([^"]+)", ids: \[([^\]]*)\]/g)) {
    categories.push({ label: m[1], ids: [...m[2].matchAll(/"([^"]+)"/g)].map((x) => x[1]) });
}

const groupOf = {};
for (const c of categories) for (const id of c.ids) groupOf[id] = c.label;

// ── Full-page examples: src/examples/registry.ts (fields kept literal + ordered
//    by contract — see that file's doc comment) ───────────────────────────────
const exSrc = readFileSync(join(REPO, "src/examples/registry.ts"), "utf8");
const examples = [];
for (const m of exSrc.matchAll(/\{\s*id: "([^"]+)",\s*title: "([^"]+)",\s*description:\s*"([^"]*)",\s*width: (\d+)/g)) {
    examples.push({ id: m[1], title: m[2], description: m[3], width: Number(m[4]) });
}

mkdirSync(OUT, { recursive: true });
writeFileSync(
    join(OUT, "meta.json"),
    JSON.stringify(
        { components: components.map((c) => ({ ...c, group: groupOf[c.id] ?? "Other" })), categories, examples },
        null,
        2,
    ),
);
console.log(`meta.json: ${components.length} components, ${categories.length} categories, ${examples.length} examples`);
