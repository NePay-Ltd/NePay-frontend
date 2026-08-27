import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/lib/types/api";

export interface LeaderboardEntry {
    rank: number;
    displayName: string;
    monthlyPoints: number;
    allTimePoints: number;
}

export interface LeaderboardSnapshot {
    periodKey: string;
    entries: LeaderboardEntry[];
    topTen: LeaderboardEntry[];
    currentUser: LeaderboardEntry | null;
}

export const leaderboardKeys = { current: ["leaderboard", "current"] as const };

export function useCurrentLeaderboard() {
    return useQuery<LeaderboardSnapshot>({
        queryKey: leaderboardKeys.current,
        queryFn: async () => {
            const response = await apiClient.get<ApiResponse<LeaderboardSnapshot>>("/leaderboard/current");
            return response.data.data;
        },
        refetchInterval: 3000,
        refetchOnWindowFocus: true,
    });
}
