import type { Metadata } from "next";
import Link from "next/link";
import { FadeIn } from "@/components/animations/FadeIn";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Spokane Seller Guide | Compare Your Options Before You Sell",
  description:
    "A practical guide for Spokane and North Idaho homeowners: when a cash sale makes sense, what to ask a buyer, and where to start if the house is inherited, distressed, or tenant-occupied.",
  alternates: { canonical: `${SITE.url}/sell/guide` },
  openGraph: {
    title: "Spokane Seller Guide | Dominion Homes",
    description:
      "Read the local seller guide before you decide. Compare a direct cash sale, understand the process, and learn what to ask any buyer.",
    url: `${SITE.url}/sell/guide`,
    type: "website",
  },
};

const START_HERE = [
  {
    title: "Inherited property",
    copy: "Start here if probate, family decisions, or cleanup are part of the picture.",
    href: "/sell/inherited",
  },
  {
    title: "Sell as-is",
    copy: "Start here if the house needs work and you do not want to repair it before selling.",
    href: "/sell/as-is",
  },
  {
    title: "Foreclosure pressure",
    copy: "Start here if timing is tight and you need to understand your options quickly.",
    href: "/sell/foreclosure",
  },
  {
    title: "Tired landlord",
    copy: "Start here if tenants, repairs, or turnover are making the property feel heavy.",
    href: "/sell/landlord",
  },
] as const;

const CASH_SALE_FIT = [
  "You need certainty and speed more than top-dollar retail exposure.",
  "The property needs repairs you do not want to fund or manage.",
  "You do not want showings, listing prep, staging, or open houses.",
  "There is a timeline issue: relocation, probate, debt pressure, vacancy, or tenant turnover.",
  "You want a simple direct sale with fewer moving parts.",
] as const;

const BUYER_QUESTIONS = [
  "Are you the direct buyer or are you trying to assign the deal to someone else?",
  "How do you arrive at your offer price?",
  "Who handles title and closing?",
  "What fees will I pay, if any?",
  "What happens if the property needs major repairs?",
  "How quickly can you close, and can you wait if I need more time?",
  "If your offer is not the right fit, will you say that plainly?",
] as const;

const WHAT_HAPPENS_NEXT = [
  {
    title: "You tell us the basics",
    copy: "Address, condition, timeline, and anything important about your situation. We keep the first conversation simple.",
  },
  {
    title: "We review the property honestly",
    copy: "We look at condition, comps, timeline, and whether a direct sale even makes sense for your case.",
  },
  {
    title: "We walk you through the offer",
    copy: "No pressure. If we are not the right fit, we would rather tell you that than force a bad deal.",
  },
  {
    title: "You choose the closing timeline",
    copy: "Fast if you need fast. Slower if you need breathing room. The point is to work around real life.",
  },
] as const;

export default function SellerGuidePage() {
  const phoneClean = SITE.phone.replace(/\D/g, "");

  return (
    <>
      <section className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-20 lg:pt-40 lg:pb-24">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-stone-50 via-forest-50/20 to-stone-50" />
        <div className="pointer-events-none absolute -top-24 -right-16 h-[380px] w-[380px] rounded-full bg-forest-100/40 blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-5 text-center sm:px-6 lg:px-8">
          <FadeIn>
            <div className="trust-badge mb-5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-forest-500 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-forest-500" />
              </span>
              Spokane Seller Guide
            </div>
          </FadeIn>

          <FadeIn delay={80}>
            <h1 className="font-display text-display text-ink-700 text-balance">
              Compare Your Options Before You Sell
            </h1>
          </FadeIn>

          <FadeIn delay={160}>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-ink-400">
              This guide is for Spokane County and North Idaho homeowners who want
              clarity before they make a move. Read this if you are weighing a cash
              sale, trying to understand the process, or simply figuring out what
              questions to ask first.
            </p>
          </FadeIn>

          <FadeIn delay={240}>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link href="/#get-offer" className="btn-primary">
                Get a Cash Offer
              </Link>
              <a href={`tel:${phoneClean}`} className="btn-secondary">
                Call or Text {SITE.phone}
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="border-y border-stone-200 bg-white py-12">
        <div className="mx-auto max-w-5xl px-5 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {START_HERE.map((item, index) => (
              <FadeIn key={item.href} delay={index * 70}>
                <Link
                  href={item.href}
                  className="block rounded-2xl border border-stone-200 bg-stone-50 p-5 transition-colors hover:border-forest-300 hover:bg-forest-50"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest-500">
                    Start Here
                  </p>
                  <h2 className="mt-3 font-display text-2xl text-ink-600">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-ink-400">
                    {item.copy}
                  </p>
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="section-wrap">
        <div className="grid gap-8 lg:grid-cols-2">
          <FadeIn>
            <div className="rounded-2xl border border-stone-200 bg-white p-7 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-forest-500">
                When a Cash Sale Usually Makes Sense
              </p>
              <ul className="mt-5 space-y-3">
                {CASH_SALE_FIT.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-ink-500">
                    <svg
                      aria-hidden="true"
                      className="mt-0.5 h-4 w-4 flex-shrink-0 text-forest-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>

          <FadeIn delay={120}>
            <div className="rounded-2xl border border-stone-200 bg-white p-7 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-forest-500">
                Ask Any Buyer These Questions
              </p>
              <ul className="mt-5 space-y-3">
                {BUYER_QUESTIONS.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-ink-500">
                    <span className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-forest-50 text-[11px] font-bold text-forest-600">
                      ?
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="border-y border-stone-200 bg-stone-100/50">
        <div className="section-wrap">
          <FadeIn>
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-forest-500">
                What Happens Next
              </p>
              <h2 className="mt-2 font-display text-display text-ink-600 text-balance">
                The Process Should Feel Clear Before It Feels Fast
              </h2>
            </div>
          </FadeIn>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {WHAT_HAPPENS_NEXT.map((step, index) => (
              <FadeIn key={step.title} delay={index * 80}>
                <div className="rounded-2xl border border-stone-200 bg-white p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest-500">
                    Step {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-3 font-display text-2xl text-ink-600">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-400">
                    {step.copy}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="section-wrap">
        <FadeIn>
          <div className="relative overflow-hidden rounded-2xl bg-ink-600 px-7 py-14 text-center sm:px-14">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-forest-500/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-amber-400/10 blur-2xl" />

            <h2 className="font-display text-display text-white text-balance">
              Want to Talk Through Your Situation?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-stone-400">
              Reach out when you are ready. We can answer questions, explain the
              process, and tell you honestly whether a direct sale makes sense for
              your situation.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link href="/#get-offer" className="btn-primary !bg-white !text-ink-600 hover:!bg-stone-100">
                Get My Cash Offer
              </Link>
              <a
                href={`sms:${phoneClean}`}
                className="text-sm font-semibold text-stone-300 transition-colors hover:text-amber-400"
              >
                Or text us: {SITE.phone}
              </a>
            </div>
          </div>
        </FadeIn>
      </section>
    </>
  );
}
