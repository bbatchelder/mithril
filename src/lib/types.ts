/**
 * Shared cross-component types.
 *
 * Kept tiny and dependency-free so it stays cheap to own (shadcn-style, every
 * component that uses it pulls this file in via the registry, exactly like
 * `lib/utils`). Component-specific aliases (e.g. `ButtonIntent`) re-export from
 * here so each component still documents its own intent name in its public API
 * while the vocabulary is defined once.
 */

/**
 * Visual intent — Blueprint's five semantic colors. Drives fill/text/border/icon
 * coloring across controls. `"none"` is the neutral default (no intent color).
 *
 * The single source of truth for the intent vocabulary: components alias this
 * (`export type ButtonIntent = Intent`) rather than re-declaring the union, and
 * those that only support a subset narrow it (e.g.
 * `Extract<Intent, "none" | "primary">`).
 */
export type Intent = "none" | "primary" | "success" | "warning" | "danger";
