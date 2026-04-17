import type { Metadata } from "next";
import Link from "next/link";
import { FadeIn } from "@/components/animations/FadeIn";
import { LeadForm } from "@/components/forms/LeadForm";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { SellerProofSection } from "@/components/sell/SellerProofSection";
import { SellStickyBar } from "@/components/sell/SellStickyBar";
import { SellTrustStrip } from "@/components/sell/SellTrustStrip";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "How To Sell A House As-Is In Spokane, WA | Dominion Homes",
  description:
    "Learn how to sell a house as-is in Spokane, WA without repairs or cleaning. Dominion Homes buys houses directly in any condition across Spokane County.",
  alternates: { canonical: `${SITE.url}/sell/as-is` },
  openGraph: {
    title: "How To Sell A House As-Is In Spokane, WA",
    description:
      "A plain-English guide to selling a Spokane house as-is, plus the direct cash-offer option for homes that need work.",
    url: `${SITE.url}/sell/as-is`,
    type: "website",
  },
};

function CheckIcon() {
  return (
    <svg
      className="mt-0.5 h-4 w-4 flex-shrink-0 text-forest-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
      />
    </svg>
  );
}

const CONDITIONS = [
  "Outdated kitchens, bathrooms, flooring, and windows",
  "Roof, HVAC, plumbing, or electrical problems",
  "Foundation issues or other structural concerns",
  "Water, smoke, or fire damage",
  "Heavy cleanout, hoarding, or years of deferred maintenance",
  "Vacant houses, inherited properties, or former rentals",
];

const HOW_TO_STEPS = [
  {
    name: "Figure out whether speed or top-dollar matters more",
    text:
      "If the house needs real work, the first decision is usually whether you want to repair and list it, or skip straight to a direct sale.",
  },
  {
    name: "Get a realistic as-is number",
    text:
      "A useful as-is offer should reflect the current condition of the house, not a fantasy after-repair value that still assumes you do all the work.",
  },
  {
    name: "Compare the cleanup, repair, holding, and agent costs",
    text:
      "In Spokane, the right answer often depends on how much time, money, and stress it would take to get the property market-ready.",
  },
  {
    name: "Choose the closing path that fits your timeline",
    text:
      "Some sellers want to close quickly. Others need a few weeks or longer. The best option is the one that actually fits the seller's life.",
  },
] as const;

const FAQS = [
  {
    q: "Can I legally sell a house as-is in Spokane?",
    a: "Yes. Selling as-is means you are selling in its current condition instead of agreeing to make repairs first. You still need to handle normal disclosures that apply to your situation, but you do not have to renovate the house before selling it.",
  },
  {
    q: "Do I need to clean out the property first?",
    a: "Not always. If you list with an agent, cleanup usually matters because presentation affects showings. In a direct sale, many sellers take what they want and leave the rest.",
  },
  {
    q: "Will a buyer still care about condition?",
    a: "Yes. As-is does not mean condition is ignored. It means the buyer prices the work into the offer instead of requiring you to fix the house first.",
  },
  {
    q: "When does an as-is sale make the most sense?",
    a: "Usually when the house needs enough work that repairs, cleanup, and listing prep would be expensive, stressful, or simply not worth it for the seller.",
  },
  {
    q: "How fast can a direct as-is sale close?",
    a: "Many direct sales can close in roughly two to three weeks once title is clear, but the timeline can also be stretched if the seller needs more time.",
  },
  {
    q: "Who handles closing?",
    a: "For Spokane-area deals, closing is typically handled through title. Dominion Homes uses WFG Title for Eastern Washington transactions.",
  },
] as const;

const INTERNAL_LINKS = [
  { href: "/sell/inherited", label: "Inherited house in Spokane" },
  { href: "/sell/landlord", label: "Rental property sale" },
  { href: "/sell/guide", label: "Seller guide" },
  { href: "/neighborhoods/spokane-valley", label: "Spokane Valley" },
  { href: "/neighborhoods/north-spokane", label: "North Spokane" },
  { href: "/neighborhoods/south-hill", label: "South Hill" },
] as const;

