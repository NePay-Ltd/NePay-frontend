/**
 * TanStack Query hooks for Transactions.
 */

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { LedgerEntryDto, ApiPaginated, ApiResponse } from "@/lib/types/api";
import { BaseTransaction } from "@/components/shared/transaction-row";
import { TxCategory } from "@/components/shared/tx-icon";
import { UtilityPurchaseResponseDto } from "@/lib/types/api";

export function mapLedgerToTransaction(entry: LedgerEntryDto): BaseTransaction {
    let category: TxCategory = "payment";
    switch (entry.type) {
        case "DEPOSIT":
        case "BANK_DEPOSIT": category = "deposit"; break;
        case "WITHDRAWAL": category = "withdrawal"; break;
        case "UTILITY_PURCHASE": 
            category = "payment"; 
            if (entry.description?.toLowerCase().includes("airtime") || entry.description?.toLowerCase().includes("vtu")) category = "airtime";
            if (entry.description?.toLowerCase().includes("data")) category = "data";
            if (entry.description?.toLowerCase().includes("tv") || entry.description?.toLowerCase().includes("cable")) category = "tv";
            if (entry.description?.toLowerCase().includes("electricity") || entry.description?.toLowerCase().includes("power")) category = "electricity";
            break;
        case "UTILITY_DISCOUNT": category = "cashback"; break;
        case "GIFT_CARD_SALE": category = "gift-card"; break;
        case "FLIGHT_BOOKING": category = "flight"; break;
        // ADMIN_ADJUSTMENT is the true catch-all (AdminService's OTHER
        // category) — everything with an actual name gets its own type and
        // its own icon below, precisely so a customer can never tell a
        // manual credit apart from an automated one just by looking at
        // their own transaction list.
        case "ADMIN_ADJUSTMENT": category = "admin"; break;
        case "PROMO_CREDIT": category = "promo-credit"; break;
        case "GOODWILL_CREDIT": category = "goodwill-credit"; break;
        case "ERROR_CORRECTION": category = "correction"; break;
        case "CASHBACK": category = "cashback"; break;
        case "REFERRAL_REWARD": category = "cashback"; break;
    }

    const cryptoAsset = entry.assetQuantity && entry.description
        ? entry.description.match(/\s([A-Za-z0-9_-]+)\s@\s/)?.[1]
        : undefined;

    // ADMIN_ADJUSTMENT is the one type that's still a generic, internal
    // name by design (AdminService's true OTHER catch-all) — every named
    // category above already has an honest type of its own, so this is the
    // only case left where showing the literal type would read as "Admin
    // Adjustment" to a customer. "Account Credit"/"Account Debit" reads
    // like a normal part of the wallet instead.
    const meta = entry.type === "ADMIN_ADJUSTMENT"
        ? entry.direction === "DEBIT" ? "Account Debit" : "Account Credit"
        : entry.type.replace(/_/g, " ");

    return {
        id: entry.id,
        label: entry.assetQuantity && cryptoAsset
            ? `Crypto deposit${entry.description?.includes("partial payment") ? " (partial payment)" : ""}`
            : entry.description || entry.type.replace(/_/g, " "),
        meta: entry.assetQuantity && cryptoAsset
            ? `${entry.assetQuantity} ${cryptoAsset} · Crypto deposit`
            : meta,
        amount: entry.direction === "DEBIT" ? -parseFloat(entry.amount) : parseFloat(entry.amount),
        category,
        status: "success",
        date: entry.createdAt,
        cryptoAmount: entry.assetQuantity ?? undefined,
        cryptoAsset,
        exchangeRate: entry.rate ?? undefined,
    };
}

export const transactionKeys = {
    all: ["transactions"] as const,
    list: (page: number) => [...transactionKeys.all, "list", page] as const,
    detail: (id: string) => [...transactionKeys.all, "detail", id] as const,
};

/**
 * A single transaction by id, straight from GET /wallet/transactions/:id —
 * not a search through whatever page of the list happens to be cached.
 * Receipt views (the /transactions/[id] page, "View Full Receipt" from the
 * summary modal) must use this, not useInfiniteTransactions + .find(), which
 * only ever finds a transaction if it's within the pages already fetched —
 * silently "not found" for anything older than that.
 */
export function useTransaction(id: string | null) {
    return useQuery<BaseTransaction>({
        queryKey: transactionKeys.detail(id ?? ""),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<LedgerEntryDto>>(`/wallet/transactions/${id}`);
            const transaction = mapLedgerToTransaction(res.data.data);
            if (transaction.category === "electricity") {
                try {
                    const utility = await apiClient.get<ApiResponse<UtilityPurchaseResponseDto>>(`/utilities/purchases/by-ledger/${id}`);
                    transaction.utilityToken = utility.data.data.token ?? undefined;
                } catch {
                    // Older transactions may predate the utility-purchase link.
                }
            }
            return transaction;
        },
        enabled: !!id,
    });
}

export function useTransactions(page: number = 1, limit: number = 20) {
    return useQuery<ApiPaginated<BaseTransaction>>({
        queryKey: transactionKeys.list(page),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<ApiPaginated<LedgerEntryDto>>>(`/wallet/transactions?page=${page}&limit=${limit}`);
            const paginated = res.data.data;
            return {
                ...paginated,
                items: paginated.items.map(mapLedgerToTransaction),
            };
        },
        // Keep previous data while fetching new pages so the UI doesn't flash empty
        placeholderData: (previousData) => previousData,
        enabled: typeof window !== "undefined" && !!localStorage.getItem("nepay-auth"),
    });
}

import { useInfiniteQuery } from "@tanstack/react-query";

export function useInfiniteTransactions(limit: number = 20) {
    return useInfiniteQuery<ApiPaginated<BaseTransaction>>({
        queryKey: ["transactions", "infinite"],
        initialPageParam: 1,
        queryFn: async ({ pageParam = 1 }) => {
            const res = await apiClient.get<ApiResponse<ApiPaginated<LedgerEntryDto>>>(`/wallet/transactions?page=${pageParam}&limit=${limit}`);
            const paginated = res.data.data;
            return {
                ...paginated,
                items: paginated.items.map(mapLedgerToTransaction),
            };
        },
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage.page < lastPage.pages) {
                return lastPage.page + 1;
            }
            return undefined;
        },
        enabled: typeof window !== "undefined" && !!localStorage.getItem("nepay-auth"),
    });
}
