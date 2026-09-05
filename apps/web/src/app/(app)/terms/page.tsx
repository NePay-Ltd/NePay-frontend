import * as React from "react";
import { TermsContent } from "@/components/legal/TermsContent";
import { Button } from "@/components/shared/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
    return (
        <div className="max-w-3xl mx-auto py-12 px-6">
            <div className="mb-8">
                <Button variant="quiet" size="sm" asChild className="mb-4">
                    <Link href="/">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Home
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold text-slate-900">Terms of Service</h1>
            </div>
            <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-sm">
                <TermsContent />
            </div>
        </div>
    );
}
