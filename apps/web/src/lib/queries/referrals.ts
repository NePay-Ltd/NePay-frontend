/**
 * TanStack Query hooks for the Referrals module.
 */

import { useQuery } from "@tanstack/react-query";
import {
    mockGetReferralLink,
    mockGetReferralStats,
    mockGetReferralList,
    type ReferralStats,
    type Referral,
} from "@/lib/mock-referrals";

export const referralKeys = {
    all: ["referrals"] as const,
    link: () => [...referralKeys.all, "link"] as const,
    stats: () => [...referralKeys.all, "stats"] as const,
    list: () => [...referralKeys.all, "list"] as const,
};

export function useReferralLink() {
    return useQuery<string>({
        queryKey: referralKeys.link(),
        queryFn: mockGetReferralLink,
        staleTime: Infinity,
    });
}

export function useReferralStats() {
    return useQuery<ReferralStats>({
        queryKey: referralKeys.stats(),
        queryFn: mockGetReferralStats,
    });
}

export function useReferralList() {
    return useQuery<Referral[]>({
        queryKey: referralKeys.list(),
        queryFn: mockGetReferralList,
    });
}
