import { cva, type VariantProps } from "class-variance-authority";
import { createElement, forwardRef, useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Text component — pixel-faithful Blueprint typography tiers with a clean modern API.
 *
 * Variant → token mapping (mirrors Blueprint's computed values):
 *
 *   variant      font-size  line-height  weight  color
 *   ─────────────────────────────────────────────────────────────────────────
 *   body         14px       1.28581      400     foreground (dark-gray-1 / light-gray-5)
 *   large        16px       1.28581      400     foreground  (bp6-text-large)
 *   small        12px       1.28581      400     foreground  (bp6-text-small)
 *   muted        14px       1.28581      400     foreground-muted (gray-1 / gray-4)
 *   disabled     14px       1.28581      400     foreground-disabled (gray-1@60% / gray-4@60%)
 *   code         14px       1.28581      400     code-foreground (monospace font)
 *   h1           36px       40px         600     foreground (heading)
 *   h2           28px       32px         600     foreground (heading)
 *   h3           22px       25px         600     foreground (heading)
 *   h4           18px       21px         600     foreground (heading)
 *   h5           16px       19px         600     foreground (heading)
 *   h6           14px       16px         600     foreground (heading)
 *
 * Blueprint heading sizes come from `_typography.scss`'s $headings map (h1–h6).
 * These do NOT match the token-scale names (which are for the design-token system),
 * so they use explicit pixel values.
 *
 * foreground = dark-gray-1 (#1c2127) in light, light-gray-5 (#f6f7f9) in dark.
 * foreground-muted = gray-1 (#5f6b7c) in light, gray-4 (#abb3bf) in dark.
 * foreground-disabled = gray-1@60% in light, gray-4@60% in dark.
 * code-foreground = same as foreground-muted (gray-1 / gray-4).
 *
 * @see https://blueprintjs.com/docs/#core/components/text
 * @see https://blueprintjs.com/docs/#core/typography
 */
export const textVariants = cva(
    // Base: all text inherits the current foreground color by default.
    // `text-foreground` is set explicitly so dark-mode `.dark` scope resolves it
    // from the semantic var (not from :root). Same fix as Icon/Card.
    "text-foreground",
    {
        variants: {
            variant: {
                // ── body tiers ───────────────────────────────────────────────────
                /** Default Blueprint body text. 14px / 1.28581 / 400. */
                body: "text-[14px] leading-[1.28581] font-normal",
                /** Larger body text (bp6-text-large). 16px / 1.28581 / 400. */
                large: "text-[16px] leading-[1.28581] font-normal",
                /** Smaller body text (bp6-text-small). 12px / 1.28581 / 400. */
                small: "text-[12px] leading-[1.28581] font-normal",
                /** Muted / secondary text. Same size as body; gray color. */
                muted: "text-[14px] leading-[1.28581] font-normal text-foreground-muted",
                /** Disabled / incidental text. Not WCAG-compliant; use sparingly. */
                disabled: "text-[14px] leading-[1.28581] font-normal text-foreground-disabled",
                /**
                 * Monospace / code text (bp6-monospace-text). Uses mono font stack;
                 * does NOT change color — monospace-typography() sets font-family only.
                 * Color is inherited from parent context (foreground), same as Blueprint.
                 */
                code: "text-[14px] leading-[1.28581] font-normal font-mono",

                // ── heading tiers (Blueprint _typography.scss $headings map) ────
                // h1–h6 use font-weight 600 and Blueprint's specific sizes/line-heights.
                // These are headings in the Blueprint sense (not the token-scale names).
                h1: "text-[36px] leading-[40px] font-semibold",
                h2: "text-[28px] leading-[32px] font-semibold",
                h3: "text-[22px] leading-[25px] font-semibold",
                h4: "text-[18px] leading-[21px] font-semibold",
                h5: "text-[16px] leading-[19px] font-semibold",
                h6: "text-[14px] leading-[16px] font-semibold",
            },
        },
        defaultVariants: { variant: "body" },
    },
);

/**
 * Default HTML element for each variant. Headings render as their semantic element;
 * code renders as `<code>`; body tiers default to `<div>` matching Blueprint's
 * `tagName` default — callers can override with `as` or `tagName`.
 */
const DEFAULT_TAG: Record<NonNullable<TextVariantProps["variant"]>, keyof React.JSX.IntrinsicElements> = {
    body: "div",
    large: "div",
    small: "div",
    muted: "div",
    disabled: "div",
    code: "code",
    h1: "h1",
    h2: "h2",
    h3: "h3",
    h4: "h4",
    h5: "h5",
    h6: "h6",
};

type TextVariantProps = VariantProps<typeof textVariants>;

export interface TextProps
    extends Omit<React.HTMLAttributes<HTMLElement>, "title">,
        TextVariantProps {
    /**
     * Truncate content with an ellipsis when it overflows its container.
     * Also sets the native `title` attribute to the full text when content actually
     * overflows (mirrors Blueprint's `scrollWidth > clientWidth` measure).
     * @default false
     */
    ellipsize?: boolean;

    /**
     * Override the rendered HTML element. Defaults to the semantic element for the
     * variant (h1–h6 for headings, `p` for body tiers, `code` for code).
     */
    as?: keyof React.JSX.IntrinsicElements;

    /**
     * Alias for `as` (Blueprint API compat). `as` takes precedence if both are provided.
     * @default variant's semantic default
     */
    tagName?: keyof React.JSX.IntrinsicElements;

    /**
     * Explicit HTML title attribute. When `ellipsize` is true and content overflows,
     * the title is auto-populated with the text content (Blueprint's behavior).
     * Providing a value here overrides the auto-title.
     */
    title?: string;
}

/**
 * Polymorphic text component covering Blueprint's typography tiers.
 *
 * Quick reference:
 *   <Text>Default body text</Text>
 *   <Text variant="large">Larger body</Text>
 *   <Text variant="muted">Muted / secondary</Text>
 *   <Text variant="disabled">Disabled text</Text>
 *   <Text variant="code">Monospace</Text>
 *   <Text variant="h1">Heading 1</Text>  … <Text variant="h6">Heading 6</Text>
 *   <Text ellipsize style={{ width: 200 }}>Long text that truncates…</Text>
 */
export const Text = forwardRef<HTMLElement, TextProps>(function Text(
    {
        variant = "body",
        ellipsize = false,
        as,
        tagName,
        title,
        className,
        children,
        ...htmlProps
    },
    forwardedRef,
) {
    const tag = as ?? tagName ?? DEFAULT_TAG[variant ?? "body"];

    // Ellipsis overflow detection — mirrors Blueprint's useIsomorphicLayoutEffect approach.
    // We measure scrollWidth > clientWidth to decide whether to set title.
    const innerRef = useRef<HTMLElement | null>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const [textContent, setTextContent] = useState("");

    useLayoutEffect(() => {
        const el = innerRef.current;
        if (!el || !ellipsize) {
            setIsOverflowing(false);
            return;
        }
        setIsOverflowing(el.scrollWidth > el.clientWidth);
        setTextContent(el.textContent ?? "");
    }, [ellipsize, children]);

    // Computed title: explicit > auto-overflow > undefined
    const computedTitle = title ?? (isOverflowing ? textContent : undefined);

    return createElement(
        tag,
        {
            ...htmlProps,
            className: cn(
                textVariants({ variant }),
                // Ellipsis truncation classes (mirrors Blueprint's .bp6-text-overflow-ellipsis)
                ellipsize && "overflow-hidden text-ellipsis whitespace-nowrap",
                // Headings: Blueprint sets margin-bottom: 20px (5 × 4px = $pt-spacing*5).
                // We replicate the .bp6-heading margin: 0 0 ($pt-spacing * 3).
                // Note: Tailwind v4 preflight removes heading margins — add them back.
                (variant === "h1" ||
                    variant === "h2" ||
                    variant === "h3" ||
                    variant === "h4" ||
                    variant === "h5" ||
                    variant === "h6") &&
                    "mb-[12px]",
                className,
            ),
            ref: (node: HTMLElement | null) => {
                innerRef.current = node;
                if (typeof forwardedRef === "function") forwardedRef(node);
                else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLElement | null>).current = node;
            },
            title: computedTitle,
        },
        children,
    );
});
