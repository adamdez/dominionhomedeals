// src/app/sell/page.tsx
import type { Metadata } from "next";
import { LeadForm } from "@/components/forms/LeadForm";
import { FadeIn } from "@/components/animations/FadeIn";
// Testimonials removed from /sell until real reviews are available
import { Situations } from "@/components/sections/Situations";
import {
  SITE,
  PROCESS_STEPS,
  TEAM,
  SELL_PAGE_FAQS,
} from "@/lib/constants";

export const metadata: Metadata = {
  title: "Sell Your House Fast for Cash in Spokane",
  description:
    "Local Spokane cash home buyers. Get a fair cash offer — no repairs, no fees, close on your timeline. We buy houses in any condition. Call or text 509-822-5460.",
  alternates: { canonical: `${SITE.url}/sell` },
  openGraph: {
    title: "Sell Your Spokane Home for Cash — No Repairs, No Fees",
    description:
      "Local team buys houses in any condition across Spokane County. No commissions, no repairs. You pick the closing date.",
    url: `${SITE.url}/sell`,
    type: "website",
  },
};

/* ── Inline SVGs ─────────────────────────────────────────────── */

function CheckIcon({ className = "h-4 w-4 text-forest-400" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

/* ── Trust stat items — stronger than the homepage defaults ──── */

const SELL_TRUST_STATS = [
  { value: "As-Is", label: "No Repairs Needed", icon: "🔧" },
  { value: "$0", label: "No Agent Commissions", icon: "💰" },
  { value: "You Pick", label: "Your Closing Timeline", icon: "📅" },
  { value: "Local", label: "Not a Call Center", icon: "📍" },
];

/* ── FAQ JSON-LD ─────────────────────────────────────────────── */

function FAQJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: SELL_PAGE_FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

/* ── Page ─────────────────────────────────────────────────────── */

export default function SellPage() {
  const phoneClean = SITE.phone.replace(/\D/g, "");

  return (
    <>
      <FAQJsonLd />
      {/* ══════════ HERO ══════════ */}
      <section className="relative overflow-hidden pt-28 pb-14 sm:pt-36 sm:pb-20 lg:pt-40 lg:pb-24">
        {/* Background */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-stone-50 via-forest-50/20 to-stone-50" />
        <div className="pointer-events-none absolute -top-20 -right-20 h-[400px] w-[400px] rounded-full bg-forest-100/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-[350px] w-[350px] rounded-full bg-amber-100/20 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
          <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
            {/* Copy */}
            <div className="pt-2">
              <FadeIn>
                <div className="trust-badge mb-5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-forest-500 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-forest-500" />
                  </span>
                  Local Spokane Cash Home Buyers
                </div>
              </FadeIn>

              <FadeIn delay={80}>
                <h1 className="font-display text-hero text-ink-700 text-balance">
                  Sell Your Spokane Home
                  <br />
                  <span className="text-forest-500">
                    for Cash. As-Is.
                  </span>
                </h1>
              </FadeIn>

              <FadeIn delay={160}>
                <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-400">
                  We&apos;re a local team that buys houses directly across
                  Spokane County — no agents, no commissions, no repairs.
                  Tell us about your property and we&apos;ll make you a fair
                  cash offer. You pick the closing date.
                </p>
              </FadeIn>

              <FadeIn delay={240}>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <a href="#get-offer" className="btn-primary">
                    Get Your Cash Offer
                  </a>
                  <a
                    href={`tel:${phoneClean}`}
                    className="btn-secondary inline-flex items-center gap-2"
                  >
                    <PhoneIcon />
                    Call or Text {SITE.phone}
                  </a>
                </div>
              </FadeIn>

              <FadeIn delay={320}>
                <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-300">
                  {[
                    "No commissions",
                    "Any condition",
                    "Close on your timeline",
                    "Call, text, or use the form",
                  ].map((item) => (
                    <span key={item} className="flex items-center gap-1.5">
                      <CheckIcon />
                      {item}
                    </span>
                  ))}
                </div>
              </FadeIn>
            </div>

            {/* Form */}
            <FadeIn delay={200} direction="left">
              <div id="get-offer" className="scroll-mt-24">
                <LeadForm />
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ══════════ TRUST STATS BAR ══════════ */}
      <section className="border-y border-stone-200 bg-white py-10">
        <div className="mx-auto max-w-4xl px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {SELL_TRUST_STATS.map((stat) => (
              <FadeIn key={stat.label}>
                <div className="text-center">
                  <span className="text-2xl">{stat.icon}</span>
                  <div className="mt-1 font-display text-2xl text-ink-600 md:text-3xl">
                    {stat.value}
                  </div>
                  <p className="mt-1 text-xs font-medium text-ink-300">{stat.label}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section className="section-wrap">
        <FadeIn>
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-forest-500">
              Simple & Straightforward
            </p>
            <h2 className="mt-2 font-display text-display text-ink-600 text-balance">
              Three Steps. That&apos;s It.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-ink-400">
              We keep it simple because selling your home shouldn&apos;t be complicated.
            </p>
          </div>
        </FadeIn>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PROCESS_STEPS.map((step, i) => (
            <FadeIn key={step.number} delay={i * 120}>
              <div className="group rounded-2xl border border-stone-200 bg-white p-6 card-lift">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-500 font-display text-lg text-white shadow-sm transition-transform group-hover:scale-105">
                    {step.number}
                  </span>
                  <span className="rounded-full bg-forest-50 px-2.5 py-0.5 text-[11px] font-semibold text-forest-600">
                    {step.duration}
                  </span>
                </div>
                <h3 className="font-display text-lg text-ink-600">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-400">{step.description}</p>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={400}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a href="#get-offer" className="btn-primary">
              Start Step 1 — It&apos;s Free
            </a>
            <a
              href={`sms:${phoneClean}`}
              className="text-sm font-semibold text-ink-400 hover:text-forest-600 transition-colors inline-flex items-center gap-1.5"
            >
              <PhoneIcon />
              Or text us: {SITE.phone}
            </a>
          </div>
        </FadeIn>
      </section>

      {/* ══════════ WHY LOCAL MATTERS ══════════ */}
      <section className="border-y border-stone-200 bg-stone-100/50">
        <div className="section-wrap">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <FadeIn>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-forest-500">
                  Why It Matters
                </p>
                <h2 className="mt-2 font-display text-display text-ink-600 text-balance">
                  We&apos;re Not a Call Center.
                  <br />
                  We&apos;re Your Neighbors.
                </h2>
                <p className="mt-4 text-base leading-relaxed text-ink-400">
                  Most &ldquo;we buy houses&rdquo; companies operate from out of state. They
                  send strangers, use scripts, and treat your home like a
                  spreadsheet line item.
                </p>
                <p className="mt-3 text-base leading-relaxed text-ink-400">
                  We live here. We raise our families here. When we say
                  we&apos;ll meet you at your kitchen table to talk through
                  your options — we mean it.
                </p>
                <ul className="mt-5 space-y-2.5">
                  {[
                    "Based in Post Falls, ID — not a national call center",
                    "We meet every seller face-to-face",
                    "We close through WFG Title — a name you know",
                    "No bait-and-switch. The offer we make is the offer you get.",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <CheckIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-forest-500" />
                      <span className="text-sm text-ink-500">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
            <FadeIn delay={200} direction="left">
              <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto lg:mx-0">
                {TEAM.map((member) => (
                  <div key={member.name} className="rounded-2xl bg-white p-5 shadow-soft text-center">
                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-forest-100 text-forest-600">
                      <span className="font-display text-lg">
                        {member.name.split(" ")[0]}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-ink-600">
                      {member.name.split(" ")[0]}
                    </p>
                    <p className="text-[11px] text-ink-300">{member.role}</p>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ══════════ SITUATIONS ══════════ */}
      <Situations />

      {/* ══════════ FAQ ══════════ */}
      <section className="section-wrap">
        <FadeIn>
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-forest-500">
              Common Questions
            </p>
            <h2 className="mt-2 font-display text-display text-ink-600 text-balance">
              Straight Answers. No Runaround.
            </h2>
          </div>
        </FadeIn>

        <div className="mx-auto mt-10 max-w-3xl space-y-4">
          {SELL_PAGE_FAQS.map((faq, i) => (
            <FadeIn key={faq.q} delay={i * 60}>
              <div className="rounded-xl border border-stone-200 bg-white p-5">
                <h3 className="font-display text-base text-ink-600">{faq.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-400">{faq.a}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Testimonials section removed — re-add once real seller reviews exist */}

      {/* ══════════ FINAL CTA ══════════ */}
      <section className="section-wrap">
        <FadeIn>
          <div className="relative overflow-hidden rounded-2xl bg-ink-600 px-7 py-14 text-center sm:px-14">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-forest-500/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-amber-400/10 blur-2xl" />

            <h2 className="font-display text-display text-white text-balance">
              Ready to See What Your Home Is Worth?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-base text-stone-400">
              No obligation. No pressure. Fill out the form, call, or send us a
              text — whatever feels easiest. One of us will get back to you.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <a href="#get-offer" className="btn-primary !bg-white !text-ink-600 hover:!bg-stone-100">
                Get My Cash Offer
              </a>
              <a
                href={`sms:${phoneClean}`}
                className="text-sm font-semibold text-stone-300 hover:text-amber-400 transition-colors inline-flex items-center gap-1.5"
              >
                <PhoneIcon />
                Or text us: {SITE.phone}
              </a>
            </div>
          </div>
        </FadeIn>
      </section>
    </>
  );
}
