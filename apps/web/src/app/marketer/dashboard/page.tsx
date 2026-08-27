"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearMarketerToken, getMarketerDashboard, getMarketerToken, type MarketerDashboard } from "@/lib/marketer-api";

export default function MarketerDashboardPage() {
    const router = useRouter();
    const [data, setData] = useState<MarketerDashboard | null>(null);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => { if (!getMarketerToken()) { router.replace("/marketer/login"); return; } getMarketerDashboard().then(setData).catch((err) => { clearMarketerToken(); setError(err instanceof Error ? err.message : "Session expired"); }); }, [router]);
    if (error) return <main className="mx-auto max-w-3xl p-8"><p className="text-red-600">{error}</p><button className="btn mt-4" onClick={() => router.replace("/marketer/login")}>Sign in again</button></main>;
    if (!data) return <main className="mx-auto max-w-3xl p-8 text-body">Loading dashboard…</main>;
    const link = typeof window !== "undefined" ? `${window.location.origin}/register?mkt=${data.marketerCode}` : data.marketerCode;
    return <main className="mx-auto max-w-3xl space-y-6 p-6 sm:p-10"><div className="flex items-start justify-between"><div><p className="text-sm text-muted">Partner dashboard</p><h1 className="text-3xl font-bold text-ink">{data.marketerCode}</h1></div><button className="btn" onClick={() => { clearMarketerToken(); router.replace("/marketer/login"); }}>Sign out</button></div><div className="rounded-lg border border-border bg-gray-50 p-4"><p className="text-xs uppercase tracking-wider text-muted">Your referral link</p><p className="mt-2 break-all font-mono text-sm text-ink">{link}</p></div><div className="grid grid-cols-2 gap-4"><Metric label="Signups" value={data.signups} /><Metric label="Verified conversions" value={data.verifiedConversions} /><Metric label="Cohort points" value={data.cohortAllTimePoints} /></div><section className="rounded-xl border border-border bg-white p-5"><h2 className="font-semibold text-ink">Recent verified referrals</h2>{data.recentVerified.length === 0 ? <p className="mt-4 text-sm text-body">No verified conversions yet.</p> : <div className="mt-4 divide-y divide-border">{data.recentVerified.map((item) => <div className="flex justify-between py-3 text-sm" key={`${item.displayName}-${item.firstDepositAt}`}><span className="text-ink">{item.displayName}</span><span className="text-muted">{new Date(item.firstDepositAt).toLocaleDateString()}</span></div>)}</div>}</section></main>;
}

function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border border-border bg-white p-5"><p className="text-xs uppercase tracking-wider text-muted">{label}</p><p className="mt-2 font-mono text-2xl font-bold text-ink">{value.toLocaleString()}</p></div>; }
