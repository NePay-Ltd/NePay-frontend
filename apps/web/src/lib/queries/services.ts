/**
 * TanStack Query hooks for Services (Airtime, Data, Bills).
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { UtilityPurchaseResponseDto, ApiResponse } from "@/lib/types/api";
import {
    mockGetSavedBillers,
    mockGetDataPlans,
    mockVerifyMeter,
    mockVerifySmartcard,
    type SavedBiller,
    type DataPlan,
} from "@/lib/mock-services";

export const servicesKeys = {
    all: ["services"] as const,
    savedBillers: () => [...servicesKeys.all, "savedBillers"] as const,
    dataPlans: (network: string) => [...servicesKeys.all, "dataPlans", network] as const,
    status: (id: string) => [...servicesKeys.all, "status", id] as const,
};

// Catalogs and billers are kept mocked as they are not provided in the API docs yet.
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
    return useMutation<UtilityPurchaseResponseDto, Error, { phone: string; amountNgn: number; network: string; pin: string }>({
        mutationFn: async ({ phone, amountNgn, network, pin }) => {
            const res = await apiClient.post<ApiResponse<UtilityPurchaseResponseDto>>("/utilities/airtime", {
                network: network.toUpperCase(),
                amount: amountNgn.toString(),
                phoneNumber: phone,
                pin,
            });
            return res.data.data;
        },
    });
}

export function usePayData() {
    return useMutation<UtilityPurchaseResponseDto, Error, { phone: string; planId: string; network: string; amountNgn: number; pin: string }>({
        mutationFn: async ({ phone, planId, network, amountNgn, pin }) => {
            const res = await apiClient.post<ApiResponse<UtilityPurchaseResponseDto>>("/utilities/data", {
                network: network.toUpperCase(),
                amount: amountNgn.toString(),
                phoneNumber: phone,
                planId,
                pin,
            });
            return res.data.data;
        },
    });
}

export function usePayElectricity() {
    return useMutation<UtilityPurchaseResponseDto, Error, { meterNumber: string; provider: string; amountNgn: number; pin: string }>({
        mutationFn: async ({ meterNumber, provider, amountNgn, pin }) => {
            const res = await apiClient.post<ApiResponse<UtilityPurchaseResponseDto>>("/utilities/electricity", {
                provider: provider.toUpperCase(),
                amount: amountNgn.toString(),
                meterNumber,
                pin,
            });
            return res.data.data;
        },
    });
}

export function usePayCableTv() {
    return useMutation<UtilityPurchaseResponseDto, Error, { smartcardNumber: string; provider: string; amountNgn: number; pin: string }>({
        mutationFn: async ({ smartcardNumber, provider, amountNgn, pin }) => {
            const res = await apiClient.post<ApiResponse<UtilityPurchaseResponseDto>>("/utilities/cable", {
                provider: provider.toUpperCase(),
                amount: amountNgn.toString(),
                smartcardNumber,
                pin,
            });
            return res.data.data;
        },
    });
}

export function useServiceTransactionStatus(transactionId: string | null) {
    return useQuery<UtilityPurchaseResponseDto>({
        queryKey: servicesKeys.status(transactionId!),
        queryFn: async () => {
            // Ideally GET /utilities/purchase/:id, simulating success since there is no polling endpoint defined
            return {
                id: transactionId!,
                category: "AIRTIME",
                provider: "MTN",
                identifier: "",
                variationCode: null,
                amount: "0",
                status: "COMPLETED",
                providerReference: null,
                failureReason: null,
                createdAt: new Date().toISOString(),
            };
        },
        enabled: !!transactionId,
        refetchInterval: false,
    });
}
