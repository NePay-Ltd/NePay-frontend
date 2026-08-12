import * as React from "react";

import { Sidebar, MobileSidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { CommandPalette } from "@/components/layout/command-palette";

export interface AppShellProps {
    children: React.ReactNode;
}

export function AppShell({ children }: { children: React.ReactNode }) {
    return (
        <React.Fragment>
            <Sidebar />
            <MobileSidebar />

            <div className="flex min-h-screen flex-col lg:pl-64">
                <TopBar />
                {/* 
                  Mobile: px-4 horizontal padding, generous bottom padding to clear the floating nav + safe area, pt-5 top breathing room.
                  Desktop: px-8 generous padding, pb-8 normal.
                */}
                <main 
                    className="flex-1 px-4 pt-5 lg:px-8 lg:pb-8 lg:pt-8"
                    style={{ paddingBottom: "calc(7rem + env(safe-area-inset-bottom, 0px))" }}
                >
                    <div className="mx-auto max-w-7xl">{children}</div>
                </main>
            </div>

            <BottomNav />
            <CommandPalette />
        </React.Fragment>
    );
}
