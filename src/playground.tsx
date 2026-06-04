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
import { AnchorButton } from "@/components/ui/anchor-button";
import { Tag } from "@/components/ui/tag";
import { Callout } from "@/components/ui/callout";
import { Spinner, SpinnerSize } from "@/components/ui/spinner";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { InputGroup } from "@/components/ui/input-group";
import { TextArea } from "@/components/ui/text-area";
import { EditableText } from "@/components/ui/editable-text";
import { Icon, type IconName } from "@/components/ui/icon";
import { Slider } from "@/components/ui/slider";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { HTMLSelect } from "@/components/ui/html-select";
import { NumericInput } from "@/components/ui/numeric-input";
import { Card, type CardElevation } from "@/components/ui/card";
import { EntityTitle, type EntityTitleSize } from "@/components/ui/entity-title";
import { NonIdealState } from "@/components/ui/non-ideal-state";
import { Link } from "@/components/ui/link";
import { Divider } from "@/components/ui/divider";
import { Collapse } from "@/components/ui/collapse";
import { Menu, MenuItem, MenuDivider } from "@/components/ui/menu";
import { Tabs, Tab } from "@/components/ui/tabs";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { HTMLTable } from "@/components/ui/html-table";
import { CardList } from "@/components/ui/card-list";
import { Section, SectionCard, type SectionElevation } from "@/components/ui/section";
import { CheckboxCard, RadioCard, SwitchCard } from "@/components/ui/control-card";
import { RadioGroup } from "@/components/ui/radio";

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
    { value: "caret-down" },
];
const ICONS_REQ = ICONS.slice(1);
const ELEVATIONS: EnumOption[] = [{ value: "0" }, { value: "1" }, { value: "2" }, { value: "3" }, { value: "4" }];
const ENTITY_SIZES: EnumOption[] = [
    { value: "text" },
    { value: "h1" },
    { value: "h2" },
    { value: "h3" },
    { value: "h4" },
    { value: "h5" },
    { value: "h6" },
];
const UNDERLINE: EnumOption[] = [{ value: "always" }, { value: "hover" }, { value: "none" }];
const LINK_COLORS: EnumOption[] = [
    { value: "primary" },
    { value: "success" },
    { value: "warning" },
    { value: "danger" },
    { value: "inherit" },
];
const LAYOUTS: EnumOption[] = [{ value: "vertical" }, { value: "horizontal" }];
const BUTTON_POSITIONS: EnumOption[] = [{ value: "left" }, { value: "right" }, { value: "none" }];

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

/** RadioGroup is controlled, so it needs its own state to be interactive in the stage. */
function RadioGroupDemo({ inline, disabled }: { inline: boolean; disabled: boolean }) {
    const [value, setValue] = useState("week");
    return (
        <RadioGroup
            name="pg-radio"
            label="Frequency"
            selectedValue={value}
            onChange={(v) => setValue(v)}
            inline={inline}
            disabled={disabled}
            options={[
                { value: "day", label: "Daily" },
                { value: "week", label: "Weekly" },
                { value: "month", label: "Monthly" },
            ]}
        />
    );
}

