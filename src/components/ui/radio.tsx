/**
 * Radio + RadioGroup — pixel-faithful Blueprint v6.15 reimplementation.
 *
 * Blueprint spec (from _controls.scss + controls.tsx):
 *   - Radio = same Control structure as Checkbox:
 *       <label class="bp6-control bp6-radio"> + hidden <input type="radio">
 *       + <span class="bp6-control-indicator"> + label text.
 *   - Shared metrics (identical to Checkbox):
 *       indicator 16px default / 20px large; border-radius 50% (circle, vs Checkbox's 4px);
 *       unchecked: shadow inset 0 0 0 1px $gray2 (#738091 light / #8f99a8 dark);
 *       checked: bg primary (#2d72d2), shadow inset 0 0 0 1px rgba($black,.2);
 *       dark checked: shadow inset 0 0 0 1px rgba($white,.1);
 *       disabled muting: same as Checkbox.
 *   - Radio-specific checked glyph:
 *       `input:checked ~ .bp6-control-indicator::before` gets
 *       `background-image: radial-gradient($white, $white 28%, transparent 32%)`.
 *       We render a centered div with `background: radial-gradient(...)` inside the indicator.
 *   - NO indeterminate state for Radio.
 *
 * Control base reuse:
 *   Checkbox renders inline (for fine-grained control). Radio follows the same
 *   pattern — renders inline from this file, sharing the same structural logic
 *   and token values as Checkbox. ControlBase (control-base.tsx) is available
 *   but not required here since the structure is simple enough to render directly.
 *
 * ICON VISIBILITY STRATEGY (same as Checkbox):
 *   The center dot sits INSIDE the indicator span. `peer-*` Tailwind variants only work
 *   on SIBLINGS of the peer input, not descendants. To control dot visibility from the
 *   input's checked state, we track checked state in React (works for controlled + uncontrolled)
 *   and apply classes conditionally.
 *
 * RadioGroup:
 *   Wraps Radio items with a shared `name`, forwarding `selectedValue`/`onChange`/`disabled`
 *   to each child Radio. Supports either `options` array or `children` (Radio elements).
 */

import { Children, cloneElement, forwardRef, isValidElement, useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// ─── Radio ────────────────────────────────────────────────────────────────────

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
    /** Visible label rendered next to the indicator. */
    label?: React.ReactNode;
    /** Large variant: 20px indicator, 16px font. */
    large?: boolean;
    /** Renders inline-block instead of block. */
    inline?: boolean;
    /** Position the indicator on the right side. @default "left" */
    alignIndicator?: "left" | "right";
    /**
     * Additional props spread onto the indicator `<span>` element.
     * Use this to attach `data-compare` for the comparison harness:
     *   `indicatorProps={{ "data-compare": "radio-checked" }}`
     */
    indicatorProps?: React.HTMLAttributes<HTMLSpanElement>;
}

