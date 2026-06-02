import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * mithril defines a custom type scale (`text-body*`, `text-heading*`) via
 * Tailwind's `--text-*` theme tokens. tailwind-merge doesn't know these names are
 * FONT SIZES, so by default it lumps e.g. `text-body-lg` and `text-primary-foreground`
 * into one `text-*` conflict group and silently drops the size — which is why large
 * buttons rendered at the inherited 14px instead of 16px. Teach it our size names so
 * font-size and text-color stop colliding.
 */
const twMerge = extendTailwindMerge({
    extend: {
        classGroups: {
            "font-size": [
                {
                    text: [
                        "body-xs",
                        "body-sm",
                        "body",
                        "body-lg",
                        "heading-sm",
                        "heading-lg",
                        "heading-display",
                        "heading-xl",
                    ],
                },
            ],
        },
    },
});

/**
 * Merge class names with `clsx` semantics, then dedupe conflicting Tailwind
 * utilities with `tailwind-merge`. The standard shadcn `cn` helper.
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
