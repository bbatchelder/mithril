/* eslint-disable no-restricted-imports */
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Checkbox } from "@/components/ui/checkbox";
import { KeyCombo } from "@/components/ui/hotkeys";
import { Icon, type IconName } from "@/components/ui/icon";
import { InputGroup } from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Tag } from "@/components/ui/tag";

/**
 * Projects & Files — a full-page design example in the workspace-file-catalog
 * register (inspired by Palantir Foundry's Compass home): a dark app rail, a
 * centered workspace tab strip, quick-filter cards over a global search input,
 * a faceted filter rail, and a file table with typed icons, path sublines, and
 * skeleton loading rows. Pure composition — every element is a mithril
 * component or token; natural height (no inner scroll) so the design-sync
 * capture shows the whole composition.
 *
 * Register notes (mithril-design skill): quiet gray chrome; extended colors
 * appear ONLY as categorical file-type glyphs; the one saturated CTA is the
 * success-intent "New" split button (create action); paths are monospace;
 * numerics are tabular.
 */

/* ── File catalog data (illustrative aviation-ops workspace) ─────────────── */

/** Categorical file-type glyph colors — literal classes so they survive tree-shaking. */
const TYPE_COLORS: Record<string, string> = {
    folder: "text-gold-2 dark:text-gold-5",
    pipeline: "text-forest-2 dark:text-forest-5",
    document: "text-cerulean-2 dark:text-cerulean-5",
    module: "text-violet-2 dark:text-violet-5",
    ontology: "text-indigo-2 dark:text-indigo-5",
    plain: "text-gray-2 dark:text-gray-5",
};

interface CatalogFile {
    name: string;
    icon: IconName;
    /** TYPE_COLORS key (categorical use only). */
    type: string;
    path: string;
    views: string;
    role: string;
    tags: string[];
    portfolio?: string;
    modified: string;
    /** Show a branch marker next to the org count (versioned repositories). */
    branched?: boolean;
}

const FILES: CatalogFile[] = [
    { name: "Route Briefings", icon: "folder-close", type: "folder", path: "/meridian-7f3a2c/Flight Ops/Route Briefings", views: "3", role: "Owner", tags: [], modified: "Yesterday at 4:02 AM" },
    { name: "Turnaround Widget Set", icon: "widget", type: "module", path: "/meridian-7f3a2c/Flight Ops/Turnaround Widget Set", views: "0", role: "Owner", tags: [], modified: "Yesterday at 4:02 AM", branched: true },
    { name: "Flight Ops Notebook", icon: "manual", type: "document", path: "/meridian-7f3a2c/Flight Ops", views: "8", role: "Owner", tags: ["ops"], modified: "Mon, May 18, 2026, 3:46 PM" },
    { name: "analyst@meridian.dev", icon: "envelope", type: "plain", path: "/Users/analyst@meridian.dev", views: "0", role: "Owner", tags: [], modified: "Mon, May 18, 2026, 2:47 PM" },
    { name: "Delay Prediction Studio", icon: "model", type: "module", path: "/meridian-7f3a2c/Flight Ops/Delay Prediction Studio", views: "0", role: "Owner", tags: [], modified: "Mon, May 18, 2026, 3:57 PM" },
    { name: "Flight Ops Ontology", icon: "cube", type: "ontology", path: "/meridian-7f3a2c/Flight Ops Ontology", views: "12", role: "Marketplace Installation", tags: [], portfolio: "Aviation Reference", modified: "Thu, May 14, 2026, 11:17 PM" },
    { name: "Data", icon: "folder-close", type: "folder", path: "/meridian-7f3a2c/Flight Ops Ontology/Data", views: "2", role: "Marketplace Installation", tags: [], modified: "Thu, May 14, 2026, 11:22 PM" },
    { name: "Apps and Object Views", icon: "folder-close", type: "folder", path: "/meridian-7f3a2c/Flight Ops Ontology/Apps and Object Views", views: "0", role: "Marketplace Installation", tags: [], modified: "Thu, May 14, 2026, 11:17 PM" },
    { name: "[Example] Route Alert Pipeline", icon: "flows", type: "pipeline", path: "/meridian-7f3a2c/Flight Ops Ontology/Data/[Example] Route Alert Pipeline", views: "0", role: "Marketplace Installation", tags: ["demo"], modified: "Thu, May 14, 2026, 11:18 PM" },
    { name: "[Example] Sensor Sync Pipeline", icon: "flows", type: "pipeline", path: "/meridian-7f3a2c/Flight Ops Ontology/Data/[Example] Sensor Sync Pipeline", views: "0", role: "Marketplace Installation", tags: [], modified: "Thu, May 14, 2026, 11:18 PM" },
    { name: "Route Alert Documentation", icon: "manual", type: "document", path: "/meridian-7f3a2c/Flight Ops Ontology/Documentation/Route Alert Documentation", views: "5", role: "Marketplace Installation", tags: [], modified: "Thu, May 14, 2026, 11:17 PM" },
    { name: "Basic Charts | Carrier Documentation", icon: "manual", type: "document", path: "/meridian-7f3a2c/Flight Ops Ontology/Documentation/Basic Charts | Carrier Documentation", views: "0", role: "Marketplace Installation", tags: [], modified: "Thu, May 14, 2026, 11:17 PM" },
];

