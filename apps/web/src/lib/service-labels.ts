/**
 * Provider names for the TV and electricity screens, the same ones the mobile app shows (its TVScreen /
 * ElectricityScreen), so a customer sees "DSTV" on both rather than VTpass's "DSTV Subscription" on one.
 * Education uses the catalog name as it is, on both.
 */
export function tvProviderLabel(serviceID: string, name: string): string {
    const id = serviceID.toLowerCase();
    if (id.includes("dstv")) return "DSTV";
    if (id.includes("gotv")) return "GOTV";
    if (id.includes("startimes")) return "StarTimes";
    if (id.includes("showmax")) return "Showmax";
    return name.replace(/tv/i, "").replace(/subscription/i, "").trim();
}

/** Mirrors the backend's discoName (utilities/services/utility-names.ts): "Ikeja Electricity", never "Ikeja Electric Payment - IKEDC". */
const DISCO_CITIES: Array<[RegExp, string]> = [
    [/port\s*harcourt/i, "Port Harcourt"],
    [/ikeja/i, "Ikeja"],
    [/\beko\b/i, "Eko"],
    [/abuja/i, "Abuja"],
    [/kano/i, "Kano"],
    [/\bjos\b/i, "Jos"],
    [/kaduna/i, "Kaduna"],
    [/enugu/i, "Enugu"],
    [/ibadan|ibedc/i, "Ibadan"],
    [/benin/i, "Benin"],
    [/\baba\b/i, "Aba"],
    [/yola/i, "Yola"],
];

export function electricityProviderLabel(name: string): string {
    const city = DISCO_CITIES.find(([pattern]) => pattern.test(name));
    if (city) return `${city[1]} Electricity`;
    return name.replace(/\s*-\s*[A-Za-z]{2,8}$/, "").replace(/\s+Payment\b/gi, "").replace(/\bElectric\b/i, "Electricity").trim();
}
