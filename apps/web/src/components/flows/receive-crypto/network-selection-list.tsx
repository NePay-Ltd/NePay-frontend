"use client";

import * as React from "react";
import { IconArrowLeft as ArrowLeft, IconChevronRight as ChevronRight } from "@/components/icons";
import { Loader2 } from "lucide-react";;
import { cn } from "@/lib/cn";
import { CoinGroup, CurrencyAvatar } from "./shared";

interface NetworkSelectionListProps {
    coinGroup: CoinGroup | null;
    onSelectNetwork: (code: string) => void;
    onBack: () => void;
    isMobile?: boolean;
}

export function NetworkSelectionList({ coinGroup, onSelectNetwork, onBack, isMobile = false }: NetworkSelectionListProps) {
    if (!coinGroup) {
        return (
            <div className="flex flex-col items-center justify-center p-12 h-full">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600 mb-4" />
                <p className="text-sm text-muted">Loading networks...</p>
            </div>
        );
    }

    const coinName = coinGroup.representative.name ?? coinGroup.coin;

    return (
        <div className={cn("mx-auto w-full", isMobile ? "pb-12 md:pb-20 px-4 sm:px-6 pt-4 sm:pt-6 min-h-screen" : "flex flex-col h-full")}>
            {/* Header */}
            <div className={cn("flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8", !isMobile && "px-6 pt-6")}>
                <button
                    onClick={onBack}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white dark:bg-white/5 border border-border text-ink hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <CurrencyAvatar currency={coinGroup.representative} className="h-10 w-10 text-base shadow-sm shrink-0" />
                <div className="min-w-0">
                    <h1 className={cn("font-black text-ink tracking-tight truncate", isMobile ? "text-xl sm:text-2xl" : "text-xl")}>Receive {coinName}</h1>
                    <p className="text-sm font-medium text-muted mt-1">Choose the network to deposit on</p>
                </div>
            </div>

            {/* List */}
            <div className={cn("flex-1", !isMobile && "overflow-y-auto px-6 pb-6")}>
                <div className="space-y-3">
                    {coinGroup.variants.map((currency) => (
                        <button
                            key={currency.code}
                            onClick={() => onSelectNetwork(currency.code)}
                            className="w-full flex items-center justify-between gap-2 p-3 sm:p-4 rounded-2xl bg-white dark:bg-white/5 border border-border hover:border-violet-400 hover:shadow-md dark:hover:bg-white/10 transition-all group/item text-left"
                        >
                            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-violet-50 flex items-center justify-center font-bold text-violet-700 text-lg shadow-sm shrink-0 border border-violet-100">
                                    {currency.network?.[0]?.toUpperCase() ?? "N"}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-base font-bold text-ink truncate">
                                            {currency.network ?? "Mainnet"}
                                        </span>
                                        {currency.recommended && (
                                            <span className="shrink-0 text-[10px] font-black bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                Recommended
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[11px] font-bold text-muted uppercase tracking-wider block mt-1 truncate">
                                        {currency.code}
                                    </span>
                                </div>
                            </div>
                            <ChevronRight className="h-5 w-5 shrink-0 text-muted group-hover/item:text-violet-600 transition-colors" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
