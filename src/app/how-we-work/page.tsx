import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'How We Buy Houses for Cash in Spokane & CDA | Dominion Homes',
  description:
    'Our simple 3-step process: tell us about your property, get a fair cash offer in 24 hours, and close on your schedule. No agents, no commissions, no repairs. Based in Post Falls, ID.',
  alternates: { canonical: 'https://dominionhomedeals.com/how-we-work' },
  openGraph: {
    title: 'How We Buy Houses for Cash | Dominion Homes',
    description:
      'Fair cash offer in 24 hours. Close in as fast as 2 weeks. No repairs, no commissions. See exactly how it works.',
    url: 'https://dominionhomedeals.com/how-we-work',
    type: 'website',
  },
}

const steps = [
  {
    number: '01',
    time: '60 seconds',
    title: 'Tell Us About Your Property',
    description:
      'Fill out our short form or give us a call at 208-625-8078. We just need a property address and a little context — that\'s it. No inspections, no prep work, no cleaning. We buy houses in any condition across Spokane County and Kootenai County.',
    details: [
      'Takes about 60 seconds — no obligation',
      'We never share your information with third parties',
      'A real member of our team responds — not a call center',
    ],
  },
  {
    number: '02',
    time: '24 hours',
    title: 'Get a Fair Cash Offer',
    description:
      'Adam, Nathan, or Logan will review your property — often the same day. We look at comparable sales, property condition, and local market data to build a fair, transparent cash offer. We\'ll walk you through the numbers so nothing feels hidden.',
    details: [
      'Most offers delivered within 24 hours',
      'We explain exactly how we arrived at our price',
      'Zero pressure — if it doesn\'t work, no hard feelings',
    ],
  },
  {
    number: '03',
    time: 'You choose',
    title: 'Close on Your Schedule',
    description:
      'Accept our offer and pick your closing date — as fast as two weeks or a few months out if you need time. We handle all the paperwork through WFG National Title in Eastern WA. No commissions, no fees, no surprises. The price we offer is the price you receive.',
    details: [
      'Close in as fast as 14 days — or take your time',
      'We pay all typical closing costs',
      'Title handled by WFG National Title — a name you know',
    ],
  },
]

const faqs = [
  {
    q: 'How do you determine your offer price?',
    a: 'We look at recent comparable sales in your specific neighborhood, the condition of the property, any repairs needed, and current market trends in Spokane and Kootenai County. We walk you through the numbers so you understand exactly how we got there.',
  },
  {
    q: 'Do I have to pay any fees or commissions?',
    a: 'No. When you sell directly to us, there are zero commissions and zero fees. The offer we make is the amount you walk away with at closing. We also cover typical closing costs.',
  },
  {
    q: 'What if my house needs major repairs?',
    a: 'We buy houses in any condition — roof damage, foundation issues, fire damage, hoarder situations, you name it. You don\'t need to fix, clean, or even empty the house. We handle all of that after closing.',
  },
  {
    q: 'How fast can you actually close?',
    a: 'Our fastest closing was 10 days. Most closings happen within 2-3 weeks. That said, if you need more time — maybe you\'re looking for your next place — we\'re flexible and will work with your schedule.',
  },
  {
    q: 'Are you real estate agents?',
    a: 'No. Dominion Homes, LLC is a real estate investment company. We are principals — we buy properties directly with our own cash. We are not licensed agents or brokers, and we are not affiliated with any government agency. This is not a solicitation for listings.',
  },
  {
    q: 'What areas do you buy in?',
    a: 'We buy houses across Spokane County, WA and Kootenai County, ID. That includes Spokane, Spokane Valley, North Spokane, South Hill, Cheney, Airway Heights, Mead, Deer Park, Post Falls, Coeur d\'Alene, Hayden, Rathdrum, and everywhere in between.',
  },
  {
    q: 'Is there any obligation if I fill out the form?',
    a: 'None whatsoever. Getting a cash offer from us is completely free with zero obligation. If our offer doesn\'t work for you, there\'s no pressure and no follow-up you don\'t want.',
  },
]

const comparisons = [
  { label: 'Commissions & fees', us: '$0', traditional: '5–6% ($10k–$25k+)' },
  { label: 'Repairs needed', us: 'None — sell as-is', traditional: 'Typically $25k–$70k+' },
  { label: 'Showings & open houses', us: 'None', traditional: 'Weeks or months' },
  { label: 'Time to close', us: 'As fast as 14 days', traditional: '75–100+ days average' },
  { label: 'Closing costs', us: 'We cover them', traditional: 'You pay them' },
  { label: 'Certainty of close', us: 'Cash — no financing contingency', traditional: 'Buyer financing can fall through' },
  { label: 'Inspections', us: 'None required', traditional: 'Buyer inspection + renegotiation' },
]

