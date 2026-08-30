/**
 * TanStack Query hooks for Services (Airtime, Data, Bills).
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
    UtilityPurchaseResponseDto,
    UtilityVerificationResponseDto,
    UtilityCategoryDto,
    UtilityServiceDto,
    UtilityVariationDto,
    ApiResponse,
} from "@/lib/types/api";
export interface SavedBiller {
    id: string;
    billerName: string;
    identifier: string;
    provider: string;
    category: string;
    label: string | null;
    lastPaidAmount: number;
    serviceType: "airtime" | "data" | "electricity" | "cable-tv" | "education";
    iconUrl?: string;
}

export const servicesKeys = {
    all: ["services"] as const,
    savedBillers: () => [...servicesKeys.all, "savedBillers"] as const,
    categories: () => [...servicesKeys.all, "categories"] as const,
    utilityServices: (category: string) => [...servicesKeys.all, "utilityServices", category] as const,
    variations: (serviceId: string) => [...servicesKeys.all, "variations", serviceId] as const,
    status: (id: string) => [...servicesKeys.all, "status", id] as const,
};

/** The backend's UtilityCategory enum values, mapped to this app's own display-only serviceType union. */
function categoryToServiceType(category: string | undefined): SavedBiller["serviceType"] {
    switch (category) {
        case "AIRTIME": return "airtime";
        case "DATA": return "data";
        case "ELECTRICITY": return "electricity";
        case "EDUCATION": return "education";
        case "CABLE":
        default:
            return "cable-tv";
    }
}

interface RawSavedBeneficiary {
    id: string;
    category: string;
    provider: string;
    identifier: string;
    label: string | null;
    amount: string | null;
    lastUsedAt: string | null;
    createdAt: string;
}

function toSavedBiller(raw: RawSavedBeneficiary): SavedBiller {
    return {
        id: raw.id,
        billerName: raw.label || raw.provider || raw.identifier,
        identifier: raw.identifier,
        provider: raw.provider,
        category: raw.category,
        label: raw.label,
        // The amount paid the most recent time this beneficiary was used —
        // real data off GET /utilities/beneficiaries, never a placeholder.
        lastPaidAmount: raw.amount ? parseFloat(raw.amount) : 0,
        serviceType: categoryToServiceType(raw.category),
        iconUrl: undefined,
    };
}

export function useSavedBillers() {
    return useQuery<SavedBiller[]>({
        queryKey: servicesKeys.savedBillers(),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<RawSavedBeneficiary[]>>("/utilities/beneficiaries");
            return res.data.data.map(toSavedBiller);
        },
    });
}

export function useSaveBeneficiary() {
    const queryClient = useQueryClient();

    return useMutation<SavedBiller, Error, { category: string; provider: string; identifier: string; label?: string | null; amount?: string }>({
        mutationFn: async ({ category, provider, identifier, label, amount }) => {
            const res = await apiClient.post<ApiResponse<RawSavedBeneficiary>>("/utilities/beneficiaries", {
                category,
                provider,
                identifier,
                label,
                amount,
            });
            return toSavedBiller(res.data.data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: servicesKeys.savedBillers() });
        },
    });
}

// ─── Dynamic Catalog ──────────────────────────────────────────────────────────
// Categories -> services (within a category) -> variations (plans/bouquets).
// Server caches these for an hour; no need to layer extra caching on top.

export function useUtilityCategories() {
    return useQuery<UtilityCategoryDto[]>({
        queryKey: servicesKeys.categories(),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<UtilityCategoryDto[]>>("/utilities/categories");
            return res.data.data;
        },
    });
}

export function useUtilityServices(category: string | undefined) {
    return useQuery<UtilityServiceDto[]>({
        queryKey: servicesKeys.utilityServices(category ?? ""),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<UtilityServiceDto[]>>("/utilities/services", {
                params: { category },
            });
            return res.data.data;
        },
        enabled: !!category,
    });
}

export function useUtilityVariations(serviceId: string | undefined) {
    return useQuery<UtilityVariationDto[]>({
        queryKey: servicesKeys.variations(serviceId ?? ""),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<UtilityVariationDto[]>>("/utilities/variations", {
                params: { serviceId },
            });
            return res.data.data;
        },
        enabled: !!serviceId,
    });
}

export function useVerifyMeter() {
    return useMutation<UtilityVerificationResponseDto, Error, { disco: string; meterNumber: string; meterType: "prepaid" | "postpaid" }>({
        mutationFn: async ({ disco, meterNumber, meterType }) => {
            const res = await apiClient.get<ApiResponse<UtilityVerificationResponseDto>>("/utilities/verify-meter", {
                params: { disco, meterNumber, meterType },
            });
            return res.data.data;
        },
    });
}

export function useVerifySmartcard() {
    return useMutation<{ customerName: string; package: string }, Error, { provider: string; smartcardNumber: string }>({
        mutationFn: async ({ provider, smartcardNumber }) => {
            const res = await apiClient.get<ApiResponse<{ customerName: string; package: string }>>("/utilities/verify-smartcard", {
                params: { provider, smartcardNumber },
            });
            return res.data.data;
        }
    });
}

export function usePayAirtime() {
    return useMutation<UtilityPurchaseResponseDto, Error, { phone: string; amountNgn: number; network: string; pin: string }>({
        mutationFn: async ({ phone, amountNgn, network, pin }) => {
            const res = await apiClient.post<ApiResponse<UtilityPurchaseResponseDto>>("/utilities/airtime", {
                network,
                amount: amountNgn.toString(),
                phoneNumber: phone,
                pin,
            });
            return res.data.data;
        },
    });
}

export function usePayData() {
    return useMutation<UtilityPurchaseResponseDto, Error, { phone: string; variationCode: string; network: string; amountNgn: number; pin: string }>({
        mutationFn: async ({ phone, variationCode, network, amountNgn, pin }) => {
            const res = await apiClient.post<ApiResponse<UtilityPurchaseResponseDto>>("/utilities/data", {
                network,
                amount: amountNgn.toString(),
                phoneNumber: phone,
                variationCode,
                pin,
            });
            return res.data.data;
        },
    });
}

export function usePayEducation() {
    return useMutation<UtilityPurchaseResponseDto, Error, { examBody: string; variationCode: string; phone: string; amountNgn: number; pin: string }>({
        mutationFn: async ({ examBody, variationCode, phone, amountNgn, pin }) => {
            const res = await apiClient.post<ApiResponse<UtilityPurchaseResponseDto>>("/utilities/education", {
                examBody,
                variationCode,
                phoneNumber: phone,
                amount: amountNgn.toString(),
                pin,
            });
            return res.data.data;
        },
    });
}

export function usePayElectricity() {
    return useMutation<UtilityPurchaseResponseDto, Error, { meterNumber: string; disco: string; meterType: "prepaid" | "postpaid"; verificationToken: string; amountNgn: number; pin: string }>({
        mutationFn: async ({ meterNumber, disco, meterType, verificationToken, amountNgn, pin }) => {
            const res = await apiClient.post<ApiResponse<UtilityPurchaseResponseDto>>("/utilities/electricity", {
                disco,
                meterNumber,
                meterType,
                verificationToken,
                amount: amountNgn.toString(),
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
            const res = await apiClient.get<ApiResponse<UtilityPurchaseResponseDto>>(`/utilities/purchase/${transactionId}`);
            return res.data.data;
        },
        enabled: !!transactionId,
        refetchInterval: 3000,
    });
}
