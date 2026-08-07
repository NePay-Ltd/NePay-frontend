/**
 * Mock API endpoints for the Crypto section.
 *
 * Swap these out for actual API calls during integration.
 */

import { ApiError } from "./api";

function randomDelay(minMs = 600, maxMs = 1400): Promise<void> {
    return new Promise((resolve) =>
        setTimeout(resolve, Math.floor(Math.random() * (maxMs - minMs) + minMs)),
    );
}

export interface DepositAddressPayload {
    coin: string;
    network: string;
}

export interface DepositAddressResponse {
    address: string;
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

/** POST /crypto/deposit-address */
export async function mockGenerateDepositAddress(
    payload: DepositAddressPayload,
): Promise<DepositAddressResponse> {
    await randomDelay(800, 1500);

    // Simulate occasional random failure (1 in 10 chance) to test error handling
    if (Math.random() > 0.9) {
        throw new ApiError({
            status: 500,
            code: "ADDRESS_GENERATION_FAILED",
            message: "Failed to generate deposit address. Please try again.",
        });
    }

    // Generate a deterministic but realistic-looking address based on network
    let address = "";
    const isErc20 = payload.network.includes("ERC20") || payload.network.includes("Polygon");
    const isTrc20 = payload.network.includes("TRC20");
    
    if (isErc20) {
        // Ethereum style address: 0x + 40 hex chars
        address = "0x" + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('');
    } else if (isTrc20) {
        // Tron style address: T + base58
        address = "T" + Array.from({length: 33}, () => {
            const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
            return chars.charAt(Math.floor(Math.random() * chars.length));
        }).join('');
    } else {
        // Generic Bitcoin/Other
        address = "bc1q" + Array.from({length: 38}, () => Math.floor(Math.random()*36).toString(36)).join('');
    }

    return { address };
}
