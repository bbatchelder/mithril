import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
    comboMatches,
    HotkeysProvider,
    parseKeyCombo,
    useHotkeys,
    type HotkeyConfig,
} from "../hotkeys";

/**
 * Behavior tests for the useHotkeys engine. The visual harness can't see key
 * binding/dispatch, so this is the regression net. We drive the *global*
 * document-level listener with fireEvent (deterministic over the bound target)
 * and exercise local hotkeys via the returned handleKeyDown/handleKeyUp.
 *
 * Combos use explicit `ctrl`/`shift` rather than the platform-dependent `mod`
 * so assertions don't hinge on jsdom's navigator.platform.
 */

// --- pure parser ----------------------------------------------------------

describe("parseKeyCombo / comboMatches", () => {
    it("parses modifiers into a bitmask and keeps the lone action key", () => {
        expect(parseKeyCombo("ctrl+b")).toEqual({ modifiers: 2, key: "b" });
        // order/whitespace are irrelevant — modifiers are a bitmask
        expect(parseKeyCombo("shift + ctrl + b")).toEqual(parseKeyCombo("ctrl+shift+b"));
    });

    it("expands shifted symbols to shift + the unshifted key", () => {
        // "?" is shift+"/", so it must parse identically
        expect(parseKeyCombo("?")).toEqual(parseKeyCombo("shift+/"));
        expect(parseKeyCombo("?")).toEqual({ modifiers: 8, key: "/" });
    });

    it("resolves aliases (esc → escape, return → enter, up → arrowup)", () => {
        expect(parseKeyCombo("esc")).toEqual({ modifiers: 0, key: "escape" });
        expect(parseKeyCombo("return")).toEqual({ modifiers: 0, key: "enter" });
        expect(parseKeyCombo("up")).toEqual({ modifiers: 0, key: "arrowup" });
    });

    it("throws on a malformed combo", () => {
        expect(() => parseKeyCombo("ctrl+")).toThrow();
    });

    it("comboMatches compares modifier mask and key", () => {
        expect(comboMatches({ modifiers: 2, key: "b" }, { modifiers: 2, key: "b" })).toBe(true);
        expect(comboMatches({ modifiers: 2, key: "b" }, { modifiers: 0, key: "b" })).toBe(false);
        expect(comboMatches({ modifiers: 2, key: "b" }, { modifiers: 2, key: "c" })).toBe(false);
    });
});

// --- harness ---------------------------------------------------------------

/** Mounts a component that registers the given hotkeys; spreads local handlers on a div. */
function Harness({ hotkeys }: { hotkeys: HotkeyConfig[] }) {
    const { handleKeyDown, handleKeyUp } = useHotkeys(hotkeys);
    return (
        <div>
            <div data-testid="local" tabIndex={0} onKeyDown={handleKeyDown} onKeyUp={handleKeyUp}>
                local target
            </div>
            <input data-testid="field" aria-label="field" />
        </div>
    );
}

function renderWithProvider(hotkeys: HotkeyConfig[]) {
    return render(
        <HotkeysProvider>
            <Harness hotkeys={hotkeys} />
        </HotkeysProvider>,
    );
}

// --- global dispatch -------------------------------------------------------

describe("useHotkeys — global dispatch", () => {
    it("fires a global hotkey's onKeyDown when its combo is pressed anywhere", () => {
        const onKeyDown = vi.fn();
        renderWithProvider([{ combo: "ctrl+b", label: "Bold", global: true, onKeyDown }]);

        fireEvent.keyDown(document, { key: "b", code: "KeyB", ctrlKey: true });

        expect(onKeyDown).toHaveBeenCalledTimes(1);
    });

    it("fires onKeyUp on release", () => {
        const onKeyUp = vi.fn();
        renderWithProvider([{ combo: "ctrl+b", label: "Bold", global: true, onKeyUp }]);

        fireEvent.keyUp(document, { key: "b", code: "KeyB", ctrlKey: true });

        expect(onKeyUp).toHaveBeenCalledTimes(1);
    });

    it("does not fire when the combo doesn't match", () => {
        const onKeyDown = vi.fn();
        renderWithProvider([{ combo: "ctrl+b", label: "Bold", global: true, onKeyDown }]);

        fireEvent.keyDown(document, { key: "b", code: "KeyB" }); // no ctrl
        fireEvent.keyDown(document, { key: "c", code: "KeyC", ctrlKey: true }); // wrong key

        expect(onKeyDown).not.toHaveBeenCalled();
    });

    it("removes the global listener on unmount", () => {
        const onKeyDown = vi.fn();
        const { unmount } = renderWithProvider([{ combo: "ctrl+b", label: "Bold", global: true, onKeyDown }]);

        unmount();
        fireEvent.keyDown(document, { key: "b", code: "KeyB", ctrlKey: true });

        expect(onKeyDown).not.toHaveBeenCalled();
    });
});

