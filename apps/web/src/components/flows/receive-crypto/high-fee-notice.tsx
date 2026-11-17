"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";

/**
 * Networks whose fee is high enough that Nepay warns before a deposit and never
 * recommends them (decided 2026-11-14). The backend applies the same rule to its
 * `recommended` flag; this list only drives the customer-facing warning.
 */
const HIGH_FEE_NETWORKS = new Set(["TRC20"]);

export function isHighFeeNetwork(network: string | null | undefined): boolean {
    return !!network && HIGH_FEE_NETWORKS.has(network.trim().toUpperCase());
}

/** The network Nepay recommends for this coin instead (or null when there isn't one). */
export function recommendedAlternative(variants: ReadonlyArray<{ network: string | null; recommended: boolean }>): string | null {
    return variants.find((v) => v.recommended && !isHighFeeNetwork(v.network))?.network ?? null;
}

/** Says plainly that the fee is high AND that the customer pays it, and points at the recommended network instead. */
export function HighFeeNetworkNotice({ network, alternative }: { network: string; alternative: string | null }) {
    return (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-300">
            <div className="mb-1.5 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                <p className="text-sm font-black">{network} fees are high</p>
            </div>
            <p className="text-[13px] font-medium leading-5">
                The {network} network charges a high fee, and it comes out of your deposit. That means <span className="font-bold">you pay it</span>: you will be
                credited noticeably less than you send, and small deposits can lose most of their value.
            </p>
            <p className="mt-2 text-[13px] font-medium leading-5">
                {alternative ? (
                    <>
                        We recommend the <span className="font-bold">{alternative}</span> network instead: it costs far less. Go back and choose it to keep more of your money.
                    </>
                ) : (
                    <>Go back and choose a different network if one is available, to keep more of your money.</>
                )}
            </p>
        </div>
    );
}
