/**
 * Where a shared referral link sends someone who opens it on a phone.
 *
 * Android: the Play Store page for NePay, carrying the referral code in the store link's `referrer`
 * parameter. Google Play hands that string to the app after it is installed (the "install referrer"),
 * which is how the code is still there when the person opens the app for the first time and signs up.
 *
 * iPhone: set IOS_APP_STORE_URL as soon as the App Store listing exists. Apple has no equivalent of the
 * install referrer, so the code can't ride through the install on iPhone; until then (and for desktop)
 * the link opens the web sign-up with the code already filled in.
 */
export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.nepay.app";
export const IOS_APP_STORE_URL = "";

/** The key the app looks for inside the Play install referrer string. Keep in sync with the mobile app's install-referral.ts. */
export const INSTALL_REFERRER_KEY = "nepay_ref";

/** Referral codes are letters, digits and hyphens, 4-20 long (matches the sign-up form). Anything else is not a code. */
export function isValidReferralCode(value: string): boolean {
    return /^[A-Za-z0-9-]{4,20}$/.test(value);
}

export function playStoreUrlWithReferral(code: string): string {
    const referrer = encodeURIComponent(`${INSTALL_REFERRER_KEY}=${code.toUpperCase()}`);
    return `${PLAY_STORE_URL}&referrer=${referrer}`;
}
