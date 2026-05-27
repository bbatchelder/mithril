/**
 * Hotkeys — pixel-faithful Blueprint v6.15 reimplementation.
 *
 * ## Components
 *
 * ### KeyCombo
 * Renders a keyboard shortcut combination as a row of `<kbd>` key caps.
 * Parses a combo string (e.g. `"mod+shift+n"`) into individual key tokens,
 * resolving `mod` → ⌘ on Mac / Ctrl on other platforms.
 *
 * ### HotkeysDialog
 * A Dialog listing keyboard shortcuts grouped by section. Reuses the
 * existing `Dialog` component for portal + dark-mode correctness.
 *
 * ## API
 * ```tsx
 * // Standalone KeyCombo
 * <KeyCombo combo="mod+shift+n" />
 * <KeyCombo combo="ctrl+z" minimal />
 *
 * // Full dialog
 * <HotkeysDialog
 *   open={true}
 *   onOpenChange={setOpen}
 *   dark={dark}
 *   title="Keyboard shortcuts"
 *   hotkeys={[
 *     { label: "New file", combo: "mod+n", group: "Global" },
 *     { label: "Save", combo: "mod+s", group: "Global" },
 *     { label: "Find", combo: "mod+f", group: "Editor" },
 *   ]}
 * />
 * ```
 *
 * ## Blueprint metrics (extracted from _hotkeys.scss + _typography.scss)
 * - Key cap: height/min-width = 24px ($pt-button-height-small = $pt-spacing*6)
 * - Key cap: padding = 2px 4px ($pt-spacing*0.5, $pt-spacing)
 * - Key cap: border-radius = 4px ($pt-border-radius)
 * - Key cap: font-size = 12px ($pt-font-size-small = $pt-spacing*3)
 * - Key cap light: bg white; color gray-1 (#5f6b7c); shadow = $pt-elevation-shadow-1
 * - Key cap dark: bg dark-gray-3 (#2f343c); color gray-4 (#abb3bf); shadow = $pt-dark-elevation-shadow-1
 * - KeyCombo gap (not minimal): $pt-spacing = 4px
 * - Hotkey row: display:flex align-items:center justify-content:space-between; mb 8px if not last
 * - Hotkey column: margin:auto; padding: 30px ($pt-spacing*7.5)
 * - Group heading: H4 = font-size 18px; margin-bottom 20px; not-first: margin-top 40px
 * - Dialog body: margin:0 padding:0 (overrides default)
 *
 * ## Portal + dark-mode
 * Delegates entirely to the existing Dialog component, which wraps portal
 * children in `<div className={dark ? "dark" : ""}>` so Tailwind dark:
 * utilities resolve correctly. Pass `dark` from the gallery's DarkContext.
 */

import { cn } from "@/lib/utils";
import { Dialog } from "./dialog";
import { Icon, type IconName } from "./icon";

// ---------------------------------------------------------------------------
// Key combo parser
// ---------------------------------------------------------------------------

/** Platform detection — matches Blueprint's isMac() check. */
function isMac(): boolean {
    if (typeof navigator === "undefined") return false;
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    return /Mac|iPod|iPhone|iPad/.test(navigator.platform);
}

/** CONFIG_ALIASES from Blueprint's hotkeyParser.ts */
const CONFIG_ALIASES: Record<string, string> = {
    cmd: "meta",
    command: "meta",
    del: "delete",
    esc: "escape",
    escape: "escape",
    minus: "-",
    mod: isMac() ? "meta" : "ctrl",
    option: "alt",
    plus: "+",
    return: "enter",
    win: "meta",
    up: "arrowup",
    left: "arrowleft",
    down: "arrowdown",
    right: "arrowright",
};

/** DISPLAY_ALIASES from Blueprint's KeyComboTag — arrow codes to short names. */
const DISPLAY_ALIASES: Record<string, string> = {
    arrowdown: "down",
    arrowleft: "left",
    arrowright: "right",
    arrowup: "up",
};

/**
 * Unicode symbols for modifier/special keys (matches Blueprint's icon display
 * on Mac; on other platforms we show the text label since Blueprint only shows
 * icons on Mac via `isMacOnly: true` icons).
 */
const KEY_SYMBOLS: Record<string, string> = {
    meta: isMac() ? "⌘" : "Meta",
    alt: isMac() ? "⌥" : "Alt",
    shift: isMac() ? "⇧" : "Shift",
    ctrl: isMac() ? "⌃" : "Ctrl",
    enter: "↵",
    arrowup: "↑",
    arrowdown: "↓",
    arrowleft: "←",
    arrowright: "→",
    up: "↑",
    down: "↓",
    left: "←",
    right: "→",
    delete: "⌫",
    escape: "Esc",
};

