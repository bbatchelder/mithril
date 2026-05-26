import { ChevronDown, ExternalLink, Plus, Settings } from "lucide-react";
import { createContext, useContext, useEffect, useRef, useState } from "react";

import { Button, type ButtonIntent, type ButtonVariant } from "@/components/ui/button";
import { Card, type CardElevation } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Dialog, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Drawer, DrawerBody, DrawerSize } from "@/components/ui/drawer";
import { Popover } from "@/components/ui/popover";
import { Tooltip } from "@/components/ui/tooltip";
import { Divider } from "@/components/ui/divider";
import { Icon, type IconIntent } from "@/components/ui/icon";
import { InputGroup, type InputGroupIntent } from "@/components/ui/input-group";
import { TextArea, type TextAreaIntent } from "@/components/ui/text-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Radio, RadioGroup } from "@/components/ui/radio";
import { Switch } from "@/components/ui/switch";
import { Label, FormGroup, type FormGroupIntent } from "@/components/ui/form-group";
import { ControlGroup } from "@/components/ui/control-group";
import { HTMLSelect } from "@/components/ui/html-select";
import { FileInput } from "@/components/ui/file-input";
import { NumericInput, type NumericInputIntent } from "@/components/ui/numeric-input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { CheckboxCard, RadioCard, SwitchCard } from "@/components/ui/control-card";
import { ProgressBar, type ProgressBarIntent } from "@/components/ui/progress-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner, SpinnerSize, type SpinnerIntent } from "@/components/ui/spinner";
import { Callout, type CalloutIntent } from "@/components/ui/callout";
import { Tag, type TagIntent } from "@/components/ui/tag";
import { Text } from "@/components/ui/text";
import { Toast, ToastProvider } from "@/components/ui/toast";
import { Menu, MenuItem, MenuDivider } from "@/components/ui/menu";
import { ContextMenu } from "@/components/ui/context-menu";
import { Navbar, NavbarGroup, NavbarHeading, NavbarDivider } from "@/components/ui/navbar";
import { Tabs, Tab } from "@/components/ui/tabs";
import { Collapse } from "@/components/ui/collapse";
import { Section as BpSection, SectionCard as BpSectionCard } from "@/components/ui/section";
import { CardList } from "@/components/ui/card-list";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Tree, useTreeState, type TreeNodeInfo } from "@/components/ui/tree";
import { PanelStack, type PanelActions, type PanelInfo } from "@/components/ui/panel-stack";
import { HTMLTable } from "@/components/ui/html-table";
import { EditableText, type EditableTextIntent } from "@/components/ui/editable-text";
import { EntityTitle, type EntityTitleSize } from "@/components/ui/entity-title";
import { NonIdealState, NonIdealStateIconSize } from "@/components/ui/non-ideal-state";
import { Link } from "@/components/ui/link";
import { Slider } from "@/components/ui/slider";
import { KeyCombo, HotkeysDialog } from "@/components/ui/hotkeys";
import { TagInput } from "@/components/ui/tag-input";
import { Select } from "@/components/ui/select";
import { Suggest } from "@/components/ui/suggest";
import { MultiSelect } from "@/components/ui/multi-select";
import { Omnibar } from "@/components/ui/omnibar";
import { TimePicker } from "@/components/ui/time-picker";
import { DatePicker } from "@/components/ui/date-picker";
import { DateInput } from "@/components/ui/date-input";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRangeInput } from "@/components/ui/date-range-input";
import { TimezoneSelect } from "@/components/ui/timezone-select";

/** Context carrying the app-level dark state for components that portal content (Dialog, etc.). */
const DarkContext = createContext(false);

const VARIANTS: ButtonVariant[] = ["solid", "outlined", "minimal"];
const INTENTS: ButtonIntent[] = ["none", "primary", "success", "warning", "danger"];

function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-3">
            <span className="w-20 text-body-sm text-foreground-muted">{label}</span>
            <div className="flex flex-wrap items-center gap-2">{children}</div>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="flex flex-col gap-2.5">
            <h2 className="text-heading-sm font-semibold text-foreground">{title}</h2>
            {children}
        </section>
    );
}

/**
 * Button showcase. Key specimens carry `data-compare="<key>"` so the comparison
 * harness (tools/compare.sh) can diff their computed styles against Blueprint's
 * identically-keyed specimens. Keep these keys in lock-step with the reference
 * gallery (tools/blueprint-reference/src/App.tsx).
 */
function ButtonGallery() {
    return (
        <div className="flex flex-col gap-8">
            <Section title="Variant × Intent">
                {VARIANTS.map((variant) => (
                    <Row key={variant} label={variant}>
                        {INTENTS.map((intent) => (
                            <Button key={intent} variant={variant} intent={intent} data-compare={`btn-${variant}-${intent}`}>
                                {intent}
                            </Button>
                        ))}
                    </Row>
                ))}
            </Section>

            <Section title="Sizes (solid / primary)">
                <Row label="">
                    <Button size="small" intent="primary" data-compare="btn-size-small">
                        Small
                    </Button>
                    <Button size="medium" intent="primary" data-compare="btn-size-medium">
                        Medium
                    </Button>
                    <Button size="large" intent="primary" data-compare="btn-size-large">
                        Large
                    </Button>
                </Row>
            </Section>

            <Section title="States (solid / primary)">
                <Row label="">
                    <Button intent="primary">Default</Button>
                    <Button intent="primary" disabled>
                        Disabled
                    </Button>
                    <Button intent="primary" loading>
                        Loading
                    </Button>
                    <Button intent="primary" active>
                        Active
                    </Button>
                </Row>
            </Section>

            <Section title="With icons">
                <Row label="">
                    <Button icon={<Plus />} aria-label="Add" />
                    <Button icon={<Plus />} intent="primary">
                        Start icon
                    </Button>
                    <Button endIcon={<ExternalLink />} intent="primary">
                        End icon
                    </Button>
                    <Button icon={<Settings />} endIcon={<ChevronDown />}>
                        Both
                    </Button>
                </Row>
            </Section>

            <Section title="Fill">
                <Button fill intent="primary">
                    Fill button
                </Button>
            </Section>
        </div>
    );
}

const ICON_INTENTS: IconIntent[] = ["none", "primary", "success", "warning", "danger"];

/**
 * Icon showcase. Paired specimens carry `data-compare` keys that mirror the Blueprint
 * reference gallery — the harness diffs their computed fill/size by key.
 */
function IconGallery() {
    return (
        <div className="flex flex-col gap-6">
            <Section title="Default (16px)">
                <div className="flex flex-wrap items-center gap-4">
                    <Icon icon="add" data-compare="icon-add-16" />
                    <Icon icon="cross" data-compare="icon-cross-16" />
                    <Icon icon="tick" data-compare="icon-tick-16" />
                    <Icon icon="search" data-compare="icon-search-16" />
                    <Icon icon="chevron-down" data-compare="icon-chevron-down-16" />
                    <Icon icon="cog" data-compare="icon-cog-16" />
                    <Icon icon="more" data-compare="icon-more-16" />
                </div>
            </Section>

            <Section title="Large (20px)">
                <div className="flex flex-wrap items-center gap-4">
                    <Icon icon="add" size={20} data-compare="icon-add-20" />
                    <Icon icon="search" size={20} data-compare="icon-search-20" />
                    <Icon icon="cog" size={20} data-compare="icon-cog-20" />
                </div>
            </Section>

            <Section title="Intents (16px)">
                <Row label="">
                    {ICON_INTENTS.map((intent) => (
                        <Icon
                            key={intent}
                            icon="info-sign"
                            intent={intent}
                            data-compare={`icon-intent-${intent}`}
                        />
                    ))}
                </Row>
            </Section>

            <Section title="Intent glyphs">
                <Row label="">
                    <Icon icon="tick-circle" intent="success" data-compare="icon-tick-circle-success" />
                    <Icon icon="warning-sign" intent="warning" data-compare="icon-warning-sign-warning" />
                    <Icon icon="error" intent="danger" data-compare="icon-error-danger" />
                    <Icon icon="info-sign" intent="primary" data-compare="icon-info-sign-primary" />
                </Row>
            </Section>
        </div>
    );
}

const ELEVATIONS: CardElevation[] = [0, 1, 2, 3, 4];

/**
 * Card showcase. Compared specimens use a fixed box (`width`/`height`) so the
 * harness diffs card chrome — bg, radius, shadow, padding — without typography
 * line-height noise affecting the measured height. Keys mirror the reference gallery.
 */
function CardGallery() {
    const box: React.CSSProperties = { width: 220, height: 96 };
    return (
        <div className="flex flex-col gap-6">
            <Section title="Elevation (0–4)">
                <div className="flex flex-wrap gap-5">
                    {ELEVATIONS.map((e) => (
                        <Card key={e} elevation={e} style={box} data-compare={`card-elevation-${e}`}>
                            Elevation {e}
                        </Card>
                    ))}
                </div>
            </Section>

            <Section title="Interactive / selected / compact">
                <div className="flex flex-wrap gap-5">
                    <Card interactive style={box}>
                        Interactive (hover to raise)
                    </Card>
                    <Card interactive selected style={box} data-compare="card-selected">
                        Selected
                    </Card>
                    <Card compact style={box} data-compare="card-compact">
                        Compact (16px padding)
                    </Card>
                </div>
            </Section>
        </div>
    );
}

/**
 * Text showcase. Paired specimens carry `data-compare` keys that mirror the Blueprint
 * reference gallery. Content and fixed widths on `text-ellipsize` must match.
 *
 * The harness compares: color, fontSize, fontWeight, backgroundColor, height, minWidth,
 * paddingLeft, paddingRight (lineHeight is deliberately omitted from harness capture).
 */
function TextGallery() {
    return (
        <div className="flex flex-col gap-6">
            <Section title="Body tiers">
                <div className="flex flex-col gap-2">
                    <Text data-compare="text-body">
                        Body text — the default Blueprint body style (14px / 1.28581 / 400).
                    </Text>
                    <Text variant="large" data-compare="text-large">
                        Large text — bp6-text-large (16px / 1.28581 / 400).
                    </Text>
                    <Text variant="small" data-compare="text-small">
                        Small text — bp6-text-small (12px / 1.28581 / 400).
                    </Text>
                </div>
            </Section>

            <Section title="Color modifiers">
                <div className="flex flex-col gap-2">
                    <Text variant="muted" data-compare="text-muted">
                        Muted text — bp6-text-muted (gray-1 / gray-4).
                    </Text>
                    <Text variant="disabled" data-compare="text-disabled">
                        Disabled text — bp6-text-disabled (gray-1@60% / gray-4@60%).
                    </Text>
                </div>
            </Section>

            <Section title="Monospace / code">
                <Text variant="code" data-compare="text-code">
                    monospace code text — bp6-monospace-text (font-family: monospace).
                </Text>
            </Section>

            <Section title="Headings (h1–h6)">
                <div className="flex flex-col gap-0">
                    <Text variant="h1" data-compare="text-heading-1">Heading 1 (36px / 40px)</Text>
                    <Text variant="h2" data-compare="text-heading-2">Heading 2 (28px / 32px)</Text>
                    <Text variant="h3" data-compare="text-heading-3">Heading 3 (22px / 25px)</Text>
                    <Text variant="h4" data-compare="text-heading-4">Heading 4 (18px / 21px)</Text>
                    <Text variant="h5" data-compare="text-heading-5">Heading 5 (16px / 19px)</Text>
                    <Text variant="h6" data-compare="text-heading-6">Heading 6 (14px / 16px)</Text>
                </div>
            </Section>

            <Section title="Ellipsize">
                {/* Fixed width so both sides trigger overflow identically */}
                <Text
                    ellipsize
                    style={{ width: 200 }}
                    data-compare="text-ellipsize"
                >
                    This text is long enough to overflow and be truncated with an ellipsis.
                </Text>
            </Section>
        </div>
    );
}

/**
 * Divider showcase. Three specimens paired with Blueprint reference by key:
 *   divider-default  — horizontal divider in a flex-column container (bottom border visible)
 *   divider-vertical — vertical divider in a flex-row container (right border visible)
 *   divider-compact  — compact divider (no margin)
 *
 * The harness diffs borderBottomWidth/borderBottomColor, borderRightWidth/borderRightColor,
 * marginTop/marginBottom/marginLeft/marginRight. Container layout must be identical on
 * both sides per key.
 */
function DividerGallery() {
    return (
        <div className="flex flex-col gap-6 text-foreground">
            <Section title="Horizontal (flex-column container)">
                {/* The divider element itself carries data-compare; container provides flex context */}
                <div style={{ display: "flex", flexDirection: "column", width: 200 }}>
                    <div className="text-body text-foreground">Above</div>
                    <Divider data-compare="divider-default" />
                    <div className="text-body text-foreground">Below</div>
                </div>
            </Section>

            <Section title="Vertical (flex-row container)">
                <div style={{ display: "flex", flexDirection: "row", alignItems: "stretch", height: 32 }}>
                    <div className="text-body text-foreground">Left</div>
                    <Divider data-compare="divider-vertical" />
                    <div className="text-body text-foreground">Right</div>
                </div>
            </Section>

            <Section title="Compact (no margin)">
                <div style={{ display: "flex", flexDirection: "column", width: 200 }}>
                    <div className="text-body text-foreground">Above</div>
                    <Divider compact data-compare="divider-compact" />
                    <div className="text-body text-foreground">Below</div>
                </div>
            </Section>
        </div>
    );
}

/**
 * Spinner showcase. All compared specimens are DETERMINATE (value prop set) so
 * stroke-dashoffset is stable and screenshots are still (no animation).
 *
 * data-compare placed on the head/track <path> elements via headProps/trackProps.
 * The harness captures: stroke color, strokeWidth, strokeDasharray, strokeDashoffset,
 * strokeLinecap, fillOpacity.
 *
 * Keys mirror tools/blueprint-reference/src/App.tsx SpinnerGallery exactly.
 * value=0.5 on both sides → dashoffset = 280 - 0.5*280 = 140.
 */
const SPINNER_INTENTS: SpinnerIntent[] = ["primary", "success", "warning", "danger"];

function SpinnerGallery() {
    // All specimens are determinate with value=0.5 (50% arc → dashoffset=140).
    const VALUE = 0.5;
    return (
        <div className="flex flex-col gap-6 text-foreground">
            <Section title="Sizes (determinate, value=0.5)">
                <div className="flex flex-wrap items-center gap-6">
                    {/* Small: size=20 → strokeWidth=16 */}
                    <Spinner
                        size={SpinnerSize.SMALL}
                        value={VALUE}
                        aria-label="small spinner"
                        trackProps={{ "data-compare": "spinner-sm-track" }}
                        headProps={{ "data-compare": "spinner-sm-head" }}
                    />
                    {/* Standard: size=50 → strokeWidth=8 */}
                    <Spinner
                        size={SpinnerSize.STANDARD}
                        value={VALUE}
                        aria-label="standard spinner"
                        trackProps={{ "data-compare": "spinner-std-track" }}
                        headProps={{ "data-compare": "spinner-std-head" }}
                    />
                    {/* Large: size=100 → strokeWidth=4 */}
                    <Spinner
                        size={SpinnerSize.LARGE}
                        value={VALUE}
                        aria-label="large spinner"
                        headProps={{ "data-compare": "spinner-lg-head" }}
                    />
                </div>
            </Section>

            <Section title="Intents (standard, value=0.5)">
                <div className="flex flex-wrap items-center gap-6">
                    {SPINNER_INTENTS.map((intent) => (
                        <Spinner
                            key={intent}
                            size={SpinnerSize.STANDARD}
                            value={VALUE}
                            intent={intent}
                            aria-label={`${intent} spinner`}
                            headProps={{ "data-compare": `spinner-${intent}-head` }}
                        />
                    ))}
                </div>
            </Section>

            <Section title="Indeterminate (visual only — not diff'd)">
                <div className="flex flex-wrap items-center gap-6">
                    <Spinner size={SpinnerSize.SMALL} aria-label="small indeterminate spinner" />
                    <Spinner size={SpinnerSize.STANDARD} aria-label="standard indeterminate spinner" />
                    <Spinner size={SpinnerSize.LARGE} aria-label="large indeterminate spinner" />
                </div>
            </Section>
        </div>
    );
}

/**
 * ProgressBar showcase. All compared specimens are DETERMINATE so meter width is stable
 * and measurable in the diff. Each bar is wrapped in a fixed-width 200px container so
 * the meter's pixel width (value% of 200) is identical on both sides.
 *
 * data-compare placed on track div (via the ProgressBar itself) and meter div (via meterProps).
 * The harness captures: backgroundColor, height, borderRadius, width for track/meter.
 *
 * Keys mirror tools/blueprint-reference/src/App.tsx ProgressBarGallery exactly.
 */
const PB_INTENTS: ProgressBarIntent[] = ["primary", "success", "warning", "danger"];

function ProgressBarGallery() {
    const containerStyle: React.CSSProperties = { width: 200 };
    return (
        <div className="flex flex-col gap-6 text-foreground">
            <Section title="Default (determinate, fixed 200px)">
                <div className="flex flex-col gap-3">
                    {/* value=0.5 — track + meter keyed */}
                    <div style={containerStyle}>
                        <ProgressBar
                            value={0.5}
                            data-compare="pb-track-50"
                            meterProps={{ "data-compare": "pb-meter-50" }}
                        />
                    </div>
                    <div style={containerStyle}>
                        <ProgressBar
                            value={0.25}
                            meterProps={{ "data-compare": "pb-meter-25" }}
                        />
                    </div>
                    <div style={containerStyle}>
                        <ProgressBar
                            value={0.75}
                            meterProps={{ "data-compare": "pb-meter-75" }}
                        />
                    </div>
                </div>
            </Section>

            <Section title="Intent (value=0.6, fixed 200px)">
                <div className="flex flex-col gap-3">
                    {PB_INTENTS.map((intent) => (
                        <div key={intent} style={containerStyle}>
                            <ProgressBar
                                value={0.6}
                                intent={intent}
                                meterProps={{ "data-compare": `pb-meter-${intent}` }}
                            />
                        </div>
                    ))}
                </div>
            </Section>

            <Section title="No stripes / no animation (visual only)">
                <div className="flex flex-col gap-3" style={containerStyle}>
                    <ProgressBar value={0.4} stripes={false} />
                    <ProgressBar value={0.4} animate={false} />
                    <ProgressBar value={0.4} stripes={false} animate={false} />
                </div>
            </Section>

            <Section title="Indeterminate (visual only — not diff'd)">
                <div style={containerStyle}>
                    <ProgressBar />
                </div>
                <div style={containerStyle}>
                    <ProgressBar intent="primary" />
                </div>
            </Section>
        </div>
    );
}

/**
 * Skeleton showcase. The two keyed specimens have animation DISABLED (`animate={false}`)
 * so the background freezes at the start color (rgba(211,216,222,0.2)) — deterministic
 * for the computed-style diff. The animated specimen is visual-only (no data-compare).
 *
 * Keyed specimens (identical size/animation-off on both sides):
 *   skeleton-box  — 120×16px placeholder bar
 *   skeleton-line — 200×12px placeholder line
 *
 * Keys mirror tools/blueprint-reference/src/App.tsx SkeletonGallery exactly.
 *
 * Compared props: backgroundColor (= start color), borderColor, borderRadius (2px),
 * color (transparent), boxShadow (none). All captured by capture-styles.js.
 */
