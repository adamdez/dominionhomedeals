// src/app/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SmsDisclosure } from "@/components/consent/SmsDisclosure";
import { LeadForm } from "@/components/forms/LeadForm";
import { FadeIn } from "@/components/animations/FadeIn";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { PrioritySellerLinks } from "@/components/seo/PrioritySellerLinks";
import { Testimonials } from "@/components/sections/Testimonials";
import { Situations } from "@/components/sections/Situations";
import { SellerPaths } from "@/components/sections/SellerPaths";
import { SellerGuideCta } from "@/components/sections/SellerGuideCta";
import { BuyerChecklist } from "@/components/sections/BuyerChecklist";
import { CommonSellerScenarios } from "@/components/sections/CommonSellerScenarios";
import { CashOfferMathSection, SellerProofBand, VerifyCashBuyerSection } from "@/components/sell/TrustAndOfferSections";
import { SELLER_SEO_LAST_UPDATED } from "@/lib/seller-seo-pages";
import { SITE, PROCESS_STEPS, TRUST_STATS } from "@/lib/constants";

const HOME_TITLE = "Sell Your House Fast in Spokane & CDA";
const HOME_DESCRIPTION =
  "Local Spokane and Coeur d'Alene team that buys houses directly for cash. No agents, no commissions, no repairs, and you choose the closing date.";

const VISUAL_PROOF_IMAGES = [
  {
    src: "/images/3314-e-cleveland/001.webp",
    alt: "Spokane house exterior reviewed for an as-is cash offer",
    label: "As-is homes",
  },
  {
    src: "/images/2443-n-wiscomb-st/007.webp",
    alt: "Kitchen condition reviewed during a Spokane cash offer walkthrough",
    label: "Real repairs",
  },
  {
    src: "/images/torrens-trail/472-web/007.webp",
    alt: "North Idaho property exterior reviewed by Dominion Homes",
    label: "North Idaho",
  },
] as const;

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
  title: `${HOME_TITLE} - No Repairs, No Fees`,
  description: HOME_DESCRIPTION,
  alternates: { canonical: SITE.url },
  openGraph: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: SITE.url,
    type: "website",
  },
};

function HomeStructuredData() {
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${SITE.url}/#sell-house-fast-service`,
    name: HOME_TITLE,
    description: HOME_DESCRIPTION,
    provider: { "@id": `${SITE.url}/#business` },
    areaServed: [
      { "@type": "AdministrativeArea", name: "Spokane County, WA" },
      { "@type": "AdministrativeArea", name: "Kootenai County, ID" },
    ],
    serviceType: "Direct cash home buying",
    url: SITE.url,
  };

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE.url}/#webpage`,
    url: SITE.url,
    name: HOME_TITLE,
    description: HOME_DESCRIPTION,
    dateModified: SELLER_SEO_LAST_UPDATED,
    about: { "@id": `${SITE.url}/#sell-house-fast-service` },
    publisher: { "@id": `${SITE.url}/#business` },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
    </>
  );
}

