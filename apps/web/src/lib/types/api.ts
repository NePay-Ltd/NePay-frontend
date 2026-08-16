export type Currency = "NGN" | "USD" | "EUR" | "GBP";
export type KycTier = "NONE" | "PHONE_VERIFIED" | "FULL_BVN_NIN";
export type LedgerDirection = "CREDIT" | "DEBIT";
export type LedgerEntryType = "DEPOSIT" | "BANK_DEPOSIT" | "WITHDRAWAL" | "ADMIN_ADJUSTMENT" | "UTILITY_PURCHASE" | "GIFT_CARD_SALE" | "FLIGHT_BOOKING" | "FEE" | "CASHBACK" | "REFERRAL_REWARD";
export type CryptoDepositStatus =
    | "waiting"
    | "confirming"
    | "confirmed"
    | "sending"
    | "partially_paid"
    | "finished"
    | "failed"
    | "expired"
    | "refunded";
export type WithdrawalStatus = "PROCESSING" | "COMPLETED" | "FAILED";
export type UtilityCategory = "AIRTIME" | "DATA" | "ELECTRICITY" | "CABLE" | "EDUCATION" | "BETTING";
export type UtilityPurchaseStatus = "COMPLETED" | "PROCESSING" | "FAILED" | "REVERSED";
export type GiftCardOrderStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED";
export type VirtualAccountStatus = "ACTIVE" | "INACTIVE";

// ─── Envelopes ───────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
    success: true;
    data: T;
}

export interface ApiPaginated<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    pages: number;
}

export interface ApiError {
    success: false;
    code: string;
    message: string;
    traceId: string;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface UserResponseDto {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    role: "customer"; // strictly customer for this app
    preferredCurrency: Currency;
    kycTier: KycTier;
    isActive: boolean;
    emailVerified: boolean;
    phoneVerified: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface AuthTokensDto {
    accessToken: string;
    refreshToken: string;
    tokenType: "Bearer";
    expiresIn: number;
    user: UserResponseDto;
}

export interface MfaChallengeResponseDto {
    mfaRequired: true;
    mfaToken: string;
}

export type LoginResponse = AuthTokensDto | MfaChallengeResponseDto;

// ─── Security ────────────────────────────────────────────────────────────────

export interface Enable2faResponseDto {
    qrCodeUri: string;
    secret: string;
}

export interface LoginEventResponseDto {
    id: string;
    device: string | null;
    ipAddress: string | null;
    location: string | null;
    isCurrentSession: boolean;
    createdAt: string;
}

// ─── KYC ─────────────────────────────────────────────────────────────────────

export interface KycStatusDto {
    tier: KycTier;
    bvnVerified: boolean;
    ninVerified: boolean;
}

// ─── Wallet & Ledger ─────────────────────────────────────────────────────────

export interface WalletBalanceDto {
    walletId: string;
    displayCurrency: Currency;
    availableBalance: string;
    pendingBalance: string;
    lastUpdated: string;
}

export interface LedgerEntryDto {
    id: string;
    type: LedgerEntryType;
    direction: LedgerDirection;
    amount: string; // always positive
    currency: Currency;
    description: string | null;
    createdAt: string;
}

export interface VirtualAccountResponseDto {
    id: string;
    accountNumber: string;
    bankName: string;
    accountName: string;
    status: VirtualAccountStatus;
    createdAt: string;
}

// ─── Crypto Deposits (NOWPayments-backed) ────────────────────────────────────

export interface CryptoCurrencyDto {
    code: string; // e.g. "usdttrc20" — the exact value to send back as `asset`
    name: string | null;
    network: string | null;
    iconUrl: string | null;
    requiresExtraId: boolean; // true for memo/tag-based coins (XRP, XLM, ...)
}

export interface CryptoMinAmountDto {
    currency: string;
    minAmount: number;
}

export interface CryptoDepositAddressDto {
    paymentId: string;
    address: string;
    asset: string;
    payMemo: string | null; // only non-null for memo/tag-based coins (XRP, XLM, ...)
    expiresAt: string | null; // ISO timestamp — a NOWPayments session is not permanent
}

export interface CryptoDepositStatusDto {
    paymentId: string;
    status: CryptoDepositStatus;
    payAddress: string;
    payCurrency: string;
    expectedAmount: number;
    actuallyPaid: number | null;
    creditedAmount: number | null;
    creditedCurrency: string | null;
    createdAt: string;
    updatedAt: string;
}

// ─── Withdrawals ─────────────────────────────────────────────────────────────

export interface ResolveAccountResponseDto {
    accountName: string;
    bankCode: string;
    accountNumber: string;
    resolutionToken: string;
}

export interface WithdrawalResponseDto {
    id: string;
    amount: string;
    bankCode: string;
    accountNumber: string;
    accountName: string;
    status: WithdrawalStatus;
    providerReference: string;
    failureReason: string | null;
    completedAt: string | null;
    createdAt: string;
}

// ─── Utilities ───────────────────────────────────────────────────────────────

export interface UtilityPurchaseResponseDto {
    id: string;
    category: UtilityCategory;
    provider: string;
    identifier: string;
    variationCode: string | null;
    amount: string;
    status: UtilityPurchaseStatus;
    providerReference: string | null;
    failureReason: string | null;
    createdAt: string;
}

export interface UtilityVerificationResponseDto {
    verificationToken: string;
    customerName: string | null;
    renewalAmount: string | null;
    expiresAt: string;
}

// ─── Utilities Catalog ───────────────────────────────────────────────────────
// Dynamic catalog: categories -> services (within a category) -> variations
// (plans/bouquets, where relevant). Cached server-side for an hour.

export interface UtilityCategoryDto {
    identifier: string;
    name: string;
}

export interface UtilityServiceDto {
    serviceID: string;
    name: string;
    minimium_amount?: string; // sic — matches VTpass's actual field spelling
    maximum_amount?: string;
    image?: string;
}

export interface UtilityVariationDto {
    variation_code: string;
    name: string;
    variation_amount: string;
}

// ─── Gift Cards ──────────────────────────────────────────────────────────────

export interface GiftCardQuoteResponseDto {
    quoteId: string;
    cardBrand: string;
    faceValueUsd: string;
    quantity: number;
    rate: string;
    payoutAmount: string;
    expiresAt: string;
}

export interface GiftCardOrderResponseDto {
    id: string;
    cardBrand: string;
    faceValueUsd: string;
    quantity: number;
    payoutAmount: string;
    status: GiftCardOrderStatus;
    decidedAt: string | null;
    createdAt: string;
}
