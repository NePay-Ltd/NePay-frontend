"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { PLAY_STORE_URL } from "./links";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

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
        scrolled || menuOpen
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
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {/* Get the app — before the auth buttons on desktop, before the hamburger on mobile */}
          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-sm font-semibold whitespace-nowrap text-marketing-text border border-marketing-border rounded-full hover:bg-marketing-surface transition-colors"
          >
            Get the app
          </a>

          {/* Desktop auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-marketing-text hover:bg-marketing-surface rounded-full transition-colors whitespace-nowrap"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="px-5 py-2 text-sm font-medium text-trueWhite bg-brand-gradient rounded-full hover:opacity-90 transition-opacity shadow-sm whitespace-nowrap"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-full border border-marketing-border bg-marketing-surface text-marketing-text"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {menuOpen && (
        <div className="md:hidden mt-3 border-t border-marketing-border bg-marketing-surface">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-1">
            {[
              { href: "#rates", label: "Rates" },
              { href: "#security", label: "Security" },
              { href: "#help", label: "Help" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={closeMenu}
                className="rounded-xl px-3 py-3 text-base font-medium text-marketing-text hover:bg-marketing-bg"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Link
                href="/login"
                onClick={closeMenu}
                className="rounded-full border border-marketing-border px-4 py-3 text-center text-sm font-semibold text-marketing-text"
              >
                Log in
              </Link>
              <Link
                href="/register"
                onClick={closeMenu}
                className="rounded-full bg-brand-gradient px-4 py-3 text-center text-sm font-semibold text-trueWhite"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
