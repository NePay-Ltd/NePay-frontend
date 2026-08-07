import * as React from "react";

import { Sidebar, MobileSidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { CommandPalette } from "@/components/layout/command-palette";
import { PrototypeBanner } from "@/components/shared/prototype-banner";

export interface AppShellProps {
    children: React.ReactNode;
    notificationCount?: number;
}

export function AppShell({
    children,
    notificationCount = 0,
}: AppShellProps) {
    return (
        <React.Fragment>
            <PrototypeBanner />
            <Sidebar />
            <MobileSidebar />

            <div className="flex min-h-screen flex-col lg:pl-64">
                <TopBar notificationCount={notificationCount} />
                <main className="flex-1 px-4 pb-24 pt-6 lg:px-8 lg:pb-8">
                    <div className="mx-auto max-w-7xl">{children}</div>
                </main>
            </div>

            <BottomNav />
            <CommandPalette />
        </React.Fragment>
    );
}