function StructuredData() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to sell a house as-is in Spokane, WA",
    description:
      "A plain-English overview of how Spokane homeowners usually evaluate an as-is sale versus repairs and listing prep.",
    step: HOW_TO_STEPS.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
    </>
  );
}

export default function SellAsIsPage() {
  const phoneClean = SITE.phone.replace(/\D/g, "");

  return (
    <>
      <StructuredData />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: SITE.url },
          { name: "Sell Your House", url: `${SITE.url}/sell` },
          { name: "Sell As-Is", url: `${SITE.url}/sell/as-is` },
        ]}
      />

      <section className="relative overflow-hidden pt-28 pb-14 sm:pt-36 sm:pb-20 lg:pt-40 lg:pb-24">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-stone-50 via-forest-50/20 to-stone-50" />
        <div className="pointer-events-none absolute -top-20 -right-20 h-[400px] w-[400px] rounded-full bg-forest-100/30 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
          <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="pt-2">
              <FadeIn>
                <div className="trust-badge mb-5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-forest-500 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-forest-500" />
                  </span>
                  Spokane as-is house sales
                </div>
              </FadeIn>

              <FadeIn delay={80}>
                <h1 className="font-display text-hero text-ink-700 text-balance">
                  Sell Your House As-Is in Spokane - Any Condition, No Repairs
                </h1>
              </FadeIn>

              <FadeIn delay={120}>
                <SellTrustStrip />
              </FadeIn>

              <FadeIn delay={160}>
                <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-400">
                  If your Spokane house needs work, you can skip the repair list and
                  sell it exactly as it sits today. We buy houses across Spokane County
                  in any condition, so you do not have to clean, fix, or prep the
                  property before getting a cash offer.
                </p>
              </FadeIn>

              <FadeIn delay={240}>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <a href="#get-offer" className="btn-primary">
                    Get Your As-Is Offer
                  </a>
                  <a
                    href={`tel:${phoneClean}`}
                    className="btn-secondary inline-flex items-center gap-2"
                  >
                    <PhoneIcon />
                    Call {SITE.phone}
                  </a>
                </div>
              </FadeIn>

              <FadeIn delay={320}>
                <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-300">
                  {[
                    "No repairs required",
                    "No cleaning first",
                    "Title handles closing",
                    "You choose the timeline",
                  ].map((item) => (
                    <span key={item} className="flex items-center gap-1.5">
                      <CheckIcon />
                      {item}
                    </span>
                  ))}
                </div>
              </FadeIn>
            </div>

            <FadeIn delay={200} direction="left">
              <div id="get-offer" className="scroll-mt-24">
                <LeadForm />
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <SellerProofSection angle="as-is" />

      <section className="border-y border-stone-200 bg-white">
        <div className="section-wrap">
          <FadeIn>
            <div className="mx-auto max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-widest text-forest-500">
                Direct Answer
              </p>
              <h2 className="mt-2 font-display text-display text-ink-600 text-balance">
                The short version
              </h2>
              <div className="mt-5 space-y-3 text-base leading-relaxed text-ink-400">
                <p>
                  Yes, you can sell a house as-is in Spokane. In practice, that means
                  the buyer accepts the house in its current condition instead of
                  asking you to repair, remodel, stage, or deep-clean it first.
                </p>
                <p>
                  The real question is not whether you can do it. The real question is
                  whether the tradeoff makes sense for your situation once you compare
                  repair costs, cleanup, holding costs, showings, and how certain you
                  need the closing to be.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="section-wrap">
        <FadeIn>
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-forest-500">
              How It Usually Works
            </p>
            <h2 className="mt-2 font-display text-display text-ink-600 text-balance">
              Four steps sellers usually go through
            </h2>
          </div>
        </FadeIn>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {HOW_TO_STEPS.map((step, index) => (
            <FadeIn key={step.name} delay={index * 80}>
              <article className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest-500">
                  Step {index + 1}
                </p>
                <h3 className="mt-3 font-display text-2xl leading-tight text-ink-600">
                  {step.name}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-400">{step.text}</p>
              </article>
            </FadeIn>
          ))}
        </div>
      </section>

      <section className="border-y border-stone-200 bg-stone-100/50">
        <div className="section-wrap">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
            <FadeIn>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-forest-500">
                  When It Usually Fits
                </p>
                <h2 className="mt-2 font-display text-display text-ink-600 text-balance">
                  The houses that usually make sense to sell as-is
                </h2>
                <ul className="mt-5 space-y-2.5">
                  {CONDITIONS.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <CheckIcon />
                      <span className="text-sm text-ink-500">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>

            <FadeIn delay={120}>
              <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest-500">
                  Spokane-specific reality
                </p>
                <div className="mt-4 space-y-3 text-sm leading-relaxed text-ink-400">
                  <p>
                    In this market, sellers usually do not choose the as-is route
                    because they think it is magical. They choose it because the repair
                    list is real, the cleanup is real, and the time drain is real.
                  </p>
                  <p>
                    The more the house needs work, the more useful it is to compare a
                    real as-is offer against what it would cost to get the property
                    ready for the open market.
                  </p>
                  <p>
                    If you want a simple benchmark, we can usually tell you quickly
                    whether the direct-sale route is worth considering or whether the
                    house may be better suited for a traditional listing.
                  </p>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <section className="section-wrap">
        <FadeIn>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest-500">
                What Buyers Actually Look At
              </p>
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-ink-400">
                <p>
                  Serious buyers still care about roof life, major systems, layout,
                  neighborhood, and the amount of work required. Selling as-is does not
                  erase those issues. It just moves the repair burden off the seller.
                </p>
                <p>
                  That is why a trustworthy as-is offer should sound plain and grounded,
                  not inflated. The condition matters. The neighborhood matters. The
                  timeline matters.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-cream-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest-500">
                Internal links that help
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {INTERNAL_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-full border border-stone-200 bg-white px-3 py-2 text-sm text-ink-500 transition-colors hover:border-forest-300 hover:text-forest-700"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-ink-400">
                These supporting pages help answer related questions around inherited
                houses, rental properties, neighborhood context, and the direct-sale
                process.
              </p>
            </div>
          </div>
        </FadeIn>
      </section>

      <section className="border-t border-stone-200 bg-stone-100/50">
        <div className="section-wrap">
          <FadeIn>
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-forest-500">
                Common Questions
              </p>
              <h2 className="mt-2 font-display text-display text-ink-600 text-balance">
                Straight answers about selling as-is in Spokane
              </h2>
            </div>
          </FadeIn>

          <div className="mx-auto mt-10 max-w-3xl space-y-4">
            {FAQS.map((faq, index) => (
              <FadeIn key={faq.q} delay={index * 60}>
                <div className="rounded-xl border border-stone-200 bg-white p-5">
                  <h3 className="font-display text-base text-ink-600">{faq.q}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-400">{faq.a}</p>
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
              Want a real as-is number to compare against repairs?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-base text-stone-400">
              Tell us about the house and we will give you a grounded answer. If a
              traditional listing makes more sense, we would rather tell you that than
              push a bad-fit offer.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#get-offer"
                className="btn-primary !bg-white !text-ink-600 hover:!bg-stone-100"
              >
                Get My Cash Offer
              </a>
              <a
                href={`tel:${phoneClean}`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-300 transition-colors hover:text-amber-400"
              >
                <PhoneIcon />
                Call {SITE.phone}
              </a>
            </div>
          </div>
        </FadeIn>
      </section>

      <SellStickyBar />
    </>
  );
}
