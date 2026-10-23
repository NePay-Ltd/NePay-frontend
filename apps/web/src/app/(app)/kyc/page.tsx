"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconBuilding as Building2, IconCard as CreditCard, IconClock as Clock, IconLock as Lock } from "@/components/icons";
import { ShieldCheck, AlertCircle, ArrowRight, BadgeCheck, XCircle } from "lucide-react";;
import { toast } from "sonner";

import {
    verifyNinSchema,
    type VerifyNinValues,
} from "@/lib/schemas/kyc";
import {
    useKycStatus,
    useSubmitNin,
    kycKeys,
} from "@/lib/queries/kyc";
import { walletKeys } from "@/lib/queries/wallet";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/shared/button";
import { Field } from "@/components/shared/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/shared/spinner";
import { BridgeOnboardingForm } from "@/components/shared/bridge-onboarding-form";
import { BridgeTosConsent } from "@/components/shared/bridge-tos-consent";
import { useBridgeAccountFee, useBridgeCustomer } from "@/lib/queries/bridge";
import { cn } from "@/lib/cn";

import { getApiErrorMessage } from "@/lib/api-client";

// ─── NIN digit formatter (groups: XXX XXXX XXXX) ─────────────────────────────

function formatNin(raw: string): string {
    const digits = raw.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
}

function stripNonDigits(value: string): string {
    return value.replace(/\D/g, "");
}

// ─── NIN Number Step ──────────────────────────────────────────────────────────

interface NinNumberStepProps {
    onApproved: () => void;
    onRejected: (reason: string | null, requiresAdminReview: boolean) => void;
}

