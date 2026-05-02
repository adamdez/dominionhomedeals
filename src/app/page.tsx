// src/app/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LeadForm } from "@/components/forms/LeadForm";
import { FadeIn } from "@/components/animations/FadeIn";
import { Testimonials } from "@/components/sections/Testimonials";
import { Situations } from "@/components/sections/Situations";
import { SellerPaths } from "@/components/sections/SellerPaths";
import { SellerGuideCta } from "@/components/sections/SellerGuideCta";
import { BuyerChecklist } from "@/components/sections/BuyerChecklist";
import { CommonSellerScenarios } from "@/components/sections/CommonSellerScenarios";
import { SITE, PROCESS_STEPS, TRUST_STATS, TEAM } from "@/lib/constants";

/** Display name -> slug map for homepage neighborhood links */
const HOMEPAGE_AREAS: { name: string; slug: string }[] = [
  { name: "Spokane Valley", slug: "spokane-valley" },
  { name: "North Spokane", slug: "north-spokane" },
  { name: "South Hill", slug: "south-hill" },
  { name: "Downtown Spokane", slug: "downtown-spokane" },
  { name: "Coeur d\u2019Alene", slug: "coeur-d-alene" },
  { name: "Post Falls", slug: "post-falls" },
  { name: "Hayden", slug: "hayden" },
  { name: "Liberty Lake", slug: "liberty-lake" },
  { name: "Rathdrum", slug: "rathdrum" },
  { name: "Deer Park", slug: "deer-park" },
  { name: "Airway Heights", slug: "airway-heights" },
  { name: "Mead", slug: "mead" },
  { name: "Cheney", slug: "cheney" },
  { name: "Medical Lake", slug: "medical-lake" },
  { name: "Millwood", slug: "millwood" },
];

export const metadata: Metadata = {
  title: "Sell Your Spokane Home Fast — No Repairs, No Fees | Dominion Homes",
  description:
    "Local Spokane team that buys houses directly for cash. No agents, no commissions, no repairs, and you choose the closing date.",
};

