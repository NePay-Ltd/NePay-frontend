/**
 * Names the mobile-data networks shown in the network selector.
 *
 * VTpass lists Glo and 9mobile TWICE for data — a standard service and an SME /
 * "best value" one with a different plan list and different prices:
 *   glo-data        "GLO Data"                 glo-sme-data        "GLO Data (Best Value)"
 *   etisalat-data   "T2 (9mobile) Data"        9mobile-sme-data    "T2 SME Data"
 * Labels used to be derived by stripping "data"/"sme" from the name, which turned
 * both into plain "GLO" / "9mobile", so the customer couldn't tell which plan list
 * they were looking at. Labels here come from the serviceID, which is stable
 * (VTpass changes display names between live and sandbox).
 *
 * Pure and dependency-free on purpose: this exact file is mirrored in the mobile app
 * (src/lib/network-label.ts). Keep them in sync.
 */

export type NetworkFamily = "mtn" | "glo" | "airtel" | "9mobile";

/** Which carrier a data/airtime serviceID belongs to, or null for non-carriers (Smile, Spectranet…). */
export function networkFamily(serviceID: string): NetworkFamily | null {
  const id = serviceID.toLowerCase();

  if (id.includes("mtn")) return "mtn";
  if (id.includes("glo")) return "glo";
  if (id.includes("airtel")) return "airtel";
  if (id.includes("etisalat") || id.includes("9mobile")) return "9mobile";

  return null;
}

/** True for the SME / best-value variant of a carrier's data service. */
export function isSmeVariant(serviceID: string): boolean {
  return serviceID.toLowerCase().includes("sme");
}

/** The selector label for a carrier's data service, or null when the serviceID isn't one of the four carriers. */
export function carrierLabel(serviceID: string): string | null {
  const family = networkFamily(serviceID);
  const sme = isSmeVariant(serviceID);

  switch (family) {
    case "mtn":
      return "MTN";
    case "glo":
      return sme ? "GLO Best Value" : "GLO";
    case "airtel":
      return "Airtel";
    case "9mobile":
      return sme ? "9Mobile SME" : "9mobile";
    default:
      return null;
  }
}

/**
 * Picks which of the loaded networks a phone-number prefix points at.
 *
 * Keeps the customer's current choice when it is already the right carrier —
 * otherwise typing a Glo number would snap "GLO Best Value" back to plain "GLO"
 * on every digit. With no current match it prefers the standard service over the
 * SME one. Returns null when no loaded network belongs to the carrier.
 */
export function pickNetworkForCarrier(
  networks: { serviceID: string }[],
  carrier: NetworkFamily,
  currentServiceId: string | null,
): string | null {
  const matches = networks.filter((n) => networkFamily(n.serviceID) === carrier);

  if (matches.length === 0) return null;
  if (matches.some((n) => n.serviceID === currentServiceId)) return currentServiceId;

  const preferred = matches.find((n) => !isSmeVariant(n.serviceID)) ?? matches[0];

  return preferred ? preferred.serviceID : null;
}
