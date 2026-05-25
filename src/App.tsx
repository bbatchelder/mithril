import { ChevronDown, ExternalLink, Plus, Settings } from "lucide-react";
import { useState } from "react";

import { Button, type ButtonIntent, type ButtonVariant } from "@/components/ui/button";
import { Card, type CardElevation } from "@/components/ui/card";
import { Divider } from "@/components/ui/divider";
import { Icon, type IconIntent } from "@/components/ui/icon";
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

/** Registry of component showcases. Add an entry per component as it's built. */
const COMPONENTS: { id: string; title: string; render: () => React.ReactNode }[] = [
    { id: "button", title: "Button", render: () => <ButtonGallery /> },
    { id: "card", title: "Card", render: () => <CardGallery /> },
    { id: "icon", title: "Icon", render: () => <IconGallery /> },
    { id: "text", title: "Text", render: () => <TextGallery /> },
    { id: "divider", title: "Divider", render: () => <DividerGallery /> },
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
            <div className="min-h-screen bg-background p-10">
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
