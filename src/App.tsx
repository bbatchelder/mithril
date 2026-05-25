import { ChevronDown, ExternalLink, Plus, Settings } from "lucide-react";
import { useState } from "react";

import { Button, type ButtonIntent, type ButtonVariant } from "@/components/ui/button";

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

export default function App() {
    const [dark, setDark] = useState(false);

    return (
        <div className={dark ? "dark" : ""}>
            <div className="min-h-screen bg-background p-10">
                <div className="mx-auto flex max-w-[760px] flex-col gap-8">
                    <header className="flex items-center justify-between">
                        <h1 className="text-heading-lg font-semibold text-foreground">analyst-ui · Button</h1>
                        <Button onClick={() => setDark((d) => !d)}>Toggle {dark ? "light" : "dark"}</Button>
                    </header>

                    <Section title="Variant × Intent">
                        {VARIANTS.map((variant) => (
                            <Row key={variant} label={variant}>
                                {INTENTS.map((intent) => (
                                    <Button key={intent} variant={variant} intent={intent}>
                                        {intent}
                                    </Button>
                                ))}
                            </Row>
                        ))}
                    </Section>

                    <Section title="Sizes (solid / primary)">
                        <Row label="">
                            <Button size="small" intent="primary">
                                Small
                            </Button>
                            <Button size="medium" intent="primary">
                                Medium
                            </Button>
                            <Button size="large" intent="primary">
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
            </div>
        </div>
    );
}