export default function HomePage() {
  return (
    <>
      {/* ======== HERO ======== */}
      <section className="relative overflow-hidden pt-28 pb-14 sm:pt-36 sm:pb-20 lg:pt-40 lg:pb-24">
        {/* Warm gradient background */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-stone-50 via-forest-50/20 to-stone-50" />
        <div className="pointer-events-none absolute -top-20 -right-20 h-[400px] w-[400px] rounded-full bg-forest-100/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-[350px] w-[350px] rounded-full bg-amber-100/20 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
          <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
            {/* Copy */}
            <div className="pt-2">
              <div className="trust-badge mb-5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-forest-500 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-forest-500" />
                </span>
                Spokane-Based Team · We Buy Houses Directly
              </div>

              <h1 className="font-display text-hero text-ink-700 text-balance">
                Need to Sell Your Spokane Home?
                <br />
                <span className="text-forest-500">
                  We Buy It Directly. You Skip the Hassle.
                </span>
              </h1>

              <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-400">
                Inherited a house you don&apos;t want? Tired of being a
                landlord? Can&apos;t afford repairs? Logan and his team
                buy homes directly across Spokane. No agents, no
                showings, no fees.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <a href="#get-offer" className="btn-primary">
                  Get Your Cash Offer
                </a>
                <a
                  href={`tel:${SITE.phone.replace(/\D/g, "")}`}
                  className="btn-secondary"
                >
                  Call or Text {SITE.phone}
                </a>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-300">
                <span className="flex items-center gap-1.5">
                  <svg aria-hidden="true" className="h-4 w-4 text-forest-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  No commissions
                </span>
                <span className="flex items-center gap-1.5">
                  <svg aria-hidden="true" className="h-4 w-4 text-forest-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Any condition
                </span>
                <span className="flex items-center gap-1.5">
                  <svg aria-hidden="true" className="h-4 w-4 text-forest-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Close in 2 weeks
                </span>
                <span className="flex items-center gap-1.5">
                  <svg aria-hidden="true" className="h-4 w-4 text-forest-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  We meet in person
                </span>
              </div>
            </div>

            {/* Form */}
            <div id="get-offer" className="scroll-mt-24">
              <p className="mb-3 text-center text-sm font-medium text-forest-600">
                Takes about 60 seconds - no obligation
              </p>
              <LeadForm />
            </div>
          </div>
        </div>
      </section>

      {/* ======== STATS BAR ======== */}
      <section className="border-y border-stone-200 bg-white py-10">
        <div className="mx-auto max-w-4xl px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {TRUST_STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-display text-3xl text-ink-600 md:text-4xl">
                  {stat.value}
                </div>
                <p className="mt-1 text-xs font-medium text-ink-300">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======== TRUST PROOF ======== */}
      <section className="section-wrap">
        <FadeIn>
          <div className="mx-auto max-w-4xl">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Real local people",
                  text: "Logan and his team are based in Spokane. When you call, someone local picks up — not a call center.",
                },
                {
                  title: "We buy as-is",
                  text: "Roof damage, foundation issues, clutter, deferred maintenance — we don't ask you to fix anything.",
                },
                {
                  title: "No commissions or fees",
                  text: "The number we offer is the number you walk away with. No agent fees, no closing costs on your side.",
                },
                {
                  title: "You pick the closing date",
                  text: "Two weeks or two months — we work around your timeline, not the other way around.",
                },
                {
                  title: "We close through title",
                  text: "Every deal goes through WFG Title or North Idaho Title. Standard, transparent closing process.",
                },
                {
                  title: "No pressure, ever",
                  text: "If a direct sale isn't your best move, we'll tell you. We'd rather be straight with you than force a fit.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-stone-200 bg-white p-5">
                  <h3 className="text-sm font-semibold text-ink-600">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-400">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ======== HOW IT WORKS ======== */}
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
          <div className="mt-10 text-center">
            <a href="#get-offer" className="btn-primary">
              Start Step 1 - It&apos;s Free
            </a>
          </div>
        </FadeIn>
      </section>

      {/* ======== WHY LOCAL MATTERS ======== */}
      <section className="border-y border-stone-200 bg-stone-100/50">
        <div className="section-wrap">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <FadeIn>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-forest-500">
                  Why It Matters
                </p>
                <h2 className="mt-2 font-display text-display text-ink-600 text-balance">
                  We Live Here.
                  <br />
                  That Changes Everything.
                </h2>
                <p className="mt-4 text-base leading-relaxed text-ink-400">
                  Most &ldquo;we buy houses&rdquo; companies operate from out of state. They
                  send strangers, use scripts, and treat your home like a
                  spreadsheet line item.
                </p>
                <p className="mt-3 text-base leading-relaxed text-ink-400">
                  We live here. We raise our families here. When we say
                  we&apos;ll meet you at your kitchen table to talk through
                  your options - we mean it. We&apos;re based in Spokane.
                  We know the neighborhoods because we drive through
                  them every day.
                </p>
                <ul className="mt-5 space-y-2.5">
                  {[
                    "Based in Spokane, WA - not a national call center",
                    "We meet every seller face-to-face",
                    "We close through WFG Title - a name you know",
                    "No bait-and-switch. The offer we make is the offer you get.",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <svg aria-hidden="true" className="mt-0.5 h-4 w-4 flex-shrink-0 text-forest-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-ink-500">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
            <FadeIn delay={200} direction="left">
              {/* Team preview */}
              <div className="grid max-w-[11rem] grid-cols-1 gap-4 mx-auto lg:mx-0">
                {TEAM.map((member) => (
                  <div key={member.name} className="rounded-2xl bg-white p-5 shadow-soft text-center">
                    <div className="relative mx-auto mb-3 h-16 w-16 overflow-hidden rounded-full ring-4 ring-forest-50">
                      <Image
                        src={member.image}
                        alt={`${member.name} headshot`}
                        fill
                        sizes="64px"
                        className="object-cover"
                        quality={72}
                      />
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

      {/* ======== BUYER CHECKLIST ======== */}
      <BuyerChecklist />

      {/* ======== COMMON SELLER SCENARIOS ======== */}
      <CommonSellerScenarios />

      {/* ======== SITUATIONS ======== */}
      <Situations />

      {/* ======== SELLER PATHS ======== */}
      <SellerPaths />

      {/* ======== SELLER GUIDE CTA ======== */}
      <SellerGuideCta />

      {/* ======== TESTIMONIALS ======== */}
      <Testimonials />

      {/* ======== NEIGHBORHOODS PREVIEW ======== */}
      <section className="section-wrap">
        <FadeIn>
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-forest-500">
              Areas We Serve
            </p>
            <h2 className="mt-2 font-display text-display text-ink-600 text-balance">
              Spokane County & Kootenai County
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-ink-400">
              From Spokane Valley to Coeur d&apos;Alene and everywhere in
              between - if it&apos;s in our area, we want to hear about it.
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={150}>
          <div className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {HOMEPAGE_AREAS.map((area) => (
              <Link
                key={area.slug}
                href={`/neighborhoods/${area.slug}`}
                className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-center text-sm font-medium text-ink-500 transition-colors hover:border-forest-300 hover:bg-forest-50"
              >
                {area.name}
              </Link>
            ))}
          </div>
          <div className="mt-4 text-center">
            <Link
              href="/neighborhoods"
              className="text-sm font-medium text-forest-600 transition-colors hover:text-forest-700"
            >
              View all areas we serve {"->"}
            </Link>
          </div>
        </FadeIn>
      </section>

      {/* ======== FINAL CTA ======== */}
      <section className="section-wrap">
        <FadeIn>
          <div className="relative overflow-hidden rounded-2xl bg-ink-600 px-7 py-14 text-center sm:px-14">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-forest-500/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-amber-400/10 blur-2xl" />

            <h2 className="font-display text-display text-white text-balance">
              Have a Property You Need to Move On From?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-base text-stone-400">
              No obligation. No pressure. Fill out the form or reach out
              directly - one of us will get back to you.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <a href="#get-offer" className="btn-primary !bg-white !text-ink-600 hover:!bg-stone-100">
                Get My Cash Offer
              </a>
              <a
                href={`sms:${SITE.phone.replace(/\D/g, "")}`}
                className="text-sm font-semibold text-stone-300 hover:text-amber-400 transition-colors"
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