/**
 * Modifier keys that Blueprint renders as a platform-glyph ICON paired with the
 * modifier WORD inside one key cap (e.g. ⌘+"cmd", ⇧+"shift", ⌃+"ctrl", ⌥+"alt").
 * The parser yields these lowercase tokens (`meta` is normalized to `cmd` on Mac,
 * `ctrl` elsewhere), so we key on the resolved token.
 */
const MODIFIER_ICONS: Record<string, IconName> = {
    cmd: "key-command",
    meta: "key-command",
    ctrl: "key-control",
    alt: "key-option",
    shift: "key-shift",
};

/**
 * Parse a combo string into an array of display-ready key tokens.
 * Mirrors Blueprint's `normalizeKeyCombo()` + single-char uppercase behavior.
 */
function parseCombo(combo: string): string[] {
    const keys = combo
        .replace(/\s/g, "")
        .split("+")
        .map((key) => {
            const lower = key.toLowerCase();
            // Resolve aliases
            const resolved = CONFIG_ALIASES[lower] ?? lower;
            // For meta, normalize to cmd on Mac, ctrl elsewhere (like normalizeKeyCombo)
            const normalized = resolved === "meta" ? (isMac() ? "cmd" : "ctrl") : resolved;
            return normalized;
        });

    return keys.map((key) => {
        // Apply display aliases (arrow display names)
        const displayed = DISPLAY_ALIASES[key] ?? key;
        // Single character keys get uppercased (Blueprint: `key.length === 1 ? key.toUpperCase() : key`)
        return displayed.length === 1 ? displayed.toUpperCase() : displayed;
    });
}

// ---------------------------------------------------------------------------
// KeyCombo
// ---------------------------------------------------------------------------

export interface KeyComboProps extends React.HTMLAttributes<HTMLSpanElement> {
    /**
     * The keyboard shortcut combination to display, e.g. `"mod+shift+n"` or
     * `"ctrl+z"`. Use `+` as the separator. Modifiers: `mod`, `ctrl`, `alt`,
     * `shift`, `meta`, `cmd`. Special keys: `enter`, `escape`, `delete`,
     * `arrowup`, `arrowdown`, `arrowleft`, `arrowright` (or `up`/`down`/`left`/`right`).
     */
    combo: string;
    /**
     * Whether to render in a minimal style. When `false` (default), each key
     * renders in a raised `<kbd>` cap. When `true`, only the key symbol or
     * short name appears with no wrapper styles.
     *
     * @default false
     */
    minimal?: boolean;
    /**
     * Gallery/harness only: when provided, applies this string as `data-compare`
     * on the FIRST `<kbd>` key cap element (for harness style diffing).
     */
    _firstKeyCompare?: string;
}

/**
 * Renders a keyboard shortcut combo as a row of raised key-cap `<kbd>` elements.
 *
 * Matches Blueprint's `.bp6-key-combo` + `.bp6-key` visuals exactly.
 *
 * @example
 * ```tsx
 * <KeyCombo combo="mod+shift+n" />
 * <KeyCombo combo="ctrl+z" minimal />
 * ```
 */
