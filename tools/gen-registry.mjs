// Generates registry.json from the component source in src/components/ui.
//
// analyst-ui is distributed shadcn-style: consumers own the component source,
// pulled via a registry. This script keeps registry.json in lock-step with the
// actual code by parsing each component's imports to derive:
//   - npm `dependencies`        (from @radix-ui/*, react-day-picker, cva, …)
//   - `registryDependencies`    (from internal ./x / @/components/ui/x imports,
//                                 plus the shared `utils` lib and `tokens` style)
//
// Re-run after adding/removing components or changing their imports:
//   node tools/gen-registry.mjs
//
// It is intentionally dependency-free (Node built-ins only).

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, basename } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const UI_DIR = join(ROOT, "src/components/ui");

// npm packages a component may import. react/react-dom are peer deps (assumed,
// never listed); clsx + tailwind-merge belong to the `utils` lib item, not to
// individual components.
const NPM_PREFIXES = ["@radix-ui/", "react-day-picker", "class-variance-authority"];

/** Pretty titles for the registry item `title` field. Falls back to PascalCase. */
const TITLES = {
    "input-group": "InputGroup",
    "text-area": "TextArea",
    "form-group": "FormGroup",
    "control-group": "ControlGroup",
    "control-base": "ControlBase",
    "control-card": "ControlCard",
    "html-select": "HTMLSelect",
    "html-table": "HTMLTable",
    "file-input": "FileInput",
    "numeric-input": "NumericInput",
    "segmented-control": "SegmentedControl",
    "context-menu": "ContextMenu",
    "card-list": "CardList",
    "panel-stack": "PanelStack",
    "editable-text": "EditableText",
    "entity-title": "EntityTitle",
    "non-ideal-state": "NonIdealState",
    "tag-input": "TagInput",
    "multi-select": "MultiSelect",
    "time-picker": "TimePicker",
    "date-picker": "DatePicker",
    "date-input": "DateInput",
    "date-range-picker": "DateRangePicker",
    "date-range-input": "DateRangeInput",
    "timezone-select": "TimezoneSelect",
    "progress-bar": "ProgressBar",
    "non-ideal": "NonIdealState",
};

const pascal = (id) =>
    TITLES[id] ?? id.split("-").map((p) => p[0].toUpperCase() + p.slice(1)).join("");

/** All import source specifiers in a source file (static + type imports). */
function importsOf(src) {
    const re = /\bfrom\s+["']([^"']+)["']/g;
    const out = [];
    let m;
    while ((m = re.exec(src))) out.push(m[1]);
    return out;
}

const files = readdirSync(UI_DIR).filter((f) => f.endsWith(".tsx")).sort();

const items = [
    {
        name: "tokens",
        type: "registry:style",
        title: "Design tokens",
        description:
            "Blueprint-faithful design tokens (palette, intents, surfaces, elevation, type, motion) as Tailwind v4 @theme + light/dark CSS variables. The foundation every component builds on.",
        files: [{ path: "src/styles/tokens.css", type: "registry:file", target: "src/styles/tokens.css" }],
    },
    {
        name: "utils",
        type: "registry:lib",
        title: "cn() utility",
        description:
            "The `cn` class-merging helper (clsx + tailwind-merge), taught analyst-ui's custom font-size scale so size and color utilities don't collide.",
        dependencies: ["clsx", "tailwind-merge"],
        files: [{ path: "src/lib/utils.ts", type: "registry:lib", target: "lib/utils.ts" }],
    },
    {
        name: "types",
        type: "registry:lib",
        title: "Shared types",
        description:
            "Cross-component TypeScript types (the `Intent` vocabulary) defined once so every control shares one source of truth. Dependency-free.",
        files: [{ path: "src/lib/types.ts", type: "registry:lib", target: "lib/types.ts" }],
    },
];

for (const file of files) {
    const id = basename(file, ".tsx");
    const src = readFileSync(join(UI_DIR, file), "utf8");
    const specifiers = importsOf(src);

    const npm = new Set();
    const registryDeps = new Set();
    let usesUtils = false;
    let usesTypes = false;

    for (const spec of specifiers) {
        // internal cross-component import: "./menu" or "@/components/ui/menu".
        // The glyph modules (`./icons`, and the deeper `./icons/registry`/`./icons/all`
        // which don't match this bare-name regex) ship as files inside the `icon`
        // item, so importing a glyph from "./icons" is a dependency on `icon` — except
        // from icon.tsx itself, which owns those files.
        const internal = spec.match(/^(?:\.\/|@\/components\/ui\/)([a-z-]+)$/);
        if (internal) {
            const dep = internal[1];
            if (dep === "icons") {
                if (id !== "icon") registryDeps.add("icon");
            } else {
                registryDeps.add(dep);
            }
            continue;
        }
        if (spec === "@/lib/utils") {
            usesUtils = true;
            continue;
        }
        if (spec === "@/lib/types") {
            usesTypes = true;
            continue;
        }
        const npmPkg = NPM_PREFIXES.find((p) => spec === p || spec.startsWith(p));
        if (npmPkg) {
            // @radix-ui/react-dialog → keep full package; others are the prefix itself
            npm.add(spec.startsWith("@radix-ui/") ? spec : npmPkg);
        }
    }

    if (usesUtils) registryDeps.add("utils");
    if (usesTypes) registryDeps.add("types");
    // Every component renders against the design tokens.
    registryDeps.add("tokens");

    // Multi-file components: icon ships the generated glyph modules + registry
    // alongside it (per-glyph exports in index.ts, the ICON_GLYPHS map in all.ts,
    // and the registerIcons/getRegisteredGlyph helpers in registry.ts).
    const itemFiles = [
        { path: `src/components/ui/${file}`, type: "registry:ui", target: `components/ui/${file}` },
    ];
    if (id === "icon") {
        for (const f of ["index.ts", "all.ts", "registry.ts"]) {
            itemFiles.push({
                path: `src/components/ui/icons/${f}`,
                type: "registry:ui",
                target: `components/ui/icons/${f}`,
            });
        }
    }

    const item = {
        name: id,
        type: "registry:ui",
        title: pascal(id),
        description: `${pascal(id)} — Blueprint-faithful, built on CVA${
            [...npm].some((d) => d.startsWith("@radix-ui/")) ? " + Radix" : ""
        }.`,
        files: itemFiles,
    };
    if (npm.size) item.dependencies = [...npm].sort();
    // Stable order: internal components first (alpha), then lib items (utils/types),
    // then tokens last.
    item.registryDependencies = [...registryDeps].sort((a, b) => {
        const rank = (x) => (x === "tokens" ? 2 : x === "utils" || x === "types" ? 1 : 0);
        return rank(a) - rank(b) || a.localeCompare(b);
    });
    items.push(item);
}

const registry = {
    $schema: "https://ui.shadcn.com/schema/registry.json",
    name: "analyst-ui",
    homepage: "https://github.com/bbatchelder/analyst-ui",
    items,
};

writeFileSync(join(ROOT, "registry.json"), JSON.stringify(registry, null, 4) + "\n");
console.log(`Wrote registry.json — ${items.length} items (${files.length} components + tokens + utils + types).`);
