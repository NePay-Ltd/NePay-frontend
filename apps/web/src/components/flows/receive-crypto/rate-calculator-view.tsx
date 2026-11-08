"use client";

/**
 * RateCalculatorView - "What you'll get". The web twin of the mobile app's CryptoCalculatorScreen.
 *
 * Before getting a deposit address, a customer works out what a deposit is worth in naira - either way round:
 * type the coin amount and see the naira, or type the naira they need and see how much coin to send.
 *
 * Built only from real figures:
 *   - the coin's naira price (GET /crypto/prices - the same rate store the server credits from; the real credit
 *     uses the rate at the moment the deposit lands, so this is always called an estimate),
 *   - the fee estimate (GET /crypto/fee-estimate - service-fee percent and, with enough history, the range of
 *     network fees this coin's recent deposits were actually charged; applied only while deposits are credited
 *     net of fees).
 * No price, no number. No minimum warning: any amount sent is processed and credited.
 */
import * as React from "react";
import { ArrowDownUp, Loader2 } from "lucide-react";
import { IconArrowLeft as ArrowLeft } from "@/components/icons";

import { Button } from "@/components/shared/button";
import { useCryptoCurrencies, useCryptoPrices, useCryptoFeeEstimate } from "@/lib/queries/crypto";
import { cn } from "@/lib/cn";
import { CurrencyAvatar } from "./shared";

const STABLE = new Set(["USDT", "USDC", "DAI", "BUSD", "TUSD", "FDUSD", "PYUSD"]);
const NAIRA_PRESETS = [20_000, 50_000, 100_000, 500_000];

const nairaFmt = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 2 });
const naira = (n: number) => nairaFmt.format(Math.max(0, n)).replace(/\.00$/, "");

/** Coin amounts: as many decimals as matter, never more than 8, no trailing zeros. */
function coin(n: number, symbol: string): string {
    if (!Number.isFinite(n) || n <= 0) return `0 ${symbol}`.trim();
    const dp = n >= 100 ? 2 : n >= 1 ? 4 : 8;
    const s = n.toFixed(dp).replace(/\.?0+$/, "");
    const [w, d] = s.split(".");
    return `${Number(w).toLocaleString("en-NG")}${d ? `.${d}` : ""} ${symbol}`.trim();
}
function roundCoinPreset(ngn: number, price: number): number {
    const raw = ngn / price;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)) - 1);
    return Math.round(raw / mag) * mag;
}
function secondsAgo(t: number, now: number): string {
    const s = Math.max(0, Math.round((now - t) / 1000));
    if (s < 5) return "just now";
    if (s < 60) return `${s}s ago`;
    return `${Math.round(s / 60)} min ago`;
}
/** Keeps typed text a valid amount: digits, one point, at most `dp` decimals. */
function cleanAmount(raw: string, dp: number): string {
    let v = raw.replace(/,/g, "").replace(/[^\d.]/g, "");
    const firstDot = v.indexOf(".");
    if (firstDot !== -1) v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, "");
    const [w, d] = v.split(".");
    const whole = (w ?? "").replace(/^0+(?=\d)/, "").slice(0, 12);
    return d !== undefined ? `${whole || "0"}.${d.slice(0, dp)}` : whole;
}

type Mode = "coin" | "naira";

interface RateCalculatorViewProps {
    assetCode: string | null;
    /** "Get my X address": opens the deposit details. */
    onContinue: () => void;
    onBack: () => void;
    isMobile?: boolean;
}

