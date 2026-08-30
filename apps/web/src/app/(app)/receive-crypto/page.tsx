"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { Dialog, DialogContent, DialogOverlay, DialogPortal } from "@/components/ui/dialog";

import { AssetSelectionList } from "@/components/flows/receive-crypto/asset-selection-list";
import { NetworkSelectionList } from "@/components/flows/receive-crypto/network-selection-list";
import { DepositDetailView } from "@/components/flows/receive-crypto/deposit-detail-view";
import { CoinGroup } from "@/components/flows/receive-crypto/shared";

type Step = "asset" | "network" | "detail";

export default function ReceiveCryptoFlow() {
    return (
        <React.Suspense fallback={<div className="p-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-violet-600" /></div>}>
            <ReceiveCryptoInner />
        </React.Suspense>
    );
}

function ReceiveCryptoInner() {
    const router = useRouter();
    const isDesktop = useMediaQuery("(min-width: 1024px)");
    
    const [step, setStep] = React.useState<Step>("asset");
    const [selectedGroup, setSelectedGroup] = React.useState<CoinGroup | null>(null);
    const [selectedAssetCode, setSelectedAssetCode] = React.useState<string | null>(null);
    
    // Derived state for the left pane in desktop
    const leftPaneMode = step === "network" ? "network" : "asset";

    const handleSelectGroup = (group: CoinGroup) => {
        setSelectedGroup(group);
        if (group.variants.length > 1) {
            setStep("network");
            if (isDesktop) {
                // Pre-select first variant on desktop to show in detail pane immediately
                setSelectedAssetCode(group.variants[0]?.code ?? null);
            }
        } else {
            setSelectedAssetCode(group.representative.code);
            setStep("detail");
        }
    };

    const handleSelectNetwork = (code: string) => {
        setSelectedAssetCode(code);
        setStep("detail");
    };

    const handleClose = () => {
        router.back();
    };

    const handleBack = () => {
        if (step === "detail" && selectedGroup && selectedGroup.variants.length > 1) {
            setStep("network");
        } else if (step === "network" || step === "detail") {
            setStep("asset");
            setSelectedGroup(null);
            setSelectedAssetCode(null);
        } else {
            handleClose();
        }
    };

    // Responsive rendering
    if (isDesktop === null) {
        // useMediaQuery initial state is null, wait for mount to avoid hydration mismatch
        return <div className="p-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-violet-600" /></div>;
    }

    if (isDesktop) {
        return (
            <Dialog open={true} onOpenChange={(open) => !open && handleClose()}>
                <DialogPortal>
                    <DialogOverlay />
                    <DialogContent 
                        className="max-w-5xl h-[85vh] p-0 overflow-hidden flex gap-0 border-0 bg-gray-50/50 dark:bg-black/20"
                        hideCloseButton
                    >
                        {/* Left Pane (List) */}
                        <div className="w-[400px] shrink-0 bg-white dark:bg-gray-900 border-r border-border h-full flex flex-col relative overflow-hidden">
                            {/* Slide transition container */}
                            <div className={`absolute inset-0 transition-transform duration-300 ease-in-out ${leftPaneMode === 'network' ? '-translate-x-full' : 'translate-x-0'}`}>
                                <AssetSelectionList 
                                    onSelectGroup={handleSelectGroup} 
                                    onBack={handleClose} 
                                />
                            </div>
                            <div className={`absolute inset-0 transition-transform duration-300 ease-in-out ${leftPaneMode === 'network' ? 'translate-x-0' : 'translate-x-full'}`}>
                                <NetworkSelectionList 
                                    coinGroup={selectedGroup} 
                                    onSelectNetwork={(code) => setSelectedAssetCode(code)} 
                                    onBack={handleBack} 
                                />
                            </div>
                        </div>

                        {/* Right Pane (Detail/Preview) */}
                        <div className="flex-1 bg-white/50 dark:bg-gray-900/50 h-full overflow-hidden relative">
                            <DepositDetailView 
                                assetCode={selectedAssetCode} 
                                onBack={handleBack} 
                            />
                            {/* Close button for desktop modal */}
                            <button 
                                onClick={handleClose}
                                className="absolute right-6 top-6 h-10 w-10 flex items-center justify-center rounded-full bg-white dark:bg-white/5 border border-border text-ink hover:bg-gray-50 dark:hover:bg-white/10 transition-colors z-10"
                            >
                                <span className="sr-only">Close</span>
                                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5"><path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                            </button>
                        </div>
                    </DialogContent>
                </DialogPortal>
            </Dialog>
        );
    }

    // Mobile specific layout (Full screen steps)
    return (
        <>
            {step === "asset" && (
                <AssetSelectionList 
                    onSelectGroup={handleSelectGroup} 
                    onBack={handleBack}
                    isMobile={true} 
                />
            )}
            {step === "network" && (
                <NetworkSelectionList 
                    coinGroup={selectedGroup} 
                    onSelectNetwork={handleSelectNetwork} 
                    onBack={handleBack}
                    isMobile={true} 
                />
            )}
            {step === "detail" && (
                <DepositDetailView 
                    assetCode={selectedAssetCode} 
                    onBack={handleBack}
                    isMobile={true} 
                />
            )}
        </>
    );
}
