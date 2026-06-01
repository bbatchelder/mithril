import { createElement, useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { ResizeSensor } from "./resize-sensor";

/**
 * `OverflowList` — render a horizontal list that collapses items into an overflow
 * renderer (e.g. a "+N" menu) when they don't fit the container width.
 *
 * A behavioral/layout helper. It renders all items, measures whether they fit via a
 * 1px flex spacer + `ResizeSensor`, then uses a binary search to settle on how many
 * fit — ported faithfully from Blueprint's `OverflowList`, re-expressed as a
 * function component with a modern string `collapseFrom` ("start" | "end") instead
 * of the `Boundary` enum.
 *
 * @see https://blueprintjs.com/docs/#core/components/overflow-list
 */

export type OverflowDirection = "start" | "end";

export interface OverflowListProps<T> {
    /**
     * All items. Items that don't fit are passed to `overflowRenderer` instead.
     * Pass a **stable** array reference — a new array each render forces a recompute.
     */
    items: readonly T[];
    /** Render a single visible item. Remember to set a `key`! */
    visibleItemRenderer: (item: T, index: number) => React.ReactNode;
    /**
     * Render the overflowed items, invoked once with everything that didn't fit.
     * Typically a dropdown menu or a "+N" label.
     */
    overflowRenderer: (overflowItems: T[]) => React.ReactNode;
    /**
     * Which end items collapse from — also where `overflowRenderer` is placed
     * (before the visible items for "start", after for "end").
     * @default "start"
     */
    collapseFrom?: OverflowDirection;
    /**
     * Minimum number of items that never collapse, regardless of width.
     * @default 0
     */
    minVisibleItems?: number;
    /**
     * Always call `overflowRenderer`, even with zero overflow. Useful when the
     * overflow contains a Popover you don't want to unmount as the list resizes.
     * @default false
     */
    alwaysRenderOverflow?: boolean;
    /**
     * Also observe ancestor elements for size changes. Enable only when a parent can
     * resize without resizing the list itself.
     * @default false
     */
    observeParents?: boolean;
    /**
     * Invoked once after the overflow settles (not on every intermediate frame), and
     * only when the set of overflowed items actually changed.
     */
    onOverflow?: (overflowItems: T[]) => void;
    /**
     * HTML tag for the container element.
     * @default "div"
     */
    tagName?: keyof React.JSX.IntrinsicElements;
    /** Class name for the container element. */
    className?: string;
    /** Inline styles for the container element. */
    style?: React.CSSProperties;
    /** Wrap the list in a `<nav>` element. @default false */
    navigable?: boolean;
    /** `aria-label` for the `<nav>` (only when `navigable`). @default "" */
    navigationAriaLabel?: string;
}

interface OverflowState<T> {
    visible: readonly T[];
    overflow: readonly T[];
    /** Binary-search step size for the current repartition cycle. */
    chopSize: number;
    lastChopSize: number | null;
    /** Whether a repartition is still settling (takes several frames). */
    repartitioning: boolean;
    /** Overflow count at the start of the cycle, to dedupe `onOverflow`. */
    lastOverflowCount: number;
}

const halve = (n: number) => Math.ceil(n / 2);

/**
 * Shift `num` elements between two adjacent arrays (positive: left→right).
 * Returns the new `[left, right]`.
 */
function shiftElements<T>(
    leftArray: readonly T[],
    rightArray: readonly T[],
    num: number,
): [readonly T[], readonly T[]] {
    const all = leftArray.concat(rightArray);
    const newLeftLength = leftArray.length - num;
    if (newLeftLength <= 0) return [[], all];
    if (newLeftLength >= all.length) return [all, []];
    const sliceIndex = all.length - newLeftLength;
    return [all.slice(0, -sliceIndex), all.slice(-sliceIndex)];
}

export function OverflowList<T>(props: OverflowListProps<T>) {
    const {
        items,
        visibleItemRenderer,
        overflowRenderer,
        collapseFrom = "start",
        minVisibleItems = 0,
        alwaysRenderOverflow = false,
        observeParents = false,
        onOverflow,
        tagName = "div",
        className,
        style,
        navigable = false,
        navigationAriaLabel = "",
    } = props;

    const defaultChopSize = () => halve(items.length);

    const [state, setState] = useState<OverflowState<T>>(() => ({
        visible: items,
        overflow: [],
        chopSize: halve(items.length),
        lastChopSize: null,
        repartitioning: false,
        lastOverflowCount: 0,
    }));

    const spacerRef = useRef<HTMLDivElement | null>(null);
    const onOverflowRef = useRef(onOverflow);
    onOverflowRef.current = onOverflow;

    // One binary-search step: measure the spacer and shrink/grow the visible set,
    // or finalize the cycle. Mirrors Blueprint's `repartition`.
    const repartition = () => {
        const spacer = spacerRef.current;
        if (spacer == null) return;
        setState((s) => {
            const partitionExhausted = s.lastChopSize === 1;
            // The spacer has flex-shrink and a 1px base width: if it's been squeezed
            // below ~1px, the list is too wide and must shrink.
            const shouldShrink = spacer.offsetWidth < 0.9 && s.visible.length > minVisibleItems;
            const shouldGrow =
                (spacer.offsetWidth >= 1 || s.visible.length < minVisibleItems) &&
                s.overflow.length > 0 &&
                !partitionExhausted;

            if (!shouldShrink && !shouldGrow) {
                // Repartition complete.
                return { ...s, chopSize: defaultChopSize(), lastChopSize: null, repartitioning: false };
            }

            let visible: readonly T[];
            let overflow: readonly T[];
            if (collapseFrom === "end") {
                [visible, overflow] = shiftElements(s.visible, s.overflow, s.chopSize * (shouldShrink ? 1 : -1));
            } else {
                [overflow, visible] = shiftElements(s.overflow, s.visible, s.chopSize * (shouldShrink ? -1 : 1));
            }
            const isFirstCycle = s.chopSize === defaultChopSize();
            return {
                visible,
                overflow,
                chopSize: halve(s.chopSize),
                lastChopSize: s.chopSize,
                lastOverflowCount: isFirstCycle ? s.overflow.length : s.lastOverflowCount,
                repartitioning: true,
            };
        });
    };

    // Reset when partition-affecting props change. Renderer identities are NOT
    // included (they're called fresh each render anyway) — so inline renderers
    // don't trigger an infinite reset loop, unlike a naive port.
    const prevDeps = useRef({ items, collapseFrom, minVisibleItems, alwaysRenderOverflow });
    const mounted = useRef(false);
    const prevRepartitioning = useRef(false);

    useLayoutEffect(() => {
        const deps = { items, collapseFrom, minVisibleItems, alwaysRenderOverflow };
        const p = prevDeps.current;
        if (
            p.items !== deps.items ||
            p.collapseFrom !== deps.collapseFrom ||
            p.minVisibleItems !== deps.minVisibleItems ||
            p.alwaysRenderOverflow !== deps.alwaysRenderOverflow
        ) {
            prevDeps.current = deps;
            prevRepartitioning.current = true;
            setState({
                visible: items,
                overflow: [],
                chopSize: halve(items.length),
                lastChopSize: null,
                repartitioning: true,
                lastOverflowCount: 0,
            });
            return;
        }

        if (!mounted.current) {
            mounted.current = true;
            prevRepartitioning.current = state.repartitioning;
            repartition();
            return;
        }

        const justSettled = !state.repartitioning && prevRepartitioning.current;
        prevRepartitioning.current = state.repartitioning;
        if (justSettled) {
            if (state.overflow.length !== state.lastOverflowCount) {
                onOverflowRef.current?.(state.overflow.slice());
            }
        } else if (state.repartitioning) {
            repartition();
        }
    });

    const overflowElement =
        state.overflow.length === 0 && !alwaysRenderOverflow ? null : overflowRenderer(state.overflow.slice());

    const list = createElement(
        tagName,
        {
            className: cn(
                // Single non-wrapping flex row; children keep their natural width
                // (shrink-0) so the trailing 1px spacer is what gets squeezed first.
                "analyst-overflow-list flex flex-nowrap min-w-0 [&>*]:shrink-0",
                className,
            ),
            style,
        },
        collapseFrom === "start" ? overflowElement : null,
        state.visible.map(visibleItemRenderer),
        collapseFrom === "end" ? overflowElement : null,
        <div
            key="__spacer__"
            aria-hidden
            className="analyst-overflow-list-spacer"
            // Inline flexShrink overrides the [&>*]:shrink-0 above so this is the one
            // element that can be squeezed below 1px — the overflow signal.
            style={{ width: 1, flexShrink: 1 }}
            ref={spacerRef}
        />,
    );

    return (
        <ResizeSensor onResize={() => repartition()} observeParents={observeParents}>
            {navigable ? <nav aria-label={navigationAriaLabel}>{list}</nav> : list}
        </ResizeSensor>
    );
}
OverflowList.displayName = "OverflowList";
