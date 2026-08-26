/**
 * A client-generated identifier persisted in local storage, sent with
 * registration as the fraud layer's best-effort cross-account duplicate
 * signal (see the backend's FraudDetectionService.captureSignupContext and
 * User.signupDeviceId's own note on why this is deliberately weaker than a
 * native app's hardware device id — there is no native app in this
 * codebase, only this web client). Anyone who clears storage or opens a
 * private window gets a fresh id; that's the accepted tradeoff, not a bug.
 */

const STORAGE_KEY = "nepay-device-id";

export function getOrCreateDeviceId(): string | null {
    if (typeof window === "undefined") {
        return null;
    }

    try {
        const existing = window.localStorage.getItem(STORAGE_KEY);
        if (existing) {
            return existing;
        }

        const generated = window.crypto?.randomUUID?.() ?? fallbackUuid();
        window.localStorage.setItem(STORAGE_KEY, generated);
        return generated;
    } catch {
        // Private browsing / storage disabled — no device id this session,
        // not an error. Registration proceeds without one.
        return null;
    }
}

/** crypto.randomUUID() is unavailable only on very old browsers — a plain random fallback, good enough for a best-effort signal. */
function fallbackUuid(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
