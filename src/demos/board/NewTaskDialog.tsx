/* eslint-disable no-restricted-imports */
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { FormGroup } from "@/components/ui/form-group";
import { Icon } from "@/components/ui/icon";
import { InputGroup } from "@/components/ui/input-group";
import { MenuItem } from "@/components/ui/menu";
import { MultiSelect } from "@/components/ui/multi-select";
import { NumericInput } from "@/components/ui/numeric-input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tag } from "@/components/ui/tag";
import { TextArea } from "@/components/ui/text-area";

import { Avatar } from "./Avatar";
import {
    type ColumnId,
    type LabelId,
    type Priority,
    ALL_LABELS,
    COLUMNS,
    CURRENT_USER_ID,
    LABEL_META,
    MEMBERS,
    MEMBER_BY_ID,
    PRIORITY_META,
    PRIORITY_ORDER,
    memberName,
} from "./data";

export interface NewTaskDraft {
    title: string;
    description: string;
    columnId: ColumnId;
    priority: Priority;
    labels: LabelId[];
    assigneeId: string | null;
    points: number;
}

interface NewTaskDialogProps {
    open: boolean;
    dark: boolean;
    /** Column the task is created in (set by which column's "+" was clicked). */
    defaultColumn: ColumnId;
    onClose: () => void;
    onCreate: (draft: NewTaskDraft) => void;
}

const ASSIGNEE_OPTIONS: (string | null)[] = [null, ...MEMBERS.map((m) => m.id)];

export function NewTaskDialog({ open, dark, defaultColumn, onClose, onCreate }: NewTaskDialogProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [columnId, setColumnId] = useState<ColumnId>(defaultColumn);
    const [priority, setPriority] = useState<Priority>("medium");
    const [labels, setLabels] = useState<LabelId[]>([]);
    const [assigneeId, setAssigneeId] = useState<string | null>(null);
    const [points, setPoints] = useState(3);

    // Reset the form each time the dialog opens (and adopt the originating column).
    useEffect(() => {
        if (open) {
            setTitle("");
            setDescription("");
            setColumnId(defaultColumn);
            setPriority("medium");
            setLabels([]);
            setAssigneeId(null);
            setPoints(3);
        }
    }, [open, defaultColumn]);

    const canCreate = title.trim().length > 0;

    const submit = () => {
        if (!canCreate) return;
        onCreate({ title: title.trim(), description: description.trim(), columnId, priority, labels, assigneeId, points });
    };

    const availableLabels = ALL_LABELS.filter((id) => !labels.includes(id));

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => !next && onClose()}
            title="New task"
            icon={<Icon icon="plus" />}
            dark={dark}
            className="w-[560px]"
        >
            <DialogBody>
                <FormGroup label="Title" labelInfo="(required)" labelFor="new-task-title">
                    <InputGroup
                        id="new-task-title"
                        placeholder="Short, descriptive summary…"
                        value={title}
                        fill
                        autoFocus
                        onChange={(e) => setTitle(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") submit();
                        }}
                    />
                </FormGroup>

                <FormGroup label="Description" labelFor="new-task-desc">
                    <TextArea
                        id="new-task-desc"
                        placeholder="Add context, acceptance criteria, links…"
                        value={description}
                        fill
                        rows={3}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </FormGroup>

                <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                    <FormGroup label="Status">
                        <SegmentedControl
                            options={COLUMNS.map((c) => ({ label: c.title, value: c.id }))}
                            value={columnId}
                            onValueChange={(v) => setColumnId(v as ColumnId)}
                        />
                    </FormGroup>

                    <FormGroup label="Priority">
                        <SegmentedControl
                            options={PRIORITY_ORDER.map((p) => ({ label: PRIORITY_META[p].label, value: p }))}
                            value={priority}
                            onValueChange={(v) => setPriority(v as Priority)}
                        />
                    </FormGroup>

                    <FormGroup label="Assignee">
                        <Select<string | null>
                            items={ASSIGNEE_OPTIONS}
                            filterable
                            dark={dark}
                            placeholder="Search people…"
                            selectedItem={assigneeId}
                            itemPredicate={(q, item) => memberName(item).toLowerCase().includes(q.toLowerCase())}
                            onItemSelect={(v) => setAssigneeId(v)}
                            itemRenderer={(item, { modifiers, handleClick }) => (
                                <MenuItem
                                    key={item ?? "unassigned"}
                                    text={memberName(item)}
                                    active={modifiers.active}
                                    icon={item === assigneeId ? "tick" : undefined}
                                    onClick={handleClick}
                                />
                            )}
                        >
                            <Button
                                variant="outlined"
                                fill
                                className="justify-between"
                                icon={<Avatar memberId={assigneeId} size="sm" />}
                                endIcon={<Icon icon="caret-down" className="!text-current" />}
                            >
                                <span className="grow text-left">{memberName(assigneeId)}</span>
                            </Button>
                        </Select>
                    </FormGroup>

                    <FormGroup label="Story points">
                        <NumericInput
                            value={points}
                            min={0}
                            max={21}
                            stepSize={1}
                            className="w-28"
                            onValueChange={(n) => setPoints(Number.isNaN(n) ? 0 : n)}
                        />
                    </FormGroup>
                </div>

                <FormGroup label="Labels">
                    <MultiSelect<LabelId>
                        items={availableLabels}
                        selectedItems={labels}
                        dark={dark}
                        fill
                        placeholder={labels.length ? "" : "Add labels…"}
                        tagRenderer={(id) => LABEL_META[id].label}
                        tagProps={(id) => ({ minimal: true, intent: LABEL_META[id].intent })}
                        onItemSelect={(id) => setLabels((prev) => (prev.includes(id) ? prev : [...prev, id]))}
                        onRemove={(id) => setLabels((prev) => prev.filter((l) => l !== id))}
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
                </FormGroup>

                <Switch
                    label="Assign to me"
                    checked={assigneeId === CURRENT_USER_ID}
                    onChange={(e) => setAssigneeId(e.target.checked ? CURRENT_USER_ID : null)}
                />
            </DialogBody>

            <DialogFooter
                actions={
                    <>
                        <Button variant="minimal" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button intent="primary" disabled={!canCreate} onClick={submit}>
                            Create task
                        </Button>
                    </>
                }
            >
                {assigneeId && (
                    <span className="inline-flex items-center gap-1.5 text-body-sm text-foreground-muted">
                        <Avatar memberId={assigneeId} size="sm" />
                        {MEMBER_BY_ID[assigneeId]?.name}
                    </span>
                )}
            </DialogFooter>
        </Dialog>
    );
}
