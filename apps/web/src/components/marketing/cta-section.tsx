"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Apple, Play } from "lucide-react";
import { Section } from "./section";

export function CtaSection() {
  return (
    <Section variant="grain" className="py-24 md:py-32 bg-brand-gradient text-white overflow-hidden relative">
      {/* Decorative background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-4xl bg-white/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto px-4"
      >
        <h2 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
          Ready to Pod up?
        </h2>
        <p className="text-xl md:text-2xl text-white/90 mb-10 leading-relaxed max-w-2xl">
          Join thousands of Nigerians splitting data costs, paying bills instantly, and exchanging crypto with total transparency.
        </p>
        
        <Link
          href="/register"
          className="px-10 py-5 text-lg font-bold text-violet-950 bg-white rounded-full hover:bg-marketing-surface transition-colors shadow-2xl hover:shadow-xl mb-12 transform hover:scale-105 transition-all duration-300"
        >
          Create free account
        </Link>

        {/* App Store Placeholders */}
        <div className="flex flex-col items-center">
          <span className="text-sm font-medium text-white/70 mb-4 uppercase tracking-widest">
            Native apps coming soon
          </span>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-black/20 border border-white/10 backdrop-blur-sm opacity-75 cursor-not-allowed">
              <Apple className="w-6 h-6" />
              <div className="flex flex-col items-start">
                <span className="text-[10px] leading-none text-white/70">Available soon on</span>
                <span className="text-sm font-semibold leading-none">App Store</span>
              </div>
            </div>
            <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-black/20 border border-white/10 backdrop-blur-sm opacity-75 cursor-not-allowed">
              <Play className="w-6 h-6 fill-current" />
              <div className="flex flex-col items-start">
                <span className="text-[10px] leading-none text-white/70">Available soon on</span>
                <span className="text-sm font-semibold leading-none">Google Play</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Section>
  );
}
