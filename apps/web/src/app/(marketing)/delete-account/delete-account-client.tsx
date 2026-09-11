"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import {
    Trash2,
    ShieldCheck,
    CheckCircle2,
    Eye,
    EyeOff,
    Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { getApiErrorMessage } from "@/lib/api-client";
import { emailSchema } from "@/lib/schemas/auth";
import { Button } from "@/components/shared/button";
import { Field } from "@/components/shared/field";
import { Input } from "@/components/ui/input";
import type { ApiResponse, AuthTokensDto, LoginResponse } from "@/lib/types/api";

/**
 * Public, unauthenticated account-deletion resource (nepay.com.ng/delete-account).
 *
 * Google Play requires an external web page that can close an account without
 * the caller opening or reinstalling the app. This talks to the same backend
 * contract the mobile/web app itself uses (POST /auth/login, optionally
 * POST /auth/2fa/verify-login, POST /auth/account/request-deletion-otp, then
 * DELETE /auth/account) — it just proves identity fresh, in the browser,
 * instead of reading an existing app session.
 *
 * Deliberately does NOT use the shared `apiClient`/auth-context/localStorage
 * token store: this page must never read or overwrite a real logged-in
 * session sitting in this browser, and its access token only needs to live
 * for the few minutes this flow takes.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://nepay-backend.onrender.com/api/v1";

const api = axios.create({
    baseURL: BASE_URL,
    headers: { "Content-Type": "application/json" },
});

function authHeader(token: string) {
    return { headers: { Authorization: `Bearer ${token}` } };
}

function errorCode(err: unknown): string | undefined {
    return axios.isAxiosError(err) ? (err.response?.data as { code?: string } | undefined)?.code : undefined;
}

type Step = "intro" | "credentials" | "mfa" | "confirm" | "done";

const credentialsSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, "Enter your password"),
});
type CredentialsValues = z.infer<typeof credentialsSchema>;

const mfaSchema = z.object({
    code: z.string().min(1, "Enter the 6-digit code").regex(/^\d{6}$/, "Code must be 6 digits"),
});
type MfaValues = z.infer<typeof mfaSchema>;

const confirmSchema = z.object({
    otp: z.string().min(1, "Enter the 6-digit code").regex(/^\d{6}$/, "Code must be 6 digits"),
    acknowledge: z.boolean().refine((v) => v === true, "You must confirm before deleting your account"),
});
type ConfirmValues = z.infer<typeof confirmSchema>;

const RESEND_COOLDOWN_SECONDS = 60;

export function DeleteAccountFlow() {
    const [step, setStep] = React.useState<Step>("intro");
    const [accessToken, setAccessToken] = React.useState<string | null>(null);
    const [mfaToken, setMfaToken] = React.useState<string | null>(null);
    const [email, setEmail] = React.useState("");
    const [suspended, setSuspended] = React.useState(false);
    const [balanceBlocked, setBalanceBlocked] = React.useState(false);
    const [resendCooldown, setResendCooldown] = React.useState(0);

    React.useEffect(() => {
        if (resendCooldown <= 0) return;
        const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [resendCooldown]);

    const requestDeletionOtp = React.useCallback(async (token: string) => {
        await api.post("/auth/account/request-deletion-otp", {}, authHeader(token));
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
    }, []);

    const finishAuth = React.useCallback(
        async (tokens: AuthTokensDto) => {
            setEmail(tokens.user.email);
            setAccessToken(tokens.accessToken);
            try {
                await requestDeletionOtp(tokens.accessToken);
                setStep("confirm");
            } catch (err) {
                toast.error(getApiErrorMessage(err, "Could not send a deletion code. Please try again."));
            }
        },
        [requestDeletionOtp],
    );

    // ── Step: credentials ───────────────────────────────────────────────
    const credentialsForm = useForm<CredentialsValues>({
        resolver: zodResolver(credentialsSchema),
        defaultValues: { email: "", password: "" },
    });
    const [showPassword, setShowPassword] = React.useState(false);

    const onSubmitCredentials = async (values: CredentialsValues) => {
        setSuspended(false);
        try {
            const res = await api.post<ApiResponse<LoginResponse>>("/auth/login", {
                email: values.email,
                password: values.password,
            });
            const data = res.data.data;

            if ("mfaRequired" in data) {
                setEmail(values.email);
                setMfaToken(data.mfaToken);
                setStep("mfa");
                return;
            }

            await finishAuth(data);
        } catch (err) {
            const code = errorCode(err);
            if (code === "INVALID_CREDENTIALS") {
                credentialsForm.setError("password", { message: getApiErrorMessage(err) });
            } else if (code === "ACCOUNT_SUSPENDED") {
                setSuspended(true);
            } else {
                toast.error(getApiErrorMessage(err));
            }
        }
    };

    // ── Step: MFA ────────────────────────────────────────────────────────
    const mfaForm = useForm<MfaValues>({
        resolver: zodResolver(mfaSchema),
        defaultValues: { code: "" },
    });
    const mfaCodeField = mfaForm.register("code");

    const onSubmitMfa = async (values: MfaValues) => {
        if (!mfaToken) return;
        try {
            const res = await api.post<ApiResponse<AuthTokensDto>>("/auth/2fa/verify-login", {
                mfaToken,
                code: values.code,
            });
            await finishAuth(res.data.data);
        } catch (err) {
            const code = errorCode(err);
            if (code === "VALIDATION_FAILED" || code === "TOO_MANY_REQUESTS") {
                mfaForm.setError("code", { message: getApiErrorMessage(err, "Invalid code. Please try again.") });
                return;
            }
            toast.error(getApiErrorMessage(err, "Your session expired. Please sign in again."));
            setMfaToken(null);
            setStep("credentials");
        }
    };

    // ── Step: confirm & delete ──────────────────────────────────────────
    const confirmForm = useForm<ConfirmValues>({
        resolver: zodResolver(confirmSchema),
        defaultValues: { otp: "", acknowledge: false },
    });
    const otpField = confirmForm.register("otp");

    const onSubmitConfirm = async (values: ConfirmValues) => {
        if (!accessToken) return;
        try {
            await api.delete("/auth/account", { ...authHeader(accessToken), data: { otp: values.otp } });
            setStep("done");
        } catch (err) {
            const code = errorCode(err);
            const status = axios.isAxiosError(err) ? err.response?.status : undefined;

            if (code === "CONFLICT") {
                setBalanceBlocked(true);
                return;
            }
            if (code === "VALIDATION_FAILED") {
                confirmForm.setError("otp", { message: getApiErrorMessage(err, "Invalid or expired code.") });
                return;
            }
            if (status === 401) {
                toast.error("Your session expired. Please sign in again to finish deleting your account.");
                setAccessToken(null);
                setStep("credentials");
                return;
            }
            toast.error(getApiErrorMessage(err));
        }
    };

    const onResend = async () => {
        if (!accessToken || resendCooldown > 0) return;
        try {
            await requestDeletionOtp(accessToken);
            toast.success("A new code has been sent to your email.");
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    // ── Render ───────────────────────────────────────────────────────────

    if (step === "intro") {
        return (
            <div className="space-y-8">
                <Header
                    icon={<Trash2 className="h-7 w-7" strokeWidth={1.5} />}
                    tone="neutral"
                    title="Delete your NePay account"
                    subtitle="You can permanently delete your NePay account right here — you don't need to reinstall or open the app."
                />

                <div className="bg-marketing-surface border border-marketing-border rounded-3xl p-6 space-y-4">
                    <h2 className="text-sm font-bold uppercase tracking-wide text-marketing-secondary">
                        What happens when you delete your account
                    </h2>
                    <ul className="space-y-3 text-sm text-marketing-text">
                        <li className="flex gap-2">
                            <span aria-hidden>•</span>
                            <span>Your profile, login credentials, PIN and two-factor authentication are permanently removed, and every active session is signed out.</span>
                        </li>
                        <li className="flex gap-2">
                            <span aria-hidden>•</span>
                            <span>You immediately lose access to your wallet, cards, gift cards, flights and Pods.</span>
                        </li>
                        <li className="flex gap-2">
                            <span aria-hidden>•</span>
                            <span>
                                Some records — transaction history, ledger entries, KYC/verification data and fraud-prevention
                                logs — may be retained for as long as required by Nigerian financial regulation, as described
                                in our{" "}
                                <Link href="/legal/privacy" className="font-semibold underline hover:no-underline">
                                    Privacy Policy
                                </Link>
                                .
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <span aria-hidden>•</span>
                            <span>If your wallet has a positive balance, you'll need to withdraw it first — deletion can't complete while funds remain.</span>
                        </li>
                    </ul>
                    <p className="text-sm font-semibold text-marketing-text">This action cannot be undone.</p>
                </div>

                <Button size="lg" fullWidth onClick={() => setStep("credentials")}>
                    Continue
                </Button>
            </div>
        );
    }

    if (step === "credentials") {
        return (
            <div className="space-y-8">
                <Header
                    icon={<ShieldCheck className="h-7 w-7" strokeWidth={1.5} />}
                    tone="neutral"
                    title="Confirm it's you"
                    subtitle="Sign in with your NePay email and password to continue."
                />

                {suspended && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <p className="font-bold">Your account can't sign in right now</p>
                        <p className="mt-1 font-medium">
                            Please contact support at{" "}
                            <a href="mailto:info@nepay.com.ng" className="font-bold underline hover:text-red-800">
                                info@nepay.com.ng
                            </a>{" "}
                            for help.
                        </p>
                    </div>
                )}

                <form onSubmit={credentialsForm.handleSubmit(onSubmitCredentials)} className="space-y-5" noValidate>
                    <Field label="Email address" htmlFor="delete-email" error={credentialsForm.formState.errors.email?.message}>
                        <Input
                            id="delete-email"
                            type="email"
                            placeholder="name@example.com"
                            autoComplete="username"
                            {...credentialsForm.register("email")}
                            aria-invalid={!!credentialsForm.formState.errors.email}
                        />
                    </Field>

                    <Field
                        label="Password"
                        htmlFor="delete-password"
                        error={credentialsForm.formState.errors.password?.message}
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
                            id="delete-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            {...credentialsForm.register("password")}
                            aria-invalid={!!credentialsForm.formState.errors.password}
                        />
                    </Field>

                    <p className="text-sm text-marketing-secondary">
                        Forgot your password?{" "}
                        <Link href="/forgot-password" className="font-semibold underline hover:no-underline">
                            Reset it
                        </Link>{" "}
                        first, then come back here.
                    </p>

                    <Button type="submit" size="lg" fullWidth loading={credentialsForm.formState.isSubmitting}>
                        Continue
                    </Button>
                </form>
            </div>
        );
    }

    if (step === "mfa") {
        return (
            <div className="space-y-8">
                <Header
                    icon={<ShieldCheck className="h-7 w-7" strokeWidth={1.5} />}
                    tone="neutral"
                    title="Two-factor verification"
                    subtitle="Enter the 6-digit code from your authenticator app to continue."
                />

                <form onSubmit={mfaForm.handleSubmit(onSubmitMfa)} className="space-y-5" noValidate>
                    <Field label="Authentication code" htmlFor="delete-mfa-code" error={mfaForm.formState.errors.code?.message}>
                        <Input
                            id="delete-mfa-code"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            placeholder="000000"
                            autoComplete="one-time-code"
                            autoFocus
                            {...mfaCodeField}
                            onChange={(e) => {
                                e.target.value = e.target.value.replace(/\D/g, "").slice(0, 6);
                                mfaCodeField.onChange(e);
                            }}
                            aria-invalid={!!mfaForm.formState.errors.code}
                            className="text-center text-lg tracking-[0.5em] font-mono"
                        />
                    </Field>

                    <Button type="submit" size="lg" fullWidth loading={mfaForm.formState.isSubmitting}>
                        Verify & continue
                    </Button>
                </form>

                <button
                    type="button"
                    onClick={() => {
                        setMfaToken(null);
                        setStep("credentials");
                    }}
                    className="block text-center w-full text-sm font-medium text-marketing-secondary hover:text-marketing-text"
                >
                    Back
                </button>
            </div>
        );
    }

    if (step === "confirm") {
        return (
            <div className="space-y-8">
                <Header
                    icon={<Trash2 className="h-7 w-7" strokeWidth={1.5} />}
                    tone="danger"
                    title="Delete your account"
                    subtitle={`We've emailed a 6-digit code to ${email || "your inbox"}. It's valid for 10 minutes.`}
                />

                {balanceBlocked && (
                    <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        <Wallet className="h-5 w-5 flex-shrink-0" />
                        <div>
                            <p className="font-bold">You still have funds in your wallet</p>
                            <p className="mt-1">
                                Please withdraw your available balance before deleting your account.{" "}
                                <Link href="/login" className="font-semibold underline hover:no-underline">
                                    Sign in to withdraw
                                </Link>
                                , then come back here and enter your code again to finish.
                            </p>
                        </div>
                    </div>
                )}

                <form onSubmit={confirmForm.handleSubmit(onSubmitConfirm)} className="space-y-5" noValidate>
                    <Field label="Verification code" htmlFor="delete-otp" error={confirmForm.formState.errors.otp?.message}>
                        <Input
                            id="delete-otp"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            placeholder="000000"
                            autoComplete="one-time-code"
                            autoFocus
                            {...otpField}
                            onChange={(e) => {
                                e.target.value = e.target.value.replace(/\D/g, "").slice(0, 6);
                                otpField.onChange(e);
                            }}
                            aria-invalid={!!confirmForm.formState.errors.otp}
                            className="text-center text-lg tracking-[0.5em] font-mono"
                        />
                    </Field>

                    <button
                        type="button"
                        onClick={onResend}
                        disabled={resendCooldown > 0}
                        className="text-sm font-semibold text-violet-700 hover:text-violet-600 disabled:cursor-not-allowed disabled:text-marketing-secondary disabled:no-underline underline"
                    >
                        {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
                    </button>

                    <label className="flex items-start gap-3 text-sm text-marketing-text">
                        <input
                            type="checkbox"
                            className="mt-0.5 h-4 w-4 rounded border-marketing-border accent-violet-600"
                            {...confirmForm.register("acknowledge")}
                        />
                        <span>I understand this will permanently close my NePay account and cannot be undone.</span>
                    </label>
                    {confirmForm.formState.errors.acknowledge && (
                        <p className="text-xs font-medium text-red-500">{confirmForm.formState.errors.acknowledge.message}</p>
                    )}

                    <Button type="submit" variant="danger" size="lg" fullWidth loading={confirmForm.formState.isSubmitting}>
                        Delete my account
                    </Button>
                </form>
            </div>
        );
    }

    // step === "done"
    return (
        <div className="space-y-8 text-center">
            <Header
                icon={<CheckCircle2 className="h-7 w-7" strokeWidth={1.5} />}
                tone="success"
                title="Your account has been deleted"
                subtitle={`We've permanently closed your NePay account and signed you out everywhere.${email ? ` A confirmation email is on its way to ${email}.` : ""}`}
            />
            <p className="text-sm text-marketing-secondary">
                If this was a mistake, contact support at{" "}
                <a href="mailto:info@nepay.com.ng" className="font-semibold underline hover:no-underline">
                    info@nepay.com.ng
                </a>
                .
            </p>
            <Button size="lg" fullWidth asChild>
                <Link href="/">Return to homepage</Link>
            </Button>
        </div>
    );
}

function Header({
    icon,
    title,
    subtitle,
    tone,
}: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    tone: "neutral" | "danger" | "success";
}) {
    const toneClasses =
        tone === "danger" ? "bg-red-100 text-red-600" : tone === "success" ? "bg-green-100 text-green-600" : "bg-violet-100 text-violet-600";

    return (
        <div className="flex flex-col items-center text-center space-y-3">
            <span className={`flex h-14 w-14 items-center justify-center rounded-full ${toneClasses}`}>{icon}</span>
            <div className="space-y-1.5">
                <h1 className="text-3xl font-extrabold text-marketing-text">{title}</h1>
                <p className="text-sm text-marketing-secondary max-w-md mx-auto">{subtitle}</p>
            </div>
        </div>
    );
}
