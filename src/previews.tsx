/**
 * Overview-tile previews for the Component Showcase.
 *
 * Each entry renders a small, **representative composition of the real component** —
 * the actual mithril component, not a screenshot — shown inside `ComponentPreview`'s
 * clipped, inert frame on the IBM-Carbon-style overview grid. Because these are live
 * instances, they re-tint with the active theme (light/dark + custom seeds) for free.
 *
 * Guidelines for authoring a preview:
 *   - Compose at near-natural size; let the frame clip overflow. Use `scale` only for
 *     genuinely dense compositions (e.g. a table) that won't otherwise fit.
 *   - Keep it static — no state, no portals. Overlays (Popover/Menu/Dialog/…) portal
 *     out of the tile, so preview their *surface* inline instead of their trigger
 *     (e.g. `menu` renders a bare `<Menu>` panel, not a button that opens one).
 *   - Ids without an entry simply fall back to the icon-only tile, so this can grow
 *     incrementally.
 */
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AnchorButton } from "@/components/ui/anchor-button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Tag } from "@/components/ui/tag";
import { Switch } from "@/components/ui/switch";
import { Callout } from "@/components/ui/callout";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { Divider } from "@/components/ui/divider";
import { Spinner, SpinnerSize } from "@/components/ui/spinner";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { AIExplainability } from "@/components/ui/ai-explainability";
import { AIExplainabilityDemoDetails } from "@/lib/demo/ai-explainability";
import { InputGroup } from "@/components/ui/input-group";
import { TextArea } from "@/components/ui/text-area";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup } from "@/components/ui/radio";
import { FormGroup } from "@/components/ui/form-group";
import { ControlGroup } from "@/components/ui/control-group";
import { HTMLSelect } from "@/components/ui/html-select";
import { FileInput } from "@/components/ui/file-input";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { NumericInput } from "@/components/ui/numeric-input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { CheckboxCard } from "@/components/ui/control-card";
import { Menu, MenuItem, MenuDivider } from "@/components/ui/menu";
import { DialogBody, DialogFooter } from "@/components/ui/dialog";
import { HTMLTable } from "@/components/ui/html-table";
import { Navbar, NavbarDivider, NavbarGroup, NavbarHeading } from "@/components/ui/navbar";
import { Tab, Tabs } from "@/components/ui/tabs";
import { Collapse } from "@/components/ui/collapse";
import { Section, SectionCard } from "@/components/ui/section";
import { CardList } from "@/components/ui/card-list";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Tree, type TreeNodeInfo } from "@/components/ui/tree";
import { PanelStack, type PanelInfo } from "@/components/ui/panel-stack";
import { EditableText } from "@/components/ui/editable-text";
import { EntityTitle } from "@/components/ui/entity-title";
import { NonIdealState } from "@/components/ui/non-ideal-state";
import { Link } from "@/components/ui/link";
import { Slider } from "@/components/ui/slider";
import { KeyCombo } from "@/components/ui/hotkeys";
import { TagInput } from "@/components/ui/tag-input";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { TimePicker } from "@/components/ui/time-picker";
import { DatePicker } from "@/components/ui/date-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateInput } from "@/components/ui/date-input";
import { DateRangeInput } from "@/components/ui/date-range-input";
import { TimezoneSelect } from "@/components/ui/timezone-select";

/**
 * Shared surface for overlays. The real overlay components portal to `document.body`
 * and lay out as fixed, screen-centered panels — they can't live in a tile — so we
 * preview their *panel surface* inline (built from real sub-parts where they render
 * standalone: DialogBody/DialogFooter, Menu, Toast), styled to match the portaled look.
 */
const OVERLAY_PANEL = "overflow-hidden rounded-mithril bg-surface shadow-overlay-3";

/**
 * Fixed seed dates so the date/time previews render deterministically (and don't
 * depend on "today"). Mirror the playground's seeds (Jan 2026).
 */
const PREVIEW_DATE = new Date(2026, 0, 15); // Jan 15, 2026
const PREVIEW_TIME = new Date(2026, 0, 15, 14, 30); // 2:30 PM
const PREVIEW_RANGE = { start: new Date(2026, 0, 8), end: new Date(2026, 0, 20) };

