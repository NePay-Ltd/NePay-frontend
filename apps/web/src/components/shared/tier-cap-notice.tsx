"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

import { useVirtualAccount } from "@/lib/queries/wallet";
import { formatNaira } from "@/lib/format";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const DISMISSED_KEY = "nepay-tier-cap-notice-dismissed";

/**
 * Proactive "you're over your tier's balance cap" popup — mounted once,
 * globally, in (app)/layout.tsx, so it fires no matter which screen the
 * customer lands on after a deposit pushes them over.
 *
 * The block itself is already fully enforced server-side the moment this
 * is true (WithdrawalService.checkTierLimits, UtilitiesService.purchase —
 * see assertNotOverBalanceCap). This component's only job is to tell the
 * customer *why*, before they stumble into it trying to withdraw or pay a
 * bill, rather than after.
 *
 * Shown once per browser session while still over cap, not on every single
 * navigation — sessionStorage, not localStorage, so it naturally resurfaces
 * next time they open the app in a new session if they're still over cap
 * and haven't upgraded.
 */
export function TierCapNotice() {
    const router = useRouter();
    const { data: virtualAccount } = useVirtualAccount();
    const [open, setOpen] = React.useState(false);

    React.useEffect(() => {
        if (!virtualAccount?.overBalanceCap) {
            return;
        }

        try {
            if (sessionStorage.getItem(DISMISSED_KEY) === "1") {
                return;
            }
        } catch {
            // Private browsing / blocked storage — fall through and show it anyway.
        }

        setOpen(true);
    }, [virtualAccount?.overBalanceCap]);

    const dismiss = () => {
        try {
            sessionStorage.setItem(DISMISSED_KEY, "1");
        } catch {
            // Nothing to persist — it'll just show again next render, which is fine.
        }
        setOpen(false);
    };

    if (!virtualAccount?.overBalanceCap) {
        return null;
    }

    return (
        <AlertDialog open={open} onOpenChange={(next) => (next ? setOpen(true) : dismiss())}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                        <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <AlertDialogTitle className="text-center">Upgrade your tier to access your balance</AlertDialogTitle>
                    <AlertDialogDescription className="text-center">
                        Your balance is above the {formatNaira(virtualAccount.balanceCap ?? "0")} cap for your current tier.
                        You can still receive money, but withdrawals and payments are on hold until you upgrade.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex flex-row justify-center gap-4 mt-2 sm:space-x-0 sm:justify-center">
                    <AlertDialogCancel
                        onClick={dismiss}
                        className="mt-0 flex-1 h-12 rounded-full border-0 bg-violet-100 text-base font-bold text-violet-700 hover:bg-violet-200 hover:text-violet-800"
                    >
                        Maybe Later
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => {
                            dismiss();
                            router.push("/upgrade-tier");
                        }}
                        className="flex-1 h-12 rounded-full border-0 bg-violet-600 text-base font-bold text-white hover:bg-violet-700 hover:text-white"
                    >
                        Upgrade Now
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
