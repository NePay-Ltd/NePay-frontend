"use client";

import { ArrowUpRight, Sparkles, Target, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { Panel, PanelBody, PanelHeader } from "@/components/shared/panel";
import { Skeleton } from "@/components/shared/skeletons";
import { useCurrentLeaderboard } from "@/lib/queries/leaderboard";

export default function LeaderboardPage() {
    const { data, isLoading, isError } = useCurrentLeaderboard();
    const topTen = data?.topTwenty.slice(0, 10) ?? [];
    const currentUser = data?.currentUser;
    const userIsInTopTen = !!currentUser && topTen.some((entry) => entry.rank === currentUser.rank);
    const nextTarget = currentUser && currentUser.rank > 1
        ? topTen.find((entry) => entry.rank === (currentUser.rank > 10 ? 10 : currentUser.rank - 1))
        : undefined;
    const pointsToNext = nextTarget ? Math.max(0, nextTarget.monthlyPoints - (currentUser?.monthlyPoints ?? 0)) : 0;
    const progressToNext = nextTarget ? Math.min(100, ((currentUser?.monthlyPoints ?? 0) / nextTarget.monthlyPoints) * 100) : 100;

    return (
        <div className="mx-auto max-w-3xl space-y-6 pb-12">
            <div className="animate-in fade-in slide-in-from-bottom-2 py-4 duration-500">
                <div className="flex items-center gap-3"><Trophy className="h-7 w-7 text-amber-500" /><h1 className="text-2xl font-bold text-ink">Leaderboard</h1></div>
                <p className="mt-1 text-sm text-body">Monthly points ranking from your NePay activity.</p>
            </div>

            {currentUser && (
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                >
                    <Panel className={userIsInTopTen ? "overflow-hidden border-amber-300 shadow-[0_0_24px_rgba(245,158,11,0.22)]" : "overflow-hidden"}>
                        <PanelBody className={`relative overflow-hidden p-0 ${userIsInTopTen ? "bg-gradient-to-br from-amber-50 via-white to-violet-50" : "bg-gradient-to-br from-violet-50 via-white to-amber-50"}`}>
                            <div className="absolute -right-8 -top-10 text-7xl opacity-10" aria-hidden="true">🏆</div>
                            <div className="relative grid gap-6 p-6 sm:grid-cols-[auto_1fr] sm:items-center sm:p-7">
                                <motion.div
                                    className={`relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full ${userIsInTopTen ? "bg-amber-200" : "bg-violet-200"}`}
                                    animate={{ scale: [1, 1.025, 1] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                >
                                    <div className="absolute inset-2 rounded-full border-4 border-white/80" />
                                    <div className="text-center">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Rank</p>
                                        <p className="font-mono text-4xl font-black text-ink">#{currentUser.rank}</p>
                                    </div>
                                </motion.div>
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">Your leaderboard journey</p>
                                        {userIsInTopTen && <span className="rounded-full bg-amber-200 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-amber-800">Top 10 🎉</span>}
                                    </div>
                                    <h2 className="mt-2 text-2xl font-black text-ink">{currentUser.displayName}</h2>
                                    <p className="mt-1 max-w-xl text-sm font-medium leading-6 text-body">
                                        {userIsInTopTen ? "Congratulations, you are on the leaderboard! Keep it up and stand a chance to win amazing prizes. ✨" : "Keep earning points to move higher and stand a chance to win amazing prizes. 🚀"}
                                    </p>
                                    <div className="mt-5 grid grid-cols-2 gap-3 sm:max-w-sm">
                                        <div className="rounded-xl border border-black/5 bg-white/70 p-3">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">This month</p>
                                            <p className="mt-1 font-mono text-xl font-black text-ink">{currentUser.monthlyPoints.toLocaleString()} <span className="text-xs text-amber-600">pts</span></p>
                                        </div>
                                        <div className="rounded-xl border border-black/5 bg-white/70 p-3">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">All time</p>
                                            <p className="mt-1 font-mono text-xl font-black text-ink">{currentUser.allTimePoints.toLocaleString()} <span className="text-xs text-violet-600">pts</span></p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="relative border-t border-black/5 bg-white/45 px-6 py-4 sm:px-7">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex min-w-0 items-center gap-2">
                                        {nextTarget ? <Target className="h-4 w-4 shrink-0 text-violet-600" /> : <Sparkles className="h-4 w-4 shrink-0 text-amber-500" />}
                                        <p className="truncate text-sm font-semibold text-ink">
                                            {nextTarget ? `${pointsToNext.toLocaleString()} pts to reach #${nextTarget.rank}` : "You are holding the top spot"}
                                        </p>
                                    </div>
                                    {nextTarget && <ArrowUpRight className="h-4 w-4 shrink-0 text-violet-600" />}
                                </div>
                                {nextTarget && <div className="mt-3 h-2 overflow-hidden rounded-full bg-violet-100"><motion.div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-amber-400" initial={{ width: 0 }} animate={{ width: `${progressToNext}%` }} transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }} /></div>}
                            </div>
                        </PanelBody>
                    </Panel>
                </motion.div>
            )}

            <Panel>
                <PanelHeader title={data ? `Top 10 · ${data.periodKey}` : "Top 10"} />
                <PanelBody className="p-0">
                    {isLoading ? <div className="space-y-3 p-5">{[1, 2, 3, 4, 5].map((item) => <Skeleton key={item} className="h-14 w-full" />)}</div> : isError ? <p className="p-5 text-sm text-red-600">Leaderboard is temporarily unavailable.</p> : !topTen.length ? <div className="p-8 text-center"><Trophy className="mx-auto h-8 w-8 text-muted" /><p className="mt-3 font-semibold text-ink">No rankings yet</p><p className="mt-1 text-sm text-body">The current leaderboard will appear after points are recorded.</p></div> : <div className="divide-y divide-border">{topTen.map((entry, index) => <motion.div key={`${entry.rank}-${entry.displayName}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.045, duration: 0.3 }}><LeaderboardRow entry={entry} isCurrentUser={entry.rank === currentUser?.rank} /></motion.div>)}</div>}
                </PanelBody>
            </Panel>
        </div>
    );
}

function maskName(name: string) {
    const firstLetter = name.trim().charAt(0).toUpperCase() || "N";
    return `${firstLetter}${"*".repeat(Math.max(3, name.trim().length - 1))}`;
}

function LeaderboardRow({ entry, isCurrentUser = false }: { entry: { rank: number; displayName: string; monthlyPoints: number; allTimePoints: number }; isCurrentUser?: boolean }) {
    const displayName = isCurrentUser ? entry.displayName : maskName(entry.displayName);
    return <div className={`flex items-center gap-4 px-5 py-4 transition-colors ${isCurrentUser ? "bg-amber-50 shadow-[inset_4px_0_0_#f59e0b,0_0_18px_rgba(245,158,11,0.16)]" : "hover:bg-violet-50/50"}`}><span className="w-8 text-center font-mono text-sm font-bold text-muted">{entry.rank}</span><div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${isCurrentUser ? "bg-amber-200 text-amber-800" : "bg-violet-100 text-violet-700"}`}>{entry.displayName.slice(0, 1).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="font-semibold text-ink">{displayName}{isCurrentUser ? " (You)" : ""}</p><p className="text-xs text-muted">{entry.allTimePoints.toLocaleString()} all-time points</p></div><p className="font-mono text-sm font-bold text-amber-600">{entry.monthlyPoints.toLocaleString()} pts</p></div>;
}
