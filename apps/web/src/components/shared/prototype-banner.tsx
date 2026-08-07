/**
 * Prototype mode banner.
 * A thin bar at the very top reading "DESIGN ONLY · MOCK DATA".
 * Only renders when NEXT_PUBLIC_PROTOTYPE_MODE === "true".
 */
export function PrototypeBanner() {
    if (process.env.NEXT_PUBLIC_PROTOTYPE_MODE !== "true") {
        return null;
    }

    return (
        <div className="bg-amber-500 px-4 py-1.5 text-center text-xs font-semibold uppercase tracking-wider text-white">
            Design Only · Mock Data
        </div>
    );
}