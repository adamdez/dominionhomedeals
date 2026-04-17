import type { Metadata } from "next";
import Script from "next/script";
import { SITE } from "@/lib/constants";
import { getSellTrustStripItems } from "@/lib/sell-proof";

export const metadata: Metadata = {
  title: "Thanks - We Got Your Info",
  description: "Thanks for reaching out to Dominion Home Deals.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SellThankYouPage() {
  const trustItems = getSellTrustStripItems();

  return (
    <>
      <Script id="google-ads-lead-form-conversion" strategy="afterInteractive">
        {`
          window.gtag && window.gtag('event', 'conversion', {
            send_to: 'AW-18000301728/LJHYCOnlx4QcEKCdm4dD',
            value: 1.0,
            currency: 'USD'
          });
        `}
      </Script>

      <section className="relative overflow-hidden py-28 sm:py-36">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-stone-50 via-forest-50/20 to-stone-50" />
        <div className="pointer-events-none absolute -top-20 -right-20 h-[420px] w-[420px] rounded-full bg-forest-100/35 blur-3xl" />

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
              Thanks - we got your info. We&apos;ll reach out within 1 business hour.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-center text-base leading-relaxed text-ink-400 sm:text-lg">
              Keep an eye on your phone and email. If it&apos;s urgent, call us at{" "}
              <a
                href={`tel:${SITE.phone.replace(/\D/g, "")}`}
                className="font-semibold text-forest-600 transition-colors hover:text-forest-700"
              >
                {SITE.phone}
              </a>
              .
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-2.5">
              {trustItems.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-stone-200 bg-stone-50 px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-500"
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                "No fees, no commissions, no repairs.",
                "We close on your timeline - 7 days or 60 days.",
                "Your info stays private.",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[24px] border border-stone-200 bg-stone-50 px-5 py-4 text-sm font-medium text-ink-500"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
