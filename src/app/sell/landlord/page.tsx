import type { Metadata } from "next";
import { FadeIn } from "@/components/animations/FadeIn";
import { LeadForm } from "@/components/forms/LeadForm";
import { SellerProofSection } from "@/components/sell/SellerProofSection";
import { SellStickyBar } from "@/components/sell/SellStickyBar";
import { SellTrustStrip } from "@/components/sell/SellTrustStrip";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Tired of Being a Landlord? Sell Your Rental Property in Spokane",
  description:
    "We buy rental properties with tenants in place in Spokane and Kootenai County. No evictions, no repairs, no vacancy risk. Get a fair cash offer and walk away clean.",
  alternates: { canonical: `${SITE.url}/sell/landlord` },
  openGraph: {
    title: "Tired of Being a Landlord? We Buy Rental Properties As-Is",
    description:
      "Sell your rental property for cash - tenants in place, no repairs, no property management headaches. Local Spokane team.",
    url: `${SITE.url}/sell/landlord`,
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

const PAIN_POINTS = [
  "Late rent, missed payments, or non-paying tenants",
  "Constant maintenance calls and repair costs",
  "Dealing with evictions or tenant disputes",
  "Property management eating into your margins",
  "Vacancy between tenants costing you money",
  "Out-of-state ownership making everything harder",
  "Just ready to move on and redeploy the capital",
];

const FAQS = [
  {
    q: "Can you buy my rental with tenants still living there?",
    a: "Yes - we buy with tenants in place. You don't need to evict anyone or wait for a lease to end. We take over the property and handle the tenant situation from there.",
  },
  {
    q: "What if the tenants aren't paying rent?",
    a: "That's one of the most common reasons landlords call us. Non-paying tenants do not stop us from buying. We factor the situation into our offer and handle it after closing.",
  },
  {
    q: "Do I need to make repairs first?",
    a: "No. We buy rental properties in any condition - deferred maintenance, tenant damage, aging systems, all of it. You do not need to fix a thing.",
  },
  {
    q: "What about the lease agreements?",
    a: "We work with existing leases. Whether your tenants are month-to-month or mid-lease, we can structure the purchase around the current agreements and walk you through it.",
  },
  {
    q: "How do you determine the offer on a rental?",
    a: "We look at the property value, current condition, rental income or lack of it, tenant situation, and comparable sales. We'll give you a clear breakdown of how we got to our number.",
  },
  {
    q: "How fast can you close?",
    a: "If the title is clear, we can close in as little as two to three weeks. If you need more time to coordinate, that's fine too - you pick the date.",
  },
];

function FAQJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
  );
}

export default function LandlordExitPage() {
  const phoneClean = SITE.phone.replace(/\D/g, "");

  return (
    <>
      <FAQJsonLd />

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
                  Landlord exit
                </div>
              </FadeIn>

              <FadeIn delay={80}>
                <h1 className="font-display text-hero text-ink-700 text-balance">
                  Tired of Being a Landlord in Spokane? Sell Your Rental As-Is for Cash
                </h1>
              </FadeIn>

              <FadeIn delay={120}>
                <SellTrustStrip />
              </FadeIn>

              <FadeIn delay={160}>
                <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-400">
                  If you are done with tenants, turnover work, or one more repair cycle,
                  we can buy your Spokane rental as-is and give you a clean exit. We
                  buy with tenants in place and work around the timing that fits you.
                </p>
              </FadeIn>

              <FadeIn delay={240}>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <a href="#get-offer" className="btn-primary">
                    Get Your Cash Offer
                  </a>
                  <a href={`tel:${phoneClean}`} className="btn-secondary inline-flex items-center gap-2">
                    <PhoneIcon />
                    Call {SITE.phone}
                  </a>
                </div>
              </FadeIn>

              <FadeIn delay={320}>
                <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-300">
                  {[
                    "Buy with tenants in place",
                    "No repairs needed",
                    "Close in 2-3 weeks",
                    "No commissions",
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

      <SellerProofSection angle="landlord" />

      <section className="border-y border-stone-200 bg-stone-100/50">
        <div className="section-wrap">
          <FadeIn>
            <div className="mx-auto max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-widest text-forest-500">
                Sound Familiar?
              </p>
              <h2 className="mt-2 font-display text-display text-ink-600 text-balance">
                Owning Rentals Isn&apos;t Always Worth It
              </h2>
              <p className="mt-4 text-base leading-relaxed text-ink-400">
                Being a landlord can be rewarding - until it isn&apos;t. If any of these
                sound like your situation, you&apos;re not alone:
              </p>
              <ul className="mt-5 space-y-2.5">
                {PAIN_POINTS.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CheckIcon />
                    <span className="text-sm text-ink-500">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-base leading-relaxed text-ink-400">
                Whatever the reason, we can give you a clean exit. No judgment - just a
                fair cash offer and a closing date that works for you.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="section-wrap">
        <FadeIn>
          <div className="mx-auto max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-widest text-forest-500">
              Simple Process
            </p>
            <h2 className="mt-2 font-display text-display text-ink-600 text-balance">
              How Selling a Rental Works
            </h2>
            <div className="mt-6 space-y-4">
              {[
                {
                  step: "1",
                  title: "Tell us about the property",
                  detail:
                    "Address, tenant situation, condition, and what you want to accomplish. Takes about 5 minutes.",
                },
                {
                  step: "2",
                  title: "We make you a cash offer",
                  detail:
                    "Usually within 24-48 hours. We factor in the tenants, condition, and rental income or lack of it.",
                },
                {
                  step: "3",
                  title: "Close on your schedule",
                  detail:
                    "We handle the tenants, the title work, and the closing. You walk away with cash and no more landlord headaches.",
                },
              ].map((item, index) => (
                <FadeIn key={item.step} delay={index * 100}>
                  <div className="rounded-xl border border-stone-200 bg-white p-5">
                    <div className="mb-2 flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest-500 font-display text-sm text-white">
                        {item.step}
                      </span>
                      <h3 className="font-display text-base text-ink-600">{item.title}</h3>
                    </div>
                    <p className="pl-11 text-sm leading-relaxed text-ink-400">{item.detail}</p>
                  </div>
                </FadeIn>
              ))}
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
                Straight Answers for Landlords
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
            <h2 className="font-display text-display text-white text-balance">
              Ready to Stop Being a Landlord?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-base text-stone-400">
              Call us. Tell us about the property, the tenants, and what you&apos;re
              looking to do. We&apos;ll give you a fair cash offer - no obligation and no pressure.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <a href="#get-offer" className="btn-primary !bg-white !text-ink-600 hover:!bg-stone-100">
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
