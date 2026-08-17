"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

export interface Provider {
    id: string;
    label: string;
    color: string; // e.g. "bg-yellow-400"
    logoUrl?: string; // Optional logo image
}

interface ProviderSelectorProps {
    providers: Provider[];
    selectedId: string;
    onChange: (id: string) => void;
}

export function ProviderSelector({ providers, selectedId, onChange }: ProviderSelectorProps) {
    if (providers.length === 0) return null;

    return (
        <div className="space-y-3">
            <h3 className="text-xs font-bold text-muted uppercase tracking-wider px-1">Select Provider</h3>
            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar snap-x">
                {providers.map((provider) => {
                    const isSelected = selectedId === provider.id;

                    return (
                        <motion.button
                            key={provider.id}
                            type="button"
                            onClick={() => onChange(provider.id)}
                            whileTap={{ scale: 0.96 }}
                            className={`relative flex-none snap-start flex items-center justify-between rounded-full border-2 transition-all pl-2 pr-5 h-14 ${
                                isSelected 
                                    ? "border-violet-600 bg-violet-50/50 shadow-sm" 
                                    : "border-border bg-white hover:border-violet-200"
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                {provider.logoUrl ? (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm overflow-hidden border border-gray-100 shrink-0">
                                        <img src={provider.logoUrl} alt={provider.label} className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${provider.color} text-white font-black text-sm shadow-sm shrink-0`}>
                                        {provider.label.charAt(0)}
                                    </div>
                                )}
                                <span className={`text-[15px] font-bold ${isSelected ? 'text-violet-900' : 'text-ink'}`}>
                                    {provider.label}
                                </span>
                            </div>

                            <AnimatePresence>
                                {isSelected && (
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                        className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-white shadow-sm ring-2 ring-white"
                                    >
                                        <Check className="h-3 w-3" strokeWidth={3} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
