import { useState } from "react";

import { cn } from "@/lib/utils";

/** Literal class strings so Tailwind's scanner emits each palette color. */
const PALETTE: Array<[string, string[]]> = [
    [
        "gray",
        [
            "bg-dark-gray-1",
            "bg-dark-gray-3",
            "bg-dark-gray-5",
            "bg-gray-1",
            "bg-gray-3",
            "bg-gray-5",
            "bg-light-gray-3",
            "bg-light-gray-5",
        ],
    ],
    ["blue", ["bg-blue-1", "bg-blue-2", "bg-blue-3", "bg-blue-4", "bg-blue-5"]],
    ["green", ["bg-green-1", "bg-green-2", "bg-green-3", "bg-green-4", "bg-green-5"]],
    ["orange", ["bg-orange-1", "bg-orange-2", "bg-orange-3", "bg-orange-4", "bg-orange-5"]],
    ["red", ["bg-red-1", "bg-red-2", "bg-red-3", "bg-red-4", "bg-red-5"]],
];

const INTENTS: Array<[string, string]> = [
    ["Primary", "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active"],
    ["Success", "bg-success text-success-foreground hover:bg-success-hover active:bg-success-active"],
    ["Warning", "bg-warning text-warning-foreground hover:bg-warning-hover active:bg-warning-active"],
    ["Danger", "bg-danger text-danger-foreground hover:bg-danger-hover active:bg-danger-active"],
];

const ELEVATIONS = [0, 1, 2, 3, 4] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="flex flex-col gap-3">
            <h2 className="text-heading-sm font-semibold text-foreground">{title}</h2>
            {children}
        </section>
    );
}

export default function App() {
    const [dark, setDark] = useState(false);

    return (
        <div className={dark ? "dark" : ""}>
            <div className="min-h-screen bg-background px-8 py-10">
                <div className="mx-auto flex max-w-4xl flex-col gap-10">
                    <header className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-heading-lg font-semibold text-foreground">analyst-ui</h1>
                            <p className="text-foreground-muted">
                                Blueprint-faithful design tokens · Tailwind v4 · {dark ? "dark" : "light"} theme
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setDark((d) => !d)}
                            className="ease-bp h-7.5 rounded-bp bg-primary px-4 text-primary-foreground transition-colors duration-100 hover:bg-primary-hover active:bg-primary-active"
                        >
                            Toggle {dark ? "light" : "dark"}
                        </button>
                    </header>

                    <Section title="Palette">
                        <div className="flex flex-col gap-2">
                            {PALETTE.map(([name, swatches]) => (
                                <div key={name} className="flex gap-2">
                                    {swatches.map((s) => (
                                        <div key={s} title={s} className={cn("h-10 flex-1 rounded-bp-sm border border-border", s)} />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </Section>

                    <Section title="Intents">
                        <div className="flex flex-wrap gap-3">
                            {INTENTS.map(([label, classes]) => (
                                <button
                                    key={label}
                                    type="button"
                                    className={cn("ease-bp h-7.5 rounded-bp px-4 transition-colors duration-100", classes)}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </Section>

                    <Section title="Surfaces & elevation">
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                            {ELEVATIONS.map((e) => (
                                <div
                                    key={e}
                                    className="flex h-24 items-center justify-center rounded-bp bg-surface text-foreground-muted"
                                    style={{ boxShadow: `var(--elevation-${e})` }}
                                >
                                    elevation {e}
                                </div>
                            ))}
                        </div>
                    </Section>

                    <Section title="Typography">
                        <div className="shadow-elevation-1 flex flex-col gap-2 rounded-bp bg-surface p-6">
                            <p className="text-heading-display font-semibold text-foreground">Display 46</p>
                            <p className="text-heading-xl font-semibold text-foreground">Heading XL 28</p>
                            <p className="text-heading-lg font-semibold text-foreground">Heading L 24</p>
                            <p className="text-heading font-semibold text-foreground">Heading 20</p>
                            <p className="text-body-lg text-foreground">Body large 16 — the quick brown fox.</p>
                            <p className="text-body text-foreground">Body 14 — the quick brown fox jumps over the lazy dog.</p>
                            <p className="text-body-sm text-foreground-muted">Body small 12 — muted secondary text.</p>
                            <a href="#" className="text-body text-link hover:underline">
                                A link in body text
                            </a>
                            <code className="bg-code-background text-code-foreground rounded-bp-sm px-1.5 py-0.5 font-mono text-code">
                                const code = "monospace 13px";
                            </code>
                        </div>
                    </Section>
                </div>
            </div>
        </div>
    );
}
