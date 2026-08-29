import type { Metadata } from "next";
import Link from "next/link";
import { FadeIn } from "@/components/animations/FadeIn";
import { SellerOptionsJourneyTracker } from "@/components/analytics/SellerOptionsJourneyTracker";
import { LeadForm } from "@/components/forms/LeadForm";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { SellStickyBar } from "@/components/sell/SellStickyBar";
import { SITE } from "@/lib/constants";
import { getSellerOptionsLanding, type SellerOptionsSearchParams } from "@/lib/seller-options-landing";

export const metadata: Metadata = {
  title: "Help Deciding How to Sell Your Spokane or Coeur d'Alene House",
  description:
    "Need to sell soon or unsure where to start? Talk through selling as-is, listing with an agent, repairs, and what you could keep in Spokane and the Coeur d'Alene area.",
  alternates: { canonical: `${SITE.url}/sell/options` },
  openGraph: {
    title: "Need Help Deciding How to Sell?",
    description:
      "A local conversation about your house, your timing, and your options in Spokane and the Coeur d'Alene area. Understand the choices before deciding what comes next.",
    url: `${SITE.url}/sell/options`,
    type: "website",
  },
};

const PRIORITIES = [
  {
    title: "Know what you could keep",
    copy: "Look beyond the sale price. Compare repairs, agent fees, closing costs, and the bills you may pay while waiting to sell.",
  },
  {
    title: "Avoid a repair project",
    copy: "If repairs or a big cleanout feel like too much to take on, let's include ways to sell the house as it is.",
  },
  {
    title: "Make the timing work",
    copy: "Maybe you need to move quickly—or need more time. Tell us about the deadline, move, or family decision the sale needs to work around.",
  },
  {
    title: "Work around people and belongings",
    copy: "Tenants, family members, or a house full of belongings can make a sale harder. Talk through what needs to happen before everyone can move on.",
  },
  {
    title: "Know what could delay closing",
    copy: "Understand the buyer's financing, inspections, title work, and other conditions before you rely on a closing date.",
  },
  {
    title: "Talk through something else",
    copy: "If money owed, paperwork, privacy, or family decisions are making this complicated, start there. You don't have to fit a checklist.",
  },
] as const;

const CONVERSATION_STEPS = [
  {
    title: "First, we listen",
    copy: "Tell us about the house, the timing, and what you want to be different after the sale.",
  },
  {
    title: "Then, we compare",
    copy: "Look at realistic selling paths and the costs behind the numbers. We'll explain what we're assuming and what still needs checking.",
  },
  {
    title: "You choose the next step",
    copy: "Ask questions, take time to think, or decide whether an offer makes sense. Talking with us doesn't commit you to selling.",
  },
] as const;

const PATHS = [
  {
    label: "Path 1",
    title: "List as-is with an agent",
    bestFor: "Worth considering if you want buyers to see the house without fixing it up first.",
    tradeoffs: [
      "You can list a house in its current condition",
      "Your price and the house's condition affect who may want it",
      "Include agent fees, closing costs, and bills while you wait",
      "Buyers may still ask for inspections, repairs, or other terms",
    ],
  },
  {
    label: "Path 2",
    title: "Repair and list",
    bestFor: "Worth considering if the likely increase in price is greater than the repairs, time, and other costs.",
    tradeoffs: [
      "Improvements may support a higher sale price",
      "Plan for the work, upfront cost, and possible delays",
      "Agent fees and bills while you wait affect what you keep",
      "Financing, inspections, and appraisals can affect closing",
    ],
  },
  {
    label: "Path 3",
    title: "Direct as-is offer",
    bestFor: "Worth considering if you'd rather skip listing prep or talk through a closing schedule that works for you.",
    tradeoffs: [
      "Discuss selling without taking on repairs first",
      "Know who the buyer is and what must happen before closing",
      "The price allows for repairs, resale costs, risk, and profit",
      "Ask which numbers are estimates and how they were worked out",
    ],
  },
  {
    label: "Path 4",
    title: "A different closing arrangement",
    bestFor: "Sometimes timing, belongings, or another issue calls for different terms. It depends on the house, the people involved, and what can be agreed.",
    tradeoffs: [
      "Timing or access may be adjusted by agreement",
      "A holdback or novation is not right for every sale",
      "Get costs, responsibilities, and risks explained in writing",
      "Review legal, tax, title, or brokerage questions with a licensed professional",
    ],
  },
] as const;

