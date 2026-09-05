"use client";

import * as React from "react";
import { Button } from "@/components/shared/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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

export default function FAQPage() {
    return (
        <div className="max-w-3xl mx-auto py-12 px-6">
            <div className="mb-8">
                <Link href="/about" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-4 -ml-1 px-1 py-1">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to About
                </Link>
                <h1 className="text-3xl font-bold text-slate-900">Frequently Asked Questions</h1>
            </div>
            
            <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-sm">
                <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, index) => (
                        <AccordionItem key={index} value={`item-${index}`}>
                        <AccordionTrigger className="text-left text-lg font-semibold text-slate-900">
                            {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-base leading-relaxed text-slate-600">
                            {faq.answer}
                        </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
                
                <div className="mt-12 p-6 bg-slate-50 border border-slate-100 rounded-xl text-center">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Still need help?</h3>
                    <p className="text-slate-600 mb-4">Our support team is available 24/7 to assist you.</p>
                    <Button variant="primary" asChild>
                        <a href="mailto:support@nepay.com.ng">Contact Support</a>
                    </Button>
                </div>
            </div>
        </div>
    );
}
