"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Section } from "./section";

export function CryptoFeature() {
  return (
    <Section className="py-24 md:py-32 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 items-center">
        
        {/* Left Column: Text (Order first on desktop, last on mobile) */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="order-last lg:order-first flex flex-col items-start lg:pr-12"
        >
          <span className="inline-block mb-4 text-sm font-bold tracking-wider text-green-600 dark:text-green-500 uppercase">
            Transparent Exchange
          </span>
          <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight text-marketing-text mb-6 leading-[1.1]">
            See the real rate. Every time.
          </h2>
          <p className="text-lg text-marketing-secondary mb-8 leading-relaxed">
            Every crypto conversion shows the exact reference market rate alongside our quoted rate before you confirm. We believe in earning your trust through total transparency—what you see is exactly what you get, with zero hidden spreads.
          </p>
        </motion.div>

        {/* Right Column: Visual (Order first on mobile) */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="order-first lg:order-last relative w-full aspect-square md:aspect-[4/3] lg:aspect-square flex items-center justify-center lg:justify-end"
        >
          {/* Background Floating Coins Animation */}
          <div className="absolute inset-0 w-full h-full lg:w-[120%] lg:-right-[20%] rounded-[2rem] overflow-hidden bg-marketing-bg border border-marketing-border shadow-xl flex items-center justify-center">
            {/* Ambient Glow */}
            <div className="absolute w-[60%] h-[60%] bg-green-500/10 dark:bg-green-500/20 blur-[80px] rounded-full" />
            
            {/* Tether Coin */}
            <motion.div
              animate={{ y: [-15, 15, -15], rotateY: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="absolute top-[20%] left-[20%] w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-[0_10px_30px_rgba(34,197,94,0.4)] flex items-center justify-center text-white font-bold text-3xl border border-white/20 z-0"
              style={{ transformStyle: "preserve-3d" }}
            >
              ₮
            </motion.div>

            {/* Bitcoin Coin */}
            <motion.div
              animate={{ y: [15, -15, 15], rotateY: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-[20%] left-[40%] w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-[0_10px_30px_rgba(249,115,22,0.4)] flex items-center justify-center text-white font-bold text-2xl border border-white/20 z-0"
            >
              ₿
            </motion.div>

            {/* Ethereum Coin */}
            <motion.div
              animate={{ y: [-10, 10, -10], rotateX: [0, 15, 0] }}
              transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 2 }}
              className="absolute top-[30%] right-[20%] w-14 h-14 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 shadow-[0_10px_30px_rgba(99,102,241,0.4)] flex items-center justify-center text-white font-bold text-xl border border-white/20 z-0"
            >
              Ξ
            </motion.div>
          </div>

          {/* Floating UI Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, rotate: 0 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 3 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="relative z-20 bg-marketing-surface p-6 md:p-8 rounded-3xl shadow-2xl border border-marketing-border w-[90%] sm:w-[360px] right-4 sm:right-0"
          >
            <div className="flex flex-col space-y-6">
              <div className="flex items-center justify-between pb-6 border-b border-marketing-border">
                <span className="text-sm font-medium text-marketing-secondary">Selling 50 USDT</span>
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-500 flex items-center justify-center text-xs font-bold">
                  $
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-marketing-secondary">Market reference rate</span>
                  <span className="text-sm font-medium text-marketing-text font-mono">₦1,415/$</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-marketing-secondary">Your quoted rate</span>
                  <span className="text-sm font-bold text-marketing-text font-mono">₦1,378/$</span>
                </div>
              </div>

              <div className="pt-6 border-t border-marketing-border">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-marketing-text">You receive</span>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-500 font-mono">₦68,900</span>
                </div>
              </div>

              <button className="w-full mt-2 px-4 py-3 bg-marketing-text text-marketing-bg rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
                Confirm Sale
              </button>
            </div>
          </motion.div>
        </motion.div>

      </div>
    </Section>
  );
}
