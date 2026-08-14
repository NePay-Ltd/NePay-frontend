"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus } from "lucide-react";
import { Button } from "@/components/shared/button";

interface TravelerBottomSheetProps {
    open: boolean;
    onClose: () => void;
    adults: number;
    setAdults: (val: number) => void;
    childrenCount: number;
    setChildrenCount: (val: number) => void;
    infants: number;
    setInfants: (val: number) => void;
    travelClass: string;
    setTravelClass: (val: string) => void;
}

export function TravelerBottomSheet({ 
    open, 
    onClose, 
    adults, setAdults, 
    childrenCount, setChildrenCount, 
    infants, setInfants, 
    travelClass, setTravelClass 
}: TravelerBottomSheetProps) {

    // Lock body scroll when open
    React.useEffect(() => {
        if (open) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    const Stepper = ({ title, subtitle, value, onChange, min, max }: any) => (
        <div className="flex items-center justify-between py-4">
            <div>
                <p className="font-bold text-ink">{title}</p>
                {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-4">
                <button
                    onClick={() => onChange(Math.max(min, value - 1))}
                    disabled={value <= min}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-ink transition-colors disabled:opacity-30 disabled:bg-gray-50 hover:bg-gray-100 active:bg-gray-200"
                >
                    <Minus className="h-5 w-5" />
                </button>
                <span className="w-4 text-center font-bold text-lg tabular-nums">{value}</span>
                <button
                    onClick={() => onChange(Math.min(max, value + 1))}
                    disabled={value >= max}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-ink transition-colors disabled:opacity-30 disabled:bg-gray-50 hover:bg-gray-100 active:bg-gray-200"
                >
                    <Plus className="h-5 w-5" />
                </button>
            </div>
        </div>
    );

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed inset-x-0 bottom-0 z-[101] flex flex-col h-auto max-h-[90dvh] sm:max-w-md sm:mx-auto sm:bottom-4 sm:rounded-[32px] rounded-t-[32px] bg-white shadow-2xl overflow-hidden pb-safe"
                    >
                        {/* Drag Handle & Header */}
                        <div className="flex-none px-6 pt-4 pb-4 text-center relative border-b border-border">
                            <div className="mx-auto w-12 h-1.5 rounded-full bg-gray-200 mb-4 sm:hidden" />
                            <h2 className="text-lg font-black text-ink">Travelers & Class</h2>
                            <button 
                                onClick={onClose}
                                className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X className="h-5 w-5 text-muted" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-2">
                            {/* Passengers Steppers */}
                            <div className="divide-y divide-border border-b border-border mb-6">
                                <Stepper 
                                    title="Adults" 
                                    subtitle="Age 12+" 
                                    value={adults} 
                                    onChange={setAdults} 
                                    min={1} 
                                    max={9} 
                                />
                                <Stepper 
                                    title="Children" 
                                    subtitle="Age 2-11" 
                                    value={childrenCount} 
                                    onChange={setChildrenCount} 
                                    min={0} 
                                    max={8} 
                                />
                                <Stepper 
                                    title="Infants" 
                                    subtitle="Under 2" 
                                    value={infants} 
                                    onChange={setInfants} 
                                    min={0} 
                                    max={adults} // Usually 1 infant per adult max
                                />
                            </div>

                            {/* Cabin Class */}
                            <div>
                                <h3 className="text-sm font-bold text-ink mb-4">Cabin Class</h3>
                                <div className="space-y-3 mb-6">
                                    {["Economy", "Business", "First"].map((c) => (
                                        <button
                                            key={c}
                                            onClick={() => setTravelClass(c)}
                                            className="w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left group hover:bg-gray-50 active:bg-gray-100"
                                            style={{
                                                borderColor: travelClass === c ? "var(--tw-colors-violet-600)" : "transparent",
                                                backgroundColor: travelClass === c ? "var(--tw-colors-violet-50)" : undefined,
                                            }}
                                        >
                                            <span className={`font-bold ${travelClass === c ? "text-violet-900" : "text-ink"}`}>
                                                {c}
                                            </span>
                                            <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                                travelClass === c ? "border-violet-600 bg-violet-600" : "border-gray-300"
                                            }`}>
                                                {travelClass === c && <div className="h-2 w-2 rounded-full bg-white" />}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer Button */}
                        <div className="flex-none p-4 pt-2 border-t border-border">
                            <Button variant="primary" fullWidth size="lg" onClick={onClose} className="h-14 rounded-2xl text-base font-bold shadow-md shadow-violet-500/20 active:scale-95 transition-transform">
                                Apply
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
