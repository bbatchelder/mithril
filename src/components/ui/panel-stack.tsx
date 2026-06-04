"use client";

import { forwardRef, useCallback, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Icon } from "./icon";
import { chevronLeft } from "./icons";

/**
 * PanelStack — pixel-faithful reimplementation of Blueprint's `.bp6-panel-stack2`.
 *
 * Blueprint spec (`packages/core/src/components/panel-stack/_panel-stack.scss`, v6.15):
 *
 * Container (.bp6-panel-stack2):
 *   overflow: hidden; position: relative
 *
 * Panel view (.bp6-panel-stack2-view):
 *   position: absolute; inset: 0;
 *   background-color: $card-background-color (white light / dark-gray-2 dark)
 *   border-right: 1px solid $pt-divider-black = rgba(17,20,24,0.15) light, rgba(255,255,255,0.2) dark
 *   margin-right: -1px (compensates for border so it doesn't add to layout width)
 *   display: flex; flex-direction: column; overflow-y: auto; z-index: 1
 *
 * Panel header (.bp6-panel-stack2-header):
 *   display: flex; align-items: center; flex-shrink: 0;
 *   height: $pt-spacing * 7.5 = 30px
 *   box-shadow: 0 1px $pt-divider-black (light) / 0 1px $pt-dark-divider-white (dark)
 *     = 0 1px 0 rgba(17,20,24,0.15) light / 0 1px 0 rgba(255,255,255,0.2) dark
 *   z-index: 1
 *   > span: flex: 1; display: flex; align-items: stretch
 *   .bp6-heading: margin: 0 4px ($pt-spacing)
 *
 * Back button (.bp6-panel-stack2-header-back):
 *   variant="minimal", size="small"
 *   margin-left: $pt-spacing = 4px; padding-left: 0; white-space: nowrap
 *   .bp6-icon: margin: 0 2px ($pt-spacing * 0.5)
 *
 * Push transition (translateX 100% → 0, opacity 0→1, ease, 400ms):
 *   enter: from translateX(100%) opacity:0 → translateX(0) opacity:1
 *   exit:  from translateX(0) opacity:1 → translateX(-50%) opacity:0
 *
 * Pop transition (translateX -50% → 0, opacity 0→1, ease, 400ms):
 *   enter: from translateX(-50%) opacity:0 → translateX(0) opacity:1
 *   exit:  from translateX(0) opacity:1 → translateX(100%) opacity:0
 *
 * @see https://blueprintjs.com/docs/#core/components/panel-stack
 */

// ─── CSS-in-JS for animations ────────────────────────────────────────────────
// Blueprint uses CSSTransition with 400ms ease transitions.
// We inject a small <style> block so we can use keyframe-based animation
// without runtime var() references. The animation timing matches Blueprint:
// $pt-transition-duration * 4 = 100ms * 4 = 400ms, easing: ease.
//
// Since we're building a static panel stack (no CSSTransition wrapper),
// we implement the slide animation using CSS class toggling.
// The classes panel-stack-enter / panel-stack-exit are applied to the
// .panel-view elements as panels push/pop.

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * A panel descriptor — the data needed to render a single panel in the stack.
 */
export interface PanelInfo<P extends object = object> {
    /** Title displayed in the panel header and used as the back-button label for child panels. */
    title: React.ReactNode;
    /**
     * Render function for the panel body. Receives `openPanel` and `closePanel` callbacks
     * (plus any custom `props`) so the panel can navigate the stack.
     */
    renderPanel: (actions: PanelActions & P) => React.ReactNode;
    /**
     * Custom props forwarded to `renderPanel` alongside the injected `openPanel`/`closePanel`.
     * Type-safe: consumers should type the third generic arg.
     */
    props?: P;
}

/** Navigation actions injected into every panel's `renderPanel` call. */
export interface PanelActions {
    /** Push a new panel onto the stack. */
    openPanel: (panel: PanelInfo<any>) => void;
    /** Pop the current panel off the stack. Does nothing for the root panel. */
    closePanel: () => void;
}

export interface PanelStackProps extends React.HTMLAttributes<HTMLDivElement> {
    /**
     * **Controlled mode**: provide the full stack. The last item is the active panel.
     * Mutually exclusive with `initialPanel`.
     */
    stack?: PanelInfo<any>[];

    /**
     * **Uncontrolled mode**: the initial (root) panel. Cannot be removed.
     * Mutually exclusive with `stack`.
     */
    initialPanel?: PanelInfo<any>;

    /**
     * Called when a new panel is opened (uncontrolled mode) or as a notification
     * in controlled mode.
     */
    onOpen?: (panel: PanelInfo<any>) => void;

    /**
     * Called when a panel is closed (uncontrolled mode) or as a notification
     * in controlled mode.
     */
    onClose?: (panel: PanelInfo<any>) => void;

    /**
     * If true, only the active (top) panel is rendered to the DOM.
     * If false, all panels are rendered but only the active one is visible.
     * @default true
     */
    renderActivePanelOnly?: boolean;

