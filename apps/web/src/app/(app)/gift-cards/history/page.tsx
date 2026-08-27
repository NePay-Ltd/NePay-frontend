"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Receipt } from "lucide-react";
import { formatDateTime } from "@/lib/date";

import { cn } from "@/lib/cn";
import { formatNaira } from "@/lib/format";
import { useGiftCardHistory } from "@/lib/queries/gift-cards";
import type { GiftCardOrderResponseDto } from "@/lib/types/api";

import { Panel, PanelBody } from "@/components/shared/panel";
import { Button } from "@/components/shared/button";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/shared/skeletons";

/**
 * The full list of a seller's gift card orders, including PENDING_REVIEW
 * and REJECTED ones — the generic /transactions page only ever shows
 * APPROVED gift card sales, because that's the only status that ever gets
 * a ledger entry. This page is where "what happened to that card I
 * submitted?" actually gets answered.
 */
export default function GiftCardHistoryPage() {
    const router = useRouter();
    const [page, setPage] = React.useState(1);
    const { data, isLoading } = useGiftCardHistory(page);

    const items = data?.items ?? [];
    const isEmpty = !isLoading && items.length === 0;

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <div className="flex items-center gap-3">
                <button
                    onClick={() => router.push("/gift-cards")}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-ink">Gift Card Submissions</h1>
                    <p className="text-sm text-body">Every card you&apos;ve submitted, including ones still under review or rejected.</p>
                </div>
            </div>

            <Panel>
                <div className="w-full divide-y divide-border">
                    {isLoading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="p-4 flex items-center gap-4">
                                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                            </div>
                        ))
                    ) : isEmpty ? (
                        <div className="py-16">
                            <EmptyState
                                icon={Receipt}
                                heading="No gift card submissions yet"
                                description="Cards you sell will show up here, from submission through to payout or rejection."
                            />
                        </div>
                    ) : (
                        items.map((order) => (
                            <SubmissionRow key={order.id} order={order} onClick={() => router.push(`/gift-cards/submissions/${order.id}`)} />
                        ))
                    )}
                </div>

                {data && data.pages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t border-border">
                        <Button variant="quiet" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                            Previous
                        </Button>
                        <span className="text-xs text-muted">Page {data.page} of {data.pages}</span>
                        <Button variant="quiet" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>
                            Next
                        </Button>
                    </div>
                )}
            </Panel>
        </div>
    );
}

const STATUS_META: Record<GiftCardOrderResponseDto["status"], { label: string; className: string }> = {
    PENDING_REVIEW: { label: "Under Review", className: "bg-amber-50 text-amber-700" },
    APPROVED: { label: "Approved", className: "bg-green-50 text-green-700" },
    REJECTED: { label: "Rejected", className: "bg-red-50 text-red-700" },
};

function SubmissionRow({ order, onClick }: { order: GiftCardOrderResponseDto; onClick: () => void }) {
    const meta = STATUS_META[order.status];

    return (
        <button onClick={onClick} className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-gray-50 transition-colors">
            <div className="min-w-0">
                <p className="text-sm font-semibold text-ink truncate">
                    {order.cardBrand} · ${parseFloat(order.faceValueUsd).toFixed(2)}
                </p>
                <p className="text-xs text-muted mt-0.5">{formatDateTime(order.createdAt)}</p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", meta.className)}>
                    {meta.label}
                </span>
                <span className="text-xs font-mono text-body">
                    {order.status === "APPROVED" ? formatNaira(parseFloat(order.payoutAmount)) : "—"}
                </span>
            </div>
        </button>
    );
}
