"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, AtSign } from "lucide-react";
import { toast } from "sonner";

import { loginSchema, type LoginValues } from "@/lib/schemas/auth";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/shared/button";
import { Field } from "@/components/shared/field";
import { Input } from "@/components/ui/input";
import type { ApiError } from "@/lib/api";

export default function LoginPage() {
    const { login } = useAuth();
    const [showPassword, setShowPassword] = React.useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
    } = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { identifier: "", password: "" },
    });

    const onSubmit = async (values: LoginValues) => {
        try {
            await login(values);
        } catch (err) {
            const apiErr = err as ApiError;
            if (apiErr.code === "INVALID_CREDENTIALS") {
                setError("password", { message: apiErr.message });
            } else {
                toast.error(apiErr.message ?? "Something went wrong. Please try again.");
            }
        }
    };

    return (
        <div className="space-y-8">
            {/* Heading */}
            <div className="space-y-1.5">
                <h1 className="text-3xl font-bold tracking-tight text-ink">
                    Welcome back
                </h1>
                <p className="text-sm text-body">
                    Sign in to your NePay account to continue.
                </p>
            </div>

            {/* Form */}
            <form
                id="login-form"
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-5"
                noValidate
            >
                <Field
                    label="Email or Phone"
                    htmlFor="login-identifier"
                    error={errors.identifier?.message}
                    trailing={
                        <AtSign className="h-4 w-4" aria-hidden="true" />
                    }
                >
                    <Input
                        id="login-identifier"
                        type="text"
                        placeholder="name@example.com or 080…"
                        autoComplete="username"
                        inputMode="email"
                        {...register("identifier")}
                        aria-invalid={!!errors.identifier}
                        className="pr-10"
                    />
                </Field>

                <Field
                    label="Password"
                    htmlFor="login-password"
                    error={errors.password?.message}
                    hint={
                        <Link
                            href="/forgot-password"
                            className="text-xs font-medium text-violet-600 hover:underline"
                        >
                            Forgot password?
                        </Link>
                    }
                    trailing={
                        <button
                            type="button"
                            onClick={() => setShowPassword((p) => !p)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            className="text-muted hover:text-ink"
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </button>
                    }
                >
                    <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        {...register("password")}
                        aria-invalid={!!errors.password}
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
                    <Lock className="h-4 w-4" />
                    Sign in
                </Button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted">or</span>
                <div className="h-px flex-1 bg-border" />
            </div>

            {/* Register link */}
            <p className="text-center text-sm text-body">
                Don&apos;t have an account?{" "}
                <Link
                    href="/register"
                    className="font-semibold text-violet-600 hover:underline"
                >
                    Create one — it&apos;s free
                </Link>
            </p>

            {/* Dev hint */}
            {process.env.NEXT_PUBLIC_PROTOTYPE_MODE === "true" && (
                <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-700">
                    Mock mode: use any email + any password to log in.
                    <br />
                    Password <code className="font-mono">wrong</code> simulates a bad-credential error.
                </p>
            )}
        </div>
    );
}
