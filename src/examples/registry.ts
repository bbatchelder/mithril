import type { ComponentType } from "react";

import { ObjectExplorer } from "./ObjectExplorer";

/**
 * Full-page design examples — complete surfaces composed from mithril components,
 * captured into the Claude Design kit as an "Examples" group so mockups can start
 * from a whole layout instead of a single component.
 *
 * Rendered standalone via the isolated harness (`?example=<id>&theme=<light|dark>`),
 * full-bleed (no showcase column). design-sync's gen-meta parses this registry
 * textually — keep each entry's `id`, `title`, `description`, and `width` fields
 * literal and in this order.
 */
export interface ExampleEntry {
    id: string;
    title: string;
    /** One-liner shown as the kit card's subtitle. */
    description: string;
    /** Capture viewport / kit card width in px (examples are wider than the 900px component cards). */
    width: number;
    component: ComponentType;
}

export const EXAMPLES: ExampleEntry[] = [
    {
        id: "object-explorer",
        title: "Object Explorer",
        description: "Ontology-browser home — dark rail, search hero, shortcut cards, object-type catalog table, empty object-set catalog.",
        width: 1440,
        component: ObjectExplorer,
    },
];
