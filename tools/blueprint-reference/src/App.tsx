import { Alert, Alignment, AnchorButton, Breadcrumb as BpBreadcrumb, Breadcrumbs as BpBreadcrumbs, Button, ButtonGroup, Callout, Card, CardList as BpCardList, Checkbox, CheckboxCard, Classes, Collapse, ControlGroup, Dialog, DialogBody, DialogFooter, Divider, Drawer, DrawerSize, EditableText as BpEditableText, EntityTitle as BpEntityTitle, FileInput, FormGroup, H1, H2, H3, H4, H5, H6, Hotkey, Hotkeys, HTMLSelect, HTMLTable as BpHTMLTable, Icon, InputGroup, KeyComboTag, Label, Link as BpLink, Menu, MenuDivider, MenuItem, Navbar, NavbarDivider, NavbarGroup, NavbarHeading, NonIdealState as BpNonIdealState, NonIdealStateIconSize as BpNonIdealStateIconSize, NumericInput, PanelStack as BpPanelStack, type Panel as BpPanel, Popover, ProgressBar, Radio, RadioCard, RadioGroup, Section as BpSection, SectionCard as BpSectionCard, SegmentedControl, Slider as BpSlider, Spinner, SpinnerSize, Switch, SwitchCard, Tab, Tabs, Tag, TagInput as BpTagInput, Text, TextArea, Tooltip, Tree as BpTree, type ButtonVariant, type Intent, type TreeNodeInfo as BpTreeNodeInfo } from "@blueprintjs/core";
import { MultiSelect as BpMultiSelect, Omnibar as BpOmnibar, Select as BpSelect, Suggest as BpSuggest } from "@blueprintjs/select";
import { DateInput as BpDateInput, DatePicker as BpDatePicker, DateRangePicker as BpDateRangePicker, DateRangeInput as BpDateRangeInput, TimePicker as BpTimePicker, TimezoneSelect as BpTimezoneSelect } from "@blueprintjs/datetime";
import { useEffect, useRef, useState } from "react";

const VARIANTS: ButtonVariant[] = ["solid", "outlined", "minimal"];
const INTENTS: Intent[] = ["none", "primary", "success", "warning", "danger"];

function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 80, fontSize: 12, opacity: 0.6 }}>{label}</span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>{children}</div>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{title}</h2>
            {children}
        </section>
    );
}

/**
 * Blueprint reference for Button. The `data-compare="<key>"` keys MUST match the
 * analyst-ui gallery (src/App.tsx) one-for-one — the harness pairs specimens by key.
 */
function ButtonGallery() {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <Section title="Variant × Intent">
                {VARIANTS.map((variant) => (
                    <Row key={variant} label={variant}>
                        {INTENTS.map((intent) => (
                            <Button
                                key={intent}
                                variant={variant}
                                intent={intent}
                                text={intent}
                                data-compare={`btn-${variant}-${intent}`}
                            />
                        ))}
                    </Row>
                ))}
            </Section>

            <Section title="Sizes (solid / primary)">
                <Row label="">
                    <Button size="small" intent="primary" text="Small" data-compare="btn-size-small" />
                    <Button size="medium" intent="primary" text="Medium" data-compare="btn-size-medium" />
                    <Button size="large" intent="primary" text="Large" data-compare="btn-size-large" />
                </Row>
            </Section>

            <Section title="States (solid / primary)">
                <Row label="">
                    <Button intent="primary" text="Default" />
                    <Button intent="primary" text="Disabled" disabled={true} />
                    <Button intent="primary" text="Loading" loading={true} />
                    <Button intent="primary" text="Active" active={true} />
                </Row>
            </Section>

            <Section title="With icons">
                <Row label="">
                    <Button icon="add" aria-label="Add" />
                    <Button icon="add" text="Start icon" intent="primary" />
                    <Button endIcon="share" text="End icon" intent="primary" />
                    <Button icon="cog" endIcon="caret-down" text="Both" />
                </Row>
            </Section>

            <Section title="Fill">
                <Button fill={true} intent="primary" text="Fill button" />
            </Section>
        </div>
    );
}

/**
 * Blueprint reference for ButtonGroup. `data-compare` keys MUST match analyst-ui's
 * gallery (src/App.tsx) one-for-one — the harness pairs specimens by key.
 */
function ButtonGroupGallery() {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <Section title="Solid (horizontal)">
                <ButtonGroup data-compare="bg-solid-container">
                    <Button text="First" data-compare="bg-solid-first" />
                    <Button text="Middle" data-compare="bg-solid-mid" />
                    <Button text="Last" data-compare="bg-solid-last" />
                </ButtonGroup>
            </Section>

            <Section title="Outlined (horizontal)">
                <ButtonGroup variant="outlined" data-compare="bg-outlined-container">
                    <Button text="First" data-compare="bg-outlined-first" />
                    <Button text="Middle" data-compare="bg-outlined-mid" />
                    <Button text="Last" data-compare="bg-outlined-last" />
                </ButtonGroup>
            </Section>

            <Section title="Minimal (horizontal)">
                <ButtonGroup variant="minimal">
                    <Button text="First" />
                    <Button text="Middle" />
                    <Button text="Last" />
                </ButtonGroup>
            </Section>

            <Section title="Vertical (solid)">
                <ButtonGroup vertical={true} data-compare="bg-vert-container">
                    <Button text="First" data-compare="bg-vert-first" />
                    <Button text="Middle" data-compare="bg-vert-mid" />
                    <Button text="Last" data-compare="bg-vert-last" />
                </ButtonGroup>
            </Section>

            <Section title="Intents (per-button)">
                <ButtonGroup>
                    <Button intent="primary" text="Save" />
                    <Button intent="success" text="Apply" />
                    <Button intent="danger" text="Delete" />
                </ButtonGroup>
            </Section>

            <Section title="With icons + size (group-level)">
                <ButtonGroup size="large">
                    <Button icon="chevron-left" aria-label="Previous" />
                    <Button text="Center" />
                    <Button endIcon="chevron-right" text="Next" />
                </ButtonGroup>
            </Section>

            <Section title="Fill">
                <ButtonGroup fill={true} data-compare="bg-fill-container">
                    <Button text="Left" />
                    <Button text="Center" />
                    <Button text="Right" />
                </ButtonGroup>
            </Section>
        </div>
    );
}

/**
 * Blueprint reference for Card. `data-compare` keys MUST match analyst-ui's gallery.
 * Compared cards use a fixed box so the diff targets card chrome, not content height.
 * Blueprint shows the selection ring only on an interactive + selected card.
 */
function CardGallery() {
    const box: React.CSSProperties = { width: 220, height: 96 };
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <Section title="Elevation (0–4)">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
                    {([0, 1, 2, 3, 4] as const).map((e) => (
                        <Card key={e} elevation={e} style={box} data-compare={`card-elevation-${e}`}>
                            Elevation {e}
                        </Card>
                    ))}
                </div>
            </Section>

            <Section title="Interactive / selected / compact">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
                    <Card interactive={true} style={box}>
                        Interactive (hover to raise)
                    </Card>
                    <Card interactive={true} selected={true} style={box} data-compare="card-selected">
                        Selected
                    </Card>
                    <Card compact={true} style={box} data-compare="card-compact">
                        Compact (16px padding)
                    </Card>
                </div>
            </Section>
        </div>
    );
}

/**
 * Blueprint reference for AnchorButton. `data-compare` keys MUST match analyst-ui's
 * gallery (src/App.tsx) one-for-one — the harness pairs specimens by key.
 */
function AnchorButtonGallery() {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <Section title="Variant × Intent">
                {VARIANTS.map((variant) => (
                    <Row key={variant} label={variant}>
                        {INTENTS.map((intent) => (
                            <AnchorButton
                                key={intent}
                                href="#"
                                variant={variant}
                                intent={intent}
                                text={intent}
                                data-compare={`anchorbtn-${variant}-${intent}`}
                            />
                        ))}
                    </Row>
                ))}
            </Section>

            <Section title="States (solid / primary)">
                <Row label="">
                    <AnchorButton href="#" intent="primary" text="Default" data-compare="anchorbtn-solid" />
                    <AnchorButton href="#" intent="primary" text="Disabled" disabled={true} data-compare="anchorbtn-disabled" />
                    <AnchorButton href="#" intent="primary" text="Loading" loading={true} />
                    <AnchorButton href="#" intent="primary" text="Active" active={true} />
                </Row>
            </Section>

            <Section title="With icons">
                <Row label="">
                    <AnchorButton href="#" icon="add" text="Start icon" intent="primary" data-compare="anchorbtn-icon" />
                    <AnchorButton href="#" endIcon="share" text="End icon" intent="primary" />
                </Row>
            </Section>
        </div>
    );
}

const ICON_INTENTS: Intent[] = ["none", "primary", "success", "warning", "danger"];

/**
 * Blueprint reference for Icon. `data-compare` keys MUST match analyst-ui's gallery.
 * Blueprint's Icon wraps a <span> + <svg>; intent sets fill color via CSS class.
 */
function IconGallery() {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <Section title="Default (16px)">
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
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
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
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

/**
 * Blueprint reference for Text. Uses Blueprint's canonical typography classes.
 * `data-compare` keys MUST match analyst-ui's TextGallery one-for-one.
 *
 * Blueprint body/muted/disabled/large/small: class-based (no Text component needed).
 * Blueprint headings: h1–h6 with .bp6-heading class.
 * Blueprint ellipsize: <Text ellipsize> component.
 * Content and widths must be identical to analyst-ui side.
 */
function TextGallery() {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <Section title="Body tiers">
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {/* Default Blueprint body text: inherits from bp6-ui-text on body */}
                    <div data-compare="text-body">
                        Body text — the default Blueprint body style (14px / 1.28581 / 400).
                    </div>
                    {/* bp6-text-large */}
                    <div className={Classes.TEXT_LARGE} data-compare="text-large">
                        Large text — bp6-text-large (16px / 1.28581 / 400).
                    </div>
                    {/* bp6-text-small */}
                    <div className={Classes.TEXT_SMALL} data-compare="text-small">
                        Small text — bp6-text-small (12px / 1.28581 / 400).
                    </div>
                </div>
            </Section>

            <Section title="Color modifiers">
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {/* bp6-text-muted */}
                    <div className={Classes.TEXT_MUTED} data-compare="text-muted">
                        Muted text — bp6-text-muted (gray-1 / gray-4).
                    </div>
                    {/* bp6-text-disabled */}
                    <div className={Classes.TEXT_DISABLED} data-compare="text-disabled">
                        Disabled text — bp6-text-disabled (gray-1@60% / gray-4@60%).
                    </div>
                </div>
            </Section>

            <Section title="Monospace / code">
                {/* bp6-monospace-text — renders as a div with monospace font */}
                <div className={Classes.MONOSPACE_TEXT} data-compare="text-code">
                    monospace code text — bp6-monospace-text (font-family: monospace).
                </div>
            </Section>

            <Section title="Headings (h1–h6)">
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    <h1 className={Classes.HEADING} data-compare="text-heading-1">Heading 1 (36px / 40px)</h1>
                    <h2 className={Classes.HEADING} data-compare="text-heading-2">Heading 2 (28px / 32px)</h2>
                    <h3 className={Classes.HEADING} data-compare="text-heading-3">Heading 3 (22px / 25px)</h3>
                    <h4 className={Classes.HEADING} data-compare="text-heading-4">Heading 4 (18px / 21px)</h4>
                    <h5 className={Classes.HEADING} data-compare="text-heading-5">Heading 5 (16px / 19px)</h5>
                    <h6 className={Classes.HEADING} data-compare="text-heading-6">Heading 6 (14px / 16px)</h6>
                </div>
            </Section>

            <Section title="Ellipsize">
                {/* Fixed width so overflow triggers identically on both sides */}
                <Text ellipsize={true} style={{ width: 200 }} data-compare="text-ellipsize">
                    This text is long enough to overflow and be truncated with an ellipsis.
                </Text>
            </Section>
        </div>
    );
}

/**
 * Blueprint reference for Divider. `data-compare` keys MUST match analyst-ui's DividerGallery.
 * Container layout (flexDirection, height, width) MUST be identical to the analyst side.
 * Blueprint's bp6-divider: border-bottom + border-right 1px solid rgba(black,0.15);
 * margin: 10px; dark: rgba(white,0.2). compact: margin 0.
 */
function DividerGallery() {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Horizontal (flex-column container)</h2>
                <div style={{ display: "flex", flexDirection: "column", width: 200 }}>
                    <div>Above</div>
                    <Divider data-compare="divider-default" />
                    <div>Below</div>
                </div>
            </section>

            <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Vertical (flex-row container)</h2>
                <div style={{ display: "flex", flexDirection: "row", alignItems: "stretch", height: 32 }}>
                    <div>Left</div>
                    <Divider data-compare="divider-vertical" />
                    <div>Right</div>
                </div>
            </section>

            <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Compact (no margin)</h2>
                <div style={{ display: "flex", flexDirection: "column", width: 200 }}>
                    <div>Above</div>
                    <Divider compact={true} data-compare="divider-compact" />
                    <div>Below</div>
                </div>
            </section>
        </div>
    );
}

/**
 * Blueprint Spinner reference gallery.
 *
 * Blueprint's Spinner doesn't expose data-* props for internal path elements, so
 * we use useRef + useEffect to add data-compare to the track/head paths after mount.
 * The harness runs after networkidle, so the attributes will be present.
 *
 * Value=0.5 on all compared specimens (50% arc → dashoffset=140). Keys must match
 * analyst-ui's SpinnerGallery exactly.
 */
const BP_SPINNER_INTENTS: Intent[] = ["primary", "success", "warning", "danger"];

function TaggedSpinner({
    size,
    value,
    intent,
    trackKey,
    headKey,
}: {
    size?: number;
    value?: number;
    intent?: Intent;
    trackKey?: string;
    headKey?: string;
}) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!ref.current) return;
        const track = ref.current.querySelector(".bp6-spinner-track");
        const head = ref.current.querySelector(".bp6-spinner-head");
        if (track && trackKey) track.setAttribute("data-compare", trackKey);
        if (head && headKey) head.setAttribute("data-compare", headKey);
    });
    return (
        <div ref={ref}>
            <Spinner size={size} value={value} intent={intent} />
        </div>
    );
}

function SpinnerGallery() {
    const VALUE = 0.5;
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Sizes (determinate, value=0.5)</h2>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 24 }}>
                    <TaggedSpinner
                        size={SpinnerSize.SMALL}
                        value={VALUE}
                        trackKey="spinner-sm-track"
                        headKey="spinner-sm-head"
                    />
                    <TaggedSpinner
                        size={SpinnerSize.STANDARD}
                        value={VALUE}
                        trackKey="spinner-std-track"
                        headKey="spinner-std-head"
                    />
                    <TaggedSpinner
                        size={SpinnerSize.LARGE}
                        value={VALUE}
                        headKey="spinner-lg-head"
                    />
                </div>
            </section>

            <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Intents (standard, value=0.5)</h2>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 24 }}>
                    {BP_SPINNER_INTENTS.map((intent) => (
                        <TaggedSpinner
                            key={intent}
                            size={SpinnerSize.STANDARD}
                            value={VALUE}
                            intent={intent}
                            headKey={`spinner-${intent}-head`}
                        />
                    ))}
                </div>
            </section>

            <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Indeterminate (visual only — not diff&apos;d)</h2>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 24 }}>
                    <Spinner size={SpinnerSize.SMALL} />
                    <Spinner size={SpinnerSize.STANDARD} />
                    <Spinner size={SpinnerSize.LARGE} />
                </div>
            </section>
        </div>
    );
}

/**
 * Blueprint ProgressBar reference gallery.
 *
 * Blueprint's ProgressBar doesn't expose data-* props for internal meter/track elements,
 * so we use useRef + useEffect to add data-compare to the track (.bp6-progress-bar) and
 * meter (.bp6-progress-meter) after mount. The harness runs after networkidle.
 *
 * Value=0.6 on intent specimens, 0.5/0.25/0.75 on default specimens.
 * All are wrapped in 200px containers to match analyst-ui side exactly.
 * Keys must match analyst-ui's ProgressBarGallery exactly.
 */
const BP_PB_INTENTS: Intent[] = ["primary", "success", "warning", "danger"];

/**
 * Wraps Blueprint's ProgressBar and tags the track + meter divs via useEffect.
 * trackKey tags the outer .bp6-progress-bar; meterKey tags the inner .bp6-progress-meter.
 */
function TaggedProgressBar({
    value,
    intent,
    trackKey,
    meterKey,
}: {
    value?: number;
    intent?: Intent;
    trackKey?: string;
    meterKey?: string;
}) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!ref.current) return;
        // The track is the first child element (the .bp6-progress-bar div itself)
        const track = ref.current.querySelector(".bp6-progress-bar");
        const meter = ref.current.querySelector(".bp6-progress-meter");
        if (track && trackKey) track.setAttribute("data-compare", trackKey);
        if (meter && meterKey) meter.setAttribute("data-compare", meterKey);
    });
    return (
        <div ref={ref}>
            <ProgressBar value={value} intent={intent} />
        </div>
    );
}

function ProgressBarGallery() {
    const containerStyle: React.CSSProperties = { width: 200 };
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Default (determinate, fixed 200px)</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={containerStyle}>
                        <TaggedProgressBar value={0.5} trackKey="pb-track-50" meterKey="pb-meter-50" />
                    </div>
                    <div style={containerStyle}>
                        <TaggedProgressBar value={0.25} meterKey="pb-meter-25" />
                    </div>
                    <div style={containerStyle}>
                        <TaggedProgressBar value={0.75} meterKey="pb-meter-75" />
                    </div>
                </div>
            </section>

            <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Intent (value=0.6, fixed 200px)</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {BP_PB_INTENTS.map((intent) => (
                        <div key={intent} style={containerStyle}>
                            <TaggedProgressBar value={0.6} intent={intent} meterKey={`pb-meter-${intent}`} />
                        </div>
                    ))}
                </div>
            </section>

            <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>No stripes / no animation (visual only)</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 200 }}>
                    <ProgressBar value={0.4} stripes={false} />
                    <ProgressBar value={0.4} animate={false} />
                    <ProgressBar value={0.4} stripes={false} animate={false} />
                </div>
            </section>

            <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Indeterminate (visual only — not diff&apos;d)</h2>
                <div style={{ width: 200, display: "flex", flexDirection: "column", gap: 8 }}>
                    <ProgressBar />
                    <ProgressBar intent="primary" />
                </div>
            </section>
        </div>
    );
}

/**
 * Blueprint Skeleton reference gallery.
 *
 * Blueprint's skeleton is a CSS modifier class (.bp6-skeleton) applied to elements.
 * For the keyed diff specimens, we use animation:none inline so the background
 * is frozen at the start color (rgba(211,216,222,0.2)) — deterministically comparable.
 *
 * Keys match analyst-ui's SkeletonGallery exactly:
 *   skeleton-box  — 120×16px (h-4/w-[120px])
 *   skeleton-line — 200×12px (h-3/w-[200px])
 *
 * Blueprint skeleton colors (same in light and dark, no dark SCSS override):
 *   start = rgba($light-gray1, 0.2) = rgba(211, 216, 222, 0.2)
 *   end   = rgba($gray1, 0.2)       = rgba(95, 107, 124, 0.2)
 */
function SkeletonGallery() {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Static specimens (animation off — diff&apos;d)</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {/* skeleton-box: 120×16px, animation off for deterministic diff */}
                    <div
                        className="bp6-skeleton"
                        data-compare="skeleton-box"
                        style={{ width: 120, height: 16, animation: "none" }}
                    />
                    {/* skeleton-line: 200×12px, animation off for deterministic diff */}
                    <div
                        className="bp6-skeleton"
                        data-compare="skeleton-line"
                        style={{ width: 200, height: 12, animation: "none" }}
                    />
                </div>
            </section>

            <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Animated (visual only — not diff&apos;d)</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div className="bp6-skeleton" style={{ width: 200, height: 16 }} />
                    <div className="bp6-skeleton" style={{ width: 160, height: 16 }} />
                    <div className="bp6-skeleton" style={{ width: 120, height: 16 }} />
                </div>
            </section>

            <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Modifier pattern (existing elements skeletonized)</h2>
                {/* Blueprint canonical example: .bp6-card with skeletonized children */}
                <div className="bp6-card" style={{ width: 240, display: "flex", flexDirection: "column", gap: 8 }}>
                    <h5 className="bp6-heading bp6-skeleton" style={{ animation: "none" }}>Card heading</h5>
                    <p className="bp6-skeleton" style={{ animation: "none" }}>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    </p>
                    <button type="button" className="bp6-button bp6-skeleton" style={{ animation: "none" }}>
                        Submit
                    </button>
                </div>
            </section>
        </div>
    );
}

const TAG_INTENTS: Intent[] = ["none", "primary", "success", "warning", "danger"];

/**
 * Blueprint reference for Tag. `data-compare` keys MUST match analyst-ui's TagGallery.
 *
 * Blueprint's Tag doesn't forward data-* to the outer span, so we use useRef+useEffect
 * to set data-compare on the .bp6-tag element after mount — same pattern as TaggedSpinner.
 */
