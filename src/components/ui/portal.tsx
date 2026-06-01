import { createContext, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

/**
 * `Portal` — render children into a detached DOM node (default `document.body`).
 *
 * Use it to escape CSS `overflow`/`z-index` stacking for overlays, popovers, and
 * tooltips. Mirrors Blueprint's `Portal` + `PortalProvider`, modernized: function
 * component, and the deprecated `stopPropagationEvents` prop is dropped (it no
 * longer works in React 17+).
 *
 * @see https://blueprintjs.com/docs/#core/components/portal
 */

export interface PortalContextOptions {
    /** Class name added to every `Portal` container element in this subtree. */
    portalClassName?: string;
    /** Element that every `Portal` in this subtree mounts its container into. */
    portalContainer?: HTMLElement;
}

/**
 * Context for defaults shared by all `Portal`s in a subtree. Don't consume it
 * directly — wrap with `PortalProvider` to set it.
 */
export const PortalContext = createContext<PortalContextOptions>({});

/**
 * Provide `Portal` defaults (container element and/or class name) to a subtree.
 *
 * ```tsx
 * <PortalProvider portalContainer={appRoot} portalClassName="my-portals">
 *   <App />
 * </PortalProvider>
 * ```
 */
export function PortalProvider({
    children,
    portalClassName,
    portalContainer,
}: React.PropsWithChildren<PortalContextOptions>) {
    return (
        <PortalContext.Provider value={{ portalClassName, portalContainer }}>
            {children}
        </PortalContext.Provider>
    );
}
PortalProvider.displayName = "PortalProvider";

export interface PortalProps {
    /** Contents to send through the portal. */
    children: React.ReactNode;
    /** Class name(s) added to the portal's container element. */
    className?: string;
    /**
     * Element the children mount into.
     * @default PortalProvider's portalContainer ?? document.body
     */
    container?: HTMLElement;
    /** Invoked once the children have been attached to the DOM. */
    onChildrenMount?: () => void;
}

/**
 * Detach `children` and re-attach them under a container element (a `<div>` added
 * to `container`). Renders nothing until mounted in a browser, so portaled
 * children can immediately measure or `autoFocus`.
 */
export function Portal({ children, className, container, onChildrenMount }: PortalProps) {
    const context = useContext(PortalContext);
    const portalContainer =
        container ??
        context.portalContainer ??
        (typeof document !== "undefined" ? document.body : undefined);

    const [portalElement, setPortalElement] = useState<HTMLDivElement>();

    // Create the container element and attach it; clean it up on unmount.
    useEffect(() => {
        if (portalContainer == null) {
            return;
        }
        const element = document.createElement("div");
        const classes = cn("mithril-portal", className, context.portalClassName);
        if (classes) element.className = classes;
        portalContainer.appendChild(element);
        setPortalElement(element);
        return () => {
            element.remove();
            setPortalElement(undefined);
        };
        // Re-create only when the container changes; class updates are handled below.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [portalContainer]);

    // Keep the container's classes in sync when className/context change.
    useEffect(() => {
        if (portalElement != null) {
            const classes = cn("mithril-portal", className, context.portalClassName);
            portalElement.className = classes;
        }
    }, [portalElement, className, context.portalClassName]);

    // Fire onChildrenMount after the children are attached.
    useEffect(() => {
        if (portalElement != null) {
            onChildrenMount?.();
        }
        // Run once per (re)mount of the container.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [portalElement]);

    if (typeof document === "undefined" || portalElement == null) {
        return null;
    }
    return createPortal(children, portalElement);
}
Portal.displayName = "Portal";