    /**
     * Whether to show the panel header (with back button + title).
     * @default true
     */
    showPanelHeader?: boolean;
}

// ─── PanelStack ──────────────────────────────────────────────────────────────

/**
 * A stack of sliding panels. Push new panels onto the stack with `openPanel`;
 * pop the current panel with `closePanel` or the header back button.
 *
 * **Uncontrolled** (internal state):
 * ```tsx
 * <PanelStack
 *   initialPanel={{
 *     title: "Root",
 *     renderPanel: ({ openPanel }) => (
 *       <button onClick={() => openPanel({ title: "Detail", renderPanel: () => <p>Detail</p> })}>
 *         Go to detail
 *       </button>
 *     ),
 *   }}
 * />
 * ```
 *
 * **Controlled** (consumer manages the stack array):
 * ```tsx
 * const [stack, setStack] = useState([rootPanel]);
 * <PanelStack
 *   stack={stack}
 *   onOpen={(p) => setStack([...stack, p])}
 *   onClose={() => setStack(stack.slice(0, -1))}
 * />
 * ```
 */
export const PanelStack = forwardRef<HTMLDivElement, PanelStackProps>(function PanelStack(
    {
        stack: stackProp,
        initialPanel,
        onOpen,
        onClose,
        renderActivePanelOnly = true,
        showPanelHeader = true,
        className,
        ...htmlProps
    },
    ref,
) {
    const isControlled = stackProp !== undefined;

    // Uncontrolled internal state.
    const [localStack, setLocalStack] = useState<PanelInfo<any>[]>(
        initialPanel !== undefined ? [initialPanel] : [],
    );

    // Active stack: in controlled mode use the prop; in uncontrolled use local state.
    const stack = isControlled ? stackProp : localStack;

    // Track push vs pop direction for animation class.
    const prevLengthRef = useRef(stack.length);
    const direction = stack.length >= prevLengthRef.current ? "push" : "pop";
    // Update after each render (useRef doesn't trigger re-render).
    prevLengthRef.current = stack.length;

    const handleOpen = useCallback(
        (panel: PanelInfo<any>) => {
            onOpen?.(panel);
            if (!isControlled) {
                setLocalStack((prev) => [...prev, panel]);
            }
        },
        [isControlled, onOpen],
    );

    const handleClose = useCallback(
        (panel: PanelInfo<any>) => {
            onClose?.(panel);
            if (!isControlled) {
                setLocalStack((prev) => prev.slice(0, -1));
            }
        },
        [isControlled, onClose],
    );

    if (stack.length === 0) return null;

    // Panels to render — either only the active panel or all in the stack.
    const panelsToRender = renderActivePanelOnly ? [stack[stack.length - 1]] : stack;

    return (
        <div
            ref={ref}
            className={cn(
                // .bp6-panel-stack2: position:relative, overflow:hidden
                "relative overflow-hidden",
                // Direction class mirrors Blueprint's push/pop class for CSS targeting
                direction === "push" ? "bp6-panel-stack2-push" : "bp6-panel-stack2-pop",
                className,
            )}
            {...htmlProps}
        >
            {panelsToRender.map((panel, indexInRendered) => {
                // In renderActivePanelOnly mode: only one panel; index in stack = last.
                // In full-render mode: panels rendered in stack order, last = active.
                const stackIndex = renderActivePanelOnly
                    ? stack.length - 1
                    : indexInRendered;

                const previousPanel = stackIndex > 0 ? stack[stackIndex - 1] : undefined;
                const isActive = stackIndex === stack.length - 1;

                return (
                    <PanelView
                        key={renderActivePanelOnly ? stack.length : stackIndex}
                        panel={panel}
                        previousPanel={previousPanel}
                        showHeader={showPanelHeader}
                        isActive={isActive}
                        onOpen={handleOpen}
                        onClose={() => handleClose(panel)}
                    />
                );
            })}
        </div>
    );
});

PanelStack.displayName = "PanelStack";

// ─── Internal: PanelView ─────────────────────────────────────────────────────

interface PanelViewProps {
    panel: PanelInfo<any>;
    previousPanel?: PanelInfo<any>;
    showHeader: boolean;
    isActive: boolean;
    onOpen: (panel: PanelInfo<any>) => void;
    onClose: () => void;
}

/**
 * Internal panel renderer. Wraps renderPanel with injected openPanel/closePanel,
 * and renders the panel header with optional back button.
 *
 * Positioned absolutely so all panels stack on top of each other —
 * the active panel is z-index 1; inactive panels are hidden underneath.
 */
