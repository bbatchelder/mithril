/* eslint-disable no-restricted-imports */
import { useState } from "react";

import { Icon } from "@/components/ui/icon";

import { TaskCard } from "./TaskCard";
import { type ColumnId, type Task } from "./data";

interface BoardColumnProps {
    id: ColumnId;
    title: string;
    dotClass: string;
    tasks: Task[];
    dark: boolean;
    draggingId: string | null;
    onOpen: (task: Task) => void;
    onMove: (task: Task, columnId: ColumnId) => void;
    onDelete: (task: Task) => void;
    onAdd: (columnId: ColumnId) => void;
    onDragStart: (task: Task) => void;
    onDragEnd: () => void;
    /** Drop a task (by id) into this column. */
    onDrop: (columnId: ColumnId) => void;
}

export function BoardColumn({
    id,
    title,
    dotClass,
    tasks,
    dark,
    draggingId,
    onOpen,
    onMove,
    onDelete,
    onAdd,
    onDragStart,
    onDragEnd,
    onDrop,
}: BoardColumnProps) {
    const [isOver, setIsOver] = useState(false);

    return (
        <div className="flex w-[300px] shrink-0 flex-col">
            {/* Column header */}
            <div className="mb-2 flex items-center gap-2 px-1">
                <span className={"h-2 w-2 shrink-0 rounded-full " + dotClass} aria-hidden />
                <h3 className="text-body font-semibold text-foreground">{title}</h3>
                <span className="rounded-full bg-[var(--interactive-hover)] px-1.5 text-body-sm tabular-nums text-foreground-muted">
                    {tasks.length}
                </span>
                <div className="grow" />
                <button
                    type="button"
                    aria-label={`Add task to ${title}`}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-bp text-foreground-muted hover:bg-[var(--interactive-hover)]"
                    onClick={() => onAdd(id)}
                >
                    <Icon icon="plus" size={16} className="!text-current" />
                </button>
            </div>

            {/* Drop zone */}
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    if (!isOver) setIsOver(true);
                }}
                onDragLeave={(e) => {
                    // Only clear when leaving the zone itself, not a child card.
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsOver(false);
                }}
                onDrop={(e) => {
                    e.preventDefault();
                    setIsOver(false);
                    onDrop(id);
                }}
                className={
                    "flex min-h-[120px] flex-1 flex-col gap-2.5 rounded-bp border border-dashed p-2 transition-colors " +
                    (isOver
                        ? "border-blue-3 bg-[var(--interactive-hover)]"
                        : "border-transparent")
                }
            >
                {tasks.map((task) => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        dark={dark}
                        dragging={draggingId === task.id}
                        onOpen={onOpen}
                        onMove={onMove}
                        onDelete={onDelete}
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                    />
                ))}

                {tasks.length === 0 && (
                    <div className="flex flex-1 flex-col items-center justify-center gap-1 py-6 text-center text-foreground-muted">
                        <Icon icon="inbox" size={20} className="!text-current opacity-60" />
                        <span className="text-body-sm">No tasks</span>
                    </div>
                )}
            </div>
        </div>
    );
}
