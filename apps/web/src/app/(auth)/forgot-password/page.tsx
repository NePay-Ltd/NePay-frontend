"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, ArrowLeft, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/schemas/auth";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/shared/button";
import { Field } from "@/components/shared/field";
import { Input } from "@/components/ui/input";
import type { ApiError } from "@/lib/api";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [submitted, setSubmitted] = React.useState(false);
    const [email, setEmail] = React.useState("");

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
        getValues,
    } = useForm<ForgotPasswordValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: { email: "" },
    });

    const onSubmit = async (values: ForgotPasswordValues) => {
        try {
            await apiClient.post("/auth/forgot-password", { email: values.email });
            setEmail(values.email);
            setSubmitted(true);
        } catch (err) {
            const apiErr = err as ApiError;
            if (apiErr.code === "ACCOUNT_NOT_FOUND") {
                setError("email", { message: apiErr.message });
            } else {
                toast.error(apiErr.message ?? "Failed to send reset code. Please try again.");
            }
        }
    };

    if (submitted) {
        return (
            <div className="space-y-6 text-center">
                <div className="flex justify-center">
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-green-500">
                        <CheckCircle2 className="h-8 w-8" />
                    </span>
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-ink">Check your inbox</h1>
                    <p className="text-sm text-body">
                        We&apos;ve sent a 6-digit reset code to{" "}
                        <span className="font-semibold text-ink">{email}</span>.
                        It expires in 15 minutes.
                    </p>
                </div>
                <div className="space-y-3">
                    <Button
                        variant="primary"
                        fullWidth
                        onClick={() => router.push(`/reset-password?email=${encodeURIComponent(email)}`)}
                    >
                        Enter code
                    </Button>
                    <Button
                        variant="quiet"
                        fullWidth
                        onClick={() => setSubmitted(false)}
                    >
                        Try a different address
                    </Button>
                    <Link
                        href="/login"
                        className="block text-center text-sm font-semibold text-violet-600 hover:underline"
                    >
                        Back to sign in
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="space-y-1.5">
                <h1 className="text-3xl font-bold tracking-tight text-ink">
                    Forgot password?
                </h1>
                <p className="text-sm text-body">
                    Enter the email linked to your account and we&apos;ll
                    send you a reset code.
                </p>
            </div>

            <form
                id="forgot-password-form"
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-5"
                noValidate
            >
                <Field
                    label="Email"
                    htmlFor="forgot-email"
                    error={errors.email?.message}
                    trailing={<Mail className="h-4 w-4" aria-hidden />}
                >
                    <Input
                        id="forgot-email"
                        type="email"
                        placeholder="name@example.com"
                        inputMode="email"
                        autoComplete="email"
                        {...register("email")}
                        aria-invalid={!!errors.email}
                        className="pr-10"
                    />
                </Field>

                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={isSubmitting}
                >
                    <Send className="h-4 w-4" />
                    Send Reset Code
                </Button>
            </form>

            <Link
                href="/login"
                className="flex items-center justify-center gap-2 text-sm font-medium text-body hover:text-ink"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
            </Link>


        </div>
    );
}
