"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { CryptoCurrencyDto } from "@/lib/types/api";

export interface CoinGroup {
    coin: string;
    variants: CryptoCurrencyDto[];
    representative: CryptoCurrencyDto;
}

export function groupByCoin(currencies: CryptoCurrencyDto[]): CoinGroup[] {
    const byCoin = new Map<string, CryptoCurrencyDto[]>();
    for (const currency of currencies) {
        const variants = byCoin.get(currency.coin) ?? [];
        variants.push(currency);
        byCoin.set(currency.coin, variants);
    }
    return Array.from(byCoin.entries()).map(([coin, variants]) => {
        const sorted = [...variants].sort((a, b) => Number(b.recommended) - Number(a.recommended));
        return { coin, variants: sorted, representative: sorted[0]! };
    });
}

export function CurrencyAvatar({ currency, className }: { currency: Pick<CryptoCurrencyDto, 'iconUrl' | 'name' | 'coin'>; className?: string }) {
    const [imageError, setImageError] = React.useState(false);
    
    if (currency.iconUrl && !imageError) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
                src={currency.iconUrl} 
                alt="" 
                className={cn("rounded-full bg-violet-50 object-contain", className)} 
                onError={() => setImageError(true)}
            />
        );
    }
    
    return (
        <span className={cn("flex items-center justify-center rounded-full bg-violet-100 font-bold text-violet-700", className)}>
            {(currency.name ?? currency.coin)[0]?.toUpperCase() ?? "?"}
        </span>
    );
}
