"use client";

import * as React from "react";
import { Copy, MessageCircle, Twitter, Users, Share2, Info } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { useReferralLink, useReferralStats, useReferralList } from "@/lib/queries/referrals";
import { formatNaira } from "@/lib/format";

import { Button } from "@/components/shared/button";
import { Panel, PanelBody, PanelHeader } from "@/components/shared/panel";
import { RowItem } from "@/components/shared/row-item";
import { Tag } from "@/components/shared/tag";
import { Skeleton } from "@/components/shared/skeletons";
import { EmptyState } from "@/components/shared/empty-state";

export default function ReferAndEarnPage() {
    const { data: link, isLoading: linkLoading } = useReferralLink();
    const { data: stats, isLoading: statsLoading } = useReferralStats();
    const { data: list, isLoading: listLoading } = useReferralList();

    const handleCopy = () => {
        if (!link) return;
        navigator.clipboard.writeText(link);
        toast.success("Referral link copied!");
    };

    const handleWhatsApp = () => {
        if (!link) return;
        const text = encodeURIComponent(`Join me on NePay! Get a bonus when you sign up and make your first transaction: ${link}`);
        window.open(`https://wa.me/?text=${text}`, "_blank");
    };

    const handleX = () => {
        if (!link) return;
        const text = encodeURIComponent(`Join me on NePay! Get a bonus when you sign up and make your first transaction: ${link}`);
        window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
    };

    // Helper to get initials for avatar
    const getInitials = (name: string) => {
        const parts = name.trim().split(/\s+/);
        const first = parts[0]?.charAt(0) ?? "";
        const last = parts.length > 1 ? parts[parts.length - 1]?.charAt(0) ?? "" : "";
        return (first + last).toUpperCase() || "U";
    };

    return (
        <div className="mx-auto max-w-3xl space-y-6 pb-12">
            {/* ── Header ── */}
            <div className="flex flex-col py-4">
                <h1 className="text-2xl font-bold text-ink">Refer & Earn</h1>
                <p className="mt-1 text-sm text-body max-w-lg">
                    Share your link. When a friend signs up and completes their first transaction, you both earn ₦5,000.
                </p>
            </div>

            {/* ── Link Box ── */}
            <Panel>
                <PanelBody className="flex flex-col gap-4 p-5 sm:p-6">
                    <div className="flex w-full items-center justify-between rounded-lg border border-border bg-gray-50 px-4 py-3">
                        {linkLoading ? (
                            <Skeleton className="h-5 w-48" />
                        ) : (
                            <code className="text-sm font-semibold text-ink sm:text-base">
                                {link}
                            </code>
                        )}
                        <button
                            onClick={handleCopy}
                            className="text-violet-600 hover:text-violet-700 p-1"
                            aria-label="Copy link"
                        >
                            <Copy className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-row">
                        <Button
                            variant="primary"
                            className="w-full sm:flex-1"
                            onClick={handleCopy}
                        >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Link
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full sm:flex-1 border border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10"
                            onClick={handleWhatsApp}
                        >
                            <MessageCircle className="mr-2 h-4 w-4" />
                            WhatsApp
                        </Button>
                        <Button
                            variant="ghost"
                            className="col-span-2 w-full sm:flex-1 border border-[#1DA1F2] text-[#1DA1F2] hover:bg-[#1DA1F2]/10"
                            onClick={handleX}
                        >
                            <Twitter className="mr-2 h-4 w-4" />
                            Share on X
                        </Button>
                    </div>
                </PanelBody>
            </Panel>

            {/* ── Stats Strip ── */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <Panel className="border-none shadow-sm ring-1 ring-border">
                    <PanelBody className="flex flex-col items-center justify-center p-4 text-center">
                        <span className="text-xs font-medium text-muted uppercase tracking-wider">Total Earned</span>
                        {statsLoading || !stats ? (
                            <Skeleton className="mt-2 h-8 w-24" />
                        ) : (
                            <span className="mt-1 font-mono text-2xl font-bold text-green-500">
                                {formatNaira(stats.totalEarned)}
                            </span>
                        )}
                    </PanelBody>
                </Panel>
                <Panel className="border-none shadow-sm ring-1 ring-border">
                    <PanelBody className="flex flex-col items-center justify-center p-4 text-center">
                        <span className="text-xs font-medium text-muted uppercase tracking-wider">Invites Sent</span>
                        {statsLoading || !stats ? (
                            <Skeleton className="mt-2 h-8 w-12" />
                        ) : (
                            <span className="mt-1 font-mono text-2xl font-bold text-ink">
                                {stats.invitesSent}
                            </span>
                        )}
                    </PanelBody>
                </Panel>
                <Panel className="border-none shadow-sm ring-1 ring-border">
                    <PanelBody className="flex flex-col items-center justify-center p-4 text-center">
                        <span className="text-xs font-medium text-muted uppercase tracking-wider">Pending</span>
                        {statsLoading || !stats ? (
                            <Skeleton className="mt-2 h-8 w-12" />
                        ) : (
                            <span className="mt-1 font-mono text-2xl font-bold text-amber-500">
                                {stats.pending}
                            </span>
                        )}
                    </PanelBody>
                </Panel>
            </div>

            {/* ── Referral List ── */}
            <Panel>
                <PanelHeader 
                    title="Your Referrals" 
                    action={
                        <Button variant="ghost" size="sm" className="text-violet-600 hover:text-violet-700">
                            <Info className="mr-2 h-4 w-4" />
                            How it works
                        </Button>
                    }
                />
                <PanelBody className="p-0">
                    {listLoading ? (
                        <div className="flex flex-col divide-y divide-border">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center justify-between p-5">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-20" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-6 w-24 rounded-full" />
                                </div>
                            ))}
                        </div>
                    ) : !list || list.length === 0 ? (
                        <div className="py-8">
                            <EmptyState
                                icon={Share2}
                                heading="No referrals yet"
                                description="Share your link to start earning."
                            />
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {list.map((ref) => (
                                <RowItem
                                    key={ref.id}
                                    leading={
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                                            {getInitials(ref.name)}
                                        </div>
                                    }
                                    title={ref.name}
                                    subtitle={`Joined ${format(new Date(ref.dateJoined), "MMM d, yyyy")}`}
                                    className="px-5 py-4"
                                    trailing={
                                        ref.status === "completed" ? (
                                            <Tag variant="ok" dot>Earned ₦5,000</Tag>
                                        ) : (
                                            <Tag variant="warn" dot>Pending</Tag>
                                        )
                                    }
                                />
                            ))}
                        </div>
                    )}
                </PanelBody>
            </Panel>
        </div>
    );
}
