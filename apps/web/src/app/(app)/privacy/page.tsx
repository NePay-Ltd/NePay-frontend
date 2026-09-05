"use client";

import * as React from "react";
import { PrivacyContent } from "@/components/legal/PrivacyContent";
import { Button } from "@/components/shared/button";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
    const router = useRouter();

    return (
        <div className="max-w-3xl mx-auto py-12 px-6">
            <div className="mb-8">
                <button onClick={() => router.back()} className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-4 -ml-1 px-1 py-1">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </button>
                <h1 className="text-3xl font-bold text-slate-900">Privacy Policy</h1>
            </div>
            <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-sm">
                <PrivacyContent />
            </div>
        </div>
    );
}