function TaggedTag({
    intent,
    minimal,
    size,
    round,
    icon,
    onRemove,
    dataCompare,
    children,
}: {
    intent?: Intent;
    minimal?: boolean;
    size?: "medium" | "large";
    round?: boolean;
    icon?: React.ReactElement;
    onRemove?: () => void;
    dataCompare: string;
    children?: React.ReactNode;
}) {
    const ref = useRef<HTMLSpanElement>(null);
    useEffect(() => {
        if (!ref.current) return;
        const tag = ref.current.querySelector(".bp6-tag");
        if (tag) tag.setAttribute("data-compare", dataCompare);
    });
    return (
        <span ref={ref}>
            <Tag intent={intent} minimal={minimal} size={size} round={round} icon={icon} onRemove={onRemove}>
                {children}
            </Tag>
        </span>
    );
}

function TagGallery() {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <Section title="Solid intents">
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                    {TAG_INTENTS.map((intent) => (
                        <TaggedTag key={intent} intent={intent} dataCompare={`tag-solid-${intent}`}>
                            {intent}
                        </TaggedTag>
                    ))}
                </div>
            </Section>

            <Section title="Minimal intents">
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                    {TAG_INTENTS.map((intent) => (
                        <TaggedTag key={intent} intent={intent} minimal dataCompare={`tag-minimal-${intent}`}>
                            {intent}
                        </TaggedTag>
                    ))}
                </div>
            </Section>

            <Section title="Large">
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                    <TaggedTag size="large" dataCompare="tag-large">Large tag</TaggedTag>
                    <Tag size="large" intent="primary">Large primary</Tag>
                    <Tag size="large" minimal intent="success">Large minimal</Tag>
                </div>
            </Section>

            <Section title="Round">
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                    <TaggedTag round dataCompare="tag-round">Round</TaggedTag>
                    <Tag round intent="primary">Round primary</Tag>
                    <Tag round size="large" intent="success">Round large</Tag>
                </div>
            </Section>

            <Section title="With icon">
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                    <TaggedTag icon={<Icon icon="tick" size={12} />} dataCompare="tag-icon">With icon</TaggedTag>
                    <Tag icon={<Icon icon="tick" size={12} />} intent="success">Success icon</Tag>
                    <Tag endIcon={<Icon icon="caret-down" size={12} />} intent="primary">End icon</Tag>
                </div>
            </Section>

            <Section title="Removable">
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                    <TaggedTag onRemove={() => {}} dataCompare="tag-removable">Removable</TaggedTag>
                    <Tag onRemove={() => {}} intent="primary">Primary removable</Tag>
                    <Tag onRemove={() => {}} size="large" intent="success">Large removable</Tag>
                </div>
            </Section>

            <Section title="Interactive">
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                    <Tag interactive>Interactive</Tag>
                    <Tag interactive intent="primary">Primary interactive</Tag>
                    <Tag interactive active intent="success">Active</Tag>
                </div>
            </Section>
        </div>
    );
}

const CALLOUT_INTENTS: Intent[] = ["none", "primary", "success", "warning", "danger"];

/**
 * Blueprint reference for Callout. `data-compare` keys MUST match analyst-ui's CalloutGallery.
 * Blueprint's Callout spreads htmlProps on the outer div, so data-compare is forwarded directly.
 * All keyed specimens use a fixed width of 320px identical to the analyst-ui side.
 *
 * The harness diffs: backgroundColor, color, paddingTop, paddingBottom, paddingLeft,
 * paddingRight, borderRadius, fontSize, lineHeight.
 */
function CalloutGallery() {
    const w: React.CSSProperties = { width: 320 };
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <Section title="Intent (with default icon + title + body)">
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
                    compact={true}
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
                    minimal={true}
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

const IG_INTENTS: Intent[] = ["none", "primary", "success", "warning", "danger"];

/**
 * Blueprint reference for InputGroup. `data-compare` keys MUST match analyst-ui's InputGroupGallery.
 * Blueprint's InputGroup wraps an <input> inside a div; data-compare must go on the <input>
 * (the .bp6-input element). Blueprint does not directly forward arbitrary props to the inner input,
 * so we use a ref + useEffect approach to add the data-compare attribute after mount.
 *
 * Fixed width of 200px on all specimens (identical to analyst-ui side).
 */

/** Helper: attaches data-compare to the first .bp6-input inside a wrapper ref. */
function useInputCompare(
    wrapperRef: React.RefObject<HTMLDivElement | null>,
    key: string,
) {
    useEffect(() => {
        const input = wrapperRef.current?.querySelector(".bp6-input");
        if (input) input.setAttribute("data-compare", key);
    }, [wrapperRef, key]);
}

function InputGroupGallery() {
    const w: React.CSSProperties = { width: 200 };

    const smRef = useRef<HTMLDivElement>(null);
    const mdRef = useRef<HTMLDivElement>(null);
    const lgRef = useRef<HTMLDivElement>(null);
    const noneRef = useRef<HTMLDivElement>(null);
    const primaryRef = useRef<HTMLDivElement>(null);
    const successRef = useRef<HTMLDivElement>(null);
    const warningRef = useRef<HTMLDivElement>(null);
    const dangerRef = useRef<HTMLDivElement>(null);
    const roundRef = useRef<HTMLDivElement>(null);
    const disabledRef = useRef<HTMLDivElement>(null);
    const leftIconRef = useRef<HTMLDivElement>(null);
    const rightElRef = useRef<HTMLDivElement>(null);

    useInputCompare(smRef, "ig-small");
    useInputCompare(mdRef, "ig-medium");
    useInputCompare(lgRef, "ig-large");
    useInputCompare(noneRef, "ig-intent-none");
    useInputCompare(primaryRef, "ig-intent-primary");
    useInputCompare(successRef, "ig-intent-success");
    useInputCompare(warningRef, "ig-intent-warning");
    useInputCompare(dangerRef, "ig-intent-danger");
    useInputCompare(roundRef, "ig-round");
    useInputCompare(disabledRef, "ig-disabled");
    useInputCompare(leftIconRef, "ig-left-icon");
    useInputCompare(rightElRef, "ig-right-element");

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <Section title="Sizes">
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div ref={smRef}><InputGroup size="small" placeholder="Small (24px)" style={w} /></div>
                    <div ref={mdRef}><InputGroup size="medium" placeholder="Medium (30px)" style={w} /></div>
                    <div ref={lgRef}><InputGroup size="large" placeholder="Large (40px)" style={w} /></div>
                </div>
            </Section>

            <Section title="Intent">
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div ref={noneRef}><InputGroup intent="none" placeholder="none intent" style={w} /></div>
                    <div ref={primaryRef}><InputGroup intent="primary" placeholder="primary intent" style={w} /></div>
                    <div ref={successRef}><InputGroup intent="success" placeholder="success intent" style={w} /></div>
                    <div ref={warningRef}><InputGroup intent="warning" placeholder="warning intent" style={w} /></div>
                    <div ref={dangerRef}><InputGroup intent="danger" placeholder="danger intent" style={w} /></div>
                </div>
            </Section>

            <Section title="Round">
                <div ref={roundRef}><InputGroup round={true} placeholder="Round input" style={w} /></div>
            </Section>

            <Section title="Disabled">
                <div ref={disabledRef}><InputGroup disabled={true} placeholder="Disabled input" style={w} /></div>
            </Section>

            <Section title="Left icon">
                <div ref={leftIconRef}><InputGroup leftIcon="search" placeholder="Search…" style={w} /></div>
            </Section>

            <Section title="Right element">
                <div ref={rightElRef}>
                    <InputGroup
                        placeholder="With right element"
                        style={w}
                        rightElement={
                            <Button minimal={true} small={true} aria-label="Clear" icon="cross" />
                        }
                    />
                </div>
            </Section>
        </div>
    );
}

const TA_INTENTS: Intent[] = ["none", "primary", "success", "warning", "danger"];

/**
 * Blueprint reference for TextArea. `data-compare` keys MUST match analyst-ui's TextAreaGallery.
 * Blueprint's TextArea renders a `<textarea class="bp6-input bp6-text-area">` directly,
 * so we can place data-compare directly on the component (it forwards to the textarea element).
 *
 * Fixed width of 240px and rows=3 on all specimens (identical to analyst-ui side).
 */
function TextAreaGallery() {
    const w: React.CSSProperties = { width: 240 };
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <Section title="Sizes">
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <TextArea size="medium" rows={3} placeholder="Medium (default)" style={w} data-compare="ta-medium" />
                    <TextArea size="small" rows={3} placeholder="Small" style={w} data-compare="ta-small" />
                    <TextArea size="large" rows={3} placeholder="Large" style={w} data-compare="ta-large" />
                </div>
            </Section>

            <Section title="Intent">
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
                <TextArea disabled={true} rows={3} placeholder="Disabled textarea" style={w} data-compare="ta-disabled" />
            </Section>

            <Section title="Fill">
                <TextArea fill={true} rows={3} placeholder="Fill textarea (full width)" />
            </Section>

            <Section title="Auto-resize (visual only)">
                <TextArea autoResize={true} placeholder="Type to auto-resize…" style={w} />
            </Section>
        </div>
    );
}

/**
 * Blueprint reference for Checkbox. `data-compare` keys MUST match analyst-ui's CheckboxGallery.
 * Blueprint's Checkbox renders `.bp6-control-indicator` inside the label. We use a ref +
 * querySelector to set data-compare on the indicator span (same pattern as TaggedSpinner/Tag).
 *
 * The harness diffs: width, height, borderRadius, backgroundColor, boxShadow of the indicator.
 */
function TaggedCheckbox({
    dataCompare,
    ...props
}: { dataCompare: string } & React.ComponentProps<typeof Checkbox>) {
    const ref = useRef<HTMLLabelElement>(null);
    useEffect(() => {
        if (!ref.current) return;
        const indicator = ref.current.querySelector(".bp6-control-indicator");
        if (indicator) indicator.setAttribute("data-compare", dataCompare);
    }, [dataCompare]);
    return <Checkbox ref={ref} {...props} />;
}

function CheckboxGallery() {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <Section title="States">
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <TaggedCheckbox dataCompare="cb-unchecked" label="Unchecked" />
                    <TaggedCheckbox dataCompare="cb-checked" label="Checked" defaultChecked={true} />
                    <TaggedCheckbox dataCompare="cb-indeterminate" label="Indeterminate" indeterminate={true} />
                    <TaggedCheckbox dataCompare="cb-disabled" label="Disabled" disabled={true} />
                    <TaggedCheckbox dataCompare="cb-checked-disabled" label="Disabled checked" disabled={true} defaultChecked={true} />
                </div>
            </Section>

            {/* Whole-control specimens — data-compare on an inline-block wrapper so the
                per-specimen crop covers box + label (mirrors analyst-ui's CheckboxGallery). */}
            <Section title="Whole control (box + label)">
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 12 }}>
                    <span data-vcompare="cb-control-unchecked" style={{ display: "inline-block" }}>
                        <Checkbox label="Unchecked" />
                    </span>
                    <span data-vcompare="cb-control-checked" style={{ display: "inline-block" }}>
                        <Checkbox label="Checked" defaultChecked={true} />
                    </span>
                </div>
            </Section>

            <Section title="Large">
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <TaggedCheckbox dataCompare="cb-large" label="Large unchecked" large={true} />
                    <Checkbox label="Large checked" large={true} defaultChecked={true} />
                    <Checkbox label="Large indeterminate" large={true} indeterminate={true} />
                </div>
            </Section>

            <Section title="Inline">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                    <Checkbox label="Option A" inline={true} />
                    <Checkbox label="Option B" inline={true} defaultChecked={true} />
                    <Checkbox label="Option C" inline={true} />
                </div>
            </Section>

            <Section title="Align right">
                <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 192 }}>
                    <Checkbox label="Right aligned" alignIndicator="right" />
                    <Checkbox label="Right checked" alignIndicator="right" defaultChecked={true} />
                </div>
            </Section>
        </div>
    );
}

/**
 * Blueprint reference for Radio + RadioGroup.
 * Blueprint's Radio renders `.bp6-control-indicator` inside the label.
 * We use a ref + querySelector to set data-compare on the indicator span
 * (same pattern as TaggedCheckbox).
 *
 * The harness diffs: width, height, borderRadius, backgroundColor, boxShadow of the indicator.
 * Keys MUST match analyst-ui's RadioGallery exactly.
 */
function TaggedRadio({
    dataCompare,
    ...props
}: { dataCompare: string } & React.ComponentProps<typeof Radio>) {
    const ref = useRef<HTMLLabelElement>(null);
    useEffect(() => {
        if (!ref.current) return;
        const indicator = ref.current.querySelector(".bp6-control-indicator");
        if (indicator) indicator.setAttribute("data-compare", dataCompare);
    }, [dataCompare]);
    return <Radio ref={ref} {...props} />;
}

function RadioGallery() {
    const [groupValue, setGroupValue] = useState<string>("option-b");

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <Section title="States">
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <TaggedRadio dataCompare="radio-unchecked" label="Unchecked" name="radio-states" value="unchecked" />
                    <TaggedRadio dataCompare="radio-checked" label="Checked" name="radio-states" value="checked" defaultChecked={true} />
                    <TaggedRadio dataCompare="radio-disabled" label="Disabled" name="radio-disabled-states" value="disabled" disabled={true} />
                    <TaggedRadio dataCompare="radio-checked-disabled" label="Disabled checked" name="radio-disabled-states" value="disabled-checked" disabled={true} defaultChecked={true} />
                </div>
            </Section>

            <Section title="Large">
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <TaggedRadio dataCompare="radio-large" label="Large unchecked" name="radio-large" value="large-unchecked" large={true} />
                    <Radio label="Large checked" name="radio-large" value="large-checked" large={true} defaultChecked={true} />
                </div>
            </Section>

            <Section title="RadioGroup via options (controlled)">
                <RadioGroup
                    name="radio-group-opts"
                    selectedValue={groupValue}
                    onChange={(e) => setGroupValue(e.currentTarget.value)}
                    label="Pick one"
                    options={[
                        { value: "option-a", label: "Option A" },
                        { value: "option-b", label: "Option B (default selected)" },
                        { value: "option-c", label: "Option C" },
                    ]}
                />
            </Section>

            <Section title="RadioGroup via children">
                <RadioGroup name="radio-group-children" selectedValue={groupValue} onChange={(e) => setGroupValue(e.currentTarget.value)}>
                    <TaggedRadio dataCompare="radio-group-selected" value="option-a" label="Option A" />
                    <Radio value="option-b" label="Option B (selected when groupValue=option-b)" />
                    <Radio value="option-c" label="Option C" />
                </RadioGroup>
            </Section>

            <Section title="Inline">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                    <Radio label="Option A" name="radio-inline" value="a" inline={true} />
                    <Radio label="Option B" name="radio-inline" value="b" inline={true} defaultChecked={true} />
                    <Radio label="Option C" name="radio-inline" value="c" inline={true} />
                </div>
            </Section>
        </div>
    );
}

/**
 * Blueprint reference for Switch.
 * Blueprint's Switch renders `.bp6-control-indicator` inside the label.
 * We use a ref + querySelector to set data-compare on the indicator span
 * (same pattern as TaggedCheckbox / TaggedRadio).
 *
 * The harness diffs: backgroundColor, borderRadius, height, minWidth, boxShadow, color.
 * Keys MUST match analyst-ui's SwitchGallery exactly.
 */
function TaggedSwitch({
    dataCompare,
    ...props
}: { dataCompare: string } & React.ComponentProps<typeof Switch>) {
    const ref = useRef<HTMLLabelElement>(null);
    useEffect(() => {
        if (!ref.current) return;
        const indicator = ref.current.querySelector(".bp6-control-indicator");
        if (indicator) indicator.setAttribute("data-compare", dataCompare);
    }, [dataCompare]);
    return <Switch ref={ref} {...props} />;
}

function SwitchGallery() {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <Section title="States">
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <TaggedSwitch dataCompare="switch-unchecked" label="Unchecked" />
                    <TaggedSwitch dataCompare="switch-checked" label="Checked" defaultChecked={true} />
                    <TaggedSwitch dataCompare="switch-disabled" label="Disabled" disabled={true} />
                    <TaggedSwitch dataCompare="switch-checked-disabled" label="Disabled checked" disabled={true} defaultChecked={true} />
                </div>
            </Section>

            <Section title="Large">
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <TaggedSwitch dataCompare="switch-large" label="Large unchecked" large={true} />
                    <Switch label="Large checked" large={true} defaultChecked={true} />
                </div>
            </Section>

            <Section title="Inner labels">
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <TaggedSwitch dataCompare="switch-inner-labels" label="With inner labels" innerLabel="OFF" innerLabelChecked="ON" />
                    <Switch label="Checked with inner labels" innerLabel="OFF" innerLabelChecked="ON" defaultChecked={true} />
                </div>
            </Section>

            <Section title="Inline">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                    <Switch label="Option A" inline={true} />
                    <Switch label="Option B" inline={true} defaultChecked={true} />
                    <Switch label="Option C" inline={true} disabled={true} />
                </div>
            </Section>
        </div>
    );
}

// ─── Helpers to attach data-compare to Blueprint's inner elements ────────────

/** Attach data-compare to a Blueprint Label's root label element. */
function TaggedLabel({ dataCompare, ...props }: { dataCompare: string } & React.ComponentProps<typeof Label>) {
    const ref = useRef<HTMLLabelElement>(null);
    useEffect(() => {
        if (ref.current) ref.current.setAttribute("data-compare", dataCompare);
    }, [dataCompare]);
    return <Label ref={ref} {...props} />;
}

/** Attach data-compare to a specific inner element (by selector) inside a FormGroup wrapper.
 *  Blueprint's FormGroup is a plain FC (no ref), so we wrap it in a div for DOM access. */
function TaggedFormGroup({
    dataCompare,
    targetClass,
    children,
    ...props
}: {
    dataCompare: string;
    targetClass: string;
} & React.ComponentProps<typeof FormGroup>) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (ref.current) {
            const el = ref.current.querySelector("." + targetClass);
            if (el) el.setAttribute("data-compare", dataCompare);
        }
    }, [dataCompare, targetClass]);
    return (
        <div ref={ref}>
            <FormGroup {...props}>{children}</FormGroup>
        </div>
    );
}

const FG_INTENTS: Intent[] = ["none", "primary", "success", "warning", "danger"];

/**
 * Blueprint reference for FormGroup + Label. data-compare keys MUST match analyst-ui gallery.
 */
function FormGroupGallery() {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <Section title="Standalone Label">
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    {/* fg-label: the label element (margin-bottom 16px, color foreground) */}
                    <TaggedLabel htmlFor="fg-label-input" dataCompare="fg-label">
                        Label text <span className={Classes.TEXT_MUTED} data-compare="fg-label-info">(optional)</span>
                    </TaggedLabel>
                    <input id="fg-label-input" type="text" style={{ border: "1px solid #ccc", padding: "4px 8px" }} placeholder="Input" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    <Label disabled={true}>
                        Disabled label
                        <span className={Classes.TEXT_MUTED}>(optional)</span>
                    </Label>
                </div>
            </Section>

            <Section title="Basic FormGroup">
                {/* fg-basic: the in-group label element (margin-bottom 4px — overrides standalone 16px) */}
                <TaggedFormGroup
                    label="Full name"
                    labelFor="fg-basic-input"
                    helperText="Please enter your full name."
                    labelInfo="(required)"
                    dataCompare="fg-basic"
                    targetClass={Classes.LABEL}
                >
                    <input id="fg-basic-input" type="text" style={{ width: "100%", border: "1px solid #ccc", padding: "4px 8px" }} placeholder="Input" />
                </TaggedFormGroup>
            </Section>

            <Section title="Sub-label">
                {/* fg-sublabel: the sub-label div — color muted, fontSize 12px, marginBottom 4px */}
                <TaggedFormGroup
                    label="Username"
                    labelFor="fg-sublabel-input"
                    subLabel="Must be 3–20 characters."
                    helperText="Check availability first."
                    dataCompare="fg-sublabel"
                    targetClass={Classes.FORM_GROUP_SUB_LABEL}
                >
                    <input id="fg-sublabel-input" type="text" style={{ width: "100%", border: "1px solid #ccc", padding: "4px 8px" }} placeholder="Input" />
                </TaggedFormGroup>
            </Section>

            <Section title="Intents (helper text color)">
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {FG_INTENTS.map((intent) => (
                        <div key={intent}>
                            {intent === "danger" ? (
                                // fg-intent-danger: the helper text div — color = danger intent text
                                <TaggedFormGroup
                                    label={`Intent: ${intent}`}
                                    intent={intent}
                                    helperText={`Helper text for intent ${intent}.`}
                                    dataCompare="fg-intent-danger"
                                    targetClass={Classes.FORM_HELPER_TEXT}
                                >
                                    <input type="text" style={{ width: "100%", border: "1px solid #ccc", padding: "4px 8px" }} placeholder="Input" />
                                </TaggedFormGroup>
                            ) : (
                                <FormGroup
                                    label={`Intent: ${intent}`}
                                    intent={intent}
                                    helperText={`Helper text for intent ${intent}.`}
                                >
                                    <input type="text" style={{ width: "100%", border: "1px solid #ccc", padding: "4px 8px" }} placeholder="Input" />
                                </FormGroup>
                            )}
                        </div>
                    ))}
                </div>
            </Section>

            <Section title="Inline">
                {/* fg-inline: the label inside inline FormGroup — lineHeight 30px, marginRight 12px */}
                <TaggedFormGroup
                    label="Inline label"
                    labelFor="fg-inline-input"
                    inline={true}
                    helperText="Helper below."
                    dataCompare="fg-inline"
                    targetClass={Classes.LABEL}
                >
                    <input id="fg-inline-input" type="text" style={{ border: "1px solid #ccc", padding: "4px 8px" }} placeholder="Input" />
                </TaggedFormGroup>
            </Section>

            <Section title="Disabled">
                {/* fg-disabled: the helper text in disabled FormGroup — color = disabled */}
                <TaggedFormGroup
                    label="Disabled group"
                    labelFor="fg-disabled-input"
                    helperText="Helper text (disabled)."
                    disabled={true}
                    dataCompare="fg-disabled"
                    targetClass={Classes.FORM_HELPER_TEXT}
                >
                    <input id="fg-disabled-input" type="text" disabled={true} style={{ width: "100%", border: "1px solid #ccc", padding: "4px 8px", opacity: 0.5 }} placeholder="Input" />
                </TaggedFormGroup>
            </Section>

            <Section title="Fill">
                <FormGroup label="Full width" fill={true} helperText="Fills container.">
                    <input type="text" style={{ width: "100%", border: "1px solid #ccc", padding: "4px 8px" }} placeholder="Input" />
                </FormGroup>
            </Section>
        </div>
    );
}

