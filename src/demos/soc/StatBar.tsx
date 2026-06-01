/* eslint-disable no-restricted-imports */
import { Card } from "@/components/ui/card";
import { Icon, type IconName } from "@/components/ui/icon";
import { Tag, type TagIntent } from "@/components/ui/tag";

export interface Kpi {
    label: string;
    value: string;
    icon: IconName;
    /** Tinted icon color. */
    iconIntent?: "primary" | "success" | "warning" | "danger";
    /** Small trend chip text, e.g. "+3" or "-12%". */
    trend?: string;
    trendIntent?: TagIntent;
    /** Direction caret for the trend. */
    trendDirection?: "up" | "down";
}

const ICON_INTENT_CLASS: Record<NonNullable<Kpi["iconIntent"]>, string> = {
    primary: "text-intent-primary-text",
    success: "text-intent-success-text",
    warning: "text-intent-warning-text",
    danger: "text-intent-danger-text",
};

function KpiCard({ kpi }: { kpi: Kpi }) {
    return (
        <Card elevation={1} className="flex flex-col gap-2">
            <div className="flex items-start justify-between">
                <span className="text-body-sm text-foreground-muted">{kpi.label}</span>
                <Icon
                    icon={kpi.icon}
                    size={18}
                    className={kpi.iconIntent ? ICON_INTENT_CLASS[kpi.iconIntent] : "text-foreground-muted"}
                />
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-heading-lg font-semibold tabular-nums">{kpi.value}</span>
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
        </Card>
    );
}

export function StatBar({ kpis }: { kpis: Kpi[] }) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi) => (
                <KpiCard key={kpi.label} kpi={kpi} />
            ))}
        </div>
    );
}
