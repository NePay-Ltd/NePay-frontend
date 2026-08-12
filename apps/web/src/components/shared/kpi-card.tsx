import { TrendingUp, TrendingDown, Scale, History } from "lucide-react";

import { cn } from "@/lib/cn";

export interface KpiCardProps {
    /** Small, muted, uppercase label. */
    label: string;
    /** Large mono value (already formatted by the caller). */
    value: string;
    /** Optional change indicator. Positive = green, negative = red. */
    change?: {
        value: number | string;
        period?: string;
        customDirection?: "up" | "down" | "none";
    };
    className?: string;
}

/**
 * KPI stat card matching prototype
 */
export function KpiCard({ label, value, change, className }: KpiCardProps) {
    const isUp = change?.customDirection === "up";
    const isDown = change?.customDirection === "down";
    const isNeutral = change?.customDirection === "none";

    return (
        <div className={cn("flex flex-col h-full rounded-[16px] border border-border bg-white p-5 shadow-sm transition-all hover:shadow-md", className)}>
            <div className="flex items-center gap-1.5 mb-2">
                {label === "Money in" && <TrendingUp className="h-3 w-3 text-violet-400" />}
                {label === "Money out" && <TrendingDown className="h-3 w-3 text-violet-400" />}
                {label === "Net change" && <Scale className="h-3 w-3 text-violet-400" />}
                {label === "Pending" && <History className="h-3 w-3 text-violet-400" />}
                <p className="text-xs font-bold text-body">{label}</p>
            </div>
            
            <p className="font-sans tabular-nums text-[24px] font-extrabold text-ink tracking-tighter leading-none mb-4 break-words">{value}</p>
            
            {change ? (
                <div className={cn(
                    "flex items-center gap-1 text-xs font-medium mt-auto pt-1",
                    isUp ? "text-green-600" : isDown ? "text-red-500" : "text-muted"
                )}>
                    {isUp && <TrendingUp className="h-3.5 w-3.5 shrink-0" />}
                    {isDown && <TrendingDown className="h-3.5 w-3.5 shrink-0" />}
                    <span>
                        <strong className="font-bold">{typeof change.value === "number" ? Math.abs(change.value) : change.value}</strong> {change.period}
                    </span>
                </div>
            ) : null}
        </div>
    );
}