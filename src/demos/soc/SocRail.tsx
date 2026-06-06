/* eslint-disable no-restricted-imports */
import { Icon, type IconName } from "@/components/ui/icon";
import { KeyCombo } from "@/components/ui/hotkeys";

export interface RailItem {
    id: string;
    label: string;
    icon: IconName;
    /** Inventory count shown right-aligned on the row. */
    count?: number;
    /** Optional single-key shortcut chip. */
    shortcut?: string;
}

interface RailNavProps {
    /** Primary navigation entries (the workspace views). */
    items: RailItem[];
    /** Bottom-pinned utility entries. */
    footerItems: RailItem[];
    activeId: string;
    onSelect: (id: string) => void;
}

function RailRow({
    item,
    active,
    onSelect,
}: {
    item: RailItem;
    active: boolean;
    onSelect: (id: string) => void;
}) {
    return (
        <button
            type="button"
            onClick={() => onSelect(item.id)}
            // Rows ~32px, 0 17px padding. Hover = subtle white overlay; active = a
            // lighter fill (no colored left-edge stripe — the fill is the selection).
            className={
                "flex h-8 w-full items-center gap-2.5 rounded-bp px-3 text-left text-body-sm transition-colors " +
                (active
                    ? "bg-white/10 font-medium text-foreground"
                    : "text-foreground-muted hover:bg-white/[0.06] hover:text-foreground")
            }
            aria-current={active ? "page" : undefined}
        >
            <Icon icon={item.icon} size={16} className="shrink-0 !text-current" />
            <span className="min-w-0 grow truncate">{item.label}</span>
            {item.shortcut != null && (
                <KeyCombo combo={item.shortcut} minimal className="text-foreground-muted" />
            )}
            {item.count != null && (
                <span className="shrink-0 tabular-nums text-body-sm text-foreground-muted">
                    {item.count}
                </span>
            )}
        </button>
    );
}

/**
 * The rail's inner nav — brand, sections, and rows. Rendered both in the static
 * desktop rail (`SocRail`) and inside the mobile drawer. Always sits on a dark
 * surface (the caller wraps it in `.dark`).
 */
export function RailNav({ items, footerItems, activeId, onSelect }: RailNavProps) {
    return (
        <nav className="flex h-full flex-col gap-1 bg-surface p-2 text-foreground">
            {/* Brand */}
            <div className="flex items-center gap-2 px-3 py-3">
                <Icon icon="shield" size={18} className="text-intent-primary-text" />
                <span className="font-semibold text-foreground">Sentinel</span>
            </div>

            <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
                Monitor
            </div>
            {items.map((item) => (
                <RailRow key={item.id} item={item} active={item.id === activeId} onSelect={onSelect} />
            ))}

            <div className="grow" />

            {footerItems.map((item) => (
                <RailRow key={item.id} item={item} active={item.id === activeId} onSelect={onSelect} />
            ))}
        </nav>
    );
}

/**
 * Dark left rail — the universal shell element on md+ screens. Stays dark
 * regardless of the app's light/dark mode by wrapping its subtree in `.dark`
 * (class-based dark mode swaps the semantic surface tokens). On small screens the
 * rail is hidden; its nav moves into a hamburger drawer (see SocConsole).
 */
export function SocRail(props: RailNavProps) {
    return (
        <div className="dark hidden w-[230px] shrink-0 border-r border-border-strong md:block">
            <RailNav {...props} />
        </div>
    );
}
