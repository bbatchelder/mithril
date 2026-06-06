/* eslint-disable no-restricted-imports */
import { Button } from "@/components/ui/button";
import { HTMLTable } from "@/components/ui/html-table";
import { Icon } from "@/components/ui/icon";
import { Menu, MenuItem, MenuDivider } from "@/components/ui/menu";
import { MenuPopover } from "@/components/ui/popover";
import { Tag } from "@/components/ui/tag";

import {
    type Alert,
    DETECTOR_ICON,
    SEVERITY_INTENT,
    SEVERITY_LABEL,
    STATUS_META,
} from "./data";

export type RowAction = "acknowledge" | "assign-me" | "escalate" | "close";

interface AlertTableProps {
    alerts: Alert[];
    selectedId: string | null;
    /** Row under the keyboard cursor (j/k navigation). */
    focusedId?: string | null;
    dark: boolean;
    onSelect: (alert: Alert) => void;
    onAction: (action: RowAction, alert: Alert) => void;
}

function RowActionsMenu({
    alert,
    dark,
    onAction,
}: {
    alert: Alert;
    dark: boolean;
    onAction: (action: RowAction, alert: Alert) => void;
}) {
    return (
        <MenuPopover
            side="bottom"
            align="end"
            dark={dark}
            content={
                <Menu size="small">
                    <MenuItem
                        icon="endorsed"
                        text="Acknowledge"
                        onClick={() => onAction("acknowledge", alert)}
                    />
                    <MenuItem
                        icon="person"
                        text="Assign to me"
                        onClick={() => onAction("assign-me", alert)}
                    />
                    <MenuItem
                        icon="arrow-up"
                        text="Escalate"
                        intent="warning"
                        onClick={() => onAction("escalate", alert)}
                    />
                    <MenuDivider />
                    <MenuItem
                        icon="cross"
                        text="Close"
                        intent="danger"
                        onClick={() => onAction("close", alert)}
                    />
                </Menu>
            }
        >
            <Button
                variant="minimal"
                size="small"
                aria-label={`Actions for ${alert.id}`}
                icon={<Icon icon="more" className="!text-current" />}
                onClick={(e) => e.stopPropagation()}
            />
        </MenuPopover>
    );
}

/** Stacked-card row for narrow screens — the table doesn't fit, so each alert
 * becomes a self-contained card. */
function AlertCard({
    alert,
    selected,
    focused,
    dark,
    onSelect,
    onAction,
}: {
    alert: Alert;
    selected: boolean;
    focused: boolean;
    dark: boolean;
    onSelect: (alert: Alert) => void;
    onAction: (action: RowAction, alert: Alert) => void;
}) {
    const status = STATUS_META[alert.status];
    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => onSelect(alert)}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(alert);
                }
            }}
            className={
                "flex cursor-pointer flex-col gap-2 rounded-bp border border-border bg-surface p-3 " +
                (selected ? "bg-[var(--interactive-hover)] " : "") +
                (focused ? "outline outline-2 -outline-offset-2 outline-intent-primary-text" : "")
            }
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                    <Tag intent={SEVERITY_INTENT[alert.severity]} minimal>
                        {SEVERITY_LABEL[alert.severity]}
                    </Tag>
                    <Tag intent={status.intent} minimal>
                        {status.label}
                    </Tag>
                </div>
                <RowActionsMenu alert={alert} dark={dark} onAction={onAction} />
            </div>
            <div className="flex items-start gap-2">
                <Icon
                    icon={DETECTOR_ICON[alert.detector]}
                    size={16}
                    className="mt-0.5 shrink-0 text-foreground-muted"
                />
                <div className="flex min-w-0 flex-col">
                    <span className="font-medium text-foreground">{alert.title}</span>
                    <span className="text-body-sm text-foreground-muted">{alert.source}</span>
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm text-foreground-muted">
                <span className="flex items-center gap-1.5">
                    <Icon
                        icon={alert.assetKind === "user" ? "person" : "desktop"}
                        size={14}
                        className="shrink-0"
                    />
                    <span className="font-mono">{alert.asset}</span>
                </span>
                <span className={alert.assignee === "Unassigned" ? "italic" : "text-foreground"}>
                    {alert.assignee}
                </span>
                <span className="ml-auto whitespace-nowrap">{alert.age}</span>
            </div>
        </div>
    );
}

