"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { RegisterStepThree } from "@/components/auth/RegisterStepThree";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import type { ApiResponse, AuthTokensDto } from "@/lib/types/api";

export default function VerifyEmailPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { finalizeLogin } = useAuth();
    const email = searchParams.get("email");
    
    // The temp tokens stored from the login attempt
    const [tempTokens, setTempTokens] = React.useState<AuthTokensDto | null>(null);

    React.useEffect(() => {
        if (!email) {
            router.replace("/login");
            return;
        }

        const storedTokensStr = sessionStorage.getItem("pending_verification_tokens");
        if (storedTokensStr) {
            setTempTokens(JSON.parse(storedTokensStr));
        } else {
            router.replace("/login");
        }
    }, [email, router]);

    const handleVerifySuccess = () => {
        sessionStorage.removeItem("pending_verification_tokens");
        if (tempTokens) {
            finalizeLogin(tempTokens);
        } else {
            router.replace("/login");
        }
    };

    if (!email || !tempTokens) {
        return null;
    }

    return (
        <div className="space-y-8">
            <div className="space-y-1.5">
                <h1 className="text-3xl font-bold tracking-tight text-ink">
                    Verify your email
                </h1>
                <p className="text-sm text-body">
                    You need to verify your email address to continue.
                </p>
            </div>

            <RegisterStepThree 
                email={email} 
                isSubmitting={false} 
                onVerifySuccess={handleVerifySuccess} 
            />
        </div>
    );
}
