"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { verifyMfaSchema, type VerifyMfaValues } from "@/lib/schemas/auth";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/shared/button";
import { Field } from "@/components/shared/field";
import { Input } from "@/components/ui/input";

/**
 * Second step of a 2FA login. Reached only via the redirect in
 * auth-context.tsx's login() when POST /auth/login returns a challenge
 * (mfaRequired: true) instead of tokens — the mfaToken it issued travels
 * here as a query param and is exchanged, together with a live TOTP code,
 * for the real token pair at POST /auth/2fa/verify-login.
 */
export default function VerifyMfaPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { verifyMfa, isMutating } = useAuth();

    const mfaToken = searchParams.get("token");
    const returnTo = searchParams.get("returnTo");

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
    } = useForm<VerifyMfaValues>({
        resolver: zodResolver(verifyMfaSchema),
        defaultValues: { code: "" },
    });

    const codeField = register("code");

    const onSubmit = async (values: VerifyMfaValues) => {
        if (!mfaToken) return;

        try {
            await verifyMfa(mfaToken, values.code);
        } catch (err: any) {
            const code = err.response?.data?.code;
            const message = err.response?.data?.message as string | undefined;

            // A wrong code doesn't spend the challenge — the same mfaToken
            // still works, so just let the user retry (see AuthService's own
            // note on verifyMfaLogin).
            if (code === "VALIDATION_FAILED" || code === "TOO_MANY_REQUESTS") {
                setError("code", { message: message || "Invalid code. Please try again." });
                return;
            }

            // Anything else (expired/invalid challenge, disabled account) means
            // this login attempt is dead — back to the password step.
            toast.error(message || "Your session expired. Please sign in again.");
            router.push(returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : "/login");
        }
    };

    if (!mfaToken) {
        return (
            <div className="space-y-6 text-center">
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-ink">Verification link invalid</h1>
                    <p className="text-sm text-body">
                        This 2FA verification link is missing or has expired. Please sign in again.
                    </p>
                </div>
                <Button variant="primary" fullWidth asChild>
                    <Link href="/login">Back to sign in</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col items-center text-center space-y-3">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                    <ShieldCheck className="h-7 w-7" strokeWidth={1.5} />
                </span>
                <div className="space-y-1.5">
                    <h1 className="text-2xl font-bold text-ink">Two-factor verification</h1>
                    <p className="text-sm text-body max-w-xs">
                        Enter the 6-digit code from your authenticator app to finish signing in.
                    </p>
                </div>
            </div>

            <form
                id="verify-mfa-form"
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4"
                noValidate
            >
                <Field label="Authentication code" htmlFor="verify-mfa-code" error={errors.code?.message}>
                    <Input
                        id="verify-mfa-code"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        placeholder="000000"
                        autoComplete="one-time-code"
                        autoFocus
                        {...codeField}
                        onChange={(e) => {
                            e.target.value = e.target.value.replace(/\D/g, "").slice(0, 6);
                            codeField.onChange(e);
                        }}
                        aria-invalid={!!errors.code}
                        className="text-center text-lg tracking-[0.5em] font-mono"
                    />
                </Field>

                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={isSubmitting || isMutating}
                    className="mt-2"
                >
                    Verify & Sign In
                </Button>
            </form>

            <Link
                href="/login"
                className="block text-center text-sm font-medium text-body hover:text-ink"
            >
                Back to sign in
            </Link>
        </div>
    );
}
