import { createContext, useContext } from "react";

/**
 * App-level dark-mode flag, shared so portaling components (Popover, Tooltip, Drawer,
 * Select, Toast viewport) can apply the `dark` class to their portal wrappers — the
 * portal renders at document.body, outside the app's `.dark` ancestor div.
 */
export const DarkContext = createContext(false);

/** Read the current app dark-mode flag. */
export function useDark(): boolean {
    return useContext(DarkContext);
}
