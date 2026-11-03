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

export function electricityProviderLabel(name: string): string {
    return name.replace(/electricity/i, "").replace(/postpaid/i, "").replace(/prepaid/i, "").trim();
}
