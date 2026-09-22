"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock3, Gift, Layers, MapPin, Sparkles, type LucideIcon } from "lucide-react";

import { Button } from "@/components/shared/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";

/**
 * Everything a customer needs to know before their first look at Pods,
 * walked through once. Content deliberately covers the two things people
 * actually get wrong about Pods in practice: that the instant payout is
 * already final (a pod is a bonus on top, never a hold), and that a pod's
 * "closes in" countdown is a shared daily reset, not a personal timer.
 *
 * Persistence is the caller's job (see PodsPage): this component only
 * renders steps and reports back via `onClose`, so it works identically
 * whether it opened itself on first visit or was reopened from the help
 * button — the only "won't show again" the flag creates is the automatic
 * open, never the manual one.
 */
const STEPS: Array<{ icon: LucideIcon; title: string; body: string }> = [
    {
        icon: Layers,
        title: "Welcome to Pods",
        body: "Every day, NePay pools together everyone's crypto sales and gift card sales for that day into a “pod.” Once a pod fills up, it's sold in bulk over-the-counter — sometimes for more than the going rate.",
    },
    {
        icon: Sparkles,
        title: "You're always paid instantly",
        body: "Pods never delay or hold your money. The moment you sell, you're paid in full at your own quoted rate. A pod is a bonus layered on top of that payout, never a condition of it.",
    },
    {
        icon: Clock3,
        title: "Pods reset every day",
        body: "Each pod covers one calendar day. If it doesn't fill by the reset, it simply closes with no bonus — your sale was already paid in full either way. A fresh pod opens right after, and the countdown you see is that shared daily reset, not a timer on your own sale.",
    },
    {
        icon: Gift,
        title: "Share the upside",
        body: "If NePay sells a full pod for more than you were quoted, the difference is paid to you as cashback, straight to your wallet — automatically. If it doesn't beat your rate, nothing changes. Cashback is always a bonus, never guaranteed, and you'll only ever see it once it's actually paid.",
    },
    {
        icon: MapPin,
        title: "Where to find it",
        body: "This page always shows today's pod progress and your full cashback history. Lost this guide? Tap the help icon next to “Pods” any time to see it again.",
    },
];

export function PodsIntroGuide({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [step, setStep] = React.useState(0);
    const [direction, setDirection] = React.useState<1 | -1>(1);

    // Always start from the top on a fresh open — including a manual reopen
    // well after the first run, where a lingering mid-guide `step` would
    // otherwise skip straight to wherever the last session left off.
    React.useEffect(() => {
        if (open) {
            setStep(0);
            setDirection(1);
        }
    }, [open]);

    const isLast = step === STEPS.length - 1;
    // `step` only ever moves within [0, STEPS.length - 1] — see `go` and the reset effect above.
    const current = STEPS[step]!;

    const go = (next: number) => {
        setDirection(next > step ? 1 : -1);
        setStep(next);
    };

    const finish = () => onClose();

    return (
        <Dialog open={open} onOpenChange={(next) => !next && finish()}>
            <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
                <DialogTitle className="sr-only">How Pods work</DialogTitle>

                <div className="relative flex min-h-[300px] flex-col p-6 pb-5">
                    <AnimatePresence mode="wait" initial={false} custom={direction}>
                        <motion.div
                            key={step}
                            custom={direction}
                            initial={{ opacity: 0, x: direction * 24 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: direction * -24 }}
                            transition={{ duration: 0.22, ease: "easeOut" }}
                            className="flex-1"
                        >
                            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                                <current.icon className="h-6 w-6" aria-hidden="true" />
                            </span>
                            <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-muted">
                                Step {step + 1} of {STEPS.length}
                            </p>
                            <h2 className="mt-1 text-lg font-extrabold text-ink">{current.title}</h2>
                            <p className="mt-2 text-sm leading-relaxed text-body">{current.body}</p>
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="flex items-center justify-center gap-1.5 pb-5">
                    {STEPS.map((s, index) => (
                        <span
                            key={s.title}
                            aria-hidden="true"
                            className={cn(
                                "h-1.5 rounded-full transition-all",
                                index === step ? "w-5 bg-violet-600" : "w-1.5 bg-violet-200 dark:bg-violet-900",
                            )}
                        />
                    ))}
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-border px-6 py-4">
                    <Button type="button" variant="ghost" size="sm" onClick={finish}>
                        {isLast ? "Close" : "Skip"}
                    </Button>
                    <div className="flex items-center gap-2">
                        {step > 0 && (
                            <Button type="button" variant="quiet" size="sm" onClick={() => go(step - 1)}>
                                Back
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={() => (isLast ? finish() : go(step + 1))}
                        >
                            {isLast ? "Got it, let's go" : "Next"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
