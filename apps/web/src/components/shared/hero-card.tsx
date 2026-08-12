import * as React from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Plus, Building2, ArrowLeftRight } from "lucide-react";

import { Button } from "@/components/shared/button";
import { Sparkline } from "@/components/shared/sparkline";
import { formatNaira } from "@/lib/format";

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
    const [masked, setMasked] = React.useState(false);
    const router = useRouter();

    return (
        <div className="relative overflow-hidden rounded-[24px] bg-brand-gradient p-6 text-white shadow-xl lg:p-8">
            {/* Ambient gradients */}
            <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-400/20 blur-[80px]" />
            <div aria-hidden className="pointer-events-none absolute -bottom-32 left-0 h-64 w-64 rounded-full bg-indigo-900/40 blur-[80px]" />

            {/* ── Content ──── */}
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-10">

                {/* Left: Balance block */}
                <div className="min-w-0 flex-1">
                    {/* Label + eye toggle */}
                    <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-violet-200">
                            Total balance
                        </p>
                        <button
                            type="button"
                            onClick={() => setMasked((m) => !m)}
                            aria-label={masked ? "Show balance" : "Hide balance"}
                            className="inline-flex items-center justify-center text-violet-300 transition-colors hover:text-white"
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
                            {masked ? "≈ ••••" : `≈ $${balanceUsd.toFixed(2)}`}
                        </p>
                        <span className="opacity-50">·</span>
                        <p className="opacity-80">USDT auto-converted at ₦1,562.50</p>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-8 grid grid-cols-2 gap-3 sm:flex sm:flex-row">
                        <Button
                            size="md"
                            onClick={() => router.push("/add-money")}
                            className="bg-white text-violet-700 hover:bg-violet-50 font-bold shadow-sm rounded-xl h-12 w-full sm:w-auto sm:px-6"
                        >
                            <Plus className="mr-2 h-4 w-4 shrink-0" />
                            Add money
                        </Button>
                        <Button
                            size="md"
                            onClick={() => router.push("/withdraw")}
                            className="border border-white/20 bg-white/10 text-white backdrop-blur-md hover:bg-white/20 transition-all font-bold rounded-xl h-12 w-full sm:w-auto sm:px-6"
                        >
                            <Building2 className="mr-2 h-4 w-4 shrink-0" />
                            Withdraw
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
