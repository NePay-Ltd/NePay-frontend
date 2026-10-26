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
 * users.kycTier was replaced by a single users.kycVerified boolean (identity
 * approval alone is sufficient KYC),
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
    avatarUrl?: string | null;
    /** True once this account has an APPROVED identity verification. */
    kycVerified: boolean;
    emailVerified: boolean;
    emailReceipts: boolean;
    phoneVerified: boolean;
    createdAt: string;
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

/** Identity checks supported by the backend. */
export type VerificationType = "BVN" | "NIN";
export type KycRecordStatus = "PENDING" | "APPROVED" | "REJECTED";

/**
 * Response of GET /kyc/status — derived from kyc_records on every call
 * (see backend KycService.getStatus). The old
 * { tier, bvnVerified, ninVerified } shape no longer exists.
 */
export interface KycStatusDto {
    verified: boolean;
    retryBlockedByReview: boolean;
}

/** Response of POST /kyc/verify-nin — synchronous decision; duplicate NINs can be held for admin review. */
export interface KycRecordDto {
    id: string;
    status: KycRecordStatus;
    failureReason: string | null;
    duplicateReviewRequired: boolean;
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
    /**
     * What the row should show. A ledger entry only proves money moved — a
     * utility purchase is debited before the provider is asked, so its entry
     * alone can't say whether it was delivered, is still pending, or failed
     * and was refunded. Optional only so an older backend that doesn't send
     * it still reads as "success", as every row used to.
     */
    status?: "success" | "pending" | "failed";
    /**
     * This entry's own fee, bundled onto it rather than a separate FEE row
     * — see the backend's WalletService.getEntryFees. Null/absent when
     * nothing was charged.
     */
    fee?: string | null;
}

export interface VirtualAccountResponseDto {
    id: string;
    accountNumber: string;
    bankName: string;
    accountName: string;
    status: VirtualAccountStatus;
    /** CBN tier (1/2/3) this account currently sits at. */
    tier: number;
    /** This tier's balance cap, or null for Tier 3 (no cap). */
    balanceCap: string | null;
    /** True once the wallet balance is over balanceCap — every outgoing-spend surface is already blocked server-side; this is what drives the proactive "upgrade to access your balance" notice. */
    overBalanceCap: boolean;
    createdAt: string;
}

/**
 * Body of POST /wallet/virtual-account/upgrade-tier (multipart) — at least
 * one of bvn/nin/address is required, which is enforced server-side since it
 * depends on the account's current tier. `documentDate` and the
 * proof-of-address image file are required together whenever `address` is
 * present (Tier 3); the file itself is passed separately to useUpgradeTier,
 * not part of this DTO, the same split useCreateBridgeCustomer already uses.
 */
export interface UpgradeTierDto {
    bvn?: string;
    nin?: string;
    address?: string;
    documentDate?: string;
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
    /** 'net' = the provider's fees were deducted from this deposit; 'gross' = Nepay absorbed them (and every deposit from before this existed). */
    creditMode: "gross" | "net";
    /** The provider's outcome_amount as stored — what is left after its fees, in `outcomeCurrency` units. Null until reported. */
    outcomeAmount: number | null;
    outcomeCurrency: string | null;
    /** Fees the provider actually deducted, as stored — never an estimate. Null when none was recorded: show no fee line then. */
    feeTotal: number | null;
    feeCurrency: string | null;
    /** Finished at the provider but deliberately not credited yet because the amount needs a manual check. */
    underReview: boolean;
    createdAt: string;
    updatedAt: string;
}

/** GET /crypto/fee-estimate — an ESTIMATE shown before depositing. Never present it as a quote. */
export interface CryptoFeeEstimateDto {
    asset: string;
    /** False means fees are NOT being deducted from new deposits — don't tell the customer they are. */
    creditsNetOfFees: boolean;
    /** Service-fee percentage as configured, e.g. "0.5"; null when not configured. */
    serviceFeePercent: string | null;
    /** Network-side fee range in the asset's own units, from this asset's recent real deposits. Null when there is no real basis for a range. */
    networkFee: { currency: string; min: string; max: string; sampleSize: number } | null;
    basis: "observed" | "none";
}

// ─── Withdrawals ─────────────────────────────────────────────────────────────

export interface ResolveAccountResponseDto {
    accountName: string;
    bankCode: string;
    accountNumber: string;
    resolutionToken: string;
}

/** One fee band from GET /fees: amounts up to and including `upTo` pay `fee`; the last band (`upTo: null`) covers everything above. */
export interface FeeBand {
    upTo: string | null;
    fee: string;
}

export interface FeeSchedule {
    withdrawal: FeeBand[];
    deposit: FeeBand[];
}

