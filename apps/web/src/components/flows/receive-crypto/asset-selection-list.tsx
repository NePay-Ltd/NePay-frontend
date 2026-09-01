"use client";

import * as React from "react";
import { IconSearch as Search, IconArrowLeft as ArrowLeft } from "@/components/icons";
import { Calculator, RefreshCcw } from "lucide-react";;
import { cn } from "@/lib/cn";
import { useCryptoCurrencies, useCryptoPrices } from "@/lib/queries/crypto";
import { formatNaira } from "@/lib/format";
import { CoinGroup, groupByCoin, CurrencyAvatar } from "./shared";

interface AssetSelectionListProps {
    onSelectGroup: (group: CoinGroup) => void;
    onBack: () => void;
    isMobile?: boolean; // If true, shows back button and uses full height
}

export function AssetSelectionList({ onSelectGroup, onBack, isMobile = false }: AssetSelectionListProps) {
    const [search, setSearch] = React.useState("");

    const { data: currencies, refetch: refetchCurrencies } = useCryptoCurrencies();
    const { data: pricesData, isFetching: pricesFetching, refetch: refetchPrices } = useCryptoPrices();

    const handleRefresh = () => {
        refetchCurrencies();
        refetchPrices();
    };

    const coinGroups = React.useMemo(() => groupByCoin(currencies ?? []), [currencies]);

    // The default view is the curated shortlist only — hundreds of raw
    // NOWPayments-supported tickers would otherwise all render at once.
    // Searching intentionally reaches into the full, uncurated set below,
    // since that's the whole point of a search escape hatch.
    const curatedGroups = React.useMemo(
        () => coinGroups.filter((g) => g.variants.some((v) => v.curated)),
        [coinGroups],
    );

    const searchResults = React.useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return curatedGroups;

        return coinGroups.filter(g => {
            if (g.coin.toLowerCase().includes(query)) return true;
            if (g.representative.name?.toLowerCase().includes(query)) return true;
            return g.variants.some((v) => v.code.toLowerCase().includes(query));
        });
    }, [coinGroups, curatedGroups, search]);

    return (
        <div className={cn("mx-auto", isMobile ? "w-full px-3 pb-12 md:pb-20 pt-6 min-h-screen" : "w-full flex flex-col h-full")}>
            {/* Header */}
            <div className={cn("flex items-center justify-between gap-2 mb-6 sm:mb-8", !isMobile && "px-6 pt-6")}>
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    {isMobile && (
                        <button
                            onClick={onBack}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white dark:bg-white/5 border border-border text-ink hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                    )}
                    <div className="min-w-0">
                        <h1 className={cn("font-black text-ink tracking-tight truncate", isMobile ? "text-xl sm:text-2xl" : "text-xl")}>Select Asset</h1>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={handleRefresh}
                        className={cn("flex h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-white/5 border border-border text-ink hover:bg-gray-50 dark:hover:bg-white/10 transition-colors", pricesFetching && "opacity-50")}
                        disabled={pricesFetching}
                    >
                        <RefreshCcw className={cn("h-4 w-4", pricesFetching && "animate-spin")} />
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className={cn("relative mb-6 group shrink-0", !isMobile && "px-6")}>
                <div className={cn("absolute inset-y-0 left-0 flex items-center pointer-events-none", !isMobile ? "pl-10" : "pl-4")}>
                    <Search className="h-5 w-5 text-muted group-focus-within:text-violet-600 transition-colors" />
                </div>
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search all coins..."
                    className="block w-full rounded-2xl border border-border bg-white dark:bg-gray-900/50 py-3.5 sm:py-4 pl-12 pr-4 text-sm font-semibold text-ink placeholder:text-muted focus:border-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-500/10 transition-all shadow-sm"
                />
            </div>

            {/* List */}
            <div className={cn("flex-1", !isMobile && "overflow-y-auto px-6 pb-6")}>
                <div className="px-2 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-muted">
                        {search.trim() ? "Search Results" : "Most Used"}
                    </span>
                </div>

                {searchResults.length === 0 ? (
                    <div className="text-center py-12 px-4 rounded-3xl border border-border bg-gray-50 dark:bg-white/5">
                        <span className="text-4xl mb-4 block">🔍</span>
                        <h3 className="text-lg font-bold text-ink">No coins found</h3>
                        <p className="text-sm text-muted font-medium mt-1">Try a different search term.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {searchResults.map((group) => {
                            const price = pricesData?.prices[group.coin];

                            return (
                                <button
                                    key={group.coin}
                                    onClick={() => onSelectGroup(group)}
                                    className="w-full flex items-center justify-between p-4 h-[72px] rounded-2xl bg-white dark:bg-white/5 border border-border hover:border-violet-400 hover:shadow-md dark:hover:bg-white/10 transition-all group/item text-left"
                                >
                                    {/* Left Zone: Flexible width, truncates long text */}
                                    <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
                                        <CurrencyAvatar currency={group.representative} className="h-11 w-11 shrink-0 text-lg shadow-sm" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="text-sm font-bold text-ink truncate">
                                                    {group.representative.name ?? group.coin}
                                                </span>
                                                <span className="text-xs font-bold text-muted shrink-0">
                                                    {group.coin}
                                                </span>
                                                {group.representative.recommended && !search.trim() && (
                                                    <span className="text-[10px] font-black bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                                                        Popular
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[11px] font-bold text-muted uppercase tracking-wider block mt-1 truncate">
                                                {group.variants.length > 1 ? `${group.variants.length} Networks` : (group.representative.network ?? "Mainnet")}
                                            </span>
                                        </div>
                                    </div>
                                    {/* Right Zone: Fixed width, right aligned, tabular numbers */}
                                    <div className="w-[120px] shrink-0 text-right">
                                        {price ? (
                                            <span className="block font-mono text-sm font-bold text-ink tabular-nums">
                                                {formatNaira(Number(price))}
                                            </span>
                                        ) : (
                                            <span className="text-xs font-bold text-muted">Unavailable</span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
