import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * ControlGroup — Blueprint-faithful flex layout wrapper for form controls.
 *
 * Blueprint spec (`_control-group.scss`):
 * - Horizontal (default): `display:flex; flex-direction:row; align-items:stretch`
 * - Vertical: `flex-direction:column; align-items:stretch`
 * - Fill: group `width:100%`; all children get `flex:1 1 auto` unless they have `.bp6-fixed`
 *   (we expose this via the `fixed` prop on a wrapper — children that opt out of fill
 *   receive the `data-fixed` attribute so we can target them with a descendant selector)
 * - No gap — children abut; flush look comes from zero gap + stretch.
 *   NOTE: Blueprint v6.15 actually renders `margin-right: 4px` between horizontal
 *   children (`:not(:last-child)`) and `margin-bottom: 4px` in vertical mode.
 *   We match that with `[&>*:not(:last-child)]:mr-1` / `[&>*:not(:last-child)]:mb-1`.
 *
 * Z-index stacking approach (replicated from Blueprint's $control-group-stack):
 *   The stacking order from lowest to highest:
 *     1  input-disabled
 *     2  input-default
 *     3  button-disabled
 *     4  button-default
 *     5  button-focus/hover/active
 *     6  intent-button-*
 *     7  intent-input-default
 *     8  input-focus
 *     9  intent-input-focus
 *    10  input-group-children (icons inside input groups)
 *    11  select-caret
 *
 * We implement this via Tailwind descendant-selector literal utility classes so tree
 * shaking preserves them. Key invariant: a focused or intent-bearing child must layer
 * ABOVE its neighbors so its focus ring / intent border is not clipped.
 *
 * Implementation:
 * - Each child gets `position:relative` (via `[&>*]:relative`).
 * - Default input: z-2; focused input: z-8; intent input: z-7; focused intent input: z-9
 * - Default button: z-4; focused/hovered/active button: z-5; intent button: z-6
 * - Disabled: z-1 (input) / z-3 (button) — below defaults
 * - Input-group children (icons): z-10 (self-managed by InputGroup's slots)
 * - Select caret: z-11 (HTMLSelect tags it `data-select-caret`)
 *
 * Button tiers match `:where(button, .bp6-button)` so they apply to a raw <button>, a
 * Button, an `asChild` Button, and an AnchorButton alike (the last two render <a> but carry
 * the `.bp6-button` marker from `buttonVariants`). Intent tiers key off the `data-intent`
 * attribute that Button, AnchorButton, and InputGroup emit for a real (non-"none") intent;
 * `:where()` (zero specificity) plus `:not(:disabled)` qualifiers keep the tiers' ordering
 * independent of Tailwind's class emit order.
 *
 * IMPORTANT: Tailwind v4 tree-shakes `@theme` vars referenced at runtime. All utility
 * classes here MUST be literal strings (no template literals or runtime construction).
 */
const controlGroupVariants = cva(
    [
        // Layout base
        "flex items-stretch",
        // Each child needs position:relative for z-index to work
        "[&>*]:relative",
        // Z-index stacking — inputs
        // disabled input: z-1
        "[&_input:disabled]:z-[1]",
        // default input: z-2
        "[&_input]:z-[2]",
        // intent input (resting): z-7 — keyed off Button/InputGroup's `data-intent`
        // attribute (emitted only for a real intent). `:not(:disabled)` raises specificity
        // above the disabled tier so a disabled intent input still falls back to z-1.
        "[&_input[data-intent]:not(:disabled)]:z-[7]",
        // focused input (no intent): z-8
        "[&_input:focus]:z-[8]",
        // focused intent input: z-9 — extra `:not(:disabled)` qualifier makes this strictly
        // more specific than both the z-7 intent and z-8 focus rules, so it wins outright.
        "[&_input[data-intent]:not(:disabled):focus]:z-[9]",
        // Z-index stacking — buttons. `:where(button, .bp6-button)` matches a raw <button>,
        // a mithril Button, an `asChild` Button, and an AnchorButton (the latter two render
        // <a>, not <button>, but carry the `.bp6-button` marker). `:where()` adds zero
        // specificity, so these tiers' relative ordering comes entirely from the pseudo-class
        // / attribute qualifiers below, independent of Tailwind's class emit order.
        // disabled button: z-3
        "[&_:where(button,.bp6-button):disabled]:z-[3]",
        // default button: z-4
        "[&_:where(button,.bp6-button)]:z-[4]",
        // focused/hovered/active button: z-5
        "[&_:where(button,.bp6-button):focus]:z-[5]",
        "[&_:where(button,.bp6-button):hover]:z-[5]",
        "[&_:where(button,.bp6-button):active]:z-[5]",
        // intent button: z-6 — `[data-intent]:not(:disabled)` outranks the z-4/z-5 rules so an
        // intent button stays above them; the `:not(:disabled)` guard drops a disabled one to z-3.
        "[&_:where(button,.bp6-button)[data-intent]:not(:disabled)]:z-[6]",
        // Input-group icon/action slots self-manage z-10 (hardcoded in InputGroup), which
        // already places them above every input/button tier — no ControlGroup rule needed.
        // Select caret: z-11 (top of the stack) — HTMLSelect tags its caret `data-select-caret`.
        "[&_[data-select-caret]]:z-[11]",
    ],
    {
        variants: {
            vertical: {
                true: "flex-col",
                false: "flex-row",
            },
            fill: {
                // When fill: group is full-width; non-fixed children flex-grow
                true: "w-full [&>*:not([data-fixed])]:flex-1",
                false: "",
            },
        },
        defaultVariants: {
            vertical: false,
            fill: false,
        },
    },
);

// Child spacing: Blueprint applies margin between children (not gap), which preserves
// border-radius (gap would separate them). Blueprint uses $pt-spacing * 0.5 = 4px.
// Horizontal: margin-right: 4px on all but last child
// Vertical: margin-bottom: 4px on all but last child
// We add these via compound variants.

export interface ControlGroupProps
    extends Omit<React.HTMLAttributes<HTMLDivElement>, "role">,
        VariantProps<typeof controlGroupVariants> {
    /** Lay out children in a column instead of a row. @default false */
    vertical?: boolean;
    /**
     * Make the group fill its container width. All children expand equally unless
     * they carry the `data-fixed` attribute (opting out of flex growth).
     * @default false
     */
    fill?: boolean;
}

/**
 * ControlGroup — arranges form controls (inputs, buttons, selects) flush in a row or
 * column. Children abut with no gap; a focused/intent child is raised via z-index so
 * its focus ring is not clipped by its neighbor.
 *
 * @example
 * // Horizontal (default)
 * <ControlGroup>
 *   <InputGroup placeholder="Search…" />
 *   <Button>Go</Button>
 * </ControlGroup>
 *
 * @example
 * // Vertical fill
 * <ControlGroup vertical fill>
 *   <InputGroup placeholder="Username" />
 *   <InputGroup placeholder="Password" type="password" />
 * </ControlGroup>
 */
export const ControlGroup = forwardRef<HTMLDivElement, ControlGroupProps>(function ControlGroup(
    { className, vertical = false, fill = false, children, ...props },
    ref,
) {
    return (
        <div
            role="group"
            ref={ref}
            className={cn(
                controlGroupVariants({ vertical, fill }),
                // Child spacing: Blueprint uses $pt-spacing * 0.5 = 2px between children.
        // (Not CSS gap — margin keeps borders flush and lets z-index work correctly.)
        !vertical && "[&>*:not(:last-child)]:mr-0.5",
        vertical && "[&>*:not(:last-child)]:mb-0.5",
                className,
            )}
            {...props}
        >
            {children}
        </div>
    );
});
ControlGroup.displayName = "ControlGroup";
