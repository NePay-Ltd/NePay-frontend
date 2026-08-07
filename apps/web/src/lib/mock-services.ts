/**
 * Mock API endpoints for Services (Airtime, Data, Bills).
 */

import { ApiError } from "./api";

function randomDelay(minMs = 400, maxMs = 1200): Promise<void> {
    return new Promise((resolve) =>
        setTimeout(resolve, Math.floor(Math.random() * (maxMs - minMs) + minMs)),
    );
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SavedBiller {
    id: string;
    billerName: string; // e.g., "Ikeja Electric"
    identifier: string; // e.g., "Meter 12345"
    lastPaidAmount: number;
    iconUrl?: string; // Optional icon
    serviceType: "electricity" | "cable-tv" | "airtime" | "data";
}

export interface DataPlan {
    id: string;
    network: string;
    name: string;
    price: number;
    validityDays: number;
}

export type ServiceTransactionStatus = "pending" | "processing" | "success" | "failed";

export interface ServiceTransactionResponse {
    id: string;
    status: ServiceTransactionStatus;
    amountNgn: number;
    fee: number;
    failureReason?: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_SAVED_BILLERS: SavedBiller[] = [
    {
        id: "biller_1",
        billerName: "Ikeja Electric",
        identifier: "Meter •••4521",
        lastPaidAmount: 15000,
        serviceType: "electricity",
    },
    {
        id: "biller_2",
        billerName: "MTN Data",
        identifier: "0803•••5678",
        lastPaidAmount: 2500,
        serviceType: "data",
    },
];

const MOCK_DATA_PLANS: Record<string, DataPlan[]> = {
    MTN: [
        { id: "mtn_1", network: "MTN", name: "1GB (1 Day)", price: 350, validityDays: 1 },
        { id: "mtn_2", network: "MTN", name: "3GB (7 Days)", price: 1500, validityDays: 7 },
        { id: "mtn_3", network: "MTN", name: "10GB (30 Days)", price: 3500, validityDays: 30 },
    ],
    Glo: [
        { id: "glo_1", network: "Glo", name: "1.5GB (1 Day)", price: 350, validityDays: 1 },
        { id: "glo_2", network: "Glo", name: "7GB (7 Days)", price: 1500, validityDays: 7 },
        { id: "glo_3", network: "Glo", name: "18GB (30 Days)", price: 4000, validityDays: 30 },
    ],
    Airtel: [
        { id: "airtel_1", network: "Airtel", name: "1GB (1 Day)", price: 300, validityDays: 1 },
        { id: "airtel_2", network: "Airtel", name: "6GB (7 Days)", price: 1500, validityDays: 7 },
        { id: "airtel_3", network: "Airtel", name: "20GB (30 Days)", price: 5000, validityDays: 30 },
    ],
    "9mobile": [
        { id: "9mob_1", network: "9mobile", name: "1GB (1 Day)", price: 300, validityDays: 1 },
        { id: "9mob_2", network: "9mobile", name: "7GB (7 Days)", price: 1500, validityDays: 7 },
        { id: "9mob_3", network: "9mobile", name: "15GB (30 Days)", price: 4000, validityDays: 30 },
    ],
};

const activeTransactions = new Map<string, ServiceTransactionResponse>();

// ─── Endpoints ────────────────────────────────────────────────────────────────

export async function mockGetSavedBillers(): Promise<SavedBiller[]> {
    await randomDelay(300, 600);
    return MOCK_SAVED_BILLERS;
}

export async function mockGetDataPlans(network: string): Promise<DataPlan[]> {
    await randomDelay(200, 500);
    return MOCK_DATA_PLANS[network] || [];
}

export async function mockVerifyMeter(
    provider: string,
    meterNumber: string
): Promise<{ customerName: string; address: string }> {
    await randomDelay(800, 1500);
    
    if (meterNumber.length < 5) {
        throw new ApiError({
            status: 400,
            code: "INVALID_METER",
            message: "Meter number is invalid.",
        });
    }

    return { 
        customerName: "ADEYEMI O.",
        address: "14 Awolowo Way, Ikeja" 
    };
}

export async function mockVerifySmartcard(
    provider: string,
    smartcardNumber: string
): Promise<{ customerName: string; package: string }> {
    await randomDelay(800, 1500);

    if (smartcardNumber.length < 5) {
        throw new ApiError({
            status: 400,
            code: "INVALID_SMARTCARD",
            message: "Smartcard number is invalid.",
        });
    }

    return { 
        customerName: "CHIDI OKAFOR",
        package: "Premium Bouquet" 
    };
}

function simulateTransaction(amountNgn: number, fee: number = 0): { id: string } {
    const id = `txn_${Math.random().toString(36).substring(2, 9)}`;
    
    activeTransactions.set(id, {
        id,
        status: "processing",
        amountNgn,
        fee,
    });

    // Automatically transition the status after a few seconds
    setTimeout(() => {
        const txn = activeTransactions.get(id);
        if (txn) {
            if (Math.random() > 0.9) {
                activeTransactions.set(id, { ...txn, status: "failed", failureReason: "Upstream provider timeout." });
            } else {
                activeTransactions.set(id, { ...txn, status: "success" });
            }
        }
    }, 4000);

    return { id };
}

export async function mockPayAirtime(payload: { phone: string; amountNgn: number; network: string }): Promise<{ id: string }> {
    await randomDelay(400, 800);
    return simulateTransaction(payload.amountNgn, 0); // 0 fee for airtime
}

export async function mockPayData(payload: { phone: string; planId: string; network: string; amountNgn: number }): Promise<{ id: string }> {
    await randomDelay(400, 800);
    return simulateTransaction(payload.amountNgn, 0); // 0 fee for data
}

export async function mockPayElectricity(payload: { meterNumber: string; provider: string; amountNgn: number }): Promise<{ id: string }> {
    await randomDelay(400, 800);
    return simulateTransaction(payload.amountNgn, 100); // 100 NGN fee for electricity
}

export async function mockPayCableTv(payload: { smartcardNumber: string; provider: string; amountNgn: number }): Promise<{ id: string }> {
    await randomDelay(400, 800);
    return simulateTransaction(payload.amountNgn, 100); // 100 NGN fee for cable
}

export async function mockGetServiceTransactionStatus(id: string): Promise<ServiceTransactionResponse> {
    await randomDelay(200, 500); // Polling latency
    const txn = activeTransactions.get(id);
    if (!txn) {
        throw new ApiError({ status: 404, code: "NOT_FOUND", message: "Transaction not found" });
    }
    return txn;
}
