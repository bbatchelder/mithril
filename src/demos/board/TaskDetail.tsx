/* eslint-disable no-restricted-imports */
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Divider } from "@/components/ui/divider";
import { Drawer, DrawerBody } from "@/components/ui/drawer";
import { EditableText } from "@/components/ui/editable-text";
import { Icon } from "@/components/ui/icon";
import { InputGroup } from "@/components/ui/input-group";
import { MenuItem } from "@/components/ui/menu";
import { MultiSelect } from "@/components/ui/multi-select";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select } from "@/components/ui/select";
import { Tabs, Tab } from "@/components/ui/tabs";
import { Tag } from "@/components/ui/tag";
import { TextArea } from "@/components/ui/text-area";

import { Avatar } from "./Avatar";
import {
    type ColumnId,
    type LabelId,
    type Priority,
    type Task,
    ALL_LABELS,
    COLUMNS,
    LABEL_META,
    MEMBERS,
    MEMBER_BY_ID,
    PRIORITY_META,
    PRIORITY_ORDER,
    memberName,
    subtaskProgress,
} from "./data";

interface TaskDetailProps {
    task: Task | null;
    isOpen: boolean;
    dark: boolean;
    onClose: () => void;
    onPatch: (id: string, patch: Partial<Task>) => void;
    onToggleSubtask: (id: string, subtaskId: string) => void;
    onAddSubtask: (id: string, text: string) => void;
    onAddComment: (id: string, body: string) => void;
    onDelete: (task: Task) => void;
}

const ASSIGNEE_OPTIONS: (string | null)[] = [null, ...MEMBERS.map((m) => m.id)];

function MetaField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-body-sm font-medium text-foreground-muted">{label}</span>
            {children}
        </div>
    );
}

