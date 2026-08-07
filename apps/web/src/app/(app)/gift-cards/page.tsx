"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { 
    Tag, 
    ShoppingCart, 
    Smartphone, 
    Gamepad2, 
    CheckCircle2, 
    Camera, 
    Banknote,
    ChevronRight,
    Loader2
} from "lucide-react";

import { cn } from "@/lib/cn";
import { formatNaira } from "@/lib/format";
import { useGiftCardEarnings, useGiftCardRates } from "@/lib/queries/gift-cards";

import { Panel, PanelHeader, PanelBody } from "@/components/shared/panel";
import { Button } from "@/components/shared/button";
import { RowItem } from "@/components/shared/row-item";

// ─── Constants ───────────────────────────────────────────────────────────────

const BRANDS = [
    { id: "amazon", label: "Amazon", icon: ShoppingCart, color: "text-orange-500", bg: "bg-orange-50" },
    { id: "itunes", label: "iTunes / Apple", icon: Smartphone, color: "text-black", bg: "bg-gray-100" },
    { id: "google-play", label: "Google Play", icon: Tag, color: "text-blue-500", bg: "bg-blue-50" },
    { id: "steam", label: "Steam", icon: Gamepad2, color: "text-indigo-900", bg: "bg-indigo-50" },
];

export default function GiftCardsPage() {
    const router = useRouter();
    const [activeFilter, setActiveFilter] = React.useState<string>("all");

    // Queries
    const { data: earnings, isLoading: earningsLoading } = useGiftCardEarnings();
    const { data: rates = {}, isLoading: ratesLoading } = useGiftCardRates();

    // Derived Data
    const filteredBrands = React.useMemo(() => {
        if (activeFilter === "all") return BRANDS;
        return BRANDS.filter((b) => b.id === activeFilter);
    }, [activeFilter]);

    return (
        <div className="mx-auto max-w-5xl space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-center md:text-left">
                <div>
                    <h1 className="text-3xl font-bold text-ink">Gift Cards</h1>
                    <p className="mt-2 text-sm text-body">
                        Sell your unused gift cards for instant cash.
                    </p>
                </div>
                <Button 
                    variant="primary" 
                    size="lg" 
                    onClick={() => router.push("/gift-cards/sell/amazon")}
                    className="shrink-0"
                >
                    Sell a Card
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:gap-10">
                {/* ── Left Sidebar (Filters & Earnings) ── */}
                <div className="space-y-6 md:col-span-4">
                    <Panel>
                        <PanelHeader title="Brands" />
                        <PanelBody className="p-0">
                            <div className="flex flex-col">
                                <button
                                    className={cn(
                                        "flex items-center justify-between px-5 py-3 text-left text-sm font-medium transition-colors",
                                        activeFilter === "all" ? "bg-violet-50 text-violet-700" : "text-ink hover:bg-gray-50"
                                    )}
                                    onClick={() => setActiveFilter("all")}
                                >
                                    All Cards
                                    <span className="flex h-5 items-center justify-center rounded-full bg-gray-100 px-2 text-xs text-muted">
                                        {BRANDS.length}
                                    </span>
                                </button>
                                {BRANDS.map((brand) => (
                                    <button
                                        key={brand.id}
                                        className={cn(
                                            "flex items-center justify-between px-5 py-3 text-left text-sm font-medium transition-colors border-t border-border",
                                            activeFilter === brand.id ? "bg-violet-50 text-violet-700" : "text-ink hover:bg-gray-50"
                                        )}
                                        onClick={() => setActiveFilter(brand.id)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <brand.icon className={cn("h-4 w-4", brand.color)} />
                                            {brand.label}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </PanelBody>
                    </Panel>

                    <Panel>
                        <PanelBody className="p-6">
                            <h3 className="text-sm font-medium text-muted">Earned this month</h3>
                            {earningsLoading ? (
                                <div className="mt-2 flex items-center gap-2 text-muted">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-sm">Loading...</span>
                                </div>
                            ) : (
                                <div className="mt-2">
                                    <div className="font-mono text-3xl font-bold text-ink">
                                        {formatNaira(earnings?.totalNgn || 0)}
                                    </div>
                                    <p className="mt-1 text-sm text-green-600 font-medium">
                                        {earnings?.cardsSold || 0} cards sold
                                    </p>
                                </div>
                            )}
                        </PanelBody>
                    </Panel>
                </div>

                {/* ── Main Area (Grid & Steps) ── */}
                <div className="space-y-8 md:col-span-8">
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold text-ink">Today&apos;s Rates</h2>
                        {ratesLoading ? (
                            <div className="flex items-center justify-center p-10 text-muted">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {filteredBrands.map((brand) => (
                                    <button
                                        key={brand.id}
                                        onClick={() => router.push(`/gift-cards/sell/${brand.id}`)}
                                        className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-white p-5 text-left shadow-sm transition-all hover:border-violet-300 hover:shadow-md"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className={cn("flex h-12 w-12 items-center justify-center rounded-lg", brand.bg)}>
                                                <brand.icon className={cn("h-6 w-6", brand.color)} />
                                            </div>
                                            <ChevronRight className="h-5 w-5 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
                                        </div>
                                        <div className="mt-4">
                                            <h3 className="font-semibold text-ink">{brand.label}</h3>
                                            <p className="text-xs text-muted">Sell Gift Card</p>
                                            <div className="mt-3 flex items-baseline gap-1">
                                                <span className="text-sm font-medium text-body">Up to</span>
                                                <span className="text-lg font-bold text-green-500">
                                                    {formatNaira(rates[brand.id] || 0)}
                                                </span>
                                                <span className="text-xs font-medium text-muted">/ USD</span>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>

                    <section>
                        <Panel>
                            <PanelHeader title="Selling a Card" />
                            <PanelBody className="p-6">
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                                    <div className="flex flex-col items-center text-center">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                                            <Tag className="h-6 w-6" />
                                        </div>
                                        <h4 className="mt-3 font-semibold text-ink">1. Pick your card</h4>
                                        <p className="mt-1 text-xs text-muted">Select the brand and check today&apos;s rate.</p>
                                    </div>
                                    <div className="flex flex-col items-center text-center">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                                            <Camera className="h-6 w-6" />
                                        </div>
                                        <h4 className="mt-3 font-semibold text-ink">2. Upload code</h4>
                                        <p className="mt-1 text-xs text-muted">Type the code or upload a clear photo.</p>
                                    </div>
                                    <div className="flex flex-col items-center text-center">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                                            <CheckCircle2 className="h-6 w-6" />
                                        </div>
                                        <h4 className="mt-3 font-semibold text-ink">3. Get paid</h4>
                                        <p className="mt-1 text-xs text-muted">Receive cash instantly once verified.</p>
                                    </div>
                                </div>
                            </PanelBody>
                        </Panel>
                    </section>
                </div>
            </div>
        </div>
    );
}
