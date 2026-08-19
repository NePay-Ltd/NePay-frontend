"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
    Copy,
    AlertCircle,
    Check,
    Info,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
    RotateCcw,
    ChevronRight,
    Search,
    ChevronDown,
    ArrowLeft,
    Calculator,
    RefreshCcw,
    Bell,
    Share2,
} from "lucide-react";
import { toast } from "sonner";

import { Panel, PanelBody } from "@/components/shared/panel";

import { RequireKyc } from "@/components/shared/require-kyc";
import { AddressQrCode } from "@/components/shared/address-qr-code";
import { Button } from "@/components/shared/button";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/shared/skeletons";
import {
    useCryptoCurrencies,
    useCryptoPrices,
    useCryptoMinAmount,
    useGenerateDepositAddress,
    useCryptoDepositStatus,
} from "@/lib/queries/crypto";
import { cn } from "@/lib/cn";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import type { CryptoCurrencyDto } from "@/lib/types/api";

interface CoinGroup {
    coin: string;
    variants: CryptoCurrencyDto[];
    representative: CryptoCurrencyDto;
}

function groupByCoin(currencies: CryptoCurrencyDto[]): CoinGroup[] {
    const byCoin = new Map<string, CryptoCurrencyDto[]>();
    for (const currency of currencies) {
        const variants = byCoin.get(currency.coin) ?? [];
        variants.push(currency);
        byCoin.set(currency.coin, variants);
    }
    return Array.from(byCoin.entries()).map(([coin, variants]) => {
        const sorted = [...variants].sort((a, b) => Number(b.recommended) - Number(a.recommended));
        return { coin, variants: sorted, representative: sorted[0]! };
    });
}

/** Display-order preference for the compact "most used" shortlist. */
const SHORTLIST_ORDER = ["USDT", "USDC", "BTC", "ETH", "TRX"];
const SHORTLIST_SIZE = 5;

function rankInShortlist(coin: string): number {
    const index = SHORTLIST_ORDER.indexOf(coin);
    return index === -1 ? SHORTLIST_ORDER.length : index;
}

/** Ticker, coin symbol, and (when curated) display name — searches the full ~300-currency list, not just the shortlist. */
function matchesCoinQuery(group: CoinGroup, query: string): boolean {
    if (group.coin.toLowerCase().includes(query)) {
        return true;
    }
    if (group.representative.name?.toLowerCase().includes(query)) {
        return true;
    }
    return group.variants.some((variant) => variant.code.toLowerCase().includes(query));
}

/** Real icon when curated and one exists; otherwise a generic initial-letter avatar — never a broken image or blank space. */
function CurrencyAvatar({ currency, className }: { currency: CryptoCurrencyDto; className: string }) {
    return currency.iconUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={currency.iconUrl} alt="" className={cn("rounded-full bg-violet-50 object-contain", className)} />
    ) : (
        <span className={cn("flex items-center justify-center rounded-full bg-violet-50 font-bold text-violet-700", className)}>
            {(currency.name ?? currency.coin)[0]?.toUpperCase() ?? "?"}
        </span>
    );
}

