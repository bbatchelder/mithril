"use client";

/**
 * AIExplainability — a mithril-native marker for AI-generated / AI-assisted content.
 *
 * Inspired by IBM Carbon's "AI Label" (the marker formerly called the AI slug): a small chip that
 * flags AI involvement and, when interactive, reveals an "explainability" popover describing what the
 * AI did. mithril expresses the same concept in its own visual language — it reuses the Tag intent
 * system (solid / minimal × the five intents) so the marker stays coherent with the rest of the
 * system; the "AI-ness" comes from the `clean` sparkle glyph + the "AI" letters, not from a bespoke
 * gradient. Built on the existing `Popover`, so portal / dark-mode / escape handling is shared.
 *
 * ## Design decisions
 * ### API
 * - `intent` — "none" | "primary" | "success" | "warning" | "danger" (same as Tag). @default "primary"
 * - `variant` — "minimal" (translucent tint) | "solid" (filled). @default "minimal"
 * - `size` — "small" | "medium" | "large" (matches Button/Tag/Menu). @default "medium"
 * - `label` — chip text; the letters "AI" by default. Pass `null`/`false`/"" for an icon-only marker.
 * - `icon` — leading glyph; the `clean` sparkle by default. Pass `false` to hide.
 * - `popover` — explainability callout content. When set, the marker renders as a real `<button>`
 *   trigger wrapped in `Popover`; otherwise it's a non-interactive `<span>` (no tab stop).
 * - `popoverProps` — the placement controls live here: `side` ("top"|"right"|"bottom"|"left"),
 *   `align`, `sideOffset`, … are forwarded straight to `Popover`. (This is the established pattern —
 *   `Popover` already owns positioning via Radix.)
 * - `dark` — forwarded to the portaled `Popover` for dark-mode (same convention as Select/Suggest).
 * - `inline` — tighter baseline alignment for sitting inside running text / table cells.
 *
 * ### a11y
 * - Interactive markers are buttons; `Popover` wires `aria-haspopup`/`aria-expanded` via Radix.
 * - Icon-only markers still expose an accessible name ("AI" via visually-hidden text, or `ariaLabel`),
 *   so the control is never an unlabeled icon button.
 *
 * ### Token safety (Tailwind v4)
 * Intent colors reuse the same literal `bg-*` / `text-tag-*` utility classes as Tag — never a runtime
 * `var()` in inline `style`, which v4 tree-shakes.
 */

import { Fragment, forwardRef } from "react";

import { cn } from "@/lib/utils";
import type { Intent } from "@/lib/types";
import { resolveIcon, type IconProp } from "./icon";
import { arrowTopRight, clean, document as documentIcon, predictiveAnalysis, warningSign } from "./icons";
import { Popover, type PopoverProps } from "./popover";
import { Tag } from "./tag";
import { Link } from "./link";

export type AIExplainabilityIntent = Intent;
export type AIExplainabilityVariant = "minimal" | "solid";
export type AIExplainabilitySize = "small" | "medium" | "large";

// ── Intent colors (mirrors Tag) ──────────────────────────────────────────────
// Minimal: translucent intent-tinted bg + intent-colored text. Reuses the shared
// `--tag-minimal-*` tokens so the marker matches a minimal Tag exactly.
const MINIMAL: Record<AIExplainabilityIntent, string> = {
    none: "bg-tag-minimal-bg text-tag-minimal-none-text",
    primary: "bg-primary/10 dark:bg-primary/20 text-tag-minimal-primary-text",
    success: "bg-success/10 dark:bg-success/20 text-tag-minimal-success-text",
    warning: "bg-warning/10 dark:bg-warning/20 text-tag-minimal-warning-text",
    danger: "bg-danger/10 dark:bg-danger/20 text-tag-minimal-danger-text",
};
const MINIMAL_HOVER: Record<AIExplainabilityIntent, string> = {
    none: "hover:bg-interactive-active",
    primary: "hover:bg-primary/20 dark:hover:bg-primary/30",
    success: "hover:bg-success/20 dark:hover:bg-success/30",
    warning: "hover:bg-warning/20 dark:hover:bg-warning/30",
    danger: "hover:bg-danger/20 dark:hover:bg-danger/30",
};
// Solid: filled intent bg + intent-foreground text (warning uses the lifted token, as in Tag).
const SOLID: Record<AIExplainabilityIntent, string> = {
    none: "bg-gray-1 text-white",
    primary: "bg-primary text-primary-foreground",
    success: "bg-success text-success-foreground",
    warning: "bg-tag-solid-warning-bg text-tag-solid-warning-text",
    danger: "bg-danger text-danger-foreground",
};
const SOLID_HOVER: Record<AIExplainabilityIntent, string> = {
    none: "hover:bg-dark-gray-5",
    primary: "hover:bg-primary-hover",
    success: "hover:bg-success-hover",
    warning: "hover:bg-warning-disabled",
    danger: "hover:bg-danger-hover",
};

