import * as React from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Plus, Building2, ArrowLeftRight } from "lucide-react";

import { Button } from "@/components/shared/button";
import { Sparkline } from "@/components/shared/sparkline";
import { formatByCurrency } from "@/lib/format";
import { useUiStore } from "@/lib/stores/ui-store";

export interface HeroCardProps {
    /** The real NGN balance — always the wallet's actual settlement figure. */
    balance: number;
    /** null when the backend has no real rate to convert with — rendered as a quiet placeholder, never a fabricated figure. */
    balanceUsd: number | null;
    /** The account's currently preferred display currency — decides which figure below renders as the headline vs. the subscript. */
    preferredCurrency: string;
    /** `balance` converted into `preferredCurrency` — null when preferredCurrency is NGN (nothing to convert) or no real rate is available. */
    preferredCurrencyEquivalent: number | null;
    sparkline: number[];
    periodLabel?: string;
}

/**
 * Premium Wallet Card (Prototype matched).
 *
 * The headline figure always matches the account's `preferredCurrency`
 * (default NGN for a new account); the other of {NGN balance, USD
 * equivalent} renders as the quieter subscript line below it — never
 * hardcoded NGN-primary/USD-subscript regardless of preference, which is
 * what this card did before `preferredCurrency` existed on GET /wallet.
 */
export function HeroCard({
    balance,
    balanceUsd,
    preferredCurrency,
    preferredCurrencyEquivalent,
    sparkline,
    periodLabel = "Last 7 days",
}: HeroCardProps) {
    const masked = useUiStore((s) => s.masked);
    const toggleMasked = useUiStore((s) => s.toggleMasked);
    const router = useRouter();

    // preferredCurrency === NGN, OR no real rate exists yet to convert into a
    // non-NGN preference, OR preferredCurrency itself is missing/malformed
    // (an older backend response, a network hiccup): NGN is the headline,
    // USD (if a rate exists) is the subscript — the original pairing, and
    // the only one ever shown without a real, well-formed converted figure
    // to back it. `!= null` (loose) below catches undefined too — a caller
    // silently passing `undefined` must fall back exactly like a caller
    // passing `null`, never render as the literal word "undefined".
    // Restricted to USD by construction: preferredCurrency is only ever
    // NGN or USD (see the backend's UpdateCurrencyDto — GBP/EUR were
    // dropped, there's no live rate source for either).
    const showPreferredAsPrimary =
        preferredCurrency === "USD" && preferredCurrencyEquivalent != null && Number.isFinite(preferredCurrencyEquivalent);
    const primaryAmount = showPreferredAsPrimary ? preferredCurrencyEquivalent : balance;
    const primaryCurrency = showPreferredAsPrimary ? preferredCurrency : "NGN";
    const secondaryAmount = showPreferredAsPrimary ? balance : balanceUsd;
    const secondaryCurrency = showPreferredAsPrimary ? "NGN" : "USD";



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

                    {/* Balance figure — headline always matches preferredCurrency */}
                    <p className="mt-2 font-sans tabular-nums tracking-tighter text-[40px] leading-none font-extrabold lg:text-[56px]">
                        {masked ? "••••••" : formatByCurrency(primaryAmount, primaryCurrency)}
                    </p>

                    {/* The other currency, as the quieter subscript */}
                    <div className="mt-3 flex items-center gap-1.5 text-sm font-medium text-violet-200">
                        <p>
                            {masked
                                ? "***"
                                : secondaryAmount !== null
                                    ? formatByCurrency(secondaryAmount, secondaryCurrency)
                                    : `${secondaryCurrency} rate unavailable`}
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