export function KeyCombo({ combo, minimal = false, className, _firstKeyCompare, ...props }: KeyComboProps) {
    const keys = parseCombo(combo);

    return (
        <span
            className={cn(
                // Blueprint .bp6-key-combo: display:flex, align-items:center, flex-direction:row
                "inline-flex items-center",
                // Not minimal: gap = $pt-spacing = 4px. Minimal: no gap.
                minimal ? "gap-0" : "gap-1",
                className,
            )}
            {...props}
        >
            {keys.map((key, i) => {
                const lower = key.toLowerCase();
                const modIcon = MODIFIER_ICONS[lower];
                const symbol = KEY_SYMBOLS[lower];
                const display = symbol ?? key;

                if (minimal) {
                    // Minimal: glyph icon for modifiers, else the symbol/text — no cap styling.
                    return (
                        <span key={i} className="inline-flex items-center text-body-sm font-normal">
                            {modIcon ? <Icon icon={modIcon} size={14} aria-hidden className="!text-current" /> : display}
                        </span>
                    );
                }

                return (
                    <kbd
                        key={i}
                        // Gallery/harness: tag the first key cap with _firstKeyCompare if provided
                        {...(i === 0 && _firstKeyCompare ? { "data-compare": _firstKeyCompare } : {})}
                        className={cn(
                            // Blueprint .bp6-key / %keyboard:
                            // display: inline-flex; align-items: center; justify-content: center;
                            // vertical-align: middle; font-family: inherit;
                            "inline-flex items-center justify-center align-middle font-sans",
                            // Modifier caps pair a platform glyph icon with the word (⌘ cmd, ⇧ shift,
                            // ⌃ ctrl, ⌥ alt) — Blueprint puts ~4px between the icon and the label.
                            modIcon && "gap-1",
                            // font-size: $pt-font-size-small = 12px
                            "text-body-sm",
                            // height: $pt-button-height-small = 24px; min-width: 24px; line-height: 24px
                            "h-control-sm min-w-[24px] leading-[24px]",
                            // padding: ($pt-spacing*0.5) $pt-spacing = 2px 4px
                            "py-[2px] px-[4px]",
                            // border-radius: $pt-border-radius = 4px
                            "rounded-bp",
                            // Light mode: bg white, color gray-1 (#5f6b7c), shadow = $pt-elevation-shadow-1
                            // Shadow: 0 0 0 1px rgba(17,20,24,0.1), 0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)
                            "bg-white text-gray-1",
                            "shadow-[0_0_0_1px_rgba(17,20,24,0.1),_0_1px_3px_0_rgba(0,0,0,0.1),_0_1px_2px_-1px_rgba(0,0,0,0.1)]",
                            // Dark mode: bg dark-gray-3 (#2f343c), color gray-4 (#abb3bf), shadow = $pt-dark-elevation-shadow-1
                            // Shadow: inset 0 0 0 1px rgba(255,255,255,0.2), 0 1px 10px 0 rgba(0,0,0,0.2),
                            //         inset 0 0 0.5px 0 rgba(255,255,255,0.3), inset 0 0.5px 0 0 rgba(255,255,255,0.08),
                            //         0 1px 10px -1px rgba(0,0,0,0.2)
                            "dark:bg-dark-gray-3 dark:text-gray-4",
                            "dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2),_0_1px_10px_0_rgba(0,0,0,0.2),_inset_0_0_0.5px_0_rgba(255,255,255,0.3),_inset_0_0.5px_0_0_rgba(255,255,255,0.08),_0_1px_10px_-1px_rgba(0,0,0,0.2)]",
                            // font-weight: normal (keyboard caps inherit)
                            "font-normal",
                        )}
                    >
                        {modIcon ? (
                            <>
                                {/* Inherit the cap's text color (gray-1 / gray-4) — Icon defaults
                                    to text-foreground even at intent="none", so force currentColor. */}
                                <Icon icon={modIcon} size={16} aria-hidden className="!text-current" />
                                {key}
                            </>
                        ) : (
                            display
                        )}
                    </kbd>
                );
            })}
        </span>
    );
}

KeyCombo.displayName = "KeyCombo";

// ---------------------------------------------------------------------------
// HotkeysDialog
// ---------------------------------------------------------------------------

export interface HotkeyConfig {
    /** Human-readable label for the hotkey action, displayed on the left. */
    label: React.ReactNode;
    /** Keyboard combo string, e.g. `"mod+shift+n"`. Passed to `KeyCombo`. */
    combo: string;
    /**
     * Section/group name for this hotkey. Hotkeys with the same group are
     * rendered under a shared heading. Hotkeys without a group go under
     * `globalGroupName` (default: `"Global"`).
     */
    group?: string;
    /** Whether this is a global (app-level) hotkey. */
    global?: boolean;
}

export interface HotkeysDialogProps {
    /** Controlled open state. */
    open?: boolean;
    /** Called when open state changes. */
    onOpenChange?: (open: boolean) => void;
    /**
     * Pass the app's dark state so the portaled dialog inherits dark mode.
     * Matches the pattern used by Dialog/Alert/Drawer.
     */
    dark?: boolean;
    /** Dialog title. @default "Keyboard shortcuts" */
    title?: string;
    /** Array of hotkey configurations to display. */
    hotkeys: readonly HotkeyConfig[];
    /**
     * Group name for hotkeys that have `global: true` and no explicit group.
     * @default "Global"
     */
    globalGroupName?: string;
}

/**
 * A dialog listing keyboard shortcuts grouped by section.
 *
 * Renders a Blueprint-faithful hotkeys dialog with:
 * - Group headings (H4 style, 18px)
 * - Hotkey rows: label (left, flex-grow) + KeyCombo (right)
 * - Correct column padding (30px) and heading spacing (mb 20px, mt 40px after first)
 *
 * Reuses the existing `Dialog` for portal + dark-mode correctness. Pass `dark`
 * from DarkContext so the portaled content renders in the correct theme.
 *
 * @example
 * ```tsx
 * const dark = useContext(DarkContext);
 * <HotkeysDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   dark={dark}
 *   hotkeys={[
 *     { label: "Save", combo: "mod+s", group: "Global" },
 *     { label: "Find", combo: "mod+f", group: "Editor" },
 *   ]}
 * />
 * ```
 */
