import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About Us — Meet the Dominion Homes Team | Post Falls, ID',
  description:
    'Adam, Nathan, and Logan — three local guys who buy houses for cash across Spokane County and Kootenai County. Based in Post Falls, ID. Meet our team.',
  alternates: { canonical: 'https://dominionhomedeals.com/about' },
  openGraph: {
    title: 'About Dominion Homes | Local Cash Home Buyers',
    description:
      'Based in Post Falls, ID. We buy houses for cash across Spokane County, WA and Kootenai County, ID. No agents, no games — just three local guys.',
    url: 'https://dominionhomedeals.com/about',
    type: 'website',
  },
}

const team = [
  {
    name: 'Adam',
    initials: 'AD',
    role: 'Operations',
    bio: 'Adam runs the day-to-day at Dominion Homes from our Post Falls office. He oversees every deal from first call to closing, making sure the process stays smooth and every seller gets treated right. When he\'s not reviewing contracts, he\'s probably driving through a neighborhood with a coffee in hand.',
  },
  {
    name: 'Nathan',
    initials: 'NW',
    role: 'Sales & Acquisitions',
    bio: 'Nathan is usually the first person you\'ll talk to. He meets sellers at their kitchen table, walks the property, and puts together fair offers based on real numbers — not algorithms. He grew up in the Spokane area and knows these neighborhoods block by block.',
  },
  {
    name: 'Logan',
    initials: 'LA',
    role: 'Sales & Dispositions',
    bio: 'Logan handles the buy-side relationships and makes sure every property finds the right next owner. His network of local buyers and investors means deals close reliably and on time. He\'s the one making sure the whole pipeline moves.',
  },
]

