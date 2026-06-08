"use client";

/**
 * Switch — pixel-faithful Blueprint v6.15 reimplementation.
 *
 * Blueprint spec (from _controls.scss .bp6-switch section):
 *   - Same DOM structure as Checkbox and Radio:
 *       <label class="bp6-control bp6-switch"> (cursor-pointer, relative, padding-inline-start for gap)
 *         <input type="checkbox" /> (absolute, opacity 0, z-index -1)
 *         <span class="bp6-control-indicator" /> (the PILL TRACK)
 *         {label text}
 *   - Track (= .bp6-control-indicator):
 *       font-size: 16px standard / 20px large (em-based sizing)
 *       height: 1em = 16px / 20px
 *       min-width: 1.75em = 28px / 35px
 *       border-radius: 1.75em = 28px / 35px (pill shape)
 *       box-shadow: none !important (override default)
 *       transition: background-color
 *   - Knob (= .bp6-control-indicator::before):
 *       size: 1em - 2 * $switch-indicator-margin = 16px - 2*2px = 12px
 *       (large: 20px - 4px = 16px)
 *       border-radius: 50%
 *       background: white
 *       box-shadow: 0 0 0 1px rgba($black, 0.5) = 0 0 0 1px rgba(17,20,24,0.5)
 *       position: left = 2px (the margin), top: 50%, translateY(-50%)
 *       checked → left: calc(2px + 100% - 1em) = far right
 *       transition: left
 *   - Indicator position (padding for the track width):
 *       switch uses indicator-position(1.75 * 16px) = indicator-position(28px)
 *       padding = 28px + 8px = 36px (standard)
 *       large: indicator-position(1.75 * 20px) = indicator-position(35px)
 *       padding = 35px + 8px = 43px
 *   - Track colors:
 *       Unchecked: rgba($gray3, 0.3) = rgba(143,153,168,0.30)
 *       Unchecked hover: rgba($gray3, 0.4) = rgba(143,153,168,0.40)
 *       Unchecked active: rgba($gray3, 0.5) = rgba(143,153,168,0.50)
 *       Unchecked disabled: rgba($gray3, 0.15) = rgba(143,153,168,0.15)
 *       Checked: $control-checked-background-color = $blue3 = #2d72d2
 *       Checked hover: $blue2 = #215db0
 *       Checked active: $blue1 = #184a90
 *       Checked disabled: rgba($blue3, 0.5) = rgba(45,114,210,0.5)
 *   - Track text color (color property drives label + inner-text color):
 *       Unchecked: $pt-text-color (foreground)
 *       Checked: $white
 *       Disabled unchecked: $pt-text-color-disabled
 *       Disabled checked: rgba($white, 0.6)
 *   - Knob (::before) disabled colors:
 *       Disabled unchecked: background rgba($white, 0.8), box-shadow none
 *       Disabled checked: background rgba($white, 0.5), box-shadow none
 *   - Dark mode: same track colors (gray3-based / blue3-based), same knob colors.
 *       Dark disabled text: $pt-dark-text-color-disabled (for both checked and unchecked disabled)
 *
 * border-radius: LITERAL arbitrary value [border-radius:28px] / [border-radius:35px]
 * NOT rounded-full (Tailwind v4 emits calc(infinity*1px) = 33554432px, mismatches Blueprint's
 * computed value which is the literal px equivalent of 1.75em).
 *
 * KNOB STRATEGY:
 *   Blueprint's knob is a ::before pseudo-element on .bp6-control-indicator. We cannot
 *   use ::before on Tailwind spans without arbitrary CSS. We render the knob as a child
 *   <span> inside the track, absolutely positioned with left/top matching Blueprint's values.
 *   This is visually identical; the harness does not capture ::before styles.
 *
 * INNER LABELS (optional):
 *   Blueprint's switch supports innerLabel (shown when unchecked) and innerLabelChecked
 *   (shown when checked) inside the track, at font-size 0.7em, centered.
 *   Implemented via two absolutely-positioned spans inside the track that toggle visibility.
 *
 * ControlBase reuse:
 *   This file mirrors Checkbox/Radio's inline rendering (rather than delegating to
 *   ControlBase) for the same reason — fine-grained class control based on checked/disabled
 *   state. ControlBase is structurally identical; the indicator structure (pill + knob) is
 *   switch-specific so inlining is cleaner.
 *
 * ICON VISIBILITY STRATEGY:
 *   Same as Checkbox/Radio: track `peer-*` selectors can't reach descendants, so we track
 *   checked state in React and apply classes conditionally.
 */

