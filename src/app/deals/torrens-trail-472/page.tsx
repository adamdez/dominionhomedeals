// src/app/deals/torrens-trail-472/page.tsx
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { SITE } from '@/lib/constants'
import { InterestForm } from './InterestForm'

/* ------------------------------------------------------------------ */
/* Metadata                                                            */
/* ------------------------------------------------------------------ */
export const metadata: Metadata = {
  title: '472 Torrens Trail, Spirit Lake ID 83869 — 5 Acres, 2 Bed/2 Bath, $460K',
  description:
    'Move-in ready 2-bedroom, 2-bath home on 5 private acres in Spirit Lake, ID. Built 2016, 1,952 sq ft, asking $460K. Some finishing work needed. Direct from Dominion Home Deals.',
  openGraph: {
    title: '472 Torrens Trail — Spirit Lake, ID · 5 Acres · $460K',
    description:
      'Move-in ready 2bd/2ba on 5 acres built 2016. 1,952 sq ft. Asking $460K with some finishing work needed.',
    url: `${SITE.url}/deals/torrens-trail-472`,
    images: [{ url: '/images/torrens-trail/exterior-front.jpg', width: 800, height: 600 }],
  },
  alternates: { canonical: `${SITE.url}/deals/torrens-trail-472` },
}

/* ------------------------------------------------------------------ */
/* Property photos                                                      */
/* ------------------------------------------------------------------ */
const PHOTOS = [
  { src: '/images/torrens-trail/exterior-front.jpg',   alt: 'Exterior front view of 472 Torrens Trail',      span: 'col-span-2 row-span-2' },
  { src: '/images/torrens-trail/aerial.jpg',            alt: '5-acre aerial view of the property',            span: 'col-span-1 row-span-1' },
  { src: '/images/torrens-trail/property-view.jpg',     alt: 'Property and tree line',                        span: 'col-span-1 row-span-1' },
  { src: '/images/torrens-trail/living-room.jpg',       alt: 'Open living room',                              span: 'col-span-1 row-span-1' },
  { src: '/images/torrens-trail/kitchen.jpg',           alt: 'Kitchen',                                       span: 'col-span-1 row-span-1' },
  { src: '/images/torrens-trail/primary-bedroom.jpg',   alt: 'Primary bedroom',                               span: 'col-span-1 row-span-1' },
  { src: '/images/torrens-trail/primary-bath.jpg',      alt: 'Primary bathroom',                              span: 'col-span-1 row-span-1' },
  { src: '/images/torrens-trail/second-bedroom.jpg',    alt: 'Second bedroom',                                span: 'col-span-1 row-span-1' },
  { src: '/images/torrens-trail/second-bath.jpg',       alt: 'Second bathroom',                               span: 'col-span-1 row-span-1' },
  { src: '/images/torrens-trail/garage.jpg',            alt: 'Garage',                                        span: 'col-span-1 row-span-1' },
  { src: '/images/torrens-trail/driveway.jpg',          alt: 'Driveway approach',                             span: 'col-span-1 row-span-1' },
  { src: '/images/torrens-trail/exterior-back.jpg',     alt: 'Back of property',                              span: 'col-span-1 row-span-1' },
]

