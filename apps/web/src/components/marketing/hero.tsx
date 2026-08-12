"use client";

import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { ArrowRight, LayoutGrid, Smartphone, Zap, Plane, Gift, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import { Section } from "./section";

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-hidden pt-24 pb-16 lg:pt-32">
      {/* Background Parallax Image */}
      <motion.div
        className="absolute inset-0 z-0 opacity-[0.15] dark:opacity-[0.07]"
        style={{ y: backgroundY }}
      >
        <Image
          src="/images/landing/hero.jpg"
          alt=""
          fill
          className="object-cover"
          priority
        />
      </motion.div>

      {/* Main Content using Section wrapper with grain */}
      <Section
        variant="grain"
        className="min-h-full py-0 md:py-0 bg-transparent flex items-center z-10"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center pt-12">
          {/* Left Column (58%) */}
          <motion.div
            className="lg:col-span-7 flex flex-col items-start"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >


            <motion.h1
              variants={fadeUp}
              className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-marketing-text mb-6 leading-[1.1]"
            >
              The unified wallet <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-brand-gradient">
                for everything.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-lg md:text-xl text-marketing-secondary max-w-2xl mb-10 leading-relaxed"
            >
              Convert crypto instantly, book global flights, and settle your daily bills—all from one powerful balance built for Nigeria.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-16"
            >
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-3.5 text-base font-medium text-white bg-brand-gradient rounded-full hover:opacity-90 transition-opacity shadow-lg flex items-center justify-center gap-2"
              >
                Get Started free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="#how-it-works"
                className="w-full sm:w-auto px-8 py-3.5 text-base font-medium text-marketing-text bg-transparent border-2 border-marketing-border rounded-full hover:bg-marketing-surface transition-colors flex items-center justify-center"
              >
                See how it works
              </Link>
            </motion.div>


          </motion.div>

          {/* Right Column (42%) - Dashboard Mockup */}
          <motion.div
            className="lg:col-span-5 relative w-full h-[600px] lg:h-[680px] -mx-4 sm:mx-0 lg:ml-8 mt-12 lg:mt-0 order-first lg:order-last"
            initial={{ opacity: 0, x: 50, rotate: 0 }}
            animate={{ opacity: 1, x: 0, rotate: 3 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            <div className="absolute inset-0 right-[-20%] lg:right-[-40%] rounded-3xl bg-white dark:bg-[#09090B] border border-marketing-border shadow-2xl overflow-hidden flex flex-col">
              {/* Mockup Body (App Overview) */}
              <div className="p-6 flex-1 bg-marketing-surface overflow-y-auto space-y-6">
                
                {/* Hero Balance Card */}
                <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-white shadow-lg">
                  <div className="relative z-10">
                    <p className="text-sm font-medium text-white/70">Total Balance</p>
                    <p className="mt-1 font-mono text-4xl font-bold">₦847,250.00</p>
                    <div className="mt-6 flex gap-3">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/15 text-sm font-medium backdrop-blur-sm">
                        Add Money
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/15 text-sm font-medium backdrop-blur-sm">
                        Withdraw
                      </div>
                    </div>
                  </div>
                  <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
                  <div className="absolute -bottom-12 -right-4 h-32 w-32 rounded-full bg-white/5" />
                </div>

                {/* Quick Actions */}
                <div className="space-y-3">
                  <h2 className="text-[15px] font-extrabold text-marketing-text px-1">Quick actions</h2>
                  <div className="rounded-3xl p-2 bg-marketing-bg border border-marketing-border shadow-sm">
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { icon: Smartphone, label: "Airtime" },
                        { icon: Zap, label: "Data" },
                        { icon: Plane, label: "Flights" },
                        { icon: LayoutGrid, label: "More" },
                      ].map((action, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-marketing-surface">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400">
                            <action.icon className="h-5 w-5" />
                          </div>
                          <span className="text-[11px] font-bold text-marketing-text text-center">{action.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Rate Watch */}
                <div className="rounded-[24px] border border-marketing-border bg-marketing-bg shadow-sm p-6">
                  <div className="mb-4">
                    <h2 className="text-[15px] font-extrabold text-marketing-text">Rate watch</h2>
                    <p className="text-[13px] font-medium text-marketing-secondary mt-0.5">USDT → NGN, updated hourly</p>
                  </div>
                  
                  <div className="flex items-center gap-3 mb-4">
                    <span className="font-sans tabular-nums text-[28px] font-extrabold tracking-tighter text-marketing-text leading-none">
                      ₦1,562.50
                    </span>
                    <div className="inline-flex items-center gap-0.5 rounded-md bg-green-50 dark:bg-green-900/30 px-1.5 py-0.5 text-[11px] font-bold text-green-700 dark:text-green-400">
                      <ArrowUpRight className="h-3 w-3" />
                      0.8%
                    </div>
                  </div>
                  
                  <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-50 dark:bg-violet-900/20 py-3 text-sm font-bold text-violet-700 dark:text-violet-400">
                    <Activity className="h-4 w-4" />
                    Convert Crypto
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </Section>
    </div>
  );
}
