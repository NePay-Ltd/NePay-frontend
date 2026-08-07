/**
 * Mock API endpoints for Referrals.
 */

function randomDelay(minMs = 300, maxMs = 800): Promise<void> {
    return new Promise((resolve) =>
        setTimeout(resolve, Math.floor(Math.random() * (maxMs - minMs) + minMs)),
    );
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReferralStats {
    totalEarned: number;
    invitesSent: number;
    pending: number;
}

export interface Referral {
    id: string;
    name: string;
    dateJoined: string;
    status: "completed" | "pending";
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

export async function mockGetReferralLink(): Promise<string> {
    await randomDelay(200, 500);
    return "https://nepay.app/invite/dubem123";
}

export async function mockGetReferralStats(): Promise<ReferralStats> {
    await randomDelay();
    return {
        totalEarned: 15000,
        invitesSent: 8,
        pending: 3,
    };
}

export async function mockGetReferralList(): Promise<Referral[]> {
    await randomDelay(500, 900);
    return [
        {
            id: "ref_1",
            name: "John Doe",
            dateJoined: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
            status: "completed",
        },
        {
            id: "ref_2",
            name: "Jane Smith",
            dateJoined: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
            status: "completed",
        },
        {
            id: "ref_3",
            name: "Alice Johnson",
            dateJoined: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
            status: "completed",
        },
        {
            id: "ref_4",
            name: "Bob Brown",
            dateJoined: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
            status: "pending",
        },
        {
            id: "ref_5",
            name: "Charlie Davis",
            dateJoined: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
            status: "pending",
        },
        {
            id: "ref_6",
            name: "Eve White",
            dateJoined: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
            status: "pending",
        },
    ];
}
