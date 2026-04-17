import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/lib/constants";
import torrensTrail472Photos from "@/data/torrens-trail-472-photos.json";
import { InterestForm } from "./InterestForm";

export const metadata: Metadata = {
  title: "472 Torrens Trail, Spirit Lake ID 83869 - 5 Acres, 2 Bed/2 Bath, $460K",
  description:
    "Move-in ready 2-bedroom, 2-bath home on 5 private acres in Spirit Lake, ID. Built 2016, 1,952 sq ft, asking $460K. Some finishing work needed. Direct from Dominion Homes.",
  openGraph: {
    title: "472 Torrens Trail - Spirit Lake, ID | 5 Acres | $460K",
    description:
      "Move-in ready 2bd/2ba on 5 acres built 2016. 1,952 sq ft. Asking $460K with some finishing work needed.",
    url: `${SITE.url}/deals/torrens-trail-472`,
    images: [
      {
        url: torrensTrail472Photos[0]?.src ?? "/images/torrens-trail/exterior-front.svg",
        width: 1200,
        height: 800,
      },
    ],
  },
  alternates: { canonical: `${SITE.url}/deals/torrens-trail-472` },
};

const PHOTOS = torrensTrail472Photos.map((photo, index) => ({
  ...photo,
  span: index === 0 ? ("col-span-2 row-span-2" as const) : ("col-span-1 row-span-1" as const),
}));

function JsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: "472 Torrens Trail, Spirit Lake ID 83869",
    description:
      "Move-in ready 2-bedroom, 2-bathroom home on 5 private acres in Spirit Lake, Idaho. Built 2016, 1,952 sq ft. Asking $460,000.",
    url: `${SITE.url}/deals/torrens-trail-472`,
    image: `${SITE.url}${torrensTrail472Photos[0]?.src ?? "/images/torrens-trail/exterior-front.svg"}`,
    offers: {
      "@type": "Offer",
      price: "460000",
      priceCurrency: "USD",
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: "472 Torrens Trail",
      addressLocality: "Spirit Lake",
      addressRegion: "ID",
      postalCode: "83869",
      addressCountry: "US",
    },
    seller: {
      "@type": "Organization",
      name: SITE.legalName,
      telephone: SITE.phone,
      url: SITE.url,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

function SpecCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-stone-200 bg-white px-4 py-5 text-center shadow-soft">
      <span className="text-2xl">{icon}</span>
      <span className="text-xs font-semibold uppercase tracking-widest text-ink-400">{label}</span>
      <span className="font-display text-lg font-semibold leading-tight text-ink-600">{value}</span>
    </div>
  );
}

