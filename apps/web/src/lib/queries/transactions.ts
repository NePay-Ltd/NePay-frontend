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
        case "UTILITY_PURCHASE": category = "payment"; break;
        case "GIFT_CARD_SALE": category = "gift-card"; break;
        case "FLIGHT_BOOKING": category = "flight"; break;
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
};

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
