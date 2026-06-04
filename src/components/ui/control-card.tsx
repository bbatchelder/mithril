"use client";

/**
 * ControlCard — pixel-faithful Blueprint v6.15 reimplementation.
 *
 * ## Composition
 *
 * A ControlCard is a `Card` (`.bp6-card.bp6-control-card`) with:
 *   - `padding: 0; min-height: auto` on the card element itself.
 *   - The inner control (Checkbox / Radio / Switch) acts as a full-card-filling flex label.
 *     The label gets: `display: flex; gap: 8px; align-items: flex-start; padding: 20px`.
 *     Compact mode: `padding: 16px`.
 *
 * ## Alignment
 *
 * Blueprint SCSS:
 *   `.bp6-align-left`  → `flex-direction: row;     justify-content: flex-start;`
 *   `.bp6-align-right` → `flex-direction: row-reverse; justify-content: space-between;`
 *
 * In our API: `alignIndicator="left"` (default for Checkbox) puts indicator on the left;
 * `alignIndicator="right"` (default for Radio + Switch) puts indicator on the right.
 *
 * Blueprint's ControlCard defaults: `alignIndicator = Alignment.END` (= right)
 * CheckboxCard overrides default to `Alignment.START` (= left).
 *
 * ## Key behaviours (mirrored from Blueprint source)
 *
 * - `showAsSelectedWhenChecked` (default true): when the control is checked, the Card
 *   renders the "selected" state (Card's primary ring — `shadow-card-selected`). This
 *   is achieved by wiring checked state back to Card's `selected` prop.
 * - `interactive` prop on Card: always true when not disabled (the whole card is clickable).
 * - The control indicator's margins are zeroed out inside the card — we achieve this by
 *   overriding the control's `className` to cancel indicator margins.
 *
 * ## Implementation strategy
 *
 * We compose `Card` (interactive surface + selected ring) wrapping the control.
 * The control is rendered as an **inline control** filling the full card width, achieved by:
 *   1. Passing the control a wrapper `className` that sets the full-card-fill flex layout
 *      (`flex items-start gap-2 p-5/p-4 w-full`) on the label element.
 *   2. Cancelling the control's default indicator margins with a reset class.
 *   3. Cancelling the control's default padding-inline-start/end (which would add space
 *      for the indicator offset).
 *
 * We do NOT duplicate styling from Checkbox / Radio / Switch — we reuse those components
 * entirely and layer card-filling overrides via `className` passed to each.
 *
 * ## Tailwind v4 tree-shaking note
 *
 * All utility classes used for the control label override must be LITERAL strings (no
 * template literals with runtime parts). Padding values `p-5` and `p-4` appear in both
 * Card's variants and here, so they are already in the Tailwind scan; no issue.
 *
 * ## Gallery data-compare strategy
 *
 * `data-compare` is placed on the `.bp6-card.bp6-control-card` element (the Card div).
 * The harness diffs: backgroundColor, boxShadow (incl. selected ring), borderRadius,
 * paddingTop/Bottom/Left/Right (should be 0 on the card), color, fontSize.
 * On the Blueprint side, we use ref + setAttribute on `.bp6-card.bp6-control-card` elements.
 */

import { forwardRef, useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Card, type CardProps, type CardElevation } from "./card";
import { Checkbox, type CheckboxProps } from "./checkbox";
import { Radio, type RadioProps } from "./radio";
import { Switch, type SwitchProps } from "./switch";

// ─── Shared internal types ────────────────────────────────────────────────────

type AlignIndicator = "left" | "right";

/**
 * Base props shared by all ControlCard variants.
 * Extends HTMLDivElement attributes (minus conflicting `onChange`) so `style`, `data-*`,
 * `aria-*`, etc. are accepted and forwarded to the Card wrapper div.
 */
