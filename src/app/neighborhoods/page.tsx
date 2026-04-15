import type { Metadata } from 'next'
import Link from 'next/link'
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd'
import { getByCounty } from '@/lib/neighborhoods'

export const metadata: Metadata = {
  title: 'Areas We Serve — Spokane County & Kootenai County',
  description:
    'We buy houses for cash across Spokane County, WA and Kootenai County, ID. Spokane Valley, North Spokane, South Hill, Post Falls, CDA, Hayden, and more.',
  alternates: { canonical: 'https://dominionhomedeals.com/neighborhoods' },
  openGraph: {
    title: 'Areas We Serve | Dominion Homes',
    description:
      'Local cash home buyers in Spokane & CDA. We buy houses in every neighborhood across Spokane County and Kootenai County.',
    url: 'https://dominionhomedeals.com/neighborhoods',
    type: 'website',
  },
}

export default function NeighborhoodsPage() {
  const spokaneCounty = getByCounty('Spokane County')
  const kootenaiCounty = getByCounty('Kootenai County')

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://dominionhomedeals.com' },
          { name: 'Areas We Serve', url: 'https://dominionhomedeals.com/neighborhoods' },
        ]}
      />
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: 'Dominion Homes, LLC',
            description: 'Cash home buyers serving Spokane County, WA and Kootenai County, ID.',
            telephone: '+1-509-822-5460',
            url: 'https://dominionhomedeals.com',
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Spokane',
              addressRegion: 'WA',
              addressCountry: 'US',
            },
            areaServed: [
              ...spokaneCounty.map((n) => ({ '@type': 'City', name: `${n.name}, WA` })),
              ...kootenaiCounty.map((n) => ({ '@type': 'City', name: `${n.name}, ID` })),
            ],
          }),
        }}
      />

      {/* Hero */}
      <section className="relative bg-cream-50 pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="mx-auto max-w-4xl px-5 text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-forest-600">
            Areas We Serve
          </p>
          <h1 className="font-display text-display text-ink-700 text-balance">
            Spokane County &amp; Kootenai&nbsp;County
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-ink-400">
            From Spokane Valley to Coeur d&rsquo;Alene and everywhere in between — if
            it&rsquo;s in our area, we want to hear about it. We buy houses for cash in
            every neighborhood across both&nbsp;counties.
          </p>
        </div>
      </section>

      {/* Spokane County */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-forest-50">
              <span className="text-lg">🏔️</span>
            </div>
            <div>
              <h2 className="font-display text-2xl text-ink-700 md:text-3xl">
                Spokane County, WA
              </h2>
              <p className="text-sm text-ink-400">
                {spokaneCounty.length} neighborhoods and communities
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {spokaneCounty.map((n) => (
              <Link
                key={n.slug}
                href={`/neighborhoods/${n.slug}`}
                className="group rounded-xl border border-sage-100 bg-cream-50/50 p-5 transition hover:border-forest-200 hover:bg-forest-50/50 hover:shadow-sm"
              >
                <h3 className="font-display text-lg text-ink-600 group-hover:text-forest-700">
                  {n.name}
                </h3>
                <p className="mt-1 text-sm text-ink-400">{n.tagline}</p>
                <p className="mt-3 text-sm font-medium text-forest-600 opacity-0 transition group-hover:opacity-100">
                  See cash offers →
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Kootenai County */}
      <section className="bg-cream-50 py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-forest-50">
              <span className="text-lg">🌲</span>
            </div>
            <div>
              <h2 className="font-display text-2xl text-ink-700 md:text-3xl">
                Kootenai County, ID
              </h2>
              <p className="text-sm text-ink-400">
                {kootenaiCounty.length} neighborhoods and communities
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {kootenaiCounty.map((n) => (
              <Link
                key={n.slug}
                href={`/neighborhoods/${n.slug}`}
                className="group rounded-xl border border-sage-100 bg-white p-5 transition hover:border-forest-200 hover:bg-forest-50/50 hover:shadow-sm"
              >
                <h3 className="font-display text-lg text-ink-600 group-hover:text-forest-700">
                  {n.name}
                </h3>
                <p className="mt-1 text-sm text-ink-400">{n.tagline}</p>
                <p className="mt-3 text-sm font-medium text-forest-600 opacity-0 transition group-hover:opacity-100">
                  See cash offers →
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Coverage Note */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="font-display text-2xl text-ink-700">
            Don&rsquo;t See Your Area?
          </h2>
          <p className="mt-3 text-ink-400">
            We buy houses across all of Spokane County and Kootenai County — even in
            unincorporated areas and rural properties. If you&rsquo;re within our
            service area, we want to talk.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/#get-offer"
              className="inline-flex items-center rounded-xl bg-forest-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-forest-700 hover:shadow-xl"
            >
              Get Your Cash Offer
            </Link>
            <a
              href="sms:5098225460"
              className="inline-flex items-center gap-2 text-lg font-medium text-ink-500 transition hover:text-forest-700"
            >
              Or text us: 509-822-5460
            </a>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-forest-700 py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="font-display text-display text-white text-balance">
            We Know These Neighborhoods Because We Live&nbsp;Here
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-forest-200">
            Adam and Logan are based in Spokane. We drive these streets
            every day. Let us make you a fair cash offer on your property.
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
  )
}
