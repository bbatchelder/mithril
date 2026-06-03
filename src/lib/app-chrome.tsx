import { createContext, useContext } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Tooltip } from "@/components/ui/tooltip";

/** The seed palettes the gallery ships. `default` plus the bundled `datex` theme. */
export type Palette = "default" | "datex";

/**
 * Per-app chrome: a way back to the landing app gallery plus the app's own theme
 * chooser. Each app (the showcase and every demo) owns its palette + light/dark
 * independently, so there is no persistent global sidebar — every app gets its
 * full width back and carries its own controls in its own header.
 */
export interface AppChrome {
    /** Return to the landing app gallery. */
    exit: () => void;
    palette: Palette;
    dark: boolean;
    setPalette: (p: Palette) => void;
    toggleDark: () => void;
}

const AppChromeContext = createContext<AppChrome | null>(null);
export const AppChromeProvider = AppChromeContext.Provider;

/** Read the active app's chrome (back-nav + theme). Throws outside a provider. */
export function useAppChrome(): AppChrome {
    const ctx = useContext(AppChromeContext);
    if (!ctx) throw new Error("useAppChrome must be used within an AppChromeProvider");
    return ctx;
}

/**
 * The shared chrome cluster every app renders in its own header: a "back to the app
 * gallery" button and the app's theme chooser (palette tint + light/dark). Kept
 * divider-free so it drops cleanly into either a Navbar group (the demos) or a plain
 * flex header (the showcase sidebar). The landing page renders it with `showExit`
 * off, since there's nowhere "back" to go from the gallery itself.
 */
export function AppChromeControls({ showExit = true }: { showExit?: boolean } = {}) {
    const { exit, palette, dark, setPalette, toggleDark } = useAppChrome();
    const datex = palette === "datex";
    return (
        <div className="flex items-center gap-1">
            {showExit && (
                <Tooltip content="App gallery" dark={dark}>
                    <Button
                        size="small"
                        variant="minimal"
                        aria-label="Back to app gallery"
                        icon={<Icon icon="applications" className="!text-current" />}
                        onClick={exit}
                    />
                </Tooltip>
            )}
            <Button
                size="small"
                variant="minimal"
                intent={datex ? "primary" : "none"}
                aria-label={datex ? "Switch to default theme" : "Switch to datex theme"}
                aria-pressed={datex}
                icon={<Icon icon="tint" className="!text-current" />}
                onClick={() => setPalette(datex ? "default" : "datex")}
            />
            <Button
                size="small"
                variant="minimal"
                aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
                icon={<Icon icon={dark ? "lightbulb" : "moon"} className="!text-current" />}
                onClick={toggleDark}
            />
        </div>
    );
}
