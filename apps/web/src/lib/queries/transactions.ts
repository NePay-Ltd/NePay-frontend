/**
 * TanStack Query hooks for Transactions.
 */

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { LedgerEntryDto, ApiPaginated, ApiResponse } from "@/lib/types/api";
import { BaseTransaction } from "@/components/shared/transaction-row";
import { TxCategory } from "@/components/shared/tx-icon";

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
        case "GIFT_CARD_SALE": category = "gift-card"; break;
        case "FLIGHT_BOOKING": category = "flight"; break;
        case "ADMIN_ADJUSTMENT": category = "admin"; break;
        case "CASHBACK": category = "cashback"; break;
        case "REFERRAL_REWARD": category = "cashback"; break;
    }

    return {
        id: entry.id,
        label: entry.description || entry.type.replace(/_/g, " "),
        meta: entry.type.replace(/_/g, " "),
        amount: entry.direction === "DEBIT" ? -parseFloat(entry.amount) : parseFloat(entry.amount),
        category,
        status: "success",
        date: entry.createdAt,
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
            return mapLedgerToTransaction(res.data.data);
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