export default function HowWeWorkPage() {
  return (
    <>
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'HowTo',
            name: 'How to Sell Your House Fast for Cash in Spokane & CDA',
            description:
              'Our simple 3-step process to sell your house for cash with no commissions, no repairs, and close on your schedule.',
            step: steps.map((s, i) => ({
              '@type': 'HowToStep',
              position: i + 1,
              name: s.title,
              text: s.description,
            })),
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map((f) => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          }),
        }}
      />

      {/* Hero */}
      <section className="relative bg-cream-50 pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="mx-auto max-w-4xl px-5 text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-forest-600">
            Simple &amp; Straightforward
          </p>
          <h1 className="font-display text-display text-ink-700 text-balance">
            Here&rsquo;s Exactly How It&nbsp;Works
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-ink-400">
            Selling your home should be simple. With Dominion Homes, it is. Three
            steps, no surprises, and a local team you can sit&nbsp;across&nbsp;the&nbsp;table&nbsp;from.
          </p>
        </div>
      </section>

      {/* 3-Step Process */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-5">
          <div className="space-y-16 md:space-y-24">
            {steps.map((step, i) => (
              <div
                key={step.number}
                className={`flex flex-col gap-8 md:flex-row md:items-start md:gap-16 ${
                  i % 2 !== 0 ? 'md:flex-row-reverse' : ''
                }`}
              >
                {/* Number + Badge */}
                <div className="flex shrink-0 flex-col items-center md:items-start md:w-48">
                  <span className="font-display text-[5rem] font-bold leading-none text-forest-100">
                    {step.number}
                  </span>
                  <span className="mt-2 inline-flex rounded-full bg-forest-50 px-3 py-1 text-sm font-medium text-forest-700">
                    {step.time}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h2 className="font-display text-2xl text-ink-700 md:text-3xl">
                    {step.title}
                  </h2>
                  <p className="mt-4 text-ink-400 leading-relaxed">
                    {step.description}
                  </p>
                  <ul className="mt-6 space-y-3">
                    {step.details.map((d) => (
                      <li key={d} className="flex items-start gap-3 text-ink-500">
                        <svg
                          className="mt-0.5 h-5 w-5 shrink-0 text-forest-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* CTA after steps */}
          <div className="mt-16 text-center md:mt-24">
            <Link
              href="/#get-offer"
              className="inline-flex items-center rounded-xl bg-forest-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-forest-700 hover:shadow-xl"
            >
              Start Step 1 — It&rsquo;s Free
            </Link>
            <p className="mt-3 text-sm text-ink-300">
              Takes about 60 seconds &middot; No obligation &middot; Local team calls you
            </p>
          </div>
        </div>
      </section>

      {/* Cash Offer vs Listing Comparison */}
      <section className="bg-cream-50 py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-5">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-forest-600">
              Know Your Options
            </p>
            <h2 className="mt-2 font-display text-display text-ink-600 text-balance">
              Our Cash Offer vs. Listing with an&nbsp;Agent
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-ink-400">
              Both are valid paths. We want you to make the right choice for your
              situation — here&rsquo;s an honest side-by-side.
            </p>
          </div>

          <div className="mt-12 overflow-hidden rounded-2xl border border-sage-200 bg-white shadow-sm">
            {/* Table Header */}
            <div className="grid grid-cols-3 border-b border-sage-100 bg-forest-600 text-white">
              <div className="px-5 py-4 text-sm font-medium" />
              <div className="px-5 py-4 text-center text-sm font-bold">
                Sell to Dominion Homes
              </div>
              <div className="px-5 py-4 text-center text-sm font-medium">
                List with an Agent
              </div>
            </div>
            {/* Rows */}
            {comparisons.map((row, i) => (
              <div
                key={row.label}
                className={`grid grid-cols-3 ${
                  i < comparisons.length - 1 ? 'border-b border-sage-100' : ''
                } ${i % 2 === 0 ? 'bg-white' : 'bg-cream-50/50'}`}
              >
                <div className="px-5 py-4 text-sm font-medium text-ink-600">
                  {row.label}
                </div>
                <div className="px-5 py-4 text-center text-sm font-semibold text-forest-700">
                  {row.us}
                </div>
                <div className="px-5 py-4 text-center text-sm text-ink-400">
                  {row.traditional}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-sm text-ink-300">
            Every situation is different. If listing makes more sense for you, we&rsquo;ll
            tell you — we&rsquo;d rather earn your trust than your house.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-5">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-forest-600">
              Common Questions
            </p>
            <h2 className="mt-2 font-display text-display text-ink-600">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="mt-12 divide-y divide-sage-100">
            {faqs.map((faq) => (
              <details key={faq.q} className="group py-6">
                <summary className="flex cursor-pointer items-center justify-between text-lg font-medium text-ink-600 marker:[font-size:0] [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <svg
                    className="ml-4 h-5 w-5 shrink-0 text-forest-500 transition-transform group-open:rotate-45"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </summary>
                <p className="mt-4 leading-relaxed text-ink-400">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-forest-700 py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="font-display text-display text-white text-balance">
            Ready to See What Your Home Is&nbsp;Worth?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-forest-200">
            No obligation. No pressure. Fill out the form above or give us a call —
            one of us will pick up the phone.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/#get-offer"
              className="inline-flex items-center rounded-xl bg-white px-8 py-4 text-lg font-semibold text-forest-700 shadow-lg transition hover:bg-cream-50 hover:shadow-xl"
            >
              Get My Cash Offer
            </Link>
            <a
              href="tel:2086258078"
              className="inline-flex items-center gap-2 text-lg font-medium text-white/90 transition hover:text-white"
            >
              Or call 208-625-8078
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