/* ------------------------------------------------------------------ */
/* Structured data                                                      */
/* ------------------------------------------------------------------ */
function JsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: '472 Torrens Trail, Spirit Lake ID 83869',
    description:
      'Move-in ready 2-bedroom, 2-bathroom home on 5 private acres in Spirit Lake, Idaho. Built 2016, 1,952 sq ft. Asking $460,000.',
    url: `${SITE.url}/deals/torrens-trail-472`,
    image: `${SITE.url}/images/torrens-trail/exterior-front.jpg`,
    offers: {
      '@type': 'Offer',
      price: '460000',
      priceCurrency: 'USD',
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: '472 Torrens Trail',
      addressLocality: 'Spirit Lake',
      addressRegion: 'ID',
      postalCode: '83869',
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
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

/* ------------------------------------------------------------------ */
/* Spec card                                                            */
/* ------------------------------------------------------------------ */
function SpecCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-white border border-stone-200 px-4 py-5 text-center shadow-soft">
      <span className="text-2xl">{icon}</span>
      <span className="text-xs font-semibold uppercase tracking-widest text-ink-400">{label}</span>
      <span className="font-display text-lg font-semibold text-ink-600 leading-tight">{value}</span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */
export default function TorrensTrailPage() {
  return (
    <>
      <JsonLd />

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="bg-forest-800 pt-10 pb-12">
        <div className="section-wrap !pt-10 !pb-8">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-2 text-xs text-forest-300">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link href="/deals" className="hover:text-white transition-colors">Deals</Link>
            <span>/</span>
            <span className="text-forest-100">472 Torrens Trail</span>
          </nav>

          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              {/* Badge */}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 border border-amber-400/40 px-3 py-1 text-xs font-semibold text-amber-300 mb-4">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse-soft" />
                Active Listing
              </span>

              <h1 className="font-display text-display text-white mb-2">
                472 Torrens Trail
              </h1>
              <p className="text-lg text-forest-200 font-body">
                Spirit Lake, ID 83869
              </p>

              {/* Tags */}
              <div className="mt-4 flex flex-wrap gap-2">
                {['5 Acres', 'Move-In Ready', 'Some Finishing Needed', '2016 Build', 'Kootenai County'].map(tag => (
                  <span key={tag} className="rounded-full bg-forest-700 border border-forest-600 px-3 py-1 text-xs text-forest-200">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Price */}
            <div className="rounded-2xl bg-white/10 border border-white/20 px-7 py-5 text-center backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-widest text-forest-300 mb-1">Asking Price</p>
              <p className="font-display text-4xl font-semibold text-white">$460,000</p>
              <p className="mt-1 text-xs text-forest-300">Direct from wholesaler</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Photo Grid ────────────────────────────────────────────── */}
      <section className="bg-stone-100 py-10">
        <div className="section-wrap !pt-0 !pb-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 rounded-2xl overflow-hidden">
            {/* Featured hero photo — full width on mobile, 2×2 on desktop */}
            <div className="col-span-2 sm:col-span-2 md:col-span-2 md:row-span-2 relative aspect-[4/3] md:aspect-auto md:h-full min-h-[240px]">
              <Image
                src={PHOTOS[0].src}
                alt={PHOTOS[0].alt}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
            {/* Remaining photos */}
            {PHOTOS.slice(1).map((photo) => (
              <div key={photo.src} className="relative aspect-[4/3]">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-ink-300">
            {PHOTOS.length} photos · 472 Torrens Trail, Spirit Lake ID
          </p>
        </div>
      </section>

      {/* ── Main content: Specs + Form ────────────────────────────── */}
      <section className="bg-stone-50">
        <div className="section-wrap">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-14">

            {/* Left — Property details */}
            <div className="lg:col-span-2 space-y-10">

              {/* Spec grid */}
              <div>
                <h2 className="font-display text-heading text-ink-600 mb-6">Property Details</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <SpecCard icon="🛏"  label="Bedrooms"   value="2 Bed"         />
                  <SpecCard icon="🚿"  label="Bathrooms"  value="2 Bath"        />
                  <SpecCard icon="📐"  label="Square Ft"  value="1,952 sq ft"   />
                  <SpecCard icon="🌲"  label="Lot Size"   value="5 Acres"       />
                  <SpecCard icon="🏗"  label="Year Built" value="2016"          />
                  <SpecCard icon="📍"  label="County"     value="Kootenai Co."  />
                </div>
              </div>

              {/* Divider */}
              <hr className="border-stone-200" />

              {/* Description */}
              <div>
                <h2 className="font-display text-heading text-ink-600 mb-4">About This Property</h2>
                <div className="space-y-4 text-ink-500 leading-relaxed font-body">
                  <p>
                    Set on 5 private acres in Spirit Lake, Idaho, this 2016-built home offers
                    nearly 2,000 square feet of thoughtfully designed living space with the quiet
                    and privacy of rural North Idaho — just minutes from town.
                  </p>
                  <p>
                    The home is move-in ready with some finishing work still needed, giving a
                    buyer the opportunity to add their personal touch at a price that reflects
                    it. The bones are solid, the build is recent, and the land is exceptional.
                  </p>
                  <p>
                    Two bedrooms and two full baths on a usable five-acre parcel makes this
                    an ideal setup for a primary residence, vacation property, or investment
                    hold in a growing North Idaho market.
                  </p>
                </div>
              </div>

              {/* Divider */}
              <hr className="border-stone-200" />

              {/* Highlights */}
              <div>
                <h2 className="font-display text-heading text-ink-600 mb-5">Highlights</h2>
                <ul className="space-y-3">
                  {[
                    { icon: '✅', text: 'Move-in ready — some interior finishing work remaining' },
                    { icon: '🏡', text: '2016 construction — modern systems, no deferred maintenance surprises' },
                    { icon: '🌲', text: 'Full 5 acres — privacy, trees, and usable land' },
                    { icon: '📍', text: 'Spirit Lake, ID — growing Kootenai County corridor' },
                    { icon: '💰', text: 'Priced to move — $460K direct from wholesaler, no agent commissions' },
                    { icon: '⚡', text: 'Fast close available — we can work to your timeline' },
                  ].map(({ icon, text }) => (
                    <li key={text} className="flex items-start gap-3 text-ink-500 font-body text-sm">
                      <span className="text-base mt-0.5 shrink-0">{icon}</span>
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Divider */}
              <hr className="border-stone-200" />

              {/* Property facts table */}
              <div>
                <h2 className="font-display text-heading text-ink-600 mb-5">Property Facts</h2>
                <div className="rounded-2xl border border-stone-200 overflow-hidden">
                  <table className="w-full text-sm font-body">
                    <tbody>
                      {[
                        ['Address',       '472 Torrens Trail'],
                        ['City',          'Spirit Lake'],
                        ['State',         'Idaho'],
                        ['ZIP Code',      '83869'],
                        ['County',        'Kootenai County'],
                        ['Bedrooms',      '2'],
                        ['Bathrooms',     '2 Full'],
                        ['Sq Footage',    '1,952 sq ft'],
                        ['Lot Size',      '5 Acres'],
                        ['Year Built',    '2016'],
                        ['Condition',     'Move-in ready, some finishing needed'],
                        ['Asking Price',  '$460,000'],
                        ['Property Type', 'Single Family Residential'],
                      ].map(([label, value], i) => (
                        <tr key={label} className={i % 2 === 0 ? 'bg-stone-50' : 'bg-white'}>
                          <td className="px-5 py-3 font-semibold text-ink-500 w-2/5">{label}</td>
                          <td className="px-5 py-3 text-ink-600">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Right — Interest form (sticky on desktop) */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <div className="rounded-2xl border border-stone-200 bg-white shadow-elevated overflow-hidden">
                  {/* Form header */}
                  <div className="bg-forest-600 px-6 py-5">
                    <h2 className="font-display text-lg font-semibold text-white">Interested in This Property?</h2>
                    <p className="mt-1 text-xs text-forest-200 leading-relaxed">
                      We'll reach out within a few hours to answer questions or schedule a showing.
                    </p>
                  </div>

                  {/* Form body */}
                  <div className="px-6 py-6">
                    <InterestForm />
                  </div>
                </div>

                {/* Direct contact nudge */}
                <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 px-5 py-4 text-center">
                  <p className="text-xs font-semibold text-amber-700 mb-1">Prefer to talk first?</p>
                  <a
                    href="tel:509-822-5460"
                    className="font-display text-lg font-semibold text-forest-700 hover:text-forest-500 transition-colors"
                  >
                    509-822-5460
                  </a>
                  <p className="text-[11px] text-ink-300 mt-0.5">Call or text — Adam or Logan answers</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Location context ──────────────────────────────────────── */}
      <section className="bg-forest-800">
        <div className="section-wrap">
          <div className="max-w-2xl">
            <h2 className="font-display text-display text-white mb-4">Spirit Lake, Idaho</h2>
            <p className="text-forest-200 leading-relaxed mb-6 font-body">
              Spirit Lake sits in the heart of Kootenai County — 35 miles north of Coeur d'Alene
              and less than an hour from Spokane. The area is growing fast, with strong demand for
              acreage properties from buyers seeking space without sacrificing access to services.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "To Coeur d'Alene", value: '~35 mi' },
                { label: 'To Spokane',        value: '~55 mi' },
                { label: 'County',            value: 'Kootenai' },
                { label: 'State',             value: 'Idaho' },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl bg-forest-700/60 border border-forest-600 px-4 py-4 text-center">
                  <p className="font-display text-lg font-semibold text-white">{value}</p>
                  <p className="text-xs text-forest-300 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────────── */}
      <section className="bg-stone-100">
        <div className="section-wrap text-center">
          <span className="trust-badge mb-5">Direct from Dominion Home Deals</span>
          <h2 className="font-display text-display text-ink-600 mb-4">
            Ready to move on 472 Torrens Trail?
          </h2>
          <p className="max-w-xl mx-auto text-ink-400 mb-8 leading-relaxed font-body">
            We're a local North Idaho team. No middlemen, no MLS fees, no delays.
            Fill out the form above or call us directly — we respond fast.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="tel:509-822-5460" className="btn-primary text-base px-8 py-4">
              Call 509-822-5460
            </a>
            <a href="sms:509-822-5460" className="btn-secondary text-base px-8 py-4">
              Send a Text
            </a>
          </div>
        </div>
      </section>

      {/* ── Deal footer ───────────────────────────────────────────── */}
      <div className="bg-stone-200 border-t border-stone-300">
        <div className="section-wrap !pt-5 !pb-5">
          <p className="text-center text-xs text-ink-400 leading-relaxed">
            Dominion Home Deals is a licensed wholesaler. This is not a retail listing.
            <br className="hidden sm:block" />
            Property details are provided for informational purposes. Buyer is encouraged to conduct
            independent due diligence. Contact us at{' '}
            <a href={`mailto:${SITE.email}`} className="underline underline-offset-2 hover:text-ink-600 transition-colors">
              {SITE.email}
            </a>{' '}
            with questions.
          </p>
        </div>
      </div>
    </>
  )
}
