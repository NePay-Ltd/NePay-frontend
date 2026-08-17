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
} from "lucide-react";
import { toast } from "sonner";

import { RequireKyc } from "@/components/shared/require-kyc";
import { AddressQrCode } from "@/components/shared/address-qr-code";
import { Button } from "@/components/shared/button";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/shared/skeletons";
import {
    useCryptoCurrencies,
    useCryptoMinAmount,
    useGenerateDepositAddress,
    useCryptoDepositStatus,
} from "@/lib/queries/crypto";
import { cn } from "@/lib/cn";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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
    const [searchQuery, setSearchQuery] = React.useState("");

    React.useEffect(() => {
        if (!selectedCode && currencies && currencies.length > 0) {
            setSelectedCode(currencies[0]!.code);
        }
    }, [currencies, selectedCode]);

    const selectedCurrency = currencies?.find((c) => c.code === selectedCode) ?? null;

    const filteredCurrencies = React.useMemo(() => {
        if (!currencies) return [];
        if (!searchQuery.trim()) return currencies;
        const q = searchQuery.toLowerCase();
        return currencies.filter(c =>
            c.name?.toLowerCase().includes(q) ||
            c.code.toLowerCase().includes(q) ||
            c.network?.toLowerCase().includes(q)
        );
    }, [currencies, searchQuery]);

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
            <div className="mx-auto max-w-md pb-24 space-y-6">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-black text-ink tracking-tight">Deposit Crypto</h1>
                    <p className="mt-1 text-sm font-medium text-muted">
                        Instantly converted to Naira
                    </p>
                </div>

                {/* Main Card */}
                <div className="rounded-[36px] bg-gradient-to-b from-white to-violet-50/40 border border-white shadow-[0_8px_40px_rgb(0,0,0,0.04)] overflow-hidden">
                    {/* Premium Asset Selector */}
                    <div className="p-4 sm:p-6 pb-2">
                        <Dialog open={openPicker} onOpenChange={setOpenPicker}>
                            <DialogTrigger asChild>
                                <button className="w-full flex items-center justify-between bg-white/80 backdrop-blur-md rounded-full px-5 py-3 border border-violet-100 shadow-sm transition-all hover:shadow-md hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 group">
                                    <div className="flex items-center gap-4">
                                        {currenciesLoading ? (
                                            <Skeleton className="h-10 w-10 rounded-full" />
                                        ) : selectedCurrency?.iconUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={selectedCurrency.iconUrl}
                                                alt=""
                                                className="h-10 w-10 rounded-full bg-violet-50 object-contain shadow-sm"
                                            />
                                        ) : (
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-700 font-bold shadow-sm">
                                                {(selectedCurrency?.name ?? selectedCurrency?.code)?.[0]?.toUpperCase() ?? "?"}
                                            </div>
                                        )}
                                        <div className="flex flex-col items-start">
                                            <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-0.5">Deposit Asset</span>
                                            {currenciesLoading ? (
                                                <Skeleton className="h-5 w-24" />
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-base font-black text-violet-950">{selectedCurrency?.name ?? selectedCurrency?.code.toUpperCase() ?? "Select Asset"}</span>
                                                    {selectedCurrency?.network && (
                                                        <span className="text-[10px] font-extrabold bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm">
                                                            {selectedCurrency.network}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-50 text-violet-400 group-hover:bg-violet-100 group-hover:text-violet-600 transition-colors">
                                        <ChevronRight className="h-4 w-4" />
                                    </div>
                                </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md rounded-[32px] p-0 overflow-hidden gap-0 border border-white shadow-2xl bg-white/60 backdrop-blur-xl">
                                <DialogHeader className="p-6 bg-white/80 backdrop-blur-md border-b border-violet-100 pb-4">
                                    <DialogTitle className="text-xl font-black text-violet-950">Select Asset</DialogTitle>
                                    <div className="mt-4 relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-violet-300" />
                                        <input
                                            type="text"
                                            placeholder="Search coin or network..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-violet-50/50 border border-violet-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all outline-none"
                                        />
                                    </div>
                                </DialogHeader>
                                <div className="max-h-[50vh] overflow-y-auto p-3 space-y-1">
                                    {filteredCurrencies.length === 0 ? (
                                        <div className="py-12 text-center text-sm font-medium text-muted">
                                            No assets found matching &quot;{searchQuery}&quot;
                                        </div>
                                    ) : (
                                        filteredCurrencies.map((currency) => (
                                            <button
                                                key={currency.code}
                                                onClick={() => {
                                                    setSelectedCode(currency.code);
                                                    setOpenPicker(false);
                                                    setSearchQuery("");
                                                }}
                                                className={cn(
                                                    "w-full flex items-center justify-between p-4 rounded-[20px] transition-all text-left border",
                                                    selectedCode === currency.code
                                                        ? "bg-white border-violet-200 shadow-sm ring-1 ring-violet-500/10"
                                                        : "bg-transparent border-transparent hover:bg-white/80 hover:shadow-sm"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {currency.iconUrl ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={currency.iconUrl} alt="" className="h-10 w-10 rounded-full bg-violet-50" />
                                                    ) : (
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-700 font-bold">
                                                            {currency.name?.[0] ?? currency.code[0]}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-bold text-ink">{currency.name ?? currency.code.toUpperCase()}</div>
                                                        <div className="text-xs font-bold text-muted uppercase tracking-wider mt-0.5">{currency.code}</div>
                                                    </div>
                                                </div>
                                                {currency.network && (
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[10px] font-extrabold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md uppercase tracking-wider mb-1">
                                                            {currency.network}
                                                        </span>
                                                        {selectedCode === currency.code && <Check className="h-4 w-4 text-violet-600" />}
                                                    </div>
                                                )}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="p-4 sm:p-6 flex flex-col items-center">
                        {/* Minimum amount warning pill */}
                        {selectedCode && (minAmountLoading || minAmountData) ? (
                            <div className="mb-6 flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-4 py-1.5">
                                <Info className="h-3.5 w-3.5 text-amber-600" />
                                {minAmountLoading ? (
                                    <Skeleton className="h-3 w-32" />
                                ) : (
                                    <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wide">
                                        Min Deposit: {minAmountData!.minAmount} {(selectedCurrency?.name ?? selectedCurrency?.code)?.toUpperCase() ?? ""}
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

                        {/* Network Row */}
                        <div className="w-full bg-white/60 backdrop-blur-sm rounded-2xl p-4 mb-3 border border-violet-100 shadow-sm">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[11px] font-bold text-violet-400 uppercase tracking-widest">Network</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]"></div>
                                <span className="font-black text-violet-950">
                                    {selectedCurrency?.network ? selectedCurrency.network : (selectedCurrency?.name ?? selectedCurrency?.code.toUpperCase())}
                                </span>
                            </div>
                        </div>

                        {/* Address Row */}
                        <div className="w-full bg-violet-50/50 backdrop-blur-sm rounded-[20px] p-4 border border-violet-100 shadow-sm group relative overflow-hidden">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[11px] font-bold text-violet-400 uppercase tracking-widest">Deposit Address</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                {addressPending ? (
                                    <Skeleton className="h-5 w-48" />
                                ) : (
                                    <span className="font-mono text-sm font-bold text-violet-700 break-all leading-tight">
                                        {depositData?.address || "—"}
                                    </span>
                                )}
                                <button
                                    className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md border border-violet-100 text-violet-600 hover:scale-105 active:scale-95 transition-transform"
                                    onClick={() => depositData?.address && handleCopy(depositData.address, "Address")}
                                    disabled={!depositData?.address || addressPending || addressExpired}
                                >
                                    <Copy className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

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
