/**
 * TanStack Query hooks for Services (Airtime, Data, Bills).
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import {
    mockGetSavedBillers,
    mockGetDataPlans,
    mockVerifyMeter,
    mockVerifySmartcard,
    mockPayAirtime,
    mockPayData,
    mockPayElectricity,
    mockPayCableTv,
    mockGetServiceTransactionStatus,
    type SavedBiller,
    type DataPlan,
    type ServiceTransactionResponse,
} from "@/lib/mock-services";

export const servicesKeys = {
    all: ["services"] as const,
    savedBillers: () => [...servicesKeys.all, "savedBillers"] as const,
    dataPlans: (network: string) => [...servicesKeys.all, "dataPlans", network] as const,
    status: (id: string) => [...servicesKeys.all, "status", id] as const,
};

export function useSavedBillers() {
    return useQuery<SavedBiller[]>({
        queryKey: servicesKeys.savedBillers(),
        queryFn: mockGetSavedBillers,
    });
}

export function useDataPlans(network: string) {
    return useQuery<DataPlan[]>({
        queryKey: servicesKeys.dataPlans(network),
        queryFn: () => mockGetDataPlans(network),
        enabled: !!network,
    });
}

export function useVerifyMeter() {
    return useMutation<{ customerName: string; address: string }, Error, { provider: string; meterNumber: string }>({
        mutationFn: ({ provider, meterNumber }) => mockVerifyMeter(provider, meterNumber),
    });
}

export function useVerifySmartcard() {
    return useMutation<{ customerName: string; package: string }, Error, { provider: string; smartcardNumber: string }>({
        mutationFn: ({ provider, smartcardNumber }) => mockVerifySmartcard(provider, smartcardNumber),
    });
}

export function usePayAirtime() {
    return useMutation<{ id: string }, Error, { phone: string; amountNgn: number; network: string }>({
        mutationFn: mockPayAirtime,
    });
}

export function usePayData() {
    return useMutation<{ id: string }, Error, { phone: string; planId: string; network: string; amountNgn: number }>({
        mutationFn: mockPayData,
    });
}

export function usePayElectricity() {
    return useMutation<{ id: string }, Error, { meterNumber: string; provider: string; amountNgn: number }>({
        mutationFn: mockPayElectricity,
    });
}

export function usePayCableTv() {
    return useMutation<{ id: string }, Error, { smartcardNumber: string; provider: string; amountNgn: number }>({
        mutationFn: mockPayCableTv,
    });
}

export function useServiceTransactionStatus(transactionId: string | null) {
    return useQuery<ServiceTransactionResponse>({
        queryKey: servicesKeys.status(transactionId!),
        queryFn: () => mockGetServiceTransactionStatus(transactionId!),
        enabled: !!transactionId,
        refetchInterval: (query) => {
            if (query.state.data?.status === "success" || query.state.data?.status === "failed") {
                return false;
            }
            return 2000;
        },
    });
}
