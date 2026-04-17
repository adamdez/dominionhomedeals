import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NEIGHBORHOODS, getNeighborhood, getAllSlugs } from "@/lib/neighborhoods";

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = getNeighborhood(slug);

  if (!data) {
    return {};
  }

  return {
    title: `Sell Your ${data.name} Home Fast - Direct Buyer in ${data.state}`,
    description: `Local Spokane team that buys ${data.name} homes directly. No agents, no commissions, no repairs. Close on your schedule. Call 509-822-5460.`,
    alternates: { canonical: `https://dominionhomedeals.com/neighborhoods/${slug}` },
    openGraph: {
      title: `Sell Your ${data.name} Home for Cash`,
      description: `We buy houses in ${data.name} in any condition. Fair cash offer, close in as fast as 2 weeks. ${data.county}.`,
      url: `https://dominionhomedeals.com/neighborhoods/${slug}`,
      type: "website",
    },
  };
}

export default async function NeighborhoodPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = getNeighborhood(slug);

  if (!data) {
    notFound();
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: "Dominion Homes, LLC",
            description: `Cash home buyers in ${data.name}, ${data.county}, ${data.state}. We buy houses in any condition.`,
            telephone: "+1-509-822-5460",
            url: `https://dominionhomedeals.com/neighborhoods/${slug}`,
            address: {
              "@type": "PostalAddress",
              addressLocality: "Spokane",
              addressRegion: "WA",
              addressCountry: "US",
            },
            areaServed: {
              "@type": "City",
              name: data.name,
              containedInPlace: {
                "@type": "State",
                name: data.state === "WA" ? "Washington" : "Idaho",
              },
            },
            makesOffer: {
              "@type": "Offer",
              name: `Cash offer for houses in ${data.name}`,
              description: `Fair cash offer for your ${data.name} home. No agents, no commissions, no repairs.`,
            },
          }),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: "https://dominionhomedeals.com",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Areas We Serve",
                item: "https://dominionhomedeals.com/neighborhoods",
              },
              {
                "@type": "ListItem",
                position: 3,
                name: data.name,
                item: `https://dominionhomedeals.com/neighborhoods/${slug}`,
              },
            ],
          }),
        }}
      />

      <section className="relative bg-cream-50 pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="mx-auto max-w-4xl px-5 text-center">
          <Link
            href="/neighborhoods"
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-forest-600 transition hover:text-forest-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            All Areas We Serve
          </Link>
          <h1 className="font-display text-display text-ink-700 text-balance">
            Sell Your <span className="text-forest-600">{data.name}</span> Home Directly
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-ink-400">
            {data.tagline}. Local Spokane-based team, close on your schedule, no agents, no commissions.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
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

      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-5">
          <div className="grid gap-12 md:grid-cols-5 md:gap-16">
            <div className="md:col-span-3">
              <p className="text-sm font-semibold uppercase tracking-wider text-forest-600">
                {data.county}, {data.state}
              </p>
              <h2 className="mt-2 font-display text-2xl text-ink-700 md:text-3xl">
                Selling Your {data.name} Home Does Not Have to Be Hard
              </h2>
              <p className="mt-5 leading-relaxed text-ink-400">{data.description}</p>

              <h3 className="mt-8 font-display text-lg text-ink-600">
                What Makes {data.name} Unique
              </h3>
              <ul className="mt-4 space-y-3">
                {data.highlights.map((highlight) => (
                  <li key={highlight} className="flex items-start gap-3 text-ink-500">
                    <svg
                      className="mt-0.5 h-5 w-5 shrink-0 text-forest-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-2">
              <div className="rounded-2xl border border-sage-100 bg-cream-50 p-6">
                <h3 className="font-display text-lg text-ink-700">{data.name} at a Glance</h3>
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-ink-300">County</p>
                    <p className="mt-1 font-medium text-ink-600">{data.county}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-ink-300">State</p>
                    <p className="mt-1 font-medium text-ink-600">
                      {data.state === "WA" ? "Washington" : "Idaho"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-ink-300">ZIP Codes</p>
                    <p className="mt-1 font-medium text-ink-600">{data.zipCodes.join(", ")}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-ink-300">Our Offer</p>
                    <p className="mt-1 font-medium text-forest-600">Cash | Fast response | Close in 14 days</p>
                  </div>
                </div>

                <Link
                  href="/#get-offer"
                  className="mt-6 flex w-full items-center justify-center rounded-xl bg-forest-600 px-6 py-3.5 font-semibold text-white transition hover:bg-forest-700"
                >
                  Get My Cash Offer for {data.name}
                </Link>
                <p className="mt-2 text-center text-xs text-ink-300">No obligation | 60 seconds</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-forest-700 py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-5">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-forest-300">
              Common Situations in {data.name}
            </p>
            <h2 className="mt-2 font-display text-display text-white text-balance">
              Situations We See Often in {data.name}
            </h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {data.situations.map((situation) => (
              <div key={situation} className="rounded-xl border border-forest-600 bg-forest-600/50 p-5">
                <p className="text-white">{situation}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/#get-offer"
              className="inline-flex items-center rounded-xl bg-white px-8 py-4 text-lg font-semibold text-forest-700 shadow-lg transition hover:bg-cream-50 hover:shadow-xl"
            >
              Get Your No-Obligation Offer
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-cream-50 py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-5">
          <h2 className="text-center font-display text-2xl text-ink-700">Nearby Areas We Serve</h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {data.nearbyAreas.map((nearbySlug) => {
              const nearby = NEIGHBORHOODS[nearbySlug];
              if (!nearby) {
                return null;
              }

              return (
                <Link
                  key={nearbySlug}
                  href={`/neighborhoods/${nearbySlug}`}
                  className="rounded-full border border-sage-200 bg-white px-5 py-2.5 text-sm font-medium text-ink-600 transition hover:border-forest-300 hover:bg-forest-50 hover:text-forest-700"
                >
                  {nearby.name}, {nearby.state}
                </Link>
              );
            })}
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/neighborhoods"
              className="text-sm font-medium text-forest-600 transition hover:text-forest-700"
            >
              View all areas we serve {"->"}
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="font-display text-display text-ink-700 text-balance">
            Ready to Get a Cash Offer on Your {data.name}&nbsp;Home?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-ink-400">
            No pressure. No obligation. Fill out the form or call us - Logan or someone on his team will get back to
            you personally.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/#get-offer"
              className="inline-flex items-center rounded-xl bg-forest-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-forest-700 hover:shadow-xl"
            >
              Get My Cash Offer
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
    </>
  );
}
