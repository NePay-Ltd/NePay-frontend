"use client";

import * as React from "react";
import { EulaContent } from "@/components/legal/EulaContent";
import { Button } from "@/components/shared/button";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function EulaPage() {
    const router = useRouter();

    return (
        <div className="max-w-3xl mx-auto py-12 px-6">
            <div className="mb-8">
                <button onClick={() => router.back()} className="inline-flex items-center text-sm font-medium text-muted hover:text-ink transition-colors mb-4 -ml-1 px-1 py-1">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </button>
                <h1 className="text-3xl font-bold text-ink">End User Licence Agreement</h1>
            </div>
            <div className="bg-white dark:bg-zinc-950 p-8 sm:p-12 rounded-2xl border border-border shadow-sm">
                <EulaContent />
            </div>
        </div>
    );
}
