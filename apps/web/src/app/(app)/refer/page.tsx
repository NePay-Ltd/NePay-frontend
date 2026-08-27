"use client";

import * as React from "react";
import { Copy, MessageCircle, Twitter, Users, UserCheck } from "lucide-react";
import { toast } from "sonner";

import { useReferralSummary } from "@/lib/queries/referrals";
import { Button } from "@/components/shared/button";
import { Panel, PanelBody, PanelHeader } from "@/components/shared/panel";
import { Skeleton } from "@/components/shared/skeletons";

export default function ReferAndEarnPage() {
    const { data: referral, isLoading, isError } = useReferralSummary();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => { setMounted(true); }, []);

    const link = mounted && referral
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
        <div className="mx-auto max-w-lg md:max-w-5xl pb-28 sm:pb-12 px-0 md:px-6">
            {/* Header */}
            <div className="pt-2 sm:pt-0 mb-6 md:mb-8">
                <h1 className="text-2xl font-bold text-ink sm:text-3xl md:text-4xl">Refer &amp; Earn</h1>
                <p className="mt-1.5 text-sm md:text-base text-body max-w-2xl">
                    Share your link and earn when a friend signs up, completes KYC, and makes their first deposit.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-12 md:gap-8">
                {/* ── Left Column ────────────────────────────────────────────── */}
                <div className="md:col-span-7 space-y-5 md:space-y-6">
                    {/* Link + Share Panel */}
                    <Panel>
                        <PanelBody className="flex flex-col gap-5 p-5 md:p-8">
                            <div>
                                <h3 className="text-sm font-bold text-ink mb-1">Your Referral Link</h3>
                                <p className="text-xs text-muted mb-3">Copy this link or share it directly to your networks.</p>
                                
                                {/* Referral link box */}
                                <div className="flex w-full items-center gap-2 rounded-xl border border-border bg-gray-50 dark:bg-white/5 px-3 py-3 sm:px-4">
                                    <div className="flex-1 min-w-0">
                                        {isLoading || !mounted ? (
                                            <Skeleton className="h-4 w-48" />
                                        ) : (
                                            <code className="block truncate text-[13px] md:text-sm font-semibold text-ink">
                                                {link || "Unavailable"}
                                            </code>
                                        )}
                                    </div>
                                    <button
                                        onClick={copyLink}
                                        disabled={!link}
                                        className="shrink-0 p-2 rounded-lg text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 disabled:opacity-40 transition-colors"
                                        aria-label="Copy referral link"
                                    >
                                        <Copy className="h-4 w-4 md:h-5 md:w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Share buttons */}
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Button
                                    variant="primary"
                                    className="w-full sm:flex-1 h-12 text-sm font-bold"
                                    onClick={copyLink}
                                    disabled={!link}
                                >
                                    <Copy className="h-4 w-4 mr-1.5" />
                                    Copy Link
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full border border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10 sm:flex-1 h-12 text-sm font-bold"
                                    onClick={() => share("https://wa.me/?text=Join%20me%20on%20NePay%3A%20__LINK__")}
                                    disabled={!link}
                                >
                                    <MessageCircle className="h-4 w-4 mr-1.5" />
                                    WhatsApp
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full border border-[#1DA1F2] text-[#1DA1F2] hover:bg-[#1DA1F2]/10 sm:flex-1 h-12 text-sm font-bold"
                                    onClick={() => share("https://twitter.com/intent/tweet?text=Join%20me%20on%20NePay%3A%20__LINK__")}
                                    disabled={!link}
                                >
                                    <Twitter className="h-4 w-4 mr-1.5" />
                                    Share on X
                                </Button>
                            </div>

                            {isError && (
                                <p className="text-sm text-red-600 text-center mt-2">
                                    Referral information is temporarily unavailable.
                                </p>
                            )}
                        </PanelBody>
                    </Panel>

                    {/* Progress note / How it works */}
                    <Panel>
                        <PanelHeader title="How it works" />
                        <PanelBody className="p-5 md:p-8">
                            <ol className="space-y-4 text-sm text-body">
                                <li className="flex items-start gap-4">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30 text-sm font-bold text-violet-700 dark:text-violet-400">1</span>
                                    <span className="mt-0.5 leading-relaxed">Share your unique referral link with friends and family via social media or messaging apps.</span>
                                </li>
                                <li className="flex items-start gap-4">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30 text-sm font-bold text-violet-700 dark:text-violet-400">2</span>
                                    <span className="mt-0.5 leading-relaxed">They sign up using your link, complete their KYC verification, and make their first successful deposit.</span>
                                </li>
                                <li className="flex items-start gap-4">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30 text-sm font-bold text-violet-700 dark:text-violet-400">3</span>
                                    <span className="mt-0.5 leading-relaxed">You earn referral rewards which are automatically credited to your NePay wallet balance.</span>
                                </li>
                            </ol>
                            {referral?.totalReferred ? (
                                <div className="mt-6 rounded-xl bg-violet-50 dark:bg-violet-900/20 p-4 border border-violet-100 dark:border-violet-900/30">
                                    <p className="text-sm font-bold text-violet-800 dark:text-violet-300">
                                        {referral.verifiedCount} of {referral.totalReferred} referral{referral.totalReferred !== 1 ? "s" : ""} have completed the verification requirements so far.
                                    </p>
                                </div>
                            ) : null}
                        </PanelBody>
                    </Panel>
                </div>

                {/* ── Right Column ───────────────────────────────────────────── */}
                <div className="md:col-span-5 space-y-5 md:space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-1 lg:grid-cols-2">
                        <Panel className="h-full">
                            <PanelBody className="flex flex-col items-center justify-center p-5 md:p-8 text-center h-full">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30 mb-3 shadow-sm">
                                    <Users className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                                </div>
                                <span className="text-[11px] font-extrabold uppercase tracking-widest text-muted">
                                    Total Referrals
                                </span>
                                {isLoading ? (
                                    <Skeleton className="mt-3 h-10 w-16" />
                                ) : (
                                    <span className="mt-2 font-mono text-4xl font-black text-ink">
                                        {referral?.totalReferred ?? 0}
                                    </span>
                                )}
                            </PanelBody>
                        </Panel>
                        
                        <Panel className="h-full">
                            <PanelBody className="flex flex-col items-center justify-center p-5 md:p-8 text-center h-full">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-3 shadow-sm">
                                    <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                                <span className="text-[11px] font-extrabold uppercase tracking-widest text-muted">
                                    Verified
                                </span>
                                {isLoading ? (
                                    <Skeleton className="mt-3 h-10 w-16" />
                                ) : (
                                    <span className="mt-2 font-mono text-4xl font-black text-ink">
                                        {referral?.verifiedCount ?? 0}
                                    </span>
                                )}
                            </PanelBody>
                        </Panel>
                    </div>
                </div>
            </div>
        </div>
    );
}
