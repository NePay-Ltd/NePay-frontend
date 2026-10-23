import React from "react";
import { PLAY_STORE_URL } from "./links";
import { cn } from "@/lib/cn";

/** Multi-colour Google Play triangle. */
function PlayMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden="true">
      <polygon fill="#00D7FE" points="60,20 280,256 60,492" />
      <polygon fill="#00F076" points="60,20 340,181 280,256" />
      <polygon fill="#FF3A44" points="60,492 340,331 280,256" />
      <polygon fill="#FFD500" points="340,181 470,256 340,331 280,256" />
    </svg>
  );
}

/** "Get it on Google Play" badge linking straight to the NePay listing. */
export function PlayStoreBadge({ className }: { className?: string }) {
  return (
    <a
      href={PLAY_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Get NePay on Google Play"
      className={cn(
        "inline-flex items-center justify-center gap-3 rounded-2xl border border-black/10 bg-[#f4f4f5] px-5 py-2.5 text-left text-[#0a0a0a] shadow-sm transition-opacity hover:opacity-90",
        className,
      )}
    >
      <PlayMark className="h-7 w-7 shrink-0" />
      <span className="flex flex-col leading-none">
        <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#52525b]">Get it on</span>
        <span className="mt-1 text-lg font-bold tracking-tight">Google Play</span>
      </span>
    </a>
  );
}
