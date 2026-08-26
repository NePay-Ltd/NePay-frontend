/**
 * TanStack Query hooks for the KYC section.
 *
 * Korapay BVN verification is synchronous: submitting the identity number
 * returns the terminal APPROVED or REJECTED result immediately. There is no
 * OTP confirmation step and no NIN flow — BVN alone is sufficient KYC.
 * Approval also auto-provisions the caller's virtual account server-side
 * (see the backend's BvnVerifiedListener), so nothing else needs to be
 * called after useSubmitBvn succeeds.
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


