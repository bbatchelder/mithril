/* eslint-disable no-restricted-imports */
import { Fragment, useRef, useState } from "react";

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
    /**
     * Drop the dragged task into this column, positioned just before `anchorId`.
     * A null `anchorId` means "append to the end of the column".
     */
    onDrop: (columnId: ColumnId, anchorId: string | null) => void;
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
    // Index (0..tasks.length) where the dragged card would be inserted, or null.
    const [dropIndex, setDropIndex] = useState<number | null>(null);
    const zoneRef = useRef<HTMLDivElement>(null);

    // Map the pointer's Y to an insertion slot by comparing it against each
    // card's vertical midpoint. Returns tasks.length when below the last card.
    const computeDropIndex = (clientY: number): number => {
        const zone = zoneRef.current;
        if (!zone) return tasks.length;
        const cards = zone.querySelectorAll<HTMLElement>("[data-card]");
        for (let i = 0; i < cards.length; i++) {
            const rect = cards[i].getBoundingClientRect();
            if (clientY < rect.top + rect.height / 2) return i;
        }
        return cards.length;
    };

    const showLine = isOver && draggingId != null && dropIndex != null;
    const dropLine = <div className="h-0.5 rounded-full bg-blue-3" aria-hidden />;

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
                    className="inline-flex h-6 w-6 items-center justify-center rounded-mithril text-foreground-muted hover:bg-[var(--interactive-hover)]"
                    onClick={() => onAdd(id)}
                >
                    <Icon icon="plus" size={16} className="!text-current" />
                </button>
            </div>

            {/* Drop zone — spans the column's full height so a card can be
                dropped anywhere below the last card, not just on top of one. */}
            <div
                ref={zoneRef}
                onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    if (!isOver) setIsOver(true);
                    const next = computeDropIndex(e.clientY);
                    setDropIndex((prev) => (prev === next ? prev : next));
                }}
                onDragLeave={(e) => {
                    // Only clear when leaving the zone itself, not a child card.
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setIsOver(false);
                        setDropIndex(null);
                    }
                }}
                onDrop={(e) => {
                    e.preventDefault();
                    const anchorId = dropIndex != null ? tasks[dropIndex]?.id ?? null : null;
                    setIsOver(false);
                    setDropIndex(null);
                    onDrop(id, anchorId);
                }}
                className={
                    "flex min-h-[120px] flex-1 flex-col gap-2.5 rounded-mithril border border-dashed p-2 transition-colors " +
                    (isOver
                        ? "border-blue-3 bg-[var(--interactive-hover)]"
                        : "border-transparent")
                }
            >
                {tasks.map((task, i) => (
                    <Fragment key={task.id}>
                        {showLine && dropIndex === i && dropLine}
                        <div data-card>
                            <TaskCard
                                task={task}
                                dark={dark}
                                dragging={draggingId === task.id}
                                onOpen={onOpen}
                                onMove={onMove}
                                onDelete={onDelete}
                                onDragStart={onDragStart}
                                onDragEnd={onDragEnd}
                            />
                        </div>
                    </Fragment>
                ))}
                {showLine && dropIndex === tasks.length && dropLine}

                {tasks.length === 0 && !showLine && (
                    <div className="flex flex-1 flex-col items-center justify-center gap-1 py-6 text-center text-foreground-muted">
                        <Icon icon="inbox" size={20} className="!text-current opacity-60" />
                        <span className="text-body-sm">No tasks</span>
                    </div>
                )}
            </div>
        </div>
    );
}