// --- text-input exclusion --------------------------------------------------

describe("useHotkeys — text input exclusion", () => {
    it("ignores the hotkey while focus is inside a text input by default", () => {
        const onKeyDown = vi.fn();
        renderWithProvider([{ combo: "ctrl+b", label: "Bold", global: true, onKeyDown }]);

        const field = screen.getByTestId("field");
        fireEvent.keyDown(field, { key: "b", code: "KeyB", ctrlKey: true });

        expect(onKeyDown).not.toHaveBeenCalled();
    });

    it("fires inside a text input when allowInInput is set", () => {
        const onKeyDown = vi.fn();
        renderWithProvider([{ combo: "ctrl+b", label: "Bold", global: true, allowInInput: true, onKeyDown }]);

        const field = screen.getByTestId("field");
        fireEvent.keyDown(field, { key: "b", code: "KeyB", ctrlKey: true });

        expect(onKeyDown).toHaveBeenCalledTimes(1);
    });
});

// --- flags -----------------------------------------------------------------

describe("useHotkeys — flags", () => {
    it("does not fire a disabled hotkey", () => {
        const onKeyDown = vi.fn();
        renderWithProvider([{ combo: "ctrl+b", label: "Bold", global: true, disabled: true, onKeyDown }]);

        fireEvent.keyDown(document, { key: "b", code: "KeyB", ctrlKey: true });

        expect(onKeyDown).not.toHaveBeenCalled();
    });

    it("calls preventDefault when preventDefault is set", () => {
        renderWithProvider([{ combo: "ctrl+b", label: "Bold", global: true, preventDefault: true, onKeyDown: vi.fn() }]);

        // fireEvent returns false if the event's default was prevented.
        const notPrevented = fireEvent.keyDown(document, { key: "b", code: "KeyB", ctrlKey: true });

        expect(notPrevented).toBe(false);
    });
});

// --- local hotkeys ---------------------------------------------------------

describe("useHotkeys — local hotkeys", () => {
    it("fires only via the spread handler, not the global document listener", () => {
        const onKeyDown = vi.fn();
        renderWithProvider([{ combo: "ctrl+b", label: "Bold", onKeyDown }]); // no global

        // global path: nothing happens
        fireEvent.keyDown(document, { key: "b", code: "KeyB", ctrlKey: true });
        expect(onKeyDown).not.toHaveBeenCalled();

        // local path: handler on the target element fires
        fireEvent.keyDown(screen.getByTestId("local"), { key: "b", code: "KeyB", ctrlKey: true });
        expect(onKeyDown).toHaveBeenCalledTimes(1);
    });
});

// --- help dialog -----------------------------------------------------------

describe("useHotkeys — help dialog", () => {
    it("opens the generated dialog on '?' and lists registered hotkeys", () => {
        renderWithProvider([
            { combo: "ctrl+b", label: "Bold", global: true, onKeyDown: vi.fn() },
            { combo: "ctrl+i", label: "Italicize", global: true, onKeyDown: vi.fn() },
        ]);

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

        fireEvent.keyDown(document, { key: "?", code: "Slash", shiftKey: true });

        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByText("Bold")).toBeInTheDocument();
        expect(screen.getByText("Italicize")).toBeInTheDocument();
    });

    it("does not open the dialog on '?' while typing in a text input", () => {
        renderWithProvider([{ combo: "ctrl+b", label: "Bold", global: true, onKeyDown: vi.fn() }]);

        const field = screen.getByTestId("field");
        fireEvent.keyDown(field, { key: "?", code: "Slash", shiftKey: true });

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
});