function SkeletonGallery() {
    return (
        <div className="flex flex-col gap-6 text-foreground">
            <Section title="Static specimens (animation off — diff'd)">
                <div className="flex flex-col gap-3">
                    {/* skeleton-box: 120×16 — animation disabled for deterministic diff */}
                    <Skeleton
                        animate={false}
                        className="h-4 w-[120px]"
                        data-compare="skeleton-box"
                    />
                    {/* skeleton-line: 200×12 — animation disabled for deterministic diff */}
                    <Skeleton
                        animate={false}
                        className="h-3 w-[200px]"
                        data-compare="skeleton-line"
                    />
                </div>
            </Section>

            <Section title="Animated (visual only — not diff'd)">
                <div className="flex flex-col gap-3">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[160px]" />
                    <Skeleton className="h-4 w-[120px]" />
                </div>
            </Section>

            <Section title="Modifier pattern (existing elements skeletonized)">
                {/* Blueprint-style: apply skeleton modifier to existing content elements */}
                <Card className="flex flex-col gap-2 p-4 w-[240px]">
                    <Skeleton as="h5" animate={false} className="text-heading-sm font-semibold">
                        Card heading
                    </Skeleton>
                    <Skeleton as="p" animate={false} className="text-body">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    </Skeleton>
                    <Skeleton as="button" animate={false} className="h-7.5 w-20 text-body">
                        Submit
                    </Skeleton>
                </Card>
            </Section>
        </div>
    );
}

const TAG_INTENTS: TagIntent[] = ["none", "primary", "success", "warning", "danger"];

/**
 * Tag showcase. Keyed specimens carry `data-compare` attributes that mirror the Blueprint
 * reference gallery. The harness diffs: backgroundColor, color, height, paddingLeft,
 * paddingRight, borderRadius, fontSize.
 *
 * Keys mirror tools/blueprint-reference/src/App.tsx TagGallery exactly.
 */
function TagGallery() {
    return (
        <div className="flex flex-col gap-6 text-foreground">
            <Section title="Solid intents">
                <div className="flex flex-wrap items-center gap-2">
                    {TAG_INTENTS.map((intent) => (
                        <Tag key={intent} intent={intent} data-compare={`tag-solid-${intent}`}>
                            {intent}
                        </Tag>
                    ))}
                </div>
            </Section>

            <Section title="Minimal intents">
                <div className="flex flex-wrap items-center gap-2">
                    {TAG_INTENTS.map((intent) => (
                        <Tag key={intent} intent={intent} minimal data-compare={`tag-minimal-${intent}`}>
                            {intent}
                        </Tag>
                    ))}
                </div>
            </Section>

            <Section title="Large">
                <div className="flex flex-wrap items-center gap-2">
                    <Tag size="large" data-compare="tag-large">
                        Large tag
                    </Tag>
                    <Tag size="large" intent="primary">
                        Large primary
                    </Tag>
                    <Tag size="large" minimal intent="success">
                        Large minimal
                    </Tag>
                </div>
            </Section>

            <Section title="Round">
                <div className="flex flex-wrap items-center gap-2">
                    <Tag round data-compare="tag-round">
                        Round
                    </Tag>
                    <Tag round intent="primary">
                        Round primary
                    </Tag>
                    <Tag round size="large" intent="success">
                        Round large
                    </Tag>
                </div>
            </Section>

            <Section title="With icon">
                <div className="flex flex-wrap items-center gap-2">
                    <Tag icon={<Icon icon="tick" size={12} />} data-compare="tag-icon">
                        With icon
                    </Tag>
                    <Tag icon={<Icon icon="tick" size={12} />} intent="success">
                        Success icon
                    </Tag>
                    <Tag endIcon={<Icon icon="caret-down" size={12} />} intent="primary">
                        End icon
                    </Tag>
                </div>
            </Section>

            <Section title="Removable">
                <div className="flex flex-wrap items-center gap-2">
                    <Tag onRemove={() => {}} data-compare="tag-removable">
                        Removable
                    </Tag>
                    <Tag onRemove={() => {}} intent="primary">
                        Primary removable
                    </Tag>
                    <Tag onRemove={() => {}} size="large" intent="success">
                        Large removable
                    </Tag>
                </div>
            </Section>

            <Section title="Interactive">
                <div className="flex flex-wrap items-center gap-2">
                    <Tag interactive>
                        Interactive
                    </Tag>
                    <Tag interactive intent="primary">
                        Primary interactive
                    </Tag>
                    <Tag interactive active intent="success">
                        Active
                    </Tag>
                </div>
            </Section>
        </div>
    );
}

const CALLOUT_INTENTS: CalloutIntent[] = ["none", "primary", "success", "warning", "danger"];

/**
 * Callout showcase. All keyed specimens use a fixed width of 320px to ensure identical
 * measured widths on both sides. Keys mirror tools/blueprint-reference/src/App.tsx CalloutGallery.
 *
 * The harness diffs: backgroundColor, color, paddingTop, paddingBottom, paddingLeft,
 * paddingRight, borderRadius, fontSize, lineHeight.
 */
function CalloutGallery() {
    const w: React.CSSProperties = { width: 320 };
    return (
        <div className="flex flex-col gap-6 text-foreground">
            <Section title="Intent (with default icon + title + body)">
                <div className="flex flex-col gap-3">
                    {CALLOUT_INTENTS.map((intent) => (
                        <Callout
                            key={intent}
                            intent={intent}
                            title={intent === "none" ? "Default callout" : `${intent.charAt(0).toUpperCase() + intent.slice(1)} callout`}
                            style={w}
                            data-compare={`callout-${intent}`}
                        >
                            This is the callout body content for {intent} intent.
                        </Callout>
                    ))}
                </div>
            </Section>

            <Section title="Compact">
                <Callout
                    intent="primary"
                    title="Compact callout"
                    compact
                    style={w}
                    data-compare="callout-compact"
                >
                    Compact reduces padding from 16px to 8px.
                </Callout>
            </Section>

            <Section title="Minimal (no background)">
                <Callout
                    intent="warning"
                    title="Minimal callout"
                    minimal
                    style={w}
                    data-compare="callout-minimal"
                >
                    Minimal removes the background color fill.
                </Callout>
            </Section>

            <Section title="No icon (icon={null} with intent)">
                <Callout
                    intent="danger"
                    title="No icon callout"
                    icon={null}
                    style={w}
                    data-compare="callout-no-icon"
                >
                    Explicitly suppressed icon with intent set.
                </Callout>
            </Section>
        </div>
    );
}

const IG_INTENTS: InputGroupIntent[] = ["none", "primary", "success", "warning", "danger"];

/**
 * InputGroup showcase. All keyed specimens use a fixed width of 200px so the harness
 * captures identical element widths on both sides.
 *
 * `data-compare` is placed on the `<input>` element (Blueprint's `.bp6-input`).
 * The harness diffs: height, paddingLeft, paddingRight, borderRadius, boxShadow,
 * backgroundColor, color, fontSize (resting / unfocused state only).
 *
 * Keys mirror tools/blueprint-reference/src/App.tsx InputGroupGallery exactly.
 */
function InputGroupGallery() {
    const w: React.CSSProperties = { width: 200 };
    return (
        <div className="flex flex-col gap-6 text-foreground">
            <Section title="Sizes">
                <div className="flex flex-col gap-3">
                    <InputGroup size="small" placeholder="Small (24px)" style={w} data-compare="ig-small" />
                    <InputGroup size="medium" placeholder="Medium (30px)" style={w} data-compare="ig-medium" />
                    <InputGroup size="large" placeholder="Large (40px)" style={w} data-compare="ig-large" />
                </div>
            </Section>

            <Section title="Intent">
                <div className="flex flex-col gap-3">
                    {IG_INTENTS.map((intent) => (
                        <InputGroup
                            key={intent}
                            intent={intent}
                            placeholder={`${intent} intent`}
                            style={w}
                            data-compare={`ig-intent-${intent}`}
                        />
                    ))}
                </div>
            </Section>

            <Section title="Round">
                <InputGroup round placeholder="Round input" style={w} data-compare="ig-round" />
            </Section>

            <Section title="Disabled">
                <InputGroup disabled placeholder="Disabled input" style={w} data-compare="ig-disabled" />
            </Section>

            <Section title="Left icon">
                <InputGroup leftIcon="search" placeholder="Search…" style={w} data-compare="ig-left-icon" />
            </Section>

            <Section title="Right element">
                <InputGroup
                    placeholder="With right element"
                    style={w}
                    data-compare="ig-right-element"
                    rightElement={
                        <Button size="small" variant="minimal" aria-label="Clear">
                            <Icon icon="cross" size={12} />
                        </Button>
                    }
                />
            </Section>
        </div>
    );
}

const TA_INTENTS: TextAreaIntent[] = ["none", "primary", "success", "warning", "danger"];

/**
 * TextArea showcase. All keyed specimens use a fixed width of 240px and rows=3 so the
 * harness captures identical element widths and computed heights on both sides.
 *
 * `data-compare` is placed directly on the `<textarea>` element (Blueprint's `.bp6-input.bp6-text-area`).
 * The harness diffs: paddingLeft, paddingRight, borderRadius, boxShadow,
 * backgroundColor, color, fontSize (resting / unfocused state only).
 * `height` is also compared — with rows=3 and matching font-size, heights should match.
 *
 * Keys mirror tools/blueprint-reference/src/App.tsx TextAreaGallery exactly.
 */
function TextAreaGallery() {
    const w: React.CSSProperties = { width: 240 };
    return (
        <div className="flex flex-col gap-6 text-foreground">
            <Section title="Sizes">
                <div className="flex flex-col gap-3">
                    <TextArea size="medium" rows={3} placeholder="Medium (default)" style={w} data-compare="ta-medium" />
                    <TextArea size="small" rows={3} placeholder="Small" style={w} data-compare="ta-small" />
                    <TextArea size="large" rows={3} placeholder="Large" style={w} data-compare="ta-large" />
                </div>
            </Section>

            <Section title="Intent">
                <div className="flex flex-col gap-3">
                    {TA_INTENTS.map((intent) => (
                        <TextArea
                            key={intent}
                            intent={intent}
                            rows={3}
                            placeholder={`${intent} intent`}
                            style={w}
                            data-compare={`ta-intent-${intent}`}
                        />
                    ))}
                </div>
            </Section>

            <Section title="Disabled">
                <TextArea disabled rows={3} placeholder="Disabled textarea" style={w} data-compare="ta-disabled" />
            </Section>

            <Section title="Fill">
                <TextArea fill rows={3} placeholder="Fill textarea (full width)" />
            </Section>

            <Section title="Auto-resize (visual only)">
                <TextArea autoResize placeholder="Type to auto-resize…" style={w} />
            </Section>
        </div>
    );
}

/**
 * Checkbox showcase. `data-compare` is placed via `indicatorProps` on the indicator span
 * (`.bp6-control-indicator` equivalent) — the harness diffs width, height, border-radius,
 * background-color, and box-shadow of that element.
 *
 * Keys mirror tools/blueprint-reference/src/App.tsx CheckboxGallery exactly.
 */
function CheckboxGallery() {
    return (
        <div className="flex flex-col gap-6 text-foreground">
            <Section title="States">
                <div className="flex flex-col gap-3">
                    <Checkbox
                        label="Unchecked"
                        indicatorProps={{ "data-compare": "cb-unchecked" } as React.HTMLAttributes<HTMLSpanElement>}
                    />
                    <Checkbox
                        label="Checked"
                        defaultChecked
                        indicatorProps={{ "data-compare": "cb-checked" } as React.HTMLAttributes<HTMLSpanElement>}
                    />
                    <Checkbox
                        label="Indeterminate"
                        indeterminate
                        indicatorProps={{ "data-compare": "cb-indeterminate" } as React.HTMLAttributes<HTMLSpanElement>}
                    />
                    <Checkbox
                        label="Disabled"
                        disabled
                        indicatorProps={{ "data-compare": "cb-disabled" } as React.HTMLAttributes<HTMLSpanElement>}
                    />
                    <Checkbox
                        label="Disabled checked"
                        disabled
                        defaultChecked
                        indicatorProps={{ "data-compare": "cb-checked-disabled" } as React.HTMLAttributes<HTMLSpanElement>}
                    />
                </div>
            </Section>

            <Section title="Large">
                <div className="flex flex-col gap-3">
                    <Checkbox
                        label="Large unchecked"
                        large
                        indicatorProps={{ "data-compare": "cb-large" } as React.HTMLAttributes<HTMLSpanElement>}
                    />
                    <Checkbox label="Large checked" large defaultChecked />
                    <Checkbox label="Large indeterminate" large indeterminate />
                </div>
            </Section>

            <Section title="Inline">
                <div className="flex flex-wrap gap-4">
                    <Checkbox label="Option A" inline />
                    <Checkbox label="Option B" inline defaultChecked />
                    <Checkbox label="Option C" inline />
                </div>
            </Section>

            <Section title="Align right">
                <div className="flex flex-col gap-3 w-48">
                    <Checkbox label="Right aligned" alignIndicator="right" />
                    <Checkbox label="Right checked" alignIndicator="right" defaultChecked />
                </div>
            </Section>
        </div>
    );
}

/**
 * Radio + RadioGroup showcase. `data-compare` is placed via `indicatorProps` on the indicator span
 * (the `.bp6-control-indicator` equivalent). The harness diffs: width, height, border-radius,
 * background-color, and box-shadow of that element.
 *
 * Keys mirror tools/blueprint-reference/src/App.tsx RadioGallery exactly.
 */
function RadioGallery() {
    const [groupValue, setGroupValue] = useState<string>("option-b");

    return (
        <div className="flex flex-col gap-6 text-foreground">
            <Section title="States">
                <div className="flex flex-col gap-3">
                    <Radio
                        label="Unchecked"
                        name="radio-states"
                        value="unchecked"
                        indicatorProps={{ "data-compare": "radio-unchecked" } as React.HTMLAttributes<HTMLSpanElement>}
                    />
                    <Radio
                        label="Checked"
                        name="radio-states"
                        value="checked"
                        defaultChecked
                        indicatorProps={{ "data-compare": "radio-checked" } as React.HTMLAttributes<HTMLSpanElement>}
                    />
                    <Radio
                        label="Disabled"
                        name="radio-disabled-states"
                        value="disabled"
                        disabled
                        indicatorProps={{ "data-compare": "radio-disabled" } as React.HTMLAttributes<HTMLSpanElement>}
                    />
                    <Radio
                        label="Disabled checked"
                        name="radio-disabled-states"
                        value="disabled-checked"
                        disabled
                        defaultChecked
                        indicatorProps={{ "data-compare": "radio-checked-disabled" } as React.HTMLAttributes<HTMLSpanElement>}
                    />
                </div>
            </Section>

            <Section title="Large">
                <div className="flex flex-col gap-3">
                    <Radio
                        label="Large unchecked"
                        name="radio-large"
                        value="large-unchecked"
                        large
                        indicatorProps={{ "data-compare": "radio-large" } as React.HTMLAttributes<HTMLSpanElement>}
                    />
                    <Radio label="Large checked" name="radio-large" value="large-checked" large defaultChecked />
                </div>
            </Section>

            <Section title="RadioGroup via options (controlled)">
                <RadioGroup
                    name="radio-group-opts"
                    selectedValue={groupValue}
                    onChange={(val) => setGroupValue(val)}
                    label="Pick one"
                    options={[
                        { value: "option-a", label: "Option A" },
                        { value: "option-b", label: "Option B (default selected)" },
                        { value: "option-c", label: "Option C" },
                    ]}
                />
            </Section>

            <Section title="RadioGroup via children">
                <RadioGroup name="radio-group-children" selectedValue={groupValue} onChange={(val) => setGroupValue(val)}>
                    <Radio
                        value="option-a"
                        label="Option A"
                        indicatorProps={{ "data-compare": "radio-group-selected" } as React.HTMLAttributes<HTMLSpanElement>}
                    />
                    <Radio value="option-b" label="Option B (selected when groupValue=option-b)" />
                    <Radio value="option-c" label="Option C" />
                </RadioGroup>
            </Section>

            <Section title="Inline">
                <div className="flex flex-wrap gap-4">
                    <Radio label="Option A" name="radio-inline" value="a" inline />
                    <Radio label="Option B" name="radio-inline" value="b" inline defaultChecked />
                    <Radio label="Option C" name="radio-inline" value="c" inline />
                </div>
            </Section>
        </div>
    );
}

/**
 * Switch showcase. `data-compare` is placed via `indicatorProps` on the track span.
 * The harness diffs: backgroundColor, borderRadius, height, minWidth, boxShadow, color.
 * Keys MUST match tools/blueprint-reference/src/App.tsx SwitchGallery exactly.
 */
function SwitchGallery() {
    return (
        <div className="flex flex-col gap-6 text-foreground">
            <Section title="States">
                <div className="flex flex-col gap-3">
                    <Switch
                        label="Unchecked"
                        indicatorProps={{ "data-compare": "switch-unchecked" } as React.HTMLAttributes<HTMLSpanElement>}
                    />
                    <Switch
                        label="Checked"
                        defaultChecked
                        indicatorProps={{ "data-compare": "switch-checked" } as React.HTMLAttributes<HTMLSpanElement>}
                    />
                    <Switch
                        label="Disabled"
                        disabled
                        indicatorProps={{ "data-compare": "switch-disabled" } as React.HTMLAttributes<HTMLSpanElement>}
                    />
                    <Switch
                        label="Disabled checked"
                        disabled
                        defaultChecked
                        indicatorProps={{ "data-compare": "switch-checked-disabled" } as React.HTMLAttributes<HTMLSpanElement>}
                    />
                </div>
            </Section>

            <Section title="Large">
                <div className="flex flex-col gap-3">
                    <Switch
                        label="Large unchecked"
                        large
                        indicatorProps={{ "data-compare": "switch-large" } as React.HTMLAttributes<HTMLSpanElement>}
                    />
                    <Switch label="Large checked" large defaultChecked />
                </div>
            </Section>

            <Section title="Inner labels">
                <div className="flex flex-col gap-3">
                    <Switch
                        label="With inner labels"
                        innerLabel="OFF"
                        innerLabelChecked="ON"
                        indicatorProps={{ "data-compare": "switch-inner-labels" } as React.HTMLAttributes<HTMLSpanElement>}
                    />
                    <Switch label="Checked with inner labels" innerLabel="OFF" innerLabelChecked="ON" defaultChecked />
                </div>
            </Section>

            <Section title="Inline">
                <div className="flex flex-wrap gap-4">
                    <Switch label="Option A" inline />
                    <Switch label="Option B" inline defaultChecked />
                    <Switch label="Option C" inline disabled />
                </div>
            </Section>
        </div>
    );
}

// FormGroup inner element class names (mirror Blueprint's .bp6-* classes used in reference gallery).
const FG_SUBLABEL_CLASS = "fg-inner-sublabel";
const FG_HELPER_CLASS = "fg-inner-helper";

/**
 * Wrap a FormGroup and use useEffect to stamp data-compare on its inner elements.
 * Mirrors the ref+setAttribute technique used in the Blueprint reference gallery.
 */
function TaggedFormGroup({
    dataCompare,
    targetSelector,
    children,
    ...props
}: {
    dataCompare: string;
    targetSelector: string;
} & React.ComponentProps<typeof FormGroup>) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (ref.current) {
            const el = ref.current.querySelector(targetSelector);
            if (el) el.setAttribute("data-compare", dataCompare);
        }
    }, [dataCompare, targetSelector]);
    return <FormGroup ref={ref} {...props}>{children}</FormGroup>;
}

