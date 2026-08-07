/**
 * Mock API endpoints for the Virtual Card Waitlist.
 */

function randomDelay(minMs = 300, maxMs = 800): Promise<void> {
    return new Promise((resolve) =>
        setTimeout(resolve, Math.floor(Math.random() * (maxMs - minMs) + minMs)),
    );
}

// Global state for waitlist mock
let IS_ON_WAITLIST = false;

export async function mockGetWaitlistStatus(): Promise<boolean> {
    await randomDelay();
    return IS_ON_WAITLIST;
}

export async function mockJoinWaitlist(): Promise<void> {
    await randomDelay(600, 1000);
    IS_ON_WAITLIST = true;
}

