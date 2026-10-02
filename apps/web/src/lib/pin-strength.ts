/**
 * Mirrors the backend's isTrivialPin (NePay-backend security/utils): every
 * digit the same, or a straight ascending/descending run. The backend is the
 * authority — this only gives instant feedback before the round trip.
 */
export function isTrivialPin(pin: string): boolean {
    const digits = pin.split("").map(Number);
    const steps = digits.slice(1).map((digit, i) => digit - (digits[i] ?? NaN));

    return steps.every((s) => s === 0) || steps.every((s) => s === 1) || steps.every((s) => s === -1);
}

export const TRIVIAL_PIN_MESSAGE = "Choose a less predictable PIN — avoid repeated or sequential digits like 0000 or 1234";
