/**
 * TanStack Query hooks for the Withdraw section.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    mockGetBankList,
    mockGetSavedBankAccounts,
    mockResolveBankAccount,
    mockSaveBankAccount,
    mockInitiateWithdrawal,
    mockGetWithdrawalStatus,
    type Bank,
    type SavedBankAccount,
    type WithdrawalRequest,
    type WithdrawalResponse,
} from "@/lib/mock-withdraw";

export const withdrawKeys = {
    all: ["withdraw"] as const,
    bankList: () => [...withdrawKeys.all, "bankList"] as const,
    savedAccounts: () => [...withdrawKeys.all, "savedAccounts"] as const,
    status: (id: string) => [...withdrawKeys.all, "status", id] as const,
};

export function useBankList() {
    return useQuery<Bank[]>({
        queryKey: withdrawKeys.bankList(),
        queryFn: mockGetBankList,
        staleTime: Infinity, // Bank lists rarely change
    });
}

export function useSavedBankAccounts() {
    return useQuery<SavedBankAccount[]>({
        queryKey: withdrawKeys.savedAccounts(),
        queryFn: mockGetSavedBankAccounts,
    });
}

export function useResolveBankAccount() {
    return useMutation<{ accountName: string }, Error, { accountNumber: string; bankCode: string }>({
        mutationFn: ({ accountNumber, bankCode }) => mockResolveBankAccount(accountNumber, bankCode),
    });
}

export function useSaveBankAccount() {
    const queryClient = useQueryClient();
    return useMutation<SavedBankAccount, Error, { accountNumber: string; bankCode: string; accountName: string }>({
        mutationFn: ({ accountNumber, bankCode, accountName }) => mockSaveBankAccount(accountNumber, bankCode, accountName),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: withdrawKeys.savedAccounts() });
        },
    });
}

export function useInitiateWithdrawal() {
    return useMutation<{ id: string }, Error, WithdrawalRequest>({
        mutationFn: mockInitiateWithdrawal,
    });
}

export function useWithdrawalStatus(withdrawalId: string | null) {
    return useQuery<WithdrawalResponse>({
        queryKey: withdrawKeys.status(withdrawalId!),
        queryFn: () => mockGetWithdrawalStatus(withdrawalId!),
        enabled: !!withdrawalId,
        // Stop polling when the transaction is in a terminal state
        refetchInterval: (query) => {
            if (query.state.data?.status === "success" || query.state.data?.status === "failed") {
                return false;
            }
            return 2000;
        },
    });
}
