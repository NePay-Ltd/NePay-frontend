"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
    Layers,
    Gift,
    Tag,
    Receipt,
} from "lucide-react";
import { Button } from "@/components/shared/button";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/cn";
import { formatNaira } from "@/lib/format";
import { useGiftCardEarnings, useGiftCardCatalog } from "@/lib/queries/gift-cards";

export default function GiftCardsPage() {
    const router = useRouter();
    const [selectedBrand, setSelectedBrand] = React.useState<string>("all");

    // Real data off GET /giftcards/earnings and GET /giftcards/catalog —
    // no hardcoded brand list. Only status = active listings are ever
    // returned by the catalog endpoint.
    const { data: earnings, isLoading: earningsLoading } = useGiftCardEarnings();
    const { data: catalog, isLoading: catalogLoading } = useGiftCardCatalog();

    const listings = catalog ?? [];

    // Categories derived from whatever brands are actually live today —
    // counts can never go stale the way a hardcoded array's counts could.
    const categories = React.useMemo(() => {
        const byBrand = new Map<string, number>();
        for (const listing of listings) {
            byBrand.set(listing.brandName, (byBrand.get(listing.brandName) ?? 0) + 1);
        }
        return [
            { id: "all", label: "All cards", count: listings.length },
            ...Array.from(byBrand.entries()).map(([brandName, count]) => ({
                id: brandName,
                label: brandName,
                count,
            })),
        ];
    }, [listings]);

    const visibleListings = listings.filter(
        (listing) => selectedBrand === "all" || listing.brandName === selectedBrand,
    );

    return (
        <div className="">

            {/* Page Header */}
            <div className="mb-6 flex flex-col items-start sm:mb-8 sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-3xl">
                        Gift cards
                    </h1>
                    <p className="mt-0.5 text-sm font-medium text-body">
                        Sell cards at today&apos;s rates
                    </p>
                </div>

                <Button variant="quiet" onClick={() => router.push("/gift-cards/history")} className="gap-2">
                    <Receipt className="h-4 w-4" />
                    My Submissions
                </Button>
            </div>

            <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-4 xl:gap-8">

                {/* Left Sidebar */}
                <div className="space-y-6">
                    {/* Navigation Menu */}
                    {categories.length > 1 && (
                        <nav className="rounded-3xl border border-border bg-white p-3 shadow-sm">
                            <ul className="space-y-1">
                                {categories.map((cat) => (
                                    <li key={cat.id}>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedBrand(cat.id)}
                                            className={cn(
                                                "flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-bold transition-colors",
                                                selectedBrand === cat.id
                                                    ? "bg-violet-100 text-violet-700"
                                                    : "text-body hover:bg-violet-50 hover:text-violet-900"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                {cat.id === "all" ? (
                                                    <Layers className={cn("h-4 w-4", selectedBrand === cat.id ? "text-violet-700" : "text-muted")} />
                                                ) : (
                                                    <Gift className={cn("h-4 w-4", selectedBrand === cat.id ? "text-violet-700" : "text-muted")} />
                                                )}
                                                {cat.label}
                                            </div>
                                            <span className={cn("text-xs font-bold", selectedBrand === cat.id ? "text-violet-700" : "text-muted")}>
                                                {cat.count}
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    )}

                    {/* Stats Card */}
                    <div className="rounded-3xl border border-border bg-white p-5 shadow-sm">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
                            Earned this month
                        </p>
                        <p className="mt-2 font-sans tabular-nums text-2xl font-extrabold text-ink tracking-tighter leading-none">
                            {earningsLoading ? "…" : formatNaira(earnings?.totalNgn ?? 0)}
                        </p>
                        <p className="mt-4 text-xs font-medium text-body leading-relaxed">
                            {earningsLoading
                                ? "Loading…"
                                : earnings && earnings.cardsSold > 0
                                    ? `From ${earnings.cardsSold} card${earnings.cardsSold === 1 ? "" : "s"} approved this month.`
                                    : "No cards approved yet this month."}
                        </p>
                    </div>
                </div>

                {/* Right Content */}
                <div className="xl:col-span-3 space-y-8">

                    {/* Today's Rates Section */}
                    <div className="rounded-3xl border border-border bg-white p-6 shadow-sm sm:p-8">
                        {/* Header */}
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                            <div>
                                <h2 className="text-[18px] font-extrabold text-ink">Today&apos;s rates</h2>
                                <p className="text-sm font-medium text-body mt-1">
                                    Rates refresh every hour — the rate you see is the rate you get
                                </p>
                            </div>
                            {visibleListings.length > 0 && (
                                <Button type="button" onClick={() => document.getElementById("gift-card-options")?.scrollIntoView({ behavior: "smooth" })} className="shrink-0 bg-violet-700 text-white font-bold rounded-xl px-5 py-2.5 shadow-sm hover:bg-violet-600">
                                    <Tag className="mr-2 h-4 w-4" />
                                    Sell a card
                                </Button>
                            )}
                        </div>

                        {catalogLoading ? (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="h-[220px] animate-pulse rounded-2xl bg-gray-100" />
                                ))}
                            </div>
                        ) : visibleListings.length === 0 ? (
                            <EmptyState
                                icon={Gift}
                                heading="No gift cards available right now"
                                description="Check back soon — we're always adding more brands to sell."
                            />
                        ) : (
                            <div id="gift-card-options" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                {visibleListings.map((listing) => (
                                    <div key={listing.id} className="overflow-hidden rounded-2xl border border-border shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md">
                                        <div className="flex h-[120px] items-center justify-center bg-gray-50">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={listing.cardImageUrl}
                                                alt={listing.brandName}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div className="p-4 bg-white">
                                            <h3 className="font-extrabold text-ink text-[15px]">{listing.brandName}</h3>
                                            <p className="text-[11px] font-medium text-muted mt-0.5">
                                                {listing.countries.join(", ")}
                                            </p>
                                            <div className="mt-4 inline-flex items-center rounded-lg">
                                                <span className="text-xs font-bold text-ink">
                                                    {formatNaira(listing.rate)}/USD
                                                </span>
                                            </div>
                                            <Button type="button" variant="quiet" onClick={() => router.push(`/gift-cards/sell/${listing.slug}`)} className="mt-4 w-full bg-violet-50 text-violet-700 font-bold hover:bg-violet-100 rounded-xl h-10">
                                                Sell this card
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Instructions Section */}
                    <div className="rounded-3xl border border-border bg-white p-6 shadow-sm sm:p-8">
                        <h2 className="text-[15px] font-extrabold text-ink mb-6">Selling a card</h2>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8">
                            <div className="flex gap-4">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-50 text-sm font-bold text-violet-700">
                                    1
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-ink">Pick the card and amount</h3>
                                    <p className="mt-1 text-[13px] font-medium text-body leading-relaxed">Choose the brand, country and face value you&apos;re holding.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-50 text-sm font-bold text-violet-700">
                                    2
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-ink">Physical or e-code</h3>
                                    <p className="mt-1 text-[13px] font-medium text-body leading-relaxed">Take a live photo of a physical card, or just type in an e-code.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-50 text-sm font-bold text-violet-700">
                                    3
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-ink">Get paid in naira</h3>
                                    <p className="mt-1 text-[13px] font-medium text-body leading-relaxed">Every submission is reviewed by our team before payout.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
