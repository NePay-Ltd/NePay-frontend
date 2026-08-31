"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Lock, ArrowRight, Eye, Plus, Settings, FileText, Smartphone, Bell, BellRing } from "lucide-react";
import { Button } from "@/components/shared/button";
import { NePayCardVisual } from "@/components/shared/nepay-card-visual";
import { Panel } from "@/components/shared/panel";
import { useWaitlistStatus, useJoinWaitlist } from "@/lib/queries/card";
import { cn } from "@/lib/cn";

export default function CardPage() {
    const router = useRouter();
    const { data: isWaitlisted } = useWaitlistStatus();
    const { mutate: joinWaitlist, isPending: isWaitlisting } = useJoinWaitlist();

    return (
        <div className="flex-1 w-full h-full relative overflow-hidden rounded-[24px] sm:rounded-[32px] border border-border bg-gray-50/50 dark:bg-[#0a0a0a] shadow-sm min-h-[600px]">
            
            {/* --- BASE LAYER: Mockup of the actual functional UI --- */}
            <div className="absolute inset-0 p-6 flex flex-col lg:flex-row lg:items-start justify-center gap-8 lg:gap-16 select-none pointer-events-none opacity-60 dark:opacity-40 max-w-6xl mx-auto overflow-hidden">
                
                {/* Left Side: Card and Actions */}
                <div className="flex flex-col items-center lg:w-1/2 lg:mt-12">
                    {/* The Card */}
                    <div className="mt-4 sm:mt-8 w-full flex justify-center">
                        <NePayCardVisual 
                            className="shadow-2xl shadow-violet-500/20 w-full max-w-[340px] lg:max-w-[400px] lg:h-[240px]" 
                            cardholderName="JOHN DOE"
                            last4="4092" 
                        />
                    </div>

                    {/* Mock Action Buttons */}
                    <div className="mt-8 flex items-center justify-center gap-6 sm:gap-10 w-full max-w-md">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-white dark:bg-[#111] shadow-sm border border-border flex items-center justify-center text-ink">
                                <Eye className="w-5 h-5 lg:w-6 lg:h-6" />
                            </div>
                            <span className="text-xs lg:text-sm font-semibold text-muted">Details</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-white dark:bg-[#111] shadow-sm border border-border flex items-center justify-center text-ink">
                                <Lock className="w-5 h-5 lg:w-6 lg:h-6" />
                            </div>
                            <span className="text-xs lg:text-sm font-semibold text-muted">Lock</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-white dark:bg-[#111] shadow-sm border border-border flex items-center justify-center text-ink">
                                <Plus className="w-5 h-5 lg:w-6 lg:h-6" />
                            </div>
                            <span className="text-xs lg:text-sm font-semibold text-muted">Fund</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-white dark:bg-[#111] shadow-sm border border-border flex items-center justify-center text-ink">
                                <Settings className="w-5 h-5 lg:w-6 lg:h-6" />
                            </div>
                            <span className="text-xs lg:text-sm font-semibold text-muted">Settings</span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Mock Transactions List (Desktop expands this) */}
                <div className="mt-12 lg:mt-12 w-full lg:w-1/2 max-w-lg lg:max-w-full flex flex-col gap-4">
                    <h3 className="text-sm lg:text-base font-bold text-ink mb-2 text-left w-full">Recent Transactions</h3>
                    
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-[#111] border border-border">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                                <FileText className="w-4 h-4 text-amber-700" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-ink">Amazon AWS</span>
                                <span className="text-xs text-muted">Yesterday</span>
                            </div>
                        </div>
                        <span className="text-sm font-bold text-ink">-$42.50</span>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-[#111] border border-border">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                                <Smartphone className="w-4 h-4 text-violet-700" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-ink">Apple Services</span>
                                <span className="text-xs text-muted">Aug 24, 2026</span>
                            </div>
                        </div>
                        <span className="text-sm font-bold text-ink">-$9.99</span>
                    </div>
                </div>
            </div>

            {/* --- OVERLAY LAYER: Frosted glass hiding the mockup --- */}
            <div className="absolute inset-0 backdrop-blur-[12px] bg-white/60 dark:bg-black/60 z-10" />

            {/* --- FOREGROUND LAYER: Coming Soon message --- */}
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-3 sm:p-6">
                <Panel className="max-w-md w-full sm:w-full p-5 sm:p-12 flex flex-col items-center rounded-3xl bg-white/80 dark:bg-[#111]/80 shadow-2xl backdrop-blur-xl border border-white/40 dark:border-white/10">
                    {/* Lock Icon */}
                    <div className="w-14 h-14 rounded-full bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-6 shadow-sm">
                        <Lock className="w-6 h-6" />
                    </div>

                    <h1 className="text-3xl font-black text-ink tracking-tight mb-3">
                        NePay Virtual Card
                    </h1>
                    
                    <p className="text-lg text-muted font-semibold mb-8">
                        Coming soon
                    </p>

                    <div className="w-full flex flex-col items-center gap-3">
                        <Button 
                            variant={isWaitlisted ? "quiet" : "primary"}
                            size="lg"
                            className={cn(
                                "h-14 w-full rounded-2xl font-bold text-[13px] sm:text-base shadow-lg transition-all duration-300",
                                isWaitlisted 
                                    ? "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 shadow-none ring-1 ring-inset ring-green-500/20" 
                                    : "bg-ink text-white hover:bg-gray-800 dark:bg-white dark:text-ink shadow-black/10 hover:-translate-y-0.5"
                            )}
                            onClick={() => joinWaitlist()}
                            disabled={isWaitlisted || isWaitlisting}
                            loading={isWaitlisting}
                        >
                            {isWaitlisted ? (
                                <>
                                    <BellRing className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                                    You're on the waitlist!
                                </>
                            ) : (
                                <>
                                    <Bell className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                                    Notify me when this launches
                                </>
                            )}
                        </Button>

                        <Button 
                            variant="quiet" 
                            size="lg" 
                            className="h-14 w-full rounded-2xl font-bold text-[13px] sm:text-base hover:bg-white/50 dark:hover:bg-white/5 transition-colors"
                            onClick={() => router.push("/services")}
                        >
                            Explore other services
                            <ArrowRight className="ml-1.5 sm:ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </Panel>
            </div>
        </div>
    );
}
