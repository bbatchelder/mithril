"use client";

import { createContext, useContext, useState } from "react";

import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { Tooltip } from "@/components/ui/tooltip";
import { Popover } from "@/components/ui/popover";
import { Menu, MenuItem, MenuDivider } from "@/components/ui/menu";

/**
 * Per-app chrome: a way back to the landing app gallery plus the shared theme controls,
 * gathered behind a single {@link ThemeMenu} popover (appearance mode · named color theme ·
 * the Theme Builder editor). The theme itself is global (the builder applies seed overrides
 * to the document root), so the picker/editor are the same everywhere; only the appearance
 * mode (system / light / dark) is owned per-app.
 */

/** Per-app appearance preference. `"system"` follows `prefers-color-scheme`. */
export type ThemeMode = "system" | "light" | "dark";

export interface AppChrome {
    /** Return to the landing app gallery. */
    exit: () => void;
    /** Resolved appearance — `mode` with `"system"` collapsed to the OS preference. */
    dark: boolean;
    /** The per-app appearance preference (may be `"system"`). */
    mode: ThemeMode;
    /** Set the per-app appearance preference. */
    setMode: (mode: ThemeMode) => void;
    /** Flip between explicit light/dark (used by the Theme Builder's preview toggle). */
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

const MODE_OPTIONS: { value: ThemeMode; label: string; icon: IconName }[] = [
    { value: "system", label: "System", icon: "desktop" },
    { value: "light", label: "Light", icon: "lightbulb" },
    { value: "dark", label: "Dark", icon: "moon" },
];

/** Trailing check shown on the selected row in either section. */
function SelectedTick() {
    return <Icon icon="tick" size={14} className="!text-current" />;
}

/**
 * The consolidated theme control: a single icon button that opens a popover covering
 * everything theme-related — appearance mode (system/light/dark), the named color theme,
 * and a way into the Theme Builder. It replaces the three separate chrome controls (a
 * light/dark toggle, a theme `<select>`, and an editor toggle) with one affordance.
 *
 * Open state is controlled so picking a mode or theme keeps the menu open for live
 * comparison; only "Edit themes…" dismisses it (handing off to the side panel).
 */
export function ThemeMenu() {
    const { dark, mode, setMode, themeNames, selectedTheme, selectTheme, editorOpen, toggleEditor } =
        useAppChrome();
    const [open, setOpen] = useState(false);

    return (
        <Popover
            open={open}
            onOpenChange={setOpen}
            dark={dark}
            side="bottom"
            align="end"
            hasContentPadding={false}
            ariaLabel="Theme settings"
            content={
                <Menu size="small" className="min-w-[200px]">
                    <MenuDivider title="Appearance" />
                    {MODE_OPTIONS.map((m) => (
                        <MenuItem
                            key={m.value}
                            icon={m.icon}
                            text={m.label}
                            active={mode === m.value}
                            label={mode === m.value ? <SelectedTick /> : undefined}
                            onClick={() => setMode(m.value)}
                        />
                    ))}
                    <MenuDivider title="Color theme" />
                    {themeNames.map((name) => (
                        <MenuItem
                            key={name}
                            icon="tint"
                            text={name}
                            active={name === selectedTheme}
                            label={name === selectedTheme ? <SelectedTick /> : undefined}
                            onClick={() => selectTheme(name)}
                        />
                    ))}
                    <MenuDivider />
                    <MenuItem
                        icon="style"
                        text="Edit themes…"
                        active={editorOpen}
                        onClick={() => {
                            setOpen(false);
                            toggleEditor();
                        }}
                    />
                </Menu>
            }
        >
            <Button
                size="small"
                variant="minimal"
                intent={editorOpen ? "primary" : "none"}
                aria-label="Theme settings"
                aria-pressed={open || editorOpen}
                icon={<Icon icon="contrast" className="!text-current" />}
            />
        </Popover>
    );
}

/**
 * The shared chrome cluster every app renders in its own header: a "back to the app
 * gallery" button and the consolidated {@link ThemeMenu}. Kept divider-free so it drops
 * cleanly into a Navbar group — the demos and the showcase's top app bar alike — or a
 * plain flex header. The landing page renders it with `showExit` off, since there's
 * nowhere "back" to go from the gallery itself.
 */
export function AppChromeControls({ showExit = true }: { showExit?: boolean } = {}) {
    const { exit, dark } = useAppChrome();
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
            <ThemeMenu />
        </div>
    );
}
