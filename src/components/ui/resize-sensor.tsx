import { cloneElement, isValidElement, useEffect, useRef } from "react";

/**
 * `ResizeSensor` — observe an element's size and fire a callback when it changes.
 *
 * A behavioral helper (no visuals of its own): it wraps a single element child,
 * attaches a `ResizeObserver` to it, and invokes `onResize` whenever the element's
 * box changes. Mirrors Blueprint's `ResizeSensor`, re-expressed as a hook
 * (`useResizeObserver`) plus a thin component built on it.
 *
 * @see https://blueprintjs.com/docs/#core/components/resize-sensor
 */

export type ResizeEntry = ResizeObserverEntry;

export interface UseResizeObserverOptions {
    /**
     * If `true`, every ancestor element of the target (up to the document root) is
     * observed too, and `onResize` receives an entry for each. Enable only when a
     * parent can resize without resizing the target itself.
     * @default false
     */
    observeParents?: boolean;
}

/**
 * Observe `ref`'s element with a `ResizeObserver`, calling `onResize` on every
 * size change. The latest `onResize` is always used without re-subscribing, so an
 * inline callback is fine. Re-subscribes only when the element or `observeParents`
 * changes.
 */
export function useResizeObserver(
    ref: React.RefObject<HTMLElement | null>,
    onResize: (entries: ResizeObserverEntry[]) => void,
    { observeParents = false }: UseResizeObserverOptions = {},
): void {
    // Keep the callback in a ref so changing it doesn't tear down the observer.
    const onResizeRef = useRef(onResize);
    onResizeRef.current = onResize;

    useEffect(() => {
        const element = ref.current;
        if (element == null || typeof ResizeObserver === "undefined") {
            return;
        }
        const observer = new ResizeObserver((entries) => onResizeRef.current(entries));
        observer.observe(element);
        if (observeParents) {
            for (let parent = element.parentElement; parent != null; parent = parent.parentElement) {
                observer.observe(parent);
            }
        }
        return () => observer.disconnect();
        // `ref` is stable; we intentionally re-run only on observeParents change.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [observeParents]);
}

export interface ResizeSensorProps extends UseResizeObserverOptions {
    /** A single element child (not a string or fragment) — the observed element. */
    children: React.ReactElement;
    /**
     * Invoked, asynchronously and typically at most once per frame, when the child
     * element resizes. With `observeParents`, `entries` carries one entry per
     * observed ancestor as well.
     */
    onResize: (entries: ResizeObserverEntry[]) => void;
    /**
     * If you attach your own `ref` to the child, pass the same ref here so
     * `ResizeSensor` can observe the element without clobbering yours.
     */
    targetRef?: React.RefObject<HTMLElement | null>;
}

/**
 * Wrap a single element child and call `onResize` when it changes size. The child
 * must be an element (a `ResizeObserver` needs a real DOM node to watch).
 *
 * ```tsx
 * <ResizeSensor onResize={(entries) => setWidth(entries[0].contentRect.width)}>
 *   <div className="panel" />
 * </ResizeSensor>
 * ```
 */
export function ResizeSensor({ children, onResize, observeParents, targetRef }: ResizeSensorProps) {
    const localRef = useRef<HTMLElement | null>(null);
    // Observe whichever ref actually points at the element: the caller's if they
    // supplied one (and attached it to the child themselves), otherwise our own.
    useResizeObserver(targetRef ?? localRef, onResize, { observeParents });

    if (!isValidElement(children)) {
        throw new Error("<ResizeSensor> requires a single element child.");
    }
    // When the caller passes targetRef, they've attached it to the child already, so
    // leave the child untouched. Otherwise inject our ref (merging any existing one).
    if (targetRef != null) {
        return children;
    }
    // In React 19, `ref` is a regular prop — read it from props, not `element.ref`
    // (which is deprecated and warns).
    const childProps = children.props as { ref?: React.Ref<HTMLElement> };
    return cloneElement(children as React.ReactElement<{ ref?: React.Ref<HTMLElement> }>, {
        ref: mergeRefs(localRef, childProps.ref),
    });
}
ResizeSensor.displayName = "ResizeSensor";

/** Compose multiple refs into one ref callback. */
function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>): React.RefCallback<T> {
    return (value) => {
        for (const ref of refs) {
            if (typeof ref === "function") {
                ref(value);
            } else if (ref != null) {
                (ref as React.MutableRefObject<T | null>).current = value;
            }
        }
    };
}
