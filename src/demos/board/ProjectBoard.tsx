/* eslint-disable no-restricted-imports */
import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { InputGroup } from "@/components/ui/input-group";
import { Menu, MenuItem, MenuDivider } from "@/components/ui/menu";
import { MultiSelect } from "@/components/ui/multi-select";
import { Navbar, NavbarGroup, NavbarHeading, NavbarDivider } from "@/components/ui/navbar";
import { MenuPopover } from "@/components/ui/popover";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tag } from "@/components/ui/tag";
import { Tooltip } from "@/components/ui/tooltip";
import { useToaster } from "@/components/ui/toast";
import { useDark } from "@/lib/dark-context";
import { AppChromeControls } from "@/lib/app-chrome";

import { Avatar } from "./Avatar";
import { BoardColumn } from "./BoardColumn";
import { NewTaskDialog, type NewTaskDraft } from "./NewTaskDialog";
import { TaskDetail } from "./TaskDetail";
import {
    type ColumnId,
    type LabelId,
    type Task,
    ALL_LABELS,
    COLUMNS,
    CURRENT_USER_ID,
    LABEL_META,
    MEMBERS,
    MEMBER_BY_ID,
    TASKS,
    memberName,
} from "./data";

// "all" = no filter (every assignee), null = unassigned tasks, otherwise a member id.
const ASSIGNEE_FILTER_OPTIONS: (string | null)[] = ["all", null, ...MEMBERS.map((m) => m.id)];

const assigneeLabel = (item: string | null): string =>
    item === "all" ? "All assignees" : memberName(item);