/** A tiny static row set for the DataTable preview. */
interface PreviewPerson {
    name: string;
    role: string;
    location: string;
}
const PREVIEW_TABLE_ROWS: PreviewPerson[] = [
    { name: "Alice Hancock", role: "Engineer", location: "London" },
    { name: "Bob Liu", role: "Designer", location: "Seattle" },
    { name: "Carol Reyes", role: "Manager", location: "Austin" },
    { name: "Dan Okafor", role: "Analyst", location: "Lagos" },
];
const PREVIEW_TABLE_COLUMNS: DataTableColumn<PreviewPerson>[] = [
    { id: "name", header: "Name", accessor: "name", width: 150 },
    { id: "role", header: "Role", accessor: "role", width: 110 },
    { id: "location", header: "Location", accessor: "location", width: 120 },
];

interface PreviewEntry {
    /** A representative, non-interactive composition of the real component. */
    render: () => ReactNode;
    /** Optical scale for dense compositions that won't fit at natural size (default 1). */
    scale?: number;
    /**
     * Overrides the frame's height + horizontal padding (default `"h-28 px-3"`). Use for
     * the rare component whose representative surface needs a different-sized tile.
     */
    frameClassName?: string;
    /**
     * Anchor the preview to the top of the frame instead of centering it. For tall
     * surfaces we want to show from the top down and let the bottom clip (e.g. ai-explainability's
     * popover), rather than centering and clipping both ends.
     */
    align?: "top";
}

