import type { Metadata } from "next";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Thanks - You Are On The List",
  description: "Thanks for joining the Dominion Homes buyer and investor list.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function BuyersThankYouPage() {
  return (
    <section className="relative overflow-hidden py-28 sm:py-36">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-stone-50 via-forest-50/20 to-stone-50" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-[420px] w-[420px] rounded-full bg-forest-100/35 blur-3xl" />

      <div className="relative mx-auto max-w-4xl px-5 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-stone-200 bg-white p-8 shadow-soft sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-forest-50">
            <svg
              className="h-8 w-8 text-forest-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="mt-6 text-center font-display text-4xl text-ink-700 sm:text-5xl">
            Thanks - you are on the list.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-base leading-relaxed text-ink-400 sm:text-lg">
            We received your buyer/investor profile. If something looks like a fit, someone from
            Dominion Homes may reach out directly. Questions now? Call or text{" "}
            <a
              href={`tel:${SITE.phone.replace(/\D/g, "")}`}
              className="font-semibold text-forest-600 transition-colors hover:text-forest-700"
            >
              {SITE.phone}
            </a>
            .
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-2.5">
            {["No obligation", "Local follow-up", "Criteria saved", "Fit-based outreach"].map((item) => (
              <span
                key={item}
                className="rounded-full border border-stone-200 bg-stone-50 px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-500"
              >
                {item}
              </span>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-relaxed text-ink-400">
            Submission does not guarantee deal access, investment placement, or any specific outcome.
            Opportunities are subject to fit, availability, and applicable laws.
          </div>
        </div>
      </div>
    </section>
  );
}
