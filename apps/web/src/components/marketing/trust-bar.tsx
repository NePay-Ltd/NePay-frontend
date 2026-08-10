"use client";

import React from "react";
import { motion } from "framer-motion";

const wordmarks = ["Wema Bank", "Paystack", "VTpass", "NOWPayments"];

export function TrustBar() {
  const repeatedMarks = [...wordmarks, ...wordmarks, ...wordmarks, ...wordmarks, ...wordmarks, ...wordmarks];

  return (
    <div className="w-full bg-marketing-surface/30 border-y border-marketing-border py-8 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <p className="text-sm font-medium text-marketing-secondary text-center">
          Works with your bank
        </p>
      </div>
      
      <div className="relative w-full overflow-hidden flex items-center">
        {/* Optional gradients for fading edges if desired, but we'll leave it clean for now */}
        
        <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
          {repeatedMarks.map((mark, index) => (
            <div
              key={`${mark}-${index}`}
              className="flex items-center justify-center px-8 md:px-16"
            >
              <div
                className="font-heading text-xl md:text-2xl font-bold tracking-tight text-marketing-text opacity-40 hover:opacity-100 transition-opacity grayscale hover:grayscale-0 cursor-default whitespace-nowrap"
              >
                {mark}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
