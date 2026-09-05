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
    question: "What can I do with NePay?",
    answer: "With NePay, you can receive and convert supported cryptocurrencies to Naira, pay everyday bills, sell gift cards and access other payment services from one app.",
  },
  {
    question: "How do I fund and withdraw from my NePay account?",
    answer: "You can fund your account using your personal virtual account or by depositing supported cryptocurrencies. You can withdraw your available Naira balance to a Nigerian bank account.",
  },
  {
    question: "How do crypto deposits work?",
    answer: "Select the cryptocurrency you want to deposit and follow the instructions shown in the app. Once your deposit is successfully confirmed, the Naira equivalent will be credited to your balance at the applicable rate shown for your transaction.",
  },
  {
    question: "What bills can I pay on NePay?",
    answer: "You can pay for airtime, mobile data, electricity, TV subscriptions and other supported services available in the app.",
  },
  {
    question: "What happens if my transaction fails?",
    answer: "If your account is debited for a transaction that later fails, the amount will be reversed once the failed transaction has been confirmed and processed.",
  },
  {
    question: "How do I sell a gift card?",
    answer: "Select the gift card you want to sell, enter the required details and submit it for verification. Once your gift card is successfully verified, the applicable Naira amount will be credited to your account.",
  },
  {
    question: "How do I get help if I have a problem?",
    answer: "If you have an issue with your account or a transaction, contact our support team at support@nepay.com.ng.",
  },
];

export function FaqSection() {
  return (
    <Section id="help" className="py-24 md:py-32 bg-marketing-bg">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.4, ease: "easeOut" }}
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
