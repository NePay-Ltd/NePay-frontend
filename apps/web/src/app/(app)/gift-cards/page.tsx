"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
    Layers,
    ShoppingBag,
    Music,
    Play,
    Gamepad2,
    Tag,
    Receipt,
    ArrowDownToLine,
} from "lucide-react";
import { Button } from "@/components/shared/button";
import { cn } from "@/lib/cn";
import { formatNaira } from "@/lib/format";
import { useGiftCardEarnings, useGiftCardRates } from "@/lib/queries/gift-cards";

// Dummy data
const CATEGORIES = [
    { id: "all", label: "All cards", icon: Layers, count: 4, active: true },
    { id: "amazon", label: "Amazon", icon: ShoppingBag, count: 1 },
    { id: "itunes", label: "iTunes", icon: Music, count: 1 },
    { id: "google-play", label: "Google Play", icon: Play, count: 1 },
    { id: "steam", label: "Steam", icon: Gamepad2, count: 1 },
];

const GIFT_CARDS = [
    {
        id: "amazon",
        name: "Amazon",
        desc: "USA · physical & e-code",
        rate: "Up to 92%",
        bgColor: "bg-[#1E293B]", // Slate 900
        icon: ShoppingBag,
    },
    {
        id: "itunes",
        name: "iTunes",
        desc: "USA · e-code only",
        rate: "Up to 90%",
        bgColor: "bg-[#A855F7]", // Purple 500
        icon: Music,
    },
    {
        id: "google-play",
        name: "Google Play",
        desc: "USA · e-code only",
        rate: "Up to 90%",
        bgColor: "bg-[#22C55E]", // Green 500
        icon: Play,
    },
    {
        id: "steam",
        name: "Steam Wallet",
        desc: "USA · e-code only",
        rate: "Up to 88%",
        bgColor: "bg-[#334155]", // Slate 700
        icon: Gamepad2,
    },
];

