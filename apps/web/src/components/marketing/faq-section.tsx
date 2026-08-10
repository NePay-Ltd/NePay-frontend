"use client";

import React from "react";
import { motion } from "framer-motion";
import { Section } from "./section";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Is my money safe with NePay?",
    answer: "Yes. All funds are held by our regulated banking partners, and every byte of data is secured using bank-grade encryption in transit and at rest. We also require BVN verification before unlocking full transaction limits to protect the network from fraud.",
  },

  {
    question: "Which banks can I link?",
    answer: "NePay connects securely with all major Nigerian banks, including Wema, Guaranty Trust Bank (GTB), Zenith, and Access Bank. You can fund your wallet directly via bank transfer or by linking a valid debit card.",
  },
  {
    question: "Is there a fee to join?",
    answer: "No, signing up and keeping an active NePay account is completely free. We clearly display any transaction fees or exchange rates side-by-side before you confirm a payment or conversion.",
  },
  {
    question: "How fast are withdrawals?",
    answer: "Withdrawals to your linked Nigerian bank account are processed instantly. In most cases, the funds will reflect in your bank account within seconds.",
  },
  {
    question: "Can I use NePay for crypto?",
    answer: "Yes, you can convert supported crypto assets directly into your NePay balance. All crypto transactions require strict identity verification (BVN/NIN), and we always display the reference market rate alongside our quoted rate before you confirm.",
  },
  {
    question: "Is NePay available outside Nigeria?",
    answer: "Currently, NePay is optimized for the Nigerian market, requiring a Nigerian phone number and BVN for verification. We are focused on providing the best possible infrastructure and experience locally before expanding.",
  },
];

export function FaqSection() {
  return (
    <Section id="help" className="py-24 md:py-32 bg-marketing-bg">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-3xl mx-auto"
      >
        <div className="text-center mb-16">
          <span className="inline-block mb-4 text-sm font-bold tracking-wider text-violet-600 dark:text-violet-400 uppercase">
            Got Questions?
          </span>
          <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight text-marketing-text">
            Frequently Asked Questions
          </h2>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left text-lg">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-base leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </Section>
  );
}
