/* eslint-disable no-restricted-imports */
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Menu, MenuItem, MenuDivider } from "@/components/ui/menu";
import { MenuPopover } from "@/components/ui/popover";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Tag } from "@/components/ui/tag";
import { Tooltip } from "@/components/ui/tooltip";

import { Avatar } from "./Avatar";
import {
    type ColumnId,
    type Task,
    COLUMNS,
    LABEL_META,
    PRIORITY_ACCENT,
    PRIORITY_META,
    subtaskProgress,
} from "./data";

interface TaskCardProps {
    task: Task;
    dark: boolean;
    dragging: boolean;
    onOpen: (task: Task) => void;
    onMove: (task: Task, columnId: ColumnId) => void;
    onDelete: (task: Task) => void;
    onDragStart: (task: Task) => void;
    onDragEnd: () => void;
}

export function TaskCard({
    task,
    dark,
    dragging,
    onOpen,
    onMove,
    onDelete,
    onDragStart,
    onDragEnd,
}: TaskCardProps) {
    const priority = PRIORITY_META[task.priority];
    const progress = subtaskProgress(task);

    return (
        <Card
            elevation={1}
            interactive
            compact
            draggable
            onClick={() => onOpen(task)}
            onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", task.id);
                onDragStart(task);
            }}
            onDragEnd={onDragEnd}
            className={
                "relative cursor-pointer overflow-hidden pl-4 " +
                (dragging ? "opacity-40" : "")
            }
            aria-label={`${task.id}: ${task.title}`}
        >
            {/* Priority accent bar */}
            <span className={"absolute inset-y-0 left-0 w-1 " + PRIORITY_ACCENT[task.priority]} aria-hidden />

            {/* Top row: id + actions menu */}
            <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="font-mono text-body-sm text-foreground-muted">{task.id}</span>
                <MenuPopover
                    side="bottom"
                    align="end"
                    dark={dark}
                    content={
                        <Menu>
                            <MenuItem icon="edit" text="Open details" onClick={() => onOpen(task)} />
                            <MenuDivider title="Move to" />
                            {COLUMNS.filter((c) => c.id !== task.columnId).map((c) => (
                                <MenuItem
                                    key={c.id}
                                    icon="arrow-right"
                                    text={c.title}
                                    onClick={() => onMove(task, c.id)}
                                />
                            ))}
                            <MenuDivider />
                            <MenuItem icon="trash" text="Delete" intent="danger" onClick={() => onDelete(task)} />
                        </Menu>
                    }
                >
                    <button
                        type="button"
                        aria-label={`Actions for ${task.id}`}
                        className="-mr-1 inline-flex h-6 w-6 items-center justify-center rounded-mithril text-foreground-muted hover:bg-[var(--interactive-hover)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Icon icon="more" size={16} className="!text-current" />
                    </button>
                </MenuPopover>
            </div>

            {/* Title */}
            <p className="mb-2 text-body font-medium leading-snug text-foreground">{task.title}</p>

            {/* Labels */}
            {task.labels.length > 0 && (
                <div className="mb-2.5 flex flex-wrap gap-1">
                    {task.labels.map((id) => {
                        const meta = LABEL_META[id];
                        return (
                            <Tag key={id} minimal intent={meta.intent} icon={<Icon icon={meta.icon} size={11} className="!text-current" />}>
                                {meta.label}
                            </Tag>
                        );
                    })}
                </div>
            )}

            {/* Subtask progress */}
            {progress.total > 0 && (
                <div className="mb-2.5 flex items-center gap-2">
                    <ProgressBar
                        value={progress.ratio}
                        intent={progress.ratio === 1 ? "success" : "primary"}
                        stripes={false}
                        className="grow"
                    />
                    <span className="shrink-0 text-body-sm tabular-nums text-foreground-muted">
                        {progress.done}/{progress.total}
                    </span>
                </div>
            )}

            {/* Footer: priority + meta + assignee */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-foreground-muted">
                    <Tooltip content={`${priority.label} priority`} dark={dark}>
                        <span className="inline-flex items-center">
                            <Icon icon={priority.icon} size={14} className={tagTextClass(task.priority)} />
                        </span>
                    </Tooltip>
                    <span className="inline-flex items-center gap-1 text-body-sm">
                        <Icon icon="calendar" size={13} className="!text-current" />
                        {task.due}
                    </span>
                    {task.comments.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-body-sm">
                            <Icon icon="comment" size={13} className="!text-current" />
                            {task.comments.length}
                        </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-body-sm">
                        <Icon icon="symbol-diamond" size={12} className="!text-current" />
                        {task.points}
                    </span>
                </div>
                <Avatar memberId={task.assigneeId} size="md" />
            </div>
        </Card>
    );
}

/** Priority glyph color (matches the Tag intent text color). */
function tagTextClass(priority: Task["priority"]): string {
    switch (priority) {
        case "urgent":
            return "text-intent-danger-text";
        case "high":
            return "text-intent-warning-text";
        case "medium":
            return "text-intent-primary-text";
        default:
            return "text-foreground-muted";
    }
}
