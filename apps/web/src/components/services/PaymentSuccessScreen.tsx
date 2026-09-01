"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { IconCheck as Check } from "@/components/icons";;
import { Button } from "@/components/shared/button";
import { formatNaira } from "@/lib/format";

interface PaymentSuccessScreenProps {
    open: boolean;
    amount: number;
    title?: string;
    description?: React.ReactNode;
    onHome: () => void;
    onReceipt?: () => void;
}

export function PaymentSuccessScreen({
    open,
    amount,
    title = "Payment Successful!",
    description,
    onHome,
    onReceipt
}: PaymentSuccessScreenProps) {
    const router = useRouter();

    React.useEffect(() => {
        // Prevent scrolling on body when full screen is open
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 h-[100dvh] w-full z-[200] bg-white flex flex-col items-center justify-center p-6 text-center"
                >
                    <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full">
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 20,
                                delay: 0.1
                            }}
                            className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-xl shadow-green-500/30 mb-8"
                        >
                            <Check className="w-12 h-12 text-white" strokeWidth={4} />
                        </motion.div>

                        <motion.h1
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-3xl font-black text-ink mb-2 tracking-tight"
                        >
                            {title}
                        </motion.h1>

                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-4xl font-black text-green-600 tracking-tighter tabular-nums mb-6"
                        >
                            {formatNaira(amount)}
                        </motion.div>

                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-body text-[15px] font-medium max-w-xs mx-auto mb-12"
                        >
                            {description}
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ y: 40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5, type: "spring", damping: 25 }}
                        className="w-full max-w-sm mx-auto space-y-3 pb-safe"
                    >
                        <Button
                            variant="primary"
                            size="lg"
                            fullWidth
                            onClick={onHome}
                            className="h-14 rounded-2xl text-base font-bold shadow-md shadow-violet-500/20 active:scale-95 transition-transform"
                        >
                            Done
                        </Button>
                        {onReceipt && (
                            <Button
                                variant="quiet"
                                size="lg"
                                fullWidth
                                onClick={onReceipt}
                                className="h-14 rounded-2xl text-base font-bold active:scale-95 transition-transform border border-border"
                            >
                                View Receipt
                            </Button>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
