"use client";

import { createElement, useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Collapse — pixel-faithful reimplementation of Blueprint's `.bp6-collapse`.
 *
 * Blueprint spec (`packages/core/src/components/collapse/_collapse.scss`, v6.15):
 *
 * Container (`.bp6-collapse`):
 *   height: 0
 *   overflow-y: hidden
 *   transition: height ($pt-transition-duration * 2) $pt-transition-ease
 *             = height 200ms cubic-bezier(0.4, 1, 0.75, 0.9)
 *
 * Body (`.bp6-collapse-body`):
 *   position: relative (implied by Blueprint's translateY animation)
 *   transition: transform ($pt-transition-duration * 2) $pt-transition-ease
 *   [aria-hidden="true"]: display: none
 *
 * Animation states (Blueprint uses 6 states to coordinate the two-phase close):
 *   OPEN:          height auto, overflowY visible (to avoid clipping dropdowns)
 *   OPENING:       height <measured>px (transitioning to open)
 *   OPEN_START:    height <measured>px, body at translateY(0), next render triggers OPENING
 *   CLOSING_START: height <measured>px, queues CLOSING on next microtask
 *   CLOSING:       height 0px, body translateY(-<height>px) (animating closed)
 *   CLOSED:        height undefined/0, body translateY(-<height>px), aria-hidden → display:none
 *
 * Design decisions:
 *   - Modern API: `isOpen` (or `open` alias), `keepChildrenMounted`, `transitionDuration`,
 *     `as` (wrapper element type), `className`, `children`.
 *   - No external deps. Pure React + inline styles for the animated height.
 *   - When OPEN: height is "auto" and overflowY is "visible" so nested dropdowns aren't
 *     clipped — same as Blueprint's OPEN state.
 *   - The body has `aria-hidden="true"` when not visible, and is set `display: none`
 *     inline in the same state, so `keepChildrenMounted` children are removed from both
 *     the layout and the accessibility tree when fully closed. (Blueprint does the
 *     `display: none` via SCSS keyed off `aria-hidden`; we inline it to stay dep-free.)
 *   - The transition property is set inline via CSS custom properties so it always
 *     reflects the `transitionDuration` prop. When height is "auto" transitions are
 *     suppressed (just like Blueprint — browsers can't transition to auto).
 *
 * @see https://blueprintjs.com/docs/#core/components/collapse
 */

/** Six animation states (mirrors Blueprint's AnimationStates enum). */
const AnimationState = {
    OPEN_START: 0,
    OPENING: 1,
    OPEN: 2,
    CLOSING_START: 3,
    CLOSING: 4,
    CLOSED: 5,
} as const;
type AnimationState = (typeof AnimationState)[keyof typeof AnimationState];

export interface CollapseProps extends React.HTMLAttributes<HTMLElement> {
    /** Whether the collapse is open. @default false */
    isOpen?: boolean;

    /**
     * Whether to keep children mounted when closed (avoids remounting on reopen).
     * @default false
     */
    keepChildrenMounted?: boolean;

    /**
     * Duration of the height/transform transition, in milliseconds.
     * @default 200
     */
    transitionDuration?: number;

    /**
     * Element type to render as the outer wrapper.
     * Useful for table rows, list items, etc.
     * @default "div"
     */
    as?: React.ElementType;

    /** Additional className applied to the outer wrapper. */
    className?: string;

    children?: React.ReactNode;
}

export function Collapse({
    isOpen = false,
    keepChildrenMounted = false,
    transitionDuration = 200,
    as: Tag = "div",
    className,
    children,
    ...rest
}: CollapseProps) {
    // --- Animation state machine ---
    const [animState, setAnimState] = useState<AnimationState>(
        isOpen ? AnimationState.OPEN : AnimationState.CLOSED,
    );
    const [height, setHeight] = useState<string | undefined>(isOpen ? "auto" : "0px");
    const [heightWhenOpen, setHeightWhenOpen] = useState<number | undefined>(undefined);

    // Track previous isOpen to detect prop changes during render (same pattern as Blueprint).
    const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
    const isOpenRef = useRef(isOpen);
    isOpenRef.current = isOpen;

    const animStateRef = useRef(animState);
    animStateRef.current = animState;

    const bodyRef = useRef<HTMLElement | null>(null);
    const delayedTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // Cleanup timer on unmount.
    useEffect(() => {
        return () => {
            if (delayedTimerRef.current != null) clearTimeout(delayedTimerRef.current);
        };
    }, []);

    // Callback fired after transition completes.
    const onTransitionEnd = useCallback(() => {
        switch (animStateRef.current) {
            case AnimationState.OPENING:
                setAnimState(AnimationState.OPEN);
                setHeight("auto");
                break;
            case AnimationState.CLOSING:
                setAnimState(AnimationState.CLOSED);
                break;
            default:
                break;
        }
    }, []);

    // Synchronize animState with isOpen changes (during render, matching Blueprint pattern).
    if (isOpen !== prevIsOpen) {
        setPrevIsOpen(isOpen);
        if (isOpen) {
            const s = animStateRef.current;
            if (s !== AnimationState.OPEN && s !== AnimationState.OPENING) {
                setAnimState(AnimationState.OPEN_START);
            }
        } else {
            const s = animStateRef.current;
            if (s !== AnimationState.CLOSED && s !== AnimationState.CLOSING) {
                setAnimState(AnimationState.CLOSING_START);
                setHeight(`${heightWhenOpen}px`);
            }
        }
    }

    // Handle state transitions that need DOM measurement or timers.
    useEffect(() => {
        if (!bodyRef.current) return undefined;

        switch (animStateRef.current) {
            case AnimationState.OPEN_START: {
                const h = bodyRef.current.clientHeight;
                setAnimState(AnimationState.OPENING);
                setHeight(`${h}px`);
                setHeightWhenOpen(h);

                clearTimeout(delayedTimerRef.current);
                delayedTimerRef.current = setTimeout(onTransitionEnd, transitionDuration);
                break;
            }
            case AnimationState.CLOSING_START: {
                const h = bodyRef.current.clientHeight;
                const immediateTimer = setTimeout(() => {
                    setAnimState(AnimationState.CLOSING);
                    setHeight("0px");
                    setHeightWhenOpen(h);
                });
                clearTimeout(delayedTimerRef.current);
                delayedTimerRef.current = setTimeout(onTransitionEnd, transitionDuration);
                return () => clearTimeout(immediateTimer);
            }
            default:
                break;
        }
        return undefined;
    }, [animState, transitionDuration, onTransitionEnd]);

    // Ref callback that measures content height on first mount.
    const bodyRefCallback = useCallback((el: HTMLElement | null) => {
        bodyRef.current = el;
        if (el != null) {
            const h = el.clientHeight;
            setAnimState(isOpenRef.current ? AnimationState.OPEN : AnimationState.CLOSED);
            setHeight(h === 0 ? undefined : `${h}px`);
            setHeightWhenOpen(h === 0 ? undefined : h);
        }
    }, []);

    // --- Derived render state ---
    const isVisible = animState !== AnimationState.CLOSED;
    const shouldRenderChildren = isVisible || keepChildrenMounted;
    const displayWithTransform = isVisible && animState !== AnimationState.CLOSING;
    const effectiveHeight = animState === AnimationState.OPEN ? "auto" : height;
    const isAutoHeight = effectiveHeight === "auto";

    // Blueprint: when fully OPEN, overflow-y is visible (not hidden) so nested popovers
    // / dropdowns can escape the container. Transitions are disabled when height is auto.
    // minWidth: 0 matches Blueprint's normalize-based default (flex children shrink below content width).
    const containerStyle: React.CSSProperties = {
        height: isVisible ? effectiveHeight : undefined,
        overflowY: isAutoHeight ? "visible" : "hidden",
        transition: isAutoHeight ? "none" : `height ${transitionDuration}ms cubic-bezier(0.4, 1, 0.75, 0.9)`,
        minWidth: 0,
    };

    const bodyStyle: React.CSSProperties = {
        // When fully closed, remove the body from layout so it contributes no height.
        // Blueprint achieves this with `.bp6-collapse-body[aria-hidden="true"] { display: none }`
        // in its SCSS; we do it inline to keep the component self-contained (no external CSS
        // dependency). Without this, a `keepChildrenMounted` collapse leaves a phantom gap the
        // size of its content after the close animation completes.
        display: isVisible ? undefined : "none",
        transform: displayWithTransform ? "translateY(0)" : `translateY(-${heightWhenOpen}px)`,
        transition: isAutoHeight ? "none" : `transform ${transitionDuration}ms cubic-bezier(0.4, 1, 0.75, 0.9)`,
    };

    return createElement(
        Tag,
        {
            ...rest,
            className: cn("mithril-collapse", className),
            style: containerStyle,
        },
        <div
            className="mithril-collapse-body"
            ref={bodyRefCallback}
            style={bodyStyle}
            aria-hidden={!isVisible}
        >
            {shouldRenderChildren ? children : null}
        </div>,
    );
}

Collapse.displayName = "Collapse";