function DetailsTab({ task, dark, onPatch, onToggleSubtask, onAddSubtask }: {
    task: Task;
    dark: boolean;
    onPatch: TaskDetailProps["onPatch"];
    onToggleSubtask: TaskDetailProps["onToggleSubtask"];
    onAddSubtask: TaskDetailProps["onAddSubtask"];
}) {
    const [newSubtask, setNewSubtask] = useState("");
    const progress = subtaskProgress(task);
    const availableLabels = ALL_LABELS.filter((id) => !task.labels.includes(id));

    const addSubtask = () => {
        const text = newSubtask.trim();
        if (!text) return;
        onAddSubtask(task.id, text);
        setNewSubtask("");
    };

    return (
        <div className="flex flex-col gap-5">
            {/* Description */}
            <MetaField label="Description">
                <EditableText
                    multiline
                    minLines={2}
                    value={task.description}
                    placeholder="Add a description…"
                    onConfirm={(v) => onPatch(task.id, { description: v })}
                    className="text-body text-foreground"
                />
            </MetaField>

            <Divider className="m-0" />

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                <MetaField label="Assignee">
                    <Select<string | null>
                        items={ASSIGNEE_OPTIONS}
                        filterable
                        dark={dark}
                        placeholder="Search people…"
                        selectedItem={task.assigneeId}
                        itemPredicate={(q, item) => memberName(item).toLowerCase().includes(q.toLowerCase())}
                        onItemSelect={(v) => onPatch(task.id, { assigneeId: v })}
                        itemRenderer={(item, { modifiers, handleClick }) => (
                            <MenuItem
                                key={item ?? "unassigned"}
                                text={memberName(item)}
                                active={modifiers.active}
                                icon={item === task.assigneeId ? "tick" : undefined}
                                onClick={handleClick}
                            />
                        )}
                    >
                        <Button
                            variant="outlined"
                            fill
                            className="justify-between"
                            icon={<Avatar memberId={task.assigneeId} size="sm" />}
                            endIcon={<Icon icon="caret-down" className="!text-current" />}
                        >
                            <span className="grow text-left">{memberName(task.assigneeId)}</span>
                        </Button>
                    </Select>
                </MetaField>

                <MetaField label="Status">
                    <Select<ColumnId>
                        items={COLUMNS.map((c) => c.id)}
                        filterable={false}
                        dark={dark}
                        selectedItem={task.columnId}
                        onItemSelect={(v) => onPatch(task.id, { columnId: v })}
                        itemRenderer={(id, { modifiers, handleClick }) => (
                            <MenuItem
                                key={id}
                                text={COLUMNS.find((c) => c.id === id)?.title}
                                active={modifiers.active}
                                icon={id === task.columnId ? "tick" : undefined}
                                onClick={handleClick}
                            />
                        )}
                    >
                        <Button
                            variant="outlined"
                            fill
                            className="justify-between"
                            endIcon={<Icon icon="caret-down" className="!text-current" />}
                        >
                            <span className="grow text-left">{COLUMNS.find((c) => c.id === task.columnId)?.title}</span>
                        </Button>
                    </Select>
                </MetaField>

                <MetaField label="Priority">
                    <SegmentedControl
                        options={PRIORITY_ORDER.map((p) => ({ label: PRIORITY_META[p].label, value: p }))}
                        value={task.priority}
                        onValueChange={(v) => onPatch(task.id, { priority: v as Priority })}
                    />
                </MetaField>

                <MetaField label="Due · Points">
                    <div className="flex items-center gap-2">
                        <Tag minimal icon={<Icon icon="calendar" size={12} className="!text-current" />}>
                            {task.due}
                        </Tag>
                        <Tag minimal icon={<Icon icon="symbol-diamond" size={12} className="!text-current" />}>
                            {task.points} pts
                        </Tag>
                    </div>
                </MetaField>
            </div>

            <MetaField label="Labels">
                <MultiSelect<LabelId>
                    items={availableLabels}
                    selectedItems={task.labels}
                    dark={dark}
                    fill
                    placeholder={task.labels.length ? "" : "Add labels…"}
                    tagRenderer={(id) => LABEL_META[id].label}
                    tagProps={(id) => ({ minimal: true, intent: LABEL_META[id].intent })}
                    onItemSelect={(id) =>
                        onPatch(task.id, { labels: task.labels.includes(id) ? task.labels : [...task.labels, id] })
                    }
                    onRemove={(id) => onPatch(task.id, { labels: task.labels.filter((l) => l !== id) })}
                    itemPredicate={(q, id) => LABEL_META[id].label.toLowerCase().includes(q.toLowerCase())}
                    itemRenderer={(id, { modifiers, handleClick }) => (
                        <MenuItem
                            key={id}
                            text={
                                <Tag minimal intent={LABEL_META[id].intent} icon={<Icon icon={LABEL_META[id].icon} size={11} className="!text-current" />}>
                                    {LABEL_META[id].label}
                                </Tag>
                            }
                            active={modifiers.active}
                            onClick={handleClick}
                        />
                    )}
                />
            </MetaField>

            <Divider className="m-0" />

            {/* Subtasks / checklist */}
            <MetaField label={`Checklist · ${progress.done}/${progress.total}`}>
                {progress.total > 0 && (
                    <ProgressBar
                        value={progress.ratio}
                        intent={progress.ratio === 1 ? "success" : "primary"}
                        stripes={false}
                        className="mb-2"
                    />
                )}
                <div className="flex flex-col">
                    {task.subtasks.map((s) => (
                        <Checkbox
                            key={s.id}
                            label={
                                <span className={s.done ? "text-foreground-muted line-through" : "text-foreground"}>
                                    {s.text}
                                </span>
                            }
                            checked={s.done}
                            onChange={() => onToggleSubtask(task.id, s.id)}
                        />
                    ))}
                    {progress.total === 0 && (
                        <span className="mb-2 text-body-sm italic text-foreground-muted">No checklist items yet.</span>
                    )}
                </div>
                <div className="mt-1 flex items-center gap-2">
                    <InputGroup
                        leftIcon="plus"
                        placeholder="Add a checklist item…"
                        value={newSubtask}
                        fill
                        onChange={(e) => setNewSubtask(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") addSubtask();
                        }}
                    />
                    <Button variant="outlined" disabled={!newSubtask.trim()} onClick={addSubtask}>
                        Add
                    </Button>
                </div>
            </MetaField>
        </div>
    );
}

