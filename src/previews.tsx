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
import { AILabel, AILabelExplanation } from "@/components/ui/ai-label";
import { InputGroup } from "@/components/ui/input-group";
import { TextArea } from "@/components/ui/text-area";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup } from "@/components/ui/radio";
import { FormGroup } from "@/components/ui/form-group";
import { ControlGroup } from "@/components/ui/control-group";
import { HTMLSelect } from "@/components/ui/html-select";
import { FileInput } from "@/components/ui/file-input";
import { NumericInput } from "@/components/ui/numeric-input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { CheckboxCard } from "@/components/ui/control-card";
import { Menu, MenuItem, MenuDivider } from "@/components/ui/menu";
import { DialogBody, DialogFooter } from "@/components/ui/dialog";
import { HTMLTable } from "@/components/ui/html-table";

/**
 * Shared surface for overlays. The real overlay components portal to `document.body`
 * and lay out as fixed, screen-centered panels — they can't live in a tile — so we
 * preview their *panel surface* inline (built from real sub-parts where they render
 * standalone: DialogBody/DialogFooter, Menu, Toast), styled to match the portaled look.
 */
const OVERLAY_PANEL = "overflow-hidden rounded-bp bg-surface shadow-overlay-3";

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
     * surfaces we want to show from the top down and let the bottom clip (e.g. ai-label's
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
    // AILabelExplanation surface (provenance, confidence, grounding, model, actions).
    // Needs a taller tile to stay legible, so it overrides the frame height.
    "ai-label": {
        align: "top",
        scale: 0.6,
        render: () => (
            <div className="flex flex-col items-center gap-2">
                <AILabel label="AI assisted" intent="primary" />
                {/* Wider than the default popover so its content doesn't hang past the
                    border; no overflow-hidden so the confidence badge isn't clipped. */}
                <div className="w-96 rounded-bp bg-surface p-3.5 shadow-overlay-3">
                    <AILabelExplanation
                        states={[
                            { label: "AI-authored", tone: "info" },
                            { label: "human-edited", tone: "neutral", icon: "edit" },
                            { label: "grounded", tone: "positive", icon: "tick-circle" },
                            { label: "unverified", tone: "caution" },
                        ]}
                        confidence={{
                            label: "High",
                            method: "llm-judge",
                            detail: "claude-opus-4-8, against retrieved sources",
                            tone: "positive",
                        }}
                        grounding={[
                            { title: "Q3 Financial Report.pdf", href: "#", meta: "p. 12" },
                            { title: "CRM export 2026-05.csv", href: "#", meta: "rows 1–40" },
                        ]}
                        model={{ model: "claude-opus-4-8", at: "2h ago", retrieval: true }}
                        actions={
                            <>
                                <Button variant="minimal" size="small">
                                    View details
                                </Button>
                                <Button intent="primary" size="small">
                                    Regenerate
                                </Button>
                            </>
                        }
                    >
                        This summary was drafted by AI, then edited by an analyst. Review before relying on it.
                    </AILabelExplanation>
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
        scale: 0.52,
        render: () => (
            <div className={cn("w-[300px]", OVERLAY_PANEL)}>
                <div className="flex items-center justify-between px-4 py-2.5 shadow-[0_1px_0_rgba(17,20,24,0.15)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]">
                    <span className="text-body font-semibold text-foreground">Create project</span>
                    <Icon icon="small-cross" size={16} className="text-foreground-muted" />
                </div>
                <div className="flex items-center gap-1.5 px-4 py-2 text-body-sm">
                    <span className="text-foreground-muted">Details</span>
                    <Icon icon="chevron-right" size={12} className="text-foreground-muted" />
                    <span className="font-semibold text-intent-primary-text">Members</span>
                    <Icon icon="chevron-right" size={12} className="text-foreground-muted" />
                    <span className="text-foreground-muted">Review</span>
                </div>
                <DialogBody>
                    <p className="m-0 text-body-sm text-foreground">Invite teammates to this project.</p>
                </DialogBody>
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
        ),
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
            <span className="inline-flex items-center rounded-bp bg-dark-gray-5 px-2.5 py-1.5 text-body-sm text-light-gray-5 shadow-overlay-3 dark:bg-light-gray-3 dark:text-dark-gray-5">
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
                "relative grid grid-cols-1 overflow-hidden rounded-bp bg-[var(--interactive-hover)]",
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
