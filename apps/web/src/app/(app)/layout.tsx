import { AppShell } from "@/components/layout/app-shell";

/**
 * Authenticated app route group layout.
 *
 * Every route inside (app)/ — overview, wallet, kyc, etc. — gets the full
 * AppShell (sidebar, top bar, bottom nav). Auth routes in (auth)/ are
 * intentionally outside this group and therefore render without the shell.
 */
export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AppShell notificationCount={3}>{children}</AppShell>;
}