interface TypeFacet {
    name: string;
    icon: IconName;
    type: string;
    count: number;
}

const TYPE_FACETS: TypeFacet[] = [
    { name: "Pipeline Builder", icon: "flows", type: "pipeline", count: 5 },
    { name: "Code repository", icon: "git-repo", type: "plain", count: 1 },
    { name: "Notepad document", icon: "manual", type: "document", count: 12 },
    { name: "Notepad template", icon: "document", type: "document", count: 1 },
    { name: "Module", icon: "widget", type: "module", count: 11 },
];

const PROJECT_FACETS = ["Flight Ops Ontology", "analyst@meridian.dev", "Flight Ops"];

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

function FilesRail() {
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
                <RailRow icon="folder-close" label="Files" active />
                <RailRow icon="data-lineage" label="Ontology" />
                <RailRow icon="grid-view" label="Applications" />

                <div className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
                    Applications
                </div>
                <RailRow icon="projects" label="Projects & files" active />

                <div className="grow" />

                <RailRow icon="predictive-analysis" label="AI Assist" combo="mod+shift+u" />
                <RailRow icon="lifesaver" label="Support" />
                <RailRow icon="person" label="Account" />
            </nav>
        </div>
    );
}

/* ── Workspace tab strip ─────────────────────────────────────────────────── */

interface WorkspaceTabProps {
    icon: IconName;
    label: string;
    active?: boolean;
    /** Extra classes for the glyph (categorical app-icon tint). */
    iconClass?: string;
}

function WorkspaceTab({ icon, label, active, iconClass = "" }: WorkspaceTabProps) {
    return (
        <button
            type="button"
            aria-current={active ? "page" : undefined}
            className={
                "flex h-7 items-center gap-1.5 rounded-mithril px-3 text-body-sm transition-colors " +
                (active
                    ? "bg-blue-3/10 font-medium text-intent-primary-text dark:bg-blue-3/25"
                    : "text-foreground hover:bg-[var(--interactive-hover)]")
            }
        >
            <Icon icon={icon} size={14} className={active ? "!text-current" : iconClass || "text-foreground-muted"} />
            {label}
        </button>
    );
}

function WorkspaceTabBar() {
    return (
        <div className="flex h-10 shrink-0 items-center justify-center gap-1 border-b border-border bg-surface">
            <WorkspaceTab icon="folder-open" label="All files" active />
            <WorkspaceTab icon="people" label="Shared with you" />
            <WorkspaceTab icon="th" label="Data Catalog" iconClass="text-violet-2 dark:text-violet-5" />
            <WorkspaceTab icon="trash" label="Trash" />
        </div>
    );
}

/* ── Right tool strip ────────────────────────────────────────────────────── */

function SideToolStrip() {
    return (
        <div className="flex w-10 shrink-0 flex-col items-center gap-1 border-l border-border bg-surface pt-2">
            {(
                [
                    ["info-sign", "Details"],
                    ["lock", "Permissions"],
                    ["feed", "Activity"],
                    ["flag", "Flags"],
                    ["git-branch", "Branches"],
                ] as [IconName, string][]
            ).map(([icon, label]) => (
                <Button
                    key={icon}
                    size="small"
                    variant="minimal"
                    aria-label={label}
                    icon={<Icon icon={icon} className="!text-current" />}
                    className="text-foreground-muted"
                />
            ))}
        </div>
    );
}

/* ── Breadcrumb row + create CTA ─────────────────────────────────────────── */

function BreadcrumbRow() {
    return (
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1">
                <Breadcrumbs
                    items={[
                        { icon: "document", text: "All files" },
                        { icon: "projects", text: "All spaces", current: true },
                    ]}
                />
                <Button
                    size="small"
                    variant="minimal"
                    aria-label="Choose space"
                    icon={<Icon icon="caret-down" className="!text-current" />}
                />
            </div>
            <ButtonGroup>
                <Button intent="success" icon={<Icon icon="plus" className="!text-current" />}>
                    New
                </Button>
                <Button
                    intent="success"
                    aria-label="More create options"
                    icon={<Icon icon="caret-down" className="!text-current" />}
                />
            </ButtonGroup>
        </div>
    );
}

/* ── Quick filters panel ─────────────────────────────────────────────────── */

