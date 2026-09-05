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
 * live Bridge's page sends no X-Frame-Options/CSP blocking this).
 *
 * Bridge's docs say their hosted ToS page fires a `postMessage` carrying
 * `signedAgreementId` on completion but don't document the exact payload
 * shape — not safe to parse blindly. What we check instead is the
 * message's origin — but per Bridge support (2026-09-06), that's NOT a
 * fixed domain: it must come from the actual `tosLink` URL Bridge returned
 * for this customer, not a hardcoded guess. (An earlier version of this
 * file hardcoded `compliance.bridge.xyz`/`compliance.sandbox.bridge.xyz`
 * based on a docs example and a live sandbox sample — both real
 * observations, but Bridge confirmed the real pattern is
 * `dashboard.bridge.xyz` for at least one existing-customer case, so
 * guessing was the wrong approach regardless of which guess happened to be
 * closer.) Deriving the expected origin from `tosLink` itself is correct
 * in every environment by construction. Any message from that origin is
 * treated as "the user likely just finished" and triggers an immediate
 * refresh — the origin check is what makes this safe to act on without
 * needing to parse the payload. A slower poll stays running the whole time
 * as a fallback in case the message never fires (page changes, the user
 * closes the modal mid-flow, etc.) — the postMessage listener only makes
 * the common case near-instant instead of waiting for the next tick.
 */

import * as React from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";

import { Modal } from "@/components/shared/modal";
import { useRefreshBridgeCustomer } from "@/lib/queries/bridge";
import { cn } from "@/lib/cn";

function originOf(url: string | null): string | null {
    if (!url) return null;
    try {
        return new URL(url).origin;
    } catch {
        return null;
    }
}

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
        const interval = setInterval(() => refresh(), 6000);
        return () => clearInterval(interval);
    }, [tosOpen, refresh]);

    React.useEffect(() => {
        if (!tosOpen) return;
        const expectedOrigin = originOf(customer.tosLink);
        if (!expectedOrigin) return;
        const handleMessage = (event: MessageEvent) => {
            if (event.origin !== expectedOrigin) return;
            refresh();
        };
        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [tosOpen, customer.tosLink, refresh]);

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