// Per-size geometry. Heights echo Tag (small≈20, large≈30) with a medium step between.
const SIZE: Record<AIExplainabilitySize, { box: string; text: string; icon: number }> = {
    small: { box: "h-5 px-1.5 gap-1", text: "text-body-sm leading-none", icon: 14 },
    medium: { box: "h-6 px-2 gap-1", text: "text-body-sm leading-none", icon: 16 },
    large: { box: "h-7.5 px-2.5 gap-1.5", text: "text-body leading-none", icon: 18 },
};

export interface AIExplainabilityProps
    extends Omit<React.HTMLAttributes<HTMLElement>, "color" | "popover"> {
    /** Visual intent / color scheme (same set as Tag). @default "primary" */
    intent?: AIExplainabilityIntent;
    /** "minimal" translucent tint or "solid" filled chip. @default "minimal" */
    variant?: AIExplainabilityVariant;
    /** Size of the marker. @default "medium" */
    size?: AIExplainabilitySize;
    /** Chip text. Defaults to the letters "AI". Pass null/false/"" for an icon-only marker. */
    label?: React.ReactNode;
    /** Leading glyph. Defaults to the `clean` sparkle. Pass `false` to hide. */
    icon?: IconProp;
    /**
     * Explainability callout content. When provided the marker becomes an interactive button that
     * opens a `Popover`; pair with {@link AIExplainabilityDetails} for the standard layout.
     */
    popover?: React.ReactNode;
    /**
     * Partial overrides for the underlying `Popover`. This is where placement lives —
     * `side` / `align` / `sideOffset` are forwarded to Radix.
     */
    popoverProps?: Partial<Omit<PopoverProps, "content" | "children" | "dark">>;
    /** Dark mode — forwarded to the portaled popover so it renders in the dark theme. @default false */
    dark?: boolean;
    /** Tighter baseline alignment for use inside running text. @default false */
    inline?: boolean;
    /** Accessible name. Defaults to "AI"; useful to override for an icon-only marker. */
    ariaLabel?: string;
}

// Inner chip markup shared by the interactive (button) and static (span) renderings.
// `Root` selects the element so the button can carry the Popover trigger ref/props.
const Chip = forwardRef<HTMLElement, AIExplainabilityProps & { interactive: boolean }>(function Chip(
    {
        className,
        intent = "primary",
        variant = "minimal",
        size = "medium",
        label = "AI",
        icon = clean,
        inline = false,
        interactive,
        ariaLabel,
        // strip non-DOM props
        popover: _popover,
        popoverProps: _popoverProps,
        dark: _dark,
        ...domProps
    },
    ref,
) {
    const geom = SIZE[size];
    const hasLabel = label != null && label !== false && label !== "";
    const colorClasses = variant === "solid" ? SOLID[intent] : MINIMAL[intent];
    const hoverClasses =
        interactive && (variant === "solid" ? SOLID_HOVER[intent] : MINIMAL_HOVER[intent]);

    const iconNode = resolveIcon(icon, { size: geom.icon, className: "!text-current shrink-0" });

    // The accessible name. Always contains "AI" so an icon-only marker is never unlabeled.
    const accessibleName = ariaLabel ?? (hasLabel ? undefined : "AI");

    const Root = interactive ? "button" : "span";

    return (
        <Root
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ref={ref as any}
            {...(interactive ? { type: "button" as const } : {})}
            aria-label={hasLabel ? ariaLabel : accessibleName}
            data-ai-explainability=""
            data-intent={intent}
            data-variant={variant}
            className={cn(
                "box-border inline-flex items-center justify-center rounded-mithril font-semibold tracking-wide",
                inline ? "align-[-0.15em]" : "align-middle",
                geom.box,
                geom.text,
                colorClasses,
                hoverClasses,
                interactive &&
                    "cursor-pointer outline-none transition-colors ease-mithril focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1",
                className,
            )}
            {...domProps}
        >
            {iconNode}
            {hasLabel && <span className="min-w-0 truncate">{label}</span>}
            {!hasLabel && accessibleName && <span className="sr-only">{accessibleName}</span>}
        </Root>
    );
});

/**
 * AIExplainability — see the module header. Renders a static marker, or (when `popover` is set) an interactive
 * button that opens an explainability `Popover`. Control placement via `popoverProps={{ side, align }}`.
 */
