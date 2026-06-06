/* eslint-disable no-restricted-imports */
import { Icon, type IconName } from "@/components/ui/icon";
import { Tag, type TagIntent } from "@/components/ui/tag";

export interface Kpi {
    label: string;
    value: string;
    icon: IconName;
    /** Small trend chip text, e.g. "+3" or "-12%". */
    trend?: string;
    trendIntent?: TagIntent;
    /** Direction caret for the trend. */
    trendDirection?: "up" | "down";
    /** Inline sparkline series — recent values, oldest → newest. */
    spark?: number[];
}

/**
 * Tiny inline trend sparkline. Renders the series as a polyline scaled to fit a
 * fixed box; color follows the trend intent via `currentColor` on the wrapper.
 */
function Sparkline({ values }: { values: number[] }) {
    const W = 72;
    const H = 22;
    const PAD = 2;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const step = values.length > 1 ? (W - PAD * 2) / (values.length - 1) : 0;
    const points = values
        .map((v, i) => {
            const x = PAD + i * step;
            const y = PAD + (1 - (v - min) / span) * (H - PAD * 2);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" ");
    return (
        <svg
            viewBox={`0 0 ${W} ${H}`}
            width={W}
            height={H}
            className="shrink-0 overflow-visible"
            aria-hidden
            preserveAspectRatio="none"
        >
            <polyline
                points={points}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

const TREND_TEXT_CLASS: Record<NonNullable<Kpi["trendIntent"]>, string> = {
    none: "text-foreground-muted",
    primary: "text-intent-primary-text",
    success: "text-intent-success-text",
    warning: "text-intent-warning-text",
    danger: "text-intent-danger-text",
};

function KpiCard({ kpi }: { kpi: Kpi }) {
    return (
        <div className="flex flex-col gap-2 rounded-bp border border-border bg-surface p-4">
            <div className="flex items-start justify-between">
                <span className="text-body-sm text-foreground-muted">{kpi.label}</span>
                {/* Icons mute to gray — the trend chip is the only spot of color. */}
                <Icon icon={kpi.icon} size={16} className="text-foreground-muted" />
            </div>
            {/* Stack value over sparkline on the narrowest (2-up mobile) cards; place them
                side by side once there's room (sm+). */}
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-2">
                <div className="flex items-baseline gap-2">
                    <span className="whitespace-nowrap text-heading-lg font-semibold tabular-nums">
                        {kpi.value}
                    </span>
                    {kpi.trend != null && (
                        <Tag minimal intent={kpi.trendIntent ?? "none"} className="shrink-0">
                            {kpi.trendDirection != null && (
                                <Icon
                                    icon={kpi.trendDirection === "up" ? "arrow-up" : "arrow-down"}
                                    size={12}
                                    className="!text-current"
                                />
                            )}
                            {kpi.trend}
                        </Tag>
                    )}
                </div>
                {kpi.spark != null && kpi.spark.length > 1 && (
                    <span className={TREND_TEXT_CLASS[kpi.trendIntent ?? "none"]}>
                        <Sparkline values={kpi.spark} />
                    </span>
                )}
            </div>
        </div>
    );
}

export function StatBar({ kpis }: { kpis: Kpi[] }) {
    return (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {kpis.map((kpi) => (
                <KpiCard key={kpi.label} kpi={kpi} />
            ))}
        </div>
    );
}