/**
 * Blueprint reference for ControlGroup. `data-compare` is on the group div directly
 * (Blueprint's ControlGroup accepts and forwards HTML div props, so data-compare goes
 * straight to the root .bp6-control-group div). Keys MUST match analyst-ui gallery.
 *
 * Specimens:
 *   cg-horizontal — InputGroup + Button in a row
 *   cg-vertical   — two InputGroups stacked
 *   cg-fill       — fill group (width:100%)
 *   cg-fill-child — first child of fill group (flex-grow:1)
 */
function ControlGroupGallery() {
    // Stamp data-compare on the first child of the fill group via ref.
    const fillGroupRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (fillGroupRef.current) {
            // Blueprint's ControlGroup renders a div.bp6-control-group; children are direct.
            const firstChild = fillGroupRef.current.firstElementChild;
            if (firstChild) {
                firstChild.setAttribute("data-compare", "cg-fill-child");
                firstChild.setAttribute("data-compare-flex", "");
            }
        }
    }, []);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <Section title="Horizontal (default)">
                {/* cg-horizontal: data-compare-flex triggers flex layout diff (display/flexDirection/alignItems) */}
                <ControlGroup data-compare="cg-horizontal" data-compare-flex="">
                    <InputGroup placeholder="Search…" style={{ width: 180 }} />
                    <Button text="Go" />
                </ControlGroup>
            </Section>

            <Section title="Vertical">
                {/* cg-vertical: flexDirection:column */}
                <ControlGroup vertical={true} data-compare="cg-vertical" data-compare-flex="" style={{ width: 200 }}>
                    <InputGroup placeholder="Username" />
                    <InputGroup placeholder="Password" type="password" />
                </ControlGroup>
            </Section>

            <Section title="Fill">
                {/* cg-fill: width:100%, children flex-grow */}
                <ControlGroup fill={true} ref={fillGroupRef} data-compare="cg-fill" data-compare-flex="">
                    <InputGroup placeholder="Search…" />
                    <Button text="Go" />
                </ControlGroup>
            </Section>

            <Section title="Intent / composition">
                <ControlGroup>
                    <InputGroup placeholder="Enter value…" intent="primary" style={{ width: 160 }} />
                    <Button text="Submit" intent="primary" />
                </ControlGroup>
            </Section>
        </div>
    );
}

/**
 * Blueprint reference for HTMLSelect. `data-compare` is placed on the `<select>`
 * element (the measured node inside .bp6-html-select). Blueprint's HTMLSelect
 * does NOT forward data-* to the inner select, so we use ref to stamp it.
 *
 * Specimens (keys must match analyst-ui gallery exactly):
 *   hs-default  — default (30px, solid, double-caret-vertical)
 *   hs-large    — large (40px, solid)
 *   hs-minimal  — minimal (no bg/shadow at rest)
 *   hs-disabled — disabled (muted bg, no shadow)
 *   hs-fill     — fill (width:100%)
 */
const HS_OPTIONS = ["Apple", "Banana", "Cherry", "Dragon Fruit"];

function HTMLSelectGallery() {
    const defaultRef = useRef<HTMLSelectElement>(null);
    const largeRef = useRef<HTMLSelectElement>(null);
    const minimalRef = useRef<HTMLSelectElement>(null);
    const disabledRef = useRef<HTMLSelectElement>(null);
    const fillRef = useRef<HTMLSelectElement>(null);

    useEffect(() => {
        defaultRef.current?.setAttribute("data-compare", "hs-default");
        largeRef.current?.setAttribute("data-compare", "hs-large");
        minimalRef.current?.setAttribute("data-compare", "hs-minimal");
        disabledRef.current?.setAttribute("data-compare", "hs-disabled");
        fillRef.current?.setAttribute("data-compare", "hs-fill");
    }, []);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <Section title="Default">
                <HTMLSelect ref={defaultRef} options={HS_OPTIONS} />
            </Section>

            <Section title="Large">
                <HTMLSelect ref={largeRef} large options={HS_OPTIONS} />
            </Section>

            <Section title="Minimal">
                <HTMLSelect ref={minimalRef} minimal options={HS_OPTIONS} />
            </Section>

            <Section title="Disabled">
                <HTMLSelect ref={disabledRef} disabled options={HS_OPTIONS} />
            </Section>

            <Section title="Fill">
                <div style={{ width: 280 }}>
                    <HTMLSelect ref={fillRef} fill options={HS_OPTIONS} />
                </div>
            </Section>
        </div>
    );
}

/**
 * Blueprint reference for FileInput. `data-compare` is placed on the
 * `.bp6-file-upload-input` span (the measured node — the visible text box).
 * Blueprint's FileInput doesn't accept data-* directly, so we use ref + querySelector.
 *
 * Specimens match analyst-ui FileInputGallery exactly (keys, text, size, fill, disabled):
 *   fi-default       — default (30px, "Choose file...", placeholder color)
 *   fi-has-selection — hasSelection=true, text="report.pdf" (foreground color)
 *   fi-large         — large (40px box)
 *   fi-disabled      — disabled (muted box + disabled Browse button)
 *   fi-fill          — fill (width:100%, 300px container)
 */
/**
 * Wrapper for Blueprint FileInput that stamps data-compare on the inner
 * .bp6-file-upload-input span via a container div ref. Blueprint's FileInput
 * is not a forwardRef component, so we wrap it in a div for DOM access.
 */
function TaggedFileInput({
    dataCompare,
    fill,
    ...props
}: { dataCompare: string } & React.ComponentProps<typeof FileInput>) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const span = ref.current?.querySelector(".bp6-file-upload-input");
        if (span) span.setAttribute("data-compare", dataCompare);
    });
    return (
        // Use block for fill specimens (so width:100% resolves against parent);
        // inline-block for non-fill (so the label doesn't stretch to container width).
        <div ref={ref} style={{ display: fill ? "block" : "inline-block" }}>
            <FileInput fill={fill} {...props} />
        </div>
    );
}

function FileInputGallery() {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <Section title="Default">
                <TaggedFileInput dataCompare="fi-default" />
            </Section>

            <Section title="Has Selection (report.pdf)">
                <TaggedFileInput dataCompare="fi-has-selection" hasSelection={true} text="report.pdf" />
            </Section>

            <Section title="Large">
                <TaggedFileInput dataCompare="fi-large" large={true} />
            </Section>

            <Section title="Disabled">
                <TaggedFileInput dataCompare="fi-disabled" disabled={true} />
            </Section>

            <Section title="Fill">
                <div style={{ width: 300 }}>
                    <TaggedFileInput dataCompare="fi-fill" fill={true} style={{ width: "100%" }} />
                </div>
            </Section>
        </div>
    );
}

/**
 * Blueprint reference for NumericInput. `data-compare` is placed on the `<input>` element
 * (Blueprint's `.bp6-input` inside the numeric input). Blueprint's NumericInput is a class
 * component; we use a container div + querySelector to stamp data-compare on inner elements.
 *
 * Specimens match analyst-ui NumericInputGallery exactly (keys, value, min, max, stepSize,
 * buttonPosition, large, fill, disabled, intent):
 *   ni-default        — value=5, medium (30px field), right buttons
 *   ni-large          — value=5, large (40px field)
 *   ni-disabled       — disabled
 *   ni-intent-primary — primary intent
 *   ni-buttons-left   — buttonPosition="left"
 *   ni-fill           — fill (full-width, 300px container)
 *   ni-step-button    — the increment stepper button (24px wide × ~14px)
 */

/**
 * Helper that wraps Blueprint NumericInput and stamps data-compare on inner elements via ref.
 * innerKey → stamps on the .bp6-input (the field)
 * stepKey  → stamps on the first .bp6-button in the vertical button group
 */
function TaggedNumericInput({
    innerKey,
    stepKey,
    ...props
}: {
    innerKey?: string;
    stepKey?: string;
} & React.ComponentProps<typeof NumericInput>) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!ref.current) return;
        if (innerKey) {
            const input = ref.current.querySelector(".bp6-input");
            if (input) input.setAttribute("data-compare", innerKey);
        }
        if (stepKey) {
            // The stepper is a vertical button group; the first button is the increment button
            const btn = ref.current.querySelector(".bp6-button-group .bp6-button");
            if (btn) btn.setAttribute("data-compare", stepKey);
        }
    });
    return (
        <div ref={ref}>
            <NumericInput {...props} />
        </div>
    );
}

const NI_INTENTS: Intent[] = ["none", "primary", "success", "warning", "danger"];

function NumericInputGallery() {
    const [val, setVal] = useState<number>(5);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <Section title="Default (value=5, stepSize=1)">
                <TaggedNumericInput
                    value={val}
                    onValueChange={(num) => setVal(num)}
                    min={0}
                    max={100}
                    stepSize={1}
                    style={{ width: 120 }}
                    innerKey="ni-default"
                    stepKey="ni-step-button"
                />
            </Section>

            <Section title="Large">
                <TaggedNumericInput
                    defaultValue={5}
                    large={true}
                    min={0}
                    max={100}
                    style={{ width: 140 }}
                    innerKey="ni-large"
                />
            </Section>

            <Section title="Disabled">
                <TaggedNumericInput
                    defaultValue={5}
                    disabled={true}
                    style={{ width: 120 }}
                    innerKey="ni-disabled"
                />
            </Section>

            <Section title="Intent">
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {NI_INTENTS.map((intent) => (
                        <TaggedNumericInput
                            key={intent}
                            defaultValue={5}
                            intent={intent}
                            style={{ width: 120 }}
                            innerKey={intent === "primary" ? "ni-intent-primary" : undefined}
                        />
                    ))}
                </div>
            </Section>

            <Section title="Buttons left">
                <TaggedNumericInput
                    defaultValue={5}
                    buttonPosition="left"
                    style={{ width: 120 }}
                    innerKey="ni-buttons-left"
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
                    <TaggedNumericInput
                        defaultValue={5}
                        fill={true}
                        innerKey="ni-fill"
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
 * Blueprint reference for SegmentedControl. Keys MUST match analyst-ui's SegmentedControlGallery.
 *
 * Blueprint's SegmentedControl accepts data-* directly on the outer div (forwarded via htmlProps).
 * For inner buttons we use ref + useEffect to stamp data-compare via querySelector.
 *
 * sc-default        — track div (bg, padding, gap, radius), value="week" (middle selected)
 * sc-selected-segment — the selected (week) button: white/dark-gray5 bg, foreground text
 * sc-unselected-segment — an unselected (day) button: muted text, transparent bg
 * sc-large          — large size track
 * sc-intent-primary — selected button with intent="primary" (primary fill + white text)
 * sc-fill           — fill track
 * sc-disabled       — disabled track
 */
function SegmentedControlGallery() {
    const [val, setVal] = useState<string>("week");

    const defaultRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (defaultRef.current) {
            const buttons = defaultRef.current.querySelectorAll<HTMLButtonElement>("button");
            buttons[1]?.setAttribute("data-compare", "sc-selected-segment");
            buttons[0]?.setAttribute("data-compare", "sc-unselected-segment");
        }
    });

    const intentPrimaryRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (intentPrimaryRef.current) {
            const buttons = intentPrimaryRef.current.querySelectorAll<HTMLButtonElement>("button");
            buttons[1]?.setAttribute("data-compare", "sc-intent-primary");
        }
    });

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <Section title="Default (3 options, middle selected)">
                <div ref={defaultRef}>
                    <SegmentedControl
                        options={SC_OPTIONS_3}
                        value={val}
                        onValueChange={setVal}
                        data-compare="sc-default"
                    />
                </div>
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
                <div ref={intentPrimaryRef}>
                    <SegmentedControl
                        options={SC_OPTIONS_3}
                        defaultValue="week"
                        intent="primary"
                    />
                </div>
            </Section>

            <Section title="Fill">
                <SegmentedControl
                    options={SC_OPTIONS_3}
                    defaultValue="week"
                    fill={true}
                    data-compare="sc-fill"
                />
            </Section>

            <Section title="Disabled">
                <SegmentedControl
                    options={SC_OPTIONS_3}
                    defaultValue="week"
                    disabled={true}
                    data-compare="sc-disabled"
                />
            </Section>

            <Section title="Inline">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <SegmentedControl
                        options={SC_OPTIONS_3}
                        defaultValue="day"
                        inline={true}
                    />
                    <span style={{ fontSize: 12, opacity: 0.6 }}>inline</span>
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
 * Blueprint reference for ControlCard (CheckboxCard / RadioCard / SwitchCard).
 *
 * Blueprint's control card components DO forward data-* props to the root .bp6-card element,
 * so we can place data-compare directly on CheckboxCard/RadioCard/SwitchCard.
 *
 * Specimens (keys MUST match analyst-ui's ControlCardGallery exactly):
 *   cc-checkbox          — CheckboxCard unchecked, left-aligned indicator
 *   cc-checkbox-checked  — CheckboxCard defaultChecked=true → selected ring
 *   cc-radio             — RadioCard unchecked, right-aligned indicator
 *   cc-switch            — SwitchCard unchecked, right-aligned indicator
 *   cc-compact           — CheckboxCard compact=true (16px padding)
 *   cc-disabled          — CheckboxCard disabled=true
 *   cc-align-right       — CheckboxCard alignIndicator="right"
 *
 * The harness diffs: backgroundColor, boxShadow (selected ring), borderRadius, padding, color.
 * Fixed width 240px on all specimens (identical to analyst-ui side).
 */
function ControlCardGallery() {
    const cardStyle: React.CSSProperties = { width: 240 };
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <Section title="CheckboxCard (left-aligned, default)">
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <CheckboxCard
                        label="Unchecked option"
                        style={cardStyle}
                        data-compare="cc-checkbox"
                    />
                    <CheckboxCard
                        label="Checked option (selected ring)"
                        defaultChecked={true}
                        style={cardStyle}
                        data-compare="cc-checkbox-checked"
                    />
                </div>
            </Section>

            <Section title="RadioCard (right-aligned, default)">
                <RadioCard
                    label="Radio option"
                    value="opt1"
                    inputProps={{ name: "cc-radio-group" }}
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
                    compact={true}
                    style={cardStyle}
                    data-compare="cc-compact"
                />
            </Section>

            <Section title="Disabled">
                <CheckboxCard
                    label="Disabled option"
                    disabled={true}
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
                    defaultChecked={true}
                    style={cardStyle}
                />
            </Section>

            <Section title="showAsSelectedWhenChecked=false">
                <CheckboxCard
                    label="Checked but no selected ring"
                    defaultChecked={true}
                    showAsSelectedWhenChecked={false}
                    style={cardStyle}
                />
            </Section>
        </div>
    );
}

/**
 * Blueprint reference for Alert. Renders ONE alert open by default (isOpen={true}) for harness.
 *
 * Blueprint portals alert content to document.body. We use useEffect + querySelectorAll to
 * set data-compare attributes on the inner elements (panel, icon, footer, confirm, cancel) after
 * mount.
 *
 * Keys: alert-panel, alert-icon, alert-footer, alert-confirm, alert-cancel.
 * Must match analyst-ui AlertGallery exactly.
 *
 * Dark mode: pass portalClassName={Classes.DARK} when ?theme=dark so Blueprint's portal renders
 * dark (same fix as DialogGallery — see the ⚠️ ORCHESTRATOR REVIEW CORRECTION note in 0024).
 */
function AlertGallery() {
    const dark = new URLSearchParams(window.location.search).get("theme") === "dark";
    const containerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        function tag() {
            // Blueprint Alert portals to document.body; we need to find via document query
            // using the Classes constants. The alert body/footer/buttons are in the portaled DOM.
            const panel = document.querySelector(`.${Classes.ALERT}`);
            const body = panel?.querySelector(`.${Classes.ALERT_BODY}`);
            const iconEl = body?.querySelector(`.${Classes.ICON}`);
            const footer = panel?.querySelector(`.${Classes.ALERT_FOOTER}`);
            // In row-reverse footer: first child (DOM) is the confirm button (rightmost visually)
            const buttons = footer?.querySelectorAll<HTMLElement>("button");
            const confirmBtn = buttons?.[0]; // first in DOM = confirm (row-reverse makes it right)
            const cancelBtn = buttons?.[1];  // second in DOM = cancel

            if (panel) panel.setAttribute("data-compare", "alert-panel");
            if (iconEl) iconEl.setAttribute("data-compare", "alert-icon");
            if (footer) footer.setAttribute("data-compare", "alert-footer");
            if (confirmBtn) confirmBtn.setAttribute("data-compare", "alert-confirm");
            if (cancelBtn) cancelBtn.setAttribute("data-compare", "alert-cancel");
        }
        tag();
        const t = setTimeout(tag, 100);
        return () => clearTimeout(t);
    }, []);

    return (
        <div ref={containerRef} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontSize: 14, opacity: 0.6, margin: 0 }}>
                The alert below is open by default for comparison harness screenshots.
            </p>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <Alert
                isOpen={true}
                icon="warning-sign"
                intent="danger"
                confirmButtonText="Delete"
                cancelButtonText="Cancel"
                onConfirm={() => {}}
                onCancel={() => {}}
                onClose={() => {}}
                // Blueprint portals to document.body, OUTSIDE the app's bp6-dark div, so the
                // portaled alert renders light unless we put the dark class on the portal itself.
                // portalClassName is on OverlayableProps which AlertProps doesn't extend, but
                // it's spread via ...overlayProps to Dialog at runtime and works correctly.
                // Cast to any to bypass the type limitation.
                {...({ portalClassName: dark ? Classes.DARK : undefined } as any)}
            >
                Are you sure you want to delete this item? This action cannot be undone.
            </Alert>
        </div>
    );
}

/**
 * Blueprint reference for Dialog. Renders ONE dialog open by default (isOpen={true}) for harness.
 *
 * Blueprint portals dialog content to document.body. We use containerRef + querySelectorAll to
 * set data-compare attributes on the inner elements (panel, header, body, footer, close button)
 * after mount. The containerRef points to `.bp6-dialog-container`.
 *
 * Keys: dialog-panel, dialog-header, dialog-body, dialog-footer, dialog-close.
 * Must match analyst-ui DialogGallery exactly.
 */
function DialogGallery() {
    const containerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        function tag() {
            const container = containerRef.current;
            if (!container) return;
            const panel = container.querySelector(`.${Classes.DIALOG}`);
            const header = container.querySelector(`.${Classes.DIALOG_HEADER}`);
            const body = container.querySelector(`.${Classes.DIALOG_BODY}`);
            const footer = container.querySelector(`.${Classes.DIALOG_FOOTER}`);
            const close = container.querySelector(`.${Classes.DIALOG_CLOSE_BUTTON}`);
            if (panel) panel.setAttribute("data-compare", "dialog-panel");
            if (header) header.setAttribute("data-compare", "dialog-header");
            if (body) body.setAttribute("data-compare", "dialog-body");
            if (footer) footer.setAttribute("data-compare", "dialog-footer");
            if (close) close.setAttribute("data-compare", "dialog-close");
        }
        // Tag immediately and after a short delay to handle async portal rendering
        tag();
        const t = setTimeout(tag, 100);
        return () => clearTimeout(t);
    }, []);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontSize: 14, opacity: 0.6, margin: 0 }}>
                The dialog below is open by default for comparison harness screenshots.
            </p>
            <Dialog
                isOpen={true}
                title="Dialog Title"
                icon="info-sign"
                isCloseButtonShown={true}
                containerRef={containerRef}
                onClose={() => {}}
                // Blueprint portals to document.body, OUTSIDE the app's bp6-dark div, so the
                // portaled dialog renders light unless we put the dark class on the portal itself.
                // portalClassName is Blueprint's supported mechanism for exactly this.
                portalClassName={
                    new URLSearchParams(window.location.search).get("theme") === "dark"
                        ? Classes.DARK
                        : undefined
                }
            >
                <DialogBody>
                    <p style={{ margin: 0 }}>
                        This is the dialog body content. It can contain any elements — forms,
                        messages, or complex layouts.
                    </p>
                </DialogBody>
                <DialogFooter
                    actions={
                        <>
                            <Button text="Cancel" />
                            <Button intent="primary" text="Confirm" />
                        </>
                    }
                />
            </Dialog>
        </div>
    );
}

