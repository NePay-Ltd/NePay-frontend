export type Currency = "NGN" | "USD" | "EUR" | "GBP";
export type LedgerDirection = "CREDIT" | "DEBIT";
export type LedgerEntryType = "DEPOSIT" | "BANK_DEPOSIT" | "WITHDRAWAL" | "ADMIN_ADJUSTMENT" | "PROMO_CREDIT" | "GOODWILL_CREDIT" | "ERROR_CORRECTION" | "UTILITY_PURCHASE" | "UTILITY_DISCOUNT" | "GIFT_CARD_SALE" | "FLIGHT_BOOKING" | "FEE" | "CASHBACK" | "REFERRAL_REWARD" | "FCY_CONVERSION_CREDIT";
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

/**
 * Matches the backend's real response shape since the tier-collapse rework:
 * users.kycTier was replaced by a single users.kycVerified boolean (BVN
 * approval alone is sufficient KYC now — NIN verification no longer exists),
 * so there is no tier field on any auth/KYC response anymore.
 */
export interface UserResponseDto {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    phoneNumber: string;
    role: string;
    preferredCurrency: Currency;
    referralCode: string;
    /** True once this account has an APPROVED BVN verification. */
    kycVerified: boolean;
    isActive: boolean;
    emailVerified: boolean;
    emailReceipts: boolean;
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

/** BVN is the only identity check — matches the backend's VerificationType enum. */
export type VerificationType = "BVN";
export type KycRecordStatus = "PENDING" | "APPROVED" | "REJECTED";

/**
 * Response of GET /kyc/status — a single derived boolean, computed fresh from
 * kyc_records on every call (see backend KycService.getStatus). The old
 * { tier, bvnVerified, ninVerified } shape no longer exists.
 */
export interface KycStatusDto {
    verified: boolean;
}

/** Response of POST /kyc/verify-bvn — synchronous APPROVED/REJECTED decision. */
export interface KycRecordDto {
    id: string;
    status: KycRecordStatus;
}

// ─── Wallet & Ledger ─────────────────────────────────────────────────────────

export interface WalletBalanceDto {
    walletId: string;
    displayCurrency: Currency;
    availableBalance: string;
    pendingBalance: string;
    /** availableBalance converted to USD for display, using the admin's real current rate — null when no real rate is available (never a fabricated figure). */
    usdEquivalent: string | null;
    /** The caller's currently preferred DISPLAY currency — purely presentational, never displayCurrency itself, which stays the wallet's real settlement currency. */
    preferredCurrency: Currency;
    /** availableBalance converted into preferredCurrency, live/unlocked — null when no real rate is available (never a fabricated figure). */
    preferredCurrencyEquivalent: string | null;
    lastUpdated: string;
}

export interface LedgerEntryDto {
    id: string;
    type: LedgerEntryType;
    direction: LedgerDirection;
    amount: string; // always positive
    currency: Currency;
    description: string | null;
    rate: string | null;
    assetQuantity: string | null;
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

/** Body of POST /wallet/virtual-account/simulate-deposit — test mode only, no account number (always the caller's own account). */
export interface SimulateDepositDto {
    amount: string;
}

/** Response of GET /config/test-mode. */
export interface TestModeDto {
    testMode: boolean;
}

// ─── Crypto Deposits (NOWPayments-backed) ────────────────────────────────────

export interface CryptoCurrencyDto {
    code: string; // e.g. "usdttrc20" — the exact value to send back as `asset`
    coin: string; // base symbol, e.g. "USDT" — groups this entry with its other enabled networks
    name: string | null;
    network: string | null;
    iconUrl: string | null;
    requiresExtraId: boolean; // true for memo/tag-based coins (XRP, XLM, ...)
    recommended: boolean; // true for exactly one network per coin group — the lowest-fee/fastest one, among curated variants only
    curated: boolean; // true when name/requiresExtraId are real, reviewed metadata rather than a generic fallback (raw ticker). iconUrl is derived for every coin regardless of curated.
}

export interface CryptoPricesDto {
    currency: Currency; // always NGN — the platform's own settlement currency
    /** Keyed by coin symbol (CryptoCurrencyDto.coin), NGN per 1 unit of the coin, as a decimal string. Null (never a fabricated number) for an uncurated coin or a coin with a temporarily-unavailable rate — missing from this map entirely means the same thing. */
    prices: Record<string, string | null>;
    /** The current manual USD→NGN rate (NGN per 1 USD) — divide a price above by this to get a USD display figure. Null when no manual rate is configured. */
    usdNgnRate: number | null;
}

export interface CryptoMinAmountDto {
    currency: string;
    /** The enforced minimum — max(usdOneEquivalent, nowPaymentsMinAmount). A pre-session ESTIMATE only — once a real address exists, prefer CryptoDepositAddressDto.expectedAmount instead, which reflects the actual session the provider accepted (see its own note; can be higher than this figure). */
    minAmount: number;
    /** NOWPayments' own raw minimum for this asset — exposed for transparency only. */
    nowPaymentsMinAmount: number;
    /** $1 USD converted into this asset's units at the current rate. Null if a rate wasn't available when minAmount was computed. */
    usdOneEquivalent: number | null;
    /** Active admin-configured NGN value for $1. */
    usdNgnRate: number | null;
    minimumSource: "exact" | "estimated" | "unavailable";
}

export interface CryptoDepositAddressDto {
    paymentId: string;
    address: string;
    asset: string;
    payMemo: string | null; // only non-null for memo/tag-based coins (XRP, XLM, ...)
    expiresAt: string | null; // ISO timestamp — a NOWPayments session is not permanent
    /** The confirmed amount the provider actually accepted for THIS session — prefer this over CryptoMinAmountDto.minAmount once available; it can be higher (the provider's real minimum sometimes exceeds that pre-session estimate). Null only if the provider didn't return one. */
    expectedAmount: number | null;
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
    /** The provider-issued redemption code (electricity token, exam PIN, ...) when this purchase's category/response carried one — null otherwise. Always render this in the receipt when present. */
    token: string | null;
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

export type GiftCardSubmissionType = "PHYSICAL" | "ECODE";

export interface GiftCardOrderResponseDto {
    id: string;
    cardBrand: string;
    faceValueUsd: string;
    quantity: number;
    payoutAmount: string;
    submissionType: GiftCardSubmissionType;
    status: GiftCardOrderStatus;
    decidedAt: string | null;
    createdAt: string;
}

/**
 * A single entry in the admin-managed gift card display catalog — off
 * GET /giftcards/catalog (public, no auth). This is the storefront's only
 * source of which brands are sellable; `cardType` is included for
 * completeness but must never be rendered on the storefront card face.
 */
export interface GiftCardListingDto {
    id: string;
    brandName: string;
    slug: string;
    cardImageUrl: string;
    cardType: "PHYSICAL" | "ECODE" | "BOTH";
    countries: string[];
    denominations: number[] | null;
    rate: string;
    rateCurrency: string;
    description: string;
    redemptionNotes: string | null;
    restrictions: string | null;
    status: "draft" | "active" | "inactive";
    sortOrder: number;
}

// ─── Foreign Accounts — Bridge.xyz-backed ───────────────────────────────────
// USD/EUR/GBP virtual accounts that auto-convert to USDC and land in a
// Bridge-custodied wallet. NePay credits the NGN-equivalent to the user's
// wallet immediately once a deposit is confirmed, using NePay's own internal
// rate — never a live per-transaction FX quote (replaces Fincra entirely).

export type BridgeCurrency = "USD" | "EUR" | "GBP";
/** Mirrors Bridge's own Customer.status values verbatim. */
export type BridgeCustomerStatus =
    | "not_started"
    | "incomplete"
    | "active"
    | "rejected"
    | "awaiting_ubo"
    | "under_review"
    | "deposits_restricted"
    | "paused"
    | "offboarded";
export type BridgeDepositStatus = "RECEIVED" | "CREDITED";

export interface BridgeCustomerDto {
    id: string;
    userId: string;
    bridgeCustomerId: string;
    status: BridgeCustomerStatus;
    hasAcceptedTermsOfService: boolean;
    /** Bridge's hosted ToS page — a human click-through, no API shortcut exists. Null once accepted. */
    tosLink: string | null;
    /** Bridge's full raw customer payload — `rejection_reasons[].reason` is the customer-facing message when status is "rejected". */
    rawPayload: Record<string, unknown> | null;
    createdAt: string;
    updatedAt: string;
}

/**
 * Body of POST /bridge/customer (multipart/form-data — identity document
 * images go alongside as files, see useCreateBridgeCustomer). Field names
 * and enum values confirmed live against Bridge's real sandbox API
 * 2026-09-04 — most notably `expectedMonthlyPaymentsUsd`, not
 * `expectedMonthlyPayments` (a wrong guess that silently passed validation
 * while permanently failing the underlying compliance check).
 */
export interface CreateBridgeCustomerDto {
    birthDate: string;
    streetLine1: string;
    city: string;
    postalCode: string;
    /** ISO 3166-1 alpha-3, e.g. "NGA" — confirmed live, not alpha-2. */
    country: string;
    employmentStatus: "employed" | "self_employed" | "unemployed" | "student" | "retired" | "homemaker";
    expectedMonthlyPaymentsUsd: "0_4999" | "5000_9999" | "10000_49999" | "50000_plus";
    /** O*NET/SOC-style numeric occupation code, e.g. "151254" for Software Developers. */
    mostRecentOccupation: string;
    accountPurpose:
        | "business_transactions"
        | "charitable_donations"
        | "ecommerce_retail_payments"
        | "investment_purposes"
        | "operating_a_company"
        | "other"
        | "payments_to_friends_or_family_abroad"
        | "personal_or_living_expenses"
        | "protect_wealth"
        | "purchase_goods_and_services"
        | "receive_payment_for_freelancing"
        | "receive_salary";
    /** "business_income" deliberately excluded — confirmed live 2026-09-04 that Bridge rejects it despite listing it as valid in their own error messages. */
    sourceOfFunds:
        | "company_funds"
        | "ecommerce_reseller"
        | "gambling_proceeds"
        | "gifts"
        | "government_benefits"
        | "inheritance"
        | "investments_loans"
        | "pension_retirement"
        | "salary"
        | "sale_of_assets_real_estate"
        | "savings"
        | "someone_elses_funds";
    actingAsIntermediary: boolean;
    identityDocumentType: "passport" | "national_id" | "drivers_license";
    /** ISO 3166-1 alpha-3, e.g. "NGA". */
    identityDocumentIssuingCountry: string;
    identityDocumentNumber: string;
}

export interface BridgeVirtualAccountDto {
    id: string;
    userId: string;
    currency: BridgeCurrency;
    bridgeVirtualAccountId: string;
    status: string;
    /** Bridge's real per-currency deposit instructions — shape varies (US bank+routing, EU IBAN, UK sort code+account). */
    sourceDepositInstructions: Record<string, unknown>;
    destinationCurrency: string;
    destinationChain: string;
    destinationAddress: string;
    createdAt: string;
}

/** Body of POST /bridge/accounts. */
export interface RequestBridgeVirtualAccountDto {
    currency: BridgeCurrency;
}

export interface BridgeDepositDto {
    id: string;
    userId: string;
    sourceCurrency: string;
    sourceAmount: string;
    usdAmount: string | null;
    rateUsed: string | null;
    ngnAmountCredited: string | null;
    status: BridgeDepositStatus;
    createdAt: string;
}
