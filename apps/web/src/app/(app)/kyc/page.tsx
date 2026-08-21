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
    XCircle,
} from "lucide-react";
import { toast } from "sonner";

import {
    verifyBvnSchema,
    verifyNinSchema,
    type VerifyBvnValues,
    type VerifyNinValues,
} from "@/lib/schemas/kyc";
import {
    useKycStatus,
    useSubmitBvn,
    useSubmitNin,
} from "@/lib/queries/kyc";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/shared/button";
import { Field } from "@/components/shared/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/shared/spinner";
import { cn } from "@/lib/cn";

function apiErrorMessage(err: unknown, fallback: string): string {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
    return message ?? fallback;
}

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

// ─── BVN Number Step ──────────────────────────────────────────────────────────

interface BvnNumberStepProps {
    onApproved: () => void;
    onRejected: () => void;
}

function BvnNumberStep({ onApproved, onRejected }: BvnNumberStepProps) {
    const [displayValue, setDisplayValue] = React.useState("");
    const submitBvn = useSubmitBvn();

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<VerifyBvnValues>({
        resolver: zodResolver(verifyBvnSchema),
        defaultValues: { bvn: "" },
    });

    const handleBvnInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = stripNonDigits(e.target.value);
        setValue("bvn", raw, { shouldValidate: true });
        setDisplayValue(formatBvn(raw));
        submitBvn.reset();
    };

    const onSubmit = (values: VerifyBvnValues) => {
        submitBvn.mutate(
            { bvn: values.bvn },
            {
                onSuccess: (record) => {
                    if (record.status === "APPROVED") {
                        onApproved();
                        return;
                    }

                    if (record.status === "REJECTED") {
                        onRejected();
                        return;
                    }

                    toast.error("Verification is still pending. Please try again shortly.");
                },
                onError: (err) => {
                    toast.error(apiErrorMessage(err, "BVN verification failed."));
                },
            },
        );
    };

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h2 className="text-xl font-bold text-ink">
                    Enter your Bank Verification Number
                </h2>
                <p className="text-sm text-body">
                    Your BVN is an 11-digit number issued by the CBN. Korapay will verify it
                    against its identity records immediately.
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
                        aria-invalid={!!errors.bvn || submitBvn.isError}
                    />
                </Field>

                {submitBvn.isError && (
                    <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2.5">
                        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                        <p className="text-sm text-red-500">
                            {apiErrorMessage(submitBvn.error, "BVN verification failed.")}
                        </p>
                    </div>
                )}

                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={submitBvn.isPending}
                >
                    <ShieldCheck className="h-4 w-4" />
                    Verify BVN
                </Button>
            </form>
        </div>
    );
}

// ─── NIN Number Step ──────────────────────────────────────────────────────────

interface NinNumberStepProps {
    onApproved: () => void;
    onRejected: () => void;
}

function NinNumberStep({ onApproved, onRejected }: NinNumberStepProps) {
    const [displayValue, setDisplayValue] = React.useState("");
    const submitNin = useSubmitNin();

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
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
        submitNin.reset();
    };

    const onSubmit = (values: VerifyNinValues) => {
        submitNin.mutate(
            { nin: values.nin },
            {
                onSuccess: (record) => {
                    if (record.status === "APPROVED") {
                        onApproved();
                        return;
                    }

                    if (record.status === "REJECTED") {
                        onRejected();
                        return;
                    }

                    toast.error("Verification is still pending. Please try again shortly.");
                },
                onError: (err) => {
                    toast.error(apiErrorMessage(err, "NIN verification failed."));
                },
            },
        );
    };

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h2 className="text-xl font-bold text-ink">
                    Enter your National Identification Number
                </h2>
                <p className="text-sm text-body">
                    Your NIN is an 11-digit number issued by NIMC. Korapay will verify it
                    against its identity records immediately.
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
                        aria-invalid={!!errors.nin || submitNin.isError}
                    />
                </Field>

                {submitNin.isError && (
                    <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2.5">
                        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                        <p className="text-sm text-red-500">
                            {apiErrorMessage(submitNin.error, "NIN verification failed.")}
                        </p>
                    </div>
                )}

                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={submitNin.isPending}
                >
                    <Fingerprint className="h-4 w-4" />
                    Verify NIN
                </Button>
            </form>
        </div>
    );
}