/**
 * Blueprint reference for Drawer. Renders ONE drawer open by default (isOpen={true}) for harness.
 *
 * Blueprint portals drawer content to document.body. We use useEffect + querySelectorAll to
 * set data-compare attributes on the inner elements (panel, header, body) after mount.
 *
 * Keys: drawer-panel, drawer-header, drawer-body.
 * Must match analyst-ui DrawerGallery exactly.
 *
 * Dark mode: pass portalClassName={Classes.DARK} when ?theme=dark so Blueprint's portal renders
 * dark (same fix as Dialog/AlertGallery — see orchestrator correction in 0024).
 */
function DrawerGallery() {
    const dark = new URLSearchParams(window.location.search).get("theme") === "dark";

    useEffect(() => {
        function tag() {
            // Blueprint Drawer portals to document.body; find via Classes constants.
            const panel = document.querySelector(`.${Classes.DRAWER}`);
            const header = panel?.querySelector(`.${Classes.DRAWER_HEADER}`);
            const body = panel?.querySelector(`.${Classes.DRAWER_BODY}`);
            // Blueprint's drawer close button reuses the dialog close-button class
            // (drawer.tsx → className={Classes.DIALOG_CLOSE_BUTTON}). analyst's Drawer
            // tags its close button drawer-close, so pair it here for the harness.
            const close = panel?.querySelector(`.${Classes.DIALOG_CLOSE_BUTTON}`);

            if (panel) panel.setAttribute("data-compare", "drawer-panel");
            if (header) header.setAttribute("data-compare", "drawer-header");
            if (body) body.setAttribute("data-compare", "drawer-body");
            if (close) close.setAttribute("data-compare", "drawer-close");
        }
        tag();
        const t = setTimeout(tag, 100);
        return () => clearTimeout(t);
    }, []);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontSize: 14, opacity: 0.6, margin: 0 }}>
                The drawer below is open by default for comparison harness screenshots.
            </p>
            <Drawer
                isOpen={true}
                position="right"
                size={DrawerSize.SMALL}
                title="Drawer Title"
                icon="info-sign"
                isCloseButtonShown={true}
                onClose={() => {}}
                // Blueprint portals to document.body, OUTSIDE the app's bp6-dark div, so the
                // portaled drawer renders light unless we put the dark class on the portal itself.
                // portalClassName is on OverlayableProps which DrawerProps extends, so this is typed.
                portalClassName={dark ? Classes.DARK : undefined}
            >
                <div className={Classes.DRAWER_BODY} style={{ padding: 20 }}>
                    <p style={{ margin: 0 }}>
                        This is the drawer body content. It can contain any elements — forms,
                        messages, or complex layouts.
                    </p>
                </div>
            </Drawer>
        </div>
    );
}

/**
 * Blueprint reference for Popover.
 *
 * Must match analyst-ui PopoverGallery exactly.
 *
 * Blueprint Popover portals content to document.body. We use useEffect + querySelector to
 * set data-compare attributes on the inner elements (panel, arrow) after mount.
 *
 * Keys: popover-content (the .bp6-popover panel), popover-arrow (the .bp6-popover-arrow).
 *
 * Dark mode: pass portalClassName={Classes.DARK} when ?theme=dark so Blueprint's portal renders
 * dark (same fix as Dialog/Alert/DrawerGallery — see orchestrator correction in 0024).
 */
function PopoverGallery() {
    const dark = new URLSearchParams(window.location.search).get("theme") === "dark";

    useEffect(() => {
        function tag() {
            // Blueprint Popover portals to document.body; find via Classes constants.
            const panel = document.querySelector(`.${Classes.POPOVER}`);
            const arrow = panel?.querySelector(`.${Classes.POPOVER_ARROW}`);

            if (panel) panel.setAttribute("data-compare", "popover-content");
            if (arrow) arrow.setAttribute("data-compare", "popover-arrow");
        }
        tag();
        const t = setTimeout(tag, 200);
        return () => clearTimeout(t);
    }, []);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontSize: 14, opacity: 0.6, margin: 0 }}>
                The popover below is open by default for comparison harness screenshots.
            </p>
            {/* Wrapper provides space for the floating popover to render without clipping */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200, paddingTop: 80 }}>
                <Popover
                    isOpen={true}
                    placement="bottom"
                    content={
                        <div style={{ width: 200 }}>Short popover content.</div>
                    }
                    // Blueprint portals to document.body, OUTSIDE the app's bp6-dark div, so the
                    // portaled popover renders light unless we put the dark class on the portal itself.
                    portalClassName={dark ? Classes.DARK : undefined}
                >
                    <Button intent="primary" text="Open Popover" />
                </Popover>
            </div>
        </div>
    );
}

/**
 * Blueprint reference for Tooltip.
 *
 * Must match analyst-ui TooltipGallery exactly.
 *
 * Blueprint Tooltip portals content to document.body. We use useEffect + querySelector to
 * set data-compare attributes on the inner elements (bubble, arrow) after mount.
 *
 * Keys:
 *   tooltip-content      — the .bp6-tooltip bubble (first one, default color scheme)
 *   tooltip-arrow        — the .bp6-popover-arrow arrow element (inside first tooltip)
 *   tooltip-intent-danger — danger intent bubble (second tooltip)
 *
 * THE INVERSION: Blueprint tooltip bubble should be dark in light mode, light in dark mode.
 *
 * Dark mode: pass portalClassName={Classes.DARK} when ?theme=dark so Blueprint's portal renders
 * dark (same fix as Dialog/Alert/Drawer/Popover — see orchestrator notes).
 */
function TooltipGallery() {
    const dark = new URLSearchParams(window.location.search).get("theme") === "dark";

    useEffect(() => {
        function tag() {
            // Blueprint Tooltip portals to document.body as .bp6-tooltip elements.
            // Tag only the first tooltip (default color scheme) for harness comparison.
            // The danger intent tooltip is verified via screenshots only (visual check).
            const firstTooltip = document.querySelector(`.${Classes.TOOLTIP}`);

            if (firstTooltip) {
                firstTooltip.setAttribute("data-compare", "tooltip-content");
                const arrow = firstTooltip.querySelector(`.${Classes.POPOVER_ARROW}`);
                if (arrow) arrow.setAttribute("data-compare", "tooltip-arrow");
            }
        }
        tag();
        const t = setTimeout(tag, 200);
        return () => clearTimeout(t);
    }, []);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontSize: 14, opacity: 0.6, margin: 0 }}>
                Tooltips below are open by default for comparison harness screenshots.
            </p>
            {/* Wrapper provides space for the floating tooltips to render without clipping */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 48, minHeight: 160, paddingTop: 80 }}>
                {/* Default tooltip — isOpen=true, side=bottom */}
                <Tooltip
                    isOpen={true}
                    content="Tooltip content"
                    placement="bottom"
                    // Blueprint portals to document.body, OUTSIDE the app's bp6-dark div.
                    // portalClassName={Classes.DARK} puts the dark class on the portal so
                    // the tooltip renders with the dark inversion in dark theme.
                    portalClassName={dark ? Classes.DARK : undefined}
                >
                    <Button intent="primary" text="Hover me" />
                </Tooltip>

                {/* Danger intent tooltip — isOpen=true */}
                <Tooltip
                    isOpen={true}
                    content="Danger tooltip"
                    intent="danger"
                    placement="bottom"
                    portalClassName={dark ? Classes.DARK : undefined}
                >
                    <Button intent="danger" text="Danger" />
                </Tooltip>
            </div>
        </div>
    );
}

/**
 * Blueprint reference for Toast.
 *
 * Blueprint's OverlayToaster is async and uses portals+Overlay2 — complex to use in a
 * static gallery. Instead, we render the toast markup directly using Blueprint CSS classes
 * (`.bp6-toast`, `.bp6-toast-message`, `.bp6-button-group`).
 * This is a valid approach: the harness keys off `data-compare` on the `.bp6-toast` element,
 * which is the measured node for bg, shadow, radius, min-width, padding, color.
 *
 * data-compare keys (must match analyst-ui ToastGallery):
 *   toast-card          — the default (no-intent) toast card
 *   toast-intent-danger — the danger-intent toast card
 *
 * Dark mode: the dark class on the parent div provides the dark context for toast styling.
 */
function ToastGallery() {
    const dark = new URLSearchParams(window.location.search).get("theme") === "dark";

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontSize: 14, opacity: 0.6, margin: 0 }}>
                Toasts below are always visible for comparison harness screenshots.
            </p>
            {/* Stack toasts in a column with 20px gap (Blueprint $toast-margin = $pt-spacing * 5) */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20, alignItems: "flex-start" }}>
                {/* Default (no intent) toast — icon + message + action + dismiss */}
                <div
                    className={`${Classes.TOAST} ${dark ? Classes.DARK : ""}`}
                    data-compare="toast-card"
                    role="alert"
                    tabIndex={0}
                >
                    <Icon icon="info-sign" />
                    <span className={Classes.TOAST_MESSAGE}>
                        Reconnecting to server.
                    </span>
                    <div className={Classes.BUTTON_GROUP} style={{ paddingLeft: 0 }}>
                        <Button variant="minimal" text="Reconnect" />
                        <Button variant="minimal" icon="small-cross" aria-label="Close" />
                    </div>
                </div>

                {/* Danger intent toast */}
                <div
                    className={`${Classes.TOAST} ${Classes.intentClass("danger")} ${dark ? Classes.DARK : ""}`}
                    data-compare="toast-intent-danger"
                    role="alert"
                    tabIndex={0}
                >
                    <Icon icon="warning-sign" />
                    <span className={Classes.TOAST_MESSAGE}>
                        Failed to delete 3 items.
                    </span>
                    <div className={Classes.BUTTON_GROUP} style={{ paddingLeft: 0 }}>
                        <Button variant="minimal" text="Retry" />
                        <Button variant="minimal" icon="small-cross" aria-label="Close" />
                    </div>
                </div>

                {/* Success intent toast (visual only) */}
                <div
                    className={`${Classes.TOAST} ${Classes.intentClass("success")} ${dark ? Classes.DARK : ""}`}
                    role="alert"
                    tabIndex={0}
                >
                    <Icon icon="tick-circle" />
                    <span className={Classes.TOAST_MESSAGE}>
                        Item saved successfully.
                    </span>
                    <div className={Classes.BUTTON_GROUP} style={{ paddingLeft: 0 }}>
                        <Button variant="minimal" icon="small-cross" aria-label="Close" />
                    </div>
                </div>

                {/* Warning intent toast (visual only) */}
                <div
                    className={`${Classes.TOAST} ${Classes.intentClass("warning")} ${dark ? Classes.DARK : ""}`}
                    role="alert"
                    tabIndex={0}
                >
                    <Icon icon="warning-sign" />
                    <span className={Classes.TOAST_MESSAGE}>
                        Low disk space warning.
                    </span>
                    <div className={Classes.BUTTON_GROUP} style={{ paddingLeft: 0 }}>
                        <Button variant="minimal" icon="small-cross" aria-label="Close" />
                    </div>
                </div>
            </div>
        </div>
    );
}

/** Registry mirrors analyst-ui's. Add an entry per component as it's built. */
/**
 * Blueprint Menu reference gallery.
 *
 * Renders a Blueprint Menu with identical specimens to the analyst-ui MenuGallery.
 * data-compare keys must match analyst-ui exactly.
 *
 * Blueprint's Menu renders as a <ul role="menu"> with class .bp6-menu.
 * MenuDivider with title renders as .bp6-menu-header.
 * MenuDivider without title renders as .bp6-menu-divider.
 * MenuItem renders as <li><a class=".bp6-menu-item"> ...
 */
/**
 * Blueprint Menu reference gallery.
 *
 * Renders a Blueprint Menu with identical specimens to the analyst-ui MenuGallery.
 * data-compare keys must match analyst-ui exactly.
 *
 * Notes:
 * - Blueprint's MenuItem spreads htmlProps onto the inner <a> element, so data-compare
 *   lands on the anchor (radius, padding, color are measured there).
 * - Blueprint's MenuDivider does NOT forward arbitrary HTML props, so we use raw <li>
 *   elements for menu-divider and menu-header specimens.
 * - The menu-container data-compare lands on the <ul> element directly.
 * - The first MenuDivider (with title) needs to be a raw <li class="bp6-menu-header">
 *   so data-compare is preserved.
 */
function MenuGallery() {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontSize: 14, opacity: 0.6, margin: 0 }}>
                Menu renders inline (no portal). Dark mode applies via parent .bp6-dark ancestor.
            </p>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 32, flexWrap: "wrap" }}>
                <Menu data-compare="menu-container">
                    {/* Heading divider — first-of-type so no top border.
                        MenuDivider doesn't forward data-* props, so use raw <li>.
                        Blueprint renders <MenuDivider title="..."> as:
                          <li class="bp6-menu-header" role="separator">
                            <h6>Actions</h6>
                          </li> */}
                    <li
                        className={`${Classes.MENU_HEADER}`}
                        role="separator"
                        data-compare="menu-header"
                    >
                        {/* Use the real <H6> component, not a bare <h6>: Blueprint's
                            MenuDivider renders <H6> which carries class="bp6-heading"
                            (font-size 14px). A bare <h6> falls back to the UA default
                            (~9.38px), which made this specimen falsely diff. */}
                        <H6>Actions</H6>
                    </li>

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

                    {/* Item with a secondary label (analyst-ui dropped the no-op submenu caret) */}
                    <MenuItem
                        icon="cog"
                        text="Settings"
                        label="⌘,"
                    />

                    {/* Plain divider — use raw <li> to forward data-compare.
                        Blueprint renders <MenuDivider> as:
                          <li class="bp6-menu-divider" role="separator"></li> */}
                    <li
                        className={`${Classes.MENU_DIVIDER}`}
                        role="separator"
                        data-compare="menu-divider"
                    />

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
 * Blueprint ContextMenu reference gallery.
 *
 * Strategy: Render the Menu directly inside a `.bp6-popover` styled div (the same surface
 * Blueprint renders for a ContextMenuPopover) so harness specimens are always in the DOM
 * without fighting Blueprint's cursor-based positioning.
 *
 * The harness diffs:
 *   context-menu-surface — the .bp6-menu ul (bg, radius, min-width, padding)
 *   context-menu-item    — a plain menu item's inner <a> (padding, color, line-height)
 *
 * Dark mode: the dark class on the ancestor div provides dark context for inline menu.
 * We also show a live ContextMenuPopover for visual reference (not tagged).
 */
function ContextMenuGallery() {
    const dark = new URLSearchParams(window.location.search).get("theme") === "dark";

    // Wrapper ref for finding the menu element (since Blueprint Menu uses ulRef not ref).
    const menuWrapperRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!menuWrapperRef.current) return;
        const menu = menuWrapperRef.current.querySelector<HTMLElement>("ul[role='menu']");
        if (menu) menu.setAttribute("data-compare", "context-menu-surface");

        const firstItemAnchor = menuWrapperRef.current.querySelector<HTMLElement>(
            "ul[role='menu'] li:nth-child(2) a.bp6-menu-item"
        );
        if (firstItemAnchor) firstItemAnchor.setAttribute("data-compare", "context-menu-item");
    });

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontSize: 14, opacity: 0.6, margin: 0 }}>
                The context menu surface below is always visible for comparison harness screenshots.
            </p>

            {/* Always-visible specimen: Menu wrapped in Blueprint popover surface styling.
                Blueprint .bp6-popover has: bg white, border-radius 2px (?), box-shadow = elevation-3.
                We replicate with .bp6-popover class on the wrapper div. */}
            <div
                className={`bp6-popover${dark ? ` ${Classes.DARK}` : ""}`}
                style={{ display: "inline-block" }}
                ref={menuWrapperRef}
            >
                <div className={Classes.POPOVER_CONTENT}>
                    <Menu>
                        {/* Heading divider — first-of-type so no top border.
                            Use raw <li> since MenuDivider doesn't forward data-* props. */}
                        <li
                            className={Classes.MENU_HEADER}
                            role="separator"
                        >
                            <h6>Actions</h6>
                        </li>

                        {/* Plain item with icon — context-menu-item tagged via useEffect */}
                        <MenuItem
                            icon="document"
                            text="Open document"
                        />

                        {/* Item with right label */}
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
                        />

                        {/* Plain divider — raw <li> for data-compare forwarding */}
                        <li
                            className={Classes.MENU_DIVIDER}
                            role="separator"
                        />

                        {/* Danger intent */}
                        <MenuItem
                            icon="trash"
                            text="Delete"
                            intent="danger"
                        />

                        {/* Disabled item */}
                        <MenuItem
                            icon="cross"
                            text="Disabled action"
                            disabled={true}
                        />
                    </Menu>
                </div>
            </div>
        </div>
    );
}

/**
 * Blueprint reference for Navbar.
 *
 * data-compare keys (must match analyst-ui NavbarGallery exactly):
 *   navbar           — the Navbar bar itself (bg, shadow, height, padding)
 *   navbar-heading   — the NavbarHeading div (font-size, margin-right, color)
 *   navbar-divider   — the NavbarDivider (height, border-left, margin)
 *
 * Blueprint Alignment enum: Alignment.LEFT = "left", Alignment.RIGHT = "right".
 * Fixed width 680px container to match analyst-ui gallery specimen size.
 */
function NavbarGallery() {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <Section title="Standard navbar (left + right groups)">
                <div style={{ width: 680 }}>
                    <Navbar data-compare="navbar">
                        <NavbarGroup align={Alignment.LEFT}>
                            <NavbarHeading data-compare="navbar-heading">My Application</NavbarHeading>
                            <NavbarDivider data-compare="navbar-divider" />
                            <Button variant="minimal" text="Home" />
                            <Button variant="minimal" text="Files" />
                        </NavbarGroup>
                        <NavbarGroup align={Alignment.RIGHT}>
                            <Button variant="minimal" text="Log in" />
                        </NavbarGroup>
                    </Navbar>
                </div>
            </Section>

            <Section title="Left group only">
                <div style={{ width: 680 }}>
                    <Navbar>
                        <NavbarGroup align={Alignment.LEFT}>
                            <NavbarHeading>App</NavbarHeading>
                            <NavbarDivider />
                            <Button variant="minimal" text="Home" />
                            <Button variant="minimal" text="About" />
                        </NavbarGroup>
                    </Navbar>
                </div>
            </Section>
        </div>
    );
}

/**
 * Blueprint reference for Tabs.
 *
 * data-compare keys (must match analyst-ui TabsGallery exactly):
 *   tab-selected          — the selected tab title element (color, font)
 *   tab-default           — an unselected tab title
 *   tab-disabled          — a disabled tab title
 *   tab-indicator         — the sliding indicator bar (height, backgroundColor)
 *   tabs-vertical-selected — the selected tab in vertical mode (backgroundColor)
 *
 * Blueprint renders the indicator via JS (moveSelectionIndicator). After mount
 * it positions the .bp6-tab-indicator-wrapper's transform to overlay the selected tab.
 * The actual .bp6-tab-indicator bar inside it is always 3px tall with primary bg.
 * We key on the inner .bp6-tab-indicator element which has stable height+color.
 */
function TabsGallery() {
    // Blueprint's Tabs uses a class component so we need to use useEffect to set the
    // data-compare attribute on the rendered .bp6-tab-indicator element after mount.
    useEffect(() => {
        // Find and tag the tab-indicator element
        const indicator = document.querySelector(".bp6-tab-indicator-wrapper .bp6-tab-indicator");
        if (indicator) {
            indicator.setAttribute("data-compare", "tab-indicator");
        }
    }, []);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <Section title="Horizontal (default)">
                <Tabs id="bp-tabs-horizontal" defaultSelectedTabId="overview">
                    <Tab
                        id="overview"
                        title={<span data-compare="tab-selected">Overview</span>}
                        panel={
                            <div style={{ padding: 8 }}>
                                <p>Overview panel content. This is the selected tab.</p>
                            </div>
                        }
                    />
                    <Tab
                        id="details"
                        title={<span data-compare="tab-default">Details</span>}
                        panel={
                            <div style={{ padding: 8 }}>
                                <p>Details panel content.</p>
                            </div>
                        }
                    />
                    <Tab
                        id="disabled-tab"
                        title={<span data-compare="tab-disabled">Disabled</span>}
                        disabled={true}
                        panel={<div style={{ padding: 8 }}>Disabled panel.</div>}
                    />
                </Tabs>
            </Section>

            <Section title="Vertical">
                <Tabs id="bp-tabs-vertical" defaultSelectedTabId="files" vertical={true}>
                    <Tab
                        id="files"
                        title={<span data-compare="tabs-vertical-selected">Files</span>}
                        panel={
                            <div>
                                <p>Files panel content.</p>
                            </div>
                        }
                    />
                    <Tab
                        id="config"
                        title="Configuration"
                        panel={
                            <div>
                                <p>Configuration panel content.</p>
                            </div>
                        }
                    />
                    <Tab
                        id="logs"
                        title="Logs"
                        panel={
                            <div>
                                <p>Logs panel content.</p>
                            </div>
                        }
                    />
                </Tabs>
            </Section>
        </div>
    );
}

/**
 * Blueprint reference for Collapse.
 *
 * data-compare keys (must match analyst-ui CollapseGallery exactly):
 *   collapse-open  — the open .bp6-collapse outer container (overflowY, height)
 *   collapse-body  — the .bp6-collapse-body inner element (transform)
 *
 * Identical content both sides so measured open height matches.
 * Both the outer container and body are tagged via useEffect (Blueprint renders
 * these internally — we can't pass data-compare directly as a prop).
 */