// ── The curated configs ──────────────────────────────────────────────────────
export const PLAYGROUNDS: Record<string, PlaygroundConfig> = {
    button: {
        initial: { variant: "solid", intent: "primary", size: "medium", label: "Click me", icon: "", endIcon: "", fill: false, loading: false, disabled: false },
        controls: [
            { kind: "enum", prop: "variant", options: VARIANTS },
            { kind: "enum", prop: "intent", options: INTENTS },
            { kind: "enum", prop: "size", options: SIZES },
            { kind: "enum", prop: "icon", options: ICONS },
            { kind: "enum", prop: "endIcon", label: "endIcon", options: ICONS },
            { kind: "text", prop: "label" },
            { kind: "boolean", prop: "fill" },
            { kind: "boolean", prop: "loading" },
            { kind: "boolean", prop: "disabled" },
        ],
        presets: [
            { name: "Primary CTA", props: { variant: "solid", intent: "primary", label: "Save changes", icon: "tick" } },
            { name: "Danger", props: { variant: "solid", intent: "danger", label: "Delete", icon: "trash" } },
            { name: "Dropdown", props: { variant: "outlined", intent: "none", label: "Options", endIcon: "caret-down" } },
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
                endIcon={p.endIcon || undefined}
            >
                {p.label}
            </Button>
        ),
        code: (p) => jsx("Button", { variant: p.variant, intent: p.intent, size: p.size, icon: p.icon, endIcon: p.endIcon, fill: p.fill, loading: p.loading, disabled: p.disabled }, p.label),
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

    // ── Batch 2: form controls ────────────────────────────────────────────────
    "anchor-button": {
        initial: { variant: "solid", intent: "primary", size: "medium", label: "Continue", icon: "", endIcon: "share", fill: false, active: false, disabled: false },
        controls: [
            { kind: "enum", prop: "variant", options: VARIANTS },
            { kind: "enum", prop: "intent", options: INTENTS },
            { kind: "enum", prop: "size", options: SIZES },
            { kind: "enum", prop: "icon", options: ICONS },
            { kind: "enum", prop: "endIcon", label: "endIcon", options: ICONS },
            { kind: "text", prop: "label" },
            { kind: "boolean", prop: "fill" },
            { kind: "boolean", prop: "active" },
            { kind: "boolean", prop: "disabled" },
        ],
        presets: [
            { name: "External link", props: { variant: "minimal", intent: "primary", label: "Open docs", icon: "", endIcon: "share" } },
            { name: "Disabled", props: { variant: "solid", intent: "none", label: "Unavailable", disabled: true } },
        ],
        render: (p) => (
            <AnchorButton href="#" variant={p.variant} intent={p.intent} size={p.size} fill={p.fill} active={p.active} disabled={p.disabled} icon={p.icon || undefined} endIcon={p.endIcon || undefined}>
                {p.label}
            </AnchorButton>
        ),
        code: (p) => jsx("AnchorButton", { href: "#", variant: p.variant, intent: p.intent, size: p.size, icon: p.icon, endIcon: p.endIcon, fill: p.fill, active: p.active, disabled: p.disabled }, p.label),
    },

    "text-area": {
        initial: { size: "medium", intent: "none", placeholder: "Write a message…", rows: 4, fill: false, disabled: false, autoResize: false },
        controls: [
            { kind: "enum", prop: "size", options: SIZES },
            { kind: "enum", prop: "intent", options: INTENTS },
            { kind: "number", prop: "rows", label: "rows", min: 2, max: 10, stepSize: 1 },
            { kind: "text", prop: "placeholder" },
            { kind: "boolean", prop: "fill" },
            { kind: "boolean", prop: "disabled" },
            { kind: "boolean", prop: "autoResize" },
        ],
        render: (p) => (
            <div style={{ width: 300 }}>
                <TextArea size={p.size} intent={p.intent} rows={p.rows} placeholder={p.placeholder} fill={p.fill} disabled={p.disabled} autoResize={p.autoResize} />
            </div>
        ),
        code: (p) => jsx("TextArea", { size: p.size, intent: p.intent === "none" ? undefined : p.intent, rows: p.rows, placeholder: p.placeholder, fill: p.fill, disabled: p.disabled, autoResize: p.autoResize }),
    },

    "html-select": {
        initial: { large: false, minimal: false, fill: false, disabled: false },
        controls: [
            { kind: "boolean", prop: "large" },
            { kind: "boolean", prop: "minimal" },
            { kind: "boolean", prop: "fill" },
            { kind: "boolean", prop: "disabled" },
        ],
        render: (p) => (
            <div style={{ width: 220 }}>
                <HTMLSelect large={p.large} minimal={p.minimal} fill={p.fill} disabled={p.disabled} defaultValue="Banana" options={["Apple", "Banana", "Cherry", "Date"]} />
            </div>
        ),
        code: (p) => `<HTMLSelect${p.large ? " large" : ""}${p.minimal ? " minimal" : ""}${p.fill ? " fill" : ""}${p.disabled ? " disabled" : ""} options={["Apple", "Banana", "Cherry", "Date"]} />`,
    },

    "numeric-input": {
        initial: { size: "medium", intent: "none", buttonPosition: "right", stepSize: 1, fill: false, disabled: false },
        controls: [
            { kind: "enum", prop: "size", options: SIZES },
            { kind: "enum", prop: "intent", options: INTENTS },
            { kind: "enum", prop: "buttonPosition", label: "buttons", options: BUTTON_POSITIONS },
            { kind: "number", prop: "stepSize", label: "stepSize", min: 1, max: 25, stepSize: 1 },
            { kind: "boolean", prop: "fill" },
            { kind: "boolean", prop: "disabled" },
        ],
        render: (p) => (
            <div style={{ width: 200 }}>
                <NumericInput size={p.size} intent={p.intent} buttonPosition={p.buttonPosition} stepSize={p.stepSize} fill={p.fill} disabled={p.disabled} defaultValue={5} />
            </div>
        ),
        code: (p) => jsx("NumericInput", { size: p.size, intent: p.intent === "none" ? undefined : p.intent, buttonPosition: p.buttonPosition === "right" ? undefined : p.buttonPosition, stepSize: p.stepSize, fill: p.fill, disabled: p.disabled, defaultValue: 5 }),
    },

    "segmented-control": {
        initial: { size: "medium", intent: "none", fill: false, disabled: false },
        controls: [
            { kind: "enum", prop: "size", options: SIZES },
            { kind: "enum", prop: "intent", options: INTENTS },
            { kind: "boolean", prop: "fill" },
            { kind: "boolean", prop: "disabled" },
        ],
        render: (p) => (
            <SegmentedControl
                size={p.size}
                intent={p.intent}
                fill={p.fill}
                disabled={p.disabled}
                defaultValue="list"
                options={[
                    { label: "List", value: "list" },
                    { label: "Grid", value: "grid" },
                    { label: "Gallery", value: "gallery" },
                ]}
            />
        ),
        code: (p) => `<SegmentedControl${p.size === "medium" ? "" : ` size="${p.size}"`}${p.intent === "none" ? "" : ` intent="${p.intent}"`}${p.fill ? " fill" : ""}${p.disabled ? " disabled" : ""} defaultValue="list" options={[{ label: "List", value: "list" }, … ]} />`,
    },

    "editable-text": {
        initial: { value: "Edit me", placeholder: "Click to edit…", intent: "none", multiline: false, disabled: false, selectAllOnFocus: false },
        controls: [
            { kind: "text", prop: "value" },
            { kind: "text", prop: "placeholder" },
            { kind: "enum", prop: "intent", options: INTENTS },
            { kind: "boolean", prop: "multiline" },
            { kind: "boolean", prop: "disabled" },
            { kind: "boolean", prop: "selectAllOnFocus", label: "selectAll" },
        ],
        render: (p) => (
            <div style={{ width: 260 }}>
                <EditableText key={String(p.multiline)} defaultValue={p.value} placeholder={p.placeholder} intent={p.intent} multiline={p.multiline} disabled={p.disabled} selectAllOnFocus={p.selectAllOnFocus} />
            </div>
        ),
        code: (p) => jsx("EditableText", { defaultValue: p.value, placeholder: p.placeholder, intent: p.intent === "none" ? undefined : p.intent, multiline: p.multiline, disabled: p.disabled, selectAllOnFocus: p.selectAllOnFocus }),
    },

    // ── Batch 2: display & layout ─────────────────────────────────────────────
    card: {
        initial: { elevation: "1", body: "A surface for grouping related content.", interactive: false, selected: false, compact: false },
        controls: [
            { kind: "enum", prop: "elevation", options: ELEVATIONS },
            { kind: "text", prop: "body" },
            { kind: "boolean", prop: "interactive" },
            { kind: "boolean", prop: "selected" },
            { kind: "boolean", prop: "compact" },
        ],
        presets: [
            { name: "Raised", props: { elevation: "3", body: "A floating, elevated card." } },
            { name: "Selectable", props: { elevation: "0", interactive: true, selected: true, body: "An interactive, selected card." } },
        ],
        render: (p) => (
            <Card elevation={Number(p.elevation) as CardElevation} interactive={p.interactive} selected={p.selected} compact={p.compact} style={{ width: 280 }}>
                {p.body}
            </Card>
        ),
        code: (p) => jsx("Card", { elevation: Number(p.elevation), interactive: p.interactive, selected: p.selected, compact: p.compact }, p.body),
    },

    "entity-title": {
        initial: { title: "Spectre mission", subtitle: "Updated 2 hours ago", size: "h4", icon: "star", ellipsize: false },
        controls: [
            { kind: "enum", prop: "size", options: ENTITY_SIZES, widget: "select" },
            { kind: "enum", prop: "icon", options: ICONS },
            { kind: "text", prop: "title" },
            { kind: "text", prop: "subtitle" },
            { kind: "boolean", prop: "ellipsize" },
        ],
        render: (p) => (
            <div style={{ width: 280 }}>
                <EntityTitle title={p.title} subtitle={p.subtitle || undefined} size={p.size as EntityTitleSize} icon={p.icon || undefined} ellipsize={p.ellipsize} />
            </div>
        ),
        code: (p) => jsx("EntityTitle", { title: p.title, subtitle: p.subtitle, size: p.size, icon: p.icon, ellipsize: p.ellipsize }),
    },

    "non-ideal-state": {
        initial: { icon: "search", title: "No results", description: "Try adjusting your filters or search terms.", layout: "vertical" },
        controls: [
            { kind: "enum", prop: "icon", options: ICONS_REQ },
            { kind: "enum", prop: "layout", options: LAYOUTS },
            { kind: "text", prop: "title" },
            { kind: "text", prop: "description" },
        ],
        render: (p) => (
            <div style={{ width: 320 }}>
                <NonIdealState icon={p.icon as IconName} title={p.title} description={p.description} layout={p.layout} />
            </div>
        ),
        code: (p) => jsx("NonIdealState", { icon: p.icon, title: p.title, description: p.description, layout: p.layout === "vertical" ? undefined : p.layout }),
    },

    link: {
        initial: { label: "Read the documentation", underline: "always", color: "primary" },
        controls: [
            { kind: "text", prop: "label" },
            { kind: "enum", prop: "underline", options: UNDERLINE },
            { kind: "enum", prop: "color", options: LINK_COLORS, widget: "select" },
        ],
        render: (p) => (
            <Link href="#" underline={p.underline} color={p.color}>
                {p.label}
            </Link>
        ),
        code: (p) => jsx("Link", { href: "#", underline: p.underline === "always" ? undefined : p.underline, color: p.color === "primary" ? undefined : p.color }, p.label),
    },

    divider: {
        initial: { orientation: "horizontal", compact: false },
        controls: [
            { kind: "enum", prop: "orientation", options: LAYOUTS },
            { kind: "boolean", prop: "compact" },
        ],
        render: (p) =>
            p.orientation === "horizontal" ? (
                <div className="flex w-56 flex-col text-body text-foreground">
                    <span>Above</span>
                    <Divider compact={p.compact} />
                    <span>Below</span>
                </div>
            ) : (
                <div className="flex h-8 items-center text-body text-foreground">
                    <span>Left</span>
                    <Divider compact={p.compact} />
                    <span>Right</span>
                </div>
            ),
        // Orientation is contextual (set by the flex container), so it isn't a Divider prop.
        code: (p) => jsx("Divider", { compact: p.compact }),
    },

    collapse: {
        initial: { isOpen: true, keepChildrenMounted: false },
        controls: [
            { kind: "boolean", prop: "isOpen" },
            { kind: "boolean", prop: "keepChildrenMounted", label: "keepMounted" },
        ],
        render: (p) => (
            <div style={{ width: 320 }}>
                <Collapse isOpen={p.isOpen} keepChildrenMounted={p.keepChildrenMounted}>
                    <Card elevation={0} className="text-body text-foreground">
                        Collapsible content — toggle <code className="font-mono">isOpen</code> to animate it in and out.
                    </Card>
                </Collapse>
            </div>
        ),
        code: (p) => jsx("Collapse", { isOpen: p.isOpen, keepChildrenMounted: p.keepChildrenMounted }, "…"),
    },

    // ── Batch 3: compound components ──────────────────────────────────────────
    menu: {
        initial: { size: "medium", icons: true, divider: true, danger: true, disabledItem: false },
        controls: [
            { kind: "enum", prop: "size", options: SIZES },
            { kind: "boolean", prop: "icons" },
            { kind: "boolean", prop: "divider" },
            { kind: "boolean", prop: "danger", label: "danger item" },
            { kind: "boolean", prop: "disabledItem", label: "disabled item" },
        ],
        render: (p) => (
            <div style={{ width: 220 }}>
                <Menu size={p.size}>
                    <MenuItem icon={p.icons ? "document" : undefined} text="New" />
                    <MenuItem icon={p.icons ? "folder-open" : undefined} text="Open…" label="⌘O" />
                    <MenuItem icon={p.icons ? "floppy-disk" : undefined} text="Save" disabled={p.disabledItem} />
                    {p.divider && <MenuDivider />}
                    {p.danger && <MenuItem icon={p.icons ? "trash" : undefined} text="Delete" intent="danger" />}
                </Menu>
            </div>
        ),
        code: (p) =>
            [
                `<Menu${p.size === "medium" ? "" : ` size="${p.size}"`}>`,
                `  <MenuItem${p.icons ? ' icon="document"' : ""} text="New" />`,
                `  <MenuItem${p.icons ? ' icon="folder-open"' : ""} text="Open…" label="⌘O" />`,
                `  <MenuItem${p.icons ? ' icon="floppy-disk"' : ""} text="Save"${p.disabledItem ? " disabled" : ""} />`,
                ...(p.divider ? ["  <MenuDivider />"] : []),
                ...(p.danger ? [`  <MenuItem${p.icons ? ' icon="trash"' : ""} text="Delete" intent="danger" />`] : []),
                `</Menu>`,
            ].join("\n"),
    },

    tabs: {
        initial: { vertical: false, fill: false, disabledTab: false },
        controls: [
            { kind: "boolean", prop: "vertical" },
            { kind: "boolean", prop: "fill" },
            { kind: "boolean", prop: "disabledTab", label: "disabled tab" },
        ],
        render: (p) => {
            const panel = (text: string) => <div className="pt-3 text-body text-foreground">{text}</div>;
            return (
                <div style={{ width: 420 }}>
                    <Tabs id="pg-tabs" defaultSelectedTabId="overview" vertical={p.vertical} fill={p.fill}>
                        <Tab id="overview" title="Overview" panel={panel("Overview panel content.")} />
                        <Tab id="details" title="Details" panel={panel("Details panel content.")} />
                        <Tab id="settings" title="Settings" disabled={p.disabledTab} panel={panel("Settings panel content.")} />
                    </Tabs>
                </div>
            );
        },
        code: (p) =>
            [
                `<Tabs defaultSelectedTabId="overview"${p.vertical ? " vertical" : ""}${p.fill ? " fill" : ""}>`,
                `  <Tab id="overview" title="Overview" panel={…} />`,
                `  <Tab id="details" title="Details" panel={…} />`,
                `  <Tab id="settings" title="Settings"${p.disabledTab ? " disabled" : ""} panel={…} />`,
                `</Tabs>`,
            ].join("\n"),
    },

    breadcrumbs: {
        initial: { count: 4, icons: false },
        controls: [
            { kind: "number", prop: "count", label: "items", min: 2, max: 5, stepSize: 1 },
            { kind: "boolean", prop: "icons" },
        ],
        render: (p) => {
            const base = [
                { text: "Home", icon: "home" as IconName },
                { text: "Projects", icon: "folder-close" as IconName },
                { text: "Apollo", icon: "projects" as IconName },
                { text: "Reports", icon: "document" as IconName },
                { text: "Q3 Summary", icon: "label" as IconName },
            ];
            const n = p.count as number;
            const items = base.slice(0, n).map((it, i, arr) => ({
                text: it.text,
                icon: p.icons ? it.icon : undefined,
                href: i === arr.length - 1 ? undefined : "#",
                current: i === arr.length - 1,
            }));
            return <Breadcrumbs items={items} />;
        },
        code: (p) => `<Breadcrumbs items={[ /* ${p.count} items${p.icons ? ", each with an icon" : ""} */ ]} />`,
    },

    "html-table": {
        initial: { bordered: false, striped: true, interactive: false, compact: false },
        controls: [
            { kind: "boolean", prop: "bordered" },
            { kind: "boolean", prop: "striped" },
            { kind: "boolean", prop: "interactive" },
            { kind: "boolean", prop: "compact" },
        ],
        render: (p) => (
            <HTMLTable bordered={p.bordered} striped={p.striped} interactive={p.interactive} compact={p.compact}>
                <thead>
                    <tr>
                        <th className="text-left">Name</th>
                        <th className="text-left">Role</th>
                        <th className="text-left">Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Alice</td>
                        <td>Engineer</td>
                        <td>Active</td>
                    </tr>
                    <tr>
                        <td>Bob</td>
                        <td>Designer</td>
                        <td>Away</td>
                    </tr>
                    <tr>
                        <td>Carol</td>
                        <td>Manager</td>
                        <td>Active</td>
                    </tr>
                </tbody>
            </HTMLTable>
        ),
        code: (p) => jsx("HTMLTable", { bordered: p.bordered, striped: p.striped, interactive: p.interactive, compact: p.compact }, "…"),
    },

    "card-list": {
        initial: { bordered: true, compact: false },
        controls: [
            { kind: "boolean", prop: "bordered" },
            { kind: "boolean", prop: "compact" },
        ],
        render: (p) => (
            <div style={{ width: 320 }}>
                <CardList bordered={p.bordered} compact={p.compact}>
                    <Card>Inbox</Card>
                    <Card interactive>Drafts</Card>
                    <Card>Sent</Card>
                    <Card>Archive</Card>
                </CardList>
            </div>
        ),
        code: (p) => jsx("CardList", { bordered: p.bordered, compact: p.compact }, "…"),
    },

    section: {
        initial: { collapsible: true, compact: false, elevation: "0", open: true },
        controls: [
            { kind: "boolean", prop: "collapsible" },
            { kind: "boolean", prop: "compact" },
            { kind: "enum", prop: "elevation", options: [{ value: "0" }, { value: "1" }] },
            { kind: "boolean", prop: "open", label: "defaultOpen" },
        ],
        render: (p) => (
            <div style={{ width: 380 }}>
                <Section
                    key={`${p.collapsible}-${p.open}`}
                    title="Account settings"
                    subtitle="Manage your preferences"
                    collapsible={p.collapsible}
                    compact={p.compact}
                    elevation={Number(p.elevation) as SectionElevation}
                    collapseProps={{ defaultIsOpen: p.open }}
                >
                    <SectionCard>
                        <span className="text-body text-foreground">Section card content goes here.</span>
                    </SectionCard>
                </Section>
            </div>
        ),
        code: (p) =>
            [
                `<Section title="Account settings" subtitle="Manage your preferences"${p.collapsible ? " collapsible" : ""}${p.compact ? " compact" : ""}${p.elevation === "1" ? " elevation={1}" : ""}>`,
                `  <SectionCard>…</SectionCard>`,
                `</Section>`,
            ].join("\n"),
    },

    "control-card": {
        initial: { type: "checkbox", label: "Enable notifications", large: false, compact: false, disabled: false, elevation: "0" },
        controls: [
            { kind: "enum", prop: "type", options: [{ value: "checkbox" }, { value: "radio" }, { value: "switch" }] },
            { kind: "text", prop: "label" },
            { kind: "boolean", prop: "large" },
            { kind: "boolean", prop: "compact" },
            { kind: "boolean", prop: "disabled" },
            { kind: "enum", prop: "elevation", options: [{ value: "0" }, { value: "1" }, { value: "2" }] },
        ],
        render: (p) => {
            const common = {
                label: p.label,
                large: p.large,
                compact: p.compact,
                disabled: p.disabled,
                elevation: Number(p.elevation) as CardElevation,
                defaultChecked: true,
                style: { width: 280 } as React.CSSProperties,
            };
            if (p.type === "radio") return <RadioCard {...common} value="a" />;
            if (p.type === "switch") return <SwitchCard {...common} />;
            return <CheckboxCard {...common} />;
        },
        code: (p) => {
            const tag = p.type === "radio" ? "RadioCard" : p.type === "switch" ? "SwitchCard" : "CheckboxCard";
            return jsx(tag, { label: p.label, large: p.large, compact: p.compact, disabled: p.disabled, elevation: Number(p.elevation), defaultChecked: true });
        },
    },

    radio: {
        initial: { inline: false, disabled: false },
        controls: [
            { kind: "boolean", prop: "inline" },
            { kind: "boolean", prop: "disabled" },
        ],
        render: (p) => <RadioGroupDemo inline={p.inline} disabled={p.disabled} />,
        code: (p) =>
            [
                `<RadioGroup label="Frequency" selectedValue={value} onChange={setValue}${p.inline ? " inline" : ""}${p.disabled ? " disabled" : ""}`,
                `  options={[{ value: "day", label: "Daily" }, … ]} />`,
            ].join("\n"),
    },
};
