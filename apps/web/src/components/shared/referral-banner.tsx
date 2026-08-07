import * as React from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/cn";
import { useReferralLink } from "@/lib/queries/referrals";
import { Panel, PanelBody } from "@/components/shared/panel";
import { Button } from "@/components/shared/button";

interface ReferralBannerProps {
    className?: string;
    /** If true, renders a tighter, simpler banner suited for sidebars. */
    compact?: boolean;
}

export function ReferralBanner({ className, compact = false }: ReferralBannerProps) {
    const { data: referralLink, isLoading } = useReferralLink();

    const handleCopyInviteLink = () => {
        if (!referralLink) return;
        navigator.clipboard.writeText(referralLink);
        toast.success("Invite link copied to clipboard!");
    };

    if (compact) {
        return (
            <div className={cn("rounded-xl bg-violet-50 p-4 text-center border border-violet-100", className)}>
                <h3 className="text-sm font-semibold text-violet-700">
                    Invite a friend <span className="font-normal opacity-70">→</span> earn ₦5,000
                </h3>
                <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 w-full bg-white text-violet-600 border border-violet-200 hover:bg-violet-100"
                    onClick={handleCopyInviteLink}
                    loading={isLoading}
                >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                </Button>
            </div>
        );
    }

    return (
        <Panel className={cn("border-none bg-brand-gradient text-white shadow-xl ring-1 ring-white/20", className)}>
            <PanelBody className="flex flex-col items-center justify-between gap-4 p-6 sm:flex-row sm:p-8">
                <div className="text-center sm:text-left">
                    <h3 className="text-lg font-bold">Invite a friend, earn ₦5,000</h3>
                    <p className="mt-1 text-sm text-white/80 max-w-[250px]">
                        Share NePay with your friends and you both earn a bonus.
                    </p>
                </div>
                <Button
                    variant="quiet"
                    className="shrink-0 bg-white/20 text-white hover:bg-white/30 hover:text-white border border-white/20 shadow-sm"
                    onClick={handleCopyInviteLink}
                    loading={isLoading}
                >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Invite Link
                </Button>
            </PanelBody>
        </Panel>
    );
}
