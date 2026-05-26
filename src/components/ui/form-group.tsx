/**
 * Label + FormGroup — pixel-faithful Blueprint v6.15 reimplementation.
 *
 * Blueprint spec (from _label.scss, _form-group.scss):
 *
 * Label (standalone, label.bp6-label):
 *   - display: block
 *   - margin-bottom: 16px (= $pt-spacing * 4 = 4px * 4)
 *   - margin-top: 0
 *   - color: heading color (= foreground in both themes)
 *   - disabled → foreground-disabled color for label and muted child
 *   - Optional `info` slot: a <span> with text-muted color, font-weight 400, margin-left 4px
 *     (Blueprint renders this as .bp6-text-muted inside the label element)
 *
 * FormGroup (div.bp6-form-group):
 *   - display: flex; flex-direction: column; margin: 0 0 16px
 *   - label inside form-group: margin-bottom: 4px (overrides standalone 16px)
 *   - .bp6-form-group-sub-label: color muted; font-size small (12px); margin-bottom: 4px
 *   - .bp6-form-content wrapper: contains children + helper text
 *   - .bp6-form-helper-text: color muted; font-size small (12px); margin-top: 4px
 *   - intent → helper text colored with intent text (light: blue2/green2/orange2/red2;
 *                                                    dark: blue5/green5/orange5/red5)
 *   - inline → flex-direction: row; label line-height: 30px; label margin: 0 12px 0 0
 *              large: label line-height: 40px, margin: 0 12px 0 0
 *   - fill → width: 100%
 *   - disabled → all text elements forced to disabled color
 *
 * KEY MARGIN NOTE:
 *   - Standalone Label: margin-bottom 16px
 *   - Label inside FormGroup: margin-bottom 4px (FormGroup overrides with smaller gap)
 *   - FormGroup uses a separate internal label element; Label component is for standalone use.
 *
 * INTENT TEXT COLORS (from $pt-intent-text-colors / $pt-dark-intent-text-colors):
 *   Light:  primary=#215db0 (blue2), success=#1c6e42 (green2), warning=#935610 (orange2), danger=#ac2f33 (red2)
 *   Dark:   primary=#8abbff (blue5), success=#72ca9b (green5), warning=#fbb360 (orange5), danger=#fa999c (red5)
 *   These match --intent-*-text CSS vars already defined in tokens.css.
 *
 * NOTE on sub-label intent: Blueprint's _form-group.scss ONLY applies intent color to
 * .bp6-form-helper-text, NOT to .bp6-form-group-sub-label. Sub-label is always muted.
 *
 * @see https://blueprintjs.com/docs/#core/components/label
 * @see https://blueprintjs.com/docs/#core/components/form-group
 */

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export type FormGroupIntent = "none" | "primary" | "success" | "warning" | "danger";

// ─── Label ──────────────────────────────────────────────────────────────────

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
    /** Secondary/muted text rendered after the label text (Blueprint: .bp6-text-muted span). */
    info?: React.ReactNode;
    /** Disables the label — forces disabled text color on label and info span. */
    disabled?: boolean;
}

/**
 * Standalone Label component (maps to `label.bp6-label`).
 *
 * Use this when you want a styled label attached directly to a form control.
 * When used inside FormGroup, use FormGroup's `label` prop instead — the
 * FormGroup renders its own internal label element with a smaller margin-bottom (4px vs 16px).
 *
 * Quick reference:
 *   <Label htmlFor="my-input">Name</Label>
 *   <Label htmlFor="my-input" info="(optional)">Email</Label>
 *   <Label disabled>Disabled label</Label>
 */
