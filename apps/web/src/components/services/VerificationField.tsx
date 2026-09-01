"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";;
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface VerificationFieldProps {
    label: string;
    placeholder: string;
    value: string;
    onChange: (val: string) => void;
    onVerify: () => Promise<void>;
    status: "idle" | "loading" | "success" | "error";
    resolvedName?: string;
    errorMessage?: string;
    maxLength?: number;
}

export function VerificationField({
    label,
    placeholder,
    value,
    onChange,
    onVerify,
    status,
    resolvedName,
    errorMessage,
    maxLength
}: VerificationFieldProps) {
    return (
        <div className="space-y-3 relative z-10">
            <Label className="text-sm font-bold text-ink">{label}</Label>
            <div className="relative">
                <Input
                    type="text"
                    inputMode="numeric"
                    placeholder={placeholder}
                    value={value}
                    maxLength={maxLength}
                    onChange={(e) => onChange(e.target.value)}
                    className={`h-14 rounded-2xl pl-4 pr-[100px] text-lg font-bold placeholder:font-medium transition-colors ${
                        status === "error" ? "border-red-500 focus-visible:ring-red-500" :
                        status === "success" ? "border-green-500 focus-visible:ring-green-500" : ""
                    }`}
                />
                <div className="absolute right-1.5 top-1.5 bottom-1.5 flex">
                    <button
                        type="button"
                        onClick={onVerify}
                        disabled={!value || status === "loading"}
                        className="h-full px-5 rounded-xl bg-gray-100 text-ink text-[13px] font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[80px]"
                    >
                        {status === "loading" ? (
                            <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
                        ) : status === "success" ? (
                            "Verified"
                        ) : (
                            "Verify"
                        )}
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {status === "success" && resolvedName && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2 px-4 py-3 bg-green-50 rounded-xl border border-green-200"
                    >
                        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                        <span className="text-sm font-bold text-green-900 truncate">
                            {resolvedName}
                        </span>
                    </motion.div>
                )}

                {status === "error" && errorMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2 px-4 py-3 bg-red-50 rounded-xl border border-red-200"
                    >
                        <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                        <span className="text-sm font-bold text-red-900">
                            {errorMessage}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
