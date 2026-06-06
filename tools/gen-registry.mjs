// Generates registry.json from the component source in src/components/ui.
//
// mithril is distributed shadcn-style: consumers own the component source,
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

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, basename } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const UI_DIR = join(ROOT, "src/components/ui");

// npm packages a component may import. react/react-dom are peer deps (assumed,
// never listed); clsx + tailwind-merge belong to the `utils` lib item, not to
// individual components.
const NPM_PREFIXES = ["@radix-ui/", "@tanstack/", "react-day-picker", "react-dropzone", "class-variance-authority"];

/** Pretty titles for the registry item `title` field. Falls back to PascalCase. */
const TITLES = {
    "ai-label": "AILabel",
    "data-table": "DataTable",
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

/**
 * Per-component one-line descriptions — what the component *is and does*, in mithril's
 * own terms. Shown verbatim under the component title on its showcase page and as the
 * registry item `description`. Add an entry here for every new component; the fallback
 * template (below) is intentionally generic and should not survive into the gallery.
 */
const DESCRIPTIONS = {
    "ai-explainability": "A marker chip that flags AI-generated or AI-assisted content and reveals an explainability popover describing what the AI did.",
    alert: "A modal confirm dialog — large icon, message, and confirm/cancel actions — for destructive or irreversible choices.",
    "anchor-button": "An `<a>` styled exactly like Button, with anchor navigation semantics and proper disabled handling.",
    breadcrumbs: "A navigational trail of links that collapses into an overflow menu when the path is too long to fit.",
    "button-group": "Attaches a row or column of Buttons into one segmented control, collapsing the inner radii and shared borders.",
    button: "The core action control — five intents, fill/outlined/minimal variants, sizes, icons, and a loading state.",
    callout: "A boxed inline message with an intent color, leading icon, and optional heading for page-level notices.",
    "card-list": "A bordered, flush-stacked list of Cards with hover and interactive states for selectable rows.",
    card: "An elevated surface container with selectable elevation and an optional interactive hover lift.",
    checkbox: "A labeled checkbox with indeterminate state, sizes, and inline or block layout.",
    collapse: "An animated height transition that smoothly expands and collapses its content region.",
    "context-menu": "A right-click popup menu — a Radix context-menu trigger wrapping mithril's Menu surface.",
    "control-base": "The shared label / hidden-input / indicator primitive behind Checkbox, Radio, and Switch.",
    "control-card": "A Card whose entire surface is a selectable Checkbox, Radio, or Switch label.",
    "control-group": "A flex layout wrapper that attaches form controls — inputs, selects, buttons — into one row or column.",
    "data-table": "A virtualized data grid with sortable, resizable columns and row selection, built on TanStack Table.",
    "date-input": "A text field that opens a DatePicker popover for typing or picking a single date.",
    "date-picker": "A single-date calendar with month/year navigation and optional time selection, on react-day-picker.",
    "date-range-input": "Two linked text fields sharing one DateRangePicker popover to capture a start-and-end range.",
    "date-range-picker": "Two side-by-side month calendars for selecting a start-to-end date range.",
    dialog: "A modal overlay with header, body, and footer — focus-trapped and scroll-locked, on Radix Dialog.",
    divider: "A thin rule that separates content horizontally or vertically.",
    drawer: "An overlay panel anchored to a screen edge, focus-trapped and scroll-locked, on Radix Dialog.",
    "editable-text": "Text that turns into an inline input on click and commits on blur or Enter.",
    "entity-title": "A title block pairing an icon or avatar with a heading, subtitle, and optional tags.",
    "file-dropzone": "A drag-and-drop surface for multi-file uploads, with previews and validation, built on react-dropzone.",
    "file-input": "A styled file picker showing a Browse button and the selected file's name.",
    "form-group": "Wraps a label, helper text, and a control into one labeled — and optionally inline — form field.",
    hotkeys: "A keyboard-shortcut system — KeyCombo key-cap rendering plus a global shortcuts help dialog.",
    "html-select": "A native `<select>` restyled to the system, with a chevron affordance and matching sizes.",
    "html-table": "A styled wrapper for native `<table>` markup — striped, bordered, and compact variants.",
    icon: "Renders any of the 706 vendored Blueprint glyphs by name or imported object, at a given size and color.",
    "input-group": "A text input with leading or trailing icons, buttons, or spinners placed inside the field.",
    link: "An inline anchor with the system's link styling, focus ring, and optional icon.",
    menu: "A standalone styled list of items, dividers, and submenus — compose inside a Popover for a dropdown.",
    "multi-select": "A tag-chip input that filters a dropdown and accumulates multiple selected items.",
    "multistep-dialog": "A wizard Dialog with a numbered step rail and back/next navigation across ordered steps.",
    navbar: "A fixed-height top bar with left and right groups, headings, and dividers for app chrome.",
    "non-ideal-state": "An empty / error / loading placeholder that centers an icon, title, description, and action.",
    "numeric-input": "A number field with increment/decrement steppers, clamping, and keyboard adjustment.",
    omnibar: "A command-palette overlay — a top-pinned search field over a filtered result menu.",
    "overflow-list": "A horizontal list that collapses the items that don't fit into a trailing overflow renderer.",
    "panel-stack": "An animated stack of panels with push/pop navigation and a back-to-previous header.",
    popover: "A floating panel anchored to a trigger, with arrow, placement, and dismissal, on Radix Popover.",
    portal: "Renders children into a detached DOM node to escape `overflow` and `z-index` stacking.",
    "progress-bar": "A horizontal track with a determinate fill or indeterminate animation, colored per intent.",
    radio: "A labeled radio control, plus RadioGroup for single-choice selection.",
    "resize-sensor": "A headless helper that observes an element's size and fires a callback whenever it changes.",
    section: "A titled content container with a header, optional right-side controls, and a collapsible body.",
    "segmented-control": "A pill-track toggle of mutually exclusive options — tabs styled as a single control.",
    select: "A filterable dropdown — type to search, arrow-key navigate, and pick a single item.",
    skeleton: "A shimmering placeholder modifier that stands in for content while it loads.",
    slider: "A draggable track for choosing a numeric value or range, with labels and tick marks.",
    spinner: "An indeterminate circular loading indicator, sized and intent-colored.",
    suggest: "A typeahead where the input itself filters a dropdown and fills with the chosen item.",
    switch: "A toggle switch for on/off state, with labels and sizes — a Checkbox alternative.",
    tabs: "A tabbed panel switcher with an animated active indicator, on Radix Tabs.",
    "tag-input": "A field that collects free-text values as removable Tag chips.",
    tag: "A compact label chip with intents, solid or minimal styles, an icon, and an optional remove button.",
    "text-area": "A multi-line text field with sizes, fill, and auto-resize support.",
    text: "Typographic text tiers — headings, body, muted — mapped to the system's type scale.",
    "time-picker": "A time field with hour/minute/second steppers and optional AM/PM, to a set precision.",
    "timezone-select": "A Select specialized for IANA timezones, searchable by city and UTC offset.",
    toast: "A transient notification card plus a Toaster that stacks and auto-dismisses them, on Radix Toast.",
    tooltip: "A small inverted hover/focus label anchored to its trigger, on Radix Tooltip.",
    tree: "A nested, expandable tree of nodes with icons, selection, and caret toggles.",
};

/** All import source specifiers in a source file (static + type imports). */
function importsOf(src) {
    const re = /\bfrom\s+["']([^"']+)["']/g;
    const out = [];
    let m;
    while ((m = re.exec(src))) out.push(m[1]);
    return out;
}

const files = readdirSync(UI_DIR).filter((f) => f.endsWith(".tsx")).sort();

/**
 * Subfiles of a multi-file component that ships a sibling directory of internals
 * (e.g. `data-table/header.tsx`). Returns the `.ts`/`.tsx` entries of `<id>/`,
 * sorted, or `[]` if no such directory exists. (`icon` predates this convention and
 * keeps its bespoke `icons/` handling below.)
 */
function subfilesOf(id) {
    const dir = join(UI_DIR, id);
    let isDir = false;
    try {
        isDir = statSync(dir).isDirectory();
    } catch {
        return [];
    }
    if (!isDir) return [];
    return readdirSync(dir)
        .filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"))
        .sort();
}

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
            "The `cn` class-merging helper (clsx + tailwind-merge), taught mithril's custom font-size scale so size and color utilities don't collide.",
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
    // Multi-file components ship a sibling directory of internals (e.g. `data-table/`).
    // Every subfile ships with the item, and the subfiles' *external* imports (npm,
    // @/lib, @/components/ui) count toward this item's deps. Relative sibling imports
    // (`./header`) and the back-reference to the entry (`../data-table`) are NOT deps,
    // so subfile specifiers starting with "." are ignored.
    const subEntries = id === "icon" ? [] : subfilesOf(id);
    const specifiers = [
        ...importsOf(src),
        ...subEntries.flatMap((sub) =>
            importsOf(readFileSync(join(UI_DIR, id, sub), "utf8")).filter((s) => !s.startsWith(".")),
        ),
    ];

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
            // Scoped engines (@radix-ui/*, @tanstack/*) → keep the full package name;
            // bare prefixes (react-day-picker, cva) are the prefix itself.
            npm.add(spec.startsWith("@radix-ui/") || spec.startsWith("@tanstack/") ? spec : npmPkg);
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
    // Other multi-file components ship their `<id>/` directory of internals.
    for (const sub of subEntries) {
        itemFiles.push({
            path: `src/components/ui/${id}/${sub}`,
            type: "registry:ui",
            target: `components/ui/${id}/${sub}`,
        });
    }

    const item = {
        name: id,
        type: "registry:ui",
        title: pascal(id),
        description:
            DESCRIPTIONS[id] ??
            // Fallback for a component with no curated entry yet — add one to DESCRIPTIONS.
            `${pascal(id)} — built on CVA${
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
    name: "mithril",
    homepage: "https://github.com/bbatchelder/mithril",
    items,
};

writeFileSync(join(ROOT, "registry.json"), JSON.stringify(registry, null, 4) + "\n");
console.log(`Wrote registry.json — ${items.length} items (${files.length} components + tokens + utils + types).`);
