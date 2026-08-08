"use client";

import React from "react";
import { motion } from "framer-motion";

const wordmarks = ["Wema Bank", "Paystack", "VTpass", "NOWPayments"];

export function TrustBar() {
  return (
    <div className="w-full bg-marketing-surface/30 border-y border-marketing-border py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
          <p className="text-sm font-medium text-marketing-secondary whitespace-nowrap">
            Works with your bank
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {wordmarks.map((mark, index) => (
              <motion.div
                key={mark}
                className="font-heading text-xl md:text-2xl font-bold tracking-tight text-marketing-text opacity-40 hover:opacity-100 transition-opacity grayscale hover:grayscale-0 cursor-default"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {mark}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