export function RateCalculatorView({ assetCode, onContinue, onBack, isMobile = false }: RateCalculatorViewProps) {
    const { data: currencies } = useCryptoCurrencies();
    const pricesQuery = useCryptoPrices();
    const { data: feeEstimate } = useCryptoFeeEstimate(assetCode ?? null);

    const currency = currencies?.find((c) => c.code === assetCode) ?? null;
    const symbol = currency?.coin ?? (assetCode ?? "").toUpperCase();
    const priceStr = pricesQuery.data?.prices?.[symbol] ?? null;
    const price = priceStr ? Number(priceStr) : null;
    const hasPrice = price !== null && Number.isFinite(price) && price > 0;

    const { refetch } = pricesQuery;
    React.useEffect(() => {
        const id = setInterval(() => refetch(), 30_000);
        return () => clearInterval(id);
    }, [refetch]);
    const [now, setNow] = React.useState(() => Date.now());
    React.useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);

    const [mode, setMode] = React.useState<Mode>("coin");
    const [typed, setTyped] = React.useState("");
    React.useEffect(() => {
        setTyped("");
        setMode("coin");
    }, [assetCode]);
    const typedNum = Number(typed) || 0;

    const netOfFees = feeEstimate?.creditsNetOfFees === true;
    const pct = netOfFees && feeEstimate?.serviceFeePercent ? Number(feeEstimate.serviceFeePercent) / 100 : 0;
    const nf = netOfFees ? feeEstimate?.networkFee ?? null : null;
    const feeMin = nf ? Number(nf.min) : 0;
    const feeMax = nf ? Number(nf.max) : 0;
    const feeMid = (feeMin + feeMax) / 2;
    const keep = 1 - pct;

    // naira = (coin - networkFee) x (1 - servicePct) x price, either way round
    const sendCoin = mode === "coin" ? typedNum : hasPrice && typedNum > 0 ? typedNum / (keep * price!) + feeMid : 0;
    const getMid = hasPrice ? Math.max(0, (sendCoin - feeMid) * keep * price!) : 0;
    const getLow = hasPrice ? Math.max(0, (sendCoin - feeMax) * keep * price!) : 0;
    const getHigh = hasPrice ? Math.max(0, (sendCoin - feeMin) * keep * price!) : 0;
    const showRange = !!nf && feeMax > feeMin && sendCoin > 0;
    const eatenByFees = sendCoin > 0 && hasPrice && getMid <= 0;

    const presets: { label: string; value: string }[] =
        mode === "naira"
            ? NAIRA_PRESETS.map((n) => ({ label: naira(n), value: String(n) }))
            : STABLE.has(symbol)
              ? [20, 50, 100, 500].map((n) => ({ label: `${n} ${symbol}`, value: String(n) }))
              : hasPrice
                ? NAIRA_PRESETS.map((n) => {
                      const v = roundCoinPreset(n, price!);
                      return { label: coin(v, symbol), value: String(Number(v.toPrecision(8))) };
                  })
                : [];

    const swap = () => {
        if (mode === "coin") {
            setMode("naira");
            setTyped(getMid > 0 ? String(Math.round(getMid)) : "");
        } else {
            setMode("coin");
            setTyped(sendCoin > 0 ? String(Number(sendCoin.toFixed(sendCoin >= 1 ? 4 : 8))) : "");
        }
    };

    const displayTyped = (() => {
        if (!typed) return "";
        const [w, d] = typed.split(".");
        const grouped = Number(w || "0").toLocaleString("en-NG");
        return d !== undefined ? `${grouped}.${d}` : grouped;
    })();

    if (!assetCode) return null;

    return (
        <div className={cn("mx-auto w-full", isMobile ? "pt-4 pb-8" : "flex h-full flex-col")}>
            {/* Header */}
            <div className={cn("mb-5 flex items-center gap-3 shrink-0", !isMobile && "px-6 pt-6")}>
                {isMobile && (
                    <button
                        onClick={onBack}
                        aria-label="Back"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white dark:bg-white/5 border border-border text-ink hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                )}
                {currency && <CurrencyAvatar currency={currency} className="h-9 w-9 text-sm shrink-0" />}
                <div className="min-w-0">
                    <h1 className="truncate text-xl font-bold tracking-tight text-ink">What you&apos;ll get</h1>
                    <p className="text-sm font-medium text-muted">
                        {symbol}
                        {currency?.network ? ` on ${currency.network}` : ""}
                    </p>
                </div>
            </div>

            <div className={cn("flex flex-1 flex-col", !isMobile && "overflow-y-auto px-6 pb-6")}>
                {/* The two sides, with the swap on the line between them */}
                <label htmlFor="calc-amount" className="text-sm font-medium text-muted">
                    {mode === "coin" ? "You send" : "You want in your wallet"}
                </label>
                <div className="mt-1 flex items-baseline gap-2">
                    {mode === "naira" && <span className="text-2xl font-bold text-violet-600 dark:text-violet-400">₦</span>}
                    <input
                        id="calc-amount"
                        inputMode="decimal"
                        autoComplete="off"
                        placeholder="0"
                        value={displayTyped}
                        onChange={(e) => setTyped(cleanAmount(e.target.value, mode === "coin" ? 8 : 2))}
                        className="min-w-0 flex-1 bg-transparent text-4xl font-extrabold tracking-tight text-ink tabular-nums outline-none placeholder:text-muted/60 focus-visible:ring-0"
                        autoFocus={!isMobile}
                    />
                    {mode === "coin" && <span className="text-xl font-bold text-muted">{symbol}</span>}
                </div>

                <div className="my-4 flex items-center gap-3">
                    <div className="h-px flex-1 bg-border" />
                    <button
                        type="button"
                        onClick={swap}
                        aria-label={mode === "coin" ? "Type the naira amount instead" : `Type the ${symbol} amount instead`}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-700 transition-colors hover:bg-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:bg-violet-500/20 dark:text-violet-300"
                    >
                        <ArrowDownUp className="h-[18px] w-[18px]" strokeWidth={2} />
                    </button>
                    <div className="h-px flex-1 bg-border" />
                </div>

                <p className="text-sm font-medium text-muted">{mode === "coin" ? "You get about" : "Send about"}</p>
                {pricesQuery.isLoading ? (
                    <Loader2 className="mt-2 h-6 w-6 animate-spin text-violet-600" />
                ) : !hasPrice ? (
                    <p className="mt-1 text-2xl font-bold text-muted">Rate unavailable</p>
                ) : (
                    <p className="mt-1 truncate text-3xl font-extrabold tracking-tight tabular-nums text-violet-700 dark:text-violet-300" aria-live="polite">
                        {mode === "coin" ? naira(getMid) : coin(sendCoin, symbol)}
                    </p>
                )}
                {hasPrice && showRange && mode === "coin" && (
                    <p className="mt-1 text-[13px] font-medium text-muted">
                        Between {naira(getLow)} and {naira(getHigh)}, depending on the network fee
                    </p>
                )}
                {hasPrice && mode === "naira" && sendCoin > 0 && (
                    <p className="mt-1 text-[13px] font-medium text-muted">
                        Send a little more to be safe: network fees vary from deposit to deposit
                    </p>
                )}

                {eatenByFees && (
                    <p className="mt-4 text-sm font-semibold text-red-600 dark:text-red-400">
                        This is less than the network fee, so nothing would reach your wallet.
                    </p>
                )}

                {/* How we got there */}
                {hasPrice && sendCoin > 0 && !eatenByFees && (
                    <div className="mt-5 rounded-2xl bg-gray-50 px-4 py-1.5 dark:bg-white/5">
                        <Row label={`${coin(sendCoin, symbol)} at ${naira(price!)} each`} value={naira(sendCoin * price!)} />
                        {nf ? (
                            <Row
                                label={
                                    feeMin === feeMax
                                        ? `Network fee, about ${coin(feeMin, symbol)}`
                                        : `Network fee, ${coin(feeMin, "")} to ${coin(feeMax, symbol)}`
                                }
                                value={`– ${naira(feeMid * price!)}`}
                            />
                        ) : netOfFees ? (
                            <Row label="Network fee" value="Comes off this" muted />
                        ) : null}
                        {pct > 0 && (
                            <Row
                                label={`Service fee, ${feeEstimate!.serviceFeePercent}%`}
                                value={`– ${naira(Math.max(0, sendCoin - feeMid) * pct * price!)}`}
                            />
                        )}
                        <div className="my-0.5 h-px bg-border" />
                        <Row label="Into your wallet" value={`≈ ${naira(getMid)}`} strong />
                    </div>
                )}

                {hasPrice ? (
                    <p className="mt-3 text-xs leading-5 text-muted">
                        1 {symbol} ≈ {naira(price!)}. Rate updated {secondsAgo(pricesQuery.dataUpdatedAt || now, now)}. Your
                        deposit is converted at the rate when it arrives.
                    </p>
                ) : !pricesQuery.isLoading ? (
                    <p className="mt-3 text-xs leading-5 text-muted">
                        We can&apos;t get a {symbol} rate right now, so there&apos;s no estimate. You can still deposit; it&apos;s
                        converted when it arrives.
                    </p>
                ) : null}

                {presets.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {presets.map((p) => {
                            const active = typed === p.value;
                            return (
                                <button
                                    key={p.value}
                                    type="button"
                                    onClick={() => setTyped(p.value)}
                                    className={cn(
                                        "rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
                                        active
                                            ? "bg-violet-100 font-bold text-violet-700 dark:bg-violet-500/20 dark:text-violet-300"
                                            : "bg-gray-100 text-ink hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10",
                                    )}
                                >
                                    {p.label}
                                </button>
                            );
                        })}
                    </div>
                )}

                <div className={cn("pt-6", !isMobile && "mt-auto")}>
                    <Button fullWidth onClick={onContinue}>
                        Get my {symbol} address
                    </Button>
                </div>
            </div>
        </div>
    );
}

function Row({ label, value, strong, muted }: { label: string; value: string; strong?: boolean; muted?: boolean }) {
    return (
        <div className="flex items-center justify-between gap-3 py-2">
            <span className={cn("text-[13.5px] font-medium text-body", strong && "text-[15px] font-bold text-ink")}>{label}</span>
            <span
                className={cn(
                    "text-[13.5px] font-semibold tabular-nums text-ink",
                    strong && "text-[15px] font-bold",
                    muted && "font-medium text-muted",
                )}
            >
                {value}
            </span>
        </div>
    );
}
