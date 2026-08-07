"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import type { KycTier } from "@/lib/mock-api";
import { EmptyState } from "@/components/shared/empty-state";
import { Spinner } from "@/components/shared/spinner";

/** KYC tier hierarchy for comparison. */
const TIER_RANK: Record<KycTier, number> = {
    NONE: 0,
    PHONE_VERIFIED: 1,
    FULL_BVN_NIN: 2,
};

export interface RequireKycProps {
    /**
     * Minimum tier required to render `children`.
     * If the user's current tier is below this, they see the gate UI.
     */
    tier: KycTier;
    /** Content to show when the tier requirement is met. */
    children: React.ReactNode;
    /**
     * Optional custom heading for the gate UI.
     * Defaults to a sensible message based on the required tier.
     */
    gateHeading?: string;
    /** Optional custom description for the gate UI. */
    gateDescription?: string;
}

/**
 * KYC gate wrapper.
 *
 * Renders `children` only when the authenticated user's KYC tier meets or
 * exceeds the required `tier`. Otherwise renders a locked EmptyState with a
 * "Complete verification" CTA linking to /kyc.
 *
 * Usage:
 * ```tsx
 * <RequireKyc tier="FULL_BVN_NIN">
 *   <CryptoOffRampPage />
 * </RequireKyc>
 * ```
 */
export function RequireKyc({
    tier,
    children,
    gateHeading,
    gateDescription,
}: RequireKycProps) {
    const { kycTier, isLoading } = useAuth();
    const router = useRouter();

    if (isLoading) {
        return (
            <div className="flex min-h-[320px] items-center justify-center">
                <Spinner label="Loading…" />
            </div>
        );
    }

    const userRank = TIER_RANK[kycTier];
    const requiredRank = TIER_RANK[tier];

    if (userRank >= requiredRank) {
        return <>{children}</>;
    }

    // Derive sensible defaults
    const defaultHeading =
        tier === "FULL_BVN_NIN"
            ? "Verification required"
            : "Phone verification required";

    const defaultDescription =
        tier === "FULL_BVN_NIN"
            ? "You need to verify your BVN and NIN (Tier 2) to access this feature. It takes less than 2 minutes."
            : "You need to verify your phone number to access this feature.";

    return (
        <EmptyState
            icon={Lock}
            heading={gateHeading ?? defaultHeading}
            description={gateDescription ?? defaultDescription}
            action={{
                label: "Complete verification",
                onClick: () => router.push("/kyc"),
            }}
        />
    );
}