export interface ControlCardBaseProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
    /** Label displayed next to the control indicator. */
    label?: React.ReactNode;
    /** Whether the card is disabled. Disables the control and removes card interactivity. */
    disabled?: boolean;
    /**
     * When checked, render Card in "selected" state (primary ring).
     * @default true
     */
    showAsSelectedWhenChecked?: boolean;
    /**
     * Whether the card is currently checked (controlled mode).
     * For uncontrolled mode, use `defaultChecked`.
     */
    checked?: boolean;
    /** Initial checked state for uncontrolled mode. */
    defaultChecked?: boolean;
    /** Called when the control's input changes. */
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    /**
     * Position of the control indicator relative to the label.
     * Checkbox default: "left". Radio + Switch default: "right".
     */
    alignIndicator?: AlignIndicator;
    /** Drop-shadow depth on the card (0–4). @default 0 */
    elevation?: CardElevation;
    /** Render the card in selected state (primary ring). Overrides showAsSelectedWhenChecked. */
    selected?: boolean;
    /** Reduce card padding from 20px to 16px. */
    compact?: boolean;
    /** Additional class name for the card wrapper. */
    className?: string;
    /** Additional class name for the inner control (label element). */
    controlClassName?: string;
    /** Props passed directly to the underlying Card div. */
    cardProps?: Omit<CardProps, "elevation" | "interactive" | "selected" | "compact" | "className">;
}

// ─── Internal shared implementation ──────────────────────────────────────────

/**
 * Internal class that makes any control fill the card.
 *
 * Blueprint SCSS (abbreviated):
 *   .bp6-control-card .bp6-control.bp6-control.bp6-control {
 *     align-items: flex-start;
 *     display: flex;
 *     gap: $pt-spacing * 2 = 8px;
 *     margin: 0;
 *     padding: $card-padding = 20px;
 *     width: calc(100%);
 *   }
 *   &.bp6-align-left  { flex-direction: row;         justify-content: flex-start; }
 *   &.bp6-align-right { flex-direction: row-reverse; justify-content: space-between; }
 *   .bp6-control-indicator { margin: 0; }
 *   &.bp6-compact .bp6-control { padding: $card-padding-compact = 16px; }
 *
 * We apply these overrides via `className` on the control component's label element.
 * The control components (Checkbox / Radio / Switch) all accept `className` on the
 * outer `<label>`, so we can set flex layout there.
 *
 * Indicator margin reset: normally indicators have a negative margin-inline-start to
 * pull into the label's padding-inline-start gap. Inside a card, we need the indicator
 * flush with the card edge (no leading padding). We achieve this by:
 *   - Setting `padding-inline-start: 0` on the label (not `pl-6/pl-7` etc.).
 *   - Setting `margin-inline-start: 0` on the indicator by passing `indicatorProps`.
 */
function buildControlClassName(alignIndicator: AlignIndicator, compact: boolean): string {
    const padding = compact ? "p-4" : "p-5";
    return cn(
        // Full-card fill layout — overrides the control's default block/inline-block display.
        // `flex` replaces the control's normal block/inline-block so the card is fully clickable.
        "flex items-start gap-2 w-full",
        // Alignment: left = row, right = row-reverse + justify-between
        alignIndicator === "left"
            ? "flex-row justify-start"
            : "flex-row-reverse justify-between",
        // Padding: 20px normal / 16px compact — ALL four sides (same as Blueprint's $card-padding).
        // This OVERRIDES the control's default leading padding (pl-6/pl-7) that is meant to reserve
        // space for the indicator. In a card, the indicator's margin is zeroed (see INDICATOR_RESET_CLASS)
        // and we use the uniform card padding + gap instead.
        padding,
        // Remove the control's default block margin-bottom (mb-2) inside a card.
        // `!` so it wins over the control's own mb-2 regardless of Tailwind class order.
        "!mb-0",
        // Cursor and selection: card handles interaction
        "cursor-pointer",
        "select-none",
    );
}

/**
 * The indicator reset class — zeroes out all margins that the control indicator normally
 * adds to pull itself into the label's leading padding gap. Inside a ControlCard, the
 * flex layout with gap handles spacing, so indicators must be margin-free.
 *
 * Blueprint's SCSS: `.bp6-control-indicator { margin: 0; }` inside `.bp6-control-card`.
 *
 * Applied via indicatorProps.className which is merged LAST in the indicator's cn() call
 * (after the fix to Checkbox/Radio to include indicatorProps?.className in cn()).
 * `!` prefix ensures these win over the indicator's own `-ml-6/-ml-7/mr-2/float-right`.
 * `!shrink-0` prevents indicator from shrinking when label text is wide.
 */
const INDICATOR_RESET_CLASS = "!ml-0 !mr-0 !mt-0 !float-none shrink-0";

/**
 * Switch indicator reset — same as above, but Switch uses different margin values.
 * Switch track: `-ml-[36px]/-ml-[43px]` (std/large), `mr-2`, `-mt-[3px]`/`mt-px`.
 */
