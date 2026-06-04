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
import { useMemo, useState } from "react";

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
import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import { ButtonGroup } from "@/components/ui/button-group";
import { FileInput } from "@/components/ui/file-input";
import { FormGroup } from "@/components/ui/form-group";
import { ControlGroup } from "@/components/ui/control-group";
import { KeyCombo } from "@/components/ui/hotkeys";
import { Navbar, NavbarDivider, NavbarGroup, NavbarHeading } from "@/components/ui/navbar";
import { useDark } from "@/lib/dark-context";
import { Tooltip } from "@/components/ui/tooltip";
import { Popover } from "@/components/ui/popover";
import { Dialog, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Drawer, DrawerBody, DrawerFooter } from "@/components/ui/drawer";
import { Alert } from "@/components/ui/alert";
import { MultistepDialog, DialogStep } from "@/components/ui/multistep-dialog";
import { ContextMenu } from "@/components/ui/context-menu";
import { Toaster, useToaster } from "@/components/ui/toast";
import { Omnibar } from "@/components/ui/omnibar";
import { Select } from "@/components/ui/select";
import { Suggest } from "@/components/ui/suggest";
import { MultiSelect } from "@/components/ui/multi-select";
import { TagInput } from "@/components/ui/tag-input";
import { DataTable, type DataTableColumn, type DataTableSelectionMode } from "@/components/ui/data-table";

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

/**
 * Extra context handed to `render` for **overlay** configs. Overlays portal to
 * `document.body` (outside the app's `.dark` ancestor) and several render no inline
 * trigger of their own, so the framework supplies:
 *   - `dark`  — thread into every overlay (`dark={ctx.dark}`); the #1 overlays gotcha.
 *   - `open` / `setOpen` — a managed open state so a stage trigger button can open a
 *     Dialog/Drawer/Alert/MultistepDialog/Omnibar (which render only the portaled panel).
 * Inline configs (batches 1–4) ignore the second arg entirely.
 */
export interface PlaygroundContext {
    dark: boolean;
    open: boolean;
    setOpen: (open: boolean) => void;
}