/**
 * Radio with Blueprint v6.15 visual fidelity.
 *
 * The ref is forwarded to the native `<input type="radio">`.
 */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
    { label, large, inline, alignIndicator = "left", disabled, className, onChange, indicatorProps, ...inputProps },
    ref,
) {
    // Track internal checked state to drive the center dot visibility.
    // For controlled mode, inputProps.checked drives the visual.
    const isControlled = inputProps.checked !== undefined;
    const [internalChecked, setInternalChecked] = useState<boolean>(
        () => !!(inputProps.checked ?? inputProps.defaultChecked),
    );
    // Effective checked state for rendering:
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

    const alignRight = alignIndicator === "right";

    return (
        <label
            className={cn(
                inline ? "inline-block" : "block",
                disabled ? "cursor-not-allowed" : "cursor-pointer",
                disabled ? "text-foreground-disabled" : "text-foreground",
                large ? "text-body-lg" : "text-body",
                // Leading padding: indicatorSize + 8px spacing
                // Default: 16 + 8 = 24px (pl-6); Large: 20 + 8 = 28px (pl-7)
                !alignRight && (large ? "pl-7" : "pl-6"),
                alignRight && (large ? "pr-7" : "pr-6"),
                "relative select-none",
                // `group` enables group-hover / group-active on the indicator (label is the hover target)
                "group",
                className,
            )}
        >
            {/* Native input: visually hidden but accessible.
                Blueprint: position absolute, opacity 0, z-index -1 (left/top 0). */}
            <input
                ref={ref}
                type="radio"
                disabled={disabled}
                onChange={handleChange}
                {...inputProps}
                className={cn(
                    "peer absolute opacity-0 -z-10 top-0",
                    alignRight ? "right-0" : "left-0",
                )}
            />

            {/* Indicator: the styled radio circle.
                Blueprint: border-radius: 50% (vs Checkbox's 4px).
                Same sizing, shadow, and color logic as Checkbox.
                Checked glyph: radial-gradient(white, white 28%, transparent 32%)
                rendered as a ::before pseudo-element. We use a centered div instead. */}
            <span
                data-checked={effectiveChecked ? "" : undefined}
                {...indicatorProps}
                className={cn(
                    "inline-block relative align-middle",
                    // Border radius: 50% = circle.
                    // IMPORTANT: Do NOT use rounded-full here — Tailwind v4 emits
                    // `border-radius: calc(infinity * 1px)` which computes to a huge pixel
                    // value. The harness compares computed strings, and Blueprint emits "50%".
                    // Using an arbitrary value that is literally "50%" matches the harness expectation.
                    "[border-radius:50%]",
                    // Size: explicit pixel widths/heights.
                    large ? "w-5 h-5" : "w-4 h-4",
                    // font-size = indicatorSize (Blueprint uses em-based sizing; we match the computed value
                    // so the harness captures the correct font-size on the indicator element).
                    large ? "text-[20px]" : "text-[16px]",
                    // color: Blueprint sets color: $white on the indicator when checked
                    // (for SVG fill inheritance via currentcolor). When disabled+checked, color is
                    // reduced to rgba($white, 0.6). Unchecked inherits body text.
                    effectiveChecked && !disabled ? "text-white" : "",
                    effectiveChecked && disabled ? "text-white/60" : "",
                    // Vertical offset (Blueprint: margin-top: -$pt-spacing * 0.75 = -3px for left-aligned)
                    !alignRight && "-mt-[3px]",
                    // Right-aligned: margin-top: 1px
                    alignRight && "mt-px float-right",
                    // Horizontal: negative margin-inline-start to pull indicator into the leading gap.
                    // Default: -(16+8) = -24px = -ml-6; Large: -(20+8) = -28px = -ml-7.
                    // margin-inline-end = 8px (= mr-2) separates indicator from label text.
                    !alignRight && (large ? "-ml-7 mr-2" : "-ml-6 mr-2"),
                    // Right-aligned: margin-left = 8px (= ml-2)
                    alignRight && "ml-2",
                    // Flex centering for dot child
                    "flex items-center justify-center",

                    // === UNCHECKED resting ===
                    // Background: transparent
                    "bg-transparent",
                    // box-shadow: inset 0 0 0 1px $gray2/#738091 (light), gray3/#8f99a8 (dark)
                    "shadow-[inset_0_0_0_1px_#738091] dark:shadow-[inset_0_0_0_1px_#8f99a8]",

                    // === HOVER (unchecked): group-hover drives from label ===
                    // $minimal-button-background-color-hover = rgba($gray3, 0.15) = rgba(143,153,168,0.15)
                    !disabled && !effectiveChecked && "group-hover:bg-[rgba(143,153,168,0.15)]",
                    // === ACTIVE (unchecked): rgba($gray3, 0.30) = rgba(143,153,168,0.30) ===
                    !disabled && !effectiveChecked && "group-active:bg-[rgba(143,153,168,0.30)]",

                    // === CHECKED ===
                    // Background: primary (blue-3 = #2d72d2)
                    effectiveChecked && "bg-primary",
                    // Shadow: inset 0 0 0 1px rgba($black, 0.2) — $black = #111418 = rgb(17,20,24)
                    // dark: rgba($white, 0.1)
                    effectiveChecked && "shadow-[inset_0_0_0_1px_rgba(17,20,24,0.2)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]",
                    // Hover (checked): blue-2 = #215db0; Active (checked): blue-1 = #184a90
                    effectiveChecked && !disabled && "group-hover:bg-primary-hover group-active:bg-primary-active",

                    // === DISABLED ===
                    // Unchecked disabled: bg = hover bg, no shadow (light AND dark — override dark shadow too)
                    disabled && !effectiveChecked && "bg-[rgba(143,153,168,0.15)] shadow-none dark:shadow-none cursor-not-allowed",
                    // Checked disabled: bg = rgba(blue-3, 0.5) = rgba(45,114,210,0.5), no shadow
                    disabled && effectiveChecked && "bg-[rgba(45,114,210,0.5)] shadow-none dark:shadow-none cursor-not-allowed",
                )}
            >
                {/* Center dot — shown when checked.
                    Blueprint: input:checked ~ .bp6-control-indicator::before {
                      background-image: radial-gradient($white, $white 28%, transparent 32%)
                    }
                    We approximate this with a div sized to fill the indicator.
                    The radial-gradient produces a center white dot occupying ~28% radius. */}
                <span
                    className={cn(
                        "absolute inset-0",
                        // Radial-gradient white dot centered in the circle
                        "bg-[radial-gradient(white,white_28%,transparent_32%)]",
                        // Visibility controlled by checked state
                        effectiveChecked ? "opacity-100" : "opacity-0",
                        // Disabled: dot opacity 0.5
                        disabled && effectiveChecked && "opacity-50",
                    )}
                    aria-hidden="true"
                />
            </span>

            {label}
        </label>
    );
});