export default function TorrensTrailPage() {
  return (
    <>
      <JsonLd />

      <section className="bg-forest-800 pt-10 pb-12">
        <div className="section-wrap !pt-10 !pb-8">
          <nav className="mb-6 flex items-center gap-2 text-xs text-forest-300">
            <Link href="/" className="transition-colors hover:text-white">
              Home
            </Link>
            <span>/</span>
            <Link href="/deals" className="transition-colors hover:text-white">
              Deals
            </Link>
            <span>/</span>
            <span className="text-forest-100">472 Torrens Trail</span>
          </nav>

          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-300">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse-soft" />
                Active Listing
              </span>

              <h1 className="mb-2 font-display text-display text-white">472 Torrens Trail</h1>
              <p className="font-body text-lg text-forest-200">Spirit Lake, ID 83869</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {["5 Acres", "Move-In Ready", "Some Finishing Needed", "2016 Build", "Kootenai County"].map(
                  (tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-forest-600 bg-forest-700 px-3 py-1 text-xs text-forest-200"
                    >
                      {tag}
                    </span>
                  ),
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/10 px-7 py-5 text-center backdrop-blur-sm">
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-forest-300">Asking Price</p>
              <p className="font-display text-4xl font-semibold text-white">$460,000</p>
              <p className="mt-1 text-xs text-forest-300">Direct from wholesaler</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-stone-100 py-10">
        <div className="section-wrap !pt-0 !pb-0">
          <div className="grid grid-cols-2 gap-2 overflow-hidden rounded-2xl sm:grid-cols-3 md:grid-cols-4">
            <div className="relative col-span-2 min-h-[240px] aspect-[4/3] sm:col-span-2 md:col-span-2 md:row-span-2 md:h-full md:aspect-auto">
              <Image
                src={PHOTOS[0].src}
                alt={PHOTOS[0].alt}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>

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
            {PHOTOS.length} photos | 472 Torrens Trail, Spirit Lake ID
          </p>
        </div>
      </section>

      <section className="bg-stone-50">
        <div className="section-wrap">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3 lg:gap-14">
            <div className="space-y-10 lg:col-span-2">
              <div>
                <h2 className="mb-6 font-display text-heading text-ink-600">Property Details</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <SpecCard icon="Beds" label="Bedrooms" value="2 Bed" />
                  <SpecCard icon="Bath" label="Bathrooms" value="2 Bath" />
                  <SpecCard icon="Sqft" label="Square Ft" value="1,952 sq ft" />
                  <SpecCard icon="Land" label="Lot Size" value="5 Acres" />
                  <SpecCard icon="Year" label="Year Built" value="2016" />
                  <SpecCard icon="Area" label="County" value="Kootenai Co." />
                </div>
              </div>

              <hr className="border-stone-200" />

              <div>
                <h2 className="mb-4 font-display text-heading text-ink-600">About This Property</h2>
                <div className="space-y-4 font-body leading-relaxed text-ink-500">
                  <p>
                    Set on 5 private acres in Spirit Lake, Idaho, this 2016-built home offers nearly 2,000 square feet
                    of thoughtfully designed living space with the quiet and privacy of rural North Idaho just minutes
                    from town.
                  </p>
                  <p>
                    The home is move-in ready with some finishing work still needed, giving a buyer the opportunity to
                    add their personal touch at a price that reflects it. The bones are solid, the build is recent, and
                    the land is exceptional.
                  </p>
                  <p>
                    Two bedrooms and two full baths on a usable five-acre parcel makes this an ideal setup for a
                    primary residence, vacation property, or investment hold in a growing North Idaho market.
                  </p>
                </div>
              </div>

              <hr className="border-stone-200" />

              <div>
                <h2 className="mb-5 font-display text-heading text-ink-600">Highlights</h2>
                <ul className="space-y-3">
                  {[
                    "Move-in ready with some interior finishing work remaining",
                    "2016 construction with modern systems",
                    "Full 5 acres with privacy, trees, and usable land",
                    "Spirit Lake, ID in the growing Kootenai County corridor",
                    "Priced to move at $460K direct from wholesaler",
                    "Fast close available on your timeline",
                  ].map((text) => (
                    <li key={text} className="flex items-start gap-3 text-sm font-body text-ink-500">
                      <span className="mt-0.5 shrink-0 text-base">+</span>
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <hr className="border-stone-200" />

              <div>
                <h2 className="mb-5 font-display text-heading text-ink-600">Property Facts</h2>
                <div className="overflow-hidden rounded-2xl border border-stone-200">
                  <table className="w-full text-sm font-body">
                    <tbody>
                      {[
                        ["Address", "472 Torrens Trail"],
                        ["City", "Spirit Lake"],
                        ["State", "Idaho"],
                        ["ZIP Code", "83869"],
                        ["County", "Kootenai County"],
                        ["Bedrooms", "2"],
                        ["Bathrooms", "2 Full"],
                        ["Sq Footage", "1,952 sq ft"],
                        ["Lot Size", "5 Acres"],
                        ["Year Built", "2016"],
                        ["Condition", "Move-in ready, some finishing needed"],
                        ["Asking Price", "$460,000"],
                        ["Property Type", "Single Family Residential"],
                      ].map(([label, value], index) => (
                        <tr key={label} className={index % 2 === 0 ? "bg-stone-50" : "bg-white"}>
                          <td className="w-2/5 px-5 py-3 font-semibold text-ink-500">{label}</td>
                          <td className="px-5 py-3 text-ink-600">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-elevated">
                  <div className="bg-forest-600 px-6 py-5">
                    <h2 className="font-display text-lg font-semibold text-white">Interested in This Property?</h2>
                    <p className="mt-1 text-xs leading-relaxed text-forest-200">
                      We&apos;ll reach out within a few hours to answer questions or schedule a showing.
                    </p>
                  </div>

                  <div className="px-6 py-6">
                    <InterestForm />
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-center">
                  <p className="mb-1 text-xs font-semibold text-amber-700">Prefer to talk first?</p>
                  <a
                    href="tel:509-822-5460"
                    className="font-display text-lg font-semibold text-forest-700 transition-colors hover:text-forest-500"
                  >
                    509-822-5460
                  </a>
                  <p className="mt-0.5 text-[11px] text-ink-300">
                    Call or text - Logan or someone on his team answers
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-forest-800">
        <div className="section-wrap">
          <div className="max-w-2xl">
            <h2 className="mb-4 font-display text-display text-white">Spirit Lake, Idaho</h2>
            <p className="mb-6 font-body leading-relaxed text-forest-200">
              Spirit Lake sits in the heart of Kootenai County, about 35 miles north of Coeur d&apos;Alene and less
              than an hour from Spokane. The area is growing fast, with strong demand for acreage properties from
              buyers seeking space without sacrificing access to services.
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "To Coeur d'Alene", value: "~35 mi" },
                { label: "To Spokane", value: "~55 mi" },
                { label: "County", value: "Kootenai" },
                { label: "State", value: "Idaho" },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="rounded-xl border border-forest-600 bg-forest-700/60 px-4 py-4 text-center"
                >
                  <p className="font-display text-lg font-semibold text-white">{value}</p>
                  <p className="mt-0.5 text-xs text-forest-300">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-stone-100">
        <div className="section-wrap text-center">
          <span className="trust-badge mb-5">Direct from Dominion Homes</span>
          <h2 className="mb-4 font-display text-display text-ink-600">Ready to move on 472 Torrens Trail?</h2>
          <p className="mx-auto mb-8 max-w-xl font-body leading-relaxed text-ink-400">
            We&apos;re a local North Idaho team. No middlemen, no MLS fees, no delays. Fill out the form above or call
            us directly - we respond fast.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a href="tel:509-822-5460" className="btn-primary px-8 py-4 text-base">
              Call 509-822-5460
            </a>
            <a href="sms:509-822-5460" className="btn-secondary px-8 py-4 text-base">
              Send a Text
            </a>
          </div>
        </div>
      </section>

      <div className="border-t border-stone-300 bg-stone-200">
        <div className="section-wrap !pt-5 !pb-5">
          <p className="text-center text-xs leading-relaxed text-ink-400">
            Dominion Homes is a licensed wholesaler. This is not a retail listing.
            <br className="hidden sm:block" />
            Property details are provided for informational purposes. Buyer is encouraged to conduct independent due
            diligence. Contact us at{" "}
            <a
              href={`mailto:${SITE.email}`}
              className="underline underline-offset-2 transition-colors hover:text-ink-600"
            >
              {SITE.email}
            </a>{" "}
            with questions.
          </p>
        </div>
      </div>
    </>
  );
}
