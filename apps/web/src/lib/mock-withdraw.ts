/**
 * Mock API endpoints for Withdrawals and Bank Accounts.
 */

import { ApiError } from "./api";

function randomDelay(minMs = 400, maxMs = 1200): Promise<void> {
    return new Promise((resolve) =>
        setTimeout(resolve, Math.floor(Math.random() * (maxMs - minMs) + minMs)),
    );
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Bank {
    code: string;
    name: string;
    iconUrl: string;
}

export interface SavedBankAccount {
    id: string;
    bankCode: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
    iconUrl: string;
}

export interface WithdrawalRequest {
    bankAccountId?: string;
    accountNumber?: string;
    bankCode?: string;
    amountNgn: number;
}

export type WithdrawalStatus = "pending" | "processing" | "success" | "failed";

export interface WithdrawalResponse {
    id: string;
    status: WithdrawalStatus;
    amountNgn: number;
    fee: number;
    failureReason?: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_BANKS: Bank[] = [
    { code: "044", name: "Access Bank", iconUrl: "https://logo.clearbit.com/accessbankplc.com" },
    { code: "011", name: "First Bank of Nigeria", iconUrl: "https://logo.clearbit.com/firstbanknigeria.com" },
    { code: "058", name: "Guaranty Trust Bank", iconUrl: "https://logo.clearbit.com/gtbank.com" },
    { code: "033", name: "United Bank for Africa", iconUrl: "https://logo.clearbit.com/ubagroup.com" },
    { code: "057", name: "Zenith Bank", iconUrl: "https://logo.clearbit.com/zenithbank.com" },
    { code: "032", name: "Union Bank", iconUrl: "https://logo.clearbit.com/unionbankng.com" },
];

let mockSavedAccounts: SavedBankAccount[] = [
    {
        id: "acc_1",
        bankCode: "058",
        bankName: "Guaranty Trust Bank",
        accountNumber: "0123456789",
        accountName: "Dubem Egbo",
        iconUrl: "https://logo.clearbit.com/gtbank.com",
    },
];

// In-memory store of active withdrawals for polling simulation
const activeWithdrawals = new Map<string, WithdrawalResponse>();

// ─── Endpoints ────────────────────────────────────────────────────────────────

export async function mockGetBankList(): Promise<Bank[]> {
    await randomDelay(300, 600);
    return MOCK_BANKS;
}

export async function mockGetSavedBankAccounts(): Promise<SavedBankAccount[]> {
    await randomDelay(400, 800);
    return mockSavedAccounts;
}

export async function mockResolveBankAccount(
    accountNumber: string,
    bankCode: string,
): Promise<{ accountName: string }> {
    await randomDelay(1000, 2000); // Resolving usually takes a moment

    if (accountNumber.length !== 10) {
        throw new ApiError({
            status: 400,
            code: "INVALID_ACCOUNT",
            message: "Account number must be 10 digits.",
        });
    }

    // Simulate NUBAN lookup (mock success for any 10-digit number)
    return { accountName: "CHIDI OKAFOR" };
}

export async function mockSaveBankAccount(
    accountNumber: string,
    bankCode: string,
    accountName: string,
): Promise<SavedBankAccount> {
    await randomDelay();
    
    const bank = MOCK_BANKS.find((b) => b.code === bankCode);
    if (!bank) throw new Error("Invalid bank code");

    const newAccount: SavedBankAccount = {
        id: `acc_${Math.random().toString(36).substring(2, 9)}`,
        bankCode,
        bankName: bank.name,
        accountNumber,
        accountName,
        iconUrl: bank.iconUrl,
    };

    mockSavedAccounts = [...mockSavedAccounts, newAccount];
    return newAccount;
}

export async function mockInitiateWithdrawal(payload: WithdrawalRequest): Promise<{ id: string }> {
    await randomDelay(600, 1000);

    const id = `wd_${Math.random().toString(36).substring(2, 9)}`;
    
    // Simulate background processing queue
    activeWithdrawals.set(id, {
        id,
        status: "processing",
        amountNgn: payload.amountNgn,
        fee: 50,
    });

    // Automatically transition the status after a few seconds to simulate backend processing
    setTimeout(() => {
        const w = activeWithdrawals.get(id);
        if (w) {
            // Simulate random failure (10% chance) for demo purposes
            if (Math.random() > 0.9) {
                activeWithdrawals.set(id, { ...w, status: "failed", failureReason: "Network timeout with destination bank." });
            } else {
                activeWithdrawals.set(id, { ...w, status: "success" });
            }
        }
    }, 4000);

    return { id };
}

export async function mockGetWithdrawalStatus(id: string): Promise<WithdrawalResponse> {
    await randomDelay(200, 500); // Polling latency
    const w = activeWithdrawals.get(id);
    if (!w) {
        throw new ApiError({ status: 404, code: "NOT_FOUND", message: "Withdrawal not found" });
    }
    return w;
}
