"use client";

import * as React from "react";
import { Copy, MessageCircle, Twitter, Users, Share2 } from "lucide-react";
import { toast } from "sonner";

import { useReferralSummary } from "@/lib/queries/referrals";
import { Button } from "@/components/shared/button";
import { Panel, PanelBody, PanelHeader } from "@/components/shared/panel";
import { Skeleton } from "@/components/shared/skeletons";

export default function ReferAndEarnPage() {
    const { data: referral, isLoading, isError } = useReferralSummary();
    const link = referral && typeof window !== "undefined"
        ? `${window.location.origin}/register?ref=${encodeURIComponent(referral.referralCode)}`
        : "";

    const share = (url: string) => {
        if (!link) return;
        window.open(url.replace("__LINK__", encodeURIComponent(link)), "_blank");
    };

    const copyLink = async () => {
        if (!link) return;
        await navigator.clipboard.writeText(link);
        toast.success("Referral link copied!");
    };

    return (
        <div className="mx-auto max-w-3xl space-y-6 pb-12">
            <div className="flex flex-col py-4">
                <h1 className="text-2xl font-bold text-ink">Refer & Earn</h1>
                <p className="mt-1 max-w-lg text-sm text-body">
                    Share your link and earn referral points when a friend signs up, completes KYC, and makes their first deposit.
                </p>
            </div>

            <Panel>
                <PanelBody className="flex flex-col gap-4 p-5 sm:p-6">
                    <div className="flex w-full items-center justify-between rounded-lg border border-border bg-gray-50 px-4 py-3">
                        {isLoading ? <Skeleton className="h-5 w-48" /> : <code className="text-sm font-semibold text-ink">{link || "Unavailable"}</code>}
                        <button onClick={copyLink} disabled={!link} className="p-1 text-violet-600 disabled:opacity-40" aria-label="Copy referral link">
                            <Copy className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-row">
                        <Button variant="primary" className="w-full sm:flex-1" onClick={copyLink} disabled={!link}><Copy className="mr-2 h-4 w-4" />Copy Link</Button>
                        <Button variant="ghost" className="w-full border border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10 sm:flex-1" onClick={() => share("https://wa.me/?text=Join%20me%20on%20NePay%3A%20__LINK__")} disabled={!link}><MessageCircle className="mr-2 h-4 w-4" />WhatsApp</Button>
                        <Button variant="ghost" className="col-span-2 w-full border border-[#1DA1F2] text-[#1DA1F2] hover:bg-[#1DA1F2]/10 sm:flex-1" onClick={() => share("https://twitter.com/intent/tweet?text=Join%20me%20on%20NePay%3A%20__LINK__")} disabled={!link}><Twitter className="mr-2 h-4 w-4" />Share on X</Button>
                    </div>
                    {isError && <p className="text-sm text-red-600">Referral information is temporarily unavailable.</p>}
                </PanelBody>
            </Panel>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <Panel><PanelBody className="flex flex-col items-center p-5 text-center"><Users className="h-5 w-5 text-violet-600" /><span className="mt-2 text-xs font-medium uppercase tracking-wider text-muted">Total referrals</span>{isLoading ? <Skeleton className="mt-2 h-8 w-12" /> : <span className="mt-1 font-mono text-2xl font-bold text-ink">{referral?.totalReferred ?? 0}</span>}</PanelBody></Panel>
                <Panel><PanelBody className="flex flex-col items-center p-5 text-center"><Share2 className="h-5 w-5 text-green-600" /><span className="mt-2 text-xs font-medium uppercase tracking-wider text-muted">Verified</span>{isLoading ? <Skeleton className="mt-2 h-8 w-12" /> : <span className="mt-1 font-mono text-2xl font-bold text-ink">{referral?.verifiedCount ?? 0}</span>}</PanelBody></Panel>
            </div>

            <Panel>
                <PanelHeader title="Referral progress" />
                <PanelBody className="p-5 text-sm text-body">
                    {referral?.totalReferred ? `${referral.verifiedCount} of ${referral.totalReferred} referrals completed the verification requirements.` : "Share your link to start building your referral group."}
                </PanelBody>
            </Panel>
        </div>
    );
}
