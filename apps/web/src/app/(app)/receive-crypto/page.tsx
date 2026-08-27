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
import { formatNaira, formatByCurrency } from "@/lib/format";
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



export default function ReceiveCryptoPage() {
    const router = useRouter();

    const { data: currencies, isPending: currenciesLoading, isError: currenciesError, refetch: refetchCurrencies } = useCryptoCurrencies();
    const { data: pricesData, isFetching: pricesFetching, refetch: refetchPrices } = useCryptoPrices();
    const [selectedCode, setSelectedCode] = React.useState<string | null>(null);
    const [openPicker, setOpenPicker] = React.useState(false);
    const [pickerStep, setPickerStep] = React.useState<"coin" | "network">("coin");
    const [pickerCoin, setPickerCoin] = React.useState<string | null>(null);
    const [pickerSearch, setPickerSearch] = React.useState("");

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
        displayMinAmount !== null && minAmountData?.usdOneEquivalent && minAmountData.minimumSource !== "unavailable"
            ? displayMinAmount / minAmountData.usdOneEquivalent
            : null;

    const minimumIsExact = Boolean(depositData?.expectedAmount) || minAmountData?.minimumSource === "exact";
    const minimumDisplayLabel = minimumIsExact
        ? "Min deposit"
        : minAmountData?.minimumSource === "estimated"
            ? "Estimated minimum"
            : "Minimum unavailable";


    const formatCrypto = (amount: number | null) =>
        amount === null || !Number.isFinite(amount)
            ? null
            : amount.toLocaleString("en-US", { maximumFractionDigits: 8 });
    const minimumDisplayValue = minimumIsExact
        ? `${formatCrypto(displayMinAmount)} ${selectedCurrency?.coin ?? ""}`.trim()
        : minAmountData?.minimumSource === "estimated"
            ? (displayMinAmountUsd == null || !Number.isFinite(displayMinAmountUsd) ? null : formatByCurrency(displayMinAmountUsd, "USD"))
            : null;
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
        <RequireKyc>
            <div className="mx-auto max-w-5xl pb-12 md:pb-20 space-y-6 px-6 pt-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-ink tracking-tight">Deposit Crypto</h1>
                    <p className="mt-2 text-base font-medium text-muted">
                        Instantly converted to Naira at the best market rates
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
                    {/* ── Left Panel (Selection & Info) ─────────────────────────────── */}
                    <div className="space-y-6 lg:col-span-7">
                        <Panel>
                            <PanelBody className="p-6 sm:p-8">
                                {/* Asset Picker */}
                                <div className="mb-8">
                                    <label className="mb-2.5 block text-xs font-bold uppercase tracking-widest text-muted">Select Asset</label>
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
                                                <button data-testid="asset-picker-trigger" className="flex h-16 w-full items-center justify-between rounded-xl border border-border bg-gray-50 dark:bg-white/5 px-5 transition-all hover:border-violet-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600">
                                                    <div className="flex items-center gap-4">
                                                        {selectedCurrency ? (
                                                            <CurrencyAvatar currency={selectedCurrency} className="h-9 w-9 text-base shadow-sm" />
                                                        ) : (
                                                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-50 text-base shadow-sm">?</span>
                                                        )}
                                                        <div className="flex flex-col items-start">
                                                            <span className="text-base font-bold text-ink">{selectedCurrency?.name ?? selectedCurrency?.code.toUpperCase() ?? "Select an asset"}</span>
                                                            {selectedCurrency ? (
                                                                <span className="text-[11px] font-bold text-muted uppercase tracking-wider mt-0.5">
                                                                    {selectedCurrency.code}{selectedCurrency.network ? ` · ${selectedCurrency.network}` : ""}
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                    <ChevronDown className="h-5 w-5 text-muted" />
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[300px] sm:w-[420px] p-0 rounded-2xl overflow-hidden border-border bg-white dark:bg-gray-900 shadow-xl" align="start">
                                                {pickerStep === "network" && activeGroup ? (
                                                    <Command>
                                                        <div className="flex items-center gap-2 border-b border-border px-3 py-3">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setPickerStep("coin");
                                                                    setPickerCoin(null);
                                                                    setPickerSearch("");
                                                                }}
                                                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-ink transition-colors"
                                                                aria-label="Back to coins"
                                                            >
                                                                <ChevronDown className="h-4 w-4 rotate-90" />
                                                            </button>
                                                            <span className="text-sm font-bold text-ink">
                                                                Select network for {activeGroup.representative.name ?? activeGroup.coin}
                                                            </span>
                                                        </div>
                                                        <CommandInput
                                                            placeholder="Search networks..."
                                                            value={pickerSearch}
                                                            onValueChange={setPickerSearch}
                                                            className="text-sm"
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
                                                                        className="cursor-pointer py-3.5 px-4"
                                                                    >
                                                                        <Check className={cn("mr-3 h-4 w-4", selectedCode === currency.code ? "opacity-100 text-violet-600" : "opacity-0")} />
                                                                        <div className="flex flex-1 items-center justify-between">
                                                                            <span className="font-bold text-ink text-[13px] uppercase">
                                                                                {currency.network ?? "Mainnet"}
                                                                            </span>
                                                                            {currency.recommended ? (
                                                                                <span className="text-[10px] font-bold bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 px-2 py-0.5 rounded-sm uppercase tracking-wider">
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
                                                            className="text-sm"
                                                        />
                                                        <CommandList className="max-h-[350px]">
                                                            <CommandEmpty>No coins found.</CommandEmpty>
                                                            <CommandGroup heading={trimmedSearch ? "Search results" : "Most used"}>
                                                                {visibleCoinGroups.map((group) => (
                                                                    <CommandItem
                                                                        key={group.coin}
                                                                        value={group.coin}
                                                                        onSelect={() => selectCoinGroup(group)}
                                                                        className="cursor-pointer py-3.5 px-4"
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-3 h-4 w-4 shrink-0",
                                                                                group.variants.some((v) => v.code === selectedCode) ? "opacity-100 text-violet-600" : "opacity-0",
                                                                            )}
                                                                        />
                                                                        <CurrencyAvatar currency={group.representative} className="mr-3 h-7 w-7 shrink-0 text-xs" />
                                                                        <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
                                                                            <span className="font-bold text-ink text-sm truncate">
                                                                                {group.representative.name ?? group.coin}
                                                                            </span>
                                                                            {group.variants.length > 1 ? (
                                                                                <span className="shrink-0 text-[10px] font-bold bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md text-muted uppercase tracking-wider">
                                                                                    {group.variants.length} networks
                                                                                </span>
                                                                            ) : group.representative.network ? (
                                                                                <span className="shrink-0 text-[10px] font-bold bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md text-muted uppercase tracking-wider">
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

                                {/* Deposit Details */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between py-3 border-b border-border">
                                        <span className="text-sm font-medium text-muted">Minimum Deposit</span>
                                        <div className="text-right">
                                            {displayMinAmountLoading ? (
                                                <Skeleton className="h-5 w-24" />
                                            ) : minimumDisplayValue ? (
                                                <span className="text-sm font-bold text-ink">{minimumDisplayValue}</span>
                                            ) : (
                                                <span className="text-sm font-medium text-muted">Calculating...</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between py-3 border-b border-border">
                                        <span className="text-sm font-medium text-muted">Exchange Rate</span>
                                        <div className="text-right">
                                            <span className="text-sm font-bold text-ink">
                                                {minAmountData?.usdNgnRate
                                                    ? `${formatNaira(minAmountData.usdNgnRate)} / $1`
                                                    : "Market rate"}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between py-3 border-b border-border">
                                        <span className="text-sm font-medium text-muted">Deposit Fee</span>
                                        <div className="text-right">
                                            <span className="text-sm font-bold text-green-600 dark:text-green-400">Free</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between py-3">
                                        <span className="text-sm font-medium text-muted">Deposit Limit</span>
                                        <div className="text-right">
                                            <span className="text-sm font-bold text-ink">Unlimited</span>
                                        </div>
                                    </div>
                                </div>
                            </PanelBody>
                        </Panel>

                        {/* Instructions Box */}
                        <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/10 p-5 border border-amber-200 dark:border-amber-900/30 flex gap-4 items-start">
                            <Info className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400">Important Instructions</h4>
                                <ul className="text-sm font-medium text-amber-800 dark:text-amber-500 mt-2 space-y-2 list-disc pl-4 leading-relaxed">
                                    <li>Send only <strong className="font-bold text-amber-950 dark:text-amber-300">{(selectedCurrency?.name ?? selectedCurrency?.code)?.toUpperCase() ?? "this asset"}</strong>{selectedCurrency?.network ? <> on the <strong className="font-bold text-amber-950 dark:text-amber-300">{selectedCurrency.network}</strong> network</> : null} to this address.</li>
                                    <li>Sending via any other network will result in permanent loss of funds.</li>
                                    <li>Deposits are automatically converted to Naira upon network confirmation.</li>
                                </ul>
                            </div>
                        </div>

                        <Button
                            variant="ghost"
                            className="w-full font-bold h-12 rounded-xl text-sm border-2 border-border text-ink hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                            onClick={() => router.push("/transactions?type=Deposits")}
                        >
                            View Deposit History
                        </Button>
                    </div>

                    {/* ── Right Panel (QR & Address) ─────────────────────────────── */}
                    <div className="lg:col-span-5">
                        <Panel className="h-full">
                            <PanelBody className="flex flex-col items-center justify-center p-6 sm:p-8 h-full">
                                {/* Network warning banner */}
                                {selectedCurrency?.network ? (
                                    <div className="w-full mb-8 flex items-center justify-center gap-2 rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3">
                                        <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                                        <p className="text-xs font-bold text-red-900 dark:text-red-300 text-center">
                                            Only send on the <span className="uppercase font-black">{selectedCurrency.network}</span> network
                                        </p>
                                    </div>
                                ) : null}

                                {/* QR Code Container */}
                                <div className="relative flex h-[240px] w-[240px] items-center justify-center rounded-3xl bg-white shadow-[0_10px_40px_-15px_rgba(139,92,246,0.2)] border border-gray-100 mb-8 p-3">
                                    {addressPending ? (
                                        <Skeleton className="h-full w-full rounded-3xl" />
                                    ) : addressError || addressExpired ? (
                                        <EmptyState
                                            icon={AlertCircle}
                                            heading={addressExpired ? "Address expired" : "Generation failed"}
                                            description={addressExpired ? "This deposit window has closed." : "Could not fetch deposit address."}
                                            action={{ label: "Regenerate", onClick: handleRetry }}
                                            className="py-0 scale-90"
                                        />
                                    ) : depositData?.address ? (
                                        <>
                                            <AddressQrCode address={depositData.address} size={200} />
                                            {selectedCurrency?.iconUrl && (
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-1 rounded-full shadow-md">
                                                    <img src={selectedCurrency.iconUrl} className="h-8 w-8 rounded-full" alt="" />
                                                </div>
                                            )}
                                        </>
                                    ) : null}
                                </div>

                                {/* Address Display */}
                                <div className="w-full">
                                    <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-muted text-left">Deposit Address</label>
                                    <div className="flex w-full items-center justify-between rounded-xl border border-border bg-gray-50 dark:bg-white/5 p-1.5 transition-colors focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-600">
                                        <div className="flex-1 overflow-x-auto px-3 scrollbar-hide py-2">
                                            {addressPending ? (
                                                <Skeleton className="h-5 w-48" />
                                            ) : (
                                                <span className="font-mono text-sm font-semibold text-ink whitespace-nowrap">
                                                    {depositData?.address || "—"}
                                                </span>
                                            )}
                                        </div>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            className="shrink-0 rounded-lg px-4 h-10 font-bold bg-violet-700 hover:bg-violet-600 text-white transition-colors"
                                            onClick={() => depositData?.address && handleCopy(depositData.address, "Address")}
                                            disabled={!depositData?.address || addressPending || addressExpired}
                                        >
                                            <Copy className="mr-2 h-4 w-4" />
                                            Copy
                                        </Button>
                                    </div>
                                </div>

                                {/* Memo Row */}
                                {depositData?.payMemo ? (
                                    <div className="w-full bg-amber-50 dark:bg-amber-900/10 rounded-xl p-4 border border-amber-200 dark:border-amber-900/30 mt-4 shadow-sm">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest">Memo / Tag (Required)</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="font-mono text-sm font-black text-amber-900 dark:text-amber-400 break-all leading-tight">
                                                {depositData.payMemo}
                                            </span>
                                            <button
                                                className="shrink-0 flex h-9 w-9 items-center justify-center rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-amber-200 dark:border-amber-700/50 text-amber-600 hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
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
                                    <div className="mt-6 flex items-center justify-center gap-1.5 text-[13px] font-bold text-muted">
                                        <Clock className="h-4 w-4" />
                                        Address valid for {formatCountdown(remainingMs)}
                                    </div>
                                ) : null}

                                {/* Status banner */}
                                {status ? (
                                    <div className="w-full mt-6">
                                        <StatusBanner status={status} statusData={statusData} onRetry={handleRetry} />
                                    </div>
                                ) : null}
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
