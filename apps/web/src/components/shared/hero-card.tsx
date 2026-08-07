import * as React from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Plus, ArrowUpRight } from "lucide-react";

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
 * Premium Wallet Card
 * Mobile: single column, sparkline stacks below balance.
 * Desktop: two columns, sparkline on the right.
 */
export function HeroCard({
    balance,
    balanceUsd,
    sparkline,
    periodLabel = "30-day trend",
}: HeroCardProps) {
    const [masked, setMasked] = React.useState(false);
    const router = useRouter();

    return (
        <div className="relative overflow-hidden rounded-2xl bg-brand-gradient px-5 py-6 text-white shadow-lg ring-1 ring-white/10 group transition-all hover:-translate-y-1 hover:shadow-xl sm:rounded-3xl sm:px-8 sm:py-8">
            {/* Noise texture */}
            <div className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay" style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }} />

            {/* Ambient blobs */}
            <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/10 blur-3xl transition-transform duration-1000 group-hover:scale-125" />
            <div aria-hidden className="pointer-events-none absolute -bottom-16 left-0 h-48 w-48 rounded-full bg-violet-900/40 blur-3xl transition-transform duration-1000 group-hover:scale-125" />

            {/* ── Content — stacks vertically on mobile, row on md+ ──── */}
            <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-8">

                {/* Balance block */}
                <div className="min-w-0 flex-1">
                    {/* Label + eye toggle */}
                    <div className="flex items-center gap-2">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-200 sm:text-xs">
                            Available Balance
                        </p>
                        <button
                            type="button"
                            onClick={() => setMasked((m) => !m)}
                            aria-label={masked ? "Show balance" : "Hide balance"}
                            className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 active:scale-90"
                        >
                            {masked ? <EyeOff className="h-2.5 w-2.5" /> : <Eye className="h-2.5 w-2.5" />}
                        </button>
                    </div>

                    {/* Balance figure */}
                    <p className="mt-1.5 font-sans tabular-nums tracking-tighter text-[2.5rem] font-extrabold drop-shadow-md leading-none sm:text-5xl">
                        {masked ? "••••••" : formatNaira(balance)}
                    </p>

                    {/* USD equivalent */}
                    <div className="mt-2 flex items-center gap-2">
                        <p className="text-sm font-medium text-violet-200">
                            {masked ? "≈ ••••" : `≈ $${balanceUsd.toFixed(2)}`}
                        </p>
                        <span className="h-1 w-1 rounded-full bg-white/20" />
                        <span className="text-xs font-medium text-white/50">Updated just now</span>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-6 flex gap-3">
                        <Button
                            size="md"
                            onClick={() => router.push("/add-money")}
                            className="flex-1 border border-white/20 bg-white/15 text-white backdrop-blur-md hover:bg-white/25 hover:scale-[1.02] transition-all shadow-sm sm:flex-none"
                        >
                            <Plus className="h-4 w-4" />
                            Add Money
                        </Button>
                        <Button
                            size="md"
                            onClick={() => router.push("/withdraw")}
                            className="flex-1 bg-white text-violet-700 hover:bg-violet-050 hover:scale-[1.02] transition-all shadow-sm font-bold sm:flex-none"
                        >
                            <ArrowUpRight className="h-4 w-4" />
                            Withdraw
                        </Button>
                    </div>
                </div>

                {/* Sparkline — below on mobile, right on md+ */}
                <div className="w-full rounded-xl bg-white/5 p-3.5 border border-white/10 backdrop-blur-sm shadow-inner sm:p-4 md:w-56 md:flex-shrink-0 md:rounded-2xl">
                    <p className="mb-3 flex items-center justify-between text-[10px] font-bold text-violet-200 uppercase tracking-widest sm:text-xs">
                        <span>{periodLabel}</span>
                        <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                    </p>
                    <Sparkline data={sparkline} height={52} />
                </div>
            </div>
        </div>
    );
}
