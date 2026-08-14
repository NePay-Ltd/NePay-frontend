"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Copy, AlertCircle, Search, ChevronDown, Check, Info } from "lucide-react";
import { toast } from "sonner";

import { RequireKyc } from "@/components/shared/require-kyc";
import { AddressQrCode } from "@/components/shared/address-qr-code";
import { Button } from "@/components/shared/button";
import { Panel, PanelHeader, PanelBody } from "@/components/shared/panel";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/shared/skeletons";
import { useGenerateDepositAddress } from "@/lib/queries/crypto";
import { cn } from "@/lib/cn";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

const MOCK_300_ASSETS = [
    { id: "usdt-trc20", coin: "USDT", network: "TRC20", name: "Tether (Tron)", icon: "🟢", color: "bg-green-500" },
    { id: "usdt-erc20", coin: "USDT", network: "ERC20", name: "Tether (Ethereum)", icon: "🔵", color: "bg-blue-500" },
    { id: "usdc-erc20", coin: "USDC", network: "ERC20", name: "USD Coin", icon: "🪙", color: "bg-indigo-500" },
    { id: "btc", coin: "BTC", network: "BTC", name: "Bitcoin", icon: "₿", color: "bg-orange-500" },
    { id: "eth", coin: "ETH", network: "ERC20", name: "Ethereum", icon: "⟠", color: "bg-slate-800" },
    { id: "sol", coin: "SOL", network: "SOL", name: "Solana", icon: "◎", color: "bg-purple-500" },
    { id: "doge", coin: "DOGE", network: "DOGE", name: "Dogecoin", icon: "🐕", color: "bg-yellow-500" },
    { id: "ltc", coin: "LTC", network: "LTC", name: "Litecoin", icon: "Ł", color: "bg-gray-400" },
    { id: "xrp", coin: "XRP", network: "XRP", name: "Ripple", icon: "✕", color: "bg-black" },
    // Mocking the fact that there are hundreds more
];

export default function ReceiveCryptoPage() {
    const router = useRouter();
    const [selectedAsset, setSelectedAsset] = React.useState(MOCK_300_ASSETS[0]!);
    const [openPicker, setOpenPicker] = React.useState(false);

    const { 
        mutate: generateAddress, 
        data: depositData, 
        isPending, 
        isError 
    } = useGenerateDepositAddress();

    React.useEffect(() => {
        generateAddress({ asset: selectedAsset.id });
    }, [selectedAsset, generateAddress]);

    const handleCopy = () => {
        if (!depositData?.address) return;
        navigator.clipboard.writeText(depositData.address);
        toast.success("Wallet address copied to clipboard");
    };

    return (
        <RequireKyc tier="FULL_BVN_NIN">
            <div className="space-y-6 sm:space-y-8">
                <div>
                    <h1 className="text-2xl font-bold text-ink sm:text-3xl">Receive crypto</h1>
                    <p className="mt-0.5 text-sm font-medium text-body">
                        Select from 300+ cryptocurrencies. Funds are instantly converted to Naira.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:gap-8">
                    {/* ── Left Panel (Selection & QR) ─────────────────────────────── */}
                    <div className="space-y-6 xl:col-span-7">
                        <Panel className="rounded-[24px]">
                            <PanelBody className="p-6 sm:p-8">
                                
                                {/* Asset Picker */}
                                <div className="mb-8">
                                    <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-muted">Select Asset</label>
                                    <Popover open={openPicker} onOpenChange={setOpenPicker}>
                                        <PopoverTrigger asChild>
                                            <button className="flex h-14 w-full items-center justify-between rounded-xl border border-border bg-white px-4 transition-all hover:border-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600">
                                                <div className="flex items-center gap-3">
                                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-50 text-base shadow-sm">
                                                        {selectedAsset.icon}
                                                    </span>
                                                    <div className="flex flex-col items-start">
                                                        <span className="text-sm font-extrabold text-ink">{selectedAsset.name}</span>
                                                        <span className="text-[11px] font-bold text-muted uppercase tracking-wider">{selectedAsset.coin} · {selectedAsset.network}</span>
                                                    </div>
                                                </div>
                                                <ChevronDown className="h-4 w-4 text-muted" />
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[300px] sm:w-[400px] p-0 rounded-[16px] overflow-hidden" align="start">
                                            <Command>
                                                <CommandInput placeholder="Search 300+ assets or networks..." />
                                                <CommandList className="max-h-[300px]">
                                                    <CommandEmpty>No assets found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {MOCK_300_ASSETS.map((asset) => (
                                                            <CommandItem
                                                                key={asset.id}
                                                                value={`${asset.name} ${asset.coin} ${asset.network}`}
                                                                onSelect={() => {
                                                                    setSelectedAsset(asset);
                                                                    setOpenPicker(false);
                                                                }}
                                                                className="cursor-pointer py-3"
                                                            >
                                                                <Check className={cn("mr-3 h-4 w-4", selectedAsset.id === asset.id ? "opacity-100 text-violet-600" : "opacity-0")} />
                                                                <div className="flex flex-1 items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <span>{asset.icon}</span>
                                                                        <span className="font-bold text-ink text-[13px]">{asset.name}</span>
                                                                    </div>
                                                                    <span className="text-[10px] font-bold bg-gray-100 px-2 py-0.5 rounded-sm text-muted uppercase tracking-wider">
                                                                        {asset.network}
                                                                    </span>
                                                                </div>
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>

                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {/* QR Code Area */}
                                <div className="flex flex-col items-center">
                                    <div className="relative flex h-[220px] w-[220px] items-center justify-center rounded-[24px] border-2 border-dashed border-border bg-gray-50/50 p-4">
                                        {isPending ? (
                                            <Skeleton className="h-full w-full rounded-[16px]" />
                                        ) : isError ? (
                                            <EmptyState
                                                icon={AlertCircle}
                                                heading="Generation failed"
                                                description="Could not fetch deposit address."
                                                action={{
                                                    label: "Retry",
                                                    onClick: () => generateAddress({ asset: selectedAsset.id }),
                                                }}
                                                className="py-0"
                                            />
                                        ) : depositData?.address ? (
                                            <div className="rounded-[16px] bg-white p-2 shadow-sm">
                                                <AddressQrCode address={depositData.address} size={180} />
                                            </div>
                                        ) : null}
                                    </div>

                                    {/* Address Display */}
                                    <div className="mt-8 w-full max-w-md">
                                        <label className="mb-2 block text-center text-[11px] font-bold uppercase tracking-widest text-muted">Wallet Address</label>
                                        <div className="flex w-full items-center justify-between rounded-xl border border-border bg-gray-50 p-1.5 transition-colors focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-600">
                                            <div className="flex-1 overflow-x-auto px-3 scrollbar-hide">
                                                {isPending ? (
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
                                                onClick={handleCopy}
                                                disabled={!depositData?.address || isPending}
                                            >
                                                <Copy className="mr-1.5 h-3.5 w-3.5" />
                                                Copy
                                            </Button>
                                        </div>
                                    </div>
                                </div>
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
                                        Send only <strong className="font-bold">{selectedAsset.coin}</strong> on the <strong className="font-bold">{selectedAsset.network}</strong> network to this address. Sending any other asset or using a different network will result in permanent loss of funds.
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
                            onClick={() => router.push("/transactions?type=crypto")}
                        >
                            View Deposit History
                        </Button>
                    </div>
                </div>
            </div>
        </RequireKyc>
    );
}
