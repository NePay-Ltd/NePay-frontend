/**
 * One box, two kinds of code. A marketer's code always starts with "MKT-"; anything else is another
 * customer's referral code. The sign-up request keeps them as separate fields, and the server checks
 * that whichever one it gets is real and active (an unknown code is refused, never silently dropped).
 */
export function splitReferralCode(raw?: string | null): {
  referralCode?: string;
  referredByMarketerCode?: string;
} {
  const code = (raw ?? "").trim().toUpperCase();
  if (!code) return {};
  return code.startsWith("MKT-")
    ? { referredByMarketerCode: code }
    : { referralCode: code };
}
