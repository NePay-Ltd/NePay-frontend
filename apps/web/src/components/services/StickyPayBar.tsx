"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/shared/button";
import { formatNaira } from "@/lib/format";

interface StickyPayBarProps {
    visible: boolean;
    summaryText: string;
    amount: number;
    buttonText?: string;
    onPay: () => void;
    disabled?: boolean;
    loading?: boolean;
}

export function StickyPayBar({ 
    visible, 
    summaryText, 
    amount, 
    buttonText = "Pay", 
    onPay, 
    disabled, 
    loading 
}: StickyPayBarProps) {
    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="fixed bottom-0 left-0 lg:left-64 right-0 z-[100] bg-white border-t border-border p-4 pb-safe sm:p-6 shadow-[0_-8px_30px_rgba(0,0,0,0.04)]"
                >
                    <div className="mx-auto max-w-xl flex items-center justify-between gap-4">
                        <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-[13px] font-medium text-muted truncate">{summaryText}</span>
                            <span className="text-xl sm:text-2xl font-black text-ink tracking-tight tabular-nums">
                                {formatNaira(amount)}
                            </span>
                        </div>
                        <div className="flex-shrink-0 w-32 sm:w-40">
                            <Button
                                onClick={onPay}
                                disabled={disabled || loading}
                                variant="primary"
                                fullWidth
                                className="h-12 sm:h-14 rounded-2xl font-bold shadow-md shadow-violet-500/20 text-[15px] sm:text-base transition-transform active:scale-95"
                            >
                                {loading ? "Processing..." : buttonText}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
