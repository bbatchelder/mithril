/* eslint-disable no-restricted-imports */
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card } from "@/components/ui/card";
import { Divider } from "@/components/ui/divider";
import { Drawer, DrawerBody, DrawerSize } from "@/components/ui/drawer";
import { EntityTitle } from "@/components/ui/entity-title";
import { Icon } from "@/components/ui/icon";
import { Menu, MenuItem, MenuDivider } from "@/components/ui/menu";
import { MenuPopover } from "@/components/ui/popover";
import { Tabs, Tab } from "@/components/ui/tabs";
import { Tag } from "@/components/ui/tag";

import {
    type Alert,
    ANALYSTS,
    DETECTOR_ICON,
    IOC_ICON,
    IOC_LABEL,
    SEVERITY_INTENT,
    SEVERITY_LABEL,
    STATUS_META,
} from "./data";

interface AlertDetailProps {
    alert: Alert | null;
    isOpen: boolean;
    dark: boolean;
    onClose: () => void;
    onAcknowledge: (alert: Alert) => void;
    onEscalate: (alert: Alert) => void;
    onAssign: (alert: Alert, analyst: string) => void;
    onCloseIncident: (alert: Alert) => void;
    onCopyIoc: (value: string) => void;
}

function KeyField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-body-sm text-foreground-muted">{label}</span>
            <span className="text-body text-foreground">{children}</span>
        </div>
    );
}

function OverviewTab({ alert }: { alert: Alert }) {
    return (
        <div className="flex flex-col gap-5">
            <Card elevation={0} className="bg-background">
                <EntityTitle
                    icon={alert.assetKind === "user" ? "person" : "desktop"}
                    title={alert.asset}
                    subtitle={alert.assetKind === "user" ? "Affected user" : "Affected host"}
                    size="h4"
                />
            </Card>

            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <KeyField label="Detector">
                    <span className="inline-flex items-center gap-1.5">
                        <Icon icon={DETECTOR_ICON[alert.detector]} size={14} className="text-foreground-muted" />
                        {alert.detector}
                    </span>
                </KeyField>
                <KeyField label="MITRE ATT&CK">
                    <span className="font-mono">{alert.mitre}</span>
                    <span className="ml-1.5 text-body-sm text-foreground-muted">{alert.mitreName}</span>
                </KeyField>
                <KeyField label="First seen">{alert.firstSeen}</KeyField>
                <KeyField label="Source IP">
                    <span className="font-mono">{alert.sourceIp}</span>
                </KeyField>
                <KeyField label="Detection rule">{alert.source}</KeyField>
                <KeyField label="Assignee">{alert.assignee}</KeyField>
            </div>

            <div className="flex flex-col gap-1.5">
                <span className="text-body-sm text-foreground-muted">Description</span>
                <p className="text-body text-foreground">{alert.description}</p>
            </div>

            <Callout
                intent={alert.severity === "critical" || alert.severity === "high" ? "warning" : "primary"}
                title="Recommended response"
            >
                {alert.severity === "critical"
                    ? "Isolate the affected asset, preserve volatile memory, and rotate any credentials observed in the session. Escalate to the on-call incident lead immediately."
                    : alert.severity === "high"
                      ? "Validate the activity with the asset owner, review related sign-ins, and contain the account or host if the behavior is confirmed unauthorized."
                      : "Triage against known baselines, confirm whether the activity is expected, and document the disposition before closing."}
            </Callout>
        </div>
    );
}

function TimelineTab({ alert }: { alert: Alert }) {
    return (
        <ol className="flex flex-col gap-0">
            {alert.timeline.map((ev, i) => (
                <li key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-background">
                            <Icon icon={ev.icon} size={14} className="text-foreground-muted" />
                        </span>
                        {i < alert.timeline.length - 1 && <span className="my-1 w-px flex-1 bg-divider" />}
                    </div>
                    <div className="flex flex-col gap-0.5 pb-5">
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{ev.label}</span>
                            <span className="font-mono text-body-sm text-foreground-muted">{ev.timestamp}</span>
                        </div>
                        {ev.detail != null && (
                            <span className="text-body-sm text-foreground-muted">{ev.detail}</span>
                        )}
                    </div>
                </li>
            ))}
        </ol>
    );
}

function IocTab({ alert, onCopy }: { alert: Alert; onCopy: (value: string) => void }) {
    return (
        <div className="flex flex-col gap-2">
            {alert.iocs.map((ioc, i) => (
                <div
                    key={i}
                    className="flex items-center justify-between gap-3 rounded-bp border border-divider bg-surface px-3 py-2"
                >
                    <div className="flex min-w-0 items-center gap-2.5">
                        <Tag minimal icon={<Icon icon={IOC_ICON[ioc.type]} size={12} className="!text-current" />}>
                            {IOC_LABEL[ioc.type]}
                        </Tag>
                        <span className="truncate font-mono text-body-sm text-foreground">{ioc.value}</span>
                    </div>
                    <Button
                        variant="minimal"
                        size="small"
                        aria-label={`Copy ${ioc.value}`}
                        icon={<Icon icon="duplicate" className="!text-current" />}
                        onClick={() => onCopy(ioc.value)}
                    />
                </div>
            ))}
        </div>
    );
}