function CollapseGallery() {
    const openWrapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!openWrapRef.current) return;
        // Tag the .bp6-collapse (outer) element rendered by Blueprint.
        const outer = openWrapRef.current.querySelector(".bp6-collapse");
        if (outer) outer.setAttribute("data-compare", "collapse-open");
        // Tag the .bp6-collapse-body (inner) element.
        const body = openWrapRef.current.querySelector(".bp6-collapse-body");
        if (body) body.setAttribute("data-compare", "collapse-body");
    }, []);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <Section title="Open">
                <div ref={openWrapRef}>
                    <Collapse isOpen={true}>
                        <p>
                            This is the collapse content. It is always visible when isOpen is true.
                            Blueprint animates the height of the outer container from 0 to the natural
                            content height.
                        </p>
                    </Collapse>
                </div>
            </Section>

            <Section title="Closed">
                <Collapse isOpen={false}>
                    <p>
                        This is the collapse content. It is always visible when isOpen is true.
                        Blueprint animates the height of the outer container from 0 to the natural
                        content height.
                    </p>
                </Collapse>
                <p style={{ fontSize: 12, opacity: 0.6 }}>(Nothing visible above — Collapse is closed)</p>
            </Section>

            <Section title="Keep children mounted (closed)">
                <Collapse isOpen={false} keepChildrenMounted={true}>
                    <p>Children stay in DOM but are hidden.</p>
                </Collapse>
                <p style={{ fontSize: 12, opacity: 0.6 }}>(Nothing visible above — keepChildrenMounted, closed)</p>
            </Section>
        </div>
    );
}

/**
 * Blueprint reference for Section.
 *
 * data-compare keys (must match analyst-ui SectionGallery exactly):
 *   section          — the outer .bp6-card container (bg, shadow, radius, border)
 *   section-header   — the .bp6-section-header div (border-bottom, min-height, padding)
 *   section-title    — the .bp6-section-header-title h6 (font, color)
 *   section-subtitle — the .bp6-section-header-sub-title div (color, margin)
 *   section-body     — the .bp6-section-card panel (padding)
 *
 * Identical content both sides. Tagged via useEffect since Blueprint renders these
 * internal elements — we can't pass data-compare directly as a prop.
 */
function SectionGallery() {
    const basicRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!basicRef.current) return;
        const card = basicRef.current.querySelector(".bp6-section");
        if (card) card.setAttribute("data-compare", "section");
        const header = basicRef.current.querySelector(".bp6-section-header");
        if (header) header.setAttribute("data-compare", "section-header");
        const title = basicRef.current.querySelector(".bp6-section-header-title");
        if (title) title.setAttribute("data-compare", "section-title");
        const subtitle = basicRef.current.querySelector(".bp6-section-header-sub-title");
        if (subtitle) subtitle.setAttribute("data-compare", "section-subtitle");
        const body = basicRef.current.querySelector(".bp6-section-card");
        if (body) body.setAttribute("data-compare", "section-body");
    }, []);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 32, width: 400 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>Basic (title + subtitle + body)</p>
                <div ref={basicRef}>
                    <BpSection
                        title="Account settings"
                        subtitle="Manage your account preferences"
                        icon="cog"
                    >
                        <BpSectionCard>
                            <p style={{ margin: 0 }}>Section card content goes here.</p>
                        </BpSectionCard>
                    </BpSection>
                </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>Collapsible (open)</p>
                <BpSection
                    title="Advanced options"
                    subtitle="Expand to see more"
                    collapsible={true}
                    collapseProps={{ defaultIsOpen: true }}
                >
                    <BpSectionCard>
                        <p style={{ margin: 0 }}>Collapsible section body — currently open.</p>
                    </BpSectionCard>
                </BpSection>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>Compact</p>
                <BpSection
                    title="Compact section"
                    compact={true}
                    elevation={1}
                >
                    <BpSectionCard>
                        <p style={{ margin: 0 }}>Compact body content.</p>
                    </BpSectionCard>
                </BpSection>
            </div>
        </div>
    );
}

/**
 * Blueprint reference for CardList.
 *
 * data-compare keys (must match analyst-ui CardListGallery exactly):
 *   card-list        — the outer .bp6-card.bp6-card-list container (bg, radius, shadow)
 *   card-list-item   — a middle .bp6-card row (padding, divider, min-height)
 *
 * Identical content both sides. Tagged via useEffect since Blueprint renders these
 * internal elements — we can't pass data-compare directly as a prop to Card children.
 */
function CardListGallery() {
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!listRef.current) return;
        // The CardList container: .bp6-card-list (which is also .bp6-card)
        const list = listRef.current.querySelector(".bp6-card-list");
        if (list) list.setAttribute("data-compare", "card-list");
        // The middle (second) card row — index 1 (0-based)
        const items = list?.querySelectorAll(":scope > .bp6-card");
        if (items && items.length >= 2) {
            items[1].setAttribute("data-compare", "card-list-item");
        }
    }, []);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 32, width: 400 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>Bordered (default)</p>
                <div ref={listRef}>
                    <BpCardList>
                        <Card>
                            <span>Item one — plain</span>
                        </Card>
                        <Card interactive={true}>
                            <span>Item two — interactive (hover me)</span>
                        </Card>
                        <Card>
                            <span>Item three — plain</span>
                        </Card>
                        <Card>
                            <span>Item four — plain</span>
                        </Card>
                    </BpCardList>
                </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>Compact</p>
                <BpCardList compact={true}>
                    <Card>Compact item one</Card>
                    <Card interactive={true}>Compact item two — interactive</Card>
                    <Card>Compact item three</Card>
                </BpCardList>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>Flush (bordered=false)</p>
                <BpCardList bordered={false}>
                    <Card>Flush item one</Card>
                    <Card interactive={true}>Flush item two — interactive</Card>
                    <Card>Flush item three</Card>
                </BpCardList>
            </div>
        </div>
    );
}

/**
 * Blueprint reference for Breadcrumbs.
 *
 * data-compare keys (must match analyst-ui BreadcrumbsGallery exactly):
 *   breadcrumb-link      — a non-current, non-disabled link crumb (the .bp6-breadcrumb anchor)
 *   breadcrumb-current   — the last/current crumb (.bp6-breadcrumb-current span)
 *   breadcrumbs-separator — a chevron-right separator icon (li::after pseudo — not directly taggable;
 *                           we tag the li instead via useEffect)
 *
 * Blueprint's BpBreadcrumbs renders .bp6-breadcrumbs > li > .bp6-breadcrumb/bp6-breadcrumb-current.
 * Separators are li::after pseudo-elements (not real DOM nodes), so we tag the first li.
 */
function BreadcrumbsGallery() {
    const trailRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!trailRef.current) return;
        const ul = trailRef.current.querySelector(".bp6-breadcrumbs");
        if (!ul) return;
        // Tag the first link crumb (non-current)
        const firstCrumb = ul.querySelector(".bp6-breadcrumb");
        if (firstCrumb) firstCrumb.setAttribute("data-compare", "breadcrumb-link");
        // Tag the current crumb
        const currentCrumb = ul.querySelector(".bp6-breadcrumb-current");
        if (currentCrumb) currentCrumb.setAttribute("data-compare", "breadcrumb-current");
    }, []);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 32, width: 500 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>Default trail (link + link + current)</p>
                <div ref={trailRef}>
                    <BpBreadcrumbs
                        items={[
                            { text: "Home", href: "/" },
                            { text: "Projects", href: "/projects" },
                            { text: "Current Project", current: true },
                        ]}
                    />
                </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>With icons</p>
                <BpBreadcrumbs
                    items={[
                        { text: "Home", href: "/", icon: "home" },
                        { text: "Settings", href: "/settings", icon: "cog" },
                        { text: "Profile", current: true, icon: "person" },
                    ]}
                />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>With disabled crumb</p>
                <BpBreadcrumbs
                    items={[
                        { text: "Home", href: "/" },
                        { text: "Restricted", href: "/admin", disabled: true },
                        { text: "Page", current: true },
                    ]}
                />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>Single crumb (no separator)</p>
                <BpBreadcrumbs
                    items={[
                        { text: "Only Page", current: true },
                    ]}
                />
            </div>
        </div>
    );
}

/**
 * Blueprint Tree reference gallery.
 *
 * data-compare keys (must match analyst-ui TreeGallery exactly):
 *   tree-node-content    — default node row div (.bp6-tree-node-content)
 *   tree-node-selected   — selected node row div (selected node's content)
 *   tree-node-caret      — caret span on an expandable node
 *   tree-node-caret-none — caret-none spacer span on a leaf node
 *   tree-node-icon       — icon span on a node that has an icon
 *
 * The specimen MUST be structurally identical to the analyst-ui TreeGallery:
 *   - "Documents" (expanded) → "Annual Report 2025" (doc icon, secondaryLabel), "Projects" (expanded) → "analyst-ui" (SELECTED), "blueprint-ref"
 *   - "Drafts" (collapsed, folder icon)
 *   - "Trash" (disabled, trash icon)
 */
function TreeGallery() {
    const [contents, setContents] = useState<BpTreeNodeInfo[]>([
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
    ]);

    const treeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!treeRef.current) return;
        // Tag specific nodes for style diffing.
        // Blueprint renders: .bp6-tree-node > .bp6-tree-node-content
        // We tag specific content divs by looking at the tree structure.
        const allContents = treeRef.current.querySelectorAll(".bp6-tree-node-content");
        // Node order (flattened, in DOM order):
        // 0: Documents (depth 0, has caret)
        // 1: Annual Report 2025 (depth 1, has icon + secondaryLabel)
        // 2: Projects (depth 1, has caret + icon)
        // 3: analyst-ui (depth 2, SELECTED)
        // 4: blueprint-ref (depth 2)
        // 5: Drafts (depth 0, has icon, collapsed)
        // 6: Trash (depth 0, disabled)
        if (allContents[1]) {
            allContents[1].setAttribute("data-compare", "tree-node-content");
        }
        if (allContents[3]) {
            allContents[3].setAttribute("data-compare", "tree-node-selected");
        }
        // Tag caret spans: first .bp6-tree-node-caret in DOM
        const carets = treeRef.current.querySelectorAll(".bp6-tree-node-caret");
        if (carets[0]) carets[0].setAttribute("data-compare", "tree-node-caret");
        // Tag caret-none span: first leaf at depth 1
        const caretNones = treeRef.current.querySelectorAll(".bp6-tree-node-caret-none");
        if (caretNones[0]) caretNones[0].setAttribute("data-compare", "tree-node-caret-none");
        // Tag icon span on "Annual Report 2025" node (.bp6-tree-node-icon)
        const icons = treeRef.current.querySelectorAll(".bp6-tree-node-icon");
        if (icons[1]) icons[1].setAttribute("data-compare", "tree-node-icon");
    }, []);

    return (
        <div style={{ width: 320 }}>
            <div ref={treeRef}>
                <BpTree
                    contents={contents}
                    onNodeClick={(node, path) => {
                        setContents((prev) => {
                            const next = JSON.parse(JSON.stringify(prev)) as BpTreeNodeInfo[];
                            clearSelected(next);
                            BpTree.nodeFromPath(path, next).isSelected = true;
                            return next;
                        });
                    }}
                    onNodeExpand={(node, path) => {
                        setContents((prev) => {
                            const next = JSON.parse(JSON.stringify(prev)) as BpTreeNodeInfo[];
                            BpTree.nodeFromPath(path, next).isExpanded = true;
                            return next;
                        });
                    }}
                    onNodeCollapse={(node, path) => {
                        setContents((prev) => {
                            const next = JSON.parse(JSON.stringify(prev)) as BpTreeNodeInfo[];
                            BpTree.nodeFromPath(path, next).isExpanded = false;
                            return next;
                        });
                    }}
                />
            </div>
        </div>
    );
}

function clearSelected(nodes: BpTreeNodeInfo[]) {
    for (const n of nodes) {
        n.isSelected = false;
        if (n.childNodes) clearSelected(n.childNodes);
    }
}

/**
 * Blueprint PanelStack reference gallery.
 *
 * Matches analyst-ui PanelStackGallery exactly:
 *   - Controlled stack of depth 2: [Root, Detail]
 *   - Fixed 320×240px container
 *   - data-compare keys on header, back button, title
 *
 * Blueprint's PanelStack uses CSSTransition internally but the rendered STATE
 * (back button + title) is identical to analyst-ui for diffing purposes.
 */
const BP_ROOT_PANEL: BpPanel<object> = {
    title: "Root",
    renderPanel: ({ openPanel }: any) => (
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
                text="Open Detail"
            />
        </div>
    ),
};

const BP_DETAIL_PANEL: BpPanel<object> = {
    title: "Detail",
    renderPanel: () => <div style={{ padding: 16, fontSize: 14 }}>Detail panel content.</div>,
};

// Controlled stack of [Root, Detail] — depth 2, back button visible.
const BP_INITIAL_PANEL_STACK: BpPanel<object>[] = [BP_ROOT_PANEL, BP_DETAIL_PANEL];

function PanelStackGallery() {
    const [stack, setStack] = useState<BpPanel<object>[]>(BP_INITIAL_PANEL_STACK);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        // Tag the header, back button, and title for the harness.
        // Blueprint renders:
        //   .bp6-panel-stack2-view > .bp6-panel-stack2-header > span > .bp6-panel-stack2-header-back (back btn)
        //   .bp6-panel-stack2-view > .bp6-panel-stack2-header > h6.bp6-heading (title)
        const header = containerRef.current.querySelector<HTMLElement>(".bp6-panel-stack2-header");
        if (header) header.setAttribute("data-compare", "panel-stack-header");

        const backBtn = containerRef.current.querySelector<HTMLElement>(".bp6-panel-stack2-header-back");
        if (backBtn) backBtn.setAttribute("data-compare", "panel-stack-back");

        const title = containerRef.current.querySelector<HTMLElement>(".bp6-panel-stack2-header .bp6-heading");
        if (title) title.setAttribute("data-compare", "panel-stack-title");
    }, []);

    return (
        <div style={{ width: 320 }}>
            <div
                ref={containerRef}
                style={{ width: 320, height: 240, position: "relative", border: "1px solid rgba(0,0,0,0.1)" }}
            >
                <BpPanelStack
                    stack={stack as any}
                    onOpen={(p: any) => setStack((prev: any) => [...prev, p])}
                    onClose={() => setStack((prev: any) => prev.slice(0, -1))}
                    style={{ width: "100%", height: "100%" }}
                />
            </div>
        </div>
    );
}

/**
 * Blueprint HTMLTable reference gallery.
 *
 * Mirrors analyst-ui HTMLTableGallery exactly — same rows, same columns, same variant order.
 * data-compare keys match analyst-ui for the computed-style diff harness.
 *
 * data-compare keys:
 *   html-table-header  — a <th> in the header row
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
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {/* Plain table */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>Plain</p>
                <BpHTMLTable>
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
                </BpHTMLTable>
            </div>

            {/* Bordered + striped */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>Bordered + Striped</p>
                <BpHTMLTable bordered striped>
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
                </BpHTMLTable>
            </div>

            {/* Interactive */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>Interactive (hover rows)</p>
                <BpHTMLTable interactive>
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
                </BpHTMLTable>
            </div>

            {/* Compact */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>Compact</p>
                <BpHTMLTable compact>
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
                </BpHTMLTable>
            </div>
        </div>
    );
}

/**
 * Blueprint EditableText reference gallery.
 *
 * Mirrors analyst-ui EditableTextGallery exactly — same specimens, same data-compare keys.
 *
 * Blueprint's EditableText does not forward data-* to its root div, so we use the
 * `elementRef` prop to get the root element ref and set `data-compare` imperatively.
 *
 * data-compare keys:
 *   editable-text-resting    — root div, resting state with value
 *   editable-text-placeholder — root div showing placeholder (no value)
 *   editable-text-editing    — root div with isEditing=true (shows editing ring)
 */
function BpEditableTextWithCompare({
    compareKey,
    ...props
}: React.ComponentProps<typeof BpEditableText> & { compareKey: string }) {
    const elRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (elRef.current) {
            elRef.current.setAttribute("data-compare", compareKey);
        }
    }, [compareKey]);
    return <BpEditableText {...props} elementRef={elRef} />;
}