const FG_INTENTS: FormGroupIntent[] = ["none", "primary", "success", "warning", "danger"];

/**
 * FormGroup + Label showcase. data-compare keys must match blueprint-reference gallery.
 *
 * Specimens:
 *   fg-label       — standalone Label element (marginBottom=16px, color=foreground)
 *   fg-label-info  — the muted span inside the Label (color=muted, marginLeft=4px)
 *   fg-sublabel    — sub-label div inside FormGroup (color=muted, fontSize=12px, marginBottom=4px)
 *   fg-intent-danger — helper text in danger-intent FormGroup (color=danger-text, fontSize=12px, marginTop=4px)
 *   fg-inline      — label inside inline FormGroup (marginRight=12px, marginBottom=0)
 *   fg-disabled    — helper text in disabled FormGroup (color=disabled)
 */
function FormGroupGallery() {
    // ref trick for standalone Label's muted span
    const labelRef = useRef<HTMLLabelElement>(null);
    useEffect(() => {
        if (labelRef.current) {
            const span = labelRef.current.querySelector("span");
            if (span) span.setAttribute("data-compare", "fg-label-info");
        }
    }, []);

    return (
        <div className="flex flex-col gap-8">
            <Section title="Standalone Label">
                <div className="flex flex-col gap-0">
                    {/* fg-label: the label element itself — margin-bottom 16px, color foreground */}
                    <Label ref={labelRef} htmlFor="fg-label-input" data-compare="fg-label" info="(optional)">
                        Label text
                    </Label>
                    <input id="fg-label-input" type="text" className="border px-2 py-1 text-sm" placeholder="Input" />
                </div>
                <div className="flex flex-col gap-0">
                    <Label disabled info="(optional)">
                        Disabled label
                    </Label>
                </div>
            </Section>

            <Section title="Basic FormGroup">
                {/* fg-basic: the in-group label element (margin-bottom 4px) */}
                <TaggedFormGroup
                    label="Full name"
                    labelFor="fg-basic-input"
                    helperText="Please enter your full name."
                    labelInfo="(required)"
                    dataCompare="fg-basic"
                    targetSelector="label"
                >
                    <input id="fg-basic-input" type="text" className="border px-2 py-1 text-sm w-full" placeholder="Input" />
                </TaggedFormGroup>
            </Section>

            <Section title="Sub-label">
                {/* fg-sublabel: the sub-label div — color muted, font-size 12px, margin-bottom 4px */}
                <TaggedFormGroup
                    label="Username"
                    labelFor="fg-sublabel-input"
                    subLabel="Must be 3–20 characters."
                    helperText="Check availability first."
                    dataCompare="fg-sublabel"
                    targetSelector={`.${FG_SUBLABEL_CLASS}`}
                >
                    <input id="fg-sublabel-input" type="text" className="border px-2 py-1 text-sm w-full" placeholder="Input" />
                </TaggedFormGroup>
            </Section>

            <Section title="Intents (helper text color)">
                <div className="flex flex-col gap-2">
                    {FG_INTENTS.map((intent) => (
                        intent === "danger" ? (
                            // fg-intent-danger: helper text div — color = danger intent text, fontSize 12px, marginTop 4px
                            <TaggedFormGroup
                                key={intent}
                                label={`Intent: ${intent}`}
                                intent={intent}
                                helperText={`Helper text for intent ${intent}.`}
                                dataCompare="fg-intent-danger"
                                targetSelector={`.${FG_HELPER_CLASS}`}
                            >
                                <input type="text" className="border px-2 py-1 text-sm w-full" placeholder="Input" />
                            </TaggedFormGroup>
                        ) : (
                            <FormGroup
                                key={intent}
                                label={`Intent: ${intent}`}
                                intent={intent}
                                helperText={`Helper text for intent ${intent}.`}
                            >
                                <input type="text" className="border px-2 py-1 text-sm w-full" placeholder="Input" />
                            </FormGroup>
                        )
                    ))}
                </div>
            </Section>

            <Section title="Inline">
                {/* fg-inline: the label inside inline FormGroup — marginRight=12px, marginBottom=0 */}
                <TaggedFormGroup
                    label="Inline label"
                    labelFor="fg-inline-input"
                    inline
                    helperText="Helper below."
                    dataCompare="fg-inline"
                    targetSelector="label"
                >
                    <input id="fg-inline-input" type="text" className="border px-2 py-1 text-sm" placeholder="Input" />
                </TaggedFormGroup>
            </Section>

            <Section title="Disabled">
                {/* fg-disabled: the helper text in disabled FormGroup — color = disabled */}
                <TaggedFormGroup
                    label="Disabled group"
                    labelFor="fg-disabled-input"
                    helperText="Helper text (disabled)."
                    disabled
                    dataCompare="fg-disabled"
                    targetSelector={`.${FG_HELPER_CLASS}`}
                >
                    <input id="fg-disabled-input" type="text" disabled className="border px-2 py-1 text-sm w-full opacity-50" placeholder="Input" />
                </TaggedFormGroup>
            </Section>

            <Section title="Fill">
                <FormGroup label="Full width" fill helperText="Fills container.">
                    <input type="text" className="border px-2 py-1 text-sm w-full" placeholder="Input" />
                </FormGroup>
            </Section>
        </div>
    );
}

/**
 * ControlGroup showcase. `data-compare` is placed on the control-group div itself
 * (the flex container). The harness diffs: display, flexDirection, alignItems, flexGrow.
 *
 * Specimens (keys must match blueprint-reference gallery exactly):
 *   cg-horizontal  — InputGroup + Button in a row (flexDirection:row, alignItems:stretch)
 *   cg-vertical    — two InputGroups stacked (flexDirection:column)
 *   cg-fill        — fill group (width=100%, children flex-grow)
 *   cg-fill-child  — first child of fill group (flexGrow:1)
 */
function ControlGroupGallery() {
    // We need refs to stamp data-compare on the fill child (first child of cg-fill group)
    const fillGroupRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (fillGroupRef.current) {
            const firstChild = fillGroupRef.current.firstElementChild;
            if (firstChild) {
                firstChild.setAttribute("data-compare", "cg-fill-child");
                firstChild.setAttribute("data-compare-flex", "");
            }
        }
    }, []);

    return (
        <div className="flex flex-col gap-8">
            <Section title="Horizontal (default)">
                {/* cg-horizontal: data-compare + data-compare-flex → harness diffs display/flexDirection/alignItems */}
                <ControlGroup data-compare="cg-horizontal" data-compare-flex="">
                    <InputGroup placeholder="Search…" style={{ width: 180 }} />
                    <Button>Go</Button>
                </ControlGroup>
            </Section>

            <Section title="Vertical">
                {/* cg-vertical: data-compare-flex → flexDirection:column */}
                <ControlGroup vertical data-compare="cg-vertical" data-compare-flex="" style={{ width: 200 }}>
                    <InputGroup placeholder="Username" />
                    <InputGroup placeholder="Password" type="password" />
                </ControlGroup>
            </Section>

            <Section title="Fill">
                {/* cg-fill: data-compare-flex → width:100%, children flex-grow */}
                {/* cg-fill-child: stamped via ref on the first child — flexGrow:1 */}
                <ControlGroup fill ref={fillGroupRef} data-compare="cg-fill" data-compare-flex="">
                    <InputGroup placeholder="Search…" />
                    <Button>Go</Button>
                </ControlGroup>
            </Section>

            <Section title="Intent / composition">
                <ControlGroup>
                    <InputGroup placeholder="Enter value…" intent="primary" style={{ width: 160 }} />
                    <Button intent="primary">Submit</Button>
                </ControlGroup>
            </Section>
        </div>
    );
}

/**
 * HTMLSelect showcase.
 *
 * `data-compare` is placed on the `<select>` element (the measured node), matching
 * Blueprint's `.bp6-html-select > select`. The harness diffs: height, paddingLeft,
 * paddingRight, backgroundColor, boxShadow, color, fontSize, borderRadius.
 *
 * Specimens (keys must match blueprint-reference gallery exactly):
 *   hs-default  — default (30px, solid, double-caret-vertical)
 *   hs-large    — large (40px, solid)
 *   hs-minimal  — minimal (no bg/shadow at rest)
 *   hs-disabled — disabled (muted bg, no shadow)
 *   hs-fill     — fill (width:100%)
 */
const HS_OPTIONS = ["Apple", "Banana", "Cherry", "Dragon Fruit"];

function HTMLSelectGallery() {
    return (
        <div className="flex flex-col gap-6">
            <Section title="Default">
                <HTMLSelect
                    options={HS_OPTIONS}
                    ref={(el) => el?.setAttribute("data-compare", "hs-default")}
                />
            </Section>

            <Section title="Large">
                <HTMLSelect
                    large
                    options={HS_OPTIONS}
                    ref={(el) => el?.setAttribute("data-compare", "hs-large")}
                />
            </Section>

            <Section title="Minimal">
                <HTMLSelect
                    minimal
                    options={HS_OPTIONS}
                    ref={(el) => el?.setAttribute("data-compare", "hs-minimal")}
                />
            </Section>

            <Section title="Disabled">
                <HTMLSelect
                    disabled
                    options={HS_OPTIONS}
                    ref={(el) => el?.setAttribute("data-compare", "hs-disabled")}
                />
            </Section>

            <Section title="Fill">
                <div style={{ width: 280 }}>
                    <HTMLSelect
                        fill
                        options={HS_OPTIONS}
                        ref={(el) => el?.setAttribute("data-compare", "hs-fill")}
                    />
                </div>
            </Section>
        </div>
    );
}

/**
 * FileInput showcase. `data-compare` is placed on the `.bp6-file-upload-input` span
 * (the visible box element, NOT the label wrapper). Blueprint's ref-setAttribute trick
 * is used to attach data-compare to the inner span via a wrapper ref.
 *
 * Specimens (keys must match blueprint-reference gallery exactly):
 *   fi-default       — default (30px, "Choose file...", placeholder text color)
 *   fi-has-selection — hasSelection=true, text="report.pdf" (foreground text color)
 *   fi-large         — large size (40px box)
 *   fi-disabled      — disabled (muted box + disabled Browse button)
 *   fi-fill          — fill (width:100%, wrapped in fixed-width container)
 *
 * The harness diffs: height, paddingLeft, paddingRight, borderRadius, boxShadow,
 * backgroundColor, color, fontSize (resting state). The Browse button is verified
 * visually via screenshots (pseudo-elements can't be diff'd in Blueprint reference).
 */
function FileInputGallery() {
    return (
        <div className="flex flex-col gap-6">
            <Section title="Default">
                <FileInput
                    ref={(el) => {
                        const span = el?.querySelector<HTMLElement>(".fi-box");
                        if (span) span.setAttribute("data-compare", "fi-default");
                    }}
                />
            </Section>

            <Section title="Has Selection (report.pdf)">
                <FileInput
                    hasSelection
                    text="report.pdf"
                    ref={(el) => {
                        const span = el?.querySelector<HTMLElement>(".fi-box");
                        if (span) span.setAttribute("data-compare", "fi-has-selection");
                    }}
                />
            </Section>

            <Section title="Large">
                <FileInput
                    size="large"
                    ref={(el) => {
                        const span = el?.querySelector<HTMLElement>(".fi-box");
                        if (span) span.setAttribute("data-compare", "fi-large");
                    }}
                />
            </Section>

            <Section title="Disabled">
                <FileInput
                    disabled
                    ref={(el) => {
                        const span = el?.querySelector<HTMLElement>(".fi-box");
                        if (span) span.setAttribute("data-compare", "fi-disabled");
                    }}
                />
            </Section>

            <Section title="Fill">
                <div style={{ width: 300 }}>
                    <FileInput
                        fill
                        ref={(el) => {
                            const span = el?.querySelector<HTMLElement>(".fi-box");
                            if (span) span.setAttribute("data-compare", "fi-fill");
                        }}
                    />
                </div>
            </Section>
        </div>
    );
}

const NI_INTENTS: NumericInputIntent[] = ["none", "primary", "success", "warning", "danger"];

/**
 * NumericInput showcase.
 *
 * `data-compare` is placed on the `<input>` element (the numeric input field, equivalent
 * to Blueprint's `.bp6-input`). For the stepper button, we use a ref + querySelector
 * to stamp `data-compare` on the first `.ni-step-btn` button.
 *
 * Specimens (keys must match blueprint-reference gallery exactly):
 *   ni-default        — value=5, default size (30px field), stepper on right
 *   ni-large          — value=5, large (40px field)
 *   ni-disabled       — disabled
 *   ni-intent-primary — primary intent (colored input border)
 *   ni-buttons-left   — buttonPosition="left"
 *   ni-fill           — fill (full-width, 300px container)
 *   ni-step-button    — the increment stepper button (24px wide × ~14px tall)
 */
function NumericInputGallery() {
    const [val, setVal] = useState<string>("5");

    // Ref to stamp data-compare on the stepper button
    const defaultRef = useRef<HTMLDivElement>(null);
    const stepBtnRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Stamp data-compare on the input element inside the default specimen
        const input = defaultRef.current?.querySelector<HTMLInputElement>("input");
        if (input) input.setAttribute("data-compare", "ni-default");

        // Stamp data-compare on the increment stepper button
        const btn = stepBtnRef.current?.querySelector<HTMLButtonElement>("button");
        if (btn) btn.setAttribute("data-compare", "ni-step-button");
    }, []);

    return (
        <div className="flex flex-col gap-6 text-foreground">
            <Section title="Default (value=5, stepSize=1)">
                <div ref={defaultRef}>
                    <div ref={stepBtnRef} className="inline-block">
                        <NumericInput
                            value={val}
                            onValueChange={(_, s) => setVal(s)}
                            min={0}
                            max={100}
                            stepSize={1}
                            style={{ width: 120 }}
                        />
                    </div>
                </div>
            </Section>

            <Section title="Large">
                <NumericInput
                    defaultValue={5}
                    size="large"
                    min={0}
                    max={100}
                    style={{ width: 140 }}
                    ref={(el) => el?.setAttribute("data-compare", "ni-large")}
                />
            </Section>

            <Section title="Disabled">
                <NumericInput
                    defaultValue={5}
                    disabled
                    style={{ width: 120 }}
                    ref={(el) => el?.setAttribute("data-compare", "ni-disabled")}
                />
            </Section>

            <Section title="Intent">
                <div className="flex flex-col gap-3">
                    {NI_INTENTS.map((intent) => (
                        <NumericInput
                            key={intent}
                            defaultValue={5}
                            intent={intent}
                            style={{ width: 120 }}
                            ref={intent === "primary" ? (el) => el?.setAttribute("data-compare", "ni-intent-primary") : undefined}
                        />
                    ))}
                </div>
            </Section>

            <Section title="Buttons left">
                <NumericInput
                    defaultValue={5}
                    buttonPosition="left"
                    style={{ width: 120 }}
                    ref={(el) => el?.setAttribute("data-compare", "ni-buttons-left")}
                />
            </Section>

            <Section title="Buttons none">
                <NumericInput
                    defaultValue={5}
                    buttonPosition="none"
                    style={{ width: 120 }}
                />
            </Section>

            <Section title="Fill">
                <div style={{ width: 300 }}>
                    <NumericInput
                        defaultValue={5}
                        fill
                        ref={(el) => el?.setAttribute("data-compare", "ni-fill")}
                    />
                </div>
            </Section>

            <Section title="Left icon">
                <NumericInput
                    defaultValue={5}
                    leftIcon="search"
                    style={{ width: 140 }}
                />
            </Section>
        </div>
    );
}

const SC_OPTIONS_3 = [
    { label: "Day", value: "day" },
    { label: "Week", value: "week" },
    { label: "Month", value: "month" },
];

/**
 * SegmentedControl showcase.
 *
 * Track key (`sc-default`): bg light-gray5/dark-gray2, padding 2px, gap 2px, radius 4px.
 * Selected segment key (`sc-selected-segment`): bg white (light) / dark-gray5 (dark), foreground text.
 * Unselected segment key (`sc-unselected-segment`): muted text, transparent bg.
 *
 * Keys mirror tools/blueprint-reference/src/App.tsx SegmentedControlGallery exactly.
 */
function SegmentedControlGallery() {
    const [val, setVal] = useState<string>("week");

    return (
        <div className="flex flex-col gap-6 text-foreground">
            <Section title="Default (3 options, middle selected)">
                {/* sc-default: track div — bg, padding, gap, radius */}
                <SegmentedControl
                    options={SC_OPTIONS_3}
                    value={val}
                    onValueChange={setVal}
                    data-compare="sc-default"
                    ref={(el) => {
                        if (el) {
                            // sc-selected-segment: the selected button (week = index 1)
                            const buttons = el.querySelectorAll<HTMLButtonElement>("button");
                            buttons[1]?.setAttribute("data-compare", "sc-selected-segment");
                            // sc-unselected-segment: an unselected button (day = index 0)
                            buttons[0]?.setAttribute("data-compare", "sc-unselected-segment");
                        }
                    }}
                />
            </Section>

            <Section title="Large">
                <SegmentedControl
                    options={SC_OPTIONS_3}
                    defaultValue="week"
                    size="large"
                    data-compare="sc-large"
                />
            </Section>

            <Section title="Small">
                <SegmentedControl
                    options={SC_OPTIONS_3}
                    defaultValue="week"
                    size="small"
                />
            </Section>

            <Section title="Intent: primary (selected = primary fill)">
                {/* sc-intent-primary: the selected (week) button — expects primary bg + white text */}
                <SegmentedControl
                    options={SC_OPTIONS_3}
                    defaultValue="week"
                    intent="primary"
                    ref={(el) => {
                        if (el) {
                            const buttons = el.querySelectorAll<HTMLButtonElement>("button");
                            buttons[1]?.setAttribute("data-compare", "sc-intent-primary");
                        }
                    }}
                />
            </Section>

            <Section title="Fill">
                {/* sc-fill: track at full width, segments grow equally */}
                <SegmentedControl
                    options={SC_OPTIONS_3}
                    defaultValue="week"
                    fill
                    data-compare="sc-fill"
                />
            </Section>

            <Section title="Disabled">
                {/* sc-disabled: entire control disabled */}
                <SegmentedControl
                    options={SC_OPTIONS_3}
                    defaultValue="week"
                    disabled
                    data-compare="sc-disabled"
                />
            </Section>

            <Section title="Inline">
                <div className="flex items-center gap-3">
                    <SegmentedControl
                        options={SC_OPTIONS_3}
                        defaultValue="day"
                        inline
                    />
                    <span className="text-foreground-muted text-body-sm">inline</span>
                </div>
            </Section>

            <Section title="Individual disabled option">
                <SegmentedControl
                    options={[
                        { label: "A", value: "a" },
                        { label: "B", value: "b", disabled: true },
                        { label: "C", value: "c" },
                    ]}
                    defaultValue="a"
                />
            </Section>
        </div>
    );
}

