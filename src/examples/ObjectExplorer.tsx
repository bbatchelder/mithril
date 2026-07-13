/* eslint-disable no-restricted-imports */
import { Button } from "@/components/ui/button";
import { KeyCombo } from "@/components/ui/hotkeys";
import { Icon, type IconName } from "@/components/ui/icon";
import { InputGroup } from "@/components/ui/input-group";
import { NonIdealState } from "@/components/ui/non-ideal-state";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Tag } from "@/components/ui/tag";

/**
 * Object Explorer — a full-page design example in the ontology-browser register
 * (inspired by Palantir Foundry's Object Explorer home): a dark app rail, a
 * workspace tab strip, a centered search hero over an object-type catalog table,
 * and an object-set catalog empty state. Pure composition — every element is a
 * mithril component or token; natural height (no inner scroll) so the design-sync
 * capture shows the whole composition.
 *
 * Register notes (mithril-design skill): quiet gray chrome; extended colors appear
 * ONLY as object-type icon chips (the sanctioned categorical use); one primary spot
 * of color (the search submit) per surface; 30px control rows; tabular numerics.
 */

/* ── Catalog data (illustrative aviation ontology) ───────────────────────── */

interface ObjectType {
    name: string;
    icon: IconName;
    /** Extended-color family for the icon chip (categorical use only). */
    chip: string;
    count: string;
    /** Usage-bar fill width — a literal Tailwind class so it survives tree-shaking. */
    bar: string;
    groups: string[];
    description: string;
}

const CHIP_STYLES: Record<string, string> = {
    cerulean: "bg-cerulean-3/15 text-cerulean-1 dark:text-cerulean-5",
    turquoise: "bg-turquoise-3/15 text-turquoise-1 dark:text-turquoise-5",
    forest: "bg-forest-3/15 text-forest-1 dark:text-forest-5",
    gold: "bg-gold-3/15 text-gold-1 dark:text-gold-5",
    indigo: "bg-indigo-3/15 text-indigo-1 dark:text-indigo-5",
    rose: "bg-rose-3/15 text-rose-1 dark:text-rose-5",
    violet: "bg-violet-3/15 text-violet-1 dark:text-violet-5",
    vermilion: "bg-vermilion-3/15 text-vermilion-1 dark:text-vermilion-5",
    lime: "bg-lime-3/15 text-lime-1 dark:text-lime-5",
    gray: "bg-gray-3/15 text-gray-1 dark:text-gray-5",
};

const OBJECT_TYPES: ObjectType[] = [
    { name: "[Example] Flight", icon: "airplane", chip: "cerulean", count: "1.7M", bar: "w-[62%]", groups: ["Core"], description: "One row per scheduled commercial flight, with times, status, and linked aircraft." },
    { name: "[Example] Aircraft", icon: "cube", chip: "indigo", count: "5.5K", bar: "w-[26%]", groups: ["Core"], description: "Airframes in the active fleet — type, seat map, age, and maintenance lineage." },
    { name: "[Example] Route Alert", icon: "warning-sign", chip: "vermilion", count: "14", bar: "w-[4%]", groups: [], description: "Alerts raised when a route's on-time performance drifts past its baseline." },
    { name: "[Example] Carrier", icon: "office", chip: "violet", count: "14", bar: "w-[4%]", groups: [], description: "Operating carriers with derived fleet metrics from associated aircraft." },
    { name: "[Example] Flight Sensor", icon: "cell-tower", chip: "turquoise", count: "594", bar: "w-[12%]", groups: [], description: "Sensor readings attached to a flight — one object per reporting unit." },
    { name: "[Example] Airport", icon: "map-marker", chip: "forest", count: "178", bar: "w-[8%]", groups: ["Geo"], description: "Airports with geospatial properties; useful as a join key for mapping." },
    { name: "[Example] Route", icon: "route", chip: "rose", count: "1.3K", bar: "w-[18%]", groups: [], description: "Derived from flights between pairs of departure and arrival airports." },
    { name: "[Example] Runway", icon: "intersection", chip: "lime", count: "471", bar: "w-[10%]", groups: ["Geo"], description: "Runway segments per airport, with surface, heading, and length." },
    { name: "[Example] Explainer", icon: "help", chip: "gold", count: "24", bar: "w-[5%]", groups: [], description: "Reusable callout references to embed in workshop modules and briefs." },
    { name: "[Example] Route Alert Comment", icon: "comment", chip: "turquoise", count: "0", bar: "w-0", groups: [], description: "Analyst commentary threaded onto a route alert." },
    { name: "[Example][Log] Update Route Alert Status", icon: "history", chip: "gray", count: "0", bar: "w-0", groups: [], description: "Automatically created when the alert-status action type logs its runs." },
];

