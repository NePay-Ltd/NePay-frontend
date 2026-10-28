/**
 * Whether the Two-Factor Authentication / Email OTP controls are shown in the app's security settings.
 *
 * OFF on purpose (2026-10-28): the feature is intact on the server and in the code (login still asks for the
 * code of anyone who already has 2FA on, the reset-PIN flows still offer it) but nobody can switch it on or off
 * from the app for now; biometrics is the extra protection on offer. Flip to true to bring the controls back.
 */
export const SHOW_TWO_FACTOR_SETTINGS = false;
