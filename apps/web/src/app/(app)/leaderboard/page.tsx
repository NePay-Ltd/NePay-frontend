"use client";

import { Trophy } from "lucide-react";
import { Panel, PanelBody, PanelHeader } from "@/components/shared/panel";
import { Skeleton } from "@/components/shared/skeletons";
import { useCurrentLeaderboard } from "@/lib/queries/leaderboard";

export default function LeaderboardPage() {
    const { data, isLoading, isError } = useCurrentLeaderboard();

    return (
        <div className="mx-auto max-w-3xl space-y-6 pb-12">
            <div className="py-4">
                <div className="flex items-center gap-3"><Trophy className="h-7 w-7 text-amber-500" /><h1 className="text-2xl font-bold text-ink">Leaderboard</h1></div>
                <p className="mt-1 text-sm text-body">Monthly points ranking from your NePay activity.</p>
            </div>
            <Panel>
                <PanelHeader title={data ? `Period ${data.periodKey}` : "Current ranking"} />
                <PanelBody className="p-0">
                    {isLoading ? <div className="space-y-3 p-5">{[1, 2, 3, 4, 5].map((item) => <Skeleton key={item} className="h-14 w-full" />)}</div> : isError ? <p className="p-5 text-sm text-red-600">Leaderboard is temporarily unavailable.</p> : !data?.entries.length ? <div className="p-8 text-center"><Trophy className="mx-auto h-8 w-8 text-muted" /><p className="mt-3 font-semibold text-ink">No rankings yet</p><p className="mt-1 text-sm text-body">The current leaderboard will appear after points are recorded.</p></div> : <div className="divide-y divide-border">{data.entries.map((entry) => <div key={`${entry.rank}-${entry.displayName}`} className="flex items-center gap-4 px-5 py-4"><span className="w-8 text-center font-mono text-sm font-bold text-muted">{entry.rank}</span><div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">{entry.displayName.slice(0, 2).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="font-semibold text-ink">{entry.displayName}</p><p className="text-xs text-muted">{entry.allTimePoints.toLocaleString()} all-time points</p></div><p className="font-mono text-sm font-bold text-amber-600">{entry.monthlyPoints.toLocaleString()} pts</p></div>)}</div>}
                </PanelBody>
            </Panel>
        </div>
    );
}
