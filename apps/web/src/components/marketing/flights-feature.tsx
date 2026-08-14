"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plane, PlaneTakeoff, PlaneLanding, Calendar, User, CheckCircle2, ChevronRight, ArrowRight } from "lucide-react";
import { Section } from "./section";

export function FlightsFeature() {
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
            <Plane className="w-4 h-4" />
            GLOBAL TRAVEL
          </div>
          
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-marketing-text mb-6 leading-tight">
            Global flights. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              Local payments.
            </span>
          </h2>
          
          <p className="text-lg text-marketing-secondary leading-relaxed mb-8">
            Book local and international flights directly within NePay. We instantly
            convert your Naira balance to settle the booking—no forex limits, no
            dollar cards needed, just instant ticketing.
          </p>

          <div className="flex items-center gap-4 text-sm font-bold text-marketing-text">
             <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full border-2 border-marketing-surface bg-gray-100 dark:bg-gray-800 flex items-center justify-center">🇬🇧</div>
                <div className="w-8 h-8 rounded-full border-2 border-marketing-surface bg-gray-100 dark:bg-gray-800 flex items-center justify-center">🇦🇪</div>
                <div className="w-8 h-8 rounded-full border-2 border-marketing-surface bg-gray-100 dark:bg-gray-800 flex items-center justify-center">🇺🇸</div>
             </div>
             <span>150+ Airlines supported worldwide</span>
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
                  {step === 0 ? "Book a Flight" : step === 1 ? "Select Flight" : "Ticket Confirmed"}
               </h3>
            </div>

            {/* App Body - Animated Screens */}
            <div className="relative flex-1 bg-marketing-surface p-5 overflow-hidden">
              <AnimatePresence mode="wait">
                
                {/* SCREEN 0: SEARCH */}
                {step === 0 && (
                  <motion.div
                    key="step-0"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col h-full space-y-4"
                  >
                    {/* From / To */}
                    <div className="bg-marketing-bg border border-marketing-border rounded-2xl p-4 space-y-4">
                       <div className="flex items-center gap-3 border-b border-marketing-border pb-3">
                          <PlaneTakeoff className="w-5 h-5 text-marketing-secondary" />
                          <div>
                             <p className="text-[10px] font-bold text-marketing-secondary uppercase">From</p>
                             <p className="text-sm font-bold text-marketing-text">Lagos (LOS)</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-3">
                          <PlaneLanding className="w-5 h-5 text-marketing-secondary" />
                          <div>
                             <p className="text-[10px] font-bold text-marketing-secondary uppercase">To</p>
                             <p className="text-sm font-bold text-marketing-text">London (LHR)</p>
                          </div>
                       </div>
                    </div>

                    {/* Date / Passengers */}
                    <div className="grid grid-cols-2 gap-3">
                       <div className="bg-marketing-bg border border-marketing-border rounded-2xl p-4 flex flex-col gap-1">
                          <Calendar className="w-4 h-4 text-marketing-secondary mb-1" />
                          <p className="text-[10px] font-bold text-marketing-secondary uppercase">Date</p>
                          <p className="text-sm font-bold text-marketing-text">Oct 12</p>
                       </div>
                       <div className="bg-marketing-bg border border-marketing-border rounded-2xl p-4 flex flex-col gap-1">
                          <User className="w-4 h-4 text-marketing-secondary mb-1" />
                          <p className="text-[10px] font-bold text-marketing-secondary uppercase">Travelers</p>
                          <p className="text-sm font-bold text-marketing-text">1 Adult</p>
                       </div>
                    </div>

                    <div className="flex-1" />

                    {/* Simulated Click Button */}
                    <motion.div
                      animate={{ scale: [1, 1, 0.95, 1] }}
                      transition={{ duration: 0.25, times: [0, 0.8, 0.9, 1] }}
                      className="w-full bg-blue-600 text-white font-bold text-sm py-4 rounded-xl flex justify-center items-center gap-2 shadow-lg shadow-blue-500/25"
                    >
                      Search Flights <ArrowRight className="w-4 h-4" />
                    </motion.div>
                  </motion.div>
                )}

                {/* SCREEN 1: SELECTION */}
                {step === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col space-y-3"
                  >
                    <p className="text-xs font-bold text-marketing-secondary px-1 mb-1">Oct 12 • LOS → LHR</p>
                    
                    {/* Flight Option 1 */}
                    <div className="bg-marketing-bg border border-marketing-border rounded-2xl p-4">
                       <div className="flex justify-between items-start mb-3">
                          <div className="text-sm font-bold text-marketing-text">British Airways</div>
                          <div className="text-sm font-bold text-marketing-text">₦1,250,000</div>
                       </div>
                       <div className="flex items-center justify-between text-xs font-medium text-marketing-secondary">
                          <span>08:40 LOS</span>
                          <div className="flex-1 border-t border-dashed border-marketing-border mx-2 relative">
                             <Plane className="w-3 h-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                          </div>
                          <span>15:10 LHR</span>
                       </div>
                    </div>

                    {/* Flight Option 2 (The selected one) */}
                    <motion.div 
                       animate={{ 
                          borderColor: ["var(--marketing-border)", "var(--marketing-border)", "#3b82f6", "#3b82f6"],
                          boxShadow: ["none", "none", "0 0 0 1px #3b82f6", "0 0 0 1px #3b82f6"],
                          backgroundColor: ["var(--marketing-bg)", "var(--marketing-bg)", "var(--marketing-bg)", "var(--marketing-bg)"]
                       }}
                       transition={{ duration: 2, times: [0, 0.6, 0.7, 1] }}
                       className="bg-marketing-bg border border-marketing-border rounded-2xl p-4 relative"
                    >
                       <div className="flex justify-between items-start mb-3">
                          <div className="text-sm font-bold text-marketing-text flex items-center gap-2">
                             Virgin Atlantic
                             <span className="text-[9px] bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded font-bold uppercase">Cheapest</span>
                          </div>
                          <div className="text-sm font-bold text-marketing-text">₦1,180,000</div>
                       </div>
                       <div className="flex items-center justify-between text-xs font-medium text-marketing-secondary">
                          <span>10:20 LOS</span>
                          <div className="flex-1 border-t border-dashed border-marketing-border mx-2 relative">
                             <Plane className="w-3 h-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                          </div>
                          <span>16:45 LHR</span>
                       </div>
                       
                       {/* Animated Cursor clicking it */}
                       <motion.div
                          initial={{ opacity: 0, x: 50, y: 50 }}
                          animate={{ opacity: [0, 1, 1, 0], x: [50, 0, 0, 0], y: [50, 0, 0, 0] }}
                          transition={{ duration: 2, times: [0, 0.5, 0.7, 1] }}
                          className="absolute right-4 bottom-2 z-20 pointer-events-none"
                       >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="drop-shadow-md">
                             <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.42c.45 0 .67-.54.35-.85L6.35 3.35a.5.5 0 0 0-.85.35Z" fill="#1e1e1e" stroke="white" strokeWidth="1.5"/>
                          </svg>
                       </motion.div>
                    </motion.div>

                  </motion.div>
                )}

                {/* SCREEN 3: SUCCESS */}
                {step === 2 && (
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col items-center justify-center h-full text-center px-4"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 15, delay: 0.2 }}
                      className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6"
                    >
                       <CheckCircle2 className="w-10 h-10 text-green-500" />
                    </motion.div>
                    
                    <h4 className="text-xl font-bold text-marketing-text mb-2">Ticket Booked!</h4>
                    <p className="text-sm font-medium text-marketing-secondary mb-8">
                       Your flight to London (LHR) is confirmed and the e-ticket has been sent to your email.
                    </p>

                    <div className="w-full bg-marketing-bg border border-marketing-border rounded-2xl p-4">
                       <p className="text-[11px] font-bold text-marketing-secondary uppercase mb-1">Paid From</p>
                       <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-marketing-text">NGN Wallet</span>
                          <span className="text-sm font-bold text-marketing-text">-₦1,180,000</span>
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