// ─── Rejected screen ──────────────────────────────────────────────────────────

function KycRejected({ type }: { type: "BVN" | "NIN" }) {
    return (
        <div className="space-y-6 text-center">
            <div className="flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
                    <XCircle className="h-10 w-10 text-red-500" />
                </div>
            </div>
            <div className="space-y-2">
                <h2 className="text-xl font-bold text-ink">
                    We couldn&apos;t verify your {type}
                </h2>
                <p className="text-sm text-body">
                    This verification wasn&apos;t successful and can&apos;t be resubmitted from
                    here. Please contact support for help completing your verification.
                </p>
            </div>
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

type KycStep =
    | "bvn-number"
    | "bvn-rejected"
    | "nin-number"
    | "nin-rejected"
    | "done";

export default function KycPage() {
    const { user, updateKycTier } = useAuth();
    const { data: kycStatus, isLoading: statusLoading } = useKycStatus();

    const [step, setStep] = React.useState<KycStep | null>(null);

    // Once the account's real KYC status loads, jump straight to whichever
    // step it hasn't completed yet — a returning user shouldn't be asked to
    // resubmit a BVN/NIN that's already verified.
    React.useEffect(() => {
        if (step !== null || !kycStatus) return;

        if (kycStatus.ninVerified) {
            setStep("done");
        } else if (kycStatus.bvnVerified) {
            setStep("nin-number");
        } else {
            setStep("bvn-number");
        }
    }, [kycStatus, step]);

    const isDone = step === "done";
    const bvnDone =
        step === "nin-number" || step === "nin-rejected" || step === "done";
    const ninDone = step === "done";

    if (step === null || statusLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-bg">
                <Spinner label="Checking your verification status…" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-start justify-center bg-bg px-4 py-12">
            <div className="w-full max-w-lg">
                {/* Card */}
                <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
                    {!isDone && step !== "bvn-rejected" && step !== "nin-rejected" && (
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
                                    currentStep={step.startsWith("bvn") ? 1 : 2}
                                    bvnDone={bvnDone}
                                    ninDone={ninDone}
                                />
                            </div>

                            {/* Step divider */}
                            <div className="mb-6 h-px bg-border" />
                        </>
                    )}

                    {/* Step content */}
                    {step === "bvn-number" && (
                        <BvnNumberStep
                            onApproved={() => {
                                toast.success("BVN verified! Proceed to NIN.");
                                setStep("nin-number");
                            }}
                            onRejected={() => setStep("bvn-rejected")}
                        />
                    )}
                    {step === "bvn-rejected" && <KycRejected type="BVN" />}

                    {step === "nin-number" && (
                        <NinNumberStep
                            onApproved={() => {
                                // Both BVN and NIN are now APPROVED server-side, which is
                                // exactly the condition that promotes the account to
                                // FULL_BVN_NIN (see KycService.computeTier).
                                updateKycTier("FULL_BVN_NIN");
                                toast.success("NIN verified! You're fully verified.");
                                setStep("done");
                            }}
                            onRejected={() => setStep("nin-rejected")}
                        />
                    )}
                    {step === "nin-rejected" && <KycRejected type="NIN" />}

                    {isDone && <KycSuccess userName={user?.firstName ?? "there"} />}
                </div>

                {/* Security disclaimer */}
                {!isDone && step !== "bvn-rejected" && step !== "nin-rejected" && (
                    <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted">
                        <Lock className="h-3 w-3" />
                        Your data is encrypted and processed securely in line with CBN guidelines.
                    </p>
                )}
            </div>
        </div>
    );
}
