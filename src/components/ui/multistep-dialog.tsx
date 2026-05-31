/**
 * MultistepDialog + DialogStep — pixel-faithful Blueprint v6.15 reimplementation,
 * built on the owned `Dialog` (Radix) so it inherits the portal + dark-mode wrapper,
 * focus trap, Escape, and scroll-lock for free.
 *
 * ## Shape
 * A wizard with a left **step rail** (numbered circles + titles, with completed /
 * active / upcoming states) and a right **content area** that renders the active
 * step's `panel`, plus a footer with **Back** / **Next** navigation that becomes a
 * **final/submit** button on the last step.
 *
 * ## API (modern, not drop-in)
 * - Open state uses the Radix-idiomatic `open` / `defaultOpen` / `onOpenChange`
 *   (inherited from `Dialog`), NOT Blueprint's `isOpen` / `onClose`.
 * - Steps are declared as `<DialogStep id title panel />` children (Blueprint-style);
 *   `DialogStep` renders nothing itself — `MultistepDialog` reads the children.
 * - Step navigation is uncontrolled (`initialStepIndex`, internal state) with an
 *   `onChange(newStepId, prevStepId, event)` notification matching Blueprint's signature.
 * - Footer buttons are customizable via `backButtonProps` / `nextButtonProps` /
 *   `finalButtonProps` (full `Button` props; `children` sets the label), with optional
 *   per-step overrides on `DialogStep`.
 *
 * ## Accessibility
 * - The rail mirrors Blueprint's structure: a `<div role="tablist" aria-label="steps">`
 *   whose steps are `<div role="tab">` carrying `aria-selected` (+ `aria-current="step"`
 *   on the active step). Each step wraps a real `<button>` — an a11y improvement over
 *   Blueprint's `<div role="button">` (native focus + disabled semantics).
 * - Only visited steps (index ≤ the furthest reached) are interactive — upcoming steps
 *   render a `disabled` button, so a user can jump back but not skip ahead.
 *
 * ## Blueprint metrics (from _multistep-dialog.scss / _dialog-step.scss)
 * - Wider panel than a plain Dialog; left nav rail with a subtle right divider.
 * - Step circle: 16px, bordered; active circle filled with the primary intent;
 *   completed steps tinted; titles use the standard text color.
 */

import { Children, isValidElement, useState } from "react";
import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "./button";
import { Dialog, DialogFooter, type DialogProps } from "./dialog";

// ─── Footer button props ──────────────────────────────────────────────────────
// Full `Button` props — set the label via `children` (our Button's convention).
export type StepButtonProps = ButtonProps;

// ─── DialogStep ─────────────────────────────────────────────────────────────

export interface DialogStepProps {
    /** Unique identifier for this step (reported by `onChange`). */
    id: string;
    /** Title shown in the step rail. */
    title?: React.ReactNode;
    /** Content rendered in the dialog body when this step is active. */
    panel?: React.ReactNode;
    /** Per-step override for the Next button. */
    nextButtonProps?: StepButtonProps;
    /** Per-step override for the Back button. */
    backButtonProps?: StepButtonProps;
}

/**
 * Declarative step descriptor for `MultistepDialog`. Renders nothing on its own —
 * `MultistepDialog` reads these children to build the wizard.
 */
export function DialogStep(_props: DialogStepProps) {
    return null;
}
DialogStep.displayName = "DialogStep";

// ─── MultistepDialog ──────────────────────────────────────────────────────────

export interface MultistepDialogProps
    extends Omit<DialogProps, "children"> {
    /** `<DialogStep>` children describing each step. */
    children?: React.ReactNode;
    /** Initial active step index (uncontrolled). @default 0 */
    initialStepIndex?: number;
    /** Fired when the active step changes: `(newStepId, prevStepId, event)`. */
    onChange?: (newStepId: string, prevStepId: string, event: React.MouseEvent) => void;
    /** Props for the Back button (a `text` field sets the label). */
    backButtonProps?: StepButtonProps;
    /** Props for the Next button. */
    nextButtonProps?: StepButtonProps;
    /** Props for the final/submit button shown on the last step. */
    finalButtonProps?: StepButtonProps;
}

function readSteps(children: React.ReactNode): DialogStepProps[] {
    return Children.toArray(children)
        .filter(isValidElement)
        .filter((child) => (child.type as { displayName?: string })?.displayName === "DialogStep")
        .map((child) => (child as React.ReactElement<DialogStepProps>).props);
}

/**
 * A multi-step wizard dialog. See file header for the API.
 */
