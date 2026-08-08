"use client";

import React from "react";
import { motion } from "framer-motion";
import { Smartphone, Wifi, Zap, Tv, Gift, Plane } from "lucide-react";
import { Section } from "./section";

export function BillsFeature() {
  const services = [
    { name: "Airtime", icon: Smartphone, color: "text-violet-600 dark:text-violet-400" },
    { name: "Data", icon: Wifi, color: "text-violet-600 dark:text-violet-400" },
    { name: "Electricity", icon: Zap, color: "text-amber-500" },
    { name: "Cable TV", icon: Tv, color: "text-blue-500" },
    { name: "Gift Cards", icon: Gift, color: "text-pink-500" },
    { name: "Flights", icon: Plane, color: "text-teal-500" },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.95 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  return (
    <Section className="py-24 md:py-32 bg-marketing-bg overflow-hidden border-t border-marketing-border">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 items-center">
        
        {/* Left Column: Visual (Order first on all screens) */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative w-full aspect-square md:aspect-[4/3] lg:aspect-square flex items-center justify-center lg:justify-start"
        >
          {/* Subtle Background Glow instead of image */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-violet-400/20 dark:bg-violet-600/20 blur-[100px] rounded-full" />

          {/* Floating UI Card - Tile Grid */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, rotate: 0 }}
            whileInView={{ opacity: 1, scale: 1, rotate: -2 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="relative z-20 bg-marketing-surface p-8 md:p-10 rounded-[2.5rem] shadow-2xl border border-marketing-border w-[90%] max-w-[420px] left-4 sm:left-0"
          >
            <div className="mb-8">
              <h3 className="text-xl font-bold text-marketing-text font-heading">
                Quick Actions
              </h3>
              <p className="text-sm text-marketing-secondary mt-1">Pay instantly from your balance.</p>
            </div>

            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
              className="grid grid-cols-3 gap-4 sm:gap-6"
            >
              {services.map((service, i) => (
                <motion.div 
                  key={service.name} 
                  variants={itemVariants}
                  className="flex flex-col items-center gap-3 group cursor-default"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-marketing-bg border border-marketing-border flex items-center justify-center group-hover:scale-105 group-hover:shadow-md transition-all duration-300">
                    <service.icon className={`w-6 h-6 sm:w-7 sm:h-7 ${service.color}`} />
                  </div>
                  <span className="text-xs font-medium text-marketing-secondary group-hover:text-marketing-text transition-colors text-center leading-tight">
                    {service.name}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Right Column: Text */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="lg:col-span-1 flex flex-col items-start lg:pl-12"
        >
          <span className="inline-block mb-4 text-sm font-bold tracking-wider text-violet-600 dark:text-violet-400 uppercase">
            Universal Wallet
          </span>
          <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight text-marketing-text mb-6 leading-[1.1]">
            Every bill, one balance.
          </h2>
          <p className="text-lg text-marketing-secondary mb-8 leading-relaxed">
            Settle your electricity tokens, renew your cable TV, top up airtime and data, or purchase global gift cards instantly. It all runs directly from your unified NePay balance—fast, secure, and with no external card required.
          </p>
        </motion.div>

      </div>
    </Section>
  );
}
