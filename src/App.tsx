import { ChevronDown, ExternalLink, Plus, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button, type ButtonIntent, type ButtonVariant } from "@/components/ui/button";
import { Card, type CardElevation } from "@/components/ui/card";
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
import { ProgressBar, type ProgressBarIntent } from "@/components/ui/progress-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner, SpinnerSize, type SpinnerIntent } from "@/components/ui/spinner";
import { Callout, type CalloutIntent } from "@/components/ui/callout";
import { Tag, type TagIntent } from "@/components/ui/tag";
import { Text } from "@/components/ui/text";

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
    );
}
