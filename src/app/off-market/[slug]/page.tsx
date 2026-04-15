import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SITE } from '@/lib/constants'
import {
  getOffMarketListing,
  getOffMarketSlugs,
  getSiteUrl,
  type OffMarketListing,
} from '@/lib/off-market-listings'
import { DealInterestForm } from '@/components/off-market/DealInterestForm'
import { ListingGallery } from '@/components/off-market/ListingGallery'
import { OffMarketStickyBar } from '@/components/off-market/OffMarketStickyBar'

export function generateStaticParams() {
  return getOffMarketSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const l = getOffMarketListing(slug)
  if (!l) return { title: 'Listing' }
  const base = getSiteUrl()
  return {
    title: `${l.title} — ${l.locationLine}`,
    description: l.summary,
    robots: { index: false, follow: false },
    openGraph: {
      title: `${l.title} — ${l.priceDisplay}`,
      description: l.summary,
      url: `${base}/off-market/${l.slug}`,
      images: [{ url: l.cardImageSrc, width: 1200, height: 630 }],
    },
    alternates: { canonical: `${base}/off-market/${l.slug}` },
  }
}

function JsonLd({ l }: { l: OffMarketListing }) {
  const base = getSiteUrl()
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: `${l.title}, ${l.locationLine}`,
    description: l.summary,
    url: `${base}/off-market/${l.slug}`,
    image: `${base}${l.photos[0]?.src ?? l.cardImageSrc}`,
    offers: { '@type': 'Offer', price: String(l.priceNumeric), priceCurrency: 'USD' },
    address: {
      '@type': 'PostalAddress',
      streetAddress: l.streetAddress,
      addressLocality: l.city,
      addressRegion: l.state,
      postalCode: l.zip,
      addressCountry: 'US',
    },
    seller: {
      '@type': 'Organization',
      name: SITE.legalName,
      telephone: SITE.phone,
      url: SITE.url,
    },
  }
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
  )
}