export const Label = forwardRef<HTMLLabelElement, LabelProps>(function Label(
    { info, disabled, className, children, ...htmlProps },
    ref,
) {
    return (
        <label
            ref={ref}
            {...htmlProps}
            className={cn(
                // Display + margins: Blueprint label.bp6-label
                "block mt-0 mb-[16px]",
                // Color: Blueprint uses $pt-heading-color = $pt-text-color = dark-gray-1 light / light-gray-5 dark
                // In analyst: text-foreground covers this. Dark: same via CSS var.
                "text-foreground",
                // Disabled: forced to disabled text color
                disabled && "text-foreground-disabled",
                className,
            )}
        >
            {children}
            {info != null && (
                // Blueprint: {label} <span className="bp6-text-muted">{labelInfo}</span>
                // There is a space before the span, no explicit margin — we match this exactly.
                // font-weight 400 is the normal weight (Blueprint doesn't override in the span;
                // it inherits from the label which is already 400).
                <span
                    className={cn(
                        // No margin-left — Blueprint uses a preceding space character, not CSS margin.
                        "font-normal",
                        disabled ? "text-foreground-disabled" : "text-foreground-muted",
                    )}
                >
                    {" "}{info}
                </span>
            )}
        </label>
    );
});

Label.displayName = "Label";

// ─── FormGroup ──────────────────────────────────────────────────────────────

export interface FormGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
    /** Form control(s) to render inside the form group. */
    children?: React.ReactNode;

    /**
     * A space-delimited list of class names to pass along to the form-content wrapper div.
     */
    contentClassName?: string;

    /** Whether form group should appear as non-interactive. Remember to disable child inputs separately. */
    disabled?: boolean;

    /** Whether the component should take up the full width of its container. */
    fill?: boolean;

    /**
     * Optional helper text displayed beneath the form content.
     * Color is determined by `intent` (muted when intent=none).
     */
    helperText?: React.ReactNode;

    /** Whether to render the label and children on a single line. */
    inline?: boolean;

    /**
     * Visual intent applied to helper text color.
     * Child form elements need their own intents applied separately.
     */
    intent?: FormGroupIntent;

    /** Label for this form group. Rendered as a `<label>` element. */
    label?: React.ReactNode;

    /** `id` attribute of the labelable form element, used as `<label htmlFor>`. */
    labelFor?: string;

    /** Optional secondary text rendered after the label (muted). */
    labelInfo?: React.ReactNode;

    /** Whether to use large sizing (label line-height = 40px in inline mode). */
    large?: boolean;

    /**
     * Optional secondary text rendered below the label and above the form content.
     * Always muted color (intent does NOT affect sub-label per Blueprint spec).
     */
    subLabel?: React.ReactNode;
}

/**
 * FormGroup component — wraps form controls with a label, optional sub-label,
 * and optional helper text with intent support.
 *
 * Quick reference:
 *   <FormGroup label="Name" labelFor="name-input" helperText="Required">
 *     <InputGroup id="name-input" placeholder="Enter name" />
 *   </FormGroup>
 *
 *   <FormGroup label="Email" intent="danger" helperText="Invalid email address">
 *     <InputGroup intent="danger" />
 *   </FormGroup>
 *
 *   <FormGroup label="Username" inline>
 *     <InputGroup />
 *   </FormGroup>
 */
