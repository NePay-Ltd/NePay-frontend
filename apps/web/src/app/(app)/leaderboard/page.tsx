"use client";

import * as React from "react";
import { ArrowUpRight, Clock3, Sparkles, Target, Trophy, PartyPopper, Rocket } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Panel, PanelBody, PanelHeader } from "@/components/shared/panel";
import { Skeleton } from "@/components/shared/skeletons";
import { NumberTicker } from "@/components/shared/number-ticker";
import { useCurrentLeaderboard } from "@/lib/queries/leaderboard";

function formatResetCountdown(milliseconds: number) {
    if (milliseconds <= 0) return "Resetting now";
    const totalMinutes = Math.floor(milliseconds / 60000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

export default function LeaderboardPage() {
    const { data, isLoading, isError } = useCurrentLeaderboard();
    const [now, setNow] = React.useState(() => Date.now());

    // Always show top 10 — no pagination. If user is outside top 10 they get
    // a separator row appended to the bottom of the list.
    const TOP_N = 10;
    const topEntries = data?.topTwenty.slice(0, TOP_N) ?? [];

    const currentUser = data?.currentUser;
    const userIsInTopTen = !!currentUser && topEntries.some((entry) => entry.rank === currentUser.rank);

    // Prefer the topTwenty entry for the hero card stats — it's the authoritative figure.
    // currentUser from the API can sometimes return a stale/separate snapshot.
    const heroData = topEntries.find(e => e.rank === currentUser?.rank) ?? currentUser;

    const nextTarget = currentUser && currentUser.rank > 1
        ? data?.topTwenty.find((entry) => entry.rank === (currentUser.rank > 10 ? 10 : currentUser.rank - 1))
        : undefined;
    const pointsToNext = nextTarget ? Math.max(0, nextTarget.monthlyPoints - (heroData?.monthlyPoints ?? 0)) : 0;
    const progressToNext = nextTarget ? Math.min(100, ((heroData?.monthlyPoints ?? 0) / nextTarget.monthlyPoints) * 100) : 100;

    React.useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 30000);
        return () => window.clearInterval(timer);
    }, []);

    const resetCountdown = data ? formatResetCountdown(new Date(data.periodEndsAt).getTime() - now) : null;

    return (
        <div className="mx-auto max-w-3xl space-y-6 pb-12">
            {/* Header — no trophy icon (removed per design) */}
            <div className="animate-in fade-in slide-in-from-bottom-2 py-4 duration-500">
                <h1 className="text-2xl font-bold text-ink">Leaderboard</h1>
                <p className="mt-1 text-sm text-body">Monthly points ranking from your NePay activity.</p>
            </div>

            {/* ── Hero card ────────────────────────────────────────────────── */}
            {currentUser && (
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                >
                    <Panel className="overflow-hidden border-violet-200 dark:border-violet-900/50 shadow-xl">
                        <PanelBody className="relative overflow-hidden p-0 bg-brand-gradient text-white">
                            {/* Grain texture */}
                            <div className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-30 dark:opacity-20 bg-repeat" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
                            <Trophy className="absolute -right-6 -top-6 h-40 w-40 opacity-10 dark:opacity-[0.15] text-white" strokeWidth={0.5} />

                            {/* Top section: rank circle + name/message — stacks on mobile */}
                            <div className="relative flex flex-col sm:flex-row sm:items-center gap-5 p-5 sm:p-7">
                                <motion.div
                                    className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-white/20 shadow-lg backdrop-blur-md border border-white/30 self-start"
                                    animate={{ scale: [1, 1.025, 1] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                >
                                    <div className="absolute inset-2 rounded-full border-[3px] border-white/60 border-dashed opacity-50" />
                                    <div className="text-center mt-1">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/80 drop-shadow-sm">Rank</p>
                                        <p className="font-mono text-3xl sm:text-4xl font-black text-white drop-shadow-sm">#{currentUser.rank}</p>
                                    </div>
                                </motion.div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">Your leaderboard journey</p>
                                        {userIsInTopTen && <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 border border-amber-300/30 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-amber-100"><PartyPopper className="h-3 w-3 text-amber-300" /> Top 10</span>}
                                    </div>
                                    <h2 className="mt-2 text-2xl sm:text-3xl font-black text-white drop-shadow-sm">{currentUser.displayName}</h2>
                                    <p className="mt-1.5 text-sm font-medium leading-relaxed text-white/90">
                                        {userIsInTopTen
                                            ? <span className="inline-flex items-center gap-1.5">Congratulations, you are on the leaderboard! Keep it up to win amazing prizes. <Sparkles className="h-4 w-4 text-amber-300" /></span>
                                            : <span className="inline-flex items-center gap-1.5">Keep earning points to move higher and win amazing prizes. <Rocket className="h-4 w-4 text-violet-200" /></span>}
                                    </p>
                                </div>
                            </div>

                            {/* Full-width stat boxes — each 50% of card width */}
                            <div className="relative grid grid-cols-2 gap-2 sm:gap-3 px-4 pb-5 sm:px-7 sm:pb-6">
                                <div className="rounded-xl border border-white/15 bg-black/20 backdrop-blur-md p-3 sm:p-3.5 shadow-sm overflow-hidden">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">This month</p>
                                    <p className="mt-1 sm:mt-1.5 font-mono text-[17px] sm:text-2xl font-black text-white whitespace-nowrap">
                                        <NumberTicker value={heroData?.monthlyPoints ?? 0} suffix=" pts" />
                                    </p>
                                </div>
                                <div className="rounded-xl border border-white/15 bg-black/20 backdrop-blur-md p-3 sm:p-3.5 shadow-sm overflow-hidden">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">All time</p>
                                    <p className="mt-1 sm:mt-1.5 font-mono text-[17px] sm:text-2xl font-black text-white whitespace-nowrap">
                                        <NumberTicker value={heroData?.allTimePoints ?? 0} delay={0.2} suffix=" pts" />
                                    </p>
                                </div>
                            </div>

                            {/* Footer: countdown + target */}
                            <div className="relative border-t border-white/15 bg-black/20 px-5 py-4 sm:px-7 backdrop-blur-md">
                                <div className="mb-4 inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 text-[13px] font-bold text-white border border-white/20 shadow-sm">
                                    <Clock3 className="h-4 w-4 shrink-0 opacity-80" />
                                    <span>Month resets in {resetCountdown}</span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex min-w-0 items-center gap-2.5">
                                        {nextTarget ? <Target className="h-5 w-5 shrink-0 text-violet-300" /> : <Trophy className="h-5 w-5 shrink-0 text-amber-400" />}
                                        <p className="truncate text-[15px] sm:text-base font-bold text-white">
                                            {nextTarget ? <><span className="text-violet-200">{pointsToNext.toLocaleString()} pts</span> to reach #{nextTarget.rank}</> : "You are holding the top spot!"}
                                        </p>
                                    </div>
                                    {nextTarget && <ArrowUpRight className="h-5 w-5 shrink-0 text-violet-300" />}
                                </div>
                                {nextTarget && <div className="mt-3.5 h-2 overflow-hidden rounded-full bg-black/30 shadow-inner"><motion.div className="h-full rounded-full bg-gradient-to-r from-violet-300 to-amber-300" initial={{ width: 0 }} animate={{ width: `${progressToNext}%` }} transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }} /></div>}
                            </div>
                        </PanelBody>
                    </Panel>
                </motion.div>
            )}

            {/* ── Top 10 list ─────────────────────────────────────────────── */}
            <Panel>
                <PanelHeader title={data ? `Top 10 · ${data.periodKey}` : "Top 10"} />
                <PanelBody className="p-0">
                    {isLoading ? (
                        <div className="space-y-3 p-5">{[1, 2, 3, 4, 5].map((item) => <Skeleton key={item} className="h-14 w-full" />)}</div>
                    ) : isError ? (
                        <p className="p-5 text-sm text-red-600">Leaderboard is temporarily unavailable.</p>
                    ) : !topEntries.length ? (
                        <div className="p-8 text-center">
                            <Trophy className="mx-auto h-8 w-8 text-muted" />
                            <p className="mt-3 font-semibold text-ink">No rankings yet</p>
                            <p className="mt-1 text-sm text-body">The current leaderboard will appear after points are recorded.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {/* Podium (top 3) */}
                            {topEntries.length >= 3 && <LeaderboardPodium entries={topEntries.slice(0, 3)} currentUserRank={currentUser?.rank} />}

                            {/* Ranks 4–10 flat list */}
                            <div className="divide-y divide-border">
                                {topEntries.slice(3).map((entry, index) => (
                                    <motion.div key={`${entry.rank}-${entry.displayName}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.045, duration: 0.3 }}>
                                        <LeaderboardRow entry={entry} isCurrentUser={entry.rank === currentUser?.rank} />
                                    </motion.div>
                                ))}
                            </div>

                            {/* If user is outside top 10, show separator + their row */}
                            {currentUser && !userIsInTopTen && !isLoading && !isError && (
                                <>
                                    <div className="flex items-center gap-3 px-5 py-3">
                                        <div className="flex-1 h-px bg-border" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Your rank</span>
                                        <div className="flex-1 h-px bg-border" />
                                    </div>
                                    <LeaderboardRow entry={currentUser} isCurrentUser={true} />
                                </>
                            )}
                        </div>
                    )}
                </PanelBody>
            </Panel>
        </div>
    );
}

const NEUTRAL_AVATAR = "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400";

function getUserColor() {
    return NEUTRAL_AVATAR;
}

function maskName(name: string) {
    const firstLetter = name.trim().charAt(0).toUpperCase() || "N";
    return `${firstLetter}${"*".repeat(Math.max(3, name.trim().length - 1))}`;
}

function LeaderboardPodium({ entries, currentUserRank }: { entries: { rank: number; displayName: string; monthlyPoints: number }[]; currentUserRank?: number }) {
    if (!entries || entries.length === 0) return null;

    const rank1 = entries.find(e => e.rank === 1);
    const rank2 = entries.find(e => e.rank === 2);
    const rank3 = entries.find(e => e.rank === 3);
    const podiumOrder = [rank2, rank1, rank3];

    return (
        <div className="relative pt-10 pb-12 px-4 sm:px-8 border-b border-border bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-900/20 dark:to-transparent overflow-hidden">
            <div className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-30 dark:opacity-20 bg-repeat" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
            <div className="flex items-end justify-center gap-2 sm:gap-8 relative">
                {podiumOrder.map((entry, idx) => {
                    if (!entry) return <div key={`empty-${idx}`} className="w-[90px] sm:w-[130px]" />;
                    const isCenter = entry.rank === 1;
                    const isMe = entry.rank === currentUserRank;

                    const ringColor = entry.rank === 1
                        ? "ring-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                        : entry.rank === 2
                        ? "ring-slate-300 dark:ring-slate-400 bg-slate-50 dark:bg-slate-900/20 text-slate-500 dark:text-slate-300"
                        : "ring-orange-500 dark:ring-orange-600 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-500";
                    const badgeColor = entry.rank === 1
                        ? "bg-amber-400 text-amber-950"
                        : entry.rank === 2
                        ? "bg-slate-300 dark:bg-slate-400 text-slate-900"
                        : "bg-orange-500 dark:bg-orange-600 text-white";

                    return (
                        <div key={entry.rank} className={`flex flex-col items-center ${isCenter ? "z-10" : "z-0 opacity-95"} w-[90px] sm:w-[130px]`}>
                            <div className="relative mb-3.5 sm:mb-4">
                                <div className={`flex items-center justify-center rounded-full font-bold shadow-lg ring-[3px] sm:ring-4 ring-offset-4 ring-offset-white dark:ring-offset-gray-950 ${ringColor} ${isCenter ? "h-20 w-20 sm:h-24 sm:w-24 text-2xl sm:text-3xl" : "h-16 w-16 sm:h-[72px] sm:w-[72px] text-xl sm:text-2xl"}`}>
                                    {entry.displayName.slice(0, 1).toUpperCase()}
                                </div>
                                <div className={`absolute -bottom-2 sm:-bottom-3 left-1/2 -translate-x-1/2 flex items-center justify-center rounded-full border-[3px] border-white dark:border-gray-950 shadow-sm ${badgeColor} ${isCenter ? "h-7 w-7 sm:h-8 sm:w-8" : "h-6 w-6 sm:h-7 sm:w-7"}`}>
                                    <span className={`font-black font-mono ${isCenter ? "text-xs sm:text-sm" : "text-[10px] sm:text-xs"}`}>{entry.rank}</span>
                                </div>
                            </div>
                            <div className={`text-center flex flex-col items-center w-full ${isCenter ? "mt-2" : "mt-1"}`}>
                                {/* Never mask own name on the podium */}
                                <p className={`truncate w-full font-bold text-ink ${isCenter ? "text-[13px] sm:text-[17px]" : "text-[12px] sm:text-[15px]"}`}>
                                    {isMe ? entry.displayName : maskName(entry.displayName)}
                                </p>
                                <p className={`font-mono font-black ${entry.rank === 1 ? "text-amber-600 dark:text-amber-400 text-sm sm:text-base mt-1" : entry.rank === 2 ? "text-slate-500 dark:text-slate-400 text-[12px] sm:text-[15px] mt-0.5" : "text-orange-600 dark:text-orange-500 text-[12px] sm:text-[15px] mt-0.5"}`}>
                                    {entry.monthlyPoints.toLocaleString()} <span className="text-[9px] sm:text-[10px] font-bold opacity-80 uppercase tracking-widest">pts</span>
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function LeaderboardRow({ entry, isCurrentUser = false, forcePadded = true }: { entry: { rank: number; displayName: string; monthlyPoints: number; allTimePoints: number }; isCurrentUser?: boolean; forcePadded?: boolean }) {
    const displayName = isCurrentUser ? entry.displayName : maskName(entry.displayName);
    const avatarColor = isCurrentUser ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400" : getUserColor();

    let rankElement = <span className="w-5 sm:w-8 shrink-0 text-center font-mono text-[13px] sm:text-sm font-bold text-muted">{entry.rank}</span>;
    if (entry.rank === 1) rankElement = <span className="w-5 sm:w-8 shrink-0 text-center font-mono text-base font-black text-amber-500 drop-shadow-sm">1</span>;
    if (entry.rank === 2) rankElement = <span className="w-5 sm:w-8 shrink-0 text-center font-mono text-base font-black text-slate-400 drop-shadow-sm">2</span>;
    if (entry.rank === 3) rankElement = <span className="w-5 sm:w-8 shrink-0 text-center font-mono text-base font-black text-orange-600 drop-shadow-sm">3</span>;

    return (
        <div className={`flex items-center gap-3 sm:gap-4 ${forcePadded ? "px-3 sm:px-5 py-4" : "py-2"} transition-colors ${isCurrentUser && forcePadded ? "bg-violet-50/70 dark:bg-violet-950/30 shadow-[inset_4px_0_0_#7c3aed,0_0_18px_rgba(124,58,237,0.12)] dark:shadow-[inset_4px_0_0_#7c3aed,0_0_18px_rgba(124,58,237,0.08)]" : !isCurrentUser && forcePadded ? "hover:bg-gray-50/50 dark:hover:bg-gray-900/20" : ""}`}>
            {rankElement}
            <div className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full text-[13px] sm:text-sm font-bold ${avatarColor} ${isCurrentUser ? "ring-2 ring-violet-400 dark:ring-violet-500 ring-offset-2 dark:ring-offset-gray-900" : ""}`}>
                {entry.displayName.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
                <p className="font-bold text-ink text-[14px] sm:text-[15px] truncate">
                    {displayName}{isCurrentUser ? <span className="text-violet-600 dark:text-violet-400 text-xs sm:text-[13px] font-bold ml-1.5">(You)</span> : ""}
                </p>
                <p className="text-[11px] sm:text-xs text-muted font-medium truncate mt-0.5">
                    {entry.allTimePoints.toLocaleString()} all-time
                </p>
            </div>
            <div className="text-right shrink-0 ml-1 sm:ml-2">
                <p className="font-mono text-[14px] sm:text-[15px] font-black text-ink whitespace-nowrap">
                    {entry.monthlyPoints.toLocaleString()} <span className="text-[9px] sm:text-[10px] font-bold text-muted uppercase tracking-widest ml-0.5">pts</span>
                </p>
            </div>
        </div>
    );
}
