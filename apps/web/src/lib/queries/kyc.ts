/**
 * TanStack Query hooks for the KYC section.
 *
 * Korapay BVN/NIN verification is synchronous: submitting the identity number
 * returns the terminal APPROVED or REJECTED result immediately. There is no
 * OTP confirmation request in the active provider flow.
 */

import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { ApiResponse, KycRecordDto, KycStatusDto } from "@/lib/types/api";

export const kycKeys = {
    all: ["kyc"] as const,
    status: () => [...kycKeys.all, "status"] as const,
};

export function useKycStatus() {
    return useQuery<KycStatusDto>({
        queryKey: kycKeys.status(),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<KycStatusDto>>("/kyc/status");
            return res.data.data;
        },
    });
}

export function useSubmitBvn() {
    return useMutation<KycRecordDto, unknown, { bvn: string }>({
        mutationFn: async ({ bvn }) => {
            const res = await apiClient.post<ApiResponse<KycRecordDto>>("/kyc/verify-bvn", { bvn });
            return res.data.data;
        },
    });
}

export function useSubmitNin() {
    return useMutation<KycRecordDto, unknown, { nin: string }>({
        mutationFn: async ({ nin }) => {
            const res = await apiClient.post<ApiResponse<KycRecordDto>>("/kyc/verify-nin", { nin });
            return res.data.data;
        },
    });
}

