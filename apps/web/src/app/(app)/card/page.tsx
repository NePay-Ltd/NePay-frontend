"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Gift, ShieldCheck, Globe, CreditCard, Lock } from "lucide-react";
import { toast } from "sonner";

import { useWaitlistStatus, useJoinWaitlist } from "@/lib/queries/card";
import { NePayCardVisual } from "@/components/shared/nepay-card-visual";
import { Button } from "@/components/shared/button";
import { Panel, PanelBody } from "@/components/shared/panel";
import { Tag } from "@/components/shared/tag";
import { type BaseTransaction, TransactionRow } from "@/components/shared/transaction-row";
import { TransactionDetailModal, type TransactionDetailData } from "@/components/shared/transaction-detail-modal";

export default function CardPage() {
    const router = useRouter();
    const [selectedTransaction, setSelectedTransaction] = React.useState<TransactionDetailData | null>(null);
    const [modalOpen, setModalOpen] = React.useState(false);

    const cardTransactions: BaseTransaction[] = [
        { id: "c1", label: "Spotify Premium", meta: "Entertainment", amount: -900, category: "payment", status: "success", date: new Date().toISOString() },
        { id: "c2", label: "Uber", meta: "Transport", amount: -2500, category: "payment", status: "success", date: new Date().toISOString() },
        { id: "c3", label: "Netflix", meta: "Entertainment", amount: -4000, category: "payment", status: "success", date: new Date().toISOString() },
    ];

    const handleViewReceipt = (tx: BaseTransaction) => {
        const detailData: TransactionDetailData = {
            id: tx.id,
            label: tx.label,
            meta: tx.meta,
            amount: tx.amount,
            category: tx.category,
            status: tx.status,
            date: tx.date,
            type: tx.meta,
            direction: tx.amount > 0 ? "CREDIT" : "DEBIT",
            currency: "NGN",
        };
        setSelectedTransaction(detailData);
        setModalOpen(true);
    };

    return (
        <div className="relative">
            {/* Coming Soon Overlay */}
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/40 dark:bg-bg/60 backdrop-blur-[2px] rounded-3xl">
                <div className="flex flex-col items-center bg-white dark:bg-gray-100 p-6 rounded-2xl shadow-xl ring-1 ring-border text-center max-w-sm">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-700 mb-4">
                        <Lock className="h-6 w-6" />
                    </div>
                    <h2 className="text-xl font-extrabold text-ink">Coming Soon</h2>
                    <p className="mt-2 text-sm font-medium text-muted">
                        We are working hard to bring you the NePay Verve Card. Stay tuned!
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 xl:grid-cols-12 xl:gap-12 opacity-40 pointer-events-none select-none filter grayscale-[30%]">
                
                {/* ── Left Column: Card Visual & Controls ── */}
                <div className="flex flex-col items-center space-y-8 xl:col-span-5">
                    <div className="w-full text-center lg:text-left">
                        <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                            NePay Card
                        </h1>
                        <p className="mt-1 text-sm font-medium text-body">
                            Your global spending power.
                        </p>
                    </div>

                    <div className="relative w-full max-w-sm drop-shadow-2xl transition-transform hover:scale-105 duration-500 ease-out py-8">
                        <NePayCardVisual />
                    </div>

                    <div className="w-full space-y-4">
                        <div className="flex gap-4">
                            <Button className="flex-1 rounded-[16px] bg-ink hover:bg-black text-white font-bold h-14 shadow-lg">
                                <Lock className="mr-2 h-4 w-4" />
                                Freeze Card
                            </Button>
                            <Button className="flex-1 rounded-[16px] bg-white border border-border text-ink hover:bg-gray-50 font-bold h-14 shadow-sm">
                                <CreditCard className="mr-2 h-4 w-4" />
                                Show Details
                            </Button>
                        </div>
                        
                        <Panel className="rounded-[24px] overflow-hidden shadow-sm">
                            <div className="divide-y divide-border/50">
                                <div className="flex items-center justify-between p-5 hover:bg-gray-50 cursor-pointer transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                                            <ShieldCheck className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-ink">Card Settings</p>
                                            <p className="text-xs font-medium text-muted">PIN, Limits, Security</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-5 hover:bg-gray-50 cursor-pointer transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                                            <Globe className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-ink">International Spending</p>
                                            <p className="text-xs font-medium text-muted">Enabled · 0% FX Markup</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Panel>
                    </div>
                </div>

                {/* ── Right Column: Card Transactions ── */}
                <div className="xl:col-span-7 space-y-6">
                    <div className="flex items-end justify-between">
                        <div>
                            <h2 className="text-xl font-extrabold text-ink">Card Transactions</h2>
                            <p className="text-sm font-medium text-body mt-1">Recent activity on your virtual card</p>
                        </div>
                        <Button variant="quiet" className="font-bold text-violet-700 hover:bg-violet-50">
                            View All
                        </Button>
                    </div>

                    <Panel className="rounded-[24px]">
                        <div className="divide-y divide-border/50">
                            {cardTransactions.length > 0 ? (
                                cardTransactions.map((tx) => (
                                    <TransactionRow key={tx.id} tx={tx} onViewReceipt={handleViewReceipt} />
                                ))
                            ) : (
                                <div className="p-8 text-center text-sm font-medium text-muted">
                                    No card transactions yet.
                                </div>
                            )}
                        </div>
                    </Panel>
                </div>
            </div>

            {/* Transaction Detail Modal */}
            <TransactionDetailModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                transaction={selectedTransaction}
                onViewFullDetail={(txId) => router.push(`/transactions/${txId}`)}
            />
        </div>
    );
}