export const AIExplainability = forwardRef<HTMLElement, AIExplainabilityProps>(function AIExplainability(props, ref) {
    const { popover, popoverProps, dark = false } = props;

    if (popover == null) {
        return <Chip {...props} interactive={false} ref={ref} />;
    }

    return (
        <Popover
            content={popover}
            dark={dark}
            side={popoverProps?.side ?? "bottom"}
            align={popoverProps?.align ?? "center"}
            {...popoverProps}
        >
            <Chip {...props} interactive ref={ref} />
        </Popover>
    );
});

AIExplainability.displayName = "AIExplainability";

// ── Explainability / provenance callout ──────────────────────────────────────
//
// The popover answers "where did this content come from, and how much should I trust it?".
// Four parts, each surfacing its *source* rather than a bare assertion:
//   1. Provenance — the headline. A stack of coexisting states (authored / edited / verified /
//      grounded …), e.g. "AI-authored · human-edited · grounded · unverified".
//   2. Confidence — a coarse label PLUS how it was produced; the qualifier outranks the value.
//   3. Grounding — linked sources, or an explicit "No sources — generated without grounding."
//   4. Model + context — model name, timestamp, whether tools/retrieval were used.

/** How prominent / reassuring a provenance signal is. Drives its color. */
export type AIProvenanceTone = "neutral" | "info" | "positive" | "caution";

const TONE_TEXT: Record<AIProvenanceTone, string> = {
    neutral: "text-foreground",
    info: "text-tag-minimal-primary-text",
    positive: "text-tag-minimal-success-text",
    caution: "text-tag-minimal-warning-text",
};
const TONE_INTENT: Record<AIProvenanceTone, AIExplainabilityIntent> = {
    neutral: "none",
    info: "primary",
    positive: "success",
    caution: "warning",
};

/** One token in the stacked provenance headline. These coexist — render several. */
export interface AIProvenanceState {
    /** Short label, e.g. "AI-authored", "human-edited", "grounded", "unverified". */
    label: React.ReactNode;
    /** Tone → color. @default "neutral" */
    tone?: AIProvenanceTone;
    /** Optional leading glyph. */
    icon?: IconProp;
}

/** How a confidence value was produced — surfaced more prominently than the value itself. */
export type AIConfidenceMethod = "self-reported" | "logprob" | "llm-judge" | "human";

const CONFIDENCE_METHOD: Record<AIConfidenceMethod, string> = {
    "self-reported": "Self-reported by the model",
    logprob: "From token log-probabilities",
    "llm-judge": "Judged by an LLM",
    human: "Human-reviewed",
};

export interface AIConfidence {
    /** Coarse label, e.g. "High" / "Medium" / "Low" / "Unverified". */
    label: React.ReactNode;
    /** How it was produced. Rendered as the prominent line; the label is the quiet chip. */
    method: AIConfidenceMethod;
    /** Free-form qualifier, e.g. "claude-opus-4-8, against retrieved sources". */
    detail?: React.ReactNode;
    /** Tone for the value chip. @default "neutral" */
    tone?: AIProvenanceTone;
}

export interface AIGroundingSource {
    title: React.ReactNode;
    href?: string;
    /** Optional locator, e.g. "p. 12" or "rows 1–40". */
    meta?: React.ReactNode;
    /** Override the default document glyph. */
    icon?: IconProp;
}

export interface AIModelContext {
    /** Model name, e.g. "claude-opus-4-8". */
    model: React.ReactNode;
    /** Pre-formatted timestamp, e.g. "2h ago" or "2026-06-04 14:30". */
    at?: React.ReactNode;
    /** Whether tools / retrieval were used. */
    retrieval?: boolean;
    /** Explicit tool/context description; overrides the retrieval phrasing. */
    tools?: React.ReactNode;
}

export interface AIExplainabilityDetailsProps {
    /** The stacked provenance headline (states coexist). */
    states?: AIProvenanceState[];
    /** Optional one-line summary under the headline. */
    children?: React.ReactNode;
    /** Confidence with its source (the qualifier outranks the value). */
    confidence?: AIConfidence;
    /**
     * Grounding sources. Provide the prop (even as `[]`) to show the section: a non-empty list
     * renders linked sources; an empty list renders the explicit "No sources" state.
     */
    grounding?: AIGroundingSource[];
    /** Model + context footer. */
    model?: AIModelContext;
    /** Footer actions (e.g. a Regenerate button). */
    actions?: React.ReactNode;
    className?: string;
}

/** Eyebrow-labelled section used inside the provenance panel. */
function Field({
    label,
    aside,
    children,
}: {
    label: React.ReactNode;
    aside?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
                    {label}
                </span>
                {aside}
            </div>
            {children}
        </div>
    );
}

