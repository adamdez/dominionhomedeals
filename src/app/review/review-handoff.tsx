"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, MessageSquareHeart } from "lucide-react";
import { useEffect, useState } from "react";

type ReviewHandoffProps = {
  reviewUrl: string;
};

export function ReviewHandoff({ reviewUrl }: ReviewHandoffProps) {
  const [redirecting, setRedirecting] = useState(true);

  useEffect(() => {
    const isPreview = new URLSearchParams(window.location.search).has("preview");
    if (isPreview) {
      setRedirecting(false);
      return;
    }

    const timer = window.setTimeout(() => {
      window.location.replace(reviewUrl);
    }, 650);

    return () => window.clearTimeout(timer);
  }, [reviewUrl]);

  return (
    <div className="relative isolate flex min-h-[100svh] items-center justify-center overflow-hidden bg-stone-50 px-5 py-10 sm:px-6">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-10 h-72 bg-gradient-to-b from-forest-100/80 via-amber-50/40 to-transparent"
      />
      <div
        aria-hidden="true"
        className="absolute -left-24 bottom-[-7rem] -z-10 h-80 w-80 rounded-full bg-forest-100/60 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -right-28 top-[-8rem] -z-10 h-80 w-80 rounded-full bg-amber-100/70 blur-3xl"
      />

      <div className="w-full max-w-xl">
        <Link
          href="/"
          aria-label="Dominion Homes home"
          className="mx-auto mb-7 flex w-fit items-center gap-3 rounded-full px-3 py-2 transition-colors hover:bg-white/70"
        >
          <Image src="/images/logo-mark.webp" alt="" width={44} height={44} priority />
          <span className="text-left leading-tight">
            <span className="block font-display text-lg text-ink-600">Dominion Homes</span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-forest-500">
              Spokane &amp; North Idaho
            </span>
          </span>
        </Link>

        <section className="rounded-[2rem] border border-stone-200/90 bg-white/95 p-7 text-center shadow-elevated backdrop-blur sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-forest-50 text-forest-600 ring-1 ring-forest-100">
            <MessageSquareHeart aria-hidden="true" className="h-8 w-8" strokeWidth={1.8} />
          </div>

          <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-forest-500">Thank you</p>
          <h1 className="mt-3 font-display text-[clamp(2rem,7vw,3.25rem)] leading-[1.08] tracking-[-0.025em] text-ink-600 text-balance">
            Would you share your experience?
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-ink-400 sm:text-lg">
            Your honest feedback helps local homeowners know what it is like to work with Dominion Homes.
          </p>

          <a
            href={reviewUrl}
            data-testid="google-review-link"
            className="btn-primary mt-7 min-h-14 w-full gap-2 text-base sm:w-auto sm:min-w-72"
          >
            Leave a Google review
            <ArrowUpRight aria-hidden="true" className="h-5 w-5" />
          </a>

          <div className="mt-5 flex items-center justify-center gap-2 text-sm text-ink-300" aria-live="polite">
            <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-forest-400" />
            <span>{redirecting ? "Opening Google reviews…" : "You’ll continue securely to Google."}</span>
          </div>
        </section>

        <p className="mx-auto mt-6 max-w-md text-center text-xs leading-relaxed text-stone-500">
          Google may ask you to sign in before posting. Dominion Homes cannot see drafts or account information.
        </p>
      </div>
    </div>
  );
}
