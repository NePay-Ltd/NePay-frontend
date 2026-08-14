"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <img src="/logo.png" alt="NePay Logo" className="h-8 w-8 object-contain transition-transform group-hover:scale-105" />
          <span className="font-heading text-xl font-bold tracking-tight text-marketing-text">
            NePay
          </span>
        </Link>

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
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-marketing-text hover:bg-marketing-surface rounded-full transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="px-5 py-2 text-sm font-medium text-white bg-brand-gradient rounded-full hover:opacity-90 transition-opacity shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
