import { Button, Card, Classes, Icon, Text, type ButtonVariant, type Intent } from "@blueprintjs/core";
import { useState } from "react";

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

/** Registry mirrors analyst-ui's. Add an entry per component as it's built. */
const COMPONENTS: { id: string; title: string; render: () => React.ReactNode }[] = [
    { id: "button", title: "Button", render: () => <ButtonGallery /> },
    { id: "card", title: "Card", render: () => <CardGallery /> },
    { id: "icon", title: "Icon", render: () => <IconGallery /> },
    { id: "text", title: "Text", render: () => <TextGallery /> },
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
