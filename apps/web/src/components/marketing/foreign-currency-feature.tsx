"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, ArrowDownLeft, Landmark } from "lucide-react";
import { Section } from "./section";

export function ForeignCurrencyFeature() {
  const [step, setStep] = useState(0);

  // Auto-cycle the steps every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Section variant="default" className="overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Left Content */}
        <div className="flex flex-col items-start order-2 lg:order-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-bold mb-6 border border-blue-500/20">
            <Globe className="w-4 h-4" />
            CROSS-BORDER PAYMENTS
          </div>
          
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-marketing-text mb-6 leading-tight">
            Foreign currency. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              Without borders.
            </span>
          </h2>
          
          <p className="text-lg text-marketing-secondary leading-relaxed mb-8">
            Get your own foreign bank accounts in USD, EUR, and GBP. Receive payments from anywhere in the world and convert directly to your Naira balance instantly with the best market rates.
          </p>

          <div className="flex items-center gap-4 text-sm font-bold text-marketing-text">
             <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full border-2 border-marketing-surface bg-gray-100 dark:bg-gray-800 flex items-center justify-center">🇺🇸</div>
                <div className="w-8 h-8 rounded-full border-2 border-marketing-surface bg-gray-100 dark:bg-gray-800 flex items-center justify-center">🇪🇺</div>
                <div className="w-8 h-8 rounded-full border-2 border-marketing-surface bg-gray-100 dark:bg-gray-800 flex items-center justify-center">🇬🇧</div>
             </div>
             <span>Multi-currency accounts supported</span>
          </div>
        </div>

        {/* Right Content - App Mockup */}
        <div className="relative order-1 lg:order-2 flex justify-center lg:justify-end">
          
          {/* Decorative Background */}
          <div className="absolute top-1/2 left-1/2 lg:left-[60%] -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-blue-500/20 blur-[100px] rounded-full pointer-events-none" />

          {/* The Phone/App Container */}
          <div className="relative w-full max-w-[340px] h-[600px] bg-marketing-surface border border-marketing-border rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col z-10">
            
            {/* App Header */}
            <div className="px-6 pt-12 pb-4 bg-marketing-bg border-b border-marketing-border">
               <h3 className="text-lg font-bold text-marketing-text text-center">
                  {step === 0 ? "Your USD Account" : step === 1 ? "Receiving Funds" : "Converted to Naira"}
               </h3>
            </div>

            {/* App Body - Animated Screens */}
            <div className="relative flex-1 bg-marketing-surface p-5 overflow-hidden">
              <AnimatePresence mode="wait">
                
                {/* SCREEN 0: ACCOUNT DETAILS */}
                {step === 0 && (
                  <motion.div
                    key="step-0"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col h-full space-y-4"
                  >
                    <div className="bg-marketing-bg border border-marketing-border rounded-2xl p-5 space-y-4 shadow-sm">
                       <div className="flex items-center justify-between border-b border-marketing-border pb-4">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl">🇺🇸</div>
                             <div>
                                <p className="text-[10px] font-bold text-marketing-secondary uppercase">Balance</p>
                                <p className="text-xl font-bold text-marketing-text">$0.00</p>
                             </div>
                          </div>
                       </div>
                       <div className="space-y-3">
                          <div>
                             <p className="text-[10px] font-bold text-marketing-secondary uppercase">Account Name</p>
                             <p className="text-sm font-bold text-marketing-text">Dubem Doe</p>
                          </div>
                          <div>
                             <p className="text-[10px] font-bold text-marketing-secondary uppercase">Routing Number</p>
                             <p className="text-sm font-mono text-marketing-text">122105155</p>
                          </div>
                          <div>
                             <p className="text-[10px] font-bold text-marketing-secondary uppercase">Account Number</p>
                             <p className="text-sm font-mono text-marketing-text">3314059281</p>
                          </div>
                       </div>
                    </div>
                    
                    <div className="flex-1" />

                    {/* Button */}
                    <div className="w-full bg-marketing-bg border border-marketing-border text-marketing-text font-bold text-sm py-4 rounded-xl flex justify-center items-center gap-2">
                      <Landmark className="w-4 h-4" /> Share Details
                    </div>
                  </motion.div>
                )}

                {/* SCREEN 1: RECEIVING FUNDS */}
                {step === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col h-full justify-center items-center space-y-6"
                  >
                     <motion.div
                       initial={{ y: -50, opacity: 0 }}
                       animate={{ y: 0, opacity: 1 }}
                       transition={{ type: "spring", bounce: 0.5 }}
                       className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center"
                     >
                        <ArrowDownLeft className="w-8 h-8 text-blue-500" />
                     </motion.div>

                     <div className="text-center">
                        <h4 className="text-lg font-bold text-marketing-text">Incoming Transfer</h4>
                        <p className="text-sm text-marketing-secondary mt-1">From Deel Inc.</p>
                     </div>

                     <div className="text-4xl font-bold text-marketing-text">
                        +$2,500.00
                     </div>

                     <div className="w-full max-w-[200px] h-1.5 bg-marketing-bg rounded-full overflow-hidden">
                        <motion.div 
                           initial={{ width: "0%" }}
                           animate={{ width: "100%" }}
                           transition={{ duration: 3.5, ease: "linear" }}
                           className="h-full bg-blue-500"
                        />
                     </div>
                     <p className="text-xs text-marketing-secondary font-bold uppercase">Processing Deposit...</p>
                  </motion.div>
                )}

                {/* SCREEN 2: CONVERTED TO NAIRA */}
                {step === 2 && (
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col h-full space-y-4"
                  >
                    <div className="bg-gradient-to-br from-green-500/10 to-blue-500/5 border border-marketing-border rounded-2xl p-6 text-center shadow-sm">
                       <p className="text-[11px] font-bold text-marketing-secondary uppercase mb-2">Auto-Converted Balance</p>
                       <h2 className="text-3xl font-bold text-marketing-text mb-4">₦3,950,000</h2>
                       <div className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-600 px-3 py-1 rounded-full text-xs font-bold">
                          Rate: ₦1,580 / $1
                       </div>
                    </div>

                    <div className="bg-marketing-bg border border-marketing-border rounded-2xl p-4 space-y-3">
                       <h4 className="text-xs font-bold text-marketing-secondary uppercase mb-2">Recent Transactions</h4>
                       
                       <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-600">
                                <ArrowDownLeft className="w-4 h-4" />
                             </div>
                             <div>
                                <p className="text-sm font-bold text-marketing-text">Deposit from Deel</p>
                                <p className="text-xs text-marketing-secondary">Today, 14:30</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-sm font-bold text-green-600">+$2,500.00</p>
                          </div>
                       </div>
                       
                       <div className="flex justify-between items-center opacity-50">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
                                <Globe className="w-4 h-4" />
                             </div>
                             <div>
                                <p className="text-sm font-bold text-marketing-text">Auto-Conversion</p>
                                <p className="text-xs text-marketing-secondary">Today, 14:31</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-sm font-bold text-marketing-text">₦3,950,000</p>
                          </div>
                       </div>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
            
            {/* iOS Home Indicator */}
            <div className="h-1.5 w-32 bg-marketing-border rounded-full mx-auto my-2" />
          </div>
        </div>
      </div>
    </Section>
  );
}
