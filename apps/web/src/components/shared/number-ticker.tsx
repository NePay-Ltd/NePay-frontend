"use client";

import React, { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";

interface NumberTickerProps {
    value: number;
    className?: string;
    suffix?: string;
    delay?: number;
}

export function NumberTicker({
    value,
    className,
    suffix = "",
    delay = 0,
}: NumberTickerProps) {
    const ref = useRef<HTMLSpanElement>(null);
    const motionValue = useMotionValue(0);
    const springValue = useSpring(motionValue, {
        damping: 40,
        stiffness: 100,
    });
    const isInView = useInView(ref, { once: true, margin: "0px" });

    useEffect(() => {
        if (isInView) {
            const timeoutId = setTimeout(() => {
                motionValue.set(value);
            }, delay * 1000);
            return () => clearTimeout(timeoutId);
        }
    }, [motionValue, isInView, delay, value]);

    useEffect(() => {
        return springValue.on("change", (latest) => {
            if (ref.current) {
                ref.current.textContent = Intl.NumberFormat("en-US").format(
                    Math.round(latest)
                ) + suffix;
            }
        });
    }, [springValue, suffix]);

    return (
        <span ref={ref} className={className}>
            0{suffix}
        </span>
    );
}
