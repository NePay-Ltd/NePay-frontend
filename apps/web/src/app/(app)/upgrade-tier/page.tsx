"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { IconArrowLeft as ArrowLeft, IconLock as Lock } from "@/components/icons";
import { ShieldCheck, Medal, Check, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { useVirtualAccount, useUpgradeTier } from "@/lib/queries/wallet";
import { getApiErrorMessage } from "@/lib/api-client";
import { cn } from "@/lib/cn";

import { Button } from "@/components/shared/button";
import { Panel, PanelBody } from "@/components/shared/panel";
import { Field } from "@/components/shared/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/shared/skeletons";

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
        daily: "₦200,000/day",
        balance: "₦500,000 balance cap",
        medalText: "text-slate-500",
        medalBg: "bg-slate-200",
        ring: "ring-slate-300",
    },
    3: {
        label: "Gold",
        daily: "₦1,000,000+/day",
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

/** Mirrors kyc/page.tsx's KycSuccess badge exactly — same pulse-ring, same icon-in-circle, same pill — so a tier upgrade feels like the same class of milestone as finishing BVN verification, not a lesser one. */
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
                        ? "No more balance cap, and your daily limit is now ₦1,000,000+."
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
    const { mutate: upgrade, isPending } = useUpgradeTier();

    const [nin, setNin] = React.useState("");
    const [address, setAddress] = React.useState("");
    const [justReachedTier, setJustReachedTier] = React.useState<TierNumber | null>(null);

    const tier = (account?.tier ?? 1) as TierNumber;

    // Strictly sequential — Tier 1 can only ever request Tier 2 (NIN only),
    // never skip straight to Tier 3, even though VFD's own API would allow
    // it given both NIN and address at once. One step at a time, on
    // purpose: it keeps the form, the copy, and the success badge always
    // describing exactly one real transition instead of an ambiguous jump.
    const nextTier = (tier < 3 ? tier + 1 : null) as TierNumber | null;

    const handleSubmit = () => {
        if (!nextTier) return;

        const payload: { nin?: string; address?: string } = {};

        if (nextTier === 2) {
            if (nin.length !== 11) {
                toast.error("Enter your 11-digit NIN.");
                return;
            }
            payload.nin = nin;
        } else if (nextTier === 3) {
            if (!address.trim()) {
                toast.error("Enter your address.");
                return;
            }
            payload.address = address.trim();
        }

        upgrade(payload, {
            onSuccess: (updated) => {
                setNin("");
                setAddress("");
                setJustReachedTier(updated.tier as TierNumber);
            },
            onError: (err) => {
                toast.error(getApiErrorMessage(err, "Could not upgrade your tier."));
            },
        });
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

            {isLoading ? (
                <Skeleton className="h-72 w-full rounded-2xl" />
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
                                            No further verification needed — your account has no balance cap.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="h-4 w-4 text-violet-600" />
                                        <p className="text-sm font-bold text-ink">
                                            Step {nextTier - 1} of 2 &middot; Raise to Tier {nextTier} ({TIER_META[nextTier].label})
                                        </p>
                                    </div>

                                    {nextTier === 2 && (
                                        <Field label="National Identification Number (NIN)">
                                            <Input
                                                type="text"
                                                inputMode="numeric"
                                                placeholder="11-digit NIN"
                                                maxLength={11}
                                                value={nin}
                                                onChange={(e) => setNin(e.target.value.replace(/\D/g, "").slice(0, 11))}
                                                className="font-mono tracking-widest"
                                            />
                                        </Field>
                                    )}

                                    {nextTier === 3 && (
                                        <Field label="Home address">
                                            <Input
                                                type="text"
                                                placeholder="Street, city, state"
                                                value={address}
                                                onChange={(e) => setAddress(e.target.value)}
                                            />
                                        </Field>
                                    )}

                                    <Button
                                        variant="primary"
                                        fullWidth
                                        loading={isPending}
                                        onClick={handleSubmit}
                                    >
                                        Continue to Tier {nextTier}
                                    </Button>
                                </div>
                            )}
                        </PanelBody>
                    </Panel>

                    <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted">
                        <Lock className="h-3 w-3" />
                        Your NIN and address are sent for verification only and are never stored.
                    </p>
                </>
            )}
        </div>
    );
}
