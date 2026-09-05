import * as React from "react";
import { PrivacyContent } from "@/components/legal/PrivacyContent";

export default function MarketingPrivacyPage() {
    return (
        <div className="max-w-4xl mx-auto py-16 px-6">
            <h1 className="text-4xl font-extrabold text-marketing-text mb-8">Privacy Policy</h1>
            <div className="bg-marketing-surface border border-marketing-border rounded-3xl p-8 shadow-sm">
                <PrivacyContent />
            </div>
        </div>
    );
}
