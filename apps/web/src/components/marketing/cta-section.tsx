"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Apple, Play } from "lucide-react";
import { Section } from "./section";

export function CtaSection() {
  return (
    <Section variant="grain" className="py-12 md:py-20 bg-brand-gradient text-trueWhite overflow-hidden relative">
      {/* Decorative background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-4xl bg-white/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto px-4"
      >
        <h2 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-trueWhite">
          Ready to move up?
        </h2>
        <p className="text-xl md:text-2xl text-trueWhite/90 mb-10 leading-relaxed max-w-2xl">
          Join thousands of Nigerians receiving money, paying bills instantly, and exchanging crypto with total transparency.
        </p>
        
        <Link
          href="/register"
          className="px-10 py-5 text-lg font-bold text-trueWhite bg-violet-600 hover:bg-violet-500 transition-colors shadow-2xl hover:shadow-xl mb-12 transform hover:scale-105 transition-all duration-150 rounded-full"
        >
          Create free account
        </Link>
      </motion.div>
    </Section>
  );
}