function NinNumberStep({ onApproved, onRejected }: NinNumberStepProps) {
    const [displayValue, setDisplayValue] = React.useState("");
    const [dateOfBirth, setDateOfBirth] = React.useState("");
    const submitNin = useSubmitNin();

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<VerifyNinValues>({
        resolver: zodResolver(verifyNinSchema),
        defaultValues: { nin: "", dateOfBirth: "" },
    });

    const handleNinInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = stripNonDigits(e.target.value);
        setValue("nin", raw, { shouldValidate: true });
        setDisplayValue(formatNin(raw));
        submitNin.reset();
    };

    const onSubmit = (values: VerifyNinValues) => {
        submitNin.mutate(
            { nin: values.nin, dateOfBirth: values.dateOfBirth },
            {
                onSuccess: (record) => {
                    if (record.status === "APPROVED") {
                        onApproved();
                        return;
                    }

                    if (record.status === "REJECTED") {
                        onRejected(record.failureReason, record.duplicateReviewRequired);
                        return;
                    }

                    toast.error("Verification is still pending. Please try again shortly.");
                },
                onError: (err) => {
                    toast.error(getApiErrorMessage(err, "NIN verification failed."));
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
                    Your NIN is an 11-digit number issued by NIMC. We&apos;ll verify it
                    with your date of birth to set up your account.
                </p>
            </div>

            <div className="rounded-xl border border-violet-100 bg-violet-050 px-4 py-3">
                <p className="text-xs text-body">
                    <span className="font-semibold text-violet-700">Where to find your NIN:</span>{" "}
                    Check your NIN slip or use an official NIMC retrieval channel.
                </p>
            </div>

            <form
                id="nin-form"
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4"
                noValidate
            >
                <input type="hidden" {...register("nin")} />
                <input type="hidden" {...register("dateOfBirth")} />

                <Field
                    label="NIN"
                    htmlFor="nin-input"
                    error={errors.nin?.message}
                >
                    <Input
                        id="nin-input"
                        type="text"
                        inputMode="numeric"
                        placeholder="000 0000 0000"
                        maxLength={13} // 11 digits + 2 spaces
                        value={displayValue}
                        onChange={handleNinInput}
                        autoComplete="off"
                        className="font-mono tracking-widest text-base"
                        aria-invalid={!!errors.nin || submitNin.isError}
                    />
                </Field>

                <Field
                    label="Date of birth"
                    htmlFor="nin-date-of-birth"
                    error={errors.dateOfBirth?.message}
                >
                    <Input
                        id="nin-date-of-birth"
                        type="date"
                        value={dateOfBirth}
                        onChange={(event) => {
                            const value = event.target.value;
                            setDateOfBirth(value);
                            setValue("dateOfBirth", value, { shouldValidate: true });
                            submitNin.reset();
                        }}
                        max={new Date().toISOString().slice(0, 10)}
                        aria-invalid={!!errors.dateOfBirth || submitNin.isError}
                    />
                </Field>

                {submitNin.isError && (
                    <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2.5">
                        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                        <p className="text-sm text-red-500">
                            {getApiErrorMessage(submitNin.error, "NIN verification failed.")}
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
                    <ShieldCheck className="h-4 w-4" />
                    Verify NIN
                </Button>
            </form>
        </div>
    );
}

// ─── Rejected screen ──────────────────────────────────────────────────────────

function KycRejected({
    type,
    reason,
    onRetry,
    onContactSupport,
}: {
    type: "NIN";
    reason: string | null;
    onRetry: () => void;
    onContactSupport: () => void;
}) {
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
                    {reason ?? "We couldn't match these details to an identity record."}
                </p>
                <p className="text-sm text-body">
                    Check that your 11-digit NIN and date of birth match your NIMC record, then try again.
                    If your NIN is already linked to another NePay account, contact support.
                </p>
            </div>
            <div className="space-y-3">
                <Button variant="primary" size="lg" fullWidth onClick={onRetry}>
                    Edit details and try again
                </Button>
                <Button variant="ghost" size="lg" fullWidth onClick={onContactSupport}>
                    Contact support
                </Button>
            </div>
        </div>
    );
}

// ─── Optional Bridge (foreign account) step ────────────────────────────────────

/**
 * Offered once, right after a fresh NIN approval. Skipping is a real,
 * equally-valid choice: Bridge KYC is reachable independently, any time,
 * from the Foreign Accounts page (no longer gated behind identity verification) — see the
 * user's own explicit call on keeping identity verification sufficient for the Naira
 * wallet, with this bundled in as a convenience rather than a second
 * mandatory gate.
 */
function BridgeOptionalStep({ onDone }: { onDone: () => void }) {
    const [expanded, setExpanded] = React.useState(false);
    // Reacts automatically once BridgeOnboardingForm's own submit succeeds —
    // its mutation invalidates this same query, so `customer` appears here
    // with no extra plumbing needed between the form and this step.
    const { data: customer } = useBridgeCustomer();
    // Safe to call before a Bridge customer even exists — GET /bridge/accounts/fee
    // doesn't require one. Surfaced here so the fee is disclosed up front,
    // before the user commits to filling out Bridge's onboarding form, not
    // just on the Foreign Accounts page afterward.
    const { data: fee } = useBridgeAccountFee();
    const feeNotice = fee?.required ? (
        <p className="text-xs text-muted">
            Heads up: a one-time ${fee.amountUsd} fee{fee.amountNgn ? ` (about ₦${Number(fee.amountNgn).toLocaleString()} today)` : ""} applies
            once you&apos;re verified, before your first account. It covers both USD and EUR, and is charged once from your Naira wallet.
        </p>
    ) : null;

    // The form was submitted (this render or an earlier one): the Bridge
    // customer now exists, which means it may still need ToS acceptance
    // before it's actually usable — show that here rather than jumping
    // straight to "done" and letting the user believe everything's
    // finished when Bridge itself isn't done reviewing yet.
    if (customer) {
        const needsTos = !customer.hasAcceptedTermsOfService && customer.tosLink;
        return (
            <div className="space-y-5">
                <div className="space-y-1 text-center">
                    <h2 className="text-xl font-bold text-ink">
                        {needsTos ? "One last thing" : "Verification submitted"}
                    </h2>
                    <p className="text-sm text-body">
                        {needsTos
                            ? "Accept Bridge's terms to finish setting up your foreign accounts."
                            : "Bridge is reviewing your details. This can take a few minutes. You can check progress anytime from Foreign Accounts."}
                    </p>
                </div>
                {needsTos ? <BridgeTosConsent customer={customer} /> : null}
                <Button variant="primary" size="lg" fullWidth onClick={onDone}>
                    Continue
                </Button>
            </div>
        );
    }

    if (expanded) {
        return (
            <div className="space-y-4">
                <button
                    type="button"
                    onClick={() => setExpanded(false)}
                    className="text-sm font-semibold text-violet-600 hover:text-violet-700"
                >
                    ← Back
                </button>
                {feeNotice}
                <BridgeOnboardingForm bare />
            </div>
        );
    }

    return (
        <div className="space-y-6 text-center">
            <div className="flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-violet-500/10">
                    <Building2 className="h-10 w-10 text-violet-500" />
                </div>
            </div>
            <div className="space-y-2">
                <h2 className="text-xl font-bold text-ink">Want to receive USD or EUR too?</h2>
                <p className="text-sm text-body">
                    Add a few more details now to get real foreign account numbers you can share with clients or employers abroad. It lands in your Naira wallet automatically. You can always do this later from Foreign Accounts instead.
                </p>
                {feeNotice}
            </div>
            <div className="space-y-2">
                <Button variant="primary" size="lg" fullWidth onClick={() => setExpanded(true)}>
                    Add foreign account details
                </Button>
                <Button variant="ghost" size="lg" fullWidth onClick={onDone}>
                    Skip for now
                </Button>
            </div>
        </div>
    );
}

// ─── Success screen ───────────────────────────────────────────────────────────

/**
 * Surfaces the caller's Bridge (foreign account) application status on
 * every visit to this page once NIN verification is done — not just the one-time
 * post-approval offer in BridgeOptionalStep, which a returning user never
 * sees again once NIN is verified (see KycPage's own step logic). Without
 * this, someone who submitted Bridge details and got rejected later
 * (rejection often lands after they've already left this page) would have
 * no visible nudge to go fix it unless they happened to open Foreign
 * Accounts on their own.
 *
 * Renders nothing once the customer is `active` — the user asked for the
 * banner to stop bothering people once they're approved, and an active
 * customer has nothing left to act on here.
 */
function BridgeStatusBanner() {
    const router = useRouter();
    const { data: customer } = useBridgeCustomer();

    if (!customer || customer.status === "active") {
        return null;
    }

    if (customer.status === "rejected") {
        return (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-left dark:border-red-900/30 dark:bg-red-900/10">
                <XCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-500" />
                <div className="flex-1 space-y-2">
                    <p className="text-sm font-bold text-red-900 dark:text-red-400">
                        Your foreign account application was declined
                    </p>
                    <p className="text-sm text-red-800 dark:text-red-500">
                        {customer.rejectionReasons?.[0]?.reason ?? "Bridge could not verify the details you submitted."} You can fix this and try again.
                    </p>
                    <Button size="sm" variant="primary" onClick={() => router.push("/foreign-accounts")}>
                        Retry now
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left dark:border-amber-900/30 dark:bg-amber-900/10">
            <Clock className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500" />
            <div className="flex-1 space-y-2">
                <p className="text-sm font-bold text-amber-900 dark:text-amber-400">
                    Your foreign account application is being reviewed
                </p>
                <p className="text-sm text-amber-800 dark:text-amber-500">
                    This usually resolves within a few minutes. You can check progress anytime.
                </p>
                <Button size="sm" variant="quiet" onClick={() => router.push("/foreign-accounts")}>
                    Check status
                </Button>
            </div>
        </div>
    );
}

function KycSuccess({ userName }: { userName: string }) {
    const router = useRouter();

    return (
        <div className="space-y-6 text-center">
            <BridgeStatusBanner />

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
                    Your identity is verified. NePay sets up your virtual account
                    automatically after approval. If it doesn&apos;t appear, contact
                    support. You can raise your limits from Account Tiers.
                </p>
            </div>

            {/* Verified badge */}
            <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-500">
                <ShieldCheck className="h-4 w-4" />
                Identity verified
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

type KycStep = "nin-number" | "nin-rejected" | "nin-duplicate-review" | "bridge-optional" | "done";

export default function KycPage() {
    const router = useRouter();
    const { user, markKycVerified } = useAuth();
    const { data: kycStatus, isLoading: statusLoading } = useKycStatus();
    const queryClient = useQueryClient();

    const [step, setStep] = React.useState<KycStep | null>(null);
    const [rejectionReason, setRejectionReason] = React.useState<string | null>(null);

    // Once the account's real KYC status loads, jump straight to whichever
    // step applies — a returning user shouldn't be asked to resubmit a NIN
    // that's already approved server-side.
    React.useEffect(() => {
        if (step !== null || !kycStatus) return;

        setStep(kycStatus.verified ? "done" : kycStatus.retryBlockedByReview ? "nin-duplicate-review" : "nin-number");
    }, [kycStatus, step]);

    React.useEffect(() => {
        if (step === "nin-duplicate-review" && kycStatus && !kycStatus.retryBlockedByReview) {
            setRejectionReason(null);
            setStep("nin-number");
        }
    }, [kycStatus, step]);

    const isDone = step === "done";

    if (step === null || statusLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-bg">
                <Spinner label="Checking your verification status…" />
            </div>
        );
    }

    const wide = step === "bridge-optional";

    return (
        <div className="flex min-h-screen items-start justify-center bg-bg px-4 py-12">
            <div className={cn("w-full", wide ? "max-w-2xl" : "max-w-lg")}>
                {/* Card */}
                <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
                    {!isDone && step !== "nin-rejected" && step !== "nin-duplicate-review" && step !== "bridge-optional" && (
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

                            {/* Step divider */}
                            <div className="mb-6 h-px bg-border" />
                        </>
                    )}

                    {/* Step content */}
                    {step === "nin-number" && (
                        <NinNumberStep
                            onApproved={() => {
                                // NIN approval also auto-provisions the virtual
                                // account server-side (NinVerifiedListener, via
                                // publishAndWait) — but the client's own cached
                                // "no virtual account yet" result from before
                                // approval doesn't know that on its own.
                                // Confirmed live 2026-09-26: without this
                                // invalidation, a user could pass NIN
                                // verification while the virtual-account query
                                // was already cached empty/404 from an earlier
                                // visit, and keep seeing stale account data even
                                // though the account now exists server-side.
                                queryClient.invalidateQueries({ queryKey: walletKeys.virtualAccount() });
                                markKycVerified();
                                toast.success("NIN verified!");
                                setStep("bridge-optional");
                            }}
                            onRejected={(reason, requiresAdminReview) => {
                                setRejectionReason(reason);
                                if (requiresAdminReview) {
                                    queryClient.setQueryData(kycKeys.status(), (current: typeof kycStatus) => ({
                                        verified: current?.verified ?? false,
                                        retryBlockedByReview: true,
                                    }));
                                    void queryClient.invalidateQueries({ queryKey: kycKeys.status() });
                                    setStep("nin-duplicate-review");
                                } else {
                                    setStep("nin-rejected");
                                }
                            }}
                        />
                    )}
                    {step === "nin-rejected" && (
                        <KycRejected
                            type="NIN"
                            reason={rejectionReason}
                            onRetry={() => {
                                setRejectionReason(null);
                                setStep("nin-number");
                            }}
                            onContactSupport={() => router.push("/support")}
                        />
                    )}
                    {step === "nin-duplicate-review" && (
                        <div className="space-y-4 text-center" role="status" aria-live="polite">
                            <h2 className="text-xl font-bold text-ink">Your NIN needs a review</h2>
                            <p className="text-sm text-body">
                                {rejectionReason ?? "This NIN is already linked to another NePay account."} Our team is
                                reviewing the account that submitted it. You can retry once the review is complete; we’ll
                                email you when retry is available.
                            </p>
                            <p className="text-xs text-muted">This screen will update automatically after the review.</p>
                        </div>
                    )}
                    {step === "bridge-optional" && <BridgeOptionalStep onDone={() => setStep("done")} />}

                    {isDone && <KycSuccess userName={user?.firstName ?? "there"} />}
                </div>

                {/* Security disclaimer */}
                {!isDone && step !== "nin-rejected" && step !== "nin-duplicate-review" && step !== "bridge-optional" && (
                    <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted">
                        <Lock className="h-3 w-3" />
                        Your data is encrypted and processed securely in line with CBN guidelines.
                    </p>
                )}
            </div>
        </div>
    );
}
