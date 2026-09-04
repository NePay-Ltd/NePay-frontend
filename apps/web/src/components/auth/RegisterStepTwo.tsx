"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconEye as Eye, IconEyeOff as EyeOff } from "@/components/icons";
import { AtSign, UserPlus } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import { registerStepTwoSchema, type RegisterStepTwoValues } from "@/lib/schemas/auth";
import { Button } from "@/components/shared/button";
import { Field } from "@/components/shared/field";
import { Input } from "@/components/ui/input";

function calculateStrength(password: string): number {
    let strength = 0;
    if (password.length > 0) strength += 1;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
}

interface RegisterStepTwoProps {
    isSubmitting: boolean;
    onBack: () => void;
    onSubmitFinal: (data: RegisterStepTwoValues) => void;
}

export function RegisterStepTwo({ isSubmitting, onBack, onSubmitFinal }: RegisterStepTwoProps) {
    const [showPassword, setShowPassword] = React.useState(false);
    const [showConfirm, setShowConfirm] = React.useState(false);

    const [isSendingOtp, setIsSendingOtp] = React.useState(false);
    const [isVerifyingOtp, setIsVerifyingOtp] = React.useState(false);
    const [otpSent, setOtpSent] = React.useState(false);
    const [countdown, setCountdown] = React.useState(0);
    const [otpCode, setOtpCode] = React.useState("");

    const {
        register,
        handleSubmit,
        watch,
        setError,
        clearErrors,
        setValue,
        formState: { errors },
    } = useForm<RegisterStepTwoValues>({
        resolver: zodResolver(registerStepTwoSchema),
        defaultValues: {
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
            acceptTerms: true,
            otpVerified: false,
        },
    });

    const passwordValue = watch("password") || "";
    const usernameValue = watch("username") || "";
    const strength = calculateStrength(passwordValue);

    React.useEffect(() => {
        const username = usernameValue.trim();
        if (!username || username.length < 3 || username.length > 20 || !/^[a-zA-Z0-9_]+$/.test(username)) {
            clearErrors("username");
            return;
        }

        let cancelled = false;
        const timeout = setTimeout(async () => {
            try {
                const res = await apiClient.post<{ success: boolean; data: { username: string; available: boolean } }>(
                    "/auth/check-username",
                    { username },
                );

                if (!cancelled && !res.data.data.available) {
                    setError("username", {
                        type: "manual",
                        message: "This username is already taken",
                    });
                } else if (!cancelled) {
                    clearErrors("username");
                }
            } catch {
                if (!cancelled) {
                    clearErrors("username");
                }
            }
        }, 500);

        return () => {
            cancelled = true;
            clearTimeout(timeout);
        };
    }, [usernameValue, clearErrors, setError]);

    const email = watch("email");
    const otpVerified = watch("otpVerified");

    React.useEffect(() => {
        let timer: NodeJS.Timeout;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const handleSendOtp = async () => {
        if (!email || errors.email) {
            toast.error("Please enter a valid email address first.");
            return;
        }

        setIsSendingOtp(true);
        try {
            await apiClient.post("/auth/resend-verification-email", { email });
            setOtpSent(true);
            setCountdown(60);
            toast.success("Verification code sent!");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to send code.");
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (otpCode.length !== 6) return;

        setIsVerifyingOtp(true);
        try {
            await apiClient.post("/auth/verify-email", { email, code: otpCode });
            setValue("otpVerified", true, { shouldValidate: true });
            toast.success("Email verified!");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Invalid or expired code.");
        } finally {
            setIsVerifyingOtp(false);
        }
    };

    return (
        <form id="step-two-form" onSubmit={handleSubmit(onSubmitFinal)} className="space-y-6">
            <div>
                <Field label="Username" htmlFor="reg-username" error={errors.username?.message} trailing={<UserPlus className="h-4 w-4" aria-hidden />}>
                    <Input
                        id="reg-username"
                        placeholder="e.g. okafor99"
                        autoComplete="username"
                        {...register("username")}
                        aria-invalid={!!errors.username}
                        className="pr-10"
                    />
                </Field>
                <p className="mt-2 text-xs text-muted">
                    Must be 3–20 letters, numbers, or underscores. It is set once at signup and cannot be changed later.
                </p>
                {usernameValue.trim().length >= 3 && !errors.username && (
                    <p className="mt-1 text-xs text-emerald-600">Availability is checked live before submit.</p>
                )}
            </div>

            <Field label="Email Address" htmlFor="reg-email" error={errors.email?.message} trailing={<AtSign className="h-4 w-4" aria-hidden />}>
                <Input
                    id="reg-email"
                    type="email"
                    placeholder="you@example.com"
                    inputMode="email"
                    autoComplete="email"
                    {...register("email")}
                    disabled={otpVerified || isSendingOtp}
                    aria-invalid={!!errors.email}
                    className="pr-10"
                />
            </Field>

            {!otpVerified && (
                <div className="flex items-center gap-3 -mt-2">
                    <Button
                        type="button"
                        variant="quiet"
                        size="sm"
                        onClick={handleSendOtp}
                        disabled={!email || !!errors.email || countdown > 0 || isSendingOtp}
                        loading={isSendingOtp}
                    >
                        {countdown > 0 ? `Resend code in ${countdown}s` : "Send Code"}
                    </Button>
                </div>
            )}

            {otpSent && !otpVerified && (
                <div className="rounded-lg border border-border p-4 bg-gray-50 -mt-2 space-y-3 animate-in fade-in slide-in-from-top-2">
                    <label htmlFor="reg-otp" className="block text-sm font-medium text-ink">
                        Enter the 6-digit code sent to your email
                    </label>
                    <div className="flex gap-2 items-center">
                        <Input
                            id="reg-otp"
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="123456"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                            className="w-32 tracking-widest text-center bg-white"
                        />
                        <Button
                            type="button"
                            variant="primary"
                            onClick={handleVerifyOtp}
                            disabled={otpCode.length !== 6 || isVerifyingOtp}
                            loading={isVerifyingOtp}
                        >
                            Verify
                        </Button>
                    </div>
                </div>
            )}

            {otpVerified && (
                <div className="rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2 -mt-2 text-green-700 text-sm font-medium flex items-center gap-2 animate-in fade-in">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white text-xs">✓</span>
                    Email verified
                </div>
            )}
            
            <input type="hidden" {...register("otpVerified")} />
            {errors.otpVerified && (
                <p className="text-red-500 text-sm font-medium -mt-2">{errors.otpVerified.message}</p>
            )}

            <Field
                label="Password"
                htmlFor="reg-password"
                error={errors.password?.message}
                trailing={
                    <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="text-muted hover:text-ink"
                    >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                }
            >
                <Input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimum 8 characters"
                    autoComplete="new-password"
                    {...register("password")}
                    aria-invalid={!!errors.password}
                    className="pr-10"
                />
                
                {/* Strength Indicator */}
                <div className="mt-2 flex h-1 w-full gap-1">
                    <div className={cn("h-full flex-1 rounded-full transition-colors", strength >= 1 ? "bg-red-500" : "bg-gray-200")} />
                    <div className={cn("h-full flex-1 rounded-full transition-colors", strength >= 2 ? "bg-amber-500" : "bg-gray-200")} />
                    <div className={cn("h-full flex-1 rounded-full transition-colors", strength >= 3 ? "bg-green-500" : "bg-gray-200")} />
                    <div className={cn("h-full flex-1 rounded-full transition-colors", strength >= 4 ? "bg-green-600" : "bg-gray-200")} />
                </div>
            </Field>

            <Field
                label="Confirm Password"
                htmlFor="reg-confirm"
                error={errors.confirmPassword?.message}
                trailing={
                    <button
                        type="button"
                        onClick={() => setShowConfirm((p) => !p)}
                        aria-label={showConfirm ? "Hide password" : "Show password"}
                        className="text-muted hover:text-ink"
                    >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                }
            >
                <Input
                    id="reg-confirm"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    {...register("confirmPassword")}
                    aria-invalid={!!errors.confirmPassword}
                    className="pr-10"
                />
            </Field>

            {/* Terms */}
            <div className="space-y-1">
                <label className="flex cursor-pointer items-start gap-3">
                    <input
                        id="reg-terms"
                        type="checkbox"
                        {...register("acceptTerms")}
                        className="mt-0.5 h-4 w-4 cursor-pointer rounded border-border text-violet-600 accent-violet-600 focus:ring-violet-600"
                    />
                    <span className="text-sm text-body">
                        I agree to the{" "}
                        <Link href="/terms" target="_blank" className="font-semibold text-violet-600 hover:underline">
                            Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" target="_blank" className="font-semibold text-violet-600 hover:underline">
                            Privacy Policy
                        </Link>
                        .
                    </span>
                </label>
                {errors.acceptTerms && (
                    <p role="alert" className="pl-7 text-xs font-medium text-red-500">
                        {errors.acceptTerms.message}
                    </p>
                )}
            </div>

            <div className="flex items-center gap-3 mt-6">
                <Button
                    type="button"
                    variant="quiet"
                    size="lg"
                    onClick={onBack}
                    disabled={isSubmitting}
                    className="flex-1"
                >
                    Back
                </Button>
                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={isSubmitting}
                    className="flex-[2]"
                >
                    <UserPlus className="h-4 w-4" />
                    Create Account
                </Button>
            </div>
        </form>
    );
}