const values = [
  {
    icon: (
      <svg className="h-7 w-7 text-forest-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
    title: 'Local First',
    text: 'We live here. We work here. Our office is in Post Falls. When we say we\'ll meet you at your kitchen table, we mean it — because we probably drove past your house this morning.',
  },
  {
    icon: (
      <svg className="h-7 w-7 text-forest-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Fair & Transparent',
    text: 'We show you exactly how we arrived at our offer. No hidden fees, no last-minute price changes. The number we shake hands on is the number you get at closing.',
  },
  {
    icon: (
      <svg className="h-7 w-7 text-forest-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: 'Zero Pressure',
    text: 'We don\'t use high-pressure sales tactics. If our offer doesn\'t work for you, we\'ll tell you that honestly — and if listing with an agent makes more sense, we\'ll say that too.',
  },
  {
    icon: (
      <svg className="h-7 w-7 text-forest-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
      </svg>
    ),
    title: 'Principals, Not Agents',
    text: 'We\'re not brokers and we\'re not middlemen. Dominion Homes buys properties directly with our own capital. You deal with us — the actual buyers — from start to finish.',
  },
]

export default function AboutPage() {
  return (
    <>
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'RealEstateAgent',
            name: 'Dominion Homes, LLC',
            description:
              'Local cash home buyers serving Spokane County, WA and Kootenai County, ID. We buy houses in any condition — no agents, no commissions, no repairs.',
            url: 'https://dominionhomedeals.com',
            telephone: '+1-208-625-8078',
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Post Falls',
              addressRegion: 'ID',
              addressCountry: 'US',
            },
            areaServed: [
              { '@type': 'County', name: 'Spokane County', containedInPlace: { '@type': 'State', name: 'Washington' } },
              { '@type': 'County', name: 'Kootenai County', containedInPlace: { '@type': 'State', name: 'Idaho' } },
            ],
            founder: [
              { '@type': 'Person', name: 'Adam', jobTitle: 'Operations' },
              { '@type': 'Person', name: 'Nathan', jobTitle: 'Sales & Acquisitions' },
              { '@type': 'Person', name: 'Logan', jobTitle: 'Sales & Dispositions' },
            ],
          }),
        }}
      />

      {/* Hero */}
      <section className="relative bg-cream-50 pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="mx-auto max-w-4xl px-5 text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-forest-600">
            About Us
          </p>
          <h1 className="font-display text-display text-ink-700 text-balance">
            We&rsquo;re Not a Call Center.{' '}
            <br className="hidden sm:block" />
            We&rsquo;re Your Neighbors.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-ink-400">
            Dominion Homes is a small, local team based in Post Falls, Idaho. We buy
            houses for cash across Spokane County and Kootenai County — and we do
            it face-to-face, not from behind a&nbsp;screen.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-5">
          <div className="grid gap-12 md:grid-cols-2 md:items-center md:gap-16">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-forest-600">
                Our Story
              </p>
              <h2 className="mt-2 font-display text-3xl text-ink-700 md:text-4xl">
                Built on Handshakes, Not&nbsp;Scripts
              </h2>
              <div className="mt-6 space-y-4 text-ink-400 leading-relaxed">
                <p>
                  Most &ldquo;we buy houses&rdquo; companies operate from out of state. They
                  send strangers, use scripts, and treat your home like a spreadsheet
                  line item. We started Dominion Homes because we saw how that played
                  out — and we knew the Spokane–CDA area deserved better.
                </p>
                <p>
                  We live here. We raise our families here. When we say we&rsquo;ll meet
                  you at your kitchen table to talk through your options, we mean it.
                  Adam&rsquo;s in Post Falls. Nathan and Logan are too. We know the
                  neighborhoods because we drive through them every single day.
                </p>
                <p>
                  Our goal is simple: give homeowners a fair, honest cash option so
                  they can move forward — on their terms. Whether that means closing
                  in two weeks or taking a few months, we work around your life, not
                  the other way around.
                </p>
              </div>
            </div>

            {/* Office / Local proof */}
            <div className="rounded-2xl border border-sage-100 bg-cream-50 p-8">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest-50">
                    <svg className="h-5 w-5 text-forest-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-ink-600">Based in Post Falls, Idaho</p>
                    <p className="mt-1 text-sm text-ink-400">Not a national call center — a real local office</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest-50">
                    <svg className="h-5 w-5 text-forest-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-ink-600">3-person local team</p>
                    <p className="mt-1 text-sm text-ink-400">You work directly with Adam, Nathan, or Logan</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest-50">
                    <svg className="h-5 w-5 text-forest-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-ink-600">We close through WFG Title</p>
                    <p className="mt-1 text-sm text-ink-400">WFG National Title Insurance Company, Eastern WA</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest-50">
                    <svg className="h-5 w-5 text-forest-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-ink-600">Call us: 208-625-8078</p>
                    <p className="mt-1 text-sm text-ink-400">A real person answers — not a recording</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="bg-cream-50 py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-5">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-forest-600">
              Meet the Team
            </p>
            <h2 className="mt-2 font-display text-display text-ink-600">
              The People Behind the Offer
            </h2>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {team.map((member) => (
              <div
                key={member.name}
                className="rounded-2xl border border-sage-100 bg-white p-8 text-center shadow-sm"
              >
                {/* Photo placeholder — replace with real images */}
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-sage-100">
                  <span className="font-display text-2xl font-bold text-forest-600">
                    {member.initials}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-xl text-ink-700">
                  {member.name}
                </h3>
                <p className="text-sm font-medium text-forest-600">{member.role}</p>
                <p className="mt-4 text-sm leading-relaxed text-ink-400">
                  {member.bio}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-ink-300">
            Want to add real team photos? Replace the initials above with actual headshots
            for maximum trust. E-E-A-T demands it.
          </p>
        </div>
      </section>

      {/* Our Values */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-5">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-forest-600">
              What We Stand For
            </p>
            <h2 className="mt-2 font-display text-display text-ink-600">
              How We Do Business
            </h2>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2">
            {values.map((v) => (
              <div
                key={v.title}
                className="rounded-2xl border border-sage-100 bg-cream-50/50 p-7"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-forest-50">
                  {v.icon}
                </div>
                <h3 className="mt-4 font-display text-lg text-ink-700">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-400">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Legal Disclaimer */}
      <section className="border-t border-sage-100 bg-cream-50 py-12">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <p className="text-xs leading-relaxed text-ink-300">
            Dominion Homes, LLC is a real estate investment company. We are principals — not
            licensed real estate agents or brokers. We buy properties directly. We are not
            affiliated with any government agency. This is not a solicitation for listings.
            Serving Spokane County, WA and Kootenai County, ID. Title services provided by
            WFG National Title Insurance Company, Eastern WA.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-forest-700 py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="font-display text-display text-white text-balance">
            Let&rsquo;s Talk About Your Property
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-forest-200">
            Reach out anytime. One of us — Adam, Nathan, or Logan — will get back
            to you personally.
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
