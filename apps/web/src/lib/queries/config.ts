/**
 * TanStack Query hooks for client-facing runtime config.
 */

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { ApiResponse, TestModeDto } from "@/lib/types/api";

export const configKeys = {
    all: ["config"] as const,
    testMode: () => [...configKeys.all, "test-mode"] as const,
};

/**
 * Whether the backend is running with Korapay test-mode credentials right
 * now — the source of truth for gating test-only UI (the "Simulate
 * Deposit" button on the add-money screen). Never inferred from a frontend
 * build flag, since that can drift from what the backend is actually
 * running against.
 */
export function useTestMode() {
    return useQuery<boolean>({
        queryKey: configKeys.testMode(),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<TestModeDto>>("/config/test-mode");
            return res.data.data.testMode;
        },
        // The button's absence in production IS the safety property this
        // gates — never serve a stale "true" past a redeploy into live mode.
        staleTime: 0,
    });
}
