"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { apiClient, hasSession } from "@/lib/api-client";
import { Skeleton } from "@/components/shared/skeletons";
import type { ApiResponse } from "@/lib/types/api";

type HomeBannerTheme = "violet" | "green" | "blue" | "amber" | "rose" | "dark";

interface HomeBannerDto {
    id: string;
    layout: "card" | "image";
    title: string | null;
    subtitle: string | null;
    buttonLabel: string | null;
    targetUrl: string | null;
    theme: HomeBannerTheme;
    imageUrl: string | null;
}

/** [from, to, button text]. The same gradients the mobile app and the admin preview draw. */
const THEMES: Record<HomeBannerTheme, [string, string, string]> = {
    violet: ["#4C1D95", "#7C3AED", "#4C1D95"],
    green: ["#064E3B", "#10B981", "#064E3B"],
    blue: ["#1E3A8A", "#3B82F6", "#1E3A8A"],
    amber: ["#92400E", "#F59E0B", "#92400E"],
    rose: ["#9F1239", "#F43F5E", "#9F1239"],
    dark: ["#14092E", "#3B2470", "#14092E"],
};

const CARD_HEIGHT = 128;
const OWN_HOSTS = new Set(["nepay.com.ng", "www.nepay.com.ng"]);

function useHomeBanners() {
    return useQuery<HomeBannerDto[]>({
        queryKey: ["home-banners"],
        enabled: hasSession(),
        // Live updates arrive over the notices socket; this is the safety net behind it.
        staleTime: 0,
        refetchInterval: 60_000,
        refetchOnWindowFocus: true,
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<HomeBannerDto[]>>("/home-banners");
            return res.data.data ?? [];
        },
    });
}

/**
 * The scrolling strip of banners on the home page. Staff manage them in the admin panel (Home Banners);
 * this draws whatever is live and nothing - not even a gap - when there are none. Cards are built from
 * words and a colour; image banners are marketing's own graphic, shown whole.
 */
export function HomeBanners() {
    const router = useRouter();
    const { data: banners, isLoading } = useHomeBanners();

    // First load: banner-shaped placeholders, so the page doesn't jump when the strip arrives.
    if (isLoading && !banners) {
        return (
            <div className="-mx-1 flex gap-3 overflow-hidden px-1 pb-2" aria-hidden="true">
                {[0, 1].map((i) => (
                    <div
                        key={i}
                        className="flex w-[300px] flex-none items-center gap-3 rounded-[20px] bg-violet-50 py-3.5 pl-[18px] pr-3 sm:w-[340px]"
                        style={{ minHeight: CARD_HEIGHT }}
                    >
                        <div className="flex flex-1 flex-col gap-2">
                            <Skeleton className="h-4 w-[70%]" />
                            <Skeleton className="h-3 w-[92%]" />
                            <Skeleton className="h-3 w-[58%]" />
                            <Skeleton className="mt-1 h-7 w-[76px] rounded-full" />
                        </div>
                        <Skeleton className="h-[72px] w-[72px] rounded-2xl" />
                    </div>
                ))}
            </div>
        );
    }

    if (!banners || banners.length === 0) return null;

    const go = (url: string | null) => {
        if (!url) return;
        // A bare path stays on this site.
        if (url.startsWith("/")) {
            router.push(url);
            return;
        }
        try {
            const parsed = new URL(url);
            if (OWN_HOSTS.has(parsed.hostname)) {
                router.push(parsed.pathname + parsed.search);
                return;
            }
        } catch {
            // not a full URL - fall through and let the browser try
        }
        window.open(url, "_blank", "noopener,noreferrer");
    };

    return (
        <div
            className="-mx-1 flex snap-x snap-mandatory items-stretch gap-3 overflow-x-auto px-1 pb-2 no-scrollbar"
            aria-label="Offers and announcements"
        >
            {banners.map((banner) => {
                const tappable = !!banner.targetUrl;

                if (banner.layout === "image") {
                    return banner.imageUrl ? (
                        <button
                            key={banner.id}
                            type="button"
                            disabled={!tappable}
                            onClick={() => go(banner.targetUrl)}
                            className="flex-none snap-start overflow-hidden rounded-[20px]"
                            style={{ maxWidth: "88%", cursor: tappable ? "pointer" : "default" }}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary URL, shown whole */}
                            <img src={banner.imageUrl} alt="" style={{ display: "block", height: CARD_HEIGHT, width: "auto", maxWidth: "100%" }} />
                        </button>
                    ) : null;
                }

                const [from, to, buttonText] = THEMES[banner.theme] ?? THEMES.violet;

                return (
                    <button
                        key={banner.id}
                        type="button"
                        disabled={!tappable}
                        onClick={() => go(banner.targetUrl)}
                        className="flex w-[300px] flex-none snap-start items-center gap-2 rounded-[20px] py-3.5 pl-[18px] pr-3 text-left text-white sm:w-[340px]"
                        style={{
                            // At least 128 tall; grows for longer text instead of pushing it outside the card.
                            minHeight: CARD_HEIGHT,
                            background: `linear-gradient(135deg, ${from}, ${to})`,
                            cursor: tappable ? "pointer" : "default",
                        }}
                    >
                        <span className="flex min-w-0 flex-1 flex-col gap-[5px] break-words">
                            <span className="line-clamp-2 text-base font-extrabold leading-5 tracking-tight">{banner.title}</span>
                            {banner.subtitle && <span className="line-clamp-2 text-[12.5px] font-medium leading-[17px] text-white/85">{banner.subtitle}</span>}
                            {banner.buttonLabel && (
                                <span
                                    className="mt-1 self-start rounded-full bg-white/95 px-[18px] py-1.5 text-[13px] font-bold"
                                    style={{ color: buttonText }}
                                >
                                    {banner.buttonLabel}
                                </span>
                            )}
                        </span>
                        {banner.imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element -- Cloudinary URL
                            <img src={banner.imageUrl} alt="" className="ml-1.5 w-[84px] flex-none object-contain" style={{ height: CARD_HEIGHT - 28 }} />
                        )}
                    </button>
                );
            })}
        </div>
    );
}
