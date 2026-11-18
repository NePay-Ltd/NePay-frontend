/**
 * A thin fill track + "Step X of N — {label}" line, used by multi-step forms
 * (the Bridge KYC wizard). Visually the same track/fill language mobile's
 * WalletMeter already uses — a deliberate callback, not a new pattern.
 */
export function StepProgress({ current, total, label }: { current: number; total: number; label: string }) {
    const pct = total > 0 ? Math.min(100, (current / total) * 100) : 0;

    return (
        <div className="mb-5 w-full">
            <div className="h-1 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                <div
                    className="h-full rounded-full bg-violet-600 transition-[width] duration-300 ease-out"
                    style={{ width: `${pct}%` }}
                />
            </div>
            <p className="mt-2 text-xs font-medium text-muted">
                Step {current} of {total} · {label}
            </p>
        </div>
    );
}
