import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/cn";

export interface KpiCardProps {
    /** Small, muted, uppercase label. */
    label: string;
    /** Large mono value (already formatted by the caller). */
    value: string;
    /** Optional change indicator. Positive = green, negative = red. */
    change?: {
        /** Percentage, e.g. 12.4 or -3.1. */
        value: number;
        /** Override the period label, e.g. "vs last week". */
        period?: string;
    };
    className?: string;
}

/**
 * KPI stat card: small uppercase label + large mono value + change indicator.
 */
export function KpiCard({ label, value, change, className }: KpiCardProps) {
    const isPositive = change ? change.value >= 0 : false;

    return (
        <div className={cn("rounded-lg border border-border bg-white p-4 shadow-sm", className)}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
            <p className="mt-2 font-mono text-2xl font-semibold text-ink">{value}</p>
            {change ? (
                <div className="mt-2 flex items-center gap-1.5">
                    <span
                        className={cn(
                            "inline-flex items-center gap-0.5 text-xs font-semibold",
                            isPositive ? "text-green-500" : "text-red-500",
                        )}
                    >
                        {isPositive ? (
                            <ArrowUpRight className="h-3.5 w-3.5" />
                        ) : (
                            <ArrowDownRight className="h-3.5 w-3.5" />
                        )}
                        {Math.abs(change.value).toFixed(1)}%
                    </span>
                    {change.period ? (
                        <span className="text-xs text-muted">{change.period}</span>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}