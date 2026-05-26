import { Button, Callout, Card, Checkbox, Classes, ControlGroup, Divider, FormGroup, HTMLSelect, Icon, InputGroup, Label, ProgressBar, Radio, RadioGroup, Spinner, SpinnerSize, Switch, Tag, Text, TextArea, type ButtonVariant, type Intent } from "@blueprintjs/core";
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

/** Registry mirrors analyst-ui's. Add an entry per component as it's built. */
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
];

const params = new URLSearchParams(window.location.search);
/** `?component=<id>` renders that showcase alone with no chrome — for clean harness screenshots. */
const ONLY = params.get("component");
/** `?theme=dark` sets the initial theme; the toggle still works for interactive use. */
const INITIAL_DARK = params.get("theme") === "dark";

export default function App() {
    const [dark, setDark] = useState(INITIAL_DARK);

    const shown = ONLY ? COMPONENTS.filter((c) => c.id === ONLY) : COMPONENTS;
    const isolated = ONLY != null && shown.length > 0;

    return (
        <div
            className={dark ? "bp6-dark" : ""}
            style={{ minHeight: "100vh", background: dark ? "#1c2127" : "#f6f7f9", padding: 40 }}
        >
            <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 32 }}>
                {!isolated && (
                    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>Blueprint reference</h1>
                        <Button text={`Toggle ${dark ? "light" : "dark"}`} onClick={() => setDark((d) => !d)} />
                    </header>
                )}

                {shown.map((c) => (
                    <div key={c.id} id={c.id} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {!isolated && <h2 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>{c.title}</h2>}
                        {c.render()}
                    </div>
                ))}
            </div>
        </div>
    );
}
