"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import type { DataTableColumnAlign } from "../data-table";
import { alignClass } from "./gutter";

/**
 * The inline editor for an editable data cell (Loop 5). When a cell enters edit
 * mode (double-click), the grid swaps its static value for this borderless input,
 * seeded with the current value, focused, and its text selected.
 *
 * Blueprint fidelity (`@blueprintjs/table` `.bp6-table-editable-text` +
 * core `.bp6-editable-text.bp6-editable-text-editing`):
 *   - the editor fills the cell (`inset:0; padding:0 8px`) over the cell surface,
 *   - the **editing focus ring** is the same box-shadow as a focused `InputGroup`:
 *     `inset 0 0 0 1px rgba(33,93,176,.752), 0 0 0 1px rgba(33,93,176,.752), inset 0 1px 1px rgba(17,20,24,.2)`
 *     (light) / `…rgba(138,187,255,.752)…` (dark) — captured by the `shadow-input-focus`
 *     token, so light/dark track Blueprint automatically.
 *
 * Lifecycle: **Enter or blur commits** (`onCommit`), **Esc reverts** (`onCancel`). A
 * `done` latch makes the blur that follows an Enter/Esc a no-op, so a commit never
 * double-fires. `mousedown`/`keydown` are stopped from bubbling so the grid's
 * selection-drag and keyboard-nav handlers don't react while editing.
 *
 * Loop 6: a commit carries a **move direction** so the grid can advance the focused cell
 * spreadsheet-style — Enter→down, Shift+Enter→up, Tab→right, Shift+Tab→left; a blur commits
 * in place (no move).
 *
 * This is deliberately **not** built on `editable-text.tsx`: that component owns its
 * own edit-mode lifecycle (click-to-edit, confirm/cancel) which fights the grid's
 * focused-cell model. Here the grid owns "which cell is editing" and this is a thin,
 * always-editing input.
 */
/** Direction to advance the focused cell after a keyboard commit. */
export type EditCommitMove = "up" | "down" | "left" | "right";

export interface EditableCellProps {
    /** The committed value to seed the editor with. */
    value: string;
    /** Column alignment, inherited so the editing text lines up with the resting text. */
    align?: DataTableColumnAlign;
    /**
     * Commit the edited value — fired on Enter, Tab, or blur. `move` is the direction to
     * advance the focused cell afterwards (Enter→down, Shift+Enter→up, Tab→right,
     * Shift+Tab→left); a blur commits in place with no `move`.
     */
    onCommit: (value: string, move?: EditCommitMove) => void;
    /** Discard the edit and revert — fired on Esc. */
    onCancel: () => void;
}

export function EditableCell({ value, align = "left", onCommit, onCancel }: EditableCellProps) {
    const [draft, setDraft] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);
    // Latch so the blur that follows an Enter/Esc doesn't fire a second (stale) commit.
    const doneRef = useRef(false);

    // Focus + select-all on mount so typing replaces the seeded value (Blueprint behavior).
    useLayoutEffect(() => {
        const el = inputRef.current;
        if (el) {
            el.focus();
            el.select();
        }
    }, []);

    const commit = (move?: EditCommitMove) => {
        if (doneRef.current) return;
        doneRef.current = true;
        onCommit(draft, move);
    };
    const cancel = () => {
        if (doneRef.current) return;
        doneRef.current = true;
        onCancel();
    };

    return (
        <input
            ref={inputRef}
            data-editable-cell
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => commit()}
            onKeyDown={(e) => {
                // Keep grid-level handlers (selection drag, keyboard nav) out of it.
                e.stopPropagation();
                if (e.key === "Enter") {
                    e.preventDefault();
                    commit(e.shiftKey ? "up" : "down");
                } else if (e.key === "Tab") {
                    e.preventDefault();
                    commit(e.shiftKey ? "left" : "right");
                } else if (e.key === "Escape") {
                    e.preventDefault();
                    cancel();
                }
            }}
            // A pointer-down inside the editor must not start a selection drag on the cell.
            onMouseDown={(e) => e.stopPropagation()}
            className={cn(
                // Blueprint `.bp6-table-editable-text` — fills the cell, 0 8px padding.
                "absolute inset-0 z-20 m-0 w-full appearance-none border-0 px-2 outline-none",
                // Cell surface so the editor reads as the cell itself (white / dark-gray-3).
                "bg-white text-[12px] text-foreground dark:bg-[#2f343c]",
                // The editing focus ring (== InputGroup focus shadow), both themes via token.
                "rounded-bp shadow-input-focus",
                alignClass(align),
            )}
        />
    );
}
