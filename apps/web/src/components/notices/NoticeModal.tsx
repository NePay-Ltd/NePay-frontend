"use client";

import { usePathname } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/shared/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { isProtectedPinRoute } from "@/components/layout/app-shell";
import { cn } from "@/lib/cn";
import { useAuth } from "@/lib/auth-context";
import { useAcknowledgeNotice, useActiveNotices, useDismissNotice } from "@/lib/queries/notices";
import type { NoticeSeverity } from "@/lib/queries/notices";

const SEVERITY_BADGE: Record<Exclude<NoticeSeverity, "info">, string> = {
    warning: "bg-amber-500/10 text-amber-700",
    critical: "bg-red-500/10 text-red-500",
};

const SEVERITY_LABEL: Record<Exclude<NoticeSeverity, "info">, string> = {
    warning: "Warning",
    critical: "Critical",
};

/**
 * Shows the single highest-priority modal-surface notice (the backend
 * already sorts by severity then recency and filters out anything this user
 * has dismissed/acknowledged) — dismissing or acknowledging just makes the
 * next one appear on the next cache update, so there's no client-side queue
 * to manage here.
 *
 * Uses the raw Dialog primitives rather than the shared `Modal` wrapper
 * (same choice TransactionPinSetupGate already made) because a
 * `requiresAcknowledgement` notice needs `DialogContent`'s `hideCloseButton`
 * — the shared `Modal` component doesn't forward that prop, and this is a
 * real correctness requirement, not a style preference: a compliance-grade
 * notice must have no way to dismiss it except the explicit action.
 */
export function NoticeModal() {
    const { user, isLoading } = useAuth();
    const pathname = usePathname();
    const { data } = useActiveNotices();
    const dismiss = useDismissNotice();
    const acknowledge = useAcknowledgeNotice();

    if (isLoading || !user) return null;
    if (isProtectedPinRoute(pathname)) return null;

    const notice = data?.modal[0] ?? null;
    if (!notice) return null;

    const requiresAck = notice.requiresAcknowledgement;
    const busy = dismiss.isPending || acknowledge.isPending;

    return (
        <Dialog
            open
            onOpenChange={(nextOpen) => {
                // Radix funnels every close trigger (X button, Escape, outside
                // click) through here as onOpenChange(false). A notice that
                // requires acknowledgement ignores all of them — `open` stays
                // derived from query data above, so Radix is simply told
                // "still open" again on the next render.
                if (!nextOpen && !requiresAck && !busy) {
                    dismiss.mutate(notice.id, {
                        onError: () => toast.error("Couldn't dismiss this notice. Please try again."),
                    });
                }
            }}
        >
            <DialogContent
                hideCloseButton={requiresAck}
                onEscapeKeyDown={(event) => requiresAck && event.preventDefault()}
                onPointerDownOutside={(event) => requiresAck && event.preventDefault()}
                onInteractOutside={(event) => requiresAck && event.preventDefault()}
            >
                <DialogHeader>
                    {notice.severity !== "info" && (
                        <span
                            className={cn(
                                "mb-1 inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                                SEVERITY_BADGE[notice.severity],
                            )}
                        >
                            {SEVERITY_LABEL[notice.severity]}
                        </span>
                    )}
                    <DialogTitle>{notice.title}</DialogTitle>
                    <DialogDescription className="whitespace-pre-wrap">{notice.body}</DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    {requiresAck ? (
                        <Button
                            variant="primary"
                            disabled={busy}
                            onClick={() => acknowledge.mutate(notice.id, {
                                onError: () => toast.error("Couldn't record your acknowledgement. Please try again."),
                            })}
                        >
                            I understand
                        </Button>
                    ) : (
                        <>
                            <Button
                                variant="quiet"
                                disabled={busy}
                                onClick={() => dismiss.mutate(notice.id, {
                                    onError: () => toast.error("Couldn't dismiss this notice. Please try again."),
                                })}
                            >
                                Dismiss
                            </Button>
                            {notice.ctaLabel && notice.ctaUrl && (
                                <Button variant="primary" asChild>
                                    <a href={notice.ctaUrl}>{notice.ctaLabel}</a>
                                </Button>
                            )}
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
