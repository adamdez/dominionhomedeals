import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How We Buy Houses for Cash in Spokane & CDA",
  description:
    "Our simple 3-step process: tell us about your property, get a fair cash offer, and close on your schedule. No agents, no commissions, no repairs. Based in Spokane, WA.",
  alternates: { canonical: "https://dominionhomedeals.com/how-we-work" },
  openGraph: {
    title: "How We Buy Houses for Cash | Dominion Homes",
    description: "Fair cash offer, fast. Close in as fast as 2 weeks. No repairs, no commissions. See exactly how it works.",
    url: "https://dominionhomedeals.com/how-we-work",
    type: "website",
  },
};

const steps = [
  {
    number: "01",
    time: "60 seconds",
    title: "Tell Us About Your Property",
    description:
      "Fill out our short form or call/text us at 509-822-5460. We just need a property address and a little context. No inspections, no prep work, no cleaning.",
    details: [
      "Takes about 60 seconds with no obligation",
      "We never share your information with third parties",
      "A real member of our team responds",
    ],
  },
  {
    number: "02",
    time: "1-2 days",
    title: "Get a Fair Cash Offer",
    description:
      "Logan or someone on his team will review your property, often the same day. We look at comparable sales, property condition, and local market data so we can give you a number that makes sense.",
    details: [
      "Most offers are delivered within a day or two",
      "We explain how we arrived at the price",
      "Zero pressure if it is not the right fit",
    ],
  },
  {
    number: "03",
    time: "You choose",
    title: "Close on Your Schedule",
    description:
      "If the offer works for you, pick the closing date. We can move fast when needed, or give you more time if that is what your situation calls for. We handle the paperwork through title.",
    details: [
      "Close in as fast as 14 days or take more time",
      "We cover typical closing costs",
      "No commissions, no hidden fees, no surprises",
    ],
  },
] as const;

const faqs = [
  {
    q: "How do you determine your offer price?",
    a: "We look at recent comparable sales in your area, the condition of the property, likely repair costs, and the local market. We walk you through the logic so nothing feels hidden.",
  },
  {
    q: "Do I have to pay any fees or commissions?",
    a: "No. When you sell directly to us, there are no agent commissions and no hidden fees. We also cover typical closing costs.",
  },
  {
    q: "What if my house needs major repairs?",
    a: "That is fine. We buy houses in any condition, including houses with roof issues, foundation problems, fire damage, clutter, or years of deferred maintenance.",
  },
  {
    q: "How fast can you actually close?",
    a: "Some closings can happen in about two weeks. Others take longer because the seller needs more time. We work around the situation instead of forcing one timeline on everyone.",
  },
  {
    q: "Are you real estate agents?",
    a: "No. Dominion Homes, LLC is a real estate investment company. We buy properties directly. We are not licensed real estate agents or brokers, and this is not a solicitation for listings.",
  },
  {
    q: "What areas do you buy in?",
    a: "We buy across Spokane County, WA and Kootenai County, ID, including Spokane, Spokane Valley, Cheney, Airway Heights, Mead, Deer Park, Post Falls, Coeur d'Alene, Hayden, and Rathdrum.",
  },
  {
    q: "Is there any obligation if I fill out the form?",
    a: "None. Getting a cash offer from us is completely free and there is no obligation to move forward.",
  },
] as const;

const comparisons = [
  { label: "Commissions and fees", us: "$0", traditional: "5-6% plus closing costs" },
  { label: "Repairs needed", us: "None - sell as-is", traditional: "Often required before listing" },
  { label: "Showings and open houses", us: "None", traditional: "Often several weeks or longer" },
  { label: "Time to close", us: "As fast as 14 days", traditional: "Usually much longer" },
  { label: "Closing costs", us: "We cover them", traditional: "Usually seller paid in part" },
  { label: "Certainty of close", us: "Cash purchase", traditional: "Can depend on financing and inspections" },
  { label: "Inspections", us: "No traditional buyer inspection process", traditional: "Common and often renegotiated" },
] as const;