function ActivityTab({ task, onAddComment }: { task: Task; onAddComment: TaskDetailProps["onAddComment"] }) {
    const [draft, setDraft] = useState("");

    const post = () => {
        const body = draft.trim();
        if (!body) return;
        onAddComment(task.id, body);
        setDraft("");
    };

    return (
        <div className="flex flex-col gap-4">
            {task.comments.length === 0 && (
                <span className="text-body-sm italic text-foreground-muted">No activity yet. Start the conversation.</span>
            )}
            {task.comments.map((c) => (
                <div key={c.id} className="flex gap-2.5">
                    <Avatar memberId={c.authorId} size="md" className="mt-0.5" />
                    <div className="flex min-w-0 flex-col gap-0.5">
                        <div className="flex items-baseline gap-2">
                            <span className="text-body font-medium text-foreground">{MEMBER_BY_ID[c.authorId]?.name ?? "Unknown"}</span>
                            <span className="text-body-sm text-foreground-muted">{c.timestamp}</span>
                        </div>
                        <p className="text-body text-foreground">{c.body}</p>
                    </div>
                </div>
            ))}

            <Divider className="m-0" />

            <div className="flex flex-col gap-2">
                <TextArea
                    placeholder="Write a comment…"
                    value={draft}
                    fill
                    rows={3}
                    onChange={(e) => setDraft(e.target.value)}
                />
                <div className="flex justify-end">
                    <Button
                        intent="primary"
                        disabled={!draft.trim()}
                        icon={<Icon icon="chat" className="!text-current" />}
                        onClick={post}
                    >
                        Comment
                    </Button>
                </div>
            </div>
        </div>
    );
}

export function TaskDetail({
    task,
    isOpen,
    dark,
    onClose,
    onPatch,
    onToggleSubtask,
    onAddSubtask,
    onAddComment,
    onDelete,
}: TaskDetailProps) {
    return (
        <Drawer open={isOpen} onOpenChange={(next) => !next && onClose()} position="right" closeButton={false} dark={dark}>
            {task != null && (
                <>
                    {/* Header. The action buttons are placed FIRST in the DOM (with the Close
                        button first of all) so the drawer's initial focus lands on Close rather
                        than dropping the title EditableText into edit mode. `order-*` restores the
                        intended visual layout (title left, actions right). */}
                    <div className="flex items-start justify-between gap-3 border-b border-divider px-5 py-4">
                        <div className="order-2 flex shrink-0 items-center gap-1">
                            <Button
                                className="order-last"
                                variant="minimal"
                                aria-label="Close panel"
                                icon={<Icon icon="cross" className="!text-current" />}
                                onClick={onClose}
                            />
                            <Button
                                variant="minimal"
                                intent="danger"
                                aria-label="Delete task"
                                icon={<Icon icon="trash" className="!text-current" />}
                                onClick={() => onDelete(task)}
                            />
                        </div>
                        <div className="order-1 flex min-w-0 flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-body-sm text-foreground-muted">{task.id}</span>
                                <Tag minimal intent={PRIORITY_META[task.priority].intent} icon={<Icon icon={PRIORITY_META[task.priority].icon} size={11} className="!text-current" />}>
                                    {PRIORITY_META[task.priority].label}
                                </Tag>
                            </div>
                            <EditableText
                                value={task.title}
                                placeholder="Task title"
                                onConfirm={(v) => v.trim() && onPatch(task.id, { title: v.trim() })}
                                className="text-heading-sm font-semibold text-foreground"
                            />
                        </div>
                    </div>

                    <DrawerBody className="px-5 pb-5">
                        <Tabs id={`task-tabs-${task.id}`} defaultSelectedTabId="details">
                            <Tab
                                id="details"
                                title="Details"
                                panel={
                                    <DetailsTab
                                        task={task}
                                        dark={dark}
                                        onPatch={onPatch}
                                        onToggleSubtask={onToggleSubtask}
                                        onAddSubtask={onAddSubtask}
                                    />
                                }
                            />
                            <Tab
                                id="activity"
                                title={`Activity${task.comments.length ? ` (${task.comments.length})` : ""}`}
                                panel={<ActivityTab task={task} onAddComment={onAddComment} />}
                            />
                        </Tabs>
                    </DrawerBody>
                </>
            )}
        </Drawer>
    );
}
