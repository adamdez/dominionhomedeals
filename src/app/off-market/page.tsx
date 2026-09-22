import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getAllOffMarketListings } from '@/lib/off-market-listings'
import { SITE } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Off-market opportunities',
  description:
    'Private, direct opportunities from Dominion Homes — North Idaho and Eastern Washington. Not listed on the MLS.',
  robots: { index: false, follow: false },
}

export default function OffMarketHubPage() {
  const listings = getAllOffMarketListings()

  return (
    <>
      <section className="relative overflow-hidden bg-[#0f1f14] pt-28 pb-16 sm:pt-32 sm:pb-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(94,153,104,0.35),transparent)]" />
        <div className="relative mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
          <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.25em] text-forest-300">
            Dominion Homes
          </p>
          <h1 className="font-display text-center text-hero text-white text-balance">Off-market opportunities</h1>
          <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-relaxed text-stone-300">
            Direct access to select properties we are placing with qualified buyers. Not on the MLS. Shareable private
            links — inquire for details or a showing.
          </p>
          <p className="mt-6 text-center text-sm text-stone-500">
            Questions?{' '}
            <a href={`tel:${SITE.phone}`} className="font-semibold text-amber-200/90 hover:text-amber-100">
              {SITE.phone}
            </a>
          </p>
        </div>
      </section>

      <section className="bg-stone-100 py-14 lg:py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
          <h2 className="font-display text-heading text-ink-600 mb-10 text-center">Current offerings</h2>
          <div className="mx-auto grid max-w-3xl gap-8 lg:gap-10">
            <Link href="/off-market/11211-e-black-rd" className="group overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-elevated">
              <div className="relative aspect-[16/10] overflow-hidden bg-stone-200">
                <Image src="/images/black-road/2055.webp" alt="Tudor-inspired Black Road home in its wooded setting" fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover object-[center_60%] transition duration-500 group-hover:scale-[1.03]" priority />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 p-6 text-white"><p className="mb-2 text-xs uppercase tracking-[.18em] text-amber-100">Interactive property tour</p><p className="font-display text-2xl">11211 E Black Rd</p><p className="mt-1 text-sm text-white/85">Chattaroy WA · 12.8 acres</p></div>
              </div>
              <div className="flex items-center justify-between gap-4 px-6 py-5"><div><p className="text-xs uppercase tracking-wider text-ink-400">Explore the property</p><p className="mt-1 font-display text-xl text-ink-600">Step inside Black Road</p></div><span className="text-sm font-semibold text-forest-600 group-hover:underline">View tour →</span></div>
            </Link>
            {listings.map((l, index) => (
              <Link
                key={l.slug}
                href={`/off-market/${l.slug}`}
                className="group overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-elevated"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-stone-200">
                  <Image
                    src={l.cardImageSrc}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 768px"
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    quality={72}
                    priority={index === 0}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-80" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                    <p className="font-display text-xl font-semibold leading-tight">{l.title}</p>
                    <p className="mt-1 text-sm text-white/85">{l.locationLine}</p>
                  </div>
                </div>
                <div className="flex items-end justify-between gap-4 px-6 py-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                      {l.buyNowDisplay ? 'Buy Now' : l.priceNumeric > 0 ? 'Asking' : 'Terms'}
                    </p>
                    <p className="font-display text-2xl font-semibold text-ink-600">{l.priceDisplay}</p>
                  </div>
                  <span className="text-sm font-semibold text-forest-600 group-hover:underline">View details</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
