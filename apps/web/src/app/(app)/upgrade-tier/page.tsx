"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { IconArrowLeft as ArrowLeft, IconLock as Lock } from "@/components/icons";
import { ShieldCheck, Medal, Check, ArrowRight, CheckCircle2, Upload } from "lucide-react";
import { subMonths } from "date-fns";
import { toast } from "sonner";

import { useVirtualAccount, useUpgradeTier } from "@/lib/queries/wallet";
import { useProfile } from "@/lib/queries/profile";
import { getApiErrorMessage } from "@/lib/api-client";
import { cn } from "@/lib/cn";

import { Button } from "@/components/shared/button";
import { Panel, PanelBody } from "@/components/shared/panel";
import { Field } from "@/components/shared/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/shared/skeletons";

/** Mirrors bridge-onboarding-form.tsx's own DocumentPicker exactly (same hidden-input + button shape, same JPEG/PNG/10MB allowlist) — kept local rather than imported since that one isn't exported, and this is the only other place that needs it. */
function DocumentPicker({ label, file, onChange }: { label: string; file: File | null; onChange: (file: File) => void }) {
    const inputRef = React.useRef<HTMLInputElement>(null);

    return (
        <Field label={label} hint="JPEG or PNG, max 10MB">
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onChange(f);
                    e.target.value = "";
                }}
            />
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex h-11 w-full items-center gap-2.5 rounded-sm border border-border bg-white px-3 text-sm text-ink transition-colors hover:border-violet-400"
            >
                {file ? (
                    <>
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                        <span className="truncate font-medium text-ink">{file.name}</span>
                        <span className="ml-auto shrink-0 text-xs font-semibold text-violet-600">Replace</span>
                    </>
                ) : (
                    <>
                        <Upload className="h-4 w-4 shrink-0 text-muted" />
                        <span className="text-muted">Choose a file</span>
                    </>
                )}
            </button>
        </Field>
    );
}

type TierNumber = 1 | 2 | 3;

/**
 * Bronze/Silver/Gold — a deliberate, real medal metaphor, not just a
 * numbered pill. Tier 3's gold and Tier 1's bronze are both warm tones on
 * purpose (amber/orange), kept visually distinct by hue (orange vs. yellow)
 * rather than just saturation, so they read differently at a glance.
 */
const TIER_META: Record<TierNumber, {
    label: string;
    daily: string;
    balance: string;
    medalText: string;
    medalBg: string;
    ring: string;
}> = {
    // Must match TIER_LIMITS (backend, deposit/tier-limits.ts) exactly — a
    // customer-facing promise that differs from what is enforced is a bug.
    1: {
        label: "Bronze",
        daily: "₦50,000/day",
        balance: "₦300,000 balance cap",
        medalText: "text-orange-700",
        medalBg: "bg-orange-100",
        ring: "ring-orange-300",
    },
    2: {
        label: "Silver",
        daily: "₦100,000/day",
        balance: "₦500,000 balance cap",
        medalText: "text-slate-500",
        medalBg: "bg-slate-200",
        ring: "ring-slate-300",
    },
    3: {
        label: "Gold",
        daily: "₦5,000,000/day",
        balance: "Unlimited balance",
        medalText: "text-amber-500",
        medalBg: "bg-amber-100",
        ring: "ring-amber-300",
    },
};

const TIER_ORDER: TierNumber[] = [1, 2, 3];

