/**
 * Mock API endpoints for Gift Cards.
 */

import { ApiError } from "./api";

function randomDelay(minMs = 400, maxMs = 1200): Promise<void> {
    return new Promise((resolve) =>
        setTimeout(resolve, Math.floor(Math.random() * (maxMs - minMs) + minMs)),
    );
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GiftCardEarnings {
    totalNgn: number;
    cardsSold: number;
}

export type GiftCardRates = Record<string, number>;

export type GiftCardStatus = "submitted" | "verifying" | "paid" | "rejected";

export interface GiftCardSubmissionResponse {
    id: string;
    brand: string;
    faceValueUsd: number;
    payoutNgn: number;
    status: GiftCardStatus;
    failureReason?: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_EARNINGS: GiftCardEarnings = {
    totalNgn: 154000,
    cardsSold: 4,
};

const MOCK_RATES: GiftCardRates = {
    amazon: 1100,
    itunes: 1050,
    "google-play": 900,
    steam: 1150,
};

const activeSubmissions = new Map<string, GiftCardSubmissionResponse>();

// ─── Endpoints ────────────────────────────────────────────────────────────────

export async function mockGetGiftCardEarnings(period: "month" | "year" | "all" = "month"): Promise<GiftCardEarnings> {
    await randomDelay(300, 600);
    return MOCK_EARNINGS;
}

export async function mockGetGiftCardRates(): Promise<GiftCardRates> {
    await randomDelay(200, 500);
    return MOCK_RATES;
}

/**
 * Simulates a multipart/form-data upload. 
 * Real backend would accept the file stream directly.
 */
export async function mockSubmitGiftCard(formData: FormData): Promise<{ id: string }> {
    await randomDelay(800, 1500); // Upload takes time

    const brand = formData.get("brand") as string;
    const faceValueUsd = Number(formData.get("faceValueUsd"));
    const cardCode = formData.get("cardCode"); // text
    const file = formData.get("file"); // blob

    if (!brand || faceValueUsd <= 0) {
        throw new ApiError({ status: 400, code: "BAD_REQUEST", message: "Invalid brand or face value" });
    }

    if (!cardCode && !file) {
        throw new ApiError({ status: 400, code: "BAD_REQUEST", message: "You must provide either a code or upload a receipt/card image." });
    }

    const rate = MOCK_RATES[brand] || 900;
    const payoutNgn = faceValueUsd * rate;

    const id = `gc_${Math.random().toString(36).substring(2, 9)}`;

    // Initial state
    activeSubmissions.set(id, {
        id,
        brand,
        faceValueUsd,
        payoutNgn,
        status: "submitted",
    });

    // Simulate state machine transitions (Submitted -> Verifying -> Paid/Rejected)
    setTimeout(() => {
        const sub = activeSubmissions.get(id);
        if (sub && sub.status === "submitted") {
            activeSubmissions.set(id, { ...sub, status: "verifying" });

            // Next transition
            setTimeout(() => {
                const updatedSub = activeSubmissions.get(id);
                if (updatedSub) {
                    if (Math.random() > 0.85) {
                        activeSubmissions.set(id, { ...updatedSub, status: "rejected", failureReason: "The card code was already redeemed." });
                    } else {
                        activeSubmissions.set(id, { ...updatedSub, status: "paid" });
                    }
                }
            }, 5000);
        }
    }, 3000);

    return { id };
}

export async function mockGetGiftCardSubmissionStatus(id: string): Promise<GiftCardSubmissionResponse> {
    await randomDelay(200, 400); // Polling latency
    const sub = activeSubmissions.get(id);
    if (!sub) {
        throw new ApiError({ status: 404, code: "NOT_FOUND", message: "Submission not found" });
    }
    return sub;
}