interface QuickFilterCardProps {
    icon: IconName;
    iconClass?: string;
    title: string;
    description: string;
}

function QuickFilterCard({ icon, iconClass = "text-foreground-muted", title, description }: QuickFilterCardProps) {
    return (
        <div className="rounded-mithril border border-border bg-surface px-3 py-2.5">
            <div className="flex items-center gap-2">
                <Icon icon={icon} size={14} className={iconClass} />
                <span className="grow text-body font-medium text-foreground">{title}</span>
                <button type="button" className="text-body-sm text-intent-primary-text hover:underline">
                    Apply
                </button>
            </div>
            <p className="mt-1 text-body-sm leading-snug text-foreground-muted">{description}</p>
        </div>
    );
}

function QuickFilters() {
    return (
        <div className="rounded-mithril border border-border bg-elevated px-3 pb-3 pt-2">
            <div className="flex items-center justify-between pb-2">
                <span className="text-body-sm text-foreground-muted">Quick filters</span>
                <button type="button" className="text-body-sm text-intent-primary-text hover:underline">
                    Hide
                </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
                <QuickFilterCard
                    icon="briefcase"
                    title="Portfolios"
                    description="Group related projects into a portfolio to track a use case or area of interest in one place."
                />
                <QuickFilterCard
                    icon="projects"
                    title="Projects"
                    description="Projects are permissioned containers of related files — share the whole unit with one grant."
                />
                <QuickFilterCard
                    icon="endorsed"
                    iconClass="text-intent-primary-text"
                    title="Promoted items"
                    description="Curated projects, folders and files your organization recommends starting from."
                />
            </div>
        </div>
    );
}

/* ── Faceted filter rail ─────────────────────────────────────────────────── */

function FacetSection({ title, children }: { title: string; children?: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-2 border-t border-border py-3 first:border-t-0 first:pt-0">
            <div className="flex items-center justify-between">
                <span className="text-body-sm font-medium text-foreground">{title}</span>
                <Icon icon="chevron-up" size={14} className="text-foreground-muted" />
            </div>
            {children}
        </div>
    );
}

function FacetRow({
    icon,
    iconClass,
    label,
    count,
}: {
    icon: IconName;
    iconClass: string;
    label: string;
    count?: number;
}) {
    return (
        <div className="flex h-6 items-center gap-2">
            <Checkbox aria-label={`Filter by ${label}`} className="!mb-0" />
            <Icon icon={icon} size={14} className={`shrink-0 ${iconClass}`} />
            <span className="min-w-0 grow truncate text-body-sm text-foreground">{label}</span>
            {count != null && (
                <span className="shrink-0 text-body-sm tabular-nums text-foreground-muted">{count}</span>
            )}
        </div>
    );
}

function FilterRail() {
    return (
        <div className="w-[210px] shrink-0">
            <div className="flex items-center justify-between pb-3">
                <span className="flex items-center gap-2">
                    <Icon icon="filter" size={14} className="text-foreground-muted" />
                    <span className="text-body font-semibold text-foreground">Filters</span>
                    <Tag minimal round>
                        0
                    </Tag>
                </span>
                <Button
                    size="small"
                    variant="minimal"
                    aria-label="Collapse filters"
                    icon={<Icon icon="menu-closed" className="!text-current" />}
                />
            </div>

            <FacetSection title="Types">
                <InputGroup fill size="small" leftIcon="search" placeholder="Search types…" />
                {TYPE_FACETS.map((f) => (
                    <FacetRow key={f.name} icon={f.icon} iconClass={TYPE_COLORS[f.type]} label={f.name} count={f.count} />
                ))}
                <button type="button" className="w-fit text-body-sm text-intent-primary-text hover:underline">
                    View all (12)
                </button>
            </FacetSection>

            <FacetSection title="Status">
                <FacetRow icon="endorsed" iconClass="text-intent-primary-text" label="Promoted items" />
            </FacetSection>

            <FacetSection title="Portfolios">
                <InputGroup fill size="small" leftIcon="search" placeholder="Search portfolios…" />
            </FacetSection>

            <FacetSection title="Projects">
                <InputGroup fill size="small" leftIcon="search" placeholder="Search projects…" />
                {PROJECT_FACETS.map((p) => (
                    <FacetRow key={p} icon="projects" iconClass="text-foreground-muted" label={p} />
                ))}
            </FacetSection>

            <FacetSection title="Tags">
                <Button
                    size="small"
                    variant="minimal"
                    className="w-fit"
                    endIcon={<Icon icon="caret-down" className="!text-current" />}
                >
                    Select tags…
                </Button>
            </FacetSection>

            <FacetSection title="Organizations">
                <InputGroup fill size="small" leftIcon="search" placeholder="Search organizations…" />
                <FacetRow icon="office" iconClass="text-foreground-muted" label="meridian" />
            </FacetSection>
        </div>
    );
}

