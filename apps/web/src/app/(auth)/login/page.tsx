"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { loginSchema, type LoginValues } from "@/lib/schemas/auth";
import { useAuth } from "@/lib/auth-context";
import { getApiErrorMessage } from "@/lib/api-client";
import { Button } from "@/components/shared/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
    const { login } = useAuth();
    const searchParams = useSearchParams();
    const [showPassword, setShowPassword] = React.useState(false);
    const [suspended, setSuspended] = React.useState(false);

    React.useEffect(() => {
        if (searchParams.get("reason") === "inactivity") {
            toast.info("You have been logged out due to inactivity", {
                duration: 5000,
                description: "Please sign in again to continue.",
            });
            // Optional: Remove query param from url without refreshing
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [searchParams]);

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
        setSuspended(false);
        try {
            let formattedIdentifier = values.identifier.trim();
            if (/^0\d{9,10}$/.test(formattedIdentifier)) {
                formattedIdentifier = "+234" + formattedIdentifier.substring(1);
            }
            await login({ ...values, identifier: formattedIdentifier });
        } catch (err) {
            // `login()` throws the raw Axios error — the backend's business code
            // lives at err.response.data.code, never on the Axios error itself
            // (that `.code`, e.g. "ERR_BAD_REQUEST", is a transport-level code).
            const code = axios.isAxiosError(err) ? (err.response?.data as { code?: string } | undefined)?.code : undefined;

            if (code === "ACCOUNT_SUSPENDED") {
                setSuspended(true);
            } else if (code === "INVALID_CREDENTIALS") {
                setError("password", { message: getApiErrorMessage(err) });
            } else {
                toast.error(getApiErrorMessage(err));
            }
        }
    };

    return (
        <div className="w-full relative z-10">
            {/* Heading */}
            <div className="mb-8 space-y-2">
                <h1 className="text-4xl font-extrabold tracking-tight text-ink">
                    Sign in to NePay
                </h1>
                <p className="text-base font-medium text-body">
                    Please type in the email address linked to your NePay account.
                </p>
            </div>

            {suspended && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <p className="font-bold">Your account has been suspended</p>
                    <p className="mt-1 font-medium">
                        Please contact support at{" "}
                        <a href="mailto:info@nepay.com.ng" className="font-bold underline hover:text-red-800">
                            info@nepay.com.ng
                        </a>{" "}
                        for help restoring access.
                    </p>
                </div>
            )}

            {/* Form */}
            <form
                id="login-form"
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-6"
                noValidate
            >
                <div className="space-y-2">
                    <label htmlFor="login-identifier" className="text-sm font-bold text-ink">
                        Email Address or Phone
                    </label>
                    <div className="relative">
                        <Input
                            id="login-identifier"
                            type="text"
                            placeholder="name@example.com"
                            autoComplete="username"
                            inputMode="email"
                            {...register("identifier")}
                            aria-invalid={!!errors.identifier}
                            className="bg-white border-border text-ink h-14 text-base shadow-sm focus-visible:ring-violet-600 focus-visible:border-violet-600 transition-shadow"
                        />
                    </div>
                    {errors.identifier && (
                        <p className="text-xs font-bold text-red-500">
                            {errors.identifier.message}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <label htmlFor="login-password" className="text-sm font-bold text-ink">
                        Password
                    </label>
                    <div className="relative">
                        <Input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            {...register("password")}
                            aria-invalid={!!errors.password}
                            className="bg-white border-border text-ink h-14 text-base pr-12 shadow-sm focus-visible:ring-violet-600 focus-visible:border-violet-600 transition-shadow"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((p) => !p)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
                        >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="text-xs font-bold text-red-500">
                            {errors.password.message}
                        </p>
                    )}
                </div>

                <div className="pt-2 text-sm font-medium text-body">
                    Forgot your password?{" "}
                    <Link href="/forgot-password" className="font-bold text-violet-700 hover:text-violet-600 hover:underline transition-colors">
                        Reset it
                    </Link>
                </div>

                <div className="pt-4 space-y-4">
                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full h-14 text-lg font-bold shadow-md hover:shadow-lg transition-all"
                        loading={isSubmitting}
                    >
                        Sign In
                    </Button>

                    <Button
                        type="button"
                        variant="quiet"
                        className="w-full h-14 text-lg font-bold shadow-sm hover:shadow-md transition-all"
                        asChild
                    >
                        <Link href="/register">
                            Create an Account
                        </Link>
                    </Button>
                </div>
            </form>

            {/* Dev hint */}
            {process.env.NEXT_PUBLIC_PROTOTYPE_MODE === "true" && (
                <p className="mt-8 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-center text-xs font-medium text-amber-700">
                    Mock mode: use any email + any password to log in.
                    <br />
                    Password <code className="font-mono font-bold">wrong</code> simulates an error.
                </p>
            )}
        </div>
    );
}