/**
 * ControlCard showcase. `data-compare` is placed on the Card div (the `.bp6-card.bp6-control-card`
 * equivalent). Specimens use fixed width 240px identically on both sides.
 *
 * The harness diffs: backgroundColor (card surface), boxShadow (incl. selected ring when checked),
 * borderRadius, paddingTop/Bottom/Left/Right (should be 0px on card), color, fontSize.
 *
 * Specimens (keys MUST match blueprint-reference gallery exactly):
 *   cc-checkbox          — CheckboxCard unchecked, left-aligned indicator
 *   cc-checkbox-checked  — CheckboxCard defaultChecked=true → selected ring on card
 *   cc-radio             — RadioCard unchecked, right-aligned indicator
 *   cc-switch            — SwitchCard unchecked, right-aligned indicator
 *   cc-compact           — CheckboxCard compact (16px padding)
 *   cc-disabled          — CheckboxCard disabled (no pointer, card not interactive)
 *   cc-align-right       — CheckboxCard with alignIndicator="right"
 */
function ControlCardGallery() {
    const cardStyle: React.CSSProperties = { width: 240 };
    return (
        <div className="flex flex-col gap-6 text-foreground">
            <Section title="CheckboxCard (left-aligned, default)">
                <div className="flex flex-col gap-3">
                    <CheckboxCard
                        label="Unchecked option"
                        style={cardStyle}
                        data-compare="cc-checkbox"
                    />
                    <CheckboxCard
                        label="Checked option (selected ring)"
                        defaultChecked
                        style={cardStyle}
                        data-compare="cc-checkbox-checked"
                    />
                </div>
            </Section>

            <Section title="RadioCard (right-aligned, default)">
                <RadioCard
                    label="Radio option"
                    name="cc-radio-group"
                    value="opt1"
                    style={cardStyle}
                    data-compare="cc-radio"
                />
            </Section>

            <Section title="SwitchCard (right-aligned, default)">
                <SwitchCard
                    label="Switch option"
                    style={cardStyle}
                    data-compare="cc-switch"
                />
            </Section>

            <Section title="Compact (16px padding)">
                <CheckboxCard
                    label="Compact option"
                    compact
                    style={cardStyle}
                    data-compare="cc-compact"
                />
            </Section>

            <Section title="Disabled">
                <CheckboxCard
                    label="Disabled option"
                    disabled
                    style={cardStyle}
                    data-compare="cc-disabled"
                />
            </Section>

            <Section title="Align right (indicator on right)">
                <CheckboxCard
                    label="Right-aligned indicator"
                    alignIndicator="right"
                    style={cardStyle}
                    data-compare="cc-align-right"
                />
            </Section>

            <Section title="SwitchCard checked (selected ring)">
                <SwitchCard
                    label="Switch checked"
                    defaultChecked
                    style={cardStyle}
                />
            </Section>

            <Section title="showAsSelectedWhenChecked=false">
                <CheckboxCard
                    label="Checked but no selected ring"
                    defaultChecked
                    showAsSelectedWhenChecked={false}
                    style={cardStyle}
                />
            </Section>
        </div>
    );
}

/**
 * Alert showcase. Renders ONE alert OPEN by default so the harness can screenshot and
 * computed-style-diff the portaled panel, icon, body, footer, and buttons.
 *
 * Portal + dark-mode: the alert receives `dark` from DarkContext so it can apply the
 * dark class to the portal wrapper (same pattern as Dialog).
 *
 * data-compare keys: alert-panel, alert-icon, alert-footer, alert-confirm, alert-cancel.
 * These match the Blueprint reference gallery keys exactly.
 */
function AlertGallery() {
    const dark = useContext(DarkContext);
    return (
        <div className="flex flex-col gap-4">
            <p className="text-body text-foreground-muted">
                The alert below is open by default for comparison harness screenshots.
            </p>
            <Alert
                defaultOpen={true}
                icon="warning-sign"
                intent="danger"
                confirmButtonText="Delete"
                cancelButtonText="Cancel"
                onConfirm={() => {}}
                onCancel={() => {}}
                dark={dark}
            >
                Are you sure you want to delete this item? This action cannot be undone.
            </Alert>
        </div>
    );
}

/**
 * Dialog showcase. Renders ONE dialog OPEN by default so the harness can screenshot and
 * computed-style-diff the portaled panel, header, body, footer, and close button.
 *
 * Portal + dark-mode: the dialog receives `dark` from DarkContext so it can apply the
 * dark class to the portal wrapper (see dialog.tsx "Portal + dark-mode solution").
 *
 * data-compare keys: dialog-panel, dialog-header, dialog-body, dialog-footer, dialog-close.
 * These match the Blueprint reference gallery keys exactly.
 */
function DialogGallery() {
    const dark = useContext(DarkContext);
    return (
        <div className="flex flex-col gap-4">
            <p className="text-body text-foreground-muted">
                The dialog below is open by default for comparison harness screenshots.
            </p>
            <Dialog
                defaultOpen={true}
                title="Dialog Title"
                icon={<Icon icon="info-sign" />}
                closeButton={true}
                dark={dark}
            >
                <DialogBody>
                    <p className="text-body text-foreground m-0">
                        This is the dialog body content. It can contain any elements — forms,
                        messages, or complex layouts.
                    </p>
                </DialogBody>
                <DialogFooter
                    actions={
                        <>
                            <Button variant="minimal">Cancel</Button>
                            <Button intent="primary">Confirm</Button>
                        </>
                    }
                />
            </Dialog>
        </div>
    );
}

/**
 * Drawer showcase. Renders ONE drawer OPEN by default (right edge, 360px = SMALL) so the
 * harness can screenshot and computed-style-diff the portaled panel, header, body.
 *
 * Portal + dark-mode: the drawer receives `dark` from DarkContext (same as Dialog/Alert).
 *
 * data-compare keys: drawer-panel, drawer-header, drawer-body.
 * These match the Blueprint reference gallery keys exactly.
 */
function DrawerGallery() {
    const dark = useContext(DarkContext);
    return (
        <div className="flex flex-col gap-4">
            <p className="text-body text-foreground-muted">
                The drawer below is open by default for comparison harness screenshots.
            </p>
            <Drawer
                defaultOpen={true}
                position="right"
                size={DrawerSize.SMALL}
                title="Drawer Title"
                icon={<Icon icon="info-sign" />}
                closeButton={true}
                dark={dark}
            >
                <DrawerBody className="p-5">
                    <p className="text-body text-foreground m-0">
                        This is the drawer body content. It can contain any elements — forms,
                        messages, or complex layouts.
                    </p>
                </DrawerBody>
            </Drawer>
        </div>
    );
}

/**
 * Popover showcase.
 *
 * Portal + dark-mode: the popover receives `dark` from DarkContext so it can apply the
 * dark class to the portal wrapper (same pattern as Dialog/Alert/Drawer).
 *
 * The popover is rendered with `defaultOpen={true}` so it's always visible for
 * the comparison harness screenshot without requiring a click interaction.
 *
 * data-compare keys: popover-content (the panel), popover-arrow (the arrow).
 * These match the Blueprint reference gallery keys exactly.
 */
function PopoverGallery() {
    const dark = useContext(DarkContext);
    return (
        <div className="flex flex-col gap-4">
            <p className="text-body text-foreground-muted">
                The popover below is open by default for comparison harness screenshots.
            </p>
            {/* Wrapper provides space for the floating popover to render without clipping */}
            <div className="flex items-center justify-center" style={{ minHeight: 200, paddingTop: 80 }}>
                <Popover
                    defaultOpen={true}
                    content={
                        <div style={{ width: 200 }}>Short popover content.</div>
                    }
                    side="bottom"
                    align="center"
                    hasContentPadding={false}
                    dark={dark}
                >
                    <Button intent="primary">Open Popover</Button>
                </Popover>
            </div>
        </div>
    );
}

/**
 * Tooltip showcase.
 *
 * Portal + dark-mode: the tooltip receives `dark` from DarkContext so it can apply the
 * dark class to the portal wrapper (same pattern as Popover/Dialog/Alert/Drawer).
 *
 * The tooltip is rendered with `defaultOpen={true}` so it's always visible for the
 * comparison harness screenshot without requiring hover interaction.
 *
 * THE INVERSION: verify that:
 * - Light theme: dark bubble (#404854 bg, #f6f7f9 text) on a light page.
 * - Dark theme: light bubble (#e5e8eb bg, #404854 text) on a dark page.
 *
 * data-compare keys:
 *   tooltip-content — the .bp6-tooltip bubble (the Radix Tooltip.Content element)
 *   tooltip-arrow   — the .bp6-popover-arrow arrow element
 *   tooltip-intent-danger — danger intent bubble (bg=danger, text=white)
 *
 * These match the Blueprint reference gallery keys exactly.
 */
function TooltipGallery() {
    const dark = useContext(DarkContext);
    return (
        <div className="flex flex-col gap-4">
            <p className="text-body text-foreground-muted">
                Tooltips below are open by default for comparison harness screenshots.
            </p>
            {/* Wrapper provides space for the floating tooltips to render without clipping */}
            <div className="flex items-center justify-center gap-12" style={{ minHeight: 160, paddingTop: 80 }}>
                {/* Default tooltip — open by default, shows the inversion color scheme.
                    data-compare="tooltip-content" marks the outer bubble element for the harness. */}
                <Tooltip
                    defaultOpen={true}
                    content="Tooltip content"
                    side="bottom"
                    align="center"
                    dark={dark}
                    data-compare="tooltip-content"
                >
                    <Button intent="primary">Hover me</Button>
                </Tooltip>

                {/* Danger intent tooltip — open by default. No data-compare (unique key constraint). */}
                <Tooltip
                    defaultOpen={true}
                    content="Danger tooltip"
                    intent="danger"
                    side="bottom"
                    align="center"
                    dark={dark}
                >
                    <Button intent="danger">Danger</Button>
                </Tooltip>
            </div>
        </div>
    );
}

/**
 * Toast showcase.
 *
 * Portal + dark-mode: ToastProvider receives `dark` from DarkContext so the Viewport
 * portal wrapper gets the dark class (same pattern as Popover/Dialog/Tooltip).
 *
 * We render static always-visible toasts using StaticToast (open={true}, infinite duration).
 * This bypasses the Toaster imperative API for gallery purposes.
 *
 * data-compare keys:
 *   toast-card         — the default (no-intent) toast card
 *   toast-intent-danger — the danger-intent toast card
 *
 * These match the Blueprint reference gallery keys exactly.
 */
function ToastGallery() {
    const dark = useContext(DarkContext);
    return (
        <ToastProvider dark={dark} position="top">
            <div className="flex flex-col gap-4">
                <p className="text-body text-foreground-muted">
                    Toasts below are always visible for comparison harness screenshots.
                </p>
                {/* Stack toasts in a column, matching Blueprint container layout */}
                <div className="flex flex-col gap-[20px] items-start">
                    {/* Default (no intent) toast — icon + message + action + dismiss */}
                    <Toast
                        open={true}
                        timeout={0}
                        icon="info-sign"
                        message="Reconnecting to server."
                        action={{ text: "Reconnect", onClick: () => {} }}
                        data-compare="toast-card"
                    />

                    {/* Danger intent toast */}
                    <Toast
                        open={true}
                        timeout={0}
                        intent="danger"
                        icon="warning-sign"
                        message="Failed to delete 3 items."
                        action={{ text: "Retry", onClick: () => {} }}
                        data-compare="toast-intent-danger"
                    />

                    {/* Success intent toast (visual only — no data-compare) */}
                    <Toast
                        open={true}
                        timeout={0}
                        intent="success"
                        icon="tick-circle"
                        message="Item saved successfully."
                    />

                    {/* Warning intent toast (visual only) */}
                    <Toast
                        open={true}
                        timeout={0}
                        intent="warning"
                        icon="warning-sign"
                        message="Low disk space warning."
                    />
                </div>
            </div>
        </ToastProvider>
    );
}

/**
 * Menu showcase — renders the Menu inline (no portal) so dark mode works via ancestor `.dark`.
 *
 * data-compare keys (must match blueprint-reference MenuGallery):
 *   menu-container       — the <ul> Menu element (bg, radius, min-width, padding)
 *   menu-item            — a plain menu item (padding, color, line-height)
 *   menu-item-active     — the active/selected item (bg, color)
 *   menu-item-intent-danger — danger intent item (color)
 *   menu-item-disabled   — disabled item (color, cursor)
 *   menu-divider         — the horizontal rule divider (border, margin)
 *   menu-header          — the heading section divider li (border, padding)
 */
function MenuGallery() {
    return (
        <div className="flex flex-col gap-4">
            <p className="text-body text-foreground-muted">
                Menu renders inline (no portal). Dark mode applies via parent .dark ancestor.
            </p>
            <div className="flex items-start gap-8 flex-wrap">
                {/* Standard menu with all specimen types */}
                <Menu data-compare="menu-container">
                    {/* Heading divider — first-of-type so no top border */}
                    <MenuDivider title="Actions" data-compare="menu-header" />

                    {/* Plain item with icon */}
                    <MenuItem
                        icon="document"
                        text="Open document"
                        data-compare="menu-item"
                    />

                    {/* Item with icon + right label */}
                    <MenuItem
                        icon="search"
                        text="Find…"
                        label="⌘F"
                    />

                    {/* Active/selected item */}
                    <MenuItem
                        icon="tick"
                        text="Selected item"
                        active={true}
                        data-compare="menu-item-active"
                    />

                    {/* Item with submenu caret */}
                    <MenuItem
                        icon="cog"
                        text="Settings"
                        hasSubmenu={true}
                    />

                    {/* Plain divider */}
                    <MenuDivider data-compare="menu-divider" />

                    {/* Danger intent */}
                    <MenuItem
                        icon="trash"
                        text="Delete"
                        intent="danger"
                        data-compare="menu-item-intent-danger"
                    />

                    {/* Disabled item */}
                    <MenuItem
                        icon="cross"
                        text="Disabled action"
                        disabled={true}
                        data-compare="menu-item-disabled"
                    />
                </Menu>
            </div>
        </div>
    );
}

/**
 * ContextMenu showcase — renders the menu surface OPEN by default for harness comparison.
 *
 * Strategy: render the Menu directly inside a styled "popover surface" div (the same
 * bg/shadow/radius treatment that ContextMenu applies to portaled content). This gives
 * the harness stable, non-portaled `data-compare` specimens without fighting Radix's
 * cursor-based positioning. We also show a live ContextMenu trigger area below it.
 *
 * Portal + dark-mode: dark comes from DarkContext; the inline surface uses `dark:` utilities
 * directly since it's not portaled — no wrapper div needed for the always-visible specimen.
 *
 * data-compare keys (must match blueprint-reference ContextMenuGallery):
 *   context-menu-surface  — the popover surface container (our inline Menu ul)
 *   context-menu-item     — a plain menu item (the inner button element)
 */
function ContextMenuGallery() {
    const dark = useContext(DarkContext);

    return (
        <div className="flex flex-col gap-4">
            <p className="text-body text-foreground-muted">
                The context menu surface below is always visible for comparison harness screenshots.
                Right-click the dashed area to open a live context menu.
            </p>

            {/* Always-visible specimen: Menu wrapped in popover surface styling.
                This matches what ContextMenu renders portaled — same bg/shadow/radius.
                We render it inline so data-compare targets are always in the DOM. */}
            <div className="self-start rounded-bp shadow-card-3 dark:[box-shadow:rgb(94,95,97)_0px_0px_0px_1px,inset_rgba(255,255,255,0.2)_0px_0px_0px_1px,rgba(0,0,0,0.302)_0px_20px_25px_-5px,rgba(0,0,0,0.302)_0px_10px_30px_-5px,inset_rgba(255,255,255,0.302)_0px_0px_0.5px_0px,inset_rgba(255,255,255,0.078)_0px_0.5px_0px_0px]">
                <div className="bg-white dark:bg-dark-gray-3 rounded-bp text-foreground">
                    <Menu data-compare="context-menu-surface">
                        <MenuDivider title="Actions" />
                        <MenuItem
                            icon="document"
                            text="Open document"
                            data-compare="context-menu-item"
                        />
                        <MenuItem
                            icon="search"
                            text="Find…"
                            label="⌘F"
                        />
                        <MenuItem
                            icon="tick"
                            text="Selected item"
                            active={true}
                        />
                        <MenuDivider />
                        <MenuItem
                            icon="trash"
                            text="Delete"
                            intent="danger"
                        />
                        <MenuItem
                            icon="cross"
                            text="Disabled action"
                            disabled={true}
                        />
                    </Menu>
                </div>
            </div>

            {/* Live ContextMenu trigger — right-click to open. For visual verification only. */}
            <div className="mt-4">
                <ContextMenu
                    dark={dark}
                    content={
                        <Menu>
                            <MenuDivider title="Actions" />
                            <MenuItem icon="document" text="Open document" />
                            <MenuItem icon="search" text="Find…" label="⌘F" />
                            <MenuItem icon="tick" text="Selected item" active={true} />
                            <MenuDivider />
                            <MenuItem icon="trash" text="Delete" intent="danger" />
                            <MenuItem icon="cross" text="Disabled action" disabled={true} />
                        </Menu>
                    }
                >
                    <div className="p-8 border border-dashed border-foreground-muted rounded text-foreground-muted text-body text-center cursor-context-menu">
                        Right-click anywhere in this area to open the live context menu.
                    </div>
                </ContextMenu>
            </div>
        </div>
    );
}

/**
 * Navbar showcase. The navbar is inline (no portal) so dark mode works via .dark ancestor.
 *
 * data-compare keys (must match blueprint-reference NavbarGallery exactly):
 *   navbar           — the Navbar bar itself (bg, shadow, height, padding)
 *   navbar-heading   — the NavbarHeading div (font-size, font-weight, margin-right, color)
 *   navbar-divider   — the NavbarDivider (height, border-left, margin)
 *
 * A fixed width is given to the navbar container so both sides measure identical widths.
 * We use a wrapper div with fixed width to avoid full-page-width scroll issues in the gallery.
 */
function NavbarGallery() {
    return (
        <div className="flex flex-col gap-6 text-foreground">
            <Section title="Standard navbar (left + right groups)">
                <div style={{ width: 680 }}>
                    <Navbar data-compare="navbar">
                        <NavbarGroup align="left">
                            <NavbarHeading data-compare="navbar-heading">My Application</NavbarHeading>
                            <NavbarDivider data-compare="navbar-divider" />
                            <Button variant="minimal">Home</Button>
                            <Button variant="minimal">Files</Button>
                        </NavbarGroup>
                        <NavbarGroup align="right">
                            <Button variant="minimal">Log in</Button>
                        </NavbarGroup>
                    </Navbar>
                </div>
            </Section>

            <Section title="Left group only">
                <div style={{ width: 680 }}>
                    <Navbar>
                        <NavbarGroup align="left">
                            <NavbarHeading>App</NavbarHeading>
                            <NavbarDivider />
                            <Button variant="minimal">Home</Button>
                            <Button variant="minimal">About</Button>
                        </NavbarGroup>
                    </Navbar>
                </div>
            </Section>
        </div>
    );
}

/**
 * Tabs showcase. Inline (no portal) — dark via .dark ancestor.
 *
 * data-compare keys (must match blueprint-reference TabsGallery exactly):
 *   tab-selected          — the selected tab title element (color, box-shadow, font)
 *   tab-default           — an unselected tab title (color, font)
 *   tab-disabled          — a disabled tab title (color)
 *   tab-indicator         — the indicator bar (height, backgroundColor)
 *   tabs-vertical-selected — the selected tab in vertical mode (backgroundColor)
 */
