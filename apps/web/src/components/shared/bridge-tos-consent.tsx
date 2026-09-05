"use client";

/**
 * A checkbox-styled Bridge Terms of Service consent row — shared between
 * the Foreign Accounts page and the unified KYC flow's optional Bridge
 * step. Deliberately can't be a real, pre-submission checkbox on the form
 * itself: Bridge doesn't hand back a `tos_link` until the customer already
 * exists on their side (confirmed live), so there's genuinely nothing to
 * show or accept before that. This is the closest honest equivalent —
 * looks and reads like a single consent checkbox, but the checkmark
 * reflects Bridge's own real acceptance state, and clicking it opens their
 * real hosted ToS page in an embedded iframe modal (no new tab — confirmed
 * live Bridge's page sends no X-Frame-Options/CSP blocking this), polling
 * every 4s while open and closing itself the moment Bridge confirms.
 */

import * as React from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";

import { Modal } from "@/components/shared/modal";
import { useRefreshBridgeCustomer } from "@/lib/queries/bridge";
import { cn } from "@/lib/cn";

export function BridgeTosConsent({
    customer,
}: {
    customer: { tosLink: string | null; hasAcceptedTermsOfService: boolean };
}) {
    const { mutate: refresh } = useRefreshBridgeCustomer();
    const [tosOpen, setTosOpen] = React.useState(false);
    const accepted = customer.hasAcceptedTermsOfService;
    const notified = React.useRef(false);

    React.useEffect(() => {
        if (!tosOpen) return;
        const interval = setInterval(() => refresh(), 4000);
        return () => clearInterval(interval);
    }, [tosOpen, refresh]);

    React.useEffect(() => {
        if (accepted && !notified.current) {
            notified.current = true;
            setTosOpen(false);
            toast.success("Terms of service accepted");
        }
    }, [accepted]);

    if (accepted) {
        return (
            <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 dark:border-green-900/30 dark:bg-green-900/10 p-4">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-green-500">
                    <Check className="h-3.5 w-3.5 text-white" />
                </span>
                <p className="text-sm text-ink">
                    <span className="font-semibold">Bridge&apos;s Terms of Service</span> — accepted
                </p>
            </div>
        );
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setTosOpen(true)}
                className="flex w-full items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-900/10 p-4 text-left transition-colors hover:border-amber-300"
            >
                <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-amber-400 bg-white dark:bg-gray-900")} />
                <span className="text-sm text-ink">
                    I agree to <span className="font-semibold text-violet-600 underline underline-offset-2">Bridge&apos;s Terms of Service</span>
                    <span className="block text-xs text-muted mt-0.5">Tap to review and accept — opens right here, no new tab.</span>
                </span>
            </button>

            {customer.tosLink ? (
                <Modal
                    open={tosOpen}
                    onOpenChange={setTosOpen}
                    title="Bridge terms of service"
                    description="Accept the terms below — this closes automatically once it's done."
                    size="lg"
                >
                    <div className="h-[65vh] max-h-[600px] w-full overflow-hidden rounded-lg border border-border">
                        <iframe src={customer.tosLink} title="Bridge terms of service" className="h-full w-full" />
                    </div>
                </Modal>
            ) : null}
        </>
    );
}
