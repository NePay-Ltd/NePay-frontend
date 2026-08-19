/**
 * Shared overview types, plus the one mock endpoint (`fetchSearch`) still
 * actually wired to a component (command-palette.tsx) — search has no real
 * backend endpoint yet. `useOverviewSummary` (lib/queries/overview.ts) calls
 * the real `/wallet` and `/wallet/transactions` endpoints directly and does
 * not use anything from this file's fetch functions; `OverviewSummary` here
 * is only the shared response type.
 */

import type { TxCategory } from "@/components/shared/tx-icon";

// ─── Types (shared with the real backend contract) ────────────────────────────

export interface OverviewSummary {
    balance: number;
    /** null when the backend has no real rate to convert with — see WalletBalanceDto.usdEquivalent. Never a fabricated figure. */
    balanceUsd: number | null;
    /** 7 daily balance data-points, oldest first. */
    sparkline: number[];
    kpi: {
        moneyIn: number;
        moneyOut: number;
        netChange: number;
        pending: number;
    };
    recentTransactions: Transaction[];
}

export interface Transaction {
    id: string;
    label: string;
    meta: string;       // e.g. "Aug 6 · Airtime"
    amount: number;     // positive = credit, negative = debit
    category: TxCategory;
    status: "success" | "pending" | "failed";
}

export interface SearchResults {
    transactions: SearchHit[];
    services: SearchHit[];
    banks: SearchHit[];
}

export interface SearchHit {
    id: string;
    label: string;
    meta?: string;
    href: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function delay(ms: number) {
    return new Promise<void>((res) => setTimeout(res, ms));
}

// ─── Endpoint mocks ───────────────────────────────────────────────────────────

/** GET /search?q=<query> */
export async function fetchSearch(query: string): Promise<SearchResults> {
    await delay(350);
    const q = query.toLowerCase();

    const allTransactions: SearchHit[] = [
        { id: "t1", label: "MTN Airtime", meta: "Aug 7 · ₦2,000", href: "/transactions?id=tx_01" },
        { id: "t2", label: "Wallet Top-Up", meta: "Aug 6 · ₦50,000", href: "/transactions?id=tx_02" },
        { id: "t3", label: "Amazon Gift Card", meta: "Aug 5 · ₦15,500", href: "/transactions?id=tx_03" },
        { id: "t4", label: "Abuja → Lagos (Air Peace)", meta: "Aug 4 · ₦67,200", href: "/transactions?id=tx_04" },
        { id: "t5", label: "USDT Sale", meta: "Aug 3 · ₦78,400", href: "/transactions?id=tx_05" },
    ];

    const allServices: SearchHit[] = [
        { id: "s1", label: "Airtime & Data", href: "/services/airtime" },
        { id: "s2", label: "Electricity Bill", href: "/services/electricity" },
        { id: "s3", label: "Gift Cards", href: "/gift-cards" },
        { id: "s4", label: "Book Flights", href: "/flights" },
        { id: "s5", label: "Receive Crypto", href: "/receive-crypto" },
        { id: "s6", label: "Withdraw", href: "/withdraw" },
    ];

    const allBanks: SearchHit[] = [
        { id: "b1", label: "Access Bank", meta: "0123456789", href: "/wallet/banks/b1" },
        { id: "b2", label: "GTBank", meta: "0987654321", href: "/wallet/banks/b2" },
        { id: "b3", label: "Zenith Bank", meta: "1122334455", href: "/wallet/banks/b3" },
    ];

    if (!q) return { transactions: [], services: allServices.slice(0, 4), banks: [] };

    return {
        transactions: allTransactions.filter(
            (h) => h.label.toLowerCase().includes(q) || h.meta?.toLowerCase().includes(q),
        ),
        services: allServices.filter((h) => h.label.toLowerCase().includes(q)),
        banks: allBanks.filter(
            (h) => h.label.toLowerCase().includes(q) || h.meta?.toLowerCase().includes(q),
        ),
    };
}