export default async function OffMarketListingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const l = getOffMarketListing(slug)
  if (!l) notFound()

  const mapsEmbed = `https://www.google.com/maps?q=${encodeURIComponent(l.mapQuery)}&output=embed`
  const mapsSatellite = `https://www.google.com/maps/@${l.lat},${l.lng},18z/data=!3m1!1e3`
  const earthUrl = `https://earth.google.com/web/search/${encodeURIComponent(`${l.streetAddress}, ${l.city}, ${l.state} ${l.zip}`)}`
  const countyUrl = 'https://id-kootenai.publicaccessnow.com/Assessor/PropertySearch.aspx'

  return (
    <>
      <JsonLd l={l} />
      <OffMarketStickyBar propertyTitle={l.title} phone={SITE.phone} phoneDisplay={SITE.phone} />

      <section className="relative min-h-[56vh] overflow-hidden bg-[#0a1410] pt-28 pb-16 sm:pt-32 sm:pb-20">
        <div className="absolute inset-0">
          <Image
            src={l.photos[0]?.src ?? l.cardImageSrc}
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a1410] via-[#0a1410]/75 to-[#0a1410]/35" />
        </div>
        <div className="relative mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
          <nav className="mb-8 flex flex-wrap items-center gap-2 text-xs text-white/70">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/off-market" className="hover:text-white transition-colors">
              Off-market
            </Link>
            <span>/</span>
            <span className="text-white/90">{l.title}</span>
          </nav>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/90">{l.eyebrow}</p>
          <h1 className="font-display text-hero text-white text-balance max-w-4xl">{l.title}</h1>
          <p className="mt-3 text-lg text-stone-200">{l.locationLine}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {l.tags.map((t) => (
              <span
                key={t}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-stone-100"
              >
                {t}
              </span>
            ))}
          </div>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">Asking price</p>
              <p className="font-display text-4xl font-semibold text-white sm:text-5xl">{l.priceDisplay}</p>
              <p className="mt-2 max-w-xl text-sm text-stone-300">{l.conditionSummary}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="#inquire"
                className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-3.5 text-[15px] font-semibold text-ink-700 shadow-elevated transition hover:bg-stone-100"
              >
                Request private details
              </a>
              <a
                href={`tel:${SITE.phone}`}
                className="inline-flex items-center justify-center rounded-xl border border-white/30 px-8 py-3.5 text-[15px] font-semibold text-white transition hover:bg-white/10"
              >
                Call {SITE.phone}
              </a>
            </div>
          </div>
        </div>
      </section>

      <ListingGallery photos={l.photos} prioritySrc={l.photos[0]?.src} />

      <section className="border-t border-stone-200 bg-stone-50 pb-28 md:pb-0">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 lg:gap-4">
            {[
              { label: 'Beds', value: l.beds },
              { label: 'Baths', value: l.baths },
              { label: 'Sq ft', value: l.sqft },
              { label: 'Lot', value: l.lot },
              { label: 'Built', value: l.year },
            ].map((row) => (
              <div
                key={row.label}
                className="rounded-2xl border border-stone-200/90 bg-white px-4 py-4 text-center shadow-soft"
              >
                <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-400">{row.label}</p>
                <p className="mt-1 font-display text-lg font-semibold text-ink-600">{row.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-14">
            <div className="lg:col-span-2 space-y-12">
              <div>
                <h2 className="font-display text-heading text-ink-600 mb-6">About this property</h2>
                <div className="space-y-5 text-ink-500 leading-relaxed">
                  {l.paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>
              <div>
                <h2 className="font-display text-heading text-ink-600 mb-5">Highlights</h2>
                <ul className="space-y-3">
                  {l.highlights.map((h) => (
                    <li key={h.text} className="flex gap-3 text-sm text-ink-500 leading-relaxed">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-forest-500" />
                      {h.text}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="font-display text-heading text-ink-600 mb-5">Property facts</h2>
                <div className="overflow-hidden rounded-2xl border border-stone-200">
                  <table className="w-full text-sm">
                    <tbody>
                      {l.facts.map(([k, v], i) => (
                        <tr key={k} className={i % 2 === 0 ? 'bg-stone-50' : 'bg-white'}>
                          <td className="w-2/5 px-5 py-3 font-semibold text-ink-500">{k}</td>
                          <td className="px-5 py-3 text-ink-600">{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div id="inquire" className="scroll-mt-28 lg:scroll-mt-32" />
              <div className="lg:sticky lg:top-28">
                <div className="rounded-2xl border border-stone-200/90 bg-white p-1 shadow-elevated">
                  <div className="rounded-[14px] bg-forest-800 px-6 py-6">
                    <h2 className="font-display text-lg font-semibold text-white">Private inquiry</h2>
                    <p className="mt-2 text-xs leading-relaxed text-stone-300">
                      We respond within hours. No obligation — ask questions or request a showing.
                    </p>
                  </div>
                  <div className="px-5 py-6">
                    <DealInterestForm
                      address={l.streetAddress}
                      city={l.city}
                      state={l.state}
                      zip={l.zip}
                      landingPage={`/off-market/${l.slug}`}
                      source={l.leadSource}
                      propertyLabel={l.title}
                      submitLabel="Request private details"
                      variant="prestige"
                    />
                  </div>
                </div>
                <div className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50/90 px-5 py-4 text-center">
                  <p className="text-xs font-semibold text-amber-900/90">Prefer to talk first?</p>
                  <a
                    href={`tel:${SITE.phone}`}
                    className="mt-1 inline-block font-display text-lg font-semibold text-forest-800 hover:text-forest-600"
                  >
                    {SITE.phone}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#0f1f14] py-14 lg:py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
          <h2 className="font-display text-display text-white mb-3">{l.neighborhoodTitle}</h2>
          <p className="max-w-2xl text-forest-100/90 leading-relaxed mb-10">{l.neighborhoodBody}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
            {l.distanceChips.map((c) => (
              <div
                key={c.label}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-center backdrop-blur-sm"
              >
                <p className="font-display text-lg font-semibold text-white">{c.value}</p>
                <p className="text-xs text-stone-400 mt-1">{c.label}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-widest text-forest-300 mb-3">Map</h3>
              <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-black shadow-elevated">
                <iframe
                  title="Property location map"
                  src={mapsEmbed}
                  className="h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <p className="mt-2 text-xs text-stone-500">
                Approximate location for planning — verify access and boundaries independently.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={mapsSatellite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-amber-200/95 hover:text-amber-100 underline underline-offset-2"
                >
                  Satellite view in Google Maps
                </a>
                <a
                  href={earthUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-amber-200/95 hover:text-amber-100 underline underline-offset-2"
                >
                  Open in Google Earth
                </a>
                <a
                  href={countyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-amber-200/95 hover:text-amber-100 underline underline-offset-2"
                >
                  Kootenai County parcel search
                </a>
              </div>
            </div>
            <div className="flex flex-col justify-center rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
              <h3 className="font-display text-xl text-white mb-3">Due diligence</h3>
              <p className="text-sm text-stone-300 leading-relaxed">
                Aerial and map layers are for convenience only. Property lines, acreage, easements, and condition must be
                verified by buyer with the county, title, and qualified inspectors. Dominion Homes is a licensed
                wholesaler; this is not a retail MLS listing.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-stone-100 py-14">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-display text-ink-600 mb-4">Ready to move forward?</h2>
          <p className="mx-auto max-w-lg text-ink-500 mb-8">
            Local team — no call center. Call or send a private inquiry above.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href={`tel:${SITE.phone}`} className="btn-primary text-base px-8 py-4">
              Call {SITE.phone}
            </a>
            <a href={`sms:${SITE.phone}`} className="btn-secondary text-base px-8 py-4">
              Send a text
            </a>
          </div>
        </div>
      </section>

      <div className="border-t border-stone-200 bg-stone-200/80">
        <div className="mx-auto max-w-6xl px-5 py-6 text-center text-xs text-ink-500 leading-relaxed">
          Dominion Homes is a licensed wholesaler. This is not a retail MLS listing. Property details are provided
          for informational purposes. Buyer is encouraged to conduct independent due diligence. Questions:{' '}
          <a href={`mailto:${SITE.email}`} className="underline underline-offset-2 hover:text-ink-700">
            {SITE.email}
          </a>
          .
        </div>
      </div>
    </>
  )
}
