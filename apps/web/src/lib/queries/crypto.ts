/**
 * TanStack Query hooks for the Crypto section.
 */

import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { ApiResponse } from "@/lib/types/api";
export interface DepositAddressPayload {
    asset: string;
}

export interface DepositAddressResponse {
    address: string;
}

export const cryptoKeys = {
    all: ["crypto"] as const,
};

export function useGenerateDepositAddress() {
    return useMutation<DepositAddressResponse, Error, DepositAddressPayload>({
        mutationFn: async ({ asset }) => {
            const res = await apiClient.get<ApiResponse<DepositAddressResponse>>(`/deposits/address?asset=${asset}`);
            return res.data.data;
        },
    });
}