function RawEventTab({ alert }: { alert: Alert }) {
    return (
        <Card elevation={0} className="bg-background p-0">
            <pre className="max-h-[420px] overflow-auto p-4 font-mono text-body-sm leading-relaxed text-foreground">
                {JSON.stringify(alert, null, 2)}
            </pre>
        </Card>
    );
}

export function AlertDetail({
    alert,
    isOpen,
    dark,
    onClose,
    onAcknowledge,
    onEscalate,
    onAssign,
    onCloseIncident,
    onCopyIoc,
}: AlertDetailProps) {
    return (
        <Drawer
            open={isOpen}
            onOpenChange={(next) => {
                if (!next) onClose();
            }}
            size={DrawerSize.LARGE}
            position="right"
            closeButton={false}
            dark={dark}
        >
            {alert != null && (
                <>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 border-b border-divider px-5 py-4">
                        <div className="flex min-w-0 flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                                <Tag intent={SEVERITY_INTENT[alert.severity]}>
                                    {SEVERITY_LABEL[alert.severity]}
                                </Tag>
                                <Tag minimal intent={STATUS_META[alert.status].intent}>
                                    {STATUS_META[alert.status].label}
                                </Tag>
                                <span className="font-mono text-body-sm text-foreground-muted">{alert.id}</span>
                            </div>
                            <h2 className="text-heading-sm font-semibold text-foreground">{alert.title}</h2>
                        </div>
                        <Button
                            variant="minimal"
                            aria-label="Close drawer"
                            icon={<Icon icon="cross" className="!text-current" />}
                            onClick={onClose}
                        />
                    </div>

                    {/* Action bar */}
                    <div className="flex flex-wrap items-center gap-2 border-b border-divider bg-background px-5 py-3">
                        <Button
                            icon={<Icon icon="endorsed" className="!text-current" />}
                            onClick={() => onAcknowledge(alert)}
                        >
                            Acknowledge
                        </Button>
                        <Button
                            intent="warning"
                            icon={<Icon icon="arrow-up" className="!text-current" />}
                            onClick={() => onEscalate(alert)}
                        >
                            Escalate
                        </Button>
                        <MenuPopover
                            side="bottom"
                            align="start"
                            dark={dark}
                            content={
                                <Menu>
                                    <MenuDivider title="Assign to" />
                                    {ANALYSTS.filter((a) => a !== "Unassigned").map((analyst) => (
                                        <MenuItem
                                            key={analyst}
                                            icon="person"
                                            text={analyst}
                                            active={analyst === alert.assignee}
                                            onClick={() => onAssign(alert, analyst)}
                                        />
                                    ))}
                                    <MenuDivider />
                                    <MenuItem
                                        icon="disable"
                                        text="Unassign"
                                        onClick={() => onAssign(alert, "Unassigned")}
                                    />
                                </Menu>
                            }
                        >
                            <Button
                                variant="outlined"
                                icon={<Icon icon="person" className="!text-current" />}
                                endIcon={<Icon icon="caret-down" className="!text-current" />}
                            >
                                Assign
                            </Button>
                        </MenuPopover>
                        <div className="grow" />
                        <Button
                            intent="danger"
                            variant="outlined"
                            icon={<Icon icon="cross" className="!text-current" />}
                            onClick={() => onCloseIncident(alert)}
                        >
                            Close incident
                        </Button>
                    </div>

                    <DrawerBody className="px-5 pb-5">
                        <Tabs id={`alert-tabs-${alert.id}`} defaultSelectedTabId="overview">
                            <Tab id="overview" title="Overview" panel={<OverviewTab alert={alert} />} />
                            <Tab id="timeline" title="Timeline" panel={<TimelineTab alert={alert} />} />
                            <Tab
                                id="iocs"
                                title={
                                    <span className="inline-flex items-center gap-1.5">
                                        Indicators
                                        <Tag minimal round>
                                            {alert.iocs.length}
                                        </Tag>
                                    </span>
                                }
                                panel={<IocTab alert={alert} onCopy={onCopyIoc} />}
                            />
                            <Tab id="raw" title="Raw Event" panel={<RawEventTab alert={alert} />} />
                        </Tabs>
                    </DrawerBody>

                    <div className="flex items-center justify-between gap-2 border-t border-divider px-5 py-3">
                        <span className="text-body-sm text-foreground-muted">
                            Detected {alert.age} · {alert.detector}
                        </span>
                        <div className="flex items-center gap-2">
                            <Divider />
                            <Button variant="minimal" onClick={onClose}>
                                Close
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </Drawer>
    );
}
