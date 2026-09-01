"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconClose as X, IconSearch as Search, IconCheck as Check, IconHistory as History } from "@/components/icons";
import { MapPin } from "lucide-react";;
import { AIRPORTS, type Airport } from "@/lib/queries/flights";

interface AirportBottomSheetProps {
    open: boolean;
    onClose: () => void;
    value: string;
    onChange: (val: string) => void;
    label: string; // e.g. "From" or "To"
}

export function AirportBottomSheet({ open, onClose, value, onChange, label }: AirportBottomSheetProps) {
    const [query, setQuery] = React.useState("");

    // Lock body scroll when open
    React.useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
            setQuery(""); // Reset search when closed
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    const filteredAirports = React.useMemo(() => {
        if (!query.trim()) return [];
        const lowerQ = query.toLowerCase();
        return AIRPORTS.filter(a => 
            a.city.toLowerCase().includes(lowerQ) || 
            a.code.toLowerCase().includes(lowerQ) || 
            a.country.toLowerCase().includes(lowerQ)
        );
    }, [query]);

    // Mock recent for empty state
    const recentAirports = AIRPORTS.slice(0, 3); // Just grabbing first 3 as mock recents

    const handleSelect = (code: string) => {
        onChange(code);
        onClose();
    };

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
                        className="fixed inset-x-0 bottom-0 z-[101] flex flex-col h-[90dvh] sm:h-[80dvh] sm:max-w-lg sm:mx-auto sm:bottom-4 sm:rounded-[32px] rounded-t-[32px] bg-white shadow-2xl overflow-hidden"
                    >
                        {/* Drag Handle & Header */}
                        <div className="flex-none px-6 pt-4 pb-2 text-center relative">
                            <div className="mx-auto w-12 h-1.5 rounded-full bg-gray-200 mb-4 sm:hidden" />
                            <h2 className="text-lg font-black text-ink">Select {label} Airport</h2>
                            <button 
                                onClick={onClose}
                                className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X className="h-5 w-5 text-muted" />
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="flex-none px-4 pb-4 border-b border-border">
                            <div className="relative flex items-center">
                                <Search className="absolute left-4 h-5 w-5 text-muted" />
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder="Search city or airport code..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="w-full h-14 rounded-2xl bg-gray-100 pl-12 pr-4 text-[15px] font-semibold text-ink placeholder:font-medium placeholder:text-muted focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-600 transition-all"
                                />
                                {query && (
                                    <button 
                                        onClick={() => setQuery("")}
                                        className="absolute right-4 p-1 rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Content List */}
                        <div className="flex-1 overflow-y-auto overscroll-contain pb-safe hide-scrollbar">
                            {!query ? (
                                <div className="p-4">
                                    <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-2 px-2">Recent Searches</h3>
                                    <div className="space-y-1">
                                        {recentAirports.map(airport => (
                                            <button
                                                key={`recent-${airport.code}`}
                                                onClick={() => handleSelect(airport.code)}
                                                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-muted">
                                                        <History className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[15px] font-bold text-ink">{airport.city}</p>
                                                        <p className="text-xs font-medium text-muted">{airport.country}</p>
                                                    </div>
                                                </div>
                                                <span className="font-mono font-bold text-violet-600">{airport.code}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-2">
                                    {filteredAirports.length === 0 ? (
                                        <div className="py-12 text-center text-muted">
                                            <p className="font-semibold text-ink">No airports found</p>
                                            <p className="text-sm mt-1">Try a different city or airport code</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            {filteredAirports.map(airport => (
                                                <button
                                                    key={airport.code}
                                                    onClick={() => handleSelect(airport.code)}
                                                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                                                            <MapPin className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[15px] font-bold text-ink">{airport.city}</p>
                                                            <p className="text-xs font-medium text-muted">{airport.country}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-mono font-bold text-violet-600">{airport.code}</span>
                                                        {value === airport.code && (
                                                            <Check className="h-4 w-4 text-violet-600" strokeWidth={3} />
                                                        )}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
