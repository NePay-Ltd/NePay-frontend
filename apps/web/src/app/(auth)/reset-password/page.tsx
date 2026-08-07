"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, KeyRound, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/schemas/auth";
import { mockResetPassword } from "@/lib/mock-api";
import { Button } from "@/components/shared/button";
import { Field } from "@/components/shared/field";
import { Input } from "@/components/ui/input";
import type { ApiError } from "@/lib/api";

export default function ResetPasswordPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token") ?? "";
    const [done, setDone] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);
    const [showConfirm, setShowConfirm] = React.useState(false);
    const [tokenError, setTokenError] = React.useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        watch,
    } = useForm<ResetPasswordValues>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: { password: "", confirmPassword: "" },
    });

    const password = watch("password");
    const hasNumber = /\d/.test(password);
    const hasLength = password.length >= 8;

    const onSubmit = async (values: ResetPasswordValues) => {
        try {
            await mockResetPassword(token, values.password);
            toast.success("Password updated successfully!");
            setDone(true);
        } catch (err) {
            const apiErr = err as ApiError;
            if (apiErr.code === "TOKEN_EXPIRED") {
                setTokenError(apiErr.message);
            } else {
                toast.error(apiErr.message ?? "Failed to reset password. Please try again.");
            }
        }
    };

    // No token in URL
    if (!token) {
        return (
            <div className="space-y-6 text-center">
                <span className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-red-500/10 text-red-500">
                    <AlertTriangle className="h-8 w-8" />
                </span>
                <div>
                    <h1 className="text-xl font-bold text-ink">Invalid reset link</h1>
                    <p className="mt-1 text-sm text-body">
                        This link is missing a reset token. Please request a new one.
                    </p>
                </div>
                <Button
                    variant="primary"
                    onClick={() => router.push("/forgot-password")}
                    fullWidth
                >
                    Request new link
                </Button>
            </div>
        );
    }

    // Token expired
    if (tokenError) {
        return (
            <div className="space-y-6 text-center">
                <span className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                    <AlertTriangle className="h-8 w-8" />
                </span>
                <div>
                    <h1 className="text-xl font-bold text-ink">Link expired</h1>
                    <p className="mt-1 text-sm text-body">{tokenError}</p>
                </div>
                <Button
                    variant="primary"
                    onClick={() => router.push("/forgot-password")}
                    fullWidth
                >
                    Request new link
                </Button>
            </div>
        );
    }

    // Success state
    if (done) {
        return (
            <div className="space-y-6 text-center">
                <span className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-green-500/10 text-green-500">
                    <CheckCircle2 className="h-8 w-8" />
                </span>
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-ink">Password updated!</h1>
                    <p className="text-sm text-body">
                        Your password has been changed. You can now sign in with your new password.
                    </p>
                </div>
                <Button
                    variant="primary"
                    fullWidth
                    onClick={() => router.push("/login")}
                >
                    Sign in now
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="space-y-1.5">
                <h1 className="text-3xl font-bold tracking-tight text-ink">
                    Reset your password
                </h1>
                <p className="text-sm text-body">
                    Choose a strong new password for your NePay account.
                </p>
            </div>

            <form
                id="reset-password-form"
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4"
                noValidate
            >
                <Field
                    label="New Password"
                    htmlFor="reset-password"
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
                        id="reset-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Minimum 8 characters"
                        autoComplete="new-password"
                        {...register("password")}
                        aria-invalid={!!errors.password}
                        className="pr-10"
                    />
                </Field>

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
                    label="Confirm New Password"
                    htmlFor="reset-confirm"
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
                        id="reset-confirm"
                        type={showConfirm ? "text" : "password"}
                        placeholder="Re-enter your new password"
                        autoComplete="new-password"
                        {...register("confirmPassword")}
                        aria-invalid={!!errors.confirmPassword}
                        className="pr-10"
                    />
                </Field>

                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={isSubmitting}
                    className="mt-2"
                >
                    <KeyRound className="h-4 w-4" />
                    Update Password
                </Button>
            </form>

            <Link
                href="/login"
                className="block text-center text-sm font-medium text-body hover:text-ink"
            >
                Back to sign in
            </Link>

            {process.env.NEXT_PUBLIC_PROTOTYPE_MODE === "true" && (
                <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-700">
                    Mock mode — add <code className="font-mono">?token=expired</code> to the URL to test the expired-token state.
                </p>
            )}
        </div>
    );
}