export interface WithdrawalResponseDto {
    id: string;
    amount: string;
    /** Charged on top of amount; refunded with it if the transfer fails. */
    fee: string;
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


/** GET /wallet/virtual-account/receipt/:ledgerEntryId — a naira deposit's sender / recipient details. Account numbers arrive masked. */
export interface BankDepositReceiptDto {
    senderName: string | null;
    senderBankName: string | null;
    senderAccountMasked: string | null;
    narration: string | null;
    sessionId: string | null;
    recipientName: string;
    recipientBankName: string | null;
    recipientAccountMasked: string | null;
    reference: string;
}

/** GET /bridge/accounts/receipt/:ledgerEntryId — a foreign-account deposit's sender, amount sent and rate. */
export interface ForeignDepositReceiptDto {
    senderName: string | null;
    paymentRail: string | null;
    narration: string | null;
    sourceCurrency: string;
    sourceAmount: string | null;
    usdAmount: string | null;
    rateUsed: string | null;
    recipientName: string;
    reference: string;
}

/** GET /withdrawals/receipt/:ledgerEntryId — what a withdrawal receipt shows beyond the ledger entry. The account number arrives already masked. */
export interface WithdrawalReceiptDto {
    recipientName: string;
    bankName: string | null;
    accountNumberMasked: string;
    senderName: string;
    narration: string | null;
    sessionId: string | null;
    reference: string;
    status: string;
    isRefund: boolean;
    /** The transfer fee charged on top of the amount, as a decimal string. */
    fee: string;
}

/** GET /crypto/receipt/:ledgerEntryId - what a crypto-deposit receipt shows beyond the ledger entry. */
export interface CryptoDepositReceiptDto {
    coin: string;
    network: string | null;
    coinAmount: string | null;
    rate: string | null;
    reference: string;
}

/** GET /giftcards/receipt/:ledgerEntryId - what a gift-card receipt shows beyond the ledger entry. */
export interface GiftCardReceiptDto {
    brand: string;
    faceValueUsd: string;
    quantity: number;
    rate: string;
    cardType: string;
    reference: string;
}

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
    /** Exam-PIN purchases only - the card's serial number, when the provider returned one. */
    serial?: string | null;
    /** What the customer saved (airtime and data): they paid `amount` minus this. */
    discountAmount?: string | null;
    /** Electricity-only — the meter's registered customer name, when VTpass returned one. */
    customerName: string | null;
    /** Electricity-only — the meter's registered address, when VTpass returned one. */
    customerAddress: string | null;
    /** Electricity-only — the actual kWh purchased, e.g. "79.9 kWh". */
    units: string | null;
    /** VTpass's own display name for whatever was purchased, e.g. "Ikeja Electric Payment - IKEDC" — render as "Disco" for electricity. */
    productName: string | null;
    /** VTpass's own internal transaction id, for cross-referencing VTpass's own records. `providerReference` is this app's own reference. */
    providerTransactionId: string | null;
    /** Electricity-only, e.g. "R2 SINGLE PHASE RESIDENTIAL" — only ever known post-purchase, never available before payment. */
        tariff: string | null;
    /** The provider as a customer knows it ("MTN", "Ikeja Electric") — present when the purchase is fetched for a receipt. */
    providerName?: string | null;
    /** The data bundle / TV bouquet / exam PIN type by name — present when fetched for a receipt. */
    planName?: string | null;
    createdAt: string;
}

export interface UtilityVerificationResponseDto {
    verificationToken: string;
    customerName: string | null;
    /** The meter/smartcard's registered service address, when VTpass returned one. */
    address: string | null;
    renewalAmount: string | null;
    /** Electricity-only — the smallest amount VTpass will vend for this meter, when it returned one. Null for cable. */
    minPurchaseAmount: string | null;
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
export type BridgeDepositStatus =
    | "SCHEDULED"
    | "RECEIVED"
    | "IN_REVIEW"
    | "PROCESSING"
    | "CREDITED"
    | "RETURNING"
    | "RETURNED"
    | "RETURN_FAILED";

export interface BridgeRejectionReasonDto {
    reason: string;
    developerReason: string | null;
}

/**
 * The backend allowlists this from Bridge's full raw customer payload —
 * identity document number/DOB/address never leave it (see the backend's
 * BridgeCustomerResponseDto). `rejectionReasons[0].reason` is the
 * customer-facing message when status is "rejected".
 */
export interface BridgeCustomerDto {
    id: string;
    bridgeCustomerId: string;
    status: BridgeCustomerStatus;
    hasAcceptedTermsOfService: boolean;
    /** Bridge's hosted ToS page — a human click-through, no API shortcut exists. Null once accepted. */
    tosLink: string | null;
    rejectionReasons: BridgeRejectionReasonDto[] | null;
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

/**
 * GET /bridge/accounts/fee and the result of POST /bridge/accounts/fee/pay
 * — the one-time fee that unlocks foreign accounts for every currency, not
 * a per-currency charge. `amountNgn`/`rate` are a live quote at the
 * site-wide USD→NGN rate; null only while no rate is configured (the admin
 * hasn't set one yet) or once this fee shows as already settled some other
 * way (grandfathered accounts from before this fee existed).
 */
export interface BridgeAccountFeeDto {
    required: boolean;
    amountUsd: string;
    amountNgn: string | null;
    rate: string | null;
    paidAt: string | null;
}

export interface BridgeDepositDto {
    id: string;
    sourceCurrency: string;
    sourceAmount: string;
    usdAmount: string | null;
    rateUsed: string | null;
    /** Net of feeAmount — what actually landed in the wallet. */
    ngnAmountCredited: string | null;
    /** The cross-border conversion fee taken (NGN). */
    feeAmount: string | null;
    status: BridgeDepositStatus;
    /** ACH only — Bridge's own estimated arrival date while status is SCHEDULED. */
    estimatedArrivalDate: string | null;
    /** Set once status is RETURNED/RETURN_FAILED — Bridge's own reason code. */
    refundReason: string | null;
    createdAt: string;
}


/** GET /utilities/quote - the checkout preview for an airtime or data purchase. */
export interface UtilityQuoteDto {
    amount: string;
    discountAmount: string;
    payAmount: string;
    percentage: number;
}