// ─── RadioGroup ───────────────────────────────────────────────────────────────

export interface RadioGroupOption {
    /** The value passed to onChange when this radio is selected. */
    value: string;
    /** Label displayed next to the radio indicator. */
    label: React.ReactNode;
    /** Disables this individual option (overrides group disabled). */
    disabled?: boolean;
}

export interface RadioGroupProps {
    /**
     * The `name` attribute applied to all Radio inputs in the group.
     * Required for native radio mutual-exclusion to work.
     */
    name: string;
    /** The currently selected value (controlled). */
    selectedValue?: string;
    /** Called when the user selects a radio. */
    onChange?: (value: string, event: React.ChangeEvent<HTMLInputElement>) => void;
    /** Disables all radios in the group. Individual options may still override. */
    disabled?: boolean;
    /** Optional label displayed above the radio group. */
    label?: React.ReactNode;
    /**
     * Convenience prop: an array of `{value, label, disabled?}` items.
     * Renders a Radio for each. Ignored if `children` are provided.
     */
    options?: RadioGroupOption[];
    /**
     * `<Radio>` elements as children. `name`, `checked`, and `onChange` are
     * injected automatically — do not set them on child Radios.
     */
    children?: React.ReactNode;
    /** Extra class applied to the outer wrapper div. */
    className?: string;
    /** Renders radios inline (horizontal layout). */
    inline?: boolean;
}

/**
 * RadioGroup — manages a set of Radio buttons with shared name and selection state.
 *
 * Usage with `options` prop (convenience):
 *   <RadioGroup name="fruit" selectedValue={val} onChange={setVal} options={[
 *     { value: "apple", label: "Apple" },
 *     { value: "banana", label: "Banana" },
 *   ]} />
 *
 * Usage with children (full control):
 *   <RadioGroup name="fruit" selectedValue={val} onChange={setVal}>
 *     <Radio value="apple" label="Apple" />
 *     <Radio value="banana" label="Banana" />
 *   </RadioGroup>
 */
export function RadioGroup({
    name,
    selectedValue,
    onChange,
    disabled,
    label,
    options,
    children,
    className,
    inline,
}: RadioGroupProps) {
    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        onChange?.(e.target.value, e);
    }

    // Render from options array if provided, else use children
    const items =
        options != null
            ? options.map((opt) => (
                  <Radio
                      key={opt.value}
                      name={name}
                      value={opt.value}
                      label={opt.label}
                      checked={selectedValue !== undefined ? selectedValue === opt.value : undefined}
                      onChange={handleChange}
                      disabled={disabled || opt.disabled}
                      inline={inline}
                  />
              ))
            : Children.map(children, (child) => {
                  if (!isValidElement(child)) return child;
                  // Inject name, checked, onChange, disabled into Radio children.
                  const childProps = child.props as RadioProps;
                  const childValue = childProps.value as string | undefined;
                  return cloneElement(child as React.ReactElement<RadioProps>, {
                      name,
                      checked: selectedValue !== undefined && childValue !== undefined
                          ? selectedValue === childValue
                          : childProps.checked,
                      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                          handleChange(e);
                          childProps.onChange?.(e);
                      },
                      disabled: disabled || childProps.disabled,
                      inline: childProps.inline ?? inline,
                  });
              });

    return (
        <div className={cn("flex", inline ? "flex-row flex-wrap gap-5" : "flex-col", className)}>
            {label && (
                <label className="block text-body text-foreground mb-2 font-semibold">
                    {label}
                </label>
            )}
            {items}
        </div>
    );
}