const NET_ROWS = [
  ["Sale price", "What a buyer might pay as the house stands", "What a buyer might pay after the work", "What the written offer actually says"],
  ["Repairs and cleanup", "Work you choose or agree to in the contract", "Work you arrange or pay for", "Usually reflected in the offer"],
  ["Agent fees and seller costs", "Subtract fees and costs you agree to pay", "Subtract fees and costs you agree to pay", "Check which costs the agreement says you pay"],
  ["Bills while you wait", "Allow for the time it takes to sell", "Include repair time as well as sale time", "Check the timing and costs in the agreement"],
  ["What you could keep", "As-is sale price minus your costs and payoffs", "Repaired sale price minus your costs and payoffs", "Offer price minus your costs and payoffs"],
] as const;

export default async function SellerOptionsPage({
  searchParams,
}: {
  searchParams: Promise<SellerOptionsSearchParams>;
}) {
  // Render the matching message on the server for people and ad crawlers alike.
  // The existing ad URLs already carry the four approved utm_content values.
  const landing = getSellerOptionsLanding(await searchParams);
  const priorities = landing.priorities.length ? landing.priorities : PRIORITIES;
  const paths = landing.pathOrder.map((index) => PATHS[index]);
  const phoneClean = SITE.phone.replace(/\D/g, "");

  return (
    <>
      <SellerOptionsJourneyTracker />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: SITE.url },
          { name: "Sell Your House", url: `${SITE.url}/sell` },
          { name: "Compare Selling Options", url: `${SITE.url}/sell/options` },
        ]}
      />

      <section data-seller-landing={landing.key} data-intent-lane={landing.lane} className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-20 lg:pt-40 lg:pb-24">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-stone-50 via-forest-50/30 to-amber-50/30" />
        <div className="pointer-events-none absolute -right-20 -top-24 h-[420px] w-[420px] rounded-full bg-forest-100/40 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
          <div className="grid items-start gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-14">
            <div className="pt-2">
              <FadeIn>
                <div className="trust-badge mb-5">Spokane &amp; Coeur d&apos;Alene seller options</div>
              </FadeIn>
              <FadeIn delay={80}>
                <h1 className="font-display text-[2.5rem] leading-[1.08] text-ink-700 text-balance sm:text-[3rem] lg:text-[3.5rem]">
                  {landing.headline}
                </h1>
              </FadeIn>
              <FadeIn delay={160}>
                <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-400">
                  {landing.introduction}
                </p>
              </FadeIn>
              <FadeIn delay={240}>
                {landing.lane === "general" ? <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div id="sell-soon" className="scroll-mt-28 rounded-2xl border border-forest-200 bg-white p-5">
                    <h2 className="font-display text-xl text-ink-600">Need to sell soon?</h2>
                    <p className="mt-2 text-sm leading-relaxed text-ink-400">
                      Tell us when you need to sell and what the house is like.
                      We&apos;ll talk through whether a direct as-is offer could fit your timing.
                    </p>
                    <a href="#get-options" className="mt-4 inline-flex text-sm font-semibold text-forest-600 underline underline-offset-4">
                      Talk about my timeline →
                    </a>
                  </div>
                  <div className="rounded-2xl border border-stone-200 bg-white p-5">
                    <h2 className="font-display text-xl text-ink-600">Still comparing options?</h2>
                    <p className="mt-2 text-sm leading-relaxed text-ink-400">
                      Not sure whether to fix the house, list it as-is, or consider
                      a direct offer? Let&apos;s look at what each could mean for you.
                    </p>
                    <a href="#compare" className="mt-4 inline-flex text-sm font-semibold text-forest-600 underline underline-offset-4">
                      Compare the paths →
                    </a>
                  </div>
                </div> : <div id="sell-soon" className="mt-6 scroll-mt-28 rounded-2xl border border-forest-200 bg-white p-5">
                  <h2 className="font-display text-xl text-ink-600">{landing.focusTitle}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-ink-400">{landing.focusCopy}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-4">
                    <a href="#get-options" className="text-sm font-semibold text-forest-600 underline underline-offset-4">
                      {landing.actionLabel} →
                    </a>
                    <a href="#compare" className="text-sm font-semibold text-forest-600 underline underline-offset-4">
                      See the selling paths →
                    </a>
                  </div>
                </div>}
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <a href={`tel:${phoneClean}`} className="btn-secondary">
                    Call {SITE.phone}
                  </a>
                </div>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-400">
                  No obligation to accept an offer. We&apos;re a home-buying and
                  wholesale business, not a real estate brokerage or independent
                  adviser. Listing with an agent may be the better choice.
                </p>
              </FadeIn>
            </div>

            <FadeIn delay={200} direction="left">
              <div id="get-options" className="scroll-mt-24">
                <LeadForm
                  intro={landing.formIntro}
                  addressLabel="What's the address of the house?"
                  submitLabel={landing.actionLabel}
                  submissionFlow="seller_options_v1"
                  requirePropertyState
                />
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <section aria-labelledby="conversation-heading" className="border-y border-stone-200 bg-stone-50 py-12">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
          <FadeIn>
            <h2 id="conversation-heading" className="font-display text-3xl text-ink-600 sm:text-4xl">
              What happens when we talk
            </h2>
            <ol className="mt-7 grid gap-6 md:grid-cols-3">
              {CONVERSATION_STEPS.map((step, index) => (
                <li key={step.title}>
                  <h3 className="text-base font-semibold text-forest-600">
                    <span aria-hidden="true">{index + 1}. </span>{step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-400">{step.copy}</p>
                </li>
              ))}
            </ol>
          </FadeIn>
        </div>
      </section>

      <section className="border-y border-stone-200 bg-white py-14">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
          <FadeIn>
            <p className="text-xs font-bold uppercase tracking-widest text-forest-500">Start with what matters to you</p>
            <h2 className="mt-2 max-w-3xl font-display text-display text-ink-600 text-balance">
              {landing.prioritiesHeading}
            </h2>
          </FadeIn>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {priorities.map((item, index) => (
              <FadeIn key={item.title} delay={index * 60}>
                <div className="h-full rounded-2xl border border-stone-200 bg-stone-50 p-6">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-500 text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 font-display text-xl text-ink-600">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-400">{item.copy}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section id="compare" className="section-wrap scroll-mt-24">
        <FadeIn>
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-forest-500">More than one way to sell</p>
            <h2 className="mt-2 font-display text-display text-ink-600 text-balance">
              Which path could work for your house?
            </h2>
          </div>
        </FadeIn>
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {paths.map((path, index) => (
            <FadeIn key={path.title} delay={index * 100}>
              <article className="h-full rounded-2xl border border-stone-200 bg-white p-7 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-forest-500">Path {index + 1}</p>
                <h3 className="mt-3 font-display text-2xl text-ink-600">{path.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-400">{path.bestFor}</p>
                <ul className="mt-6 space-y-3">
                  {path.tradeoffs.map((tradeoff) => (
                    <li key={tradeoff} className="flex items-start gap-3 text-sm leading-relaxed text-ink-500">
                      <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-forest-500" />
                      <span>{tradeoff}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </FadeIn>
          ))}
        </div>
      </section>

      <section className="border-y border-stone-200 bg-stone-100/60 py-16">
        <div className="mx-auto max-w-5xl px-5 sm:px-6 lg:px-8">
          <FadeIn>
            <p className="text-xs font-bold uppercase tracking-widest text-forest-500">Look beyond the sale price</p>
            <h2 className="mt-2 font-display text-display text-ink-600 text-balance">
              What could you actually keep?
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-ink-400">
              The sale price is just the starting point. Your <strong>net</strong> is
              what you could keep after repairs, selling costs, and amounts owed,
              such as your mortgage. Time matters too: bills don&apos;t stop while
              you&apos;re waiting to sell.
            </p>
          </FadeIn>

          <FadeIn delay={120}>
            <div className="mt-8 overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
              <table className="w-full min-w-[680px] text-left text-sm leading-relaxed">
                <caption className="sr-only">Compare what you could keep and the costs of three ways to sell</caption>
                <thead className="bg-forest-50 text-ink-600">
                  <tr>
                    <th scope="col" className="px-5 py-4">Compare</th>
                    <th scope="col" className="px-5 py-4">List as-is</th>
                    <th scope="col" className="px-5 py-4">Repair and list</th>
                    <th scope="col" className="px-5 py-4">Direct offer</th>
                  </tr>
                </thead>
                <tbody>
                  {NET_ROWS.map(([label, asIsListing, listing, direct]) => (
                    <tr key={label} className="border-t border-stone-200 align-top">
                      <th scope="row" className="px-5 py-4 font-semibold text-ink-600">{label}</th>
                      <td className="px-5 py-4 text-ink-400">{asIsListing}</td>
                      <td className="px-5 py-4 text-ink-400">{listing}</td>
                      <td className="px-5 py-4 text-ink-400">{direct}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="section-wrap">
        <div className="grid gap-8 lg:grid-cols-2">
          <FadeIn>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-8 sm:p-10">
              <p className="text-xs font-bold uppercase tracking-widest text-forest-500">Understanding the offer</p>
              <h2 className="mt-3 font-display text-3xl text-ink-600">Ask us to explain the numbers</h2>
              <p className="mt-4 leading-relaxed text-ink-400">
                We look at what the house could reasonably sell for after any
                planned work, then allow for repairs, buying and selling costs,
                time, risk, and profit. You can ask about those assumptions and
                compare the offer with listing the house as-is or after repairs.
                A lower offer is not automatically the right choice.
              </p>
              <Link href="/how-we-calculate-cash-offers-spokane-cda" className="mt-6 inline-flex text-sm font-semibold text-forest-600 hover:text-forest-700">
                See how Dominion calculates offers →
              </Link>
            </div>
          </FadeIn>
          <FadeIn delay={120}>
            <div className="rounded-2xl border border-stone-200 bg-white p-8 sm:p-10">
              <p className="text-xs font-bold uppercase tracking-widest text-forest-500">Being clear about our role</p>
              <h2 className="mt-3 font-display text-3xl text-ink-600">How Dominion fits into the sale</h2>
              <p className="mt-4 leading-relaxed text-ink-400">
                Dominion Homes is a home-buying and wholesale business,
                not a licensed real estate brokerage or independent adviser.
              </p>
              <p className="mt-4 leading-relaxed text-ink-400">
                We may purchase directly or assign a purchase agreement to another buyer;
                we are not always the final buyer. We seek a profit from purchases
                or assignments. Your written agreement should make the buyer,
                assignment rights, price, timing, and responsibilities clear.
                Different closing arrangements depend on the details and are never guaranteed.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-ink-300">
                This page is a starting point, not legal, tax, financial, title, or
                brokerage advice. Get advice from the appropriate licensed professional
                before relying on a special arrangement or making your final decision.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="section-wrap pt-0">
        <FadeIn>
          <div className="rounded-2xl bg-forest-600 px-7 py-14 text-center sm:px-14">
            <h2 className="font-display text-display text-white text-balance">Let&apos;s work out your next step.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-forest-100">
              Bring your questions and tell us what matters most. We&apos;ll explain
              where a direct offer could help—and where another path may make
              more sense.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <a href="#get-options" className="btn-primary">{landing.actionLabel}</a>
              <a href={`tel:${phoneClean}`} className="rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
                Call {SITE.phone}
              </a>
            </div>
          </div>
        </FadeIn>
      </section>

      <SellStickyBar actionHref="#get-options" actionLabel={landing.stickyLabel} />
    </>
  );
}
