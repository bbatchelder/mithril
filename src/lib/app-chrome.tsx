import { createContext, useContext } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Tooltip } from "@/components/ui/tooltip";
import { HTMLSelect } from "@/components/ui/html-select";

/**
 * Per-app chrome: a way back to the landing app gallery plus the shared theme controls —
 * a named-theme picker and a toggle for the Theme Builder editor panel. The theme itself is
 * global (the builder applies seed overrides to the document root), so the picker/editor are
 * the same everywhere; only light/dark is owned per-app.
 */
export interface AppChrome {
    /** Return to the landing app gallery. */
    exit: () => void;
    dark: boolean;
    toggleDark: () => void;
    /** Named themes available in the picker (built-ins + saved custom). */
    themeNames: string[];
    /** Currently-selected theme name. */
    selectedTheme: string;
    /** Load a theme by name. */
    selectTheme: (name: string) => void;
    /** Whether the Theme Builder editor panel is open. */
    editorOpen: boolean;
    /** Toggle the Theme Builder editor panel. */
    toggleEditor: () => void;
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
 * divider-free so it drops cleanly into a Navbar group — the demos and the showcase's
 * top app bar alike — or a plain flex header. The landing page renders it with `showExit`
 * off, since there's nowhere "back" to go from the gallery itself.
 */
export function AppChromeControls({ showExit = true }: { showExit?: boolean } = {}) {
    const { exit, dark, toggleDark, themeNames, selectedTheme, selectTheme, editorOpen, toggleEditor } =
        useAppChrome();
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
            <HTMLSelect
                minimal
                aria-label="Theme"
                value={selectedTheme}
                options={themeNames}
                onChange={(e) => selectTheme(e.target.value)}
            />
            <Tooltip content="Theme editor" dark={dark}>
                <Button
                    size="small"
                    variant="minimal"
                    intent={editorOpen ? "primary" : "none"}
                    aria-label="Theme editor"
                    aria-pressed={editorOpen}
                    icon={<Icon icon="style" className="!text-current" />}
                    onClick={toggleEditor}
                />
            </Tooltip>
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
