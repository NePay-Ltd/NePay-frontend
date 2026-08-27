"use client";

import * as React from "react";
import { toast } from "sonner";

// Extend window to recognize PaystackPop
declare global {
    interface Window {
        PaystackPop?: {
            setup: (options: any) => { openIframe: () => void };
        };
    }
}

export interface PaystackCheckoutOptions {
    amount: number; // in NGN
    email: string;
    onSuccess: (reference: string) => void;
    onClose?: () => void;
}

export function usePaystackCheckout() {
    const [isLoaded, setIsLoaded] = React.useState(false);

    // Dynamically inject the script if it doesn't exist
    React.useEffect(() => {
        if (window.PaystackPop) {
            setIsLoaded(true);
            return;
        }

        const scriptId = "paystack-inline-script";
        if (document.getElementById(scriptId)) {
            // Script tag already exists, wait for it
            const script = document.getElementById(scriptId) as HTMLScriptElement;
            script.addEventListener("load", () => setIsLoaded(true));
            return;
        }

        const script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://js.paystack.co/v1/inline.js";
        script.async = true;
        script.onload = () => setIsLoaded(true);
        script.onerror = () => {
            toast.error("Failed to load payment gateway. Please check your connection.");
        };
        document.body.appendChild(script);
    }, []);

    const initializePayment = React.useCallback(
        ({ amount, email, onSuccess, onClose }: PaystackCheckoutOptions) => {
            if (!isLoaded || !window.PaystackPop) {
                toast.error("Payment system is warming up. Please try again in a few seconds.");
                return;
            }

            // Using a dummy key if env is missing to ensure prototype mode doesn't break
            const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_KEY || "pk_test_dummy_key_nepay_prototype_12345";

            const handler = window.PaystackPop.setup({
                key: publicKey,
                email,
                amount: amount * 100, // Paystack expects kobo
                currency: "NGN",
                ref: `REF-${Math.floor(Math.random() * 1000000000 + 1)}`, // Generate random reference
                callback: (response: { reference: string }) => {
                    onSuccess(response.reference);
                },
                onClose: () => {
                    if (onClose) onClose();
                },
            });

            handler.openIframe();
        },
        [isLoaded],
    );

    return { initializePayment, isReady: isLoaded };
}
