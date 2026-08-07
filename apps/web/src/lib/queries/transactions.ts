/**
 * TanStack Query hooks for Transactions.
 */

import { useQuery } from "@tanstack/react-query";
import { mockGetTransactions, type PaginatedTransactions } from "@/lib/mock-transactions";

export const transactionKeys = {
    all: ["transactions"] as const,
    list: (type: string | null, cursor: string | null) => [...transactionKeys.all, "list", type, cursor] as const,
};

export function useTransactions(type: string | null, cursor: string | null, limit: number = 20) {
    return useQuery<PaginatedTransactions>({
        queryKey: transactionKeys.list(type, cursor),
        queryFn: () => mockGetTransactions(type, cursor, limit),
        // Keep previous data while fetching new pages so the UI doesn't flash empty
        placeholderData: (previousData) => previousData,
    });
}