export function ProjectBoard() {
    const toaster = useToaster();
    const dark = useDark();

    const [tasks, setTasks] = useState<Task[]>(TASKS);

    // Filters
    const [search, setSearch] = useState("");
    const [assigneeFilter, setAssigneeFilter] = useState<string | null | "all">("all");
    const [labelFilter, setLabelFilter] = useState<LabelId[]>([]);
    const [onlyMine, setOnlyMine] = useState(false);

    // Drag state
    const [draggingTask, setDraggingTask] = useState<Task | null>(null);

    // New-task dialog
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogColumn, setDialogColumn] = useState<ColumnId>("backlog");

    // Detail drawer
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Monotonic counters for generated ids (deterministic across a session).
    const counter = useRef(0);
    const nextId = (prefix: string) => `${prefix}-${(counter.current += 1)}`;

    const selected = useMemo(
        () => tasks.find((t) => t.id === selectedId) ?? null,
        [tasks, selectedId],
    );

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return tasks.filter((t) => {
            if (onlyMine && t.assigneeId !== CURRENT_USER_ID) return false;
            if (assigneeFilter !== "all" && t.assigneeId !== assigneeFilter) return false;
            if (labelFilter.length > 0 && !labelFilter.some((l) => t.labels.includes(l))) return false;
            if (q) {
                const hay = `${t.id} ${t.title} ${t.description}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [tasks, search, assigneeFilter, labelFilter, onlyMine]);

    const byColumn = useMemo(() => {
        const map: Record<ColumnId, Task[]> = { backlog: [], "in-progress": [], review: [], done: [] };
        for (const t of filtered) map[t.columnId].push(t);
        return map;
    }, [filtered]);

    // Sprint progress: completed story points vs total (across all tasks).
    const sprint = useMemo(() => {
        const total = tasks.reduce((sum, t) => sum + t.points, 0);
        const done = tasks.filter((t) => t.columnId === "done").reduce((sum, t) => sum + t.points, 0);
        return { done, total, ratio: total === 0 ? 0 : done / total };
    }, [tasks]);

    const activeFilterCount =
        (assigneeFilter !== "all" ? 1 : 0) + (labelFilter.length > 0 ? 1 : 0) + (onlyMine ? 1 : 0) + (search.trim() ? 1 : 0);

    // ── Mutations ────────────────────────────────────────────────────────────
    const patchTask = (id: string, patch: Partial<Task>) =>
        setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));

    const moveTask = (task: Task, columnId: ColumnId) => {
        if (task.columnId === columnId) return;
        patchTask(task.id, { columnId });
        toaster.show({
            intent: "primary",
            icon: "arrow-right",
            message: `${task.id} moved to ${COLUMNS.find((c) => c.id === columnId)?.title}.`,
        });
    };

    // Drop a dragged task into `columnId`, positioned just before `anchorId`
    // (null → end of the column). Handles both cross-column moves and
    // same-column reordering by splicing the task into the flat `tasks` array.
    const reorderTask = (task: Task, columnId: ColumnId, anchorId: string | null) => {
        if (anchorId === task.id) return; // dropped back onto its own slot
        const changedColumn = task.columnId !== columnId;
        setTasks((prev) => {
            const without = prev.filter((t) => t.id !== task.id);
            const moved: Task = { ...task, columnId };
            if (anchorId) {
                const idx = without.findIndex((t) => t.id === anchorId);
                if (idx !== -1) return [...without.slice(0, idx), moved, ...without.slice(idx)];
            }
            // Append after the last task already in this column (or at the very end).
            let lastIdx = -1;
            without.forEach((t, i) => {
                if (t.columnId === columnId) lastIdx = i;
            });
            return [...without.slice(0, lastIdx + 1), moved, ...without.slice(lastIdx + 1)];
        });
        if (changedColumn) {
            toaster.show({
                intent: "primary",
                icon: "arrow-right",
                message: `${task.id} moved to ${COLUMNS.find((c) => c.id === columnId)?.title}.`,
            });
        }
    };

    const deleteTask = (task: Task) => {
        setTasks((prev) => prev.filter((t) => t.id !== task.id));
        if (selectedId === task.id) setDrawerOpen(false);
        toaster.show({ intent: "danger", icon: "trash", message: `${task.id} deleted.` });
    };

    const toggleSubtask = (id: string, subtaskId: string) =>
        setTasks((prev) =>
            prev.map((t) =>
                t.id === id
                    ? { ...t, subtasks: t.subtasks.map((s) => (s.id === subtaskId ? { ...s, done: !s.done } : s)) }
                    : t,
            ),
        );

    const addSubtask = (id: string, text: string) =>
        setTasks((prev) =>
            prev.map((t) =>
                t.id === id ? { ...t, subtasks: [...t.subtasks, { id: nextId("st"), text, done: false }] } : t,
            ),
        );

    const addComment = (id: string, body: string) => {
        setTasks((prev) =>
            prev.map((t) =>
                t.id === id
                    ? {
                          ...t,
                          comments: [
                              ...t.comments,
                              { id: nextId("cm"), authorId: CURRENT_USER_ID, timestamp: "Just now", body },
                          ],
                      }
                    : t,
            ),
        );
        toaster.show({ intent: "success", icon: "chat", message: "Comment posted." });
    };

    const createTask = (draft: NewTaskDraft) => {
        const id = `ORB-${200 + (counter.current += 1)}`;
        const task: Task = {
            id,
            title: draft.title,
            description: draft.description,
            columnId: draft.columnId,
            priority: draft.priority,
            labels: draft.labels,
            assigneeId: draft.assigneeId,
            points: draft.points,
            due: "—",
            subtasks: [],
            comments: [],
        };
        setTasks((prev) => [task, ...prev]);
        setDialogOpen(false);
        toaster.show({ intent: "success", icon: "tick-circle", message: `${id} created in ${COLUMNS.find((c) => c.id === draft.columnId)?.title}.` });
    };

    const openTask = (task: Task) => {
        setSelectedId(task.id);
        setDrawerOpen(true);
    };

    const openNewTask = (columnId: ColumnId) => {
        setDialogColumn(columnId);
        setDialogOpen(true);
    };

    const clearFilters = () => {
        setSearch("");
        setAssigneeFilter("all");
        setLabelFilter([]);
        setOnlyMine(false);
    };

    const availableFilterLabels = ALL_LABELS.filter((id) => !labelFilter.includes(id));

    return (
        <div className="flex h-screen flex-col bg-background text-foreground">
            {/* ── Top navbar ─────────────────────────────────────────────── */}
            <Navbar className="shrink-0">
                <NavbarGroup align="left">
                    <span className="mr-2 inline-flex items-center justify-center">
                        <Icon icon="layout-grid" size={20} className="text-intent-primary-text" />
                    </span>
                    <NavbarHeading className="font-semibold">Orbit Board</NavbarHeading>
                    <Tag minimal intent="primary">
                        Sprint 24
                    </Tag>
                    <NavbarDivider />
                    <div className="hidden md:block">
                        <InputGroup
                            leftIcon="search"
                            placeholder="Search tasks…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ width: 260 }}
                        />
                    </div>
                </NavbarGroup>
                <NavbarGroup align="right">
                    <Button
                        intent="primary"
                        icon={<Icon icon="plus" className="!text-current" />}
                        onClick={() => openNewTask("backlog")}
                    >
                        New task
                    </Button>
                    <Tooltip content="Team" dark={dark}>
                        <span className="flex items-center pl-1">
                            {MEMBERS.slice(0, 4).map((m, i) => (
                                <span key={m.id} className={i === 0 ? "" : "-ml-1.5"}>
                                    <Avatar memberId={m.id} size="md" className="ring-2 ring-surface" />
                                </span>
                            ))}
                        </span>
                    </Tooltip>
                    <NavbarDivider />
                    <MenuPopover
                        side="bottom"
                        align="end"
                        dark={dark}
                        content={
                            <Menu>
                                <MenuDivider title={MEMBER_BY_ID[CURRENT_USER_ID]?.name} />
                                <MenuItem icon="person" text="Profile" />
                                <MenuItem icon="cog" text="Board settings" />
                                <MenuDivider />
                                <MenuItem icon="log-out" text="Sign out" intent="danger" />
                            </Menu>
                        }
                    >
                        <Button
                            variant="minimal"
                            icon={<Avatar memberId={CURRENT_USER_ID} size="sm" />}
                            endIcon={<Icon icon="caret-down" className="!text-current" />}
                        >
                            Maya O.
                        </Button>
                    </MenuPopover>
                    <NavbarDivider />
                    <AppChromeControls />
                </NavbarGroup>
            </Navbar>

            {/* ── Body ───────────────────────────────────────────────────── */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-3 border-b border-divider px-6 py-3">
                    <Select<string | null>
                        items={ASSIGNEE_FILTER_OPTIONS}
                        filterable
                        dark={dark}
                        placeholder="Filter people…"
                        selectedItem={assigneeFilter}
                        itemPredicate={(q, item) => assigneeLabel(item).toLowerCase().includes(q.toLowerCase())}
                        onItemSelect={(v) => setAssigneeFilter(v)}
                        itemRenderer={(item, { modifiers, handleClick }) => (
                            <MenuItem
                                key={item ?? "unassigned"}
                                text={assigneeLabel(item)}
                                active={modifiers.active}
                                icon={item === assigneeFilter ? "tick" : undefined}
                                onClick={handleClick}
                            />
                        )}
                    >
                        <Button
                            variant="outlined"
                            icon={<Icon icon="person" className="!text-current" />}
                            endIcon={<Icon icon="caret-down" className="!text-current" />}
                        >
                            {assigneeLabel(assigneeFilter)}
                        </Button>
                    </Select>

                    <div className="min-w-[220px]">
                        <MultiSelect<LabelId>
                            items={availableFilterLabels}
                            selectedItems={labelFilter}
                            dark={dark}
                            fill
                            leftIcon="tag"
                            placeholder={labelFilter.length ? "" : "Filter labels…"}
                            tagRenderer={(id) => LABEL_META[id].label}
                            tagProps={(id) => ({ minimal: true, intent: LABEL_META[id].intent })}
                            onItemSelect={(id) => setLabelFilter((prev) => (prev.includes(id) ? prev : [...prev, id]))}
                            onRemove={(id) => setLabelFilter((prev) => prev.filter((l) => l !== id))}
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
                    </div>

                    <Switch
                        className="mb-0"
                        label="Only my tasks"
                        checked={onlyMine}
                        onChange={(e) => setOnlyMine(e.target.checked)}
                    />

                    {activeFilterCount > 0 && (
                        <Button
                            variant="minimal"
                            size="small"
                            icon={<Icon icon="cross" className="!text-current" />}
                            onClick={clearFilters}
                        >
                            Clear ({activeFilterCount})
                        </Button>
                    )}

                    <div className="grow" />

                    {/* Sprint progress */}
                    <div className="flex w-[240px] flex-col gap-1">
                        <div className="flex items-center justify-between text-body-sm text-foreground-muted">
                            <span>Sprint progress</span>
                            <span className="tabular-nums">
                                {sprint.done}/{sprint.total} pts
                            </span>
                        </div>
                        <ProgressBar value={sprint.ratio} intent="success" stripes={false} />
                    </div>
                </div>

                {/* Board */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="flex min-h-full items-stretch gap-4">
                        {COLUMNS.map((col) => (
                            <BoardColumn
                                key={col.id}
                                id={col.id}
                                title={col.title}
                                dotClass={col.dotClass}
                                tasks={byColumn[col.id]}
                                dark={dark}
                                draggingId={draggingTask?.id ?? null}
                                onOpen={openTask}
                                onMove={moveTask}
                                onDelete={deleteTask}
                                onAdd={openNewTask}
                                onDragStart={setDraggingTask}
                                onDragEnd={() => setDraggingTask(null)}
                                onDrop={(columnId, anchorId) => {
                                    if (draggingTask) reorderTask(draggingTask, columnId, anchorId);
                                    setDraggingTask(null);
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* ── New-task dialog ────────────────────────────────────────── */}
            <NewTaskDialog
                open={dialogOpen}
                dark={dark}
                defaultColumn={dialogColumn}
                onClose={() => setDialogOpen(false)}
                onCreate={createTask}
            />

            {/* ── Detail drawer ──────────────────────────────────────────── */}
            <TaskDetail
                task={selected}
                isOpen={drawerOpen}
                dark={dark}
                onClose={() => setDrawerOpen(false)}
                onPatch={patchTask}
                onToggleSubtask={toggleSubtask}
                onAddSubtask={addSubtask}
                onAddComment={addComment}
                onDelete={deleteTask}
            />
        </div>
    );
}

export default ProjectBoard;