/**
 * Provenance / explainability callout for an {@link AIExplainability} popover. Surfaces where AI content came
 * from and how much to trust it: a stacked provenance headline, confidence (with its source), grounding
 * sources (or an explicit "no sources" state), and the model + context. Pass to `AIExplainability`'s `popover`
 * prop, or skip it and pass arbitrary content for full control.
 */
export function AIExplainabilityDetails({
    states,
    children,
    confidence,
    grounding,
    model,
    actions,
    className,
}: AIExplainabilityDetailsProps) {
    return (
        <div className={cn("flex w-80 flex-col gap-3", className)}>
            {/* 1. Provenance headline */}
            {states != null && states.length > 0 && (
                <div className="flex items-start gap-2">
                    {resolveIcon(clean, {
                        size: 16,
                        className: "mt-px !text-primary dark:!text-blue-5 shrink-0",
                    })}
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-body-sm font-medium leading-snug">
                        {states.map((s, i) => (
                            <Fragment key={i}>
                                {i > 0 && (
                                    <span aria-hidden className="text-foreground-muted/70">
                                        ·
                                    </span>
                                )}
                                <span className={cn("inline-flex items-center gap-1", TONE_TEXT[s.tone ?? "neutral"])}>
                                    {s.icon != null &&
                                        resolveIcon(s.icon, { size: 13, className: "!text-current shrink-0" })}
                                    {s.label}
                                </span>
                            </Fragment>
                        ))}
                    </div>
                </div>
            )}

            {children != null && <div className="text-body-sm text-foreground-muted">{children}</div>}

            {/* 2. Confidence — qualifier prominent, value quiet */}
            {confidence != null && (
                <Field
                    label="Confidence"
                    aside={
                        <Tag minimal round intent={TONE_INTENT[confidence.tone ?? "neutral"]}>
                            {confidence.label}
                        </Tag>
                    }
                >
                    <div className="text-body-sm font-medium text-foreground">
                        {CONFIDENCE_METHOD[confidence.method]}
                    </div>
                    {confidence.detail != null && (
                        <div className="text-body-sm text-foreground-muted">{confidence.detail}</div>
                    )}
                </Field>
            )}

            {/* 3. Grounding — sources, or an explicit no-sources state */}
            {grounding != null && (
                <Field label="Grounding">
                    {grounding.length > 0 ? (
                        <ul className="m-0 flex list-none flex-col gap-1 p-0">
                            {grounding.map((s, i) => (
                                <li key={i} className="flex items-center gap-1.5 text-body-sm">
                                    {resolveIcon(s.icon ?? documentIcon, {
                                        size: 14,
                                        className: "!text-foreground-muted shrink-0",
                                    })}
                                    {s.href != null ? (
                                        <Link
                                            href={s.href}
                                            color="primary"
                                            underline="hover"
                                            className="inline-flex items-center gap-1"
                                        >
                                            {s.title}
                                            {resolveIcon(arrowTopRight, { size: 12, className: "!text-current" })}
                                        </Link>
                                    ) : (
                                        <span className="text-foreground">{s.title}</span>
                                    )}
                                    {s.meta != null && (
                                        <span className="text-body-xs text-foreground-muted">{s.meta}</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="flex items-center gap-1.5 text-body-sm text-tag-minimal-warning-text">
                            {resolveIcon(warningSign, { size: 14, className: "!text-current shrink-0" })}
                            No sources — generated without grounding.
                        </div>
                    )}
                </Field>
            )}

            {/* 4. Model + context */}
            {model != null && (
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 rounded-mithril bg-tag-minimal-bg px-2.5 py-1.5 text-body-xs text-foreground-muted">
                    {resolveIcon(predictiveAnalysis, {
                        size: 14,
                        className: "!text-foreground-muted shrink-0",
                    })}
                    <span className="font-medium text-foreground">{model.model}</span>
                    {model.at != null && (
                        <>
                            <span aria-hidden>·</span>
                            <span>{model.at}</span>
                        </>
                    )}
                    {(model.tools != null || model.retrieval != null) && (
                        <>
                            <span aria-hidden>·</span>
                            <span>
                                {model.tools != null
                                    ? model.tools
                                    : model.retrieval
                                      ? "retrieval used"
                                      : "no tools used"}
                            </span>
                        </>
                    )}
                </div>
            )}

            {actions != null && (
                <div className="mt-0.5 flex items-center justify-end gap-2">{actions}</div>
            )}
        </div>
    );
}

AIExplainabilityDetails.displayName = "AIExplainabilityDetails";
