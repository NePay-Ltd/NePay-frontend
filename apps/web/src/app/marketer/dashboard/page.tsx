"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, LogOut, Megaphone, Users, UserCheck, Trophy } from "lucide-react";
import { toast } from "sonner";

import { clearMarketerToken, getMarketerDashboard, getMarketerToken, type MarketerDashboard } from "@/lib/marketer-api";
import { Button } from "@/components/shared/button";
import { Panel, PanelBody, PanelHeader } from "@/components/shared/panel";
import { Skeleton } from "@/components/shared/skeletons";

export default function MarketerDashboardPage() {
    const router = useRouter();
    const [data, setData] = useState<MarketerDashboard | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!getMarketerToken()) {
            router.replace("/marketer/login");
            return;
        }
        getMarketerDashboard()
            .then(setData)
            .catch((err) => {
                clearMarketerToken();
                setError(err instanceof Error ? err.message : "Session expired");
            });
    }, [router]);

    const signOut = () => {
        clearMarketerToken();
        router.replace("/marketer/login");
    };

    if (error) {
        return (
            <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-8 text-center">
                <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                    {error}
                </p>
                <Button variant="primary" onClick={() => router.replace("/marketer/login")}>
                    Sign in again
                </Button>
            </main>
        );
    }

    if (!data) {
        return (
            <main className="mx-auto max-w-4xl space-y-6 p-5 sm:p-10">
                <Skeleton className="h-8 w-48 sm:w-56" />
                <Skeleton className="h-32 w-full rounded-xl sm:h-24" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Skeleton className="h-24 rounded-xl" />
                    <Skeleton className="h-24 rounded-xl" />
                    <Skeleton className="h-24 rounded-xl" />
                </div>
            </main>
        );
    }

    const link = typeof window !== "undefined" ? `${window.location.origin}/register?mkt=${data.marketerCode}` : data.marketerCode;
    const isActive = data.status === "ACTIVE";

    const copyLink = async () => {
        await navigator.clipboard.writeText(link);
        toast.success("Referral link copied!");
    };

    return (
        <main className="mx-auto max-w-4xl space-y-6 p-5 sm:p-10">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-gradient shadow-sm">
                        <Megaphone className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted">Partner dashboard</p>
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="break-all text-xl font-extrabold text-ink sm:text-2xl md:text-3xl">{data.marketerCode}</h1>
                            <span
                                className={
                                    "inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-bold " +
                                    (isActive
                                        ? "bg-green-100 text-green-700"
                                        : "bg-gray-100 text-gray-600")
                                }
                            >
                                {isActive ? "Active" : "Inactive"}
                            </span>
                        </div>
                    </div>
                </div>
                <Button variant="quiet" size="sm" className="shrink-0" onClick={signOut}>
                    <LogOut className="h-4 w-4" />
                    Sign out
                </Button>
            </div>

            {/* Referral link */}
            <Panel>
                <PanelHeader
                    title="Your referral link"
                    description="Share this link — signups and deposits made through it are credited to you."
                />
                <PanelBody>
                    <div className="flex w-full items-center gap-2 rounded-xl border border-border bg-gray-50 px-3 py-3 sm:px-4">
                        <code className="flex-1 min-w-0 truncate text-[13px] font-semibold text-ink md:text-sm">
                            {link}
                        </code>
                        <button
                            onClick={copyLink}
                            className="shrink-0 rounded-lg p-2 text-violet-600 transition-colors hover:bg-violet-50"
                            aria-label="Copy referral link"
                        >
                            <Copy className="h-4 w-4 md:h-5 md:w-5" />
                        </button>
                    </div>
                    <Button variant="primary" className="mt-4 h-11 w-full font-bold sm:w-auto" onClick={copyLink}>
                        <Copy className="mr-1.5 h-4 w-4" />
                        Copy link
                    </Button>
                </PanelBody>
            </Panel>

            {/* Metrics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Metric icon={Users} label="Signups" value={data.signups} tint="violet" />
                <Metric icon={UserCheck} label="Verified conversions" value={data.verifiedConversions} tint="green" />
                <Metric icon={Trophy} label="Cohort points" value={data.cohortAllTimePoints} tint="amber" />
            </div>

            {/* Recent verified referrals */}
            <Panel>
                <PanelHeader title="Recent verified referrals" />
                <PanelBody>
                    {data.recentVerified.length === 0 ? (
                        <p className="py-4 text-sm text-body">No verified conversions yet.</p>
                    ) : (
                        <div className="divide-y divide-border">
                            {data.recentVerified.map((item) => (
                                <div className="flex items-center justify-between gap-3 py-3 text-sm" key={`${item.displayName}-${item.firstDepositAt}`}>
                                    <span className="min-w-0 truncate font-medium text-ink">{item.displayName}</span>
                                    <span className="shrink-0 text-muted">{new Date(item.firstDepositAt).toLocaleDateString()}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </PanelBody>
            </Panel>
        </main>
    );
}

function Metric({
    icon: Icon,
    label,
    value,
    tint,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: number;
    tint: "violet" | "green" | "amber";
}) {
    const tints = {
        violet: "bg-violet-100 text-violet-600",
        green: "bg-green-100 text-green-600",
        amber: "bg-amber-100 text-amber-600",
    } as const;
    return (
        <Panel className="flex flex-col items-center text-center">
            <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-full shadow-sm ${tints[tint]}`}>
                <Icon className="h-5 w-5" />
            </div>
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted">{label}</p>
            <p className="mt-1.5 font-mono text-3xl font-black text-ink">{value.toLocaleString()}</p>
        </Panel>
    );
}