/* ── Left rail ───────────────────────────────────────────────────────────── */

interface RailRowProps {
    icon: IconName;
    label: string;
    active?: boolean;
    combo?: string;
}

function RailRow({ icon, label, active, combo }: RailRowProps) {
    return (
        <button
            type="button"
            className={
                "flex h-8 w-full items-center gap-2.5 rounded-mithril px-3 text-left text-body-sm transition-colors " +
                (active
                    ? "bg-white/10 font-medium text-foreground"
                    : "text-foreground-muted hover:bg-white/[0.06] hover:text-foreground")
            }
            aria-current={active ? "page" : undefined}
        >
            <Icon icon={icon} size={16} className="shrink-0 !text-current" />
            <span className="min-w-0 grow truncate">{label}</span>
            {combo != null && <KeyCombo combo={combo} minimal className="text-foreground-muted" />}
        </button>
    );
}

function ExplorerRail() {
    return (
        <div className="dark w-[220px] shrink-0 border-r border-border-strong">
            <nav className="flex h-full flex-col gap-0.5 bg-surface p-2 text-foreground">
                <div className="mb-1 flex items-center justify-between px-3 py-2.5">
                    <Icon icon="cube" size={20} className="text-foreground" />
                    <Button
                        size="small"
                        variant="minimal"
                        aria-label="Collapse navigation"
                        icon={<Icon icon="menu-closed" className="!text-current" />}
                    />
                </div>

                <RailRow icon="home" label="Home" />
                <RailRow icon="search" label="Search…" combo="mod+j" />
                <RailRow icon="notifications" label="Notifications" />

                <div className="my-2 border-t border-white/10" />

                <RailRow icon="history" label="Recent" />
                <RailRow icon="folder-close" label="Files" />
                <RailRow icon="data-lineage" label="Ontology" />
                <RailRow icon="grid-view" label="Applications" />

                <div className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
                    Applications
                </div>
                <RailRow icon="search-around" label="Object Explorer" active />

                <div className="grow" />

                <RailRow icon="predictive-analysis" label="AI Assist" combo="mod+shift+u" />
                <RailRow icon="lifesaver" label="Support" />
                <RailRow icon="person" label="Account" />
            </nav>
        </div>
    );
}

/* ── Workspace tab strip ─────────────────────────────────────────────────── */

function ExplorerTabStrip() {
    return (
        <div className="flex h-9 shrink-0 items-stretch justify-between border-b border-border bg-elevated">
            <div className="flex items-stretch">
                {/* Pinned search-home tab (icon-only). */}
                <button
                    type="button"
                    aria-label="Explorer home"
                    className="flex w-10 items-center justify-center border-r border-border bg-[var(--interactive-hover)] text-intent-primary-text"
                >
                    <Icon icon="search" size={14} className="!text-current" />
                </button>
                {/* Active exploration tab. */}
                <div className="flex items-center gap-2 border-r border-border bg-surface px-3 text-body-sm font-medium text-foreground">
                    <Icon icon="search-around" size={14} className="text-intent-primary-text" />
                    New exploration
                </div>
                <div className="flex items-center px-1">
                    <Button
                        size="small"
                        variant="minimal"
                        aria-label="New tab"
                        icon={<Icon icon="plus" className="!text-current" />}
                    />
                </div>
            </div>
            <div className="flex items-center pr-2">
                <Button
                    size="small"
                    variant="minimal"
                    icon={<Icon icon="database" className="!text-current" />}
                    endIcon={<Icon icon="caret-down" className="!text-current" />}
                >
                    All Ontologies
                </Button>
            </div>
        </div>
    );
}

/* ── Search hero + shortcuts ─────────────────────────────────────────────── */