function EditableTextGallery() {
    const [editingValue, setEditingValue] = useState("Editing now");
    const intents: Intent[] = ["none", "primary", "success", "warning", "danger"];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {/* Resting state with value */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>Resting (with value)</p>
                <BpEditableTextWithCompare
                    compareKey="editable-text-resting"
                    defaultValue="Hello, Blueprint"
                />
            </div>

            {/* Empty + placeholder */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>Empty + placeholder</p>
                <BpEditableTextWithCompare
                    compareKey="editable-text-placeholder"
                    defaultValue=""
                    placeholder="Click to Edit"
                />
            </div>

            {/* Editing state */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>Editing state</p>
                <BpEditableTextWithCompare
                    compareKey="editable-text-editing"
                    value={editingValue}
                    isEditing={true}
                    onChange={setEditingValue}
                />
            </div>

            {/* Multiline */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>Multiline</p>
                <BpEditableText
                    defaultValue={"Line one\nLine two\nLine three"}
                    multiline
                    minLines={3}
                />
            </div>

            {/* Intents */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>Intents</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {intents.map((intent) => (
                        <BpEditableText
                            key={intent}
                            defaultValue={intent === "none" ? "No intent" : intent}
                            intent={intent}
                        />
                    ))}
                </div>
            </div>

            {/* Disabled */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>Disabled</p>
                <BpEditableText
                    defaultValue="Cannot edit this"
                    disabled={true}
                />
            </div>
        </div>
    );
}

/**
 * Blueprint EntityTitle reference gallery.
 *
 * Mirrors analyst-ui EntityTitleGallery exactly — same specimens, same data-compare keys.
 * Uses Blueprint's H1–H6 heading components for size variants.
 *
 * Blueprint's EntityTitle is typed as React.FC so ref forwarding isn't exposed in its types.
 * We wrap in a div and use querySelector to find the .bp6-entity-title root, then set
 * data-compare on it imperatively via useEffect — so harness reads the right element.
 */
function BpEntityTitleWithCompare({
    compareKey,
    ...props
}: React.ComponentProps<typeof BpEntityTitle> & { compareKey: string }) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (wrapperRef.current) {
            const inner = wrapperRef.current.querySelector(".bp6-entity-title");
            if (inner) {
                inner.setAttribute("data-compare", compareKey);
            }
        }
    }, [compareKey]);
    return (
        <div ref={wrapperRef}>
            <BpEntityTitle {...props} />
        </div>
    );
}

function EntityTitleGallery() {
    const sizeHeadings: [string, React.FC<any>][] = [
        ["text", Text],
        ["h1", H1],
        ["h2", H2],
        ["h3", H3],
        ["h4", H4],
        ["h5", H5],
        ["h6", H6],
    ];

    return (
        <div className="flex flex-col gap-8">
            {/* Basic: title only */}
            <div className="flex flex-col gap-2">
                <p>Title only</p>
                <BpEntityTitleWithCompare
                    compareKey="entity-title-basic"
                    title="Project Alpha"
                />
            </div>

            {/* Title + icon + subtitle */}
            <div className="flex flex-col gap-2">
                <p>Icon + title + subtitle</p>
                <BpEntityTitleWithCompare
                    compareKey="entity-title-full"
                    icon="folder-close"
                    title="Project Alpha"
                    subtitle="Last updated 2 hours ago"
                />
            </div>

            {/* Title + icon + subtitle + tag */}
            <div className="flex flex-col gap-2">
                <p>Icon + title + subtitle + tag</p>
                <BpEntityTitleWithCompare
                    compareKey="entity-title-tags"
                    icon="folder-close"
                    title="Project Alpha"
                    subtitle="Last updated 2 hours ago"
                    tags={<Tag intent="primary">Active</Tag>}
                />
            </div>

            {/* Sizes */}
            <div className="flex flex-col gap-4">
                <p>Sizes</p>
                {sizeHeadings.map(([size, headingComponent]) => (
                    <BpEntityTitleWithCompare
                        key={size}
                        compareKey={`entity-title-${size}`}
                        heading={headingComponent}
                        icon="folder-close"
                        title={`${size === "text" ? "Text" : size.toUpperCase()} — Project Alpha`}
                        subtitle="Last updated 2 hours ago"
                    />
                ))}
            </div>

            {/* Loading state */}
            <div className="flex flex-col gap-2">
                <p>Loading</p>
                <BpEntityTitle
                    icon="folder-close"
                    title="Loading title"
                    subtitle="Loading subtitle"
                    loading
                />
            </div>

            {/* Fill + ellipsize */}
            <div className="flex flex-col gap-2">
                <p>Fill + ellipsize</p>
                <div style={{ width: 300, border: "1px solid rgba(17,20,24,0.15)", borderRadius: 4 }}>
                    <BpEntityTitle
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
 * Blueprint NonIdealState reference gallery.
 *
 * Mirrors analyst-ui NonIdealStateGallery exactly — same specimens, same data-compare keys,
 * same container widths/heights.
 *
 * Blueprint's NonIdealState renders:
 *   .bp6-non-ideal-state (root)
 *     .bp6-non-ideal-state-visual (icon wrapper)
 *     .bp6-non-ideal-state-text (title + description wrapper)
 *       h4.bp6-heading (title)
 *       div (description)
 *     {action} (direct child)
 *
 * data-compare keys (must match analyst-ui NonIdealStateGallery exactly):
 *   non-ideal-state-full    — the root div of the full-state specimen
 *   non-ideal-state-minimal — the root div of the minimal specimen
 *
 * We use a wrapper div + useEffect to set data-compare on the .bp6-non-ideal-state root
 * (Blueprint's NonIdealState doesn't forward arbitrary props in v6).
 * A fixed 400px-wide, fixed-height container matches the analyst-ui gallery so
 * centering and max-width dimensions compare cleanly.
 */
function BpNonIdealStateWithCompare({
    compareKey,
    ...props
}: React.ComponentProps<typeof BpNonIdealState> & { compareKey: string }) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (wrapperRef.current) {
            const inner = wrapperRef.current.querySelector(".bp6-non-ideal-state");
            if (inner) inner.setAttribute("data-compare", compareKey);
        }
    }, [compareKey]);
    return (
        <div ref={wrapperRef} style={{ width: "100%", height: "100%", position: "relative" }}>
            <BpNonIdealState {...props} />
        </div>
    );
}

function NonIdealStateGallery() {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {/* Full state: icon + title + description + action */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>Full state (icon + title + description + action)</p>
                <div style={{ width: 400, height: 300, position: "relative" }}>
                    <BpNonIdealStateWithCompare
                        compareKey="non-ideal-state-full"
                        icon="search"
                        title="No search results"
                        description="Your query returned no results. Try a different search."
                        action={<Button intent="primary" text="Clear search" />}
                    />
                </div>
            </div>

            {/* Minimal: icon + title only */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>Minimal (icon + title)</p>
                <div style={{ width: 400, height: 200, position: "relative" }}>
                    <BpNonIdealStateWithCompare
                        compareKey="non-ideal-state-minimal"
                        icon="folder-close"
                        title="Empty folder"
                    />
                </div>
            </div>

            {/* Title + description only (no icon) */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>Title + description (no icon)</p>
                <div style={{ width: 400, height: 150, position: "relative" }}>
                    <BpNonIdealState
                        title="Nothing here"
                        description="Come back later when there's something to show."
                    />
                </div>
            </div>

            {/* Horizontal layout */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>Horizontal layout</p>
                <div style={{ width: 400, height: 120, position: "relative" }}>
                    <BpNonIdealState
                        icon="warning-sign"
                        title="Connection error"
                        description="Could not connect to the server."
                        layout="horizontal"
                    />
                </div>
            </div>

            {/* Icon size variants */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>Icon sizes (STANDARD / SMALL / EXTRA_SMALL)</p>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    {([
                        ["STANDARD", BpNonIdealStateIconSize.STANDARD],
                        ["SMALL", BpNonIdealStateIconSize.SMALL],
                        ["EXTRA_SMALL", BpNonIdealStateIconSize.EXTRA_SMALL],
                    ] as const).map(([label, size]) => (
                        <div key={label} style={{ width: 160, height: 180, position: "relative", border: "1px dashed rgba(0,0,0,0.1)" }}>
                            <BpNonIdealState
                                icon="document"
                                iconSize={size}
                                title={label}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* iconMuted=false */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>iconMuted=false (inherits muted text color)</p>
                <div style={{ width: 400, height: 180, position: "relative" }}>
                    <BpNonIdealState
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
 * Blueprint Link reference gallery.
 *
 * Mirrors analyst-ui LinkGallery exactly — same specimens, same data-compare keys.
 * Uses Blueprint's Link component directly (BpLink) which applies .bp6-link styles.
 *
 * data-compare keys (must match analyst-ui LinkGallery exactly):
 *   link-default   — primary color, always underlined
 *   link-hover     — primary color, hover underline
 *   link-none      — primary color, no underline
 *   link-inherit   — inherit color, always underlined
 *   link-success   — success color
 *   link-warning   — warning color
 *   link-danger    — danger color
 *   link-inline    — link in a sentence of body text
 */
function LinkGallery() {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Default — always underlined, primary color */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>Default (underline=always, color=primary)</p>
                <BpLink href="#" underline="always" data-compare="link-default">Blueprint Link</BpLink>
            </div>

            {/* Underline variants */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>Underline variants</p>
                <div style={{ display: "flex", gap: 24, alignItems: "baseline" }}>
                    <BpLink href="#" underline="always">always</BpLink>
                    <BpLink href="#" underline="hover" data-compare="link-hover">hover</BpLink>
                    <BpLink href="#" underline="none" data-compare="link-none">none</BpLink>
                </div>
            </div>

            {/* Color variants */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>Color variants</p>
                <div style={{ display: "flex", gap: 24, alignItems: "baseline" }}>
                    <BpLink href="#" color="primary">primary</BpLink>
                    <BpLink href="#" color="success" data-compare="link-success">success</BpLink>
                    <BpLink href="#" color="warning" data-compare="link-warning">warning</BpLink>
                    <BpLink href="#" color="danger" data-compare="link-danger">danger</BpLink>
                    <BpLink href="#" color="inherit" data-compare="link-inherit">inherit</BpLink>
                </div>
            </div>

            {/* Inline in text */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>Inline in body text</p>
                <p style={{ fontSize: 14, lineHeight: "1.28581", margin: 0 }}>
                    Visit the{" "}
                    <BpLink href="#" data-compare="link-inline">Blueprint documentation</BpLink>
                    {" "}for more details.
                </p>
            </div>
        </div>
    );
}

/**
 * Blueprint Slider reference gallery.
 *
 * Mirrors analyst-ui SliderGallery exactly — same specimens, same data-compare keys.
 * Uses Blueprint's Slider component directly (BpSlider).
 *
 * Blueprint does not expose data-* forwarding on Slider, so we use a wrapper div +
 * useEffect + querySelector to stamp data-compare on Blueprint's internal DOM nodes:
 *   .bp6-slider-track          → slider-track
 *   .bp6-slider-progress       → slider-progress (the intent-colored fill)
 *   .bp6-slider-handle         → slider-handle (the interactive handle)
 *   .bp6-slider-axis .bp6-slider-label:first-child → slider-axis-label
 *   .bp6-slider-handle .bp6-slider-label           → slider-handle-label
 *
 * data-compare keys (must match analyst-ui SliderGallery exactly):
 *   slider-default      — primary intent, value=5, labelStepSize=5
 *   slider-success      — success intent, value=6, labelStepSize=5
 *   slider-disabled     — disabled, value=3, labelStepSize=5
 *   slider-track        — the track rail
 *   slider-progress     — the fill segment with intent color
 *   slider-handle       — the draggable handle knob
 *   slider-axis-label   — first axis tick label (plain text, no background)
 *   slider-handle-label — handle value badge (dark tooltip pill below handle)
 */
function BpSliderWithInternalCompare({
    containerCompareKey,
    tagInternals,
    ...props
}: React.ComponentProps<typeof BpSlider> & {
    containerCompareKey: string;
    /** If true, stamp slider-track/progress/handle/axis-label/handle-label on this instance */
    tagInternals?: boolean;
}) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!wrapperRef.current) return;
        if (tagInternals) {
            const track = wrapperRef.current.querySelector(".bp6-slider-track");
            if (track) track.setAttribute("data-compare", "slider-track");

            // .bp6-slider-progress with intent class = the filled segment
            const progress = wrapperRef.current.querySelector(".bp6-slider-progress.bp6-intent-primary, .bp6-slider-progress.bp6-intent-success, .bp6-slider-progress.bp6-intent-warning, .bp6-slider-progress.bp6-intent-danger");
            if (progress) progress.setAttribute("data-compare", "slider-progress");

            // The interactive handle (first .bp6-slider-handle)
            const handle = wrapperRef.current.querySelector(".bp6-slider-handle");
            if (handle) handle.setAttribute("data-compare", "slider-handle");

            // Axis tick label — first .bp6-slider-label inside .bp6-slider-axis
            const axisLabel = wrapperRef.current.querySelector(".bp6-slider-axis .bp6-slider-label");
            if (axisLabel) axisLabel.setAttribute("data-compare", "slider-axis-label");

            // Handle value badge — .bp6-slider-label inside .bp6-slider-handle
            const handleLabel = wrapperRef.current.querySelector(".bp6-slider-handle .bp6-slider-label");
            if (handleLabel) handleLabel.setAttribute("data-compare", "slider-handle-label");
        }
    });
    return (
        <div ref={wrapperRef} style={{ width: 320 }} data-compare={containerCompareKey}>
            <BpSlider {...props} />
        </div>
    );
}

function SliderGallery() {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {/* Default — primary intent, value=5 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>Default (primary, value=5)</p>
                <BpSliderWithInternalCompare
                    containerCompareKey="slider-default"
                    tagInternals={true}
                    min={0}
                    max={10}
                    stepSize={1}
                    value={5}
                    intent="primary"
                    labelStepSize={5}
                    onChange={() => {}}
                />
            </div>

            {/* Success intent */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>Success intent (value=6)</p>
                <BpSliderWithInternalCompare
                    containerCompareKey="slider-success"
                    min={0}
                    max={10}
                    stepSize={1}
                    value={6}
                    intent="success"
                    labelStepSize={5}
                    onChange={() => {}}
                />
            </div>

            {/* Disabled */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>Disabled (value=3)</p>
                <BpSliderWithInternalCompare
                    containerCompareKey="slider-disabled"
                    min={0}
                    max={10}
                    stepSize={1}
                    value={3}
                    intent="primary"
                    disabled
                    labelStepSize={5}
                    onChange={() => {}}
                />
            </div>
        </div>
    );
}

/**
 * Blueprint reference for Hotkeys. Uses Blueprint's Dialog, DialogBody, Hotkeys, Hotkey,
 * and KeyComboTag components to render the canonical hotkeys dialog open by default.
 *
 * Dark mode: pass portalClassName={Classes.DARK} when ?theme=dark so Blueprint's portal
 * renders dark — same pattern as DialogGallery.
 *
 * data-compare keys must match analyst-ui's HotkeysGallery exactly:
 *   hotkey-key        — first kbd key cap (tagged via useEffect on the portaled DOM)
 *   hotkey-combo      — first .bp6-key-combo span
 *   hotkey-row        — first .bp6-hotkey row
 *   hotkey-label      — first .bp6-hotkey-label div
 *   hotkey-column     — .bp6-hotkey-column wrapper div
 *   hotkey-group-heading — first h4.bp6-heading group heading
 */
function HotkeysGallery() {
    const dark = new URLSearchParams(window.location.search).get("theme") === "dark";

    useEffect(() => {
        function tag() {
            // Tag the portaled content (Blueprint portals to document.body)
            const col = document.querySelector(`.${Classes.HOTKEY_COLUMN}`);
            if (col) col.setAttribute("data-compare", "hotkey-column");

            const heading = document.querySelector(`.${Classes.HOTKEY_COLUMN} .${Classes.HEADING}`);
            if (heading) heading.setAttribute("data-compare", "hotkey-group-heading");

            const firstRow = document.querySelector(`.${Classes.HOTKEY}`);
            if (firstRow) firstRow.setAttribute("data-compare", "hotkey-row");

            const firstLabel = document.querySelector(`.${Classes.HOTKEY_LABEL}`);
            if (firstLabel) firstLabel.setAttribute("data-compare", "hotkey-label");

            const firstCombo = document.querySelector(`.${Classes.KEY_COMBO}`);
            if (firstCombo) firstCombo.setAttribute("data-compare", "hotkey-combo");

            const firstKey = document.querySelector(`.${Classes.KEY}`);
            if (firstKey) firstKey.setAttribute("data-compare", "hotkey-key");
        }
        tag();
        const t = setTimeout(tag, 100);
        return () => clearTimeout(t);
    }, []);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontSize: 14, opacity: 0.6, margin: 0 }}>
                The hotkeys dialog below is open by default for comparison harness screenshots.
            </p>
            {/* Standalone KeyComboTag specimens */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, opacity: 0.6 }}>KeyCombo:</span>
                <KeyComboTag combo="mod+s" />
                <KeyComboTag combo="mod+shift+n" />
                <KeyComboTag combo="ctrl+z" />
            </div>
            <Dialog
                isOpen={true}
                title="Keyboard shortcuts"
                onClose={() => {}}
                portalClassName={dark ? Classes.DARK : undefined}
            >
                <DialogBody style={{ margin: 0, padding: 0 }}>
                    <Hotkeys>
                        <Hotkey label="Save document" combo="mod+s" global={true} group="Global" />
                        <Hotkey label="New file" combo="mod+n" global={true} group="Global" />
                        <Hotkey label="Find" combo="mod+f" group="Editor" />
                        <Hotkey label="Undo" combo="mod+z" group="Editor" />
                    </Hotkeys>
                </DialogBody>
            </Dialog>
        </div>
    );
}

/**
 * Blueprint reference for TagInput.
 *
 * Uses Blueprint's TagInput component with identical values/placeholder to analyst-ui.
 * data-compare keys must match analyst-ui TagInputGallery exactly:
 *   tag-input-container  — the main .bp6-tag-input container box
 *   tag-input-tag        — the first Tag chip inside the container
 *   tag-input-ghost      — the ghost input (.bp6-input-ghost)
 *
 * Blueprint does not directly forward data-* to the internal tag or ghost input,
 * so we use a wrapper div + useEffect + querySelector to stamp data-compare.
 */
function TagInputGallery() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function tag() {
            if (!containerRef.current) return;
            // Tag the container (.bp6-tag-input) — Blueprint renders it as the root div
            const container = containerRef.current.querySelector(".bp6-tag-input");
            if (container) container.setAttribute("data-compare", "tag-input-container");

            // Tag the first Tag chip
            const firstTag = containerRef.current.querySelector(".bp6-tag");
            if (firstTag) firstTag.setAttribute("data-compare", "tag-input-tag");

            // Tag the ghost input
            const ghostInput = containerRef.current.querySelector(".bp6-input-ghost");
            if (ghostInput) ghostInput.setAttribute("data-compare", "tag-input-ghost");
        }
        tag();
        const t = setTimeout(tag, 100);
        return () => clearTimeout(t);
    }, []);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <Section title="Default (pre-populated)">
                <div style={{ width: 400 }} ref={containerRef}>
                    <BpTagInput
                        values={["apple", "banana", "cherry"]}
                        onChange={() => {}}
                        placeholder="Add a tag…"
                        fill={true}
                    />
                </div>
            </Section>

            <Section title="Large">
                <div style={{ width: 400 }}>
                    <BpTagInput
                        values={["react", "typescript"]}
                        onChange={() => {}}
                        placeholder="Add a tag…"
                        large={true}
                        fill={true}
                    />
                </div>
            </Section>

            <Section title="Danger intent + fill">
                <BpTagInput
                    values={["error", "warning"]}
                    onChange={() => {}}
                    placeholder="Add a tag…"
                    intent="danger"
                    fill={true}
                />
            </Section>

            <Section title="Disabled">
                <div style={{ width: 400 }}>
                    <BpTagInput
                        values={["locked", "read-only"]}
                        onChange={() => {}}
                        placeholder="Disabled"
                        disabled={true}
                        fill={true}
                    />
                </div>
            </Section>

            <Section title="With left icon">
                <div style={{ width: 400 }}>
                    <BpTagInput
                        values={["design", "ui", "ux"]}
                        onChange={() => {}}
                        placeholder="Tags…"
                        leftIcon="tag"
                        fill={true}
                    />
                </div>
            </Section>
        </div>
    );
}

// ─── Select items (same list as analyst-ui SelectGallery) ──────────────────
const SELECT_ITEMS = ["Apple", "Banana", "Cherry", "Durian", "Elderberry", "Fig", "Grape"];
const SELECT_SELECTED = "Cherry";

/**
 * Blueprint reference for Select. Uses @blueprintjs/select's Select<T>.
 *
 * Strategy: Control the popover OPEN so the harness can screenshot the filter
 * input and menu items without interaction. We use popoverProps={{ isOpen: true }}
 * plus useEffect to stamp data-compare on portaled DOM nodes.
 *
 * Dark mode: pass popoverProps={{ portalClassName: Classes.DARK }} when theme=dark
 * so Blueprint's portaled menu renders in dark mode (matching our portal dark-mode fix).
 *
 * data-compare keys (MUST match analyst-ui SelectGallery):
 *   select-trigger       — the trigger Button element
 *   select-filter        — the filter InputGroup's <input> element (portaled)
 *   select-menu          — the menu <ul> element inside the popover (portaled)
 *   select-item          — Cherry (selected, non-active, 3rd item in filtered list)
 *   select-item-active   — Apple (first item, active by default)
 */
function SelectGallery() {
    const dark = new URLSearchParams(window.location.search).get("theme") === "dark";
    const [selected, setSelected] = useState<string | null>(SELECT_SELECTED);

    // Stamp data-compare on portaled nodes after render
    useEffect(() => {
        function tag() {
            // select-menu: Blueprint renders the menu as a <ul role="listbox"> inside the popover
            const menuUl = document.querySelector<HTMLElement>("ul.bp6-menu[role='listbox']");
            if (menuUl) {
                menuUl.setAttribute("data-compare", "select-menu");

                // select-item-active: Apple is index 0 (first item, active by default)
                const appleLi = menuUl.children[0] as HTMLElement | undefined;
                if (appleLi) {
                    const anchor = appleLi.querySelector("a.bp6-menu-item,button.bp6-menu-item");
                    if (anchor) anchor.setAttribute("data-compare", "select-item-active");
                }

                // select-item: Cherry is index 2 (0-based)
                const cherryLi = menuUl.children[2] as HTMLElement | undefined;
                if (cherryLi) {
                    const anchor = cherryLi.querySelector("a.bp6-menu-item,button.bp6-menu-item");
                    if (anchor) anchor.setAttribute("data-compare", "select-item");
                }
            }

            // select-filter: the filter input inside the portaled popover
            const filterInput = document.querySelector<HTMLElement>(
                `.bp6-select-popover .bp6-input`
            );
            if (filterInput) filterInput.setAttribute("data-compare", "select-filter");
        }
        tag();
        const t = setTimeout(tag, 150);
        return () => clearTimeout(t);
    });

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <Section title="Default filterable Select (popover open for comparison)">
                <div style={{ width: 300 }}>
                    <BpSelect<string>
                        items={SELECT_ITEMS}
                        itemRenderer={(item, { modifiers, handleClick }) => (
                            <MenuItem
                                key={item}
                                text={item}
                                active={modifiers.active}
                                icon={item === selected ? "tick" : undefined}
                                onClick={handleClick}
                            />
                        )}
                        itemPredicate={(query, item) =>
                            item.toLowerCase().includes(query.toLowerCase())
                        }
                        onItemSelect={(item) => setSelected(item)}
                        noResults={<MenuItem disabled={true} text="No results." />}
                        popoverProps={{
                            isOpen: true,
                            minimal: true,
                            portalClassName: dark ? Classes.DARK : undefined,
                        }}
                    >
                        <Button
                            rightIcon="caret-down"
                            data-compare="select-trigger"
                            fill={true}
                        >
                            {selected ?? "Select a fruit…"}
                        </Button>
                    </BpSelect>
                </div>
            </Section>

            <Section title="Non-filterable Select">
                <BpSelect<string>
                    items={SELECT_ITEMS}
                    filterable={false}
                    itemRenderer={(item, { modifiers, handleClick }) => (
                        <MenuItem
                            key={item}
                            roleStructure="listoption"
                            text={item}
                            active={modifiers.active}
                            icon={item === selected ? "tick" : undefined}
                            onClick={handleClick}
                        />
                    )}
                    onItemSelect={(item) => setSelected(item)}
                    popoverProps={{
                        minimal: true,
                        portalClassName: dark ? Classes.DARK : undefined,
                    }}
                >
                    <Button rightIcon="caret-down">
                        {selected ?? "Select a fruit…"}
                    </Button>
                </BpSelect>
            </Section>

            <Section title="Disabled">
                <BpSelect<string>
                    items={SELECT_ITEMS}
                    itemRenderer={(item, { modifiers, handleClick }) => (
                        <MenuItem
                            key={item}
                            roleStructure="listoption"
                            text={item}
                            active={modifiers.active}
                            onClick={handleClick}
                        />
                    )}
                    onItemSelect={(item) => setSelected(item)}
                    disabled={true}
                    popoverProps={{
                        minimal: true,
                        portalClassName: dark ? Classes.DARK : undefined,
                    }}
                >
                    <Button rightIcon="caret-down" disabled={true}>
                        {selected ?? "Select a fruit…"}
                    </Button>
                </BpSelect>
            </Section>
        </div>
    );
}

// ─── Suggest items (same list as analyst-ui SuggestGallery) ──────────────────
const SUGGEST_ITEMS = SELECT_ITEMS; // ["Apple", "Banana", "Cherry", ...]
const SUGGEST_SELECTED = SELECT_SELECTED; // "Cherry"

/**
 * Blueprint reference for Suggest. Uses @blueprintjs/select's Suggest<T>.
 *
 * Strategy: Force the popover OPEN so the harness can screenshot the input and menu
 * items without interaction. We use popoverProps={{ isOpen: true }} and stamp
 * data-compare on portaled DOM nodes via useEffect.
 *
 * Dark mode: pass popoverProps={{ portalClassName: Classes.DARK }} when theme=dark
 * so Blueprint's portaled menu renders in dark mode.
 *
 * data-compare keys (MUST match analyst-ui SuggestGallery):
 *   suggest-input        — the InputGroup's <input> element (trigger + filter)
 *   suggest-menu         — the menu <ul> element inside the popover (portaled)
 *   suggest-item         — Apple (index 0, non-active, non-selected)
 *   suggest-item-active  — Cherry (index 2, active because it's the selectedItem)
 *
 * NOTE: We do NOT use roleStructure="listoption" so that paddingLeft is 8px
 * on both sides (no indent from SELECTABLE class). The tick icon is shown via
 * icon="tick" prop on the selected item, maintaining visual consistency.
 * Blueprint's activeItem is initialized to selectedItem (Cherry) by Suggest.
 */