const SWITCH_INDICATOR_RESET_CLASS = "!ml-0 !mr-0 !mt-0 !float-none shrink-0";

/**
 * Shared hook for tracking checked state across controlled + uncontrolled modes.
 * Mirrors Blueprint's `useCheckedControl` hook.
 */
function useCheckedControl(props: {
    checked?: boolean;
    defaultChecked?: boolean;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
}) {
    const isControlled = props.checked !== undefined;
    const [internalChecked, setInternalChecked] = useState<boolean>(
        () => !!(props.checked ?? props.defaultChecked),
    );
    const effectiveChecked = isControlled ? !!(props.checked) : internalChecked;

    useEffect(() => {
        if (isControlled) {
            setInternalChecked(!!(props.checked));
        }
    }, [props.checked, isControlled]);

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (!isControlled) {
                setInternalChecked(e.target.checked);
            }
            props.onChange?.(e);
        },
        [isControlled, props.onChange],
    );

    return { checked: effectiveChecked, onChange: handleChange };
}

// ─── CheckboxCard ─────────────────────────────────────────────────────────────

export interface CheckboxCardProps extends ControlCardBaseProps {
    /** For Checkbox: the indeterminate state. */
    indeterminate?: boolean;
    /** Large variant (20px indicator). */
    large?: boolean;
    /** Additional CheckboxProps to pass to the inner Checkbox. */
    checkboxProps?: Omit<CheckboxProps, "checked" | "defaultChecked" | "disabled" | "label" | "onChange" | "alignIndicator" | "className" | "indicatorProps">;
}

/**
 * A Card with an embedded Checkbox that spans the full card surface.
 *
 * Alignment default: "left" (indicator on the left, matching Blueprint's CheckboxCard
 * which defaults to `Alignment.START`).
 *
 * When checked (and `showAsSelectedWhenChecked=true`), renders the Card with a primary
 * selection ring (`shadow-card-selected`).
 *
 * @see https://blueprintjs.com/docs/#core/components/control-card.checkbox-card
 */
export const CheckboxCard = forwardRef<HTMLDivElement, CheckboxCardProps>(
    function CheckboxCard(
        {
            label,
            disabled = false,
            showAsSelectedWhenChecked = true,
            checked: checkedProp,
            defaultChecked,
            onChange,
            alignIndicator = "left",
            elevation = 0,
            selected,
            compact = false,
            className,
            controlClassName,
            cardProps,
            indeterminate,
            large,
            checkboxProps,
            ...divProps
        },
        ref,
    ) {
        const { checked, onChange: handleChange } = useCheckedControl({
            checked: checkedProp,
            defaultChecked,
            onChange,
        });

        const isSelected = selected ?? (showAsSelectedWhenChecked && checked);
        const controlClass = buildControlClassName(alignIndicator, compact);

        return (
            <Card
                ref={ref}
                elevation={elevation}
                interactive={!disabled}
                selected={isSelected}
                compact={false} // Card padding is handled by the inner control — card itself has p-0
                className={cn("p-0 min-h-0", className)}
                {...cardProps}
                {...divProps}
            >
                <Checkbox
                    label={label}
                    checked={checked}
                    disabled={disabled}
                    onChange={handleChange}
                    alignIndicator={alignIndicator}
                    indeterminate={indeterminate}
                    large={large}
                    className={cn(controlClass, controlClassName)}
                    indicatorProps={{ className: INDICATOR_RESET_CLASS } as React.HTMLAttributes<HTMLSpanElement>}
                    {...checkboxProps}
                />
            </Card>
        );
    },
);

// ─── RadioCard ────────────────────────────────────────────────────────────────

export interface RadioCardProps extends ControlCardBaseProps {
    /** The value passed to the radio input (used with radio groups). */
    value?: string;
    /** Name attribute for the radio input (used with radio groups). */
    name?: string;
    /** Large variant (20px indicator). */
    large?: boolean;
    /** Additional RadioProps to pass to the inner Radio. */
    radioProps?: Omit<RadioProps, "checked" | "defaultChecked" | "disabled" | "label" | "onChange" | "alignIndicator" | "className" | "indicatorProps" | "value" | "name">;
}

/**
 * A Card with an embedded Radio button that spans the full card surface.
 *
 * Alignment default: "right" (indicator on the right, matching Blueprint's RadioCard
 * which uses ControlCard's `Alignment.END` default).
 *
 * When checked (and `showAsSelectedWhenChecked=true`), renders the Card with a primary
 * selection ring (`shadow-card-selected`).
 *
 * @see https://blueprintjs.com/docs/#core/components/control-card.radio-card
 */
