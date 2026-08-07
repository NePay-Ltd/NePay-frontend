"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    CheckCircle2,
    ShieldCheck,
    Fingerprint,
    AlertCircle,
    CreditCard,
    ArrowRight,
    Lock,
    BadgeCheck,
} from "lucide-react";
import { toast } from "sonner";

import { verifyBvnSchema, verifyNinSchema, type VerifyBvnValues, type VerifyNinValues } from "@/lib/schemas/kyc";
import { mockVerifyBvn, mockVerifyNin } from "@/lib/mock-api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/shared/button";
import { Field } from "@/components/shared/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import type { ApiError } from "@/lib/api";

// ─── Stepper indicator ────────────────────────────────────────────────────────

interface StepperProps {
    currentStep: 1 | 2;
    bvnDone: boolean;
    ninDone: boolean;
}

function Stepper({ currentStep, bvnDone, ninDone }: StepperProps) {
    const steps = [
        {
            num: 1,
            label: "BVN Verification",
            done: bvnDone,
            icon: CreditCard,
        },
        {
            num: 2,
            label: "NIN Verification",
            done: ninDone,
            icon: Fingerprint,
        },
    ] as const;

    return (
        <div className="flex items-center gap-0">
            {steps.map((step, idx) => {
                const isActive = currentStep === step.num;
                const isLocked = step.num > currentStep && !step.done;
                const Icon = step.icon;

                return (
                    <React.Fragment key={step.num}>
                        <div className="flex flex-col items-center">
                            <div
                                className={cn(
                                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                                    step.done
                                        ? "border-green-500 bg-green-500 text-white"
                                        : isActive
                                            ? "border-violet-600 bg-violet-600 text-white shadow-lg shadow-violet-600/30"
                                            : "border-border bg-white text-muted",
                                )}
                            >
                                {step.done ? (
                                    <CheckCircle2 className="h-5 w-5" />
                                ) : isLocked ? (
                                    <Lock className="h-4 w-4" />
                                ) : (
                                    <Icon className="h-4 w-4" />
                                )}
                            </div>
                            <span
                                className={cn(
                                    "mt-1.5 text-xs font-medium",
                                    step.done
                                        ? "text-green-500"
                                        : isActive
                                            ? "text-violet-700"
                                            : "text-muted",
                                )}
                            >
                                {step.label}
                            </span>
                            <span className="text-[10px] text-muted">
                                Step {step.num} of 2
                            </span>
                        </div>

                        {idx < steps.length - 1 && (
                            <div
                                className={cn(
                                    "mb-8 h-0.5 w-24 flex-shrink-0 transition-all sm:w-32",
                                    bvnDone ? "bg-green-500" : "bg-border",
                                )}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

// ─── BVN digit formatter (groups: XXX XXXX XXXX) ─────────────────────────────

function formatBvn(raw: string): string {
    const digits = raw.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
}

function stripNonDigits(value: string): string {
    return value.replace(/\D/g, "");
}

// ─── BVN Step ─────────────────────────────────────────────────────────────────

interface BvnStepProps {
    onSuccess: () => void;
}

function BvnStep({ onSuccess }: BvnStepProps) {
    const [displayValue, setDisplayValue] = React.useState("");
    const [verifyError, setVerifyError] = React.useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<VerifyBvnValues>({
        resolver: zodResolver(verifyBvnSchema),
        defaultValues: { bvn: "" },
    });

    const handleBvnInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = stripNonDigits(e.target.value);
        setValue("bvn", raw, { shouldValidate: true });
        setDisplayValue(formatBvn(raw));
        setVerifyError(null);
    };

    const onSubmit = async (values: VerifyBvnValues) => {
        setVerifyError(null);
        try {
            await mockVerifyBvn(values.bvn);
            toast.success("BVN verified! Proceed to NIN.");
            onSuccess();
        } catch (err) {
            const apiErr = err as ApiError;
            setVerifyError(apiErr.message ?? "BVN verification failed.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h2 className="text-xl font-bold text-ink">
                    Enter your Bank Verification Number
                </h2>
                <p className="text-sm text-body">
                    Your BVN is an 11-digit number issued by the CBN. It links your biometrics
                    to your bank accounts and is required to verify your identity.
                </p>
            </div>

            <div className="rounded-xl border border-violet-100 bg-violet-050 px-4 py-3">
                <p className="text-xs text-body">
                    <span className="font-semibold text-violet-700">How to get your BVN:</span>{" "}
                    Dial <span className="font-mono font-semibold">*565*0#</span> on any phone linked to your bank account.
                </p>
            </div>

            <form
                id="bvn-form"
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4"
                noValidate
            >
                {/* Hidden actual field for RHF */}
                <input type="hidden" {...register("bvn")} />

                <Field
                    label="BVN"
                    htmlFor="bvn-input"
                    error={errors.bvn?.message}
                >
                    <Input
                        id="bvn-input"
                        type="text"
                        inputMode="numeric"
                        placeholder="000 0000 0000"
                        maxLength={13} // 11 digits + 2 spaces
                        value={displayValue}
                        onChange={handleBvnInput}
                        autoComplete="off"
                        className="font-mono tracking-widest text-base"
                        aria-invalid={!!errors.bvn || !!verifyError}
                    />
                </Field>

                {/* API-level error (different from Zod validation) */}
                {verifyError && (
                    <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2.5">
                        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                        <p className="text-sm text-red-500">{verifyError}</p>
                    </div>
                )}

                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={isSubmitting}
                >
                    <ShieldCheck className="h-4 w-4" />
                    Verify BVN
                </Button>
            </form>

            {process.env.NEXT_PUBLIC_PROTOTYPE_MODE === "true" && (
                <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 text-center">
                    Mock mode — any valid 11-digit BVN works.
                    Use <code className="font-mono">00000000000</code> to trigger an error.
                </p>
            )}
        </div>
    );
}

// ─── NIN Step ─────────────────────────────────────────────────────────────────

interface NinStepProps {
    onSuccess: () => void;
}

function NinStep({ onSuccess }: NinStepProps) {
    const [displayValue, setDisplayValue] = React.useState("");
    const [verifyError, setVerifyError] = React.useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<VerifyNinValues>({
        resolver: zodResolver(verifyNinSchema),
        defaultValues: { nin: "" },
    });

    const handleNinInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = stripNonDigits(e.target.value);
        setValue("nin", raw, { shouldValidate: true });
        // NIN displayed as: XXXX XXXX XXX
        let fmt = raw;
        if (raw.length > 4) fmt = `${raw.slice(0, 4)} ${raw.slice(4)}`;
        if (raw.length > 8) fmt = `${raw.slice(0, 4)} ${raw.slice(4, 8)} ${raw.slice(8)}`;
        setDisplayValue(fmt);
        setVerifyError(null);
    };

    const onSubmit = async (values: VerifyNinValues) => {
        setVerifyError(null);
        try {
            await mockVerifyNin(values.nin);
            toast.success("NIN verified! You're fully verified.");
            onSuccess();
        } catch (err) {
            const apiErr = err as ApiError;
            setVerifyError(apiErr.message ?? "NIN verification failed.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h2 className="text-xl font-bold text-ink">
                    Enter your National Identification Number
                </h2>
                <p className="text-sm text-body">
                    Your NIN is an 11-digit number issued by NIMC. It uniquely identifies
                    you as a Nigerian citizen or resident.
                </p>
            </div>

            <div className="rounded-xl border border-violet-100 bg-violet-050 px-4 py-3">
                <p className="text-xs text-body">
                    <span className="font-semibold text-violet-700">Find your NIN:</span>{" "}
                    Dial <span className="font-mono font-semibold">*346#</span> on any network, or check your National ID card.
                </p>
            </div>

            <form
                id="nin-form"
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4"
                noValidate
            >
                <input type="hidden" {...register("nin")} />

                <Field
                    label="NIN"
                    htmlFor="nin-input"
                    error={errors.nin?.message}
                >
                    <Input
                        id="nin-input"
                        type="text"
                        inputMode="numeric"
                        placeholder="0000 0000 000"
                        maxLength={13}
                        value={displayValue}
                        onChange={handleNinInput}
                        autoComplete="off"
                        className="font-mono tracking-widest text-base"
                        aria-invalid={!!errors.nin || !!verifyError}
                    />
                </Field>

                {verifyError && (
                    <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2.5">
                        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                        <p className="text-sm text-red-500">{verifyError}</p>
                    </div>
                )}

                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={isSubmitting}
                >
                    <Fingerprint className="h-4 w-4" />
                    Verify NIN
                </Button>
            </form>

            {process.env.NEXT_PUBLIC_PROTOTYPE_MODE === "true" && (
                <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 text-center">
                    Mock mode — any valid 11-digit NIN works.
                    Use <code className="font-mono">00000000000</code> to trigger an error.
                </p>
            )}
        </div>
    );
}

// ─── Success screen ───────────────────────────────────────────────────────────

function KycSuccess({ userName }: { userName: string }) {
    const router = useRouter();

    return (
        <div className="space-y-6 text-center">
            {/* Animated success badge */}
            <div className="flex justify-center">
                <div className="relative flex h-24 w-24 items-center justify-center">
                    <div className="absolute inset-0 animate-ping rounded-full bg-green-500/20" />
                    <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-green-500/10">
                        <BadgeCheck className="h-12 w-12 text-green-500" />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-ink">
                    You&apos;re fully verified, {userName.split(" ")[0]}!
                </h2>
                <p className="text-sm text-body">
                    Your BVN and NIN have been verified. Tier 2 is now unlocked —
                    you can send and receive higher transaction amounts.
                </p>
            </div>

            {/* Tier badge */}
            <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-500">
                <ShieldCheck className="h-4 w-4" />
                Tier 2 Unlocked
            </div>

            <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => router.push("/overview")}
            >
                Go to Overview
                <ArrowRight className="h-4 w-4" />
            </Button>
        </div>
    );
}

// ─── KYC Page ─────────────────────────────────────────────────────────────────

type KycStep = "bvn" | "nin" | "done";

export default function KycPage() {
    const { user, updateKycTier } = useAuth();
    const [step, setStep] = React.useState<KycStep>("bvn");
    const bvnDone = step === "nin" || step === "done";
    const ninDone = step === "done";

    const handleBvnSuccess = () => {
        setStep("nin");
    };

    const handleNinSuccess = () => {
        updateKycTier("FULL_BVN_NIN");
        setStep("done");
    };

    return (
        <div className="flex min-h-screen items-start justify-center bg-bg px-4 py-12">
            <div className="w-full max-w-lg">
                {/* Card */}
                <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
                    {step !== "done" && (
                        <>
                            {/* Header */}
                            <div className="mb-8 space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">
                                    Identity Verification
                                </p>
                                <h1 className="text-2xl font-bold text-ink">
                                    Verify your identity
                                </h1>
                                <p className="text-sm text-body">
                                    Complete verification to unlock higher limits and full NePay features.
                                </p>
                            </div>

                            {/* Stepper */}
                            <div className="mb-8 flex justify-center">
                                <Stepper
                                    currentStep={step === "bvn" ? 1 : 2}
                                    bvnDone={bvnDone}
                                    ninDone={ninDone}
                                />
                            </div>

                            {/* Step divider */}
                            <div className="mb-6 h-px bg-border" />
                        </>
                    )}

                    {/* Step content */}
                    {step === "bvn" && <BvnStep onSuccess={handleBvnSuccess} />}
                    {step === "nin" && <NinStep onSuccess={handleNinSuccess} />}
                    {step === "done" && (
                        <KycSuccess userName={user?.name ?? "there"} />
                    )}
                </div>

                {/* Security disclaimer */}
                {step !== "done" && (
                    <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted">
                        <Lock className="h-3 w-3" />
                        Your data is encrypted and processed securely in line with CBN guidelines.
                    </p>
                )}
            </div>
        </div>
    );
}
