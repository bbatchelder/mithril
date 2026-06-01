/**
 * Mock data + types for the Project Board (kanban) demo — "Orbit" product board.
 *
 * All dates / relative-time strings are hard-coded (not computed from the clock)
 * so the demo renders deterministically and never drifts during a session.
 */

import type { TagIntent } from "@/components/ui/tag";
import type { IconName } from "@/components/ui/icon";

// ── Enums / unions ───────────────────────────────────────────────────────────

export type ColumnId = "backlog" | "in-progress" | "review" | "done";
export type Priority = "urgent" | "high" | "medium" | "low";
export type LabelId = "bug" | "feature" | "design" | "infra" | "docs" | "research";

export interface Member {
    id: string;
    name: string;
    /** Two-letter avatar initials. */
    initials: string;
    /** Avatar background color (literal hex — inline style, not a Tailwind class). */
    color: string;
    /** Role line shown in menus / tooltips. */
    role: string;
}

export interface Subtask {
    id: string;
    text: string;
    done: boolean;
}

export interface Comment {
    id: string;
    authorId: string;
    timestamp: string;
    body: string;
}

export interface Task {
    /** Ticket id, e.g. "ORB-104". */
    id: string;
    title: string;
    description: string;
    columnId: ColumnId;
    priority: Priority;
    labels: LabelId[];
    /** Assigned member id, or null when unassigned. */
    assigneeId: string | null;
    /** Story points. */
    points: number;
    /** Hard-coded due-date string, e.g. "Jun 14". */
    due: string;
    subtasks: Subtask[];
    comments: Comment[];
}

// ── Columns ──────────────────────────────────────────────────────────────────

export const COLUMNS: { id: ColumnId; title: string; dotClass: string }[] = [
    { id: "backlog", title: "Backlog", dotClass: "bg-gray-3" },
    { id: "in-progress", title: "In Progress", dotClass: "bg-blue-3" },
    { id: "review", title: "In Review", dotClass: "bg-orange-3" },
    { id: "done", title: "Done", dotClass: "bg-green-3" },
];

export const COLUMN_TITLE: Record<ColumnId, string> = {
    backlog: "Backlog",
    "in-progress": "In Progress",
    review: "In Review",
    done: "Done",
};

// ── Priority ─────────────────────────────────────────────────────────────────

export const PRIORITY_META: Record<Priority, { label: string; intent: TagIntent; icon: IconName }> = {
    urgent: { label: "Urgent", intent: "danger", icon: "flame" },
    high: { label: "High", intent: "warning", icon: "arrow-up" },
    medium: { label: "Medium", intent: "primary", icon: "minus" },
    low: { label: "Low", intent: "none", icon: "arrow-down" },
};

/** Left accent bar color per priority (literal Tailwind classes). */
export const PRIORITY_ACCENT: Record<Priority, string> = {
    urgent: "bg-red-3",
    high: "bg-orange-3",
    medium: "bg-blue-3",
    low: "bg-gray-3",
};

export const PRIORITY_ORDER: Priority[] = ["urgent", "high", "medium", "low"];

// ── Labels ───────────────────────────────────────────────────────────────────

export const LABEL_META: Record<LabelId, { label: string; intent: TagIntent; icon: IconName }> = {
    bug: { label: "bug", intent: "danger", icon: "error" },
    feature: { label: "feature", intent: "primary", icon: "star" },
    design: { label: "design", intent: "warning", icon: "style" },
    infra: { label: "infra", intent: "none", icon: "cog" },
    docs: { label: "docs", intent: "success", icon: "document" },
    research: { label: "research", intent: "primary", icon: "search-template" },
};

export const ALL_LABELS: LabelId[] = ["bug", "feature", "design", "infra", "docs", "research"];

// ── Members ──────────────────────────────────────────────────────────────────

/** The "current user" — matches the SOC demo's identity. */
export const CURRENT_USER_ID = "u-maya";

