import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us - Meet the Team | Spokane, WA",
  description:
    "Meet Logan and the local Dominion Homes team serving Spokane County and Kootenai County. Based in Spokane, WA.",
  alternates: { canonical: "https://dominionhomedeals.com/about" },
  openGraph: {
    title: "About Us — Meet the Team | Dominion Homes",
    description:
      "Based in Spokane, WA. We buy houses for cash across Spokane County, WA and Kootenai County, ID. No agents, no games - just a local team.",
    url: "https://dominionhomedeals.com/about",
    type: "website",
  },
};

const team = [
  {
    name: "Logan",
    role: "Founder & Owner",
    image: "/images/team/logan.jpg",
    bio: "Logan leads Dominion Homes from Spokane. He works directly with sellers, keeps the process clear, and makes sure people know what to expect from the first call through closing day.",
  },
] as const;

const values = [
  {
    title: "Local First",
    text: "We live here. We work here. Our base is in Spokane. When we say we will meet you at your kitchen table, we mean it.",
  },
  {
    title: "Fair and Transparent",
    text: "We explain how we arrived at our number. No hidden fees, no last-minute games, and no pressure to rush into a decision.",
  },
  {
    title: "Zero Pressure",
    text: "If a direct sale is not the best option, we will say so. We would rather give a straight answer than force a bad fit.",
  },
  {
    title: "Principals, Not Agents",
    text: "We buy properties directly. You deal with the actual buyers from start to finish, not a middleman or national call center.",
  },
] as const;