export default function GiftCardsPage() {
    const router = useRouter();
    const [mode, setMode] = React.useState<"buy" | "sell">("sell");
    const [selectedCategory, setSelectedCategory] = React.useState("all");

    // Real data for the sell side — GET /giftcards/earnings and
    // GET /giftcards/rates. No "buy" flow exists on the backend yet, so
    // buy mode keeps its own separate, clearly-labelled placeholder below
    // rather than being wired to sell-side data.
    const { data: earnings, isLoading: earningsLoading } = useGiftCardEarnings();
    const { data: rates } = useGiftCardRates();

    return (
        <div className="">
            
            {/* Page Header */}
            <div className="mb-6 flex flex-col items-start sm:mb-8 sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-3xl">
                        Gift cards
                    </h1>
                    <p className="mt-0.5 text-sm font-medium text-body">
                        {mode === "sell" ? "Sell cards at today's rates" : "Buy cards for your subscriptions"}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="quiet" onClick={() => router.push("/gift-cards/history")} className="gap-2">
                        <Receipt className="h-4 w-4" />
                        My Submissions
                    </Button>

                    {/* Buy / Sell Toggle */}
                    <div className="flex rounded-xl border border-border bg-gray-50 p-1 shadow-sm">
                        <button
                            onClick={() => setMode("buy")}
                            className={cn(
                                "rounded-lg px-6 py-2 text-sm font-bold transition-all",
                                mode === "buy" ? "bg-white text-ink shadow-sm ring-1 ring-black/5" : "text-muted hover:text-ink"
                            )}
                        >
                            Buy Cards
                        </button>
                        <button
                            onClick={() => setMode("sell")}
                            className={cn(
                                "rounded-lg px-6 py-2 text-sm font-bold transition-all",
                                mode === "sell" ? "bg-white text-ink shadow-sm ring-1 ring-black/5" : "text-muted hover:text-ink"
                            )}
                        >
                            Sell Cards
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-4 xl:gap-8">
                
                {/* Left Sidebar */}
                <div className="space-y-6">
                    {/* Navigation Menu */}
                    <nav className="rounded-3xl border border-border bg-white p-3 shadow-sm">
                        <ul className="space-y-1">
                            {CATEGORIES.map((cat) => (
                                <li key={cat.id}>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={cn(
                                            "flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-bold transition-colors",
                                            selectedCategory === cat.id
                                                ? "bg-violet-100 text-violet-700" 
                                                : "text-body hover:bg-violet-50 hover:text-violet-900"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <cat.icon className={cn("h-4 w-4", cat.active ? "text-violet-700" : "text-muted")} />
                                            {cat.label}
                                        </div>
                                        <span className={cn("text-xs font-bold", cat.active ? "text-violet-700" : "text-muted")}>
                                            {cat.count}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Stats Card */}
                    <div className="rounded-3xl border border-border bg-white p-5 shadow-sm">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
                            {mode === "sell" ? "Earned this month" : "Spent this month"}
                        </p>
                        {mode === "sell" ? (
                            <>
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
                            </>
                        ) : (
                            <>
                                <p className="mt-2 font-sans tabular-nums text-2xl font-extrabold text-muted tracking-tighter leading-none">
                                    —
                                </p>
                                <p className="mt-4 text-xs font-medium text-body leading-relaxed">
                                    Buying gift cards isn&apos;t live yet — this figure is a placeholder.
                                </p>
                            </>
                        )}
                    </div>
                </div>

                {/* Right Content */}
                <div className="xl:col-span-3 space-y-8">
                    
                    {/* Today's Rates Section */}
                    <div className="rounded-3xl border border-border bg-white p-6 shadow-sm sm:p-8">
                        {/* Header */}
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                            <div>
                                <h2 className="text-[18px] font-extrabold text-ink">{mode === "sell" ? "Today's rates" : "Available to buy"}</h2>
                                <p className="text-sm font-medium text-body mt-1">
                                    {mode === "sell" ? "Rates refresh every hour — the rate you see is the rate you get" : "Purchase digital codes delivered instantly to your email"}
                                </p>
                            </div>
                            <Button type="button" onClick={() => { setMode("sell"); document.getElementById("gift-card-options")?.scrollIntoView({ behavior: "smooth" }); }} className="shrink-0 bg-violet-700 text-white font-bold rounded-xl px-5 py-2.5 shadow-sm hover:bg-violet-600">
                                <Tag className="mr-2 h-4 w-4" />
                                {mode === "sell" ? "Sell a card" : "Buy a card"}
                            </Button>
                        </div>

                        {/* Cards Grid */}
                        <div id="gift-card-options" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            {GIFT_CARDS.map((card) => {
                                if (selectedCategory !== "all" && selectedCategory !== card.id) return null;
                                const cardRate = rates?.[card.id];
                                return (
                                <div key={card.id} className="overflow-hidden rounded-2xl border border-border shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md">
                                    <div className={cn("flex h-[120px] items-center justify-center text-white", card.bgColor)}>
                                        <card.icon className="h-10 w-10 opacity-90" />
                                    </div>
                                    <div className="p-4 bg-white">
                                        <h3 className="font-extrabold text-ink text-[15px]">{card.name}</h3>
                                        <p className="text-[11px] font-medium text-muted mt-0.5">{card.desc}</p>
                                        <div className="mt-4 inline-flex items-center rounded-lg">
                                            <div className="text-right">
                                                <span className="text-xs font-bold text-ink">
                                                    {mode === "sell"
                                                        ? (cardRate !== undefined
                                                            ? <>{formatNaira(cardRate)}/USD</>
                                                            : "Checking rate…")
                                                        : "Available now"}
                                                </span>
                                            </div>
                                        </div>
                                        <Button type="button" variant="quiet" onClick={() => mode === "sell" && router.push(`/gift-cards/sell/${card.id}`)} disabled={mode !== "sell"} className="mt-4 w-full bg-violet-50 text-violet-700 font-bold hover:bg-violet-100 rounded-xl h-10">
                                            {mode === "sell" ? "Sell this card" : "Buy this card"}
                                        </Button>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Instructions Section */}
                    {mode === "sell" ? (
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
                                        <h3 className="text-sm font-bold text-ink">Type in the code</h3>
                                        <p className="mt-1 text-[13px] font-medium text-body leading-relaxed">Paste or type the e-code from your card.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-50 text-sm font-bold text-violet-700">
                                        3
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-ink">Get paid in naira</h3>
                                        <p className="mt-1 text-[13px] font-medium text-body leading-relaxed">Most cards are reviewed and paid within 10 minutes.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-3xl border border-border bg-white p-6 shadow-sm sm:p-8">
                            <h2 className="text-[15px] font-extrabold text-ink mb-6">Buying a card</h2>
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8">
                                <div className="flex gap-4">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-50 text-sm font-bold text-violet-700">
                                        1
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-ink">Select brand and value</h3>
                                        <p className="mt-1 text-[13px] font-medium text-body leading-relaxed">Pick the gift card you want and select the denomination.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-50 text-sm font-bold text-violet-700">
                                        2
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-ink">Pay from wallet</h3>
                                        <p className="mt-1 text-[13px] font-medium text-body leading-relaxed">Complete the purchase instantly using your Naira balance.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-50 text-sm font-bold text-violet-700">
                                        3
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-ink">Get your code</h3>
                                        <p className="mt-1 text-[13px] font-medium text-body leading-relaxed">Your digital code is revealed immediately and sent to your email.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
