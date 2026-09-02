import React from "react";
import Link from "next/link";
import { Twitter, Instagram, Linkedin } from "lucide-react";;

export function Footer() {
  return (
    <footer className="bg-marketing-bg border-t border-marketing-border pt-16 pb-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4 group inline-flex">
              <img src="/logo.png" alt="NePay Logo" className="h-7 w-7 object-contain transition-transform group-hover:scale-105" />
              <span className="font-heading text-xl font-bold tracking-tight text-marketing-text">
                NePay
              </span>
            </Link>
            <p className="text-marketing-secondary text-sm leading-relaxed max-w-xs mb-8">
              The universal wallet for groups, bills, and transparent crypto conversions. Built for Nigeria.
            </p>
            <div className="flex items-center gap-4">
              <Link href="#" className="w-10 h-10 rounded-full bg-marketing-surface border border-marketing-border flex items-center justify-center text-marketing-secondary hover:text-marketing-text hover:border-marketing-text transition-colors">
                <Twitter className="w-4 h-4 fill-current" />
                <span className="sr-only">Twitter / X</span>
              </Link>
              <Link href="#" className="w-10 h-10 rounded-full bg-marketing-surface border border-marketing-border flex items-center justify-center text-marketing-secondary hover:text-marketing-text hover:border-marketing-text transition-colors">
                <Instagram className="w-4 h-4" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link href="#" className="w-10 h-10 rounded-full bg-marketing-surface border border-marketing-border flex items-center justify-center text-marketing-secondary hover:text-marketing-text hover:border-marketing-text transition-colors">
                <Linkedin className="w-4 h-4 fill-current" />
                <span className="sr-only">LinkedIn</span>
              </Link>
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="font-bold text-marketing-text mb-4">Product</h4>
            <ul className="space-y-3">
              <li><Link href="#how-it-works" className="text-sm text-marketing-secondary hover:text-marketing-text transition-colors">Services</Link></li>
              <li><Link href="#rates" className="text-sm text-marketing-secondary hover:text-marketing-text transition-colors">Rates</Link></li>
              <li><Link href="#security" className="text-sm text-marketing-secondary hover:text-marketing-text transition-colors">Security</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-marketing-text mb-4">Company</h4>
            <ul className="space-y-3">
              <li><Link href="#" className="text-sm text-marketing-secondary hover:text-marketing-text transition-colors">About</Link></li>
              <li><Link href="#" className="text-sm text-marketing-secondary hover:text-marketing-text transition-colors">Careers</Link></li>
              <li><Link href="#" className="text-sm text-marketing-secondary hover:text-marketing-text transition-colors">Blog</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-marketing-text mb-4">Legal</h4>
            <ul className="space-y-3">
              <li><Link href="#" className="text-sm text-marketing-secondary hover:text-marketing-text transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="text-sm text-marketing-secondary hover:text-marketing-text transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="text-sm text-marketing-secondary hover:text-marketing-text transition-colors">Compliance</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Line / Disclaimer */}
        <div className="pt-8 border-t border-marketing-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-marketing-secondary text-center md:text-left">
            &copy; {new Date().getFullYear()} NePay. All rights reserved.
          </p>
          <p className="text-[10px] sm:text-xs text-marketing-secondary/60 text-center md:text-right max-w-xl leading-relaxed">
            Important: Any crypto conversion cashback offered is a variable, execution-linked bonus and should never be considered a guaranteed return, yield, or interest.
          </p>
        </div>
      </div>
    </footer>
  );
}