export const PREVIEWS: Record<string, PreviewEntry> = {
    button: {
        render: () => (
            <div className="flex items-center gap-2">
                <Button intent="primary" icon="floppy-disk">
                    Save
                </Button>
                <Button variant="outlined">Cancel</Button>
            </div>
        ),
    },

    "anchor-button": {
        render: () => (
            <div className="flex items-center gap-2">
                <AnchorButton href="#" intent="primary" icon="share">
                    Open
                </AnchorButton>
                <AnchorButton href="#" variant="outlined" endIcon="chevron-right">
                    Details
                </AnchorButton>
            </div>
        ),
    },

    "button-group": {
        scale: 0.9,
        render: () => (
            <ButtonGroup>
                <Button icon="grid-view">List</Button>
                <Button icon="cog">Settings</Button>
                <Button icon="user">Account</Button>
            </ButtonGroup>
        ),
    },

    card: {
        render: () => (
            <Card elevation={1} compact style={{ width: 210 }}>
                <div className="text-body-sm font-semibold text-foreground">Project Atlas</div>
                <div className="text-body-sm text-foreground-muted">Updated 2 hours ago</div>
            </Card>
        ),
    },

    icon: {
        render: () => (
            <div className="flex items-center gap-3.5 text-foreground">
                <Icon icon="home" size={22} />
                <Icon icon="cog" size={22} intent="primary" />
                <Icon icon="cloud" size={22} />
                <Icon icon="heart" size={22} intent="danger" />
                <Icon icon="star" size={22} intent="warning" />
            </div>
        ),
    },

    text: {
        render: () => (
            <div className="flex w-[210px] flex-col gap-0.5">
                <Text className="font-semibold text-foreground">The quick brown fox</Text>
                <Text className="text-foreground-muted">jumps over the lazy dog.</Text>
            </div>
        ),
    },

    divider: {
        render: () => (
            <div className="flex w-44 flex-col text-body-sm text-foreground">
                <span>Section above</span>
                <Divider />
                <span>Section below</span>
            </div>
        ),
    },

    spinner: {
        render: () => <Spinner size={SpinnerSize.STANDARD} intent="primary" aria-label="loading" />,
    },

    "progress-bar": {
        render: () => (
            <div style={{ width: 210 }}>
                <ProgressBar value={0.65} intent="primary" aria-label="progress" />
            </div>
        ),
    },

    skeleton: {
        render: () => (
            <div className="flex w-[200px] flex-col gap-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-3 w-3/5" />
            </div>
        ),
    },

    // Show the explainability popover "in action": the marker + its full
    // AIExplainabilityDetails surface (provenance, confidence, grounding, model, actions).
    // Needs a taller tile to stay legible, so it overrides the frame height.
    "ai-explainability": {
        align: "top",
        scale: 0.6,
        render: () => (
            <div className="flex flex-col items-center gap-2">
                <AIExplainability label="AI assisted" intent="primary" />
                {/* Static mock of the live popover: a surface panel sized to hug its
                    content (the inner details are a fixed w-80), with the Blueprint
                    arrow wedge — the same paths as Popover.Arrow, rotated to point up —
                    sitting flush on the top edge so it connects to the marker above. */}
                <div className="relative w-fit">
                    <svg
                        className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[10px]"
                        width={30}
                        height={11}
                        viewBox="0 0 30 11"
                        style={{ overflow: "visible" }}
                    >
                        <g transform="rotate(90 15 15)">
                            <path
                                d="M8.11 6.302c1.015-.936 1.887-2.922 1.887-4.297v26c0-1.378-.868-3.357-1.888-4.297L.925 17.09c-1.237-1.14-1.233-3.034 0-4.17L8.11 6.302z"
                                fill="black"
                                fillOpacity={0.1}
                            />
                            <path
                                d="M8.787 7.036c1.22-1.125 2.21-3.376 2.21-5.03V0v30-2.005c0-1.654-.983-3.9-2.21-5.03l-7.183-6.616c-.81-.746-.802-1.96 0-2.7l7.183-6.614z"
                                className="fill-surface"
                            />
                        </g>
                    </svg>
                    <div className="rounded-mithril bg-surface p-3.5 shadow-overlay-3">
                        <AIExplainabilityDemoDetails />
                    </div>
                </div>
            </div>
        ),
    },

    tag: {
        render: () => (
            <div className="flex flex-wrap items-center justify-center gap-1.5">
                <Tag intent="primary">Active</Tag>
                <Tag intent="success" round>
                    Passing
                </Tag>
                <Tag intent="warning" minimal>
                    Pending
                </Tag>
                <Tag intent="danger" icon="cross">
                    Failed
                </Tag>
            </div>
        ),
    },

    switch: {
        render: () => (
            <div className="flex flex-col gap-1.5">
                <Switch label="Wi-Fi" defaultChecked />
                <Switch label="Bluetooth" />
                <Switch label="Airplane mode" defaultChecked />
            </div>
        ),
    },

    "input-group": {
        render: () => (
            <div style={{ width: 240 }}>
                <InputGroup leftIcon="search" placeholder="Search…" />
            </div>
        ),
    },

    "text-area": {
        render: () => (
            <div style={{ width: 240 }}>
                <TextArea rows={3} placeholder="Add a comment…" />
            </div>
        ),
    },

    checkbox: {
        render: () => (
            <div className="flex flex-col gap-1">
                <Checkbox label="Email" defaultChecked />
                <Checkbox label="SMS" />
                <Checkbox label="Push" indeterminate />
            </div>
        ),
    },

    radio: {
        render: () => (
            <RadioGroup
                name="preview-frequency"
                selectedValue="day"
                onChange={() => {}}
                options={[
                    { value: "day", label: "Daily" },
                    { value: "week", label: "Weekly" },
                    { value: "month", label: "Monthly" },
                ]}
            />
        ),
    },

    "form-group": {
        render: () => (
            <div style={{ width: 240 }}>
                <FormGroup label="Email" helperText="We'll never share it.">
                    <InputGroup placeholder="you@example.com" />
                </FormGroup>
            </div>
        ),
    },

    "control-group": {
        scale: 0.82,
        render: () => (
            <div style={{ width: 300 }}>
                <ControlGroup>
                    <HTMLSelect options={["Name", "Date"]} />
                    <InputGroup placeholder="Search…" leftIcon="search" />
                    <Button icon="arrow-right" intent="primary" />
                </ControlGroup>
            </div>
        ),
    },

    "html-select": {
        render: () => (
            <div style={{ width: 180 }}>
                <HTMLSelect defaultValue="Banana" options={["Apple", "Banana", "Cherry"]} />
            </div>
        ),
    },

    "file-input": {
        render: () => (
            <div style={{ width: 240 }}>
                <FileInput text="Choose file…" />
            </div>
        ),
    },

    "file-dropzone": {
        render: () => (
            <div style={{ width: 240 }}>
                <FileDropzone size="small" showFileList={false} />
            </div>
        ),
    },

    "numeric-input": {
        render: () => (
            <div style={{ width: 150 }}>
                <NumericInput defaultValue={5} />
            </div>
        ),
    },

    "segmented-control": {
        scale: 0.95,
        render: () => (
            <SegmentedControl
                defaultValue="list"
                options={[
                    { label: "List", value: "list" },
                    { label: "Grid", value: "grid" },
                    { label: "Gallery", value: "gallery" },
                ]}
            />
        ),
    },

    "control-card": {
        render: () => <CheckboxCard label="Email notifications" defaultChecked style={{ width: 240 }} />,
    },

    callout: {
        render: () => (
            <Callout intent="primary" title="Heads up" className="max-w-[260px]">
                A short, representative message body.
            </Callout>
        ),
    },

    // Overlay: preview the Menu *surface* inline rather than a trigger that portals.
    menu: {
        scale: 0.8,
        render: () => (
            <Menu className="min-w-[160px] shadow-elevation-1">
                <MenuItem icon="duplicate" text="Copy" />
                <MenuItem icon="edit" text="Rename" />
                <MenuDivider />
                <MenuItem icon="trash" text="Delete" intent="danger" />
            </Menu>
        ),
    },

    "context-menu": {
        scale: 0.7,
        render: () => (
            <Menu className={cn("min-w-[180px]", OVERLAY_PANEL)}>
                <MenuItem icon="cut" text="Cut" label="⌘X" />
                <MenuItem icon="duplicate" text="Copy" label="⌘C" />
                <MenuItem icon="clipboard" text="Paste" label="⌘V" />
                <MenuDivider />
                <MenuItem icon="trash" text="Delete" intent="danger" />
            </Menu>
        ),
    },

    dialog: {
        scale: 0.62,
        render: () => (
            <div className={cn("w-[250px]", OVERLAY_PANEL)}>
                <div className="flex items-center gap-2 px-4 py-2.5 shadow-[0_1px_0_rgba(17,20,24,0.15)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]">
                    <Icon icon="info-sign" size={16} className="text-foreground-muted" />
                    <span className="flex-1 text-body font-semibold text-foreground">Unsaved changes</span>
                    <Icon icon="small-cross" size={16} className="text-foreground-muted" />
                </div>
                <DialogBody>
                    <p className="m-0 text-body-sm text-foreground">Save your edits before leaving this page?</p>
                </DialogBody>
                <DialogFooter
                    actions={
                        <>
                            <Button variant="minimal" size="small">
                                Discard
                            </Button>
                            <Button intent="primary" size="small">
                                Save
                            </Button>
                        </>
                    }
                />
            </div>
        ),
    },

    "multistep-dialog": {
        // Mirrors the real component's structure (header + left step rail + right content +
        // footer), not a horizontal breadcrumb. "Members" is the active step so both footer
        // buttons and a form show. Keep in sync with the playground config in playground.tsx.
        scale: 0.5,
        // Taller than the frame — anchor to the top so the header/rail show and the footer
        // clips, instead of centering with dead space above the dialog.
        align: "top",
        render: () => {
            const STEPS = [
                { n: 1, label: "Project info", state: "viewed" as const },
                { n: 2, label: "Members", state: "active" as const },
                { n: 3, label: "Review", state: "upcoming" as const },
            ];
            return (
                <div className={cn("flex w-[380px] flex-col", OVERLAY_PANEL)}>
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-2.5 shadow-[0_1px_0_rgba(17,20,24,0.15)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]">
                        <span className="flex items-center gap-2 text-body font-semibold text-foreground">
                            <Icon icon="projects" size={16} className="text-foreground-muted" />
                            Create project
                        </span>
                        <Icon icon="small-cross" size={16} className="text-foreground-muted" />
                    </div>
                    {/* Body: left step rail + right content panel */}
                    <div className="flex">
                        <div className="flex w-[128px] flex-none flex-col">
                            {STEPS.map((s) => (
                                <div
                                    key={s.n}
                                    className={cn(
                                        "flex items-center gap-2 border-b border-[rgba(17,20,24,0.15)] px-3 py-2 text-body-sm dark:border-[rgba(255,255,255,0.2)]",
                                        s.state === "upcoming" ? "bg-[#f6f7f9] dark:bg-[#2f343c]" : "bg-white dark:bg-[#383e47]",
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "flex h-6 w-6 flex-none items-center justify-center rounded-full text-body-sm text-white",
                                            s.state === "active" ? "bg-primary" : s.state === "viewed" ? "bg-[#8f99a8]" : "bg-[rgba(95,107,124,0.6)]",
                                        )}
                                    >
                                        {s.n}
                                    </span>
                                    <span
                                        className={cn(
                                            "truncate",
                                            s.state === "active"
                                                ? "font-medium text-primary dark:text-intent-primary-text"
                                                : s.state === "viewed"
                                                  ? "text-foreground"
                                                  : "text-[rgba(95,107,124,0.6)] dark:text-[rgba(171,179,191,0.6)]",
                                        )}
                                    >
                                        {s.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col border-l border-[rgba(17,20,24,0.15)] bg-[#f6f7f9] dark:border-[rgba(255,255,255,0.2)] dark:bg-[#2f343c]">
                            <div className="flex flex-col gap-3 p-4">
                                <div className="flex flex-col gap-1">
                                    <span className="text-body-sm font-medium text-foreground">Invite by email</span>
                                    <InputGroup leftIcon="envelope" placeholder="name@company.com" fill />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-body-sm font-medium text-foreground">Role</span>
                                    <HTMLSelect fill defaultValue="Editor" options={["Viewer", "Editor", "Admin"]} />
                                </div>
                            </div>
                            <DialogFooter
                                actions={
                                    <>
                                        <Button variant="minimal" size="small">
                                            Back
                                        </Button>
                                        <Button intent="primary" size="small" endIcon="chevron-right">
                                            Next
                                        </Button>
                                    </>
                                }
                            />
                        </div>
                    </div>
                </div>
            );
        },
    },

    alert: {
        scale: 0.72,
        render: () => (
            <div className={cn("w-[250px] p-5", OVERLAY_PANEL)}>
                <div className="flex gap-3">
                    <Icon icon="warning-sign" size={30} intent="danger" className="shrink-0" />
                    <p className="m-0 text-body text-foreground">Permanently delete the 3 selected items?</p>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                    <Button variant="minimal" size="small">
                        Cancel
                    </Button>
                    <Button intent="danger" size="small">
                        Delete
                    </Button>
                </div>
            </div>
        ),
    },

    drawer: {
        scale: 0.62,
        render: () => (
            <div className={cn("flex h-[150px] w-[210px]", OVERLAY_PANEL)}>
                <div className="flex-1 bg-black/20 dark:bg-black/40" />
                <div className="flex w-[135px] flex-col bg-surface">
                    <div className="flex items-center justify-between px-3 py-2.5 shadow-[0_1px_0_rgba(17,20,24,0.15)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]">
                        <span className="text-body-sm font-semibold text-foreground">Filters</span>
                        <Icon icon="small-cross" size={14} className="text-foreground-muted" />
                    </div>
                    <div className="flex flex-col gap-1.5 p-3">
                        <Checkbox label="Active" defaultChecked />
                        <Checkbox label="Archived" />
                        <Checkbox label="Draft" />
                    </div>
                </div>
            </div>
        ),
    },

    popover: {
        scale: 0.88,
        render: () => (
            <div className={cn("w-[190px] p-3", OVERLAY_PANEL)}>
                <p className="m-0 text-body-sm font-semibold text-foreground">Filter results</p>
                <p className="m-0 mt-1 text-body-sm text-foreground-muted">Refine by status, owner, and date range.</p>
                <div className="mt-2.5 flex justify-end">
                    <Button intent="primary" size="small">
                        Apply
                    </Button>
                </div>
            </div>
        ),
    },

    tooltip: {
        render: () => (
            <span className="inline-flex items-center rounded-mithril bg-dark-gray-5 px-2.5 py-1.5 text-body-sm text-light-gray-5 shadow-overlay-3 dark:bg-light-gray-3 dark:text-dark-gray-5">
                Copy to clipboard
            </span>
        ),
    },

    // Radix Toast.Root is driven by a fixed, portaled Viewport — it won't render
    // inside a tile — so preview the toast *surface* statically, like the other overlays.
    toast: {
        scale: 0.92,
        render: () => (
            <div className={cn("flex w-[280px] items-center gap-2.5 px-3 py-2.5", OVERLAY_PANEL)}>
                <Icon icon="tick-circle" size={18} intent="success" className="shrink-0" />
                <span className="flex-1 text-body-sm text-foreground">Item saved successfully.</span>
                <Button variant="minimal" size="small">
                    Undo
                </Button>
                <Icon icon="cross" size={14} className="text-foreground-muted" />
            </div>
        ),
    },

    "html-table": {
        scale: 0.92,
        render: () => (
            <HTMLTable striped compact bordered>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Role</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Ava</td>
                        <td>Analyst</td>
                    </tr>
                    <tr>
                        <td>Kai</td>
                        <td>Engineer</td>
                    </tr>
                    <tr>
                        <td>Lena</td>
                        <td>Designer</td>
                    </tr>
                </tbody>
            </HTMLTable>
        ),
    },

    // ── Navigation & structure ────────────────────────────────────────────────
    navbar: {
        scale: 0.6,
        render: () => (
            <div style={{ width: 440 }}>
                <Navbar>
                    <NavbarGroup align="left">
                        <NavbarHeading>Mithril</NavbarHeading>
                        <NavbarDivider />
                        <Button variant="minimal" icon="home">
                            Home
                        </Button>
                        <Button variant="minimal" icon="document">
                            Files
                        </Button>
                    </NavbarGroup>
                    <NavbarGroup align="right">
                        <InputGroup size="small" leftIcon="search" placeholder="Search…" style={{ width: 130 }} />
                        <Button variant="minimal" icon="cog" aria-label="Settings" />
                    </NavbarGroup>
                </Navbar>
            </div>
        ),
    },

    tabs: {
        scale: 0.8,
        align: "top",
        render: () => {
            const panel = (text: string) => <div className="pt-3 text-body-sm text-foreground">{text}</div>;
            return (
                <div style={{ width: 320 }}>
                    <Tabs id="preview-tabs" defaultSelectedTabId="overview">
                        <Tab id="overview" title="Overview" panel={panel("Project overview and status.")} />
                        <Tab id="activity" title="Activity" panel={panel("Recent activity feed.")} />
                        <Tab id="settings" title="Settings" panel={panel("Configuration options.")} />
                    </Tabs>
                </div>
            );
        },
    },

    collapse: {
        scale: 0.95,
        render: () => (
            <div style={{ width: 240 }} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1 text-body-sm font-semibold text-foreground">
                    <Icon icon="chevron-down" size={14} className="text-foreground-muted" />
                    Build details
                </div>
                <Collapse isOpen>
                    <Card elevation={0} compact className="text-body-sm text-foreground-muted">
                        Compiled 248 modules in 1.9s — no errors.
                    </Card>
                </Collapse>
            </div>
        ),
    },

    section: {
        scale: 0.72,
        align: "top",
        render: () => (
            <div style={{ width: 360 }}>
                <Section
                    title="Account settings"
                    subtitle="Manage your preferences"
                    collapsible
                    collapseProps={{ defaultIsOpen: true }}
                >
                    <SectionCard>
                        <span className="text-body-sm text-foreground">Two-factor authentication is enabled.</span>
                    </SectionCard>
                </Section>
            </div>
        ),
    },

    "card-list": {
        scale: 0.82,
        align: "top",
        render: () => (
            <div style={{ width: 300 }}>
                <CardList bordered>
                    <Card>Inbox</Card>
                    <Card interactive>Drafts</Card>
                    <Card>Sent</Card>
                    <Card>Archive</Card>
                </CardList>
            </div>
        ),
    },

    breadcrumbs: {
        render: () => (
            <Breadcrumbs
                items={[
                    { text: "Home", href: "#", icon: "home" },
                    { text: "Projects", href: "#", icon: "folder-close" },
                    { text: "Apollo", current: true, icon: "projects" },
                ]}
            />
        ),
    },

    tree: {
        scale: 0.92,
        align: "top",
        render: () => {
            const contents: TreeNodeInfo[] = [
                {
                    id: "src",
                    label: "src",
                    icon: "folder-close",
                    isExpanded: true,
                    childNodes: [
                        {
                            id: "components",
                            label: "components",
                            icon: "folder-close",
                            isExpanded: true,
                            childNodes: [
                                { id: "button", label: "button.tsx", icon: "document", isSelected: true },
                                { id: "card", label: "card.tsx", icon: "document" },
                            ],
                        },
                        { id: "index", label: "index.ts", icon: "document" },
                    ],
                },
            ];
            return (
                <div style={{ width: 230 }}>
                    <Tree contents={contents} />
                </div>
            );
        },
    },

    "panel-stack": {
        scale: 0.74,
        align: "top",
        render: () => {
            const stack: PanelInfo[] = [
                { title: "Settings", renderPanel: () => null },
                {
                    title: "Notifications",
                    renderPanel: () => (
                        <div className="flex flex-col gap-2 p-3">
                            <Checkbox label="Email" defaultChecked />
                            <Checkbox label="Push" />
                            <Checkbox label="SMS" defaultChecked />
                        </div>
                    ),
                },
            ];
            return (
                <div style={{ width: 280 }} className={cn("h-[150px]", OVERLAY_PANEL)}>
                    <PanelStack stack={stack} style={{ width: "100%", height: "100%" }} />
                </div>
            );
        },
    },

    "editable-text": {
        render: () => (
            <div style={{ width: 240 }} className="flex flex-col gap-1">
                <span className="text-body-xs font-semibold uppercase tracking-wide text-foreground-muted">
                    Project name
                </span>
                <EditableText defaultValue="Spectre mission" />
            </div>
        ),
    },

    "entity-title": {
        render: () => (
            <div style={{ width: 260 }}>
                <EntityTitle title="Spectre mission" subtitle="Updated 2 hours ago" size="h4" icon="star" />
            </div>
        ),
    },

    "non-ideal-state": {
        scale: 0.8,
        render: () => (
            <div style={{ width: 300 }}>
                <NonIdealState
                    icon="search"
                    title="No results"
                    description="Try adjusting your filters or search terms."
                />
            </div>
        ),
    },

    link: {
        render: () => (
            <div style={{ width: 230 }} className="text-body text-foreground">
                See the <Link href="#">documentation</Link> or{" "}
                <Link href="#">contact support</Link> for help.
            </div>
        ),
    },

    slider: {
        scale: 0.92,
        render: () => (
            <div style={{ width: 250 }}>
                <Slider min={0} max={100} stepSize={10} labelStepSize={25} intent="primary" showTrackFill defaultValue={40} />
            </div>
        ),
    },

    hotkeys: {
        render: () => (
            <div className="flex flex-col items-start gap-2">
                <div className="flex items-center gap-2 text-body-sm text-foreground">
                    <span className="w-16 text-foreground-muted">Save</span>
                    <KeyCombo combo="mod+s" />
                </div>
                <div className="flex items-center gap-2 text-body-sm text-foreground">
                    <span className="w-16 text-foreground-muted">Command</span>
                    <KeyCombo combo="mod+shift+p" />
                </div>
            </div>
        ),
    },

    // ── Composite selects ──────────────────────────────────────────────────────
    // These portal their dropdown to document.body, so they can't live in a tile.
    // Preview the *open surface* inline: the real closed control (Button / InputGroup /
    // TagInput) over a static results Menu (the same panel the popover would host).
    select: {
        scale: 0.9,
        align: "top",
        render: () => (
            <div style={{ width: 190 }} className="flex flex-col gap-1">
                <Button variant="solid" endIcon="caret-down" fill>
                    Cherry
                </Button>
                <Menu className={cn("w-full", OVERLAY_PANEL)}>
                    <MenuItem text="Apple" />
                    <MenuItem text="Banana" />
                    <MenuItem text="Cherry" icon="tick" active />
                    <MenuItem text="Mango" />
                </Menu>
            </div>
        ),
    },

    suggest: {
        scale: 0.9,
        align: "top",
        render: () => (
            <div style={{ width: 190 }} className="flex flex-col gap-1">
                <InputGroup defaultValue="Ba" placeholder="Search fruit…" />
                <Menu className={cn("w-full", OVERLAY_PANEL)}>
                    <MenuItem text="Banana" active />
                    <MenuItem text="Blackberry" />
                    <MenuItem text="Blueberry" />
                </Menu>
            </div>
        ),
    },

    "multi-select": {
        scale: 0.86,
        align: "top",
        render: () => (
            <div style={{ width: 220 }} className="flex flex-col gap-1">
                <TagInput
                    values={["Banana", "Cherry"]}
                    onChange={() => {}}
                    placeholder="Add fruit…"
                    inputProps={{ "aria-label": "Fruit" }}
                    fill
                />
                <Menu className={cn("w-full", OVERLAY_PANEL)}>
                    <MenuItem text="Apple" />
                    <MenuItem text="Banana" icon="tick" active />
                    <MenuItem text="Cherry" icon="tick" />
                    <MenuItem text="Mango" />
                </Menu>
            </div>
        ),
    },

    // Omnibar is a portaled command-palette panel — mock its surface: a large search
    // field over a results Menu, styled like the real top-pinned panel.
    omnibar: {
        scale: 0.78,
        align: "top",
        render: () => (
            <div className={cn("w-[300px]", OVERLAY_PANEL)}>
                <InputGroup
                    leftIcon="search"
                    size="large"
                    defaultValue=""
                    placeholder="Search fruit…"
                    className="!rounded-none !bg-transparent !shadow-none"
                />
                <Menu className="rounded-none shadow-[inset_0_1px_0_rgba(17,20,24,0.15)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
                    <MenuItem text="Apple" active />
                    <MenuItem text="Banana" />
                    <MenuItem text="Cherry" />
                    <MenuItem text="Mango" />
                </Menu>
            </div>
        ),
    },

    // TagInput renders inline (no portal) → use the real component with static values.
    "tag-input": {
        render: () => (
            <div style={{ width: 260 }}>
                <TagInput
                    values={["design", "ui", "ux"]}
                    onChange={() => {}}
                    placeholder="Add a tag…"
                    inputProps={{ "aria-label": "Tags" }}
                    fill
                />
            </div>
        ),
    },

    // ── Data ───────────────────────────────────────────────────────────────────
    "data-table": {
        scale: 0.82,
        align: "top",
        render: () => (
            <div style={{ width: 380 }}>
                <DataTable<PreviewPerson> data={PREVIEW_TABLE_ROWS} columns={PREVIEW_TABLE_COLUMNS} selectionMode="none" />
            </div>
        ),
    },

    // ── Date & time ────────────────────────────────────────────────────────────
    // The calendars / time picker render inline → use the real component with a fixed
    // `defaultValue` (uncontrolled, no onChange needed; the inert frame blocks interaction).
    "time-picker": {
        render: () => <TimePicker defaultValue={PREVIEW_TIME} showArrowButtons />,
    },

    "date-picker": {
        scale: 0.62,
        align: "top",
        render: () => <DatePicker defaultValue={PREVIEW_DATE} />,
    },

    "date-range-picker": {
        scale: 0.58,
        align: "top",
        render: () => <DateRangePicker defaultValue={PREVIEW_RANGE} singleMonthOnly />,
    },

    // The *-input + timezone-select variants portal a popover → show the closed field.
    "date-input": {
        render: () => (
            <div style={{ width: 240 }}>
                <DateInput defaultValue={PREVIEW_DATE} placeholder="M/d/yyyy" />
            </div>
        ),
    },

    "date-range-input": {
        scale: 0.92,
        render: () => (
            <div style={{ width: 300 }}>
                <DateRangeInput defaultValue={PREVIEW_RANGE} />
            </div>
        ),
    },

    "timezone-select": {
        render: () => (
            <div style={{ width: 240 }}>
                <TimezoneSelect defaultValue="America/Los_Angeles" placeholder="Select timezone…" />
            </div>
        ),
    },
};

/** Whether a representative preview has been authored for `id`. */
export function hasPreview(id: string): boolean {
    return id in PREVIEWS;
}

/**
 * The clipped, non-interactive frame that hosts a component preview on its overview
 * tile. Returns `null` when no preview is authored for `id`, so the caller can fall
 * back to the icon-only tile. The frame is `inert` + `aria-hidden` so the live
 * instance inside never steals focus, tab order, or pointer events from the tile link.
 */
export function ComponentPreview({ id }: { id: string }) {
    const entry = PREVIEWS[id];
    if (!entry) return null;
    return (
        <div
            aria-hidden
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- `inert` is valid in React 19
            {...({ inert: "" } as any)}
            className={cn(
                // grid-cols-1 pins the column to the frame width so content wider than the
                // frame centers (and clips) symmetrically instead of overflowing one side.
                "relative grid grid-cols-1 overflow-hidden rounded-mithril bg-[var(--interactive-hover)]",
                entry.frameClassName ?? "h-28 px-3",
                entry.align === "top" ? "items-start justify-items-center pt-2" : "place-items-center",
            )}
        >
            <div
                className="pointer-events-none"
                style={
                    entry.scale
                        ? {
                              transform: `scale(${entry.scale})`,
                              transformOrigin: entry.align === "top" ? "top center" : undefined,
                          }
                        : undefined
                }
            >
                {entry.render()}
            </div>
        </div>
    );
}