export const FormGroup = forwardRef<HTMLDivElement, FormGroupProps>(function FormGroup(
    {
        children,
        className,
        contentClassName,
        disabled,
        fill,
        helperText,
        inline,
        intent = "none",
        label,
        labelFor,
        labelInfo,
        large,
        subLabel,
        ...htmlProps
    },
    ref,
) {
    // Intent text color for helper text.
    // Light:  primary=blue2, success=green2, warning=orange2, danger=red2
    //         ($pt-intent-text-colors from _mixins.scss)
    // Dark:   primary=blue5, success=green5, warning=orange5, danger=red5
    //         ($pt-dark-intent-text-colors from _mixins.scss)
    //
    // IMPORTANT: Use palette tier utilities (text-blue-2 dark:text-blue-5) NOT the
    // --intent-*-text tokens. The tokens use color-mix() in dark mode which resolves
    // to slightly different values than Blueprint's raw $red5/$blue5 etc.
    // This matches the decision made for Callout (see handoff 0011).
    const intentHelperClass =
        intent === "none"
            ? // No intent: muted (gray-1 light / gray-4 dark)
              "text-foreground-muted"
            : intent === "primary"
              ? "text-blue-2 dark:text-blue-5"
              : intent === "success"
                ? "text-green-2 dark:text-green-5"
                : intent === "warning"
                  ? "text-orange-2 dark:text-orange-5"
                  : "text-red-2 dark:text-red-5";

    return (
        <div
            ref={ref}
            {...htmlProps}
            className={cn(
                // Blueprint: .bp6-form-group
                // display: flex; flex-direction: column; margin: 0 0 16px
                "flex flex-col",
                "mb-[16px]",
                // fill: width 100%
                fill && "w-full",
                // inline: flex-direction row + align-items flex-start
                inline && "flex-row items-start",
                className,
            )}
        >
            {/* Label: margin-bottom 4px when inside a form group (not the standalone 16px) */}
            {label != null && (
                <label
                    htmlFor={labelFor}
                    className={cn(
                        // Inside form-group: margin-bottom 4px (Blueprint override)
                        "block mb-[4px]",
                        // Color: heading color = foreground in both themes
                        "text-foreground",
                        // Inline layout: label on same line as content
                        // line-height = input height (30px standard, 40px large)
                        // margin: 0 12px (=$pt-spacing*3) 0 0
                        inline && !large && "leading-[30px] mb-0 mr-[12px]",
                        inline && large && "leading-[40px] mb-0 mr-[12px]",
                        // Disabled: forced disabled color (Blueprint: !important)
                        disabled && "text-foreground-disabled",
                    )}
                >
                    {label}
                    {labelInfo != null && (
                        // Blueprint: space + <span className="bp6-text-muted">. No margin.
                        <span
                            className={cn(
                                "font-normal",
                                disabled ? "text-foreground-disabled" : "text-foreground-muted",
                            )}
                        >
                            {" "}{labelInfo}
                        </span>
                    )}
                </label>
            )}

            {/* Sub-label: muted, small font, margin-bottom 4px. Always muted (no intent). */}
            {subLabel != null && (
                <div
                    className={cn(
                        // Blueprint: .bp6-form-group-sub-label
                        // color: muted; font-size: small (12px); margin-bottom: 4px
                        // "fg-inner-sublabel" is a stable hook for the comparison harness querySelector.
                        "fg-inner-sublabel",
                        "mb-[4px]",
                        "text-[12px]",
                        // Disabled: forced disabled color; otherwise muted
                        disabled ? "text-foreground-disabled" : "text-foreground-muted",
                    )}
                >
                    {subLabel}
                </div>
            )}

            {/* Form content: wraps children + helper text. Blueprint: .bp6-form-content.
                No extra margin-top needed here — Blueprint sets it on .bp6-control but
                we don't wrap controls. The inline layout just flows flex children. */}
            <div className={cn("flex flex-col", contentClassName)}>
                {children}

                {/* Helper text: muted or intent-colored, small font, margin-top 4px */}
                {helperText != null && (
                    <div
                        className={cn(
                            // Blueprint: .bp6-form-helper-text
                            // margin-top: 4px; font-size: small (12px); color: muted or intent
                            // "fg-inner-helper" is a stable hook for the comparison harness querySelector.
                            "fg-inner-helper",
                            "mt-[4px]",
                            "text-[12px]",
                            // min-w-0: Blueprint flex children compute min-width: 0px (not auto).
                            "min-w-0",
                            // Disabled: forced disabled color overrides intent (Blueprint: !important)
                            disabled ? "text-foreground-disabled" : intentHelperClass,
                        )}
                    >
                        {helperText}
                    </div>
                )}
            </div>
        </div>
    );
});

FormGroup.displayName = "FormGroup";
