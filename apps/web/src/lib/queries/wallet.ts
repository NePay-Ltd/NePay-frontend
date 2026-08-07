/**
 * TanStack Query hooks for the Wallet section.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    mockGetAssets,
    mockGetWalletStats,
    mockGetVirtualAccount,
    mockCreateVirtualAccount,
    type Asset,
    type WalletStats,
    type VirtualAccount,
} from "@/lib/mock-wallet";

export const walletKeys = {
    all: ["wallet"] as const,
    assets: () => [...walletKeys.all, "assets"] as const,
    stats: () => [...walletKeys.all, "stats"] as const,
    virtualAccount: () => [...walletKeys.all, "virtual-account"] as const,
};

export function useWalletAssets() {
    return useQuery<Asset[]>({
        queryKey: walletKeys.assets(),
        queryFn: mockGetAssets,
        staleTime: 60_000,
    });
}

export function useWalletStats() {
    return useQuery<WalletStats>({
        queryKey: walletKeys.stats(),
        queryFn: mockGetWalletStats,
        staleTime: 60_000,
    });
}

export function useVirtualAccount() {
    return useQuery<VirtualAccount | null>({
        queryKey: walletKeys.virtualAccount(),
        queryFn: mockGetVirtualAccount,
        staleTime: Infinity, // Once fetched, doesn't really change unless invalidated
    });
}

export function useCreateVirtualAccount() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: mockCreateVirtualAccount,
        onSuccess: (data) => {
            queryClient.setQueryData(walletKeys.virtualAccount(), data);
        },
    });
}
