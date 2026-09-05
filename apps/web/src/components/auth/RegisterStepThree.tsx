"use client";

import * as React from "react";
import { toast } from "sonner";
import { Mail, ArrowRight } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/shared/button";
import { Input } from "@/components/ui/input";

interface RegisterStepThreeProps {
    email: string;
    isSubmitting: boolean;
    onVerifySuccess: () => void;
}

export function RegisterStepThree({ email, isSubmitting, onVerifySuccess }: RegisterStepThreeProps) {
    const [otpCode, setOtpCode] = React.useState("");
    const [countdown, setCountdown] = React.useState(60);
    const [isResending, setIsResending] = React.useState(false);
    const [isVerifying, setIsVerifying] = React.useState(false);

    React.useEffect(() => {
        let timer: NodeJS.Timeout;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const handleResend = async () => {
        setIsResending(true);
        try {
            await apiClient.post("/auth/resend-verification-email", { email });
            setCountdown(60);
            toast.success("A new verification code has been sent!");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to resend code.");
        } finally {
            setIsResending(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otpCode.length !== 6) return;

        setIsVerifying(true);
        try {
            await apiClient.post("/auth/verify-email", { email, code: otpCode });
            toast.success("Email successfully verified!");
            onVerifySuccess();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Invalid or expired code.");
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <form onSubmit={handleVerify} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex flex-col items-center text-center space-y-4 mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-100/50">
                    <Mail className="h-8 w-8 text-violet-600" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-ink">Check your email</h3>
                    <p className="mt-2 text-sm text-body">
                        We sent a 6-digit verification code to <span className="font-semibold text-ink">{email}</span>.
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-center">
                    <Input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="000000"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                        disabled={isSubmitting || isVerifying}
                        className="w-full max-w-[200px] text-center text-2xl tracking-[0.5em] h-16 font-mono"
                        autoComplete="one-time-code"
                        autoFocus
                    />
                </div>

                <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    size="lg"
                    disabled={otpCode.length !== 6 || isSubmitting || isVerifying}
                    loading={isSubmitting || isVerifying}
                >
                    Verify Email <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <div className="flex justify-center mt-4">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleResend}
                        disabled={countdown > 0 || isResending}
                        loading={isResending}
                        className="text-sm font-medium"
                    >
                        {countdown > 0 ? `Resend code in ${countdown}s` : "Didn't receive the code? Resend"}
                    </Button>
                </div>
            </div>
        </form>
    );
}