function TierMedal({ tier, state }: { tier: TierNumber; state: "current" | "unlocked" | "locked" }) {
    const meta = TIER_META[tier];
    return (
        <div
            className={cn(
                "relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
                state === "locked" ? "bg-gray-100 dark:bg-white/5" : meta.medalBg,
                state === "current" && `ring-2 ring-offset-2 ${meta.ring} dark:ring-offset-[#0b0b0f]`,
            )}
        >
            <Medal className={cn("h-6 w-6", state === "locked" ? "text-muted" : meta.medalText)} strokeWidth={2} />
            {state === "unlocked" && (
                <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 ring-2 ring-white dark:ring-[#0b0b0f]">
                    <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                </span>
            )}
        </div>
    );
}

/** Mirrors kyc/page.tsx's KycSuccess badge so a tier upgrade feels like the same class of milestone as completing identity verification. */
function TierSuccessBadge({ tier, onContinue }: { tier: TierNumber; onContinue: () => void }) {
    const meta = TIER_META[tier];

    return (
        <div className="space-y-6 py-2 text-center">
            <div className="flex justify-center">
                <div className="relative flex h-24 w-24 items-center justify-center">
                    <div className={cn("absolute inset-0 animate-ping rounded-full", meta.medalBg)} />
                    <div className={cn("relative flex h-24 w-24 items-center justify-center rounded-full", meta.medalBg)}>
                        <Medal className={cn("h-12 w-12", meta.medalText)} strokeWidth={2} />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <h2 className="text-xl font-bold text-ink">
                    {tier === 3 ? "You've reached Gold — the highest tier!" : `You've unlocked ${meta.label} — Tier ${tier}!`}
                </h2>
                <p className="text-sm text-body">
                    {tier === 3
                        ? "No more balance cap, and your daily limit is now ₦5,000,000."
                        : `Your daily limit is now ${meta.daily}, with a ${meta.balance.toLowerCase()}.`}
                </p>
            </div>

            <div className={cn("mx-auto inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold", meta.medalBg, meta.medalText)}>
                <Medal className="h-4 w-4" />
                Tier {tier} · {meta.label} verified
            </div>

            <Button variant="primary" size="lg" fullWidth onClick={onContinue}>
                Continue
                <ArrowRight className="h-4 w-4" />
            </Button>
        </div>
    );
}

export default function UpgradeTierPage() {
    const router = useRouter();
    const { data: account, isLoading } = useVirtualAccount();
    const { data: profile, isLoading: isProfileLoading } = useProfile();
    const { mutate: upgrade, isPending } = useUpgradeTier();

    const [tier2Identity, setTier2Identity] = React.useState("");
    const [address, setAddress] = React.useState("");
    const [document, setDocument] = React.useState<File | null>(null);
    const [documentDate, setDocumentDate] = React.useState("");
    const [justReachedTier, setJustReachedTier] = React.useState<TierNumber | null>(null);
    const [upgradeError, setUpgradeError] = React.useState<string | null>(null);

    // NIN approval creates Tier 1 and the virtual account. `account?.tier ?? 1`
    // is a safe floor while that account is still syncing.
    const verified = profile?.kycVerified === true;
    const tier = (account?.tier ?? 1) as TierNumber;
    const usesLegacyNinForTier2 = account
        ? new Date(account.createdAt).getTime() < Date.UTC(2026, 9, 22)
        : false;

    // Strictly sequential — Tier 1 can only ever request Tier 2 (BVN for
    // NIN-created accounts; NIN for legacy BVN-created accounts),
    // never skip straight to Tier 3, even though VFD's own API would allow
    // it given both NIN and address at once. One step at a time, on
    // purpose: it keeps the form, the copy, and the success badge always
    // describing exactly one real transition instead of an ambiguous jump.
    const nextTier = (tier < 3 ? tier + 1 : null) as TierNumber | null;

    const handleSubmit = () => {
        if (!nextTier) return;

        const dto: { bvn?: string; nin?: string; address?: string; documentDate?: string } = {};
        let file: File | undefined;

        if (nextTier === 2) {
            if (tier2Identity.length !== 11) {
                toast.error(`Enter your 11-digit ${usesLegacyNinForTier2 ? "NIN" : "BVN"}.`);
                return;
            }
            if (usesLegacyNinForTier2) dto.nin = tier2Identity;
            else dto.bvn = tier2Identity;
        } else if (nextTier === 3) {
            if (!address.trim()) {
                toast.error("Enter your address.");
                return;
            }
            if (!document) {
                toast.error("Upload a proof-of-address document (a recent utility bill or similar).");
                return;
            }
            if (!documentDate) {
                toast.error("Enter the date on your proof-of-address document.");
                return;
            }
            // Fast client-side feedback only — the server re-checks this
            // authoritatively (see VirtualAccountService.upgradeTier's
            // isRecentEnough), since that's what actually matters.
            const billDate = new Date(documentDate);
            const now = new Date();
            if (billDate > now || billDate < subMonths(now, 3)) {
                toast.error("The document must be dated within the last 3 months.");
                return;
            }
            dto.address = address.trim();
            dto.documentDate = documentDate;
            file = document;
        }

        upgrade(
            { dto, document: file },
            {
                onSuccess: (updated) => {
                    setUpgradeError(null);
                    setTier2Identity("");
                    setAddress("");
                    setDocument(null);
                    setDocumentDate("");
                    setJustReachedTier(updated.tier as TierNumber);
                },
                onError: (err) => {
                    setUpgradeError(getApiErrorMessage(err, "Could not upgrade your tier."));
                },
            },
        );
    };

    return (
        <div className="w-full max-w-lg mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-ink">Unlock Higher Limits</h1>
                    <p className="mt-0.5 text-sm text-body">
                        Verify a bit more, one step at a time, to raise your limits.
                    </p>
                </div>
            </div>

            {isLoading || isProfileLoading ? (
                <Skeleton className="h-72 w-full rounded-2xl" />
            ) : !verified ? (
                <Panel>
                    <PanelBody>
                        <div className="flex flex-col items-center gap-3 py-6 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-white/5">
                                <Lock className="h-5 w-5 text-muted" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-ink">Verify your NIN first</p>
                                <p className="mt-1 text-sm text-body">
                                    Your virtual account is created when your NIN is verified. Complete that first,
                                    then come back here to raise your limits further.
                                </p>
                            </div>
                            <Button variant="primary" size="lg" fullWidth onClick={() => router.push("/kyc")}>
                                Verify NIN
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </PanelBody>
                </Panel>
            ) : (
                <>
                    <Panel>
                        <PanelBody className="space-y-2.5">
                            {TIER_ORDER.map((t) => {
                                const meta = TIER_META[t];
                                const state = t === tier ? "current" : t < tier ? "unlocked" : "locked";

                                return (
                                    <div
                                        key={t}
                                        className={cn(
                                            "flex items-center gap-3 rounded-xl border px-3 py-3 transition-colors",
                                            state === "current"
                                                ? "border-violet-200 bg-violet-050 dark:border-violet-900/40 dark:bg-violet-900/10"
                                                : "border-border",
                                        )}
                                    >
                                        <TierMedal tier={t} state={state} />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-ink">
                                                    Tier {t} · {meta.label}
                                                </span>
                                                {state === "current" && (
                                                    <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                                        Current
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted mt-0.5">
                                                {meta.daily} &middot; {meta.balance}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </PanelBody>
                    </Panel>

                    <Panel>
                        <PanelBody>
                            {justReachedTier ? (
                                <TierSuccessBadge
                                    tier={justReachedTier}
                                    onContinue={() => setJustReachedTier(null)}
                                />
                            ) : !nextTier ? (
                                <div className="flex flex-col items-center gap-3 py-4 text-center">
                                    <TierMedal tier={3} state="current" />
                                    <div>
                                        <p className="text-sm font-bold text-ink">You&apos;re at the highest tier</p>
                                        <p className="mt-1 text-sm text-body">
                                            No further verification needed, your account has no balance cap.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="h-4 w-4 text-violet-600" />
                                        <p className="text-sm font-bold text-ink">
                                            Raise to Tier {nextTier} ({TIER_META[nextTier].label})
                                        </p>
                                    </div>

                                    {nextTier === 2 && (
                                        <Field label={usesLegacyNinForTier2 ? "National Identification Number (NIN)" : "Bank Verification Number (BVN)"}>
                                            <Input
                                                type="text"
                                                inputMode="numeric"
                                                placeholder={`11-digit ${usesLegacyNinForTier2 ? "NIN" : "BVN"}`}
                                                maxLength={11}
                                                value={tier2Identity}
                                                onChange={(e) => {
                                                    setTier2Identity(e.target.value.replace(/\D/g, "").slice(0, 11));
                                                    setUpgradeError(null);
                                                }}
                                                className="font-mono tracking-widest"
                                            />
                                        </Field>
                                    )}

                                    {nextTier === 3 && (
                                        <>
                                            <Field label="Home address">
                                                <Input
                                                    type="text"
                                                    placeholder="Street, city, state"
                                                    value={address}
                                                    onChange={(e) => {
                                                        setAddress(e.target.value);
                                                        setUpgradeError(null);
                                                    }}
                                                />
                                            </Field>

                                            <DocumentPicker
                                                label="Proof of address"
                                                file={document}
                                                onChange={(file) => {
                                                    setDocument(file);
                                                    setUpgradeError(null);
                                                }}
                                            />

                                            <Field label="Document date" hint="Must be dated within the last 3 months">
                                                <Input
                                                    type="date"
                                                    value={documentDate}
                                                    onChange={(e) => {
                                                        setDocumentDate(e.target.value);
                                                        setUpgradeError(null);
                                                    }}
                                                />
                                            </Field>
                                        </>
                                    )}

                                    {upgradeError && (
                                        <div
                                            role="alert"
                                            className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-sm text-red-600"
                                        >
                                            <p>{upgradeError}</p>
                                            <p className="mt-1">
                                                Check the identity details or proof-of-address information, update them above, and try again.
                                                Your entries are still here.
                                            </p>
                                        </div>
                                    )}

                                    <Button
                                        variant="primary"
                                        fullWidth
                                        loading={isPending}
                                        onClick={handleSubmit}
                                    >
                                        {upgradeError ? `Try Tier ${nextTier} again` : `Continue to Tier ${nextTier}`}
                                    </Button>
                                </div>
                            )}
                        </PanelBody>
                    </Panel>

                    <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted">
                        <Lock className="h-3 w-3" />
                        Your identity number and proof of address are encrypted and securely retained for verification and
                        fraud-prevention purposes. Your typed address itself is never stored.
                    </p>
                </>
            )}
        </div>
    );
}
