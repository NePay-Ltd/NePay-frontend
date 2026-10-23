/**
 * TanStack Query hooks for the KYC section.
 *
 * NIN verification is synchronous: submitting the identity details returns
 * the terminal APPROVED or REJECTED result immediately. There is no OTP step.
 * Approval also auto-provisions the caller's virtual account server-side
 * (see the backend's NinVerifiedListener), so no separate account-creation
 * call is needed after useSubmitNin succeeds.
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
        refetchInterval: (query) => query.state.data?.retryBlockedByReview ? 5000 : false,
    });
}

export function useSubmitNin() {
    return useMutation<KycRecordDto, unknown, { nin: string; dateOfBirth: string }>({
        mutationFn: async ({ nin, dateOfBirth }) => {
            const res = await apiClient.post<ApiResponse<KycRecordDto>>("/kyc/verify-nin", { nin, dateOfBirth });
            return res.data.data;
        },
    });
}
