"use client";

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

import { Children, isValidElement, useEffect, useRef, useState } from "react";
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
    /**
     * Where the step navigation sits relative to the content.
     * - `"left"` (default): a vertical rail beside the content on tablet+, collapsing
     *   to a horizontal step strip above the content on narrow / mobile screens.
     * - `"top"`: a horizontal step strip above the content at every width.
     * @default "left"
     */
    navigationPosition?: "left" | "top";
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
    navigationPosition = "left",
    className,
    ...dialogProps
}: MultistepDialogProps) {
    // `"top"` forces the horizontal step strip at every width; `"left"` is the classic
    // vertical rail that only collapses to the strip on narrow / mobile screens.
    const horizontal = navigationPosition === "top";
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

    // Keep the active step visible when the rail scrolls — with many steps the rail/strip
    // overflows, so jumping or stepping to an off-screen step scrolls it back into view.
    const activeTabRef = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        activeTabRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
    }, [current]);

    // Merge top-level footer button props with any per-step overrides.
    const { children: backLabel, ...backRest } = { ...backButtonProps, ...activeStep?.backButtonProps };
    const { children: nextLabel, ...nextRest } = { ...nextButtonProps, ...activeStep?.nextButtonProps };
    const { children: finalLabel, ...finalRest } = finalButtonProps ?? {};

    return (
        <Dialog
            {...dialogProps}
            // Blueprint multistep dialog: 800px wide (vs a plain Dialog's 500px) on
            // tablet+ screens. On narrow / mobile viewports it falls back to full width
            // (capped to the viewport by the base Dialog's max-width) so it never
            // overflows horizontally — paired with the rail/panel stacking below. The
            // height cap + scrollable step content keep the footer nav reachable on
            // short screens.
            className={cn("w-full max-h-[calc(100dvh-4rem)] sm:!w-[800px]", className)}
        >
            {/* Panels: a horizontal step strip over the content (always, when
                navigationPosition="top"; on narrow screens otherwise); the classic
                left rail (flex 1) + right content panel (flex 3) on tablet+. */}
            <div
                data-compare="multistep-panels"
                className={cn("flex min-h-0 flex-1 flex-col", !horizontal && "sm:flex-row")}
            >
                {/* ── Step rail ─────────────────────────────────────────────── */}
                <div
                    data-compare="multistep-rail"
                    className={cn(
                        // Visual rail container. As a strip it sizes to its one row; as the
                        // vertical rail it's the positioning context (sm:relative) for the
                        // scroll area and contributes no intrinsic height — so the panel, not
                        // the step count, drives the dialog height.
                        "flex flex-none",
                        // Dark rail backdrop (border color shared; sides toggled below).
                        "dark:border-[rgba(255,255,255,0.2)] dark:bg-[#252a31]",
                        // "left": become the vertical rail on tablet+. The left + bottom
                        // borders and bottom-left rounding only apply to that rail; strip
                        // separation comes from the panel's top border instead.
                        !horizontal &&
                            "sm:relative sm:flex-1 sm:dark:rounded-bl-bp sm:dark:border-b sm:dark:border-l",
                    )}
                >
                    {/* Scroll area (also the tablist). Strip: scrolls horizontally. Vertical
                        rail: absolutely fills the container and scrolls vertically, so a long
                        list of steps scrolls within the dialog instead of stretching it. */}
                    <div
                        role="tablist"
                        aria-label="steps"
                        className={cn(
                            "flex w-full flex-row overflow-x-auto",
                            !horizontal &&
                                "sm:absolute sm:inset-0 sm:w-auto sm:flex-col sm:overflow-x-visible sm:overflow-y-auto",
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
                                    // Step container: bg keyed on viewed; divider between steps —
                                    // between columns on the strip (border-r), between rows on the
                                    // vertical rail (border-b). Never shrink the items: in either
                                    // orientation they keep their natural size and the rail scrolls.
                                    "shrink-0 border-r border-[rgba(17,20,24,0.15)] dark:border-[rgba(255,255,255,0.2)]",
                                    !horizontal && "sm:border-r-0 sm:border-b",
                                    isViewed
                                        ? "bg-white dark:bg-[#383e47]"
                                        : "bg-[#f6f7f9] dark:bg-[#2f343c]",
                                )}
                            >
                                {/* Inner step row (Blueprint `.dialog-step`): margin 4px, padding 6/14. */}
                                <button
                                    ref={isActive ? activeTabRef : undefined}
                                    type="button"
                                    role="tab"
                                    aria-selected={isActive}
                                    aria-current={isActive ? "step" : undefined}
                                    disabled={!isViewed}
                                    onClick={(e) => goTo(i, e)}
                                    className={cn(
                                        "m-1 flex w-auto items-center rounded-bp bg-transparent px-[14px] py-[6px] text-left text-[14px]",
                                        !horizontal && "sm:w-[calc(100%-8px)]",
                                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
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
                                                ? "bg-primary"
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
                                                ? "text-primary dark:text-intent-primary-text"
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
                </div>

                {/* ── Right panel: active step content + footer ─────────────── */}
                <div
                    data-compare="multistep-panel"
                    className={cn(
                        "flex min-h-0 min-w-0 flex-1 flex-col rounded-br-bp",
                        "bg-[#f6f7f9] dark:bg-[#2f343c]",
                        // Divider from the rail: a top border when the strip is stacked
                        // above, a left border beside the vertical rail (tablet+, "left").
                        "border-t border-[rgba(17,20,24,0.15)] dark:border-[rgba(255,255,255,0.2)]",
                        !horizontal && "sm:flex-[3] sm:border-t-0 sm:border-l",
                        "dark:border-b dark:border-r",
                    )}
                >
                    {/* Step content scrolls when it outgrows the (height-capped) dialog,
                        keeping the footer nav visible — essential on short/mobile screens.
                        The `sm` min-height gives the vertical rail a comfortable floor so a
                        short step's panel doesn't collapse the dialog (and the rail) too far. */}
                    <div className="min-h-0 flex-1 overflow-y-auto sm:min-h-[16rem]">{activeStep?.panel}</div>
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
