/**
 * Glyph registry for the dynamic string form of `<Icon>`.
 *
 * `<Icon icon={add} />` (a glyph object) renders directly and tree-shakes — the
 * bundler ships only the glyphs you import. But a *runtime* string
 * (`<Icon icon="add" />`) can't tree-shake: the bundler can't know which glyph a
 * string names. So the string form resolves through this small registry, which you
 * populate explicitly:
 *
 *   // every glyph (convenience, pulls all ~195 KB):
 *   import { ICON_GLYPHS, registerIcons } from "@/components/ui/icons/all";
 *   registerIcons(ICON_GLYPHS);
 *
 *   // or only the glyphs you use (tree-shakes):
 *   import { add, trash } from "@/components/ui/icons";
 *   import { registerIcons } from "@/components/ui/icons/registry";
 *   registerIcons({ add, trash });
 *
 * Components register their own structural/default glyphs as objects (e.g. the
 * Dialog close button imports `smallCross`), so they work standalone with no
 * registration — only *caller-supplied* icon-name strings need this.
 */
import type { IconGlyph, IconName } from "./index";

const registry = new Map<IconName, IconGlyph>();

/**
 * Register glyphs so they can be resolved by name in the `<Icon icon="name" />`
 * string form. Idempotent; later calls override earlier ones for the same name.
 */
export function registerIcons(glyphs: Partial<Record<IconName, IconGlyph>>): void {
    for (const name of Object.keys(glyphs) as IconName[]) {
        const glyph = glyphs[name];
        if (glyph) registry.set(name, glyph);
    }
}

/** Look up a registered glyph by name; `undefined` if it was never registered. */
export function getRegisteredGlyph(name: IconName): IconGlyph | undefined {
    return registry.get(name);
}