export default function HomePage() {
  return (
    <>
      <HomeStructuredData />
      <BreadcrumbJsonLd items={[{ name: "Home", url: SITE.url }]} />

      {/* ======== HERO ======== */}
      <section className="relative min-h-[calc(100vh-2rem)] overflow-hidden bg-ink-700 pt-28 pb-14 sm:pt-36 sm:pb-20 lg:pt-40 lg:pb-24">
        <Image
          src="/images/3314-e-cleveland/002.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-70"
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(18,24,19,0.86)_0%,rgba(18,24,19,0.64)_38%,rgba(18,24,19,0.24)_68%,rgba(18,24,19,0.42)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-stone-50 to-transparent" />

        <div className="relative mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
          <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
            {/* Copy */}
            <div className="pt-2">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-amber-100 backdrop-blur">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-300" />
                </span>
                Spokane-Based Team - We Buy Houses Directly
              </div>

              <h1 className="font-display text-hero text-white text-balance drop-shadow-sm">
                Sell Your House Fast
                <br />
                <span className="text-amber-200">
                  in Spokane &amp; CDA
                </span>
              </h1>

              <p className="mt-5 max-w-lg text-base leading-relaxed text-stone-100 sm:text-lg">
                Inherited a house you don&apos;t want? Tired of being a
                landlord? Can&apos;t afford repairs? We buy houses directly
                in Spokane and North Idaho. No agents, no showings, no fees.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <a href="#get-offer" className="btn-primary">
                  Get Your Cash Offer
                </a>
                <a
                  href={`tel:${SITE.phone.replace(/\D/g, "")}`}
                  className="btn-secondary !border-white/55 !text-stone-100 hover:!border-amber-200 hover:!bg-white/10 hover:!text-white"
                >
                  Call or Text {SITE.phone}
                </a>
              </div>
              <SmsDisclosure tone="dark" className="mx-0 max-w-lg text-left" />

              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-stone-200">
                <span className="flex items-center gap-1.5">
                  <svg aria-hidden="true" className="h-4 w-4 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  No commissions
                </span>
                <span className="flex items-center gap-1.5">
                  <svg aria-hidden="true" className="h-4 w-4 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Any condition
                </span>
                <span className="flex items-center gap-1.5">
                  <svg aria-hidden="true" className="h-4 w-4 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Close in 2 weeks
                </span>
                <span className="flex items-center gap-1.5">
                  <svg aria-hidden="true" className="h-4 w-4 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  We meet in person
                </span>
              </div>
            </div>

            {/* Form */}
            <div id="get-offer" className="scroll-mt-24">
              <p className="mb-3 text-center text-sm font-medium text-amber-100">
                Takes about 60 seconds - no obligation
              </p>
              <LeadForm />
            </div>
          </div>
        </div>
      </section>

      <SellerProofBand />

      <PrioritySellerLinks
        title="Start with the Spokane or CDA seller guide that fits."
        intro="Use these pages to compare a fast sale, a cash buyer, or how an offer is calculated."
      />

      <section className="border-y border-stone-200 bg-white">
        <div className="section-wrap">
          <div className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
            <FadeIn>
              <div>
              <p className="text-xs font-bold uppercase tracking-widest text-forest-500">
                Direct Answer
              </p>
              <h2 className="mt-2 font-display text-display text-ink-600 text-balance">
                A local buyer you can verify.
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-ink-400">
                Dominion Homes buys houses directly in Spokane and North Idaho. We
                work with as-is homes, inherited houses, rentals, back taxes, and
                properties that need repairs. You can call the same number listed on
                our Google profile, and every closing goes through title.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/sell-my-house-fast-spokane" className="btn-secondary !py-2.5 text-sm">
                  Fast sale guide
                </Link>
                <Link href="/cash-home-buyers-spokane" className="btn-secondary !py-2.5 text-sm">
                  Cash buyer guide
                </Link>
                <Link href="/stories" className="btn-secondary !py-2.5 text-sm">
                  Local deal snapshots
                </Link>
              </div>
            </div>
            </FadeIn>

            <FadeIn delay={120} direction="left">
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {VISUAL_PROOF_IMAGES.map((image) => (
                  <figure
                    key={image.src}
                    className="relative min-h-[11rem] overflow-hidden rounded-xl border border-stone-200 bg-stone-100 shadow-soft"
                  >
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      sizes="(min-width: 1024px) 34vw, (min-width: 640px) 30vw, 100vw"
                      className="object-cover"
                    />
                    <figcaption className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-widest text-forest-700 shadow-sm">
                      {image.label}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </FadeIn>
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
                  text: "Logan and his team serve Spokane and North Idaho. When you call, someone local picks up.",
                },
                {
                  title: "We buy as-is",
                  text: "Roof damage, foundation issues, clutter, or old repairs. You do not need to fix anything first.",
                },
                {
                  title: "No commissions or fees",
                  text: "No agent fees, no closing costs on your side.",
                },
                {
                  title: "You pick the closing date",
                  text: "Two weeks or two months. We work around your timeline.",
                },
                {
                  title: "We close through title",
                  text: "Every closing goes through a title company.",
                },
                {
                  title: "No pressure, ever",
                  text: "If a direct sale is not your best move, we will tell you.",
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
      <section className="relative overflow-hidden border-y border-stone-200 bg-forest-700 text-white">
        <Image
          src="/images/torrens-trail/472-web/011.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-18"
        />
        <div className="pointer-events-none absolute inset-0 bg-forest-800/85" />
        <div className="section-wrap">
          <div className="relative grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <FadeIn>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-amber-300">
                  Why It Matters
                </p>
                <h2 className="mt-2 font-display text-display text-white text-balance">
                  Local People.
                  <br />
                  Simple Process.
                </h2>
                <p className="mt-4 text-base leading-relaxed text-stone-200">
                  Some cash buyers are hard to pin down. You talk to one person,
                  then another, and nobody seems local.
                </p>
                <p className="mt-3 text-base leading-relaxed text-stone-200">
                  We are local to Spokane and North Idaho. We can meet you, walk
                  the property, explain the offer, and close through title.
                </p>
                <ul className="mt-5 space-y-2.5">
                  {[
                    "Local team, not a call center",
                    "We can meet at the property",
                    "Closing runs through title",
                    "No pressure to sign",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <svg aria-hidden="true" className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-stone-100">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
            <FadeIn delay={200} direction="left">
              <div className="grid gap-4 sm:grid-cols-[0.75fr_1fr]">
                <figure className="relative min-h-[18rem] overflow-hidden rounded-xl border border-white/15 bg-white/10 shadow-elevated">
                  <Image
                    src="/images/team/logan.jpg"
                    alt="Logan from Dominion Homes"
                    fill
                    sizes="(min-width: 1024px) 22vw, 80vw"
                    className="object-cover"
                    quality={76}
                  />
                </figure>
                <div className="grid gap-4">
                  <figure className="relative min-h-[8.5rem] overflow-hidden rounded-xl border border-white/15 bg-white/10 shadow-soft">
                    <Image
                      src="/images/3314-e-cleveland/010.webp"
                      alt="Interior condition reviewed before a direct as-is sale"
                      fill
                      sizes="(min-width: 1024px) 28vw, 80vw"
                      className="object-cover"
                    />
                  </figure>
                  <div className="rounded-xl border border-white/15 bg-white/10 p-5 backdrop-blur">
                    <p className="text-xs font-bold uppercase tracking-widest text-amber-300">Local proof</p>
                    <p className="mt-2 text-sm leading-relaxed text-stone-100">
                      You talk with a real local buyer. We look at the house, explain the offer, and close through title.
                    </p>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <CashOfferMathSection />

      <VerifyCashBuyerSection />

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
              <a href="#get-offer" className="btn-primary">
                Get My Cash Offer
              </a>
              <a
                href={`sms:${SITE.phone.replace(/\D/g, "")}`}
                className="text-sm font-semibold text-stone-300 hover:text-amber-400 transition-colors"
              >
                Or text us: {SITE.phone}
              </a>
            </div>
            <SmsDisclosure tone="dark" />
          </div>
        </FadeIn>
      </section>
    </>
  );
}

