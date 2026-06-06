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
import { AIExplainability } from "@/components/ui/ai-explainability";
import { AIExplainabilityDemoDetails } from "@/lib/demo/ai-explainability";
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
import { FileDropzone } from "@/components/ui/file-dropzone";
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
import { TimePicker } from "@/components/ui/time-picker";
import { DatePicker } from "@/components/ui/date-picker";
import { DateRangePicker, type DateRangePickerValue } from "@/components/ui/date-range-picker";
import { DateInput } from "@/components/ui/date-input";
import { DateRangeInput } from "@/components/ui/date-range-input";
import { TimezoneSelect } from "@/components/ui/timezone-select";
import { Tree, useTreeState, type TreeNodeInfo } from "@/components/ui/tree";
import { PanelStack, type PanelInfo, type PanelActions } from "@/components/ui/panel-stack";

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
    /**
     * The stage element, handed to overlay configs (`contained: true`) so they can
     * portal *into* the stage instead of `document.body`. Thread it into the overlay
     * as `portalContainer={ctx.portalContainer}` (or `popoverProps={{ portalContainer }}`).
     * `null` until the stage mounts — Radix portals fall back to `document.body` then.
     */
    portalContainer: HTMLElement | null;
}

/** Trigger placement within a contained stage (named for where the *trigger* sits). */
export type ContainedAlign = "center" | "top" | "bottom" | "left" | "right";

/** Flex alignment + edge padding for each trigger placement inside a contained stage. */
const CONTAINED_ALIGN_CLASS: Record<ContainedAlign, string> = {
    center: "items-center justify-center",
    top: "items-start justify-center pt-10",
    bottom: "items-end justify-center pb-10",
    left: "items-center justify-start pl-10",
    right: "items-center justify-end pr-10",
};

export interface PlaygroundConfig {
    /** Starting prop values (also the "Custom…" reset target). */
    initial: Record<string, unknown>;
    controls: Control[];
    presets?: Preset[];
    /**
     * Mark an *overlay* config: the stage becomes a CSS containing block (so the
     * overlay's portaled `fixed`/anchored panel resolves against the stage, not the
     * page) with `overflow:hidden`, confining the overlay to the playground. The
     * render must thread `ctx.portalContainer` into the component. @default false
     */
    contained?: boolean;
    /** Stage height (px) for a `contained` overlay, sized to fit its panel. @default 440 */
    containedHeight?: number;
    /**
     * Where to pin the trigger inside a `contained` stage, so its overlay opens into
     * the stage rather than off the edge: pin the trigger on the side *opposite* the
     * overlay (e.g. `"top"` → dropdown opens down; `"right"` → popover opens left).
     * `"center"` (default) suits modals and small popovers that fit either way. Pass a
     * function to derive it from live props — e.g. follow a `side` control. @default "center"
     */
    containedAlign?: ContainedAlign | ((props: Record<string, never>) => ContainedAlign);
    /**
     * Call-to-action hint shown above the stage for components whose live instance is
     * hidden until you interact with it — modals/drawers/alerts behind a trigger button,
     * the AIExplainability popover, a right-click context menu, a hover tooltip. Tells the
     * viewer how to reveal the component so the stage doesn't read as "just a button".
     * Omit for components that are fully visible at rest. `icon` defaults to `hand-up`.
     */
    cta?: { text: string; icon?: IconName };
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
    // Overlay configs portal into the stage so the overlay stays inside the playground.
    // Track the stage element in state (not a ref) so the first mount triggers a re-render
    // and the portal moves from its document.body fallback into the stage.
    const [stageEl, setStageEl] = useState<HTMLDivElement | null>(null);
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
    const contained = !!config.contained;
    const ctx: PlaygroundContext = { dark, open, setOpen, portalContainer: contained ? stageEl : null };
    // Trigger placement inside a contained stage — may depend on live props (e.g. a
    // `side` control), so resolve it each render.
    const alignClass =
        CONTAINED_ALIGN_CLASS[
            typeof config.containedAlign === "function"
                ? config.containedAlign(live)
                : config.containedAlign ?? "center"
        ];
    return (
        <div className="flex flex-col gap-3">
            {/* Call-to-action: for components whose live instance is hidden until you act
                (a modal behind a trigger, a hover tooltip, a right-click menu), nudge the
                viewer so the stage doesn't read as empty. */}
            {config.cta && (
                <div className="flex items-center gap-2 self-start rounded-bp border border-border bg-[var(--interactive-hover)] py-1.5 pl-2.5 pr-3.5 text-body-sm text-foreground">
                    <Icon icon={config.cta.icon ?? "hand-up"} size={15} className="text-intent-primary-text" />
                    <span>{config.cta.text}</span>
                </div>
            )}
            {/* Stage. For overlay configs (`contained`), the stage establishes a CSS
                containing block (transform) + clips overflow, so a portaled overlay's
                `fixed`/anchored panel resolves against the stage and stays inside it —
                "as if the stage were the viewport". */}
            <div
                ref={setStageEl}
                className={cn(
                    "flex flex-wrap rounded-bp border border-border bg-surface",
                    contained
                        ? cn(
                              // Pin the trigger opposite the overlay so it opens into the
                              // stage (alignClass also sets justify-*). No `gap` here: an open
                              // overlay portals a (0-width) wrapper div into the stage as a 2nd
                              // flex child, and a gap between it and the trigger would shift the
                              // `justify-center`'d trigger sideways by gap/2 the moment it opens.
                              "relative overflow-hidden p-0",
                              alignClass,
                          )
                        : "min-h-[160px] items-center justify-center gap-4 p-8",
                )}
                style={
                    contained
                        ? { height: config.containedHeight ?? 440, transform: "translateZ(0)" }
                        : undefined
                }
            >
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

function SelectDemo({ dark, filterable, disabled, fill, portalContainer }: { dark: boolean; filterable: boolean; disabled: boolean; fill: boolean; portalContainer: HTMLElement | null }) {
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
                popoverProps={{ portalContainer }}
                dark={dark}
            >
                <Button variant="solid" endIcon="caret-down" disabled={disabled} fill={fill}>
                    {selected ?? "Select a fruit…"}
                </Button>
            </Select>
        </div>
    );
}

function SuggestDemo({ dark, disabled, fill, placeholder, portalContainer }: { dark: boolean; disabled: boolean; fill: boolean; placeholder: string; portalContainer: HTMLElement | null }) {
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
                popoverProps={{ portalContainer }}
                disabled={disabled}
                fill={fill}
                dark={dark}
            />
        </div>
    );
}

