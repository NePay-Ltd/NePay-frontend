import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/lib/types/api";

export type NoticeSeverity = "info" | "warning" | "critical";
export type NoticeSurface = "ticker" | "modal" | "both";

export interface NoticeDto {
    id: string;
    title: string;
    body: string;
    severity: NoticeSeverity;
    surface: NoticeSurface;
    priority: number;
    requiresAcknowledgement: boolean;
    ctaLabel: string | null;
    ctaUrl: string | null;
    startAt: string | null;
    endAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ActiveNoticesResponse {
    ticker: NoticeDto[];
    modal: NoticeDto[];
}

export const noticeKeys = {
    all: ["notices"] as const,
    active: () => [...noticeKeys.all, "active"] as const,
};

export function useActiveNotices() {
    return useQuery<ActiveNoticesResponse>({
        queryKey: noticeKeys.active(),
        queryFn: async () => {
            const response = await apiClient.get<ApiResponse<ActiveNoticesResponse>>("/notices/active");
            return response.data.data;
        },
    });
}

export function useDismissNotice() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => apiClient.post(`/notices/${id}/dismiss`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: noticeKeys.active() }),
    });
}

export function useAcknowledgeNotice() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => apiClient.post(`/notices/${id}/acknowledge`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: noticeKeys.active() }),
    });
}
