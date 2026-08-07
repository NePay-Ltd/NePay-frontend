/**
 * Mock API endpoints for the Transactions ledger.
 */

import { BaseTransaction } from "@/components/shared/transaction-row";
import { type TxCategory } from "@/components/shared/tx-icon";

function randomDelay(minMs = 400, maxMs = 1200): Promise<void> {
    return new Promise((resolve) =>
        setTimeout(resolve, Math.floor(Math.random() * (maxMs - minMs) + minMs)),
    );
}

export interface PaginatedTransactions {
    items: BaseTransaction[];
    nextCursor: string | null;
    totalCount: number;
}

// ─── Generate Dummy Ledger ───────────────────────────────────────────────────

const ALL_TRANSACTIONS: BaseTransaction[] = Array.from({ length: 143 }).map((_, i) => {
    const isCredit = Math.random() > 0.6;
    let category: TxCategory;
    let label = "";
    let meta = "";
    let amount = 0;

    const rnd = Math.random();
    if (isCredit) {
        category = "deposit";
        amount = Math.floor(Math.random() * 90000) + 10000;
        if (rnd > 0.5) {
            label = "Wallet Top-Up";
            meta = "GTBank ••••6789";
        } else {
            label = "USDT Sale";
            meta = "Crypto Off-Ramp";
        }
    } else {
        if (rnd < 0.2) {
            category = "flight";
            label = "Lagos → Abuja";
            meta = "Air Peace";
            amount = -(Math.floor(Math.random() * 80000) + 50000);
        } else if (rnd < 0.4) {
            category = "gift-card";
            label = "Amazon Gift Card";
            meta = "Apple";
            amount = -(Math.floor(Math.random() * 20000) + 5000);
        } else if (rnd < 0.6) {
            category = "payment";
            label = "MTN Airtime";
            meta = "0803 •••• 1234";
            amount = -(Math.floor(Math.random() * 3000) + 100);
        } else if (rnd < 0.8) {
            category = "payment";
            label = "IKEDC Prepaid";
            meta = "0101 •••• 5555";
            amount = -(Math.floor(Math.random() * 15000) + 5000);
        } else {
            category = "withdrawal";
            label = "Bank Transfer";
            meta = "Access Bank ••••1111";
            amount = -(Math.floor(Math.random() * 50000) + 5000);
        }
    }

    const date = new Date();
    date.setDate(date.getDate() - Math.floor(i / 3)); // Spread over time
    date.setHours(Math.floor(Math.random() * 24));
    
    let status: "success" | "pending" | "failed" = "success";
    if (i < 5) {
        if (Math.random() > 0.7) status = "pending";
        else if (Math.random() > 0.9) status = "failed";
    }

    return {
        id: `tx_${1000 - i}`,
        label,
        meta,
        amount,
        category,
        status,
        date: date.toISOString(),
    };
});

// ─── API Endpoints ───────────────────────────────────────────────────────────

export async function mockGetTransactions(
    type: string | null,
    cursor: string | null,
    limit: number = 20
): Promise<PaginatedTransactions> {
    await randomDelay(600, 1000);

    let filtered = ALL_TRANSACTIONS;

    if (type && type !== "All") {
        const typeNormalized = type.toLowerCase();
        if (typeNormalized === "deposits") {
            filtered = filtered.filter(t => t.category === "deposit");
        } else if (typeNormalized === "withdrawals") {
            filtered = filtered.filter(t => t.category === "withdrawal");
        } else if (typeNormalized === "payments") {
            filtered = filtered.filter(t => t.category === "payment");
        } else if (typeNormalized === "gift cards") {
            filtered = filtered.filter(t => t.category === "gift-card");
        } else if (typeNormalized === "flights") {
            filtered = filtered.filter(t => t.category === "flight");
        }
    }

    const totalCount = filtered.length;
    
    let startIndex = 0;
    if (cursor) {
        const foundIndex = filtered.findIndex(t => t.id === cursor);
        if (foundIndex !== -1) {
            startIndex = foundIndex;
        }
    }

    const endIndex = startIndex + limit;
    const items = filtered.slice(startIndex, endIndex);
    
    // The cursor for the NEXT page is the ID of the first item on the next page
    const nextCursor = (endIndex < totalCount && filtered[endIndex]) ? filtered[endIndex]!.id : null;

    return {
        items,
        nextCursor,
        totalCount,
    };
}
