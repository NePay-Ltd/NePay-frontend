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
    /** Label to show above the sparkline, e.g., "7-day balance" or "30-day balance" */
    periodLabel?: string;
}

/**
 * Reusable hero balance card displaying the user's total balance, a masked state toggle,
 * USD equivalent, a sparkline trend, and primary action buttons (Add Money, Withdraw).
 */
export function HeroCard({
    balance,
    balanceUsd,
    sparkline,
    periodLabel = "7-day balance",
}: HeroCardProps) {
    const [masked, setMasked] = React.useState(false);
    const router = useRouter();

    return (
        <div className="relative overflow-hidden rounded-2xl bg-brand-gradient px-6 py-6 text-white shadow-lg">
            {/* Decorative blobs */}
            <div
                aria-hidden
                className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-500/20 blur-2xl"
            />
            <div
                aria-hidden
                className="pointer-events-none absolute -bottom-8 left-10 h-32 w-32 rounded-full bg-violet-800/30 blur-2xl"
            />

            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                {/* Left — balance */}
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-violet-200">
                            Total Balance
                        </p>
                        <button
                            type="button"
                            onClick={() => setMasked((m) => !m)}
                            aria-label={masked ? "Show balance" : "Hide balance"}
                            className="rounded-full p-0.5 text-violet-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                        >
                            {masked ? (
                                <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                                <Eye className="h-3.5 w-3.5" />
                            )}
                        </button>
                    </div>

                    <p className="mt-1 font-mono text-4xl font-bold tracking-tight">
                        {masked ? "••••••" : formatNaira(balance)}
                    </p>

                    <p className="mt-1 text-sm text-violet-300">
                        {masked ? "≈ ••••" : `≈ $${balanceUsd.toFixed(2)}`}
                    </p>

                    {/* Action buttons */}
                    <div className="mt-5 flex gap-3">
                        <Button
                            size="sm"
                            onClick={() => router.push("/add-money")}
                            className="border border-white/30 bg-white/15 text-white backdrop-blur-sm hover:bg-white/25"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Add Money
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => router.push("/withdraw")}
                            className="bg-white text-violet-700 hover:bg-violet-050"
                        >
                            <ArrowUpRight className="h-3.5 w-3.5" />
                            Withdraw
                        </Button>
                    </div>
                </div>

                {/* Right — sparkline */}
                <div className="w-full sm:w-44 sm:flex-shrink-0">
                    <p className="mb-1 text-right text-[10px] font-medium text-violet-300">
                        {periodLabel}
                    </p>
                    <Sparkline data={sparkline} height={56} />
                </div>
            </div>
        </div>
    );
}
