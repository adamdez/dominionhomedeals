import type { Metadata } from "next";
import Link from "next/link";
import { CashOfferMathSection, VerifyCashBuyerSection } from "@/components/sell/TrustAndOfferSections";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "How We Calculate Cash Offers in Spokane & CDA",
  description:
    "See how Dominion Homes thinks through ARV, repairs, holding costs, closing costs, and when a cash offer may or may not be better than listing.",
  alternates: { canonical: `${SITE.url}/how-we-calculate-cash-offers-spokane-cda` },
  openGraph: {
    title: "How We Calculate Cash Offers in Spokane & CDA",
    description:
      "A plain-English guide to cash offer math for Spokane and Coeur d'Alene area sellers.",
    url: `${SITE.url}/how-we-calculate-cash-offers-spokane-cda`,
    type: "website",
  },
};

const comparisonRows = [
  ["Highest possible price", "Often listing after repairs", "Usually better for market-ready homes with time"],
  ["Fewest repairs", "Direct cash sale", "Useful when the house needs work or cleanup"],
  ["Most certainty", "Direct cash sale", "Fewer financing, showing, and inspection variables"],
  ["Most time to decide", "Depends", "A good buyer should give you room to compare options"],
] as const;

export default function CashOfferGuidePage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: SITE.url },
          { name: "How We Calculate Cash Offers", url: `${SITE.url}/how-we-calculate-cash-offers-spokane-cda` },
        ]}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": `${SITE.url}/how-we-calculate-cash-offers-spokane-cda#webpage`,
            name: "How We Calculate Cash Offers in Spokane & CDA",
            url: `${SITE.url}/how-we-calculate-cash-offers-spokane-cda`,
            about: { "@id": `${SITE.url}/#business` },
            publisher: { "@id": `${SITE.url}/#business` },
          }),
        }}
      />

      <section className="relative overflow-hidden pt-28 pb-14 sm:pt-36 sm:pb-20 lg:pt-40 lg:pb-24">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-stone-50 via-amber-50/40 to-stone-50" />
        <div className="relative mx-auto max-w-4xl px-5 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-forest-500">Cash Offer Math</p>
          <h1 className="mt-3 font-display text-hero text-ink-700 text-balance">
            How We Calculate Cash Offers in Spokane &amp; CDA
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-ink-400">
            A direct cash offer is a tradeoff. You may give up some retail upside, but you can avoid repairs, showings,
            commissions, financing risk, and months of uncertainty.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/#get-offer" className="btn-primary">
              Ask For My Offer
            </Link>
            <Link href="/sell-my-house-fast-spokane" className="btn-secondary">
              Fast sale guide
            </Link>
          </div>
        </div>
      </section>

      <CashOfferMathSection />

      <section className="section-wrap">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-widest text-forest-500">The Tradeoff</p>
          <h2 className="mt-2 font-display text-display text-ink-600 text-balance">
            Cash Is Not Always The Highest Number
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-400">
            If the house is updated, clean, vacant, and you have time, listing can make more sense. If the house needs
            repairs, has belongings inside, has tenants, or needs a predictable timeline, a direct offer may be worth
            comparing.
          </p>

          <div className="mt-8 overflow-x-auto rounded-xl border border-stone-200 bg-white">
            <div className="min-w-[640px]">
              <div className="grid grid-cols-3 bg-stone-100 px-4 py-3 text-xs font-bold uppercase tracking-widest text-ink-400">
                <span>Seller Goal</span>
                <span>Likely Path</span>
                <span>Why</span>
              </div>
              {comparisonRows.map(([goal, path, why]) => (
                <div key={goal} className="grid grid-cols-3 gap-4 border-t border-stone-200 px-4 py-4 text-sm text-ink-500">
                  <span className="font-semibold text-ink-600">{goal}</span>
                  <span>{path}</span>
                  <span>{why}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <VerifyCashBuyerSection />
    </>
  );
}