export function MultistepDialog({
    children,
    initialStepIndex = 0,
    onChange,
    backButtonProps,
    nextButtonProps,
    finalButtonProps,
    className,
    ...dialogProps
}: MultistepDialogProps) {
    const steps = readSteps(children);
    const lastIndex = Math.max(0, steps.length - 1);
    const clamp = (i: number) => Math.min(Math.max(i, 0), lastIndex);

    const [current, setCurrent] = useState(() => clamp(initialStepIndex));
    // Furthest step reached — only steps up to here are navigable (no skipping ahead).
    const [maxVisited, setMaxVisited] = useState(() => clamp(initialStepIndex));

    const goTo = (target: number, event: React.MouseEvent) => {
        const next = clamp(target);
        if (next === current || steps.length === 0) return;
        const prevId = steps[current]?.id ?? "";
        const nextId = steps[next]?.id ?? "";
        setCurrent(next);
        setMaxVisited((m) => Math.max(m, next));
        onChange?.(nextId, prevId, event);
    };

    const activeStep = steps[current];
    const isLast = current === lastIndex;

    // Merge top-level footer button props with any per-step overrides.
    const { children: backLabel, ...backRest } = { ...backButtonProps, ...activeStep?.backButtonProps };
    const { children: nextLabel, ...nextRest } = { ...nextButtonProps, ...activeStep?.nextButtonProps };
    const { children: finalLabel, ...finalRest } = finalButtonProps ?? {};

    return (
        <Dialog
            {...dialogProps}
            // Blueprint multistep dialog: min-width 800px (vs a plain Dialog's 500px).
            className={cn("!w-[800px] !min-w-[800px]", className)}
        >
            {/* Panels row: left step rail (flex 1) + right content panel (flex 3). */}
            <div data-compare="multistep-panels" className="flex min-h-0 flex-1">
                {/* ── Step rail ─────────────────────────────────────────────── */}
                <div
                    role="tablist"
                    aria-label="steps"
                    data-compare="multistep-rail"
                    className={cn(
                        "flex flex-1 flex-col",
                        // Dark rail backdrop + bottom-left rounding to follow the dialog radius.
                        "dark:rounded-bl-bp dark:border-b dark:border-l dark:border-[rgba(255,255,255,0.2)] dark:bg-[#252a31]",
                    )}
                >
                    {steps.map((step, i) => {
                        const isActive = i === current;
                        const isViewed = i <= maxVisited; // viewed ⇒ navigable
                        return (
                            <div
                                key={step.id}
                                // Presentational container: carries the step bg + divider only.
                                // The interactive `role="tab"` lives on the inner <button> so we
                                // never nest two interactive controls (axe nested-interactive) —
                                // an a11y improvement over Blueprint's role=tab + role=button div.
                                role="presentation"
                                data-compare={isActive ? "multistep-step-active" : undefined}
                                className={cn(
                                    // Step container: bg keyed on viewed; divider between steps.
                                    "border-b border-[rgba(17,20,24,0.15)] dark:border-[rgba(255,255,255,0.2)]",
                                    isViewed
                                        ? "bg-white dark:bg-[#383e47]"
                                        : "bg-[#f6f7f9] dark:bg-[#2f343c]",
                                )}
                            >
                                {/* Inner step row (Blueprint `.dialog-step`): margin 4px, padding 6/14. */}
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={isActive}
                                    aria-current={isActive ? "step" : undefined}
                                    disabled={!isViewed}
                                    onClick={(e) => goTo(i, e)}
                                    className={cn(
                                        "m-1 flex w-[calc(100%-8px)] items-center rounded-bp bg-transparent px-[14px] py-[6px] text-left text-[14px]",
                                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d72d2]",
                                        "enabled:cursor-pointer enabled:hover:bg-[#f6f7f9] dark:enabled:hover:bg-[#2f343c]",
                                        "disabled:cursor-not-allowed",
                                    )}
                                >
                                    {/* Step icon: 24px circle, white number; color keyed on state. */}
                                    <span
                                        data-compare={isActive ? "multistep-circle-active" : undefined}
                                        className={cn(
                                            "flex h-6 w-6 flex-none items-center justify-center rounded-[50%] text-white",
                                            isActive
                                                ? "bg-[#2d72d2]"
                                                : isViewed
                                                  ? "bg-[#8f99a8]"
                                                  : "bg-[rgba(95,107,124,0.6)] dark:bg-[rgba(171,179,191,0.6)]",
                                        )}
                                    >
                                        {i + 1}
                                    </span>
                                    {/* Step title: blue when active, normal when viewed, muted upcoming. */}
                                    <span
                                        className={cn(
                                            "flex-1 truncate pl-2",
                                            isActive
                                                ? "text-[#2d72d2] dark:text-[#8abbff]"
                                                : isViewed
                                                  ? "text-foreground"
                                                  : "text-[rgba(95,107,124,0.6)] dark:text-[rgba(171,179,191,0.6)]",
                                        )}
                                    >
                                        {step.title}
                                    </span>
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* ── Right panel: active step content + footer ─────────────── */}
                <div
                    data-compare="multistep-panel"
                    className={cn(
                        "min-w-0 flex-[3] rounded-br-bp",
                        "bg-[#f6f7f9] dark:bg-[#2f343c]",
                        "border-l border-[rgba(17,20,24,0.15)] dark:border-b dark:border-r dark:border-[rgba(255,255,255,0.2)]",
                    )}
                >
                    {activeStep?.panel}
                    <DialogFooter
                        actions={
                            <>
                                {current > 0 && (
                                    <Button {...backRest} onClick={(e) => goTo(current - 1, e)}>
                                        {backLabel ?? "Back"}
                                    </Button>
                                )}
                                {isLast ? (
                                    <Button intent="primary" {...finalRest}>
                                        {finalLabel ?? "Submit"}
                                    </Button>
                                ) : (
                                    <Button
                                        intent="primary"
                                        {...nextRest}
                                        onClick={(e) => goTo(current + 1, e)}
                                    >
                                        {nextLabel ?? "Next"}
                                    </Button>
                                )}
                            </>
                        }
                    />
                </div>
            </div>
        </Dialog>
    );
}

MultistepDialog.displayName = "MultistepDialog";
