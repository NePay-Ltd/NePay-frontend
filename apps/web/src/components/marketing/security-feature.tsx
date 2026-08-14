"use client";

import React from "react";
import { motion, type Variants } from "framer-motion";
import { ShieldCheck, Fingerprint, Search, Landmark } from "lucide-react";
import { Section } from "./section";
import { Grain } from "./grain";

const trustPoints = [
  {
    icon: ShieldCheck,
    title: "Bank-Grade Encryption",
    description: "Every byte of data is encrypted in transit and at rest, securing your information from end to end using modern cryptographic standards.",
  },
  {
    icon: Fingerprint,
    title: "Strict Identity Verification",
    description: "Robust BVN and NIN checks are required before any transaction, ensuring SEC-aligned compliance and protecting against fraud.",
  },
  {
    icon: Search,
    title: "Absolute Transparency",
    description: "Fees and exchange rates are displayed clearly and side-by-side before you confirm. No hidden spreads, ever.",
  },
  {
    icon: Landmark,
    title: "Regulated Banking Partners",
    description: "Your funds are securely held and moved exclusively through our network of established, regulated partner banks.",
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

export function SecurityFeature() {
  return (
    <Section id="security" className="relative w-full py-24 md:py-32 bg-[#17102E] text-[#F4F1FF] overflow-hidden" containerClassName="relative z-10">
      {/* Explicitly forcing dark theme text colors to contrast with the #17102E background */}
      <Grain opacity={0.05} />
      
      <div className="flex flex-col items-center text-center mb-16 md:mb-20">
          <span className="inline-block mb-4 text-sm font-bold tracking-wider text-[#C5AAFF] uppercase">
            Security & Trust
          </span>
          <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Built to be trusted with your money.
          </h2>
          <p className="text-lg text-[#B7ACD9] max-w-2xl">
            We prioritize the security of your funds and the privacy of your data above everything else. Our entire infrastructure is engineered for resilience.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto"
        >
          {trustPoints.map((point, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-start gap-6 p-8 rounded-3xl bg-[#0D0620]/50 border border-white/10 hover:bg-[#0D0620]/80 transition-colors"
            >
              <div className="flex shrink-0 items-center justify-center w-14 h-14 rounded-2xl bg-[#2A0080]/50 text-[#C5AAFF] border border-white/5">
                <point.icon className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-heading mb-3 text-[#F4F1FF]">
                  {point.title}
                </h3>
                <p className="text-base text-[#B7ACD9] leading-relaxed">
                  {point.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
    </Section>
  );
}
