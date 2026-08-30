"use client";

import * as React from "react";
import { ArrowLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { CoinGroup } from "./shared";

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
        <div className={cn("mx-auto w-full", isMobile ? "" : "flex flex-col h-full")}>
            {/* Header */}
            <div className={cn("flex items-center gap-4 mb-8", !isMobile && "px-6 pt-6")}>
                <button 
                    onClick={onBack}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-white/5 border border-border text-ink hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                    <h1 className={cn("font-black text-ink tracking-tight", isMobile ? "text-2xl" : "text-xl")}>Receive {coinName}</h1>
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
                            className="w-full flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-white/5 border border-border hover:border-violet-400 hover:shadow-md dark:hover:bg-white/10 transition-all group/item text-left"
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-11 w-11 rounded-full bg-violet-50 flex items-center justify-center font-bold text-violet-700 text-lg shadow-sm shrink-0 border border-violet-100">
                                    {currency.network?.[0]?.toUpperCase() ?? "N"}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-base font-bold text-ink">
                                            {currency.network ?? "Mainnet"}
                                        </span>
                                        {currency.recommended && (
                                            <span className="text-[10px] font-black bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                Recommended
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[11px] font-bold text-muted uppercase tracking-wider block mt-1">
                                        {currency.code}
                                    </span>
                                </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted group-hover/item:text-violet-600 transition-colors" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
