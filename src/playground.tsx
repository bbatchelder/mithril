/**
 * Interactive playgrounds for the component showcase pages.
 *
 * Each entry in `PLAYGROUNDS` (keyed by component id) drives a single live instance you
 * manipulate with controls + presets, with a live code snippet underneath. The layout is
 * stage-on-top, controls-below, code-last. Only *inline* (non-portaled) controls and demo
 * components are used here, so dark mode works via the ancestor `.dark` with no threading.
 *
 * Components without an entry fall back to their existing Examples gallery — add a config
 * here to give one the interactive treatment.
 */
import { useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { Callout } from "@/components/ui/callout";
import { Spinner, SpinnerSize } from "@/components/ui/spinner";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { InputGroup } from "@/components/ui/input-group";
import { Icon, type IconName } from "@/components/ui/icon";
import { Slider } from "@/components/ui/slider";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { HTMLSelect } from "@/components/ui/html-select";
import { NumericInput } from "@/components/ui/numeric-input";

// ── Config model ─────────────────────────────────────────────────────────────
type EnumOption = { value: string; label?: string };
type Control =
    | { kind: "boolean"; prop: string; label?: string }
    | { kind: "enum"; prop: string; label?: string; options: EnumOption[]; widget?: "segmented" | "select" }
    | { kind: "text"; prop: string; label?: string; placeholder?: string }
    | { kind: "number"; prop: string; label?: string; min: number; max: number; stepSize: number };

interface Preset {
    name: string;
    props: Record<string, unknown>;
}

export interface PlaygroundConfig {
    /** Starting prop values (also the "Custom…" reset target). */
    initial: Record<string, unknown>;
    controls: Control[];
    presets?: Preset[];
    /** Render the live instance from the current prop state. */
    render: (props: Record<string, never>) => React.ReactNode;
    /** Produce the code snippet for the current prop state. */
    code: (props: Record<string, never>) => string;
}

// ── Code-snippet helper ──────────────────────────────────────────────────────
type AttrVal = string | number | boolean | undefined | null;

/** Render a JSX-ish element string, omitting empty/false/undefined attributes. */
function jsx(tag: string, attrs: Record<string, AttrVal>, children?: string): string {
    const parts: string[] = [];
    for (const [k, v] of Object.entries(attrs)) {
        if (v === undefined || v === null || v === false || v === "") continue;
        if (v === true) parts.push(k);
        else if (typeof v === "number") parts.push(`${k}={${v}}`);
        else if (v.startsWith("{") && v.endsWith("}")) parts.push(`${k}=${v}`); // expression escape hatch
        else parts.push(`${k}="${v}"`);
    }
    const a = parts.length ? ` ${parts.join(" ")}` : "";
    return children != null && children !== "" ? `<${tag}${a}>${children}</${tag}>` : `<${tag}${a} />`;
}

// ── Shared option sets ───────────────────────────────────────────────────────
const INTENTS: EnumOption[] = [
    { value: "none" },
    { value: "primary" },
    { value: "success" },
    { value: "warning" },
    { value: "danger" },
];
const VARIANTS: EnumOption[] = [{ value: "solid" }, { value: "outlined" }, { value: "minimal" }];
const SIZES: EnumOption[] = [{ value: "small" }, { value: "medium" }, { value: "large" }];
const ALIGN: EnumOption[] = [{ value: "left" }, { value: "right" }];
const ICONS: EnumOption[] = [
    { value: "", label: "none" },
    { value: "add" },
    { value: "search" },
    { value: "cog" },
    { value: "download" },
    { value: "share" },
    { value: "star" },
    { value: "user" },
    { value: "tick" },
    { value: "trash" },
];
const ICONS_REQ = ICONS.slice(1);

// ── The playground renderer ──────────────────────────────────────────────────
function ControlField({
    control,
    value,
    onChange,
}: {
    control: Control;
    value: unknown;
    onChange: (v: unknown) => void;
}) {
    const label = control.label ?? control.prop;
    if (control.kind === "boolean") {
        return <Switch label={label} checked={!!value} onChange={(e) => onChange(e.target.checked)} />;
    }
    if (control.kind === "text") {
        return (
            <div className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-body-sm text-foreground-muted">{label}</span>
                <InputGroup
                    value={String(value ?? "")}
                    placeholder={control.placeholder}
                    onChange={(e) => onChange(e.target.value)}
                    style={{ width: 170 }}
                />
            </div>
        );
    }
    if (control.kind === "number") {
        return (
            <div className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-body-sm text-foreground-muted">{label}</span>
                <NumericInput
                    value={value as number}
                    min={control.min}
                    max={control.max}
                    stepSize={control.stepSize}
                    onValueChange={(n) => onChange(n)}
                    style={{ width: 110 }}
                />
            </div>
        );
    }
    const widget = control.widget ?? (control.options.length <= 3 ? "segmented" : "select");
    return (
        <div className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-body-sm text-foreground-muted">{label}</span>
            {widget === "segmented" ? (
                <SegmentedControl
                    size="small"
                    options={control.options.map((o) => ({ label: o.label ?? o.value, value: o.value }))}
                    value={String(value)}
                    onValueChange={onChange}
                />
            ) : (
                <HTMLSelect
                    value={String(value)}
                    onChange={(e) => onChange(e.target.value)}
                    options={control.options.map((o) => ({ value: o.value, label: o.label ?? o.value }))}
                />
            )}
        </div>
    );
}

function PlaygroundCode({ code }: { code: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <div className="flex items-center gap-2 rounded-bp border border-border bg-surface py-1.5 pl-3 pr-1.5">
            <pre className="flex-1 overflow-x-auto text-body-sm text-foreground">
                <code className="font-mono">{code}</code>
            </pre>
            <Button
                size="small"
                variant="minimal"
                aria-label={copied ? "Copied" : "Copy to clipboard"}
                title={copied ? "Copied" : "Copy"}
                icon={<Icon icon={copied ? "tick" : "duplicate"} className="!text-current" />}
                onClick={() =>
                    navigator.clipboard?.writeText(code).then(() => {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                    })
                }
            />
        </div>
    );
}

/** Renders the playground for a given config: stage → controls (+ presets) → code. */
export function Playground({ config }: { config: PlaygroundConfig }) {
    const [props, setProps] = useState<Record<string, unknown>>(() => ({ ...config.initial }));
    const [preset, setPreset] = useState("");
    const set = (prop: string, value: unknown) => {
        setProps((p) => ({ ...p, [prop]: value }));
        setPreset("");
    };
    const presetNames = config.presets?.map((p) => p.name) ?? [];
    const applyPreset = (name: string) => {
        if (!name) {
            setProps({ ...config.initial });
            setPreset("");
            return;
        }
        const pr = config.presets?.find((p) => p.name === name);
        if (pr) {
            setProps({ ...config.initial, ...pr.props });
            setPreset(name);
        }
    };
    const live = props as Record<string, never>;
    return (
        <div className="flex flex-col gap-3">
            {/* Stage */}
            <div className="flex min-h-[160px] flex-wrap items-center justify-center gap-4 rounded-bp border border-border bg-surface p-8">
                {config.render(live)}
            </div>
            {/* Controls */}
            <div className="flex flex-col gap-4 rounded-bp border border-border bg-surface p-4">
                {presetNames.length > 0 && (
                    <div className="flex items-center gap-3">
                        <span className="w-24 shrink-0 text-body-sm text-foreground-muted">Preset</span>
                        <HTMLSelect
                            value={preset}
                            onChange={(e) => applyPreset(e.target.value)}
                            options={[{ value: "", label: "Custom…" }, ...presetNames.map((n) => ({ value: n }))]}
                        />
                    </div>
                )}
                <div className={cn("grid gap-x-8 gap-y-3", config.controls.length > 1 && "sm:grid-cols-2")}>
                    {config.controls.map((c) => (
                        <ControlField key={c.prop} control={c} value={props[c.prop]} onChange={(v) => set(c.prop, v)} />
                    ))}
                </div>
            </div>
            {/* Code */}
            <PlaygroundCode code={config.code(live)} />
        </div>
    );
}

// ── The curated configs ──────────────────────────────────────────────────────
export const PLAYGROUNDS: Record<string, PlaygroundConfig> = {
    button: {
        initial: { variant: "solid", intent: "primary", size: "medium", label: "Click me", icon: "", fill: false, loading: false, disabled: false },
        controls: [
            { kind: "enum", prop: "variant", options: VARIANTS },
            { kind: "enum", prop: "intent", options: INTENTS },
            { kind: "enum", prop: "size", options: SIZES },
            { kind: "enum", prop: "icon", options: ICONS },
            { kind: "text", prop: "label" },
            { kind: "boolean", prop: "fill" },
            { kind: "boolean", prop: "loading" },
            { kind: "boolean", prop: "disabled" },
        ],
        presets: [
            { name: "Primary CTA", props: { variant: "solid", intent: "primary", label: "Save changes", icon: "tick" } },
            { name: "Danger", props: { variant: "solid", intent: "danger", label: "Delete", icon: "trash" } },
            { name: "Minimal", props: { variant: "minimal", intent: "none", label: "Cancel", icon: "" } },
        ],
        render: (p) => (
            <Button
                variant={p.variant}
                intent={p.intent}
                size={p.size}
                fill={p.fill}
                loading={p.loading}
                disabled={p.disabled}
                icon={p.icon || undefined}
            >
                {p.label}
            </Button>
        ),
        code: (p) => jsx("Button", { variant: p.variant, intent: p.intent, size: p.size, icon: p.icon, fill: p.fill, loading: p.loading, disabled: p.disabled }, p.label),
    },

    tag: {
        initial: { intent: "primary", label: "Tag", icon: "", minimal: false, round: false, large: false },
        controls: [
            { kind: "enum", prop: "intent", options: INTENTS },
            { kind: "enum", prop: "icon", options: ICONS },
            { kind: "text", prop: "label" },
            { kind: "boolean", prop: "minimal" },
            { kind: "boolean", prop: "round" },
            { kind: "boolean", prop: "large" },
        ],
        presets: [
            { name: "Status", props: { intent: "success", minimal: true, round: true, icon: "tick", label: "Active" } },
            { name: "Count", props: { intent: "primary", round: true, label: "12" } },
        ],
        render: (p) => (
            <Tag intent={p.intent} minimal={p.minimal} round={p.round} size={p.large ? "large" : "medium"} icon={p.icon || undefined}>
                {p.label}
            </Tag>
        ),
        code: (p) => jsx("Tag", { intent: p.intent, icon: p.icon, minimal: p.minimal, round: p.round, size: p.large ? "large" : undefined }, p.label),
    },

    callout: {
        initial: { intent: "primary", title: "Heads up", body: "This is the callout body content.", icon: "auto", compact: false, minimal: false },
        controls: [
            { kind: "enum", prop: "intent", options: INTENTS },
            { kind: "enum", prop: "icon", options: [{ value: "auto" }, { value: "none" }] },
            { kind: "text", prop: "title" },
            { kind: "text", prop: "body" },
            { kind: "boolean", prop: "compact" },
            { kind: "boolean", prop: "minimal" },
        ],
        presets: [
            { name: "Warning", props: { intent: "warning", title: "Careful", body: "This action can't be undone." } },
            { name: "Minimal note", props: { intent: "none", minimal: true, title: "Note", body: "A quiet inline note." } },
        ],
        render: (p) => (
            <div style={{ width: 360 }}>
                <Callout intent={p.intent} title={p.title} compact={p.compact} minimal={p.minimal} icon={p.icon === "none" ? null : undefined}>
                    {p.body}
                </Callout>
            </div>
        ),
        code: (p) => jsx("Callout", { intent: p.intent, title: p.title, compact: p.compact, minimal: p.minimal, icon: p.icon === "none" ? "{null}" : undefined }, p.body),
    },

    spinner: {
        initial: { size: "standard", intent: "primary", value: 0.4 },
        controls: [
            { kind: "enum", prop: "size", options: [{ value: "small" }, { value: "standard" }, { value: "large" }] },
            { kind: "enum", prop: "intent", options: INTENTS },
            { kind: "number", prop: "value", label: "value", min: 0, max: 1, stepSize: 0.05 },
        ],
        render: (p) => {
            const size = { small: SpinnerSize.SMALL, standard: SpinnerSize.STANDARD, large: SpinnerSize.LARGE }[p.size as string];
            return <Spinner size={size} intent={p.intent} value={p.value} aria-label="spinner" />;
        },
        code: (p) => jsx("Spinner", { size: `{SpinnerSize.${String(p.size).toUpperCase()}}`, intent: p.intent, value: p.value }),
    },

    "progress-bar": {
        initial: { intent: "primary", value: 0.6, stripes: true, animate: true },
        controls: [
            { kind: "enum", prop: "intent", options: INTENTS },
            { kind: "number", prop: "value", label: "value", min: 0, max: 1, stepSize: 0.05 },
            { kind: "boolean", prop: "stripes" },
            { kind: "boolean", prop: "animate" },
        ],
        render: (p) => (
            <div style={{ width: 280 }}>
                <ProgressBar intent={p.intent} value={p.value} stripes={p.stripes} animate={p.animate} aria-label="progress" />
            </div>
        ),
        code: (p) => jsx("ProgressBar", { intent: p.intent, value: p.value, stripes: p.stripes, animate: p.animate }),
    },

    switch: {
        initial: { label: "Enable feature", large: false, disabled: false, alignIndicator: "left" },
        controls: [
            { kind: "text", prop: "label" },
            { kind: "enum", prop: "alignIndicator", label: "align", options: ALIGN },
            { kind: "boolean", prop: "large" },
            { kind: "boolean", prop: "disabled" },
        ],
        render: (p) => <Switch label={p.label} large={p.large} disabled={p.disabled} alignIndicator={p.alignIndicator} defaultChecked />,
        code: (p) => jsx("Switch", { label: p.label, large: p.large, disabled: p.disabled, alignIndicator: p.alignIndicator === "left" ? undefined : p.alignIndicator, defaultChecked: true }),
    },

    checkbox: {
        initial: { label: "Accept terms", large: false, disabled: false, indeterminate: false, alignIndicator: "left" },
        controls: [
            { kind: "text", prop: "label" },
            { kind: "enum", prop: "alignIndicator", label: "align", options: ALIGN },
            { kind: "boolean", prop: "large" },
            { kind: "boolean", prop: "disabled" },
            { kind: "boolean", prop: "indeterminate" },
        ],
        render: (p) => <Checkbox label={p.label} large={p.large} disabled={p.disabled} indeterminate={p.indeterminate} alignIndicator={p.alignIndicator} defaultChecked />,
        code: (p) => jsx("Checkbox", { label: p.label, large: p.large, disabled: p.disabled, indeterminate: p.indeterminate, alignIndicator: p.alignIndicator === "left" ? undefined : p.alignIndicator, defaultChecked: true }),
    },

    "input-group": {
        initial: { size: "medium", intent: "none", placeholder: "Search…", leftIcon: "search", round: false, disabled: false },
        controls: [
            { kind: "enum", prop: "size", options: SIZES },
            { kind: "enum", prop: "intent", options: INTENTS },
            { kind: "enum", prop: "leftIcon", label: "leftIcon", options: ICONS },
            { kind: "text", prop: "placeholder" },
            { kind: "boolean", prop: "round" },
            { kind: "boolean", prop: "disabled" },
        ],
        render: (p) => (
            <div style={{ width: 260 }}>
                <InputGroup size={p.size} intent={p.intent} placeholder={p.placeholder} round={p.round} disabled={p.disabled} leftIcon={p.leftIcon || undefined} />
            </div>
        ),
        code: (p) => jsx("InputGroup", { size: p.size, intent: p.intent === "none" ? undefined : p.intent, leftIcon: p.leftIcon, placeholder: p.placeholder, round: p.round, disabled: p.disabled }),
    },

    icon: {
        initial: { icon: "star", size: 20, intent: "none" },
        controls: [
            { kind: "enum", prop: "icon", options: ICONS_REQ },
            { kind: "enum", prop: "intent", options: INTENTS },
            { kind: "number", prop: "size", label: "size", min: 12, max: 48, stepSize: 2 },
        ],
        render: (p) => <Icon icon={p.icon as IconName} size={p.size} intent={p.intent} />,
        code: (p) => jsx("Icon", { icon: p.icon, size: p.size, intent: p.intent === "none" ? undefined : p.intent }),
    },

    slider: {
        initial: { intent: "primary", stepSize: 10, vertical: false, disabled: false, showTrackFill: true },
        controls: [
            { kind: "enum", prop: "intent", options: INTENTS },
            { kind: "number", prop: "stepSize", label: "stepSize", min: 1, max: 25, stepSize: 1 },
            { kind: "boolean", prop: "showTrackFill", label: "trackFill" },
            { kind: "boolean", prop: "vertical" },
            { kind: "boolean", prop: "disabled" },
        ],
        render: (p) => (
            <div style={p.vertical ? { height: 180 } : { width: 280 }}>
                <Slider
                    min={0}
                    max={100}
                    stepSize={p.stepSize}
                    labelStepSize={Math.max(20, (p.stepSize as number) * 2)}
                    intent={p.intent}
                    vertical={p.vertical}
                    disabled={p.disabled}
                    showTrackFill={p.showTrackFill}
                    defaultValue={40}
                />
            </div>
        ),
        code: (p) => jsx("Slider", { min: 0, max: 100, stepSize: p.stepSize, intent: p.intent, vertical: p.vertical, disabled: p.disabled, showTrackFill: p.showTrackFill, defaultValue: 40 }),
    },
};