function SuggestGallery() {
    const dark = new URLSearchParams(window.location.search).get("theme") === "dark";
    const [selected, setSelected] = useState<string | null>(SUGGEST_SELECTED);

    // Stamp data-compare on portaled nodes after render
    useEffect(() => {
        function tag() {
            // suggest-input: Blueprint Suggest renders the input with role="combobox".
            const input = document.querySelector<HTMLElement>(
                `input[role="combobox"]`,
            );
            if (input) input.setAttribute("data-compare", "suggest-input");

            // suggest-menu: Blueprint renders the menu as a <ul role="listbox"> inside the portaled popover
            const menuUl = document.querySelector<HTMLElement>(
                `ul.bp6-menu[role="listbox"]`,
            );
            if (menuUl) {
                menuUl.setAttribute("data-compare", "suggest-menu");

                // suggest-item: Apple is index 0 (non-active, non-selected)
                const appleLi = menuUl.children[0] as HTMLElement | undefined;
                if (appleLi) {
                    const anchor = appleLi.querySelector("a.bp6-menu-item,button.bp6-menu-item");
                    if (anchor) anchor.setAttribute("data-compare", "suggest-item");
                }

                // suggest-item-active: Cherry is index 2 (active — it's the selectedItem which
                // Blueprint Suggest uses as initialActiveItem)
                const cherryLi = menuUl.children[2] as HTMLElement | undefined;
                if (cherryLi) {
                    const anchor = cherryLi.querySelector("a.bp6-menu-item,button.bp6-menu-item");
                    if (anchor) anchor.setAttribute("data-compare", "suggest-item-active");
                }
            }
        }
        tag();
        const t = setTimeout(tag, 150);
        return () => clearTimeout(t);
    });

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <Section title="Suggest (typeahead, popover open for comparison)">
                <div style={{ width: 300 }}>
                    <BpSuggest<string>
                        items={SUGGEST_ITEMS}
                        selectedItem={selected}
                        inputValueRenderer={(item) => item}
                        itemRenderer={(item, { modifiers, handleClick }) => (
                            <MenuItem
                                key={item}
                                text={item}
                                active={modifiers.active}
                                icon={item === selected ? "tick" : undefined}
                                onClick={handleClick}
                            />
                        )}
                        itemPredicate={(query, item) =>
                            item.toLowerCase().includes(query.toLowerCase())
                        }
                        onItemSelect={(item) => setSelected(item)}
                        noResults={<MenuItem disabled={true} text="No results." />}
                        fill={true}
                        popoverProps={{
                            isOpen: true,
                            minimal: true,
                            matchTargetWidth: true,
                            portalClassName: dark ? Classes.DARK : undefined,
                        }}
                    />
                </div>
            </Section>

            <Section title="Disabled">
                <BpSuggest<string>
                    items={SUGGEST_ITEMS}
                    selectedItem={selected}
                    inputValueRenderer={(item) => item}
                    itemRenderer={(item, { modifiers, handleClick }) => (
                        <MenuItem
                            key={item}
                            roleStructure="listoption"
                            text={item}
                            active={modifiers.active}
                            onClick={handleClick}
                        />
                    )}
                    itemPredicate={(query, item) =>
                        item.toLowerCase().includes(query.toLowerCase())
                    }
                    onItemSelect={(item) => setSelected(item)}
                    disabled={true}
                    popoverProps={{
                        minimal: true,
                        portalClassName: dark ? Classes.DARK : undefined,
                    }}
                />
            </Section>
        </div>
    );
}

// ─── MultiSelect items (same list as analyst-ui MultiSelectGallery) ─────────
const MULTI_SELECT_ITEMS = SELECT_ITEMS; // ["Apple", "Banana", "Cherry", ...]
const MULTI_SELECT_SELECTED = ["Banana", "Cherry"];

/**
 * Blueprint reference for MultiSelect. Uses @blueprintjs/select's MultiSelect<T>.
 *
 * Strategy: Force the popover OPEN so the harness can screenshot chips and menu items
 * without interaction. We stamp data-compare on portaled DOM nodes via useEffect.
 *
 * Dark mode: pass popoverProps={{ portalClassName: Classes.DARK }} when theme=dark
 * so Blueprint's portaled menu renders in dark mode.
 *
 * data-compare keys (MUST match analyst-ui MultiSelectGallery):
 *   multi-select-container  — the TagInput-like trigger container
 *   multi-select-tag        — the first Tag chip (Banana)
 *   multi-select-menu       — the menu <ul> element inside the popover (portaled)
 *   multi-select-item       — Durian (index 3, non-active, non-selected)
 *   multi-select-item-active — Apple (index 0, active by default — first enabled item)
 */
function MultiSelectGallery() {
    const dark = new URLSearchParams(window.location.search).get("theme") === "dark";
    const [selected, setSelected] = useState<string[]>(MULTI_SELECT_SELECTED);
    const containerRef = useRef<HTMLDivElement>(null);

    // Stamp data-compare on portaled nodes after render
    useEffect(() => {
        function tag() {
            // multi-select-container: Blueprint renders TagInput as root element
            if (containerRef.current) {
                const container = containerRef.current.querySelector(".bp6-tag-input");
                if (container) container.setAttribute("data-compare", "multi-select-container");

                // multi-select-tag: first Tag chip inside the container
                const firstTag = containerRef.current.querySelector(".bp6-tag");
                if (firstTag) firstTag.setAttribute("data-compare", "multi-select-tag");
            }

            // multi-select-menu: Blueprint renders the menu as <ul role="listbox">
            const menuUl = document.querySelector<HTMLElement>(
                `ul.bp6-menu[role="listbox"]`,
            );
            if (menuUl) {
                menuUl.setAttribute("data-compare", "multi-select-menu");

                // multi-select-item-active: Apple is index 0 (first item, active by default)
                const appleLi = menuUl.children[0] as HTMLElement | undefined;
                if (appleLi) {
                    const anchor = appleLi.querySelector("a.bp6-menu-item,button.bp6-menu-item");
                    if (anchor) anchor.setAttribute("data-compare", "multi-select-item-active");
                }

                // multi-select-item: Durian is index 3 (non-active, non-selected)
                const durianLi = menuUl.children[3] as HTMLElement | undefined;
                if (durianLi) {
                    const anchor = durianLi.querySelector("a.bp6-menu-item,button.bp6-menu-item");
                    if (anchor) anchor.setAttribute("data-compare", "multi-select-item");
                }
            }
        }
        tag();
        const t = setTimeout(tag, 150);
        return () => clearTimeout(t);
    });

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <Section title="MultiSelect (chips + popover open for comparison)">
                <div style={{ width: 400 }} ref={containerRef}>
                    <BpMultiSelect<string>
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
                        onRemove={(_tag, index) =>
                            setSelected((s) => s.filter((_, i) => i !== index))
                        }
                        noResults={<MenuItem disabled={true} text="No results." />}
                        fill={true}
                        popoverProps={{
                            isOpen: true,
                            minimal: true,
                            matchTargetWidth: true,
                            portalClassName: dark ? Classes.DARK : undefined,
                        }}
                    />
                </div>
            </Section>

            <Section title="Disabled">
                <div style={{ width: 400 }}>
                    <BpMultiSelect<string>
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
                        disabled={true}
                        fill={true}
                        popoverProps={{
                            minimal: true,
                            portalClassName: dark ? Classes.DARK : undefined,
                        }}
                    />
                </div>
            </Section>
        </div>
    );
}

// ─── Omnibar items (same list as Select items) ────────────────────────────
const OMNIBAR_ITEMS = SELECT_ITEMS; // ["Apple", "Banana", "Cherry", ...]

/**
 * Blueprint reference for Omnibar. Uses @blueprintjs/select's Omnibar<T>.
 *
 * Strategy: Force isOpen=true so the harness can screenshot the portaled panel,
 * input, and menu items without interaction. Stamp data-compare on portaled DOM
 * nodes via useEffect (panel, input, menu, items).
 *
 * Dark mode: pass overlayProps={{ portalClassName: Classes.DARK }} when theme=dark
 * so Blueprint's portaled Omnibar panel renders in dark mode.
 *
 * data-compare keys (MUST match analyst-ui OmnibarGallery):
 *   omnibar-panel        — the elevated panel div (portaled)
 *   omnibar-input        — the search <input> element
 *   omnibar-menu         — the menu <ul> element
 *   omnibar-item         — Cherry (index 2, non-active item)
 *   omnibar-item-active  — Apple (index 0, active by default — first enabled item)
 */
function OmnibarGallery() {
    const dark = new URLSearchParams(window.location.search).get("theme") === "dark";

    // Stamp data-compare on portaled nodes after render
    useEffect(() => {
        function tag() {
            // omnibar-panel: Blueprint renders the omnibar as .bp6-omnibar
            const panel = document.querySelector<HTMLElement>(".bp6-omnibar");
            if (panel) panel.setAttribute("data-compare", "omnibar-panel");

            // omnibar-input: the <input> element inside the panel
            const inputEl = document.querySelector<HTMLElement>(".bp6-omnibar input");
            if (inputEl) inputEl.setAttribute("data-compare", "omnibar-input");

            // omnibar-menu: Blueprint renders the menu as <ul class="bp6-menu">
            const menuUl = document.querySelector<HTMLElement>(".bp6-omnibar .bp6-menu");
            if (menuUl) {
                menuUl.setAttribute("data-compare", "omnibar-menu");

                // omnibar-item-active: Apple is index 0 (first item, active by default)
                const appleLi = menuUl.children[0] as HTMLElement | undefined;
                if (appleLi) {
                    const anchor = appleLi.querySelector("a.bp6-menu-item,button.bp6-menu-item");
                    if (anchor) anchor.setAttribute("data-compare", "omnibar-item-active");
                }

                // omnibar-item: Cherry is index 2 (non-active, non-first)
                const cherryLi = menuUl.children[2] as HTMLElement | undefined;
                if (cherryLi) {
                    const anchor = cherryLi.querySelector("a.bp6-menu-item,button.bp6-menu-item");
                    if (anchor) anchor.setAttribute("data-compare", "omnibar-item");
                }
            }
        }
        tag();
        const t = setTimeout(tag, 150);
        return () => clearTimeout(t);
    });

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <Section title="Omnibar (open for comparison)">
                <div style={{ position: "relative", height: 320, border: "1px dashed #aaa", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: "#888" }}>Omnibar panel is portaled above this area</span>
                    <BpOmnibar<string>
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
                                roleStructure="menuitem"
                            />
                        )}
                        onItemSelect={() => {}}
                        // initialContent={undefined} bypasses Blueprint's default behavior of showing
                        // nothing when query is empty. With initialContent=null (Blueprint's Omnibar
                        // default), renderFilteredItems() returns null when query.length===0, hiding
                        // all items. Setting to undefined makes it show items immediately (like our Omnibar).
                        initialContent={undefined}
                        overlayProps={{
                            portalClassName: dark ? Classes.DARK : undefined,
                        }}
                    />
                </div>
            </Section>
        </div>
    );
}

// ---------------------------------------------------------------------------
// TimePicker reference gallery
// Fixed value: 14:30 (same as analyst-ui gallery) for stable static diff.
// data-compare keys (MUST match analyst-ui TimePickerGallery):
//   time-picker-input   → the hour <input> element (first specimen)
//   time-picker-divider → the colon divider span (first specimen)
//   time-picker-arrow   → the first up-arrow button (arrows specimen)
//   time-picker-ampm    → the AM/PM <select> element (ampm specimen)
// ---------------------------------------------------------------------------
const FIXED_TIME = new Date();
FIXED_TIME.setHours(14, 30, 0, 0);

const FIXED_TIME_SECOND = new Date();
FIXED_TIME_SECOND.setHours(14, 30, 45, 0);

const FIXED_TIME_AMPM = new Date();
FIXED_TIME_AMPM.setHours(14, 30, 0, 0);

function TimePickerGallery() {
    const defaultRef = useRef<HTMLDivElement>(null);
    const arrowRef = useRef<HTMLDivElement>(null);
    const secondRef = useRef<HTMLDivElement>(null);
    const ampmRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function tag() {
            // Default specimen: stamp time-picker-input (hour input) and time-picker-divider
            if (defaultRef.current) {
                // Blueprint renders .bp6-timepicker-input elements
                const inputs = defaultRef.current.querySelectorAll<HTMLElement>("input.bp6-timepicker-input");
                if (inputs[0]) inputs[0].setAttribute("data-compare", "time-picker-input");
                // Blueprint renders .bp6-timepicker-divider-text spans
                const dividers = defaultRef.current.querySelectorAll<HTMLElement>(".bp6-timepicker-divider-text");
                if (dividers[0]) dividers[0].setAttribute("data-compare", "time-picker-divider");
            }

            // Arrow buttons specimen: stamp the first up-arrow button
            if (arrowRef.current) {
                const arrows = arrowRef.current.querySelectorAll<HTMLElement>(".bp6-timepicker-arrow-button");
                // Blueprint renders: [up-hour, up-minute] in top row, then [down-hour, down-minute] in bottom
                if (arrows[0]) arrows[0].setAttribute("data-compare", "time-picker-arrow");
            }

            // AM/PM specimen: stamp the <select> element
            if (ampmRef.current) {
                const sel = ampmRef.current.querySelector<HTMLElement>("select.bp6-timepicker-ampm-select, select");
                if (sel) sel.setAttribute("data-compare", "time-picker-ampm");
            }
        }
        tag();
        const t = setTimeout(tag, 150);
        return () => clearTimeout(t);
    });

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {/* Default: hour + minute at 14:30 */}
            <div ref={defaultRef} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ fontSize: 12, opacity: 0.6 }}>Default (14:30)</span>
                <BpTimePicker value={FIXED_TIME} onChange={() => {}} />
            </div>

            {/* Arrow buttons */}
            <div ref={arrowRef} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ fontSize: 12, opacity: 0.6 }}>With arrow buttons</span>
                <BpTimePicker value={FIXED_TIME} onChange={() => {}} showArrowButtons />
            </div>

            {/* Seconds precision */}
            <div ref={secondRef} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ fontSize: 12, opacity: 0.6 }}>Seconds precision (14:30:45)</span>
                <BpTimePicker value={FIXED_TIME_SECOND} onChange={() => {}} precision="second" />
            </div>

            {/* AM/PM mode */}
            <div ref={ampmRef} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ fontSize: 12, opacity: 0.6 }}>AM/PM mode (2:30 PM)</span>
                <BpTimePicker value={FIXED_TIME_AMPM} onChange={() => {}} useAmPm />
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// DatePicker reference gallery
// Fixed selected date: 2026-01-15. Fixed display month: January 2026.
// Blueprint DatePicker uses "initialMonth" to set the displayed month.
// We set value=FIXED_DATE so the selected state is fixed.
//
// data-compare keys (MUST match analyst-ui DatePickerGallery):
//   date-picker-nav           → the previous-month nav button
//   date-picker-weekday       → a weekday header cell (first "Su" cell)
//   date-picker-day           → a regular (non-selected, non-outside) day cell
//   date-picker-day-selected  → the selected day cell (Jan 15, 2026)
//
// We use useEffect + querySelector to stamp data-compare on Blueprint's DOM.
// Blueprint's DatePicker renders react-day-picker v8 DOM with bp6- classes.
// ---------------------------------------------------------------------------
const FIXED_DATE_BP = new Date(2026, 0, 15); // Jan 15, 2026
const FIXED_MONTH_BP = new Date(2026, 0, 1); // January 2026

function DatePickerGallery() {
    const basicRef = useRef<HTMLDivElement>(null);
    const timeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function tag() {
            // Tag in the first (basic) specimen
            // Blueprint's DatePicker uses react-day-picker v8 internally.
            // In rdp v8: day buttons are <button class="rdp-day [rdp-day_outside] [rdp-day_selected]">
            // In rdp v8 with Blueprint overrides: Blueprint maps rdp class names to bp6- equivalents.
            // dayPickerClassNameOverrides maps: nav_button_previous → bp6-datepicker-nav-button-previous
            //   head_cell → NOT overridden (stays rdp-head_cell)
            //   day → rdp-day (not overridden)
            //   day_selected → rdp-day_selected (not overridden)
            const root = basicRef.current;
            if (root) {
                // Nav button: Blueprint maps nav_button_previous → .bp6-datepicker-nav-button-previous
                // These are also .bp6-button.bp6-minimal elements
                const prevBtn = root.querySelector<HTMLElement>(
                    ".bp6-datepicker-nav-button-previous, .bp6-button[aria-label*='previous'], button[aria-label*='Previous']"
                );
                if (prevBtn) prevBtn.setAttribute("data-compare", "date-picker-nav");

                // Weekday header: rdp v8 uses th.rdp-head_cell
                const weekdayCells = root.querySelectorAll<HTMLElement>("th.rdp-head_cell");
                if (weekdayCells[0]) weekdayCells[0].setAttribute("data-compare", "date-picker-weekday");

                // Selected day: in rdp v8, the button itself has .rdp-day_selected
                const selectedDay = root.querySelector<HTMLElement>("button.rdp-day_selected");
                if (selectedDay) selectedDay.setAttribute("data-compare", "date-picker-day-selected");

                // Normal day: rdp v8 button.rdp-day, pick Jan 4 (stable, not today, not selected, not outside)
                // In rdp v8, the button text content is the day number (e.g. "4")
                const dayButtons = root.querySelectorAll<HTMLElement>(
                    "button.rdp-day:not(.rdp-day_outside):not(.rdp-day_selected):not(.rdp-day_disabled)"
                );
                let normalDay: HTMLElement | null = null;
                for (let i = 0; i < dayButtons.length; i++) {
                    const btn = dayButtons[i];
                    // Match Jan 4 specifically (text content "4")
                    if ((btn.textContent ?? "").trim() === "4") {
                        normalDay = btn;
                        break;
                    }
                }
                // Fallback: first available non-special day
                if (!normalDay && dayButtons[0]) normalDay = dayButtons[0];
                if (normalDay) normalDay.setAttribute("data-compare", "date-picker-day");
            }
        }
        tag();
        const t1 = setTimeout(tag, 100);
        const t2 = setTimeout(tag, 300);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    });

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {/* Basic specimen — fixed selected date + month */}
            <div ref={basicRef} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ fontSize: 12, opacity: 0.6 }}>Basic (Jan 15, 2026 selected)</span>
                <BpDatePicker
                    value={FIXED_DATE_BP}
                    onChange={() => {}}
                    initialMonth={FIXED_MONTH_BP}
                />
            </div>

            {/* With TimePicker */}
            <div ref={timeRef} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ fontSize: 12, opacity: 0.6 }}>With TimePicker (minute precision)</span>
                <BpDatePicker
                    value={FIXED_DATE_BP}
                    onChange={() => {}}
                    initialMonth={FIXED_MONTH_BP}
                    timePrecision="minute"
                />
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// DateInput reference gallery
// Blueprint DateInput with fixed date 2026-01-15, popover open.
//
// data-compare keys (MUST match analyst-ui DateInputGallery):
//   date-input-field        → the InputGroup <input> element
//   date-input-day          → a regular (non-selected, non-outside) day cell (Jan 4)
//   date-input-day-selected → the selected day cell (Jan 15, 2026)
//
// Blueprint's DateInput renders a Popover with a DatePicker inside.
// The popover content is portaled to document.body.
// We use isOpen=true on popoverProps to force the popover open.
// We use useEffect + querySelector to stamp data-compare on the portaled DOM.
//
// Dark mode: pass popoverProps={{ portalClassName: Classes.DARK }} when theme=dark
// so Blueprint's portaled DatePicker content gets dark styles.
// ---------------------------------------------------------------------------

