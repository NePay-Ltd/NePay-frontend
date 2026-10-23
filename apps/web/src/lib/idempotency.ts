/**
 * Double-tap protection for payments.
 *
 * The backend treats a payment request carrying an `Idempotency-Key` header
 * as ONE payment however many times it arrives: a double tap, or a retry
 * after a dropped connection, is answered with the first attempt's result
 * instead of paying twice. This attaches that key automatically to every
 * money-out POST made through the shared axios client, so no screen has to
 * remember to.
 *
 * How the key behaves:
 *  - The first request for a given payment mints a key. An identical payment
 *    (same endpoint, same amount/destination/etc.) sent while the first is
 *    still unanswered reuses that key — that is the double tap.
 *  - As soon as the server ANSWERS (success, or any error response) the key
 *    is forgotten: the attempt is settled, and the next purchase of the same
 *    thing is a genuinely new payment with a new key.
 *  - If the connection drops with no answer, the key is kept, so tapping
 *    again resends the SAME payment rather than risking a second one.
 *  - PIN and one-time tokens are ignored when deciding "same payment": a
 *    corrected PIN is still the same payment.
 *  - Another device has its own memory, so it gets its own key — separate
 *    payments there are handled by the backend's balance lock, as before.
 */
import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios";

const PAYMENT_URL = /^\/?(withdrawals|giftcards\/sell|utilities\/(airtime|data|electricity|cable|education))\/?$/;

/** Fields that change between attempts at the SAME payment, so they never define it. */
// (A gift card photo is megabytes of base64 and never changes which sale it is — the quote and the code do.)
const IGNORED_FIELDS = new Set(["pin", "resolutionToken", "verificationToken", "cardPhotoBase64"]);

/** A key nobody answered for this long is forgotten (the app was left open, the request was abandoned). */
const MAX_AGE_MS = 10 * 60 * 1000;

const HEADER = "Idempotency-Key";

type TrackedConfig = InternalAxiosRequestConfig & { _idempotencyFingerprint?: string };

const openPayments = new Map<string, { key: string; at: number }>();

export function newIdempotencyKey(): string {
    const cryptoApi = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;

    if (cryptoApi?.randomUUID) {
        return cryptoApi.randomUUID();
    }

    // Older browsers: RFC 4122 v4 from Math.random. Uniqueness, not secrecy, is all this needs.
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
        const random = Math.floor(Math.random() * 16);
        return (char === "x" ? random : (random & 0x3) | 0x8).toString(16);
    });
}

function parseBody(data: unknown): Record<string, unknown> {
    if (typeof data === "string") {
        try {
            return JSON.parse(data) as Record<string, unknown>;
        } catch {
            return {};
        }
    }

    return (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
}

function fingerprintOf(url: string, data: unknown): string {
    const body = parseBody(data);
    const stable = Object.keys(body)
        .filter((field) => !IGNORED_FIELDS.has(field))
        .sort()
        .map((field) => [field, body[field]]);

    return `${url.replace(/^\/+|\/+$/g, "")}|${JSON.stringify(stable)}`;
}

function isPaymentRequest(config: InternalAxiosRequestConfig): boolean {
    return (config.method ?? "get").toLowerCase() === "post" && PAYMENT_URL.test(config.url ?? "");
}

function forget(config: unknown) {
    const fingerprint = (config as TrackedConfig | undefined)?._idempotencyFingerprint;

    if (fingerprint) {
        openPayments.delete(fingerprint);
    }
}

/** Test seam: forget every open payment. */
export function resetIdempotencyMemory() {
    openPayments.clear();
}

/**
 * Attach the behaviour above to a client. Call it AFTER the client's own
 * interceptors are registered, so the clean-up sees the final outcome of a
 * request (including a silent token refresh + retry), not the first 401.
 */
export function attachPaymentIdempotency(client: AxiosInstance) {
    client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
        if (!isPaymentRequest(config)) {
            return config;
        }

        // A retry of an already-labelled request (e.g. after a token refresh) keeps its key.
        const existing = config.headers?.get?.(HEADER) ?? (config.headers as Record<string, unknown> | undefined)?.[HEADER];

        if (existing) {
            return config;
        }

        const fingerprint = fingerprintOf(config.url ?? "", config.data);
        const now = Date.now();
        const open = openPayments.get(fingerprint);
        const key = open && now - open.at < MAX_AGE_MS ? open.key : newIdempotencyKey();

        openPayments.set(fingerprint, { key, at: now });
        (config as TrackedConfig)._idempotencyFingerprint = fingerprint;

        if (typeof config.headers?.set === "function") {
            config.headers.set(HEADER, key);
        } else {
            (config.headers as Record<string, unknown>)[HEADER] = key;
        }

        return config;
    });

    client.interceptors.response.use(
        (response: AxiosResponse) => {
            forget(response.config);
            return response;
        },
        (error: AxiosError) => {
            // Any answer from the server settles the attempt (the backend frees the key when a payment fails).
            // No answer at all (dropped connection, timeout) keeps the key so a retry is the same payment.
            if (error.response) {
                forget(error.config);
            }

            return Promise.reject(error);
        },
    );
}
