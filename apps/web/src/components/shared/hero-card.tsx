import * as React from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Plus, Building2, ArrowLeftRight } from "lucide-react";

import { Button } from "@/components/shared/button";
import { Sparkline } from "@/components/shared/sparkline";
import { formatNaira } from "@/lib/format";
import { useUiStore } from "@/lib/stores/ui-store";

export interface HeroCardProps {
    balance: number;
    balanceUsd: number;
    sparkline: number[];
    periodLabel?: string;
}

/**
 * Premium Wallet Card (Prototype matched)
 */
export function HeroCard({
    balance,
    balanceUsd,
    sparkline,
    periodLabel = "Last 7 days",
}: HeroCardProps) {
    const masked = useUiStore((s) => s.masked);
    const toggleMasked = useUiStore((s) => s.toggleMasked);
    const router = useRouter();

    return (
        <div className="relative overflow-hidden rounded-[24px] bg-brand-gradient p-5 sm:p-6 text-white shadow-2xl lg:p-8 border border-white/10">
            {/* Glass shine effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none mix-blend-overlay" />
            
            {/* Ambient gradients */}
            <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-[80px]" />
            <div aria-hidden className="pointer-events-none absolute -bottom-32 left-0 h-64 w-64 rounded-full bg-indigo-400/20 blur-[80px]" />

            {/* ── Content ──── */}
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-10">

                {/* Left: Balance block */}
                <div className="min-w-0 flex-1 w-full">
                    {/* Label + eye toggle */}
                    <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-violet-200">
                            Total balance
                        </p>
                        <button
                            type="button"
                            onClick={toggleMasked}
                            aria-label={masked ? "Show balance" : "Hide balance"}
                            className="inline-flex items-center justify-center text-violet-300 transition-all hover:text-white active:scale-90"
                        >
                            {masked ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>

                    {/* Balance figure */}
                    <p className="mt-2 font-sans tabular-nums tracking-tighter text-[40px] leading-none font-extrabold lg:text-[56px]">
                        {masked ? "••••••" : formatNaira(balance)}
                    </p>

                    {/* USD equivalent */}
                    <div className="mt-3 flex items-center gap-1.5 text-sm font-medium text-violet-200">
                        <p>
                            {masked ? "***" : `$${balanceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        </p>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-7 grid grid-cols-2 gap-2.5 sm:flex sm:flex-row sm:gap-4">
                        <Button
                            size="md"
                            onClick={() => router.push("/add-money")}
                            className="bg-white text-violet-700 hover:bg-violet-50 font-bold shadow-sm rounded-xl h-12 px-2 text-[13px] sm:text-sm sm:px-6 sm:w-auto active:scale-95 transition-transform min-w-0"
                        >
                            <Plus className="mr-1.5 h-4 w-4 shrink-0" />
                            Add money
                        </Button>
                        <Button
                            size="md"
                            onClick={() => router.push("/withdraw")}
                            className="border border-white/20 bg-white/10 text-white backdrop-blur-md hover:bg-white/20 transition-all font-bold rounded-xl h-12 px-2 text-[13px] sm:text-sm sm:px-6 sm:w-auto active:scale-95 min-w-0"
                        >
                            <Building2 className="mr-1.5 h-4 w-4 shrink-0" />
                            Withdraw
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
