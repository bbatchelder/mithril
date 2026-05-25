import { Button, type ButtonVariant, type Intent } from "@blueprintjs/core";
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

/** Registry mirrors analyst-ui's. Add an entry per component as it's built. */
const COMPONENTS: { id: string; title: string; render: () => React.ReactNode }[] = [
    { id: "button", title: "Button", render: () => <ButtonGallery /> },
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
