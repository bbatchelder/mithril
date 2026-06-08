// GENERATED FILE — do not edit by hand. Regenerate with:  node tools/gen-barrel.mjs
//
// The public entry point for the npm package (`@bbatchelder/mithril`). Re-exports every
// owned component from src/components/ui plus the shared lib helpers. Per-component
// subpath imports (`@bbatchelder/mithril/button`) and the tree-shakeable icon glyph set
// (`@bbatchelder/mithril/icons`) are wired in package.json#exports, not here.

// Shared foundations.
export { cn } from "./lib/utils";
export type { Intent } from "./lib/types";

// Icon string-form registry helpers (the `Icon` component itself comes from ./components/ui/icon).
export { registerIcons, getRegisteredGlyph } from "./components/ui/icons/registry";

// Components.
export * from "./components/ui/ai-explainability";
export * from "./components/ui/alert";
export * from "./components/ui/anchor-button";
export * from "./components/ui/breadcrumbs";
export * from "./components/ui/button";
export * from "./components/ui/button-group";
export * from "./components/ui/callout";
export * from "./components/ui/card";
export * from "./components/ui/card-list";
export * from "./components/ui/checkbox";
export * from "./components/ui/collapse";
export * from "./components/ui/context-menu";
export * from "./components/ui/control-base";
export * from "./components/ui/control-card";
export * from "./components/ui/control-group";
export * from "./components/ui/data-table";
export * from "./components/ui/date-input";
export * from "./components/ui/date-picker";
export * from "./components/ui/date-range-input";
export * from "./components/ui/date-range-picker";
export * from "./components/ui/dialog";
export * from "./components/ui/divider";
export * from "./components/ui/drawer";
export * from "./components/ui/editable-text";
export * from "./components/ui/entity-title";
export * from "./components/ui/file-dropzone";
export * from "./components/ui/file-input";
export * from "./components/ui/form-group";
export * from "./components/ui/hotkeys";
export * from "./components/ui/html-select";
export * from "./components/ui/html-table";
export * from "./components/ui/icon";
export * from "./components/ui/input-group";
export * from "./components/ui/link";
export * from "./components/ui/menu";
export * from "./components/ui/multi-select";
export * from "./components/ui/multistep-dialog";
export * from "./components/ui/navbar";
export * from "./components/ui/non-ideal-state";
export * from "./components/ui/numeric-input";
export * from "./components/ui/omnibar";
export * from "./components/ui/overflow-list";
export * from "./components/ui/panel-stack";
export * from "./components/ui/popover";
export * from "./components/ui/portal";
export * from "./components/ui/progress-bar";
export * from "./components/ui/radio";
export * from "./components/ui/resize-sensor";
export * from "./components/ui/section";
export * from "./components/ui/segmented-control";
export * from "./components/ui/select";
export * from "./components/ui/skeleton";
export * from "./components/ui/slider";
export * from "./components/ui/spinner";
export * from "./components/ui/suggest";
export * from "./components/ui/switch";
export * from "./components/ui/tabs";
export * from "./components/ui/tag";
export * from "./components/ui/tag-input";
export * from "./components/ui/text";
export * from "./components/ui/text-area";
export * from "./components/ui/time-picker";
export * from "./components/ui/timezone-select";
export * from "./components/ui/toast";
export * from "./components/ui/tooltip";
export * from "./components/ui/tree";
