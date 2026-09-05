import * as React from "react";
import { EulaContent } from "@/components/legal/EulaContent";

export default function MarketingCompliancePage() {
    return (
        <div className="max-w-4xl mx-auto py-16 px-6">
            <h1 className="text-4xl font-extrabold text-marketing-text mb-8">Compliance & EULA</h1>
            <div className="bg-marketing-surface border border-marketing-border rounded-3xl p-8 shadow-sm">
                <EulaContent />
            </div>
        </div>
    );
}
