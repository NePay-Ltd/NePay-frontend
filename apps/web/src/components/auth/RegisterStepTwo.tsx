"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, AtSign, UserPlus } from "lucide-react";
import Link from "next/link";

import { registerStepTwoSchema, type RegisterStepTwoValues } from "@/lib/schemas/auth";
import { Button } from "@/components/shared/button";
import { Field } from "@/components/shared/field";
import { Input } from "@/components/ui/input";

interface RegisterStepTwoProps {
    isSubmitting: boolean;
    onBack: () => void;
    onSubmitFinal: (data: RegisterStepTwoValues) => void;
}

export function RegisterStepTwo({ isSubmitting, onBack, onSubmitFinal }: RegisterStepTwoProps) {
    const [showPassword, setShowPassword] = React.useState(false);
    const [showConfirm, setShowConfirm] = React.useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<RegisterStepTwoValues>({
        resolver: zodResolver(registerStepTwoSchema),
        defaultValues: {
            email: "",
            password: "",
            confirmPassword: "",
            acceptTerms: false,
        },
    });

    const email = watch("email");
    const password = watch("password");

    const hasLength = password.length >= 6;
    const hasNumber = /\d/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    let strengthScore = 0;
    if (password.length > 0) {
        if (hasLength) strengthScore += 1;
        if (hasNumber) strengthScore += 1;
        if (hasUpper) strengthScore += 1;
        if (hasSpecial) strengthScore += 1;
    }

    const strengthLabels = ["Weak", "Weak", "Fair", "Good", "Strong"];
    const strengthColors = ["bg-red-500", "bg-red-500", "bg-amber-500", "bg-blue-500", "bg-green-500"];
    const strengthColorText = ["text-red-500", "text-red-500", "text-amber-500", "text-blue-500", "text-green-500"];

    return (
        <form id="register-step-two" onSubmit={handleSubmit(onSubmitFinal)} className="space-y-4" noValidate>
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
                    placeholder="Minimum 6 characters"
                    autoComplete="new-password"
                    {...register("password")}
                    aria-invalid={!!errors.password}
                    className="pr-10"
                />
            </Field>

            {/* Password strength hints */}
            {password.length > 0 && (
                <div className="space-y-2 px-1">
                    <div className="flex gap-1 h-1.5 w-full">
                        {[1, 2, 3, 4].map((level) => (
                            <div
                                key={level}
                                className={`h-full flex-1 rounded-full transition-colors ${strengthScore >= level ? strengthColors[strengthScore] : "bg-border"}`}
                            />
                        ))}
                    </div>
                    <div className="flex justify-between text-[11px] mb-2 uppercase tracking-widest">
                        <span className={`font-bold ${strengthScore > 0 ? strengthColorText[strengthScore] : 'text-muted'}`}>
                            {strengthLabels[strengthScore]}
                        </span>
                    </div>
                    <div className="flex flex-col gap-1.5 text-xs">
                        <span className={hasLength ? "text-green-600 font-bold" : "text-muted"}>
                            {hasLength ? "✓" : "○"} At least 6 characters
                        </span>
                        <span className={hasNumber ? "text-green-600 font-bold" : "text-muted"}>
                            {hasNumber ? "✓" : "○"} Contains a number
                        </span>
                    </div>
                </div>
            )}

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