export default function HowWeWorkPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: "How to Sell Your House Fast for Cash in Spokane & CDA",
            description:
              "Our simple 3-step process to sell your house for cash with no commissions, no repairs, and a closing date that fits your situation.",
            step: steps.map((step, index) => ({
              "@type": "HowToStep",
              position: index + 1,
              name: step.title,
              text: step.description,
            })),
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((faq) => ({
              "@type": "Question",
              name: faq.q,
              acceptedAnswer: { "@type": "Answer", text: faq.a },
            })),
          }),
        }}
      />

      <section className="relative bg-cream-50 pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="mx-auto max-w-4xl px-5 text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-forest-600">Simple and Straightforward</p>
          <h1 className="font-display text-display text-ink-700 text-balance">Here&apos;s exactly how it works</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-ink-400">
            Selling your home should be simple. With Dominion Homes, it is. Three steps, no surprises, and a local team
            you can sit across the table from.
          </p>
        </div>
      </section>

      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-5">
          <div className="space-y-16 md:space-y-24">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className={`flex flex-col gap-8 md:flex-row md:items-start md:gap-16 ${
                  index % 2 !== 0 ? "md:flex-row-reverse" : ""
                }`}
              >
                <div className="flex shrink-0 flex-col items-center md:w-48 md:items-start">
                  <span className="font-display text-[5rem] font-bold leading-none text-forest-100">{step.number}</span>
                  <span className="mt-2 inline-flex rounded-full bg-forest-50 px-3 py-1 text-sm font-medium text-forest-700">
                    {step.time}
                  </span>
                </div>

                <div className="flex-1">
                  <h2 className="font-display text-2xl text-ink-700 md:text-3xl">{step.title}</h2>
                  <p className="mt-4 text-ink-400 leading-relaxed">{step.description}</p>
                  <ul className="mt-6 space-y-3">
                    {step.details.map((detail) => (
                      <li key={detail} className="flex items-start gap-3 text-ink-500">
                        <svg className="mt-0.5 h-5 w-5 shrink-0 text-forest-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center md:mt-24">
            <Link
              href="/#get-offer"
              className="inline-flex items-center rounded-xl bg-forest-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-forest-700 hover:shadow-xl"
            >
              Start Step 1 - It&apos;s Free
            </Link>
            <p className="mt-3 text-sm text-ink-300">Takes about 60 seconds. No obligation. Local team calls you.</p>
          </div>
        </div>
      </section>

      <section className="border-y border-sage-100 bg-white py-16 md:py-20">
        <div className="mx-auto max-w-5xl px-5">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-sage-100 bg-cream-50 p-7">
              <p className="text-sm font-semibold uppercase tracking-wider text-forest-600">Before You Decide</p>
              <h2 className="mt-2 font-display text-3xl text-ink-700">Start with the seller guide if you want the longer version.</h2>
              <p className="mt-4 text-sm leading-relaxed text-ink-400">
                If you are still comparing options, the guide walks through when a direct sale makes sense, what to ask
                a buyer, and what tends to matter most to sellers in real situations.
              </p>
              <Link
                href="/sell/guide"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-forest-600 transition-colors hover:text-forest-700"
              >
                Read the seller guide
                <span aria-hidden="true">-&gt;</span>
              </Link>
            </div>

            <div className="rounded-2xl border border-sage-100 bg-white p-7 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wider text-forest-600">Want Real Context?</p>
              <h2 className="mt-2 font-display text-3xl text-ink-700">Read the seller-story examples next.</h2>
              <p className="mt-4 text-sm leading-relaxed text-ink-400">
                The story pages are built around the types of inherited, rental, as-is, and relocation situations local
                homeowners usually call about.
              </p>
              <Link
                href="/stories"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-forest-600 transition-colors hover:text-forest-700"
              >
                Read seller stories
                <span aria-hidden="true">-&gt;</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-cream-50 py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-5">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-forest-600">Know Your Options</p>
            <h2 className="mt-2 font-display text-display text-ink-600 text-balance">Our cash offer vs. listing with an agent</h2>
            <p className="mx-auto mt-4 max-w-2xl text-ink-400">
              Both are valid paths. We want you to make the right choice for your situation, so here is the honest side-by-side.
            </p>
          </div>

          <div className="mt-12 overflow-hidden rounded-2xl border border-sage-200 bg-white shadow-sm">
            <div className="grid grid-cols-3 border-b border-sage-100 bg-forest-600 text-white">
              <div className="px-5 py-4 text-sm font-medium" />
              <div className="px-5 py-4 text-center text-sm font-bold">Sell to Dominion Homes</div>
              <div className="px-5 py-4 text-center text-sm font-medium">List with an Agent</div>
            </div>
            {comparisons.map((row, index) => (
              <div
                key={row.label}
                className={`grid grid-cols-3 ${index < comparisons.length - 1 ? "border-b border-sage-100" : ""} ${
                  index % 2 === 0 ? "bg-white" : "bg-cream-50/50"
                }`}
              >
                <div className="px-5 py-4 text-sm font-medium text-ink-600">{row.label}</div>
                <div className="px-5 py-4 text-center text-sm font-semibold text-forest-700">{row.us}</div>
                <div className="px-5 py-4 text-center text-sm text-ink-400">{row.traditional}</div>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-sm text-ink-300">
            If listing makes more sense for you, we will say so. We would rather earn your trust than force a sale.
          </p>
        </div>
      </section>

      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-5">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-forest-600">Common Questions</p>
            <h2 className="mt-2 font-display text-display text-ink-600">Frequently asked questions</h2>
          </div>

          <div className="mt-12 divide-y divide-sage-100">
            {faqs.map((faq) => (
              <details key={faq.q} className="group py-6">
                <summary className="marker:[font-size:0] flex cursor-pointer items-center justify-between text-lg font-medium text-ink-600 [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <svg className="ml-4 h-5 w-5 shrink-0 text-forest-500 transition-transform group-open:rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </summary>
                <p className="mt-4 leading-relaxed text-ink-400">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-forest-700 py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="font-display text-display text-white text-balance">Ready to see what your home is worth?</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-forest-200">
            No obligation. No pressure. Fill out the form or call/text us and one of us will get back to you.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/#get-offer"
              className="inline-flex items-center rounded-xl bg-white px-8 py-4 text-lg font-semibold text-forest-700 shadow-lg transition hover:bg-cream-50 hover:shadow-xl"
            >
              Get My Cash Offer
            </Link>
            <a
              href="sms:5098225460"
              className="inline-flex items-center gap-2 text-lg font-medium text-white/90 transition hover:text-white"
            >
              Or text us: 509-822-5460
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
