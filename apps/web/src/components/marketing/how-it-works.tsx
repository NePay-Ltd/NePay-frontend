"use client";

import React from "react";
import { motion } from "framer-motion";
import { Section } from "./section";

const steps = [
  {
    title: "Create your account & verify in minutes",
    description: "Download the app, sign up with your phone number, and complete a quick KYC to unlock full limits.",
  },
  {
    title: "Fund your wallet — bank, card, or crypto",
    description: "Move money into NePay instantly via bank transfer, your debit card, or by converting your crypto.",
  },
  {
    title: "Convert crypto to Naira instantly",
    description: "Receive any supported crypto and it will instantly be converted to Naira for spending, or settle your bills directly.",
  },
  {
    title: "Track everything, transparently, in one place.",
    description: "Monitor your balances and review side-by-side exchange rates before confirming any transaction.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export function HowItWorks() {
  return (
    <Section id="how-it-works" className="py-24 md:py-32 bg-marketing-surface border-t border-marketing-border overflow-hidden">
      <div className="flex flex-col items-center text-center mb-16 md:mb-24">
        <span className="inline-block mb-4 text-sm font-bold tracking-wider text-violet-600 dark:text-violet-400 uppercase">
          Simple Process
        </span>
        <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight text-marketing-text">
          How NePay works
        </h2>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="relative max-w-5xl mx-auto"
      >
        {/* Background Connecting Line (Desktop) */}
        <div className="hidden md:block absolute top-6 left-[12.5%] right-[12.5%] h-0.5 bg-marketing-border z-0" />
        
        {/* Animated Connecting Line (Desktop) */}
        <motion.div
          className="hidden md:block absolute top-6 left-[12.5%] h-0.5 bg-brand-gradient z-0 origin-left"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
          style={{ width: "75%" }}
        />

        {/* Background Connecting Line (Mobile) */}
        <div className="md:hidden absolute top-[24px] bottom-[24px] left-[24px] w-0.5 bg-marketing-border z-0" />

        {/* Animated Connecting Line (Mobile) */}
        <motion.div
          className="md:hidden absolute top-[24px] left-[24px] w-0.5 bg-brand-gradient z-0 origin-top"
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
          style={{ height: "calc(100% - 48px)" }}
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-6 relative z-10">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="flex flex-row md:flex-col items-start md:items-center gap-6 md:gap-8 text-left md:text-center"
            >
              {/* Numbered Circle */}
              <div className="relative shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-brand-gradient text-white font-bold text-lg shadow-lg">
                {index + 1}
              </div>

              {/* Text */}
              <div>
                <h3 className="text-lg font-bold text-marketing-text mb-2 font-heading leading-tight">
                  {step.title}
                </h3>
                <p className="text-sm text-marketing-secondary leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </Section>
  );
}
