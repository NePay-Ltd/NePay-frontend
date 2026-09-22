"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Lightweight client UI state.
 *
 * Anything server-state (data fetching/caching) belongs to TanStack Query.
 * This store is only for ephemeral UI: which sidebar item is active, whether
 * the mobile sidebar drawer is open, whether the Cmd+K command palette is open.
 */

interface UiState {
    /** Active navigation key — drives sidebar/top-bar active styling. */
    activeNav: string;
    setActiveNav: (key: string) => void;

    /** Mobile sidebar drawer (slide-out). */
    mobileSidebarOpen: boolean;
    setMobileSidebarOpen: (open: boolean) => void;
    toggleMobileSidebar: () => void;

    /** Global command palette (Cmd+K). */
    commandOpen: boolean;
    setCommandOpen: (open: boolean) => void;
    toggleCommand: () => void;

    /** Global balance mask (eye toggle). */
    masked: boolean;
    toggleMasked: () => void;

    /**
     * Feature-level "seen it" flags — one per interactive first-run guide.
     * Distinct from the flags a store like this might otherwise carry
     * one-off: a guide is opt-in reference material a person can deliberately
     * reopen (see PodsIntroGuide's own help button), so this stays a map
     * rather than growing a dedicated boolean field per feature.
     */
    seenGuides: Record<string, boolean>;
    hasSeenGuide: (key: string) => boolean;
    markGuideSeen: (key: string) => void;
}

export const useUiStore = create<UiState>()(
    persist(
        (set, get) => ({
            activeNav: "overview",
            setActiveNav: (key) => set({ activeNav: key }),

            mobileSidebarOpen: false,
            setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
            toggleMobileSidebar: () =>
                set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),

            commandOpen: false,
            setCommandOpen: (open) => set({ commandOpen: open }),
            toggleCommand: () => set((state) => ({ commandOpen: !state.commandOpen })),

            masked: true,
            toggleMasked: () => set((state) => ({ masked: !state.masked })),

            seenGuides: {},
            hasSeenGuide: (key) => !!get().seenGuides[key],
            markGuideSeen: (key) =>
                set((state) => ({ seenGuides: { ...state.seenGuides, [key]: true } })),
        }),
        {
            name: "nepay-ui-storage",
            partialize: (state) => ({ masked: state.masked, seenGuides: state.seenGuides }),
        }
    )
);