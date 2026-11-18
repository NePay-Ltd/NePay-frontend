/**
 * Which `sourceOfFunds`/`accountPurpose` options are hidden once an
 * `employmentStatus` is picked on the Bridge onboarding form — the fix for
 * a real Bridge compliance request (2026-11-17): a customer declared
 * `self_employed` but the form's own hardcoded default had left
 * `sourceOfFunds` on `salary` (a self-employed person, by definition, has
 * no employer) and `accountPurpose` on `receive_payment_for_freelancing`
 * while otherwise implying `employed`.
 *
 * Mirrored exactly in NePay-backend's
 * `src/modules/bridge/constants/kyc-coherence.ts` (the authoritative,
 * server-side copy — enforced there too, so this file filtering the
 * dropdown is a UX convenience, not the only thing stopping a
 * contradiction) and in Nepay-Mobile-App's
 * `src/lib/bridge-kyc-coherence.ts`. Keep all three in step.
 */
export const KYC_EXCLUDED_SOURCE_OF_FUNDS: Record<string, string[]> = {
    employed: ["company_funds", "ecommerce_reseller", "someone_elses_funds"],
    self_employed: ["salary"],
    unemployed: ["salary", "company_funds", "ecommerce_reseller"],
    student: ["pension_retirement", "company_funds", "ecommerce_reseller"],
    retired: ["salary"],
    homemaker: ["salary"],
};

export const KYC_EXCLUDED_ACCOUNT_PURPOSE: Record<string, string[]> = {
    employed: ["receive_payment_for_freelancing"],
    self_employed: ["receive_salary"],
    unemployed: ["receive_salary", "receive_payment_for_freelancing", "operating_a_company", "business_transactions", "ecommerce_retail_payments"],
    student: ["operating_a_company", "business_transactions", "ecommerce_retail_payments"],
    retired: ["receive_salary"],
    homemaker: ["receive_salary"],
};
