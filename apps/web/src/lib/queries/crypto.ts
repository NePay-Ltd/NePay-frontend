/**
 * TanStack Query hooks for the Crypto section.
 */

import { useMutation } from "@tanstack/react-query";
import {
    mockGenerateDepositAddress,
    type DepositAddressPayload,
    type DepositAddressResponse,
} from "@/lib/mock-crypto";

export const cryptoKeys = {
    all: ["crypto"] as const,
};

export function useGenerateDepositAddress() {
    return useMutation<DepositAddressResponse, Error, DepositAddressPayload>({
        mutationFn: mockGenerateDepositAddress,
    });
}
