/* eslint-disable no-restricted-imports */
import { useEffect, useState } from "react";

import { FormGroup } from "@/components/ui/form-group";
import { HTMLSelect } from "@/components/ui/html-select";
import { Icon } from "@/components/ui/icon";
import { InputGroup } from "@/components/ui/input-group";
import { MultistepDialog, DialogStep } from "@/components/ui/multistep-dialog";
import { RadioGroup } from "@/components/ui/radio";
import { Tag } from "@/components/ui/tag";
import { TextArea } from "@/components/ui/text-area";

import {
    type Detector,
    type Severity,
    ANALYSTS,
    DETECTOR_ICON,
    SEVERITY_INTENT,
    SEVERITY_LABEL,
} from "./data";

/** The fields collected by the wizard. `SocConsole` turns this into a full `Alert`. */
export interface NewIncidentDraft {
    title: string;
    severity: Severity;
    detector: Detector;
    asset: string;
    assetKind: "host" | "user";
    sourceIp: string;
    assignee: string;
    description: string;
}

interface NewIncidentDialogProps {
    isOpen: boolean;
    dark: boolean;
    onClose: () => void;
    onCreate: (draft: NewIncidentDraft) => void;
}

const DETECTORS = Object.keys(DETECTOR_ICON) as Detector[];
const SEVERITIES: Severity[] = ["critical", "high", "medium", "low"];

const EMPTY: NewIncidentDraft = {
    title: "",
    severity: "medium",
    detector: "EDR",
    asset: "",
    assetKind: "host",
    sourceIp: "",
    assignee: "Unassigned",
    description: "",
};

