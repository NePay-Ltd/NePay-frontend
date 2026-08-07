/**
 * Mock API endpoints for the Notifications module.
 */

function randomDelay(minMs = 300, maxMs = 800): Promise<void> {
    return new Promise((resolve) =>
        setTimeout(resolve, Math.floor(Math.random() * (maxMs - minMs) + minMs)),
    );
}

export type NotificationType = "deposit" | "kyc" | "withdrawal" | "referral" | "security";

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    body: string;
    timestamp: string;
    read: boolean;
}

export interface PaginatedNotifications {
    items: Notification[];
    nextCursor: string | null;
}

// ─── Generate Dummy Notifications ───────────────────────────────────────────

// Mutable state to allow the mark-all-read mutation to persist in the mock backend
let MOCK_NOTIFICATIONS: Notification[] = Array.from({ length: 47 }).map((_, i) => {
    const rnd = Math.random();
    let type: NotificationType;
    let title = "";
    let body = "";

    if (rnd < 0.2) {
        type = "deposit";
        title = "Deposit received";
        body = "USDT deposit converted and credited to your wallet.";
    } else if (rnd < 0.4) {
        type = "withdrawal";
        title = "Withdrawal successful";
        body = "₦50,000 has been sent to your GTBank account.";
    } else if (rnd < 0.6) {
        type = "kyc";
        title = "KYC Approved";
        body = "Your BVN and NIN have been verified. Tier 2 unlocked!";
    } else if (rnd < 0.8) {
        type = "referral";
        title = "Referral Bonus";
        body = "Your friend John signed up. ₦1,000 added to your balance.";
    } else {
        type = "security";
        title = "New login detected";
        body = "We noticed a new login from macOS (Chrome) in Lagos.";
    }

    const date = new Date();
    // Spread timestamps from "just now" to several days ago
    date.setMinutes(date.getMinutes() - (i * i * 15 + Math.floor(Math.random() * 60)));

    // First 5 are mostly unread, rest are read
    const read = i < 5 ? Math.random() > 0.8 : true;

    return {
        id: `notif_${1000 - i}`,
        type,
        title,
        body,
        timestamp: date.toISOString(),
        read,
    };
});

// ─── API Endpoints ───────────────────────────────────────────────────────────

export async function mockGetNotifications(
    cursor: string | null,
    limit: number = 15
): Promise<PaginatedNotifications> {
    await randomDelay();

    let startIndex = 0;
    if (cursor) {
        const foundIndex = MOCK_NOTIFICATIONS.findIndex(n => n.id === cursor);
        if (foundIndex !== -1) {
            startIndex = foundIndex;
        }
    }

    const endIndex = startIndex + limit;
    const items = MOCK_NOTIFICATIONS.slice(startIndex, endIndex);
    
    const nextCursor = (endIndex < MOCK_NOTIFICATIONS.length && MOCK_NOTIFICATIONS[endIndex]) 
        ? MOCK_NOTIFICATIONS[endIndex]!.id 
        : null;

    return {
        items,
        nextCursor,
    };
}

export async function mockGetUnreadCount(): Promise<number> {
    // Faster delay for polling endpoints
    await randomDelay(100, 300);
    return MOCK_NOTIFICATIONS.filter(n => !n.read).length;
}

export async function mockMarkAllRead(): Promise<void> {
    await randomDelay(400, 800);
    
    // Simulate a random 10% chance of backend failure for testing optimistic UI rollbacks
    if (Math.random() < 0.1) {
        throw new Error("Network error. Could not mark notifications as read.");
    }

    // Mutate the mock state
    MOCK_NOTIFICATIONS = MOCK_NOTIFICATIONS.map(n => ({
        ...n,
        read: true,
    }));
}
