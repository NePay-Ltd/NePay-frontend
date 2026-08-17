"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
    Copy,
    AlertCircle,
    ChevronDown,
    Check,
    Info,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
    RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

import { RequireKyc } from "@/components/shared/require-kyc";
import { AddressQrCode } from "@/components/shared/address-qr-code";
import { Button } from "@/components/shared/button";
import { Panel, PanelBody } from "@/components/shared/panel";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/shared/skeletons";
import {
    useCryptoCurrencies,
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

    const { data: currencies, isPending: currenciesLoading, isError: currenciesError } = useCryptoCurrencies();
    const [selectedCode, setSelectedCode] = React.useState<string | null>(null);
    const [openPicker, setOpenPicker] = React.useState(false);
    const [pickerStep, setPickerStep] = React.useState<"coin" | "network">("coin");
    const [pickerCoin, setPickerCoin] = React.useState<string | null>(null);
    const [pickerSearch, setPickerSearch] = React.useState("");

    const coinGroups = React.useMemo(() => groupByCoin(currencies ?? []), [currencies]);
    const activeGroup = coinGroups.find((g) => g.coin === pickerCoin) ?? null;

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
            <div className="space-y-6 sm:space-y-8">
                <div>
                    <h1 className="text-2xl font-bold text-ink sm:text-3xl">Receive crypto</h1>
                    <p className="mt-0.5 text-sm font-medium text-body">
                        Select a coin and network. Funds are instantly converted to Naira.
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
                                                <button className="flex h-14 w-full items-center justify-between rounded-xl border border-border bg-white px-4 transition-all hover:border-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600">
                                                    <div className="flex items-center gap-3">
                                                        {selectedCurrency?.iconUrl ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img
                                                                src={selectedCurrency.iconUrl}
                                                                alt=""
                                                                className="h-8 w-8 rounded-full bg-violet-50 object-contain"
                                                            />
                                                        ) : (
                                                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-50 text-base shadow-sm">
                                                                {(selectedCurrency?.name ?? selectedCurrency?.code)?.[0]?.toUpperCase() ?? "?"}
                                                            </span>
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
                                                    <Command>
                                                        <CommandInput
                                                            placeholder="Search coins..."
                                                            value={pickerSearch}
                                                            onValueChange={setPickerSearch}
                                                        />
                                                        <CommandList className="max-h-[300px]">
                                                            <CommandEmpty>No coins found.</CommandEmpty>
                                                            <CommandGroup>
                                                                {coinGroups.map((group) => (
                                                                    <CommandItem
                                                                        key={group.coin}
                                                                        value={`${group.representative.name ?? group.coin} ${group.coin}`}
                                                                        onSelect={() => selectCoinGroup(group)}
                                                                        className="cursor-pointer py-3"
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-3 h-4 w-4",
                                                                                group.variants.some((v) => v.code === selectedCode) ? "opacity-100 text-violet-600" : "opacity-0",
                                                                            )}
                                                                        />
                                                                        <div className="flex flex-1 items-center justify-between">
                                                                            <span className="font-bold text-ink text-[13px]">
                                                                                {group.representative.name ?? group.coin}
                                                                            </span>
                                                                            {group.variants.length > 1 ? (
                                                                                <span className="text-[10px] font-bold bg-gray-100 px-2 py-0.5 rounded-sm text-muted uppercase tracking-wider">
                                                                                    {group.variants.length} networks
                                                                                </span>
                                                                            ) : group.representative.network ? (
                                                                                <span className="text-[10px] font-bold bg-gray-100 px-2 py-0.5 rounded-sm text-muted uppercase tracking-wider">
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

                                {/* Minimum amount warning */}
                                {selectedCode && (minAmountLoading || minAmountData) ? (
                                    <div className="mb-6 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                                        <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                                        {minAmountLoading ? (
                                            <Skeleton className="h-4 w-56" />
                                        ) : (
                                            <p className="text-xs font-bold text-amber-900">
                                                Minimum deposit: {minAmountData!.minAmount} {(selectedCurrency?.name ?? selectedCurrency?.code)?.toUpperCase() ?? ""}
                                                . Sending less will not be credited.
                                            </p>
                                        )}
                                    </div>
                                ) : null}

                                {/* QR Code Area */}
                                <div className="flex flex-col items-center">
                                    <div className="relative flex h-[220px] w-[220px] items-center justify-center rounded-[24px] border-2 border-dashed border-border bg-gray-50/50 p-4">
                                        {addressPending ? (
                                            <Skeleton className="h-full w-full rounded-[16px]" />
                                        ) : addressError || addressExpired ? (
                                            <EmptyState
                                                icon={AlertCircle}
                                                heading={addressExpired ? "Address expired" : "Generation failed"}
                                                description={addressExpired ? "This deposit window has closed." : "Could not fetch deposit address."}
                                                action={{ label: "Generate new address", onClick: handleRetry }}
                                                className="py-0"
                                            />
                                        ) : depositData?.address ? (
                                            <div className="rounded-[16px] bg-white p-2 shadow-sm">
                                                <AddressQrCode address={depositData.address} size={180} />
                                            </div>
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

                                        {/* Memo / tag — equally prominent, never a footnote */}
                                        {depositData?.payMemo ? (
                                            <div className="mt-3">
                                                <label className="mb-2 block text-center text-[11px] font-bold uppercase tracking-widest text-red-600">Memo / Tag — Required</label>
                                                <div className="flex w-full items-center justify-between rounded-xl border-2 border-red-300 bg-red-50 p-1.5">
                                                    <span className="flex-1 overflow-x-auto px-3 font-mono text-[13px] font-bold text-red-900 whitespace-nowrap scrollbar-hide">
                                                        {depositData.payMemo}
                                                    </span>
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        className="shrink-0 rounded-lg px-4 h-9 font-bold bg-red-600 hover:bg-red-500"
                                                        onClick={() => handleCopy(depositData.payMemo!, "Memo")}
                                                        disabled={addressExpired}
                                                    >
                                                        <Copy className="mr-1.5 h-3.5 w-3.5" />
                                                        Copy
                                                    </Button>
                                                </div>
                                                <p className="mt-2 text-center text-[11px] font-bold text-red-700">
                                                    You must include both the address AND this memo/tag, or your deposit may be lost.
                                                </p>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>

                                {/* Status banner */}
                                {status ? (
                                    <div className="mt-6">
                                        <StatusBanner status={status} statusData={statusData} onRetry={handleRetry} />
                                    </div>
                                ) : null}
                            </PanelBody>
                        </Panel>
                    </div>

                    {/* ── Right Panel (Instructions & Network) ─────────────── */}
                    <div className="space-y-6 xl:col-span-5">
                        <div className="rounded-[24px] border border-border bg-white shadow-sm overflow-hidden">
                            <div className="bg-amber-50 p-4 border-b border-amber-100 flex gap-3 items-start">
                                <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-bold text-amber-900">Important Network Rule</h4>
                                    <p className="text-xs font-medium text-amber-800 mt-1 leading-relaxed">
                                        Send only <strong className="font-bold">{(selectedCurrency?.name ?? selectedCurrency?.code)?.toUpperCase() ?? "this asset"}</strong>{selectedCurrency?.network ? <> on the <strong className="font-bold">{selectedCurrency.network}</strong> network</> : null} to this address. Sending any other asset or using a different network will result in permanent loss of funds.
                                    </p>
                                </div>
                            </div>

                            <div className="p-6">
                                <h3 className="text-[13px] font-extrabold uppercase tracking-widest text-muted mb-4">How it works</h3>
                                <div className="space-y-6">
                                    <div className="flex gap-4 relative">
                                        <div className="absolute left-[15px] top-8 bottom-[-24px] w-0.5 bg-gray-100"></div>
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-50 text-[13px] font-bold text-violet-700 z-10">1</div>
                                        <div>
                                            <h4 className="text-sm font-bold text-ink">Send crypto</h4>
                                            <p className="mt-0.5 text-xs font-medium text-body">Transfer funds from your external wallet or exchange.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 relative">
                                        <div className="absolute left-[15px] top-8 bottom-[-24px] w-0.5 bg-gray-100"></div>
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-50 text-[13px] font-bold text-violet-700 z-10">2</div>
                                        <div>
                                            <h4 className="text-sm font-bold text-ink">Network confirmation</h4>
                                            <p className="mt-0.5 text-xs font-medium text-body">We wait for the blockchain network to confirm the transaction.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-50 text-[13px] font-bold text-violet-700 z-10">3</div>
                                        <div>
                                            <h4 className="text-sm font-bold text-ink">Auto-conversion</h4>
                                            <p className="mt-0.5 text-xs font-medium text-body">Funds are instantly converted and credited as Naira.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Button
                            variant="quiet"
                            size="lg"
                            className="w-full bg-white border border-border shadow-sm rounded-xl font-bold text-violet-700 hover:bg-violet-50 h-14"
                            onClick={() => router.push("/transactions?type=Deposits")}
                        >
                            View Deposit History
                        </Button>
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
                    Deposit confirmed — {statusData?.creditedAmount?.toLocaleString()} {statusData?.creditedCurrency} credited to your wallet.
                </Banner>
            );
        case "partially_paid":
            return (
                <Banner tone="warning" icon={<AlertCircle className="h-4 w-4 text-amber-600" />}>
                    You sent less than expected. Expected {statusData?.expectedAmount} {statusData?.payCurrency}, credited{" "}
                    {statusData?.creditedAmount?.toLocaleString()} {statusData?.creditedCurrency}.
                </Banner>
            );
        case "failed":
            return (
                <Banner tone="error" icon={<XCircle className="h-4 w-4 text-red-600" />} action={{ label: "Generate new address", onClick: onRetry }}>
                    Deposit failed — this can happen if the amount sent was below the minimum.
                </Banner>
            );
        case "expired":
            return (
                <Banner tone="error" icon={<XCircle className="h-4 w-4 text-red-600" />} action={{ label: "Generate new address", onClick: onRetry }}>
                    This deposit window expired with nothing received.
                </Banner>
            );
        case "refunded":
            return (
                <Banner tone="warning" icon={<RotateCcw className="h-4 w-4 text-amber-600" />}>
                    This deposit was refunded. Your wallet balance was not affected.
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
    action?: { label: string; onClick: () => void };
}) {
    const toneClasses = {
        pending: "border-violet-200 bg-violet-50 text-violet-900",
        success: "border-green-200 bg-green-50 text-green-900",
        warning: "border-amber-200 bg-amber-50 text-amber-900",
        error: "border-red-200 bg-red-50 text-red-900",
    }[tone];

    return (
        <div className={cn("flex items-center justify-between gap-3 rounded-xl border px-4 py-3", toneClasses)}>
            <div className="flex items-center gap-2.5">
                {icon}
                <p className="text-xs font-bold">{children}</p>
            </div>
            {action ? (
                <Button variant="quiet" size="sm" className="shrink-0 h-8 rounded-lg text-xs font-bold" onClick={action.onClick}>
                    {action.label}
                </Button>
            ) : null}
        </div>
    );
}
