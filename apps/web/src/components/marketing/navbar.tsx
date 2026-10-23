"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-150 ease-in-out border-b border-transparent",
        scrolled
          ? "bg-marketing-surface/80 backdrop-blur-md border-marketing-border py-3"
          : "bg-transparent py-5"
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-2">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <img src="/logo.png" alt="NePay Logo" className="h-8 w-8 object-contain transition-transform group-hover:scale-105" />
            <span className="font-heading text-xl font-bold tracking-tight text-marketing-text">
              NePay
            </span>
          </Link>
          <span className="hidden lg:inline-flex items-center pl-3 ml-1 border-l border-marketing-border/70">
            <span className="text-[11px] font-medium text-marketing-secondary/75 whitespace-nowrap">
              Powered by Circle Technology Limited
            </span>
          </span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="#rates"
            className="text-sm font-medium text-marketing-secondary hover:text-marketing-text transition-colors"
          >
            Rates
          </Link>
          <Link
            href="#security"
            className="text-sm font-medium text-marketing-secondary hover:text-marketing-text transition-colors"
          >
            Security
          </Link>
          <Link
            href="#help"
            className="text-sm font-medium text-marketing-secondary hover:text-marketing-text transition-colors"
          >
            Help
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex shrink-0 items-center gap-[clamp(0.25rem,1.5vw,1rem)]">
          <div className="flex items-center gap-[clamp(0.25rem,1.5vw,0.75rem)]">
            <Link
              href="/login"
              className="px-[clamp(0.6rem,2.5vw,1rem)] py-[clamp(0.4rem,1.5vw,0.5rem)] text-[clamp(0.8rem,3.4vw,0.875rem)] font-medium text-marketing-text hover:bg-marketing-surface rounded-full transition-colors whitespace-nowrap"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="px-[clamp(0.8rem,3vw,1.25rem)] py-[clamp(0.4rem,1.5vw,0.5rem)] text-[clamp(0.8rem,3.4vw,0.875rem)] font-medium text-white bg-brand-gradient rounded-full hover:opacity-90 transition-opacity shadow-sm whitespace-nowrap"
            >
              <span className="sm:hidden">Sign up</span>
              <span className="hidden sm:inline">Get Started</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