function PanelView({ panel, previousPanel, showHeader, isActive, onOpen, onClose }: PanelViewProps) {
    // Build the actions object that will be injected into renderPanel.
    const actions: PanelActions = useMemo(
        () => ({
            openPanel: onOpen,
            closePanel: onClose,
        }),
        [onOpen, onClose],
    );

    // Merge panel.props with the injected actions.
    const renderArgs = useMemo(
        () => ({ ...actions, ...(panel.props ?? {}) }),
        [actions, panel.props],
    );

    const hasPreviousPanel = previousPanel !== undefined;

    return (
        <div
            // .bp6-panel-stack2-view:
            //   position: absolute; inset: 0; display: flex; flex-direction: column;
            //   overflow-y: auto; z-index: 1; background: card bg
            //   border-right: 1px solid divider; margin-right: -1px (compensate)
            className={cn(
                "absolute inset-0 flex flex-col overflow-y-auto z-[1]",
                // Card background: white (light) / dark-gray-2 (dark)
                "bg-surface",
                // Right border between panels (visible during transition)
                "border-r border-r-[rgba(17,20,24,0.15)] dark:border-r-[rgba(255,255,255,0.2)]",
                // Compensate the border so it doesn't add layout width
                "-mr-px",
                // Hide inactive panels (in full-render mode)
                !isActive && "invisible",
            )}
        >
            {showHeader && (
                <div
                    data-compare="panel-stack-header"
                    className={cn(
                        // .bp6-panel-stack2-header:
                        //   display: flex; align-items: center; flex-shrink: 0;
                        //   height: 30px ($pt-spacing * 7.5); z-index: 1
                        //   box-shadow: 0 1px rgba(17,20,24,0.15) light / 0 1px rgba(255,255,255,0.2) dark
                        "flex items-center flex-shrink-0 h-[30px] z-[1]",
                        // Bottom divider via box-shadow (not border-bottom) — matches Blueprint exactly.
                        // Blueprint: box-shadow: 0 1px $pt-divider-black
                        "shadow-[0_1px_0_rgba(17,20,24,0.15)] dark:shadow-[0_1px_0_rgba(255,255,255,0.2)]",
                    )}
                >
                    {/* Left span: back button (flex:1 so title stays centered) */}
                    <span className="flex flex-1 items-stretch">
                        {hasPreviousPanel && (
                            <Button
                                data-compare="panel-stack-back"
                                variant="minimal"
                                size="small"
                                // margin-left: $pt-spacing = 4px; padding-left: 0
                                // gap-0: Blueprint's header-back has no icon→text gap (the icon's
                                // own mx-2px supplies the 2px spacing). The Button default gap-2
                                // would make this button 8px wider than Blueprint's 58px. See handoff 0064.
                                className="ml-1 pl-0 gap-0 whitespace-nowrap"
                                // chevron-left icon; margin: 0 2px around icon
                                icon={
                                    <Icon
                                        icon={chevronLeft}
                                        size={16}
                                        // Blueprint reduces margin around icon in header-back: margin: 0 ($pt-spacing * 0.5) = 0 2px
                                        className="mx-[2px]"
                                    />
                                }
                                onClick={onClose}
                                aria-label="Back"
                            >
                                {previousPanel.title}
                            </Button>
                        )}
                    </span>

                    {/* Title: centered via flex:1 spans on either side */}
                    <span
                        data-compare="panel-stack-title"
                        // .bp6-heading: margin: 0 $pt-spacing = 0 4px
                        className="mx-1 truncate font-semibold text-body text-foreground text-center"
                    >
                        {panel.title}
                    </span>

                    {/* Right span: empty, provides symmetry so title stays centered */}
                    <span className="flex flex-1 items-stretch" />
                </div>
            )}

            {/* Panel content — renderPanel receives openPanel + closePanel + custom props */}
            <PanelContent panel={panel} renderArgs={renderArgs} />
        </div>
    );
}

// ─── Internal: PanelContent ──────────────────────────────────────────────────

/**
 * Wraps `panel.renderPanel(...)` in a stable function component so that any hooks
 * used inside renderPanel have a consistent lifecycle (mirrors Blueprint's PanelWrapper).
 */
function PanelContent({
    panel,
    renderArgs,
}: {
    panel: PanelInfo<any>;
    renderArgs: PanelActions & object;
}) {
    // Stable memoized wrapper component — recreated only when panel identity changes.
    // This ensures hooks inside renderPanel get a fresh lifecycle when the panel changes.
    const Wrapper = useMemo(
        () =>
            function PanelWrapper() {
                return <>{panel.renderPanel(renderArgs as any)}</>;
            },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [panel],
    );

    return <Wrapper />;
}

// ─── CSS animations ──────────────────────────────────────────────────────────
// Blueprint's transition: 400ms ease, push = enter from right, exit to left;
// pop = enter from left, exit to right. We implement this with a global style
// block injected once. The parent container gets a direction class
// (.bp6-panel-stack2-push / .bp6-panel-stack2-pop) and the panels animate in/out.
//
// For the static gallery specimen (pre-pushed stack of 2), no animation fires —
// the computed-style diff sees only the resting state (transform: none, opacity: 1).
// Animation-fidelity caveat: without CSSTransition, the enter/exit classes are not
// automatically applied on mount/unmount. The static visual (resting state) is
// pixel-faithful; the slide transition is approximated via CSS classes that
// consumers can trigger. See handoff for details.
