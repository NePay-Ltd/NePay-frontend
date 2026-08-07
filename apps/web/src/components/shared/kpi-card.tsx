import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/cn";

export interface KpiCardProps {
    /** Small, muted, uppercase label. */
    label: string;
    /** Large mono value (already formatted by the caller). */
    value: string;
    /** Optional change indicator. Positive = green, negative = red. */
    change?: {
        /** Percentage, e.g. 12.4 or -3.1, or string like "Positive". */
        value: number | string;
        /** Override the period label, e.g. "vs last week". */
        period?: string;
    };
    className?: string;
}

/**
 * KPI stat card: small uppercase label + large mono value + change indicator.
 */
export function KpiCard({ label, value, change, className }: KpiCardProps) {
    const isPositive = typeof change?.value === "number" ? change.value >= 0 : change?.value === "Positive";
    const isNeutral = typeof change?.value === "string" && change.value !== "Positive" && change.value !== "Negative";

    return (
        <div className={cn("rounded-xl border border-border/60 bg-white p-4 transition-all hover:-translate-y-1 hover:border-violet-200 shadow-[0_2px_8px_rgba(76,0,180,0.04)] hover:shadow-[0_8px_24px_rgba(76,0,180,0.08)] sm:rounded-2xl sm:p-5", className)}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1 sm:text-xs">{label}</p>
            <p className="font-sans tabular-nums text-xl font-extrabold text-ink tracking-tighter sm:text-3xl">{value}</p>
            {change ? (
                <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:mt-3 sm:gap-2">
                    <span
                        className={cn(
                            "inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full sm:text-xs",
                            isNeutral ? "bg-gray-100 text-gray-700" : isPositive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700",
                        )}
                    >
                        {typeof change.value === "number" ? (
                            <>
                                {isPositive ? <ArrowUpRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> : <ArrowDownRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
                                {Math.abs(change.value)}%
                            </>
                        ) : (
                            change.value
                        )}
                    </span>
                    {change.period ? (
                        <span className="text-[10px] font-medium text-muted sm:text-xs">{change.period}</span>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}