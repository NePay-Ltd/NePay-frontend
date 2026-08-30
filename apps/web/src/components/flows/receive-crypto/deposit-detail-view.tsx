"use client";

import * as React from "react";
import {
    Copy,
    AlertCircle,
    Info,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
    RotateCcw,
    ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

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
import { CurrencyAvatar } from "./shared";

interface DepositDetailViewProps {
    assetCode: string | null;
    onBack: () => void;
    isMobile?: boolean;
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

export function DepositDetailView({ assetCode, onBack, isMobile = false }: DepositDetailViewProps) {
    const { data: currencies } = useCryptoCurrencies();
    const { data: pricesData } = useCryptoPrices();

    const selectedCurrency = React.useMemo(() => currencies?.find((c) => c.code === assetCode) ?? null, [currencies, assetCode]);

    const networkCurrencies = React.useMemo(() => {
        if (!currencies || !selectedCurrency?.network) return [];
        return currencies.filter(c => c.network === selectedCurrency.network);
    }, [currencies, selectedCurrency]);

    const acceptedCoinsLabel = React.useMemo(() => {
        if (!networkCurrencies.length) return "";
        const coins = Array.from(new Set(networkCurrencies.map(c => c.coin))).join(", ");
        return `${selectedCurrency?.network} · ${coins}`;
    }, [networkCurrencies, selectedCurrency]);

    const { data: minAmountData, isPending: minAmountLoading } = useCryptoMinAmount(assetCode ?? "");

    const {
        mutate: generateAddress,
        data: depositData,
        isPending: addressPending,
        isError: addressError,
        reset: resetAddress,
    } = useGenerateDepositAddress();

    React.useEffect(() => {
        if (assetCode) {
            resetAddress();
            generateAddress({ currency: assetCode });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assetCode]);

    const displayMinAmount = depositData?.expectedAmount ?? minAmountData?.minAmount ?? null;
    const displayMinAmountLoading = !depositData?.expectedAmount && minAmountLoading;
    const displayMinAmountUsd =
        displayMinAmount !== null && minAmountData?.usdOneEquivalent && minAmountData.minimumSource !== "unavailable"
            ? displayMinAmount / minAmountData.usdOneEquivalent
            : null;

    const minimumIsExact = Boolean(depositData?.expectedAmount) || minAmountData?.minimumSource === "exact";

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
        if (!assetCode) return;
        resetAddress();
        generateAddress({ currency: assetCode });
    };

    if (!assetCode) {
        return (
            <div className="flex flex-col items-center justify-center p-12 h-full bg-gray-50/50 dark:bg-white-[0.02]">
                <div className="h-16 w-16 rounded-full bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center mb-4">
                    <Loader2 className="h-8 w-8 text-violet-300" />
                </div>
                <h3 className="text-lg font-bold text-ink">Select an Asset</h3>
                <p className="text-sm text-muted mt-1 text-center max-w-[250px]">Choose a cryptocurrency and network from the list to view deposit details.</p>
            </div>
        );
    }

    return (
        <RequireKyc>
            <div className={cn("mx-auto w-full", isMobile ? "" : "flex flex-col h-full")}>
                {/* Header */}
                <div className={cn("flex items-center justify-between mb-4 shrink-0", !isMobile && "px-6 pt-6")}>
                    <div className="flex items-center gap-4">
                        {isMobile && (
                            <button
                                onClick={onBack}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-white/5 border border-border text-ink hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                        )}
                        {selectedCurrency && (
                            <CurrencyAvatar currency={selectedCurrency} className="h-10 w-10 text-base shadow-sm shrink-0" />
                        )}
                        <div>
                            <h1 className={cn("font-black text-ink tracking-tight", isMobile ? "text-2xl" : "text-xl")}>
                                Deposit {selectedCurrency?.name ?? selectedCurrency?.coin ?? ""}
                            </h1>
                            <p className="text-sm font-medium text-muted mt-0.5">Scan or copy address below</p>
                        </div>
                    </div>
                </div>

                <div className={cn("flex flex-col gap-6 flex-1", !isMobile && "overflow-y-auto px-6 pb-6")}>
                    {/* QR Code and Address Section */}
                    <div className="rounded-3xl bg-white dark:bg-gray-900/50 p-6 sm:p-8 border-2 border-violet-100 dark:border-violet-900/30 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] flex flex-col items-center">
                        <div className="relative flex h-[220px] w-[220px] items-center justify-center rounded-3xl bg-white shadow-sm border-2 border-violet-100 mb-6 p-2">
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
                                    <AddressQrCode address={depositData.address} size={190} />
                                    {selectedCurrency && (
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-1 rounded-full shadow-md border border-gray-100 flex items-center justify-center h-10 w-10">
                                            <CurrencyAvatar currency={selectedCurrency} className="h-full w-full text-sm" />
                                        </div>
                                    )}
                                </>
                            ) : null}
                        </div>

                        <div className="w-full text-center mb-6">
                            <span className="inline-block px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 text-xs font-bold uppercase tracking-wider mb-2">
                                {acceptedCoinsLabel}
                            </span>
                            
                            <div className="flex w-full items-center justify-between rounded-2xl border-2 border-border bg-gray-50 dark:bg-white/5 p-1.5 transition-colors focus-within:border-violet-400">
                                <div className="flex-1 overflow-x-auto px-3 scrollbar-hide py-3 text-left">
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
                                    className="shrink-0 rounded-xl px-4 h-11 font-bold bg-violet-700 hover:bg-violet-600 text-white transition-colors"
                                    onClick={() => depositData?.address && handleCopy(depositData.address, "Address")}
                                    disabled={!depositData?.address || addressPending || addressExpired}
                                >
                                    <Copy className="mr-2 h-4 w-4" />
                                    Copy
                                </Button>
                            </div>
                        </div>

                        {depositData?.payMemo && (
                            <div className="w-full bg-amber-50 dark:bg-amber-900/10 rounded-2xl p-4 border-2 border-amber-200 dark:border-amber-900/30 mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[11px] font-bold text-amber-700 dark:text-amber-500 uppercase tracking-widest">Memo / Tag (Required)</span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="font-mono text-sm font-black text-amber-950 dark:text-amber-400 break-all leading-tight">
                                        {depositData.payMemo}
                                    </span>
                                    <button
                                        className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-amber-200 dark:border-amber-700/50 text-amber-700 hover:scale-105 active:scale-95 transition-transform"
                                        onClick={() => handleCopy(depositData.payMemo!, "Memo")}
                                        disabled={addressExpired}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {depositData?.expiresAt && !addressExpired && remainingMs !== null ? (
                            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-muted bg-gray-50 dark:bg-white/5 py-2 px-4 rounded-full">
                                <Clock className="h-4 w-4" />
                                Address valid for {formatCountdown(remainingMs)}
                            </div>
                        ) : null}
                        
                        {status ? (
                            <div className="w-full mt-6">
                                <StatusBanner status={status} statusData={statusData} onRetry={handleRetry} />
                            </div>
                        ) : null}
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-2xl bg-white dark:bg-white/5 border border-border p-4 text-center">
                            <span className="block text-[11px] font-bold text-muted uppercase tracking-widest mb-1">Min Deposit</span>
                            <span className="text-sm font-black text-ink">{displayMinAmountLoading ? "..." : (minimumDisplayValue ?? "—")}</span>
                        </div>
                        <div className="rounded-2xl bg-white dark:bg-white/5 border border-border p-4 text-center">
                            <span className="block text-[11px] font-bold text-muted uppercase tracking-widest mb-1">Network Fee</span>
                            <span className="text-sm font-black text-green-600 dark:text-green-400">Free</span>
                        </div>
                        <div className="rounded-2xl bg-white dark:bg-white/5 border border-border p-4 text-center">
                            <span className="block text-[11px] font-bold text-muted uppercase tracking-widest mb-1">Deposit Limit</span>
                            <span className="text-sm font-black text-ink">Unlimited</span>
                        </div>
                    </div>



                    {/* Instructions Box */}
                    <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/10 p-5 border border-amber-200 dark:border-amber-900/30 flex gap-4 items-start shadow-sm mt-4">
                        <Info className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400">Important Instructions</h4>
                            <ul className="text-sm font-medium text-amber-800 dark:text-amber-500 mt-2 space-y-2 list-disc pl-4 leading-relaxed">
                                <li>Send only <strong className="font-bold text-amber-950 dark:text-amber-300">{(selectedCurrency?.name ?? selectedCurrency?.coin)?.toUpperCase() ?? "these assets"}</strong>{selectedCurrency?.network ? <> on the <strong className="font-bold text-amber-950 dark:text-amber-300">{selectedCurrency.network}</strong> network</> : null} to this address.</li>
                                <li>Sending via any other network will result in permanent loss of funds.</li>
                            </ul>
                        </div>
                    </div>

                    <Button
                        className="w-full h-14 rounded-[20px] text-[15px] font-black text-white shadow-[0_8px_20px_-6px_rgba(124,58,237,0.5)] hover:shadow-[0_14px_28px_-8px_rgba(124,58,237,0.6)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-300 bg-gradient-to-b from-violet-500 to-violet-700 border border-violet-400/30 mt-4 relative overflow-hidden group"
                        onClick={() => toast.success("We are monitoring the network for your deposit.")}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-400/0 via-white/20 to-violet-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <span className="relative z-10 flex items-center justify-center gap-2 drop-shadow-sm">
                            <CheckCircle2 className="h-5 w-5 opacity-80" />
                            I have made the deposit
                        </span>
                    </Button>
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
    action?: { label: string; onClick: () => void };
}) {
    const toneClasses = {
        pending: "border-violet-200 bg-violet-50 text-violet-900 dark:border-violet-900/30 dark:bg-violet-900/10 dark:text-violet-300",
        success: "border-green-200 bg-green-50 text-green-900 dark:border-green-900/30 dark:bg-green-900/10 dark:text-green-300",
        warning: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-300",
        error: "border-red-200 bg-red-50 text-red-900 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-300",
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
