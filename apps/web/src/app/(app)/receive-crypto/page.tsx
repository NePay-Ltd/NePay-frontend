"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Copy, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { RequireKyc } from "@/components/shared/require-kyc";
import { AddressQrCode } from "@/components/shared/address-qr-code";
import { Button } from "@/components/shared/button";
import { Chip } from "@/components/shared/chip";
import { Panel, PanelHeader, PanelBody } from "@/components/shared/panel";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/shared/skeletons";
import { useGenerateDepositAddress } from "@/lib/queries/crypto";
import { cn } from "@/lib/cn";

const SUPPORTED_NETWORKS = [
    { coin: "USDT", network: "TRC20", label: "USDT TRC20", color: "bg-green-500", recommended: true },
    { coin: "USDT", network: "ERC20", label: "USDT ERC20", color: "bg-blue-500", recommended: false },
    { coin: "USDC", network: "ERC20", label: "USDC ERC20", color: "bg-indigo-500", recommended: false },
];

export default function ReceiveCryptoPage() {
    const router = useRouter();
    const [selected, setSelected] = React.useState(SUPPORTED_NETWORKS[0]!);

    const { 
        mutate: generateAddress, 
        data: depositData, 
        isPending, 
        isError 
    } = useGenerateDepositAddress();

    // Fetch initial address on mount and whenever selected network changes
    React.useEffect(() => {
        generateAddress({ coin: selected.coin, network: selected.network });
    }, [selected, generateAddress]);

    const handleCopy = () => {
        if (!depositData?.address) return;
        navigator.clipboard.writeText(depositData.address);
        toast.success("Address copied");
    };

    const truncateAddress = (addr: string) => {
        if (!addr) return "";
        if (addr.length < 16) return addr;
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    return (
        <RequireKyc tier="FULL_BVN_NIN">
            <div className="mx-auto max-w-5xl space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-ink">Receive Crypto</h1>
                    <p className="mt-0.5 text-sm text-body">
                        Deposit supported stablecoins directly to your wallet.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-10">
                    {/* ── Left Panel (QR Code) ─────────────────────────────── */}
                    <div className="flex flex-col items-center space-y-6 rounded-2xl bg-white p-8 shadow-sm border border-border">
                        <h2 className="text-lg font-semibold text-ink">Your NePay Address</h2>

                        <div className="flex min-h-[180px] w-full items-center justify-center">
                            {isPending ? (
                                <Skeleton className="h-[180px] w-[180px] rounded-2xl" />
                            ) : isError ? (
                                <EmptyState
                                    icon={AlertCircle}
                                    heading="Generation failed"
                                    description="We couldn't generate an address right now."
                                    action={{
                                        label: "Try again",
                                        onClick: () => generateAddress({ coin: selected.coin, network: selected.network }),
                                    }}
                                    className="py-6"
                                />
                            ) : depositData?.address ? (
                                <AddressQrCode address={depositData.address} size={180} />
                            ) : null}
                        </div>

                        <div className="w-full space-y-3">
                            <div className="flex w-full items-center justify-between rounded-xl border border-border bg-violet-50 px-4 py-3">
                                {isPending ? (
                                    <Skeleton className="h-6 w-32" />
                                ) : depositData?.address ? (
                                    <span className="font-mono text-base font-semibold tracking-wider text-ink">
                                        {truncateAddress(depositData.address)}
                                    </span>
                                ) : (
                                    <span className="text-sm text-muted">No address</span>
                                )}
                                <Button
                                    variant="quiet"
                                    size="sm"
                                    className="h-8 shrink-0 px-3 text-violet-600"
                                    onClick={handleCopy}
                                    disabled={!depositData?.address || isPending}
                                >
                                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                                    Copy
                                </Button>
                            </div>
                            
                            <div className="rounded-lg bg-amber-50 p-3 text-center text-xs text-amber-800">
                                Send only supported coins to this address. Deposits are auto-converted to NGN.
                            </div>
                        </div>
                    </div>

                    {/* ── Right Panel (Instructions & Network) ─────────────── */}
                    <div className="space-y-6">
                        <Panel>
                            <PanelHeader title="Supported Networks" />
                            <PanelBody className="px-5 pb-5">
                                <div className="flex flex-wrap gap-3">
                                    {SUPPORTED_NETWORKS.map((network) => (
                                        <Chip
                                            key={network.label}
                                            active={selected.label === network.label}
                                            onClick={() => setSelected(network)}
                                        >
                                            <span 
                                                className={cn(
                                                    "mr-1.5 inline-block h-2 w-2 rounded-full",
                                                    network.color
                                                )} 
                                            />
                                            {network.label}
                                            {network.recommended && (
                                                <span className="ml-1.5 rounded bg-amber-100 px-1 py-0.5 text-[10px] font-bold text-amber-700">
                                                    REC
                                                </span>
                                            )}
                                        </Chip>
                                    ))}
                                </div>
                            </PanelBody>
                        </Panel>

                        <Panel>
                            <PanelHeader title="How it works" />
                            <PanelBody className="px-5 pb-5">
                                <ol className="relative ml-2 space-y-6 border-l-2 border-violet-100">
                                    {[
                                        { title: "Send crypto", desc: "Send funds to your NePay address." },
                                        { title: "We confirm", desc: "We wait for network confirmations." },
                                        { title: "You get credited", desc: "We convert and credit your wallet instantly." },
                                    ].map((step, idx) => (
                                        <li key={idx} className="ml-6">
                                            <span className="absolute -left-[13px] flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700 ring-4 ring-white">
                                                {idx + 1}
                                            </span>
                                            <h3 className="text-sm font-semibold text-ink">{step.title}</h3>
                                            <p className="mt-0.5 text-xs text-body">{step.desc}</p>
                                        </li>
                                    ))}
                                </ol>
                            </PanelBody>
                        </Panel>

                        <Button
                            variant="primary"
                            size="lg"
                            fullWidth
                            onClick={() => router.push("/transactions?type=crypto")}
                        >
                            I&apos;ve Sent the Funds
                        </Button>
                    </div>
                </div>
            </div>
        </RequireKyc>
    );
}