/* ── File table ──────────────────────────────────────────────────────────── */

const TH =
    "whitespace-nowrap border-r border-border px-3 py-2 text-left text-body-xs font-semibold uppercase tracking-wide text-foreground-muted last:border-r-0";
const TD = "border-r border-border px-3 py-2 align-middle last:border-r-0";

function SortGlyph() {
    return <Icon icon="double-caret-vertical" size={12} className="ml-1 inline-block text-foreground-muted" />;
}

function FileRow({ file }: { file: CatalogFile }) {
    return (
        <tr className="cursor-pointer border-b border-border transition-colors hover:bg-[var(--interactive-hover)]">
            <td className={TD}>
                <span className="flex items-center gap-2.5">
                    <Icon icon={file.icon} size={16} className={`shrink-0 ${TYPE_COLORS[file.type]}`} />
                    <span className="min-w-0 grow">
                        <span className="block truncate text-body font-medium text-foreground">{file.name}</span>
                        <span className="block truncate font-mono text-body-xs text-foreground-muted">
                            {file.path}
                        </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2 text-foreground-muted">
                        {file.branched && <Icon icon="git-branch" size={12} className="!text-current" />}
                        <span className="flex items-center gap-1 text-body-xs tabular-nums">
                            <Icon icon="office" size={12} className="!text-current" />1
                        </span>
                    </span>
                </span>
            </td>
            <td className={`${TD} text-body-sm tabular-nums text-foreground`}>{file.views}</td>
            <td className={`${TD} max-w-0 truncate text-body-sm text-foreground`}>{file.role}</td>
            <td className={TD}>
                {file.tags.length > 0 && (
                    <span className="flex gap-1">
                        {file.tags.map((t) => (
                            <Tag key={t} minimal>
                                {t}
                            </Tag>
                        ))}
                    </span>
                )}
            </td>
            <td className={`${TD} max-w-0 truncate text-body-sm text-foreground-muted`}>{file.portfolio}</td>
            <td className={`${TD} whitespace-nowrap text-body-sm text-foreground-muted`}>{file.modified}</td>
        </tr>
    );
}

function LoadingRow() {
    return (
        <tr className="border-b border-border last:border-b-0">
            <td className={TD}>
                <Skeleton animate={false} className="h-2.5 w-40" />
            </td>
            <td className={TD}>
                <Skeleton animate={false} className="h-2.5 w-8" />
            </td>
            <td className={TD}>
                <Skeleton animate={false} className="h-2.5 w-16" />
            </td>
            <td className={TD}>
                <Skeleton animate={false} className="h-2.5 w-12" />
            </td>
            <td className={TD}>
                <Skeleton animate={false} className="h-2.5 w-14" />
            </td>
            <td className={TD}>
                <Skeleton animate={false} className="h-2.5 w-24" />
            </td>
        </tr>
    );
}

function FileTable() {
    return (
        <div className="min-w-0 flex-1 overflow-hidden rounded-mithril border border-border bg-surface">
            <table className="w-full table-fixed border-spacing-0 text-body">
                <thead>
                    <tr className="border-b border-border-strong bg-elevated">
                        <th className={`${TH} w-[36%]`}>
                            File name
                            <SortGlyph />
                        </th>
                        <th className={`${TH} w-[7%]`}>
                            Views
                            <Icon icon="info-sign" size={12} className="ml-1 inline-block text-foreground-muted" />
                        </th>
                        <th className={`${TH} w-[12%]`}>Your role</th>
                        <th className={`${TH} w-[9%]`}>Tags</th>
                        <th className={`${TH} w-[11%]`}>Portfolio</th>
                        <th className={TH}>
                            Last modified
                            <SortGlyph />
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {FILES.map((f) => (
                        <FileRow key={f.path} file={f} />
                    ))}
                    <LoadingRow />
                    <LoadingRow />
                    <LoadingRow />
                </tbody>
            </table>
        </div>
    );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export function ProjectsAndFiles() {
    return (
        <div className="overflow-x-auto bg-background text-foreground">
            <div className="flex min-h-[920px] min-w-[1280px]">
                <FilesRail />
                <div className="flex min-w-0 flex-1 flex-col">
                    <WorkspaceTabBar />
                    <div className="flex min-h-0 flex-1 items-stretch">
                        <main className="flex min-w-0 flex-1 flex-col gap-3 px-5 pb-8 pt-3">
                            <BreadcrumbRow />
                            <QuickFilters />
                            <InputGroup
                                fill
                                size="large"
                                round
                                leftIcon="search"
                                placeholder="Search all portfolios, projects, folders and files…"
                            />
                            <div className="flex items-start gap-4 pt-1">
                                <FilterRail />
                                <FileTable />
                            </div>
                        </main>
                        <SideToolStrip />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProjectsAndFiles;
