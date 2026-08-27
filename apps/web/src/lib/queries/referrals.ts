/** TanStack Query hooks for the live customer referral summary. */

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/lib/types/api";

export interface ReferralSummary {
    referralCode: string;
    totalReferred: number;
    verifiedCount: number;
}

export const referralKeys = {
    all: ["referrals"] as const,
    me: () => [...referralKeys.all, "me"] as const,
};

export function useReferralSummary() {
    return useQuery<ReferralSummary>({
        queryKey: referralKeys.me(),
        queryFn: async () => {
            const response = await apiClient.get<ApiResponse<ReferralSummary>>("/referrals/me");
            return response.data.data;
        },
    });
}
