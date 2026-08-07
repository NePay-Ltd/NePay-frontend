"use client";

import * as React from "react";
import { Gift, ShieldCheck, Globe, CreditCard, Lock } from "lucide-react";
import { toast } from "sonner";

import { useWaitlistStatus, useJoinWaitlist } from "@/lib/queries/card";
import { NePayCardVisual } from "@/components/shared/nepay-card-visual";
import { ReferralBanner } from "@/components/shared/referral-banner";
import { Button } from "@/components/shared/button";
import { Panel, PanelBody } from "@/components/shared/panel";
import { Tag } from "@/components/shared/tag";

export default function CardWaitlistPage() {
    // Queries & Mutations
    const { data: isOnWaitlist, isLoading: waitlistLoading } = useWaitlistStatus();
    const { mutateAsync: joinWaitlist, isPending: isJoining } = useJoinWaitlist();

    // Handlers
    const handleJoinWaitlist = async () => {
        try {
            await joinWaitlist();
            toast.success("You're on the waitlist!");
        } catch {
            toast.error("Failed to join the waitlist. Please try again.");
        }
    };



    return (
        <div className="mx-auto max-w-5xl py-4 sm:py-8">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
                
                {/* ── Left Column: Intro & Card Visual ── */}
                <div className="flex flex-col justify-center space-y-8">
                    <div className="space-y-4">
                        <Tag variant="neutral" dot className="uppercase tracking-wider font-semibold text-violet-700">
                            Coming Soon
                        </Tag>
                        <h1 className="text-4xl font-extrabold text-ink sm:text-5xl">
                            The NePay Card
                        </h1>
                        <p className="text-lg text-body leading-relaxed max-w-md">
                            Spend your NePay balance anywhere, online or in-store, with zero FX markup.
                        </p>
                    </div>

                    <div className="py-4">
                        <NePayCardVisual className="shadow-2xl" />
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <Button
                            variant="primary"
                            size="lg"
                            className="w-full sm:w-auto min-w-[200px]"
                            loading={isJoining || waitlistLoading}
                            disabled={isOnWaitlist}
                            onClick={handleJoinWaitlist}
                        >
                            {isOnWaitlist ? "You're on the list ✓" : "Join the Waitlist"}
                        </Button>
                        <Button
                            variant="quiet"
                            size="lg"
                            className="w-full sm:w-auto"
                            onClick={() => toast.info("FAQ coming soon!")}
                        >
                            Read the FAQ
                        </Button>
                    </div>
                </div>

                {/* ── Right Column: Benefits & Referral ── */}
                <div className="flex flex-col space-y-8">
                    <div>
                        <h2 className="text-2xl font-bold text-ink mb-6">What You Get</h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Panel className="h-full border-none bg-gray-50/50 shadow-sm transition-colors hover:bg-gray-50">
                                <PanelBody className="flex flex-col p-5">
                                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                                        <Gift className="h-5 w-5" />
                                    </div>
                                    <h3 className="font-semibold text-ink">2% Cashback</h3>
                                    <p className="mt-1 text-sm text-body">
                                        On every purchase, credited weekly.
                                    </p>
                                </PanelBody>
                            </Panel>

                            <Panel className="h-full border-none bg-gray-50/50 shadow-sm transition-colors hover:bg-gray-50">
                                <PanelBody className="flex flex-col p-5">
                                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 text-green-600">
                                        <Globe className="h-5 w-5" />
                                    </div>
                                    <h3 className="font-semibold text-ink">No FX Markup</h3>
                                    <p className="mt-1 text-sm text-body">
                                        Spend abroad at the real exchange rate.
                                    </p>
                                </PanelBody>
                            </Panel>

                            <Panel className="h-full border-none bg-gray-50/50 shadow-sm transition-colors hover:bg-gray-50">
                                <PanelBody className="flex flex-col p-5">
                                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-600">
                                        <Lock className="h-5 w-5" />
                                    </div>
                                    <h3 className="font-semibold text-ink">Freeze in One Tap</h3>
                                    <p className="mt-1 text-sm text-body">
                                        Lost your card? Lock it instantly from the app.
                                    </p>
                                </PanelBody>
                            </Panel>

                            <Panel className="h-full border-none bg-gray-50/50 shadow-sm transition-colors hover:bg-gray-50">
                                <PanelBody className="flex flex-col p-5">
                                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
                                        <CreditCard className="h-5 w-5" />
                                    </div>
                                    <h3 className="font-semibold text-ink">Virtual First</h3>
                                    <p className="mt-1 text-sm text-body">
                                        Get your virtual card instantly; physical card ships free.
                                    </p>
                                </PanelBody>
                            </Panel>
                        </div>
                    </div>

                    <div className="mt-auto pt-4">
                        <ReferralBanner />
                    </div>
                </div>

            </div>
        </div>
    );
}