export interface PlaygroundConfig {
    /** Starting prop values (also the "Custom…" reset target). */
    initial: Record<string, unknown>;
    controls: Control[];
    presets?: Preset[];
    /** Render the live instance from the current prop state (+ overlay `ctx`). */
    render: (props: Record<string, never>, ctx: PlaygroundContext) => React.ReactNode;
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
const TEXT_VARIANTS: EnumOption[] = [
    { value: "body" },
    { value: "large" },
    { value: "small" },
    { value: "muted" },
    { value: "disabled" },
    { value: "code" },
    { value: "h1" },
    { value: "h2" },
    { value: "h3" },
    { value: "h4" },
    { value: "h5" },
    { value: "h6" },
];
const SKELETON_SHAPES: EnumOption[] = [
    { value: "text", label: "text" },
    { value: "avatar", label: "avatar" },
    { value: "button", label: "button" },
    { value: "block", label: "block" },
];
const SKELETON_CLASS: Record<string, string> = {
    text: "h-4 w-48",
    avatar: "h-10 w-10 rounded-full",
    button: "h-7.5 w-24",
    block: "h-24 w-64",
};
// Overlay positioning (Radix side/align), shared by Tooltip + Popover.
const SIDES: EnumOption[] = [{ value: "top" }, { value: "right" }, { value: "bottom" }, { value: "left" }];
const ALIGNS: EnumOption[] = [{ value: "start" }, { value: "center" }, { value: "end" }];
const DRAWER_POSITIONS: EnumOption[] = [{ value: "left" }, { value: "right" }, { value: "top" }, { value: "bottom" }];
const OMNIBAR_ITEMS = ["Apple", "Banana", "Cherry", "Date", "Elderberry", "Fig", "Grape", "Honeydew"];
const TOAST_ICONS: EnumOption[] = [
    { value: "", label: "none" },
    { value: "info-sign" },
    { value: "tick-circle" },
    { value: "warning-sign" },
    { value: "error" },
];

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
    // Overlay support: dark (threaded into portals) + a managed open state for
    // trigger-driven overlays (Dialog/Drawer/Alert/MultistepDialog/Omnibar).
    const dark = useDark();
    const [open, setOpen] = useState(false);
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
    const ctx: PlaygroundContext = { dark, open, setOpen };
    return (
        <div className="flex flex-col gap-3">
            {/* Stage */}
            <div className="flex min-h-[160px] flex-wrap items-center justify-center gap-4 rounded-bp border border-border bg-surface p-8">
                {config.render(live, ctx)}
            </div>
            {/* Controls — omitted entirely for interaction-only configs (no controls + no presets) */}
            {(config.controls.length > 0 || presetNames.length > 0) && (
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
            )}
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

/**
 * Toast is driven imperatively (`toaster.show(...)`), so the trigger must live inside a
 * `ToastProvider`. This small wrapper renders the provider (threading `dark` to the portaled
 * viewport) and a button that fires a toast with the current control values.
 */
function ToasterDemo({
    dark,
    intent,
    icon,
    message,
    action,
}: {
    dark: boolean;
    intent: string;
    icon: string;
    message: string;
    action: boolean;
}) {
    return (
        <Toaster dark={dark} position="top">
            <ToasterButton intent={intent} icon={icon} message={message} action={action} />
        </Toaster>
    );
}

function ToasterButton({ intent, icon, message, action }: { intent: string; icon: string; message: string; action: boolean }) {
    const toaster = useToaster();
    return (
        <Button
            intent={intent === "none" ? "primary" : (intent as never)}
            onClick={() =>
                toaster.show({
                    intent: intent === "none" ? undefined : (intent as never),
                    icon: (icon || undefined) as never,
                    message,
                    timeout: 0,
                    action: action ? { text: "Undo", onClick: () => {} } : undefined,
                })
            }
        >
            Show toast
        </Button>
    );
}

// ── Batch 6: Select / Suggest / MultiSelect / TagInput ───────────────────────
// These are controlled + (the first three) portal their listbox, so each needs a
// small stateful wrapper holding selection/value and threading `dark` into the portal.
const PG_FRUITS = ["Apple", "Banana", "Cherry", "Durian", "Elderberry", "Fig", "Grape", "Honeydew"];
const fruitMatch = (query: string, item: string) => item.toLowerCase().includes(query.toLowerCase());

function SelectDemo({ dark, filterable, disabled, fill }: { dark: boolean; filterable: boolean; disabled: boolean; fill: boolean }) {
    const [selected, setSelected] = useState<string | null>("Cherry");
    return (
        <div style={{ width: 260 }}>
            <Select<string>
                items={PG_FRUITS}
                selectedItem={selected}
                filterable={filterable}
                disabled={disabled}
                fill={fill}
                itemPredicate={fruitMatch}
                itemRenderer={(item, { modifiers, handleClick }) => (
                    <MenuItem key={item} text={item} active={modifiers.active} icon={item === selected ? "tick" : undefined} onClick={handleClick} />
                )}
                onItemSelect={(item) => setSelected(item)}
                noResults={<MenuItem disabled text="No results." />}
                dark={dark}
            >
                <Button variant="solid" endIcon="caret-down" disabled={disabled} fill={fill}>
                    {selected ?? "Select a fruit…"}
                </Button>
            </Select>
        </div>
    );
}

function SuggestDemo({ dark, disabled, fill, placeholder }: { dark: boolean; disabled: boolean; fill: boolean; placeholder: string }) {
    const [selected, setSelected] = useState<string | null>(null);
    return (
        <div style={{ width: 260 }}>
            <Suggest<string>
                items={PG_FRUITS}
                selectedItem={selected}
                inputValueRenderer={(item) => item}
                itemPredicate={fruitMatch}
                itemRenderer={(item, { modifiers, handleClick }) => (
                    <MenuItem key={item} text={item} active={modifiers.active} icon={item === selected ? "tick" : undefined} onClick={handleClick} />
                )}
                onItemSelect={(item) => setSelected(item)}
                noResults={<MenuItem disabled text="No results." />}
                inputProps={{ placeholder }}
                disabled={disabled}
                fill={fill}
                dark={dark}
            />
        </div>
    );
}

function MultiSelectDemo({ dark, intent, leftIcon, disabled, fill, placeholder }: { dark: boolean; intent: string; leftIcon: string; disabled: boolean; fill: boolean; placeholder: string }) {
    const [selected, setSelected] = useState<string[]>(["Banana", "Cherry"]);
    return (
        <div style={{ width: 340 }}>
            <MultiSelect<string>
                items={PG_FRUITS}
                selectedItems={selected}
                tagRenderer={(item) => item}
                itemPredicate={fruitMatch}
                itemRenderer={(item, { modifiers, handleClick }) => (
                    <MenuItem key={item} text={item} active={modifiers.active} icon={selected.includes(item) ? "tick" : undefined} onClick={handleClick} />
                )}
                onItemSelect={(item) => setSelected((s) => (s.includes(item) ? s : [...s, item]))}
                onRemove={(_item, index) => setSelected((s) => s.filter((_, i) => i !== index))}
                noResults={<MenuItem disabled text="No results." />}
                placeholder={placeholder}
                intent={intent as never}
                leftIcon={(leftIcon || undefined) as never}
                disabled={disabled}
                fill={fill}
                dark={dark}
            />
        </div>
    );
}

function TagInputDemo({ large, intent, leftIcon, disabled, fill, placeholder }: { large: boolean; intent: string; leftIcon: string; disabled: boolean; fill: boolean; placeholder: string }) {
    const [values, setValues] = useState<string[]>(["design", "ui", "ux"]);
    return (
        <div style={{ width: 360 }}>
            <TagInput
                values={values}
                onChange={(v) => setValues(v as string[])}
                placeholder={placeholder}
                inputProps={{ "aria-label": "Tags" }}
                large={large}
                intent={intent as never}
                leftIcon={(leftIcon || undefined) as never}
                disabled={disabled}
                fill={fill}
            />
        </div>
    );
}

// ── Batch 7: DataTable ───────────────────────────────────────────────────────
// Inline (no portal → no `ctx.dark`), but controlled for inline edits, so it needs a
// stateful wrapper holding the row data. Columns are memoized on the `editable` toggle
// so the engine doesn't re-init its sizing/order state every render.
interface PgPerson {
    name: string;
    age: number;
    role: string;
    location: string;
}
const PG_TABLE_ROWS: PgPerson[] = [
    { name: "Alice Hancock", age: 34, role: "Engineer", location: "London" },
    { name: "Bob Liu", age: 29, role: "Designer", location: "Seattle" },
    { name: "Carol Reyes", age: 41, role: "Manager", location: "Austin" },
    { name: "Dan Okafor", age: 38, role: "Analyst", location: "Lagos" },
    { name: "Eve Novak", age: 26, role: "Engineer", location: "Prague" },
    { name: "Frank Mori", age: 52, role: "Director", location: "Osaka" },
];

function DataTableDemo({
    numberedRows,
    selectionMode,
    resizing,
    reordering,
    editable,
    loading,
    fixedHeight,
}: {
    numberedRows: boolean;
    selectionMode: string;
    resizing: boolean;
    reordering: boolean;
    editable: boolean;
    loading: boolean;
    fixedHeight: boolean;
}) {
    const [rows, setRows] = useState<PgPerson[]>(PG_TABLE_ROWS);
    const columns = useMemo<DataTableColumn<PgPerson>[]>(
        () => [
            { id: "name", header: "Name", accessor: "name", width: 150, editable },
            { id: "age", header: "Age", accessor: "age", width: 60, align: "right" },
            { id: "role", header: "Role", accessor: "role", width: 110, editable },
            { id: "location", header: "Location", accessor: "location", width: 120 },
        ],
        [editable],
    );
    return (
        <div style={{ width: 440 }}>
            <DataTable<PgPerson>
                data={rows}
                columns={columns}
                numberedRows={numberedRows}
                selectionMode={selectionMode as DataTableSelectionMode}
                enableColumnResizing={resizing}
                enableColumnReordering={reordering}
                loading={loading}
                height={fixedHeight ? 200 : undefined}
                onCellEdit={({ row, columnId, value }) =>
                    setRows((rs) => rs.map((r, i) => (i === row ? { ...r, [columnId]: value } : r)))
                }
            />
        </div>
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

    // ── Batch 4: easy scalar-control components ────────────────────────────────
    text: {
        initial: { variant: "body", content: "The quick brown fox jumps over the lazy dog.", ellipsize: false },
        controls: [
            { kind: "enum", prop: "variant", options: TEXT_VARIANTS, widget: "select" },
            { kind: "text", prop: "content" },
            { kind: "boolean", prop: "ellipsize" },
        ],
        presets: [
            { name: "Heading", props: { variant: "h3", content: "Section heading" } },
            { name: "Muted note", props: { variant: "muted", content: "Secondary, lower-emphasis text." } },
            { name: "Code", props: { variant: "code", content: "npm install mithril" } },
            { name: "Truncated", props: { variant: "body", ellipsize: true, content: "A long line of text that overflows its container and is truncated with an ellipsis." } },
        ],
        render: (p) => (
            <div style={{ width: 280 }}>
                <Text variant={p.variant} ellipsize={p.ellipsize}>
                    {p.content}
                </Text>
            </div>
        ),
        code: (p) => jsx("Text", { variant: p.variant === "body" ? undefined : p.variant, ellipsize: p.ellipsize }, p.content),
    },

    skeleton: {
        initial: { shape: "text", animate: true },
        controls: [
            { kind: "enum", prop: "shape", options: SKELETON_SHAPES, widget: "select" },
            { kind: "boolean", prop: "animate" },
        ],
        render: (p) => <Skeleton className={SKELETON_CLASS[p.shape as string]} animate={p.animate} />,
        code: (p) => jsx("Skeleton", { className: SKELETON_CLASS[p.shape as string], animate: p.animate === true ? undefined : false }),
    },

    "button-group": {
        initial: { variant: "solid", size: "medium", vertical: false, fill: false },
        controls: [
            { kind: "enum", prop: "variant", options: VARIANTS },
            { kind: "enum", prop: "size", options: SIZES },
            { kind: "boolean", prop: "vertical" },
            { kind: "boolean", prop: "fill" },
        ],
        render: (p) => (
            <div style={{ width: p.fill ? 280 : undefined }}>
                <ButtonGroup variant={p.variant} size={p.size} vertical={p.vertical} fill={p.fill}>
                    <Button icon="grid-view">List</Button>
                    <Button icon="cog">Settings</Button>
                    <Button icon="user">Account</Button>
                </ButtonGroup>
            </div>
        ),
        code: (p) =>
            [
                `<ButtonGroup${p.variant === "solid" ? "" : ` variant="${p.variant}"`}${p.size === "medium" ? "" : ` size="${p.size}"`}${p.vertical ? " vertical" : ""}${p.fill ? " fill" : ""}>`,
                `  <Button icon="grid-view">List</Button>`,
                `  <Button icon="cog">Settings</Button>`,
                `  <Button icon="user">Account</Button>`,
                `</ButtonGroup>`,
            ].join("\n"),
    },

    "file-input": {
        initial: { size: "medium", text: "Choose file...", buttonText: "Browse", hasSelection: false, fill: false, disabled: false },
        controls: [
            { kind: "enum", prop: "size", options: SIZES },
            { kind: "text", prop: "text" },
            { kind: "text", prop: "buttonText", label: "button" },
            { kind: "boolean", prop: "hasSelection", label: "selected" },
            { kind: "boolean", prop: "fill" },
            { kind: "boolean", prop: "disabled" },
        ],
        presets: [
            { name: "Has file", props: { hasSelection: true, text: "report-q3.pdf" } },
        ],
        render: (p) => (
            <div style={{ width: p.fill ? 320 : undefined }}>
                <FileInput size={p.size} text={p.text} buttonText={p.buttonText} hasSelection={p.hasSelection} fill={p.fill} disabled={p.disabled} />
            </div>
        ),
        code: (p) => jsx("FileInput", { size: p.size === "medium" ? undefined : p.size, text: p.text === "Choose file..." ? undefined : p.text, buttonText: p.buttonText === "Browse" ? undefined : p.buttonText, hasSelection: p.hasSelection, fill: p.fill, disabled: p.disabled }),
    },

    "form-group": {
        initial: { label: "Email address", helperText: "We'll never share it.", subLabel: "", intent: "none", inline: false, disabled: false, fill: false },
        controls: [
            { kind: "text", prop: "label" },
            { kind: "text", prop: "helperText", label: "helper" },
            { kind: "text", prop: "subLabel", label: "subLabel" },
            { kind: "enum", prop: "intent", options: INTENTS },
            { kind: "boolean", prop: "inline" },
            { kind: "boolean", prop: "disabled" },
        ],
        presets: [
            { name: "Error", props: { intent: "danger", helperText: "Enter a valid email address.", subLabel: "" } },
            { name: "With sub-label", props: { intent: "none", subLabel: "Used for sign-in and notifications.", helperText: "" } },
        ],
        render: (p) => (
            <div style={{ width: 320 }}>
                <FormGroup label={p.label} helperText={p.helperText || undefined} subLabel={p.subLabel || undefined} intent={p.intent} inline={p.inline} disabled={p.disabled}>
                    <InputGroup placeholder="you@example.com" intent={p.intent} disabled={p.disabled} />
                </FormGroup>
            </div>
        ),
        code: (p) =>
            [
                `<FormGroup label="${p.label}"${p.subLabel ? ` subLabel="${p.subLabel}"` : ""}${p.helperText ? ` helperText="${p.helperText}"` : ""}${p.intent === "none" ? "" : ` intent="${p.intent}"`}${p.inline ? " inline" : ""}${p.disabled ? " disabled" : ""}>`,
                `  <InputGroup placeholder="you@example.com"${p.intent === "none" ? "" : ` intent="${p.intent}"`}${p.disabled ? " disabled" : ""} />`,
                `</FormGroup>`,
            ].join("\n"),
    },

    "control-group": {
        initial: { vertical: false, fill: false },
        controls: [
            { kind: "boolean", prop: "vertical" },
            { kind: "boolean", prop: "fill" },
        ],
        render: (p) => (
            <div style={{ width: 360 }}>
                <ControlGroup vertical={p.vertical} fill={p.fill}>
                    <HTMLSelect options={["Name", "Date", "Size"]} />
                    <InputGroup placeholder="Search…" leftIcon="search" fill={p.fill} />
                    <Button icon="arrow-right" intent="primary">
                        Go
                    </Button>
                </ControlGroup>
            </div>
        ),
        code: (p) =>
            [
                `<ControlGroup${p.vertical ? " vertical" : ""}${p.fill ? " fill" : ""}>`,
                `  <HTMLSelect options={["Name", "Date", "Size"]} />`,
                `  <InputGroup placeholder="Search…" leftIcon="search" />`,
                `  <Button icon="arrow-right" intent="primary">Go</Button>`,
                `</ControlGroup>`,
            ].join("\n"),
    },

    hotkeys: {
        initial: { combo: "mod+shift+n", minimal: false },
        controls: [
            { kind: "text", prop: "combo" },
            { kind: "boolean", prop: "minimal" },
        ],
        presets: [
            { name: "Save", props: { combo: "mod+s", minimal: false } },
            { name: "Undo", props: { combo: "ctrl+z", minimal: false } },
            { name: "Arrows", props: { combo: "shift+up", minimal: false } },
            { name: "Minimal", props: { combo: "mod+k", minimal: true } },
        ],
        render: (p) => <KeyCombo combo={String(p.combo) || "mod+s"} minimal={p.minimal} />,
        code: (p) => jsx("KeyCombo", { combo: p.combo, minimal: p.minimal }),
    },

    navbar: {
        initial: { heading: "Mithril", showSearch: true, showRight: true },
        controls: [
            { kind: "text", prop: "heading" },
            { kind: "boolean", prop: "showSearch", label: "search" },
            { kind: "boolean", prop: "showRight", label: "right group" },
        ],
        render: (p) => (
            <div style={{ width: 460 }}>
                <Navbar>
                    <NavbarGroup align="left">
                        <NavbarHeading>{p.heading}</NavbarHeading>
                        <NavbarDivider />
                        <Button variant="minimal" icon="home">
                            Home
                        </Button>
                        <Button variant="minimal" icon="document">
                            Files
                        </Button>
                    </NavbarGroup>
                    {p.showRight && (
                        <NavbarGroup align="right">
                            {p.showSearch && (
                                <InputGroup size="small" leftIcon="search" placeholder="Search…" style={{ width: 140 }} />
                            )}
                            <Button variant="minimal" icon="cog" aria-label="Settings" />
                            <Button variant="minimal" icon="user" aria-label="Account" />
                        </NavbarGroup>
                    )}
                </Navbar>
            </div>
        ),
        code: (p) =>
            [
                `<Navbar>`,
                `  <NavbarGroup align="left">`,
                `    <NavbarHeading>${p.heading}</NavbarHeading>`,
                `    <NavbarDivider />`,
                `    <Button variant="minimal" icon="home">Home</Button>`,
                `    <Button variant="minimal" icon="document">Files</Button>`,
                `  </NavbarGroup>`,
                ...(p.showRight
                    ? [
                          `  <NavbarGroup align="right">`,
                          ...(p.showSearch ? [`    <InputGroup size="small" leftIcon="search" placeholder="Search…" />`] : []),
                          `    <Button variant="minimal" icon="cog" aria-label="Settings" />`,
                          `    <Button variant="minimal" icon="user" aria-label="Account" />`,
                          `  </NavbarGroup>`,
                      ]
                    : []),
                `</Navbar>`,
            ].join("\n"),
    },

    // ── Batch 5: overlays (portal to <body> → thread `dark`; trigger-driven via ctx) ──
    tooltip: {
        initial: { content: "Tooltip content", side: "bottom", align: "center", intent: "none" },
        controls: [
            { kind: "enum", prop: "side", options: SIDES },
            { kind: "enum", prop: "align", options: ALIGNS },
            { kind: "enum", prop: "intent", options: INTENTS },
            { kind: "text", prop: "content" },
        ],
        render: (p, ctx) => (
            <Tooltip content={p.content} side={p.side} align={p.align} intent={p.intent} dark={ctx.dark}>
                <Button intent={p.intent === "none" ? "primary" : p.intent}>Hover me</Button>
            </Tooltip>
        ),
        code: (p) =>
            [
                `<Tooltip content="${p.content}"${p.side === "bottom" ? "" : ` side="${p.side}"`}${p.align === "center" ? "" : ` align="${p.align}"`}${p.intent === "none" ? "" : ` intent="${p.intent}"`} dark={dark}>`,
                `  <Button>Hover me</Button>`,
                `</Tooltip>`,
            ].join("\n"),
    },

    popover: {
        initial: { side: "bottom", align: "center", hasContentPadding: true },
        controls: [
            { kind: "enum", prop: "side", options: SIDES },
            { kind: "enum", prop: "align", options: ALIGNS },
            { kind: "boolean", prop: "hasContentPadding", label: "padding" },
        ],
        render: (p, ctx) => (
            <Popover
                side={p.side}
                align={p.align}
                hasContentPadding={p.hasContentPadding}
                dark={ctx.dark}
                content={
                    <div style={{ width: 220 }} className="text-body text-foreground">
                        A popover panel — put any content here: text, forms, or a menu.
                    </div>
                }
            >
                <Button intent="primary" endIcon="caret-down">
                    Open popover
                </Button>
            </Popover>
        ),
        code: (p) =>
            [
                `<Popover${p.side === "bottom" ? "" : ` side="${p.side}"`}${p.align === "center" ? "" : ` align="${p.align}"`}${p.hasContentPadding ? "" : " hasContentPadding={false}"} dark={dark}`,
                `  content={<div style={{ width: 220 }}>A popover panel…</div>}>`,
                `  <Button intent="primary" endIcon="caret-down">Open popover</Button>`,
                `</Popover>`,
            ].join("\n"),
    },

    dialog: {
        initial: { title: "Dialog title", closeButton: true },
        controls: [
            { kind: "text", prop: "title" },
            { kind: "boolean", prop: "closeButton", label: "close button" },
        ],
        render: (p, ctx) => (
            <>
                <Button intent="primary" onClick={() => ctx.setOpen(true)}>
                    Open dialog
                </Button>
                <Dialog open={ctx.open} onOpenChange={ctx.setOpen} title={p.title} icon={<Icon icon="info-sign" />} closeButton={p.closeButton} dark={ctx.dark}>
                    <DialogBody>
                        <p className="m-0 text-body text-foreground">
                            This is the dialog body. It can hold forms, messages, or any layout.
                        </p>
                    </DialogBody>
                    <DialogFooter
                        actions={
                            <>
                                <Button variant="minimal" onClick={() => ctx.setOpen(false)}>
                                    Cancel
                                </Button>
                                <Button intent="primary" onClick={() => ctx.setOpen(false)}>
                                    Confirm
                                </Button>
                            </>
                        }
                    />
                </Dialog>
            </>
        ),
        code: (p) =>
            [
                `const [open, setOpen] = useState(false);`,
                ``,
                `<Button onClick={() => setOpen(true)}>Open dialog</Button>`,
                `<Dialog open={open} onOpenChange={setOpen} title="${p.title}"${p.closeButton ? "" : " closeButton={false}"} dark={dark}>`,
                `  <DialogBody>…</DialogBody>`,
                `  <DialogFooter actions={<><Button variant="minimal">Cancel</Button><Button intent="primary">Confirm</Button></>} />`,
                `</Dialog>`,
            ].join("\n"),
    },

    drawer: {
        initial: { position: "right", size: 360, title: "Drawer title", closeButton: true },
        controls: [
            { kind: "enum", prop: "position", options: DRAWER_POSITIONS },
            { kind: "number", prop: "size", min: 240, max: 600, stepSize: 20 },
            { kind: "text", prop: "title" },
            { kind: "boolean", prop: "closeButton", label: "close button" },
        ],
        render: (p, ctx) => (
            <>
                <Button intent="primary" onClick={() => ctx.setOpen(true)}>
                    Open drawer
                </Button>
                <Drawer open={ctx.open} onOpenChange={ctx.setOpen} position={p.position} size={p.size} title={p.title} icon={<Icon icon="info-sign" />} closeButton={p.closeButton} dark={ctx.dark}>
                    <DrawerBody className="p-5">
                        <p className="m-0 text-body text-foreground">
                            Drawer body content. Slides in from the chosen edge; the backdrop locks page scroll.
                        </p>
                    </DrawerBody>
                    <DrawerFooter className="px-5">
                        <Button variant="minimal" onClick={() => ctx.setOpen(false)}>
                            Close
                        </Button>
                        <Button intent="primary" onClick={() => ctx.setOpen(false)}>
                            Save
                        </Button>
                    </DrawerFooter>
                </Drawer>
            </>
        ),
        code: (p) =>
            [
                `const [open, setOpen] = useState(false);`,
                ``,
                `<Button onClick={() => setOpen(true)}>Open drawer</Button>`,
                `<Drawer open={open} onOpenChange={setOpen}${p.position === "right" ? "" : ` position="${p.position}"`} size={${p.size}} title="${p.title}"${p.closeButton ? "" : " closeButton={false}"} dark={dark}>`,
                `  <DrawerBody className="p-5">…</DrawerBody>`,
                `  <DrawerFooter className="px-5"><Button variant="minimal">Close</Button><Button intent="primary">Save</Button></DrawerFooter>`,
                `</Drawer>`,
            ].join("\n"),
    },

    alert: {
        initial: { intent: "danger", confirmButtonText: "Delete", cancelButtonText: "Cancel" },
        controls: [
            { kind: "enum", prop: "intent", options: INTENTS },
            { kind: "text", prop: "confirmButtonText", label: "confirm" },
            { kind: "text", prop: "cancelButtonText", label: "cancel" },
        ],
        render: (p, ctx) => (
            <>
                <Button intent={p.intent === "none" ? "primary" : p.intent} onClick={() => ctx.setOpen(true)}>
                    Open alert
                </Button>
                <Alert
                    open={ctx.open}
                    onOpenChange={ctx.setOpen}
                    intent={p.intent}
                    icon="warning-sign"
                    confirmButtonText={p.confirmButtonText}
                    cancelButtonText={p.cancelButtonText}
                    onConfirm={() => ctx.setOpen(false)}
                    onCancel={() => ctx.setOpen(false)}
                    dark={ctx.dark}
                >
                    Are you sure? This action cannot be undone.
                </Alert>
            </>
        ),
        code: (p) =>
            [
                `const [open, setOpen] = useState(false);`,
                ``,
                `<Button onClick={() => setOpen(true)}>Open alert</Button>`,
                `<Alert open={open} onOpenChange={setOpen}${p.intent === "none" ? "" : ` intent="${p.intent}"`} icon="warning-sign"`,
                `  confirmButtonText="${p.confirmButtonText}" cancelButtonText="${p.cancelButtonText}"`,
                `  onConfirm={…} onCancel={…} dark={dark}>`,
                `  Are you sure? This action cannot be undone.`,
                `</Alert>`,
            ].join("\n"),
    },

    "multistep-dialog": {
        initial: { title: "Create project", initialStepIndex: 0 },
        controls: [
            { kind: "text", prop: "title" },
            { kind: "number", prop: "initialStepIndex", label: "start step", min: 0, max: 2, stepSize: 1 },
        ],
        render: (p, ctx) => (
            <>
                <Button intent="primary" onClick={() => ctx.setOpen(true)}>
                    Open wizard
                </Button>
                <MultistepDialog
                    // initialStepIndex only applies on mount; remount when it changes so the control works.
                    key={String(p.initialStepIndex)}
                    open={ctx.open}
                    onOpenChange={ctx.setOpen}
                    title={p.title}
                    icon={<Icon icon="projects" />}
                    initialStepIndex={p.initialStepIndex}
                    dark={ctx.dark}
                    finalButtonProps={{ children: "Create", onClick: () => ctx.setOpen(false) }}
                >
                    <DialogStep
                        id="info"
                        title="Project info"
                        panel={
                            <div className="flex flex-col gap-4 p-5">
                                <FormGroup label="Project name" labelFor="pg-ms-name">
                                    <InputGroup id="pg-ms-name" leftIcon="projects" defaultValue="Apollo Initiative" fill />
                                </FormGroup>
                            </div>
                        }
                    />
                    <DialogStep
                        id="members"
                        title="Members"
                        panel={<div className="p-5 text-body text-foreground">Invite teammates by email to collaborate.</div>}
                    />
                    <DialogStep
                        id="review"
                        title="Review"
                        panel={
                            <div className="p-5">
                                <Callout intent="primary" title="Ready to create">
                                    Review the summary, then choose Create.
                                </Callout>
                            </div>
                        }
                    />
                </MultistepDialog>
            </>
        ),
        code: (p) =>
            [
                `const [open, setOpen] = useState(false);`,
                ``,
                `<Button onClick={() => setOpen(true)}>Open wizard</Button>`,
                `<MultistepDialog open={open} onOpenChange={setOpen} title="${p.title}"${p.initialStepIndex ? ` initialStepIndex={${p.initialStepIndex}}` : ""} dark={dark}`,
                `  finalButtonProps={{ children: "Create" }}>`,
                `  <DialogStep id="info" title="Project info" panel={…} />`,
                `  <DialogStep id="members" title="Members" panel={…} />`,
                `  <DialogStep id="review" title="Review" panel={…} />`,
                `</MultistepDialog>`,
            ].join("\n"),
    },

    toast: {
        initial: { intent: "success", icon: "tick-circle", message: "Changes saved.", action: false },
        controls: [
            { kind: "enum", prop: "intent", options: INTENTS },
            { kind: "enum", prop: "icon", options: TOAST_ICONS, widget: "select" },
            { kind: "text", prop: "message" },
            { kind: "boolean", prop: "action", label: "action button" },
        ],
        presets: [
            { name: "Error + retry", props: { intent: "danger", icon: "error", message: "Failed to save. Check your connection.", action: true } },
            { name: "Info", props: { intent: "none", icon: "info-sign", message: "Reconnecting to the server…", action: false } },
        ],
        render: (p, ctx) => <ToasterDemo dark={ctx.dark} intent={p.intent} icon={p.icon} message={p.message} action={p.action} />,
        code: (p) =>
            [
                `const toaster = useToaster(); // inside <Toaster dark={dark}>`,
                ``,
                `toaster.show({`,
                `${p.intent === "none" ? "" : `  intent: "${p.intent}",\n`}${p.icon ? `  icon: "${p.icon}",\n` : ""}  message: "${p.message}",${p.action ? `\n  action: { text: "Undo", onClick: undo },` : ""}`,
                `});`,
            ].join("\n"),
    },

    "context-menu": {
        initial: { icons: true, danger: true },
        controls: [
            { kind: "boolean", prop: "icons" },
            { kind: "boolean", prop: "danger", label: "danger item" },
        ],
        render: (p, ctx) => (
            <ContextMenu
                dark={ctx.dark}
                content={
                    <Menu>
                        <MenuItem icon={p.icons ? "document-open" : undefined} text="Open" />
                        <MenuItem icon={p.icons ? "duplicate" : undefined} text="Duplicate" />
                        <MenuItem icon={p.icons ? "cog" : undefined} text="Settings" />
                        {p.danger && (
                            <>
                                <MenuDivider />
                                <MenuItem icon={p.icons ? "trash" : undefined} text="Delete" intent="danger" />
                            </>
                        )}
                    </Menu>
                }
            >
                <div
                    className="flex items-center justify-center rounded-bp border border-dashed border-foreground-muted p-10 text-body text-foreground-muted"
                    style={{ width: 320, cursor: "context-menu" }}
                >
                    Right-click anywhere in this area
                </div>
            </ContextMenu>
        ),
        code: (p) =>
            [
                `<ContextMenu dark={dark} content={`,
                `  <Menu>`,
                `    <MenuItem${p.icons ? ' icon="document-open"' : ""} text="Open" />`,
                `    <MenuItem${p.icons ? ' icon="duplicate"' : ""} text="Duplicate" />`,
                `    <MenuItem${p.icons ? ' icon="cog"' : ""} text="Settings" />`,
                ...(p.danger
                    ? [`    <MenuDivider />`, `    <MenuItem${p.icons ? ' icon="trash"' : ""} text="Delete" intent="danger" />`]
                    : []),
                `  </Menu>`,
                `}>`,
                `  <div>Right-click anywhere in this area</div>`,
                `</ContextMenu>`,
            ].join("\n"),
    },

    omnibar: {
        initial: { placeholder: "Search fruit…" },
        controls: [{ kind: "text", prop: "placeholder" }],
        render: (p, ctx) => (
            <>
                <Button intent="primary" icon="search" onClick={() => ctx.setOpen(true)}>
                    Open omnibar
                </Button>
                <Omnibar<string>
                    isOpen={ctx.open}
                    onClose={() => ctx.setOpen(false)}
                    items={OMNIBAR_ITEMS}
                    inputProps={{ placeholder: String(p.placeholder) || "Search…" }}
                    itemPredicate={(query, item) => item.toLowerCase().includes(query.toLowerCase())}
                    itemRenderer={(item, { modifiers, handleClick }) => (
                        <MenuItem key={item} text={item} active={modifiers.active} onClick={handleClick} />
                    )}
                    onItemSelect={() => ctx.setOpen(false)}
                    dark={ctx.dark}
                />
            </>
        ),
        code: (p) =>
            [
                `const [open, setOpen] = useState(false);`,
                ``,
                `<Button icon="search" onClick={() => setOpen(true)}>Open omnibar</Button>`,
                `<Omnibar<string>`,
                `  isOpen={open} onClose={() => setOpen(false)} dark={dark}`,
                `  items={items}`,
                `  inputProps={{ placeholder: "${p.placeholder}" }}`,
                `  itemPredicate={(q, item) => item.toLowerCase().includes(q.toLowerCase())}`,
                `  itemRenderer={(item, { modifiers, handleClick }) => (`,
                `    <MenuItem key={item} text={item} active={modifiers.active} onClick={handleClick} />`,
                `  )}`,
                `  onItemSelect={() => setOpen(false)} />`,
            ].join("\n"),
    },

    // ── Batch 6: Select / Suggest / MultiSelect / TagInput (stateful + portaled) ──
    select: {
        initial: { filterable: true, fill: false, disabled: false },
        controls: [
            { kind: "boolean", prop: "filterable" },
            { kind: "boolean", prop: "fill" },
            { kind: "boolean", prop: "disabled" },
        ],
        render: (p, ctx) => <SelectDemo dark={ctx.dark} filterable={p.filterable} fill={p.fill} disabled={p.disabled} />,
        code: (p) =>
            [
                `const [selected, setSelected] = useState<string | null>("Cherry");`,
                ``,
                `<Select<string>`,
                `  items={items} selectedItem={selected}${p.filterable ? "" : " filterable={false}"}${p.fill ? " fill" : ""}${p.disabled ? " disabled" : ""}`,
                `  itemPredicate={(q, item) => item.toLowerCase().includes(q.toLowerCase())}`,
                `  itemRenderer={(item, { modifiers, handleClick }) => (`,
                `    <MenuItem key={item} text={item} active={modifiers.active}`,
                `      icon={item === selected ? "tick" : undefined} onClick={handleClick} />`,
                `  )}`,
                `  onItemSelect={setSelected} dark={dark}>`,
                `  <Button endIcon="caret-down">{selected ?? "Select a fruit…"}</Button>`,
                `</Select>`,
            ].join("\n"),
    },

    suggest: {
        initial: { placeholder: "Search fruit…", fill: false, disabled: false },
        controls: [
            { kind: "text", prop: "placeholder" },
            { kind: "boolean", prop: "fill" },
            { kind: "boolean", prop: "disabled" },
        ],
        render: (p, ctx) => <SuggestDemo dark={ctx.dark} placeholder={String(p.placeholder)} fill={p.fill} disabled={p.disabled} />,
        code: (p) =>
            [
                `const [selected, setSelected] = useState<string | null>(null);`,
                ``,
                `<Suggest<string>`,
                `  items={items} selectedItem={selected}${p.fill ? " fill" : ""}${p.disabled ? " disabled" : ""}`,
                `  inputValueRenderer={(item) => item}`,
                `  inputProps={{ placeholder: "${p.placeholder}" }}`,
                `  itemPredicate={(q, item) => item.toLowerCase().includes(q.toLowerCase())}`,
                `  itemRenderer={(item, { modifiers, handleClick }) => (`,
                `    <MenuItem key={item} text={item} active={modifiers.active}`,
                `      icon={item === selected ? "tick" : undefined} onClick={handleClick} />`,
                `  )}`,
                `  onItemSelect={setSelected} dark={dark} />`,
            ].join("\n"),
    },

    "multi-select": {
        initial: { placeholder: "Add fruit…", intent: "none", leftIcon: "", fill: true, disabled: false },
        controls: [
            { kind: "enum", prop: "intent", options: INTENTS },
            { kind: "enum", prop: "leftIcon", label: "leftIcon", options: ICONS },
            { kind: "text", prop: "placeholder" },
            { kind: "boolean", prop: "fill" },
            { kind: "boolean", prop: "disabled" },
        ],
        render: (p, ctx) => (
            <MultiSelectDemo dark={ctx.dark} intent={p.intent} leftIcon={p.leftIcon} placeholder={String(p.placeholder)} fill={p.fill} disabled={p.disabled} />
        ),
        code: (p) =>
            [
                `const [selected, setSelected] = useState<string[]>(["Banana", "Cherry"]);`,
                ``,
                `<MultiSelect<string>`,
                `  items={items} selectedItems={selected}${p.intent === "none" ? "" : ` intent="${p.intent}"`}${p.leftIcon ? ` leftIcon="${p.leftIcon}"` : ""}${p.fill ? " fill" : ""}${p.disabled ? " disabled" : ""}`,
                `  tagRenderer={(item) => item}`,
                `  itemPredicate={(q, item) => item.toLowerCase().includes(q.toLowerCase())}`,
                `  itemRenderer={(item, { modifiers, handleClick }) => (`,
                `    <MenuItem key={item} text={item} active={modifiers.active}`,
                `      icon={selected.includes(item) ? "tick" : undefined} onClick={handleClick} />`,
                `  )}`,
                `  onItemSelect={(item) => setSelected((s) => s.includes(item) ? s : [...s, item])}`,
                `  onRemove={(_item, i) => setSelected((s) => s.filter((_, j) => j !== i))}`,
                `  dark={dark} />`,
            ].join("\n"),
    },

    "tag-input": {
        initial: { placeholder: "Add a tag…", intent: "none", leftIcon: "", large: false, fill: true, disabled: false },
        controls: [
            { kind: "enum", prop: "intent", options: INTENTS },
            { kind: "enum", prop: "leftIcon", label: "leftIcon", options: ICONS },
            { kind: "text", prop: "placeholder" },
            { kind: "boolean", prop: "large" },
            { kind: "boolean", prop: "fill" },
            { kind: "boolean", prop: "disabled" },
        ],
        render: (p) => (
            <TagInputDemo intent={p.intent} leftIcon={p.leftIcon} placeholder={String(p.placeholder)} large={p.large} fill={p.fill} disabled={p.disabled} />
        ),
        code: (p) =>
            [
                `const [values, setValues] = useState<string[]>(["design", "ui", "ux"]);`,
                ``,
                `<TagInput`,
                `  values={values} onChange={(v) => setValues(v as string[])}`,
                `  placeholder="${p.placeholder}"${p.intent === "none" ? "" : ` intent="${p.intent}"`}${p.leftIcon ? ` leftIcon="${p.leftIcon}"` : ""}${p.large ? " large" : ""}${p.fill ? " fill" : ""}${p.disabled ? " disabled" : ""}`,
                `  inputProps={{ "aria-label": "Tags" }} />`,
            ].join("\n"),
    },

    // ── Batch 7: DataTable (inline, stateful for inline edits) ──
    "data-table": {
        initial: { selectionMode: "single", numberedRows: true, resizing: true, reordering: false, editable: true, fixedHeight: false, loading: false },
        controls: [
            { kind: "enum", prop: "selectionMode", label: "selection", options: [{ value: "none" }, { value: "single" }, { value: "multi" }] },
            { kind: "boolean", prop: "numberedRows", label: "gutter" },
            { kind: "boolean", prop: "resizing", label: "resize cols" },
            { kind: "boolean", prop: "reordering", label: "reorder cols" },
            { kind: "boolean", prop: "editable", label: "editable" },
            { kind: "boolean", prop: "fixedHeight", label: "fixed height" },
            { kind: "boolean", prop: "loading" },
        ],
        render: (p) => (
            <DataTableDemo
                selectionMode={p.selectionMode}
                numberedRows={p.numberedRows}
                resizing={p.resizing}
                reordering={p.reordering}
                editable={p.editable}
                fixedHeight={p.fixedHeight}
                loading={p.loading}
            />
        ),
        code: (p) => {
            const ed = p.editable ? ", editable: true" : "";
            return [
                `const [data, setData] = useState(rows);`,
                `const columns: DataTableColumn<Person>[] = [`,
                `  { id: "name", header: "Name", accessor: "name", width: 150${ed} },`,
                `  { id: "age", header: "Age", accessor: "age", width: 60, align: "right" },`,
                `  { id: "role", header: "Role", accessor: "role", width: 110${ed} },`,
                `  { id: "location", header: "Location", accessor: "location", width: 120 },`,
                `];`,
                ``,
                `<DataTable`,
                `  data={data} columns={columns}${p.numberedRows ? "" : " numberedRows={false}"}${p.selectionMode === "single" ? "" : ` selectionMode="${p.selectionMode}"`}${p.resizing ? " enableColumnResizing" : ""}${p.reordering ? " enableColumnReordering" : ""}${p.fixedHeight ? " height={200}" : ""}${p.loading ? " loading" : ""}`,
                ...(p.editable ? [`  onCellEdit={({ row, columnId, value }) => save(row, columnId, value)}`] : []),
                `/>`,
            ].join("\n");
        },
    },
};
