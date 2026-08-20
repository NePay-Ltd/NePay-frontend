/**
 * TanStack Query hooks for the KYC section.
 *
 * BVN/NIN verification is a two-step, synchronous OTP flow: submitting the
 * number (verify-bvn / verify-nin) makes Safe Haven send a one-time code to
 * the phone on file, and confirming it (verify-bvn/confirm / verify-nin/confirm)
 * decides the verification immediately — no polling.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export function useConfirmBvn() {
    const queryClient = useQueryClient();
    return useMutation<KycRecordDto, unknown, { otp: string }>({
        mutationFn: async ({ otp }) => {
            const res = await apiClient.post<ApiResponse<KycRecordDto>>("/kyc/verify-bvn/confirm", { otp });
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: kycKeys.status() });
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

export function useConfirmNin() {
    const queryClient = useQueryClient();
    return useMutation<KycRecordDto, unknown, { otp: string }>({
        mutationFn: async ({ otp }) => {
            const res = await apiClient.post<ApiResponse<KycRecordDto>>("/kyc/verify-nin/confirm", { otp });
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: kycKeys.status() });
        },
    });
}
