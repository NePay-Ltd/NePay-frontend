"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconEye as Eye, IconEyeOff as EyeOff } from "@/components/icons";
import { AtSign, UserPlus, FileText, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import { registerStepTwoSchema, type RegisterStepTwoValues } from "@/lib/schemas/auth";
import { Button } from "@/components/shared/button";
import { Field } from "@/components/shared/field";
import { Input } from "@/components/ui/input";
import { ScrollToAcceptModal } from "@/components/shared/ScrollToAcceptModal";
import { TermsContent } from "@/components/legal/TermsContent";
import { PrivacyContent } from "@/components/legal/PrivacyContent";
import { EulaContent } from "@/components/legal/EulaContent";

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
    const [isTermsModalOpen, setIsTermsModalOpen] = React.useState(false);

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
        mode: "onChange",
        defaultValues: {
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
            acceptTerms: false,
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

    const emailValue = watch("email");
    const acceptedTerms = watch("acceptTerms");

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
                    aria-invalid={!!errors.email}
                    className="pr-10"
                />
            </Field>

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
                {acceptedTerms ? (
                    <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-xl border border-green-200">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-sm font-semibold">Terms of Service Accepted</span>
                    </div>
                ) : (
                    <Button
                        type="button"
                        variant="secondary"
                        className="w-full justify-center h-12"
                        onClick={() => setIsTermsModalOpen(true)}
                    >
                        <FileText className="w-4 h-4 mr-2 text-violet-600" />
                        Review Legal Agreements to Continue
                    </Button>
                )}
                
                {errors.acceptTerms && (
                    <p role="alert" className="text-xs font-medium text-red-500 mt-1">
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
                    disabled={!acceptedTerms || isSubmitting}
                    className="flex-[2]"
                >
                    <UserPlus className="h-4 w-4" />
                    Create Account
                </Button>
            </div>

            <ScrollToAcceptModal
                isOpen={isTermsModalOpen}
                onClose={() => setIsTermsModalOpen(false)}
                title="Legal Agreements"
                onAccept={() => {
                    setValue("acceptTerms", true, { shouldValidate: true });
                    setIsTermsModalOpen(false);
                }}
            >
                <EulaContent />
                <div className="h-8" />
                <TermsContent />
                <div className="h-8" />
                <PrivacyContent />
            </ScrollToAcceptModal>
        </form>
    );
}