function MultiSelectDemo({ dark, intent, leftIcon, disabled, fill, placeholder, portalContainer }: { dark: boolean; intent: string; leftIcon: string; disabled: boolean; fill: boolean; placeholder: string; portalContainer: HTMLElement | null }) {
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
                popoverProps={{ portalContainer }}
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
// so the engine doesn't re-init its sizing/order state every render. Row data is sliced
// from a 1,000-row pool; the wrapper is keyed on the row count so changing it remounts
// with a fresh slice (resetting any inline edits).
interface PgPerson {
    name: string;
    age: number;
    role: string;
    location: string;
}
const PG_TABLE_NAMED: PgPerson[] = [
    { name: "Alice Hancock", age: 34, role: "Engineer", location: "London" },
    { name: "Bob Liu", age: 29, role: "Designer", location: "Seattle" },
    { name: "Carol Reyes", age: 41, role: "Manager", location: "Austin" },
    { name: "Dan Okafor", age: 38, role: "Analyst", location: "Lagos" },
    { name: "Eve Novak", age: 26, role: "Engineer", location: "Prague" },
    { name: "Frank Mori", age: 52, role: "Director", location: "Osaka" },
];
const PG_TABLE_ROLES = ["Engineer", "Designer", "Manager", "Analyst", "Director"];
const PG_TABLE_CITIES = ["London", "Seattle", "Austin", "Lagos", "Prague", "Osaka"];
// First 6 are the hand-named rows; the rest are generated so virtualization has something to chew on.
const PG_TABLE_POOL: PgPerson[] = [
    ...PG_TABLE_NAMED,
    ...Array.from({ length: 994 }, (_, i) => {
        const n = i + 7;
        return {
            name: `Person ${n}`,
            age: 20 + (n % 50),
            role: PG_TABLE_ROLES[n % PG_TABLE_ROLES.length],
            location: PG_TABLE_CITIES[n % PG_TABLE_CITIES.length],
        };
    }),
];

function DataTableDemo({
    numberedRows,
    selectionMode,
    rowCount,
    resizing,
    reordering,
    editable,
    loading,
    height,
    rowHeight,
}: {
    numberedRows: boolean;
    selectionMode: string;
    rowCount: number;
    resizing: boolean;
    reordering: boolean;
    editable: boolean;
    loading: boolean;
    height: number | undefined;
    rowHeight: number;
}) {
    const [rows, setRows] = useState<PgPerson[]>(() => PG_TABLE_POOL.slice(0, rowCount));
    const columns = useMemo<DataTableColumn<PgPerson>[]>(
        () => [
            { id: "name", header: "Name", accessor: "name", width: 150, editable },
            { id: "age", header: "Age", accessor: "age", width: 60, align: "right" },
            { id: "role", header: "Role", accessor: "role", width: 110, editable },
            { id: "location", header: "Location", accessor: "location", width: 120 },
        ],
        [editable],
    );
    // Contextual usage hints — only the gestures that apply to the current mode.
    const hints: string[] = [];
    if (!loading && selectionMode === "single") hints.push("Click or drag to select a cell range · Shift-click extends it");
    if (!loading && selectionMode === "multi") hints.push("Click a range · Cmd/Ctrl-click adds another region · Cmd/Ctrl-C copies");
    if (!loading && editable) hints.push("Double-click an editable cell (Name / Role) to edit · Enter commits · Esc reverts");
    if (!loading && reordering) hints.push("Click a column header to select it, then drag it to reorder");
    return (
        <div className="flex flex-col gap-2" style={{ width: 440 }}>
            <DataTable<PgPerson>
                data={rows}
                columns={columns}
                numberedRows={numberedRows}
                selectionMode={selectionMode as DataTableSelectionMode}
                enableColumnResizing={resizing}
                enableColumnReordering={reordering}
                loading={loading}
                height={height}
                rowHeight={rowHeight}
                onCellEdit={({ row, columnId, value }) =>
                    setRows((rs) => rs.map((r, i) => (i === row ? { ...r, [columnId]: value } : r)))
                }
            />
            {hints.length > 0 && (
                <div className="flex flex-col gap-0.5">
                    {hints.map((h) => (
                        <span key={h} className="text-body-sm text-foreground-muted">
                            {h}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Batch 8: dates / time + tree / panel-stack (stateful wrappers) ────────────
// All of these are controlled, so each needs a small stateful wrapper holding its
// value/selection (render() is a pure function of props). The input variants
// (DateInput / DateRangeInput / TimezoneSelect) portal a popover → thread `ctx.dark`;
// the inline calendars (TimePicker / DatePicker / DateRangePicker) and Tree /
// PanelStack render in place and need no `dark` threading. Fixed seed dates keep the
// live instance deterministic.
const PG_DATE = new Date(2026, 0, 15); // Jan 15, 2026
const PG_TIME = new Date(2026, 0, 15, 14, 30, 0, 0); // 2:30 PM
const PG_RANGE: DateRangePickerValue = { start: new Date(2026, 0, 8), end: new Date(2026, 0, 20) };

function TimePickerDemo({ precision, useAmPm, showArrowButtons, selectAllOnFocus, disabled }: { precision: string; useAmPm: boolean; showArrowButtons: boolean; selectAllOnFocus: boolean; disabled: boolean }) {
    const [value, setValue] = useState<Date>(PG_TIME);
    return (
        <TimePicker
            value={value}
            onChange={setValue}
            precision={precision as never}
            useAmPm={useAmPm}
            showArrowButtons={showArrowButtons}
            selectAllOnFocus={selectAllOnFocus}
            disabled={disabled}
        />
    );
}

function DatePickerDemo({ timePrecision, showOutsideDays, highlightCurrentDay, canClearSelection, disabled }: { timePrecision: string; showOutsideDays: boolean; highlightCurrentDay: boolean; canClearSelection: boolean; disabled: boolean }) {
    const [value, setValue] = useState<Date | null>(PG_DATE);
    return (
        <DatePicker
            value={value}
            onChange={setValue}
            timePrecision={(timePrecision || undefined) as never}
            showOutsideDays={showOutsideDays}
            highlightCurrentDay={highlightCurrentDay}
            canClearSelection={canClearSelection}
            disabled={disabled}
        />
    );
}

function DateRangePickerDemo({ singleMonthOnly, contiguousCalendarMonths, allowSingleDayRange, disabled }: { singleMonthOnly: boolean; contiguousCalendarMonths: boolean; allowSingleDayRange: boolean; disabled: boolean }) {
    const [value, setValue] = useState<DateRangePickerValue>(PG_RANGE);
    return (
        <DateRangePicker
            value={value}
            onChange={setValue}
            singleMonthOnly={singleMonthOnly}
            contiguousCalendarMonths={contiguousCalendarMonths}
            allowSingleDayRange={allowSingleDayRange}
            disabled={disabled}
        />
    );
}

function DateInputDemo({ dark, placeholder, timePrecision, closeOnSelection, fill, disabled, portalContainer }: { dark: boolean; placeholder: string; timePrecision: string; closeOnSelection: boolean; fill: boolean; disabled: boolean; portalContainer: HTMLElement | null }) {
    const [value, setValue] = useState<Date | null>(PG_DATE);
    return (
        <div style={{ width: 240 }}>
            <DateInput
                value={value}
                onChange={setValue}
                placeholder={placeholder}
                timePrecision={(timePrecision || undefined) as never}
                closeOnSelection={closeOnSelection}
                fill={fill}
                disabled={disabled}
                popoverProps={{ portalContainer }}
                dark={dark}
            />
        </div>
    );
}

function DateRangeInputDemo({ dark, allowSingleDayRange, contiguousCalendarMonths, closeOnSelection, fill, disabled, portalContainer }: { dark: boolean; allowSingleDayRange: boolean; contiguousCalendarMonths: boolean; closeOnSelection: boolean; fill: boolean; disabled: boolean; portalContainer: HTMLElement | null }) {
    // Start empty so the playground shows the two-click build flow (pick start → popover
    // stays open, focus moves to end → pick end → closes). Seeding a complete range would
    // make every click merely adjust a boundary and immediately close (Blueprint-faithful,
    // but it reads as "closes for no reason" in the demo).
    const [value, setValue] = useState<DateRangePickerValue>({ start: null, end: null });
    return (
        <div style={{ width: 340 }}>
            <DateRangeInput
                value={value}
                onChange={setValue}
                allowSingleDayRange={allowSingleDayRange}
                contiguousCalendarMonths={contiguousCalendarMonths}
                closeOnSelection={closeOnSelection}
                fill={fill}
                disabled={disabled}
                popoverProps={{ portalContainer }}
                dark={dark}
            />
        </div>
    );
}

function TimezoneSelectDemo({ dark, showLocalTimezone, filterable, fill, disabled, placeholder, portalContainer }: { dark: boolean; showLocalTimezone: boolean; filterable: boolean; fill: boolean; disabled: boolean; placeholder: string; portalContainer: HTMLElement | null }) {
    const [value, setValue] = useState<string>("America/Los_Angeles");
    return (
        <div style={{ width: 320 }}>
            <TimezoneSelect
                value={value}
                onChange={setValue}
                showLocalTimezone={showLocalTimezone}
                filterable={filterable}
                fill={fill}
                disabled={disabled}
                placeholder={placeholder}
                popoverProps={{ portalContainer }}
                dark={dark}
            />
        </div>
    );
}

const PG_TREE_NODES: TreeNodeInfo[] = [
    {
        id: 1,
        label: "Documents",
        icon: "folder-close",
        isExpanded: true,
        childNodes: [
            { id: 2, label: "Annual Report 2025", icon: "document", secondaryLabel: <span style={{ fontSize: 12, opacity: 0.6 }}>4.2 MB</span> },
            {
                id: 3,
                label: "Projects",
                icon: "folder-close",
                isExpanded: true,
                childNodes: [
                    { id: 4, label: "mithril", icon: "document", isSelected: true },
                    { id: 5, label: "blueprint-ref", icon: "document" },
                ],
            },
        ],
    },
    { id: 6, label: "Drafts", icon: "folder-close" },
    { id: 7, label: "Trash", icon: "trash", disabled: true },
];

function TreeDemo({ compact }: { compact: boolean }) {
    const [contents, { handleNodeClick, handleNodeExpand, handleNodeCollapse }] = useTreeState(PG_TREE_NODES);
    return (
        <div style={{ width: 300 }}>
            <Tree
                contents={contents}
                compact={compact}
                onNodeClick={handleNodeClick}
                onNodeExpand={handleNodeExpand}
                onNodeCollapse={handleNodeCollapse}
            />
        </div>
    );
}

const PG_ROOT_PANEL: PanelInfo = {
    title: "Root",
    renderPanel: ({ openPanel }: PanelActions & object) => (
        <div className="flex flex-col gap-2 p-4 text-body text-foreground">
            <p>Root panel content.</p>
            <Button
                size="small"
                onClick={() => openPanel({ title: "Detail", renderPanel: () => <div className="p-4 text-body text-foreground">Detail panel content.</div> })}
            >
                Open Detail
            </Button>
        </div>
    ),
};

function PanelStackDemo({ showPanelHeader, renderActivePanelOnly }: { showPanelHeader: boolean; renderActivePanelOnly: boolean }) {
    const [stack, setStack] = useState<PanelInfo[]>([PG_ROOT_PANEL]);
    return (
        <div style={{ width: 320, height: 240, position: "relative", border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden" }}>
            <PanelStack
                stack={stack}
                onOpen={(p) => setStack((prev) => [...prev, p])}
                onClose={() => setStack((prev) => prev.slice(0, -1))}
                showPanelHeader={showPanelHeader}
                renderActivePanelOnly={renderActivePanelOnly}
                style={{ width: "100%", height: "100%" }}
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

    "ai-explainability": {
        contained: true,
        // The provenance popover is tall (~330px), so pin the chip on the side opposite
        // the popover (driven by the `side` control) so it always opens into the stage.
        containedAlign: (p) =>
            (({ bottom: "top", top: "bottom", left: "right", right: "left" }) as const)[
                p.side as "top" | "right" | "bottom" | "left"
            ] ?? "top",
        containedHeight: 440,
        cta: { text: "Click the AI chip to open its explainability popover." },
        initial: { intent: "primary", variant: "minimal", size: "medium", label: "AI", side: "bottom", showIcon: true, interactive: true },
        controls: [
            { kind: "enum", prop: "intent", options: INTENTS },
            { kind: "enum", prop: "variant", options: [{ value: "minimal" }, { value: "solid" }] },
            { kind: "enum", prop: "size", options: SIZES },
            { kind: "enum", prop: "side", options: [{ value: "top" }, { value: "right" }, { value: "bottom" }, { value: "left" }] },
            { kind: "text", prop: "label" },
            { kind: "boolean", prop: "showIcon" },
            { kind: "boolean", prop: "interactive" },
        ],
        presets: [
            { name: "Inline marker", props: { intent: "primary", variant: "minimal", size: "small", label: "AI", showIcon: true, interactive: false } },
            { name: "Solid + explanation", props: { intent: "primary", variant: "solid", size: "large", label: "AI assisted", side: "right", showIcon: true, interactive: true } },
        ],
        render: (p, ctx) => (
            <AIExplainability
                intent={p.intent}
                variant={p.variant}
                size={p.size}
                label={p.label || null}
                icon={p.showIcon ? undefined : false}
                ariaLabel={p.label ? undefined : "AI generated"}
                dark={ctx.dark}
                popoverProps={{ side: p.side, portalContainer: ctx.portalContainer }}
                popover={p.interactive ? <AIExplainabilityDemoDetails /> : undefined}
            />
        ),
        code: (p) =>
            jsx("AIExplainability", {
                intent: p.intent === "primary" ? undefined : p.intent,
                variant: p.variant === "minimal" ? undefined : p.variant,
                size: p.size === "medium" ? undefined : p.size,
                label: p.label || undefined,
                icon: p.showIcon ? undefined : "{false}",
                popoverProps: p.interactive && p.side !== "bottom" ? `{{ side: "${p.side}" }}` : undefined,
                popover: p.interactive ? "{<AIExplainabilityDetails>…</AIExplainabilityDetails>}" : undefined,
            }),
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

    "file-dropzone": {
        initial: { size: "medium", title: "Drag & drop files here", browseText: "browse", multiple: true, showFileList: true, disabled: false },
        controls: [
            { kind: "enum", prop: "size", options: SIZES },
            { kind: "text", prop: "title" },
            { kind: "text", prop: "browseText", label: "browse" },
            { kind: "boolean", prop: "multiple" },
            { kind: "boolean", prop: "showFileList", label: "file list" },
            { kind: "boolean", prop: "disabled" },
        ],
        presets: [
            { name: "Single file", props: { multiple: false, title: "Drop a file" } },
            { name: "Drag-only", props: { browseText: "" } },
        ],
        render: (p) => (
            <FileDropzone
                size={p.size}
                title={p.title}
                browseText={p.browseText || undefined}
                noClick={!p.browseText}
                multiple={p.multiple}
                showFileList={p.showFileList}
                disabled={p.disabled}
            />
        ),
        code: (p) =>
            jsx("FileDropzone", {
                size: p.size === "medium" ? undefined : p.size,
                title: p.title === "Drag & drop files here" ? undefined : p.title,
                browseText: p.browseText === "browse" ? undefined : p.browseText || undefined,
                noClick: !p.browseText || undefined,
                multiple: p.multiple ? undefined : false,
                showFileList: p.showFileList ? undefined : false,
                disabled: p.disabled,
            }),
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
        contained: true,
        containedHeight: 240,
        cta: { text: "Hover the button to reveal the tooltip.", icon: "highlight" },
        initial: { content: "Tooltip content", side: "bottom", align: "center", intent: "none" },
        controls: [
            { kind: "enum", prop: "side", options: SIDES },
            { kind: "enum", prop: "align", options: ALIGNS },
            { kind: "enum", prop: "intent", options: INTENTS },
            { kind: "text", prop: "content" },
        ],
        render: (p, ctx) => (
            <Tooltip content={p.content} side={p.side} align={p.align} intent={p.intent} dark={ctx.dark} portalContainer={ctx.portalContainer}>
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
        contained: true,
        containedHeight: 320,
        cta: { text: "Click the trigger to open the popover." },
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
                portalContainer={ctx.portalContainer}
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
        contained: true,
        containedHeight: 380,
        cta: { text: "Click “Open dialog” to launch the modal." },
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
                <Dialog open={ctx.open} onOpenChange={ctx.setOpen} title={p.title} icon={<Icon icon="info-sign" />} closeButton={p.closeButton} portalContainer={ctx.portalContainer} dark={ctx.dark}>
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
        contained: true,
        containedHeight: 460,
        cta: { text: "Click “Open drawer” to slide it in from the edge." },
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
                <Drawer open={ctx.open} onOpenChange={ctx.setOpen} position={p.position} size={p.size} title={p.title} icon={<Icon icon="info-sign" />} closeButton={p.closeButton} portalContainer={ctx.portalContainer} dark={ctx.dark}>
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
        contained: true,
        containedHeight: 300,
        cta: { text: "Click “Open alert” to launch the confirmation dialog." },
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
                    portalContainer={ctx.portalContainer}
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
        contained: true,
        cta: { text: "Click “Open wizard” to step through the dialog." },
        containedHeight: 560,
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
                    portalContainer={ctx.portalContainer}
                    dark={ctx.dark}
                    // The component's intrinsic width is 800px — wider than the contained stage,
                    // so it'd bleed to both edges here. Narrow it so the stage frames it with margin.
                    className="!w-[640px] !min-w-0"
                    finalButtonProps={{ children: "Create", onClick: () => ctx.setOpen(false) }}
                >
                    <DialogStep
                        id="info"
                        title="Project info"
                        panel={
                            // Distinct key per step: the active panel renders at the same tree
                            // position, so without keys React reuses the uncontrolled <input> DOM
                            // nodes and values bleed between steps (e.g. the name into the email field).
                            <div key="info" className="flex flex-col gap-4 p-5">
                                <FormGroup label="Project name" labelFor="pg-ms-name">
                                    <InputGroup id="pg-ms-name" leftIcon="projects" defaultValue="Apollo Initiative" fill />
                                </FormGroup>
                                <FormGroup label="Description" labelFor="pg-ms-desc">
                                    <TextArea
                                        id="pg-ms-desc"
                                        rows={3}
                                        fill
                                        defaultValue="Mission planning and telemetry review workspace for the Apollo team."
                                    />
                                </FormGroup>
                                <FormGroup label="Visibility" labelFor="pg-ms-vis">
                                    <HTMLSelect id="pg-ms-vis" fill defaultValue="Team" options={["Private", "Team", "Public"]} />
                                </FormGroup>
                            </div>
                        }
                    />
                    <DialogStep
                        id="members"
                        title="Members"
                        panel={
                            <div key="members" className="flex flex-col gap-4 p-5">
                                <FormGroup label="Invite by email" labelFor="pg-ms-email">
                                    <InputGroup id="pg-ms-email" leftIcon="envelope" placeholder="name@company.com" fill />
                                </FormGroup>
                                <FormGroup label="Role" labelFor="pg-ms-role">
                                    <HTMLSelect id="pg-ms-role" fill defaultValue="Editor" options={["Viewer", "Editor", "Admin"]} />
                                </FormGroup>
                                <div className="flex flex-col gap-2 pt-1">
                                    <Switch label="Notify members by email" defaultChecked />
                                    <Checkbox label="Allow members to invite others" />
                                </div>
                            </div>
                        }
                    />
                    <DialogStep
                        id="review"
                        title="Review"
                        panel={
                            <div key="review" className="flex flex-col gap-4 p-5">
                                <div className="flex flex-col gap-2 text-body text-foreground">
                                    <div className="flex justify-between">
                                        <span className="text-foreground-muted">Project</span>
                                        <span className="font-medium">Apollo Initiative</span>
                                    </div>
                                    <Divider className="!m-0" />
                                    <div className="flex justify-between">
                                        <span className="text-foreground-muted">Visibility</span>
                                        <span className="font-medium">Team</span>
                                    </div>
                                    <Divider className="!m-0" />
                                    <div className="flex justify-between">
                                        <span className="text-foreground-muted">Members</span>
                                        <span className="font-medium">3 invited</span>
                                    </div>
                                </div>
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
        // No portalContainer needed: Radix Toast.Viewport renders in place (inside the
        // stage subtree), so its `fixed` position resolves against the contained stage.
        contained: true,
        containedHeight: 320,
        cta: { text: "Click “Show toast” to fire a notification." },
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
        contained: true,
        containedHeight: 360,
        cta: { text: "Right-click inside the area to open the menu.", icon: "menu-open" },
        initial: { icons: true, danger: true },
        controls: [
            { kind: "boolean", prop: "icons" },
            { kind: "boolean", prop: "danger", label: "danger item" },
        ],
        render: (p, ctx) => (
            <ContextMenu
                portalContainer={ctx.portalContainer}
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
        contained: true,
        containedHeight: 420,
        cta: { text: "Click “Open omnibar” to launch the command palette." },
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
                    portalContainer={ctx.portalContainer}
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
        contained: true,
        containedAlign: "top",
        containedHeight: 380,
        initial: { filterable: true, fill: false, disabled: false },
        controls: [
            { kind: "boolean", prop: "filterable" },
            { kind: "boolean", prop: "fill" },
            { kind: "boolean", prop: "disabled" },
        ],
        render: (p, ctx) => <SelectDemo dark={ctx.dark} filterable={p.filterable} fill={p.fill} disabled={p.disabled} portalContainer={ctx.portalContainer} />,
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
        contained: true,
        containedAlign: "top",
        containedHeight: 380,
        initial: { placeholder: "Search fruit…", fill: false, disabled: false },
        controls: [
            { kind: "text", prop: "placeholder" },
            { kind: "boolean", prop: "fill" },
            { kind: "boolean", prop: "disabled" },
        ],
        render: (p, ctx) => <SuggestDemo dark={ctx.dark} placeholder={String(p.placeholder)} fill={p.fill} disabled={p.disabled} portalContainer={ctx.portalContainer} />,
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
        contained: true,
        containedAlign: "top",
        containedHeight: 400,
        initial: { placeholder: "Add fruit…", intent: "none", leftIcon: "", fill: true, disabled: false },
        controls: [
            { kind: "enum", prop: "intent", options: INTENTS },
            { kind: "enum", prop: "leftIcon", label: "leftIcon", options: ICONS },
            { kind: "text", prop: "placeholder" },
            { kind: "boolean", prop: "fill" },
            { kind: "boolean", prop: "disabled" },
        ],
        render: (p, ctx) => (
            <MultiSelectDemo dark={ctx.dark} intent={p.intent} leftIcon={p.leftIcon} placeholder={String(p.placeholder)} fill={p.fill} disabled={p.disabled} portalContainer={ctx.portalContainer} />
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
        initial: { selectionMode: "multi", rows: "6", height: "auto", rowHeight: 20, numberedRows: true, resizing: true, reordering: false, editable: true, loading: false },
        controls: [
            { kind: "enum", prop: "selectionMode", label: "selection", options: [{ value: "none" }, { value: "single" }, { value: "multi" }] },
            { kind: "enum", prop: "rows", label: "rows", options: [{ value: "6" }, { value: "50" }, { value: "1000", label: "1,000" }] },
            { kind: "enum", prop: "height", label: "height", widget: "segmented", options: [{ value: "auto" }, { value: "200" }, { value: "400" }, { value: "800" }] },
            { kind: "number", prop: "rowHeight", label: "row height", min: 16, max: 48, stepSize: 2 },
            { kind: "boolean", prop: "numberedRows", label: "gutter" },
            { kind: "boolean", prop: "resizing", label: "resize cols" },
            { kind: "boolean", prop: "reordering", label: "reorder cols" },
            { kind: "boolean", prop: "editable", label: "editable" },
            { kind: "boolean", prop: "loading" },
        ],
        render: (p) => {
            const rowCount = Number(p.rows);
            const heightPx = p.height === "auto" ? undefined : Number(p.height);
            const rowHeight = Number(p.rowHeight);
            return (
                <DataTableDemo
                    // Remount on row-count change so the data slice resets cleanly, and on
                    // rowHeight change to dodge issue #44 (a runtime rowHeight change leaves the
                    // virtualizer's cached row offsets stale → overlapping rows). Remounting seeds
                    // the virtualizer's estimate at the new height from the first render.
                    key={`${rowCount}-${rowHeight}`}
                    selectionMode={p.selectionMode}
                    rowCount={rowCount}
                    height={heightPx}
                    rowHeight={rowHeight}
                    numberedRows={p.numberedRows}
                    resizing={p.resizing}
                    reordering={p.reordering}
                    editable={p.editable}
                    loading={p.loading}
                />
            );
        },
        code: (p) => {
            const ed = p.editable ? ", editable: true" : "";
            const n = Number(p.rows);
            const h = p.height === "auto" ? undefined : Number(p.height);
            const rh = Number(p.rowHeight);
            return [
                `const [data, setData] = useState(rows); // ${n.toLocaleString()} rows`,
                `const columns: DataTableColumn<Person>[] = [`,
                `  { id: "name", header: "Name", accessor: "name", width: 150${ed} },`,
                `  { id: "age", header: "Age", accessor: "age", width: 60, align: "right" },`,
                `  { id: "role", header: "Role", accessor: "role", width: 110${ed} },`,
                `  { id: "location", header: "Location", accessor: "location", width: 120 },`,
                `];`,
                ``,
                `<DataTable`,
                `  data={data} columns={columns}${p.numberedRows ? "" : " numberedRows={false}"}${p.selectionMode === "single" ? "" : ` selectionMode="${p.selectionMode}"`}${p.resizing ? " enableColumnResizing" : ""}${p.reordering ? " enableColumnReordering" : ""}${h != null ? ` height={${h}}` : ""}${rh !== 20 ? ` rowHeight={${rh}}` : ""}${p.loading ? " loading" : ""}`,
                ...(p.editable ? [`  onCellEdit={({ row, columnId, value }) => save(row, columnId, value)}`] : []),
                h != null ? `/> // a fixed height bounds the viewport ⇒ rows virtualize (only the visible window renders)` : `/>`,
            ].join("\n");
        },
    },

    // ── Batch 8: dates / time (inline calendars + portaled inputs) + tree / panel-stack ──
    "time-picker": {
        initial: { precision: "minute", useAmPm: false, showArrowButtons: false, selectAllOnFocus: false, disabled: false },
        controls: [
            { kind: "enum", prop: "precision", options: [{ value: "minute" }, { value: "second" }, { value: "millisecond" }] },
            { kind: "boolean", prop: "useAmPm" },
            { kind: "boolean", prop: "showArrowButtons" },
            { kind: "boolean", prop: "selectAllOnFocus" },
            { kind: "boolean", prop: "disabled" },
        ],
        presets: [
            { name: "Seconds + arrows", props: { precision: "second", showArrowButtons: true, useAmPm: false } },
            { name: "12-hour (AM/PM)", props: { precision: "minute", useAmPm: true, showArrowButtons: false } },
        ],
        render: (p) => (
            <TimePickerDemo precision={p.precision} useAmPm={p.useAmPm} showArrowButtons={p.showArrowButtons} selectAllOnFocus={p.selectAllOnFocus} disabled={p.disabled} />
        ),
        code: (p) =>
            [
                `const [value, setValue] = useState(() => new Date(2026, 0, 15, 14, 30));`,
                ``,
                jsx("TimePicker", {
                    value: "{value}",
                    onChange: "{setValue}",
                    precision: p.precision === "minute" ? undefined : (p.precision as never),
                    useAmPm: p.useAmPm,
                    showArrowButtons: p.showArrowButtons,
                    selectAllOnFocus: p.selectAllOnFocus,
                    disabled: p.disabled,
                }),
            ].join("\n"),
    },

    "date-picker": {
        initial: { timePrecision: "", showOutsideDays: true, highlightCurrentDay: false, canClearSelection: true, disabled: false },
        controls: [
            { kind: "enum", prop: "timePrecision", label: "timePrecision", options: [{ value: "", label: "none" }, { value: "minute" }, { value: "second" }], widget: "select" },
            { kind: "boolean", prop: "showOutsideDays" },
            { kind: "boolean", prop: "highlightCurrentDay" },
            { kind: "boolean", prop: "canClearSelection" },
            { kind: "boolean", prop: "disabled" },
        ],
        render: (p) => (
            <DatePickerDemo timePrecision={p.timePrecision} showOutsideDays={p.showOutsideDays} highlightCurrentDay={p.highlightCurrentDay} canClearSelection={p.canClearSelection} disabled={p.disabled} />
        ),
        code: (p) =>
            [
                `const [value, setValue] = useState<Date | null>(() => new Date(2026, 0, 15));`,
                ``,
                jsx("DatePicker", {
                    value: "{value}",
                    onChange: "{setValue}",
                    timePrecision: p.timePrecision || undefined,
                    showOutsideDays: p.showOutsideDays ? undefined : false,
                    highlightCurrentDay: p.highlightCurrentDay,
                    canClearSelection: p.canClearSelection ? undefined : false,
                    disabled: p.disabled,
                }),
            ].join("\n"),
    },

    "date-range-picker": {
        initial: { singleMonthOnly: false, contiguousCalendarMonths: true, allowSingleDayRange: false, disabled: false },
        controls: [
            { kind: "boolean", prop: "singleMonthOnly" },
            { kind: "boolean", prop: "contiguousCalendarMonths" },
            { kind: "boolean", prop: "allowSingleDayRange" },
            { kind: "boolean", prop: "disabled" },
        ],
        render: (p) => (
            <DateRangePickerDemo singleMonthOnly={p.singleMonthOnly} contiguousCalendarMonths={p.contiguousCalendarMonths} allowSingleDayRange={p.allowSingleDayRange} disabled={p.disabled} />
        ),
        code: (p) =>
            [
                `const [value, setValue] = useState(() => ({`,
                `  start: new Date(2026, 0, 8), end: new Date(2026, 0, 20),`,
                `}));`,
                ``,
                jsx("DateRangePicker", {
                    value: "{value}",
                    onChange: "{setValue}",
                    singleMonthOnly: p.singleMonthOnly,
                    contiguousCalendarMonths: p.contiguousCalendarMonths ? undefined : false,
                    allowSingleDayRange: p.allowSingleDayRange,
                    disabled: p.disabled,
                }),
            ].join("\n"),
    },

    "date-input": {
        contained: true,
        containedAlign: "top",
        containedHeight: 380,
        initial: { placeholder: "M/d/yyyy", timePrecision: "", closeOnSelection: true, fill: false, disabled: false },
        controls: [
            { kind: "text", prop: "placeholder" },
            { kind: "enum", prop: "timePrecision", label: "timePrecision", options: [{ value: "", label: "none" }, { value: "minute" }, { value: "second" }], widget: "select" },
            { kind: "boolean", prop: "closeOnSelection" },
            { kind: "boolean", prop: "fill" },
            { kind: "boolean", prop: "disabled" },
        ],
        render: (p, ctx) => (
            <DateInputDemo dark={ctx.dark} placeholder={String(p.placeholder)} timePrecision={p.timePrecision} closeOnSelection={p.closeOnSelection} fill={p.fill} disabled={p.disabled} portalContainer={ctx.portalContainer} />
        ),
        code: (p) =>
            [
                `const [value, setValue] = useState<Date | null>(() => new Date(2026, 0, 15));`,
                ``,
                jsx("DateInput", {
                    value: "{value}",
                    onChange: "{setValue}",
                    placeholder: String(p.placeholder),
                    timePrecision: p.timePrecision || undefined,
                    closeOnSelection: p.closeOnSelection ? undefined : false,
                    fill: p.fill,
                    disabled: p.disabled,
                    dark: "{dark}",
                }),
            ].join("\n"),
    },

    "date-range-input": {
        contained: true,
        containedAlign: "top",
        containedHeight: 400,
        initial: { allowSingleDayRange: false, contiguousCalendarMonths: true, closeOnSelection: true, fill: false, disabled: false },
        controls: [
            { kind: "boolean", prop: "allowSingleDayRange" },
            { kind: "boolean", prop: "contiguousCalendarMonths" },
            { kind: "boolean", prop: "closeOnSelection" },
            { kind: "boolean", prop: "fill" },
            { kind: "boolean", prop: "disabled" },
        ],
        render: (p, ctx) => (
            <DateRangeInputDemo dark={ctx.dark} allowSingleDayRange={p.allowSingleDayRange} contiguousCalendarMonths={p.contiguousCalendarMonths} closeOnSelection={p.closeOnSelection} fill={p.fill} disabled={p.disabled} portalContainer={ctx.portalContainer} />
        ),
        code: (p) =>
            [
                `const [value, setValue] = useState(() => ({`,
                `  start: new Date(2026, 0, 8), end: new Date(2026, 0, 20),`,
                `}));`,
                ``,
                jsx("DateRangeInput", {
                    value: "{value}",
                    onChange: "{setValue}",
                    allowSingleDayRange: p.allowSingleDayRange,
                    contiguousCalendarMonths: p.contiguousCalendarMonths ? undefined : false,
                    closeOnSelection: p.closeOnSelection ? undefined : false,
                    fill: p.fill,
                    disabled: p.disabled,
                    dark: "{dark}",
                }),
            ].join("\n"),
    },

    "timezone-select": {
        contained: true,
        containedAlign: "top",
        containedHeight: 400,
        initial: { showLocalTimezone: true, filterable: true, fill: false, disabled: false, placeholder: "Select timezone…" },
        controls: [
            { kind: "boolean", prop: "showLocalTimezone" },
            { kind: "boolean", prop: "filterable" },
            { kind: "boolean", prop: "fill" },
            { kind: "boolean", prop: "disabled" },
            { kind: "text", prop: "placeholder" },
        ],
        render: (p, ctx) => (
            <TimezoneSelectDemo dark={ctx.dark} showLocalTimezone={p.showLocalTimezone} filterable={p.filterable} fill={p.fill} disabled={p.disabled} placeholder={String(p.placeholder)} portalContainer={ctx.portalContainer} />
        ),
        code: (p) =>
            [
                `const [value, setValue] = useState("America/Los_Angeles");`,
                ``,
                jsx("TimezoneSelect", {
                    value: "{value}",
                    onChange: "{setValue}",
                    showLocalTimezone: p.showLocalTimezone ? undefined : false,
                    filterable: p.filterable ? undefined : false,
                    fill: p.fill,
                    disabled: p.disabled,
                    placeholder: String(p.placeholder),
                    dark: "{dark}",
                }),
            ].join("\n"),
    },

    tree: {
        initial: { compact: false },
        controls: [{ kind: "boolean", prop: "compact" }],
        render: (p) => <TreeDemo compact={p.compact} />,
        code: (p) =>
            [
                `const [contents, handlers] = useTreeState(nodes);`,
                ``,
                `<Tree`,
                `  contents={contents}${p.compact ? " compact" : ""}`,
                `  onNodeClick={handlers.handleNodeClick}`,
                `  onNodeExpand={handlers.handleNodeExpand}`,
                `  onNodeCollapse={handlers.handleNodeCollapse}`,
                `/>`,
            ].join("\n"),
    },

    "panel-stack": {
        initial: { showPanelHeader: true, renderActivePanelOnly: true },
        controls: [
            { kind: "boolean", prop: "showPanelHeader" },
            { kind: "boolean", prop: "renderActivePanelOnly" },
        ],
        render: (p) => <PanelStackDemo showPanelHeader={p.showPanelHeader} renderActivePanelOnly={p.renderActivePanelOnly} />,
        code: (p) =>
            [
                `const [stack, setStack] = useState([rootPanel]);`,
                ``,
                `<PanelStack`,
                `  stack={stack}`,
                `  onOpen={(p) => setStack((s) => [...s, p])}`,
                `  onClose={() => setStack((s) => s.slice(0, -1))}${p.showPanelHeader ? "" : "\n  showPanelHeader={false}"}${p.renderActivePanelOnly ? "" : "\n  renderActivePanelOnly={false}"}`,
                `/>`,
            ].join("\n"),
    },
};
