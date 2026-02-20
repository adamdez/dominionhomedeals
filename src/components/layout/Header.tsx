// src/components/layout/Header.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "How It Works", href: "/how-we-work" },
  { label: "Areas We Serve", href: "/neighborhoods" },
  { label: "About Us", href: "/about" },
] as const;

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-stone-50/95 backdrop-blur-md shadow-soft py-3"
          : "bg-transparent py-5"
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 sm:px-6 lg:px-8">
        {/* Logo — text for now, replace with image when uploaded */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <Image
            src="/images/logo.svg"
            alt="Dominion Homes logo"
            width={36}
            height={36}
            className="transition-transform group-hover:scale-105"
            priority
          />
          <div className="flex flex-col leading-tight">
            <span className="font-display text-base text-ink-600">
              Dominion Homes
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-forest-400">
              Cash Home Buyers
            </span>
          </div>
        </Link>

        {/* Desktop */}
        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink-400 transition-colors hover:text-forest-600"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={`tel:${SITE.phone.replace(/\D/g, "")}`}
            className="text-sm font-semibold text-ink-500"
          >
            {SITE.phone}
          </a>
          <a href="#get-offer" className="btn-primary text-sm !px-5 !py-2.5">
            Get My Cash Offer
          </a>
        </nav>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="flex h-9 w-9 items-center justify-center rounded-lg md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          <div className="flex flex-col gap-[5px]">
            <span className={cn("h-[2px] w-5 bg-ink-500 transition-all", open && "translate-y-[7px] rotate-45")} />
            <span className={cn("h-[2px] w-5 bg-ink-500 transition-all", open && "opacity-0")} />
            <span className={cn("h-[2px] w-5 bg-ink-500 transition-all", open && "-translate-y-[7px] -rotate-45")} />
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "absolute left-0 right-0 top-full overflow-hidden bg-stone-50/98 backdrop-blur-lg transition-all duration-300 md:hidden",
          open ? "max-h-80 border-b border-stone-200 shadow-soft" : "max-h-0"
        )}
      >
        <nav className="flex flex-col gap-1 px-5 py-4">
          {NAV.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-4 py-2.5 text-[15px] font-medium text-ink-500 hover:bg-forest-50"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={`tel:${SITE.phone.replace(/\D/g, "")}`}
            className="rounded-lg px-4 py-2.5 text-[15px] font-semibold text-ink-500"
          >
            {SITE.phone}
          </a>
          <a href="#get-offer" onClick={() => setOpen(false)} className="btn-primary mt-2 text-center">
            Get My Cash Offer
          </a>
        </nav>
      </div>
    </header>
  );
}