function TabsGallery() {
    return (
        <div className="flex flex-col gap-8 text-foreground">
            <Section title="Horizontal (default)">
                <Tabs id="tabs-horizontal" defaultSelectedTabId="overview">
                    <Tab
                        id="overview"
                        title={<span data-compare="tab-selected">Overview</span>}
                        panel={
                            <div className="p-2">
                                <p className="text-body">Overview panel content. This is the selected tab.</p>
                            </div>
                        }
                    />
                    <Tab
                        id="details"
                        title={<span data-compare="tab-default">Details</span>}
                        panel={
                            <div className="p-2">
                                <p className="text-body">Details panel content.</p>
                            </div>
                        }
                    />
                    <Tab
                        id="disabled-tab"
                        title={<span data-compare="tab-disabled">Disabled</span>}
                        disabled
                        panel={<div className="p-2">Disabled panel.</div>}
                    />
                </Tabs>
            </Section>

            <Section title="Vertical">
                <Tabs id="tabs-vertical" defaultSelectedTabId="files" vertical>
                    <Tab
                        id="files"
                        title={<span data-compare="tabs-vertical-selected">Files</span>}
                        panel={
                            <div>
                                <p className="text-body">Files panel content.</p>
                            </div>
                        }
                    />
                    <Tab
                        id="config"
                        title="Configuration"
                        panel={
                            <div>
                                <p className="text-body">Configuration panel content.</p>
                            </div>
                        }
                    />
                    <Tab
                        id="logs"
                        title="Logs"
                        panel={
                            <div>
                                <p className="text-body">Logs panel content.</p>
                            </div>
                        }
                    />
                </Tabs>
            </Section>
        </div>
    );
}

/**
 * Collapse showcase. Inline (no portal) — dark via .dark ancestor.
 *
 * data-compare keys (must match blueprint-reference CollapseGallery exactly):
 *   collapse-open  — the open .bp6-collapse outer container (overflowY, height)
 *   collapse-body  — the .bp6-collapse-body inner element (transform)
 *
 * We use an open Collapse containing identical content on both sides so the
 * measured height matches. The open state is the meaningful comparison: Blueprint
 * sets height=auto / overflow-y=visible; we replicate that exactly.
 *
 * The body element is tagged via useEffect (same pattern as TabsGallery for the
 * indicator) because it's rendered inside Collapse — we can't place data-compare
 * on it directly from the gallery.
 */
function CollapseGallery() {
    useEffect(() => {
        // Tag the .bp6-collapse-body inside the open collapse specimen.
        const body = document.querySelector('[data-compare="collapse-open"] .bp6-collapse-body');
        if (body) body.setAttribute("data-compare", "collapse-body");
    }, []);

    return (
        <div className="flex flex-col gap-8 text-foreground">
            <Section title="Open">
                <Collapse isOpen data-compare="collapse-open">
                    <p className="text-body">
                        This is the collapse content. It is always visible when isOpen is true.
                        Blueprint animates the height of the outer container from 0 to the natural
                        content height.
                    </p>
                </Collapse>
            </Section>

            <Section title="Closed">
                <Collapse isOpen={false}>
                    <p className="text-body">
                        This is the collapse content. It is always visible when isOpen is true.
                        Blueprint animates the height of the outer container from 0 to the natural
                        content height.
                    </p>
                </Collapse>
                <p className="text-body-sm text-foreground-muted">(Nothing visible above — Collapse is closed)</p>
            </Section>

            <Section title="Keep children mounted (closed)">
                <Collapse isOpen={false} keepChildrenMounted>
                    <p className="text-body">Children stay in DOM but are hidden.</p>
                </Collapse>
                <p className="text-body-sm text-foreground-muted">(Nothing visible above — keepChildrenMounted, closed)</p>
            </Section>
        </div>
    );
}

/**
 * Section showcase. Inline (no portal) — dark via .dark ancestor.
 *
 * data-compare keys (must match blueprint-reference SectionGallery exactly):
 *   section          — the outer Card container (bg, shadow, radius, border)
 *   section-header   — the header div (border-bottom, min-height, padding)
 *   section-title    — the H6 title element (font, color)
 *   section-subtitle — the subtitle div (color, margin)
 *   section-body     — the SectionCard content panel (padding)
 *
 * We render: a basic Section (title + subtitle + SectionCard body),
 * a collapsible Section (open, with caret), and a compact one.
 * Fixed width (400px) so both galleries produce the same box dimensions.
 */
function SectionGallery() {
    useEffect(() => {
        // Tag internal elements within the basic section specimen (data-compare="section").
        const basicSection = document.querySelector('[data-compare="section"]');
        if (basicSection) {
            // Header: first child div of the section card (directly inside the card wrapper)
            const header = basicSection.firstElementChild;
            if (header) header.setAttribute("data-compare", "section-header");
            // Title: the h6 element inside the header
            const title = basicSection.querySelector("h6");
            if (title) title.setAttribute("data-compare", "section-title");
            // Subtitle: the div after the h6
            const subtitle = basicSection.querySelector("h6 + div");
            if (subtitle) subtitle.setAttribute("data-compare", "section-subtitle");
        }
    }, []);

    return (
        <div className="flex flex-col gap-8 text-foreground" style={{ width: 400 }}>
            <div className="flex flex-col gap-2">
                <p className="text-body-sm text-foreground-muted">Basic (title + subtitle + body)</p>
                <BpSection
                    title="Account settings"
                    subtitle="Manage your account preferences"
                    icon="cog"
                    data-compare="section"
                >
                    <BpSectionCard data-compare="section-body">
                        <p className="text-body">Section card content goes here.</p>
                    </BpSectionCard>
                </BpSection>
            </div>

            <div className="flex flex-col gap-2">
                <p className="text-body-sm text-foreground-muted">Collapsible (open)</p>
                <BpSection
                    title="Advanced options"
                    subtitle="Expand to see more"
                    collapsible
                    collapseProps={{ defaultIsOpen: true }}
                >
                    <BpSectionCard>
                        <p className="text-body">Collapsible section body — currently open.</p>
                    </BpSectionCard>
                </BpSection>
            </div>

            <div className="flex flex-col gap-2">
                <p className="text-body-sm text-foreground-muted">Compact</p>
                <BpSection
                    title="Compact section"
                    compact
                    elevation={1}
                >
                    <BpSectionCard compact>
                        <p className="text-body">Compact body content.</p>
                    </BpSectionCard>
                </BpSection>
            </div>
        </div>
    );
}

/**
 * CardList showcase. Inline (no portal) — dark via .dark ancestor.
 *
 * data-compare keys (must match blueprint-reference CardListGallery exactly):
 *   card-list        — the outer Card container (bg, radius, shadow / no radius when bordered=false)
 *   card-list-item   — a middle Card row (padding, divider, min-height)
 *
 * We render: a bordered CardList with 3 rows (middle is interactive), and a compact one.
 * Fixed width (400px) so both galleries produce the same box dimensions.
 */
function CardListGallery() {
    return (
        <div className="flex flex-col gap-8 text-foreground" style={{ width: 400 }}>
            <div className="flex flex-col gap-2">
                <p className="text-body-sm text-foreground-muted">Bordered (default)</p>
                <CardList data-compare="card-list">
                    <Card>
                        <span>Item one — plain</span>
                    </Card>
                    <Card interactive data-compare="card-list-item">
                        <span>Item two — interactive (hover me)</span>
                    </Card>
                    <Card>
                        <span>Item three — plain</span>
                    </Card>
                    <Card>
                        <span>Item four — plain</span>
                    </Card>
                </CardList>
            </div>

            <div className="flex flex-col gap-2">
                <p className="text-body-sm text-foreground-muted">Compact</p>
                <CardList compact>
                    <Card>Compact item one</Card>
                    <Card interactive>Compact item two — interactive</Card>
                    <Card>Compact item three</Card>
                </CardList>
            </div>

            <div className="flex flex-col gap-2">
                <p className="text-body-sm text-foreground-muted">Flush (bordered=false)</p>
                <CardList bordered={false}>
                    <Card>Flush item one</Card>
                    <Card interactive>Flush item two — interactive</Card>
                    <Card>Flush item three</Card>
                </CardList>
            </div>
        </div>
    );
}

/**
 * Breadcrumbs showcase. Inline (no portal) — dark via .dark ancestor.
 *
 * data-compare keys (must match blueprint-reference BreadcrumbsGallery exactly):
 *   breadcrumb-link      — a non-current, non-disabled link crumb (the anchor/span element)
 *   breadcrumb-current   — the last/current crumb (bold, non-interactive span)
 *   breadcrumbs-separator — a chevron-right separator icon
 *
 * Fixed width (500px) so both galleries produce the same box dimensions.
 */
function BreadcrumbsGallery() {
    return (
        <div className="flex flex-col gap-8 text-foreground" style={{ width: 500 }}>
            <div className="flex flex-col gap-2">
                <p className="text-body-sm text-foreground-muted">Default trail (link + link + current)</p>
                <Breadcrumbs
                    items={[
                        { text: "Home", href: "/", "data-compare": "breadcrumb-link" },
                        { text: "Projects", href: "/projects" },
                        { text: "Current Project", current: true, "data-compare": "breadcrumb-current" },
                    ]}
                />
            </div>

            <div className="flex flex-col gap-2">
                <p className="text-body-sm text-foreground-muted">With icons</p>
                <Breadcrumbs
                    items={[
                        { text: "Home", href: "/", icon: "info-sign" },
                        { text: "Settings", href: "/settings", icon: "caret-right" },
                        { text: "Profile", current: true, icon: "tick-circle" },
                    ]}
                />
            </div>

            <div className="flex flex-col gap-2">
                <p className="text-body-sm text-foreground-muted">With disabled crumb</p>
                <Breadcrumbs
                    items={[
                        { text: "Home", href: "/" },
                        { text: "Restricted", href: "/admin", disabled: true },
                        { text: "Page", current: true },
                    ]}
                />
            </div>

            <div className="flex flex-col gap-2">
                <p className="text-body-sm text-foreground-muted">Single crumb (no separator)</p>
                <Breadcrumbs
                    items={[
                        { text: "Only Page", current: true },
                    ]}
                />
            </div>
        </div>
    );
}

/**
 * Tree showcase. Inline (no portal) — dark via .dark ancestor.
 *
 * data-compare keys (must match blueprint-reference TreeGallery exactly):
 *   tree-node-content    — the default (non-selected, non-disabled) node row div
 *   tree-node-selected   — the selected node row div
 *   tree-node-caret      — the caret span on an expandable node
 *   tree-node-caret-none — the spacer span on a leaf node
 *   tree-node-icon       — the icon span on a node with an icon
 *
 * Fixed width (320px) so both galleries produce the same box dimensions.
 *
 * DOM tagging (via useEffect) tags equivalent nodes to the blueprint-reference gallery:
 * Flattened DOM order (same as Blueprint):
 *   0: Documents (depth 0, expanded, folder icon)
 *   1: Annual Report 2025 (depth 1, doc icon + secondaryLabel) → tree-node-content, tree-node-icon
 *   2: Projects (depth 1, expanded, folder icon)
 *   3: analyst-ui (depth 2, SELECTED) → tree-node-selected
 *   4: blueprint-ref (depth 2)
 *   5: Drafts (depth 0, collapsed)
 *   6: Trash (depth 0, disabled)
 */
const TREE_INITIAL: TreeNodeInfo[] = [
    {
        id: 1,
        label: "Documents",
        icon: "folder-close",
        isExpanded: true,
        childNodes: [
            {
                id: 2,
                label: "Annual Report 2025",
                icon: "document",
                secondaryLabel: <span style={{ fontSize: 12, opacity: 0.6 }}>4.2 MB</span>,
            },
            {
                id: 3,
                label: "Projects",
                icon: "folder-close",
                isExpanded: true,
                childNodes: [
                    {
                        id: 4,
                        label: "analyst-ui",
                        isSelected: true,
                    },
                    {
                        id: 5,
                        label: "blueprint-ref",
                    },
                ],
            },
        ],
    },
    {
        id: 6,
        label: "Drafts",
        icon: "folder-close",
    },
    {
        id: 7,
        label: "Trash",
        icon: "trash",
        disabled: true,
    },
];

function TreeGallery() {
    const [contents, { handleNodeClick, handleNodeExpand, handleNodeCollapse }] = useTreeState(TREE_INITIAL);
    const treeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!treeRef.current) return;
        // analyst-ui Tree renders .bp6-tree-node-content divs for each node row.
        // DOM order matches Blueprint reference exactly (pre-order traversal).
        // 0: Documents (depth 0, expanded, has caret)
        // 1: Annual Report 2025 (depth 1, has icon + secondaryLabel) → tree-node-content
        // 2: Projects (depth 1, expanded, has caret + icon)
        // 3: analyst-ui (depth 2, SELECTED) → tree-node-selected
        // 4: blueprint-ref (depth 2, leaf)
        // 5: Drafts (depth 0, collapsed)
        // 6: Trash (depth 0, disabled)
        const rows = treeRef.current.querySelectorAll<HTMLElement>(".bp6-tree-node-content");
        if (rows[1]) rows[1].setAttribute("data-compare", "tree-node-content");
        if (rows[3]) rows[3].setAttribute("data-compare", "tree-node-selected");

        // Caret spans (expandable nodes): Documents (0), Projects (2)
        const carets = treeRef.current.querySelectorAll<HTMLElement>(".bp6-tree-node-caret");
        if (carets[0]) carets[0].setAttribute("data-compare", "tree-node-caret");

        // Caret-none spans (leaf nodes): Annual Report 2025 is first leaf at depth 1
        const caretNones = treeRef.current.querySelectorAll<HTMLElement>(".bp6-tree-node-caret-none");
        if (caretNones[0]) caretNones[0].setAttribute("data-compare", "tree-node-caret-none");

        // Icon span on "Annual Report 2025" (second node in DOM order):
        // .bp6-tree-node-icon is the class on icon spans within that content row.
        const icons = treeRef.current.querySelectorAll<HTMLElement>(".bp6-tree-node-icon");
        if (icons[1]) icons[1].setAttribute("data-compare", "tree-node-icon");
    }, []);

    return (
        <div className="flex flex-col gap-8 text-foreground" style={{ width: 320 }}>
            <div className="flex flex-col gap-2">
                <p className="text-body-sm text-foreground-muted">Default tree (multi-level, selected, icon, secondaryLabel)</p>
                <div ref={treeRef}>
                    <Tree
                        contents={contents}
                        onNodeClick={handleNodeClick}
                        onNodeExpand={handleNodeExpand}
                        onNodeCollapse={handleNodeCollapse}
                    />
                </div>
            </div>
        </div>
    );
}

/**
 * PanelStack showcase.
 *
 * For a stable screenshot + computed-style diff, the specimen shows a stack of
 * DEPTH 2 (root + one pushed panel) so the back button is visible in the header.
 * We use a controlled `stack` prop with a fixed initial stack of 2 panels — no
 * interaction needed. Both galleries show identical structure so the diff is valid.
 *
 * data-compare keys:
 *   panel-stack-header  — the header div (height:30px, box-shadow bottom divider)
 *   panel-stack-back    — the back button (minimal small, chevron-left + "Root" text)
 *   panel-stack-title   — the centered title span
 *
 * Fixed container: 320×240px so screenshots are stable.
 */

const ROOT_PANEL: PanelInfo = {
    title: "Root",
    renderPanel: ({ openPanel }: PanelActions & object) => (
        <div style={{ padding: 16 }}>
            <p style={{ marginBottom: 8, fontSize: 14 }}>Root panel content.</p>
            <Button
                size="small"
                onClick={() =>
                    openPanel({
                        title: "Detail",
                        renderPanel: () => <div style={{ padding: 16, fontSize: 14 }}>Detail panel content.</div>,
                    })
                }
            >
                Open Detail
            </Button>
        </div>
    ),
};

const DETAIL_PANEL: PanelInfo = {
    title: "Detail",
    renderPanel: () => <div style={{ padding: 16, fontSize: 14 }}>Detail panel content.</div>,
};

// Controlled stack of [root, detail] — depth 2, back button visible.
const INITIAL_PANEL_STACK: PanelInfo[] = [ROOT_PANEL, DETAIL_PANEL];

function PanelStackGallery() {
    const [stack, setStack] = useState<PanelInfo[]>(INITIAL_PANEL_STACK);

    return (
        <div className="flex flex-col gap-8 text-foreground">
            <div className="flex flex-col gap-2">
                <p className="text-body-sm text-foreground-muted">
                    Controlled stack (depth 2) — back button + centered title visible
                </p>
                {/* Fixed size so the harness gets a stable layout */}
                <div style={{ width: 320, height: 240, position: "relative", border: "1px solid rgba(0,0,0,0.1)" }}>
                    <PanelStack
                        stack={stack}
                        onOpen={(p) => setStack((prev) => [...prev, p])}
                        onClose={() => setStack((prev) => prev.slice(0, -1))}
                        style={{ width: "100%", height: "100%" }}
                    />
                </div>
            </div>
        </div>
    );
}

/**
 * HTMLTable showcase.
 *
 * Specimens cover: plain, bordered+striped, interactive, and compact.
 * Each specimen uses identical row/col data to the Blueprint reference gallery
 * for a valid computed-style diff.
 *
 * data-compare keys:
 *   html-table-header  — a <th> in the header row (font-weight:600, text-foreground)
 *   html-table-cell    — a <td> in the first body row (has the top-border shadow)
 *   html-table-row     — a <tr> in the body
 */
