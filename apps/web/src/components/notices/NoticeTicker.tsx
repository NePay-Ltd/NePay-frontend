"use client";

import { useEffect, useRef, useState } from "react";
import { Megaphone } from "lucide-react";

import { cn } from "@/lib/cn";
import { useAuth } from "@/lib/auth-context";
import { useActiveNotices } from "@/lib/queries/notices";
import type { NoticeDto, NoticeSeverity } from "@/lib/queries/notices";

const SEVERITY_DOT: Record<NoticeSeverity, string> = {
    info: "bg-violet-500",
    warning: "bg-amber-500",
    critical: "bg-red-500",
};

/**
 * Roughly constant reading speed regardless of text length — mirrors the
 * mobile app's ticker. Without this, `animate-marquee`'s fixed 15s CSS
 * keyframe duration (tailwind.config.ts) forces every notice through the
 * same distance-per-time regardless of length: short text crawls, long
 * text (e.g. 1000 characters) flies past unreadably fast.
 */
const MS_PER_PIXEL = 30;
const MIN_DURATION_MS = 8000;

function TickerItem({ notice }: { notice: NoticeDto }) {
    return (
        <span className="inline-flex items-center gap-2 px-6">
            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", SEVERITY_DOT[notice.severity])} aria-hidden />
            <span className="text-sm font-medium text-ink">{notice.body}</span>
        </span>
    );
}

/**
 * A persistent, ambient ticker bar — deliberately never suppressed on any
 * route (unlike NoticeModal), since it's passive and easy to ignore rather
 * than interruptive. Renders nothing when there's nothing live, so an empty
 * bar never reserves layout space.
 *
 * The marquee is exactly trust-bar.tsx's technique: `animate-marquee`
 * (already defined in tailwind.config.ts) translates the track by -50%,
 * which only loops seamlessly when the track is exactly double the visible
 * content — hence duplicating the notice list 2x, not trust-bar's own 6x
 * (that extra buffer was for its short logo marks, not needed here).
 */
export function NoticeTicker() {
    const { user, isLoading } = useAuth();
    const { data } = useActiveNotices();
    const notices = data?.ticker ?? [];

    const trackRef = useRef<HTMLDivElement>(null);
    const [durationMs, setDurationMs] = useState(MIN_DURATION_MS);

    useEffect(() => {
        if (!trackRef.current) return;
        // The track holds two copies back-to-back — one copy's width is half the total.
        const oneCopyWidth = trackRef.current.scrollWidth / 2;
        setDurationMs(Math.max(MIN_DURATION_MS, oneCopyWidth * MS_PER_PIXEL));
    }, [notices]);

    if (isLoading || !user || notices.length === 0) return null;

    const track = [...notices, ...notices];

    return (
        <div className="relative flex w-full items-center gap-3 overflow-hidden border-b border-border bg-white px-4 py-2">
            <Megaphone className="h-4 w-4 shrink-0 text-violet-600" aria-hidden />
            <div className="relative flex-1 overflow-hidden">
                <div
                    ref={trackRef}
                    className="flex w-max animate-marquee whitespace-nowrap hover:[animation-play-state:paused]"
                    style={{ animationDuration: `${durationMs}ms` }}
                >
                    {track.map((notice, index) => (
                        <TickerItem key={`${notice.id}-${index}`} notice={notice} />
                    ))}
                </div>
            </div>
        </div>
    );
}
