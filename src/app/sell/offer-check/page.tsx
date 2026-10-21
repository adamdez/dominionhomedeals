import type { Metadata } from 'next'
import { MetaSellerQualifier, MetaSellerFormJump } from '@/components/forms/MetaSellerQualifier'
import { SITE } from '@/lib/constants'
import { META_SELLER_LANDINGS, resolveMetaSellerVariant } from '@/lib/meta-seller-landing'

export const metadata: Metadata = {
  title: 'Request an As-Is Cash Offer',
  description: 'Discuss an as-is property sale with Dominion Homes, whether you are ready now or still considering your options.',
  openGraph: {
    title: 'Request an As-Is Cash Offer',
    description: 'Discuss an as-is property sale with Dominion Homes, whether you are ready now or still considering your options.',
    url: `${SITE.url}/sell/offer-check`,
  },
  twitter: {
    title: 'Request an As-Is Cash Offer',
    description: 'Discuss an as-is property sale with Dominion Homes, whether you are ready now or still considering your options.',
  },
  alternates: { canonical: `${SITE.url}/sell/offer-check` },
  robots: { index: false, follow: false },
}

export default async function OfferCheckPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const variant = resolveMetaSellerVariant(await searchParams)
  const copy = META_SELLER_LANDINGS[variant]
  return (
    <main id="main-content" className="relative overflow-hidden py-7 sm:py-16">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-stone-50 via-forest-50/25 to-stone-50" />
      <div className="relative mx-auto grid max-w-6xl gap-7 px-5 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:px-8">
        <section className="pt-2 lg:sticky lg:top-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-forest-500">Dominion Homes</p>
          <h1 className="mt-4 font-display text-[2rem] leading-tight text-ink-700 sm:text-5xl">
            {copy.headline}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-400 sm:text-lg">
            {copy.intro}
          </p>
          <MetaSellerFormJump variant={variant} />
          <div className="mt-7 hidden space-y-4 text-sm leading-relaxed text-ink-500 lg:block">
            <p><strong className="text-ink-600">First, tell us about the house.</strong><br />A team member will contact you to discuss the property, your timing and what you want from the sale.</p>
            <p><strong className="text-ink-600">Then, compare the next steps.</strong><br />Consider a direct as-is sale alongside listing the house as-is or after repairs. A conversation does not commit you to selling.</p>
          </div>
          <details className="mt-4 hidden rounded-2xl border border-stone-200 bg-white/70 p-4 lg:block">
            <summary className="cursor-pointer text-sm font-semibold text-forest-600">What to know about a direct as-is offer</summary>
            <p className="mt-3 text-sm leading-relaxed text-ink-500">If you choose to discuss a direct as-is investor offer, the price reflects repairs, buying and selling costs, time, risk and profit. Compare what you could keep and how long each path could take.</p>
            <p className="mt-3 text-sm leading-relaxed text-ink-500">Listing with an agent may be a better fit. Dominion is a home-buying and wholesale business, not a real estate brokerage. We may purchase directly or assign a purchase agreement to another buyer.</p>
          </details>
          <details className="mt-4 hidden rounded-2xl border border-stone-200 bg-white/70 p-4 lg:block">
            <summary className="cursor-pointer text-sm font-semibold text-forest-600">Where and what we buy</summary>
          <ul className="mt-3 space-y-3 text-sm text-ink-400">
            <li>Spokane County, Washington</li>
            <li>Kootenai County, Idaho</li>
            <li>Site-built houses and manufactured homes with owned land</li>
            <li>Not ready yet? Start a conversation and discuss your timing.</li>
          </ul>
          </details>
          <p className="mt-6 text-sm text-ink-400">
            Prefer to speak directly? Call{' '}
            <a href={`tel:${SITE.phone.replace(/\D/g, '')}`} className="font-semibold text-forest-600 underline">{SITE.phone}</a>.
          </p>
        </section>
        <MetaSellerQualifier variant={variant} />
      </div>
    </main>
  )
}
