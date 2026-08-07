/**
 * TanStack Query hooks for the overview page.
 *
 * Each hook wraps a mock fetch function. To integrate with the real backend,
 * replace the queryFn body with `api.get<T>(path)` — no component changes needed.
 */

import { useQuery } from "@tanstack/react-query";
import {
    fetchOverviewSummary,
    fetchRateQuote,
    type OverviewSummary,
    type RateQuote,
} from "@/lib/mock-overview";

export const overviewKeys = {
    all: ["overview"] as const,
    summary: () => [...overviewKeys.all, "summary"] as const,
    rate: () => [...overviewKeys.all, "rate"] as const,
};

export function useOverviewSummary() {
    return useQuery<OverviewSummary>({
        queryKey: overviewKeys.summary(),
        queryFn: fetchOverviewSummary,
        staleTime: 60_000,
    });
}

export function useRateQuote() {
    return useQuery<RateQuote>({
        queryKey: overviewKeys.rate(),
        queryFn: fetchRateQuote,
        staleTime: 30_000,
        refetchInterval: 60_000, // live rate refresh every 60s
    });
}