const sellerTrustMarkers = [
  {
    title: "We explain the process in plain English",
    text: "Sellers usually want to know what happens first, who handles closing, and whether the date is actually real. We slow it down and walk through it clearly.",
  },
  {
    title: "You do not need to clean the house out first",
    text: "Many of the homes we see still have furniture, leftover belongings, deferred maintenance, or years of life packed into them. That does not scare us off.",
  },
  {
    title: "We will tell you if listing makes more sense",
    text: "Not every property should be sold this way. If the better move is to clean it up and list it, we would rather say that than pretend otherwise.",
  },
] as const;

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: "Dominion Homes, LLC",
            description:
              "Local cash home buyers serving Spokane County, WA and Kootenai County, ID. We buy houses in any condition - no agents, no commissions, no repairs.",
            url: "https://dominionhomedeals.com",
            telephone: "+1-509-822-5460",
            address: {
              "@type": "PostalAddress",
              addressLocality: "Spokane",
              addressRegion: "WA",
              addressCountry: "US",
            },
            areaServed: [
              { "@type": "County", name: "Spokane County", containedInPlace: { "@type": "State", name: "Washington" } },
              { "@type": "County", name: "Kootenai County", containedInPlace: { "@type": "State", name: "Idaho" } },
            ],
            founder: { "@type": "Person", name: "Logan Anyan", jobTitle: "Founder & Owner" },
          }),
        }}
      />

      <section className="relative bg-cream-50 pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="mx-auto max-w-4xl px-5 text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-forest-600">About Us</p>
          <h1 className="font-display text-display text-ink-700 text-balance">
            We are not a call center.
            <br className="hidden sm:block" />
            We are your neighbors.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-ink-400">
            Dominion Homes is a small local team based in Spokane, Washington. We buy houses directly across
            Spokane County and Kootenai County, and we keep the process direct, local, and easy to follow.
          </p>
        </div>
      </section>

      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-5">
          <div className="grid gap-12 md:grid-cols-2 md:items-center md:gap-16">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-forest-600">Our Story</p>
              <h2 className="mt-2 font-display text-3xl text-ink-700 md:text-4xl">Built on handshakes, not scripts</h2>
              <div className="mt-6 space-y-4 text-ink-400 leading-relaxed">
                <p>
                  A lot of sellers talk to companies that feel remote from the first call. The person on the phone is in
                  another state, the follow-up feels scripted, and nobody seems accountable when questions come up.
                </p>
                <p>
                  Dominion Homes was built to be the opposite of that. We are based in Spokane, we know these
                  neighborhoods, and when we say we will show up, it is us showing up.
                </p>
                <p>
                  Our goal is simple: give homeowners a fair, honest cash option so they can move forward on their own
                  timeline. Sometimes that means two weeks. Sometimes it means a slower decision with room to breathe.
                </p>
              </div>
            </div>

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
                    <p className="font-medium text-ink-600">Based in Spokane, Washington</p>
                    <p className="mt-1 text-sm text-ink-400">Not a national call center. A real local operation.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest-50">
                    <svg className="h-5 w-5 text-forest-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-ink-600">Founder-led local team</p>
                    <p className="mt-1 text-sm text-ink-400">You work directly with Logan and his team.</p>
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
                    <p className="mt-1 text-sm text-ink-400">A real local closing process with real title support.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest-50">
                    <svg className="h-5 w-5 text-forest-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-ink-600">Call or text 509-822-5460</p>
                    <p className="mt-1 text-sm text-ink-400">A real person answers.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-cream-50 py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-5">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-forest-600">Meet Logan</p>
            <h2 className="mt-2 font-display text-display text-ink-600">The founder behind the offer</h2>
          </div>

          <div className="mx-auto mt-12 grid max-w-sm gap-8">
            {team.map((member) => (
              <div key={member.name} className="rounded-2xl border border-sage-100 bg-white p-8 text-center shadow-sm">
                <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-full ring-4 ring-forest-50">
                  <Image
                    src={member.image}
                    alt={`${member.name} from Dominion Homes`}
                    fill
                    sizes="96px"
                    className="object-cover"
                    quality={74}
                  />
                </div>
                <h3 className="mt-5 font-display text-xl text-ink-700">{member.name}</h3>
                <p className="text-sm font-medium text-forest-600">{member.role}</p>
                <p className="mt-4 text-sm leading-relaxed text-ink-400">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-5">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-forest-600">What We Stand For</p>
            <h2 className="mt-2 font-display text-display text-ink-600">How we do business</h2>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2">
            {values.map((value) => (
              <div key={value.title} className="rounded-2xl border border-sage-100 bg-cream-50/50 p-7">
                <h3 className="font-display text-lg text-ink-700">{value.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-400">{value.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-sage-100 bg-stone-100/50 py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-5">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-forest-600">What Sellers Usually Notice</p>
            <h2 className="mt-2 font-display text-display text-ink-600">The small things matter</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-ink-400">
              In this kind of sale, trust usually comes from a handful of simple things: clear communication, realistic
              expectations, and not making a hard situation feel heavier than it already does.
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {sellerTrustMarkers.map((marker) => (
              <div key={marker.title} className="rounded-2xl border border-sage-100 bg-white p-6 shadow-sm">
                <h3 className="font-display text-2xl leading-tight text-ink-700">{marker.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-400">{marker.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-sage-100 bg-cream-50 py-12">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <p className="text-xs leading-relaxed text-ink-300">
            Dominion Homes, LLC is a real estate investment company. We are principals, not licensed real estate agents
            or brokers. We buy properties directly. We are not affiliated with any government agency. This is not a
            solicitation for listings. Serving Spokane County, WA and Kootenai County, ID.
          </p>
        </div>
      </section>

      <section className="bg-forest-700 py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="font-display text-display text-white text-balance">Let&apos;s talk about your property</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-forest-200">
            Reach out anytime. One of us will get back to you directly.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/#get-offer"
              className="inline-flex items-center rounded-xl bg-white px-8 py-4 text-lg font-semibold text-forest-700 shadow-lg transition hover:bg-cream-50 hover:shadow-xl"
            >
              Get My Cash Offer
            </Link>
            <Link
              href="/stories"
              className="inline-flex items-center gap-2 text-lg font-medium text-white/90 transition hover:text-white"
            >
              Read seller stories
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
  );
}