export const MEMBERS: Member[] = [
    { id: "u-maya", name: "Maya Okonkwo", initials: "MO", color: "#2d72d2", role: "Eng Lead (you)" },
    { id: "u-dev", name: "Dev Patel", initials: "DP", color: "#238551", role: "Frontend" },
    { id: "u-lena", name: "Lena Schmidt", initials: "LS", color: "#c87619", role: "Design" },
    { id: "u-tomas", name: "Tomás Rivera", initials: "TR", color: "#9d3f9d", role: "Backend" },
    { id: "u-aisha", name: "Aisha Khan", initials: "AK", color: "#cd4246", role: "QA" },
];

export const MEMBER_BY_ID: Record<string, Member> = Object.fromEntries(
    MEMBERS.map((m) => [m.id, m]),
);

export function memberName(id: string | null): string {
    if (id == null) return "Unassigned";
    return MEMBER_BY_ID[id]?.name ?? "Unknown";
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function subtaskProgress(task: Task): { done: number; total: number; ratio: number } {
    const total = task.subtasks.length;
    const done = task.subtasks.filter((s) => s.done).length;
    return { done, total, ratio: total === 0 ? 0 : done / total };
}

// ── Mock tasks ───────────────────────────────────────────────────────────────

export const TASKS: Task[] = [
    {
        id: "ORB-118",
        title: "Sign-in fails on Safari 17 with SSO redirect loop",
        description:
            "Users on Safari 17 get bounced between the IdP and the app indefinitely. Suspect the SameSite=Lax cookie is dropped on the cross-site POST callback. Repro on macOS Sonoma, not on Chrome.",
        columnId: "in-progress",
        priority: "urgent",
        labels: ["bug", "infra"],
        assigneeId: "u-dev",
        points: 5,
        due: "Jun 13",
        subtasks: [
            { id: "s1", text: "Reproduce with a clean profile", done: true },
            { id: "s2", text: "Confirm cookie attributes in callback", done: true },
            { id: "s3", text: "Patch SameSite + Secure on session cookie", done: false },
            { id: "s4", text: "Add Safari to the e2e matrix", done: false },
        ],
        comments: [
            { id: "c1", authorId: "u-maya", timestamp: "Jun 12 · 09:14", body: "Bumping to urgent — this blocks ~8% of logins." },
            { id: "c2", authorId: "u-dev", timestamp: "Jun 12 · 10:02", body: "Confirmed it's the cross-site callback. Cookie is dropped on the 302." },
        ],
    },
    {
        id: "ORB-104",
        title: "Design the empty-state illustrations for the dashboard",
        description:
            "We need friendly empty states for the three dashboard widgets (Activity, Tasks, Reports). Match the new illustration style from the brand refresh. Deliver as optimized SVG.",
        columnId: "in-progress",
        priority: "medium",
        labels: ["design"],
        assigneeId: "u-lena",
        points: 3,
        due: "Jun 16",
        subtasks: [
            { id: "s1", text: "Activity widget", done: true },
            { id: "s2", text: "Tasks widget", done: false },
            { id: "s3", text: "Reports widget", done: false },
        ],
        comments: [
            { id: "c1", authorId: "u-lena", timestamp: "Jun 11 · 15:40", body: "First pass in Figma — link in the description thread." },
        ],
    },
    {
        id: "ORB-121",
        title: "Add keyboard navigation to the command palette",
        description:
            "Arrow keys to move, Enter to select, Esc to close, and a roving tabindex so screen readers announce the active item. Mirror the behavior of the global search.",
        columnId: "backlog",
        priority: "high",
        labels: ["feature", "design"],
        assigneeId: null,
        points: 5,
        due: "Jun 20",
        subtasks: [],
        comments: [],
    },
    {
        id: "ORB-097",
        title: "Migrate the metrics pipeline to the new ingestion API",
        description:
            "Cut over from the legacy batch ingester to the streaming API. Dual-write during the transition, then flip reads behind the `metrics_v2` flag and decommission the old path.",
        columnId: "backlog",
        priority: "high",
        labels: ["infra", "research"],
        assigneeId: "u-tomas",
        points: 8,
        due: "Jun 24",
        subtasks: [
            { id: "s1", text: "Spike: throughput at peak load", done: true },
            { id: "s2", text: "Dual-write adapter", done: false },
            { id: "s3", text: "Shadow-read comparison report", done: false },
        ],
        comments: [
            { id: "c1", authorId: "u-tomas", timestamp: "Jun 10 · 11:20", body: "Spike done — new API handles 3× our peak comfortably." },
        ],
    },
    {
        id: "ORB-130",
        title: "Write the onboarding guide for the public API",
        description:
            "A getting-started guide covering auth, the first request, pagination, and rate limits. Include copy-paste examples in curl, JS, and Python.",
        columnId: "backlog",
        priority: "low",
        labels: ["docs"],
        assigneeId: null,
        points: 2,
        due: "Jun 28",
        subtasks: [],
        comments: [],
    },
    {
        id: "ORB-112",
        title: "Dark-mode contrast audit for the settings screens",
        description:
            "Several labels and helper texts fail WCAG AA in dark mode. Audit every settings panel and bring foreground/background pairs up to a 4.5:1 ratio.",
        columnId: "review",
        priority: "medium",
        labels: ["design", "bug"],
        assigneeId: "u-aisha",
        points: 3,
        due: "Jun 13",
        subtasks: [
            { id: "s1", text: "Audit Profile + Account", done: true },
            { id: "s2", text: "Audit Notifications", done: true },
            { id: "s3", text: "File fixes for failing pairs", done: true },
            { id: "s4", text: "Re-test with the contrast checker", done: false },
        ],
        comments: [
            { id: "c1", authorId: "u-aisha", timestamp: "Jun 12 · 08:30", body: "11 failing pairs found, 9 fixed. Two need design input." },
            { id: "c2", authorId: "u-lena", timestamp: "Jun 12 · 09:05", body: "I'll take the two flagged ones." },
        ],
    },
    {
        id: "ORB-088",
        title: "Rate-limit the password-reset endpoint",
        description:
            "The reset endpoint is unthrottled and abusable for user enumeration. Add a per-IP and per-account token bucket and a generic response that doesn't leak account existence.",
        columnId: "review",
        priority: "urgent",
        labels: ["bug", "infra"],
        assigneeId: "u-tomas",
        points: 3,
        due: "Jun 12",
        subtasks: [
            { id: "s1", text: "Per-IP bucket", done: true },
            { id: "s2", text: "Per-account bucket", done: true },
            { id: "s3", text: "Constant-time generic response", done: true },
        ],
        comments: [
            { id: "c1", authorId: "u-maya", timestamp: "Jun 12 · 13:10", body: "Looks good — one nit on the bucket TTL in review." },
        ],
    },
    {
        id: "ORB-076",
        title: "Ship the new project board (this one!)",
        description:
            "Build the kanban board with columns, drag-and-drop, filtering, and a task detail panel. Compose it entirely from the owned component library.",
        columnId: "done",
        priority: "high",
        labels: ["feature"],
        assigneeId: "u-maya",
        points: 8,
        due: "Jun 11",
        subtasks: [
            { id: "s1", text: "Columns + cards", done: true },
            { id: "s2", text: "Drag and drop", done: true },
            { id: "s3", text: "Filters + detail panel", done: true },
        ],
        comments: [
            { id: "c1", authorId: "u-dev", timestamp: "Jun 11 · 17:45", body: "Merged 🎉 The DnD feels great." },
        ],
    },
    {
        id: "ORB-069",
        title: "Fix flaky timezone test in CI",
        description:
            "The `formatDueDate` test fails intermittently on CI runners in UTC-negative zones. Pin the test clock and use a fixed locale.",
        columnId: "done",
        priority: "low",
        labels: ["bug"],
        assigneeId: "u-aisha",
        points: 1,
        due: "Jun 09",
        subtasks: [],
        comments: [],
    },
    {
        id: "ORB-125",
        title: "Audit bundle size after the chart library swap",
        description:
            "The new charting lib added ~140 KB gzipped. Tree-shake unused locales and lazy-load the heavy chart types so the initial bundle stays under budget.",
        columnId: "backlog",
        priority: "medium",
        labels: ["infra", "research"],
        assigneeId: null,
        points: 3,
        due: "Jun 26",
        subtasks: [],
        comments: [],
    },
];
