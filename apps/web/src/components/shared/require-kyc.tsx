"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { IconLock as Lock } from "@/components/icons";;

import { useAuth } from "@/lib/auth-context";
import { EmptyState } from "@/components/shared/empty-state";
import { Spinner } from "@/components/shared/spinner";

export interface RequireKycProps {
    /**
     * Content to show when the account is BVN-verified. There is no tier
     * ladder anymore — a single kycVerified boolean (an APPROVED BVN check)
     * is the only gate the backend has since the tier-collapse rework.
     */
    children: React.ReactNode;
    /** Optional custom heading for the gate UI. */
    gateHeading?: string;
    /** Optional custom description for the gate UI. */
    gateDescription?: string;
}

/**
 * KYC gate wrapper.
 *
 * Renders `children` only when the authenticated user's KYC verification
 * (`User.kycVerified`) is true. Otherwise renders a locked EmptyState with a
 * "Complete verification" CTA linking to /kyc.
 *
 * Usage:
 * ```tsx
 * <RequireKyc>
 *   <CryptoOffRampPage />
 * </RequireKyc>
 * ```
 */
export function RequireKyc({
    children,
    gateHeading,
    gateDescription,
}: RequireKycProps) {
    const { kycVerified, isLoading } = useAuth();
    const router = useRouter();

    if (isLoading) {
        return (
            <div className="flex min-h-[320px] items-center justify-center">
                <Spinner label="Loading…" />
            </div>
        );
    }

    if (kycVerified) {
        return <>{children}</>;
    }

    return (
        <EmptyState
            icon={Lock}
            heading={gateHeading ?? "Verification required"}
            description={
                gateDescription ??
                "You need to verify your BVN to access this feature. It takes less than 2 minutes."
            }
            action={{
                label: "Complete verification",
                onClick: () => router.push("/kyc"),
            }}
        />
    );
}