function SearchHero() {
    return (
        <div className="flex flex-col items-center gap-3 px-8 pt-7">
            <h1 className="text-heading-sm font-semibold text-foreground">Object Explorer search</h1>
            <div className="flex h-10 w-full max-w-[560px] items-stretch overflow-hidden rounded-[20px] border border-border-strong bg-surface shadow-elevation-1">
                <button
                    type="button"
                    className="flex shrink-0 items-center gap-2 border-r border-border bg-elevated px-4 text-body-sm text-foreground-muted transition-colors hover:text-foreground"
                >
                    <Icon icon="filter" size={14} className="!text-current" />
                    Filter by…
                    <Icon icon="caret-down" size={14} className="!text-current" />
                </button>
                <div className="flex min-w-0 grow items-center gap-2 px-3.5">
                    <Icon icon="search" size={14} className="shrink-0 text-foreground-muted" />
                    <input
                        type="text"
                        placeholder="Search for objects…"
                        className="min-w-0 grow bg-transparent text-body text-foreground outline-none placeholder:text-foreground-muted"
                    />
                </div>
                <div className="flex items-center pr-1.5">
                    <Button
                        intent="primary"
                        size="small"
                        aria-label="Search"
                        className="!rounded-full"
                        icon={<Icon icon="key-enter" className="!text-current" />}
                    />
                </div>
            </div>
        </div>
    );
}

