/**
 * TanStack Query hooks for the Security module.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    mockGetSecuritySettings,
    mockToggleBiometrics,
    mockEnable2FA,
    mockVerify2FA,
    mockDisable2FA,
    mockChangePin,
    mockChangePassword,
    mockGetLoginActivity,
    type SecuritySettings,
    type TwoFactorSecret,
    type LoginActivity,
} from "@/lib/mock-security";

export const securityKeys = {
    all: ["security"] as const,
    settings: () => [...securityKeys.all, "settings"] as const,
    loginActivity: () => [...securityKeys.all, "loginActivity"] as const,
};

export function useSecuritySettings() {
    return useQuery<SecuritySettings>({
        queryKey: securityKeys.settings(),
        queryFn: mockGetSecuritySettings,
    });
}

export function useToggleBiometrics() {
    const queryClient = useQueryClient();

    return useMutation<SecuritySettings, Error, boolean, { previousSettings: SecuritySettings | undefined }>({
        mutationFn: mockToggleBiometrics,
        onMutate: async (enabled) => {
            await queryClient.cancelQueries({ queryKey: securityKeys.settings() });
            const previousSettings = queryClient.getQueryData<SecuritySettings>(securityKeys.settings());

            if (previousSettings) {
                queryClient.setQueryData<SecuritySettings>(securityKeys.settings(), {
                    ...previousSettings,
                    biometricsEnabled: enabled,
                });
            }

            return { previousSettings };
        },
        onError: (err, enabled, context) => {
            if (context?.previousSettings) {
                queryClient.setQueryData(securityKeys.settings(), context.previousSettings);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: securityKeys.settings() });
        },
    });
}

export function useEnable2FA() {
    return useMutation<TwoFactorSecret, Error, void>({
        mutationFn: mockEnable2FA,
    });
}

export function useVerify2FA() {
    const queryClient = useQueryClient();
    return useMutation<void, Error, string>({
        mutationFn: mockVerify2FA,
        onSuccess: () => {
            // Re-fetch settings so 2FA shows as enabled
            queryClient.invalidateQueries({ queryKey: securityKeys.settings() });
        },
    });
}

export function useDisable2FA() {
    const queryClient = useQueryClient();
    return useMutation<void, Error, string>({
        mutationFn: mockDisable2FA,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: securityKeys.settings() });
        },
    });
}

export function useChangePin() {
    return useMutation<void, Error, { currentPin: string; newPin: string }>({
        mutationFn: ({ currentPin, newPin }) => mockChangePin(currentPin, newPin),
    });
}

export function useChangePassword() {
    return useMutation<void, Error, { currentPass: string; newPass: string }>({
        mutationFn: ({ currentPass, newPass }) => mockChangePassword(currentPass, newPass),
    });
}

export function useLoginActivity() {
    return useQuery<LoginActivity[]>({
        queryKey: securityKeys.loginActivity(),
        queryFn: mockGetLoginActivity,
    });
}
