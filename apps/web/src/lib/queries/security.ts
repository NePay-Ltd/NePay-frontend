/**
 * TanStack Query hooks for the Security module.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { ApiResponse } from "@/lib/types/api";
export interface SecuritySettings {
    twoFactorEnabled: boolean;
    biometricsEnabled: boolean;
    pinSet: boolean;
}

export interface LoginActivity {
    id: string;
    device: string;
    location: string;
    ipAddress: string;
    timestamp: string;
    isCurrentSession: boolean;
}

export const securityKeys = {
    all: ["security"] as const,
    settings: () => [...securityKeys.all, "settings"] as const,
    loginActivity: () => [...securityKeys.all, "loginActivity"] as const,
};

export function useSecuritySettings() {
    return useQuery<SecuritySettings>({
        queryKey: securityKeys.settings(),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<SecuritySettings>>("/security/settings");
            return res.data.data;
        },
    });
}

export function useToggleBiometrics() {
    const queryClient = useQueryClient();

    return useMutation<SecuritySettings, Error, boolean, { previousSettings: SecuritySettings | undefined }>({
        mutationFn: async (enabled) => {
            const res = await apiClient.patch<ApiResponse<{ biometricsEnabled: boolean }>>("/security/biometrics", { enabled });
            return { biometricsEnabled: res.data.data.biometricsEnabled } as SecuritySettings;
        },
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
    return useMutation<{ qrCodeUri: string; secret: string }, Error, void>({
        mutationFn: async () => {
            const res = await apiClient.post<ApiResponse<{ otpauth_url: string; qrData: string; temporarySecret: string }>>("/security/2fa/enable");
            return {
                qrCodeUri: res.data.data.qrData,
                secret: res.data.data.temporarySecret,
            };
        },
    });
}

export function useVerify2FA() {
    const queryClient = useQueryClient();
    return useMutation<void, Error, string>({
        mutationFn: async (token) => {
            await apiClient.post("/security/2fa/verify", { code: token });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: securityKeys.settings() });
        },
    });
}

export function useDisable2FA() {
    const queryClient = useQueryClient();
    return useMutation<void, Error, string>({
        mutationFn: async (token) => {
            await apiClient.post("/security/2fa/disable", { code: token });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: securityKeys.settings() });
        },
    });
}

export function useChangePin() {
    const queryClient = useQueryClient();

    return useMutation<void, Error, { currentPin?: string; newPin: string }>({
        mutationFn: async (payload) => {
            const requestBody = payload.currentPin ? payload : { newPin: payload.newPin };
            await apiClient.post("/security/change-pin", requestBody);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: securityKeys.settings() });
        },
    });
}

export function useChangePassword() {
    return useMutation<void, Error, { currentPass: string; newPass: string }>({
        mutationFn: async ({ currentPass, newPass }) => {
            await apiClient.post("/auth/change-password", {
                currentPassword: currentPass,
                newPassword: newPass,
            });
        },
    });
}

/**
 * Polls so a login from another device shows up without a manual refresh —
 * the closest thing to "live" this read-only history can offer, since the
 * backend writes each row at login time rather than pushing updates.
 */
export function useLoginActivity() {
    return useQuery<LoginActivity[]>({
        queryKey: securityKeys.loginActivity(),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<{ items: LoginActivity[] }>>("/security/login-activity");
            return res.data.data.items;
        },
        refetchInterval: 20_000,
        refetchOnWindowFocus: true,
    });
}

/**
 * Revokes one device session. The account only ever has one live session — a
 * later login always replaces the one before it — so this can only actually
 * end the entry flagged `isCurrentSession`; the backend reports
 * `revoked: false` for anything older without erroring, since that session
 * already ended on its own.
 */
export function useRevokeLoginActivity() {
    const queryClient = useQueryClient();

    return useMutation<{ revoked: boolean }, Error, string>({
        mutationFn: async (id) => {
            const res = await apiClient.delete<ApiResponse<{ revoked: boolean }>>(`/security/devices/${id}`);
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: securityKeys.loginActivity() });
        },
    });
}
