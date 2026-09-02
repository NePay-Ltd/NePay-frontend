"use client";

import React from "react";
import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import { Star } from "lucide-react";;
import { Section } from "./section";

const testimonials = [
  {
    quote: "Receiving USDT and having it instantly available as Naira in my balance feels like magic. Best wallet I've used.",
    name: "Chidinma A.",
    location: "Lagos",
    avatar: "/images/landing/avatars/avatar-1.jpg",
  },
  {
    quote: "I finally stopped losing money to hidden exchange spreads. The side-by-side rates are a game changer.",
    name: "Tobi O.",
    location: "Abuja",
    avatar: "/images/landing/avatars/avatar-2.jpg",
  },
  {
    quote: "Electricity tokens in seconds. No failed transactions, no waiting. It just works.",
    name: "Ngozi E.",
    location: "Port Harcourt",
    avatar: "/images/landing/avatars/avatar-3.svg",
  },
  {
    quote: "Signed up and verified my account in literally two minutes. Support was instantly helpful when I asked a question.",
    name: "Emmanuel U.",
    location: "Lagos",
    avatar: "/images/landing/avatars/avatar-4.svg",
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

export function Testimonials() {
  return (
    <Section className="py-24 md:py-32 bg-marketing-bg overflow-hidden">
      <div className="flex flex-col items-center text-center mb-12 md:mb-20">
        <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight text-marketing-text">
          Don&apos;t just take our word for it.
        </h2>
      </div>

      <div className="relative w-full">
        {/* Horizontal scroll on mobile, grid on desktop */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="flex overflow-x-auto pb-8 -mx-4 px-4 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-4 gap-6 snap-x snap-mandatory hide-scrollbar"
        >
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              variants={cardVariants}
              className="flex-none w-[280px] sm:w-[320px] lg:w-auto snap-center bg-marketing-surface border border-marketing-border p-6 md:p-8 rounded-3xl flex flex-col justify-between"
            >
              <div>
                <div className="flex gap-1 mb-4 text-amber-500">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-marketing-text font-medium text-lg leading-relaxed mb-8">
                  &quot;{t.quote}&quot;
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative w-12 h-12 rounded-full border border-marketing-border overflow-hidden bg-marketing-bg shrink-0">
                  <Image src={t.avatar} alt={t.name} fill className="object-cover" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-marketing-text text-sm">{t.name}</span>
                  <span className="text-marketing-secondary text-xs">{t.location}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
      
      {/* CSS snippet to hide scrollbar for webkit (Chrome/Safari) */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </Section>
  );
}