export function AlertTable({ alerts, selectedId, focusedId, dark, onSelect, onAction }: AlertTableProps) {
    return (
        <>
            {/* Mobile: stacked cards */}
            <div className="flex flex-col gap-2 md:hidden">
                {alerts.map((alert) => (
                    <AlertCard
                        key={alert.id}
                        alert={alert}
                        selected={alert.id === selectedId}
                        focused={alert.id === focusedId}
                        dark={dark}
                        onSelect={onSelect}
                        onAction={onAction}
                    />
                ))}
            </div>

            {/* md+: full table */}
            <div className="hidden overflow-x-auto rounded-bp border border-border bg-surface md:block">
            <HTMLTable interactive striped className="w-full min-w-[920px]">
                <thead>
                    <tr className="border-b border-border-strong text-left">
                        <th className="px-3 py-2 text-body-sm font-semibold text-foreground-muted whitespace-nowrap">Severity</th>
                        <th className="w-full px-3 py-2 text-body-sm font-semibold text-foreground-muted">Alert</th>
                        <th className="px-3 py-2 text-body-sm font-semibold text-foreground-muted whitespace-nowrap">Asset</th>
                        <th className="px-3 py-2 text-body-sm font-semibold text-foreground-muted whitespace-nowrap">Assignee</th>
                        <th className="px-3 py-2 text-body-sm font-semibold text-foreground-muted whitespace-nowrap">Status</th>
                        <th className="px-3 py-2 text-body-sm font-semibold text-foreground-muted whitespace-nowrap">Age</th>
                        <th className="px-3 py-2 text-body-sm font-semibold text-foreground-muted text-right whitespace-nowrap">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {alerts.map((alert) => {
                        const status = STATUS_META[alert.status];
                        const selected = alert.id === selectedId;
                        const focused = alert.id === focusedId;
                        return (
                            <tr
                                key={alert.id}
                                onClick={() => onSelect(alert)}
                                className={
                                    "cursor-pointer border-b border-border align-top last:border-b-0 " +
                                    (selected ? "bg-[var(--interactive-hover)] " : "") +
                                    (focused ? "outline outline-2 -outline-offset-2 outline-intent-primary-text" : "")
                                }
                            >
                                <td className="px-3 py-1.5">
                                    <Tag intent={SEVERITY_INTENT[alert.severity]} minimal>
                                        {SEVERITY_LABEL[alert.severity]}
                                    </Tag>
                                </td>
                                <td className="px-3 py-1.5">
                                    <div className="flex items-start gap-2">
                                        <Icon
                                            icon={DETECTOR_ICON[alert.detector]}
                                            size={16}
                                            className="mt-0.5 shrink-0 text-foreground-muted"
                                        />
                                        <div className="flex min-w-0 flex-col">
                                            <span className="font-medium text-foreground">{alert.title}</span>
                                            <span className="text-body-sm text-foreground-muted">{alert.source}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-3 py-1.5">
                                    <div className="flex items-center gap-1.5">
                                        <Icon
                                            icon={alert.assetKind === "user" ? "person" : "desktop"}
                                            size={14}
                                            className="shrink-0 text-foreground-muted"
                                        />
                                        <span className="font-mono text-body-sm">{alert.asset}</span>
                                    </div>
                                </td>
                                <td className="px-3 py-1.5">
                                    <span
                                        className={
                                            alert.assignee === "Unassigned"
                                                ? "text-body-sm italic text-foreground-muted"
                                                : "text-body-sm text-foreground"
                                        }
                                    >
                                        {alert.assignee}
                                    </span>
                                </td>
                                <td className="px-3 py-1.5">
                                    <Tag intent={status.intent} minimal>
                                        {status.label}
                                    </Tag>
                                </td>
                                <td className="px-3 py-1.5 whitespace-nowrap text-body-sm text-foreground-muted">
                                    {alert.age}
                                </td>
                                <td className="px-3 py-1.5 text-right">
                                    <RowActionsMenu alert={alert} dark={dark} onAction={onAction} />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </HTMLTable>
            </div>
        </>
    );
}
