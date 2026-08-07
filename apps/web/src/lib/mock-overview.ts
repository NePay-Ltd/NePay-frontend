/**
 * Mock responses for overview-related API endpoints.
 * Shapes are designed to be drop-in compatible with the real backend.
 * Swap each function body for `api.get<T>(path)` during integration.
 */

import type { TxCategory } from "@/components/shared/tx-icon";

// ─── Types (shared with the real backend contract) ────────────────────────────

export interface OverviewSummary {
    balance: number;
    balanceUsd: number;
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

export interface RateQuote {
    symbol: string;     // "USDT/NGN"
    rate: number;       // e.g. 1565.50
    changePercent: number; // e.g. 0.82 or -1.3
    updatedAt: string;  // ISO timestamp
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

/** GET /overview/summary */
export async function fetchOverviewSummary(): Promise<OverviewSummary> {
    await delay(900);
    return {
        balance: 385_000.45,
        balanceUsd: 246.80,
        sparkline: [340_000, 355_200, 348_900, 362_100, 370_500, 378_200, 385_000],
        kpi: {
            moneyIn: 142_500,
            moneyOut: 97_800,
            netChange: 44_700,
            pending: 3,
        },
        recentTransactions: [
            {
                id: "tx_01",
                label: "MTN Airtime",
                meta: "Aug 7 · Airtime",
                amount: -2_000,
                category: "payment",
                status: "success",
            },
            {
                id: "tx_02",
                label: "Wallet Top-Up",
                meta: "Aug 6 · Bank Transfer",
                amount: 50_000,
                category: "deposit",
                status: "success",
            },
            {
                id: "tx_03",
                label: "Amazon Gift Card",
                meta: "Aug 5 · Gift Card",
                amount: -15_500,
                category: "gift-card",
                status: "success",
            },
            {
                id: "tx_04",
                label: "Abuja → Lagos",
                meta: "Aug 4 · Flight · Air Peace",
                amount: -67_200,
                category: "flight",
                status: "pending",
            },
            {
                id: "tx_05",
                label: "USDT Sale",
                meta: "Aug 3 · Crypto Off-Ramp",
                amount: 78_400,
                category: "deposit",
                status: "success",
            },
        ],
    };
}

/** GET /overview/rate */
export async function fetchRateQuote(): Promise<RateQuote> {
    await delay(600);
    return {
        symbol: "USDT/NGN",
        rate: 1_565.50,
        changePercent: 0.82,
        updatedAt: new Date().toISOString(),
    };
}

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