import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
    /** Visible label rendered next to the track. */
    label?: React.ReactNode;
    /** Large variant: 20px font-size on the indicator (everything scales via em). */
    large?: boolean;
    /** Renders inline-block instead of block. */
    inline?: boolean;
    /** Position the indicator on the right side. @default "left" */
    alignIndicator?: "left" | "right";
    /**
     * Inner label shown inside the track when the switch is UNCHECKED.
     * Rendered at 0.7em inside the track on the right side of the knob.
     */
    innerLabel?: React.ReactNode;
    /**
     * Inner label shown inside the track when the switch is CHECKED.
     * Rendered at 0.7em inside the track on the left side of the knob.
     * Falls back to `innerLabel` if not provided.
     */
    innerLabelChecked?: React.ReactNode;
    /**
     * Additional props spread onto the track `<span>` element.
     * Use this to attach `data-compare` for the comparison harness:
     *   `indicatorProps={{ "data-compare": "switch-unchecked" }}`
     */
    indicatorProps?: React.HTMLAttributes<HTMLSpanElement>;
}

/**
 * Switch with Blueprint v6.15 visual fidelity.
 *
 * The ref is forwarded to the native `<input type="checkbox">`.
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
    {
        label,
        large,
        inline,
        alignIndicator = "left",
        disabled,
        className,
        onChange,
        innerLabel,
        innerLabelChecked,
        indicatorProps,
        ...inputProps
    },
    ref,
) {
    const innerRef = useRef<HTMLInputElement | null>(null);

    // Track internal checked state to drive track color + knob position.
    const isControlled = inputProps.checked !== undefined;
    const [internalChecked, setInternalChecked] = useState<boolean>(
        () => !!(inputProps.checked ?? inputProps.defaultChecked),
    );
    const effectiveChecked = isControlled ? !!(inputProps.checked) : internalChecked;

    // Sync controlled value changes.
    useEffect(() => {
        if (isControlled) {
            setInternalChecked(!!(inputProps.checked));
        }
    }, [inputProps.checked, isControlled]);

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (!isControlled) {
                setInternalChecked(e.target.checked);
            }
            onChange?.(e);
        },
        [isControlled, onChange],
    );

    // Merge forwarded ref with internal ref.
    function setRef(el: HTMLInputElement | null) {
        innerRef.current = el;
        if (typeof ref === "function") {
            ref(el);
        } else if (ref) {
            (ref as React.MutableRefObject<HTMLInputElement | null>).current = el;
        }
    }

    const alignRight = alignIndicator === "right";
    const hasInnerLabels = innerLabel != null || innerLabelChecked != null;

    return (
        <label
            className={cn(
                // Blueprint `.bp6-control`: block with margin-bottom 8px (= $pt-spacing*2),
                // so stacked controls breathe; inline → inline-block (group/consumer spacing).
                inline ? "inline-block" : "block mb-2",
                disabled ? "cursor-not-allowed" : "cursor-pointer",
                // Text color on the label itself (inherited by inner text if any)
                disabled
                    ? "text-foreground-disabled"
                    : "text-foreground",
                large ? "text-body-lg" : "text-body",
                // Leading padding accommodates the track width (1.75em) + 8px spacing.
                // Standard: 28px + 8px = 36px; Large: 35px + 8px = 43px.
                // These are Tailwind arbitrary values since there's no standard utility for 36/43px.
                !alignRight && (large ? "pl-[43px]" : "pl-[36px]"),
                alignRight && (large ? "pr-[43px]" : "pr-[36px]"),
                "relative select-none",
                // `group` enables group-hover / group-active on the indicator (label is the hover target)
                "group",
                className,
            )}
        >
            {/* Native input: visually hidden but accessible.
                Blueprint: position absolute, opacity 0, z-index -1 (left/top 0). */}
            <input
                ref={setRef}
                type="checkbox"
                disabled={disabled}
                onChange={handleChange}
                {...inputProps}
                className={cn(
                    "peer absolute opacity-0 -z-10 top-0",
                    alignRight ? "right-0" : "left-0",
                )}
            />

            {/* The pill TRACK (.bp6-control-indicator).
                Blueprint spec:
                  font-size: 16px (std) / 20px (large)   → em-based sizing of track
                  height: 1em = 16px / 20px
                  min-width: 1.75em = 28px / 35px
                  border-radius: 1.75em (28px std / 35px large)
                  box-shadow: none !important
                  transition: background-color

                Horizontal positioning:
                  margin-inline-start = -36px (std) / -43px (large) to pull into leading gap
                  margin-inline-end = 8px gap before label text
                  Right-aligned: float right, margin-left = 8px

                Vertical positioning:
                  margin-top = -3px (Blueprint: $pt-spacing * -0.75 = -3px) for left-aligned
                  margin-top = 1px for right-aligned

                BORDER-RADIUS: Using literal px values, NOT rounded-full.
                  Tailwind v4's rounded-full = calc(infinity * 1px) → Chrome computes to 33554432px.
                  Blueprint's border-radius: 1.75em at 16px = 28px, at 20px = 35px.
                  Use [border-radius:28px] / [border-radius:35px] so computed value matches Blueprint. */}
            <span
                {...indicatorProps}
                className={cn(
                    "inline-block relative align-middle",
                    // font-size drives em-based height/width and knob sizing
                    large ? "text-[20px]" : "text-[16px]",
                    // Height = 1em
                    large ? "h-5" : "h-4",
                    // min-width = 1.75em (28px std / 35px large)
                    large ? "min-w-[35px]" : "min-w-[28px]",
                    // border-radius = 1.75em as computed px (MUST be literal px, not rounded-full)
                    large ? "[border-radius:35px]" : "[border-radius:28px]",
                    // No box-shadow (Blueprint: box-shadow: none !important)
                    "shadow-none",
                    // transition: background-color
                    "transition-colors duration-[100ms] ease-mithril",
                    // Vertical offset: -3px left-aligned, 1px right-aligned
                    !alignRight && "-mt-[3px]",
                    alignRight && "mt-px float-right",
                    // Horizontal: negative margin pulls into leading padding gap
                    !alignRight && (large ? "-ml-[43px] mr-2" : "-ml-[36px] mr-2"),
                    alignRight && "ml-2",
                    // overflow-hidden so knob stays clipped inside pill
                    "overflow-hidden",

                    // === UNCHECKED colors ===
                    // background: rgba($gray3, 0.3) = rgba(143,153,168,0.30)
                    // color: $pt-text-color (inherit from label — text-foreground applied on label)
                    !effectiveChecked && !disabled && "bg-[rgba(143,153,168,0.30)]",
                    // hover: rgba($gray3, 0.4)
                    !effectiveChecked && !disabled && "group-hover:bg-[rgba(143,153,168,0.40)]",
                    // active: rgba($gray3, 0.5)
                    !effectiveChecked && !disabled && "group-active:bg-[rgba(143,153,168,0.50)]",
                    // disabled unchecked: rgba($gray3, 0.15)
                    !effectiveChecked && disabled && "bg-[rgba(143,153,168,0.15)]",

                    // === CHECKED colors ===
                    // background: $blue3 = #2d72d2
                    effectiveChecked && !disabled && "bg-primary",
                    // hover: $blue2 = #215db0
                    effectiveChecked && !disabled && "group-hover:bg-primary-hover",
                    // active: $blue1 = #184a90
                    effectiveChecked && !disabled && "group-active:bg-primary-active",
                    // disabled checked: primary @ 50%
                    effectiveChecked && disabled && "bg-primary/50",

                    // === Text color on the track (for inner labels) ===
                    // Unchecked: inherit foreground (set on label above)
                    // Checked (light + dark): white
                    effectiveChecked && !disabled && "text-white",
                    // Disabled checked:
                    //   Light: $switch-checked-text-color-disabled = rgba($white, 0.6)
                    //   Dark: $dark-switch-checked-text-color-disabled = $pt-dark-text-color-disabled
                    //         = rgba($gray4, 0.6) = rgba(171,179,191,0.6) = text-foreground-disabled
                    effectiveChecked && disabled && "text-white/60 dark:text-foreground-disabled",

                    indicatorProps?.className,
                )}
            >
                {/* KNOB — Blueprint's ::before circle that slides left↔right.
                    Size: $switch-indicator-size = 1em - 2 * $switch-indicator-margin
                       = 16px - 2*2px = 12px (std) / 20px - 4px = 16px (large)
                    Position: left = 2px (unchecked), left = calc(2px + 100% - 1em) (checked)
                    Blueprint's 1em here is the font-size of the indicator (16/20px).
                    background: $white
                    box-shadow: 0 0 0 1px rgba($black, 0.5) = 0 0 0 1px rgba(17,20,24,0.5)
                    Disabled unchecked: bg rgba($white, 0.8), shadow none
                    Disabled checked: bg rgba($white, 0.5), shadow none */}
                <span
                    aria-hidden="true"
                    className={cn(
                        "absolute top-1/2 -translate-y-1/2",
                        // Size: 12px standard / 16px large (= 1em - 4px at those font sizes)
                        large ? "w-4 h-4" : "w-3 h-3",
                        // Circle
                        "[border-radius:50%]",
                        // Transition: left
                        "transition-[left] duration-[100ms] ease-mithril",
                        // Position: left = 2px unchecked, right end checked
                        // checked: left = calc(2px + 100% - 1em) = calc(2px + 100% - 16px/20px)
                        !effectiveChecked && "left-[2px]",
                        effectiveChecked && (large ? "left-[calc(2px+100%-20px)]" : "left-[calc(2px+100%-16px)]"),
                        // Background and shadow
                        !disabled && "bg-white shadow-[0_0_0_1px_rgba(17,20,24,0.5)]",
                        // Disabled unchecked: bg rgba(white, 0.8), no shadow
                        disabled && !effectiveChecked && "bg-[rgba(255,255,255,0.8)] shadow-none",
                        // Disabled checked: bg rgba(white, 0.5), no shadow
                        disabled && effectiveChecked && "bg-[rgba(255,255,255,0.5)] shadow-none",
                    )}
                />

                {/* Inner labels (optional): shown inside the track.
                    Blueprint (_controls.scss): the two `.bp6-control-indicator-child` are
                    `display: block`, stacked vertically. The HIDDEN one collapses via
                    `line-height: 0` (height → 0) + `visibility: hidden`; the VISIBLE one gets
                    `line-height: 1em` (= the track height). So the track is shrink-to-fit on the
                    SINGLE widest child's margin-box (~49px std) — wide enough for "ON"/"OFF" and
                    stable across toggles. The old bug absolutely-positioned these, so they
                    contributed zero width and the track stayed at min-width, clipping the label.

                    The line-height (leading-4/5 = 16/20px) is set directly on the text element
                    so its line box equals the track height and the 0.7em text centers vertically;
                    the hidden child gets leading-[0px] to collapse to zero height. Margins are in
                    px (Blueprint's 0.5em/1.2em resolved at the 16/20px track font — outside toward
                    the track edge, inside toward the knob) so they don't get scaled by the 0.7em
                    text font:
                      std:   outside 8px,  inside 19.2px
                      large: outside 10px, inside 24px
                    First child (checked): outside-left, inside-right.
                    Last child  (unchecked): inside-left, outside-right. */}
                {hasInnerLabels && (
                    <>
                        {/* Checked child — block, above-the-knob when checked */}
                        <span
                            className={cn(
                                "mithril-switch-inner-text block text-center text-[0.7em]",
                                large ? "ml-[10px] mr-[24px]" : "ml-2 mr-[19.2px]",
                                effectiveChecked
                                    ? large ? "visible leading-5" : "visible leading-4"
                                    : "invisible leading-[0px]",
                            )}
                        >
                            {innerLabelChecked ?? innerLabel}
                        </span>
                        {/* Unchecked child — block, above-the-knob when unchecked */}
                        <span
                            className={cn(
                                "mithril-switch-inner-text block text-center text-[0.7em]",
                                large ? "ml-[24px] mr-[10px]" : "ml-[19.2px] mr-2",
                                !effectiveChecked
                                    ? large ? "visible leading-5" : "visible leading-4"
                                    : "invisible leading-[0px]",
                            )}
                        >
                            {innerLabel}
                        </span>
                    </>
                )}
            </span>

            {label}
        </label>
    );
});