export const RadioCard = forwardRef<HTMLDivElement, RadioCardProps>(
    function RadioCard(
        {
            label,
            disabled = false,
            showAsSelectedWhenChecked = true,
            checked: checkedProp,
            defaultChecked,
            onChange,
            alignIndicator = "right",
            elevation = 0,
            selected,
            compact = false,
            className,
            controlClassName,
            cardProps,
            value,
            name,
            large,
            radioProps,
            ...divProps
        },
        ref,
    ) {
        const { checked, onChange: handleChange } = useCheckedControl({
            checked: checkedProp,
            defaultChecked,
            onChange,
        });

        const isSelected = selected ?? (showAsSelectedWhenChecked && checked);
        const controlClass = buildControlClassName(alignIndicator, compact);

        return (
            <Card
                ref={ref}
                elevation={elevation}
                interactive={!disabled}
                selected={isSelected}
                compact={false}
                className={cn("p-0 min-h-0", className)}
                {...cardProps}
                {...divProps}
            >
                <Radio
                    label={label}
                    checked={checked}
                    disabled={disabled}
                    onChange={handleChange}
                    alignIndicator={alignIndicator}
                    value={value}
                    name={name}
                    large={large}
                    className={cn(controlClass, controlClassName)}
                    indicatorProps={{ className: INDICATOR_RESET_CLASS } as React.HTMLAttributes<HTMLSpanElement>}
                    {...radioProps}
                />
            </Card>
        );
    },
);

// ─── SwitchCard ───────────────────────────────────────────────────────────────

export interface SwitchCardProps extends ControlCardBaseProps {
    /** Inner label shown inside the switch track when unchecked. */
    innerLabel?: React.ReactNode;
    /** Inner label shown inside the switch track when checked. */
    innerLabelChecked?: React.ReactNode;
    /** Large variant (20px track). */
    large?: boolean;
    /** Additional SwitchProps to pass to the inner Switch. */
    switchProps?: Omit<SwitchProps, "checked" | "defaultChecked" | "disabled" | "label" | "onChange" | "alignIndicator" | "className" | "indicatorProps" | "innerLabel" | "innerLabelChecked">;
}

/**
 * A Card with an embedded Switch that spans the full card surface.
 *
 * Alignment default: "right" (indicator on the right, matching Blueprint's SwitchCard
 * which uses ControlCard's `Alignment.END` default).
 *
 * When checked (and `showAsSelectedWhenChecked=true`), renders the Card with a primary
 * selection ring (`shadow-card-selected`).
 *
 * @see https://blueprintjs.com/docs/#core/components/control-card.switch-card
 */
export const SwitchCard = forwardRef<HTMLDivElement, SwitchCardProps>(
    function SwitchCard(
        {
            label,
            disabled = false,
            showAsSelectedWhenChecked = true,
            checked: checkedProp,
            defaultChecked,
            onChange,
            alignIndicator = "right",
            elevation = 0,
            selected,
            compact = false,
            className,
            controlClassName,
            cardProps,
            innerLabel,
            innerLabelChecked,
            large,
            switchProps,
            ...divProps
        },
        ref,
    ) {
        const { checked, onChange: handleChange } = useCheckedControl({
            checked: checkedProp,
            defaultChecked,
            onChange,
        });

        const isSelected = selected ?? (showAsSelectedWhenChecked && checked);
        const controlClass = buildControlClassName(alignIndicator, compact);

        return (
            <Card
                ref={ref}
                elevation={elevation}
                interactive={!disabled}
                selected={isSelected}
                compact={false}
                className={cn("p-0 min-h-0", className)}
                {...cardProps}
                {...divProps}
            >
                <Switch
                    label={label}
                    checked={checked}
                    disabled={disabled}
                    onChange={handleChange}
                    alignIndicator={alignIndicator}
                    innerLabel={innerLabel}
                    innerLabelChecked={innerLabelChecked}
                    large={large}
                    className={cn(controlClass, controlClassName)}
                    indicatorProps={{ className: SWITCH_INDICATOR_RESET_CLASS } as React.HTMLAttributes<HTMLSpanElement>}
                    {...switchProps}
                />
            </Card>
        );
    },
);