export function NewIncidentDialog({ isOpen, dark, onClose, onCreate }: NewIncidentDialogProps) {
    const [draft, setDraft] = useState<NewIncidentDraft>(EMPTY);
    // Bumped on each open so the MultistepDialog remounts with a fresh step index.
    const [session, setSession] = useState(0);

    // Reset the form (and rewind the wizard to step 1) every time it opens.
    useEffect(() => {
        if (isOpen) {
            setDraft(EMPTY);
            setSession((s) => s + 1);
        }
    }, [isOpen]);

    const set = <K extends keyof NewIncidentDraft>(key: K, value: NewIncidentDraft[K]) =>
        setDraft((d) => ({ ...d, [key]: value }));

    const handleCreate = () => {
        onCreate(draft);
        onClose();
    };

    return (
        <MultistepDialog
            key={session}
            open={isOpen}
            onOpenChange={(next) => {
                if (!next) onClose();
            }}
            dark={dark}
            title="New incident"
            icon={<Icon icon="shield" />}
            backButtonProps={{ children: "Back" }}
            finalButtonProps={{
                children: "Create incident",
                icon: <Icon icon="tick" className="!text-current" />,
                disabled: draft.description.trim() === "",
                onClick: handleCreate,
            }}
        >
            {/* ── Step 1: classification ───────────────────────────────────── */}
            <DialogStep
                id="details"
                title="Details"
                nextButtonProps={{ disabled: draft.title.trim() === "" }}
                panel={
                    <div className="flex flex-col gap-4 p-5">
                        <FormGroup label="Incident title" labelFor="ni-title" labelInfo="(required)">
                            <InputGroup
                                id="ni-title"
                                fill
                                placeholder="e.g. Suspicious PowerShell on WS-FINANCE-07"
                                value={draft.title}
                                onChange={(e) => set("title", e.target.value)}
                            />
                        </FormGroup>
                        <div className="grid grid-cols-2 gap-4">
                            <FormGroup label="Severity" labelFor="ni-severity">
                                <HTMLSelect
                                    id="ni-severity"
                                    fill
                                    value={draft.severity}
                                    onChange={(e) => set("severity", e.target.value as Severity)}
                                    options={SEVERITIES.map((s) => ({ label: SEVERITY_LABEL[s], value: s }))}
                                />
                            </FormGroup>
                            <FormGroup label="Detector" labelFor="ni-detector">
                                <HTMLSelect
                                    id="ni-detector"
                                    fill
                                    value={draft.detector}
                                    onChange={(e) => set("detector", e.target.value as Detector)}
                                    options={DETECTORS.map((d) => ({ label: d, value: d }))}
                                />
                            </FormGroup>
                        </div>
                    </div>
                }
            />

            {/* ── Step 2: affected asset ───────────────────────────────────── */}
            <DialogStep
                id="asset"
                title="Affected asset"
                nextButtonProps={{ disabled: draft.asset.trim() === "" }}
                panel={
                    <div className="flex flex-col gap-4 p-5">
                        <FormGroup label="Asset type">
                            <RadioGroup
                                name="ni-asset-kind"
                                inline
                                selectedValue={draft.assetKind}
                                onChange={(v) => set("assetKind", v as "host" | "user")}
                                options={[
                                    { label: "Host", value: "host" },
                                    { label: "User", value: "user" },
                                ]}
                            />
                        </FormGroup>
                        <FormGroup
                            label={draft.assetKind === "user" ? "Affected user" : "Affected host"}
                            labelFor="ni-asset"
                            labelInfo="(required)"
                        >
                            <InputGroup
                                id="ni-asset"
                                fill
                                placeholder={draft.assetKind === "user" ? "j.okafor@acme.io" : "WS-FINANCE-07"}
                                value={draft.asset}
                                onChange={(e) => set("asset", e.target.value)}
                            />
                        </FormGroup>
                        <div className="grid grid-cols-2 gap-4">
                            <FormGroup label="Source IP" labelFor="ni-ip" subLabel="Adds an IP indicator">
                                <InputGroup
                                    id="ni-ip"
                                    fill
                                    placeholder="10.4.22.118"
                                    value={draft.sourceIp}
                                    onChange={(e) => set("sourceIp", e.target.value)}
                                />
                            </FormGroup>
                            <FormGroup label="Assign to" labelFor="ni-assignee">
                                <HTMLSelect
                                    id="ni-assignee"
                                    fill
                                    value={draft.assignee}
                                    onChange={(e) => set("assignee", e.target.value)}
                                    options={ANALYSTS.map((a) => ({ label: a, value: a }))}
                                />
                            </FormGroup>
                        </div>
                    </div>
                }
            />

            {/* ── Step 3: description + review ─────────────────────────────── */}
            <DialogStep
                id="review"
                title="Review"
                panel={
                    <div className="flex flex-col gap-4 p-5">
                        <FormGroup label="Description" labelFor="ni-description" labelInfo="(required)">
                            <TextArea
                                id="ni-description"
                                fill
                                rows={4}
                                placeholder="Summarize what was observed and why it warrants an incident…"
                                value={draft.description}
                                onChange={(e) => set("description", e.target.value)}
                            />
                        </FormGroup>
                        <div className="flex flex-col gap-2 rounded-bp border border-divider bg-surface p-3">
                            <div className="flex items-center gap-2">
                                <Tag intent={SEVERITY_INTENT[draft.severity]} minimal>
                                    {SEVERITY_LABEL[draft.severity]}
                                </Tag>
                                <span className="font-medium text-foreground">
                                    {draft.title.trim() || "Untitled incident"}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-x-6 gap-y-1 text-body-sm text-foreground-muted">
                                <span className="inline-flex items-center gap-1.5">
                                    <Icon icon={DETECTOR_ICON[draft.detector]} size={14} />
                                    {draft.detector}
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <Icon icon={draft.assetKind === "user" ? "person" : "desktop"} size={14} />
                                    {draft.asset.trim() || "—"}
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <Icon icon="person" size={14} />
                                    {draft.assignee}
                                </span>
                            </div>
                        </div>
                    </div>
                }
            />
        </MultistepDialog>
    );
}

export default NewIncidentDialog;