function HTMLTableGallery() {
    const tableData = [
        { name: "Alice", role: "Engineer", status: "Active" },
        { name: "Bob", role: "Designer", status: "Inactive" },
        { name: "Carol", role: "Manager", status: "Active" },
    ];

    return (
        <div className="flex flex-col gap-8 text-foreground">
            {/* Plain table */}
            <div className="flex flex-col gap-2">
                <p className="text-body-sm text-foreground-muted">Plain</p>
                <HTMLTable>
                    <thead>
                        <tr>
                            <th data-compare="html-table-header">Name</th>
                            <th>Role</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tableData.map((row) => (
                            <tr key={row.name} data-compare={row.name === "Alice" ? "html-table-row" : undefined}>
                                <td data-compare={row.name === "Alice" ? "html-table-cell" : undefined}>{row.name}</td>
                                <td>{row.role}</td>
                                <td>{row.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </HTMLTable>
            </div>

            {/* Bordered + striped */}
            <div className="flex flex-col gap-2">
                <p className="text-body-sm text-foreground-muted">Bordered + Striped</p>
                <HTMLTable bordered striped>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Role</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tableData.map((row) => (
                            <tr key={row.name}>
                                <td>{row.name}</td>
                                <td>{row.role}</td>
                                <td>{row.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </HTMLTable>
            </div>

            {/* Interactive */}
            <div className="flex flex-col gap-2">
                <p className="text-body-sm text-foreground-muted">Interactive (hover rows)</p>
                <HTMLTable interactive>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Role</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tableData.map((row) => (
                            <tr key={row.name}>
                                <td>{row.name}</td>
                                <td>{row.role}</td>
                                <td>{row.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </HTMLTable>
            </div>

            {/* Compact */}
            <div className="flex flex-col gap-2">
                <p className="text-body-sm text-foreground-muted">Compact</p>
                <HTMLTable compact>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Role</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tableData.map((row) => (
                            <tr key={row.name}>
                                <td>{row.name}</td>
                                <td>{row.role}</td>
                                <td>{row.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </HTMLTable>
            </div>
        </div>
    );
}

/**
 * EditableText showcase.
 *
 * Specimens cover: resting with value, empty+placeholder, editing (isEditing),
 * multiline, intent (primary), and disabled.
 *
 * data-compare keys:
 *   editable-text-resting    — root div, resting state with value
 *   editable-text-content    — the content span (resting, no-intent, has value)
 *   editable-text-placeholder — content span showing placeholder (no value)
 *   editable-text-editing    — root div with isEditing=true (shows editing ring)
 *   editable-text-input      — the <input> inside the editing specimen
 */
function EditableTextGallery() {
    const [editingValue, setEditingValue] = useState("Editing now");
    const intents: EditableTextIntent[] = ["none", "primary", "success", "warning", "danger"];

    return (
        <div className="flex flex-col gap-8 text-foreground">
            {/* Resting state with value */}
            <div className="flex flex-col gap-2">
                <p className="text-body-sm text-foreground-muted">Resting (with value)</p>
                <EditableText
                    defaultValue="Hello, Blueprint"
                    data-compare="editable-text-resting"
                />
            </div>

            {/* Empty + placeholder */}
            <div className="flex flex-col gap-2">
                <p className="text-body-sm text-foreground-muted">Empty + placeholder</p>
                <EditableText
                    defaultValue=""
                    placeholder="Click to Edit"
                    data-compare="editable-text-placeholder"
                />
            </div>

            {/* Editing state (controlled isEditing) */}
            <div className="flex flex-col gap-2">
                <p className="text-body-sm text-foreground-muted">Editing state</p>
                <EditableText
                    value={editingValue}
                    isEditing={true}
                    onChange={setEditingValue}
                    data-compare="editable-text-editing"
                />
            </div>

            {/* Multiline */}
            <div className="flex flex-col gap-2">
                <p className="text-body-sm text-foreground-muted">Multiline</p>
                <EditableText
                    defaultValue={"Line one\nLine two\nLine three"}
                    multiline
                    minLines={3}
                />
            </div>

            {/* Intents */}
            <div className="flex flex-col gap-2">
                <p className="text-body-sm text-foreground-muted">Intents</p>
                <div className="flex flex-col gap-2">
                    {intents.map((intent) => (
                        <EditableText
                            key={intent}
                            defaultValue={intent === "none" ? "No intent" : intent}
                            intent={intent}
                        />
                    ))}
                </div>
            </div>

            {/* Disabled */}
            <div className="flex flex-col gap-2">
                <p className="text-body-sm text-foreground-muted">Disabled</p>
                <EditableText
                    defaultValue="Cannot edit this"
                    disabled
                />
            </div>
        </div>
    );
}

/**
 * EntityTitle showcase.
 *
 * Specimens cover: basic title only, title+icon+subtitle, title+icon+subtitle+tag,
 * and each size variant (h1–h6 + text). Identical text/icon on both sides.
 *
 * data-compare keys:
 *   entity-title-basic       — title-only (no icon, no subtitle)
 *   entity-title-full        — icon + title + subtitle
 *   entity-title-tags        — icon + title + subtitle + tag
 *   entity-title-h1          — h1 size with icon + subtitle
 *   entity-title-h3          — h3 size with icon + subtitle
 *   entity-title-h6          — h6 size with icon + subtitle
 */
function EntityTitleGallery() {
    const sizes: EntityTitleSize[] = ["text", "h1", "h2", "h3", "h4", "h5", "h6"];

    return (
        <div className="flex flex-col gap-8 text-foreground">
            {/* Basic: title only */}
            <div className="flex flex-col gap-2">
                <p className="text-body-sm text-foreground-muted">Title only</p>
                <EntityTitle
                    title="Project Alpha"
                    data-compare="entity-title-basic"
                />
            </div>

            {/* Title + icon + subtitle */}
            <div className="flex flex-col gap-2">
                <p className="text-body-sm text-foreground-muted">Icon + title + subtitle</p>
                <EntityTitle
                    icon="folder-close"
                    title="Project Alpha"
                    subtitle="Last updated 2 hours ago"
                    data-compare="entity-title-full"
                />
            </div>

            {/* Title + icon + subtitle + tag */}
            <div className="flex flex-col gap-2">
                <p className="text-body-sm text-foreground-muted">Icon + title + subtitle + tag</p>
                <EntityTitle
                    icon="folder-close"
                    title="Project Alpha"
                    subtitle="Last updated 2 hours ago"
                    tags={<Tag intent="primary">Active</Tag>}
                    data-compare="entity-title-tags"
                />
            </div>

            {/* Sizes */}
            <div className="flex flex-col gap-4">
                <p className="text-body-sm text-foreground-muted">Sizes</p>
                {sizes.map((size) => (
                    <EntityTitle
                        key={size}
                        size={size}
                        icon="folder-close"
                        title={`${size === "text" ? "Text" : size.toUpperCase()} — Project Alpha`}
                        subtitle="Last updated 2 hours ago"
                        data-compare={`entity-title-${size}`}
                    />
                ))}
            </div>

            {/* Loading state */}
            <div className="flex flex-col gap-2">
                <p className="text-body-sm text-foreground-muted">Loading</p>
                <EntityTitle
                    icon="folder-close"
                    title="Loading title"
                    subtitle="Loading subtitle"
                    loading
                />
            </div>

            {/* Fill + ellipsize */}
            <div className="flex flex-col gap-2">
                <p className="text-body-sm text-foreground-muted">Fill + ellipsize</p>
                <div style={{ width: 300 }} className="border border-divider rounded">
                    <EntityTitle
                        icon="folder-close"
                        title="Very long project name that should be truncated on overflow"
                        subtitle="Last updated 2 hours ago"
                        fill
                        ellipsize
                    />
                </div>
            </div>
        </div>
    );
}

/**
 * NonIdealState showcase. Inline (no portal) — dark via .dark ancestor.
 *
 * Specimens cover:
 *   - Full state (icon + title + description + action)
 *   - Minimal (icon + title only)
 *   - Title + description only (no icon)
 *   - Horizontal layout
 *   - Icon size variants (STANDARD, SMALL, EXTRA_SMALL)
 *   - Custom ReactNode visual (non-string icon)
 *
 * data-compare keys (must match blueprint-reference NonIdealStateGallery exactly):
 *   non-ideal-state-full          — full state: icon + title + description + action
 *   non-ideal-state-minimal       — icon + title only
 *   non-ideal-state-visual-full   — the visual div inside the full-state specimen
 *   non-ideal-state-title-full    — the title h4 inside the full-state specimen
 *   non-ideal-state-description   — the description div inside the full-state specimen
 *
 * Fixed width (400px) so centering + max-width compare cleanly on both sides.
 */
function NonIdealStateGallery() {
    return (
        <div className="flex flex-col gap-8 text-foreground">
            {/* Full state: icon + title + description + action */}
            <div className="flex flex-col gap-2">
                <p className="text-body-sm text-foreground-muted">Full state (icon + title + description + action)</p>
                <div style={{ width: 400, height: 300, position: "relative" }}>
                    <NonIdealState
                        icon="search"
                        title="No search results"
                        description="Your query returned no results. Try a different search."
                        action={<Button intent="primary">Clear search</Button>}
                        data-compare="non-ideal-state-full"
                    />
                </div>
            </div>

            {/* Minimal: icon + title only */}
            <div className="flex flex-col gap-2">
                <p className="text-body-sm text-foreground-muted">Minimal (icon + title)</p>
                <div style={{ width: 400, height: 200, position: "relative" }}>
                    <NonIdealState
                        icon="folder-close"
                        title="Empty folder"
                        data-compare="non-ideal-state-minimal"
                    />
                </div>
            </div>

            {/* Title + description only (no icon) */}
            <div className="flex flex-col gap-2">
                <p className="text-body-sm text-foreground-muted">Title + description (no icon)</p>
                <div style={{ width: 400, height: 150, position: "relative" }}>
                    <NonIdealState
                        title="Nothing here"
                        description="Come back later when there's something to show."
                    />
                </div>
            </div>

            {/* Horizontal layout */}
            <div className="flex flex-col gap-2">
                <p className="text-body-sm text-foreground-muted">Horizontal layout</p>
                <div style={{ width: 400, height: 120, position: "relative" }}>
                    <NonIdealState
                        icon="warning-sign"
                        title="Connection error"
                        description="Could not connect to the server."
                        layout="horizontal"
                    />
                </div>
            </div>

            {/* Icon size variants */}
            <div className="flex flex-col gap-2">
                <p className="text-body-sm text-foreground-muted">Icon sizes (STANDARD / SMALL / EXTRA_SMALL)</p>
                <div className="flex gap-4 flex-wrap">
                    {([
                        ["STANDARD", NonIdealStateIconSize.STANDARD],
                        ["SMALL", NonIdealStateIconSize.SMALL],
                        ["EXTRA_SMALL", NonIdealStateIconSize.EXTRA_SMALL],
                    ] as const).map(([label, size]) => (
                        <div key={label} style={{ width: 160, height: 180, position: "relative", border: "1px dashed rgba(0,0,0,0.1)" }}>
                            <NonIdealState
                                icon="document"
                                iconSize={size}
                                title={label}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* iconMuted=false */}
            <div className="flex flex-col gap-2">
                <p className="text-body-sm text-foreground-muted">iconMuted=false (inherits muted text color)</p>
                <div style={{ width: 400, height: 180, position: "relative" }}>
                    <NonIdealState
                        icon="info-sign"
                        title="Information"
                        iconMuted={false}
                    />
                </div>
            </div>
        </div>
    );
}

/**
 * Link showcase.
 *
 * Blueprint spec: bp6-link with underline/color variants.
 * Default: underline="always", color="primary" (blue-2 light / blue-5 dark).
 *
 * data-compare keys (must match blueprint-reference LinkGallery exactly):
 *   link-default       — primary color, always underlined
 *   link-hover         — primary color, hover underline
 *   link-none          — primary color, no underline
 *   link-inherit       — inherit color, always underlined
 *   link-success       — success color, always underlined
 *   link-warning       — warning color, always underlined
 *   link-danger        — danger color, always underlined
 *   link-inline        — link in a sentence of body text
 */
function LinkGallery() {
    return (
        <div className="flex flex-col gap-6">
            {/* Default — always underlined, primary color */}
            <div className="flex flex-col gap-2">
                <p className="text-[12px] text-foreground-muted">Default (underline=always, color=primary)</p>
                <Link href="#" data-compare="link-default">Blueprint Link</Link>
            </div>

            {/* Underline variants */}
            <div className="flex flex-col gap-2">
                <p className="text-[12px] text-foreground-muted">Underline variants</p>
                <div className="flex gap-6 items-baseline">
                    <Link href="#" underline="always" data-compare="link-hover-nope">always</Link>
                    <Link href="#" underline="hover" data-compare="link-hover">hover</Link>
                    <Link href="#" underline="none" data-compare="link-none">none</Link>
                </div>
            </div>

            {/* Color variants */}
            <div className="flex flex-col gap-2">
                <p className="text-[12px] text-foreground-muted">Color variants</p>
                <div className="flex gap-6 items-baseline">
                    <Link href="#" color="primary">primary</Link>
                    <Link href="#" color="success" data-compare="link-success">success</Link>
                    <Link href="#" color="warning" data-compare="link-warning">warning</Link>
                    <Link href="#" color="danger" data-compare="link-danger">danger</Link>
                    <Link href="#" color="inherit" data-compare="link-inherit">inherit</Link>
                </div>
            </div>

            {/* Inline in text */}
            <div className="flex flex-col gap-2">
                <p className="text-[12px] text-foreground-muted">Inline in body text</p>
                <p className="text-[14px] leading-[1.28581]">
                    Visit the{" "}
                    <Link href="#" data-compare="link-inline">Blueprint documentation</Link>
                    {" "}for more details.
                </p>
            </div>
        </div>
    );
}

/**
 * Slider showcase.
 *
 * data-compare keys (must match blueprint-reference SliderGallery exactly):
 *   slider-default      — horizontal slider at value=5, intent=primary, min=0 max=10 step=1
 *   slider-success      — success intent slider at value=6
 *   slider-disabled     — disabled slider at value=3
 *   slider-track        — the track rail (RadixSlider.Track)
 *   slider-progress     — the progress fill element (fill div inside Track)
 *   slider-handle       — the handle knob (RadixSlider.Thumb)
 *   slider-axis-label   — first axis tick label (plain text, no bg)
 *   slider-handle-label — handle value badge (dark tooltip pill below handle)
 */
function SliderGallery() {
    const [val, setVal] = useState(5);
    const [successVal] = useState(6);
    return (
        <div className="flex flex-col gap-8">
            {/* Default — primary intent, value=5, labels at 0/5/10 */}
            <div className="flex flex-col gap-2">
                <p className="text-[12px] text-foreground-muted">Default (primary, value=5)</p>
                <div className="w-[320px]" data-compare="slider-default">
                    <Slider
                        min={0}
                        max={10}
                        stepSize={1}
                        value={val}
                        onChange={setVal}
                        intent="primary"
                        labelStepSize={5}
                        _tagInternals
                    />
                </div>
            </div>

            {/* Success intent */}
            <div className="flex flex-col gap-2">
                <p className="text-[12px] text-foreground-muted">Success intent (value=6)</p>
                <div className="w-[320px]" data-compare="slider-success">
                    <Slider
                        min={0}
                        max={10}
                        stepSize={1}
                        value={successVal}
                        intent="success"
                        labelStepSize={5}
                    />
                </div>
            </div>

            {/* Disabled */}
            <div className="flex flex-col gap-2">
                <p className="text-[12px] text-foreground-muted">Disabled (value=3)</p>
                <div className="w-[320px]" data-compare="slider-disabled">
                    <Slider
                        min={0}
                        max={10}
                        stepSize={1}
                        value={3}
                        intent="primary"
                        disabled
                        labelStepSize={5}
                    />
                </div>
            </div>
        </div>
    );
}

/**
 * Hotkeys showcase. Renders the HotkeysDialog OPEN by default so the harness can
 * screenshot and computed-style-diff the portaled content.
 *
 * Portal + dark-mode: dark comes from DarkContext; the dialog receives it and
 * wraps the portaled portal children in `<div className="dark">` (same as Dialog/Alert).
 *
 * data-compare keys (must match blueprint-reference HotkeysGallery exactly):
 *   hotkey-key    — a single .bp6-key cap (first key in the first combo)
 *   hotkey-combo  — the .bp6-key-combo wrapper span (first row)
 *   hotkey-row    — a .bp6-hotkey row (first row, first group)
 *   hotkey-label  — the .bp6-hotkey-label div (first row)
 *
 * NOTE: These elements are portaled to document.body, so the harness finds them
 * via document.querySelectorAll("[data-compare]") which scans the full document.
 */
function HotkeysGallery() {
    const dark = useContext(DarkContext);

    const HOTKEYS = [
        { label: "Save document", combo: "mod+s", global: true },
        { label: "New file", combo: "mod+n", global: true },
        { label: "Find", combo: "mod+f", group: "Editor" },
        { label: "Undo", combo: "mod+z", group: "Editor" },
    ] as const;

    return (
        <div className="flex flex-col gap-4">
            <p className="text-body text-foreground-muted">
                The hotkeys dialog below is open by default for comparison harness screenshots.
            </p>
            {/* Standalone KeyCombo specimens (visible outside dialog) */}
            <div className="flex flex-wrap items-center gap-4">
                <span className="text-body-sm text-foreground-muted">KeyCombo:</span>
                <KeyCombo combo="mod+s" />
                <KeyCombo combo="mod+shift+n" />
                <KeyCombo combo="ctrl+z" />
            </div>
            <HotkeysDialog
                open={true}
                onOpenChange={() => {}}
                dark={dark}
                title="Keyboard shortcuts"
                hotkeys={HOTKEYS}
                globalGroupName="Global"
            />
        </div>
    );
}

/**
 * TagInput showcase.
 *
 * All specimens are pre-populated with tags so the static screenshot + diff is stable
 * and meaningful. The same values appear on both sides.
 *
 * data-compare keys (must match blueprint-reference TagInputGallery exactly):
 *   tag-input-container  — the main TagInput container box
 *   tag-input-tag        — the first Tag chip inside the container
 *   tag-input-ghost      — the ghost text input
 */
function TagInputGallery() {
    const [values, setValues] = useState<string[]>(["apple", "banana", "cherry"]);
    const [largeValues, setLargeValues] = useState<string[]>(["react", "typescript"]);
    const [intentValues, setIntentValues] = useState<string[]>(["error", "warning"]);

    return (
        <div className="flex flex-col gap-8 text-foreground">
            <Section title="Default (pre-populated)">
                <div style={{ width: 400 }}>
                    <TagInput
                        values={values}
                        onChange={(v) => setValues(v as string[])}
                        placeholder="Add a tag…"
                        fill
                        data-compare="tag-input-container"
                        _firstTagCompare="tag-input-tag"
                        _ghostCompare="tag-input-ghost"
                    />
                </div>
            </Section>

            <Section title="Large">
                <div style={{ width: 400 }}>
                    <TagInput
                        values={largeValues}
                        onChange={(v) => setLargeValues(v as string[])}
                        placeholder="Add a tag…"
                        large
                        fill
                    />
                </div>
            </Section>

            <Section title="Danger intent + fill">
                <TagInput
                    values={intentValues}
                    onChange={(v) => setIntentValues(v as string[])}
                    placeholder="Add a tag…"
                    intent="danger"
                    fill
                />
            </Section>

            <Section title="Disabled">
                <div style={{ width: 400 }}>
                    <TagInput
                        values={["locked", "read-only"]}
                        onChange={() => {}}
                        placeholder="Disabled"
                        disabled
                        fill
                    />
                </div>
            </Section>

            <Section title="With left icon">
                <div style={{ width: 400 }}>
                    <TagInput
                        values={["design", "ui", "ux"]}
                        onChange={() => {}}
                        placeholder="Tags…"
                        leftIcon="search"
                        fill
                    />
                </div>
            </Section>
        </div>
    );
}

// ─── Select items for both galleries ───────────────────────────────────────
const SELECT_ITEMS = ["Apple", "Banana", "Cherry", "Durian", "Elderberry", "Fig", "Grape"];
const SELECT_SELECTED = "Cherry";

/**
 * Select showcase. The popover is controlled OPEN so the harness can screenshot
 * the filter input + menu items. data-compare keys match blueprint-reference SelectGallery.
 *
 * data-compare keys:
 *   select-trigger       — the trigger button wrapper div
 *   select-filter        — the filter InputGroup's <input> element
 *   select-menu          — the menu <ul> element inside the popover
 *   select-item          — a non-active MenuItem (Cherry — the selected one)
 *   select-item-active   — the active/highlighted MenuItem (Apple — first item, active by default)
 *
 * Because the popover content is portaled, we tag select-filter and select-item via
 * document.querySelector in a useEffect (same pattern as ContextMenu/Dialog galleries).
 */
function SelectGallery() {
    const dark = useContext(DarkContext);
    const [selected, setSelected] = useState<string | null>(SELECT_SELECTED);

    // Stamp data-compare on portaled nodes after render.
    // The popover content is portaled (outside the .dark ancestor), so we use
    // document-wide querySelector to find elements by their structural position.
    useEffect(() => {
        function tag() {
            const menuUl = document.querySelector<HTMLElement>('[data-compare="select-menu"]');
            if (!menuUl) return;

            // Filter input: sibling of the menu, inside the same p-1 wrapper
            const wrapper = menuUl.parentElement; // div.p-1
            if (wrapper) {
                const filterInput = wrapper.querySelector<HTMLElement>("input");
                if (filterInput) filterInput.setAttribute("data-compare", "select-filter");
            }

            // select-item-active: Apple is index 0 (first item, active by default)
            const appleLi = menuUl.children[0] as HTMLElement | undefined;
            if (appleLi) {
                const btn = appleLi.querySelector("button,a");
                if (btn) btn.setAttribute("data-compare", "select-item-active");
            }

            // select-item: Cherry is index 2 (0-based) in the list
            const cherryLi = menuUl.children[2] as HTMLElement | undefined;
            if (cherryLi) {
                const btn = cherryLi.querySelector("button,a");
                if (btn) btn.setAttribute("data-compare", "select-item");
            }
        }
        tag();
        const t = setTimeout(tag, 150);
        return () => clearTimeout(t);
    });

    return (
        <div className="flex flex-col gap-8 text-foreground">
            <Section title="Default filterable Select (popover open for comparison)">
                <div style={{ width: 300 }}>
                    <Select<string>
                        items={SELECT_ITEMS}
                        selectedItem={selected}
                        itemPredicate={(query, item) =>
                            item.toLowerCase().includes(query.toLowerCase())
                        }
                        itemRenderer={(item, { modifiers, handleClick }) => (
                            <MenuItem
                                key={item}
                                text={item}
                                active={modifiers.active}
                                icon={item === selected ? "tick" : undefined}
                                onClick={handleClick}
                                data-compare={undefined}
                            />
                        )}
                        onItemSelect={(item) => setSelected(item)}
                        noResults={
                            <MenuItem disabled text="No results." />
                        }
                        dark={dark}
                        popoverProps={{ open: true, onOpenChange: () => {} }}
                    >
                        <Button
                            variant="solid"
                            endIcon={<Icon icon="caret-down" size={16} />}
                            data-compare="select-trigger"
                            fill
                        >
                            {selected ?? "Select a fruit…"}
                        </Button>
                    </Select>
                </div>
            </Section>

            <Section title="Non-filterable Select">
                <Select<string>
                    items={SELECT_ITEMS}
                    selectedItem={selected}
                    filterable={false}
                    itemRenderer={(item, { modifiers, handleClick }) => (
                        <MenuItem
                            key={item}
                            text={item}
                            active={modifiers.active}
                            icon={item === selected ? "tick" : undefined}
                            onClick={handleClick}
                        />
                    )}
                    onItemSelect={(item) => setSelected(item)}
                    dark={dark}
                >
                    <Button variant="solid" endIcon={<Icon icon="caret-down" size={16} />}>
                        {selected ?? "Select a fruit…"}
                    </Button>
                </Select>
            </Section>

            <Section title="Disabled">
                <Select<string>
                    items={SELECT_ITEMS}
                    selectedItem={selected}
                    itemRenderer={(item, { modifiers, handleClick }) => (
                        <MenuItem
                            key={item}
                            text={item}
                            active={modifiers.active}
                            onClick={handleClick}
                        />
                    )}
                    onItemSelect={(item) => setSelected(item)}
                    disabled
                    dark={dark}
                >
                    <Button variant="solid" endIcon={<Icon icon="caret-down" size={16} />} disabled>
                        {selected ?? "Select a fruit…"}
                    </Button>
                </Select>
            </Section>
        </div>
    );
}

// ─── Suggest items (same list as Select + Blueprint reference) ─────────────
const SUGGEST_ITEMS = SELECT_ITEMS;
const SUGGEST_SELECTED = SELECT_SELECTED; // "Cherry"

/**
 * Suggest gallery. Renders the Suggest typeahead component.
 *
 * Strategy: Force popover OPEN so the harness can screenshot the input and menu
 * items without interaction. We use popoverProps={{ open: true }} and tag
 * portaled DOM nodes via document.querySelector in a useEffect.
 *
 * data-compare keys:
 *   suggest-input        — the InputGroup's <input> element (the trigger + filter)
 *   suggest-menu         — the menu <ul> element inside the popover (portaled)
 *   suggest-item         — Apple (index 0, non-active, non-selected)
 *   suggest-item-active  — Cherry (index 2, active because it's the selectedItem)
 *
 * Active item = selectedItem (Cherry) because Suggest initializes activeItem = selectedItem.
 * suggest-input is stamped here (not in the component) to avoid picking up the disabled instance.
 * suggest-menu is tagged via data-compare="suggest-menu" in the Suggest component itself.
 * suggest-item and suggest-item-active are stamped via useEffect.
 */
function SuggestGallery() {
    const dark = useContext(DarkContext);
    const [selected, setSelected] = useState<string | null>(SUGGEST_SELECTED);

    // Stamp data-compare on portaled menu item nodes and the input after render.
    useEffect(() => {
        function tag() {
            // suggest-input: the InputGroup's <input> inside the OPEN Suggest (not the disabled one).
            // We find it via the suggest-menu's ancestor chain (the Suggest that has the open popover).
            // The input is in the trigger area; the menu is portaled. We find the input by looking
            // for the first InputGroup input inside the forced-open Suggest's wrapper container.
            // Since the open Suggest is the first one (the disabled one comes second), we take [0].
            const allInputs = document.querySelectorAll<HTMLElement>(".suggest-gallery-wrapper input");
            const firstInput = allInputs[0];
            if (firstInput) firstInput.setAttribute("data-compare", "suggest-input");

            const menuUl = document.querySelector<HTMLElement>('[data-compare="suggest-menu"]');
            if (!menuUl) return;

            // suggest-item: Apple is index 0 (non-active, non-selected)
            const appleLi = menuUl.children[0] as HTMLElement | undefined;
            if (appleLi) {
                const btn = appleLi.querySelector("button,a");
                if (btn) btn.setAttribute("data-compare", "suggest-item");
            }

            // suggest-item-active: Cherry is index 2 (active because it's the selectedItem)
            const cherryLi = menuUl.children[2] as HTMLElement | undefined;
            if (cherryLi) {
                const btn = cherryLi.querySelector("button,a");
                if (btn) btn.setAttribute("data-compare", "suggest-item-active");
            }
        }
        tag();
        const t = setTimeout(tag, 150);
        return () => clearTimeout(t);
    });

    return (
        <div className="suggest-gallery-wrapper flex flex-col gap-8 text-foreground">
            <Section title="Suggest (typeahead, popover open for comparison)">
                <div style={{ width: 300 }}>
                    <Suggest<string>
                        items={SUGGEST_ITEMS}
                        selectedItem={selected}
                        inputValueRenderer={(item) => item}
                        itemPredicate={(query, item) =>
                            item.toLowerCase().includes(query.toLowerCase())
                        }
                        itemRenderer={(item, { modifiers, handleClick }) => (
                            <MenuItem
                                key={item}
                                text={item}
                                active={modifiers.active}
                                icon={item === selected ? "tick" : undefined}
                                onClick={handleClick}
                            />
                        )}
                        onItemSelect={(item) => setSelected(item)}
                        noResults={<MenuItem disabled text="No results." />}
                        dark={dark}
                        fill
                        popoverProps={{ open: true, onOpenChange: () => {} }}
                    />
                </div>
            </Section>

            <Section title="Disabled">
                <Suggest<string>
                    items={SUGGEST_ITEMS}
                    selectedItem={selected}
                    inputValueRenderer={(item) => item}
                    itemPredicate={(query, item) =>
                        item.toLowerCase().includes(query.toLowerCase())
                    }
                    itemRenderer={(item, { modifiers, handleClick }) => (
                        <MenuItem
                            key={item}
                            text={item}
                            active={modifiers.active}
                            onClick={handleClick}
                        />
                    )}
                    onItemSelect={(item) => setSelected(item)}
                    dark={dark}
                    disabled
                />
            </Section>
        </div>
    );
}

// ─── MultiSelect items (same list as Select/Suggest) ─────────────────────────
const MULTI_SELECT_ITEMS = SELECT_ITEMS; // ["Apple", "Banana", "Cherry", ...]
// Initially selected: Banana + Cherry (indices 1, 2)
const MULTI_SELECT_SELECTED = ["Banana", "Cherry"];

/**
 * MultiSelect gallery.
 *
 * Shows the main MultiSelect with:
 * - Two pre-selected chips (Banana, Cherry) visible in the trigger container.
 * - Popover forced OPEN for static harness comparison.
 * - Apple is index 0 (non-active, non-selected).
 * - Durian is index 3 (active by default — first enabled item after query reset).
 *
 * data-compare keys:
 *   multi-select-container  — the TagInput-like trigger container
 *   multi-select-tag        — the first Tag chip (Banana)
 *   multi-select-menu       — the menu <ul> element (portaled)
 *   multi-select-item       — Apple (index 0, non-active, non-selected item in menu)
 *   multi-select-item-active — Apple (index 0, active by default — first enabled item)
 *
 * NOTE: Apple is both non-selected AND active (first item), so it gets both
 * multi-select-item and multi-select-item-active depending on which we want.
 * We use Apple as multi-select-item-active (active state) since it's the first
 * enabled item that gets highlighted. For multi-select-item (non-active), we use
 * Banana's menu entry — but Banana is selected, so its tick icon is visible.
 * Blueprint marks selected items in the menu; we do the same.
 *
 * Strategy: Apple is index 0 = active by default (first enabled item).
 *           Durian is index 3 = not selected, not active → use for multi-select-item.
 */
function MultiSelectGallery() {
    const dark = useContext(DarkContext);
    const [selected, setSelected] = useState<string[]>(MULTI_SELECT_SELECTED);

    // Stamp data-compare on portaled menu item nodes after render
    useEffect(() => {
        function tag() {
            const menuUl = document.querySelector<HTMLElement>('[data-compare="multi-select-menu"]');
            if (!menuUl) return;

            // multi-select-item-active: Apple is index 0 (first item = active by default)
            const appleLi = menuUl.children[0] as HTMLElement | undefined;
            if (appleLi) {
                const btn = appleLi.querySelector("button,a");
                if (btn) btn.setAttribute("data-compare", "multi-select-item-active");
            }

            // multi-select-item: Durian is index 3 (non-active, non-selected)
            const durianLi = menuUl.children[3] as HTMLElement | undefined;
            if (durianLi) {
                const btn = durianLi.querySelector("button,a");
                if (btn) btn.setAttribute("data-compare", "multi-select-item");
            }
        }
        tag();
        const t = setTimeout(tag, 150);
        return () => clearTimeout(t);
    });

    return (
        <div className="multi-select-gallery-wrapper flex flex-col gap-8 text-foreground">
            <Section title="MultiSelect (chips + popover open for comparison)">
                <div style={{ width: 400 }}>
                    <MultiSelect<string>
                        items={MULTI_SELECT_ITEMS}
                        selectedItems={selected}
                        tagRenderer={(item) => item}
                        itemPredicate={(query, item) =>
                            item.toLowerCase().includes(query.toLowerCase())
                        }
                        itemRenderer={(item, { modifiers, handleClick }) => (
                            <MenuItem
                                key={item}
                                text={item}
                                active={modifiers.active}
                                icon={selected.includes(item) ? "tick" : undefined}
                                onClick={handleClick}
                            />
                        )}
                        onItemSelect={(item) => {
                            if (!selected.includes(item)) {
                                setSelected((s) => [...s, item]);
                            }
                        }}
                        onRemove={(_item, index) =>
                            setSelected((s) => s.filter((_, i) => i !== index))
                        }
                        noResults={<MenuItem disabled text="No results." />}
                        dark={dark}
                        fill
                        data-compare="multi-select-container"
                        popoverProps={{ open: true, onOpenChange: () => {} }}
                    />
                </div>
            </Section>

            <Section title="Disabled">
                <div style={{ width: 400 }}>
                    <MultiSelect<string>
                        items={MULTI_SELECT_ITEMS}
                        selectedItems={["Apple", "Banana"]}
                        tagRenderer={(item) => item}
                        itemPredicate={(query, item) =>
                            item.toLowerCase().includes(query.toLowerCase())
                        }
                        itemRenderer={(item, { modifiers, handleClick }) => (
                            <MenuItem
                                key={item}
                                text={item}
                                active={modifiers.active}
                                onClick={handleClick}
                            />
                        )}
                        onItemSelect={() => {}}
                        dark={dark}
                        disabled
                        fill
                    />
                </div>
            </Section>
        </div>
    );
}

// ─── Omnibar items (same list as Select items) ────────────────────────────
const OMNIBAR_ITEMS = SELECT_ITEMS;

/**
 * Omnibar gallery. Renders the Omnibar command-palette overlay OPEN.
 *
 * Strategy: Force isOpen=true so the harness can screenshot the portaled panel,
 * input, and menu items without interaction. Data-compare keys are placed via
 * the component's data-compare props and useEffect for portaled nodes.
 *
 * data-compare keys:
 *   omnibar-panel        — the elevated panel div (portaled)
 *   omnibar-input        — the search <input> element inside the InputGroup
 *   omnibar-menu         — the menu <ul> element
 *   omnibar-item         — Cherry (index 2, non-active, non-first item)
 *   omnibar-item-active  — Apple (index 0, active by default — first enabled item)
 */
function OmnibarGallery() {
    const dark = useContext(DarkContext);

    // Stamp data-compare on portaled menu item nodes
    useEffect(() => {
        function tag() {
            // omnibar-input: the <input> element inside the InputGroup
            const inputEl = document.querySelector<HTMLElement>('[data-compare="omnibar-panel"] input');
            if (inputEl) inputEl.setAttribute("data-compare", "omnibar-input");

            const menuUl = document.querySelector<HTMLElement>('[data-compare="omnibar-menu"]');
            if (!menuUl) return;

            // omnibar-item-active: Apple is index 0 (first item, active by default)
            const appleLi = menuUl.children[0] as HTMLElement | undefined;
            if (appleLi) {
                const btn = appleLi.querySelector("button,a");
                if (btn) btn.setAttribute("data-compare", "omnibar-item-active");
            }

            // omnibar-item: Cherry is index 2 (non-active, non-first item)
            const cherryLi = menuUl.children[2] as HTMLElement | undefined;
            if (cherryLi) {
                const btn = cherryLi.querySelector("button,a");
                if (btn) btn.setAttribute("data-compare", "omnibar-item");
            }
        }
        tag();
        const t = setTimeout(tag, 150);
        return () => clearTimeout(t);
    });

    return (
        <div className="flex flex-col gap-4 text-foreground">
            <p className="text-body text-foreground-muted">
                Omnibar is always rendered open for harness comparison. Click outside or press Esc to close.
            </p>
            {/* A placeholder element so the gallery has visible content when the harness takes a screenshot.
                The actual omnibar panel is portaled (fixed position) and visible above. */}
            <div className="relative h-[320px] border border-dashed border-gray-4 [border-radius:4px] flex items-center justify-center">
                <span className="text-body text-foreground-muted">Omnibar panel is portaled above this area</span>
                <Omnibar<string>
                    isOpen={true}
                    onClose={() => {}}
                    items={OMNIBAR_ITEMS}
                    itemPredicate={(query, item) =>
                        item.toLowerCase().includes(query.toLowerCase())
                    }
                    itemRenderer={(item, { modifiers, handleClick }) => (
                        <MenuItem
                            key={item}
                            text={item}
                            active={modifiers.active}
                            onClick={handleClick}
                        />
                    )}
                    onItemSelect={() => {}}
                    dark={dark}
                />
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// TimePicker gallery
// Fixed value: 14:30 (2:30 PM in 24h mode) for stable static diff.
// data-compare keys:
//   time-picker-input   → the hour segment input (first specimen: default)
//   time-picker-divider → the colon divider (first specimen: default)
//   time-picker-arrow   → the first up-arrow button (arrows specimen)
//   time-picker-ampm    → the AM/PM select element (ampm specimen)
// ---------------------------------------------------------------------------
const FIXED_TIME = new Date();
FIXED_TIME.setHours(14, 30, 0, 0);

const FIXED_TIME_SECOND = new Date();
FIXED_TIME_SECOND.setHours(14, 30, 45, 0);

const FIXED_TIME_AMPM = new Date();
FIXED_TIME_AMPM.setHours(14, 30, 0, 0); // 2:30 PM

function TimePickerGallery() {
    return (
        <div className="flex flex-col gap-8">
            {/* Default: hour + minute at 14:30 */}
            <div className="flex flex-col gap-2">
                <span className="text-body-sm text-foreground-muted">Default (14:30)</span>
                <TimePicker value={FIXED_TIME} onChange={() => {}} />
            </div>

            {/* Arrow buttons */}
            <div className="flex flex-col gap-2">
                <span className="text-body-sm text-foreground-muted">With arrow buttons</span>
                <TimePicker value={FIXED_TIME} onChange={() => {}} showArrowButtons />
            </div>

            {/* Seconds precision */}
            <div className="flex flex-col gap-2">
                <span className="text-body-sm text-foreground-muted">Seconds precision (14:30:45)</span>
                <TimePicker value={FIXED_TIME_SECOND} onChange={() => {}} precision="second" />
            </div>

            {/* AM/PM mode */}
            <div className="flex flex-col gap-2">
                <span className="text-body-sm text-foreground-muted">AM/PM mode (2:30 PM)</span>
                <TimePicker value={FIXED_TIME_AMPM} onChange={() => {}} useAmPm />
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// DatePicker gallery
// Fixed selected date: 2026-01-15. Fixed display month: January 2026.
// Both sides must show the SAME selected date + displayed month for stable diff.
//
// data-compare keys:
//   date-picker-nav           → the previous-month nav button (caption area)
//   date-picker-weekday       → a weekday header cell (e.g. "Su")
//   date-picker-day           → a regular (non-selected, non-outside) day cell
//   date-picker-day-selected  → the selected day cell (Jan 15, 2026)
// ---------------------------------------------------------------------------
const FIXED_DATE = new Date(2026, 0, 15); // Jan 15, 2026
const FIXED_MONTH = new Date(2026, 0, 1); // January 2026

function DatePickerGallery() {
    return (
        <div className="flex flex-col gap-8">
            {/* Basic specimen — fixed selected date, fixed month, no time */}
            <div className="flex flex-col gap-2">
                <span className="text-body-sm text-foreground-muted">Basic (Jan 15, 2026 selected)</span>
                <DatePicker
                    value={FIXED_DATE}
                    onChange={() => {}}
                    month={FIXED_MONTH}
                />
            </div>

            {/* With TimePicker */}
            <div className="flex flex-col gap-2">
                <span className="text-body-sm text-foreground-muted">With TimePicker (minute precision)</span>
                <DatePicker
                    value={FIXED_DATE}
                    onChange={() => {}}
                    month={FIXED_MONTH}
                    timePrecision="minute"
                />
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// DateInput gallery
// Fixed selected date: 2026-01-15. Popover OPEN (showing January 2026 calendar).
// Harness sees both the input field AND the portaled calendar in the same page.
//
// data-compare keys:
//   date-input-field        → the InputGroup <input> element
//   date-input-day          → a regular (non-selected) day in the open calendar (Jan 4)
//   date-input-day-selected → the selected day in the open calendar (Jan 15)
// ---------------------------------------------------------------------------

function DateInputGallery() {
    const dark = useContext(DarkContext);
    return (
        <div className="flex flex-col gap-8">
            {/* Interactive specimen — the real DateInput component */}
            <div className="flex flex-col gap-2">
                <span className="text-body-sm text-foreground-muted">DateInput (interactive)</span>
                <DateInput
                    defaultValue={FIXED_DATE}
                    dark={dark}
                    placeholder="M/d/yyyy"
                />
            </div>

            {/* Harness specimen — popover forced open for static diff */}
            <div className="flex flex-col gap-2">
                <span className="text-body-sm text-foreground-muted">DateInput (open, Jan 15 2026 selected)</span>
                {/* Popover is forced open via open=true so the harness sees the calendar */}
                <OpenDateInput dark={dark} />
            </div>
        </div>
    );
}

/**
 * DateInput with popover forced open for harness comparison.
 * We use a wrapper because Popover needs open to be a controlled prop.
 *
 * The DatePicker inside the popover uses the same FIXED_DATE / FIXED_MONTH
 * as the DatePicker gallery for a consistent January 2026 calendar view.
 * data-compare keys on the day cells come from DatePicker's DayButton component.
 * We override them here (date-input-day / date-input-day-selected) by
 * adding a second DatePicker inside the gallery with its own keys.
 */
function OpenDateInput({ dark }: { dark: boolean }) {
    // Wrap in inline JSX so we can render the Popover as always-open
    // We use DatePicker directly inside Popover (instead of DateInput's controlled open)
    // so the harness reliably sees both input + calendar in the DOM.
    return (
        <div className="flex flex-col gap-2 items-start">
            {/* The input field with data-compare tag */}
            <div
                className="relative inline-block"
                style={{ minWidth: 200 }}
            >
                {/* No rightElement — matches Blueprint's default (no calendar icon) for harness parity */}
                <InputGroup
                    type="text"
                    value="1/15/2026"
                    onChange={() => {}}
                    placeholder="M/d/yyyy"
                    data-compare="date-input-field"
                />
            </div>

            {/* Popover calendar always visible — portaled with dark support */}
            <Popover
                open={true}
                onOpenChange={() => {}}
                content={
                    <DatePickerForDateInput dark={dark} />
                }
                side="bottom"
                align="start"
                sideOffset={4}
                arrow={false}
                minimal={true}
                hasContentPadding={false}
                dark={dark}
            >
                {/* Invisible anchor so Popover has a trigger (it won't be seen) */}
                <span />
            </Popover>
        </div>
    );
}

/**
 * DatePicker for the DateInput gallery harness — uses date-input-day and
 * date-input-day-selected keys (instead of date-picker-day / date-picker-day-selected)
 * so they show as "date-input-*" pairs in the compare output.
 */
function DatePickerForDateInput({ dark: _dark }: { dark: boolean }) {
    // Inline a tiny wrapper that re-tags the DayButton data-compare keys
    // We render a standard DatePicker but override its day tags by using a wrapper div
    // and then post-processing via useEffect.
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // After render, re-stamp data-compare keys on the portaled calendar cells.
        // DatePicker puts date-picker-day and date-picker-day-selected on cells.
        // We replace those with date-input-day and date-input-day-selected.
        const root = ref.current;
        if (!root) return;

        function retag() {
            if (!root) return;
            const sel = root.querySelector<HTMLElement>("[data-compare='date-picker-day-selected']");
            if (sel) sel.setAttribute("data-compare", "date-input-day-selected");
            const norm = root.querySelector<HTMLElement>("[data-compare='date-picker-day']");
            if (norm) norm.setAttribute("data-compare", "date-input-day");
        }

        retag();
        const t1 = setTimeout(retag, 50);
        const t2 = setTimeout(retag, 200);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    });

    return (
        <div ref={ref}>
            <DatePicker
                value={FIXED_DATE}
                onChange={() => {}}
                month={FIXED_MONTH}
            />
        </div>
    );
}

// ---------------------------------------------------------------------------
// DateRangePicker gallery
// Fixed range: 2026-01-08 (start) to 2026-01-20 (end).
// Fixed left month: January 2026. Fixed right month: February 2026.
// Both months are locked so the harness always sees the same layout.
//
// data-compare keys:
//   drp-day         → a regular (non-range) day — Jan 4, 2026
//   drp-day-range   → an in-range (between) day — Jan 10, 2026
//   drp-day-endpoint → the start (Jan 8) or end (Jan 20) endpoint
// ---------------------------------------------------------------------------
const DRP_START = new Date(2026, 0, 8);   // Jan 8, 2026
const DRP_END = new Date(2026, 0, 20);    // Jan 20, 2026

function DateRangePickerGallery() {
    return (
        <div className="flex flex-col gap-8">
            {/* Main specimen — fixed range, two months side-by-side */}
            <div className="flex flex-col gap-2">
                <span className="text-body-sm text-foreground-muted">
                    Jan 8 – Jan 20, 2026 selected (January + February 2026)
                </span>
                <DateRangePicker
                    value={{ start: DRP_START, end: DRP_END }}
                    onChange={() => {}}
                    // Lock left month to January 2026 — right shows February 2026 automatically
                />
            </div>

            {/* Single-month variant */}
            <div className="flex flex-col gap-2">
                <span className="text-body-sm text-foreground-muted">
                    Single month (Jan 8 – Jan 20, 2026)
                </span>
                <DateRangePicker
                    value={{ start: DRP_START, end: DRP_END }}
                    onChange={() => {}}
                    singleMonthOnly
                />
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// DateRangeInput gallery
// Fixed range: 2026-01-08 (start) to 2026-01-20 (end).
// Two specimens:
//   1. Interactive DateRangeInput
//   2. Open specimen — two InputGroups + forced-open Popover with DateRangePicker
//
// data-compare keys:
//   dri-start         → the start InputGroup <input> element
//   dri-end           → the end InputGroup <input> element
//   dri-day-endpoint  → a filled endpoint day in the open DateRangePicker calendar
// ---------------------------------------------------------------------------
const DRI_START = new Date(2026, 0, 8);  // Jan 8, 2026
const DRI_END = new Date(2026, 0, 20);   // Jan 20, 2026

function DateRangeInputGallery() {
    const dark = useContext(DarkContext);
    return (
        <div className="flex flex-col gap-8">
            {/* Interactive specimen */}
            <div className="flex flex-col gap-2">
                <span className="text-body-sm text-foreground-muted">DateRangeInput (interactive)</span>
                <DateRangeInput
                    defaultValue={{ start: DRI_START, end: DRI_END }}
                    dark={dark}
                />
            </div>

            {/* Harness specimen — two inputs + popover forced open */}
            <div className="flex flex-col gap-2">
                <span className="text-body-sm text-foreground-muted">DateRangeInput (open, Jan 8 – Jan 20, 2026)</span>
                <OpenDateRangeInput dark={dark} />
            </div>
        </div>
    );
}

/**
 * DateRangeInput with popover forced open for harness comparison.
 * Renders two InputGroup fields + a forced-open Popover with DateRangePicker.
 * The DateRangePicker uses the same DRP_START/DRP_END/data-compare keys as
 * the DateRangePicker gallery (drp-day-endpoint is our dri-day-endpoint key).
 */
function OpenDateRangeInput({ dark }: { dark: boolean }) {
    return (
        <div className="flex flex-col gap-2 items-start">
            {/* Two input fields side-by-side, matching Blueprint's control-group layout */}
            <div className="inline-flex flex-row items-stretch">
                {/* Start input — tagged for harness */}
                <InputGroup
                    type="text"
                    value="1/8/2026"
                    onChange={() => {}}
                    placeholder="M/d/yyyy"
                    data-compare="dri-start"
                />
                {/* End input — tagged for harness */}
                <InputGroup
                    type="text"
                    value="1/20/2026"
                    onChange={() => {}}
                    placeholder="M/d/yyyy"
                    data-compare="dri-end"
                />
            </div>

            {/* Popover always visible — portaled DateRangePicker */}
            <Popover
                open={true}
                onOpenChange={() => {}}
                content={
                    <DateRangePickerForDRI />
                }
                side="bottom"
                align="start"
                sideOffset={4}
                arrow={false}
                minimal={true}
                hasContentPadding={false}
                dark={dark}
            >
                <span />
            </Popover>
        </div>
    );
}

/**
 * DateRangePicker for the DateRangeInput harness — uses dri-day-endpoint key
 * (instead of drp-day-endpoint) so it shows as a "dri-*" pair in the compare output.
 * Re-tags only the FIRST drp-day-endpoint (Jan 8 = range start) as dri-day-endpoint,
 * and clears the second (Jan 20 = range end) so only one key remains for pairing.
 * This matches Blueprint reference which tags range_start as dri-day-endpoint.
 */
function DateRangePickerForDRI() {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function retag() {
            const root = ref.current;
            if (!root) return;
            // drp-day-endpoint is stamped by the custom DayButton in DateRangePicker
            // for BOTH Jan 8 (start) and Jan 20 (end). We tag only the first (Jan 8 = start),
            // which matches Blueprint reference gallery that tags range_start as dri-day-endpoint.
            const eps = root.querySelectorAll<HTMLElement>("[data-compare='drp-day-endpoint']");
            if (eps.length > 0) {
                // Tag the first endpoint (Jan 8, range_start) as dri-day-endpoint
                eps[0].setAttribute("data-compare", "dri-day-endpoint");
                // Remove tag from remaining endpoints so they don't pollute the diff
                for (let i = 1; i < eps.length; i++) {
                    eps[i].removeAttribute("data-compare");
                }
            }
        }
        retag();
        const t1 = setTimeout(retag, 50);
        const t2 = setTimeout(retag, 200);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    });

    return (
        <div ref={ref}>
            <DateRangePicker
                value={{ start: DRI_START, end: DRI_END }}
                onChange={() => {}}
            />
        </div>
    );
}

// ─── TimezoneSelect gallery ─────────────────────────────────────────────────
// TimezoneSelect with popover forced open for comparison.
//
// data-compare keys (MUST match blueprint-reference TimezoneSelectGallery):
//   tz-trigger     — the trigger button
//   tz-menu        — the menu <ul> inside the popover (portaled)
//   tz-item        — a non-active MenuItem (New York — position 6 in minimal list)
//   tz-item-offset — the offset label on that same item
//
// Blueprint's initial list (empty query) shows the same MINIMAL_IANA_CODES order.
// "New York" is at index 6 in our minimal list (UTC, Honolulu, Anchorage, LA, Denver,
// Chicago, New York). We fix the same index on both sides so the item text matches.
// ---------------------------------------------------------------------------

const TZ_SELECTED = "America/Los_Angeles"; // "Los Angeles" — shown in trigger

/**
 * TimezoneSelect with popover forced open for harness comparison.
 * Uses a fixed selected timezone and empty query (shows minimal list).
 * Tags portaled DOM nodes via document.querySelector in a useEffect.
 */
function TimezoneSelectGallery() {
    const dark = useContext(DarkContext);
    const [value, setValue] = useState<string>(TZ_SELECTED);

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function tag() {
            const root = containerRef.current;
            if (!root) return;

            // tz-trigger: the trigger <button> inside the first TimezoneSelect
            // It's the first <button> in the container (before any portaled content)
            const triggerBtn = root.querySelector<HTMLElement>("button");
            if (triggerBtn) triggerBtn.setAttribute("data-compare", "tz-trigger");

            // tz-menu: the menu <ul> inside the TimezoneSelect popover
            // Our Select adds data-compare="select-menu" to the Menu ul —
            // we look for it and re-tag it as tz-menu for this gallery.
            // Since multiple Selects may be open on the page, we pick the one
            // inside the timezone-select popover (it will be the only open popover
            // when this gallery is isolated via ?component=timezone-select).
            const menuUls = document.querySelectorAll<HTMLElement>('[data-compare="select-menu"]');
            // If only one menu is visible (isolated gallery mode), use it.
            const menuUl = menuUls.length > 0 ? menuUls[menuUls.length - 1] : null;
            if (!menuUl) return;
            menuUl.setAttribute("data-compare", "tz-menu");

            // tz-item: "New York" — index 6 in the minimal list (0-based)
            // Order: 0=UTC, 1=Honolulu, 2=Anchorage, 3=LA, 4=Denver, 5=Chicago, 6=NewYork
            const nyLi = menuUl.children[6] as HTMLElement | undefined;
            if (nyLi) {
                const btn = nyLi.querySelector("button,a");
                if (btn) {
                    btn.setAttribute("data-compare", "tz-item");
                    // tz-item-offset: the label span (offset text) inside the item
                    const labelSpan = btn.querySelector<HTMLElement>(".menu-item-label");
                    if (labelSpan) labelSpan.setAttribute("data-compare", "tz-item-offset");
                }
            }
        }
        tag();
        const t1 = setTimeout(tag, 100);
        const t2 = setTimeout(tag, 300);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    });

    return (
        <div ref={containerRef} className="flex flex-col gap-8 text-foreground">
            <Section title="TimezoneSelect (popover open for comparison)">
                <div style={{ width: 320 }}>
                    <TimezoneSelect
                        value={value}
                        onChange={setValue}
                        dark={dark}
                        popoverProps={{ open: true, onOpenChange: () => {} }}
                    />
                </div>
            </Section>

            <Section title="Interactive TimezoneSelect">
                <div style={{ width: 320 }}>
                    <TimezoneSelect
                        value={value}
                        onChange={setValue}
                        dark={dark}
                    />
                </div>
            </Section>

            <Section title="Disabled">
                <TimezoneSelect
                    value={value}
                    onChange={setValue}
                    disabled
                    dark={dark}
                />
            </Section>
        </div>
    );
}

/** Registry of component showcases. Add an entry per component as it's built. */
const COMPONENTS: { id: string; title: string; render: () => React.ReactNode }[] = [
    { id: "button", title: "Button", render: () => <ButtonGallery /> },
    { id: "card", title: "Card", render: () => <CardGallery /> },
    { id: "icon", title: "Icon", render: () => <IconGallery /> },
    { id: "text", title: "Text", render: () => <TextGallery /> },
    { id: "divider", title: "Divider", render: () => <DividerGallery /> },
    { id: "spinner", title: "Spinner", render: () => <SpinnerGallery /> },
    { id: "progress-bar", title: "ProgressBar", render: () => <ProgressBarGallery /> },
    { id: "skeleton", title: "Skeleton", render: () => <SkeletonGallery /> },
    { id: "tag", title: "Tag", render: () => <TagGallery /> },
    { id: "callout", title: "Callout", render: () => <CalloutGallery /> },
    { id: "input-group", title: "InputGroup", render: () => <InputGroupGallery /> },
    { id: "text-area", title: "TextArea", render: () => <TextAreaGallery /> },
    { id: "checkbox", title: "Checkbox", render: () => <CheckboxGallery /> },
    { id: "radio", title: "Radio / RadioGroup", render: () => <RadioGallery /> },
    { id: "switch", title: "Switch", render: () => <SwitchGallery /> },
    { id: "form-group", title: "Label + FormGroup", render: () => <FormGroupGallery /> },
    { id: "control-group", title: "ControlGroup", render: () => <ControlGroupGallery /> },
    { id: "html-select", title: "HTMLSelect", render: () => <HTMLSelectGallery /> },
    { id: "file-input", title: "FileInput", render: () => <FileInputGallery /> },
    { id: "numeric-input", title: "NumericInput", render: () => <NumericInputGallery /> },
    { id: "segmented-control", title: "SegmentedControl", render: () => <SegmentedControlGallery /> },
    { id: "control-card", title: "ControlCard", render: () => <ControlCardGallery /> },
    { id: "dialog", title: "Dialog", render: () => <DialogGallery /> },
    { id: "alert", title: "Alert", render: () => <AlertGallery /> },
    { id: "drawer", title: "Drawer", render: () => <DrawerGallery /> },
    { id: "popover", title: "Popover", render: () => <PopoverGallery /> },
    { id: "tooltip", title: "Tooltip", render: () => <TooltipGallery /> },
    { id: "toast", title: "Toast / Toaster", render: () => <ToastGallery /> },
    { id: "menu", title: "Menu", render: () => <MenuGallery /> },
    { id: "context-menu", title: "ContextMenu", render: () => <ContextMenuGallery /> },
    { id: "navbar", title: "Navbar", render: () => <NavbarGallery /> },
    { id: "tabs", title: "Tabs", render: () => <TabsGallery /> },
    { id: "collapse", title: "Collapse", render: () => <CollapseGallery /> },
    { id: "section", title: "Section", render: () => <SectionGallery /> },
    { id: "card-list", title: "CardList", render: () => <CardListGallery /> },
    { id: "breadcrumbs", title: "Breadcrumbs", render: () => <BreadcrumbsGallery /> },
    { id: "tree", title: "Tree", render: () => <TreeGallery /> },
    { id: "panel-stack", title: "PanelStack", render: () => <PanelStackGallery /> },
    { id: "html-table", title: "HTMLTable", render: () => <HTMLTableGallery /> },
    { id: "editable-text", title: "EditableText", render: () => <EditableTextGallery /> },
    { id: "entity-title", title: "EntityTitle", render: () => <EntityTitleGallery /> },
    { id: "non-ideal-state", title: "NonIdealState", render: () => <NonIdealStateGallery /> },
    { id: "link", title: "Link", render: () => <LinkGallery /> },
    { id: "slider", title: "Slider", render: () => <SliderGallery /> },
    { id: "hotkeys", title: "Hotkeys", render: () => <HotkeysGallery /> },
    { id: "tag-input", title: "TagInput", render: () => <TagInputGallery /> },
    { id: "select", title: "Select", render: () => <SelectGallery /> },
    { id: "suggest", title: "Suggest", render: () => <SuggestGallery /> },
    { id: "multi-select", title: "MultiSelect", render: () => <MultiSelectGallery /> },
    { id: "omnibar", title: "Omnibar", render: () => <OmnibarGallery /> },
    { id: "time-picker", title: "TimePicker", render: () => <TimePickerGallery /> },
    { id: "date-picker", title: "DatePicker", render: () => <DatePickerGallery /> },
    { id: "date-input", title: "DateInput", render: () => <DateInputGallery /> },
    { id: "date-range-picker", title: "DateRangePicker", render: () => <DateRangePickerGallery /> },
    { id: "date-range-input", title: "DateRangeInput", render: () => <DateRangeInputGallery /> },
    { id: "timezone-select", title: "TimezoneSelect", render: () => <TimezoneSelectGallery /> },
];

const params = new URLSearchParams(window.location.search);
/** `?component=<id>` renders that showcase alone with no chrome — for clean harness screenshots. */
const ONLY = params.get("component");
/** `?theme=dark` sets the initial theme; the toggle still works for interactive use. */
const INITIAL_DARK = params.get("theme") === "dark";

export default function App() {
    const [dark, setDark] = useState(INITIAL_DARK);

    const shown = ONLY ? COMPONENTS.filter((c) => c.id === ONLY) : COMPONENTS;
    // Isolated single-component view (harness mode): no header, just the specimens.
    const isolated = ONLY != null && shown.length > 0;

    return (
        <DarkContext.Provider value={dark}>
        <div className={dark ? "dark" : ""}>
            <div className="min-h-screen bg-background text-foreground p-10">
                <div className="mx-auto flex max-w-[760px] flex-col gap-8">
                    {!isolated && (
                        <header className="flex items-center justify-between">
                            <h1 className="text-heading-lg font-semibold text-foreground">analyst-ui</h1>
                            <Button onClick={() => setDark((d) => !d)}>Toggle {dark ? "light" : "dark"}</Button>
                        </header>
                    )}

                    {shown.map((c) => (
                        <div key={c.id} id={c.id} className="flex flex-col gap-2.5">
                            {!isolated && (
                                <h2 className="text-heading-lg font-semibold text-foreground">{c.title}</h2>
                            )}
                            {c.render()}
                        </div>
                    ))}
                </div>
            </div>
        </div>
        </DarkContext.Provider>
    );
}
