"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { IconArrowLeft as ArrowLeft, IconLock as Lock } from "@/components/icons";
import { ShieldCheck, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { useVirtualAccount, useUpgradeTier } from "@/lib/queries/wallet";
import { getApiErrorMessage } from "@/lib/api-client";

import { Button } from "@/components/shared/button";
import { Panel, PanelBody } from "@/components/shared/panel";
import { Field } from "@/components/shared/field";
import { Input } from "@/components/ui/input";
import { Tag } from "@/components/shared/tag";
import { Skeleton } from "@/components/shared/skeletons";

const TIERS = [
    { tier: 1, daily: "N50,000/day", balance: "N300,000 balance cap", requires: "BVN (already done)" },
    { tier: 2, daily: "N200,000/day", balance: "N500,000 balance cap", requires: "NIN" },
    { tier: 3, daily: "N1,000,000+/day", balance: "Unlimited balance", requires: "NIN + address" },
];

export default function UpgradeTierPage() {
    const router = useRouter();
    const { data: account, isLoading } = useVirtualAccount();
    const { mutate: upgrade, isPending } = useUpgradeTier();

    const [nin, setNin] = React.useState("");
    const [address, setAddress] = React.useState("");

    const tier = account?.tier ?? 1;

    const handleSubmit = () => {
        const payload: { nin?: string; address?: string } = {};

        if (tier === 1) {
            if (nin.length !== 11) {
                toast.error("Enter your 11-digit NIN.");
                return;
            }
            payload.nin = nin;
            if (address.trim()) payload.address = address.trim();
        } else if (tier === 2) {
            if (!address.trim()) {
                toast.error("Enter your address.");
                return;
            }
            payload.address = address.trim();
        }

        upgrade(payload, {
            onSuccess: (updated) => {
                toast.success(`You're now Tier ${updated.tier}.`);
                setNin("");
                setAddress("");
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
                        Verify a bit more to raise your daily and balance limits.
                    </p>
                </div>
            </div>

            {isLoading ? (
                <Skeleton className="h-64 w-full rounded-2xl" />
            ) : (
                <>
                    <Panel>
                        <PanelBody className="space-y-3">
                            {TIERS.map((t) => (
                                <div
                                    key={t.tier}
                                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5"
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-ink">Tier {t.tier}</span>
                                            {tier === t.tier && <Tag variant="ok" dot>Current</Tag>}
                                            {tier > t.tier && <Tag variant="neutral">Unlocked</Tag>}
                                        </div>
                                        <p className="text-xs text-muted mt-0.5">
                                            {t.daily} &middot; {t.balance}
                                        </p>
                                    </div>
                                    <span className="text-xs text-muted text-right">{t.requires}</span>
                                </div>
                            ))}
                        </PanelBody>
                    </Panel>

                    <Panel>
                        <PanelBody>
                            {tier >= 3 ? (
                                <div className="flex flex-col items-center text-center gap-3 py-4">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                                        <CheckCircle2 className="h-8 w-8 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-ink">You&apos;re at the highest tier</p>
                                        <p className="text-sm text-body mt-1">
                                            No further verification needed — your account has no balance cap.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="h-4 w-4 text-violet-600" />
                                        <p className="text-sm font-bold text-ink">
                                            {tier === 1 ? "Raise to Tier 2 or 3" : "Raise to Tier 3"}
                                        </p>
                                    </div>

                                    {tier === 1 && (
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

                                    <Field
                                        label={tier === 1 ? "Home address (optional — jump straight to Tier 3)" : "Home address"}
                                    >
                                        <Input
                                            type="text"
                                            placeholder="Street, city, state"
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                        />
                                    </Field>

                                    <Button
                                        variant="primary"
                                        fullWidth
                                        loading={isPending}
                                        onClick={handleSubmit}
                                    >
                                        Submit
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
