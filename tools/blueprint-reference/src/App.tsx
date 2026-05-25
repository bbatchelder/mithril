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

export default function App() {
    const [dark, setDark] = useState(false);

    return (
        <div
            className={dark ? "bp6-dark" : ""}
            style={{ minHeight: "100vh", background: dark ? "#1c2127" : "#f6f7f9", padding: 40 }}
        >
            <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 32 }}>
                <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>Blueprint reference · Button</h1>
                    <Button text={`Toggle ${dark ? "light" : "dark"}`} onClick={() => setDark((d) => !d)} />
                </header>

                <Section title="Variant × Intent">
                    {VARIANTS.map((variant) => (
                        <Row key={variant} label={variant}>
                            {INTENTS.map((intent) => (
                                <Button key={intent} variant={variant} intent={intent} text={intent} />
                            ))}
                        </Row>
                    ))}
                </Section>

                <Section title="Sizes (solid / primary)">
                    <Row label="">
                        <Button size="small" intent="primary" text="Small" />
                        <Button size="medium" intent="primary" text="Medium" />
                        <Button size="large" intent="primary" text="Large" />
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
        </div>
    );
}
