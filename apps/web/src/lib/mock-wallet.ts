/**
 * Mock API endpoints for the Wallet section.
 *
 * Swap these out for actual `api.get`/`api.post` calls during integration.
 */

import { ApiError } from "./api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomDelay(minMs = 600, maxMs = 1400): Promise<void> {
    return new Promise((resolve) =>
        setTimeout(resolve, Math.floor(Math.random() * (maxMs - minMs) + minMs)),
    );
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Asset {
    id: string;
    name: string;
    symbol: string;
    icon: string;
    networks: string[];
    holdings: number;
    valueNgn: number;
}

export interface WalletStats {
    depositedThisMonth: number;
    withdrawnThisMonth: number;
    feesPaid: number;
    sparkline30Day: number[];
}

export interface VirtualAccount {
    accountNumber: string;
    bankName: string;
    accountName: string;
    status: "active" | "pending";
}

// ─── In-memory state ──────────────────────────────────────────────────────────

let mockVirtualAccount: VirtualAccount | null = null;

// ─── Endpoints ────────────────────────────────────────────────────────────────

/** GET /wallet/assets */
export async function mockGetAssets(): Promise<Asset[]> {
    await randomDelay(500, 1000);
    return [
        {
            id: "ast_naira",
            name: "Nigerian Naira",
            symbol: "NGN",
            icon: "₦",
            networks: ["Bank Transfer"],
            holdings: 125400.45,
            valueNgn: 125400.45,
        },
        {
            id: "ast_usdt",
            name: "Tether",
            symbol: "USDT",
            icon: "₮",
            networks: ["TRC20", "ERC20"],
            holdings: 124.5,
            valueNgn: 194842.5,
        },
        {
            id: "ast_usdc",
            name: "USD Coin",
            symbol: "USDC",
            icon: "$",
            networks: ["ERC20", "Polygon"],
            holdings: 41.35,
            valueNgn: 64757.05,
        },
    ];
}

/** GET /wallet/stats */
export async function mockGetWalletStats(): Promise<WalletStats> {
    await randomDelay(400, 900);
    return {
        depositedThisMonth: 450000,
        withdrawnThisMonth: 120000,
        feesPaid: 1250,
        // 30 data points for 30-day sparkline
        sparkline30Day: [
            250000, 255000, 248000, 260000, 275000, 270000, 280000,
            275000, 290000, 310000, 305000, 320000, 315000, 330000,
            325000, 340000, 335000, 350000, 345000, 360000, 355000,
            370000, 365000, 380000, 375000, 390000, 385000, 400000,
            395000, 385000,
        ],
    };
}

/** GET /wallet/virtual-account */
export async function mockGetVirtualAccount(): Promise<VirtualAccount | null> {
    await randomDelay(600, 1200);
    return mockVirtualAccount;
}

/** POST /wallet/virtual-account */
export async function mockCreateVirtualAccount(): Promise<VirtualAccount> {
    await randomDelay(1000, 2000);
    if (mockVirtualAccount) {
        throw new ApiError({
            status: 400,
            code: "ACCOUNT_ALREADY_EXISTS",
            message: "You already have an active virtual account.",
        });
    }
    
    mockVirtualAccount = {
        accountNumber: "8472910452",
        bankName: "Wema Bank",
        accountName: "NePay / Adaeze Okonkwo",
        status: "active",
    };
    
    return mockVirtualAccount;
}