function DateInputGallery() {
    const dark = INITIAL_DARK;
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function tag() {
            // The portaled content is at document.body level (outside containerRef),
            // so we search the whole document for the DatePicker cells.
            // Blueprint's DateInput uses DatePicker → react-day-picker v8 internally.

            // Input field: Blueprint renders an InputGroup with an <input>
            const inputEl = containerRef.current?.querySelector<HTMLElement>("input");
            if (inputEl) inputEl.setAttribute("data-compare", "date-input-field");

            // DatePicker cells in the portaled popover:
            // rdp v8: button.rdp-day_selected for selected, button.rdp-day for normal days
            const selectedDay = document.querySelector<HTMLElement>(
                ".bp6-date-input-popover button.rdp-day_selected, .bp6-datepicker button.rdp-day_selected"
            );
            if (selectedDay) selectedDay.setAttribute("data-compare", "date-input-day-selected");

            // Normal day: pick Jan 4 (text "4", not selected, not outside, not disabled)
            const dayButtons = document.querySelectorAll<HTMLElement>(
                ".bp6-date-input-popover button.rdp-day:not(.rdp-day_outside):not(.rdp-day_selected):not(.rdp-day_disabled), " +
                ".bp6-datepicker button.rdp-day:not(.rdp-day_outside):not(.rdp-day_selected):not(.rdp-day_disabled)"
            );
            let normalDay: HTMLElement | null = null;
            for (let i = 0; i < dayButtons.length; i++) {
                const btn = dayButtons[i];
                if ((btn.textContent ?? "").trim() === "4") {
                    normalDay = btn;
                    break;
                }
            }
            if (!normalDay && dayButtons[0]) normalDay = dayButtons[0];
            if (normalDay) normalDay.setAttribute("data-compare", "date-input-day");
        }

        tag();
        const t1 = setTimeout(tag, 100);
        const t2 = setTimeout(tag, 300);
        const t3 = setTimeout(tag, 600);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    });

    const formatDate = (date: Date) => {
        const m = date.getMonth() + 1;
        const d = date.getDate();
        const y = date.getFullYear();
        return `${m}/${d}/${y}`;
    };

    const parseDate = (str: string) => {
        const parts = str.trim().split(/[\/\-\.]/);
        if (parts.length === 3) {
            const m = parseInt(parts[0], 10);
            const d = parseInt(parts[1], 10);
            const y = parseInt(parts[2], 10);
            if (!isNaN(m) && !isNaN(d) && !isNaN(y)) {
                return new Date(y, m - 1, d);
            }
        }
        return new Date(str);
    };

    return (
        <div ref={containerRef} style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 200 }}>
                <span style={{ fontSize: 12, opacity: 0.6 }}>DateInput (open, Jan 15 2026 selected)</span>
                <BpDateInput
                    value={FIXED_DATE_BP.toISOString()}
                    onChange={() => {}}
                    formatDate={formatDate}
                    parseDate={parseDate}
                    placeholder="M/d/yyyy"
                    popoverProps={{
                        isOpen: true,
                        portalClassName: dark ? Classes.DARK : undefined,
                        // Keep popover open — prevent close events
                        onClose: () => {},
                    }}
                />
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// DateRangePicker reference gallery
// Blueprint DateRangePicker with fixed range Jan 8 – Jan 20, 2026.
// Left calendar: January 2026. Right calendar: February 2026 (contiguous).
//
// data-compare keys (MUST match analyst-ui DateRangePickerGallery):
//   drp-day         → a regular (non-range) day — Jan 4
//   drp-day-range   → an in-range (between) day — Jan 10
//   drp-day-endpoint → start (Jan 8) or end (Jan 20)
//
// Blueprint's DateRangePicker uses react-day-picker v8 internally.
// We use useEffect + querySelector to stamp data-compare on Blueprint's DOM.
// ---------------------------------------------------------------------------
const DRP_START_BP = new Date(2026, 0, 8);   // Jan 8, 2026
const DRP_END_BP = new Date(2026, 0, 20);    // Jan 20, 2026
const DRP_LEFT_MONTH_BP = new Date(2026, 0, 1); // January 2026 (initial month for left calendar)

function DateRangePickerGallery() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function tag() {
            const root = containerRef.current;
            if (!root) return;

            // In rdp v8, range days have these classes:
            //   rdp-day_range_start, rdp-day_range_end, rdp-day_range_middle
            // Blueprint may also apply their own class names via dayPickerClassNameOverrides.
            // We use text content matching to pick stable cells.

            // Tag: drp-day-endpoint → start day (Jan 8) or end day (Jan 20)
            // rdp v8: button.rdp-day.rdp-day_range_start and button.rdp-day.rdp-day_range_end
            const rangeStart = root.querySelector<HTMLElement>(
                "button.rdp-day_range_start, button[class*='range_start'], button[class*='range-start']"
            );
            if (rangeStart) rangeStart.setAttribute("data-compare", "drp-day-endpoint");

            const rangeEnd = root.querySelector<HTMLElement>(
                "button.rdp-day_range_end:not(.rdp-day_range_start), button[class*='range_end']:not([class*='range_start'])"
            );
            if (rangeEnd) rangeEnd.setAttribute("data-compare", "drp-day-endpoint");

            // Tag: drp-day-range → an in-range day (Jan 10)
            // rdp v8: button.rdp-day.rdp-day_range_middle with text content "10"
            const middleDays = root.querySelectorAll<HTMLElement>(
                "button.rdp-day_range_middle, button[class*='range_middle']"
            );
            for (let i = 0; i < middleDays.length; i++) {
                const btn = middleDays[i];
                if ((btn.textContent ?? "").trim() === "10") {
                    btn.setAttribute("data-compare", "drp-day-range");
                    break;
                }
            }
            // Fallback: first middle day
            if (!root.querySelector("[data-compare='drp-day-range']") && middleDays[0]) {
                middleDays[0].setAttribute("data-compare", "drp-day-range");
            }

            // Tag: drp-day → a normal (non-range) day — Jan 4
            const dayButtons = root.querySelectorAll<HTMLElement>(
                "button.rdp-day:not(.rdp-day_outside):not(.rdp-day_selected):not(.rdp-day_disabled):not(.rdp-day_range_start):not(.rdp-day_range_end):not(.rdp-day_range_middle)"
            );
            let normalDay: HTMLElement | null = null;
            for (let i = 0; i < dayButtons.length; i++) {
                const btn = dayButtons[i];
                if ((btn.textContent ?? "").trim() === "4") {
                    normalDay = btn;
                    break;
                }
            }
            if (!normalDay && dayButtons[0]) normalDay = dayButtons[0];
            if (normalDay) normalDay.setAttribute("data-compare", "drp-day");
        }

        tag();
        const t1 = setTimeout(tag, 100);
        const t2 = setTimeout(tag, 300);
        const t3 = setTimeout(tag, 600);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    });

    return (
        <div ref={containerRef} style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {/* Main specimen — fixed range, two months side-by-side */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ fontSize: 12, opacity: 0.6 }}>
                    Jan 8 – Jan 20, 2026 selected (January + February 2026)
                </span>
                <BpDateRangePicker
                    value={[DRP_START_BP, DRP_END_BP]}
                    onChange={() => {}}
                    initialMonth={DRP_LEFT_MONTH_BP}
                    shortcuts={false}
                    contiguousCalendarMonths={true}
                />
            </div>

            {/* Single-month variant */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ fontSize: 12, opacity: 0.6 }}>
                    Single month (Jan 8 – Jan 20, 2026)
                </span>
                <BpDateRangePicker
                    value={[DRP_START_BP, DRP_END_BP]}
                    onChange={() => {}}
                    initialMonth={DRP_LEFT_MONTH_BP}
                    shortcuts={false}
                    singleMonthOnly={true}
                />
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// DateRangeInput reference gallery
// Blueprint DateRangeInput with fixed range Jan 8 – Jan 20, 2026.
// Popover forced open via popoverProps={{ isOpen: true }}.
//
// data-compare keys (MUST match analyst-ui DateRangeInputGallery):
//   dri-start         → the start <input> element
//   dri-end           → the end <input> element
//   dri-day-endpoint  → a filled endpoint day in the open DateRangePicker
//
// The portaled DateRangePicker content is searched via document.querySelector
// (not containerRef — it's in the portal).
// ---------------------------------------------------------------------------
const DRI_START_BP = new Date(2026, 0, 8);  // Jan 8, 2026
const DRI_END_BP = new Date(2026, 0, 20);   // Jan 20, 2026
const DRI_LEFT_MONTH_BP = new Date(2026, 0, 1); // January 2026

function DateRangeInputGallery() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function tag() {
            const root = containerRef.current;
            if (!root) return;

            // Tag start and end inputs (they live in containerRef, not the portal)
            const inputs = root.querySelectorAll<HTMLElement>("input");
            if (inputs[0]) inputs[0].setAttribute("data-compare", "dri-start");
            if (inputs[1]) inputs[1].setAttribute("data-compare", "dri-end");

            // Tag endpoint day in the portaled calendar
            // Blueprint DateRangeInput popover gets class .bp6-date-range-input-popover
            // rdp v8: button.rdp-day_range_start and rdp-day_range_end
            const rangeStart = document.querySelector<HTMLElement>(
                "button.rdp-day_range_start, button[class*='range_start']"
            );
            if (rangeStart) rangeStart.setAttribute("data-compare", "dri-day-endpoint");
        }

        tag();
        const t1 = setTimeout(tag, 100);
        const t2 = setTimeout(tag, 300);
        const t3 = setTimeout(tag, 600);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    });

    const formatDate = (date: Date) => {
        const m = date.getMonth() + 1;
        const d = date.getDate();
        const y = date.getFullYear();
        return `${m}/${d}/${y}`;
    };

    const parseDate = (str: string) => {
        const parts = str.trim().split(/[\/\-\.]/);
        if (parts.length === 3) {
            const m = parseInt(parts[0], 10);
            const d = parseInt(parts[1], 10);
            const y = parseInt(parts[2], 10);
            if (!isNaN(m) && !isNaN(d) && !isNaN(y)) {
                return new Date(y, m - 1, d);
            }
        }
        return new Date(str);
    };

    return (
        <div ref={containerRef} style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {/* Interactive specimen */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ fontSize: 12, opacity: 0.6 }}>DateRangeInput (interactive, Jan 8 – Jan 20 2026)</span>
                <BpDateRangeInput
                    value={[DRI_START_BP, DRI_END_BP]}
                    onChange={() => {}}
                    formatDate={formatDate}
                    parseDate={parseDate}
                    shortcuts={false}
                    contiguousCalendarMonths={true}
                />
            </div>

            {/* Harness specimen — popover forced open */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ fontSize: 12, opacity: 0.6 }}>DateRangeInput (open, Jan 8 – Jan 20, 2026)</span>
                <BpDateRangeInput
                    value={[DRI_START_BP, DRI_END_BP]}
                    onChange={() => {}}
                    formatDate={formatDate}
                    parseDate={parseDate}
                    shortcuts={false}
                    contiguousCalendarMonths={true}
                    popoverProps={{
                        isOpen: true,
                        portalClassName: INITIAL_DARK ? Classes.DARK : undefined,
                        onClose: () => {},
                    }}
                />
            </div>
        </div>
    );
}

// ─── TimezoneSelect reference gallery ───────────────────────────────────────
// Blueprint TimezoneSelect with popover forced open for comparison.
//
// data-compare keys (MUST match analyst-ui TimezoneSelectGallery):
//   tz-trigger     — the trigger button
//   tz-menu        — the menu <ul> inside the popover (portaled)
//   tz-item        — a non-active MenuItem (New York — position 6 in minimal list)
//   tz-item-offset — the offset label on that same item
//
// Blueprint's TimezoneSelect initial list (empty query) uses MINIMAL_TIMEZONE_ITEMS.
// The order matches: UTC(0), Honolulu(1), Anchorage(2), LA(3), Denver(4), Chicago(5), NewYork(6).
// We tag index 6 to match our analyst gallery's tz-item (New York).
// ---------------------------------------------------------------------------

const TZ_SELECTED_BP = "America/Los_Angeles"; // "Los Angeles" — shown in trigger

function TimezoneSelectGallery() {
    const dark = new URLSearchParams(window.location.search).get("theme") === "dark";
    const [value, setValue] = useState<string>(TZ_SELECTED_BP);

    useEffect(() => {
        function tag() {
            // tz-trigger: the trigger button rendered by Blueprint's TimezoneSelect
            // Blueprint renders a <button class="bp6-button"> as the trigger
            // We look for it by finding the button that does NOT have bp6-menu-item class
            // and is inside our gallery container. We find it via the tz-trigger data attribute
            // which we set manually below.

            // tz-menu: Blueprint's Select renders a <ul role="listbox" class="bp6-menu"> in the portal
            const menuUl = document.querySelector<HTMLElement>("ul.bp6-menu[role='listbox']");
            if (!menuUl) return;
            menuUl.setAttribute("data-compare", "tz-menu");

            // NOTE: we deliberately do NOT tag .bp6-popover-content as "popover-content" here.
            // Analyst's Popover auto-tags its transparent transition WRAPPER (shadow, no bg/radius),
            // which sits at a different nesting level than Blueprint's styled .bp6-popover-content
            // panel — pairing them yields a false bg/shadow/radius diff. The harness's benign
            // "only in analyst: popover-content" note is the honest signal.

            // tz-item: "Denver" — index 6 in Blueprint's MINIMAL_TIMEZONE_ITEMS.
            // Real order: 0=UTC, 1=Pago Pago, 2=Hawaii(Honolulu), 3=Marquesas, 4=Alaska(Anchorage),
            //   5=LA, 6=Denver, 7=Mexico City, 8=New York … (analyst's minimal list now matches this order).
            const itemLi = menuUl.children[6] as HTMLElement | undefined;
            if (itemLi) {
                const anchor = itemLi.querySelector<HTMLElement>("a.bp6-menu-item, button.bp6-menu-item");
                if (anchor) {
                    anchor.setAttribute("data-compare", "tz-item");
                    // tz-item-offset: Blueprint renders the label (shortName) as a span.bp6-menu-item-label
                    const labelSpan = anchor.querySelector<HTMLElement>(".bp6-menu-item-label");
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
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <Section title="TimezoneSelect (popover open for comparison)">
                <div style={{ width: 320 }}>
                    <BpTimezoneSelect
                        value={value}
                        onChange={setValue}
                        buttonProps={{ "data-compare": "tz-trigger" } as React.ComponentProps<typeof Button>}
                        popoverProps={{
                            isOpen: true,
                            minimal: true,
                            portalClassName: dark ? Classes.DARK : undefined,
                            onClose: () => {},
                        }}
                    />
                </div>
            </Section>

            <Section title="Interactive TimezoneSelect">
                <div style={{ width: 320 }}>
                    <BpTimezoneSelect
                        value={value}
                        onChange={setValue}
                        popoverProps={{
                            minimal: true,
                            portalClassName: dark ? Classes.DARK : undefined,
                        }}
                    />
                </div>
            </Section>

            <Section title="Disabled">
                <BpTimezoneSelect
                    value={value}
                    onChange={setValue}
                    disabled={true}
                />
            </Section>
        </div>
    );
}

const COMPONENTS: { id: string; title: string; render: () => React.ReactNode }[] = [
    { id: "button", title: "Button", render: () => <ButtonGallery /> },
    { id: "button-group", title: "ButtonGroup", render: () => <ButtonGroupGallery /> },
    { id: "anchor-button", title: "AnchorButton", render: () => <AnchorButtonGallery /> },
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
    { id: "multistep-dialog", title: "MultistepDialog", render: () => <MultistepDialogGallery /> },
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

/**
 * Sidebar category grouping — kept in lock-step with the analyst-ui gallery
 * (src/App.tsx) so the two galleries navigate identically for side-by-side comparison.
 * Any id missing from every group falls into "Other" so nothing is dropped.
 */
const CATEGORIES: { label: string; ids: string[] }[] = [
    { label: "Buttons & display", ids: ["button", "card", "icon", "text", "divider", "spinner", "progress-bar", "skeleton", "tag", "callout"] },
    { label: "Form controls", ids: ["input-group", "text-area", "checkbox", "radio", "switch", "form-group", "control-group", "html-select", "file-input", "numeric-input", "segmented-control", "control-card"] },
    { label: "Overlays", ids: ["dialog", "alert", "drawer", "popover", "tooltip", "toast", "menu", "context-menu"] },
    { label: "Navigation & structure", ids: ["navbar", "tabs", "collapse", "section", "card-list", "breadcrumbs", "tree", "panel-stack", "html-table", "editable-text", "entity-title", "non-ideal-state", "link", "slider", "hotkeys"] },
    { label: "Composite selects", ids: ["tag-input", "select", "suggest", "multi-select", "omnibar"] },
    { label: "Date & time", ids: ["time-picker", "date-picker", "date-input", "date-range-picker", "date-range-input", "timezone-select"] },
];

type ComponentEntry = (typeof COMPONENTS)[number];

const CATEGORY_GROUPS: { label: string; items: ComponentEntry[] }[] = (() => {
    const byId = new Map(COMPONENTS.map((c) => [c.id, c]));
    const groups = CATEGORIES.map((g) => ({
        label: g.label,
        items: g.ids.map((id) => byId.get(id)).filter((c): c is ComponentEntry => c != null),
    }));
    const seen = new Set(CATEGORIES.flatMap((g) => g.ids));
    const leftover = COMPONENTS.filter((c) => !seen.has(c.id));
    if (leftover.length) groups.push({ label: "Other", items: leftover });
    return groups;
})();

/**
 * Components whose specimens render an overlay OPEN by default (for the harness). In the
 * sidebar view these are gated behind a Show/Hide toggle so navigating to them doesn't
 * trap the page behind a modal. Mirrors analyst-ui's OVERLAY_IDS.
 */
const OVERLAY_IDS = new Set([
    "dialog", "alert", "drawer", "popover", "tooltip", "toast", "omnibar", "hotkeys",
    "select", "suggest", "multi-select", "timezone-select", "date-input", "date-range-input",
]);

function OverlaySpecimen({ title, children }: { title: string; children: React.ReactNode }) {
    const [show, setShow] = useState(false);
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 10 }}>
            <Button
                intent="primary"
                icon={show ? "chevron-down" : "chevron-right"}
                text={show ? `Hide ${title}` : `Show ${title}`}
                onClick={() => setShow((s) => !s)}
            />
            {show && children}
        </div>
    );
}

/** Selected component is driven by the URL hash (`#button`) — shareable, matches analyst-ui. */
function useHash(): string {
    const [hash, setHash] = useState(() => decodeURIComponent(window.location.hash.replace(/^#/, "")));
    useEffect(() => {
        const onChange = () => setHash(decodeURIComponent(window.location.hash.replace(/^#/, "")));
        window.addEventListener("hashchange", onChange);
        return () => window.removeEventListener("hashchange", onChange);
    }, []);
    return hash;
}

function Sidebar({ selectedId, dark, onToggleDark }: { selectedId: string; dark: boolean; onToggleDark: () => void }) {
    const c = dark
        ? { bg: "#252a31", border: "rgba(255,255,255,0.15)", text: "#f6f7f9", muted: "#abb3bf" }
        : { bg: "#ffffff", border: "rgba(17,20,24,0.15)", text: "#1c2127", muted: "#5f6b7c" };
    return (
        <aside
            style={{
                position: "sticky",
                top: 0,
                height: "100vh",
                width: 240,
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                borderRight: `1px solid ${c.border}`,
                background: c.bg,
                overflow: "hidden",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    padding: "12px 16px",
                    borderBottom: `1px solid ${c.border}`,
                }}
            >
                <span style={{ fontSize: 16, fontWeight: 600, color: c.text }}>Blueprint reference</span>
                <Button
                    variant="minimal"
                    size="small"
                    aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
                    icon={dark ? "lightbulb" : "moon"}
                    onClick={onToggleDark}
                />
            </div>
            <nav style={{ flex: 1, overflowY: "auto", padding: "12px 8px" }}>
                {CATEGORY_GROUPS.map((group) => (
                    <div key={group.label} style={{ marginBottom: 16 }}>
                        <div
                            style={{
                                padding: "0 8px 4px",
                                fontSize: 11,
                                fontWeight: 600,
                                textTransform: "uppercase",
                                letterSpacing: "0.04em",
                                color: c.muted,
                            }}
                        >
                            {group.label}
                        </div>
                        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 1 }}>
                            {group.items.map((item) => {
                                const active = item.id === selectedId;
                                return (
                                    <li key={item.id}>
                                        <a
                                            href={`#${item.id}`}
                                            aria-current={active ? "page" : undefined}
                                            style={{
                                                display: "block",
                                                padding: "4px 8px",
                                                borderRadius: 2,
                                                fontSize: 14,
                                                textDecoration: "none",
                                                background: active ? "#2d72d2" : "transparent",
                                                color: active ? "#ffffff" : c.text,
                                            }}
                                        >
                                            {item.title}
                                        </a>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>
        </aside>
    );
}

function ComponentView({ component }: { component: ComponentEntry }) {
    useEffect(() => {
        window.scrollTo({ top: 0 });
    }, [component.id]);
    return (
        <div id={component.id} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <h2 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>{component.title}</h2>
            {OVERLAY_IDS.has(component.id) ? (
                <OverlaySpecimen title={component.title}>{component.render()}</OverlaySpecimen>
            ) : (
                component.render()
            )}
        </div>
    );
}

export default function App() {
    const [dark, setDark] = useState(INITIAL_DARK);
    // Called unconditionally to satisfy the rules of hooks; harmless in isolated mode.
    const hash = useHash();

    // Isolated single-component view (harness mode): no chrome, just the specimens.
    // This path MUST stay behavior-identical for tools/compare.sh.
    if (ONLY != null && COMPONENTS.some((c) => c.id === ONLY)) {
        const c = COMPONENTS.find((x) => x.id === ONLY)!;
        return (
            <div className={dark ? "bp6-dark" : ""} style={{ minHeight: "100vh", background: dark ? "#1c2127" : "#f6f7f9", padding: 40 }}>
                <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 32 }}>
                    <div id={c.id} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {c.render()}
                    </div>
                </div>
            </div>
        );
    }

    const selected = COMPONENTS.find((c) => c.id === hash) ?? COMPONENTS[0];

    return (
        <div
            className={dark ? "bp6-dark" : ""}
            style={{
                minHeight: "100vh",
                display: "flex",
                background: dark ? "#1c2127" : "#f6f7f9",
                color: dark ? "#f6f7f9" : "#1c2127",
            }}
        >
            <Sidebar selectedId={selected.id} dark={dark} onToggleDark={() => setDark((d) => !d)} />
            <main style={{ flex: 1, padding: "32px 40px", overflowX: "hidden" }}>
                <div style={{ maxWidth: 820, margin: "0 auto" }}>
                    <ComponentView component={selected} />
                </div>
            </main>
        </div>
    );
}