function ShortcutCard({ type }: { type: ObjectType }) {
    return (
        <button
            type="button"
            className="flex w-[270px] items-center gap-3 rounded-mithril border border-border bg-surface px-3 py-2 text-left transition-colors hover:bg-[var(--interactive-hover)]"
        >
            <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-mithril ${CHIP_STYLES[type.chip]}`}
            >
                <Icon icon={type.icon} size={16} className="!text-current" />
            </span>
            <span className="min-w-0">
                <span className="flex items-center gap-1.5">
                    <span className="truncate text-body font-medium text-foreground">{type.name}</span>
                    <Icon icon="book" size={13} className="shrink-0 text-sepia-3" />
                </span>
                <span className="block truncate text-body-sm text-foreground-muted">
                    Object Type · {type.count === "1.7M" ? "1.66M" : type.count} objects
                </span>
            </span>
        </button>
    );
}

function Shortcuts() {
    return (
        <div className="flex items-end justify-between gap-6 px-8 pb-6 pt-6">
            <div className="flex flex-col gap-2.5">
                <span className="text-body-sm font-semibold text-foreground">Shortcuts</span>
                <div className="flex gap-3">
                    <ShortcutCard type={OBJECT_TYPES[2]} />
                    <ShortcutCard type={OBJECT_TYPES[0]} />
                </div>
            </div>
            <div className="flex items-center gap-1.5">
                <SegmentedControl
                    size="small"
                    defaultValue="recents"
                    options={[
                        { label: "Recents", value: "recents" },
                        { label: "Favorites", value: "favorites" },
                        { label: "Your object sets", value: "sets" },
                    ]}
                />
                <Button
                    size="small"
                    variant="minimal"
                    aria-label="More shortcuts"
                    icon={<Icon icon="chevron-right" className="!text-current" />}
                />
            </div>
        </div>
    );
}

/* ── Object type catalog ─────────────────────────────────────────────────── */

const TH = "px-3 py-2 text-left text-body-xs font-semibold uppercase tracking-wide text-foreground-muted";

function CatalogTable() {
    return (
        <div className="overflow-hidden rounded-mithril border border-border bg-surface">
            <table className="w-full border-spacing-0 text-body">
                <thead>
                    <tr className="border-b border-border-strong">
                        <th className={`${TH} w-[24%]`}>Object type name</th>
                        <th className={`${TH} w-[7%]`}>Status</th>
                        <th className={`${TH} w-[13%]`}>Object count</th>
                        <th className={`${TH} w-[14%]`} colSpan={2}>Usage</th>
                        <th className={`${TH} w-[12%]`}>Type groups</th>
                        <th className={TH}>Description</th>
                    </tr>
                </thead>
                <tbody>
                    {OBJECT_TYPES.map((t) => (
                        <tr
                            key={t.name}
                            className="cursor-pointer border-b border-border transition-colors last:border-b-0 hover:bg-[var(--interactive-hover)]"
                        >
                            <td className="px-3 py-1.5">
                                <span className="flex items-center gap-2.5">
                                    <span
                                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-mithril ${CHIP_STYLES[t.chip]}`}
                                    >
                                        <Icon icon={t.icon} size={13} className="!text-current" />
                                    </span>
                                    <span className="truncate font-medium text-foreground">{t.name}</span>
                                </span>
                            </td>
                            <td className="px-3 py-1.5">
                                <Icon icon="book" size={14} className="text-sepia-3" title="Active — backing datasource is healthy" />
                            </td>
                            <td className="px-3 py-1.5">
                                <span className="flex items-center gap-2.5">
                                    <span className="w-9 text-right tabular-nums text-foreground">{t.count}</span>
                                    <span className="h-1.5 w-16 overflow-hidden rounded-full bg-[var(--interactive-hover)]">
                                        <span className={`block h-full rounded-full bg-gray-2 dark:bg-gray-4 ${t.bar}`} />
                                    </span>
                                </span>
                            </td>
                            <td className="px-3 py-1.5 text-body-sm text-foreground-muted">0 users</td>
                            <td className="px-3 py-1.5 text-body-sm text-foreground-muted">0 apps</td>
                            <td className="px-3 py-1.5">
                                <span className="flex gap-1">
                                    {t.groups.map((g) => (
                                        <Tag key={g} minimal>
                                            {g}
                                        </Tag>
                                    ))}
                                </span>
                            </td>
                            <td className="max-w-0 truncate px-3 py-1.5 text-body-sm text-foreground-muted">
                                {t.description}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function ObjectTypeCatalog() {
    return (
        <div className="flex flex-col gap-3 border-t border-border px-8 pt-5">
            <span className="w-fit text-body font-semibold text-foreground underline decoration-dotted underline-offset-4 decoration-[color:var(--border-strong)]">
                Object type catalog
            </span>
            <div className="flex items-center justify-between gap-4">
                <div className="w-[360px]">
                    <InputGroup
                        fill
                        size="small"
                        leftIcon="filter"
                        placeholder="Filter for an object type…"
                        rightElement={
                            <span className="flex h-full items-center whitespace-nowrap pr-2 text-body-xs tabular-nums text-foreground-muted">
                                11 of 11
                            </span>
                        }
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        size="small"
                        variant="outlined"
                        icon={<Icon icon="sort" className="!text-current" />}
                        endIcon={<Icon icon="caret-down" className="!text-current" />}
                    >
                        Relevancy
                    </Button>
                    <SegmentedControl
                        size="small"
                        defaultValue="all"
                        options={[
                            { label: "All", value: "all" },
                            { label: "Type group", value: "group" },
                            { label: "Application", value: "app" },
                        ]}
                    />
                </div>
            </div>
            <CatalogTable />
        </div>
    );
}

/* ── Object set catalog ──────────────────────────────────────────────────── */

function ObjectSetCatalog() {
    return (
        <div className="flex flex-col gap-3 px-8 pb-8 pt-6">
            <div className="flex items-center justify-between gap-4">
                <span className="text-body font-semibold text-foreground">
                    Object set catalog{" "}
                    <span className="font-normal text-foreground-muted">(explorations and lists)</span>
                </span>
                <div className="flex items-center gap-2">
                    <div className="w-[220px]">
                        <InputGroup fill size="small" leftIcon="search" placeholder="Search explorations…" />
                    </div>
                    <SegmentedControl
                        size="small"
                        defaultValue="all"
                        options={[
                            { label: "All", value: "all" },
                            { label: "Created by me", value: "mine" },
                            { label: "Shared with me", value: "shared" },
                            { label: "Favorites", value: "favorites" },
                        ]}
                    />
                </div>
            </div>
            <div className="rounded-mithril border border-border bg-surface py-10">
                <NonIdealState
                    icon="box"
                    title="No saved explorations and lists"
                    description="Your saved explorations and object lists will be accessible here."
                />
            </div>
        </div>
    );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export function ObjectExplorer() {
    return (
        <div className="overflow-x-auto bg-background text-foreground">
            <div className="flex min-h-[920px] min-w-[1280px]">
                <ExplorerRail />
                <div className="flex min-w-0 flex-1 flex-col">
                    <ExplorerTabStrip />
                    <div className="flex-1">
                        <SearchHero />
                        <Shortcuts />
                        <ObjectTypeCatalog />
                        <ObjectSetCatalog />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ObjectExplorer;
