"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, HelpCircle, FileText, Shield } from "lucide-react";
import { IconChevronRight as ChevronRight } from "@/components/icons";

import { Panel, PanelBody } from "@/components/shared/panel";
import { RowItem } from "@/components/shared/row-item";
import { Button } from "@/components/shared/button";

export default function AboutPage() {
    const router = useRouter();

    return (
        <div className="mx-auto max-w-2xl space-y-6 pb-32 pt-6 lg:pb-12">
            <div className="mb-4">
                <Link href="/profile" className="inline-flex items-center text-sm font-medium text-muted hover:text-ink transition-colors mb-4 -ml-1 px-1 py-1">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Profile
                </Link>
                <h1 className="text-2xl font-bold text-ink">About NePay</h1>
                <p className="text-sm text-muted mt-1">Information, legal documents, and support.</p>
            </div>

            <div className="flex flex-col items-center justify-center pt-8 pb-10">
                <img src="/icon.png" alt="NePay Logo" className="w-20 h-20 rounded-2xl mb-4 shadow-sm" />
                <h2 className="text-2xl font-extrabold text-ink mb-1">NePay</h2>
                <p className="text-sm text-muted mb-6">Version 1.0.0 (Build 1)</p>
                <p className="text-[15px] leading-relaxed text-body text-center max-w-lg px-4">
                    NePay is a comprehensive financial platform designed to bridge the gap between traditional fiat currencies and digital assets in Nigeria and beyond. Our mission is to make payments, utility settlements, and crypto transactions seamless, secure, and accessible to everyone.
                </p>
            </div>

            <Panel>
                <PanelBody className="p-0">
                    <div className="divide-y divide-border">
                        <RowItem
                            icon={HelpCircle}
                            title="Frequently Asked Questions"
                            trailing={<ChevronRight className="h-5 w-5 text-muted" />}
                            onClick={() => router.push("/faq")}
                            className="cursor-pointer px-5 hover:bg-gray-50"
                        />
                        <RowItem
                            icon={FileText}
                            title="End User Licence Agreement"
                            trailing={<ChevronRight className="h-5 w-5 text-muted" />}
                            onClick={() => router.push("/eula")}
                            className="cursor-pointer px-5 hover:bg-gray-50"
                        />
                        <RowItem
                            icon={FileText}
                            title="Terms of Service"
                            trailing={<ChevronRight className="h-5 w-5 text-muted" />}
                            onClick={() => router.push("/terms")}
                            className="cursor-pointer px-5 hover:bg-gray-50"
                        />
                        <RowItem
                            icon={Shield}
                            title="Privacy Policy"
                            trailing={<ChevronRight className="h-5 w-5 text-muted" />}
                            onClick={() => router.push("/privacy")}
                            className="cursor-pointer px-5 hover:bg-gray-50"
                        />
                    </div>
                </PanelBody>
            </Panel>
            
            <div className="flex flex-col items-center justify-center pt-8 text-sm text-muted">
                <p>NePay Version 1.0.0</p>
                <p>© 2026 Circle Technology Limited</p>
            </div>
        </div>
    );
}