export function HotkeysDialog({
    open,
    onOpenChange,
    dark = false,
    title = "Keyboard shortcuts",
    hotkeys,
    globalGroupName = "Global",
}: HotkeysDialogProps) {
    // Normalize: hotkeys without a group get globalGroupName if they're global,
    // or globalGroupName by default (Blueprint: global && group==null → globalGroupName)
    const normalized = hotkeys.map((h) => ({
        ...h,
        group: h.global === true && h.group == null ? globalGroupName : (h.group ?? globalGroupName),
    }));

    // Sort: globals first, then alphabetically by group (Blueprint's Hotkeys.render sort)
    const sorted = [...normalized].sort((a, b) => {
        if (a.global !== b.global) return a.global ? -1 : 1;
        if (a.group && b.group) return a.group.localeCompare(b.group);
        return 0;
    });

    // Group by section
    const groups: Map<string, typeof sorted> = new Map();
    for (const h of sorted) {
        const key = h.group ?? globalGroupName;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(h);
    }

    return (
        <Dialog
            open={open}
            onOpenChange={onOpenChange}
            title={title}
            dark={dark}
            // Blueprint .bp6-hotkey-dialog: top: $pt-spacing * 10 = 40px from the top
            // We can't override portal positioning easily, but the dialog already centers.
            // padding-bottom: 0 → dialog has no footer, body handles padding.
            className="pb-0"
        >
            {/* Blueprint .bp6-dialog-body: margin:0 padding:0 (hotkey-dialog overrides default)
                We override DialogBody by rendering a plain div with the column inside.
                This matches Blueprint's DialogBody with margin:0 padding:0. */}
            <div
                data-compare="dialog-body"
                className={cn(
                    "flex-[1_1_auto] m-0 max-h-[70vh] overflow-auto p-0",
                )}
            >
                {/* Blueprint .bp6-hotkey-column: margin:auto; padding: $pt-spacing*7.5 = 30px */}
                <div
                    data-compare="hotkey-column"
                    className="mx-auto py-[30px] px-[30px]"
                >
                    {Array.from(groups.entries()).map(([groupName, groupHotkeys], groupIndex) => (
                        <div key={groupName}>
                            {/* Blueprint H4.bp6-heading: font-size 18px; line-height 21px;
                                margin-bottom: $pt-spacing*5 = 20px;
                                not(:first-child): margin-top: $pt-spacing*10 = 40px */}
                            <h4
                                // Only tag the FIRST group heading for the harness
                                data-compare={groupIndex === 0 ? "hotkey-group-heading" : undefined}
                                className={cn(
                                    "text-[18px] leading-[21px] font-semibold text-foreground m-0",
                                    // mb 20px always
                                    "mb-[20px]",
                                    // mt 40px for all groups after the first
                                    groupIndex > 0 && "mt-[40px]",
                                )}
                            >
                                {groupName}
                            </h4>
                            {/* Hotkey rows */}
                            {groupHotkeys.map((hotkey, rowIndex) => {
                                const isFirst = rowIndex === 0 && groupIndex === 0;
                                return (
                                    <div
                                        key={rowIndex}
                                        data-compare={isFirst ? "hotkey-row" : undefined}
                                        className={cn(
                                            // Blueprint .bp6-hotkey: display:flex; align-items:center;
                                            // justify-content:space-between; margin-left:0; margin-right:0
                                            "flex items-center justify-between mx-0",
                                            // not(:last-child): margin-bottom: $pt-spacing*2 = 8px
                                            rowIndex < groupHotkeys.length - 1 && "mb-[8px]",
                                        )}
                                    >
                                        {/* Blueprint .bp6-hotkey-label: flex-grow:1 */}
                                        <div
                                            data-compare={isFirst ? "hotkey-label" : undefined}
                                            className="flex-grow text-body text-foreground"
                                        >
                                            {hotkey.label}
                                        </div>
                                        {/* KeyCombo on the right */}
                                        <KeyCombo
                                            combo={hotkey.combo}
                                            data-compare={isFirst ? "hotkey-combo" : undefined}
                                            // Tag the first key cap of the first row for the harness
                                            _firstKeyCompare={isFirst ? "hotkey-key" : undefined}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </Dialog>
    );
}

HotkeysDialog.displayName = "HotkeysDialog";