function useCountdown(expiresAt: string | undefined) {
    const [remainingMs, setRemainingMs] = React.useState<number | null>(null);

    React.useEffect(() => {
        if (!expiresAt) {
            setRemainingMs(null);
            return;
        }
        const target = new Date(expiresAt).getTime();
        const tick = () => setRemainingMs(Math.max(0, target - Date.now()));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [expiresAt]);

    return remainingMs;
}

function formatCountdown(ms: number) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/** NGN per 1 unit of the coin, formatted for display — null (never a fabricated number) when there's no real price to show. */
function formatNgnPrice(raw: string | null | undefined): string | null {
    if (raw == null) {
        return null;
    }
    const value = Number(raw);
    if (!Number.isFinite(value) || value <= 0) {
        return null;
    }
    return `₦${value.toLocaleString("en-NG", { maximumFractionDigits: value >= 1 ? 2 : 6 })}`;
}

export default function ReceiveCryptoPage() {
    const router = useRouter();

    const { data: currencies, isPending: currenciesLoading, isError: currenciesError, refetch: refetchCurrencies } = useCryptoCurrencies();
    const { data: pricesData, isFetching: pricesFetching, refetch: refetchPrices } = useCryptoPrices();
    const [selectedCode, setSelectedCode] = React.useState<string | null>(null);
    const [openPicker, setOpenPicker] = React.useState(false);
    const [pickerStep, setPickerStep] = React.useState<"coin" | "network">("coin");
    const [pickerCoin, setPickerCoin] = React.useState<string | null>(null);
    const [pickerSearch, setPickerSearch] = React.useState("");
    const [mobileStep, setMobileStep] = React.useState<"list" | "details">("list");

    const coinGroups = React.useMemo(() => groupByCoin(currencies ?? []), [currencies]);
    const activeGroup = coinGroups.find((g) => g.coin === pickerCoin) ?? null;

    // Keep the default picker compact; typing searches the complete catalog.
    const shortlistGroups = React.useMemo(
        () =>
            [...coinGroups]
                .sort((a, b) => rankInShortlist(a.coin) - rankInShortlist(b.coin))
                .slice(0, SHORTLIST_SIZE),
        [coinGroups],
    );

    // Typing a query searches the full list (ticker + display name), not just
    // the shortlist — and replaces it entirely, never shown alongside it.
    const trimmedSearch = pickerSearch.trim().toLowerCase();
    const searchResults = React.useMemo(() => {
        if (!trimmedSearch) {
            return [];
        }
        return coinGroups.filter((g) => matchesCoinQuery(g, trimmedSearch));
    }, [coinGroups, trimmedSearch]);

    const visibleCoinGroups = trimmedSearch ? searchResults : shortlistGroups;

    React.useEffect(() => {
        if (!selectedCode && coinGroups.length > 0) {
            setSelectedCode(coinGroups[0]!.representative.code);
        }
    }, [coinGroups, selectedCode]);

    const handlePickerOpenChange = (open: boolean) => {
        setOpenPicker(open);
        if (!open) {
            setPickerStep("coin");
            setPickerCoin(null);
            setPickerSearch("");
        }
    };

    const selectCoinGroup = (group: CoinGroup) => {
        if (group.variants.length === 1) {
            setSelectedCode(group.representative.code);
            handlePickerOpenChange(false);
            return;
        }
        setPickerCoin(group.coin);
        setPickerStep("network");
        setPickerSearch("");
    };

    const selectedCurrency = currencies?.find((c) => c.code === selectedCode) ?? null;



    const { data: minAmountData, isPending: minAmountLoading } = useCryptoMinAmount(selectedCode);

    const {
        mutate: generateAddress,
        data: depositData,
        isPending: addressPending,
        isError: addressError,
        reset: resetAddress,
    } = useGenerateDepositAddress();

    React.useEffect(() => {
        if (selectedCode) {
            resetAddress();
            generateAddress({ currency: selectedCode });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCode]);

    // Prefer the confirmed amount for the actual session the provider
    // accepted (depositData.expectedAmount) over the pre-session estimate
    // (minAmountData.minAmount) the moment it's available — the provider's
    // real minimum can exceed that earlier estimate (see backend's own
    // note), so the two are never shown as if interchangeable; the more
    // specific number always wins.
    const displayMinAmount = depositData?.expectedAmount ?? minAmountData?.minAmount ?? null;
    const displayMinAmountLoading = !depositData?.expectedAmount && minAmountLoading;
    const displayMinAmountUsd =
        displayMinAmount !== null && minAmountData?.usdOneEquivalent
            ? displayMinAmount / minAmountData.usdOneEquivalent
            : null;

    const formatUsd = (amount: number | null) =>
        amount === null || !Number.isFinite(amount)
            ? null
            : `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const remainingMs = useCountdown(depositData?.expiresAt ?? undefined);
    const addressExpired = depositData?.expiresAt !== undefined && remainingMs !== null && remainingMs <= 0;

    const { data: statusData } = useCryptoDepositStatus(addressExpired ? null : depositData?.paymentId ?? null);
    const status = statusData?.status;

    const handleCopy = (value: string, label: string) => {
        navigator.clipboard.writeText(value);
        toast.success(`${label} copied to clipboard`);
    };

    const handleRetry = () => {
        if (!selectedCode) return;
        resetAddress();
        generateAddress({ currency: selectedCode });
    };

    return (
        <RequireKyc tier="FULL_BVN_NIN">
            {/* ── Mobile 2-Step Flow ────────────────────────────────────────────────── */}
            <div className="md:hidden bg-white min-h-[100dvh]">
                {mobileStep === "list" ? (
                    <div className="pb-24">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-4 pt-6">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => {
                                        if (pickerStep === "network") {
                                            setPickerStep("coin");
                                            setPickerCoin(null);
                                            setPickerSearch("");
                                        } else {
                                            router.back();
                                        }
                                    }}
                                    className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-50 border border-gray-100 text-ink"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </button>
                                <div>
                                    <h1 className="text-[22px] font-black text-ink leading-none tracking-tight">
                                        {pickerStep === "network" && activeGroup
                                            ? `Select network for ${activeGroup.representative.name ?? activeGroup.coin}`
                                            : "Select asset"}
                                    </h1>
                                    {pickerStep === "coin" ? (
                                        <div className="flex items-center gap-1.5 mt-1.5">
                                            <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                                            <span className="text-[11px] font-bold text-muted">Live prices</span>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                            {pickerStep === "coin" ? (
                                <div className="flex items-center gap-2">
                                    <button
                                        className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-50 border border-gray-100 text-ink active:scale-95 transition-transform"
                                        onClick={() => {
                                            refetchCurrencies();
                                            refetchPrices();
                                        }}
                                    >
                                        <RefreshCcw className={cn("h-4 w-4", (currenciesLoading || pricesFetching) && "animate-spin text-muted")} />
                                    </button>
                                </div>
                            ) : null}
                        </div>

                        {pickerStep === "coin" ? (
                            <>
                                {/* Search — same behavior as the desktop picker: typing searches the
                                    full currency list and replaces the shortlist entirely. */}
                                <div className="px-5 mt-2">
                                    <div className="flex items-center gap-2 rounded-xl border border-border bg-gray-50 px-3 h-11">
                                        <Search className="h-4 w-4 text-muted shrink-0" />
                                        <input
                                            value={pickerSearch}
                                            onChange={(e) => setPickerSearch(e.target.value)}
                                            placeholder="Search all coins..."
                                            className="flex-1 bg-transparent text-sm font-medium text-ink placeholder:text-muted outline-none"
                                        />
                                    </div>
                                </div>

                                {/* List — shortlist by default, full-catalog search results once typing */}
                                <div className="px-5 mt-6 flex flex-col gap-8">
                                    {!trimmedSearch ? (
                                        <div className="text-[11px] font-extrabold text-muted uppercase tracking-widest -mb-4">Most used</div>
                                    ) : null}
                                    {currenciesLoading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <div key={i} className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <Skeleton className="h-9 w-9 rounded-full" />
                                                    <div className="space-y-2">
                                                        <Skeleton className="h-4 w-24" />
                                                        <Skeleton className="h-3 w-16" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2 flex flex-col items-end">
                                                    <Skeleton className="h-4 w-16" />
                                                    <Skeleton className="h-3 w-12" />
                                                </div>
                                            </div>
                                        ))
                                    ) : visibleCoinGroups.length === 0 ? (
                                        <p className="text-center text-sm font-medium text-muted py-6">No coins found.</p>
                                    ) : visibleCoinGroups.map(group => {
                                        const price = formatNgnPrice(pricesData?.prices[group.coin]);
                                        return (
                                            <div
                                                key={group.coin}
                                                className="flex items-center justify-between cursor-pointer active:opacity-70 transition-opacity"
                                                onClick={() => {
                                                    const singleNetwork = group.variants.length === 1;
                                                    selectCoinGroup(group);
                                                    if (singleNetwork) {
                                                        setMobileStep("details");
                                                    }
                                                }}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <CurrencyAvatar currency={group.representative} className="h-9 w-9 text-base" />
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-extrabold text-[16px] text-ink">{group.representative.name || group.coin}</span>
                                                            <span className="text-[13px] font-bold text-muted">{group.coin}</span>
                                                            {group.coin === 'BTC' && (
                                                                <span className="px-2 py-0.5 rounded bg-green-50 text-green-700 text-[9px] font-black uppercase tracking-widest ml-1">Popular</span>
                                                            )}
                                                        </div>
                                                        <div className="text-[11px] font-bold text-muted mt-1 uppercase tracking-widest">
                                                            {group.variants.length > 1 ? `${group.variants.length} NETWORKS` : group.variants.map(v => v.network || v.code).join(' · ')}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    {price ? (
                                                        <div className="font-black text-[17px] text-ink">{price}</div>
                                                    ) : (
                                                        <div className="text-[11px] font-bold text-muted uppercase tracking-wide">Price unavailable</div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        ) : activeGroup ? (
                            /* Network sub-step — same list every network chooser in this app uses */
                            <div className="px-5 mt-6 flex flex-col gap-6">
                                {activeGroup.variants.map((currency) => (
                                    <div
                                        key={currency.code}
                                        className="flex items-center justify-between cursor-pointer active:opacity-70 transition-opacity"
                                        onClick={() => {
                                            setSelectedCode(currency.code);
                                            handlePickerOpenChange(false);
                                            setMobileStep("details");
                                        }}
                                    >
                                        <span className="font-extrabold text-[16px] text-ink uppercase">
                                            {currency.network ?? "Mainnet"}
                                        </span>
                                        {currency.recommended ? (
                                            <span className="text-[10px] font-bold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-sm uppercase tracking-wider">
                                                Recommended
                                            </span>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        ) : null}
                    </div>
                ) : (
                    <div className="pb-32 flex flex-col items-center">
                        {/* Header */}
                        <div className="w-full flex items-center justify-between px-4 py-4 pt-6">
                            <button onClick={() => setMobileStep("list")} className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-50 border border-gray-100 text-ink">
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                            <div className="flex items-center gap-2">
                                <button className="flex h-11 w-11 items-center justify-center rounded-full bg-green-50 border border-green-100 text-green-600">
                                    <Bell className="h-4 w-4" />
                                </button>
                                <button className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-50 border border-gray-100 text-ink">
                                    <Share2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* QR container */}
                        <div className="mt-2 p-5 rounded-[40px] border-[3px] border-orange-50 bg-white shadow-sm inline-block relative">
                            {addressPending ? (
                                <Skeleton className="h-[200px] w-[200px]" />
                            ) : depositData?.address ? (
                                <AddressQrCode address={depositData.address} size={220} />
                            ) : null}
                            
                            {/* Small Logo overlay in the middle of QR */}
                            {selectedCurrency?.iconUrl && !addressPending && depositData?.address && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-1 rounded-full shadow-sm">
                                    <img src={selectedCurrency.iconUrl} className="h-8 w-8 rounded-full" alt="" />
                                </div>
                            )}
                        </div>
                        <div className="mt-5 font-bold text-orange-400 uppercase tracking-widest text-[13px]">
                            {selectedCurrency?.coin}
                        </div>

                        {/* Address */}
                        <div className="mt-6 flex items-center gap-3 max-w-[85%] mx-auto">
                            <span className="font-mono text-[13px] font-bold text-ink truncate block">
                                {depositData?.address || "—"}
                            </span>
                            <button onClick={() => depositData?.address && handleCopy(depositData.address, "Address")} className="shrink-0 text-muted hover:text-ink bg-gray-100 p-1 rounded">
                                <Copy className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        
                        {/* Divider */}
                        <div className="w-10 h-[3px] rounded-full bg-orange-100/60 mt-8 mb-8"></div>

                        {/* Details Box */}
                        <div className="w-full px-6">
                            <h4 className="text-[11px] font-extrabold text-muted uppercase tracking-widest mb-5">Accepted Here</h4>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    {selectedCurrency?.iconUrl && <img src={selectedCurrency.iconUrl} className="h-4 w-4 rounded-full object-contain" alt="" />}
                                    <span className="font-bold text-ink text-[15px]">{selectedCurrency?.coin} ({selectedCurrency?.network?.toLowerCase() ?? 'native'})</span>
                                </div>
                                <div className="font-black text-ink text-[15px]">
                                    {minAmountData?.usdOneEquivalent
                                        ? `$${(1 / minAmountData.usdOneEquivalent).toLocaleString("en-US", { maximumFractionDigits: 6 })}`
                                        : "Price unavailable"}
                                </div>
                            </div>
                            
                            <div className="text-[13px] font-medium text-muted flex items-center gap-2 mt-2">
                                <span>
                                    Min deposit{" "}
                                    <strong className="font-bold text-ink">
                                        {displayMinAmountUsd !== null ? formatUsd(displayMinAmountUsd) : "…"}
                                    </strong>
                                </span>
                            </div>
                            {/* No pre-send fee estimate exists: NOWPayments only reports the real
                                on-chain fee (fee.depositFee) in the settlement webhook, after a deposit
                                completes — never up front. Generic, honest copy here instead of either a
                                fabricated number or an "unavailable" label that reads as broken. The real
                                figure could be shown post-settlement in transaction history, where it'd be
                                a fact rather than a guess — separate future work. */}
                            <div className="text-[13px] font-medium text-muted mt-2">
                                Network fee · <strong className="font-bold text-ink">Deducted automatically</strong>
                            </div>
                            <div className="text-[13px] font-medium text-muted mt-2">
                                Deposit limit · <strong className="font-bold text-ink">Unlimited</strong>
                            </div>

                            <div className="mt-10 text-[13px] font-medium text-muted leading-[1.6]">
                                Send <strong className="font-bold text-red-500">{selectedCurrency?.coin} on the {selectedCurrency?.network ?? selectedCurrency?.coin} network only.</strong>
                                <br/>Coins sent on any other chain or to a wrong address are permanently lost and cannot be recovered.
                            </div>
                        </div>

                        {/* Overview Button */}
                        <div className="w-full mt-8 px-4 pb-12">
                            <Button
                                variant="primary"
                                className="w-full h-[56px] rounded-[18px] bg-violet-700 hover:bg-violet-800 font-bold text-[17px] flex items-center justify-between px-6 shadow-xl shadow-violet-200/50 transition-all active:scale-95"
                                onClick={() => router.push("/")}
                            >
                                <span className="text-white">Back to Overview</span>
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
                                    <ArrowLeft className="h-4 w-4 text-white rotate-180" strokeWidth={2.5} />
                                </div>
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Desktop Layout ────────────────────────────────────────────────────── */}
            <div className="hidden md:block mx-auto max-w-md pb-24 space-y-6">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-black text-ink tracking-tight">Deposit Crypto</h1>
                    <p className="mt-1 text-sm font-medium text-muted">
                        Instantly converted to Naira
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:gap-8">
                    {/* ── Left Panel (Selection & QR) ─────────────────────────────── */}
                    <div className="space-y-6 xl:col-span-7">
                        <Panel className="rounded-[24px]">
                            <PanelBody className="p-6 sm:p-8">
                                {/* Asset Picker */}
                                <div className="mb-6">
                                    <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-muted">Select Asset</label>
                                    {currenciesLoading ? (
                                        <Skeleton className="h-14 w-full rounded-xl" />
                                    ) : currenciesError || !currencies?.length ? (
                                        <EmptyState
                                            icon={AlertCircle}
                                            heading="Couldn't load assets"
                                            description="We couldn't fetch the list of supported currencies."
                                            className="py-6"
                                        />
                                    ) : (
                                        <Popover open={openPicker} onOpenChange={handlePickerOpenChange}>
                                            <PopoverTrigger asChild>
                                                <button data-testid="asset-picker-trigger" className="flex h-14 w-full items-center justify-between rounded-xl border border-border bg-white px-4 transition-all hover:border-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600">
                                                    <div className="flex items-center gap-3">
                                                        {selectedCurrency ? (
                                                            <CurrencyAvatar currency={selectedCurrency} className="h-8 w-8 text-base shadow-sm" />
                                                        ) : (
                                                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-50 text-base shadow-sm">?</span>
                                                        )}
                                                        <div className="flex flex-col items-start">
                                                            <span className="text-sm font-extrabold text-ink">{selectedCurrency?.name ?? selectedCurrency?.code.toUpperCase() ?? "Select an asset"}</span>
                                                            {selectedCurrency ? (
                                                                <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
                                                                    {selectedCurrency.code}{selectedCurrency.network ? ` · ${selectedCurrency.network}` : ""}
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                    <ChevronDown className="h-4 w-4 text-muted" />
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[300px] sm:w-[400px] p-0 rounded-[16px] overflow-hidden" align="start">
                                                {pickerStep === "network" && activeGroup ? (
                                                    <Command>
                                                        <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setPickerStep("coin");
                                                                    setPickerCoin(null);
                                                                    setPickerSearch("");
                                                                }}
                                                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted hover:bg-gray-100 hover:text-ink"
                                                                aria-label="Back to coins"
                                                            >
                                                                <ChevronDown className="h-4 w-4 rotate-90" />
                                                            </button>
                                                            <span className="text-[13px] font-extrabold text-ink">
                                                                Select network for {activeGroup.representative.name ?? activeGroup.coin}
                                                            </span>
                                                        </div>
                                                        <CommandInput
                                                            placeholder="Search networks..."
                                                            value={pickerSearch}
                                                            onValueChange={setPickerSearch}
                                                        />
                                                        <CommandList className="max-h-[300px]">
                                                            <CommandEmpty>No networks found.</CommandEmpty>
                                                            <CommandGroup>
                                                                {activeGroup.variants.map((currency) => (
                                                                    <CommandItem
                                                                        key={currency.code}
                                                                        value={`${currency.network ?? currency.code}`}
                                                                        onSelect={() => {
                                                                            setSelectedCode(currency.code);
                                                                            handlePickerOpenChange(false);
                                                                        }}
                                                                        className="cursor-pointer py-3"
                                                                    >
                                                                        <Check className={cn("mr-3 h-4 w-4", selectedCode === currency.code ? "opacity-100 text-violet-600" : "opacity-0")} />
                                                                        <div className="flex flex-1 items-center justify-between">
                                                                            <span className="font-bold text-ink text-[13px] uppercase">
                                                                                {currency.network ?? "Mainnet"}
                                                                            </span>
                                                                            {currency.recommended ? (
                                                                                <span className="text-[10px] font-bold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-sm uppercase tracking-wider">
                                                                                    Recommended
                                                                                </span>
                                                                            ) : null}
                                                                        </div>
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                ) : (
                                                    <Command shouldFilter={false}>
                                                        <CommandInput
                                                            placeholder="Search all coins..."
                                                            value={pickerSearch}
                                                            onValueChange={setPickerSearch}
                                                        />
                                                        <CommandList className="max-h-[300px]">
                                                            <CommandEmpty>No coins found.</CommandEmpty>
                                                            <CommandGroup heading={trimmedSearch ? "Search results" : "Most used"}>
                                                                {visibleCoinGroups.map((group) => (
                                                                    <CommandItem
                                                                        key={group.coin}
                                                                        value={group.coin}
                                                                        onSelect={() => selectCoinGroup(group)}
                                                                        className="cursor-pointer py-3"
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-3 h-4 w-4 shrink-0",
                                                                                group.variants.some((v) => v.code === selectedCode) ? "opacity-100 text-violet-600" : "opacity-0",
                                                                            )}
                                                                        />
                                                                        <CurrencyAvatar currency={group.representative} className="mr-3 h-6 w-6 shrink-0 text-[11px]" />
                                                                        <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
                                                                            <span className="font-bold text-ink text-[13px] truncate">
                                                                                {group.representative.name ?? group.coin}
                                                                            </span>
                                                                            {group.variants.length > 1 ? (
                                                                                <span className="shrink-0 text-[10px] font-bold bg-gray-100 px-2 py-0.5 rounded-sm text-muted uppercase tracking-wider">
                                                                                    {group.variants.length} networks
                                                                                </span>
                                                                            ) : group.representative.network ? (
                                                                                <span className="shrink-0 text-[10px] font-bold bg-gray-100 px-2 py-0.5 rounded-sm text-muted uppercase tracking-wider">
                                                                                    {group.representative.network}
                                                                                </span>
                                                                            ) : null}
                                                                        </div>
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                )}
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                </div>

                                <div className="p-4 sm:p-6 flex flex-col items-center">
                                    {/* Minimum amount warning pill */}
                                    {selectedCode && (displayMinAmountLoading || displayMinAmount !== null) ? (
                                        <div className="mb-6 flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-4 py-1.5">
                                            <Info className="h-3.5 w-3.5 text-amber-600" />
                                            {displayMinAmountLoading ? (
                                                <Skeleton className="h-3 w-32" />
                                            ) : (
                                                <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wide">
                                                    Min Deposit: {formatUsd(displayMinAmountUsd) ?? "Unavailable"}
                                                        Min Deposit: {formatUsd(displayMinAmountUsd) ?? "Unavailable"}
                                                </span>
                                            )}
                                        </div>
                                    ) : null}

                                    {/* QR Code Container */}
                                    <div className="relative flex h-[260px] w-[260px] items-center justify-center rounded-[40px] bg-white shadow-[0_20px_60px_-15px_rgba(139,92,246,0.3)] border border-violet-100 p-3 mb-10 transition-shadow hover:shadow-[0_20px_60px_-10px_rgba(139,92,246,0.4)]">
                                        {addressPending ? (
                                            <Skeleton className="h-full w-full rounded-[32px]" />
                                        ) : addressError || addressExpired ? (
                                            <EmptyState
                                                icon={AlertCircle}
                                                heading={addressExpired ? "Address expired" : "Generation failed"}
                                                description={addressExpired ? "This deposit window has closed." : "Could not fetch deposit address."}
                                                action={{ label: "Regenerate", onClick: handleRetry }}
                                                className="py-0 scale-90"
                                            />
                                        ) : depositData?.address ? (
                                            <AddressQrCode address={depositData.address} size={210} />
                                        ) : null}
                                    </div>

                                    {/* Address-expiry countdown */}
                                    {depositData?.expiresAt && !addressExpired && remainingMs !== null ? (
                                        <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-muted">
                                            <Clock className="h-3.5 w-3.5" />
                                            Address valid for {formatCountdown(remainingMs)}
                                        </div>
                                    ) : null}

                                    {/* Address Display */}
                                    <div className="mt-8 w-full max-w-md">
                                        <label className="mb-2 block text-center text-[11px] font-bold uppercase tracking-widest text-muted">Deposit Address</label>
                                        <div className="flex w-full items-center justify-between rounded-xl border border-border bg-gray-50 p-1.5 transition-colors focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-600">
                                            <div className="flex-1 overflow-x-auto px-3 scrollbar-hide">
                                                {addressPending ? (
                                                    <Skeleton className="h-5 w-48" />
                                                ) : (
                                                    <span className="font-mono text-[13px] font-bold text-ink whitespace-nowrap">
                                                        {depositData?.address || "—"}
                                                    </span>
                                                )}
                                            </div>
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                className="shrink-0 rounded-lg px-4 h-9 font-bold bg-violet-700 hover:bg-violet-600"
                                                onClick={() => depositData?.address && handleCopy(depositData.address, "Address")}
                                                disabled={!depositData?.address || addressPending || addressExpired}
                                            >
                                                <Copy className="mr-1.5 h-3.5 w-3.5" />
                                                Copy
                                            </Button>
                                        </div>

                                        {/* Network warning — same visual prominence as the memo/tag warning below, never a footnote */}
                                        {selectedCurrency?.network ? (
                                            <div className="mt-3 flex items-center gap-2 rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3">
                                                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                                                <p className="text-xs font-bold text-red-900">
                                                    Only send {(selectedCurrency.name ?? selectedCurrency.coin).toUpperCase()} on the{" "}
                                                    <span className="uppercase">{selectedCurrency.network}</span> network. Sending via any other network will result in permanent loss of funds.
                                                </p>
                                            </div>
                                        ) : null}

                                        {/* Memo Row */}
                                        {depositData?.payMemo ? (
                                            <div className="w-full bg-amber-50/50 backdrop-blur-sm rounded-[20px] p-4 border border-amber-100 mt-3 shadow-sm group relative overflow-hidden">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-[11px] font-bold text-amber-500 uppercase tracking-widest">Memo / Tag (Required)</span>
                                                </div>
                                                <div className="flex items-center justify-between gap-3">
                                                    <span className="font-mono text-sm font-black text-amber-700 break-all leading-tight">
                                                        {depositData.payMemo}
                                                    </span>
                                                    <button
                                                        className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md border border-amber-100 text-amber-500 hover:scale-105 active:scale-95 transition-transform"
                                                        onClick={() => handleCopy(depositData.payMemo!, "Memo")}
                                                        disabled={addressExpired}
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : null}

                                        {/* Address-expiry countdown */}
                                        {depositData?.expiresAt && !addressExpired && remainingMs !== null ? (
                                            <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-muted">
                                                <Clock className="h-3.5 w-3.5" />
                                                Address expires in {formatCountdown(remainingMs)}
                                            </div>
                                        ) : null}

                                        {/* Status banner */}
                                        {status ? (
                                            <div className="w-full mt-6">
                                                <StatusBanner status={status} statusData={statusData} onRetry={handleRetry} />
                                            </div>
                                        ) : null}
                                    </div>
                                </div>

                                {/* Instructions Box */}
                                <div className="rounded-[24px] bg-gray-50 p-6 border border-border">
                                    <div className="flex items-start gap-3 mb-4">
                                        <Info className="h-5 w-5 text-violet-600 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-sm font-bold text-ink">Important Note</h4>
                                            <p className="text-xs font-medium text-muted mt-1 leading-relaxed">
                                                Send only <strong className="font-bold text-ink">{(selectedCurrency?.name ?? selectedCurrency?.code)?.toUpperCase() ?? "this asset"}</strong>{selectedCurrency?.network ? <> on the <strong className="font-bold text-ink">{selectedCurrency.network}</strong> network</> : null} to this address. Using a different network will result in permanent loss of funds.
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="quiet"
                                        className="w-full bg-white font-bold h-12 rounded-xl text-sm shadow-sm border border-border hover:bg-gray-50"
                                        onClick={() => router.push("/transactions?type=Deposits")}
                                    >
                                        View Deposit History
                                    </Button>
                                </div>
                            </PanelBody>
                        </Panel>
                    </div>
                </div>
            </div>
        </RequireKyc>
    );
}

function StatusBanner({
    status,
    statusData,
    onRetry,
}: {
    status: string;
    statusData: { expectedAmount: number; actuallyPaid: number | null; creditedAmount: number | null; creditedCurrency: string | null; payCurrency: string } | undefined;
    onRetry: () => void;
}) {
    switch (status) {
        case "waiting":
                        return (
                        <Banner tone="pending" icon={<span className="relative flex h-3 w-3"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" /><span className="relative inline-flex h-3 w-3 rounded-full bg-violet-600" /></span>}>
                            Waiting for your deposit...
                        </Banner>
                        );
                        case "confirming":
                        case "confirmed":
                        case "sending":
                        return (
                        <Banner tone="pending" icon={<Loader2 className="h-4 w-4 animate-spin text-violet-600" />}>
                            Deposit detected, confirming on the network...
                        </Banner>
                        );
                        case "finished":
                        return (
                        <Banner tone="success" icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}>
                            Deposit confirmed — {statusData?.creditedAmount?.toLocaleString()} {statusData?.creditedCurrency} credited.
                        </Banner>
                        );
                        case "partially_paid":
                        return (
                        <Banner tone="warning" icon={<AlertCircle className="h-4 w-4 text-amber-600" />}>
                            Partial payment. Expected {statusData?.expectedAmount} {statusData?.payCurrency}.
                        </Banner>
                        );
                        case "failed":
                        return (
                        <Banner tone="error" icon={<XCircle className="h-4 w-4 text-red-600" />} action={{ label: "Regenerate", onClick: onRetry }}>
                            Deposit failed.
                        </Banner>
                        );
                        case "expired":
                        return (
                        <Banner tone="error" icon={<XCircle className="h-4 w-4 text-red-600" />} action={{ label: "Regenerate", onClick: onRetry }}>
                            Deposit window expired.
                        </Banner>
                        );
                        case "refunded":
                        return (
                        <Banner tone="warning" icon={<RotateCcw className="h-4 w-4 text-amber-600" />}>
                            Deposit refunded.
                        </Banner>
                        );
                        default:
                        return null;
    }
}

                        function Banner({
                            tone,
                            icon,
                            children,
                            action,
}: {
                            tone: "pending" | "success" | "warning" | "error";
                        icon: React.ReactNode;
                        children: React.ReactNode;
                        action?: {label: string; onClick: () => void };
}) {
    const toneClasses = {
                            pending: "border-violet-200 bg-violet-50 text-violet-900",
                        success: "border-green-200 bg-green-50 text-green-900",
                        warning: "border-amber-200 bg-amber-50 text-amber-900",
                        error: "border-red-200 bg-red-50 text-red-900",
    }[tone];

                        return (
                        <div className={cn("flex items-center justify-between gap-3 rounded-2xl border px-4 py-3", toneClasses)}>
                            <div className="flex items-center gap-2.5">
                                {icon}
                                <p className="text-[13px] font-bold">{children}</p>
                            </div>
                            {action ? (
                                <Button variant="quiet" size="sm" className="shrink-0 h-8 rounded-lg text-xs font-bold" onClick={action.onClick}>
                                    {action.label}
                                </Button>
                            ) : null}
                        </div>
                        );
}
