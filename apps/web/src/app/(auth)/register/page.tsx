"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, UserPlus, Phone, AtSign, Lock } from "lucide-react";
import { toast } from "sonner";

import { registerSchema, type RegisterValues } from "@/lib/schemas/auth";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/shared/button";
import { Field } from "@/components/shared/field";
import { Input } from "@/components/ui/input";
import type { ApiError } from "@/lib/api";

export default function RegisterPage() {
    const { register: registerUser } = useAuth();
    const [showPassword, setShowPassword] = React.useState(false);
    const [showConfirm, setShowConfirm] = React.useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
        watch,
    } = useForm<RegisterValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            phone: "",
            email: "",
            password: "",
            confirmPassword: "",
            acceptTerms: false,
        },
    });

    const password = watch("password");
    const hasNumber = /\d/.test(password);
    const hasLength = password.length >= 8;

    const onSubmit = async (values: RegisterValues) => {
        try {
            await registerUser({
                phone: values.phone,
                email: values.email,
                password: values.password,
            });
        } catch (err) {
            const apiErr = err as ApiError;
            if (apiErr.fields?.email) {
                setError("email", { message: apiErr.fields.email[0] });
            } else {
                toast.error(apiErr.message ?? "Registration failed. Please try again.");
            }
        }
    };

    return (
        <div className="space-y-8">
            {/* Heading */}
            <div className="space-y-1.5">
                <h1 className="text-3xl font-bold tracking-tight text-ink">
                    Create your account
                </h1>
                <p className="text-sm text-body">
                    Join 120,000+ Nigerians already using NePay.
                </p>
            </div>

            {/* Form */}
            <form
                id="register-form"
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4"
                noValidate
            >
                <Field
                    label="Phone Number"
                    htmlFor="reg-phone"
                    error={errors.phone?.message}
                    trailing={<Phone className="h-4 w-4" aria-hidden />}
                >
                    <Input
                        id="reg-phone"
                        type="tel"
                        placeholder="08012345678"
                        inputMode="tel"
                        autoComplete="tel"
                        {...register("phone")}
                        aria-invalid={!!errors.phone}
                        className="pr-10"
                    />
                </Field>

                <Field
                    label="Email Address"
                    htmlFor="reg-email"
                    error={errors.email?.message}
                    trailing={<AtSign className="h-4 w-4" aria-hidden />}
                >
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
                </Field>

                {/* Password strength hints */}
                {password.length > 0 && (
                    <div className="flex gap-4 text-xs">
                        <span className={hasLength ? "text-green-500" : "text-muted"}>
                            {hasLength ? "✓" : "○"} 8+ characters
                        </span>
                        <span className={hasNumber ? "text-green-500" : "text-muted"}>
                            {hasNumber ? "✓" : "○"} Contains a number
                        </span>
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
                            <Link
                                href="/terms"
                                target="_blank"
                                className="font-semibold text-violet-600 hover:underline"
                            >
                                Terms of Service
                            </Link>{" "}
                            and{" "}
                            <Link
                                href="/privacy"
                                target="_blank"
                                className="font-semibold text-violet-600 hover:underline"
                            >
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

                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={isSubmitting}
                    className="mt-2"
                >
                    <UserPlus className="h-4 w-4" />
                    Create Account
                </Button>
            </form>

            <p className="text-center text-sm text-body">
                Already have an account?{" "}
                <Link
                    href="/login"
                    className="font-semibold text-violet-600 hover:underline"
                >
                    Sign in
                </Link>
            </p>

            {/* Dev hint */}
            {process.env.NEXT_PUBLIC_PROTOTYPE_MODE === "true" && (
                <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-700">
                    Mock mode — after registration you&apos;ll be redirected to{" "}
                    <code className="font-mono">/kyc</code>.
                    <br />
                    Use <code className="font-mono">taken@example.com</code> to test the duplicate-email error.
                </p>
            )}
        </div>
    );
}
